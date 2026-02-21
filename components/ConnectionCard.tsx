
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fontSize as fs, scale, verticalScale } from '../utils/responsive';

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

import { useConnections } from '../context/ConnectionsContext';


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
    const { theme } = useConnections();
    const isDark = theme === 'dark';

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
                isDark && styles.cardDark,
                isSelected && styles.cardSelected,
            ]}
        >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* Avatar Left / Unarchive Button */}
                <Animated.View
                    style={[
                        styles.avatarContainer,
                        isDark && styles.avatarContainerDark,
                        { transform: [{ scale: scaleAnim }] }
                    ]}
                >
                    {status === 'archived' ? (
                        <TouchableOpacity
                            onPress={(e) => {
                                e.stopPropagation();
                                onDownload();
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="arrow-up" size={24} color="#ec4899" />
                        </TouchableOpacity>
                    ) : (
                        <Ionicons name={icon as any} size={24} color="#ec4899" />
                    )}
                </Animated.View>

                {/* Name & Status Center */}
                <View style={styles.infoContainer}>
                    <Text style={[styles.nameText, isDark && styles.textDark]} numberOfLines={1}>{name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                        <Text style={styles.statusText}>{(() => {
                            if (!lastActive) return '';
                            const d = new Date(lastActive);
                            if (isNaN(d.getTime())) return lastActive;
                            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        })()}</Text>
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
        borderRadius: scale(20),
        padding: scale(16),
        marginBottom: verticalScale(12),
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#F2F2F7',
        width: '100%',
    },
    cardSelected: {
        borderColor: '#E5E5EA',
    },
    avatarContainer: {
        width: scale(48),
        height: scale(48),
        borderRadius: scale(24),
        borderWidth: 1,
        borderColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(16),
        backgroundColor: '#F9FAFB',
    },
    infoContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    nameText: {
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        fontSize: fs(18),
        color: '#1C1C1E',
        marginBottom: verticalScale(2),
    },
    statusText: {
        fontSize: fs(10),
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
    },
    cardDark: {
        backgroundColor: '#2C2C2E',
        borderColor: '#3A3A3C',
    },
    avatarContainerDark: {
        backgroundColor: '#3A3A3C',
        borderColor: '#48484A',
    },
    textDark: {
        color: '#FFFFFF',
    }
});
