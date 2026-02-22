
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { logger } from './logger';

const API_KEYS = {
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'goog_placeholder', // User will need to add these
    google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
};

export const ENTITLEMENT_ID = 'premium';

export const setupSubscription = async (userId: string) => {
    try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: API_KEYS.apple, appUserID: userId });
        } else {
            await Purchases.configure({ apiKey: API_KEYS.google, appUserID: userId });
        }

        logger.breadcrumb(`RevenueCat initialized for user: ${userId}`, 'subscription');
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'setup' } });
    }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
    try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null) {
            return offerings.current;
        }
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'getOfferings' } });
    }
    return null;
};

export const purchasePremium = async (pkg: PurchasesPackage) => {
    try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e: any) {
        if (!e.userCancelled) {
            logger.error(e, { tags: { service: 'subscription', method: 'purchasePremium' } });
        }
        return false;
    }
};

export const checkPremiumStatus = async (): Promise<boolean> => {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'checkPremiumStatus' } });
        return false;
    }
};

export const restorePurchases = async (): Promise<boolean> => {
    try {
        const customerInfo = await Purchases.restorePurchases();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'restorePurchases' } });
        return false;
    }
};
