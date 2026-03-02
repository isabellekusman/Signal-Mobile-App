import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useAuth } from '../../context/AuthContext';
import { useConnections } from '../../context/ConnectionsContext';
import { db } from '../../services/database';
import { haptics } from '../../services/haptics';
import { logger } from '../../services/logger';
import {
    computeObservedVsInterpreted,
    computeProfileSummary,
    extractData,
    ObservedVsInterpreted,
} from '../../services/profileAggregation';
import {
    ProfileSummary,
} from '../../services/profileTypes';
import { isRevenueCatConfigured } from '../../services/subscription';
import { fontSize as fs, screenPadding, spacing, verticalScale } from '../../utils/responsive';

// ─── Palette ─────────────────────────────────────────────────────
const PINK = '#ec4899';
const DARK = '#1C1C1E';
const MID_DARK = '#3A3A3C';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#F2F2F7';
const SOFT_GRAY = '#C7C7CC';
const OFF_WHITE = '#F9FAFB';
const WHITE = '#FFFFFF';
const PINK_TINT = '#FDF2F8';
const PINK_BORDER = '#FCE7F3';
const CONTRACT_BG = WHITE; // Use white instead of beige
const CONTRACT_BORDER = LIGHT_GRAY;
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';
const SERIF_ITALIC = Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif';

const ZODIAC_SIGNS = [
    'ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO',
    'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES',
];

const STANDARD_SUGGESTIONS = [
    'Growth mindset', 'Transparency', 'Mutual respect',
    'Shared ambition', 'Adventure', 'Emotional depth',
];

const BOUNDARY_SUGGESTIONS = [
    'No phones at dinner', 'Me-time Sunday', 'Work-life balance',
    'Direct feedback', 'Social limits', 'Early nights',
];

// ═══════════════════════════════════════════════════════════════════
//  1. IDENTITY HEADER – no card, persistent
// ═══════════════════════════════════════════════════════════════════

