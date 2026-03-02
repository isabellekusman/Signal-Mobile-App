import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Defs, Rect, Stop, Svg, LinearGradient as SvgLinearGradient } from 'react-native-svg';

interface LockedFeatureCardProps {
    featureName: string;
    previewText?: string;
    requiredTier: "seeker" | "signal";
    onUnlockPress: () => void;
}

const STATIC_PREVIEWS: Record<string, string> = {
    "Daily Advice": "Consider pulling back your availability this week. His pattern suggests he responds more when...",
    "Stars Align": "Your Venus placement creates an interesting tension with his Aquarius energy. This week's transit...",
    "Clarity Chat": "Based on the recent pattern of messages, there's an underlying dynamic of...",
    "Decoder": "The subtext here suggests more than what's being said directly. Reading between the lines...",
    "Pattern Insights": "Over the last 30 days, a recurring pattern of avoidance has emerged every third Tuesday. This suggests that..."
};

const LockedFeatureCard: React.FC<LockedFeatureCardProps> = ({
    featureName,
    previewText,
    requiredTier,
    onUnlockPress,
}) => {
    const tierLabel = requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1);
    const displayPreview = previewText || STATIC_PREVIEWS[featureName] || "Unlock to see your deep analysis...";

    return (
        <View style={styles.card}>
            {/* Preview Content Container */}
            <View style={styles.previewContainer}>
                <Text style={styles.previewText} numberOfLines={3}>
                    {displayPreview}
                </Text>

                {/* Fade Overlay */}
                <View style={StyleSheet.absoluteFill}>
                    <Svg height="100%" width="100%">
                        <Defs>
                            <SvgLinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="white" stopOpacity="0" />
                                <Stop offset="0.4" stopColor="white" stopOpacity="0" />
                                <Stop offset="0.9" stopColor="white" stopOpacity="1" />
                            </SvgLinearGradient>
                        </Defs>
                        <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
                    </Svg>
                </View>

                {/* Content Overlay (Centered on the fade) */}
                <View style={[StyleSheet.absoluteFill, styles.overlay]}>
                    <Ionicons name="lock-closed" size={20} color="#8E8E93" />
                    <Text style={styles.lockLabel}>
                        Unlock {featureName} — {tierLabel} & above
                    </Text>

                    <TouchableOpacity
                        style={styles.pillButton}
                        onPress={onUnlockPress}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.pillButtonText}>View Plans</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 20,
        overflow: 'hidden',
        // Subtle shadow to match "Today's Briefing" if it had any, 
        // but based on code it's just border. Adding very subtle one for "premium" feel.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    previewContainer: {
        height: 110, // Sufficient for ~2.5-3 lines of text
        position: 'relative',
    },
    previewText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#1C1C1E',
        opacity: 0.2, // Very faded preview
    },
    overlay: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 4,
    },
    lockLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 6,
        marginBottom: 14,
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    pillButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#1C1C1E',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 16,
        width: '100%',
        maxWidth: 160,
        alignItems: 'center',
    },
    pillButtonText: {
        fontSize: 11,
        color: '#1C1C1E',
        fontWeight: '400', // Lighter weight as requested
        letterSpacing: 0.5,
    },
});

export default LockedFeatureCard;
