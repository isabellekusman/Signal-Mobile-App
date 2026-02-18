
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useConnections } from '../../context/ConnectionsContext';

const STANDARD_SUGGESTIONS = [
    'Growth mindset', 'Transpancy', 'Mutual respect',
    'Shared ambition', 'Adventure', 'Emotional depth'
];

const BOUNDARY_SUGGESTIONS = [
    'No phones at dinner', 'Me-time Sunday', 'Work-life balance',
    'Direct feedback', 'Social limits', 'Early nights'
];

export default function MeScreen() {
    const { connections } = useConnections();
    const [standards, setStandards] = useState(['Growth mindset', 'Shared ambition']);
    const [newStandard, setNewStandard] = useState('');
    const [name, setName] = useState('izzy');
    const [zodiac, setZodiac] = useState('CAPRICORN');
    const [boundaries, setBoundaries] = useState<string[]>(['No phone after 11 PM', 'Direct communication only']);
    const [newBoundary, setNewBoundary] = useState('');
    const [logs, setLogs] = useState<string[]>(['Reflecting on intentionality and personal space this month.']);
    const [newLog, setNewLog] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const addStandard = () => {
        if (newStandard.trim().length > 0) {
            setStandards([...standards, newStandard]);
            setNewStandard('');
        }
    };

    const removeStandard = (index: number) => {
        const updated = [...standards];
        updated.splice(index, 1);
        setStandards(updated);
    };

    const addBoundary = () => {
        if (newBoundary.trim().length > 0) {
            setBoundaries([...boundaries, newBoundary]);
            setNewBoundary('');
        }
    };

    const removeBoundary = (index: number) => {
        const updated = [...boundaries];
        updated.splice(index, 1);
        setBoundaries(updated);
    };

    const addLog = () => {
        if (newLog.trim().length > 0) {
            setLogs([newLog, ...logs]);
            setNewLog('');
        }
    };

    const removeLog = (index: number) => {
        const updated = [...logs];
        updated.splice(index, 1);
        setLogs(updated);
    };

    // Aggregate patterns across relationships
    const activeConnections = connections.filter(c => c.status === 'active');
    const totalLogs = activeConnections.reduce((sum, c) => sum + (c.dailyLogs?.length || 0), 0);
    const totalAnalyses = activeConnections.reduce((sum, c) => sum + (c.savedLogs?.length || 0), 0);

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIconWrapper}>
                                <View style={styles.headerIcon}>
                                    <Ionicons name="person-outline" size={20} color="#ec4899" />
                                </View>
                            </View>
                            <Text style={styles.pageTitle}>Me</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editButtonHeader}
                            onPress={() => setIsEditing(!isEditing)}
                        >
                            <Ionicons
                                name={isEditing ? "checkmark-outline" : "pencil-outline"}
                                size={18}
                                color={isEditing ? "#ec4899" : "#1C1C1E"}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* IDENTITY BLOCK */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>IDENTITY</Text>

                        {/* Name */}
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>MY NAME</Text>
                            <View style={styles.dataValueContainer}>
                                {isEditing ? (
                                    <TextInput
                                        style={styles.dataInput}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Add name"
                                    />
                                ) : (
                                    <Text style={styles.dataValue}>{name}</Text>
                                )}
                            </View>
                        </View>

                        {/* Zodiac */}
                        <View style={styles.dataRow}>
                            <Text style={styles.dataLabel}>ZODIAC SIGN</Text>
                            <View style={styles.dataValueContainer}>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.dataInput, styles.zodiacSubText]}
                                        value={zodiac}
                                        onChangeText={setZodiac}
                                        autoCapitalize="characters"
                                        placeholder="Add zodiac"
                                    />
                                ) : (
                                    <Text style={[styles.dataValue, styles.zodiacSubText]}>{zodiac}</Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* PATTERNS ACROSS RELATIONSHIPS */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>PATTERNS ACROSS RELATIONSHIPS</Text>
                        <View style={styles.patternsGrid}>
                            <View style={styles.patternCard}>
                                <Text style={styles.patternNumber}>{activeConnections.length}</Text>
                                <Text style={styles.patternLabel}>ACTIVE CONNECTIONS</Text>
                            </View>
                            <View style={styles.patternCard}>
                                <Text style={styles.patternNumber}>{totalLogs}</Text>
                                <Text style={styles.patternLabel}>DAILY LOGS</Text>
                            </View>
                            <View style={styles.patternCard}>
                                <Text style={styles.patternNumber}>{totalAnalyses}</Text>
                                <Text style={styles.patternLabel}>ANALYSES SAVED</Text>
                            </View>
                        </View>
                    </View>

                    {/* STANDARDS BLOCK */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>MY STANDARDS</Text>

                        <View style={styles.standardsList}>
                            {standards.map((item, index) => (
                                <View key={index} style={styles.standardItem}>
                                    <Text style={styles.standardText}>{item}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => removeStandard(index)} style={styles.removeButton}>
                                            <Ionicons name="close-outline" size={18} color="#C7C7CC" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Add Standard */}
                        {isEditing && (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow}>
                                    {STANDARD_SUGGESTIONS
                                        .filter(s => !standards.includes(s))
                                        .map((s, i) => (
                                            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setStandards([...standards, s])}>
                                                <Text style={styles.suggestionText}>{s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                                <View style={styles.addStandardContainer}>
                                    <TextInput
                                        style={styles.addInput}
                                        placeholder="Add a standard..."
                                        placeholderTextColor="#C7C7CC"
                                        value={newStandard}
                                        onChangeText={setNewStandard}
                                    />
                                    <TouchableOpacity style={styles.addButton} onPress={addStandard}>
                                        <Ionicons name="add-outline" size={20} color="#1C1C1E" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* BOUNDARIES BLOCK */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>BOUNDARIES</Text>

                        {/* Boundaries List */}
                        <View style={styles.standardsList}>
                            {boundaries.map((item, index) => (
                                <View key={index} style={styles.standardItem}>
                                    <Text style={styles.standardText}>{item}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => removeBoundary(index)} style={styles.removeButton}>
                                            <Ionicons name="close-outline" size={18} color="#C7C7CC" />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>

                        {/* Add Boundary */}
                        {isEditing && (
                            <View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsRow}>
                                    {BOUNDARY_SUGGESTIONS
                                        .filter(b => !boundaries.includes(b))
                                        .map((b, i) => (
                                            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => setBoundaries([...boundaries, b])}>
                                                <Text style={styles.suggestionText}>{b}</Text>
                                            </TouchableOpacity>
                                        ))}
                                </ScrollView>
                                <View style={styles.addStandardContainer}>
                                    <TextInput
                                        style={styles.addInput}
                                        placeholder="Add a boundary..."
                                        placeholderTextColor="#C7C7CC"
                                        value={newBoundary}
                                        onChangeText={setNewBoundary}
                                    />
                                    <TouchableOpacity style={styles.addButton} onPress={addBoundary}>
                                        <Ionicons name="add-outline" size={20} color="#1C1C1E" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* NOTES BLOCK */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>REFLECTIONS LOG</Text>

                        {isEditing && (
                            <View style={[styles.notesContainer, { marginBottom: 32, paddingBottom: 68 }]}>
                                <TextInput
                                    style={styles.notesInput}
                                    placeholder="Log a new reflection..."
                                    placeholderTextColor="#D1D1D6"
                                    multiline
                                    value={newLog}
                                    onChangeText={setNewLog}
                                />
                                <TouchableOpacity style={styles.saveLogIconButton} onPress={addLog}>
                                    <Ionicons name="arrow-up-circle" size={32} color="#1C1C1E" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={styles.logsList}>
                            {logs.map((item, index) => (
                                <View key={index} style={styles.logItem}>
                                    <View style={styles.logHeader}>
                                        <Text style={styles.logDate}>
                                            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                                        </Text>
                                        {isEditing && (
                                            <TouchableOpacity onPress={() => removeLog(index)}>
                                                <Ionicons name="trash-outline" size={14} color="#C7C7CC" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text style={styles.logText}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* DATA / BACKUP (Minimal) */}
                    <TouchableOpacity style={styles.backupLink}>
                        <Text style={styles.backupText}>DATA & BACKUP</Text>
                    </TouchableOpacity>

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
        paddingBottom: 100,
        paddingHorizontal: 32,
    },
    // Header
    header: {
        marginTop: 32,
        marginBottom: 64,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    headerIconWrapper: {
        padding: 3,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#ec4899',
    },
    headerIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        fontWeight: '500',
    },
    editButtonHeader: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Sections
    sectionContainer: {
        marginBottom: 64,
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 32,
    },
    // Patterns Grid
    patternsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    patternCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    patternNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        marginBottom: 4,
    },
    patternLabel: {
        fontSize: 8,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textAlign: 'center',
    },
    // Data Rows (Identity)
    dataRow: {
        marginBottom: 32,
    },
    dataLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    dataValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
        paddingBottom: 14,
    },
    dataValue: {
        fontSize: 20,
        color: '#1C1C1E',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    dataInput: {
        fontSize: 20,
        color: '#3A3A3C',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        padding: 0,
        flex: 1,
    },
    zodiacSubText: {
        fontSize: 14,
        letterSpacing: 1,
    },
    // Standards
    standardsList: {
        gap: 8,
        marginBottom: 24,
    },
    standardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    standardText: {
        fontSize: 15,
        color: '#3A3A3C',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    removeButton: {
        padding: 4,
    },
    addStandardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        gap: 16,
    },
    addInput: {
        flex: 1,
        fontSize: 15,
        color: '#3A3A3C',
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#1C1C1E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Notes
    notesContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 24,
        minHeight: 180,
    },
    notesInput: {
        fontSize: 16,
        lineHeight: 26,
        color: '#3A3A3C',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        textAlignVertical: 'top',
        minHeight: 140,
    },
    // Backup (Minimal)
    backupLink: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    backupText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    // Suggestions
    suggestionsRow: {
        marginBottom: 16,
    },
    suggestionChip: {
        backgroundColor: '#fdf2f8',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#fce7f3',
    },
    suggestionText: {
        fontSize: 12,
        color: '#ec4899',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    // Reflection Log Specific
    saveLogIconButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
    },
    logsList: {
        gap: 20,
    },
    logItem: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#ec4899',
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    logDate: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
    },
    logText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#3A3A3C',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
});
