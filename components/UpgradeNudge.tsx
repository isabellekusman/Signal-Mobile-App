import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../context/ConnectionsContext';

const PINK = '#ec4899';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#F2F2F7';
const DARK = '#1C1C1E';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const FEATURE_LABELS: Record<string, string> = {
    clarity: 'Clarity Chat',
    decoder: 'Decoder',
    stars: 'Stars Align',
    daily_advice: 'Daily Advice',
    dynamic: 'Dynamic',
    objective: 'Objective Check-in',
};

interface UpgradeNudgeProps {
    feature: string;
    currentTier: string;
    targetTier?: 'seeker' | 'signal';
}

export default function UpgradeNudge({ feature, currentTier, targetTier = 'signal' }: UpgradeNudgeProps) {
    const { setShowPaywall } = useConnections();

    if (currentTier === 'signal') return null;

    const FEATURE_COPY: Record<string, string> = {
        clarity: 'Unlock deep conversational analysis and endless Clarity chats',
        decoder: 'Scan endlessly to reveal hidden tone and dynamic shifts',
        stars: 'Full cosmic breakdown & push-pull astrological dynamics',
        daily_advice: 'Personalized action steps & proactive relationship alerts',
        dynamic: 'Track unlimited check-ins for long-term behavioral patterns',
        objective: 'Cut through feelings to get the data-driven grounded truth',
        log_synthesis: 'Unlock pattern insights to see what your logs actually mean',
    };

    let copy = '';
    if (targetTier === 'signal') {
        copy = FEATURE_COPY[feature] || 'Full experience';
    } else if (targetTier === 'seeker' && currentTier === 'free') {
        copy = `Unlock ${FEATURE_LABELS[feature] || feature}`;
    }

    if (!copy) return null;

    const title = FEATURE_LABELS[feature] || 'Upgrade';

    return (
        <View style={s.lockedCard}>
            <View style={s.lockedDot} />
            <Text style={s.lockedTitle}>{title}</Text>
            <Text style={s.lockedDescription}>{copy}</Text>
            <TouchableOpacity
                style={s.lockedButton}
                activeOpacity={0.8}
                onPress={() => setShowPaywall('voluntary')}
            >
                <Text style={s.lockedButtonText}>VIEW PLANS</Text>
            </TouchableOpacity>
        </View>
    );
}

/**
 * LockedFeatureCard — shown when a feature is completely gated.
 */
export function LockedFeatureCard({ title, description }: { title: string; description: string }) {
    const { setShowPaywall } = useConnections();

    return (
        <View style={s.lockedCard}>
            <View style={s.lockedDot} />
            <Text style={s.lockedTitle}>{title}</Text>
            <Text style={s.lockedDescription}>{description}</Text>
            <TouchableOpacity
                style={s.lockedButton}
                activeOpacity={0.8}
                onPress={() => setShowPaywall('voluntary')}
            >
                <Text style={s.lockedButtonText}>VIEW PLANS</Text>
            </TouchableOpacity>
        </View>
    );
}

const s = StyleSheet.create({
    // ── Upgrade Nudge ──
    container: {
        marginTop: 20,
        marginBottom: 4,
        borderTopWidth: 1,
        borderTopColor: LIGHT_GRAY,
        paddingTop: 16,
        alignItems: 'center',
    },
    label: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 2,
        color: PINK,
        marginBottom: 4,
    },
    copy: {
        fontSize: 14,
        fontFamily: SERIF,
        fontStyle: 'italic',
        color: DARK,
        textAlign: 'center',
    },

    // ── Locked Feature Card ──
    lockedCard: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
    },
    lockedDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: PINK,
        marginBottom: 16,
    },
    lockedTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: DARK,
        fontFamily: SERIF,
        marginBottom: 8,
        textAlign: 'center',
    },
    lockedDescription: {
        fontSize: 13,
        color: GRAY,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    lockedButton: {
        borderWidth: 1,
        borderColor: DARK,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 24,
    },
    lockedButtonText: {
        color: DARK,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
});
