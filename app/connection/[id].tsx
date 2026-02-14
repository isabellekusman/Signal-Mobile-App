
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Mock chips for the Clarity tab
const CHIPS = [
    "DELAYED REPLY",
    "MIXED SIGNALS",
    "OVERTHINKING",
    "AVOIDANT ENERGY",
    "SUDDEN DISTANCE"
];

// Content Component for the "Clarity" tab (Default)
const ClarityContent = () => (
    <View style={styles.contentSection}>
        <Text style={styles.contentTitle}>What's on your mind?</Text>
        <Text style={styles.contentSubtitle}>We'll parse the signal from the noise. Just tell us what happened.</Text>

        <View style={styles.inputArea}>
            <Text style={styles.placeholderText}>He said he'd call, but...</Text>
        </View>

        <View style={styles.chipsContainer}>
            {CHIPS.map((chip, index) => (
                <TouchableOpacity key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>TALK IT THROUGH</Text>
        </TouchableOpacity>
    </View>
);

// Content Component for the "Decoder" tab
const DecoderContent = () => (
    <View style={styles.decoderContainer}>
        <View style={styles.decoderCard}>
            <Text style={styles.decoderTitle}>Decoder</Text>
            <Text style={styles.decoderSubtitle}>
                Paste a text or thread to check tone, effort, and what's actually being said.
            </Text>

            <TextInput
                style={styles.decoderInput}
                placeholder="Paste text here..."
                placeholderTextColor="#A1A1AA"
                multiline
                textAlignVertical="top"
            />

            <TouchableOpacity style={styles.scanButton}>
                <Text style={styles.scanButtonText}>SCAN TEXT</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimerText}>
                THIS IS AN OBSERVATIONAL READ ON TONE & EFFORT, NOT A FACT.
            </Text>
        </View>
    </View>
);

// Content Component for the "Stars" tab
const StarsContent = ({ name }: { name: string }) => (
    <View style={styles.starsContainer}>
        <View style={styles.starsCard}>
            {/* Header with Title and Date */}
            <View style={styles.starsHeader}>
                <View style={styles.starsTitleBlock}>
                    <View style={styles.starIconContainer}>
                        <Ionicons name="star" size={16} color="#7C3AED" />
                    </View>
                    <View>
                        <Text style={styles.starsTitleMain}>Stars</Text>
                        <Text style={styles.starsTitleSub}>Align</Text>
                        <Text style={styles.starsForecastLabel}>FORECAST FOR {name.toUpperCase()}</Text>
                    </View>
                </View>
                <View style={styles.starsDateBlock}>
                    <Text style={styles.starsDateText}>FRI, FEB 13</Text>
                    <TouchableOpacity style={styles.refreshButton}>
                        <Ionicons name="refresh" size={12} color="#7C3AED" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Forecast Text */}
            <Text style={styles.forecastText}>
                A push-pull dynamic, where your grounded practicality (Capricorn) meets his desire for balance (Libra). The challenge is navigating his need for harmony with your goal-oriented focus.
            </Text>
            <Text style={styles.relationshipDynamicLabel}>RELATIONSHIP DYNAMIC</Text>

            {/* Cards Layout */}
            <View style={styles.starsGrid}>
                {/* Left Column: Avoid & Mindset */}
                <View style={styles.starsLeftColumn}>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightLabel}>LIKELY MINDSET</Text>
                        <Text style={styles.insightText}>
                            Appreciation for his efforts to keep things 'fair' and a willingness to engage in lighthearted social activities. He needs to feel admired.
                        </Text>
                    </View>
                    <View style={styles.insightCard}>
                        <Text style={styles.insightLabel}>AVOID</Text>
                        <Text style={styles.insightText}>
                            Direct criticism or being made to feel like he's failing to meet your standards. He will withdraw from confrontation.
                        </Text>
                    </View>
                </View>

                {/* Right Column: Strategy (Blue) */}
                <View style={styles.strategyCard}>
                    <View style={styles.strategyHeader}>
                        <Text style={styles.strategyLabel}>STRATEGY</Text>
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.decodeCosmosLink}>DECODE THE COSMOS</Text>
                            <Ionicons name="arrow-forward" size={10} color="#7C3AED" style={{ marginLeft: 2 }} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.strategyText}>
                        "Leverage your Capricorn discipline to plan something social and elegant that aligns with his aesthetic. Control the setting, and he'll be more likely to want to keep the peace."
                    </Text>
                </View>
            </View>
        </View>
        <Text style={styles.starsFooterDisclaimer}>* ASTROLOGY DESCRIBES TENDENCIES, NOT EFFORT.</Text>
    </View>
);

