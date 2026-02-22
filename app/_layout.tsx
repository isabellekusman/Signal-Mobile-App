import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import PaywallModal from '../components/PaywallModal';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConnectionsProvider, useConnections } from '../context/ConnectionsContext';
import { db } from '../services/database';

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
  const { theme, paywallMode, setShowPaywall, hasSeenSubWelcome, hasSeenTrialExpiry, isTrialActive, hasCompletedOnboarding } = useConnections();

  useEffect(() => {
    // Only trigger if we've completed initial onboarding and haven't seen the sub welcome/expiry
    if (hasCompletedOnboarding && (!hasSeenSubWelcome || (!isTrialActive && !hasSeenTrialExpiry))) {
      setShowPaywall('forced');
    }
  }, [hasCompletedOnboarding, hasSeenSubWelcome, isTrialActive, hasSeenTrialExpiry]);



  const handleSubscribe = async (tier: 'seeker' | 'signal') => {
    try {
      await db.upsertProfile({
        subscription_tier: tier,
        has_seen_sub_welcome: true,
        has_seen_trial_expiry: !isTrialActive // Mark trial expiry seen if they subscribe after it ends
      });
      setShowPaywall(null);
      alert(`Success! You are now subscribed to ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`);
    } catch (err) {
      alert("Subscription failed. Please try again.");
    }
  };

  const handleStartTrial = async () => {
    try {
      const trialDate = new Date();
      trialDate.setDate(trialDate.getDate() + 7);
      await db.upsertProfile({
        has_seen_sub_welcome: true,
        trial_expires_at: trialDate.toISOString(),
        subscription_tier: 'signal'
      });
      setShowPaywall(null);
      alert("Your 7-day free trial has started! Enjoy full access to Signal.");
    } catch (err) {
      alert("Failed to start trial. Please try again.");
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
      console.warn("Failed to mark paywall as seen:", err);
    }
    setShowPaywall(null);
  };

  return (
    <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
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
        visible={paywallMode !== null}
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

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConnectionsProvider>
        <InnerLayout />
      </ConnectionsProvider>
    </AuthProvider>
  );
}
