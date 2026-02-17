
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';
import { aiService } from '../../services/aiService';

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
const ClarityContent = ({ name }: { name: string }) => {
    const [input, setInput] = useState('');
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTalkItThrough = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const result = await aiService.getClarityInsight(input, `Target: ${name}`);
            setInsight(result);
        } catch (error) {
            setInsight("I couldn't parse that right now. Try again?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>What's on your mind?</Text>
            <Text style={styles.contentSubtitle}>We'll parse the signal from the noise. Just tell us what happened.</Text>

            <View style={styles.inputArea}>
                <TextInput
                    style={styles.clarityInput}
                    placeholder="He said he'd call, but..."
                    placeholderTextColor="#D1D1D6"
                    value={input}
                    onChangeText={setInput}
                    multiline
                />
            </View>

            <View style={styles.chipsContainer}>
                {CHIPS.map((chip, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.chip}
                        onPress={() => setInput(prev => prev + (prev ? ' ' : '') + chip)}
                    >
                        <Text style={styles.chipText}>{chip}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {insight ? (
                <View style={styles.insightBox}>
                    <Text style={styles.insightText}>{insight}</Text>
                    <TouchableOpacity onPress={() => setInsight('')} style={styles.resetButton}>
                        <Text style={styles.resetButtonText}>CLEAR INSIGHT</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.actionButton, loading && { opacity: 0.5 }]}
                    onPress={handleTalkItThrough}
                    disabled={loading}
                >
                    <Text style={styles.actionButtonText}>{loading ? 'ANALYZING...' : 'TALK IT THROUGH'}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// Content Component for the "Decoder" tab
const DecoderContent = () => {
    const [text, setText] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const handleScanText = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const result = await aiService.decodeMessage(text);
            setAnalysis(result);
        } catch (error) {
            setAnalysis("Could not decode this thread. Ensure you pasted a conversation.");
        } finally {
            setLoading(false);
        }
    };

    return (
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
                    value={text}
                    onChangeText={setText}
                />

                {analysis ? (
                    <View style={styles.analysisResult}>
                        <Text style={styles.analysisText}>{analysis}</Text>
                        <TouchableOpacity onPress={() => setAnalysis('')} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>SCAN NEW TEXT</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.scanButton, loading && { opacity: 0.5 }]}
                        onPress={handleScanText}
                        disabled={loading}
                    >
                        <Text style={styles.scanButtonText}>{loading ? 'SCANNING...' : 'SCAN TEXT'}</Text>
                    </TouchableOpacity>
                )}

                <Text style={styles.disclaimerText}>
                    THIS IS AN OBSERVATIONAL READ ON TONE & EFFORT, NOT A FACT.
                </Text>
            </View>
        </View>
    );
};

// Content Component for the "Stars" tab
const StarsContent = ({ name, userZodiac, partnerZodiac }: { name: string, userZodiac: string, partnerZodiac: string }) => {
    const [forecast, setForecast] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const fetchForecast = async () => {
        setLoading(true);
        try {
            const result = await aiService.getStarsAlign(name, userZodiac, partnerZodiac);
            setForecast(result);
        } catch (error) {
            setForecast("The cosmos are cloudy right now. Check back later.");
        } finally {
            setLoading(false);
        }
    };

    return (
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
                        <Text style={styles.starsDateText}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                        <TouchableOpacity style={styles.refreshButton} onPress={fetchForecast} disabled={loading}>
                            <Ionicons name="refresh" size={12} color="#7C3AED" style={loading && { opacity: 0.5 }} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Forecast Text */}
                <Text style={styles.forecastText}>
                    {forecast || `A push-pull dynamic, where your grounded practicality (${userZodiac}) meets his desire for balance (${partnerZodiac}). Tap refresh to decode the current alignment.`}
                </Text>

                {/* Optional: Add loading indicator or more structured results from AI */}

                <Text style={styles.relationshipDynamicLabel}>RELATIONSHIP DYNAMIC</Text>

                {/* Cards Layout */}
                <View style={styles.starsGrid}>
                    <View style={styles.strategyCard}>
                        <View style={styles.strategyHeader}>
                            <Text style={styles.strategyLabel}>COSMIC STRATEGY</Text>
                        </View>
                        <Text style={styles.strategyText}>
                            {forecast ? "Use your unique elemental mix to navigate today's energy." : "Tap refresh to get a specific strategy for this connection."}
                        </Text>
                    </View>
                </View>
            </View>
            <Text style={styles.starsFooterDisclaimer}>* ASTROLOGY DESCRIBES TENDENCIES, NOT EFFORT.</Text>
        </View>
    );
};

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

