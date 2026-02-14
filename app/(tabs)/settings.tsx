
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
    const [standards, setStandards] = useState(['Growth mindset', 'Shared ambition']);
    const [newStandard, setNewStandard] = useState('');
    const [name, setName] = useState('izzy');
    const [notes, setNotes] = useState('');

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

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Header Section */}
                    <View style={styles.header}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                            <View style={styles.logoContainer}>
                                <Ionicons name="heart-outline" size={24} color="#ec4899" />
                            </View>
                            <Text style={styles.pageTitle}>My Profile</Text>
                        </View>

                        <View style={styles.headerMeta}>
                            <Text style={styles.pageSubtitle}>WHO AM I?</Text>
                        </View>
                    </View>

                    {/* Main Profile Card */}
                    <View style={styles.card}>

                        {/* Name Field */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>MY NAME</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Zodiac Field (Static for now or Picker later) */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>ZODIAC SIGN</Text>
                            <View style={styles.staticInput}>
                                <Text style={styles.staticInputText}>CAPRICORN</Text>
                            </View>
                        </View>

                        {/* Standards Section */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>MY STANDARDS</Text>

                            {/* List of Standards */}
                            {standards.map((item, index) => (
                                <View key={index} style={styles.standardItem}>
                                    <Text style={styles.standardText}>{item}</Text>
                                    <TouchableOpacity onPress={() => removeStandard(index)}>
                                        <Text style={styles.removeText}>REMOVE</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {/* Add New Standard */}
                            <View style={styles.addStandardContainer}>
                                <TextInput
                                    style={styles.addInput}
                                    placeholder="e.g. Action-based planning..."
                                    placeholderTextColor="#D1D1D6"
                                    value={newStandard}
                                    onChangeText={setNewStandard}
                                />
                                <TouchableOpacity style={styles.addButton} onPress={addStandard}>
                                    <Text style={styles.addButtonText}>ADD</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Notes Section */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>SPECIFIC NOTES</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Any specific boundaries or preferences..."
                                placeholderTextColor="#D1D1D6"
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                            />
                        </View>

                    </View>

                    {/* Data & Backup Card */}
                    <View style={styles.backupCard}>
                        <Text style={styles.backupTitle}>Data & Backup</Text>
                        <Text style={styles.backupDescription}>
                            All your tea is stored locally. Maintain backups periodically to preserve long-term pattern history across devices.
                        </Text>

                        <View style={styles.backupActions}>
                            <TouchableOpacity style={styles.outlineButton}>
                                <Text style={styles.outlineButtonText}>EXPORT DATA</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.outlineButton}>
                                <Text style={styles.outlineButtonText}>IMPORT DATA</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    logoContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#FCE7F3', // Light pink
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
    },
    headerMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingLeft: 4,
    },
    pageSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E', // Green-500
        marginRight: 6,
    },
    statusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    card: {
        backgroundColor: '#F9FAFB', // Light gray bg from design
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 9,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    input: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1C1C1E',
    },
    staticInput: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    staticInputText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    standardItem: {
        backgroundColor: '#F3F4F6', // Slightly darker gray for items
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    standardText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 16,
        color: '#1C1C1E',
    },
    removeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ec4899', // Pink-500
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    addStandardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E5E5EA',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1C1C1E',
    },
    addButton: {
        backgroundColor: '#1C1C1E', // Black
        borderRadius: 20, // Circle-ish or pill
        height: 40,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    textArea: {
        minHeight: 120,
    },
    backupCard: {
        backgroundColor: '#FDF2F8', // Pink-50
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
    },
    backupTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 24,
        color: '#1C1C1E',
        marginBottom: 12,
    },
    backupDescription: {
        fontSize: 14,
        color: '#4B5563', // Gray-600
        lineHeight: 20,
        marginBottom: 24,
        fontStyle: 'italic',
    },
    backupActions: {
        flexDirection: 'row',
        gap: 16,
    },
    outlineButton: {
        borderWidth: 1,
        borderColor: '#1C1C1E',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        alignItems: 'center',
        flex: 1,
    },
    outlineButtonText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1C1C1E',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});