// Helper for Dynamic Circles
const RatingCircles = ({ filled = 3, total = 5 }: { filled?: number, total?: number }) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
        {[...Array(total)].map((_, i) => (
            <View
                key={i}
                style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: i < filled ? '#F472B6' : '#F4F4F5', // pink-400 : zinc-100
                    borderColor: i < filled ? '#F472B6' : '#F4F4F5',
                    borderWidth: 1
                }}
            />
        ))}
    </View>
);

// Content Component for the "Dynamic" tab
const DynamicContent = () => (
    <View style={styles.dynamicContainer}>
        <View style={styles.dynamicCard}>
            <Text style={styles.dynamicTitle}>What was his vibe today?</Text>

            {/* Slider Section */}
            <View style={styles.sliderSection}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={styles.sliderLabel}>OVERALL VIBE</Text>
                    <Text style={styles.sliderValue}>50%</Text>
                </View>
                {/* Visual Slider */}
                <View style={{ height: 4, backgroundColor: '#F4F4F5', borderRadius: 2, position: 'relative', marginVertical: 10 }}>
                    <View style={{ position: 'absolute', left: '50%', width: 16, height: 16, borderRadius: 8, backgroundColor: '#3B82F6', top: -6, transform: [{ translateX: -8 }] }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.sliderRangeLabel}>OFF</Text>
                    <Text style={styles.sliderRangeLabel}>ALIGNED</Text>
                </View>
            </View>

            <Text style={styles.sectionHeader}>WHAT YOU NOTICED</Text>

            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
                {/* Row 1 */}
                <View style={styles.metricRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.metricLabel}>SAFETY</Text>
                            <Text style={styles.metricScore}>3/5</Text>
                        </View>
                        <RatingCircles filled={3} total={5} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.metricLabel}>CLARITY</Text>
                            <Text style={styles.metricScore}>3/5</Text>
                        </View>
                        <RatingCircles filled={3} total={5} />
                    </View>
                </View>

                {/* Row 2 */}
                <View style={styles.metricRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.metricLabel}>EXCITEMENT</Text>
                            <Text style={styles.metricScore}>3/5</Text>
                        </View>
                        <RatingCircles filled={3} total={5} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <Text style={styles.metricLabel}>REGULATION</Text>
                            <Text style={styles.metricScore}>3/5</Text>
                        </View>
                        <RatingCircles filled={3} total={5} />
                    </View>
                </View>
            </View>

            {/* Reflection Input */}
            <TextInput
                style={styles.reflectionInput}
                placeholder="What happened? Tap to reflect..."
                placeholderTextColor="#D1D1D6"
            />

            {/* Save Button */}
            <TouchableOpacity style={styles.saveCheckInButton}>
                <Text style={styles.saveCheckInText}>SAVE CHECK-IN</Text>
            </TouchableOpacity>

        </View>

        <Text style={styles.pastLogsHeader}>PAST LOGS</Text>
        <Text style={styles.emptyStateText}>No feelings logged yet. Start tracking your intuition.</Text>
    </View>
);


