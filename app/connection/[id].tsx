
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

// Mock chips for the Clarity tab
const CHIPS = [
    "DELAYED REPLY",
    "MIXED SIGNALS",
    "OVERTHINKING",
    "AVOIDANT ENERGY",
    "SUDDEN DISTANCE"
];

export default function ConnectionDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Destructure params with fallbacks
    const { name = 'sam', tag = 'SITUATIONSHIP', zodiac = 'LIBRA', icon = 'leaf-outline' } = params;

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

                {/* Navigation Header */}
                <View style={styles.navHeader}>
                    <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="arrow-back" size={12} color="#8E8E93" style={{ marginRight: 4 }} />
                            <Text style={styles.navText}>BACK TO CONNECTIONS</Text>
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={styles.navText}>EDIT CONNECTION</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Section */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Ionicons name={icon as any} size={80} color="#8E8E93" />

                        {/* Floating Zodiac Badge */}
                        <View style={styles.zodiacBadge}>
                            <Text style={styles.zodiacText}>{zodiac}</Text>
                        </View>
                    </View>

                    <Text style={styles.profileName}>{name}</Text>

                    <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity style={styles.activeTab}>
                        <Text style={styles.activeTabText}>CLARITY</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inactiveTab}>
                        <Text style={styles.inactiveTabText}>DECODER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inactiveTab}>
                        <Text style={styles.inactiveTabText}>STARS</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.inactiveTab}>
                        <Text style={styles.inactiveTabText}>DYNAMIC</Text>
                    </TouchableOpacity>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentSection}>
                    <Text style={styles.contentTitle}>What's on your mind?</Text>
                    <Text style={styles.contentSubtitle}>We'll parse the signal from the noise. Just tell us what happened.</Text>

                    {/* Input Placeholder Area */}
                    <View style={styles.inputArea}>
                        <Text style={styles.placeholderText}>He said he'd call, but...</Text>
                    </View>

                    {/* Chips */}
                    <View style={styles.chipsContainer}>
                        {CHIPS.map((chip, index) => (
                            <TouchableOpacity key={index} style={styles.chip}>
                                <Text style={styles.chipText}>{chip}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>TALK IT THROUGH</Text>
                    </TouchableOpacity>

                </View>

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
        paddingBottom: 40,
    },
    navHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 20,
        marginBottom: 20,
    },
    navText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    avatarContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1.5,
        borderColor: '#FCE7F3', // pink-100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        backgroundColor: '#FFFFFF',
        position: 'relative',
    },
    zodiacBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    zodiacText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ec4899', // pink-500
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    profileName: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 48,
        color: '#1C1C1E',
        marginBottom: 16,
    },
    tagBadge: {
        backgroundColor: '#FCE7F3', // pink-100
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#ec4899', // pink-500
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 32,
        marginBottom: 60,
        paddingHorizontal: 20,
    },
    activeTab: {
        paddingVertical: 8,
        borderBottomWidth: 0,
    },
    activeTabText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#1C1C1E', // Black for active
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    inactiveTab: {
        paddingVertical: 8,
    },
    inactiveTabText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#C7C7CC', // Light gray for inactive
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    contentSection: {
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    contentTitle: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 36,
        color: '#1C1C1E',
        marginBottom: 16,
        textAlign: 'center',
    },
    contentSubtitle: {
        fontSize: 14,
        color: '#8E8E93',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 20,
        maxWidth: 280,
    },
    inputArea: {
        marginBottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    placeholderText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia-Italic' : 'serif',
        fontSize: 28,
        color: '#E5E5EA', // Very light gray placeholder
        textAlign: 'center',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 50,
        paddingHorizontal: 10,
    },
    chip: {
        backgroundColor: '#F9FAFB', // Very light gray
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    actionButton: {
        backgroundColor: '#A1A1AA', // Gray button per screenshot (looks like 'zinc-400')
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 30,
        width: '60%',
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
});
