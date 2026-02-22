
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Connection } from '../context/ConnectionsContext';
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
        shouldShowBanner: true,
        shouldShowList: true,
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

/**
 * Schedule personalized daily push notifications locally (requires no backend cron).
 * Rotates between most active, neglected, and self-reflection.
 */
export async function schedulePersonalizedNotifications(connections: Connection[]) {
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();

        if (!connections || connections.length === 0) {
            // Very simple fallback if no connections yet
            const trigger = new Date();
            trigger.setDate(trigger.getDate() + 1);
            trigger.setHours(9, 0, 0, 0);
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Signal",
                    body: "Start tracking a connection today to uncover your patterns."
                },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
            });
            return;
        }

        // 1. Identify "Most Active"
        const activeConn = connections.reduce((prev, current) => {
            const prevScore = (prev.dailyLogs?.length || 0) + (prev.signals?.length || 0);
            const currScore = (current.dailyLogs?.length || 0) + (current.signals?.length || 0);
            return currScore > prevScore ? current : prev;
        }, connections[0]);

        // 2. Identify "Neglected" (No logs in > 3 days)
        const now = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(now.getDate() - 3);

        const neglectedConns = connections.filter(c => {
            if (c.lastActive === 'JUST NOW') return false;
            const lastDate = new Date(c.lastActive);
            if (isNaN(lastDate.getTime())) return true;
            return lastDate < threeDaysAgo;
        });
        const neglectedConn = neglectedConns.length > 0
            ? neglectedConns[Math.floor(Math.random() * neglectedConns.length)]
            : null;

        // Schedule next 7 days in advance
        for (let i = 1; i <= 7; i++) {
            let typeIndicator = i % 3;
            // If they don't have a neglected connection, fall back to self-reflection
            if (typeIndicator === 1 && !neglectedConn) typeIndicator = 2;

            let title = "Signal";
            let body = "Check in on your connections today.";

            if (typeIndicator === 0 && activeConn) {
                title = `You & ${activeConn.name}`;
                body = `You and ${activeConn.name} have been in sync lately. Check in on today's signal.`;
            } else if (typeIndicator === 1 && neglectedConn) {
                title = `Checking in on ${neglectedConn.name}`;
                body = `You haven't checked in on ${neglectedConn.name} in a while. See where things stand.`;
            } else {
                title = "Daily Reflection";
                body = "You've been tracking a lot lately. Here's what your patterns are saying about you.";
            }

            const triggerDate = new Date();
            triggerDate.setDate(triggerDate.getDate() + i);
            triggerDate.setHours(9, 0, 0, 0); // User configured: default 9am

            await Notifications.scheduleNotificationAsync({
                content: { title, body },
                trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
            });
        }
    } catch (err) {
        logger.error(err, { tags: { service: 'notifications', method: 'schedulePersonalizedNotifications' } });
    }
}
