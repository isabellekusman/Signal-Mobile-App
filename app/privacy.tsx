
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DARK = '#1C1C1E';
const GRAY = '#8E8E93';
const SOFT_GRAY = '#C7C7CC';
const LIGHT_GRAY = '#F2F2F7';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function PrivacyScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={s.container}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={DARK} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Privacy Policy</Text>
            </View>

            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={s.title}>Privacy Policy for Signal</Text>
                <Text style={s.date}>Effective Date: February 20, 2026</Text>

                <Text style={s.body}>
                    Signal ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and share information when you use the Signal Mobile Application (the "App").
                </Text>

                <Text style={s.sectionHeader}>1. Information We Collect</Text>
                <Text style={s.subSectionHeader}>A. Information You Provide</Text>
                <Text style={s.listItem}>• Account Data: Email address and password when you create an account.</Text>
                <Text style={s.listItem}>• Profile Data: Name, zodiac sign, relationship standards, boundaries, and attachment styles.</Text>
                <Text style={s.listItem}>• Connection Data: Information you log about your relationships, including names, icons, and signal observations.</Text>
                <Text style={s.listItem}>• Communication Log Data: Text or images you upload for AI "Decoding" and analysis.</Text>

                <Text style={s.subSectionHeader}>B. Automatically Collected Data</Text>
                <Text style={s.listItem}>• Device Information: Device model, operating system, and unique device identifiers.</Text>
                <Text style={s.listItem}>• Usage Data: Frequency of App use, features accessed, and subscription status.</Text>
                <Text style={s.listItem}>• Push Notification Tokens: We collect device tokens to send you relationship insights and reminders.</Text>

                <Text style={s.sectionHeader}>2. How We Use Your Information</Text>
                <Text style={s.listItem}>• To Provide the Service: Using AI to analyze your relationship signals and provide insights.</Text>
                <Text style={s.listItem}>• To Improve the App: Developing new features and optimizing AI response accuracy.</Text>
                <Text style={s.listItem}>• Personalization: Tailoring astrological and behavioral insights to your profile.</Text>
                <Text style={s.listItem}>• Safety & Security: Detecting and preventing abuse or prompt injection attacks.</Text>
                <Text style={s.listItem}>• Communication: Sending you relevant updates and notifications.</Text>

                <Text style={s.sectionHeader}>3. Data Processing & AI</Text>
                <Text style={s.body}>
                    Signal utilizes Google Gemini AI to process and analyze the text and images you provide.
                </Text>
                <Text style={s.listItem}>• Your relationship data is sent to AI models for processing.</Text>
                <Text style={s.listItem}>• Disclaimer: AI-generated content is for reflection only and does not constitute clinical psychological advice or factual truth.</Text>

                <Text style={s.sectionHeader}>4. Data Sharing & Third Parties</Text>
                <Text style={s.body}>
                    We do not sell your personal data. We share information with service providers only as necessary:
                </Text>
                <Text style={s.listItem}>• Supabase: For database hosting, authentication, and secure data persistence.</Text>
                <Text style={s.listItem}>• Google Cloud (Gemini): For AI processing.</Text>
                <Text style={s.listItem}>• RevenueCat: For managing App Store subscriptions and payments.</Text>
                <Text style={s.listItem}>• Sentry: For error logging and performance monitoring.</Text>

                <Text style={s.sectionHeader}>5. Your Rights (GDPR/CCPA)</Text>
                <Text style={s.body}>
                    Depending on your location, you may have the following rights:
                </Text>
                <Text style={s.listItem}>• Access & Portability: You can export your data at any time via the "Me" screen in the App.</Text>
                <Text style={s.listItem}>• Deletion: You can permanently delete your account and all associated data via the App settings.</Text>

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
    subSectionHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: DARK,
        marginTop: 16,
        marginBottom: 8,
        fontFamily: SERIF,
    },
    body: {
        fontSize: 16,
        color: DARK,
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
