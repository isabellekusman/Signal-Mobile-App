
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SavedLog, useConnections } from '../../context/ConnectionsContext';
import { aiService } from '../../services/aiService';
import { haptics } from '../../services/haptics';
import { fontSize as fs, screenPadding, spacing, verticalScale } from '../../utils/responsive';

export default function ReflectScreen() {
    const { connections, setShowPaywall, updateConnection, subscriptionTier } = useConnections();
    const activeConnections = connections.filter(c => c.status === 'active');

    const [attachedConnectionId, setAttachedConnectionId] = useState<string | null>(null);
    const [showConnectionPicker, setShowConnectionPicker] = useState(false);
    const [reflection, setReflection] = useState('');
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState<string | null>(null);
    const [showInsight, setShowInsight] = useState(false);

    const attachedConnection = attachedConnectionId
        ? connections.find(c => c.id === attachedConnectionId)
        : null;

    const handleRealign = async () => {
        if (!reflection.trim()) return;
        if (subscriptionTier === 'free') {
            setShowPaywall('voluntary');
            return;
        }
        haptics.light();
        setLoading(true);
        try {
            const standardsStr = Array.isArray(attachedConnection?.onboardingContext?.standards)
                ? attachedConnection.onboardingContext.standards.join(', ')
                : (attachedConnection?.onboardingContext?.standards || 'Default');

            const context = attachedConnection
                ? `Attached to: ${attachedConnection.name} (${attachedConnection.tag}). Standards: ${standardsStr}`
                : 'General reflection on standards and dynamics.';

            const result = await aiService.getClarityInsight(reflection, context);
            setInsight(result);
            haptics.success();
            setShowInsight(true);

            if (attachedConnectionId && result) {
                const conn = connections.find(c => c.id === attachedConnectionId);
                if (conn) {
                    const newLog: SavedLog = {
                        id: Date.now().toString(),
                        date: new Date().toISOString(),
                        source: 'clarity',
                        title: `Reflect Check-In`,
                        summary: `Reflection: ${reflection.substring(0, 50)}...`,
                        fullContent: `Reflection:\n${reflection}\n\nInsight:\n${result}`,
                        isHidden: true,
                    };
                    const existing = conn.savedLogs || [];
                    updateConnection(attachedConnectionId, { savedLogs: [newLog, ...existing] });
                }
            }
        } catch (error: any) {
            if (error.message === 'DAILY_LIMIT_REACHED') {
                setShowPaywall('voluntary');
            } else {
                alert("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <ScrollView
                        contentContainerStyle={styles.container}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        automaticallyAdjustKeyboardInsets
                    >

                        {/* Page Header */}
                        <View style={styles.header}>
                            <Text style={styles.pageTitle}>Reflect</Text>
                            <Text style={styles.pageSubtitle}>EMOTIONAL PROCESSING</Text>
                            <View style={styles.separator} />
                        </View>

                        {/* Optional Connection Attachment */}
                        <View style={styles.attachSection}>
                            <Text style={styles.attachLabel}>ATTACH TO A CONNECTION</Text>
                            <Text style={styles.attachHint}>
                                Optionally link this reflection to someone specific.
                            </Text>

                            {attachedConnection ? (
                                <View style={styles.attachedChip}>
                                    <View style={styles.attachedAvatar}>
                                        {attachedConnection.icon ? (
                                            <Ionicons name={attachedConnection.icon as any} size={16} color="#ec4899" />
                                        ) : (
                                            <Text style={styles.attachedInitials}>
                                                {attachedConnection.name.substring(0, 1).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={styles.attachedName}>{attachedConnection.name}</Text>
                                    <TouchableOpacity onPress={() => setAttachedConnectionId(null)}>
                                        <Ionicons name="close-circle" size={18} color="#C7C7CC" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={styles.attachButton}
                                    onPress={() => setShowConnectionPicker(true)}
                                >
                                    <Ionicons name="add-outline" size={18} color="#ec4899" />
                                    <Text style={styles.attachButtonText}>SELECT CONNECTION</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Main Card — Self-Alignment Check-In */}
                        <View style={styles.card}>
                            <View style={styles.cardContent}>
                                <Text style={styles.cardTitle}>Objective Check-In</Text>
                                <Text style={styles.cardSubtitle}>CALIBRATE YOUR STATE AGAINST YOUR STANDARDS.</Text>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.textInput}
                                        placeholder="I feel like I'm asking for too much because..."
                                        placeholderTextColor="#D1D1D6"
                                        multiline
                                        textAlignVertical="top"
                                        selectionColor="#000000"
                                        value={reflection}
                                        onChangeText={setReflection}
                                    />
                                </View>

                                <TouchableOpacity
                                    style={[styles.realignButton, !reflection.trim() && { opacity: 0.5 }]}
                                    onPress={handleRealign}
                                    disabled={loading || !reflection.trim()}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.realignButtonText}>REALIGN ME</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Insight Modal */}
            <Modal
                visible={showInsight}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowInsight(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Clarity Insight</Text>
                        <Text style={styles.modalSubtitle}>A GROUNDED VIEW ON YOUR REFLECTION.</Text>

                        <ScrollView style={{ maxHeight: verticalScale(400) }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.insightText}>{insight}</Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.realignButton, { marginTop: spacing(20) }]}
                            onPress={() => setShowInsight(false)}
                        >
                            <Text style={styles.realignButtonText}>DONE</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Connection Picker Modal */}
            <Modal
                visible={showConnectionPicker}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowConnectionPicker(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowConnectionPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Attach to Connection</Text>
                        <Text style={styles.modalSubtitle}>Link this reflection to someone.</Text>

                        <ScrollView style={{ maxHeight: verticalScale(300) }} showsVerticalScrollIndicator={false}>
                            {activeConnections.length === 0 ? (
                                <Text style={styles.modalEmptyText}>No active connections yet.</Text>
                            ) : (
                                activeConnections.map((conn) => (
                                    <TouchableOpacity
                                        key={conn.id}
                                        style={styles.modalItem}
                                        onPress={() => {
                                            setAttachedConnectionId(conn.id);
                                            setShowConnectionPicker(false);
                                        }}
                                    >
                                        <View style={styles.modalItemAvatar}>
                                            {conn.icon ? (
                                                <Ionicons name={conn.icon as any} size={18} color="#ec4899" />
                                            ) : (
                                                <Text style={styles.modalItemInitials}>
                                                    {conn.name.substring(0, 1).toUpperCase()}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.modalItemName}>{conn.name}</Text>
                                            <Text style={styles.modalItemTag}>{conn.tag}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={16} color="#D1D1D6" />
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalDismiss}
                            onPress={() => setShowConnectionPicker(false)}
                        >
                            <Text style={styles.modalDismissText}>SKIP</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? verticalScale(40) : 0,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: screenPadding,
        paddingBottom: spacing(16),
    },
    header: {
        marginTop: spacing(20),
        marginBottom: spacing(14),
        paddingHorizontal: spacing(10),
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(36),
        color: '#1C1C1E',
        marginBottom: spacing(6),
    },
    pageSubtitle: {
        fontSize: fs(10),
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: spacing(12),
    },
    separator: {
        height: 1,
        backgroundColor: '#F2F2F7',
        width: '100%',
    },

    // Attach Section
    attachSection: {
        marginBottom: spacing(10),
        paddingHorizontal: spacing(10),
    },
    attachLabel: {
        fontSize: fs(9),
        fontWeight: '700',
        color: '#A0A0A5',
        letterSpacing: 1.2,
        marginBottom: spacing(3),
    },
    attachHint: {
        fontSize: fs(11),
        color: '#C7C7CC',
        marginBottom: spacing(10),
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(5),
        backgroundColor: 'rgba(236, 72, 153, 0.06)',
        paddingVertical: spacing(8),
        paddingHorizontal: spacing(12),
        borderRadius: spacing(10),
        borderWidth: 1,
        borderColor: 'rgba(236, 72, 153, 0.25)',
        alignSelf: 'flex-start',
    },
    attachButtonText: {
        fontSize: fs(10),
        fontWeight: '700',
        color: '#ec4899',
        letterSpacing: 0.5,
    },
    attachedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(10),
        backgroundColor: '#FDF2F8',
        paddingVertical: spacing(10),
        paddingHorizontal: spacing(14),
        borderRadius: spacing(14),
        borderWidth: 1,
        borderColor: '#FCE7F3',
        alignSelf: 'flex-start',
    },
    attachedAvatar: {
        width: spacing(28),
        height: spacing(28),
        borderRadius: spacing(14),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachedInitials: {
        fontSize: fs(12),
        fontWeight: '700',
        color: '#ec4899',
    },
    attachedName: {
        fontSize: fs(13),
        fontWeight: '700',
        color: '#1C1C1E',
    },

    // Main Card
    card: {
        minHeight: verticalScale(450),
        backgroundColor: '#FFFFFF',
        borderRadius: spacing(32),
        padding: spacing(4),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 5,
    },
    cardContent: {
        padding: spacing(24),
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(28),
        color: '#1C1C1E',
        marginBottom: spacing(12),
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: fs(9),
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: spacing(24),
        textAlign: 'center',
        fontStyle: 'italic',
    },
    inputContainer: {
        width: '100%',
        minHeight: verticalScale(220),
        backgroundColor: '#FAFAFA',
        borderRadius: spacing(24),
        padding: spacing(20),
        marginBottom: spacing(20),
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    textInput: {
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: fs(18),
        color: '#1C1C1E',
        lineHeight: spacing(20),
    },
    realignButton: {
        backgroundColor: '#1C1C1E',
        height: verticalScale(56),
        borderRadius: verticalScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    realignButtonText: {
        color: '#FFFFFF',
        fontSize: fs(14),
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing(24),
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
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
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(22),
        color: '#1C1C1E',
        marginBottom: spacing(6),
    },
    modalSubtitle: {
        fontSize: fs(12),
        color: '#8E8E93',
        marginBottom: spacing(20),
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing(12),
        paddingVertical: spacing(14),
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    modalItemAvatar: {
        width: spacing(40),
        height: spacing(40),
        borderRadius: spacing(20),
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalItemInitials: {
        fontSize: fs(14),
        fontWeight: '700',
        color: '#ec4899',
    },
    modalItemName: {
        fontSize: fs(15),
        fontWeight: '700',
        color: '#1C1C1E',
    },
    modalItemTag: {
        fontSize: fs(10),
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    modalEmptyText: {
        fontSize: fs(13),
        color: '#C7C7CC',
        textAlign: 'center',
        paddingVertical: spacing(20),
    },
    modalDismiss: {
        marginTop: spacing(16),
        paddingVertical: spacing(12),
        alignItems: 'center',
    },
    modalDismissText: {
        fontSize: fs(11),
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
    },
    insightText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(16),
        color: '#1C1C1E',
        lineHeight: spacing(24),
    },
});
