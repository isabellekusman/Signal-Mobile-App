
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useConnections } from '../context/ConnectionsContext';
import { haptics } from '../services/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PINK = '#ec4899';
const DARK = '#1C1C1E';
const GRAY = '#8E8E93';
const SOFT_GRAY = '#C7C7CC';
const LIGHT_GRAY = '#F2F2F7';
const OFF_WHITE = '#F9FAFB';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SERIF_ITALIC = Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif';

const ZODIAC_SIGNS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

const STANDARD_OPTIONS = [
    'Growth mindset', 'Transparency', 'Mutual respect',
    'Shared ambition', 'Emotional depth', 'Consistency',
    'Independence', 'Loyalty', 'Humor', 'Intellectual connection',
];

const BOUNDARY_OPTIONS = [
    'No phones at dinner', 'Direct communication only',
    'Respect my alone time', 'No keeping score',
    'Honesty over comfort', 'No silent treatment',
    'Respect my friendships', 'No rushing intimacy',
];

const ATTACHMENT_STYLES = [
    { id: 'secure', label: 'Secure', desc: 'Comfortable with closeness and independence' },
    { id: 'anxious', label: 'Anxious', desc: 'Crave closeness, worry about being left' },
    { id: 'avoidant', label: 'Avoidant', desc: 'Value independence, uncomfortable with too much closeness' },
    { id: 'disorganized', label: 'Disorganized', desc: 'Mixed feelings about closeness and distance' },
    { id: 'unsure', label: "I'm not sure", desc: "Signal will help you figure this out" },
];

const LOVE_LANGUAGES = [
    'Words of Affirmation', 'Acts of Service', 'Quality Time',
    'Physical Touch', 'Receiving Gifts',
];

const DEALBREAKER_OPTIONS = [
    'Dishonesty', 'Lack of ambition', 'Poor communication',
    'Jealousy', 'Controlling behavior', 'Emotional unavailability',
    'Inconsistency', 'Disrespect', 'Lack of accountability',
];

// ─── STEP COMPONENTS ─────────────────────────────────────────────

