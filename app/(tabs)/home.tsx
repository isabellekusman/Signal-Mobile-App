
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Refresh trigger: 2026-02-22T12:51:00
import React, { useState } from 'react';
import { Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';
import useSubscription from '../../hooks/useSubscription';
import { fontSize as fs, verticalScale } from '../../utils/responsive';

const DecoderInsightRenderer = ({ fullContent }: { fullContent: string }) => {
    const fields: Record<string, string> = {};
    const lines = fullContent.split('\n');
    lines.forEach((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > -1) {
            const key = line.substring(0, colonIdx).trim();
            const val = line.substring(colonIdx + 1).trim();
            fields[key] = val;
        }
    });

    const risks = fields['Risks'] ? fields['Risks'].split(',').map((r: string) => r.trim()).filter(Boolean) : [];

    return (
        <View style={{ gap: 16, marginTop: 12 }}>
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

            {fields['Power Dynamics'] && (
                <View style={[styles.decoderBox, { backgroundColor: '#FFFFFF', borderColor: '#1C1C1E', borderWidth: 1 }]}>
                    <Text style={[styles.decoderBoxLabel, { color: '#1C1C1E' }]}>POWER DYNAMICS</Text>
                    <Text style={styles.decoderBoxBody}>{fields['Power Dynamics']}</Text>
                </View>
            )}

            {fields['Subtext'] && (
                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                    <Text style={[styles.decoderBoxLabel, { color: '#ec4899' }]}>WHAT'S ACTUALLY BEING SAID</Text>
                    <Text style={styles.decoderBoxBody}>{fields['Subtext']}</Text>
                </View>
            )}

            {fields['Motivation'] && (
                <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                    <Text style={styles.decoderBoxLabel}>THE "WHY"</Text>
                    <Text style={styles.decoderBoxBody}>{fields['Motivation']}</Text>
                </View>
            )}

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

            {fields['Suggested Reply'] && (
                <View style={[styles.decoderBox, { backgroundColor: '#FAFAFA', borderColor: '#E5E5E5', marginTop: 8 }]}>
                    <Text style={[styles.decoderBoxLabel, { color: '#525252' }]}>SUGGESTED REPLY</Text>
                    <Text style={[styles.decoderBoxBody, { fontStyle: 'italic' }]}>"{fields['Suggested Reply']}"</Text>
                </View>
            )}
        </View>
    );
};

const ClarityInsightRenderer = ({ fullContent }: { fullContent: string }) => {
    const messages = fullContent.split('\n\n').filter((m) => m.trim().length > 0);

    return (
        <View style={{ gap: 12, marginTop: 12 }}>
            {messages.map((msg, index) => {
                const isUser = msg.startsWith('You:');
                const text = msg.replace(/^(You|Signal):\s*/, '');
                return (
                    <View key={index} style={{
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                        backgroundColor: isUser ? '#FDF2F8' : '#F9FAFB',
                        padding: 12,
                        borderRadius: 16,
                        borderBottomRightRadius: isUser ? 4 : 16,
                        borderBottomLeftRadius: !isUser ? 4 : 16,
                        maxWidth: '85%',
                        borderWidth: 1,
                        borderColor: isUser ? '#FCE7F3' : '#F2F2F7',
                    }}>
                        {/* We could add a label, but standard chat bubbles speak for themselves */}
                        {/* {!isUser && <Text style={{ fontSize: 10, fontWeight: '800', color: '#ec4899', marginBottom: 4 }}>SIGNAL</Text>} */}
                        <Text style={{
                            fontSize: 15,
                            lineHeight: 22,
                            color: isUser ? '#ec4899' : '#1C1C1E',
                            fontFamily: !isUser ? (Platform.OS === 'ios' ? 'Georgia' : 'serif') : undefined
                        }}>
                            {text}
                        </Text>
                    </View>
                );
            })}
        </View>
    );
};

