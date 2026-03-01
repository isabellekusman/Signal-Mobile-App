
import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";
import { logger } from '../services/logger';
import { isRevenueCatConfigured, waitForRevenueCat } from '../services/subscription';

/**
 * Returns true when the user has an active entitlement called "premium".
 * Waits for RevenueCat to be configured before making any SDK calls.
 */
export default function useSubscription() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        let unsubscribe: any = null;
        let cancelled = false;

        const init = async () => {
            try {
                // Wait for RevenueCat to be configured before calling any SDK methods
                await waitForRevenueCat();
                if (cancelled) return;

                // Only call SDK methods if configure actually succeeded
                if (!isRevenueCatConfigured()) {
                    logger.warn('useSubscription: RevenueCat not configured, skipping SDK calls');
                    return;
                }

                const info = await Purchases.getCustomerInfo();
                if (!cancelled) {
                    setIsPro(Boolean(info.entitlements.active?.premium));
                }
            } catch (e) {
                logger.warn('getCustomerInfo error', { extra: { e } });
            }

            // listen for updates (fires after a purchase)
            if (isRevenueCatConfigured()) {
                unsubscribe = Purchases.addCustomerInfoUpdateListener((info) => {
                    setIsPro(Boolean(info.entitlements.active?.premium));
                });
            }
        };

        init();

        return () => {
            cancelled = true;
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            } else if (unsubscribe && unsubscribe.remove) {
                unsubscribe.remove();
            }
        };
    }, []);

    return isPro;
}
