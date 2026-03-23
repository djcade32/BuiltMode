import ScreenTracker from "@/components/onboarding/SceeenTracker";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OnboardingLayout = () => {
  // useOnboardingStore.persist.clearStorage()
  // useAuthStore.persist.clearStorage()
  const { isAuthenticated, isHydrated } = useAuthStore();


  if (!isHydrated) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/signin"} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >

      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }}>
        <ScreenTracker />
        <View style={styles.accentArt1} />
        <View style={styles.accentArt2} />
        <Stack>
          <Stack.Screen
            name="welcome"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="username"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="goal"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="metrics"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="weeklyStandard"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="avatar"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="homeTimezone"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default OnboardingLayout;

const styles = StyleSheet.create({
  accentArt1: {
    position: "absolute",
    height: 64,
    width: 4,
    left: 0,
    top: 300,
    opacity: 0.2,
    backgroundColor: Colors.accent.primary,
    zIndex: 100
  },
  accentArt2: {
    position: "absolute",
    height: 48,
    width: 4,
    right: 0,
    bottom: 240,
    opacity: 0.2,
    backgroundColor: Colors.accent.secondary,
    zIndex: 100
  },
})
