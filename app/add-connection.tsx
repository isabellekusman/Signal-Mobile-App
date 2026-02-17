
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Signal, useConnections } from '../context/ConnectionsContext';

// Options
const ZODIAC_SIGNS = ["ARIES", "TAURUS", "GEMINI", "CANCER", "LEO", "VIRGO", "LIBRA", "SCORPIO", "SAGITTARIUS", "CAPRICORN", "AQUARIUS", "PISCES"];
const RELATIONSHIP_TYPES = ["CRUSH", "SITUATIONSHIP", "RELATIONSHIP", "FRIENDS", "EX", "OTHER"];
const SIGNAL_COLORS = [
    { label: 'GREEN', value: 'GREEN', color: '#22C55E' },
    { label: 'YELLOW', value: 'YELLOW', color: '#EAB308' },
    { label: 'RED', value: 'RED', color: '#EF4444' },
];

// Icons
const PROFILE_ICONS = [
    "leaf-outline", "water-outline", "flash-outline", "heart-outline",
    "star-outline", "moon-outline", "sunny-outline", "flower-outline",
    "snow-outline", "flame-outline", "diamond-outline", "planet-outline",
    "rose-outline", "sparkles-outline", "prism-outline"
];

export default function AddConnectionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { addConnection, updateConnection, deleteConnection, connections } = useConnections();
    const isEditing = !!params.id; // Check if editing

    // Form State
    const [name, setName] = useState('');
    const [type, setType] = useState('SITUATIONSHIP');
    const [customType, setCustomType] = useState('');
    const [zodiac, setZodiac] = useState('ARIES');

    // Icon State
    const [selectedIcon, setSelectedIcon] = useState(() => {
        const randomIndex = Math.floor(Math.random() * PROFILE_ICONS.length);
        return PROFILE_ICONS[randomIndex];
    });

    // Signal State
    const [observation, setObservation] = useState('');
    const [signalColor, setSignalColor] = useState<'GREEN' | 'YELLOW' | 'RED'>('GREEN');
    const [signals, setSignals] = useState<Signal[]>([]);

    // Selector Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'TYPE' | 'ZODIAC' | 'COLOR'>('TYPE');

    // Pre-fill Data for Editing
    useEffect(() => {
        if (isEditing && params.id) {
            const connectionToEdit = connections.find(c => c.id === params.id);
            if (connectionToEdit) {
                setName(connectionToEdit.name);

                // Check if type is in standard list, if not set it as custom
                if (RELATIONSHIP_TYPES.includes(connectionToEdit.tag)) {
                    setType(connectionToEdit.tag);
                } else {
                    setType('OTHER');
                    setCustomType(connectionToEdit.tag); // Or handle custom tag logic
                }

                setZodiac(connectionToEdit.zodiac);
                setSelectedIcon(connectionToEdit.icon);
                setSignals(connectionToEdit.signals || []);
            }
        }
    }, [isEditing, params.id, connections]);

    const shuffleIcon = () => {
        let newIcon;
        do {
            const randomIndex = Math.floor(Math.random() * PROFILE_ICONS.length);
            newIcon = PROFILE_ICONS[randomIndex];
        } while (newIcon === selectedIcon);
        setSelectedIcon(newIcon);
    };

    const handleAddSignal = () => {
        if (observation.trim().length > 0) {
            setSignals([...signals, { type: signalColor, text: observation }]);
            setObservation('');
        }
    };

    // Remove signal functionality could be useful for edit
    const removeSignal = (index: number) => {
        const newSignals = [...signals];
        newSignals.splice(index, 1);
        setSignals(newSignals);
    };

    const handleSave = () => {
        if (name.trim().length === 0) return;

        const finalType = type === 'OTHER' ? customType : type;

        if (isEditing && params.id) {
            updateConnection(params.id as string, {
                name: name,
                tag: finalType.toUpperCase(),
                zodiac: zodiac,
                icon: selectedIcon,
                signals: signals,
            });
        } else {
            const newConnection = {
                id: Date.now().toString(),
                name: name,
                tag: finalType.toUpperCase(),
                zodiac: zodiac,
                lastActive: 'JUST NOW',
                icon: selectedIcon,
                status: 'active' as const,
                signals: signals,
            };
            addConnection(newConnection);
        }
        router.back();
    };

    const handleArchive = () => {
        if (isEditing && params.id) {
            const connection = connections.find(c => c.id === params.id);
            if (connection) {
                const newStatus = connection.status === 'active' ? 'archived' : 'active';
                updateConnection(params.id as string, { status: newStatus });
                router.back();
            }
        }
    };

    const handleDelete = () => {
        if (isEditing && params.id) {
            deleteConnection(params.id as string);
            router.replace('/');
        }
    };

    const openModal = (selectionType: 'TYPE' | 'ZODIAC' | 'COLOR') => {
        setModalType(selectionType);
        setModalVisible(true);
    };

    const handleSelection = (item: string) => {
        if (modalType === 'TYPE') setType(item);
        if (modalType === 'ZODIAC') setZodiac(item);
        if (modalType === 'COLOR') setSignalColor(item as any);
        setModalVisible(false);
    };

    const renderModalContent = () => {
        let data: any[] = [];
        if (modalType === 'TYPE') data = RELATIONSHIP_TYPES;
        if (modalType === 'ZODIAC') data = ZODIAC_SIGNS;
        if (modalType === 'COLOR') data = SIGNAL_COLORS.map(c => c.value);

        return (
            <View style={styles.modalContent}>
                <FlatList
                    data={data}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => handleSelection(item)}>
                            <Text style={styles.modalItemText}>{item}</Text>
                        </TouchableOpacity>
                    )}
                />
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container}>

                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={24} color="#1C1C1E" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.title}>{isEditing ? 'Edit Connection' : 'Add Connection'}</Text>

                    {/* Profile Image */}
                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={shuffleIcon} activeOpacity={0.8}>
                            <View style={styles.imagePlaceholder}>
                                <Ionicons name={selectedIcon as any} size={40} color="#ec4899" />
                            </View>
                            <View style={styles.uploadIconOverlay}>
                                <Ionicons name="shuffle" size={12} color="#1C1C1E" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.shuffleText}>TAP TO SHUFFLE</Text>
                    </View>

                    {/* Name Input */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Name or Nickname"
                            placeholderTextColor="#D1D1D6"
                            value={name}
                            onChangeText={setName}
                            selectionColor="#1C1C1E"
                        />
                    </View>

                    {/* Type & Zodiac Selectors */}
                    <View style={styles.row}>
                        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>WHAT ARE WE?</Text>
                            <TouchableOpacity style={styles.selector} onPress={() => openModal('TYPE')}>
                                <Text style={styles.selectorText}>{type}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>ZODIAC SIGN</Text>
                            <TouchableOpacity style={styles.selector} onPress={() => openModal('ZODIAC')}>
                                <Text style={styles.selectorText}>{zodiac}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Custom Type Input */}
                    {type === 'OTHER' && (
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>SPECIFY RELATIONSHIP</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. It's Complicated"
                                placeholderTextColor="#D1D1D6"
                                value={customType}
                                onChangeText={setCustomType}
                                selectionColor="#1C1C1E"
                            />
                        </View>
                    )}

                    {/* Signals Section */}
                    <View style={styles.formGroup}>
                        <Text style={styles.label}>SIGNALS & OBSERVATIONS</Text>

                        {signals.map((sig, index) => (
                            <View key={index} style={styles.addedSignalItem}>
                                <View style={[styles.signalDot, {
                                    backgroundColor: sig.type === 'GREEN' ? '#22C55E' : sig.type === 'YELLOW' ? '#EAB308' : '#EF4444'
                                }]} />
                                <Text style={[styles.addedSignalText, { flex: 1 }]}>{sig.text}</Text>
                                <TouchableOpacity onPress={() => removeSignal(index)}>
                                    <Ionicons name="close-circle" size={16} color="#C7C7CC" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={styles.signalRow}>
                            <TextInput
                                style={[styles.input, { flex: 1, marginRight: 8 }]}
                                placeholder="Observation..."
                                placeholderTextColor="#D1D1D6"
                                value={observation}
                                onChangeText={setObservation}
                                selectionColor="#1C1C1E"
                            />
                            <TouchableOpacity style={styles.colorSelector} onPress={() => openModal('COLOR')}>
                                <Text style={styles.colorSelectorText}>{signalColor}</Text>
                                <View style={[styles.miniDot, { backgroundColor: signalColor === 'GREEN' ? '#22C55E' : signalColor === 'YELLOW' ? '#EAB308' : '#EF4444' }]} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.addSignalButton} onPress={handleAddSignal}>
                            <Text style={styles.addSignalText}>+ ADD SIGNAL</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer Buttons */}
                    <View style={styles.footerRow}>
                        <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={() => router.back()}>
                            <Text style={styles.cancelButtonText}>CANCEL</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.footerButton, styles.saveButton]} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>{isEditing ? 'SAVE CHANGES' : 'ADD CONNECTION'}</Text>
                        </TouchableOpacity>
                    </View>

                    {isEditing && (
                        <View style={styles.manageSection}>
                            <Text style={styles.label}>MANAGE CONNECTION</Text>
                            <View style={styles.manageRow}>
                                <TouchableOpacity style={styles.manageButton} onPress={handleArchive}>
                                    <Ionicons
                                        name={connections.find(c => c.id === params.id)?.status === 'archived' ? "arrow-up-outline" : "arrow-down-outline"}
                                        size={18}
                                        color="#1C1C1E"
                                    />
                                    <Text style={styles.manageButtonText}>
                                        {connections.find(c => c.id === params.id)?.status === 'archived' ? 'UNARCHIVE' : 'ARCHIVE'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.manageButton} onPress={handleDelete}>
                                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                                    <Text style={[styles.manageButtonText, { color: '#FF3B30' }]}>DELETE</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Selection Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
                    <TouchableWithoutFeedback>
                        {renderModalContent()}
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        textAlign: 'center',
        marginBottom: 40,
    },
    profileImageContainer: {
        alignSelf: 'center',
        marginBottom: 40,
        position: 'relative',
    },
    imagePlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    uploadIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    formGroup: {
        marginBottom: 24,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    label: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        fontSize: 16,
        color: '#1C1C1E',
        borderWidth: 1,
        borderColor: '#F2F2F7',
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
    },
    selector: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        justifyContent: 'center',
    },
    selectorText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    signalRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    colorSelector: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F2F2F7',
        minWidth: 100,
        flexDirection: 'row',
        gap: 8,
    },
    colorSelectorText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1C1C1E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    miniDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    addSignalButton: {
        alignSelf: 'flex-start',
        paddingVertical: 8,
    },
    addSignalText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D1D1D6',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    addedSignalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    signalDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)'
    },
    addedSignalText: {
        fontSize: 14,
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    shuffleText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#D1D1D6',
        letterSpacing: 1,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: 12,
    },
    // Footer Styles
    footerRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    footerButton: {
        flex: 1,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButton: {
        backgroundColor: '#1C1C1E',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    cancelButtonText: {
        color: '#1C1C1E',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    manageSection: {
        marginTop: 40,
        paddingTop: 40,
        borderTopWidth: 1,
        borderTopColor: '#F2F2F7',
    },
    manageRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    manageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        gap: 8,
    },
    manageButtonText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxHeight: '50%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    modalItemText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
