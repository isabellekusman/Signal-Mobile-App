
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Connection, DailyLog, SavedLog, useConnections } from '../../context/ConnectionsContext';
import { aiService } from '../../services/aiService';
import { logger } from '../../services/logger';

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
const ClarityContent = ({ name, connectionId }: { name: string; connectionId: string }) => {
    const { updateConnection, connections } = useConnections();
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
        if (messages.length > 0) {
            const conn = connections.find(c => c.id === connectionId);
            const aiMessages = messages.filter(m => m.sender === 'ai');
            const lastAI = aiMessages[aiMessages.length - 1];
            const newLog: SavedLog = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                source: 'clarity',
                title: `Clarity: ${selectedThemes.length > 0 ? selectedThemes.join(', ') : 'General'}`,
                summary: lastAI ? lastAI.text.substring(0, 120) + '...' : 'Chat saved.',
                fullContent: messages.map(m => `${m.sender === 'user' ? 'You' : 'Signal'}: ${m.text}`).join('\n\n'),
            };
            const existing = conn?.savedLogs || [];
            updateConnection(connectionId, { savedLogs: [newLog, ...existing] });
        }
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
// Content Component for the "Decoder" tab
// Content Component for the "Decoder" tab
// Content Component for the "Decoder" tab
const DecoderContent = ({ name, connectionId }: { name: string; connectionId: string }) => {
    const { updateConnection, connections, setShowPaywall } = useConnections();
    const [text, setText] = useState('');
    const [image, setImage] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
    const [analysis, setAnalysis] = useState<{
        tone: string;
        effort: string;
        powerDynamics: string;
        subtext: string;
        motivation: string;
        risks: string[];
        replySuggestion: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
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

    const pickImage = async () => {
        try {
            // Request permissions first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need camera roll permissions to make this work!');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                if (asset.base64) {
                    setImage({
                        uri: asset.uri,
                        base64: asset.base64,
                        mimeType: asset.mimeType || 'image/jpeg'
                    });
                }
            }
        } catch (error) {
            logger.error(error, { tags: { feature: 'decoder', method: 'pickImage' } });
            alert("Could not load image: " + (error as any).message);
        }
    };

    const removeImage = () => setImage(null);

    const handleScanText = async () => {
        if (!text.trim() && !image) return;
        Keyboard.dismiss();
        setLoading(true);
        try {
            let resultString;
            if (image) {
                resultString = await aiService.decodeImageMessage(image.base64, image.mimeType, text, name);
            } else {
                resultString = await aiService.decodeMessage(text, name);
            }

            const result = aiService.safeParseJSON(resultString);

            setAnalysis({
                tone: result.tone || "Unclear",
                effort: result.effort || "Unrated",
                powerDynamics: result.powerDynamics || "Unclear",
                subtext: result.subtext || "No subtext detected.",
                motivation: result.motivation || "Unknown",
                risks: result.risks || [],
                replySuggestion: result.replySuggestion || "No specific suggestion."
            });
            setIsAnalysisOpen(true);
        } catch (error: any) {
            if (error.message === 'DAILY_LIMIT_REACHED') {
                setShowPaywall('voluntary');
            } else {
                logger.error(error, { tags: { feature: 'decoder', method: 'handleScanText' } });
                alert("Failed to analyze. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, verticalScale(220)],
    });

    const handleSaveDecoder = () => {
        if (analysis) {
            const conn = connections.find(c => c.id === connectionId);
            const newLog: SavedLog = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                source: 'decoder',
                title: `Decode: ${analysis.tone}`,
                summary: analysis.subtext.substring(0, 120) + '...',
                fullContent: `Tone: ${analysis.tone}\nEffort: ${analysis.effort}\nPower Dynamics: ${analysis.powerDynamics}\nSubtext: ${analysis.subtext}\nMotivation: ${analysis.motivation}\nRisks: ${(analysis.risks || []).join(', ')}\nSuggested Reply: ${analysis.replySuggestion}`,
            };
            const existing = conn?.savedLogs || [];
            updateConnection(connectionId, { savedLogs: [newLog, ...existing] });
            closeAnalysis();
        }
    };

    const closeAnalysis = () => {
        setIsAnalysisOpen(false);
        setAnalysis(null);
        setText('');
        setImage(null);
    };

    return (
        <View style={styles.decoderContainer}>
            <View style={styles.decoderCard}>
                <Text style={styles.decoderTitle}>Decoder</Text>
                <Text style={styles.decoderSubtitle}>
                    Paste a text, thread, or upload a screenshot to check tone, effort, and what's actually being said.
                </Text>

                <View style={{ position: 'relative' }}>
                    <View style={[styles.decoderInputContainer, { flexDirection: 'column' }]}>
                        {image && (
                            <View style={{ marginBottom: 10 }}>
                                <Image source={{ uri: image.uri }} style={{ width: '100%', height: 150, borderRadius: 8, resizeMode: 'cover' }} />
                                <TouchableOpacity onPress={removeImage} style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 }}>
                                    <Ionicons name="close" size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                            <TextInput
                                style={[styles.decoderInput, { flex: 1, minHeight: 100, padding: 0, backgroundColor: 'transparent' }]}
                                placeholder={image ? "Add context about this screenshot..." : "Paste text here..."}
                                placeholderTextColor="#A1A1AA"
                                multiline
                                textAlignVertical="top"
                                value={text}
                                onChangeText={setText}
                                editable={!loading}
                            />
                            <TouchableOpacity onPress={pickImage} style={{ padding: 8 }}>
                                <Ionicons name="image-outline" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                        </View>
                    </View>

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

                <TouchableOpacity
                    style={[styles.scanButton, (loading || (!text.trim() && !image)) && { opacity: 0.5 }]}
                    onPress={handleScanText}
                    disabled={loading || (!text.trim() && !image)}
                >
                    <Text style={styles.scanButtonText}>{loading ? 'SCANNING...' : 'SCAN SIGNAL'}</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimerText}>
                    THIS IS AN OBSERVATIONAL READ ON TONE & EFFORT, NOT A FACT.
                </Text>
            </View>

            {/* Analysis Result Modal */}
            <Modal
                visible={isAnalysisOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={closeAnalysis}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                            <TouchableOpacity onPress={closeAnalysis}>
                                <Ionicons name="close-circle" size={32} color="#E5E5EA" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.decoderModalTitle}>Decoding Results</Text>
                        <Text style={styles.decoderModalSubtitle}>Here is the deep read of your interaction.</Text>

                        {analysis && (
                            <View style={{ gap: 24 }}>
                                {/* Row 1: Tone & Effort */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={styles.decoderBoxLabel}>TONE</Text>
                                        <Text style={styles.decoderBoxValue}>{analysis.tone}</Text>
                                    </View>
                                    <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={styles.decoderBoxLabel}>EFFORT</Text>
                                        <Text style={styles.decoderBoxValue}>{analysis.effort}</Text>
                                    </View>
                                </View>

                                {/* Power Dynamics */}
                                <View style={[styles.decoderBox, { backgroundColor: '#FFFFFF', borderColor: '#1C1C1E', borderWidth: 1 }]}>
                                    <Text style={[styles.decoderBoxLabel, { color: '#1C1C1E' }]}>POWER DYNAMICS</Text>
                                    <Text style={styles.decoderBoxBody}>{analysis.powerDynamics}</Text>
                                </View>

                                {/* The Subtext */}
                                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                    <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>WHAT'S ACTUALLY BEING SAID</Text>
                                    <Text style={styles.decoderBoxBody}>{analysis.subtext}</Text>
                                </View>

                                {/* The Motivation (The Why) */}
                                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                    <Text style={styles.decoderBoxLabel}>THE "WHY"</Text>
                                    <Text style={styles.decoderBoxBody}>{analysis.motivation}</Text>
                                </View>

                                {/* Risks / Signals */}
                                {analysis.risks && analysis.risks.length > 0 && (
                                    <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={[styles.decoderBoxLabel, { color: '#8E8E93' }]}>DETECTED SIGNALS</Text>
                                        <View style={{ gap: 8, marginTop: 4 }}>
                                            {analysis.risks.map((risk, index) => (
                                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8E8E93' }} />
                                                    <Text style={[styles.decoderBoxBody, { fontSize: 13 }]}>{risk}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Suggested Reply */}
                                <View style={[styles.decoderBox, { backgroundColor: '#FAFAFA', borderColor: '#E5E5E5', marginTop: 8 }]}>
                                    <Text style={[styles.decoderBoxLabel, { color: '#525252' }]}>SUGGESTED REPLY</Text>
                                    <Text style={[styles.decoderBoxBody, { fontStyle: 'italic' }]}>"{analysis.replySuggestion}"</Text>
                                </View>

                                {/* Save to Profile Button */}
                                <TouchableOpacity
                                    style={{ backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 28, alignItems: 'center', marginTop: 8 }}
                                    onPress={handleSaveDecoder}
                                >
                                    <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 1 }}>SAVE TO PROFILE</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </View>
    );
};

// Content Component for the "Stars" tab
// Content Component for the "Stars" tab
// Content Component for the "Stars" tab
const StarsContent = ({ name, userZodiac, partnerZodiac }: { name: string, userZodiac: string, partnerZodiac: string }) => {
    const [forecast, setForecast] = useState<{
        connectionTheme?: string;
        dailyForecast: string;
        planetaryTransits?: string;
        cosmicStrategy: string;
        detailedAnalysis?: {
            userBubble: string;
            partnerBubble: string;
            pushPullDynamics: string;
            cosmicStrategyDepth: string;
        }
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDetailedAnalysisOpen, setIsDetailedAnalysisOpen] = useState(false);

    const fetchForecast = async () => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `stars_${name.replace(/\s/g, '')}_${today}`;

        setLoading(true);
        try {
            // Check cache first
            const cached = await AsyncStorage.getItem(storageKey);
            if (cached) {
                setForecast(JSON.parse(cached));
                setLoading(false);
                return;
            }

            // Fetch new if not cached
            const resultString = await aiService.getStarsAlign(name, userZodiac, partnerZodiac);
            const result = aiService.safeParseJSON(resultString);

            setForecast(result);
            await AsyncStorage.setItem(storageKey, JSON.stringify(result));

        } catch (error) {
            logger.error(error, { tags: { feature: 'stars', method: 'fetchForecast' } });
            // Fallback
            setForecast({
                connectionTheme: "Cloudy Skies",
                dailyForecast: "The cosmos are cloudy right now. Check back later.",
                cosmicStrategy: "Focus on your own center.",
                detailedAnalysis: {
                    userBubble: "Uncertainty.",
                    partnerBubble: "Uncertainty.",
                    pushPullDynamics: "Signals are mixed.",
                    cosmicStrategyDepth: "Wait for the clouds to clear."
                }
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, []);

    return (
        <View style={styles.starsContainer}>
            <View style={styles.starsCard}>
                {/* Header with Title and Date */}
                <View style={styles.starsHeader}>
                    <View style={styles.starsTitleBlock}>
                        <View style={[styles.starIconContainer, { backgroundColor: '#FDF2F8' }]}>
                            <Ionicons name="star" size={16} color="#ec4899" />
                        </View>
                        <View>
                            <Text style={styles.starsTitleMain}>Stars</Text>
                            <Text style={[styles.starsTitleSub, { color: '#ec4899' }]}>Align</Text>
                            <Text style={styles.starsForecastLabel}>FORECAST FOR {name.toUpperCase()}</Text>
                        </View>
                    </View>
                    <View style={styles.starsDateBlock}>
                        <Text style={styles.starsDateText}>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}</Text>
                        {/* Auto-refreshing daily, hiding manual refresh for cleaner look */}
                    </View>
                </View>

                {/* Connection Theme Headline */}
                <Text style={styles.connectionThemeText}>
                    {forecast?.connectionTheme || "Aligning the Cosmos..."}
                </Text>

                {/* Main Forecast Text */}
                <Text style={styles.forecastText}>
                    {forecast?.dailyForecast || (loading ? "Aligning your cosmic energies..." : `See how the ${userZodiac} and ${partnerZodiac} energies collide today.`)}
                </Text>

                {/* Cosmic Strategy (Short) */}
                <View style={[styles.starsGrid, { marginTop: 20 }]}>
                    <View style={[styles.strategyCard, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7', borderWidth: 1 }]}>
                        <View style={styles.strategyHeader}>
                            <Text style={[styles.strategyLabel, { color: '#ec4899' }]}>COSMIC STRATEGY</Text>
                        </View>
                        <Text style={[styles.strategyText, { color: '#1C1C1E' }]}>
                            {forecast?.cosmicStrategy || "..."}
                        </Text>
                    </View>
                </View>

                {/* Decode The Cosmos Button */}
                <TouchableOpacity
                    style={[styles.scanButton, { marginTop: 24, backgroundColor: '#ec4899' }]}
                    onPress={() => {
                        if (!forecast) {
                            fetchForecast().then(() => setIsDetailedAnalysisOpen(true));
                        } else {
                            setIsDetailedAnalysisOpen(true);
                        }
                    }}
                    disabled={loading}
                >
                    <Text style={[styles.scanButtonText, { color: '#FFFFFF' }]}>{loading ? 'ALIGNING...' : 'DECODE THE COSMOS'}</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.starsFooterDisclaimer}>* ASTROLOGY DESCRIBES TENDENCIES, NOT EFFORT.</Text>

            {/* Detailed Analysis Modal */}
            <Modal
                visible={isDetailedAnalysisOpen}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsDetailedAnalysisOpen(false)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
                            <TouchableOpacity onPress={() => setIsDetailedAnalysisOpen(false)}>
                                <Ionicons name="close-circle" size={32} color="#E5E5EA" />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.decoderModalTitle, { color: '#1C1C1E' }]}>Cosmic Decoding</Text>
                        <Text style={styles.decoderModalSubtitle}>The push and pull of today's energy.</Text>

                        {forecast?.detailedAnalysis && (
                            <View style={{ gap: 24 }}>
                                {/* Current Transits */}
                                {forecast.planetaryTransits && (
                                    <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Ionicons name="planet" size={16} color="#ec4899" />
                                            <Text style={[styles.decoderBoxLabel, { marginBottom: 0, color: '#ec4899' }]}>CURRENT PLANETARY TRANSITS</Text>
                                        </View>
                                        <Text style={styles.decoderBoxBody}>{forecast.planetaryTransits}</Text>
                                    </View>
                                )}

                                {/* User & Partner Bubbles */}
                                <View style={{ flexDirection: 'row', gap: 12 }}>
                                    <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>YOU ({userZodiac})</Text>
                                        <Text style={styles.decoderBoxBody}>{forecast.detailedAnalysis.userBubble}</Text>
                                    </View>
                                    <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={[styles.decoderBoxLabel, { color: '#8E8E93' }]}>THEM ({partnerZodiac})</Text>
                                        <Text style={styles.decoderBoxBody}>{forecast.detailedAnalysis.partnerBubble}</Text>
                                    </View>
                                </View>

                                {/* Push / Pull Dynamics */}
                                <View style={[styles.decoderBox, { backgroundColor: '#FFFFFF', borderColor: '#1C1C1E', borderWidth: 1 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Ionicons name="swap-horizontal" size={16} color="#1C1C1E" />
                                        <Text style={[styles.decoderBoxLabel, { marginBottom: 0, color: '#1C1C1E' }]}>PUSH / PULL DYNAMICS</Text>
                                    </View>
                                    <Text style={styles.decoderBoxBody}>{forecast.detailedAnalysis.pushPullDynamics}</Text>
                                </View>

                                {/* Deep Strategy */}
                                <View style={[styles.decoderBox, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
                                    <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>COSMIC STRATEGY: IN DEPTH</Text>
                                    <Text style={[styles.decoderBoxBody, { fontSize: 16, lineHeight: 26 }]}>{forecast.detailedAnalysis.cosmicStrategyDepth}</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>
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

// Helper for Dynamic Slider
// Helper for Dynamic Slider
const SimpleSlider = ({ value, onValueChange }: { value: number, onValueChange: (val: number) => void }) => {
    const [width, setWidth] = useState(0);

    const updateSlider = (e: any) => {
        if (width === 0) return;
        const x = e.nativeEvent.locationX;
        const pct = Math.max(0, Math.min(100, (x / width) * 100));
        onValueChange(Math.round(pct));
    };

    return (
        <View
            style={{ marginBottom: 24 }}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={styles.sliderLabel}>CONFUSING</Text>
                <Text style={styles.sliderLabel}>CLEAR</Text>
            </View>

            <View
                style={{ height: 40, justifyContent: 'center' }}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={updateSlider}
                onResponderMove={updateSlider}
            >
                <View style={{ height: 4, backgroundColor: '#F2F2F7', borderRadius: 2, width: '100%' }}>
                    <View style={{ height: 4, backgroundColor: '#ec4899', borderRadius: 2, width: `${value}%` }} />
                </View>
                <View style={{
                    position: 'absolute',
                    left: `${value}%`,
                    marginLeft: -10,
                    width: 20, height: 20, borderRadius: 10, backgroundColor: 'white',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
                    borderWidth: 0.5, borderColor: '#CECECE'
                }} />
            </View>

            <Text style={{ textAlign: 'center', marginTop: 4, fontSize: 11, fontWeight: '700', color: '#ec4899' }}>{value}</Text>
        </View>
    );
};

// Content Component for the "Dynamic" tab
const DynamicContent = ({ connection }: { connection: Connection }) => {
    const { updateConnection } = useConnections();

    // Form State
    // Form State
    const [energy, setEnergy] = useState<'I carried it' | 'It felt balanced' | 'He carried it' | 'Other' | ''>('');
    const [customEnergyNote, setCustomEnergyNote] = useState('');
    const [direction, setDirection] = useState<'Closer' | 'The same' | 'Further away' | 'Other' | ''>('');
    const [customDirectionNote, setCustomDirectionNote] = useState('');
    const [clarity, setClarity] = useState<number>(50);
    const [effort, setEffort] = useState<string[]>([]);
    const [customEffortNote, setCustomEffortNote] = useState('');
    const [emotionState, setEmotionState] = useState<'Grounded' | 'Warm' | 'Neutral' | 'Uncertain' | 'Preoccupied' | 'Draining' | 'Other' | ''>('');
    const [customEmotionNote, setCustomEmotionNote] = useState('');
    const [notable, setNotable] = useState('');
    const [loading, setLoading] = useState(false);

    const hasLogs = connection.dailyLogs && connection.dailyLogs.length > 0;

    const handleSaveLog = async () => {
        if (!energy || !direction || !emotionState) {
            alert('Please complete the core signals (Energy, Direction, Emotion) to log.');
            return;
        }

        Keyboard.dismiss();
        setLoading(true);

        const newLog: DailyLog = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            energyExchange: energy,
            custom_energy_note: (energy === 'Other' && customEnergyNote) ? customEnergyNote : undefined,
            direction: direction,
            custom_direction_note: (direction === 'Other' && customDirectionNote) ? customDirectionNote : undefined,
            clarity,
            effortSignals: effort,
            custom_effort_note: (effort.includes('Other') && customEffortNote) ? customEffortNote : undefined,
            structured_emotion_state: emotionState,
            custom_emotion_note: (emotionState === 'Other' && customEmotionNote) ? customEmotionNote : undefined,
            notable: notable.trim()
        };

        // Simulate network/analysis delay if desired, or just save
        setTimeout(() => {
            const updatedLogs = [newLog, ...(connection.dailyLogs || [])];
            updateConnection(connection.id, { dailyLogs: updatedLogs });

            // Reset
            setEnergy('');
            setCustomEnergyNote('');
            setDirection('');
            setCustomDirectionNote('');
            setClarity(50);
            setEffort([]);
            setCustomEffortNote('');
            setEmotionState('');
            setCustomEmotionNote('');
            setNotable('');
            setLoading(false);
        }, 600);
    };

    const toggleEffort = (tag: string) => {
        if (effort.includes(tag)) {
            setEffort(prev => prev.filter(t => t !== tag));
        } else {
            setEffort(prev => [...prev, tag]);
        }
    };

    return (
        <View style={styles.dynamicContainer}>
            <View style={styles.dynamicCard}>
                <Text style={styles.dynamicTitle}>Log Today's Signal</Text>

                {/* 1. Energy Exchange */}
                <View style={styles.logSection}>
                    <Text style={styles.sectionHeader}>WHO CARRIED THE INTERACTION?</Text>
                    <View style={styles.radioGroup}>
                        {['I carried it', 'It felt balanced', 'He carried it', 'Other'].map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.radioOption, energy === opt && styles.radioOptionSelected]}
                                onPress={() => setEnergy(opt as any)}
                            >
                                <Text style={[styles.radioText, energy === opt && styles.radioTextSelected]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {energy === 'Other' && (
                        <Animated.View style={{ marginTop: 8 }}>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Describe the energy..."
                                placeholderTextColor="#D1D1D6"
                                maxLength={120}
                                value={customEnergyNote}
                                onChangeText={setCustomEnergyNote}
                            />
                        </Animated.View>
                    )}
                </View>

                {/* 2. Direction */}
                <View style={styles.logSection}>
                    <Text style={styles.sectionHeader}>AFTER TODAY, THE CONNECTION FEELS...</Text>
                    <View style={styles.radioGroup}>
                        {['Closer', 'The same', 'Further away', 'Other'].map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.radioOption, direction === opt && styles.radioOptionSelected]}
                                onPress={() => setDirection(opt as any)}
                            >
                                <Text style={[styles.radioText, direction === opt && styles.radioTextSelected]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {direction === 'Other' && (
                        <Animated.View style={{ marginTop: 8 }}>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Describe the direction..."
                                placeholderTextColor="#D1D1D6"
                                maxLength={120}
                                value={customDirectionNote}
                                onChangeText={setCustomDirectionNote}
                            />
                        </Animated.View>
                    )}
                </View>

                {/* 3. Clarity - Slider */}
                <View style={styles.logSection}>
                    <Text style={styles.sectionHeader}>HOW CLEAR DID THINGS FEEL?</Text>
                    <SimpleSlider value={clarity} onValueChange={setClarity} />
                </View>

                {/* 4. Effort Signals */}
                <View style={styles.logSection}>
                    <Text style={styles.sectionHeader}>WHAT ACTUALLY HAPPENED?</Text>
                    <View style={styles.radioGroup}>
                        {[
                            'He initiated', 'I initiated', 'Asked about my life',
                            'Made a future reference', 'Followed through',
                            'Delayed response', 'Conversation stayed surface level',
                            'Warm/engaged', 'Distracted/distant', 'Other'
                        ].map((tag) => (
                            <TouchableOpacity
                                key={tag}
                                style={[
                                    styles.radioOption,
                                    effort.includes(tag) && styles.radioOptionSelected,
                                    { flexBasis: '48%', marginBottom: 8, paddingHorizontal: 12 }
                                ]}
                                onPress={() => toggleEffort(tag)}
                            >
                                <Text style={[styles.radioText, effort.includes(tag) && styles.radioTextSelected, { textAlign: 'center' }]}>{tag}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {effort.includes('Other') && (
                        <Animated.View style={{ marginTop: 8 }}>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Describe the effort..."
                                placeholderTextColor="#D1D1D6"
                                maxLength={120}
                                value={customEffortNote}
                                onChangeText={setCustomEffortNote}
                            />
                        </Animated.View>
                    )}
                </View>

                {/* 5. End-of-Day State (Renamed from Emotional Aftertaste) */}
                <View style={styles.logSection}>
                    <Text style={styles.sectionHeader}>BY THE END OF THE DAY, THIS CONNECTION FELT...</Text>
                    <View style={styles.radioGroup}>
                        {['Grounded', 'Warm', 'Neutral', 'Uncertain', 'Preoccupied', 'Draining', 'Other'].map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.radioOption,
                                    emotionState === opt && styles.radioOptionSelected,
                                    { flexBasis: '48%', marginBottom: 8, paddingHorizontal: 12 }
                                ]}
                                onPress={() => setEmotionState(opt as any)}
                            >
                                <Text style={[styles.radioText, emotionState === opt && styles.radioTextSelected]}>{opt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Inline Other Input */}
                    {emotionState === 'Other' && (
                        <Animated.View style={{ marginTop: 8 }}>
                            <TextInput
                                style={styles.otherInput}
                                placeholder="Describe the feeling..."
                                placeholderTextColor="#D1D1D6"
                                maxLength={120}
                                value={customEmotionNote}
                                onChangeText={setCustomEmotionNote}
                            />
                        </Animated.View>
                    )}
                </View>

                {/* Text Field */}
                <View style={styles.logSection}>
                    <TextInput
                        style={styles.reflectionInput}
                        placeholder="Anything notable? (Optional, max 240)"
                        placeholderTextColor="#D1D1D6"
                        maxLength={240}
                        value={notable}
                        onChangeText={setNotable}
                        multiline
                    />
                </View>

                <TouchableOpacity
                    style={[styles.saveCheckInButton, loading && { opacity: 0.5 }]}
                    onPress={handleSaveLog}
                    disabled={loading}
                >
                    <Text style={styles.saveCheckInText}>{loading ? 'LOGGING...' : 'LOG TODAY’S SIGNAL'}</Text>
                </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', marginBottom: 40, paddingHorizontal: 20 }}>
                <Text style={styles.emptyStateText}>
                    {hasLogs ? "We’re starting to see movement." : "Clarity comes from patterns. Start logging signals."}
                </Text>
            </View>
        </View>
    );
};
const OnboardingQuiz = ({ id, name, tag, onComplete }: { id: string, name: string, tag: string, onComplete: (data: any) => void }) => {
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    // ── Build questions based on relationship type ──
    const getQuestionsForTag = (relationshipTag: string) => {
        const normalizedTag = relationshipTag.toUpperCase();

        // Shared opening question
        const howWeMet = {
            id: 'howWeMet',
            title: `How did you meet ${name}?`,
            subtitle: "The setting, the spark, the story.",
            type: 'text' as const,
            placeholder: "We met at a coffee shop in East Village...",
        };

        // Shared timeline question
        const howLong = {
            id: 'howLong',
            title: "How long has this been going on?",
            subtitle: "Be honest about the timeline.",
            type: 'choice' as const,
            options: ["Just met", "A few weeks", "1-3 months", "6+ months", "It's been years"]
        };

        // Final universal question — always last before finish
        const anythingElse = {
            id: 'anythingElse',
            title: `Anything else Signal should know?`,
            subtitle: "Context only you have. Write as much or as little as you want.",
            type: 'text' as const,
            placeholder: "He tends to pull away when things feel real, but always comes back...",
        };

        let middleQuestions: Array<{
            id: string;
            title: string;
            subtitle: string;
            type: 'text' | 'choice';
            placeholder?: string;
            options?: string[];
        }> = [];

        switch (normalizedTag) {
            case 'EX':
                middleQuestions = [
                    {
                        id: 'whatEnded',
                        title: "What ended things?",
                        subtitle: "No spin — just what actually happened.",
                        type: 'text',
                        placeholder: "We wanted different things. I needed more consistency...",
                    },
                    {
                        id: 'lingeringFeelings',
                        title: "What's the lingering feeling?",
                        subtitle: "Be honest — even if it contradicts what you tell people.",
                        type: 'choice',
                        options: ["I miss them", "I'm over it", "I want closure", "I want them back", "I don't know yet"],
                    },
                    {
                        id: 'currentContact',
                        title: "Are you still in contact?",
                        subtitle: "How present are they right now?",
                        type: 'choice',
                        options: ["No contact", "Occasional texts", "We talk regularly", "Still seeing each other", "On and off"],
                    },
                ];
                break;

            case 'SITUATIONSHIP':
                middleQuestions = [
                    {
                        id: 'defined',
                        title: "Have you defined this?",
                        subtitle: "Labels aren't everything, but clarity matters.",
                        type: 'choice',
                        options: ["Never discussed it", "We talked but no label", "They avoid the conversation", "We agreed to keep it casual"],
                    },
                    {
                        id: 'emotionalState',
                        title: "How do you feel after seeing them?",
                        subtitle: "The after-feeling is the truest signal.",
                        type: 'choice',
                        options: ["Secure and warm", "Anxious and overthinking", "Confused", "Happy but uncertain", "Drained"],
                    },
                    {
                        id: 'whatYouWant',
                        title: "What do you actually want from this?",
                        subtitle: "Not what's cool to want. What do YOU want?",
                        type: 'text',
                        placeholder: "I want them to choose me, but I'm scared to say that...",
                    },
                ];
                break;

            case 'CRUSH':
                middleQuestions = [
                    {
                        id: 'whatDrawsYou',
                        title: `What draws you to ${name}?`,
                        subtitle: "What is it specifically?",
                        type: 'text',
                        placeholder: "The way they look at me like they actually see me...",
                    },
                    {
                        id: 'signals',
                        title: "What signals are you picking up?",
                        subtitle: "Are they showing interest?",
                        type: 'choice',
                        options: ["Strong interest", "Mixed signals", "Friendly but hard to read", "They don't know I exist yet", "Flirty energy"],
                    },
                    {
                        id: 'biggestFear',
                        title: "What's holding you back?",
                        subtitle: "Be real about the hesitation.",
                        type: 'choice',
                        options: ["Fear of rejection", "Bad timing", "They're seeing someone", "I don't want to ruin the friendship", "Nothing — I'm going for it"],
                    },
                ];
                break;

            case 'RELATIONSHIP':
                middleQuestions = [
                    {
                        id: 'currentState',
                        title: "Where does the relationship stand right now?",
                        subtitle: "Not the best day or worst — the honest baseline.",
                        type: 'choice',
                        options: ["Strong and growing", "Good but routine", "Rocky lately", "Going through something", "I'm not sure anymore"],
                    },
                    {
                        id: 'recentTension',
                        title: "What's the biggest tension point right now?",
                        subtitle: "The thing that keeps coming up.",
                        type: 'text',
                        placeholder: "They've been distant and I can't tell if it's work or us...",
                    },
                    {
                        id: 'currentIntent',
                        title: "What are you trying to figure out?",
                        subtitle: "Why did you add them here?",
                        type: 'choice',
                        options: ["Want to strengthen things", "Wondering if this is right", "Processing a rough patch", "Just tracking the dynamic", "Need clarity on where this is going"],
                    },
                ];
                break;

            case 'FRIENDS':
                middleQuestions = [
                    {
                        id: 'friendshipType',
                        title: "What's the dynamic like?",
                        subtitle: "Every friendship has a pattern.",
                        type: 'choice',
                        options: ["Ride or die", "Fun but surface-level", "They know everything", "Growing apart", "Complicated history"],
                    },
                    {
                        id: 'whyTracking',
                        title: `Why are you tracking ${name}?`,
                        subtitle: "What's the thing you're trying to see clearly?",
                        type: 'text',
                        placeholder: "I feel like I'm always the one reaching out...",
                    },
                    {
                        id: 'energyBalance',
                        title: "How balanced does this friendship feel?",
                        subtitle: "Who gives more?",
                        type: 'choice',
                        options: ["Balanced", "I give more", "They give more", "We show up differently", "Hard to tell"],
                    },
                ];
                break;

            case 'TALKING':
                middleQuestions = [
                    {
                        id: 'talkingPace',
                        title: "How fast is this moving?",
                        subtitle: "The pace says a lot.",
                        type: 'choice',
                        options: ["Slow and steady", "Moving fast", "Hot and cold", "Stalled", "Just got interesting"],
                    },
                    {
                        id: 'firstImpression',
                        title: "First impression?",
                        subtitle: "Be honest — what was the very first thing you thought?",
                        type: 'text',
                        placeholder: "They were funnier in person than over text...",
                    },
                    {
                        id: 'currentIntent',
                        title: "What's your intent right now?",
                        subtitle: "Where are you standing?",
                        type: 'choice',
                        options: ["Just curious", "Seeing where it goes", "Looking for serious", "Keeping my options open"],
                    },
                ];
                break;

            default: // OTHER or anything else
                middleQuestions = [
                    {
                        id: 'firstImpression',
                        title: "What was your first impression?",
                        subtitle: "Be honest. What was the very first thing you thought?",
                        type: 'text',
                        placeholder: "They were calmer than I expected...",
                    },
                    {
                        id: 'currentIntent',
                        title: "What's your current intent?",
                        subtitle: "Where are you standing right now?",
                        type: 'choice',
                        options: ["Just curious", "Seeing where it goes", "Looking for serious", "It's complicated"],
                    },
                    {
                        id: 'initialVibe',
                        title: "What was the initial vibe?",
                        subtitle: "Describe the energy.",
                        type: 'text',
                        placeholder: "Comfortable but slightly mysterious...",
                    },
                ];
                break;
        }

        return [howWeMet, howLong, ...middleQuestions, anythingElse];
    };

    const questions = getQuestionsForTag(tag);
    const currentQuestion = questions[step];

    // Initialize answers for all question IDs
    React.useEffect(() => {
        const initial: Record<string, string> = {};
        questions.forEach(q => { initial[q.id] = ''; });
        setAnswers(initial);
    }, []);

    const handleNext = () => {
        // Allow proceeding without an answer on the "anythingElse" step
        if (!answers[currentQuestion.id]?.trim() && currentQuestion.id !== 'anythingElse') return;

        Keyboard.dismiss();

        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            setIsSubmitting(true);
            setTimeout(() => {
                onComplete(answers);
            }, 600);
        }
    };

    const handleSkip = () => {
        // Skip marks onboarding as completed permanently — never show again
        onComplete({ skipped: true });
    };

    const handleSelection = (val: string) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    };

    if (!currentQuestion) return null;

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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                {step > 0 && (
                                    <TouchableOpacity
                                        onPress={() => { Keyboard.dismiss(); setStep(step - 1); }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Ionicons name="arrow-back" size={20} color="#1C1C1E" />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.onboardingProgress}>QUESTION {step + 1} OF {questions.length}</Text>
                            </View>
                            <TouchableOpacity onPress={handleSkip}>
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
                                value={answers[currentQuestion.id] || ''}
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
                                            answers[currentQuestion.id] === option && styles.optionButtonSelected
                                        ]}
                                        onPress={() => handleSelection(option)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            answers[currentQuestion.id] === option && styles.optionTextSelected
                                        ]}>
                                            {option}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: verticalScale(40), marginBottom: verticalScale(40), gap: 12 }}>
                        <TouchableOpacity
                            style={[styles.onboardingNextButton, (!answers[currentQuestion.id]?.trim() || isSubmitting) && currentQuestion.id !== 'anythingElse' && { opacity: 0.5 }]}
                            onPress={handleNext}
                            disabled={(!answers[currentQuestion.id]?.trim() && currentQuestion.id !== 'anythingElse') || isSubmitting}
                        >
                            <Text style={styles.onboardingNextButtonText}>
                                {isSubmitting ? 'PROCESSING...' : (step < questions.length - 1 ? 'CONTINUE' : 'FINISH PROFILE')}
                            </Text>
                        </TouchableOpacity>

                        {currentQuestion.id === 'anythingElse' && !answers[currentQuestion.id]?.trim() && (
                            <TouchableOpacity
                                style={styles.noImGoodButton}
                                onPress={() => {
                                    setAnswers(prev => ({ ...prev, anythingElse: ' ' }));
                                    setIsSubmitting(true);
                                    setTimeout(() => onComplete({ ...answers, anythingElse: '' }), 600);
                                }}
                                disabled={isSubmitting}
                            >
                                <Text style={styles.noImGoodText}>NO, I'M GOOD</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};


// ──────────────────────────────────────────────────
// PROFILE CONTENT — All-encompassing analysis page
// ──────────────────────────────────────────────────
const ProfileContent = ({ connection }: { connection: Connection }) => {
    const { updateConnection } = useConnections();
    const [advice, setAdvice] = useState<{
        stateOfConnection: string;
        todaysMove: string;
        watchFor: string;
    } | null>(null);
    const [loadingAdvice, setLoadingAdvice] = useState(false);
    const [selectedLog, setSelectedLog] = useState<SavedLog | null>(null);

    const savedLogs = connection.savedLogs || [];
    const dailyLogs = connection.dailyLogs || [];
    const onboarding = connection.onboardingContext;

    // Helper: get today's date string (YYYY-MM-DD) for cache comparison
    const getTodayKey = () => new Date().toISOString().split('T')[0];

    const fetchAdvice = async () => {
        setLoadingAdvice(true);
        try {
            // Build context from all available data
            let context = '';
            if (onboarding && !onboarding.skipped) {
                const labelMap: Record<string, string> = {
                    howWeMet: 'How they met',
                    howLong: 'Duration',
                    firstImpression: 'First impression',
                    initialVibe: 'Initial vibe',
                    currentIntent: 'Current intent',
                    whatEnded: 'What ended things',
                    lingeringFeelings: 'Lingering feelings',
                    currentContact: 'Current contact level',
                    defined: 'Have they defined it',
                    emotionalState: 'Emotional state after seeing them',
                    whatYouWant: 'What they actually want',
                    whatDrawsYou: 'What draws them',
                    signals: 'Signals picked up',
                    biggestFear: 'What holds them back',
                    currentState: 'Current state of relationship',
                    recentTension: 'Biggest tension point',
                    friendshipType: 'Friendship dynamic',
                    whyTracking: 'Why tracking this person',
                    energyBalance: 'Energy balance',
                    talkingPace: 'Pace of things',
                    anythingElse: 'Additional context from user',
                };
                Object.entries(onboarding).forEach(([key, value]) => {
                    if (key === 'skipped' || !value) return;
                    const label = labelMap[key] || key;
                    context += `${label}: ${value}\n`;
                });
            }
            if (dailyLogs.length > 0) {
                const recentLogs = dailyLogs.slice(0, 3);
                context += '\nRecent daily check-ins:\n';
                recentLogs.forEach(log => {
                    context += `- Energy: ${log.energyExchange}, Direction: ${log.direction}, Emotion: ${log.structured_emotion_state}, Clarity: ${log.clarity}/100\n`;
                });
            }
            if (savedLogs.length > 0) {
                const recentSaved = savedLogs.slice(0, 3);
                context += '\nRecent analysis logs:\n';
                recentSaved.forEach(log => {
                    context += `- [${log.source.toUpperCase()}] ${log.title}: ${log.summary}\n`;
                });
            }

            const result = await aiService.getDailyAdvice(
                connection.name,
                connection.tag,
                connection.zodiac,
                context || 'No prior data available yet.'
            );
            const parsed = aiService.safeParseJSON(result);
            setAdvice(parsed);

            // Cache the advice on the connection so it persists for the day
            updateConnection(connection.id, {
                cachedAdvice: {
                    date: getTodayKey(),
                    stateOfConnection: parsed.stateOfConnection || '',
                    todaysMove: parsed.todaysMove || '',
                    watchFor: parsed.watchFor || '',
                },
            });
        } catch (error: any) {
            logger.error(error, { tags: { feature: 'dailyAdvice', method: 'fetchAdvice' } });
            setAdvice({
                stateOfConnection: `Error: ${error.message || 'Unable to generate advice right now.'}`,
                todaysMove: '',
                watchFor: '',
            });
        } finally {
            setLoadingAdvice(false);
        }
    };

    useEffect(() => {
        // Check if we already have today's cached advice
        const cached = connection.cachedAdvice;
        if (cached && cached.date === getTodayKey()) {
            setAdvice({
                stateOfConnection: cached.stateOfConnection,
                todaysMove: cached.todaysMove,
                watchFor: cached.watchFor,
            });
        } else {
            fetchAdvice();
        }
    }, []);

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    };

    const getSourceColor = (source: string) => {
        switch (source) {
            case 'clarity': return '#ec4899';
            case 'decoder': return '#1C1C1E';
            case 'stars': return '#ec4899';
            default: return '#8E8E93';
        }
    };

    const getSourceIcon = (source: string): any => {
        switch (source) {
            case 'clarity': return 'chatbubble-ellipses-outline';
            case 'decoder': return 'scan-outline';
            case 'stars': return 'sparkles-outline';
            default: return 'document-outline';
        }
    };

    const deleteLog = (logId: string) => {
        const updated = savedLogs.filter(l => l.id !== logId);
        updateConnection(connection.id, { savedLogs: updated });
        setSelectedLog(null);
    };

    return (
        <View style={{ paddingHorizontal: scale(24) }}>
            {/* Header Info Card */}
            <View style={profileStyles.infoCard}>
                <View style={profileStyles.infoRow}>
                    <View style={profileStyles.infoBadge}>
                        <Ionicons name="heart-outline" size={14} color="#ec4899" />
                        <Text style={profileStyles.infoBadgeText}>{connection.tag}</Text>
                    </View>
                    <View style={profileStyles.infoBadge}>
                        <Ionicons name="star-outline" size={14} color="#ec4899" />
                        <Text style={profileStyles.infoBadgeText}>{connection.zodiac}</Text>
                    </View>
                </View>

                {onboarding && (
                    <View style={profileStyles.contextSection}>
                        <Text style={profileStyles.sectionLabel}>BACKSTORY</Text>
                        {onboarding.howWeMet && (
                            <Text style={profileStyles.contextText}>
                                <Text style={{ fontWeight: '700' }}>How you met: </Text>{onboarding.howWeMet}
                            </Text>
                        )}
                        {onboarding.currentIntent && (
                            <Text style={profileStyles.contextText}>
                                <Text style={{ fontWeight: '700' }}>Intent: </Text>{onboarding.currentIntent}
                            </Text>
                        )}
                        {onboarding.howLong && (
                            <Text style={profileStyles.contextText}>
                                <Text style={{ fontWeight: '700' }}>Duration: </Text>{onboarding.howLong}
                            </Text>
                        )}
                    </View>
                )}
            </View>

            {/* Daily Advice Section */}
            <View style={profileStyles.adviceCard}>
                <View style={{ marginBottom: 16 }}>
                    <Text style={profileStyles.sectionTitle}>TODAY'S BRIEFING</Text>
                </View>

                {loadingAdvice ? (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                        <Text style={{ color: '#8E8E93', fontSize: 13, letterSpacing: 0.5 }}>Generating your daily briefing...</Text>
                    </View>
                ) : advice ? (
                    <View style={{ gap: 16 }}>
                        <View style={profileStyles.adviceBlock}>
                            <Text style={profileStyles.adviceLabel}>STATE OF THE CONNECTION</Text>
                            <Text style={profileStyles.adviceText}>{advice.stateOfConnection}</Text>
                        </View>
                        {advice.todaysMove ? (
                            <View style={[profileStyles.adviceBlock, { backgroundColor: '#FDF2F8', borderColor: '#FCE7F3' }]}>
                                <Text style={[profileStyles.adviceLabel, { color: '#ec4899' }]}>TODAY'S MOVE</Text>
                                <Text style={profileStyles.adviceText}>{advice.todaysMove}</Text>
                            </View>
                        ) : null}
                        {advice.watchFor ? (
                            <View style={[profileStyles.adviceBlock, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                <Text style={[profileStyles.adviceLabel, { color: '#8E8E93' }]}>WATCH FOR</Text>
                                <Text style={profileStyles.adviceText}>{advice.watchFor}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : null}
            </View>

            {/* Saved Logs Section */}
            <View style={profileStyles.logsSection}>
                <Text style={profileStyles.sectionTitle}>SAVED ANALYSIS</Text>
                <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 16, marginTop: 4 }}>
                    Logs from Clarity, Decoder & Stars
                </Text>

                {savedLogs.length === 0 ? (
                    <View style={profileStyles.emptyState}>
                        <Ionicons name="file-tray-outline" size={32} color="#D1D1D6" />
                        <Text style={profileStyles.emptyText}>No saved logs yet.</Text>
                        <Text style={profileStyles.emptySubtext}>Use Clarity, Decoder, or Stars and hit "Save" to build your analysis history.</Text>
                    </View>
                ) : (
                    <View style={{ gap: 10 }}>
                        {savedLogs.map((log) => (
                            <TouchableOpacity
                                key={log.id}
                                style={profileStyles.logCard}
                                onPress={() => setSelectedLog(log)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <View style={[profileStyles.logIcon, { backgroundColor: getSourceColor(log.source) + '15' }]}>
                                        <Ionicons name={getSourceIcon(log.source)} size={16} color={getSourceColor(log.source)} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={profileStyles.logTitle}>{log.title}</Text>
                                        <Text style={profileStyles.logDate}>{formatDate(log.date)}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={16} color="#D1D1D6" />
                                </View>
                                <Text style={profileStyles.logSummary} numberOfLines={2}>{log.summary}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Daily Check-In History */}
            {dailyLogs.length > 0 && (
                <View style={profileStyles.logsSection}>
                    <Text style={profileStyles.sectionTitle}>DAILY LOGS</Text>
                    <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 16, marginTop: 4 }}>
                        Dynamic check-in history
                    </Text>
                    <View style={{ gap: 10 }}>
                        {dailyLogs.slice(0, 10).map((log) => (
                            <View key={log.id} style={profileStyles.dailyLogCard}>
                                <Text style={profileStyles.dailyLogDate}>{formatDate(log.date)}</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                    <View style={[profileStyles.dailyTag, { backgroundColor: '#FDF2F8' }]}>
                                        <Text style={[profileStyles.dailyTagText, { color: '#ec4899' }]}>{log.energyExchange}</Text>
                                    </View>
                                    <View style={[profileStyles.dailyTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[profileStyles.dailyTagText, { color: '#1C1C1E' }]}>{log.direction}</Text>
                                    </View>
                                    <View style={[profileStyles.dailyTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[profileStyles.dailyTagText, { color: '#8E8E93' }]}>{log.structured_emotion_state}</Text>
                                    </View>
                                    <View style={[profileStyles.dailyTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[profileStyles.dailyTagText, { color: '#8E8E93' }]}>Clarity: {log.clarity}%</Text>
                                    </View>
                                </View>
                                {log.notable ? (
                                    <Text style={profileStyles.dailyNote}>"{log.notable}"</Text>
                                ) : null}
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Log Detail Modal — Structured UI by source type */}
            <Modal
                visible={!!selectedLog}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedLog(null)}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                        {/* Modal Header */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <TouchableOpacity onPress={() => setSelectedLog(null)}>
                                <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => selectedLog && deleteLog(selectedLog.id)}>
                                <Text style={{ color: '#ec4899', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 }}>DELETE</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedLog && (
                            <>
                                {/* Source Icon + Title + Date */}
                                <View style={[profileStyles.logIcon, { backgroundColor: getSourceColor(selectedLog.source) + '15', marginBottom: 12 }]}>
                                    <Ionicons name={getSourceIcon(selectedLog.source)} size={20} color={getSourceColor(selectedLog.source)} />
                                </View>
                                <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', fontSize: 22, color: '#1C1C1E', marginBottom: 4 }}>{selectedLog.title}</Text>
                                <Text style={{ color: '#8E8E93', fontSize: 12, marginBottom: 24 }}>{formatDate(selectedLog.date)}</Text>

                                {/* ── DECODER: Structured cards ── */}
                                {selectedLog.source === 'decoder' && (() => {
                                    // Parse "Key: Value\nKey: Value" format
                                    const fields: Record<string, string> = {};
                                    const lines = selectedLog.fullContent.split('\n');
                                    lines.forEach(line => {
                                        const colonIdx = line.indexOf(':');
                                        if (colonIdx > -1) {
                                            const key = line.substring(0, colonIdx).trim();
                                            const val = line.substring(colonIdx + 1).trim();
                                            fields[key] = val;
                                        }
                                    });
                                    const risks = fields['Risks'] ? fields['Risks'].split(',').map(r => r.trim()).filter(Boolean) : [];

                                    return (
                                        <View style={{ gap: 20 }}>
                                            {/* Row 1: Tone & Effort */}
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                                <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                                    <Text style={styles.decoderBoxLabel}>TONE</Text>
                                                    <Text style={styles.decoderBoxValue}>{fields['Tone'] || '—'}</Text>
                                                </View>
                                                <View style={[styles.decoderBox, { flex: 1, backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                                    <Text style={styles.decoderBoxLabel}>EFFORT</Text>
                                                    <Text style={styles.decoderBoxValue}>{fields['Effort'] || '—'}</Text>
                                                </View>
                                            </View>

                                            {/* Power Dynamics */}
                                            {fields['Power Dynamics'] && (
                                                <View style={[styles.decoderBox, { backgroundColor: '#FFFFFF', borderColor: '#1C1C1E', borderWidth: 1 }]}>
                                                    <Text style={[styles.decoderBoxLabel, { color: '#1C1C1E' }]}>POWER DYNAMICS</Text>
                                                    <Text style={styles.decoderBoxBody}>{fields['Power Dynamics']}</Text>
                                                </View>
                                            )}

                                            {/* What's Actually Being Said */}
                                            {fields['Subtext'] && (
                                                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                                    <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>WHAT'S ACTUALLY BEING SAID</Text>
                                                    <Text style={styles.decoderBoxBody}>{fields['Subtext']}</Text>
                                                </View>
                                            )}

                                            {/* The Why */}
                                            {fields['Motivation'] && (
                                                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                                    <Text style={styles.decoderBoxLabel}>THE "WHY"</Text>
                                                    <Text style={styles.decoderBoxBody}>{fields['Motivation']}</Text>
                                                </View>
                                            )}

                                            {/* Detected Signals */}
                                            {risks.length > 0 && (
                                                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                                    <Text style={[styles.decoderBoxLabel, { color: '#8E8E93' }]}>DETECTED SIGNALS</Text>
                                                    <View style={{ gap: 8, marginTop: 4 }}>
                                                        {risks.map((risk, index) => (
                                                            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8E8E93' }} />
                                                                <Text style={[styles.decoderBoxBody, { fontSize: 13 }]}>{risk}</Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                </View>
                                            )}

                                            {/* Suggested Reply */}
                                            {fields['Suggested Reply'] && (
                                                <View style={[styles.decoderBox, { backgroundColor: '#FAFAFA', borderColor: '#E5E5E5', marginTop: 4 }]}>
                                                    <Text style={[styles.decoderBoxLabel, { color: '#525252' }]}>SUGGESTED REPLY</Text>
                                                    <Text style={[styles.decoderBoxBody, { fontStyle: 'italic' }]}>"{fields['Suggested Reply']}"</Text>
                                                </View>
                                            )}
                                        </View>
                                    );
                                })()}

                                {/* ── CLARITY: Chat-style transcript ── */}
                                {selectedLog.source === 'clarity' && (() => {
                                    const messages = selectedLog.fullContent
                                        .split(/\\n\\n|\n\n/)
                                        .filter(m => m.trim().length > 0)
                                        .map(m => {
                                            const isUser = m.startsWith('You:');
                                            const text = m.replace(/^(You|Signal):\s*/, '');
                                            return { isUser, text };
                                        });

                                    return (
                                        <View style={{ gap: 12 }}>
                                            {messages.map((msg, i) => (
                                                <View
                                                    key={i}
                                                    style={{
                                                        alignSelf: msg.isUser ? 'flex-end' : 'flex-start',
                                                        maxWidth: '85%',
                                                        backgroundColor: msg.isUser ? '#1C1C1E' : '#F2F2F7',
                                                        borderRadius: 18,
                                                        borderBottomRightRadius: msg.isUser ? 4 : 18,
                                                        borderBottomLeftRadius: msg.isUser ? 18 : 4,
                                                        paddingHorizontal: 16,
                                                        paddingVertical: 12,
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontSize: 14,
                                                        lineHeight: 21,
                                                        color: msg.isUser ? '#FFFFFF' : '#1C1C1E',
                                                        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                                                    }}>{msg.text}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    );
                                })()}

                                {/* ── STARS: Styled content card ── */}
                                {selectedLog.source === 'stars' && (
                                    <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                                        <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>COSMIC ANALYSIS</Text>
                                        <Text style={[styles.decoderBoxBody, { lineHeight: 24 }]}>{selectedLog.fullContent}</Text>
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>
                </SafeAreaView>
            </Modal>

            <View style={{ height: 40 }} />
        </View>
    );
};

const profileStyles = StyleSheet.create({
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
    },
    infoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    infoBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#6B7280',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    contextSection: {
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
        paddingTop: 16,
    },
    contextText: {
        fontSize: 13,
        color: '#3A3A3C',
        lineHeight: 20,
        marginBottom: 4,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    adviceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1.5,
    },
    adviceBlock: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    adviceLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 8,
    },
    adviceText: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 22,
    },
    logsSection: {
        marginBottom: 24,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    emptyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 12,
        color: '#B0B0B0',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 40,
    },
    logCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    logIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    logDate: {
        fontSize: 11,
        color: '#8E8E93',
        marginTop: 1,
    },
    logSummary: {
        fontSize: 12,
        color: '#6B7280',
        lineHeight: 18,
    },
    dailyLogCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    dailyLogDate: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
    },
    dailyTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dailyTagText: {
        fontSize: 10,
        fontWeight: '700',
    },
    dailyNote: {
        fontSize: 13,
        color: '#6B7280',
        fontStyle: 'italic',
        marginTop: 8,
    },
});



export default function ConnectionDetailScreen() {
    const { id: paramId, tab: paramTab, name: paramName, tag: paramTag, zodiac: paramZodiac, icon: paramIcon } = useLocalSearchParams();
    const router = useRouter();
    const { connections, updateConnection, deleteConnection, setShowPaywall } = useConnections();

    // Determine initial section from route params
    type HubSection = 'OVERVIEW' | 'UNDERSTAND' | 'CLARITY';
    type UnderstandTool = 'DECODER' | 'STARS' | 'DYNAMIC' | null;

    const mapParamToSection = (tab: string): { section: HubSection; tool: UnderstandTool } => {
        switch (tab) {
            case 'CLARITY': return { section: 'CLARITY', tool: null };
            case 'DECODER': return { section: 'UNDERSTAND', tool: 'DECODER' };
            case 'STARS': return { section: 'UNDERSTAND', tool: 'STARS' };
            case 'DYNAMIC': return { section: 'UNDERSTAND', tool: 'DYNAMIC' };
            case 'UNDERSTAND': return { section: 'UNDERSTAND', tool: null };
            default: return { section: 'OVERVIEW', tool: null };
        }
    };

    const initialMapping = mapParamToSection(String(paramTab || 'OVERVIEW'));
    const [activeSection, setActiveSection] = useState<HubSection>(initialMapping.section);
    const [activeTool, setActiveTool] = useState<UnderstandTool>(initialMapping.tool);

    // Find the connection in context
    const connection = connections.find(c => c.id === paramId);

    // Fallback or Loading state could be better, but using params as initial data
    const name = String(connection?.name || paramName || 'sam');
    const tag = String(connection?.tag || paramTag || 'SITUATIONSHIP');
    const zodiac = String(connection?.zodiac || paramZodiac || 'LIBRA');
    const icon = connection?.icon || paramIcon || 'leaf-outline';
    const status = connection?.status || 'active';
    const connectionId = String(paramId);

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
                    tag={connection.tag || 'OTHER'}
                    onComplete={handleOnboardingComplete}
                />
            </SafeAreaView>
        );
    }

    const SECTIONS: HubSection[] = ['OVERVIEW', 'UNDERSTAND', 'CLARITY'];

    const UNDERSTAND_TOOLS = [
        { id: 'DECODER' as const, label: 'Decoder', icon: 'scan-outline' as const, description: 'Read between the lines' },
        { id: 'STARS' as const, label: 'Stars', icon: 'sparkles-outline' as const, description: 'Cosmic compatibility' },
        { id: 'DYNAMIC' as const, label: 'Dynamic', icon: 'pulse-outline' as const, description: 'Daily energy log' },
    ];

    const handleSectionChange = (section: HubSection) => {
        setActiveSection(section);
        if (section !== 'UNDERSTAND') {
            setActiveTool(null);
        }
    };

    const handleToolSelect = (tool: UnderstandTool) => {
        setActiveTool(tool);
    };

    const handleBackFromTool = () => {
        setActiveTool(null);
    };

    // If a specific tool is active in UNDERSTAND, show the tool directly
    const showingTool = activeSection === 'UNDERSTAND' && activeTool !== null;

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
                        <TouchableOpacity
                            onPress={() => {
                                if (showingTool) {
                                    handleBackFromTool();
                                } else {
                                    router.back();
                                }
                            }}
                            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="arrow-back" size={12} color="#8E8E93" style={{ marginRight: 4 }} />
                                <Text style={styles.navText}>
                                    {showingTool ? 'BACK' : 'CONNECTIONS'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        {!showingTool && (
                            <TouchableOpacity onPress={handleEdit}>
                                <Text style={styles.navText}>EDIT</Text>
                            </TouchableOpacity>
                        )}
                        {showingTool && (
                            <Text style={styles.toolHeaderTitle}>{activeTool}</Text>
                        )}
                    </View>

                    {/* Profile Header — always visible */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name={icon as any} size={40} color="#8E8E93" />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{name}</Text>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                <View style={styles.tagBadge}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                                <View style={[styles.tagBadge, { backgroundColor: '#F9FAFB' }]}>
                                    <Text style={[styles.tagText, { color: '#8E8E93' }]}>{zodiac}</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Segmented Control — OVERVIEW / UNDERSTAND / DECIDE */}
                    {!showingTool && (
                        <View style={hubStyles.segmentedContainer}>
                            <View style={hubStyles.segmentedControl}>
                                {SECTIONS.map((section) => (
                                    <TouchableOpacity
                                        key={section}
                                        style={[
                                            hubStyles.segmentButton,
                                            activeSection === section && hubStyles.segmentButtonActive,
                                        ]}
                                        onPress={() => handleSectionChange(section)}
                                    >
                                        <Text style={[
                                            hubStyles.segmentText,
                                            activeSection === section && hubStyles.segmentTextActive,
                                        ]}>
                                            {section}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Section Content */}
                    {activeSection === 'OVERVIEW' && (
                        <>
                            {connection && <ProfileContent connection={connection} />}
                        </>
                    )}

                    {activeSection === 'UNDERSTAND' && !activeTool && (
                        <View style={hubStyles.toolGrid}>
                            {UNDERSTAND_TOOLS.map((tool) => (
                                <TouchableOpacity
                                    key={tool.id}
                                    style={hubStyles.toolCard}
                                    activeOpacity={0.7}
                                    onPress={() => handleToolSelect(tool.id)}
                                >
                                    <View style={hubStyles.toolIconWrap}>
                                        <Ionicons name={tool.icon} size={24} color="#ec4899" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={hubStyles.toolName}>{tool.label}</Text>
                                        <Text style={hubStyles.toolDesc}>{tool.description}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color="#D1D1D6" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {activeSection === 'UNDERSTAND' && activeTool === 'DECODER' && (
                        <DecoderContent name={Array.isArray(name) ? name[0] : name} connectionId={connectionId} />
                    )}

                    {activeSection === 'UNDERSTAND' && activeTool === 'STARS' && (
                        <StarsContent
                            name={Array.isArray(name) ? name[0] : name}
                            userZodiac="Capricorn"
                            partnerZodiac={zodiac}
                        />
                    )}

                    {activeSection === 'UNDERSTAND' && activeTool === 'DYNAMIC' && connection && (
                        <DynamicContent connection={connection} />
                    )}

                    {activeSection === 'CLARITY' && (
                        <ClarityContent name={Array.isArray(name) ? name[0] : name} connectionId={connectionId} />
                    )}

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const hubStyles = StyleSheet.create({
    segmentedContainer: {
        paddingHorizontal: scale(24),
        marginBottom: verticalScale(20),
    },
    segmentedControl: {
        flexDirection: 'row',
        backgroundColor: '#F2F2F7',
        borderRadius: scale(14),
        padding: scale(3),
    },
    segmentButton: {
        flex: 1,
        paddingVertical: verticalScale(10),
        borderRadius: scale(12),
        alignItems: 'center',
    },
    segmentButtonActive: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    segmentText: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    segmentTextActive: {
        color: '#1C1C1E',
        fontWeight: '800',
    },
    toolGrid: {
        paddingHorizontal: scale(24),
        gap: verticalScale(12),
    },
    toolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: scale(18),
        padding: scale(18),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        gap: scale(14),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 1,
    },
    toolIconWrap: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(16),
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toolName: {
        fontSize: fs(16),
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: verticalScale(2),
    },
    toolDesc: {
        fontSize: fs(12),
        color: '#8E8E93',
    },
});

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
        alignItems: 'center',
        paddingHorizontal: scale(24),
        paddingTop: verticalScale(24),
        paddingBottom: verticalScale(8),
        marginBottom: verticalScale(16),
    },
    toolHeaderTitle: {
        fontSize: fs(12),
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
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
        justifyContent: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        flex: 1,
    },
    tabButton: {
        paddingVertical: 12,
        marginRight: scale(20),
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
        backgroundColor: '#FDF2F8',
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
        color: '#ec4899',
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
        color: '#ec4899',
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
        backgroundColor: '#FDF2F8',
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
        color: '#ec4899',
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
    noImGoodButton: {
        paddingVertical: verticalScale(16),
        borderRadius: scale(32),
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        backgroundColor: 'transparent',
    },
    noImGoodText: {
        color: '#8E8E93',
        fontSize: fs(12),
        fontWeight: '600',
        letterSpacing: 1.5,
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
    decoderModalTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(24),
        color: '#1C1C1E',
        marginBottom: verticalScale(8),
    },
    decoderModalSubtitle: {
        fontSize: fs(14),
        color: '#8E8E93',
        marginBottom: verticalScale(32),
    },
    decoderBox: {
        padding: scale(16),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: 'transparent',
    },
    decoderBoxLabel: {
        fontSize: fs(10),
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: verticalScale(8),
    },
    decoderBoxValue: {
        fontSize: fs(16),
        fontWeight: '600',
        color: '#1C1C1E',
    },
    decoderBoxBody: {
        fontSize: fs(15),
        lineHeight: verticalScale(24),
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    decoderInputContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: scale(16),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(16),
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    connectionThemeText: {
        fontSize: fs(24),
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        color: '#1C1C1E',
        marginBottom: verticalScale(12),
        lineHeight: verticalScale(32),
    },
    logSection: {
        marginBottom: verticalScale(32),
    },
    radioGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: scale(12),
        justifyContent: 'space-between',
    },
    radioOption: {
        flexGrow: 1,
        flexBasis: '30%',
        paddingVertical: verticalScale(14),
        paddingHorizontal: scale(4),
        borderRadius: scale(16),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioOptionSelected: {
        borderColor: '#FBCFE8', // pink-200
        backgroundColor: '#FDF2F8', // pink-50
    },
    radioText: {
        fontSize: fs(10),
        fontWeight: '600',
        color: '#4B5563',
        textAlign: 'center',
    },
    radioTextSelected: {
        color: '#DB2777', // pink-600
        fontWeight: '800',
    },
    sliderLabel: {
        fontSize: fs(9),
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 1,
    },
    otherInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: scale(12),
        paddingHorizontal: scale(16),
        paddingVertical: verticalScale(10),
        fontSize: fs(14),
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    },
});
