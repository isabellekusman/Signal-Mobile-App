
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onSubscribe: (tier: 'seeker' | 'signal') => void;
    onStartTrial: () => void;
    showCloseButton?: boolean;
    isTrialActive?: boolean;
}

const PINK = '#ec4899';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#F2F2F7';
const WHITE = '#FFFFFF';
const DARK = '#1C1C1E';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function PaywallModal({ visible, onClose, onSubscribe, onStartTrial, showCloseButton = true, isTrialActive = true }: PaywallModalProps) {
    const isExpired = !isTrialActive;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={showCloseButton ? onClose : undefined}
        >
            <SafeAreaView style={s.container}>
                {showCloseButton && (
                    <View style={s.header}>
                        <TouchableOpacity onPress={onClose} style={s.closeButton}>
                            <Ionicons name="close" size={24} color={DARK} />
                        </TouchableOpacity>
                    </View>
                )}

                <View style={[s.content, !showCloseButton && { paddingTop: 60 }]}>
                    <View style={s.topSection}>
                        <Text style={s.title}>{isExpired ? 'Your Free Tier is Up' : 'Clarity Awaits'}</Text>
                        <Text style={s.subtitle}>
                            {isExpired
                                ? 'Your evaluation period has ended. Choose a plan to maintain full access to behavioral analysis.'
                                : 'Stop guessing. Start knowing. Decode mixed signals, align your stars, and gain certainty on where you stand.'}
                        </Text>
                    </View>

                    <View style={s.middleSection}>
                        {/* Tier: The Seeker */}
                        <TouchableOpacity
                            style={[s.tierCard, { borderColor: '#E5E5EA', borderWidth: 1, backgroundColor: '#FFFFFF' }]}
                            onPress={() => onSubscribe('seeker')}
                        >
                            <View style={s.tierInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={s.tierName}>THE SEEKER</Text>
                                    <Text style={s.tierPrice}>$9.99<Text style={{ fontSize: 14, color: GRAY, fontWeight: '500' }}> / mo</Text></Text>
                                </View>
                                <Text style={{ fontSize: 13, color: '#3A3A3C', fontWeight: '500', marginBottom: 14, marginTop: 6, lineHeight: 18 }}>
                                    Essential clarity. Find out if they're actually busy, or just making excuses.
                                </Text>

                                <View style={s.benefitRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Decode texts & uncover the real subtext</Text>
                                </View>
                                <View style={s.benefitRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Daily astrological compatibility charts</Text>
                                </View>
                                <View style={s.benefitRow}>
                                    <Ionicons name="checkmark-circle" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Up to 15 deep AI insights per day</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Tier: The Signal */}
                        <TouchableOpacity
                            style={[s.tierCard, { backgroundColor: '#FFF0F6', borderColor: PINK, borderWidth: 2 }]}
                            onPress={() => onSubscribe('signal')}
                        >
                            <View style={{ position: 'absolute', top: -12, right: 24, backgroundColor: PINK, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: WHITE, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>BEST VALUE</Text>
                            </View>
                            <View style={s.tierInfo}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={[s.tierName, { color: PINK }]}>THE SIGNAL</Text>
                                    <Text style={s.tierPrice}>$19.99<Text style={{ fontSize: 14, color: GRAY, fontWeight: '500' }}> / mo</Text></Text>
                                </View>
                                <Text style={{ fontSize: 13, color: '#3A3A3C', fontWeight: '500', marginBottom: 14, marginTop: 6, lineHeight: 18 }}>
                                    Master your connections. Uncover long-term patterns and stop wasting your energy.
                                </Text>

                                <View style={s.benefitRow}>
                                    <Ionicons name="infinite" size={16} color={PINK} />
                                    <Text style={[s.tierBenefit, { fontWeight: '700', color: DARK }]}>Unlimited daily AI insights</Text>
                                </View>
                                <View style={s.benefitRow}>
                                    <Ionicons name="analytics" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Unlock Monthly & Weekly behavior patterns</Text>
                                </View>
                                <View style={s.benefitRow}>
                                    <Ionicons name="planet" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Deep-dive cosmic push/pull dynamics</Text>
                                </View>
                                <View style={s.benefitRow}>
                                    <Ionicons name="flash" size={16} color={PINK} />
                                    <Text style={s.tierBenefit}>Priority AI processing speed</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={s.bottomSection}>
                        {!isExpired && (
                            <>
                                <View style={s.trialInfo}>
                                    <Text style={s.trialText}>Includes a 1-week free trial for all new subscribers.</Text>
                                </View>

                                <TouchableOpacity style={s.primaryButton} onPress={onStartTrial}>
                                    <Text style={s.primaryButtonText}>Start 7-Day Free Trial</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <Text style={s.footer}>
                            Cancel anytime in your App Store settings.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: WHITE,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 24 : 12,
        paddingHorizontal: 16,
        alignItems: 'flex-end',
    },
    closeButton: {
        padding: 8,
        backgroundColor: '#F2F2F7',
        borderRadius: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    topSection: {
        marginBottom: 8,
    },
    middleSection: {
        flex: 1,
        justifyContent: 'center',
    },
    bottomSection: {
        paddingBottom: Platform.OS === 'ios' ? 20 : 32,
    },
    title: {
        fontSize: 32,
        fontFamily: SERIF,
        color: DARK,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: GRAY,
        lineHeight: 22,
        fontFamily: SERIF,
    },
    tierCard: {
        backgroundColor: LIGHT_GRAY,
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: DARK,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    tierInfo: {
        flex: 1,
    },
    tierName: {
        fontSize: 12,
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 1.5,
    },
    tierPrice: {
        fontSize: 20,
        fontWeight: '800',
        color: DARK,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 6,
        gap: 8,
    },
    tierBenefit: {
        fontSize: 13,
        color: '#3A3A3C',
        flex: 1,
        lineHeight: 18,
    },
    trialInfo: {
        marginBottom: 20,
        alignItems: 'center',
    },
    trialText: {
        fontSize: 14,
        color: DARK,
        fontWeight: '600',
        textAlign: 'center',
    },
    primaryButton: {
        backgroundColor: PINK,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: PINK,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    primaryButtonText: {
        color: WHITE,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
    },
    footer: {
        marginTop: 20,
        textAlign: 'center',
        fontSize: 12,
        color: GRAY,
    },
});
