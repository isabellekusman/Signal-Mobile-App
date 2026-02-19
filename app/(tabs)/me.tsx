
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';
import {
    computeObservedVsInterpreted,
    computeProfileSummary,
    computeProfileTimeline,
    extractData,
    ObservedVsInterpreted,
} from '../../services/profileAggregation';
import {
    ProfileSummary,
    ProfileTimelineItem,
} from '../../services/profileTypes';

// ─── Palette (pink-500, black, gray, white only) ─────────────────
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
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════

// ─── Evidence Badge ──────────────────────────────────────────────
function EvidenceBadge({ text }: { text: string }) {
    return (
        <Text style={sub.evidenceBadge}>({text})</Text>
    );
}

// ─── Section Label ───────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
    return <Text style={sub.sectionLabel}>{children}</Text>;
}

// ─── Divider with Label ──────────────────────────────────────────
function LabelDivider({ label }: { label: string }) {
    return (
        <View style={sub.dividerWrap}>
            <View style={sub.dividerLine} />
            <Text style={sub.dividerText}>{label}</Text>
            <View style={sub.dividerLine} />
        </View>
    );
}

// ─── Bar Indicator ───────────────────────────────────────────────
function BarIndicator({ label, value }: { label: string; value: number }) {
    return (
        <View style={sub.barContainer}>
            <View style={sub.barLabelRow}>
                <Text style={sub.barLabel}>{label}</Text>
                <Text style={sub.barValue}>{value}%</Text>
            </View>
            <View style={sub.barTrack}>
                <View style={[sub.barFill, { width: `${Math.min(value, 100)}%` }]} />
            </View>
        </View>
    );
}

// ─── IdentityHeader ──────────────────────────────────────────────
function IdentityHeader({
    name, zodiac, about,
    onChangeName, onChangeZodiac, onChangeAbout,
    isEditing, onToggleEdit, onOpenZodiac,
}: {
    name: string; zodiac: string; about: string;
    onChangeName: (v: string) => void;
    onChangeZodiac: () => void;
    onChangeAbout: (v: string) => void;
    isEditing: boolean;
    onToggleEdit: () => void;
    onOpenZodiac: () => void;
}) {
    return (
        <View style={s.identityCard}>
            <View style={s.identityHeader}>
                <View style={s.avatarWrap}>
                    <View style={s.avatar}>
                        <Text style={s.avatarInitial}>
                            {name ? name.charAt(0).toUpperCase() : '?'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={s.editBtn} onPress={onToggleEdit}>
                    <Ionicons
                        name={isEditing ? 'checkmark-outline' : 'pencil-outline'}
                        size={16}
                        color={isEditing ? PINK : GRAY}
                    />
                </TouchableOpacity>
            </View>

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

            {isEditing ? (
                <TouchableOpacity style={s.zodiacRow} onPress={onOpenZodiac}>
                    <Ionicons name="sparkles-outline" size={14} color={PINK} />
                    <Text style={s.zodiacText}>{zodiac || 'Select sign'}</Text>
                    <Ionicons name="chevron-down" size={14} color={GRAY} />
                </TouchableOpacity>
            ) : (
                <View style={s.zodiacRow}>
                    <Ionicons name="sparkles-outline" size={14} color={PINK} />
                    <Text style={s.zodiacText}>{zodiac}</Text>
                </View>
            )}

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
            ) : about ? (
                <Text style={s.aboutText}>{about}</Text>
            ) : null}
        </View>
    );
}

// ─── CurrentPullCard ─────────────────────────────────────────────
function CurrentPullCard({ pull }: { pull: ProfileSummary['currentPull'] }) {
    return (
        <View style={s.pullCard}>
            <View style={s.pullAccent} />
            <Text style={s.pullHeadline}>{pull.headline}</Text>
            <Text style={s.pullExplanation}>{pull.explanation}</Text>
            <Text style={s.pullEvidence}>{pull.basedOn}</Text>
        </View>
    );
}

// ─── MentalOccupationMeter (Regulation Style) ────────────────────
function MentalOccupationMeter({ reg }: { reg: ProfileSummary['regulationStyle'] }) {
    return (
        <View style={s.card}>
            <View style={s.regHeader}>
                <Text style={s.regLabel}>{reg.primary.toUpperCase()}</Text>
                <Text style={s.regScore}>{reg.score}%</Text>
            </View>
            <View style={sub.barTrack}>
                <View style={[sub.barFill, { width: `${reg.score}%` }]} />
            </View>
            <Text style={s.regDesc}>{reg.description}</Text>
        </View>
    );
}

