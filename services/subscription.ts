
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

const API_KEYS = {
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'goog_placeholder', // User will need to add these
    google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
};

export const ENTITLEMENT_ID = 'premium';

export const setupSubscription = async (userId: string) => {
    try {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);

        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: API_KEYS.apple, appUserId: userId });
        } else {
            await Purchases.configure({ apiKey: API_KEYS.google, appUserId: userId });
        }

        console.log('[Subscription] RevenueCat initialized for user:', userId);
    } catch (e) {
        console.error('[Subscription] Failed to initialize:', e);
    }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) {
            return offerings.current;
        }
    } catch (e) {
        console.error('[Subscription] Error fetching offerings:', e);
    }
    return null;
};

export const purchasePremium = async (pkg: PurchasesPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e: any) {
        if (!e.userCancelled) {
            console.error('[Subscription] Purchase error:', e);
        }
        return false;
    }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        console.error('[Subscription] Check status error:', e);
        return false;
    }
};

export const restorePurchases = async (): Promise<boolean> => {
    try {
        const customerInfo = await Purchases.restorePurchases();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        console.error('[Subscription] Restore error:', e);
        return false;
    }
};
