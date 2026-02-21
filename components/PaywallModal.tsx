
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
    showCloseButton?: boolean;
}

const PINK = '#ec4899';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#F2F2F7';
const WHITE = '#FFFFFF';
const DARK = '#1C1C1E';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function PaywallModal({ visible, onClose, onSubscribe, showCloseButton = true }: PaywallModalProps) {
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
                    <Text style={s.title}>Clarity Awaits</Text>
                    <Text style={s.subtitle}>
                        Choose your level of insight and unlock full behavioral decoding for every connection.
                    </Text>

                    {/* Tier: The Seeker */}
                    <TouchableOpacity
                        style={s.tierCard}
                        onPress={() => onSubscribe('seeker')}
                    >
                        <View style={s.tierInfo}>
                            <Text style={s.tierName}>THE SEEKER</Text>
                            <Text style={s.tierPrice}>$9.99 / month</Text>
                            <Text style={s.tierBenefit}>25 Daily Decodes</Text>
                            <Text style={s.tierBenefit}>Full Analysis Access</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={PINK} />
                    </TouchableOpacity>

                    {/* Tier: The Signal */}
                    <TouchableOpacity
                        style={s.tierCard}
                        onPress={() => onSubscribe('signal')}
                    >
                        <View style={s.tierInfo}>
                            <Text style={s.tierName}>THE SIGNAL</Text>
                            <Text style={s.tierPrice}>$19.99 / month</Text>
                            <Text style={s.tierBenefit}>Unlimited Decodes</Text>
                            <Text style={s.tierBenefit}>Priority Access</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={PINK} />
                    </TouchableOpacity>

                    <View style={s.trialInfo}>
                        <Text style={s.trialText}>Includes a 1-week free trial for all new subscribers.</Text>
                    </View>

                    <TouchableOpacity style={s.primaryButton} onPress={() => onSubscribe('signal')}>
                        <Text style={s.primaryButtonText}>Start 7-Day Free Trial</Text>
                    </TouchableOpacity>

                    <Text style={s.footer}>
                        Cancel anytime in your App Store settings.
                    </Text>
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
        padding: 20,
        alignItems: 'flex-start',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    title: {
        fontSize: 36,
        fontFamily: SERIF,
        color: DARK,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: GRAY,
        lineHeight: 24,
        marginBottom: 40,
        fontFamily: SERIF,
    },
    tierCard: {
        backgroundColor: LIGHT_GRAY,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    tierInfo: {
        flex: 1,
    },
    tierName: {
        fontSize: 10,
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    tierPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: DARK,
        marginBottom: 12,
    },
    tierBenefit: {
        fontSize: 14,
        color: GRAY,
        marginBottom: 4,
    },
    trialInfo: {
        marginTop: 20,
        marginBottom: 32,
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
        marginTop: 24,
        textAlign: 'center',
        fontSize: 12,
        color: GRAY,
    },
});
