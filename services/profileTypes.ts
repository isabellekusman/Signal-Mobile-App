/**
 * Profile Aggregation Types
 *
 * These types define the computed behavioral profile that powers
 * the Me / Relational Identity Dashboard.
 *
 * Data source mapping:
 *   dynamic_logs        → Connection.dailyLogs (DailyLog[])
 *   decoder_requests    → Connection.savedLogs.filter(source === 'decoder')
 *   clarity_chats       → Connection.savedLogs.filter(source === 'clarity')
 *   stars_entries       → Connection.savedLogs.filter(source === 'stars')
 *   reflections         → user reflections stored in Me screen state
 *   profiles/connections → Connection[] from context
 */

// ─── Computed Profile Summary ────────────────────────────────────

export interface ProfileSummary {
    identity: ProfileIdentity;
    currentPull: CurrentPull;
    baseline: RelationalBaseline;
    regulationStyle: RegulationStyle;
    effortBalance: EffortBalance;
    emotionalOutcome: EmotionalOutcome;
    signalStory: SignalStory;
    repeatingDynamics: RepeatingDynamics;
    perceptionDrift: PerceptionDrift;
    boundaryAlignment: BoundaryAlignment;
    trajectory: Trajectory;
    evidence: EvidenceCounts;
    computedAt: string;
}

export interface ProfileIdentity {
    name: string;
    zodiac: string;
    about: string;
}

export interface CurrentPull {
    headline: string;
    explanation: string;
    basedOn: string; // evidence reference
}

export interface RelationalBaseline {
    tendencies: Tendency[];
}

export interface Tendency {
    text: string;
    strength: 'strong' | 'moderate' | 'emerging';
    evidenceCount: number;
}

export type RegulationLabel =
    | 'monitoring'
    | 'accommodating'
    | 'distancing'
    | 'overinterpreting'
    | 'stabilizing';

export interface RegulationStyle {
    primary: RegulationLabel;
    score: number; // 0–100
    description: string;
}

export interface EffortBalance {
    youInitiatePct: number;
    theyInitiatePct: number;
    youFollowThroughPct: number;
    theyFollowThroughPct: number;
    summary: string;
}

export interface EmotionalOutcome {
    distribution: Record<string, number>; // calm, confused, anxious, secure, detached → percentages
    interpretation: string;
    periodDays: number;
}

export interface SignalStory {
    interpretationEvents: number;
    observationEvents: number;
    score: number;
    label: string;
    summary: string;
}

export interface RepeatingDynamics {
    detected: boolean;
    pattern: PatternLoop | null;
    summary: string;
    affectedConnections: string[]; // connection names
}

export interface PatternLoop {
    trigger: string;
    reaction: string;
    theirResponse: string;
    result: string;
}

export interface PerceptionDrift {
    score: number; // 0–100 (self-trust)
    label: 'Building' | 'Unstable' | 'Strong';
    summary: string;
    driftIndicators: number;
}

export interface BoundaryAlignment {
    upheld: number;
    total: number;
    percentage: number;
    summary: string;
}

export interface Trajectory {
    direction: 'stabilizing' | 'plateauing' | 'fading';
    statement: string;
    confidence: 'low' | 'moderate' | 'high';
}

export interface EvidenceCounts {
    totalDynamicLogs: number;
    totalDecoderRequests: number;
    totalClarityChats: number;
    totalStarsEntries: number;
    totalReflections: number;
    activeConnections: number;
    periodDays: number;
}

// ─── Timeline Item ───────────────────────────────────────────────

export interface ProfileTimelineItem {
    id: string;
    date: string;
    insight: string;
    source: 'computed' | 'reflection';
    evidenceRef?: string;
}

// ─── Cache ───────────────────────────────────────────────────────

export interface ProfileCache {
    summary: ProfileSummary;
    timeline: ProfileTimelineItem[];
    cachedAt: string;
    validUntil: string;
}
