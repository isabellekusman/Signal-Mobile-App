
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { logger } from './logger';

/**
 * Notifications Service
 * 
 * Handles push notification token registration and permissions.
 * Tokens are stored in the Supabase 'device_tokens' table.
 */

// Configure how notifications should be handled when the app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

/**
 * Register the device for push notifications and save the token to Supabase.
 */
export async function registerForPushNotificationsAsync(userId: string) {
    let token;

    if (!Device.isDevice) {
        logger.breadcrumb('Push Notifications: Skipped (Not a physical device)', 'notifications');
        return null;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            logger.breadcrumb('Push Notifications: Permission denied', 'notifications');
            return null;
        }

        // Get the token from Expo
        token = (await Notifications.getExpoPushTokenAsync({
            // You can find your projectId in app.json or Expo dashboard
            // projectId: '...', 
        })).data;

        if (token) {
            // Save the token to Supabase
            const { error } = await supabase
                .from('device_tokens')
                .upsert({
                    user_id: userId,
                    token: token,
                    platform: Platform.OS as 'ios' | 'android'
                }, { onConflict: 'user_id, token' });

            if (error) {
                logger.error(error, { tags: { service: 'notifications', method: 'register' } });
            } else {
                logger.breadcrumb('Push notification token registered', 'notifications');
            }
        }

    } catch (err) {
        logger.error(err, { tags: { service: 'notifications' } });
    }

    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    return token;
}

/**
 * Clean up stale notification tokens on sign out.
 */
export async function unregisterPushNotificationsAsync(userId: string) {
    try {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        if (token) {
            await supabase
                .from('device_tokens')
                .delete()
                .eq('user_id', userId)
                .eq('token', token);
        }
    } catch (err) {
        // We don't want to block sign-out if this fails
        logger.warn('Failed to unregister notification token during sign out', { extra: { err } });
    }
}
