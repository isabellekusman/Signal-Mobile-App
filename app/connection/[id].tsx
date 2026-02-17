
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
// Content Component for the "Decoder" tab
// Content Component for the "Decoder" tab
// Content Component for the "Decoder" tab
const DecoderContent = ({ name }: { name: string }) => {
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
            console.error("Error picking image:", error);
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

            let jsonString = resultString.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(jsonString);

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
        } catch (error) {
            console.error("Decoder parsing error", error);
            setAnalysis({
                tone: "Error",
                effort: "N/A",
                powerDynamics: "N/A",
                subtext: "Could not decode this thread.",
                motivation: "N/A",
                risks: [],
                replySuggestion: ""
            });
            setIsAnalysisOpen(true);
        } finally {
            setLoading(false);
        }
    };

    const translateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, verticalScale(220)],
    });

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
                                    <View style={[styles.decoderBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                                        <Text style={[styles.decoderBoxLabel, { color: '#D97706' }]}>DETECTED SIGNALS</Text>
                                        <View style={{ gap: 8, marginTop: 4 }}>
                                            {analysis.risks.map((risk, index) => (
                                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#D97706' }} />
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
            let jsonString = resultString.replace(/```json/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(jsonString);

            setForecast(result);
            await AsyncStorage.setItem(storageKey, JSON.stringify(result));

        } catch (error) {
            console.error(error);
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
                                    <View style={[styles.decoderBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                            <Ionicons name="planet" size={16} color="#0EA5E9" />
                                            <Text style={[styles.decoderBoxLabel, { marginBottom: 0, color: '#0EA5E9' }]}>CURRENT PLANETARY TRANSITS</Text>
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
                    {activeTab === 'DECODER' && <DecoderContent name={Array.isArray(name) ? name[0] : name} />}
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
});
