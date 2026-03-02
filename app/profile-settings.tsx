import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Purchases from 'react-native-purchases';
import { useAuth } from '../context/AuthContext';
import { useConnections } from '../context/ConnectionsContext';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { isRevenueCatConfigured } from '../services/subscription';

const PINK = '#ec4899';
const DARK = '#1C1C1E';
const GRAY = '#8E8E93';
const LIGHT_GRAY = '#F2F2F7';
const SOFT_GRAY = '#C7C7CC';
const OFF_WHITE = '#F9FAFB';
const WHITE = '#FFFFFF';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function ProfileSettingsScreen() {
    const router = useRouter();
    const { userProfile, subscriptionTier, setShowPaywall } = useConnections();
    const { signOut, user } = useAuth();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleDeleteAccount = async () => {
        Alert.alert(
            'Delete Account',
            'This will permanently delete your account and all your data from our servers. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete Permanently',
                    style: 'destructive',
                    onPress: async () => {
                        setIsRefreshing(true);
                        try {
                            const success = await db.deleteAccount();
                            if (success) {
                                await AsyncStorage.clear();
                                await signOut();
                            } else {
                                Alert.alert('Error', 'Failed to delete account. Please try again or contact support.');
                            }
                        } catch (err) {
                            logger.error(err, { tags: { feature: 'account', method: 'deleteAccount' } });
                        } finally {
                            setIsRefreshing(false);
                        }
                    }
                },
            ]
        );
    };

    const handleSignOut = async () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    await signOut();
                }
            },
        ]);
    };

    const handleRestorePurchases = async () => {
        try {
            if (!isRevenueCatConfigured()) { Alert.alert('RevenueCat not configured'); return; }
            setIsRefreshing(true);
            const info = await Purchases.restorePurchases();
            Alert.alert('Success', `Purchases restored.`);
        } catch (e) {
            Alert.alert("Restore failed", "Could not restore purchases at this time.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@signalapp.com').catch(err => logger.error(err, { tags: { feature: 'settings', method: 'contactSupport' } }));
    };

    return (
        <SafeAreaView style={s.safe}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={DARK} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Profile Overview */}
                <View style={s.profileSection}>
                    <View style={s.avatarOuter}>
                        <View style={s.avatar}>
                            <Text style={s.avatarInitial}>
                                {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    </View>
                    <Text style={s.nameText}>{userProfile.name || 'User'}</Text>
                    {user?.email && <Text style={s.emailText}>{user.email}</Text>}

                    <View style={s.tierBadge}>
                        <Ionicons name="star" size={12} color={PINK} />
                        <Text style={s.tierBadgeText}>{subscriptionTier.toUpperCase()} MEMBER</Text>
                    </View>
                </View>

                {/* Subscription Section */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>SUBSCRIPTION</Text>
                    <View style={s.card}>
                        <TouchableOpacity style={s.cardItem} onPress={() => setShowPaywall('voluntary')}>
                            <Text style={s.cardItemText}>Manage Subscription</Text>
                            <Ionicons name="chevron-forward" size={16} color={SOFT_GRAY} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.cardItem, s.noBorder]} onPress={handleRestorePurchases}>
                            <Text style={s.cardItemText}>Restore Purchases</Text>
                            {isRefreshing ? <ActivityIndicator size="small" color={PINK} /> : <Ionicons name="refresh" size={16} color={SOFT_GRAY} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Legal & Support */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>LEGAL & SUPPORT</Text>
                    <View style={s.card}>
                        <TouchableOpacity style={s.cardItem} onPress={() => router.push('/privacy')}>
                            <Text style={s.cardItemText}>Privacy Policy</Text>
                            <Ionicons name="chevron-forward" size={16} color={SOFT_GRAY} />
                        </TouchableOpacity>
                        <TouchableOpacity style={s.cardItem} onPress={() => router.push('/terms')}>
                            <Text style={s.cardItemText}>Terms of Service</Text>
                            <Ionicons name="chevron-forward" size={16} color={SOFT_GRAY} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.cardItem, s.noBorder]} onPress={handleContactSupport}>
                            <Text style={s.cardItemText}>Contact Support</Text>
                            <Ionicons name="mail-outline" size={16} color={SOFT_GRAY} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Management */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>ACCOUNT MANAGEMENT</Text>
                    <View style={s.card}>
                        <TouchableOpacity style={s.cardItem} onPress={handleSignOut}>
                            <Text style={s.cardItemText}>Sign Out</Text>
                            <Ionicons name="log-out-outline" size={16} color={GRAY} />
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.cardItem, s.noBorder]} onPress={handleDeleteAccount}>
                            <Text style={[s.cardItemText, { color: '#EF4444' }]}>Delete Account</Text>
                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: WHITE,
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: DARK,
        fontFamily: SERIF,
    },
    scroll: {
        paddingBottom: 60,
    },
    profileSection: {
        alignItems: 'center',
        paddingVertical: 32,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
        marginBottom: 24,
    },
    avatarOuter: {
        padding: 3,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: PINK,
        marginBottom: 16,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#FDF2F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarInitial: {
        fontSize: 30,
        fontWeight: '700',
        color: PINK,
        fontFamily: SERIF,
    },
    nameText: {
        fontSize: 24,
        fontWeight: '500',
        color: DARK,
        fontFamily: SERIF,
        marginBottom: 4,
    },
    emailText: {
        fontSize: 13,
        color: GRAY,
        marginBottom: 16,
    },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FDF2F8',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FCE7F3',
        gap: 6,
    },
    tierBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: PINK,
        letterSpacing: 1,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: GRAY,
        letterSpacing: 2.0,
        marginBottom: 16,
    },
    card: {
        backgroundColor: OFF_WHITE,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: LIGHT_GRAY,
        overflow: 'hidden',
    },
    cardItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: LIGHT_GRAY,
    },
    noBorder: {
        borderBottomWidth: 0,
    },
    cardItemText: {
        fontSize: 15,
        color: DARK,
        fontFamily: SERIF,
    }
});
