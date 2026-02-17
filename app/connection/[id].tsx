
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';
import { aiService } from '../../services/aiService';

import { fontSize as fs, scale, verticalScale } from '../../utils/responsive';

// Mock chips for the Clarity tab
const CHIPS = [
    "DELAYED REPLY",
    "MIXED SIGNALS",
    "OVERTHINKING",
    "AVOIDANT ENERGY",
    "SUDDEN DISTANCE"
];

// Content Component for the "Clarity" tab (Default)
// Content Component for the "Clarity" tab (Default)
// Content Component for the "Clarity" tab (Default)
const ClarityContent = ({ name }: { name: string }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [input, setInput] = useState('');
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
    const [messages, setMessages] = useState<Array<{ id: string, text: string, sender: 'user' | 'ai' }>>([]);
    const [loading, setLoading] = useState(false);
    const [initialInput, setInitialInput] = useState('');

    const startChat = () => {
        if (initialInput.trim()) {
            const firstMessage = { id: Date.now().toString(), text: initialInput, sender: 'user' as const };
            setMessages([firstMessage]);
            setIsChatOpen(true);
            setLoading(true);
            setInitialInput(''); // Clear initial input but keep it for processing

            // Trigger AI response for the first message
            processAIResponse(firstMessage.text, [firstMessage]);
        } else {
            setIsChatOpen(true);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { id: Date.now().toString(), text: input, sender: 'user' as const };
        const newHistory = [...messages, userMessage];
        setMessages(newHistory);
        setInput('');
        setLoading(true);

        processAIResponse(userMessage.text, newHistory);
    };

    const processAIResponse = async (userText: string, currentHistory: any[]) => {
        try {
            const themeContext = selectedThemes.length > 0 ? ` [Themes: ${selectedThemes.join(', ')}]` : '';
            const historyText = currentHistory.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');

            const result = await aiService.getClarityInsight(userText, `Target: ${name}${themeContext}`, historyText);

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: result, sender: 'ai' }]);
        } catch (error) {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: "I couldn't parse that right now. Try again?", sender: 'ai' }]);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = (theme: string) => {
        setSelectedThemes(prev =>
            prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
        );
    };

    const handleSave = () => {
        // TODO: Implement actual save logic (e.g., to database or context)
        setIsChatOpen(false);
    };

    return (
        <View style={styles.contentSection}>
            <Text style={styles.contentTitle}>What's on your mind?</Text>
            <Text style={styles.contentSubtitle}>We'll parse the signal from the noise. Just tell us what happened.</Text>

            {/* Theme Chips */}
            <View style={styles.chipsContainer}>
                {CHIPS.map((chip, index) => {
                    const isSelected = selectedThemes.includes(chip);
                    return (
                        <Pressable
                            key={index}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected
                            ]}
                            onPress={() => toggleTheme(chip)}
                        >
                            <Text style={[
                                styles.chipText,
                                isSelected && styles.chipTextSelected
                            ]}>
                                {chip}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Initial Input Area */}
            <View style={[styles.inputArea, initialInput.length > 0 && styles.inputAreaActive]}>
                <TextInput
                    style={styles.clarityInput}
                    placeholder="He said he'd call, but..."
                    placeholderTextColor="#D1D1D6"
                    value={initialInput}
                    onChangeText={setInitialInput}
                    multiline
                    selectionColor="#000000"
                />
            </View>

            <TouchableOpacity
                style={[styles.actionButton, (!initialInput.trim()) && { opacity: 0.5 }]}
                onPress={startChat}
                disabled={!initialInput.trim()}
            >
                <Text style={styles.actionButtonText}>START CHAT</Text>
            </TouchableOpacity>

            {/* Chat Modal */}
            <Modal
                visible={isChatOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsChatOpen(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                    >
                        {/* Chat Header */}
                        <View style={styles.chatHeader}>
                            <TouchableOpacity onPress={() => setIsChatOpen(false)} style={styles.chatHeaderLeft}>
                                <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                            <Text style={styles.chatHeaderTitle}>{name}</Text>
                            <TouchableOpacity onPress={handleSave}>
                                <Text style={styles.chatHeaderSave}>SAVE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Chat Messages */}
                        <ScrollView
                            style={styles.chatContainer}
                            contentContainerStyle={{ paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {messages.map((msg) => (
                                <View
                                    key={msg.id}
                                    style={[
                                        styles.messageBubble,
                                        msg.sender === 'user' ? styles.userBubble : styles.aiBubble
                                    ]}
                                >
                                    <Text style={[
                                        styles.messageText,
                                        msg.sender === 'user' ? styles.userMessageText : styles.aiMessageText
                                    ]}>
                                        {msg.text}
                                    </Text>
                                </View>
                            ))}
                            {loading && (
                                <View style={[styles.messageBubble, styles.aiBubble]}>
                                    <Text style={[styles.messageText, styles.aiMessageText]}>Analyzing...</Text>
                                </View>
                            )}
                        </ScrollView>

                        {/* Chat Input */}
                        <View style={styles.chatInputContainer}>
                            <TextInput
                                style={styles.chatInput}
                                placeholder="Details..."
                                placeholderTextColor="#A1A1AA"
                                value={input}
                                onChangeText={setInput}
                                multiline
                            />
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!input.trim() || loading}
                                style={[styles.chatSendButton, (!input.trim() && !loading) && { opacity: 0.5 }]}
                            >
                                <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// Content Component for the "Decoder" tab
const DecoderContent = () => {
    const [text, setText] = useState('');
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const scanAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (loading) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            scanAnim.setValue(0);
        }
    }, [loading]);

    const handleScanText = async () => {
        if (!text.trim()) return;
        Keyboard.dismiss();
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

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, verticalScale(220)],
    });

    return (
        <View style={styles.decoderContainer}>
            <View style={styles.decoderCard}>
                <Text style={styles.decoderTitle}>Decoder</Text>
                <Text style={styles.decoderSubtitle}>
                    Paste a text or thread to check tone, effort, and what's actually being said.
                </Text>

                <View style={{ position: 'relative' }}>
                    <TextInput
                        style={styles.decoderInput}
                        placeholder="Paste text here..."
                        placeholderTextColor="#A1A1AA"
                        multiline
                        textAlignVertical="top"
                        value={text}
                        onChangeText={setText}
                        editable={!loading}
                    />
                    {loading && (
                        <Animated.View
                            style={[
                                styles.scannerBar,
                                {
                                    transform: [{ translateY }]
                                }
                            ]}
                        />
                    )}
                </View>

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
        Keyboard.dismiss();
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
const OnboardingQuiz = ({ id, name, onComplete }: { id: string, name: string, onComplete: (data: any) => void }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState({
        howWeMet: '',
        firstImpression: '',
        initialVibe: '',
        howLong: '',
        currentIntent: ''
    });

    const questions = [
        {
            id: 'howWeMet',
            title: `How did you meet ${name}?`,
            subtitle: "The setting, the spark, the story.",
            type: 'text' as const,
            placeholder: "We met at a coffee shop in East Village...",
        },
        {
            id: 'howLong',
            title: "How long has this been going on?",
            subtitle: "Be honest about the timeline.",
            type: 'choice' as const,
            options: ["Just met", "A few weeks", "1-3 months", "6+ months", "It's been years"]
        },
        {
            id: 'firstImpression',
            title: "What was your first impression?",
            subtitle: "Be honest. What was the very first thing you thought?",
            type: 'text' as const,
            placeholder: "He was taller than I expected and very calm...",
        },
        {
            id: 'currentIntent',
            title: "What's your current intent?",
            subtitle: "Where are you standing right now?",
            type: 'choice' as const,
            options: ["Just curious", "Seeing where it goes", "Looking for serious", "It's complicated"]
        },
        {
            id: 'initialVibe',
            title: "What was the initial vibe?",
            subtitle: "Describe the energy in the room.",
            type: 'text' as const,
            placeholder: "Comfortable but slightly mysterious...",
        }
    ];

    const currentQuestion = questions[step];

    const handleNext = () => {
        if (!(answers as any)[currentQuestion.id].trim()) return;

        Keyboard.dismiss();

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            setIsSubmitting(true);
            // Small delay to show "processing" state to user
            setTimeout(() => {
                onComplete(answers);
            }, 600);
        }
    };

    const handleSelection = (val: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
        >
            <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.onboardingContainer}>
                    <View style={styles.onboardingHeader}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.onboardingProgress}>QUESTION {step + 1} OF {questions.length}</Text>
                            <TouchableOpacity onPress={() => onComplete({ skipped: true })}>
                                <Text style={styles.skipButtonText}>SKIP</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressIndicator, { width: `${((step + 1) / questions.length) * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.onboardingContent}>
                        <Text style={styles.onboardingTitle}>{currentQuestion.title}</Text>
                        <Text style={styles.onboardingSubtitle}>{currentQuestion.subtitle}</Text>

                        {currentQuestion.type === 'text' ? (
                            <TextInput
                                style={styles.onboardingInput}
                                placeholder={currentQuestion.placeholder}
                                placeholderTextColor="#D1D1D6"
                                value={(answers as any)[currentQuestion.id]}
                                onChangeText={(val) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                                multiline
                                autoFocus
                                blurOnSubmit={true}
                                returnKeyType="done"
                                onSubmitEditing={handleNext}
                                selectionColor="#ec4899"
                            />
                        ) : (
                            <View style={styles.optionsGrid}>
                                {currentQuestion.options?.map((option) => (
                                    <TouchableOpacity
                                        key={option}
                                        style={[
                                            styles.optionButton,
                                            (answers as any)[currentQuestion.id] === option && styles.optionButtonSelected
                                        ]}
                                        onPress={() => handleSelection(option)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            (answers as any)[currentQuestion.id] === option && styles.optionTextSelected
                                        ]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: verticalScale(40), marginBottom: verticalScale(40) }}>
                        <TouchableOpacity
                            style={[styles.onboardingNextButton, (!(answers as any)[currentQuestion.id].trim() || isSubmitting) && { opacity: 0.5 }]}
                            onPress={handleNext}
                            disabled={!(answers as any)[currentQuestion.id].trim() || isSubmitting}
                        >
                            <Text style={styles.onboardingNextButtonText}>
                                {isSubmitting ? 'PROCESSING...' : (step < questions.length - 1 ? 'CONTINUE' : 'FINISH PROFILE')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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

    const handleOnboardingComplete = (data: any) => {
        if (connection) {
            updateConnection(connection.id, {
                onboardingCompleted: true,
                onboardingContext: data
            });
        }
    };

    if (connection && !connection.onboardingCompleted) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <OnboardingQuiz
                    id={connection.id}
                    name={name}
                    onComplete={handleOnboardingComplete}
                />
            </SafeAreaView>
        );
    }



    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                >
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
                        <View style={styles.avatarContainer}>
                            <Ionicons name={icon as any} size={40} color="#8E8E93" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{name}</Text>
                            <View style={styles.tagBadge}>
                                <Text style={styles.tagText}>{tag}</Text>
                            </View>
                        </View>
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
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: verticalScale(40),
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: scale(24),
        paddingTop: verticalScale(24),
        paddingBottom: verticalScale(8),
        marginBottom: verticalScale(16),
    },
    navText: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(24),
        marginTop: verticalScale(8),
        marginBottom: verticalScale(16),
    },
    profileInfo: {
        marginLeft: scale(16),
    },
    avatarContainer: {
        width: scale(60),
        height: scale(60),
        borderRadius: scale(30),
        borderWidth: 1.5,
        borderColor: '#FCE7F3', // pink-100
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    profileName: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(20),
        color: '#1C1C1E',
        marginBottom: verticalScale(2),
    },
    tagBadge: {
        backgroundColor: '#FCE7F3', // pink-100
        paddingVertical: verticalScale(2),
        paddingHorizontal: scale(8),
        borderRadius: scale(12),
        alignSelf: 'flex-start',
    },
    tagText: {
        fontSize: fs(9),
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
        paddingHorizontal: scale(24),
        marginBottom: verticalScale(24),
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
        flex: 1,
        paddingHorizontal: scale(24),
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: verticalScale(32),
        paddingBottom: verticalScale(20),
    },
    contentTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(28),
        color: '#1C1C1E',
        marginBottom: verticalScale(8),
        textAlign: 'center',
    },
    contentSubtitle: {
        fontSize: fs(14),
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: verticalScale(24),
        lineHeight: verticalScale(20),
        maxWidth: scale(280),
    },
    inputArea: {
        marginBottom: verticalScale(24),
        width: '100%',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA', // Default gray
        paddingBottom: verticalScale(12),
    },
    inputAreaActive: {
        borderBottomColor: '#ec4899', // pink-500 when typing
    },
    clarityInput: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(24),
        color: '#1C1C1E',
        textAlign: 'center',
        width: '100%',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: scale(12),
        marginBottom: verticalScale(60),
        paddingHorizontal: scale(10),
    },
    chip: {
        backgroundColor: '#F9FAFB',
        paddingVertical: verticalScale(10),
        paddingHorizontal: scale(18),
        borderRadius: scale(24),
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    chipSelected: {
        backgroundColor: '#FCE7F3', // pink-100 highlight
        borderColor: '#FCE7F3',
    },
    chipText: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    chipTextSelected: {
        color: '#ec4899', // pink-500
    },
    insightBox: {
        backgroundColor: '#F9FAFB',
        padding: scale(24),
        borderRadius: scale(24),
        marginTop: verticalScale(24),
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    insightText: {
        fontSize: fs(15),
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        lineHeight: verticalScale(24),
        marginBottom: verticalScale(16),
    },
    resetButton: {
        alignItems: 'center',
        paddingVertical: verticalScale(10),
    },
    resetButtonText: {
        fontSize: fs(10),
        fontWeight: '800',
        color: '#ec4899',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    actionButton: {
        backgroundColor: '#000000',
        paddingVertical: verticalScale(18),
        paddingHorizontal: scale(40),
        borderRadius: scale(30),
        width: 'auto',
        minWidth: scale(200),
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: fs(12),
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    decoderContainer: {
        flex: 1,
        paddingHorizontal: scale(20),
        justifyContent: 'center',
        paddingVertical: verticalScale(20),
    },
    decoderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(24),
        padding: scale(24),
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    decoderTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(24),
        color: '#1C1C1E',
        marginBottom: verticalScale(12),
    },
    decoderSubtitle: {
        fontSize: fs(14),
        color: '#8E8E93',
        marginBottom: verticalScale(24),
        lineHeight: verticalScale(20),
    },
    decoderInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: scale(16),
        padding: scale(20),
        fontSize: fs(16),
        color: '#1C1C1E',
        height: verticalScale(220),
        marginBottom: verticalScale(24),
        textAlignVertical: 'top',
    },
    scannerBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#ec4899',
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 5,
    },
    analysisResult: {
        backgroundColor: '#F9FAFB',
        padding: scale(24),
        borderRadius: scale(24),
        marginTop: verticalScale(24),
    },
    analysisText: {
        fontSize: fs(15),
        color: '#1C1C1E',
        lineHeight: verticalScale(24),
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: verticalScale(16),
    },
    scanButton: {
        backgroundColor: '#000000',
        paddingVertical: verticalScale(16),
        borderRadius: scale(30),
        alignItems: 'center',
        marginBottom: verticalScale(20),
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: fs(11),
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
        flex: 1,
        paddingHorizontal: scale(20),
        justifyContent: 'center',
        paddingVertical: verticalScale(20),
    },
    starsCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(24),
        padding: scale(24),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: verticalScale(12),
        minHeight: verticalScale(400),
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
        flex: 1,
        paddingHorizontal: scale(20),
        justifyContent: 'center',
        paddingVertical: verticalScale(20),
    },
    dynamicCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: scale(24),
        padding: scale(24),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: verticalScale(40),
        minHeight: verticalScale(400),
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
    },
    onboardingContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: scale(24),
        paddingTop: verticalScale(40),
    },
    onboardingHeader: {
        marginBottom: verticalScale(40),
    },
    onboardingProgress: {
        fontSize: fs(10),
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 2,
        marginBottom: verticalScale(12),
        textAlign: 'center',
    },
    progressBar: {
        height: 2,
        backgroundColor: '#F2F2F7',
        width: '100%',
        borderRadius: 1,
    },
    progressIndicator: {
        height: 2,
        backgroundColor: '#ec4899',
        borderRadius: 1,
    },
    onboardingContent: {
        flex: 1,
    },
    onboardingTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(32),
        color: '#1C1C1E',
        marginBottom: verticalScale(12),
        lineHeight: verticalScale(40),
    },
    onboardingSubtitle: {
        fontSize: fs(14),
        color: '#8E8E93',
        marginBottom: verticalScale(40),
        lineHeight: verticalScale(22),
    },
    onboardingInput: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(24),
        color: '#1C1C1E',
        minHeight: verticalScale(150),
        textAlignVertical: 'top',
    },
    onboardingNextButton: {
        backgroundColor: '#000000',
        paddingVertical: verticalScale(20),
        borderRadius: scale(32),
        alignItems: 'center',
    },
    onboardingNextButtonText: {
        color: '#FFFFFF',
        fontSize: fs(12),
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    optionsGrid: {
        marginTop: verticalScale(20),
        gap: verticalScale(12),
    },
    optionButton: {
        backgroundColor: '#F9FAFB',
        paddingVertical: verticalScale(18),
        paddingHorizontal: scale(20),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    optionButtonSelected: {
        backgroundColor: '#FCE7F3', // pink-100
        borderColor: '#ec4899', // pink-500
    },
    optionText: {
        fontSize: fs(14),
        color: '#1C1C1E',
        fontWeight: '500',
    },
    optionTextSelected: {
        color: '#ec4899', // pink-500
        fontWeight: '700',
    },
    messageBubble: {
        padding: scale(16),
        borderRadius: scale(20),
        marginBottom: verticalScale(12),
        maxWidth: '85%',
    },
    userBubble: {
        backgroundColor: '#FCE7F3', // pink-100
        alignSelf: 'flex-end',
        borderBottomRightRadius: scale(4),
    },
    aiBubble: {
        backgroundColor: '#F9FAFB',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: scale(4),
    },
    messageText: {
        fontSize: fs(15),
        lineHeight: verticalScale(22),
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    userMessageText: {
        color: '#1C1C1E',
    },
    aiMessageText: {
        color: '#4B5563',
    },
    skipButtonText: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#A1A1AA', // Gray-400
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: verticalScale(12),
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(16),
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    chatHeaderLeft: {
        padding: 4,
    },
    chatHeaderTitle: {
        fontSize: fs(16),
        fontWeight: '700',
        color: '#A1A1AA', // Gray for name as requested
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    chatHeaderSave: {
        fontSize: fs(12),
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
    },
    chatContainer: {
        flex: 1,
        paddingHorizontal: scale(20),
        paddingTop: verticalScale(20),
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(12),
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        backgroundColor: '#FFFFFF',
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: scale(24),
        paddingHorizontal: scale(20),
        paddingVertical: verticalScale(12),
        fontSize: fs(16),
        color: '#1C1C1E',
        marginRight: scale(12),
        maxHeight: verticalScale(100),
    },
    chatSendButton: {
        backgroundColor: '#000000',
        width: scale(40),
        height: scale(40),
        borderRadius: scale(20),
        justifyContent: 'center',
        alignItems: 'center',
    },
});
