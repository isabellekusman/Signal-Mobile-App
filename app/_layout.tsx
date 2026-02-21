import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ConnectionsProvider, useConnections } from '../context/ConnectionsContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, isLoading: authLoading } = useAuth();
  const { hasCompletedOnboarding } = useConnections();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait for both auth and onboarding state to load
    if (authLoading || hasCompletedOnboarding === null) return;

    const inLoginScreen = segments[0] === 'login';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session && !inLoginScreen) {
      // Not authenticated → send to login
      router.replace('/login');
    } else if (session && inLoginScreen) {
      // Authenticated → check onboarding status
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else if (session && !hasCompletedOnboarding && !inOnboarding && !inLoginScreen) {
      // Authenticated but hasn't onboarded → send to onboarding
      router.replace('/onboarding');
    }
  }, [session, authLoading, hasCompletedOnboarding, segments]);

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
  const { theme } = useConnections();

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
