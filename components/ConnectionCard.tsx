
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
    compact?: boolean; // New prop for grid view
}

const { width } = Dimensions.get('window');

export default function ConnectionCard({
    id,
    name,
    tag,
    zodiac,
    lastActive,
    icon,
    status,
    isSelected = false,
    onPress,
    onOpenFile,
    onDelete,
    onDownload,
    compact = false // Default to false
}: ConnectionCardProps) {
    // Animation value for scale
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(scaleAnim, {
            toValue: isSelected ? 1.05 : 1, // Reduce scale effect for compact cards
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
                isSelected && styles.cardSelected,
            ]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* Avatar Left */}
                <Animated.View
                    style={[
                        styles.avatarContainer,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    <Ionicons name={icon as any} size={24} color="#ec4899" />
                </Animated.View>

                {/* Name & Status Center */}
                <View style={styles.infoContainer}>
                    <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.statusText}>{lastActive}</Text>
                    </View>
                </View>
            </View>

            {/* Action Right */}
            <TouchableOpacity
                style={styles.openButton}
                onPress={onOpenFile}
                activeOpacity={0.8}
            >
                <Ionicons name="chevron-forward" size={20} color="#D1D1D6" />
            </TouchableOpacity>
        </Pressable >
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        // Subtle Border instead of heavy shadow
        borderWidth: 1,
        borderColor: '#F2F2F7',
        width: '100%',
    },
    cardSelected: {
        // Removed selection visual since user found it confusing/unwanted
        borderColor: '#E5E5EA',
    },
    avatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F2F2F7', // Neutral border
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        backgroundColor: '#F9FAFB', // Neutral background
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: 18,
        color: '#1C1C1E',
        marginBottom: 2,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: '#D1D1D6',
        marginHorizontal: 6,
    },
    tagTextInline: {
        fontSize: 10,
        fontWeight: '700',
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    openButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    }
});
