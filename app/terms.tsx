
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DARK = '#1C1C1E';
const GRAY = '#8E8E93';
const SOFT_GRAY = '#C7C7CC';
const LIGHT_GRAY = '#F2F2F7';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function TermsScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={DARK} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Terms of Service</Text>
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.title}>Terms of Service for Signal</Text>
                <Text style={s.date}>Effective Date: February 20, 2026</Text>

                <Text style={s.body}>
                    By using the Signal Mobile Application ("Signal"), you agree to these Terms of Service. Please read them carefully.
                </Text>

                <Text style={s.sectionHeader}>1. Acceptance of Terms</Text>
                <Text style={s.body}>
                    By creating an account or using any part of Signal, you agree to be bound by these Terms. If you do not agree, you may not use the App.
                </Text>

                <Text style={s.sectionHeader}>2. Description of Service</Text>
                <Text style={s.body}>
                    Signal is an AI-powered relationship analysis tool. It provides behavioral decoding, astrological insights, and emotional tracking based on user-provided data.
                </Text>

                <Text style={s.sectionHeader}>3. AI Disclaimer & Limitation of Liability</Text>
                <Text style={s.warningBody}>
                    IMPORTANT: Signal utilizes Artificial Intelligence to analyze human behavior and relationship dynamics.
                </Text>
                <Text style={s.listItem}>• Accuracy: AI-generated content can be inaccurate, biased, or entirely fictional.</Text>
                <Text style={s.listItem}>• Not Professional Advice: Information provided by Signal does not constitute psychological, clinical, medical, or legal advice.</Text>
                <Text style={s.listItem}>• User Responsibility: You are solely responsible for actions taken based on Signal's insights.</Text>

                <Text style={s.sectionHeader}>4. User Content & Conduct</Text>
                <Text style={s.body}>
                    You retain ownership of the data you upload. You grant Signal a license to process your content via third-party AI providers (e.g., Google Gemini) to provide the service.
                </Text>

                <Text style={s.sectionHeader}>5. Subscriptions & Payments</Text>
                <Text style={s.body}>
                    Signal offers premium features via subscriptions managed by RevenueCat and the App Stores. Subscriptions auto-renew unless canceled.
                </Text>

                <Text style={s.sectionHeader}>6. Account Termination</Text>
                <Text style={s.body}>
                    We reserve the right to suspend or terminate accounts that violate these Terms.
                </Text>

                <View style={{ height: 60 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    backBtn: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: DARK,
        marginLeft: 15,
        fontFamily: SERIF,
    },
    scrollContent: {
        padding: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: DARK,
        fontFamily: SERIF,
        marginBottom: 8,
    },
    date: {
        fontSize: 14,
        color: GRAY,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: '700',
        color: DARK,
        marginTop: 32,
        marginBottom: 12,
        fontFamily: SERIF,
    },
    body: {
        fontSize: 16,
        color: DARK,
        lineHeight: 24,
        marginBottom: 16,
        fontFamily: SERIF,
    },
    warningBody: {
        fontSize: 16,
        color: '#EF4444',
        fontWeight: '700',
        lineHeight: 24,
        marginBottom: 16,
        fontFamily: SERIF,
    },
    listItem: {
        fontSize: 15,
        color: DARK,
        lineHeight: 22,
        marginBottom: 10,
        paddingLeft: 10,
        fontFamily: SERIF,
    },
});
