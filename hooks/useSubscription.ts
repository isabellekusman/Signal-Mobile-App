
import { useEffect, useState } from "react";
import Purchases from "react-native-purchases";

/**
 * Returns true when the user has an active entitlement called "premium".
 * (You used the entitlement named "premium" in RevenueCat earlier.)
 */
export default function useSubscription() {
    const [isPro, setIsPro] = useState(false);

    useEffect(() => {
        let unsubscribe: any = null;

        const init = async () => {
            try {
                const info = await Purchases.getCustomerInfo();
                setIsPro(Boolean(info.entitlements.active?.premium));
            } catch (e) {
                console.warn("getCustomerInfo error", e);
            }

            // listen for updates (fires after a purchase)
            unsubscribe = Purchases.addCustomerInfoUpdateListener((info) => {
                setIsPro(Boolean(info.entitlements.active?.premium));
            });
        };

        init();

        return () => {
            if (unsubscribe && typeof unsubscribe === 'function') {
                unsubscribe();
            } else if (unsubscribe && unsubscribe.remove) {
                unsubscribe.remove();
            }
        };
    }, []);

    return isPro;
}
