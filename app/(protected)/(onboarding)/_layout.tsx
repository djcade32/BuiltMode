import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Stack } from "expo-router";
import React from "react";

const OnboardingLayout = () => {
  // useOnboardingStore.persist.clearStorage();
  // useAuthStore.persist.clearStorage();
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/signin"} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "none" }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="username" />
      <Stack.Screen name="goal" />
      <Stack.Screen name="metrics" />
      <Stack.Screen name="weeklyStandard" />
      <Stack.Screen name="avatar" />
      <Stack.Screen name="homeTimezone" />
      <Stack.Screen name="modeScore" />
    </Stack>
  );
};

export default OnboardingLayout;
