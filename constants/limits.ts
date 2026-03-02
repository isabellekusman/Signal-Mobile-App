/**
 * Relationship Signal — Tier & Usage Limits
 * Central logic for feature access and daily message counts.
 */

export type SubscriptionTier = 'free' | 'seeker' | 'signal';

export interface TierLimits {
    clarity: number;
    objective: number;
    decoder: number;
    dynamic: number;
    stars: number;
    daily_advice: number;
    log_synthesis: number;
}

export const TRIAL_LIMITS: TierLimits = {
    clarity: 5,
    objective: 5,
    decoder: 999, // Unlimited during trial
    stars: 999,
    dynamic: 999,
    daily_advice: 999,
    log_synthesis: 999,
};

export const FREE_LIMITS: TierLimits = {
    clarity: 3,
    objective: 3,
    decoder: 2,
    dynamic: 3,
    stars: 0, // Fully locked
    daily_advice: 0,
    log_synthesis: 0,
};

export const SEEKER_LIMITS: TierLimits = {
    clarity: 15,
    objective: 15,
    decoder: 15,
    dynamic: 15,
    stars: 10,
    daily_advice: 15,
    log_synthesis: 0, // Fully locked (Signal only)
};

export const SIGNAL_LIMITS: TierLimits = {
    clarity: 999,
    objective: 999,
    decoder: 999,
    dynamic: 999,
    stars: 999,
    daily_advice: 999,
    log_synthesis: 999,
};

export const getTierLimits = (tier: SubscriptionTier, isTrialActive: boolean): TierLimits => {
    if (tier === 'signal') return SIGNAL_LIMITS;
    if (isTrialActive) return TRIAL_LIMITS;
    if (tier === 'seeker') return SEEKER_LIMITS;
    return FREE_LIMITS;
};

export const FEATURE_LABELS: Record<string, string> = {
    clarity: 'Clarity',
    objective: 'Objective',
    decoder: 'Decoder',
    dynamic: 'Dynamic Logs',
    stars: 'Stars Align',
    daily_advice: 'Daily Advice',
    log_synthesis: 'Log Synthesis',
};

// Features that show "immediate upgrade prompt" before interaction if locked
export const LOCKED_BEFORE_INTERACTION = ['stars', 'daily_advice', 'log_synthesis'];
