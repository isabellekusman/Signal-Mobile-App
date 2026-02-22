
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * A central service for managing haptic feedback across the app.
 * Using a central service allows us to easily disable haptics for specific 
 * platforms or based on user preferences in the future.
 */
class HapticService {
    /**
     * Light impact for subtle interactions like tapping a button or a toggle.
     */
    async light() {
        if (Platform.OS === 'web') return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    /**
     * Medium impact for more significant actions like saving a form.
     */
    async medium() {
        if (Platform.OS === 'web') return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    /**
     * Heavy impact for destructive actions or major transitions.
     */
    async heavy() {
        if (Platform.OS === 'web') return;
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    /**
     * Success notification for completed AI analysis or successful operations.
     */
    async success() {
        if (Platform.OS === 'web') return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    /**
     * Warning notification for errors or validation failures.
     */
    async warning() {
        if (Platform.OS === 'web') return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    /**
     * Error notification for failed operations or validation errors.
     */
    async error() {
        if (Platform.OS === 'web') return;
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    /**
     * Selection feedback for scrolling through pickers or switching tabs.
     */
    async selection() {
        if (Platform.OS === 'web') return;
        await Haptics.selectionAsync();
    }
}

export const haptics = new HapticService();
