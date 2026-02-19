
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

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
    showAddPulse: boolean;
    setShowAddPulse: (v: boolean) => void;
}

const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

const ONBOARDING_KEY = '@signal_onboarding_complete';
const PROFILE_KEY = '@signal_user_profile';

export function ConnectionsProvider({ children }: { children: ReactNode }) {
    const [connections, setConnections] = useState<Connection[]>(INITIAL_CONNECTIONS);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [userProfile, setUserProfileState] = useState<UserProfile>(DEFAULT_PROFILE);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
    const [showAddPulse, setShowAddPulse] = useState(false);

    // DEV MODE: Always show onboarding on reload.
    // To restore persistence, uncomment the AsyncStorage block below and remove the line after it.
    useEffect(() => {
        // (async () => {
        //     try {
        //         const [onboardingDone, savedProfile] = await Promise.all([
        //             AsyncStorage.getItem(ONBOARDING_KEY),
        //             AsyncStorage.getItem(PROFILE_KEY),
        //         ]);
        //         setHasCompletedOnboarding(onboardingDone === 'true');
        //         if (savedProfile) {
        //             setUserProfileState(JSON.parse(savedProfile));
        //         }
        //     } catch {
        //         setHasCompletedOnboarding(false);
        //     }
        // })();
        setHasCompletedOnboarding(false); // ← Always show onboarding
    }, []);

    const setUserProfile = (profile: UserProfile) => {
        setUserProfileState(profile);
        AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile)).catch(() => { });
    };

    const completeOnboarding = (profile?: UserProfile) => {
        setHasCompletedOnboarding(true);
        AsyncStorage.setItem(ONBOARDING_KEY, 'true').catch(() => { });
        if (profile) {
            setUserProfile(profile);
        }
        setShowAddPulse(true);
    };

    const addConnection = (connection: Connection) => {
        setConnections((prev) => [connection, ...prev]);
    };

    const updateConnection = (id: string, updates: Partial<Connection>) => {
        setConnections((prev) =>
            prev.map((conn) => (conn.id === id ? { ...conn, ...updates } : conn))
        );
    };

    const deleteConnection = (id: string) => {
        setConnections((prev) => prev.filter((conn) => conn.id !== id));
    };

    return (
        <ConnectionsContext.Provider value={{
            connections, addConnection, updateConnection, deleteConnection,
            theme, setTheme,
            userProfile, setUserProfile,
            hasCompletedOnboarding, completeOnboarding,
            showAddPulse, setShowAddPulse,
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
