/**
 * Profile Aggregation Service
 *
 * Pure computation functions that derive behavioral insights from
 * existing app data. No network calls, no LLM — deterministic
 * template-based outputs for auditability.
 *
 * Data source mapping:
 *   dynamic_logs     → Connection.dailyLogs[]
 *   decoder_requests → Connection.savedLogs.filter(source === 'decoder')
 *   clarity_chats    → Connection.savedLogs.filter(source === 'clarity')
 *   stars_entries    → Connection.savedLogs.filter(source === 'stars')
 *   reflections      → string[] passed in from Me screen state
 *   connections      → Connection[] from context
 */

import { Connection, DailyLog, SavedLog } from '../context/ConnectionsContext';
import {
    BoundaryAlignment,
    CurrentPull,
    EffortBalance,
    EmotionalOutcome,
    EvidenceCounts,
    PatternLoop,
    PerceptionDrift,
    ProfileSummary,
    ProfileTimelineItem,
    RegulationLabel,
    RegulationStyle,
    RelationalBaseline,
    RepeatingDynamics,
    SignalStory,
    Tendency,
    Trajectory,
} from './profileTypes';

// ─── Helpers ─────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function filterByDays<T extends { date: string }>(items: T[], days: number): T[] {
    return items.filter((item) => daysAgo(item.date) <= days);
}

function pct(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100);
}

