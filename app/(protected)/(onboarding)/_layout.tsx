import ScreenTracker from "@/components/onboarding/SceeenTracker";
import { Colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const OnboardingLayout = () => {
  const { isAuthenticated, isHydrated } = useAuthStore();


  if (!isHydrated) {
    console.log("Checking if hydrated: ", isHydrated);
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/signin"} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary, }}>
      <ScreenTracker />
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
      </Stack>
    </SafeAreaView>
  );
};

export default OnboardingLayout;
