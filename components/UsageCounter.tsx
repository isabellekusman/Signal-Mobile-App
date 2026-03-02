import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SubscriptionTier, getTierLimits } from '../constants/limits';
import { useConnections } from '../context/ConnectionsContext';
import { fontSize as fs, spacing } from '../utils/responsive';

interface UsageCounterProps {
    feature: string;
    style?: any;
}

export const UsageCounter: React.FC<UsageCounterProps> = ({ feature, style }) => {
    const { subscriptionTier, isTrialActive, usageCounts } = useConnections();

    // Signal tier doesn't see counters
    if (subscriptionTier === 'signal') return null;

    const limits = getTierLimits(subscriptionTier as SubscriptionTier, isTrialActive);
    const limit = (limits as any)[feature];

    // Don't show if limit is 0 (it will be handled by LockedFeatureCard/Immediate prompt)
    if (limit === 0) return null;

    const count = usageCounts[feature] || 0;
    const remaining = Math.max(0, limit - count);

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.text}>
                {remaining} {remaining === 1 ? 'MESSAGE' : 'MESSAGES'} LEFT TODAY
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: spacing(4),
        paddingHorizontal: spacing(8),
        borderRadius: spacing(4),
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
        alignSelf: 'flex-start',
        marginBottom: spacing(8),
    },
    text: {
        fontSize: fs(9),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
    }
});
