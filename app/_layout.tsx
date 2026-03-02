import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';

import OfflineBanner from '../components/OfflineBanner';
import PaywallModal from '../components/PaywallModal';
import PulseLoader from '../components/PulseLoader';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConnectionsProvider, useConnections } from '../context/ConnectionsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import useSubscription from '../hooks/useSubscription';
import { analytics } from '../services/analytics';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { registerForPushNotificationsAsync, schedulePersonalizedNotifications } from '../services/notifications';
import { checkPremiumStatus, getOfferings, isRevenueCatConfigured, purchasePremium, setupSubscription } from '../services/subscription';

// ─── Sentry Initialization ──────────────────────────────────
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  // Set to 1.0 for dev, lower in production to manage volume
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  // Only send events when a real DSN is configured
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
  debug: __DEV__,
  environment: __DEV__ ? 'development' : 'production',
});

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding, hasSeenSubWelcome, isTrialActive, hasSeenTrialExpiry } = useConnections();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait for both auth and onboarding state to load
    if (authLoading || hasCompletedOnboarding === null) return;

    const inLoginScreen = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session) {
      if (!inLoginScreen) router.replace('/login');
      return;
    }

    // --- Authenticated Paths ---
    if (!hasCompletedOnboarding) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }

    // If we get here, they should be in the main app
    if (inLoginScreen || inOnboarding) {
      router.replace('/(tabs)');
    }
  }, [session, authLoading, hasCompletedOnboarding, segments, hasSeenSubWelcome, isTrialActive, hasSeenTrialExpiry]);

  if (authLoading || hasCompletedOnboarding === null) {
    return <PulseLoader />;
  }

  return <>{children}</>;
}

function InnerLayout() {
  const { session } = useAuth();
  const isConnected = useNetworkStatus();
  const isPro = useSubscription();
  const { connections, theme, paywallMode, setShowPaywall, hasSeenSubWelcome, hasSeenTrialExpiry, isTrialActive, hasCompletedOnboarding } = useConnections();
  const [revenueCatReady, setRevenueCatReady] = useState(false);

  // ─── Schedule Daily Local Notifications ───
  useEffect(() => {
    if (session?.user && connections) {
      schedulePersonalizedNotifications(connections);
    }
  }, [connections, session?.user]);

  // ─── Identify user in Sentry & Register Push ───
  useEffect(() => {
    analytics.init();
    if (session?.user?.id) {
      logger.identifyUser(session.user.id, session.user.email);
      analytics.identify(session.user.id, { email: session.user.email });
      // Register for push notifications on login/startup
      registerForPushNotificationsAsync(session.user.id).catch((err) => {
        logger.warn('Failed to register push explicitly handling', { extra: { err } });
      });
    } else {
      logger.clearUser();
      analytics.reset();
    }
  }, [session?.user?.id]);

  // ─── RevenueCat Initialization (must come BEFORE paywall logic) ───
  useEffect(() => {
    if (session?.user?.id) {
      setupSubscription(session.user.id).then(() => {
        if (isRevenueCatConfigured()) {
          checkPremiumStatus();
        }
        setRevenueCatReady(true);
      });
    }
  }, [session?.user?.id]);

  useEffect(() => {
    // Only trigger after RevenueCat is ready, actually configured, and onboarding is complete
    if (!revenueCatReady || !isRevenueCatConfigured()) return;
    // Disable automatic/forced paywall popup; paywall will only appear from explicit user actions (e.g. VIEW PLANS).
    // if (hasCompletedOnboarding && (!hasSeenSubWelcome || (!isTrialActive && !hasSeenTrialExpiry))) {
    //   setShowPaywall('forced');
    // }
  }, [revenueCatReady, hasCompletedOnboarding, hasSeenSubWelcome, isTrialActive, hasSeenTrialExpiry]);



  const handleSubscribe = async (tier: 'seeker' | 'signal') => {
    try {
      const offerings = await getOfferings();
      if (!offerings) {
        throw new Error("No products available from store.");
      }

      // Find the package that matches the tier
      // Usually packages are named 'seeker_monthly' or similar in RevenueCat
      const pkg = offerings.availablePackages.find(p =>
        p.product.identifier.includes(tier) || p.identifier.toLowerCase().includes(tier)
      );

      if (!pkg) {
        throw new Error(`Package for ${tier} not found.`);
      }

      const success = await purchasePremium(pkg);

      if (success) {
        await db.upsertProfile({
          subscription_tier: tier,
          has_seen_sub_welcome: true,
          has_seen_trial_expiry: true
        });
        setShowPaywall(null);
        alert(`Success! You are now subscribed to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`);
      } else {
        // If purchasePremium returns false, it might have been cancelled or failed
      }
    } catch (err: any) {
      alert(err.message || "Subscription failed. Please try again.");
    }
  };

  const handleStartTrial = async () => {
    // In RevenueCat, the trial is just a package whose product has a free-trial
    // period configured in App Store Connect.  We purchase the first (cheapest)
    // available package — the store handles the trial automatically.
    try {
      const offerings = await getOfferings();
      if (!offerings || offerings.availablePackages.length === 0) {
        alert("No plans are available right now. Please try again later.");
        return;
      }
      // Default to the first package (usually the cheapest / seeker tier)
      const pkg = offerings.availablePackages[0];
      const success = await purchasePremium(pkg);
      if (success) {
        await db.upsertProfile({
          subscription_tier: 'seeker',
          has_seen_sub_welcome: true,
          has_seen_trial_expiry: true,
        });
        setShowPaywall(null);
        alert("Welcome! Your 7-day free trial has started.");
      }
    } catch (err: any) {
      alert(err.message || "Could not start the trial. Please try again.");
    }
  };

  const handleClose = async () => {
    try {
      if (!hasSeenSubWelcome) {
        await db.upsertProfile({ has_seen_sub_welcome: true });
      } else if (!isTrialActive && !hasSeenTrialExpiry) {
        await db.upsertProfile({ has_seen_trial_expiry: true });
      }
    } catch (err) {
      logger.warn('Failed to mark paywall as seen', { extra: { err } });
    }
    setShowPaywall(null);
  };

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <OfflineBanner isConnected={isConnected} />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          <Stack.Screen name="add-connection" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
      </AuthGate>
      <PaywallModal
        visible={paywallMode !== null && !isPro}
        onClose={handleClose}
        onSubscribe={handleSubscribe}
        onStartTrial={handleStartTrial}
        showCloseButton={paywallMode === 'voluntary'}
        isTrialActive={isTrialActive}
      />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

function RootLayout() {
  return (
    <AuthProvider>
      <ConnectionsProvider>
        <InnerLayout />
      </ConnectionsProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
