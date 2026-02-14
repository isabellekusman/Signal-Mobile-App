
import React from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ChatScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                    {/* Page Header */}
                    <View style={styles.header}>
                        <Text style={styles.pageTitle}>Self-Alignment</Text>
                        <Text style={styles.pageSubtitle}>MAINTAIN YOUR CENTER</Text>
                        <View style={styles.separator} />
                    </View>

                    {/* Main Card */}
                    <View style={styles.card}>
                        {/* Background Glow Effect (simulated with shadow/border for now) */}

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
                                />
                                {/* Resize handle icon or similar could go here visually, but TextInput handles it */}
                            </View>

                            <TouchableOpacity style={styles.realignButton}>
                                <Text style={styles.realignButtonText}>REALIGN ME</Text>
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
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        marginTop: 40,
        marginBottom: 40,
        paddingHorizontal: 10,
    },
    pageTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 36,
        color: '#1C1C1E',
        marginBottom: 8,
    },
    pageSubtitle: {
        fontSize: 10,
        fontWeight: '800',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    separator: {
        height: 1,
        backgroundColor: '#F2F2F7',
        width: '100%',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 4, // Padding for the border/glow effect area if we add one
        borderWidth: 1,
        borderColor: '#F2F2F7',
        shadowColor: '#ec4899', // pink-500 shadow for glow effect
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1, // Subtle pink glow
        shadowRadius: 20,
        elevation: 5,
        minHeight: 500,
    },
    cardContent: {
        flex: 1,
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
        color: '#1C1C1E', // Darker for readability on white
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 48,
        textAlign: 'center',
        fontStyle: 'italic', // Matches "Object Check-In" vibe slightly or keep standard? Image shows standard sans but italic title. Text is sans.
        // Actually image shows subtitle is italic serif? No, subtitle "CALIBRATE..." looks like Sans. "Objective Check-In" is Serif Italic.
    },
    inputContainer: {
        width: '100%',
        height: 200,
        backgroundColor: '#FAFAFA', // Very light gray/white
        borderRadius: 24,
        padding: 24,
        marginBottom: 40,
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
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        paddingHorizontal: 60,
        borderRadius: 16,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2, // Stronger shadow for button pop
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#FCE7F3', // Light pink border
        width: '100%',
        alignItems: 'center',
    },
    realignButtonText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1C1C1E',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});