export default function ConnectionDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<'CLARITY' | 'DECODER' | 'STARS' | 'DYNAMIC'>('CLARITY');

    // Destructure params with fallbacks
    const { name = 'sam', tag = 'SITUATIONSHIP', zodiac = 'LIBRA', icon = 'leaf-outline' } = params;

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Navigation Header */}
                    <View style={styles.navHeader}>
                        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="arrow-back" size={12} color="#8E8E93" style={{ marginRight: 4 }} />
                                <Text style={styles.navText}>BACK TO CONNECTIONS</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity>
                            <Text style={styles.navText}>EDIT CONNECTION</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Section - Keeping it visible but maybe we can scroll it away or keep it small */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name={icon as any} size={80} color="#8E8E93" />
                            <View style={styles.zodiacBadge}>
                                <Text style={styles.zodiacText}>{zodiac}</Text>
                            </View>
                        </View>

                        <Text style={styles.profileName}>{name}</Text>

                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        {['CLARITY', 'DECODER', 'STARS', 'DYNAMIC'].map((tab) => (
                            <TouchableOpacity
                                key={tab}
                                style={activeTab === tab ? styles.activeTab : styles.inactiveTab}
                                onPress={() => setActiveTab(tab as any)}
                            >
                                <Text style={activeTab === tab ? styles.activeTabText : styles.inactiveTabText}>
                                    {tab}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Dynamic Content Rendering */}
                    {activeTab === 'CLARITY' && <ClarityContent />}
                    {activeTab === 'DECODER' && <DecoderContent />}
                    {activeTab === 'STARS' && <StarsContent name={Array.isArray(name) ? name[0] : name} />}
                    {activeTab === 'DYNAMIC' && <DynamicContent />}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    container: {
        paddingBottom: 40,
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginBottom: 20,
    },
    navText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1.5,
        borderColor: '#FCE7F3', // pink-100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    zodiacBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    zodiacText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ec4899', // pink-500
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    profileName: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36, // Reduced size
        color: '#1C1C1E',
        marginBottom: 16,
    },
    tagBadge: {
        backgroundColor: '#FCE7F3', // pink-100
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ec4899', // pink-500
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    activeTab: {
        paddingVertical: 8,
        borderBottomWidth: 0,
    },
    activeTabText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inactiveTab: {
        paddingVertical: 8,
    },
    inactiveTabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#C7C7CC',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    contentSection: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    contentTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: '#1C1C1E',
        marginBottom: 16,
        textAlign: 'center',
    },
    contentSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 20,
        maxWidth: 280,
    },
    inputArea: {
        marginBottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    placeholderText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 28,
        color: '#E5E5EA',
        textAlign: 'center',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 50,
        paddingHorizontal: 10,
    },
    chip: {
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    actionButton: {
        backgroundColor: '#000000',
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: 'auto',
        minWidth: 200,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    // Decoder Styles
    decoderContainer: {
        paddingHorizontal: 20,
    },
    decoderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    decoderTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        marginBottom: 12,
    },
    decoderSubtitle: {
        fontSize: 14,
        lineHeight: 20,
        color: '#8E8E93',
        marginBottom: 24,
    },
    decoderInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        height: 180,
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#1C1C1E',
        marginBottom: 24,
    },
    scanButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FCE7F3', // Light pink border
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    scanButtonText: {
        color: '#1C1C1E',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    disclaimerText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#D1D1D6', // Very light gray text
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Stars Styles
    starsContainer: {
        paddingHorizontal: 20,
    },
    starsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 16,
    },
    starsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    starsTitleBlock: {
        flexDirection: 'row',
    },
    starIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#EBE7FE', // lavender-100
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    starsTitleMain: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
    },
    starsTitleSub: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        lineHeight: 24,
        marginBottom: 4,
    },
    starsForecastLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    starsDateBlock: {
        alignItems: 'flex-end',
    },
    starsDateText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    refreshButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#EBE7FE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    forecastText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 20, // Large distinct font per screenshot
        color: '#1C1C1E',
        lineHeight: 28,
        marginBottom: 16,
        textAlign: 'left', // Keep left aligned for readable paragraph
    },
    relationshipDynamicLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7C3AED', // Purple
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'right',
        marginBottom: 24,
    },
    starsGrid: {
        flexDirection: 'column',
        gap: 16,
    },
    starsLeftColumn: {
        flexDirection: 'column',
        gap: 16,
    },
    insightCard: {
        backgroundColor: '#F9FAFB', // Light gray bg
        padding: 16,
        borderRadius: 16,
    },
    insightLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    insightText: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 20,
    },
    strategyCard: {
        backgroundColor: '#EEF2FF', // Very light blue/purple bg (indigo-50 approx)
        padding: 20,
        borderRadius: 16,
    },
    strategyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    strategyLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#818CF8', // Indigo-400
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    decodeCosmosLink: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7C3AED', // Purple
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginRight: 2,
    },
    strategyText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 16,
        color: '#1C1C1E',
        lineHeight: 24,
    },
    starsFooterDisclaimer: {
        textAlign: 'center',
        fontSize: 9,
        fontWeight: '700',
        color: '#D1D1D6',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 8,
    },
    // Dynamic Styles
    dynamicContainer: {
        paddingHorizontal: 20,
    },
    dynamicCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        marginBottom: 40,
    },
    dynamicTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        marginBottom: 24,
    },
    sliderSection: {
        marginBottom: 32,
    },
    sliderLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sliderValue: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    sliderRangeLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    metricsGrid: {
        marginBottom: 24,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    metricScore: {
        fontSize: 9,
        fontWeight: '700',
        color: '#D1D1D6',
        letterSpacing: 0.5,
    },
    reflectionInput: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 18,
        color: '#1C1C1E',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        paddingVertical: 12,
        marginBottom: 32,
    },
    saveCheckInButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#FCE7F3', // Light pink border
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 1,
    },
    saveCheckInText: {
        color: '#1C1C1E',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    pastLogsHeader: {
        paddingHorizontal: 6,
        fontSize: 10,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 40,
    },
    emptyStateText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 14,
        color: '#D1D1D6',
        textAlign: 'center',
        marginBottom: 20,
    }

});
