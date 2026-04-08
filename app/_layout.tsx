import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { Platform, LogBox } from "react-native";
import {
  useFonts,
  Rajdhani_400Regular,
  Rajdhani_500Medium,
  Rajdhani_600SemiBold,
  Rajdhani_700Bold,
} from "@expo-google-fonts/rajdhani";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "@/lib/locationTask";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNetworkMonitor } from "@/lib/networkMonitor";

SplashScreen.preventAutoHideAsync();

// ─── Global Unhandled Promise Rejection Handler ────────
// Prevents crashes from fire-and-forget promises across the app
if (Platform.OS !== 'web') {
  const originalHandler = (globalThis as any).ErrorUtils?.getGlobalHandler?.();

  if ((globalThis as any).ErrorUtils) {
    (globalThis as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      console.error(`[GlobalError] ${isFatal ? 'FATAL' : 'Non-fatal'}:`, error?.message);
      if (isFatal && originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
}

// Suppress known non-critical warnings in production
if (!__DEV__) {
  LogBox.ignoreAllLogs(true);
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="sos"
        options={{
          presentation: "modal",
          animation: "fade",
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Rajdhani_400Regular,
    Rajdhani_500Medium,
    Rajdhani_600SemiBold,
    Rajdhani_700Bold,
  });
  
  usePushNotifications();
  useNetworkMonitor();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView>
        <KeyboardProvider>
          <StatusBar style="light" />
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
