import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Stack } from "expo-router";
import React from "react";

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
    <Stack>
      <Stack.Screen
        name="welcome"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default OnboardingLayout;
