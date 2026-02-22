import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as Sentry from '@sentry/react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import OfflineBanner from '../components/OfflineBanner';
import PaywallModal from '../components/PaywallModal';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConnectionsProvider, useConnections } from '../context/ConnectionsContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import useSubscription from '../hooks/useSubscription';
import { analytics } from '../services/analytics';
import { db } from '../services/database';
import { logger } from '../services/logger';
import { registerForPushNotificationsAsync, schedulePersonalizedNotifications } from '../services/notifications';
import { checkPremiumStatus, getOfferings, purchasePremium, setupSubscription } from '../services/subscription';

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
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#ec4899" />
      </View>
    );
  }

  return <>{children}</>;
}

function InnerLayout() {
  const { session } = useAuth();
  const isConnected = useNetworkStatus();
  const isPro = useSubscription();
  const { connections, theme, paywallMode, setShowPaywall, hasSeenSubWelcome, hasSeenTrialExpiry, isTrialActive, hasCompletedOnboarding } = useConnections();

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

  useEffect(() => {
    // Only trigger if we've completed initial onboarding and haven't seen the sub welcome/expiry
    if (hasCompletedOnboarding && (!hasSeenSubWelcome || (!isTrialActive && !hasSeenTrialExpiry))) {
      setShowPaywall('forced');
    }
  }, [hasCompletedOnboarding, hasSeenSubWelcome, isTrialActive, hasSeenTrialExpiry]);

  // ─── RevenueCat Initialization ───
  useEffect(() => {
    if (session?.user?.id) {
      setupSubscription(session.user.id).then(() => {
        checkPremiumStatus();
      });
    }
  }, [session?.user?.id]);



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
    // In RevenueCat, the trial is usually just a package with a free trial period.
    // Buying any package for the first time triggers the trial.
    // For simplicity, we'll suggest they pick a plan.
    alert("Please select a plan to start your 7-day free trial.");
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
