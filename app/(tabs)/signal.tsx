import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Connection, useConnections } from '../../context/ConnectionsContext';

const { width } = Dimensions.get('window');

const FEATURES = [
    { id: 'CLARITY', label: 'Clarity', icon: 'chatbubble-ellipses-outline' as const, description: 'AI-guided check-in', color: '#ec4899' },
    { id: 'DECODER', label: 'Decoder', icon: 'scan-outline' as const, description: 'Read between the lines', color: '#1C1C1E' },
    { id: 'STARS', label: 'Stars', icon: 'sparkles-outline' as const, description: 'Cosmic compatibility', color: '#ec4899' },
    { id: 'DYNAMIC', label: 'Dynamic', icon: 'pulse-outline' as const, description: 'Daily energy log', color: '#1C1C1E' },
];

export default function SignalScreen() {
    const router = useRouter();
    const { connections } = useConnections();
    const activeConnections = connections.filter(c => c.status === 'active');
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);

    const isUrl = (str?: string) => str && (str.startsWith('http') || str.startsWith('file'));

    const handleFeaturePress = (featureId: string) => {
        if (!selectedConnection) return;
        router.push({
            pathname: '/connection/[id]',
            params: { id: selectedConnection.id, tab: featureId }
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Signal</Text>
                    <Text style={styles.subtitle}>YOUR TOOLKIT</Text>
                </View>

                {/* Step 1: Connection Selector */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>CONNECTION</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.connectionRow}
                    >
                        {activeConnections.map((connection) => {
                            const isSelected = selectedConnection?.id === connection.id;
                            return (
                                <TouchableOpacity
                                    key={connection.id}
                                    style={[
                                        styles.connectionChip,
                                        isSelected && styles.connectionChipSelected,
                                    ]}
                                    onPress={() => setSelectedConnection(connection)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.chipAvatar,
                                        isSelected && styles.chipAvatarSelected,
                                    ]}>
                                        {isUrl(connection.icon) ? (
                                            <Image
                                                source={{ uri: connection.icon }}
                                                style={styles.chipAvatarImage}
                                                resizeMode="cover"
                                            />
                                        ) : connection.icon ? (
                                            <Ionicons
                                                name={connection.icon as any}
                                                size={20}
                                                color={isSelected ? '#ec4899' : '#8E8E93'}
                                            />
                                        ) : (
                                            <Text style={[
                                                styles.chipInitials,
                                                isSelected && { color: '#ec4899' },
                                            ]}>
                                                {connection.name.substring(0, 1).toUpperCase()}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.chipName,
                                        isSelected && styles.chipNameSelected,
                                    ]}>
                                        {connection.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Selected Connection Preview */}
                {selectedConnection && (
                    <View style={styles.selectedPreview}>
                        <View style={styles.selectedInfo}>
                            <View style={styles.selectedAvatarLarge}>
                                {isUrl(selectedConnection.icon) ? (
                                    <Image
                                        source={{ uri: selectedConnection.icon }}
                                        style={{ width: '100%', height: '100%', borderRadius: 28 }}
                                        resizeMode="cover"
                                    />
                                ) : selectedConnection.icon ? (
                                    <Ionicons name={selectedConnection.icon as any} size={28} color="#ec4899" />
                                ) : (
                                    <Text style={styles.selectedInitials}>
                                        {selectedConnection.name.substring(0, 2).toUpperCase()}
                                    </Text>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.selectedName}>{selectedConnection.name}</Text>
                                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                                    <View style={styles.metaBadge}>
                                        <Text style={styles.metaBadgeText}>{selectedConnection.tag}</Text>
                                    </View>
                                    <View style={[styles.metaBadge, { backgroundColor: '#F9FAFB' }]}>
                                        <Text style={[styles.metaBadgeText, { color: '#8E8E93' }]}>{selectedConnection.zodiac}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Step 2: Feature Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>TOOLS</Text>
                    {!selectedConnection && (
                        <View style={styles.emptyHint}>
                            <Ionicons name="arrow-up-outline" size={16} color="#D1D1D6" />
                            <Text style={styles.emptyHintText}>Select a connection first</Text>
                        </View>
                    )}
                    <View style={styles.featureGrid}>
                        {FEATURES.map((feature) => (
                            <TouchableOpacity
                                key={feature.id}
                                style={[
                                    styles.featureCard,
                                    !selectedConnection && styles.featureCardDisabled,
                                ]}
                                onPress={() => handleFeaturePress(feature.id)}
                                activeOpacity={selectedConnection ? 0.7 : 1}
                                disabled={!selectedConnection}
                            >
                                <View style={styles.featureIconWrap}>
                                    <Ionicons
                                        name={feature.icon}
                                        size={22}
                                        color={selectedConnection ? '#ec4899' : '#D1D1D6'}
                                    />
                                </View>
                                <Text style={[
                                    styles.featureLabel,
                                    !selectedConnection && { color: '#D1D1D6' },
                                ]}>
                                    {feature.label}
                                </Text>
                                <Text style={[
                                    styles.featureDesc,
                                    !selectedConnection && { color: '#E5E5EA' },
                                ]}>
                                    {feature.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 12,
        marginBottom: 28,
    },
    title: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    section: {
        marginBottom: 28,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 1.5,
        paddingHorizontal: 24,
        marginBottom: 14,
    },
    // Connection chips
    connectionRow: {
        paddingHorizontal: 24,
        gap: 10,
    },
    connectionChip: {
        alignItems: 'center',
        gap: 6,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F2F2F7',
        minWidth: 80,
    },
    connectionChipSelected: {
        backgroundColor: '#FDF2F8',
        borderColor: '#ec4899',
    },
    chipAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    chipAvatarSelected: {
        backgroundColor: '#FCE7F3',
    },
    chipAvatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    chipInitials: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8E8E93',
    },
    chipName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    chipNameSelected: {
        color: '#ec4899',
    },
    // Selected preview
    selectedPreview: {
        marginHorizontal: 24,
        marginBottom: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    selectedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    selectedAvatarLarge: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    selectedInitials: {
        fontSize: 20,
        fontWeight: '700',
        color: '#ec4899',
    },
    selectedName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1C1C1E',
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
    // Feature grid
    featureGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 24,
        gap: 12,
    },
    featureCard: {
        width: (width - 60) / 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: '#F2F2F7',
    },
    featureCardDisabled: {
        opacity: 0.5,
    },
    featureIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    featureLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1C1C1E',
        marginBottom: 3,
    },
    featureDesc: {
        fontSize: 11,
        color: '#8E8E93',
        lineHeight: 15,
    },
    emptyHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 24,
        marginBottom: 14,
    },
    emptyHintText: {
        fontSize: 12,
        color: '#D1D1D6',
        fontWeight: '500',
    },
});
