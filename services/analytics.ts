import { Platform } from 'react-native';
import { logger } from './logger';

class AnalyticsService {
    private isInitialized = false;
    private userId: string | null = null;

    init() {
        if (this.isInitialized) return;
        this.isInitialized = true;
        // Mock init for external analytics provider (e.g. PostHog, Mixpanel)
        logger.breadcrumb('Analytics Service initialized', 'analytics');
    }

    identify(userId: string, traits?: Record<string, any>) {
        this.userId = userId;
        // Mock identity mapping
        logger.breadcrumb(`Analytics Identify: ${userId}`, 'analytics');
    }

    reset() {
        this.userId = null;
        // Mock session wipe out
        logger.breadcrumb('Analytics Reset', 'analytics');
    }

    track(eventName: string, properties?: Record<string, any>) {
        // Track analytic events - integrate posthog here later 
        logger.breadcrumb(`Track Event: ${eventName}`, 'analytics', { ...properties, platform: Platform.OS });
    }
}

export const analytics = new AnalyticsService();
