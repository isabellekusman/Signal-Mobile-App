
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../services/database';
import { useAuth } from './AuthContext';

export interface Signal {
    type: 'RED' | 'GREEN' | 'YELLOW';
    text: string;
}

export interface SavedLog {
    id: string;
    date: string;
    source: 'clarity' | 'decoder' | 'stars';
    title: string;
    summary: string;
    fullContent: string;
}

export interface Connection {
    id: string;
    name: string;
    tag: string;
    zodiac: string;
    lastActive: string;
    icon: string;
    status: 'active' | 'archived';
    signals: Signal[];
    dailyLogs?: DailyLog[];
    savedLogs?: SavedLog[];
    onboardingCompleted?: boolean;
    onboardingContext?: Record<string, string> & {
        skipped?: boolean;
    };
    cachedAdvice?: {
        date: string;
        stateOfConnection: string;
        todaysMove: string;
        watchFor: string;
    };
}

export interface DailyLog {
    id: string;
    date: string;
    energyExchange: 'I carried it' | 'It felt balanced' | 'He carried it' | 'Other';
    custom_energy_note?: string;
    direction: 'Closer' | 'The same' | 'Further away' | 'Other';
    custom_direction_note?: string;
    clarity: number;
    effortSignals: string[];
    custom_effort_note?: string;
    structured_emotion_state: 'Grounded' | 'Warm' | 'Neutral' | 'Uncertain' | 'Preoccupied' | 'Draining' | 'Other';
    custom_emotion_note?: string;
    notable?: string;
}

export interface UserProfile {
    name: string;
    zodiac: string;
    about: string;
    standards: string[];
    boundaries: string[];
    attachmentStyle: string[];
    dealbreakers: string[];
    loveLanguage: string;
}

const DEFAULT_PROFILE: UserProfile = {
    name: '',
    zodiac: '',
    about: '',
    standards: [],
    boundaries: [],
    attachmentStyle: [],
    dealbreakers: [],
    loveLanguage: '',
};

const INITIAL_CONNECTIONS: Connection[] = [];

