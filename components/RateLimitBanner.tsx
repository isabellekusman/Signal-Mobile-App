import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../context/ConnectionsContext';

const PINK = '#ec4899';
const DARK = '#1C1C1E';
const GRAY = '#8E8E93';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

const LIGHT_GRAY = '#F2F2F7';

/**
 * Feature-specific copy for the rate limit banner.
 * Keys match the feature names used in RATE_LIMITS on the backend.
 */
const FEATURE_COPY: Record<string, { title: string; message: string; upgradeTier: string }> = {
    clarity: {
        title: 'Clarity Chats',
        message: "You've used all your free Clarity chats for today.",
        upgradeTier: 'Seeker',
    },
    decoder: {
        title: 'Decoder',
        message: "You've used all your free Decodes for today.",
        upgradeTier: 'Seeker',
    },
    stars: {
        title: 'Stars Align',
        message: "You've used all your Stars Align readings for today.",
        upgradeTier: 'Signal',
    },
    dynamic: {
        title: 'Dynamic Check-in',
        message: "You've used all your free Dynamic check-ins for today.",
        upgradeTier: 'Seeker',
    },
    daily_advice: {
        title: 'Daily Advice',
        message: "You've used all your free Daily Advice for today.",
        upgradeTier: 'Seeker',
    },
    objective: {
        title: 'Objective Check-in',
        message: "You've used all your free Objective check-ins for today.",
        upgradeTier: 'Seeker',
    },
    log_synthesis: {
        title: 'Pattern Insights',
        message: "You've exhausted your Pattern Insights for today.",
        upgradeTier: 'Signal',
    },
};

interface RateLimitBannerProps {
    feature: string;
    onDismiss?: () => void;
}

export default function RateLimitBanner({ feature, onDismiss }: RateLimitBannerProps) {
    const { setShowPaywall } = useConnections();
    const copy = FEATURE_COPY[feature] || {
        title: 'This Feature',
        message: "You've reached your daily limit for this feature.",
        upgradeTier: 'Seeker',
    };

    return (
        <View style={s.lockedCard}>
            <Text style={s.lockedTitle}>{copy.title}</Text>
            <Text style={s.lockedDescription}>{copy.message}</Text>
            <TouchableOpacity
                style={s.lockedButton}
                activeOpacity={0.8}
                onPress={() => setShowPaywall('voluntary')}
            >
                <Text style={s.lockedButtonText}>VIEW PLANS</Text>
            </TouchableOpacity>

            {onDismiss && (
                <TouchableOpacity style={s.dismiss} onPress={onDismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={16} color={GRAY} />
                </TouchableOpacity>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    lockedCard: {
        alignItems: 'center',
        paddingVertical: 36,
        paddingHorizontal: 24,
        position: 'relative',
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
    dismiss: {
        position: 'absolute',
        top: 12,
        right: 12,
    },
});
