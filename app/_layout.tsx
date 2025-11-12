import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BountyProvider } from "@/contexts/BountyContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isAuthenticated, isLoading, isInitialized, initializationError, retryInitialization } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const isAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    if (!isAuthenticated && inAuthGroup) {
      console.log('User not authenticated, redirecting to login');
      router.replace('/login');
    } else if (isAuthenticated && (isAuthScreen || (!inAuthGroup && segments.length === 0))) {
      console.log('User authenticated, redirecting to tabs');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isInitialized, router]);

  useEffect(() => {
    if (isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized]);

  if (initializationError) {
    return (
      <View style={styles.errorContainer} testID="firebase-error-screen">
        <Text style={styles.errorTitle}>Unable to connect</Text>
        <Text style={styles.errorMessage}>{initializationError}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={retryInitialization} activeOpacity={0.8} testID="firebase-retry-button">
          <Text style={styles.retryButtonText}>Retry connection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.supportLink} onPress={() => router.push("/support")} activeOpacity={0.8} testID="firebase-support-button">
          <Text style={styles.supportLinkText}>Need setup help?</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading || !isInitialized) {
    return (
      <View style={styles.loadingContainer} testID="root-loading-state">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ presentation: "modal" }} />
      <Stack.Screen name="terms" options={{ title: "Terms of Service" }} />
      <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="support" options={{ title: "Help & Support" }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen name="payment-methods" options={{ title: "Payment Methods" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BountyProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </BountyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#111827',
    gap: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#F9FAFB',
  },
  errorMessage: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  supportLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  supportLinkText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#E0E7FF',
  },
});