function WelcomeStep({ isOver13, toggleAge }: { isOver13: boolean, toggleAge: () => void }) {
    return (
        <View style={s.stepCenter}>
            <View style={s.welcomeIconWrap}>
                <Ionicons name="sparkles" size={32} color={PINK} />
            </View>
            <Text style={s.welcomeTitle}>Welcome to Signal</Text>
            <Text style={s.welcomeSubtitle}>
                LET'S BUILD YOUR PROFILE
            </Text>
            <Text style={s.welcomeBody}>
                A few questions to help Signal understand who you are,
                what you value, and how you move in relationships.
            </Text>
            <Text style={s.welcomeHint}>
                This takes about 2 minutes. You can always update later.
            </Text>

            <TouchableOpacity
                style={s.ageCheckboxContainer}
                onPress={toggleAge}
                activeOpacity={0.8}
            >
                <Ionicons
                    name={isOver13 ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={isOver13 ? PINK : GRAY}
                />
                <Text style={s.ageCheckboxText}>
                    I confirm that I am at least 13 years old.
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function NameStep({ name, onChangeName }: { name: string; onChangeName: (v: string) => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>What should we call you?</Text>
            <Text style={s.stepLabel}>YOUR NAME</Text>
            <TextInput
                style={s.textInput}
                placeholder="First name or nickname"
                placeholderTextColor={SOFT_GRAY}
                value={name}
                onChangeText={onChangeName}
                selectionColor={DARK}
                autoFocus
            />
        </View>
    );
}

function ZodiacStep({ zodiac, onSelect }: { zodiac: string; onSelect: (v: string) => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>What's your sign?</Text>
            <Text style={s.stepLabel}>ZODIAC SIGN</Text>
            <View style={s.gridWrap}>
                {ZODIAC_SIGNS.map((sign) => (
                    <TouchableOpacity
                        key={sign}
                        style={[s.gridItem, zodiac === sign && s.gridItemActive]}
                        onPress={() => onSelect(sign)}
                    >
                        <Text style={[s.gridItemText, zodiac === sign && s.gridItemTextActive]}>
                            {sign}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function StandardsStep({ selected, onToggle, customValue, onChangeCustom, onAddCustom }: { selected: string[]; onToggle: (v: string) => void; customValue: string; onChangeCustom: (v: string) => void; onAddCustom: () => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>What do you value most?</Text>
            <Text style={s.stepLabel}>SELECT YOUR NON-NEGOTIABLES</Text>
            <View style={s.chipGrid}>
                {STANDARD_OPTIONS.map((item) => {
                    const isActive = selected.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[s.chip, isActive && s.chipActive]}
                            onPress={() => onToggle(item)}
                        >
                            <Text style={[s.chipText, isActive && s.chipTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                })}
                {/* Custom items the user already added */}
                {selected.filter(x => !STANDARD_OPTIONS.includes(x)).map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[s.chip, s.chipActive]}
                        onPress={() => onToggle(item)}
                    >
                        <Text style={[s.chipText, s.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={s.otherRow}>
                <TextInput
                    style={s.otherInput}
                    placeholder="Other…"
                    placeholderTextColor="#C7C7CC"
                    value={customValue}
                    onChangeText={onChangeCustom}
                    selectionColor="#1C1C1E"
                />
                <TouchableOpacity style={s.otherAddBtn} onPress={onAddCustom}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function BoundariesStep({ selected, onToggle, customValue, onChangeCustom, onAddCustom }: { selected: string[]; onToggle: (v: string) => void; customValue: string; onChangeCustom: (v: string) => void; onAddCustom: () => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>What are your boundaries?</Text>
            <Text style={s.stepLabel}>LINES THAT SHOULDN'T BE CROSSED</Text>
            <View style={s.chipGrid}>
                {BOUNDARY_OPTIONS.map((item) => {
                    const isActive = selected.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[s.chip, isActive && s.chipActive]}
                            onPress={() => onToggle(item)}
                        >
                            <Text style={[s.chipText, isActive && s.chipTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                })}
                {selected.filter(x => !BOUNDARY_OPTIONS.includes(x)).map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[s.chip, s.chipActive]}
                        onPress={() => onToggle(item)}
                    >
                        <Text style={[s.chipText, s.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={s.otherRow}>
                <TextInput
                    style={s.otherInput}
                    placeholder="Other…"
                    placeholderTextColor="#C7C7CC"
                    value={customValue}
                    onChangeText={onChangeCustom}
                    selectionColor="#1C1C1E"
                />
                <TouchableOpacity style={s.otherAddBtn} onPress={onAddCustom}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function AttachmentStep({ selected, onToggle }: { selected: string[]; onToggle: (v: string) => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>How do you attach?</Text>
            <Text style={s.stepLabel}>SELECT ALL THAT APPLY</Text>
            <View style={{ gap: 10 }}>
                {ATTACHMENT_STYLES.map((item) => {
                    const isActive = selected.includes(item.id);
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[s.attachOption, isActive && s.attachOptionActive]}
                            onPress={() => onToggle(item.id)}
                        >
                            <Text style={[s.attachLabel, isActive && s.attachLabelActive]}>
                                {item.label}
                            </Text>
                            <Text style={[s.attachDesc, isActive && s.attachDescActive]}>
                                {item.desc}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

function LoveLanguageStep({ selected, onSelect }: { selected: string; onSelect: (v: string) => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>How do you receive love?</Text>
            <Text style={s.stepLabel}>PRIMARY LOVE LANGUAGE</Text>
            <View style={{ gap: 10 }}>
                {LOVE_LANGUAGES.map((lang) => (
                    <TouchableOpacity
                        key={lang}
                        style={[s.attachOption, selected === lang && s.attachOptionActive]}
                        onPress={() => onSelect(lang)}
                    >
                        <Text style={[s.attachLabel, selected === lang && s.attachLabelActive]}>
                            {lang}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}

function DealbreakerStep({ selected, onToggle, customValue, onChangeCustom, onAddCustom }: { selected: string[]; onToggle: (v: string) => void; customValue: string; onChangeCustom: (v: string) => void; onAddCustom: () => void }) {
    return (
        <View style={s.stepContent}>
            <Text style={s.stepTitle}>Your dealbreakers</Text>
            <Text style={s.stepLabel}>WHAT MAKES YOU WALK AWAY</Text>
            <View style={s.chipGrid}>
                {DEALBREAKER_OPTIONS.map((item) => {
                    const isActive = selected.includes(item);
                    return (
                        <TouchableOpacity
                            key={item}
                            style={[s.chip, isActive && s.chipActive]}
                            onPress={() => onToggle(item)}
                        >
                            <Text style={[s.chipText, isActive && s.chipTextActive]}>{item}</Text>
                        </TouchableOpacity>
                    );
                })}
                {selected.filter(x => !DEALBREAKER_OPTIONS.includes(x)).map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={[s.chip, s.chipActive]}
                        onPress={() => onToggle(item)}
                    >
                        <Text style={[s.chipText, s.chipTextActive]}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <View style={s.otherRow}>
                <TextInput
                    style={s.otherInput}
                    placeholder="Other…"
                    placeholderTextColor="#C7C7CC"
                    value={customValue}
                    onChangeText={onChangeCustom}
                    selectionColor="#1C1C1E"
                />
                <TouchableOpacity style={s.otherAddBtn} onPress={onAddCustom}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─── MAIN ONBOARDING SCREEN ──────────────────────────────────────

const TOTAL_STEPS = 8; // welcome + 7 quiz steps

export default function OnboardingScreen() {
    const router = useRouter();
    const { completeOnboarding } = useConnections();
    const [step, setStep] = useState(0);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Quiz state
    const [name, setName] = useState('');
    const [zodiac, setZodiac] = useState('');
    const [standards, setStandards] = useState<string[]>([]);
    const [boundaries, setBoundaries] = useState<string[]>([]);
    const [attachmentStyle, setAttachmentStyle] = useState<string[]>([]);
    const [loveLanguage, setLoveLanguage] = useState('');
    const [dealbreakers, setDealbreakers] = useState<string[]>([]);

    // Custom "Other" input state
    const [customStandard, setCustomStandard] = useState('');
    const [customBoundary, setCustomBoundary] = useState('');
    const [customDealbreaker, setCustomDealbreaker] = useState('');

    // Age Gate
    const [isOver13, setIsOver13] = useState(false);

    const addCustomItem = (value: string, list: string[], setter: (v: string[]) => void, clearInput: () => void) => {
        const trimmed = value.trim();
        if (trimmed.length > 0 && !list.includes(trimmed)) {
            setter([...list, trimmed]);
            clearInput();
        }
    };

    const toggleList = (list: string[], item: string, setter: (v: string[]) => void) => {
        if (list.includes(item)) {
            setter(list.filter(x => x !== item));
        } else {
            setter([...list, item]);
        }
    };

    const animateTransition = (newStep: number) => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setStep(newStep);
            Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
        });
    };

    const handleNext = () => {
        haptics.light();
        if (step < TOTAL_STEPS - 1) {
            animateTransition(step + 1);
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        haptics.selection();
        if (step > 0) {
            animateTransition(step - 1);
        }
    };

    const handleSkip = async () => {
        haptics.medium();
        try {
            await completeOnboarding();
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert(
                "Saving Failed",
                error.message || "We couldn't save your onboarding data right now. Please free up some storage or check your connection and try again."
            );
        }
    };

    const handleFinish = async () => {
        haptics.success();
        try {
            await completeOnboarding({
                name,
                zodiac,
                about: '',
                standards,
                boundaries,
                attachmentStyle,
                dealbreakers,
                loveLanguage,
            });
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert(
                "Saving Failed",
                error.message || "We couldn't save your onboarding data right now. Please free up some storage or check your connection and try again."
            );
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0: return <WelcomeStep isOver13={isOver13} toggleAge={() => setIsOver13(!isOver13)} />;
            case 1: return <NameStep name={name} onChangeName={setName} />;
            case 2: return <ZodiacStep zodiac={zodiac} onSelect={setZodiac} />;
            case 3: return <StandardsStep selected={standards} onToggle={(v) => toggleList(standards, v, setStandards)} customValue={customStandard} onChangeCustom={setCustomStandard} onAddCustom={() => addCustomItem(customStandard, standards, setStandards, () => setCustomStandard(''))} />;
            case 4: return <BoundariesStep selected={boundaries} onToggle={(v) => toggleList(boundaries, v, setBoundaries)} customValue={customBoundary} onChangeCustom={setCustomBoundary} onAddCustom={() => addCustomItem(customBoundary, boundaries, setBoundaries, () => setCustomBoundary(''))} />;
            case 5: return <AttachmentStep selected={attachmentStyle} onToggle={(v) => toggleList(attachmentStyle, v, setAttachmentStyle)} />;
            case 6: return <LoveLanguageStep selected={loveLanguage} onSelect={setLoveLanguage} />;
            case 7: return <DealbreakerStep selected={dealbreakers} onToggle={(v) => toggleList(dealbreakers, v, setDealbreakers)} customValue={customDealbreaker} onChangeCustom={setCustomDealbreaker} onAddCustom={() => addCustomItem(customDealbreaker, dealbreakers, setDealbreakers, () => setCustomDealbreaker(''))} />;
            default: return null;
        }
    };

    const isLastStep = step === TOTAL_STEPS - 1;
    const isFirstStep = step === 0;
    const progress = (step + 1) / TOTAL_STEPS;

    return (
        <SafeAreaView style={s.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                {/* Top bar: progress + skip */}
                <View style={s.topBar}>
                    <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={s.skipText}>SKIP</Text>
                    </TouchableOpacity>
                </View>

                {/* Step content */}
                <ScrollView
                    contentContainerStyle={s.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Animated.View style={[s.stepWrap, { opacity: fadeAnim }]}>
                        {renderStep()}
                    </Animated.View>
                </ScrollView>

                {/* Bottom navigation */}
                <View style={s.bottomBar}>
                    {!isFirstStep ? (
                        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
                            <Ionicons name="arrow-back" size={20} color={GRAY} />
                        </TouchableOpacity>
                    ) : (
                        <View style={{ width: 44 }} />
                    )}

                    {/* Step indicator dots */}
                    <View style={s.dotsRow}>
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    s.dot,
                                    i === step && s.dotActive,
                                    i < step && s.dotCompleted,
                                ]}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[s.nextBtn, isFirstStep && !isOver13 && { opacity: 0.5 }]}
                        onPress={handleNext}
                        disabled={isFirstStep && !isOver13}
                    >
                        <Text style={s.nextBtnText}>
                            {isFirstStep ? 'BEGIN' : isLastStep ? 'FINISH' : 'NEXT'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── STYLES ──────────────────────────────────────────────────────

const s = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 8,
        gap: 16,
    },
    progressTrack: {
        flex: 1,
        height: 3,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: DARK,
        borderRadius: 2,
    },
    skipText: {
        fontSize: 11,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1.5,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    stepWrap: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 20,
    },

    // Welcome
    stepCenter: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    welcomeIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
    },
    welcomeTitle: {
        fontFamily: SERIF_ITALIC,
        fontSize: 36,
        color: DARK,
        marginBottom: 12,
        textAlign: 'center',
    },
    welcomeSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2.5,
        marginBottom: 32,
    },
    welcomeBody: {
        fontFamily: SERIF,
        fontSize: 17,
        color: DARK,
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    welcomeHint: {
        fontSize: 12,
        color: SOFT_GRAY,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 32,
    },
    ageCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: OFF_WHITE,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        gap: 12,
        width: '100%',
    },
    ageCheckboxText: {
        fontSize: 13,
        fontWeight: '600',
        color: DARK,
        flex: 1,
    },

    // Steps
    stepContent: {
        paddingVertical: 20,
    },
    stepTitle: {
        fontFamily: SERIF_ITALIC,
        fontSize: 30,
        color: DARK,
        marginBottom: 16,
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    textInput: {
        backgroundColor: OFF_WHITE,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 18,
        fontSize: 18,
        color: DARK,
        fontFamily: SERIF,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },

    // Grid (Zodiac)
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        backgroundColor: OFF_WHITE,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    gridItemActive: {
        backgroundColor: DARK,
        borderColor: DARK,
    },
    gridItemText: {
        fontSize: 11,
        fontWeight: '700',
        color: DARK,
        letterSpacing: 1,
    },
    gridItemTextActive: {
        color: '#FFFFFF',
    },

    // Chips (Standards, Boundaries, Dealbreakers)
    chipGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 20,
        backgroundColor: OFF_WHITE,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    chipActive: {
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
        borderColor: 'rgba(236, 72, 153, 0.3)',
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
        color: DARK,
    },
    chipTextActive: {
        color: PINK,
        fontWeight: '700',
    },

    // Attachment / Love Language options
    attachOption: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        backgroundColor: OFF_WHITE,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    attachOptionActive: {
        backgroundColor: DARK,
        borderColor: DARK,
    },
    attachLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: DARK,
        marginBottom: 2,
    },
    attachLabelActive: {
        color: '#FFFFFF',
    },
    attachDesc: {
        fontSize: 12,
        color: GRAY,
        marginTop: 2,
    },
    attachDescActive: {
        color: 'rgba(255,255,255,0.7)',
    },

    // Bottom bar
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: LIGHT_GRAY,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: OFF_WHITE,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    dotsRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: LIGHT_GRAY,
    },
    dotActive: {
        width: 20,
        backgroundColor: DARK,
        borderRadius: 3,
    },
    dotCompleted: {
        backgroundColor: PINK,
    },
    nextBtn: {
        backgroundColor: DARK,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    nextBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
    },

    // Other / custom input
    otherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 10,
    },
    otherInput: {
        flex: 1,
        backgroundColor: OFF_WHITE,
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 14,
        color: DARK,
        fontFamily: SERIF,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    otherAddBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: DARK,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
});