function todayDateSeed(): number {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ─── Data Extraction ─────────────────────────────────────────────

interface ExtractedData {
    active: Connection[];
    allDailyLogs: DailyLog[];
    allSavedLogs: SavedLog[];
    decoderLogs: SavedLog[];
    clarityLogs: SavedLog[];
    starsLogs: SavedLog[];
    recentDailyLogs: DailyLog[];   // last 90d
    recentSavedLogs: SavedLog[];   // last 90d
    recent30dLogs: DailyLog[];     // last 30d
}

function extractData(connections: Connection[], periodDays = 90): ExtractedData {
    const active = connections.filter((c) => c.status === 'active');
    const allDailyLogs = active.flatMap((c) => c.dailyLogs || []);
    const allSavedLogs = active.flatMap((c) => c.savedLogs || []);
    const decoderLogs = allSavedLogs.filter((l) => l.source === 'decoder');
    const clarityLogs = allSavedLogs.filter((l) => l.source === 'clarity');
    const starsLogs = allSavedLogs.filter((l) => l.source === 'stars');
    const recentDailyLogs = filterByDays(allDailyLogs, periodDays);
    const recentSavedLogs = filterByDays(allSavedLogs, periodDays);
    const recent30dLogs = filterByDays(allDailyLogs, 30);

    return {
        active,
        allDailyLogs,
        allSavedLogs,
        decoderLogs,
        clarityLogs,
        starsLogs,
        recentDailyLogs,
        recentSavedLogs,
        recent30dLogs,
    };
}

// ─── 1. Relational Baseline (Tendencies) ─────────────────────────

interface TendencyRule {
    id: string;
    text: string;
    score: (data: ExtractedData) => number;
}

const TENDENCY_RULES: TendencyRule[] = [
    {
        id: 'reassurance_seeking',
        text: 'seek reassurance after delayed replies',
        score: (d) => {
            // Decoder usage after uncertain/preoccupied emotional states
            const uncertainLogs = d.recentDailyLogs.filter(
                (l) => l.structured_emotion_state === 'Uncertain' || l.structured_emotion_state === 'Preoccupied'
            );
            const decoderCount = d.decoderLogs.length;
            if (uncertainLogs.length === 0 && decoderCount === 0) return 0;
            // Higher score if decoder use correlates with uncertain states
            return Math.min(100, (uncertainLogs.length * 15) + (decoderCount * 10));
        },
    },
    {
        id: 'overinterpretation',
        text: 'analyze situations before sufficient information exists',
        score: (d) => {
            // Decoder + clarity usage relative to dynamic log count
            const toolUse = d.decoderLogs.length + d.clarityLogs.length;
            const observations = d.recentDailyLogs.length;
            if (toolUse === 0) return 0;
            const ratio = toolUse / Math.max(1, observations);
            return Math.min(100, Math.round(ratio * 60));
        },
    },
    {
        id: 'effort_escalation',
        text: 'escalate effort when attention drops',
        score: (d) => {
            // "I carried it" logs correlating with "Further away" direction
            const escalation = d.recentDailyLogs.filter(
                (l) => l.energyExchange === 'I carried it' && l.direction === 'Further away'
            );
            return Math.min(100, escalation.length * 25);
        },
    },
    {
        id: 'relaxation_after_directness',
        text: 'relax after direct communication',
        score: (d) => {
            // Grounded/Warm following "Closer" direction logs
            const grounded = d.recentDailyLogs.filter(
                (l) => (l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm')
                    && l.direction === 'Closer'
            );
            return Math.min(100, grounded.length * 20);
        },
    },
    {
        id: 'withdrawal_when_unmatched',
        text: 'withdraw when effort feels unmatched',
        score: (d) => {
            const unmatched = d.recentDailyLogs.filter(
                (l) => l.energyExchange === 'I carried it'
                    && (l.structured_emotion_state === 'Draining' || l.structured_emotion_state === 'Neutral')
            );
            return Math.min(100, unmatched.length * 20);
        },
    },
    {
        id: 'narrative_creation',
        text: 'create narratives around silence',
        score: (d) => {
            // Custom emotion notes + decoder usage when no daily log
            const notesWithContent = d.recentDailyLogs.filter((l) => l.custom_emotion_note && l.custom_emotion_note.length > 20);
            const decoderHeavy = d.decoderLogs.length;
            return Math.min(100, (notesWithContent.length * 12) + (decoderHeavy * 8));
        },
    },
    {
        id: 'external_validation',
        text: 'seek external validation before trusting your read',
        score: (d) => {
            // Clarity usage as proportion of decisions
            const clarityCount = d.clarityLogs.length;
            return Math.min(100, clarityCount * 15);
        },
    },
    {
        id: 'pattern_awareness',
        text: 'notice patterns across connections but still repeat them',
        score: (d) => {
            // Multiple connections with similar emotional states
            const profiles = d.active;
            if (profiles.length < 2) return 0;
            const statesByProfile = profiles.map((c) =>
                (c.dailyLogs || []).map((l) => l.structured_emotion_state)
            );
            // Check for overlap in dominant states
            const dominant = statesByProfile.map((states) => {
                const counts: Record<string, number> = {};
                states.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
                return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
            }).filter(Boolean);
            const repeated = dominant.filter((v, i, a) => a.indexOf(v) !== i);
            return Math.min(100, repeated.length * 35);
        },
    },
    {
        id: 'tone_analysis',
        text: 'analyze tone before content',
        score: (d) => {
            // Decoder-heavy users who check tone (proxy: decoder count)
            return Math.min(100, d.decoderLogs.length * 12);
        },
    },
    {
        id: 'de_escalation',
        text: 'de-escalate when you sense resistance',
        score: (d) => {
            const balanced = d.recentDailyLogs.filter(
                (l) => l.energyExchange === 'It felt balanced' && l.direction === 'The same'
            );
            return Math.min(100, balanced.length * 15);
        },
    },
];

export function computeRelationalBaseline(data: ExtractedData): RelationalBaseline {
    const scored = TENDENCY_RULES
        .map((rule) => ({
            text: rule.text,
            rawScore: rule.score(data),
        }))
        .filter((t) => t.rawScore > 0)
        .sort((a, b) => b.rawScore - a.rawScore)
        .slice(0, 4);

    const tendencies: Tendency[] = scored.map((t) => ({
        text: t.text,
        strength: t.rawScore >= 60 ? 'strong' : t.rawScore >= 30 ? 'moderate' : 'emerging',
        evidenceCount: Math.max(1, Math.round(t.rawScore / 15)),
    }));

    // Always return at least one tendency with fallback
    if (tendencies.length === 0) {
        tendencies.push({
            text: 'building your behavioral profile — more activity will refine this',
            strength: 'emerging',
            evidenceCount: 0,
        });
    }

    return { tendencies };
}

// ─── 2. Emotional Regulation Style ───────────────────────────────

interface RegulationScoring {
    label: RegulationLabel;
    score: number;
}

export function computeRegulationStyle(data: ExtractedData): RegulationStyle {
    const scores: RegulationScoring[] = [
        {
            label: 'monitoring',
            score: data.recentDailyLogs.length * 1 + data.starsLogs.length * 1.5,
        },
        {
            label: 'clarifying',
            score: data.clarityLogs.length * 1.5 + data.decoderLogs.length * 2,
        },
        {
            label: 'accommodating',
            score: data.recentDailyLogs.filter((l) => l.energyExchange === 'I carried it').length * 2,
        },
        {
            label: 'distancing',
            score: data.recentDailyLogs.filter(
                (l) => l.structured_emotion_state === 'Neutral' || l.structured_emotion_state === 'Draining'
            ).length * 1.5,
        },
        {
            label: 'overinterpreting',
            score: data.decoderLogs.length * 2 +
                data.recentDailyLogs.filter((l) => l.custom_emotion_note && l.custom_emotion_note.length > 30).length * 1.5,
        },
        {
            label: 'stabilizing',
            score: data.recentDailyLogs.filter(
                (l) => l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm'
            ).length * 2,
        },
    ];

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0];
    const totalScore = scores.reduce((s, r) => s + r.score, 0) || 1;
    const normalized = Math.min(100, Math.round((top.score / totalScore) * 100));

    const descriptions: Record<RegulationLabel, string> = {
        monitoring: 'You regulate by tracking — observing patterns and checking in regularly.',
        clarifying: 'You regulate by seeking clarity — understanding dynamics before deciding.',
        accommodating: 'You regulate by adapting — carrying effort to maintain stability.',
        distancing: 'You regulate by creating space — stepping back when things feel heavy.',
        overinterpreting: 'You regulate by analyzing — decoding meaning to manage uncertainty.',
        stabilizing: 'You regulate by grounding — anchoring in what feels secure and clear.',
    };

    return {
        primary: top.label,
        score: normalized,
        description: descriptions[top.label],
    };
}

// ─── 3. Effort Balance ───────────────────────────────────────────

export function computeEffortBalance(data: ExtractedData): EffortBalance {
    const logs = data.recentDailyLogs;
    if (logs.length === 0) {
        return {
            youInitiatePct: 0,
            theyInitiatePct: 0,
            youFollowThroughPct: 0,
            theyFollowThroughPct: 0,
            summary: 'Not enough data to assess effort balance yet.',
        };
    }

    let youCarry = 0;
    let theyCarry = 0;
    let balanced = 0;

    logs.forEach((l) => {
        if (l.energyExchange === 'I carried it') youCarry++;
        else if (l.energyExchange === 'He carried it') theyCarry++;
        else balanced++;
    });

    const total = logs.length;
    const youInitiatePct = pct(youCarry + Math.round(balanced * 0.5), total);
    const theyInitiatePct = pct(theyCarry + Math.round(balanced * 0.5), total);

    // Follow-through approximated from direction: Closer = follow-through, Further = drop
    const closer = logs.filter((l) => l.direction === 'Closer').length;
    const further = logs.filter((l) => l.direction === 'Further away').length;
    const youFollowThroughPct = pct(closer, total);
    const theyFollowThroughPct = Math.max(0, 100 - pct(further, total) - 10); // estimated

    const summary = `You initiate ${youInitiatePct}% of exchanges. Follow-through (you): ${youFollowThroughPct}% — Them: ${theyFollowThroughPct}%.`;

    return { youInitiatePct, theyInitiatePct, youFollowThroughPct, theyFollowThroughPct, summary };
}

// ─── 4. Emotional Outcome Summary ────────────────────────────────

const EMOTION_MAP: Record<string, string> = {
    Grounded: 'calm',
    Warm: 'secure',
    Neutral: 'detached',
    Uncertain: 'confused',
    Preoccupied: 'anxious',
    Draining: 'anxious',
    Other: 'confused',
};

export function computeEmotionalOutcome(data: ExtractedData): EmotionalOutcome {
    const logs = data.recent30dLogs;
    const dist: Record<string, number> = { calm: 0, confused: 0, anxious: 0, secure: 0, detached: 0 };

    if (logs.length === 0) {
        return {
            distribution: dist,
            interpretation: 'Not enough recent data to determine emotional patterns.',
            periodDays: 30,
        };
    }

    logs.forEach((l) => {
        const mapped = EMOTION_MAP[l.structured_emotion_state] || 'confused';
        dist[mapped]++;
    });

    const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
    Object.keys(dist).forEach((k) => {
        dist[k] = pct(dist[k], total);
    });

    // Determine dominant emotion for interpretation
    const dominant = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
    const interpretations: Record<string, string> = {
        calm: 'Your interactions are predominantly leaving you grounded and settled.',
        confused: 'Your interactions are frequently leaving you uncertain about where things stand.',
        anxious: 'Your interactions are often generating preoccupation or unease.',
        secure: 'Your interactions are consistently reinforcing a sense of warmth and security.',
        detached: 'Your interactions are tending toward emotional neutrality or distance.',
    };

    return {
        distribution: dist,
        interpretation: interpretations[dominant[0]] || '',
        periodDays: 30,
    };
}

// ─── 5. Signal vs Story ──────────────────────────────────────────

export function computeSignalStory(data: ExtractedData): SignalStory {
    const interpretationEvents = data.decoderLogs.length + data.clarityLogs.length;
    const observationEvents = Math.max(1, data.recentDailyLogs.length);
    const score = interpretationEvents / observationEvents;

    let label: string;
    let summary: string;
    if (score > 1) {
        label = 'Interpretation-heavy';
        summary = 'You often analyze before sufficient information exists.';
    } else if (score >= 0.5) {
        label = 'Balanced';
        summary = 'You balance observation and interpretation.';
    } else {
        label = 'Observation-first';
        summary = 'You prioritize observed behavior over interpretation.';
    }

    return { interpretationEvents, observationEvents, score: Math.round(score * 100) / 100, label, summary };
}

// ─── 6. Repeating Dynamics Across People ─────────────────────────

export function computeRepeatingDynamics(data: ExtractedData): RepeatingDynamics {
    const profiles = data.active;
    if (profiles.length < 2) {
        return {
            detected: false,
            pattern: null,
            summary: 'Not enough connections to detect cross-patterns yet.',
            affectedConnections: [],
        };
    }

    // Build dominant behavioral sequence per profile (last 5 tags)
    const sequences = profiles.map((c) => {
        const logs = (c.dailyLogs || []).slice(0, 5);
        return {
            name: c.name,
            seq: logs.map((l) => `${l.energyExchange}|${l.structured_emotion_state}`),
            emotions: logs.map((l) => l.structured_emotion_state),
            energy: logs.map((l) => l.energyExchange),
        };
    }).filter((s) => s.seq.length > 0);

    // Find overlapping emotion patterns across 2+ profiles
    const emotionSets = sequences.map((s) => new Set(s.emotions));
    const overlapping: string[] = [];
    const affectedNames: string[] = [];

    for (let i = 0; i < emotionSets.length; i++) {
        for (let j = i + 1; j < emotionSets.length; j++) {
            const shared = [...emotionSets[i]].filter((e) => emotionSets[j].has(e));
            if (shared.length >= 1) {
                if (!affectedNames.includes(sequences[i].name)) affectedNames.push(sequences[i].name);
                if (!affectedNames.includes(sequences[j].name)) affectedNames.push(sequences[j].name);
                shared.forEach((s) => { if (!overlapping.includes(s)) overlapping.push(s); });
            }
        }
    }

    // Determine dominant pattern
    const hasUncertainty = overlapping.includes('Uncertain') || overlapping.includes('Preoccupied');
    const hasCarrying = sequences.some((s) => s.energy.includes('I carried it'));

    let pattern: PatternLoop | null = null;
    let summary = '';

    if (hasUncertainty && hasCarrying) {
        pattern = {
            trigger: 'inconsistent attention',
            reaction: 'increased analysis',
            theirResponse: 'continued ambiguity',
            result: 'reassurance seeking',
        };
        summary = 'You experience similar uncertainty across multiple connections — inconsistent attention triggers analysis and reassurance seeking.';
    } else if (hasUncertainty) {
        pattern = {
            trigger: 'ambiguous communication',
            reaction: 'heightened monitoring',
            theirResponse: 'unchanged behavior',
            result: 'persistent uncertainty',
        };
        summary = 'You experience a recurring cycle of uncertain interpretation across connections.';
    } else if (affectedNames.length >= 2) {
        pattern = {
            trigger: 'relational engagement',
            reaction: 'similar emotional response',
            theirResponse: 'varied',
            result: 'familiar dynamic',
        };
        summary = 'You tend to apply similar relational strategies across connections.';
    } else {
        summary = 'No strong repeating dynamic detected across your connections.';
    }

    return {
        detected: pattern !== null,
        pattern,
        summary,
        affectedConnections: affectedNames,
    };
}

// ─── 7. Perception Drift / Self-Trust Score ──────────────────────

export function computePerceptionDrift(data: ExtractedData): PerceptionDrift {
    // Drift indicators: decoder requests + clarity chats for same events
    const driftIndicators = data.decoderLogs.length + Math.round(data.clarityLogs.length * 0.5);

    // Recent 7d decoder usage spike
    const recent7d = filterByDays(data.decoderLogs, 7);
    const recentSpike = recent7d.length;

    // Self-trust = inverse of drift, normalized 0–100
    const totalActivity = data.recentDailyLogs.length + data.decoderLogs.length + data.clarityLogs.length || 1;
    const driftRatio = driftIndicators / totalActivity;
    const selfTrustRaw = Math.max(0, Math.min(100, Math.round((1 - driftRatio) * 100)));

    // Adjust for recent spike
    const adjustedScore = Math.max(0, selfTrustRaw - (recentSpike * 5));

    let label: 'Building' | 'Unstable' | 'Strong';
    if (adjustedScore >= 65) label = 'Strong';
    else if (adjustedScore >= 35) label = 'Building';
    else label = 'Unstable';

    const summaries: Record<string, string> = {
        Strong: 'You appear to trust your initial reads and act on direct observations.',
        Building: 'You are developing confidence in your interpretations but still cross-reference frequently.',
        Unstable: 'You are frequently seeking external confirmation before acting on your instincts.',
    };

    return {
        score: adjustedScore,
        label,
        summary: summaries[label],
        driftIndicators,
    };
}

// ─── 8. Boundary Alignment ──────────────────────────────────────

export function computeBoundaryAlignment(
    data: ExtractedData,
    boundaries: string[]
): BoundaryAlignment {
    if (boundaries.length === 0 || data.recentDailyLogs.length === 0) {
        return {
            upheld: 0,
            total: 0,
            percentage: 0,
            summary: 'No boundary encounters recorded yet.',
        };
    }

    // Approximate: boundary-relevant situations = logs with effort signals or notable entries
    const encounters = data.recentDailyLogs.filter(
        (l) => l.effortSignals.length > 0 || (l.notable && l.notable.trim().length > 0)
    );
    const total = Math.max(encounters.length, 1);

    // Upheld = situations with grounded/warm emotion + clarity >= 50
    const upheld = encounters.filter(
        (l) => (l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm')
            && l.clarity >= 50
    ).length;

    const percentage = pct(upheld, total);
    const summary = total > 0
        ? `You upheld your boundaries in ${upheld} of ${total} recent situations.`
        : 'No boundary encounters recorded yet.';

    return { upheld, total, percentage, summary };
}

// ─── Trajectory ──────────────────────────────────────────────────

export function computeTrajectory(data: ExtractedData): Trajectory {
    const logs = data.recent30dLogs;
    if (logs.length < 3) {
        return {
            direction: 'plateauing',
            statement: 'Not enough recent data to determine trajectory.',
            confidence: 'low',
        };
    }

    // Split into two halves and compare clarity + emotional state
    const mid = Math.floor(logs.length / 2);
    const firstHalf = logs.slice(mid);
    const secondHalf = logs.slice(0, mid);

    const avgClarity = (subset: DailyLog[]) =>
        subset.reduce((s, l) => s + l.clarity, 0) / Math.max(subset.length, 1);

    const groundedRatio = (subset: DailyLog[]) =>
        subset.filter((l) => l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm').length
        / Math.max(subset.length, 1);

    const clarityDelta = avgClarity(secondHalf) - avgClarity(firstHalf);
    const groundedDelta = groundedRatio(secondHalf) - groundedRatio(firstHalf);
    const combined = clarityDelta + groundedDelta * 50;

    let direction: 'stabilizing' | 'plateauing' | 'fading';
    let statement: string;
    let confidence: 'low' | 'moderate' | 'high';

    if (combined > 5) {
        direction = 'stabilizing';
        statement = 'If this continues, your relational clarity may continue strengthening.';
        confidence = combined > 15 ? 'high' : 'moderate';
    } else if (combined < -5) {
        direction = 'fading';
        statement = 'If this continues, it may trend towards increased uncertainty.';
        confidence = combined < -15 ? 'high' : 'moderate';
    } else {
        direction = 'plateauing';
        statement = 'Your relational patterns appear stable without strong directional movement.';
        confidence = 'moderate';
    }

    return { direction, statement, confidence };
}

// ─── Current Pull (Daily Headline) ───────────────────────────────

const PULL_TEMPLATES: Array<{
    condition: (data: ExtractedData) => boolean;
    headline: (data: ExtractedData) => string;
    explanation: (data: ExtractedData) => string;
}> = [
        {
            condition: (d) => {
                const uncertain = d.recent30dLogs.filter(
                    (l) => l.structured_emotion_state === 'Uncertain' || l.structured_emotion_state === 'Preoccupied'
                );
                return uncertain.length > d.recent30dLogs.length * 0.4;
            },
            headline: () => 'You are trying to secure certainty from inconsistent behavior.',
            explanation: (d) => {
                const ct = d.recent30dLogs.filter(
                    (l) => l.structured_emotion_state === 'Uncertain' || l.structured_emotion_state === 'Preoccupied'
                ).length;
                return `${ct} of your last ${d.recent30dLogs.length} check-ins reflect uncertainty or preoccupation.`;
            },
        },
        {
            condition: (d) => d.decoderLogs.length > d.recentDailyLogs.length,
            headline: () => 'You are emotionally investing ahead of evidence.',
            explanation: (d) =>
                `You used interpretation tools ${d.decoderLogs.length} times vs ${d.recentDailyLogs.length} recorded observations.`,
        },
        {
            condition: (d) => {
                const grounded = d.recent30dLogs.filter(
                    (l) => l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm'
                );
                return grounded.length > d.recent30dLogs.length * 0.5;
            },
            headline: () => 'You are maintaining boundaries successfully.',
            explanation: (d) => {
                const ct = d.recent30dLogs.filter(
                    (l) => l.structured_emotion_state === 'Grounded' || l.structured_emotion_state === 'Warm'
                ).length;
                return `${ct} of ${d.recent30dLogs.length} recent check-ins reflect grounded or warm emotional states.`;
            },
        },
        {
            condition: (d) => {
                const draining = d.recent30dLogs.filter((l) => l.structured_emotion_state === 'Draining');
                return draining.length > d.recent30dLogs.length * 0.3;
            },
            headline: () => 'You are interpreting absence as rejection.',
            explanation: () => 'Multiple draining emotional states following periods of reduced contact.',
        },
        {
            condition: (d) => d.clarityLogs.length > 3,
            headline: () => 'You are processing more than acting.',
            explanation: (d) => `You initiated ${d.clarityLogs.length} clarity sessions — your analytical energy is high.`,
        },
        {
            condition: (d) => {
                const carried = d.recent30dLogs.filter((l) => l.energyExchange === 'I carried it');
                return carried.length > d.recent30dLogs.length * 0.5;
            },
            headline: () => 'You are holding space without clear reciprocation.',
            explanation: () => 'More than half of your recent interactions show you carrying the energy.',
        },
    ];

const FALLBACK_HEADLINES = [
    'You are calibrating expectations after mixed signals.',
    'You are seeking patterns in ambiguity.',
    'You are in an observation phase — gathering rather than deciding.',
];

export function computeCurrentPull(data: ExtractedData): CurrentPull {
    // Try templated conditions first
    for (const template of PULL_TEMPLATES) {
        if (template.condition(data)) {
            const totalData = data.recentDailyLogs.length + data.decoderLogs.length + data.clarityLogs.length;
            return {
                headline: template.headline(data),
                explanation: template.explanation(data),
                basedOn: `based on ${totalData} data points, last 90 days`,
            };
        }
    }

    // Fallback: date-seeded rotation
    const seed = todayDateSeed();
    const idx = seed % FALLBACK_HEADLINES.length;
    return {
        headline: FALLBACK_HEADLINES[idx],
        explanation: 'Inferred from available activity patterns.',
        basedOn: `based on ${data.active.length} active connections`,
    };
}

// ─── Evidence Counts ─────────────────────────────────────────────

export function computeEvidence(data: ExtractedData, reflections: string[], periodDays: number): EvidenceCounts {
    return {
        totalDynamicLogs: data.recentDailyLogs.length,
        totalDecoderRequests: data.decoderLogs.length,
        totalClarityChats: data.clarityLogs.length,
        totalStarsEntries: data.starsLogs.length,
        totalReflections: reflections.length,
        activeConnections: data.active.length,
        periodDays,
    };
}

// ─── Observed vs Interpreted ─────────────────────────────────────

export interface ObservedVsInterpreted {
    observed: string[];
    interpreted: string[];
}

export function computeObservedVsInterpreted(data: ExtractedData): ObservedVsInterpreted {
    const observed: string[] = [];
    const interpreted: string[] = [];

    // Observed: from dynamic logs
    const recentLogs = data.recent30dLogs.slice(0, 5);
    recentLogs.forEach((l) => {
        if (l.energyExchange === 'I carried it') {
            observed.push('You carried the energy in a recent interaction');
        } else if (l.energyExchange === 'He carried it') {
            observed.push('They carried the energy recently');
        }
        if (l.direction === 'Further away') {
            observed.push('Things moved further apart recently');
        } else if (l.direction === 'Closer') {
            observed.push('Things moved closer recently');
        }
    });

    // Interpreted: from decoder/clarity usage
    data.decoderLogs.slice(0, 3).forEach((l) => {
        if (l.title) {
            interpreted.push(l.title.replace('Decode: ', ''));
        }
    });
    data.clarityLogs.slice(0, 3).forEach((l) => {
        if (l.title) {
            interpreted.push(l.title.replace('Clarity: ', ''));
        }
    });

    // Deduplicate and limit
    const uniqueObserved = [...new Set(observed)].slice(0, 4);
    const uniqueInterpreted = [...new Set(interpreted)].slice(0, 4);

    // Fallbacks
    if (uniqueObserved.length === 0) uniqueObserved.push('No recent observations recorded');
    if (uniqueInterpreted.length === 0) uniqueInterpreted.push('No recent interpretations recorded');

    return { observed: uniqueObserved, interpreted: uniqueInterpreted };
}

// ─── Profile Timeline ────────────────────────────────────────────

export function computeProfileTimeline(
    data: ExtractedData,
    reflections: string[],
    limit = 10
): ProfileTimelineItem[] {
    const items: ProfileTimelineItem[] = [];

    // Add computed insight items from saved logs
    data.allSavedLogs
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, Math.ceil(limit / 2))
        .forEach((log) => {
            items.push({
                id: `sl_${log.id}`,
                date: log.date,
                insight: log.summary || log.title,
                source: 'computed',
                evidenceRef: log.source,
            });
        });

    // Add reflection items
    reflections.slice(0, Math.ceil(limit / 2)).forEach((text, i) => {
        items.push({
            id: `ref_${i}`,
            date: new Date().toISOString(), // reflections don't have dates yet
            insight: text,
            source: 'reflection',
        });
    });

    return items
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);
}

// ─── Master Orchestrator ─────────────────────────────────────────

export function computeProfileSummary(
    connections: Connection[],
    identity: { name: string; zodiac: string; about: string },
    boundaries: string[],
    reflections: string[],
    periodDays = 90
): ProfileSummary {
    const data = extractData(connections, periodDays);

    return {
        identity,
        currentPull: computeCurrentPull(data),
        baseline: computeRelationalBaseline(data),
        regulationStyle: computeRegulationStyle(data),
        effortBalance: computeEffortBalance(data),
        emotionalOutcome: computeEmotionalOutcome(data),
        signalStory: computeSignalStory(data),
        repeatingDynamics: computeRepeatingDynamics(data),
        perceptionDrift: computePerceptionDrift(data),
        boundaryAlignment: computeBoundaryAlignment(data, boundaries),
        trajectory: computeTrajectory(data),
        evidence: computeEvidence(data, reflections, periodDays),
        computedAt: new Date().toISOString(),
    };
}

// Re-export for the observed vs interpreted card
export { extractData };
export type { ExtractedData };

