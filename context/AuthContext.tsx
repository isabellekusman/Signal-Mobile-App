import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    isLoading: boolean;
    signUp: (email: string, password: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Get initial session (persisted via AsyncStorage)
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setIsLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
        const { error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
        });
        if (error) return { error: error.message };
        return { error: null };
    };

    const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password,
        });
        if (error) return { error: error.message };
        return { error: null };
    };

    const signOut = async () => {
        if (user) {
            // Attempt to unregister token from Supabase (silent fallback)
            const { unregisterPushNotificationsAsync } = require('../services/notifications');
            await unregisterPushNotificationsAsync(user.id);
        }
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            session,
            user,
            isLoading,
            signUp,
            signIn,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
