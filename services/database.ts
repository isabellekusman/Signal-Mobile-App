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
import { logger } from './logger';

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
        logger.error(error, { tags: { service: 'database', method: 'getProfile' } });
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
        logger.error(error, { tags: { service: 'database', method: 'upsertProfile' } });
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
        logger.error(error, { tags: { service: 'database', method: 'getConnections' } });
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
        logger.error(error, { tags: { service: 'database', method: 'addConnection' } });
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
        logger.error(error, { tags: { service: 'database', method: 'updateConnection' } });
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
        logger.error(error, { tags: { service: 'database', method: 'deleteConnection' } });
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
        logger.error(error, { tags: { service: 'database', method: 'getDailyUsageCount' } });
        return 0;
    }
    return count || 0;
}

// ─── Account Operations ─────────────────────────────────────

async function deleteAccount(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    try {
        const { error } = await supabase.functions.invoke('delete-account', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            }
        });
        if (error) {
            logger.error(error, { tags: { service: 'database', method: 'deleteAccount' } });
            // Fallback to manual delete of what we can if function is not deployed
            const { error: connError } = await supabase.from('connections').delete().eq('user_id', session.user.id);
            const { error: profileError } = await supabase.from('profiles').delete().eq('id', session.user.id);
            return !connError && !profileError;
        }
        return true;
    } catch (err) {
        logger.error(err, { tags: { service: 'database', method: 'deleteAccount' } });
        return false;
    }
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
