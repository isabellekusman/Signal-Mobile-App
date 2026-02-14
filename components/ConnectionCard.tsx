
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ConnectionCardProps {
    id: string;
    name: string;
    tag: string;
    zodiac: string;
    lastActive: string;
    icon: string;
    status: 'active' | 'archived'; // Add status
    isSelected?: boolean;
    onPress: () => void;
    onOpenFile?: () => void;
    onDelete: () => void;
    onDownload: () => void;
}

const { width } = Dimensions.get('window');

export default function ConnectionCard({
    id,
    name,
    tag,
    zodiac,
    lastActive,
    icon,
    status, // Accept status
    isSelected = false,
    onPress,
    onOpenFile,
    onDelete,
    onDownload
}: ConnectionCardProps) {
    // Animation value for scale
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isSelected ? 1.15 : 1, // Scale up to 1.15 if selected, back to 1 if not
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();
    }, [isSelected]);

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                isSelected && styles.cardSelected
            ]}
        >
            {/* Header Row: Tag & Zodiac */}
            <View style={styles.headerRow}>
                <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>{tag}</Text>
                </View>
                <Text style={styles.zodiacText}>{zodiac}</Text>
            </View>

            {/* Main Content: Icon, Name, Status */}
            <View style={styles.contentBody}>
                {/* Animated Avatar Container */}
                <Animated.View
                    style={[
                        styles.avatarContainer,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <Ionicons name={icon as any} size={40} color="#ec4899" />
                </Animated.View>

                <Text style={styles.nameText}>{name}</Text>
                <Text style={styles.statusText}>{lastActive}</Text>
            </View>

            {/* Action Row */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={onOpenFile}
                    activeOpacity={0.8}
                >
                    <Text style={styles.primaryButtonText}>OPEN FILE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onDelete}
                    activeOpacity={0.7}
                >
                    <Ionicons name="trash-outline" size={20} color="#8E8E93" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onDownload}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name={status === 'archived' ? "arrow-up-outline" : "arrow-down-outline"}
                        size={20}
                        color="#8E8E93"
                    />
                </TouchableOpacity>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        // Refined Shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: '#ec4899', // pink-500
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    tagContainer: {
        backgroundColor: '#F2F2F7', // Light gray background
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    tagText: {
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontSize: 11,
        fontWeight: '700',
        color: '#1C1C1E', // Black text
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    zodiacText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#C7C7CC',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    contentBody: {
        alignItems: 'center',
        marginBottom: 28,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: '#FCE7F3', // pink-100
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FDF2F8', // pink-50
    },
    nameText: {
        // Using system serif or a specific font if available
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 32,
        color: '#1C1C1E',
        marginBottom: 8,
        textAlign: 'center',
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#8E8E93',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        backgroundColor: '#000000',
        borderRadius: 14, // Slightly rounded
        height: 48, // Minimum tap target
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    iconButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#E5E5EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
