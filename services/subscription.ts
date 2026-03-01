
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { logger } from './logger';

const API_KEYS = {
    apple: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || 'goog_placeholder',
    google: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY || 'goog_placeholder',
};

export const ENTITLEMENT_ID = 'premium';

// ─── RevenueCat Ready Gate ─────────────────────────────────
// Other modules (e.g. useSubscription) must await this before calling any SDK method.
let _resolveReady: () => void;
const _revenueCatReady = new Promise<void>((resolve) => {
    _resolveReady = resolve;
});

/** True only when Purchases.configure() completed without error. */
let _isConfigured = false;

/** Await this before calling any Purchases.* method outside of setupSubscription. */
export const waitForRevenueCat = () => _revenueCatReady;

/** Returns true when the SDK singleton actually exists and is safe to call. */
export const isRevenueCatConfigured = () => _isConfigured;

export const setupSubscription = async (userId: string) => {
    try {
        Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);

        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: API_KEYS.apple, appUserID: userId });
        } else {
            await Purchases.configure({ apiKey: API_KEYS.google, appUserID: userId });
        }

        _isConfigured = true;
        logger.breadcrumb(`RevenueCat initialized for user: ${userId}`, 'subscription');
    } catch (e) {
        _isConfigured = false;
        logger.error(e, { tags: { service: 'subscription', method: 'setup' } });
    } finally {
        // Always resolve so consumers unblock even if configure failed
        _resolveReady();
    }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
    if (!_isConfigured) {
        logger.warn('getOfferings called but RevenueCat is not configured');
        return null;
    }
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
    if (!_isConfigured) {
        logger.warn('purchasePremium called but RevenueCat is not configured');
        return false;
    }
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
    if (!_isConfigured) {
        logger.warn('checkPremiumStatus called but RevenueCat is not configured');
        return false;
    }
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'checkPremiumStatus' } });
        return false;
    }
};

export const restorePurchases = async (): Promise<boolean> => {
    if (!_isConfigured) {
        logger.warn('restorePurchases called but RevenueCat is not configured');
        return false;
    }
    try {
        const customerInfo = await Purchases.restorePurchases();
        return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
        logger.error(e, { tags: { service: 'subscription', method: 'restorePurchases' } });
        return false;
    }
};
