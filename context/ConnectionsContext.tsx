
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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

}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

const ONBOARDING_KEY_PREFIX = '@signal_onboarding_complete_';
const PROFILE_KEY_PREFIX = '@signal_user_profile_';
const CONNECTIONS_KEY_PREFIX = '@signal_connections_';

export function ConnectionsProvider({ children }: { children: ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [userProfile, setUserProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const currentUserId = user?.id ?? null;

    // Get user-specific storage keys
    const getKeys = (uid: string | null) => ({
        onboarding: uid ? `${ONBOARDING_KEY_PREFIX}${uid}` : null,
        profile: uid ? `${PROFILE_KEY_PREFIX}${uid}` : null,
        connections: uid ? `${CONNECTIONS_KEY_PREFIX}${uid}` : null,
    });

    // Load persisted data from AsyncStorage when user changes
    useEffect(() => {
        // If auth is still loading, wait
        if (authLoading) return;

        // If no user is logged in, set defaults and stop loading
        if (!currentUserId) {
            setHasCompletedOnboarding(false);
            setIsLoaded(true);
            return;
        }

        const keys = getKeys(currentUserId);

        (async () => {
            try {
                const [onboardingDone, savedProfile, savedConnections] = await Promise.all([
                    AsyncStorage.getItem(keys.onboarding!),
                    AsyncStorage.getItem(keys.profile!),
                    AsyncStorage.getItem(keys.connections!),
                ]);
                setHasCompletedOnboarding(onboardingDone === 'true');
                if (savedProfile) {
                    setUserProfileState(JSON.parse(savedProfile));
                } else {
                    setUserProfileState(DEFAULT_PROFILE);
                }
                if (savedConnections) {
                    setConnections(JSON.parse(savedConnections));
                } else {
                    setConnections(INITIAL_CONNECTIONS);
                }
            } catch {
                setHasCompletedOnboarding(false);
            } finally {
                setIsLoaded(true);
            }
        })();
    }, [currentUserId, authLoading]);

    // Helper to persist connections to AsyncStorage
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

    const addConnection = (connection: Connection) => {
        setConnections((prev) => {
            const updated = [connection, ...prev];
            persistConnections(updated);
            return updated;
        });
    };

    const updateConnection = (id: string, updates: Partial<Connection>) => {
        setConnections((prev) => {
            const updated = prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn));
            persistConnections(updated);
            return updated;
        });
    };

    const deleteConnection = (id: string) => {
        setConnections((prev) => {
            const updated = prev.filter((conn) => conn.id !== id);
            persistConnections(updated);
            return updated;
        });
    };

    return (
        <ConnectionsContext.Provider value={{
            connections, addConnection, updateConnection, deleteConnection,
            theme, setTheme,
            userProfile, setUserProfile,
            hasCompletedOnboarding, completeOnboarding,

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
