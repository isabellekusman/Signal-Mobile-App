/**
 * Profile Cache Service
 *
 * Uses AsyncStorage to cache computed profile summaries.
 * Invalidates after 24 hours or on manual refresh.
 *
 * Endpoints (client-side equivalents):
 *   getProfileSummary()   → GET  /api/me/profile-summary
 *   getProfileTimeline()  → GET  /api/me/profile-timeline
 *   refreshProfile()      → POST /api/me/profile-refresh
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Connection } from '../context/ConnectionsContext';
import {
    computeObservedVsInterpreted,
    computeProfileSummary,
    computeProfileTimeline,
    extractData,
    ObservedVsInterpreted,
} from './profileAggregation';
import { ProfileCache, ProfileSummary, ProfileTimelineItem } from './profileTypes';

const CACHE_KEY = '@signal_profile_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Read Cache ──────────────────────────────────────────────────

async function readCache(): Promise<ProfileCache | null> {
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const cache: ProfileCache = JSON.parse(raw);

        // Check validity
        if (new Date(cache.validUntil).getTime() < Date.now()) {
            return null; // expired
        }
        return cache;
    } catch {
        return null;
    }
}

// ─── Write Cache ─────────────────────────────────────────────────

async function writeCache(summary: ProfileSummary, timeline: ProfileTimelineItem[]): Promise<void> {
    try {
        const cache: ProfileCache = {
            summary,
            timeline,
            cachedAt: new Date().toISOString(),
            validUntil: new Date(Date.now() + CACHE_DURATION_MS).toISOString(),
        };
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.warn('Profile cache write failed:', error);
    }
}

// ─── Public API ──────────────────────────────────────────────────

/**
 * GET /api/me/profile-summary equivalent.
 * Returns cached summary or computes fresh one.
 */
export async function getProfileSummary(
    connections: Connection[],
    identity: { name: string; zodiac: string; about: string },
    boundaries: string[],
    reflections: string[],
    periodDays = 90
): Promise<ProfileSummary> {
    // Try cache first
    const cached = await readCache();
    if (cached?.summary) {
        return cached.summary;
    }

    // Compute fresh
    const summary = computeProfileSummary(connections, identity, boundaries, reflections, periodDays);
    const data = extractData(connections, periodDays);
    const timeline = computeProfileTimeline(data, reflections);
    await writeCache(summary, timeline);
    return summary;
}

/**
 * GET /api/me/profile-timeline equivalent.
 * Returns cached timeline or computes fresh one.
 */
export async function getProfileTimeline(
    connections: Connection[],
    reflections: string[],
    limit = 10
): Promise<ProfileTimelineItem[]> {
    const cached = await readCache();
    if (cached?.timeline) {
        return cached.timeline.slice(0, limit);
    }

    const data = extractData(connections);
    return computeProfileTimeline(data, reflections, limit);
}

/**
 * POST /api/me/profile-refresh equivalent.
 * Forces recomputation and cache invalidation.
 */
export async function refreshProfile(
    connections: Connection[],
    identity: { name: string; zodiac: string; about: string },
    boundaries: string[],
    reflections: string[],
    periodDays = 90
): Promise<ProfileSummary> {
    // Invalidate cache
    await AsyncStorage.removeItem(CACHE_KEY);

    // Recompute
    const summary = computeProfileSummary(connections, identity, boundaries, reflections, periodDays);
    const data = extractData(connections, periodDays);
    const timeline = computeProfileTimeline(data, reflections);
    await writeCache(summary, timeline);
    return summary;
}

/**
 * Get observed vs interpreted data (not cached, lightweight).
 */
export function getObservedVsInterpreted(connections: Connection[]): ObservedVsInterpreted {
    const data = extractData(connections);
    return computeObservedVsInterpreted(data);
}

/**
 * Check if a refresh is recommended.
 * Returns true if cache is expired or data has changed significantly.
 */
export async function shouldRefresh(connections: Connection[]): Promise<boolean> {
    const cached = await readCache();
    if (!cached) return true;

    // Check if significant new data has been added
    const active = connections.filter((c) => c.status === 'active');
    const currentLogCount = active.reduce((s, c) => s + (c.dailyLogs?.length || 0), 0);
    const currentSavedCount = active.reduce((s, c) => s + (c.savedLogs?.length || 0), 0);
    const cachedEvidence = cached.summary.evidence;
    const cachedTotal = cachedEvidence.totalDynamicLogs + cachedEvidence.totalDecoderRequests
        + cachedEvidence.totalClarityChats + cachedEvidence.totalStarsEntries;
    const currentTotal = currentLogCount + currentSavedCount;

    // Refresh if 3+ new data points since last computation
    return (currentTotal - cachedTotal) >= 3;
}