function IdentityHeader({
    name, zodiac, about, archetype, summary,
    onChangeName, onChangeAbout,
    isEditing, onToggleEdit, onOpenZodiac,
}: {
    name: string; zodiac: string; about: string;
    archetype: string; summary: string;
    onChangeName: (v: string) => void;
    onChangeAbout: (v: string) => void;
    isEditing: boolean;
    onToggleEdit: () => void;
    onOpenZodiac: () => void;
}) {
    return (
        <View style={s.identityBlock}>
            <View style={s.identityRow}>
                {/* Large avatar */}
                <View style={s.avatarOuter}>
                    <View style={s.avatar}>
                        <Text style={s.avatarInitial}>
                            {name ? name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={s.editBtn} onPress={onToggleEdit}>
                    <Ionicons
                        name={isEditing ? 'checkmark-outline' : 'pencil-outline'}
                        size={15}
                        color={isEditing ? PINK : GRAY}
                    />
                </TouchableOpacity>
            </View>

            {/* Name */}
            {isEditing ? (
                <TextInput
                    style={s.nameInput}
                    value={name}
                    onChangeText={onChangeName}
                    placeholder="Your name"
                    placeholderTextColor={SOFT_GRAY}
                />
            ) : (
                <Text style={s.nameText}>{name}</Text>
            )}

            {/* Archetype subtitle */}
            <Text style={s.archetypeText}>{archetype.toUpperCase()}</Text>

            {/* Zodiac */}
            {isEditing ? (
                <TouchableOpacity style={s.zodiacRow} onPress={onOpenZodiac}>
                    <Ionicons name="sparkles-outline" size={13} color={PINK} />
                    <Text style={s.zodiacText}>{zodiac || 'Select sign'}</Text>
                    <Ionicons name="chevron-down" size={13} color={GRAY} />
                </TouchableOpacity>
            ) : (
                <View style={s.zodiacRow}>
                    <Ionicons name="sparkles-outline" size={13} color={PINK} />
                    <Text style={s.zodiacText}>{zodiac}</Text>
                </View>
            )}

            {/* Behavioral summary */}
            {isEditing ? (
                <TextInput
                    style={s.aboutInput}
                    value={about}
                    onChangeText={onChangeAbout}
                    placeholder="A short note about yourself…"
                    placeholderTextColor={SOFT_GRAY}
                    multiline
                    maxLength={200}
                />
            ) : summary ? (
                <Text style={s.summaryText}>{summary}</Text>
            ) : about ? (
                <Text style={s.summaryText}>{about}</Text>
            ) : null}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  2. DIAGNOSTIC STATUS BLOCK – "Current Position"
// ═══════════════════════════════════════════════════════════════════

function DiagnosticBlock({ pull, confidence }: {
    pull: ProfileSummary['currentPull'];
    confidence: string;
}) {
    return (
        <View style={s.diagnosticBlock}>
            <View style={s.diagnosticAccent} />
            <View style={s.diagnosticContent}>
                <View style={s.diagnosticHeader}>
                    <Text style={s.diagnosticTitle}>CURRENT POSITION</Text>
                    <View style={s.confidenceBadge}>
                        <View style={[s.confidenceDot, {
                            backgroundColor: confidence === 'high' ? PINK
                                : confidence === 'moderate' ? GRAY : SOFT_GRAY
                        }]} />
                        <Text style={s.confidenceText}>{confidence.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={s.diagnosticHeadline}>{pull.headline}</Text>
                <Text style={s.diagnosticBody}>{pull.explanation}</Text>
                <Text style={s.diagnosticEvidence}>{pull.basedOn}</Text>
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  3. TRAIT METER ROWS – no card background
// ═══════════════════════════════════════════════════════════════════

function TraitMeter({ label, value, explanation }: {
    label: string; value: number; explanation?: string;
}) {
    return (
        <View style={s.traitRow}>
            <View style={s.traitLabelRow}>
                <Text style={s.traitLabel}>{label}</Text>
                <Text style={s.traitValue}>{value}%</Text>
            </View>
            <View style={s.traitTrack}>
                <View style={[s.traitFill, { width: `${Math.min(value, 100)}%` }]} />
            </View>
            {explanation ? (
                <Text style={s.traitExplanation}>{explanation}</Text>
            ) : null}
        </View>
    );
}

function RegulationSection({ reg }: { reg: ProfileSummary['regulationStyle'] }) {
    return (
        <View style={s.traitSection}>
            <Text style={s.sectionTitle}>REGULATION STYLE</Text>
            <View style={s.regLabelRow}>
                <Text style={s.regPrimary}>{reg.primary.toUpperCase()}</Text>
            </View>
            <TraitMeter label="Intensity" value={reg.score} explanation={reg.description} />
        </View>
    );
}

function EmotionalOutcomeSection({ emo }: { emo: ProfileSummary['emotionalOutcome'] }) {
    return (
        <View style={s.traitSection}>
            <Text style={s.sectionTitle}>EMOTIONAL OUTCOME</Text>
            {Object.entries(emo.distribution).map(([emotion, pct]) => (
                <TraitMeter key={emotion} label={emotion} value={pct as number} />
            ))}
            <Text style={s.traitFootnote}>{emo.interpretation}</Text>
        </View>
    );
}

function TendenciesSection({ tendencies }: { tendencies: ProfileSummary['baseline']['tendencies'] }) {
    return (
        <View style={s.traitSection}>
            <Text style={s.sectionTitle}>YOU TEND TO…</Text>
            {tendencies.map((t, i) => {
                const strengthPct = t.strength === 'strong' ? 90
                    : t.strength === 'moderate' ? 60 : 30;
                return (
                    <TraitMeter
                        key={i}
                        label={t.text}
                        value={strengthPct}
                        explanation={`${t.strength} · ${t.evidenceCount} signal${t.evidenceCount !== 1 ? 's' : ''}`}
                    />
                );
            })}
        </View>
    );
}

function SelfTrustSection({ drift }: { drift: ProfileSummary['perceptionDrift'] }) {
    return (
        <View style={s.traitSection}>
            <Text style={s.sectionTitle}>SELF-TRUST</Text>
            <TraitMeter
                label={drift.label}
                value={drift.score}
                explanation={drift.summary}
            />
            <Text style={s.traitEvidence}>
                {drift.driftIndicators} drift indicator{drift.driftIndicators !== 1 ? 's' : ''} detected
            </Text>
        </View>
    );
}

function BoundaryAlignmentSection({ ba }: { ba: ProfileSummary['boundaryAlignment'] }) {
    return (
        <View style={s.traitSection}>
            <Text style={s.sectionTitle}>BOUNDARY ALIGNMENT</Text>
            {ba.total > 0 ? (
                <TraitMeter label="Upheld" value={ba.percentage} explanation={ba.summary} />
            ) : (
                <Text style={s.traitFootnote}>{ba.summary}</Text>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  4. COLLAPSIBLE INSIGHT RATIONALE
// ═══════════════════════════════════════════════════════════════════

function InsightRationale({
    effort, signalStory, trajectory, dynamics, observedInterpreted,
}: {
    effort: ProfileSummary['effortBalance'];
    signalStory: ProfileSummary['signalStory'];
    trajectory: ProfileSummary['trajectory'];
    dynamics: ProfileSummary['repeatingDynamics'];
    observedInterpreted: ObservedVsInterpreted;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={s.rationaleWrap}>
            <TouchableOpacity
                style={s.rationaleHeader}
                onPress={() => setExpanded(!expanded)}
                activeOpacity={0.7}
            >
                <Text style={s.rationaleTitle}>WHY THIS INSIGHT WAS GENERATED</Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={GRAY}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={s.rationaleBody}>

                    {/* Effort Balance */}
                    <View style={s.rationaleSubsection}>
                        <Text style={s.rationaleSubTitle}>EFFORT BALANCE</Text>
                        <View style={s.effortRow}>
                            <View style={s.effortCol}>
                                <Text style={s.effortWho}>YOU</Text>
                                <Text style={s.effortPct}>{effort.youInitiatePct}%</Text>
                                <Text style={s.effortLabel}>initiate</Text>
                                <Text style={s.effortPct}>{effort.youFollowThroughPct}%</Text>
                                <Text style={s.effortLabel}>follow through</Text>
                            </View>
                            <View style={s.effortDivider} />
                            <View style={s.effortCol}>
                                <Text style={s.effortWho}>THEM</Text>
                                <Text style={s.effortPct}>{effort.theyInitiatePct}%</Text>
                                <Text style={s.effortLabel}>initiate</Text>
                                <Text style={s.effortPct}>{effort.theyFollowThroughPct}%</Text>
                                <Text style={s.effortLabel}>follow through</Text>
                            </View>
                        </View>
                        <Text style={s.rationaleNote}>{effort.summary}</Text>
                    </View>

                    {/* Signal vs Story */}
                    <View style={s.rationaleSubsection}>
                        <Text style={s.rationaleSubTitle}>SIGNAL VS STORY</Text>
                        <View style={s.svsBar}>
                            <Text style={s.svsLabel}>Interpretation</Text>
                            <View style={s.svsTrack}>
                                <View style={[s.svsFill, { width: `${Math.min(signalStory.score * 100, 100)}%` }]} />
                            </View>
                            <Text style={s.svsLabel}>Observed</Text>
                        </View>
                        <Text style={s.rationaleNote}>{signalStory.summary}</Text>
                        <Text style={s.rationaleEvidence}>
                            {signalStory.interpretationEvents} interpretations / {signalStory.observationEvents} observations
                        </Text>
                    </View>

                    {/* Observed vs Interpreted */}
                    <View style={s.rationaleSubsection}>
                        <Text style={s.rationaleSubTitle}>OBSERVED VS INTERPRETED</Text>
                        <View style={s.oviRow}>
                            <View style={s.oviCol}>
                                <Text style={s.oviColTitle}>OBSERVED</Text>
                                {observedInterpreted.observed.map((item, i) => (
                                    <View key={i} style={s.oviItem}>
                                        <View style={s.oviBullet} />
                                        <Text style={s.oviText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                            <View style={s.oviDivider} />
                            <View style={s.oviCol}>
                                <Text style={s.oviColTitle}>INTERPRETED</Text>
                                {observedInterpreted.interpreted.map((item, i) => (
                                    <View key={i} style={s.oviItem}>
                                        <View style={[s.oviBullet, { backgroundColor: PINK }]} />
                                        <Text style={s.oviText}>{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Trajectory */}
                    <View style={s.rationaleSubsection}>
                        <Text style={s.rationaleSubTitle}>TRAJECTORY</Text>
                        <View style={s.trajRow}>
                            <View style={[s.trajBadge, {
                                backgroundColor: trajectory.direction === 'stabilizing' ? PINK
                                    : trajectory.direction === 'fading' ? MID_DARK : GRAY
                            }]}>
                                <Text style={s.trajBadgeText}>{trajectory.direction.toUpperCase()}</Text>
                            </View>
                            <Text style={s.trajConf}>confidence: {trajectory.confidence}</Text>
                        </View>
                        <Text style={s.rationaleNote}>{trajectory.statement}</Text>
                    </View>

                    {/* Repeating Dynamics */}
                    <View style={[s.rationaleSubsection, { borderBottomWidth: 0 }]}>
                        <Text style={s.rationaleSubTitle}>REPEATING DYNAMICS</Text>
                        <Text style={s.rationaleNote}>{dynamics.summary}</Text>
                        {dynamics.detected && dynamics.pattern && (
                            <View style={s.patternChain}>
                                {[
                                    { label: 'Trigger', value: dynamics.pattern.trigger },
                                    { label: 'Reaction', value: dynamics.pattern.reaction },
                                    { label: 'Response', value: dynamics.pattern.theirResponse },
                                    { label: 'Result', value: dynamics.pattern.result },
                                ].map((step, i) => (
                                    <React.Fragment key={i}>
                                        <View style={s.patternStep}>
                                            <Text style={s.patternStepLabel}>{step.label}</Text>
                                            <Text style={s.patternStepValue}>{step.value}</Text>
                                        </View>
                                        {i < 3 && (
                                            <Ionicons name="arrow-forward" size={11} color={SOFT_GRAY} style={{ marginHorizontal: 1 }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </View>
                        )}
                        {dynamics.affectedConnections.length > 0 && (
                            <Text style={s.rationaleEvidence}>
                                Across: {dynamics.affectedConnections.join(', ')}
                            </Text>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  5. YOUR CONTRACT – user-authored values
// ═══════════════════════════════════════════════════════════════════

function ContractSection({
    standards, boundaries,
    newStandard, newBoundary,
    onSetNewStandard, onSetNewBoundary,
    onAddStandard, onAddBoundary,
    onRemoveStandard, onRemoveBoundary,
    isEditing, onToggleEdit,
}: {
    standards: string[]; boundaries: string[];
    newStandard: string; newBoundary: string;
    onSetNewStandard: (v: string) => void;
    onSetNewBoundary: (v: string) => void;
    onAddStandard: () => void;
    onAddBoundary: () => void;
    onRemoveStandard: (i: number) => void;
    onRemoveBoundary: (i: number) => void;
    isEditing: boolean;
    onToggleEdit: () => void;
}) {
    return (
        <View style={s.contractSurface}>
            <View style={s.contractHeaderRow}>
                <View>
                    <Text style={s.contractTitle}>YOUR CONTRACT</Text>
                    <Text style={s.contractSubtitle}>What you've defined for yourself</Text>
                </View>
                <TouchableOpacity style={s.contractEditBtn} onPress={onToggleEdit}>
                    <Ionicons
                        name={isEditing ? 'checkmark-circle-outline' : 'create-outline'}
                        size={15}
                        color={isEditing ? PINK : GRAY}
                    />
                    <Text style={[s.contractEditLabel, isEditing && { color: PINK }]}>
                        {isEditing ? 'Done' : 'Edit'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Standards */}
            <View style={s.contractGroup}>
                <Text style={s.contractGroupLabel}>MY STANDARDS</Text>
                {standards.map((item, i) => (
                    <View key={i} style={s.contractItem}>
                        <View style={s.contractItemBullet} />
                        <Text style={s.contractItemText}>{item}</Text>
                        {isEditing && (
                            <TouchableOpacity onPress={() => onRemoveStandard(i)} style={s.removeBtn}>
                                <Ionicons name="close-outline" size={16} color={SOFT_GRAY} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                {isEditing && (
                    <View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
                            {STANDARD_SUGGESTIONS.filter(x => !standards.includes(x)).map((x, i) => (
                                <TouchableOpacity key={i} style={s.contractChip} onPress={() => {
                                    onSetNewStandard('');
                                    // directly add
                                    standards.push(x); // handled by parent
                                    onAddStandard();
                                }}>
                                    <Text style={s.contractChipText}>{x}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={s.addRow}>
                            <TextInput
                                style={s.addInput}
                                placeholder="Add a standard…"
                                placeholderTextColor={SOFT_GRAY}
                                value={newStandard}
                                onChangeText={onSetNewStandard}
                            />
                            <TouchableOpacity style={s.addBtn} onPress={onAddStandard}>
                                <Ionicons name="add-outline" size={18} color={DARK} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Boundaries */}
            <View style={s.contractGroup}>
                <Text style={s.contractGroupLabel}>BOUNDARIES</Text>
                {boundaries.map((item, i) => (
                    <View key={i} style={s.contractItem}>
                        <View style={s.contractItemBullet} />
                        <Text style={s.contractItemText}>{item}</Text>
                        {isEditing && (
                            <TouchableOpacity onPress={() => onRemoveBoundary(i)} style={s.removeBtn}>
                                <Ionicons name="close-outline" size={16} color={SOFT_GRAY} />
                            </TouchableOpacity>
                        )}
                    </View>
                ))}
                {isEditing && (
                    <View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
                            {BOUNDARY_SUGGESTIONS.filter(x => !boundaries.includes(x)).map((x, i) => (
                                <TouchableOpacity key={i} style={s.contractChip} onPress={() => {
                                    onSetNewBoundary('');
                                    boundaries.push(x);
                                    onAddBoundary();
                                }}>
                                    <Text style={s.contractChipText}>{x}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <View style={s.addRow}>
                            <TextInput
                                style={s.addInput}
                                placeholder="Add a boundary…"
                                placeholderTextColor={SOFT_GRAY}
                                value={newBoundary}
                                onChangeText={onSetNewBoundary}
                            />
                            <TouchableOpacity style={s.addBtn} onPress={onAddBoundary}>
                                <Ionicons name="add-outline" size={18} color={DARK} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════

export default function MeScreen() {
    const router = useRouter();
    const { connections, userProfile, setUserProfile, subscriptionTier, setSubscriptionTier, isTrialActive, trialExpiresAt, setShowPaywall } = useConnections();
    const { signOut, user } = useAuth();

    // ── Identity ──
    const [name, setName] = useState(userProfile.name || '');
    const [zodiac, setZodiac] = useState(userProfile.zodiac || '');
    const [aboutMe, setAboutMe] = useState(userProfile.about || '');
    const [isEditingIdentity, setIsEditingIdentity] = useState(false);
    const [showZodiacPicker, setShowZodiacPicker] = useState(false);

    // ── User content ──
    const [standards, setStandards] = useState(
        userProfile.standards
    );
    const [newStandard, setNewStandard] = useState('');
    const [boundaries, setBoundaries] = useState<string[]>(
        userProfile.boundaries
    );
    const [newBoundary, setNewBoundary] = useState('');

    const [isEditingContent, setIsEditingContent] = useState(false);

    // ── Saving logic ──
    const handleToggleEditIdentity = useCallback(async () => {
        if (isEditingIdentity) {
            haptics.medium();
            // Save when toggling OFF
            await setUserProfile({
                ...userProfile,
                name,
                zodiac,
                about: aboutMe,
            });
            logger.breadcrumb('User saved identity changes', 'ui.interaction');
        }
        setIsEditingIdentity(!isEditingIdentity);
        haptics.light();
    }, [isEditingIdentity, userProfile, name, zodiac, aboutMe, setUserProfile]);

    const handleToggleEditContent = useCallback(async () => {
        if (isEditingContent) {
            haptics.medium();
            // Save when toggling OFF
            await setUserProfile({
                ...userProfile,
                standards,
                boundaries,
            });
            logger.breadcrumb('User saved profile content changes', 'ui.interaction');
        }
        setIsEditingContent(!isEditingContent);
        haptics.light();
    }, [isEditingContent, userProfile, standards, boundaries, setUserProfile]);

    // ── Computed profile ──
    const [isRefreshing, setIsRefreshing] = useState(false);

    const profile: ProfileSummary = useMemo(() => {
        return computeProfileSummary(
            connections,
            { name, zodiac, about: aboutMe },
            boundaries,
            [],
        );
    }, [connections, name, zodiac, aboutMe, boundaries]);

    const observedInterpreted: ObservedVsInterpreted = useMemo(() => {
        const data = extractData(connections);
        return computeObservedVsInterpreted(data);
    }, [connections]);

    // Derive archetype + summary for identity header
    const archetype = profile.regulationStyle.primary;
    const behavioralSummary = profile.currentPull.headline;

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    }, []);

    const handleExport = useCallback(async () => {
        try {
            const fullData = {
                exportedAt: new Date().toISOString(),
                user: {
                    id: user?.id,
                    email: user?.email,
                    profile: userProfile,
                },
                connections: connections,
                summary: profile,
            };

            const exportData = JSON.stringify(fullData, null, 2);
            await Share.share({
                message: exportData,
                title: 'My Signal Data Export',
            });
            logger.breadcrumb('User exported their data', 'ui.interaction');
        } catch (error) {
            logger.warn('Export failed', { extra: { error } });
        }
    }, [profile, connections, userProfile, user]);

    // ── Content handlers ──
    const addStandard = () => {
        if (newStandard.trim().length > 0) {
            setStandards([...standards, newStandard.trim()]);
            setNewStandard('');
        }
    };
    const removeStandard = (i: number) => setStandards(standards.filter((_, idx) => idx !== i));

    const addBoundary = () => {
        if (newBoundary.trim().length > 0) {
            setBoundaries([...boundaries, newBoundary.trim()]);
            setNewBoundary('');
        }
    };
    const removeBoundary = (i: number) => setBoundaries(boundaries.filter((_, idx) => idx !== i));

    const handleDeleteAccount = async () => { };
    // Moved to ProfileSettingsScreen

    const handleSignOut = async () => { };
    // Moved to ProfileSettingsScreen

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => logger.error(err, { tags: { feature: 'me', method: 'openLink' } }));
    };



    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets keyboardShouldPersistTaps="handled">

                    {/* ═══ 1. IDENTITY ═══ */}
                    <IdentityHeader
                        name={name}
                        zodiac={zodiac}
                        about={aboutMe}
                        archetype={archetype}
                        summary={behavioralSummary}
                        onChangeName={setName}
                        onChangeAbout={setAboutMe}
                        isEditing={isEditingIdentity}
                        onToggleEdit={handleToggleEditIdentity}
                        onOpenZodiac={() => setShowZodiacPicker(true)}
                    />

                    {/* Refresh + Export row */}
                    <View style={s.actionRow}>
                        <TouchableOpacity style={s.actionBtn} onPress={handleRefresh} disabled={isRefreshing}>
                            {isRefreshing ? (
                                <ActivityIndicator size="small" color={PINK} />
                            ) : (
                                <Ionicons name="refresh-outline" size={13} color={GRAY} />
                            )}
                            <Text style={s.actionLabel}>
                                {isRefreshing ? 'Refreshing…' : 'Refresh'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.actionBtn} onPress={handleExport}>
                            <Ionicons name="download-outline" size={13} color={GRAY} />
                            <Text style={s.actionLabel}>Export</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ═══ 2. DIAGNOSTIC STATUS BLOCK ═══ */}
                    <DiagnosticBlock
                        pull={profile.currentPull}
                        confidence={profile.trajectory.confidence}
                    />

                    {/* ═══ 3. TRAIT METERS ═══ */}
                    <RegulationSection reg={profile.regulationStyle} />
                    <TendenciesSection tendencies={profile.baseline.tendencies} />
                    <EmotionalOutcomeSection emo={profile.emotionalOutcome} />
                    <SelfTrustSection drift={profile.perceptionDrift} />
                    <BoundaryAlignmentSection ba={profile.boundaryAlignment} />

                    {/* ═══ 4. COLLAPSIBLE INSIGHT RATIONALE ═══ */}
                    <InsightRationale
                        effort={profile.effortBalance}
                        signalStory={profile.signalStory}
                        trajectory={profile.trajectory}
                        dynamics={profile.repeatingDynamics}
                        observedInterpreted={observedInterpreted}
                    />

                    {/* ═══ 5. YOUR CONTRACT ═══ */}
                    <ContractSection
                        standards={standards}
                        boundaries={boundaries}
                        newStandard={newStandard}
                        newBoundary={newBoundary}
                        onSetNewStandard={setNewStandard}
                        onSetNewBoundary={setNewBoundary}
                        onAddStandard={addStandard}
                        onAddBoundary={addBoundary}
                        onRemoveStandard={removeStandard}
                        onRemoveBoundary={removeBoundary}
                        isEditing={isEditingContent}
                        onToggleEdit={handleToggleEditContent}
                    />

                    {/* Removed Settings Sections that moved to Profile Settings */}

                    {/* ── Developer Section (Hidden in Prod) ── */}
                    {__DEV__ && (
                        <View style={{ marginTop: 10, marginBottom: 60, padding: 20, backgroundColor: '#F3F4F6', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#D1D5DB' }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: GRAY, letterSpacing: 1.5, marginBottom: 16 }}>DEVELOPER TOOLS</Text>
                            <View style={{ gap: 8 }}>
                                <TouchableOpacity
                                    style={{ backgroundColor: WHITE, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                    onPress={async () => {
                                        const { status } = await Notifications.getPermissionsAsync();
                                        if (status !== 'granted') {
                                            const { status: reqStatus } = await Notifications.requestPermissionsAsync();
                                            if (reqStatus !== 'granted') {
                                                Alert.alert("Permission Required", "Please enable notifications in your phone settings.");
                                                return;
                                            }
                                        }

                                        await Notifications.scheduleNotificationAsync({
                                            content: {
                                                title: 'You & Sam',
                                                body: "You and Sam have been in sync lately. Check in on today's signal.",
                                            },
                                            trigger: {
                                                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                                                seconds: 2
                                            },
                                        });
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: DARK }}>TEST PUSH NOTIFICATION</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ backgroundColor: WHITE, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                    onPress={async () => {
                                        try {
                                            if (!isRevenueCatConfigured()) { alert('RevenueCat not configured'); return; }
                                            const info = await Purchases.getCustomerInfo();
                                            const active = Object.keys(info.entitlements.active);
                                            const all = Object.keys(info.entitlements.all);
                                            alert(`Active: ${active.join(', ') || 'None'}\n\nAll Configured: ${all.join(', ') || 'None'}`);
                                        } catch (e) {
                                            alert("Error fetching info");
                                        }
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: DARK }}>CHECK ENTITLEMENTS</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ backgroundColor: WHITE, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                    onPress={async () => {
                                        try {
                                            if (!isRevenueCatConfigured()) { alert('RevenueCat not configured'); return; }
                                            const offerings = await Purchases.getOfferings();
                                            const pkg = offerings.current?.monthly;
                                            if (!pkg) { alert("No package found"); return; }
                                            const purchase = await Purchases.purchasePackage(pkg);
                                            alert(`SUCCESS: ${Object.keys(purchase.customerInfo.entitlements.active).join(', ')}`);
                                        } catch (e: any) {
                                            alert(e.userCancelled ? "Cancelled" : "Failed");
                                        }
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: DARK }}>TEST PURCHASE (SANDBOX)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ backgroundColor: WHITE, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' }}
                                    onPress={async () => {
                                        try {
                                            if (!isRevenueCatConfigured()) { alert('RevenueCat not configured'); return; }
                                            const info = await Purchases.restorePurchases();
                                            alert(`Restored: ${Object.keys(info.entitlements.active).join(', ')}`);
                                        } catch (e) {
                                            alert("Restore failed");
                                        }
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: '600', color: DARK }}>RESTORE PURCHASES</Text>
                                </TouchableOpacity>

                                {/* Tier Switcher */}
                                <View style={{ marginTop: 8, backgroundColor: WHITE, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB' }}>
                                    <Text style={{ fontSize: 10, fontWeight: '700', color: GRAY, letterSpacing: 1, marginBottom: 8, textAlign: 'center' }}>SIMULATE TIER</Text>
                                    <View style={{ flexDirection: 'row', gap: 6 }}>
                                        {(['free', 'seeker', 'signal'] as const).map((tier) => (
                                            <TouchableOpacity
                                                key={tier}
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 10,
                                                    borderRadius: 8,
                                                    alignItems: 'center',
                                                    backgroundColor: subscriptionTier === tier ? '#1C1C1E' : '#F3F4F6',
                                                    borderWidth: 1,
                                                    borderColor: subscriptionTier === tier ? '#1C1C1E' : '#E5E7EB',
                                                }}
                                                onPress={() => {
                                                    setSubscriptionTier(tier);
                                                    db.upsertProfile({ subscription_tier: tier });
                                                    haptics.selection();
                                                }}
                                            >
                                                <Text style={{
                                                    fontSize: 10,
                                                    fontWeight: '700',
                                                    letterSpacing: 0.5,
                                                    color: subscriptionTier === tier ? '#FFFFFF' : DARK,
                                                }}>{tier.toUpperCase()}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView >

            {/* Zodiac Picker Modal */}
            < Modal
                visible={showZodiacPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowZodiacPicker(false)
                }
            >
                <TouchableOpacity
                    style={s.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowZodiacPicker(false)}
                >
                    <View style={s.modalContent}>
                        <Text style={s.modalTitle}>Zodiac Sign</Text>
                        <Text style={s.modalSubtitle}>Select your sign.</Text>
                        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                            {ZODIAC_SIGNS.map((sign) => (
                                <TouchableOpacity
                                    key={sign}
                                    style={[s.modalItem, zodiac === sign && s.modalItemSelected]}
                                    onPress={() => { setZodiac(sign); setShowZodiacPicker(false); }}
                                >
                                    <Text style={[s.modalItemText, zodiac === sign && s.modalItemTextSelected]}>
                                        {sign}
                                    </Text>
                                    {zodiac === sign && <Ionicons name="checkmark" size={18} color={PINK} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal >
        </SafeAreaView >
    );
}

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: WHITE,
        paddingTop: Platform.OS === 'android' ? verticalScale(40) : 0,
    },
    scroll: {
        paddingBottom: spacing(120),
        paddingHorizontal: screenPadding,
    },

    // ── 1. Identity (no card) ──
    identityBlock: {
        marginTop: verticalScale(28),
        marginBottom: spacing(8),
    },
    identityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing(18),
    },
    avatarOuter: {
        padding: spacing(3),
        borderRadius: spacing(40),
        borderWidth: 2,
        borderColor: PINK,
    },
    avatar: {
        width: spacing(72),
        height: spacing(72),
        borderRadius: spacing(36),
        backgroundColor: PINK_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: fs(30),
        fontWeight: '700',
        color: PINK,
        fontFamily: SERIF,
    },
    editBtn: {
        width: spacing(34),
        height: spacing(34),
        borderRadius: spacing(10),
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        fontSize: fs(32),
        fontWeight: '500',
        color: DARK,
        fontFamily: SERIF,
        marginBottom: spacing(2),
    },
    nameInput: {
        fontSize: fs(32),
        fontWeight: '500',
        color: MID_DARK,
        fontFamily: SERIF,
        marginBottom: spacing(2),
        padding: 0,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
        paddingBottom: spacing(6),
    },
    archetypeText: {
        fontSize: fs(10),
        fontWeight: '800',
        color: PINK,
        letterSpacing: 2.5,
        marginBottom: spacing(6),
        marginTop: spacing(4),
    },
    zodiacRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(5),
        marginTop: spacing(2),
    },
    zodiacText: {
        fontSize: fs(11),
        fontWeight: '600',
        color: GRAY,
        letterSpacing: 1.5,
    },
    aboutInput: {
        fontSize: fs(14),
        color: MID_DARK,
        fontFamily: SERIF_ITALIC,
        marginTop: spacing(16),
        padding: spacing(14),
        backgroundColor: OFF_WHITE,
        borderRadius: spacing(12),
        minHeight: verticalScale(60),
        textAlignVertical: 'top',
    },
    summaryText: {
        fontSize: fs(15),
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: spacing(23),
        marginTop: spacing(16),
    },

    // ── Action row ──
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing(10),
        marginBottom: spacing(28),
        marginTop: spacing(8),
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(5),
        paddingHorizontal: spacing(12),
        paddingVertical: spacing(7),
        borderRadius: spacing(8),
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    actionLabel: {
        fontSize: fs(11),
        color: GRAY,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // ── 2. Diagnostic Block ──
    diagnosticBlock: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: LIGHT_GRAY,
        marginBottom: spacing(36),
    },
    diagnosticAccent: {
        width: 3,
        backgroundColor: PINK,
    },
    diagnosticContent: {
        flex: 1,
        paddingVertical: spacing(20),
        paddingHorizontal: spacing(18),
    },
    diagnosticHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing(14),
    },
    diagnosticTitle: {
        fontSize: fs(10),
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2.5,
    },
    confidenceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(5),
    },
    confidenceDot: {
        width: spacing(6),
        height: spacing(6),
        borderRadius: spacing(3),
    },
    confidenceText: {
        fontSize: fs(9),
        fontWeight: '700',
        color: SOFT_GRAY,
        letterSpacing: 1,
    },
    diagnosticHeadline: {
        fontSize: fs(19),
        fontWeight: '500',
        color: DARK,
        fontFamily: SERIF,
        lineHeight: spacing(28),
        marginBottom: spacing(10),
    },
    diagnosticBody: {
        fontSize: fs(14),
        color: GRAY,
        fontFamily: SERIF,
        lineHeight: spacing(22),
    },
    diagnosticEvidence: {
        fontSize: fs(10),
        color: SOFT_GRAY,
        marginTop: spacing(12),
        letterSpacing: 0.5,
    },

    // ── 3. Trait Meters ──
    sectionTitle: {
        fontSize: fs(12),
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2.0,
        marginBottom: spacing(16),
    },
    traitSection: {
        marginBottom: spacing(32),
    },
    traitRow: {
        marginBottom: spacing(16),
    },
    traitLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing(6),
    },
    traitLabel: {
        fontSize: fs(13),
        color: MID_DARK,
        fontFamily: SERIF,
        flex: 1,
    },
    traitValue: {
        fontSize: fs(13),
        color: GRAY,
        fontFamily: SERIF,
        marginLeft: spacing(8),
    },
    traitTrack: {
        height: spacing(4),
        backgroundColor: LIGHT_GRAY,
        borderRadius: spacing(2),
        overflow: 'hidden',
    },
    traitFill: {
        height: spacing(4),
        borderRadius: spacing(2),
        backgroundColor: PINK,
    },
    traitExplanation: {
        fontSize: fs(12),
        color: SOFT_GRAY,
        fontFamily: SERIF_ITALIC,
        marginTop: spacing(5),
        lineHeight: spacing(18),
    },
    traitFootnote: {
        fontSize: fs(13),
        color: GRAY,
        fontFamily: SERIF_ITALIC,
        marginTop: spacing(8),
        lineHeight: spacing(20),
    },
    traitEvidence: {
        fontSize: fs(11),
        color: SOFT_GRAY,
        fontStyle: 'italic',
        marginTop: spacing(4),
    },
    regLabelRow: {
        marginBottom: spacing(12),
    },
    regPrimary: {
        fontSize: fs(11),
        fontWeight: '700',
        color: PINK,
        letterSpacing: 2,
    },

    // ── 4. Collapsible Rationale ──
    rationaleWrap: {
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: LIGHT_GRAY,
        marginBottom: spacing(36),
    },
    rationaleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing(18),
    },
    rationaleTitle: {
        fontSize: fs(10),
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2,
    },
    rationaleBody: {
        paddingBottom: spacing(8),
    },
    rationaleSubsection: {
        paddingBottom: spacing(20),
        marginBottom: spacing(20),
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    rationaleSubTitle: {
        fontSize: fs(9),
        fontWeight: '700',
        color: SOFT_GRAY,
        letterSpacing: 2,
        marginBottom: spacing(14),
    },
    rationaleNote: {
        fontSize: fs(14),
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: spacing(22),
    },
    rationaleEvidence: {
        fontSize: fs(11),
        color: SOFT_GRAY,
        marginTop: spacing(8),
    },

    // Effort balance inside rationale
    effortRow: {
        flexDirection: 'row',
        marginBottom: spacing(14),
    },
    effortCol: {
        flex: 1,
        alignItems: 'center',
        gap: spacing(3),
    },
    effortDivider: {
        width: 1,
        backgroundColor: LIGHT_GRAY,
        marginHorizontal: spacing(14),
    },
    effortWho: {
        fontSize: fs(9),
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 2,
        marginBottom: spacing(6),
    },
    effortPct: {
        fontSize: fs(20),
        fontWeight: '700',
        color: DARK,
        fontFamily: SERIF,
    },
    effortLabel: {
        fontSize: fs(11),
        color: GRAY,
        marginBottom: spacing(4),
    },

    // Signal vs Story
    svsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing(12),
        gap: spacing(8),
    },
    svsLabel: {
        fontSize: fs(9),
        color: GRAY,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    svsTrack: {
        flex: 1,
        height: spacing(6),
        backgroundColor: LIGHT_GRAY,
        borderRadius: spacing(3),
        overflow: 'hidden',
    },
    svsFill: {
        height: spacing(6),
        backgroundColor: PINK,
        borderRadius: spacing(3),
        opacity: 0.6,
    },

    // Observed vs Interpreted
    oviRow: { flexDirection: 'row' },
    oviCol: { flex: 1 },
    oviDivider: { width: 1, backgroundColor: LIGHT_GRAY, marginHorizontal: spacing(12) },
    oviColTitle: { fontSize: fs(8), fontWeight: '700', color: GRAY, letterSpacing: 1.5, marginBottom: spacing(10) },
    oviItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing(8) },
    oviBullet: { width: spacing(4), height: spacing(4), borderRadius: spacing(2), backgroundColor: GRAY, marginTop: spacing(5), marginRight: spacing(7) },
    oviText: { fontSize: fs(12), color: MID_DARK, fontFamily: SERIF, lineHeight: spacing(17), flex: 1 },

    // Trajectory
    trajRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing(10), gap: spacing(8) },
    trajBadge: { paddingHorizontal: spacing(10), paddingVertical: spacing(4), borderRadius: spacing(12) },
    trajBadgeText: { fontSize: fs(9), fontWeight: '700', color: WHITE, letterSpacing: 1.5 },
    trajConf: { fontSize: fs(11), color: SOFT_GRAY },

    // Pattern chain
    patternChain: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: spacing(12),
        gap: spacing(2),
    },
    patternStep: {
        backgroundColor: PINK_TINT,
        paddingHorizontal: spacing(9),
        paddingVertical: spacing(5),
        borderRadius: spacing(14),
    },
    patternStepLabel: {
        fontSize: fs(7),
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1,
        marginBottom: spacing(1),
    },
    patternStepValue: {
        fontSize: fs(10),
        fontWeight: '600',
        color: PINK,
    },

    // ── 5. Contract Surface ──
    contractSurface: {
        backgroundColor: CONTRACT_BG,
        borderRadius: spacing(20),
        padding: spacing(24),
        borderWidth: 1,
        borderColor: CONTRACT_BORDER,
        marginBottom: spacing(40),
    },
    contractHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing(28),
    },
    contractTitle: {
        fontSize: fs(10),
        fontWeight: '800',
        color: PINK,
        letterSpacing: 2.5,
        marginBottom: spacing(4),
    },
    contractSubtitle: {
        fontSize: fs(12),
        color: GRAY,
        fontFamily: SERIF_ITALIC,
    },
    contractEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(4),
        paddingHorizontal: spacing(12),
        paddingVertical: spacing(7),
        borderRadius: spacing(8),
        borderWidth: 1,
        borderColor: CONTRACT_BORDER,
        backgroundColor: WHITE,
    },
    contractEditLabel: {
        fontSize: fs(11),
        fontWeight: '600',
        color: GRAY,
        letterSpacing: 0.5,
    },
    contractGroup: {
        marginBottom: spacing(28),
    },
    contractGroupLabel: {
        fontSize: fs(9),
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 2,
        marginBottom: spacing(14),
    },
    contractItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing(11),
        borderBottomWidth: 1,
        borderBottomColor: CONTRACT_BORDER,
    },
    contractItemBullet: {
        width: spacing(4),
        height: spacing(4),
        borderRadius: spacing(2),
        backgroundColor: DARK,
        marginRight: spacing(12),
    },
    contractItemText: {
        fontSize: fs(15),
        color: MID_DARK,
        fontFamily: SERIF,
        flex: 1,
    },
    removeBtn: {
        padding: spacing(4),
    },
    chipsRow: {
        marginTop: spacing(12),
        marginBottom: spacing(8),
    },
    contractChip: {
        backgroundColor: WHITE,
        paddingHorizontal: spacing(12),
        paddingVertical: spacing(6),
        borderRadius: spacing(20),
        marginRight: spacing(8),
        borderWidth: 1,
        borderColor: CONTRACT_BORDER,
    },
    contractChipText: {
        fontSize: fs(12),
        color: MID_DARK,
        fontFamily: SERIF,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing(8),
        gap: spacing(10),
    },
    addInput: {
        flex: 1,
        fontSize: fs(14),
        color: MID_DARK,
        fontFamily: SERIF_ITALIC,
        paddingVertical: spacing(10),
        borderBottomWidth: 1,
        borderBottomColor: CONTRACT_BORDER,
    },
    addBtn: {
        width: spacing(34),
        height: spacing(34),
        borderRadius: spacing(17),
        borderWidth: 1,
        borderColor: DARK,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Zodiac Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing(24),
    },
    modalContent: {
        backgroundColor: WHITE,
        borderRadius: spacing(28),
        padding: spacing(28),
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontFamily: SERIF,
        fontSize: fs(22),
        color: DARK,
        marginBottom: spacing(6),
    },
    modalSubtitle: {
        fontSize: fs(12),
        color: GRAY,
        marginBottom: spacing(20),
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing(14),
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    modalItemSelected: {
        backgroundColor: PINK_TINT,
        marginHorizontal: spacing(-12),
        paddingHorizontal: spacing(12),
        borderRadius: spacing(10),
        borderBottomColor: 'transparent',
    },
    modalItemText: {
        fontSize: fs(14),
        fontWeight: '600',
        color: DARK,
        letterSpacing: 1,
    },
    modalItemTextSelected: {
        color: PINK,
    },
});
