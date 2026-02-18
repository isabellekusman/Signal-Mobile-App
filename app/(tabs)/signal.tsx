import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Connection, useConnections } from '../../context/ConnectionsContext';

const { width } = Dimensions.get('window');
const BUBBLE_SIZE = 110;

const FloatingBubble = ({ connection, index }: { connection: Connection; index: number }) => {
    const router = useRouter();
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance: Pop in
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
            delay: index * 150,
        }).start();

        // 1. Vertical Floating (Breathing)
        const verticalDuration = 4000 + (index % 3) * 1000; // 4s, 5s, or 6s
        const verticalRange = 15;

        Animated.loop(
            Animated.sequence([
                Animated.timing(translateY, {
                    toValue: -verticalRange,
                    duration: verticalDuration,
                    easing: Easing.inOut(Easing.sin), // Smoother sine wave
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: verticalRange,
                    duration: verticalDuration,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 2. Horizontal Swaying (Drifting) - Independent loop for organic feel
        const horizontalDuration = 5500 + (index % 2) * 1500; // Different timing than vertical
        const horizontalRange = 10;

        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: horizontalRange,
                    duration: horizontalDuration,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: -horizontalRange,
                    duration: horizontalDuration,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Unified theme color
    const glowColor = '#ec4899'; // pink-500

    // Determine layout position based on index (Zig-zag)
    const isLeft = index % 2 === 0;
    const randomOffsetX = (index * 37) % 60; // Deterministic pseudo-random offset

    const containerStyle = {
        alignSelf: isLeft ? 'flex-start' as const : 'flex-end' as const,
        marginLeft: isLeft ? 20 + randomOffsetX : 0,
        marginRight: !isLeft ? 20 + randomOffsetX : 0,
        marginTop: index === 0 ? 0 : -30, // Slight overlap/tightness
    };

    const handlePress = () => {
        router.push({
            pathname: '/connection/[id]',
            params: { id: connection.id, tab: 'CLARITY' }
        });
    };

    // Helper to determine if icon is URL or icon name
    const isUrl = (str?: string) => str && (str.startsWith('http') || str.startsWith('file'));

    return (
        <Animated.View
            style={[
                styles.bubbleWrapper,
                containerStyle,
                {
                    transform: [
                        { translateY },
                        { translateX },
                        { scale: scaleAnim }
                    ]
                }
            ]}
        >
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <View style={[styles.bubble, { shadowColor: glowColor }]}>
                    <View style={[styles.innerBubble, { borderColor: glowColor, overflow: 'hidden' }]}>
                        {isUrl(connection.icon) ? (
                            <Image
                                source={{ uri: connection.icon }}
                                style={styles.bubbleImage}
                                resizeMode="cover"
                            />
                        ) : connection.icon ? (
                            <View style={[styles.placeholderIcon, { backgroundColor: '#FFFFFF' }]}>
                                <Ionicons name={connection.icon as any} size={50} color={glowColor} />
                            </View>
                        ) : (
                            <View style={[styles.placeholderIcon, { backgroundColor: '#FCE7F3' }]}>
                                <Text style={[styles.initials, { color: glowColor }]}>
                                    {connection.name.substring(0, 2).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={styles.bubbleName} numberOfLines={1}>{connection.name}</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function SignalScreen() {
    const { connections } = useConnections();
    const activeConnections = connections.filter(c => c.status === 'active');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>SIGNAL</Text>
                <Text style={styles.subtitle}>Active Frequencies</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.scatterContainer}>
                    {activeConnections.map((connection, index) => (
                        <FloatingBubble
                            key={connection.id}
                            connection={connection}
                            index={index}
                        />
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: 70,
    },
    header: {
        paddingHorizontal: 24,
        marginBottom: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: 1,
        color: '#1C1C1E',
    },
    subtitle: {
        fontSize: 14,
        color: '#8E8E93',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        marginTop: 4,
    },
    scrollContent: {
        paddingBottom: 100,
        paddingTop: 20,
    },
    scatterContainer: {
        flex: 1,
        width: '100%',
        minHeight: 500,
    },
    bubbleWrapper: {
        marginBottom: 60, // Significantly increased spacing
    },
    bubble: {
        width: BUBBLE_SIZE,
        height: BUBBLE_SIZE,
        borderRadius: BUBBLE_SIZE / 2,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, // Softer shadow
        shadowRadius: 20,   // Larger glow radius
        elevation: 15,
    },
    innerBubble: {
        width: BUBBLE_SIZE - 6,
        height: BUBBLE_SIZE - 6,
        borderRadius: (BUBBLE_SIZE - 6) / 2,
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: '#FAFAFA',
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
        borderRadius: (BUBBLE_SIZE - 6) / 2,
    },
    placeholderIcon: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initials: {
        fontSize: 28,
        fontWeight: '700',
    },
    bubbleName: {
        marginTop: 16,
        fontSize: 12,
        fontWeight: '700',
        color: '#4B5563',
        textAlign: 'center',
        letterSpacing: 1,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
});