// Objective Check-In Component
const ObjectiveCheckIn = ({ connectionId, signals }: { connectionId: string, signals: any[] }) => {
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleCheckIn = async () => {
        setLoading(true);
        setModalVisible(true);
        try {
            const checkInResult = await aiService.getObjectiveCheckIn(signals);
            setResult(checkInResult);
        } catch (error) {
            setResult("Couldn't get an objective read right now.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ marginTop: 12 }}>
            <TouchableOpacity style={styles.objectiveCheckInButton} onPress={handleCheckIn}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#8E8E93" />
                <Text style={styles.objectiveCheckInText}>OBJECTIVE CHECK-IN</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Ionicons name="close" size={24} color="#1C1C1E" />
                        </TouchableOpacity>

                        <Text style={styles.modalTitle}>Objective Read</Text>
                        <ScrollView style={{ maxHeight: 400 }}>
                            {loading ? (
                                <Text style={styles.modalSubtitle}>Calculating grounded truth...</Text>
                            ) : (
                                <Text style={styles.analysisText}>{result}</Text>
                            )}
                        </ScrollView>

                        {!loading && (
                            <TouchableOpacity style={styles.resetButton} onPress={() => setModalVisible(false)}>
                                <Text style={styles.resetButtonText}>CLOSE</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Content Component for the "Dynamic" tab
const DynamicContent = () => {
    const [stats, setStats] = useState({ safety: 3, clarity: 3, excitement: 3, regulation: 3 });
    const [reflection, setReflection] = useState('');
    const [vibeAnalysis, setVibeAnalysis] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveCheckIn = async () => {
        setLoading(true);
        try {
            const result = await aiService.analyzeDynamicVibe(stats, reflection);
            setVibeAnalysis(result);
        } catch (error) {
            setVibeAnalysis("Logged, but couldn't get a vibe check right now.");
        } finally {
            setLoading(false);
        }
    };

    const updateStat = (key: keyof typeof stats, val: number) => {
        setStats(prev => ({ ...prev, [key]: val }));
    };

    return (
        <View style={styles.dynamicContainer}>
            <View style={styles.dynamicCard}>
                <Text style={styles.dynamicTitle}>What was his vibe today?</Text>

                {vibeAnalysis ? (
                    <View style={styles.insightBox}>
                        <Text style={styles.sectionHeader}>AI VIBE CHECK</Text>
                        <Text style={styles.insightText}>{vibeAnalysis}</Text>
                        <TouchableOpacity onPress={() => setVibeAnalysis('')} style={styles.resetButton}>
                            <Text style={styles.resetButtonText}>LOG NEW VIBE</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionHeader}>WHAT YOU NOTICED</Text>

                        {/* Metrics Grid */}
                        <View style={styles.metricsGrid}>
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={styles.metricLabel}>SAFETY</Text>
                                        <TouchableOpacity onPress={() => updateStat('safety', (stats.safety % 5) + 1)}>
                                            <Text style={styles.metricScore}>{stats.safety}/5</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <RatingCircles filled={stats.safety} total={5} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={styles.metricLabel}>CLARITY</Text>
                                        <TouchableOpacity onPress={() => updateStat('clarity', (stats.clarity % 5) + 1)}>
                                            <Text style={styles.metricScore}>{stats.clarity}/5</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <RatingCircles filled={stats.clarity} total={5} />
                                </View>
                            </View>

                            <View style={styles.metricRow}>
                                <View style={{ flex: 1, marginRight: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={styles.metricLabel}>EXCITEMENT</Text>
                                        <TouchableOpacity onPress={() => updateStat('excitement', (stats.excitement % 5) + 1)}>
                                            <Text style={styles.metricScore}>{stats.excitement}/5</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <RatingCircles filled={stats.excitement} total={5} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={styles.metricLabel}>REGULATION</Text>
                                        <TouchableOpacity onPress={() => updateStat('regulation', (stats.regulation % 5) + 1)}>
                                            <Text style={styles.metricScore}>{stats.regulation}/5</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <RatingCircles filled={stats.regulation} total={5} />
                                </View>
                            </View>
                        </View>

                        <TextInput
                            style={styles.reflectionInput}
                            placeholder="What happened? Tap to reflect..."
                            placeholderTextColor="#D1D1D6"
                            value={reflection}
                            onChangeText={setReflection}
                        />

                        <TouchableOpacity
                            style={[styles.saveCheckInButton, loading && { opacity: 0.5 }]}
                            onPress={handleSaveCheckIn}
                            disabled={loading}
                        >
                            <Text style={styles.saveCheckInText}>{loading ? 'ANALYZING...' : 'SAVE & ANALYZE'}</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <Text style={styles.pastLogsHeader}>PAST LOGS</Text>
            <Text style={styles.emptyStateText}>No feelings logged yet. Start tracking your intuition.</Text>
        </View>
    );
};



export default function ConnectionDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { connections, updateConnection, deleteConnection } = useConnections();
    const [activeTab, setActiveTab] = useState<'CLARITY' | 'DECODER' | 'STARS' | 'DYNAMIC'>('CLARITY');

    // Find the connection in context
    const connection = connections.find(c => c.id === params.id);

    // Fallback or Loading state could be better, but using params as initial data
    const name = String(connection?.name || params.name || 'sam');
    const tag = String(connection?.tag || params.tag || 'SITUATIONSHIP');
    const zodiac = String(connection?.zodiac || params.zodiac || 'LIBRA');
    const icon = connection?.icon || params.icon || 'leaf-outline';
    const status = connection?.status || 'active';

    const handleEdit = () => {
        if (connection) {
            router.push({ pathname: '/add-connection', params: { id: connection.id } });
        }
    };



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
                                <Text style={styles.navText}>CONNECTIONS</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleEdit}>
                            <Text style={styles.navText}>EDIT</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View
                            style={[
                                styles.avatarContainer
                            ]}
                        >
                            <Ionicons name={icon as any} size={80} color="#8E8E93" />
                            <View style={styles.zodiacBadge}>
                                <Text style={styles.zodiacText}>{zodiac}</Text>
                            </View>
                        </View>

                        <Text style={styles.profileName}>{name}</Text>

                        <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>

                        {/* Objective Check-In Feature */}
                        <ObjectiveCheckIn connectionId={params.id as string} signals={connection?.signals || []} />
                    </View>

                    {/* Tabs (The "Toolbar") */}
                    <View style={styles.tabsWrapper}>
                        <View style={styles.tabsContainer}>
                            {['CLARITY', 'DECODER', 'STARS', 'DYNAMIC'].map((tab) => (
                                <TouchableOpacity
                                    key={tab}
                                    style={styles.tabButton}
                                    onPress={() => setActiveTab(tab as any)}
                                >
                                    <Text style={[
                                        styles.tabText,
                                        activeTab === tab ? styles.activeTabText : styles.inactiveTabText
                                    ]}>
                                        {tab}
                                    </Text>
                                    {activeTab === tab && <View style={styles.activeIndicator} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Dynamic Content Rendering */}

                    {activeTab === 'CLARITY' && <ClarityContent name={Array.isArray(name) ? name[0] : name} />}
                    {activeTab === 'DECODER' && <DecoderContent />}
                    {activeTab === 'STARS' && <StarsContent
                        name={Array.isArray(name) ? name[0] : name}
                        userZodiac="Capricorn" // Defaulting for now, could be in user context
                        partnerZodiac={zodiac}
                    />}
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
    profileName: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: '#1C1C1E',
        marginBottom: 8,
    },
    tagBadge: {
        backgroundColor: '#FCE7F3', // pink-100
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 24,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ec4899', // pink-500
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    zodiacBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
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
    tabsWrapper: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    tabButton: {
        paddingVertical: 12,
        alignItems: 'center',
        position: 'relative',
    },
    activeIndicator: {
        position: 'absolute',
        bottom: -1,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#ec4899',
    },
    activeTabText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inactiveTabText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#C7C7CC',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tabText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
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
    clarityInput: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        textAlign: 'center',
        width: '100%',
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
    insightBox: {
        backgroundColor: '#F9FAFB',
        padding: 24,
        borderRadius: 24,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    insightText: {
        fontSize: 15,
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: 24,
        marginBottom: 16,
    },
    resetButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    resetButtonText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ec4899',
        letterSpacing: 1.5,
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
    decoderContainer: {
        paddingHorizontal: 20,
    },
    decoderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    decoderTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        marginBottom: 12,
    },
    decoderSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 24,
        lineHeight: 20,
    },
    decoderInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 20,
        fontSize: 16,
        color: '#1C1C1E',
        height: 160,
        marginBottom: 24,
        textAlignVertical: 'top',
    },
    analysisResult: {
        backgroundColor: '#F9FAFB',
        padding: 24,
        borderRadius: 24,
        marginTop: 24,
    },
    analysisText: {
        fontSize: 15,
        color: '#1C1C1E',
        lineHeight: 24,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 16,
    },
    scanButton: {
        backgroundColor: '#000000',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        marginBottom: 20,
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    disclaimerText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#D1D1D6',
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    starsContainer: {
        paddingHorizontal: 20,
    },
    starsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 12,
    },
    starsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    starsTitleBlock: {
        flexDirection: 'row',
        gap: 12,
    },
    starIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F3FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    starsTitleMain: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    starsTitleSub: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 18,
        color: '#7C3AED',
    },
    starsForecastLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        marginTop: 4,
    },
    starsDateBlock: {
        alignItems: 'flex-end',
    },
    starsDateText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
    },
    refreshButton: {
        marginTop: 8,
    },
    forecastText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 18,
        color: '#1C1C1E',
        lineHeight: 28,
        marginBottom: 16,
    },
    relationshipDynamicLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: '#7C3AED',
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'right',
        marginBottom: 24,
    },
    starsGrid: {
        flexDirection: 'column',
        gap: 16,
    },
    strategyCard: {
        backgroundColor: '#EEF2FF',
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
        color: '#818CF8',
        letterSpacing: 1,
        textTransform: 'uppercase',
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
    dynamicContainer: {
        paddingHorizontal: 20,
    },
    dynamicCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 40,
    },
    dynamicTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        marginBottom: 24,
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
        color: '#ec4899',
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
        borderColor: '#FCE7F3',
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
    },
    objectiveCheckInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
    },
    objectiveCheckInText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        width: '100%',
        position: 'relative',
    },
    modalTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 28,
        color: '#1C1C1E',
        marginBottom: 16,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 20,
    },
    closeButton: {
        position: 'absolute',
        top: 24,
        right: 24,
        zIndex: 1,
    }
});