// ─── ReciprocityCheck ────────────────────────────────────────────
function ReciprocityCheck({ effort }: { effort: ProfileSummary['effortBalance'] }) {
    return (
        <View style={s.card}>
            <View style={s.recipRow}>
                <View style={s.recipCol}>
                    <Text style={s.recipColTitle}>YOU</Text>
                    <Text style={s.recipPct}>{effort.youInitiatePct}%</Text>
                    <Text style={s.recipLabel}>initiate</Text>
                    <Text style={s.recipPct}>{effort.youFollowThroughPct}%</Text>
                    <Text style={s.recipLabel}>follow through</Text>
                </View>
                <View style={s.recipDivider} />
                <View style={s.recipCol}>
                    <Text style={s.recipColTitle}>THEM</Text>
                    <Text style={s.recipPct}>{effort.theyInitiatePct}%</Text>
                    <Text style={s.recipLabel}>initiate</Text>
                    <Text style={s.recipPct}>{effort.theyFollowThroughPct}%</Text>
                    <Text style={s.recipLabel}>follow through</Text>
                </View>
            </View>
            <Text style={s.cardFootnote}>{effort.summary}</Text>
        </View>
    );
}

// ─── ObservedVsInterpreted ───────────────────────────────────────
function ObservedVsInterpretedCard({ data }: { data: ObservedVsInterpreted }) {
    return (
        <View style={s.card}>
            <View style={s.oviRow}>
                <View style={s.oviCol}>
                    <Text style={s.oviColTitle}>OBSERVED</Text>
                    {data.observed.map((item, i) => (
                        <View key={i} style={s.oviItem}>
                            <View style={s.oviBullet} />
                            <Text style={s.oviText}>{item}</Text>
                        </View>
                    ))}
                </View>
                <View style={s.oviDivider} />
                <View style={s.oviCol}>
                    <Text style={s.oviColTitle}>INTERPRETED</Text>
                    {data.interpreted.map((item, i) => (
                        <View key={i} style={s.oviItem}>
                            <View style={[s.oviBullet, { backgroundColor: PINK }]} />
                            <Text style={s.oviText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}

// ─── PatternLoopCard ─────────────────────────────────────────────
function PatternLoopCard({ dynamics }: { dynamics: ProfileSummary['repeatingDynamics'] }) {
    if (!dynamics.detected || !dynamics.pattern) {
        return (
            <View style={s.card}>
                <Text style={s.cardBody}>{dynamics.summary}</Text>
            </View>
        );
    }
    const p = dynamics.pattern;
    const steps = [
        { label: 'Trigger', value: p.trigger },
        { label: 'Reaction', value: p.reaction },
        { label: 'Response', value: p.theirResponse },
        { label: 'Result', value: p.result },
    ];
    return (
        <View style={s.card}>
            <Text style={s.cardBody}>{dynamics.summary}</Text>
            {dynamics.affectedConnections.length > 0 && (
                <Text style={s.patternAffected}>
                    Across: {dynamics.affectedConnections.join(', ')}
                </Text>
            )}
            <View style={s.patternChain}>
                {steps.map((step, i) => (
                    <React.Fragment key={i}>
                        <View style={s.patternStep}>
                            <Text style={s.patternStepLabel}>{step.label}</Text>
                            <Text style={s.patternStepValue}>{step.value}</Text>
                        </View>
                        {i < steps.length - 1 && (
                            <Ionicons name="arrow-forward" size={12} color={SOFT_GRAY} style={{ marginHorizontal: 2 }} />
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
}

// ─── TrajectoryCard ──────────────────────────────────────────────
function TrajectoryCard({ trajectory }: { trajectory: ProfileSummary['trajectory'] }) {
    const badgeColors: Record<string, string> = {
        stabilizing: PINK,
        plateauing: GRAY,
        fading: MID_DARK,
    };
    return (
        <View style={s.card}>
            <View style={s.trajRow}>
                <View style={[s.trajBadge, { backgroundColor: badgeColors[trajectory.direction] || GRAY }]}>
                    <Text style={s.trajBadgeText}>{trajectory.direction.toUpperCase()}</Text>
                </View>
                <Text style={s.trajConf}>confidence: {trajectory.confidence}</Text>
            </View>
            <Text style={s.cardBody}>{trajectory.statement}</Text>
        </View>
    );
}

// ─── SelfTrustCard ───────────────────────────────────────────────
function SelfTrustCard({ drift }: { drift: ProfileSummary['perceptionDrift'] }) {
    return (
        <View style={s.card}>
            <View style={s.trustRow}>
                <View style={s.trustCircle}>
                    <Text style={s.trustScore}>{drift.score}</Text>
                </View>
                <View style={s.trustMeta}>
                    <Text style={s.trustLabel}>{drift.label}</Text>
                    <Text style={s.trustDesc}>{drift.summary}</Text>
                </View>
            </View>
        </View>
    );
}

// ─── ReflectionArchive ───────────────────────────────────────────
function ReflectionArchive({ timeline }: { timeline: ProfileTimelineItem[] }) {
    if (timeline.length === 0) {
        return (
            <View style={s.card}>
                <Text style={s.cardBody}>No timeline entries yet. Your activity will populate this over time.</Text>
            </View>
        );
    }
    return (
        <View style={{ gap: 10 }}>
            {timeline.map((item) => (
                <View key={item.id} style={s.timelineItem}>
                    <View style={s.timelineHeader}>
                        <Text style={s.timelineDate}>
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                        </Text>
                        {item.evidenceRef && (
                            <Text style={s.timelineSource}>{item.evidenceRef.toUpperCase()}</Text>
                        )}
                    </View>
                    <Text style={s.timelineText}>{item.insight}</Text>
                </View>
            ))}
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════

export default function MeScreen() {
    const { connections } = useConnections();

    // ── Identity (editable) ──
    const [name, setName] = useState('izzy');
    const [zodiac, setZodiac] = useState('CAPRICORN');
    const [aboutMe, setAboutMe] = useState('');
    const [isEditingIdentity, setIsEditingIdentity] = useState(false);
    const [showZodiacPicker, setShowZodiacPicker] = useState(false);

    // ── User content (standards, boundaries, reflections) ──
    const [standards, setStandards] = useState(['Growth mindset', 'Shared ambition']);
    const [newStandard, setNewStandard] = useState('');
    const [boundaries, setBoundaries] = useState<string[]>(['No phone after 11 PM', 'Direct communication only']);
    const [newBoundary, setNewBoundary] = useState('');
    const [logs, setLogs] = useState<string[]>(['Reflecting on intentionality and personal space this month.']);
    const [newLog, setNewLog] = useState('');
    const [isEditingContent, setIsEditingContent] = useState(false);

    // ── Computed profile ──
    const [isRefreshing, setIsRefreshing] = useState(false);

    const profile: ProfileSummary = useMemo(() => {
        return computeProfileSummary(
            connections,
            { name, zodiac, about: aboutMe },
            boundaries,
            logs,
        );
    }, [connections, name, zodiac, aboutMe, boundaries, logs]);

    const observedInterpreted: ObservedVsInterpreted = useMemo(() => {
        const data = extractData(connections);
        return computeObservedVsInterpreted(data);
    }, [connections]);

    const timeline: ProfileTimelineItem[] = useMemo(() => {
        const data = extractData(connections);
        return computeProfileTimeline(data, logs, 10);
    }, [connections, logs]);

    // ── Refresh handler ──
    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        // Force recompute by waiting one tick (useMemo deps already handle it)
        setTimeout(() => setIsRefreshing(false), 600);
    }, []);

    // ── Export handler ──
    const handleExport = useCallback(async () => {
        try {
            const exportData = JSON.stringify(profile, null, 2);
            await Share.share({
                message: exportData,
                title: 'Signal Profile Insights',
            });
        } catch (error) {
            console.warn('Export failed:', error);
        }
    }, [profile]);

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

    const addLog = () => {
        if (newLog.trim().length > 0) {
            setLogs([newLog.trim(), ...logs]);
            setNewLog('');
        }
    };
    const removeLog = (i: number) => setLogs(logs.filter((_, idx) => idx !== i));

    // ── Evidence string ──
    const ev = profile.evidence;
    const evidenceStr = `${ev.totalDynamicLogs} logs, ${ev.totalDecoderRequests + ev.totalClarityChats + ev.totalStarsEntries} tool uses, last ${ev.periodDays}d`;

    return (
        <SafeAreaView style={s.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

                    {/* ═══ IDENTITY HEADER ═══ */}
                    <IdentityHeader
                        name={name}
                        zodiac={zodiac}
                        about={aboutMe}
                        onChangeName={setName}
                        onChangeZodiac={() => setShowZodiacPicker(true)}
                        onChangeAbout={setAboutMe}
                        isEditing={isEditingIdentity}
                        onToggleEdit={() => setIsEditingIdentity(!isEditingIdentity)}
                        onOpenZodiac={() => setShowZodiacPicker(true)}
                    />

                    {/* ═══ TRANSITION ═══ */}
                    <LabelDivider label="BEHAVIORAL INSIGHTS" />

                    {/* Refresh button */}
                    <TouchableOpacity style={s.refreshBtn} onPress={handleRefresh} disabled={isRefreshing}>
                        {isRefreshing ? (
                            <ActivityIndicator size="small" color={PINK} />
                        ) : (
                            <Ionicons name="refresh-outline" size={14} color={GRAY} />
                        )}
                        <Text style={s.refreshLabel}>
                            {isRefreshing ? 'Refreshing…' : 'Refresh insights'}
                        </Text>
                    </TouchableOpacity>

                    {/* ═══ CURRENT PULL ═══ */}
                    <View style={s.section}>
                        <SectionLabel>CURRENT POSITION</SectionLabel>
                        <CurrentPullCard pull={profile.currentPull} />
                    </View>

                    {/* ═══ REGULATION STYLE ═══ */}
                    <View style={s.section}>
                        <SectionLabel>REGULATION STYLE</SectionLabel>
                        <MentalOccupationMeter reg={profile.regulationStyle} />
                        <EvidenceBadge text={evidenceStr} />
                    </View>

                    {/* ═══ TENDENCIES ═══ */}
                    <View style={s.section}>
                        <SectionLabel>YOU TEND TO…</SectionLabel>
                        <View style={s.card}>
                            {profile.baseline.tendencies.map((t, i) => (
                                <View key={i} style={s.tendencyRow}>
                                    <View style={s.tendencyBullet} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.tendencyText}>{t.text}</Text>
                                        <Text style={s.tendencyMeta}>
                                            {t.strength} · {t.evidenceCount} signal{t.evidenceCount !== 1 ? 's' : ''}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                        <EvidenceBadge text={`based on ${ev.totalDynamicLogs + ev.totalDecoderRequests} data points`} />
                    </View>

                    {/* ═══ EMOTIONAL OUTCOME ═══ */}
                    <View style={s.section}>
                        <SectionLabel>YOUR INTERACTIONS LEAVE YOU FEELING</SectionLabel>
                        <View style={s.card}>
                            {Object.entries(profile.emotionalOutcome.distribution).map(([emotion, pctVal]) => (
                                <View key={emotion} style={sub.barContainer}>
                                    <View style={sub.barLabelRow}>
                                        <Text style={sub.barLabel}>{emotion}</Text>
                                        <Text style={sub.barValue}>{pctVal}%</Text>
                                    </View>
                                    <View style={sub.barTrack}>
                                        <View style={[sub.barFill, { width: `${Math.min(pctVal as number, 100)}%` }]} />
                                    </View>
                                </View>
                            ))}
                            <Text style={s.cardFootnote}>{profile.emotionalOutcome.interpretation}</Text>
                        </View>
                        <EvidenceBadge text={`last ${profile.emotionalOutcome.periodDays} days`} />
                    </View>

                    {/* ═══ RECIPROCITY CHECK ═══ */}
                    <View style={s.section}>
                        <SectionLabel>EFFORT BALANCE</SectionLabel>
                        <ReciprocityCheck effort={profile.effortBalance} />
                        <EvidenceBadge text={evidenceStr} />
                    </View>

                    {/* ═══ OBSERVED VS INTERPRETED ═══ */}
                    <View style={s.section}>
                        <SectionLabel>OBSERVED VS INTERPRETED</SectionLabel>
                        <ObservedVsInterpretedCard data={observedInterpreted} />
                    </View>

                    {/* ═══ SIGNAL VS STORY ═══ */}
                    <View style={s.section}>
                        <SectionLabel>SIGNAL VS STORY</SectionLabel>
                        <View style={s.card}>
                            <View style={s.svsBar}>
                                <Text style={s.svsLabel}>Interpretation</Text>
                                <View style={s.svsTrack}>
                                    <View style={[s.svsFill, { width: `${Math.min(profile.signalStory.score * 100, 100)}%` }]} />
                                    <View style={[s.svsMarker, { left: `${Math.min(profile.signalStory.score * 100, 100)}%` }]} />
                                </View>
                                <Text style={s.svsLabel}>Observed</Text>
                            </View>
                            <Text style={s.cardBody}>{profile.signalStory.summary}</Text>
                            <Text style={s.cardFootnote}>
                                {profile.signalStory.interpretationEvents} interpretations / {profile.signalStory.observationEvents} observations
                            </Text>
                        </View>
                    </View>

                    {/* ═══ REPEATING DYNAMICS ═══ */}
                    <View style={s.section}>
                        <SectionLabel>REPEATING DYNAMICS</SectionLabel>
                        <PatternLoopCard dynamics={profile.repeatingDynamics} />
                    </View>

                    {/* ═══ TRAJECTORY ═══ */}
                    <View style={s.section}>
                        <SectionLabel>TRAJECTORY</SectionLabel>
                        <TrajectoryCard trajectory={profile.trajectory} />
                    </View>

                    {/* ═══ SELF-TRUST ═══ */}
                    <View style={s.section}>
                        <SectionLabel>SELF-TRUST</SectionLabel>
                        <SelfTrustCard drift={profile.perceptionDrift} />
                        <EvidenceBadge text={`${profile.perceptionDrift.driftIndicators} drift indicator${profile.perceptionDrift.driftIndicators !== 1 ? 's' : ''} detected`} />
                    </View>

                    {/* ═══ BOUNDARY ALIGNMENT ═══ */}
                    <View style={s.section}>
                        <SectionLabel>BOUNDARY ALIGNMENT</SectionLabel>
                        <View style={s.card}>
                            <Text style={s.cardBody}>{profile.boundaryAlignment.summary}</Text>
                            {profile.boundaryAlignment.total > 0 && (
                                <View style={{ marginTop: 12 }}>
                                    <BarIndicator label="Upheld" value={profile.boundaryAlignment.percentage} />
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ═══ REFLECTION ARCHIVE ═══ */}
                    <View style={s.section}>
                        <SectionLabel>INSIGHT ARCHIVE</SectionLabel>
                        <ReflectionArchive timeline={timeline} />
                    </View>

                    {/* ═════════════════════════════════════ */}
                    {/*  YOUR DEFINITIONS                     */}
                    {/* ═══════════════════════════════════════ */}
                    <LabelDivider label="YOUR DEFINITIONS" />

                    {/* Content edit toggle */}
                    <View style={s.contentEditRow}>
                        <TouchableOpacity
                            style={s.contentEditBtn}
                            onPress={() => setIsEditingContent(!isEditingContent)}
                        >
                            <Ionicons
                                name={isEditingContent ? 'checkmark-circle-outline' : 'create-outline'}
                                size={16}
                                color={isEditingContent ? PINK : GRAY}
                            />
                            <Text style={[s.contentEditLabel, isEditingContent && { color: PINK }]}>
                                {isEditingContent ? 'Done' : 'Edit'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Standards ── */}
                    <View style={s.contentSection}>
                        <SectionLabel>MY STANDARDS</SectionLabel>
                        <View style={s.itemsList}>
                            {standards.map((item, i) => (
                                <View key={i} style={s.contentItem}>
                                    <Text style={s.contentItemText}>{item}</Text>
                                    {isEditingContent && (
                                        <TouchableOpacity onPress={() => removeStandard(i)} style={s.removeBtn}>
                                            <Ionicons name="close-outline" size={18} color={SOFT_GRAY} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                        {isEditingContent && (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
                                    {STANDARD_SUGGESTIONS.filter(x => !standards.includes(x)).map((x, i) => (
                                        <TouchableOpacity key={i} style={s.chip} onPress={() => setStandards([...standards, x])}>
                                            <Text style={s.chipText}>{x}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <View style={s.addRow}>
                                    <TextInput
                                        style={s.addInput}
                                        placeholder="Add a standard…"
                                        placeholderTextColor={SOFT_GRAY}
                                        value={newStandard}
                                        onChangeText={setNewStandard}
                                    />
                                    <TouchableOpacity style={s.addBtn} onPress={addStandard}>
                                        <Ionicons name="add-outline" size={20} color={DARK} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Boundaries ── */}
                    <View style={s.contentSection}>
                        <SectionLabel>BOUNDARIES</SectionLabel>
                        <View style={s.itemsList}>
                            {boundaries.map((item, i) => (
                                <View key={i} style={s.contentItem}>
                                    <Text style={s.contentItemText}>{item}</Text>
                                    {isEditingContent && (
                                        <TouchableOpacity onPress={() => removeBoundary(i)} style={s.removeBtn}>
                                            <Ionicons name="close-outline" size={18} color={SOFT_GRAY} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                        {isEditingContent && (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow}>
                                    {BOUNDARY_SUGGESTIONS.filter(x => !boundaries.includes(x)).map((x, i) => (
                                        <TouchableOpacity key={i} style={s.chip} onPress={() => setBoundaries([...boundaries, x])}>
                                            <Text style={s.chipText}>{x}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                                <View style={s.addRow}>
                                    <TextInput
                                        style={s.addInput}
                                        placeholder="Add a boundary…"
                                        placeholderTextColor={SOFT_GRAY}
                                        value={newBoundary}
                                        onChangeText={setNewBoundary}
                                    />
                                    <TouchableOpacity style={s.addBtn} onPress={addBoundary}>
                                        <Ionicons name="add-outline" size={20} color={DARK} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* ── Reflections Log ── */}
                    <View style={s.contentSection}>
                        <SectionLabel>REFLECTIONS LOG</SectionLabel>
                        {isEditingContent && (
                            <View style={[s.notesBox, { marginBottom: 20 }]}>
                                <TextInput
                                    style={s.notesInput}
                                    placeholder="Log a new reflection…"
                                    placeholderTextColor={SOFT_GRAY}
                                    multiline
                                    value={newLog}
                                    onChangeText={setNewLog}
                                />
                                <TouchableOpacity style={s.saveLogBtn} onPress={addLog}>
                                    <Ionicons name="arrow-up-circle" size={32} color={DARK} />
                                </TouchableOpacity>
                            </View>
                        )}
                        <View style={{ gap: 12 }}>
                            {logs.map((item, i) => (
                                <View key={i} style={s.logItem}>
                                    <View style={s.logHeader}>
                                        <Text style={s.logDate}>
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                                        </Text>
                                        {isEditingContent && (
                                            <TouchableOpacity onPress={() => removeLog(i)}>
                                                <Ionicons name="trash-outline" size={14} color={SOFT_GRAY} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={s.logText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* ═══ FOOTER ═══ */}
                    <View style={s.footer}>
                        <TouchableOpacity style={s.footerBtn} onPress={() => setIsEditingIdentity(true)}>
                            <Ionicons name="person-outline" size={16} color={GRAY} />
                            <Text style={s.footerBtnText}>Edit Identity</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.footerBtn} onPress={handleExport}>
                            <Ionicons name="download-outline" size={16} color={GRAY} />
                            <Text style={s.footerBtnText}>Export Insights</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* ═══ Zodiac Picker Modal ═══ */}
            <Modal
                visible={showZodiacPicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowZodiacPicker(false)}
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
            </Modal>
        </SafeAreaView>
    );
}

// ═══════════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════════

const sub = StyleSheet.create({
    evidenceBadge: {
        fontSize: 11,
        color: SOFT_GRAY,
        fontFamily: SERIF_ITALIC,
        marginTop: 8,
    },
    sectionLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    dividerWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: LIGHT_GRAY,
    },
    dividerText: {
        fontSize: 9,
        fontWeight: '700',
        color: SOFT_GRAY,
        letterSpacing: 2.5,
    },
    barContainer: { marginBottom: 14 },
    barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    barLabel: { fontSize: 13, color: MID_DARK, fontFamily: SERIF },
    barValue: { fontSize: 13, color: GRAY, fontFamily: SERIF },
    barTrack: { height: 5, backgroundColor: LIGHT_GRAY, borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 5, borderRadius: 3, backgroundColor: PINK },
});

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: WHITE,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    scroll: {
        paddingBottom: 120,
        paddingHorizontal: 24,
    },
    section: {
        marginBottom: 32,
    },

    // ── Refresh ──
    refreshBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        gap: 6,
        marginBottom: 24,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    refreshLabel: {
        fontSize: 11,
        color: GRAY,
        fontWeight: '600',
        letterSpacing: 0.3,
    },

    // ── Identity Card ──
    identityCard: {
        marginTop: 24,
        backgroundColor: WHITE,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        marginBottom: 8,
    },
    identityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    avatarWrap: {
        padding: 3,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: PINK,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 24,
        backgroundColor: PINK_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 22,
        fontWeight: '700',
        color: PINK,
        fontFamily: SERIF,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameText: {
        fontSize: 28,
        fontWeight: '500',
        color: DARK,
        fontFamily: SERIF,
        marginBottom: 4,
    },
    nameInput: {
        fontSize: 28,
        fontWeight: '500',
        color: MID_DARK,
        fontFamily: SERIF,
        marginBottom: 4,
        padding: 0,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
        paddingBottom: 6,
    },
    zodiacRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    zodiacText: {
        fontSize: 12,
        fontWeight: '600',
        color: GRAY,
        letterSpacing: 1.5,
    },
    aboutInput: {
        fontSize: 14,
        color: MID_DARK,
        fontFamily: SERIF_ITALIC,
        marginTop: 14,
        padding: 14,
        backgroundColor: OFF_WHITE,
        borderRadius: 12,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    aboutText: {
        fontSize: 14,
        color: MID_DARK,
        fontFamily: SERIF_ITALIC,
        marginTop: 14,
        lineHeight: 22,
    },

    // ── Generic Card ──
    card: {
        backgroundColor: OFF_WHITE,
        borderRadius: 16,
        padding: 20,
    },
    cardBody: {
        fontSize: 15,
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: 23,
    },
    cardFootnote: {
        fontSize: 11,
        color: SOFT_GRAY,
        fontFamily: SERIF_ITALIC,
        marginTop: 12,
    },

    // ── Current Pull ──
    pullCard: {
        backgroundColor: OFF_WHITE,
        borderRadius: 16,
        padding: 22,
        borderLeftWidth: 3,
        borderLeftColor: PINK,
    },
    pullAccent: {
        width: 24,
        height: 3,
        backgroundColor: PINK,
        borderRadius: 2,
        marginBottom: 14,
        opacity: 0.5,
    },
    pullHeadline: {
        fontSize: 18,
        fontWeight: '500',
        color: DARK,
        fontFamily: SERIF,
        lineHeight: 28,
    },
    pullExplanation: {
        fontSize: 13,
        color: GRAY,
        fontFamily: SERIF,
        lineHeight: 20,
        marginTop: 10,
    },
    pullEvidence: {
        fontSize: 10,
        color: SOFT_GRAY,
        marginTop: 12,
        letterSpacing: 0.5,
    },

    // ── Regulation Style ──
    regHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    regLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: PINK,
        letterSpacing: 2,
    },
    regScore: {
        fontSize: 13,
        color: GRAY,
        fontFamily: SERIF,
    },
    regDesc: {
        fontSize: 14,
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: 22,
        marginTop: 12,
    },

    // ── Tendencies ──
    tendencyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 14,
    },
    tendencyBullet: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: PINK,
        marginTop: 8,
        marginRight: 12,
    },
    tendencyText: {
        fontSize: 15,
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: 22,
    },
    tendencyMeta: {
        fontSize: 11,
        color: SOFT_GRAY,
        marginTop: 2,
    },

    // ── Reciprocity ──
    recipRow: {
        flexDirection: 'row',
    },
    recipCol: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    recipDivider: {
        width: 1,
        backgroundColor: LIGHT_GRAY,
        marginHorizontal: 16,
    },
    recipColTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 2,
        marginBottom: 8,
    },
    recipPct: {
        fontSize: 22,
        fontWeight: '700',
        color: DARK,
        fontFamily: SERIF,
    },
    recipLabel: {
        fontSize: 11,
        color: GRAY,
        marginBottom: 8,
    },

    // ── Observed vs Interpreted ──
    oviRow: {
        flexDirection: 'row',
    },
    oviCol: {
        flex: 1,
    },
    oviDivider: {
        width: 1,
        backgroundColor: LIGHT_GRAY,
        marginHorizontal: 14,
    },
    oviColTitle: {
        fontSize: 9,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    oviItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    oviBullet: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: GRAY,
        marginTop: 6,
        marginRight: 8,
    },
    oviText: {
        fontSize: 12,
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: 18,
        flex: 1,
    },

    // ── Signal vs Story ──
    svsBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    svsLabel: {
        fontSize: 10,
        color: GRAY,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    svsTrack: {
        flex: 1,
        height: 8,
        backgroundColor: LIGHT_GRAY,
        borderRadius: 4,
        overflow: 'visible',
        position: 'relative',
    },
    svsFill: {
        height: 8,
        backgroundColor: PINK,
        borderRadius: 4,
        opacity: 0.6,
    },
    svsMarker: {
        position: 'absolute',
        top: -4,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: PINK,
        marginLeft: -8,
        borderWidth: 3,
        borderColor: WHITE,
    },

    // ── Pattern Loop ──
    patternAffected: {
        fontSize: 11,
        color: GRAY,
        marginTop: 6,
        marginBottom: 12,
    },
    patternChain: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginTop: 12,
        gap: 2,
    },
    patternStep: {
        backgroundColor: PINK_TINT,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    patternStepLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1,
        marginBottom: 2,
    },
    patternStepValue: {
        fontSize: 11,
        fontWeight: '600',
        color: PINK,
    },

    // ── Trajectory ──
    trajRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 10,
    },
    trajBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trajBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: WHITE,
        letterSpacing: 1.5,
    },
    trajConf: {
        fontSize: 11,
        color: SOFT_GRAY,
    },

    // ── Self-Trust ──
    trustRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    trustCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: PINK,
        backgroundColor: PINK_TINT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trustScore: {
        fontSize: 20,
        fontWeight: '700',
        color: PINK,
        fontFamily: SERIF,
    },
    trustMeta: {
        flex: 1,
    },
    trustLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: DARK,
        marginBottom: 4,
    },
    trustDesc: {
        fontSize: 13,
        color: MID_DARK,
        fontFamily: SERIF,
        lineHeight: 20,
    },

    // ── Timeline ──
    timelineItem: {
        backgroundColor: OFF_WHITE,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: PINK,
    },
    timelineHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    timelineDate: {
        fontSize: 10,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1.5,
    },
    timelineSource: {
        fontSize: 9,
        fontWeight: '700',
        color: SOFT_GRAY,
        letterSpacing: 1,
    },
    timelineText: {
        fontSize: 13,
        lineHeight: 20,
        color: MID_DARK,
        fontFamily: SERIF,
    },

    // ── Content Editing ──
    contentEditRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    contentEditBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    contentEditLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: GRAY,
        letterSpacing: 0.5,
    },
    contentSection: {
        marginBottom: 36,
    },
    itemsList: {
        gap: 4,
    },
    contentItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    contentItemText: {
        fontSize: 15,
        color: MID_DARK,
        fontFamily: SERIF,
    },
    removeBtn: {
        padding: 4,
    },
    chipsRow: {
        marginTop: 12,
        marginBottom: 8,
    },
    chip: {
        backgroundColor: PINK_TINT,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: PINK_BORDER,
    },
    chipText: {
        fontSize: 12,
        color: PINK,
        fontFamily: SERIF,
    },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        gap: 12,
    },
    addInput: {
        flex: 1,
        fontSize: 15,
        color: MID_DARK,
        fontFamily: SERIF_ITALIC,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: DARK,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notesBox: {
        backgroundColor: OFF_WHITE,
        borderRadius: 12,
        padding: 18,
        minHeight: 100,
        position: 'relative',
    },
    notesInput: {
        fontSize: 15,
        lineHeight: 24,
        color: MID_DARK,
        fontFamily: SERIF,
        textAlignVertical: 'top',
        minHeight: 60,
        paddingBottom: 36,
    },
    saveLogBtn: {
        position: 'absolute',
        bottom: 14,
        right: 14,
    },
    logItem: {
        backgroundColor: OFF_WHITE,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 3,
        borderLeftColor: PINK,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    logDate: {
        fontSize: 10,
        fontWeight: '700',
        color: GRAY,
        letterSpacing: 1.5,
    },
    logText: {
        fontSize: 14,
        lineHeight: 22,
        color: MID_DARK,
        fontFamily: SERIF,
    },

    // ── Footer ──
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        paddingVertical: 24,
        marginTop: 8,
    },
    footerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
    },
    footerBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: GRAY,
        letterSpacing: 0.5,
    },

    // ── Zodiac Modal ──
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: WHITE,
        borderRadius: 28,
        padding: 28,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    modalTitle: {
        fontFamily: SERIF,
        fontSize: 22,
        color: DARK,
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 12,
        color: GRAY,
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    modalItemSelected: {
        backgroundColor: PINK_TINT,
        marginHorizontal: -12,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderBottomColor: 'transparent',
    },
    modalItemText: {
        fontSize: 14,
        fontWeight: '600',
        color: DARK,
        letterSpacing: 1,
    },
    modalItemTextSelected: {
        color: PINK,
    },
});