const StarsInsightRenderer = ({ fullContent }: { fullContent: string }) => {
    // We don't have the fully structured fields in Stars 'fullContent' directly,
    // just the extendedNarrative from the simple fetch. BUT if we had JSON, we'd parse it here.
    // Given Stars saves just text currently (or maybe we can parse it if it was structured).
    // Let's assume it might just be the standard text. 
    // We will render it nicely into a single styled cosmic box if it isn't JSON.

    return (
        <View style={{ gap: 16, marginTop: 12 }}>
            <View style={[styles.decoderBox, { backgroundColor: '#F9FAFB', borderColor: '#F2F2F7' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Ionicons name="sparkles" size={16} color="#ec4899" />
                    <Text style={[styles.decoderBoxLabel, { marginBottom: 0, color: '#ec4899' }]}>COSMIC ANALYSIS</Text>
                </View>
                <Text style={[styles.decoderBoxBody, { lineHeight: 24 }]}>{fullContent}</Text>
            </View>
        </View>
    );
};

export default function HomeScreen() {
    const router = useRouter();
    const { connections, theme } = useConnections();
    const isPro = useSubscription();
    const [insightExpanded, setInsightExpanded] = useState(false);
    const activeConnections = connections.filter(c => c.status === 'active');

    // Find the most recently active connection (by lastActive or by dailyLogs)
    const getMostRecentConnection = () => {
        if (activeConnections.length === 0) return null;

        // Prioritize connections with recent daily logs
        const withLogs = activeConnections
            .filter(c => c.dailyLogs && c.dailyLogs.length > 0)
            .sort((a, b) => {
                const aDate = new Date(a.dailyLogs![a.dailyLogs!.length - 1]?.date || 0).getTime();
                const bDate = new Date(b.dailyLogs![b.dailyLogs!.length - 1]?.date || 0).getTime();
                return bDate - aDate;
            });

        if (withLogs.length > 0) return withLogs[0];

        // Fallback: connections with saved logs
        const withSavedLogs = activeConnections
            .filter(c => c.savedLogs && c.savedLogs.length > 0)
            .sort((a, b) => {
                const aDate = new Date(a.savedLogs![0]?.date || 0).getTime();
                const bDate = new Date(b.savedLogs![0]?.date || 0).getTime();
                return bDate - aDate;
            });

        if (withSavedLogs.length > 0) return withSavedLogs[0];

        // Fallback: first active connection
        return activeConnections[0];
    };

    const recentConnection = getMostRecentConnection();

    // Get latest vibe from Dynamic logs
    const getLatestVibe = () => {
        if (!recentConnection?.dailyLogs || recentConnection.dailyLogs.length === 0) return null;
        const latest = recentConnection.dailyLogs[0];
        return {
            energy: latest.energyExchange,
            direction: latest.direction,
            emotion: latest.structured_emotion_state,
            clarity: latest.clarity,
            date: latest.date,
        };
    };

    // Get latest analysis insight
    const getLatestInsight = () => {
        if (!recentConnection?.savedLogs || recentConnection.savedLogs.length === 0) return null;
        return recentConnection.savedLogs[0];
    };

    const latestVibe = getLatestVibe();
    const latestInsight = getLatestInsight();

    const isUrl = (str?: string) => str && (str.startsWith('http') || str.startsWith('file'));

    const navigateToHub = (connectionId: string) => {
        router.push({
            pathname: '/connection/[id]',
            params: { id: connectionId, tab: 'OVERVIEW' }
        });
    };

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

    // Empty state — no connections
    if (activeConnections.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Ionicons name="heart-outline" size={40} color="#ec4899" />
                    </View>
                    <Text style={styles.emptyTitle}>Start Your Story</Text>
                    <Text style={styles.emptySubtitle}>
                        Add your first connection to begin tracking signals, patterns, and insights.
                    </Text>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => router.push('/add-connection')}
                    >
                        <Text style={styles.ctaButtonText}>ADD CONNECTION</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <ScrollView
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.pageTitle}>Home</Text>
                        {isPro && (
                            <View style={styles.proBadge}>
                                <Ionicons name="checkmark-circle" size={14} color="#ec4899" />
                                <Text style={styles.proBadgeText}>PRO ACCESS</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.sectionLabel}>CONTINUE WHERE YOU LEFT OFF</Text>

                </View>

                <View style={styles.headerDivider} />

                {recentConnection && (
                    <>
                        {/* Most Recently Active Connection */}
                        <TouchableOpacity
                            style={styles.connectionCard}
                            activeOpacity={0.7}
                            onPress={() => navigateToHub(recentConnection.id)}
                        >
                            <View style={styles.connectionCardInner}>
                                <View style={styles.connectionAvatar}>
                                    {isUrl(recentConnection.icon) ? (
                                        <Image
                                            source={{ uri: recentConnection.icon }}
                                            style={{ width: '100%', height: '100%', borderRadius: 28 }}
                                            resizeMode="cover"
                                        />
                                    ) : recentConnection.icon ? (
                                        <Ionicons name={recentConnection.icon as any} size={28} color="#ec4899" />
                                    ) : (
                                        <Text style={styles.connectionInitials}>
                                            {recentConnection.name.substring(0, 2).toUpperCase()}
                                        </Text>
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.connectionName}>{recentConnection.name}</Text>
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                        <View style={styles.metaBadge}>
                                            <Text style={styles.metaBadgeText}>{recentConnection.tag}</Text>
                                        </View>
                                        <View style={[styles.metaBadge, { backgroundColor: '#F9FAFB' }]}>
                                            <Text style={[styles.metaBadgeText, { color: '#8E8E93' }]}>{recentConnection.zodiac}</Text>
                                        </View>
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
                            </View>
                        </TouchableOpacity>

                        {/* Latest Vibe (Dynamic) */}
                        {latestVibe && (
                            <View style={styles.insightCard}>
                                <View style={styles.insightHeader}>
                                    <View style={[styles.insightIconWrap, { backgroundColor: '#FDF2F8' }]}>
                                        <Ionicons name="pulse-outline" size={16} color="#ec4899" />
                                    </View>
                                    <Text style={styles.insightLabel}>LATEST VIBE</Text>
                                    <Text style={styles.insightDate}>{formatDate(latestVibe.date)}</Text>
                                </View>
                                <View style={styles.vibeTags}>
                                    <View style={[styles.vibeTag, { backgroundColor: '#FDF2F8' }]}>
                                        <Text style={[styles.vibeTagText, { color: '#ec4899' }]}>{latestVibe.energy}</Text>
                                    </View>
                                    <View style={[styles.vibeTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[styles.vibeTagText, { color: '#1C1C1E' }]}>{latestVibe.direction}</Text>
                                    </View>
                                    <View style={[styles.vibeTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[styles.vibeTagText, { color: '#8E8E93' }]}>{latestVibe.emotion}</Text>
                                    </View>
                                    <View style={[styles.vibeTag, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[styles.vibeTagText, { color: '#8E8E93' }]}>Clarity: {latestVibe.clarity}%</Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Latest Analysis Insight */}
                        {latestInsight && (
                            <TouchableOpacity
                                style={[styles.insightCard, insightExpanded && styles.insightCardExpanded]}
                                activeOpacity={0.7}
                                onPress={() => setInsightExpanded(!insightExpanded)}
                            >
                                <View style={styles.insightHeader}>
                                    <View style={[styles.insightIconWrap, { backgroundColor: getSourceColor(latestInsight.source) + '15' }]}>
                                        <Ionicons name={getSourceIcon(latestInsight.source)} size={16} color={getSourceColor(latestInsight.source)} />
                                    </View>
                                    <Text style={styles.insightLabel}>LATEST INSIGHT</Text>
                                    <Text style={styles.insightDate}>{formatDate(latestInsight.date)}</Text>
                                    <Ionicons
                                        name={insightExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color="#C7C7CC"
                                        style={{ marginLeft: 4 }}
                                    />
                                </View>
                                <Text style={styles.insightTitle}>{latestInsight.title}</Text>
                                {insightExpanded ? (
                                    <>
                                        {latestInsight.source === 'decoder' ? (
                                            <DecoderInsightRenderer fullContent={latestInsight.fullContent || latestInsight.summary || ''} />
                                        ) : latestInsight.source === 'clarity' ? (
                                            <ClarityInsightRenderer fullContent={latestInsight.fullContent || latestInsight.summary || ''} />
                                        ) : latestInsight.source === 'stars' ? (
                                            <StarsInsightRenderer fullContent={latestInsight.fullContent || latestInsight.summary || ''} />
                                        ) : (
                                            <Text style={styles.insightFullContent}>
                                                {latestInsight.fullContent || latestInsight.summary}
                                            </Text>
                                        )}
                                        <View style={styles.collapseHint}>
                                            <Ionicons name="chevron-up" size={12} color="#C7C7CC" />
                                            <Text style={styles.collapseHintText}>TAP TO COLLAPSE</Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <Text style={styles.insightSummary} numberOfLines={3}>{latestInsight.summary}</Text>
                                        <View style={styles.expandHint}>
                                            <Text style={styles.expandHintText}>TAP TO READ MORE</Text>
                                            <Ionicons name="chevron-down" size={12} color="#ec4899" />
                                        </View>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}

                        {/* Quick Continue Button */}
                        <TouchableOpacity
                            style={styles.continueButton}
                            activeOpacity={0.8}
                            onPress={() => navigateToHub(recentConnection.id)}
                        >
                            <Text style={styles.continueButtonText}>CONTINUE WITH {recentConnection.name.toUpperCase()}</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>

                        {/* No data yet prompt */}
                        {!latestVibe && !latestInsight && (
                            <View style={styles.noDataCard}>
                                <Ionicons name="analytics-outline" size={28} color="#D1D1D6" />
                                <Text style={styles.noDataTitle}>No signals logged yet</Text>
                                <Text style={styles.noDataSubtitle}>
                                    Start using Clarity, Decoder, or Dynamic to see insights here.
                                </Text>
                            </View>
                        )}
                    </>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
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
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        marginTop: verticalScale(20),
        marginBottom: verticalScale(24),
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(32),
        color: '#1C1C1E',
        marginBottom: verticalScale(4),
        textAlign: 'left',
    },
    sectionLabel: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'left',
    },
    headerDivider: {
        height: 1,
        backgroundColor: '#F2F2F7',
        width: '100%',
        marginBottom: 24,
    },

    // Connection Card
    connectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    connectionCardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    connectionAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    connectionInitials: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ec4899',
    },
    connectionName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    metaBadge: {
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    metaBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#ec4899',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Insight Cards
    insightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 14,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    insightIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    insightLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1.5,
        flex: 1,
    },
    insightDate: {
        fontSize: 10,
        color: '#C7C7CC',
        fontWeight: '600',
    },
    insightTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    insightSummary: {
        fontSize: 13,
        color: '#8E8E93',
        lineHeight: 19,
    },
    insightCardExpanded: {
        borderColor: 'rgba(236, 72, 153, 0.2)',
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    insightFullContent: {
        fontSize: 14,
        color: '#1C1C1E',
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    expandHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    expandHintText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#ec4899',
        letterSpacing: 1,
    },
    collapseHint: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 16,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    collapseHintText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#C7C7CC',
        letterSpacing: 1,
    },

    // Vibe Tags
    vibeTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    vibeTag: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    vibeTagText: {
        fontSize: 10,
        fontWeight: '700',
    },

    // Continue Button
    continueButton: {
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },

    // No data
    noDataCard: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#F9FAFB',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginTop: 8,
    },
    noDataTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#8E8E93',
        marginTop: 12,
    },
    noDataSubtitle: {
        fontSize: 12,
        color: '#B0B0B0',
        textAlign: 'center',
        marginTop: 4,
        paddingHorizontal: 40,
    },

    // Empty State (no connections at all)
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyIconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 28,
        color: '#1C1C1E',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    ctaButton: {
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    proBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FCE7F3',
    },
    proBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#ec4899',
        letterSpacing: 0.5,
    },
    decoderBox: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    decoderBoxLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    decoderBoxValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1C1C1E',
    },
    decoderBoxBody: {
        fontSize: 15,
        lineHeight: 24,
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
});