interface ConnectionsContextType {
    connections: Connection[];
    addConnection: (connection: Connection) => void;
    updateConnection: (id: string, updates: Partial<Connection>) => void;
    deleteConnection: (id: string) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    // User profile & onboarding
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
    hasCompletedOnboarding: boolean | null; // null = loading
    completeOnboarding: (profile?: UserProfile) => void;
    // Subscriptions
    subscriptionTier: 'free' | 'seeker' | 'signal';
    trialExpiresAt: string | null;
    isTrialActive: boolean;
    paywallMode: 'voluntary' | 'forced' | null;
    setShowPaywall: (mode: 'voluntary' | 'forced' | null) => void;
    hasSeenSubWelcome: boolean;
    hasSeenTrialExpiry: boolean;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

const ONBOARDING_KEY_PREFIX = '@signal_onboarding_complete_';
const PROFILE_KEY_PREFIX = '@signal_user_profile_';
const CONNECTIONS_KEY_PREFIX = '@signal_connections_';

// ─── Helpers: convert between local and DB shapes ────────────

function localToDBConnection(conn: Connection) {
    return {
        name: conn.name,
        tag: conn.tag,
        zodiac: conn.zodiac || '',
        icon: conn.icon || '',
        status: conn.status || 'active' as const,
        signals: conn.signals || [],
        daily_logs: conn.dailyLogs || [],
        saved_logs: conn.savedLogs || [],
        onboarding_context: conn.onboardingContext || {},
    };
}

function dbToLocalConnection(dbConn: any): Connection {
    return {
        id: dbConn.id,
        name: dbConn.name,
        tag: dbConn.tag || 'SITUATIONSHIP',
        zodiac: dbConn.zodiac || '',
        lastActive: dbConn.updated_at || dbConn.created_at || new Date().toISOString(),
        icon: dbConn.icon || '',
        status: dbConn.status || 'active',
        signals: dbConn.signals || [],
        dailyLogs: dbConn.daily_logs || [],
        savedLogs: dbConn.saved_logs || [],
        onboardingCompleted: true,
        onboardingContext: dbConn.onboarding_context || {},
    };
}

function profileToDBProfile(profile: UserProfile) {
    return {
        name: profile.name,
        zodiac: profile.zodiac,
        about: profile.about,
        standards: profile.standards,
        boundaries: profile.boundaries,
        attachment_style: profile.attachmentStyle,
        dealbreakers: profile.dealbreakers,
        love_language: profile.loveLanguage,
    };
}

function dbProfileToLocal(dbProfile: any): UserProfile {
    return {
        name: dbProfile.name || '',
        zodiac: dbProfile.zodiac || '',
        about: dbProfile.about || '',
        standards: dbProfile.standards || [],
        boundaries: dbProfile.boundaries || [],
        attachmentStyle: dbProfile.attachment_style || [],
        dealbreakers: dbProfile.dealbreakers || [],
        loveLanguage: dbProfile.love_language || '',
    };
}

// ═══════════════════════════════════════════════════════════════
//  PROVIDER
// ═══════════════════════════════════════════════════════════════

export function ConnectionsProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [userProfile, setUserProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Subscription state
    const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'seeker' | 'signal'>('free');
    const [trialExpiresAt, setTrialExpiresAt] = useState<string | null>(null);
    const [paywallMode, setPaywallMode] = useState<'voluntary' | 'forced' | null>(null);
    const [hasSeenSubWelcome, setHasSeenSubWelcome] = useState(false);
    const [hasSeenTrialExpiry, setHasSeenTrialExpiry] = useState(false);

    const currentUserId = user?.id ?? null;

    const isTrialActive = trialExpiresAt
        ? new Date(trialExpiresAt) > new Date()
        : !hasSeenTrialExpiry; // If null, we assume active until they've seen the expiry screen once

    // Get user-specific storage keys
    const getKeys = (uid: string | null) => ({
        onboarding: uid ? `${ONBOARDING_KEY_PREFIX}${uid}` : null,
        profile: uid ? `${PROFILE_KEY_PREFIX}${uid}` : null,
        connections: uid ? `${CONNECTIONS_KEY_PREFIX}${uid}` : null,
    });

    // ─── Load data: Supabase first, fallback to AsyncStorage ───
    useEffect(() => {
        if (authLoading) return;

        if (!currentUserId) {
            setHasCompletedOnboarding(false);
            setIsLoaded(true);
            return;
        }

        const keys = getKeys(currentUserId);

        (async () => {
            try {
                // 1. Try loading from Supabase first (cloud = source of truth)
                const [cloudProfile, cloudConnections] = await Promise.all([
                    db.getProfile(),
                    db.getConnections(),
                ]);

                let loadedFromCloud = false;

                // If cloud has profile data (name is filled), use cloud data
                if (cloudProfile && cloudProfile.name) {
                    setUserProfileState(dbProfileToLocal(cloudProfile));
                    setHasCompletedOnboarding(true);

                    // Update subscription state from cloud
                    if (cloudProfile.subscription_tier) setSubscriptionTier(cloudProfile.subscription_tier as any);
                    if (cloudProfile.trial_expires_at) setTrialExpiresAt(cloudProfile.trial_expires_at);
                    setHasSeenSubWelcome(!!cloudProfile.has_seen_sub_welcome);
                    setHasSeenTrialExpiry(!!cloudProfile.has_seen_trial_expiry);

                    loadedFromCloud = true;

                    // Also cache to AsyncStorage for offline
                    if (keys.profile) {
                        AsyncStorage.setItem(keys.profile, JSON.stringify(dbProfileToLocal(cloudProfile))).catch(() => { });
                    }
                    if (keys.onboarding) {
                        AsyncStorage.setItem(keys.onboarding, 'true').catch(() => { });
                    }
                }

                if (cloudConnections && cloudConnections.length > 0) {
                    const localConns = cloudConnections.map(dbToLocalConnection);
                    setConnections(localConns);
                    loadedFromCloud = true;

                    // Cache to AsyncStorage for offline
                    if (keys.connections) {
                        AsyncStorage.setItem(keys.connections, JSON.stringify(localConns)).catch(() => { });
                    }
                }

                // 2. If cloud had nothing, fall back to AsyncStorage
                if (!loadedFromCloud) {
                    const [onboardingDone, savedProfile, savedConnections] = await Promise.all([
                        AsyncStorage.getItem(keys.onboarding!),
                        AsyncStorage.getItem(keys.profile!),
                        AsyncStorage.getItem(keys.connections!),
                    ]);

                    setHasCompletedOnboarding(onboardingDone === 'true');

                    if (savedProfile) {
                        const parsed = JSON.parse(savedProfile);
                        setUserProfileState(parsed);
                        // Migrate local data to Supabase
                        db.upsertProfile(profileToDBProfile(parsed)).catch(() => { });
                    } else {
                        setUserProfileState(DEFAULT_PROFILE);
                    }

                    if (savedConnections) {
                        const parsed = JSON.parse(savedConnections) as Connection[];
                        setConnections(parsed);
                        // Migrate each local connection to Supabase
                        for (const conn of parsed) {
                            db.addConnection(localToDBConnection(conn)).catch(() => { });
                        }
                    } else {
                        setConnections(INITIAL_CONNECTIONS);
                    }
                }
            } catch (err) {
                console.warn('[ConnectionsContext] Load error, using defaults:', err);
                setHasCompletedOnboarding(false);
            } finally {
                setIsLoaded(true);
            }
        })();
    }, [currentUserId, authLoading]);

    // ─── Persist helpers (AsyncStorage + Supabase) ──────────────

    const persistConnections = (updated: Connection[]) => {
        const keys = getKeys(currentUserId);
        if (keys.connections) {
            AsyncStorage.setItem(keys.connections, JSON.stringify(updated)).catch(() => { });
        }
    };

    const setUserProfile = (profile: UserProfile) => {
        setUserProfileState(profile);
        const keys = getKeys(currentUserId);
        if (keys.profile) {
            AsyncStorage.setItem(keys.profile, JSON.stringify(profile)).catch(() => { });
        }
        // Sync to Supabase
        db.upsertProfile(profileToDBProfile(profile)).catch((err) => {
            console.warn('[ConnectionsContext] Profile sync error:', err);
        });
    };

    const completeOnboarding = (profile?: UserProfile) => {
        setHasCompletedOnboarding(true);
        const keys = getKeys(currentUserId);
        if (keys.onboarding) {
            AsyncStorage.setItem(keys.onboarding, 'true').catch(() => { });
        }
        if (profile) {
            setUserProfile(profile);
        }
    };

    // ─── Connection CRUD (local + cloud) ────────────────────────

    const addConnection = (connection: Connection) => {
        setConnections((prev) => {
            const updated = [connection, ...prev];
            persistConnections(updated);
            return updated;
        });
        // Sync to Supabase
        db.addConnection(localToDBConnection(connection)).catch((err) => {
            console.warn('[ConnectionsContext] Connection add sync error:', err);
        });
    };

    const updateConnection = (id: string, updates: Partial<Connection>) => {
        setConnections((prev) => {
            const updated = prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn));
            persistConnections(updated);
            return updated;
        });
        // Sync updates to Supabase
        const dbUpdates: Record<string, any> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.tag !== undefined) dbUpdates.tag = updates.tag;
        if (updates.zodiac !== undefined) dbUpdates.zodiac = updates.zodiac;
        if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.signals !== undefined) dbUpdates.signals = updates.signals;
        if (updates.dailyLogs !== undefined) dbUpdates.daily_logs = updates.dailyLogs;
        if (updates.savedLogs !== undefined) dbUpdates.saved_logs = updates.savedLogs;
        if (updates.onboardingContext !== undefined) dbUpdates.onboarding_context = updates.onboardingContext;

        if (Object.keys(dbUpdates).length > 0) {
            db.updateConnection(id, dbUpdates).catch((err) => {
                console.warn('[ConnectionsContext] Connection update sync error:', err);
            });
        }
    };

    const deleteConnection = (id: string) => {
        setConnections((prev) => {
            const updated = prev.filter((conn) => conn.id !== id);
            persistConnections(updated);
            return updated;
        });
        // Sync deletion to Supabase
        db.deleteConnection(id).catch((err) => {
            console.warn('[ConnectionsContext] Connection delete sync error:', err);
        });
    };

    return (
        <ConnectionsContext.Provider value={{
            connections, addConnection, updateConnection, deleteConnection,
            theme, setTheme,
            userProfile, setUserProfile,
            hasCompletedOnboarding, completeOnboarding,
            subscriptionTier, trialExpiresAt, isTrialActive,
            setShowPaywall: setPaywallMode,
            paywallMode,
            hasSeenSubWelcome,
            hasSeenTrialExpiry,
        }}>
            {children}
        </ConnectionsContext.Provider>
    );
}

export function useConnections() {
    const context = useContext(ConnectionsContext);
    if (context === undefined) {
        throw new Error('useConnections must be used within a ConnectionsProvider');
    }
    return context;
}
