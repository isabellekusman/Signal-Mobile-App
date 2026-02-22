
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

interface OfflineBannerProps {
    isConnected: boolean | null;
}

export default function OfflineBanner({ isConnected }: OfflineBannerProps) {
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        if (isConnected === false) {
            // Slide in
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 400,
                useNativeDriver: true,
            }).start();
        }
    }, [isConnected]);

    if (isConnected === null) return null;

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.banner}>
                <Ionicons name="cloud-offline-outline" size={18} color="#FFFFFF" />
                <Text style={styles.text}>Connection lost. Using offline mode.</Text>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: 50, // To avoid status bar overlay
    },
    banner: {
        backgroundColor: '#ec4899', // pink-500
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        gap: 10,
        shadowColor: '#ec4899',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    text: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
