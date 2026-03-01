import { Ionicons } from '@expo/vector-icons';
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

    // Don't render if user is already on Signal tier
    if (currentTier === 'signal') return null;

    const featureLabel = FEATURE_LABELS[feature] || feature;

    let copy = '';
    if (targetTier === 'signal') {
        copy = 'Upgrade to Signal for deeper analysis';
    } else if (targetTier === 'seeker' && currentTier === 'free') {
        copy = `Upgrade to Seeker to unlock ${featureLabel}`;
    }

    if (!copy) return null;

    return (
        <TouchableOpacity
            style={s.container}
            activeOpacity={0.7}
            onPress={() => setShowPaywall('voluntary')}
        >
            <View style={s.inner}>
                <Ionicons name="sparkles" size={14} color={PINK} />
                <Text style={s.text}>{copy}</Text>
                <Ionicons name="chevron-forward" size={14} color={GRAY} />
            </View>
        </TouchableOpacity>
    );
}

/**
 * LockedFeatureCard — shown when a feature is completely gated.
 * Displays a locked state with upgrade CTA that opens the paywall.
 */
export function LockedFeatureCard({ title, description }: { title: string; description: string }) {
    const { setShowPaywall } = useConnections();

    return (
        <View style={s.lockedCard}>
            <View style={s.lockedIconWrap}>
                <Ionicons name="lock-closed" size={24} color={PINK} />
            </View>
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
    container: {
        marginTop: 16,
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FDF2F8',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    text: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: DARK,
        fontFamily: SERIF,
    },
    // Locked Feature Card
    lockedCard: {
        alignItems: 'center',
        padding: 32,
        marginVertical: 16,
        backgroundColor: '#FAFAFA',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    lockedIconWrap: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    lockedTitle: {
        fontSize: 16,
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
        marginBottom: 20,
        paddingHorizontal: 16,
    },
    lockedButton: {
        backgroundColor: DARK,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 24,
    },
    lockedButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
});
