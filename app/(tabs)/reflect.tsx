
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';
import { aiService } from '../../services/aiService';

export default function ReflectScreen() {
    const { connections, setShowPaywall } = useConnections();
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
            setShowInsight(true);
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

                        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                            <Text style={styles.insightText}>{insight}</Text>
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.realignButton, { marginTop: 20 }]}
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

                        <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
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
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    container: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    header: {
        marginTop: 20,
        marginBottom: 14,
        paddingHorizontal: 10,
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: '#1C1C1E',
        marginBottom: 6,
    },
    pageSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    separator: {
        height: 1,
        backgroundColor: '#F2F2F7',
        width: '100%',
    },

    // Attach Section
    attachSection: {
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    attachLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    attachHint: {
        fontSize: 12,
        color: '#C7C7CC',
        marginBottom: 14,
    },
    attachButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(236, 72, 153, 0.08)',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(236, 72, 153, 0.3)',
        borderStyle: 'dashed',
        alignSelf: 'flex-start',
    },
    attachButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ec4899',
        letterSpacing: 0.5,
    },
    attachedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FDF2F8',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#FCE7F3',
        alignSelf: 'flex-start',
    },
    attachedAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachedInitials: {
        fontSize: 12,
        fontWeight: '700',
        color: '#ec4899',
    },
    attachedName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1C1C1E',
    },

    // Main Card
    card: {
        minHeight: 450,
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 4,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 5,
    },
    cardContent: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 28,
        color: '#1C1C1E',
        marginBottom: 12,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 9,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 24,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    inputContainer: {
        width: '100%',
        minHeight: 220,
        backgroundColor: '#FAFAFA',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    textInput: {
        flex: 1,
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 18,
        color: '#1C1C1E',
        lineHeight: 20,
    },
    realignButton: {
        backgroundColor: '#1C1C1E',
        height: 56,
        borderRadius: 28,
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
        fontSize: 14,
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
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
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
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 22,
        color: '#1C1C1E',
        marginBottom: 6,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 20,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    modalItemAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalItemInitials: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ec4899',
    },
    modalItemName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1C1C1E',
    },
    modalItemTag: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    modalEmptyText: {
        fontSize: 13,
        color: '#C7C7CC',
        textAlign: 'center',
        paddingVertical: 20,
    },
    modalDismiss: {
        marginTop: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    modalDismissText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
    },
    insightText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 16,
        color: '#1C1C1E',
        lineHeight: 24,
    },
});
