/**
 * Database Service
 *
 * Provides CRUD operations against Supabase tables.
 * This service is the bridge between local state and cloud persistence.
 *
 * Usage:
 *   import { db } from '../services/database';
 *   const connections = await db.getConnections();
 */

import { supabase } from '../lib/supabase';

// ─── Types (match Supabase schema) ──────────────────────────

export interface DBProfile {
    id: string;
    name: string;
    zodiac: string;
    about: string;
    standards: string[];
    boundaries: string[];
    attachment_style: string[];
    dealbreakers: string[];
    love_language: string;
    subscription_tier?: 'free' | 'seeker' | 'signal';
    trial_expires_at?: string;
    has_seen_sub_welcome?: boolean;
    has_seen_trial_expiry?: boolean;
}

export interface DBConnection {
    id: string;
    user_id: string;
    name: string;
    tag: string;
    zodiac: string;
    icon: string;
    status: 'active' | 'archived';
    signals: any[];
    daily_logs: any[];
    saved_logs: any[];
    onboarding_context: any;
    created_at: string;
    updated_at: string;
}

// ─── Profile Operations ─────────────────────────────────────

async function getProfile(): Promise<DBProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (error) {
        console.error('db.getProfile error:', error);
        return null;
    }
    return data;
}

async function upsertProfile(profile: Partial<DBProfile>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, ...profile }, { onConflict: 'id' });

    if (error) {
        console.error('db.upsertProfile error:', error);
        return false;
    }
    return true;
}

// ─── Connection Operations ──────────────────────────────────

async function getConnections(): Promise<DBConnection[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('db.getConnections error:', error);
        return [];
    }
    return data || [];
}

async function addConnection(connection: Omit<DBConnection, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBConnection | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('connections')
        .insert({ ...connection, user_id: user.id })
        .select()
        .single();

    if (error) {
        console.error('db.addConnection error:', error);
        return null;
    }
    return data;
}

async function updateConnection(id: string, updates: Partial<DBConnection>): Promise<boolean> {
    const { error } = await supabase
        .from('connections')
        .update(updates)
        .eq('id', id);

    if (error) {
        console.error('db.updateConnection error:', error);
        return false;
    }
    return true;
}

async function deleteConnection(id: string): Promise<boolean> {
    const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('db.deleteConnection error:', error);
        return false;
    }
    return true;
}

// ─── AI Usage Operations ────────────────────────────────────

async function getDailyUsageCount(feature?: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let query = supabase
        .from('ai_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', todayStart.toISOString());

    if (feature) {
        query = query.eq('feature', feature);
    }

    const { count, error } = await query;

    if (error) {
        console.error('db.getDailyUsageCount error:', error);
        return 0;
    }
    return count || 0;
}

// ─── Account Operations ─────────────────────────────────────

async function deleteAccount(): Promise<boolean> {
    // This deletes user profile and connections (CASCADE from auth.users)
    // Actual user deletion requires a Supabase Edge Function with service role
    // For now, we delete the data we can access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error: connError } = await supabase
        .from('connections')
        .delete()
        .eq('user_id', user.id);

    const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

    if (connError || profileError) {
        console.error('db.deleteAccount errors:', { connError, profileError });
        return false;
    }
    return true;
}

// ─── Export All ──────────────────────────────────────────────

export const db = {
    getProfile,
    upsertProfile,
    getConnections,
    addConnection,
    updateConnection,
    deleteConnection,
    getDailyUsageCount,
    deleteAccount,
};
