
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useConnections } from '../../context/ConnectionsContext';
import { db } from '../../services/database';

const STANDARD_SUGGESTIONS = [
    'Growth mindset', 'Transpancy', 'Mutual respect',
    'Shared ambition', 'Adventure', 'Emotional depth'
];

const BOUNDARY_SUGGESTIONS = [
    'No phones at dinner', 'Me-time Sunday', 'Work-life balance',
    'Direct feedback', 'Social limits', 'Early nights'
];

export default function SettingsScreen() {
    const { userProfile } = useConnections();
    const { signOut, user } = useAuth();
    const [standards, setStandards] = useState(userProfile.standards);
    const [newStandard, setNewStandard] = useState('');
    const [name, setName] = useState(userProfile.name || '');
    const [zodiac, setZodiac] = useState(userProfile.zodiac || '');
    const [boundaries, setBoundaries] = useState<string[]>(userProfile.boundaries);
    const [newBoundary, setNewBoundary] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
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
                            <Text style={styles.pageTitle}>My Profile</Text>
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

                    {/* STANDARDS BLOCK */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>MY STANDARDS</Text>

                        <View style={styles.standardsList}>
                            {standards.map((item, index) => (
                                <View key={index} style={styles.standardItem}>
                                    <Text style={styles.standardText}>{item}</Text>
                                    {isEditing && (
                                        <TouchableOpacity onPress={() => removeStandard(index)} style={styles.removeButton}>
                                            <Ionicons name="close-outline" size={18} color="#9CA3AF" />
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
                                        placeholderTextColor="#9CA3AF"
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
                                            <Ionicons name="close-outline" size={18} color="#9CA3AF" />
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
                                        placeholderTextColor="#9CA3AF"
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
                                    placeholderTextColor="#CBD5E1"
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
                                                <Ionicons name="trash-outline" size={14} color="#94A3B8" />
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

                    {/* Account Actions */}
                    <View style={styles.sectionContainer}>
                        <Text style={styles.sectionTitle}>ACCOUNT</Text>

                        {user?.email && (
                            <Text style={styles.accountEmail}>{user.email}</Text>
                        )}

                        <TouchableOpacity
                            style={styles.signOutButton}
                            onPress={() => {
                                Alert.alert(
                                    'Sign Out',
                                    'Are you sure you want to sign out?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Sign Out', style: 'destructive', onPress: async () => {
                                                await AsyncStorage.clear();
                                                await signOut();
                                            }
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="log-out-outline" size={18} color="#8E8E93" />
                            <Text style={styles.signOutButtonText}>SIGN OUT</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteAccountButton}
                            onPress={() => {
                                Alert.alert(
                                    'Delete Account',
                                    'This will permanently delete your account and all data. This cannot be undone.',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                            text: 'Delete Account', style: 'destructive', onPress: async () => {
                                                const success = await db.deleteAccount();
                                                if (success) {
                                                    await AsyncStorage.clear();
                                                    await signOut();
                                                } else {
                                                    Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                                                }
                                            }
                                        },
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            <Text style={styles.deleteAccountButtonText}>DELETE ACCOUNT</Text>
                        </TouchableOpacity>
                    </View>

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
        paddingHorizontal: 32, // More breathing room
    },
    // Header
    header: {
        marginTop: 32,
        marginBottom: 64, // Architectural spacing
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
        borderColor: '#ec4899', // pink-500 ring
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
        color: '#0F172A',
        fontWeight: '500',
    },
    editButtonHeader: {
        width: 44,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
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
        color: '#94A3B8',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginBottom: 32,
    },
    // Data Rows (Identity)
    dataRow: {
        marginBottom: 32,
    },
    dataLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    dataValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 14,
    },
    dataValue: {
        fontSize: 20,
        color: '#1E293B',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    dataInput: {
        fontSize: 20,
        color: '#334155',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        padding: 0,
        flex: 1,
    },
    placeholderValue: {
        color: '#CBD5E1',
    },
    zodiacSubText: {
        fontSize: 14,
        letterSpacing: 1,
    },
    editIcon: {
        opacity: 0.5,
        marginLeft: 8,
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
        borderBottomColor: '#F1F5F9',
    },
    standardText: {
        fontSize: 15,
        color: '#334155',
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
        color: '#475569',
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 24,
        minHeight: 180,
    },
    notesInput: {
        fontSize: 16,
        lineHeight: 26,
        color: '#334155',
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
        fontSize: 11,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    accountEmail: {
        fontSize: 13,
        color: '#8E8E93',
        marginBottom: 20,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#F9FAFB',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
        marginBottom: 12,
    },
    signOutButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
    },
    deleteAccountButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FEF2F2',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    deleteAccountButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#EF4444',
        letterSpacing: 1,
    },
    // Suggestions
    suggestionsRow: {
        marginBottom: 16,
    },
    suggestionChip: {
        backgroundColor: '#fdf2f8', // pink-50
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#fce7f3', // pink-100
    },
    suggestionText: {
        fontSize: 12,
        color: '#db2777', // pink-600 for contrast
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
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 20,
        borderLeftWidth: 3,
        borderLeftColor: '#ec4899', // pink-500 accent
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
        color: '#94A3B8',
        letterSpacing: 1.5,
    },
    logText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#334155',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    },
});
