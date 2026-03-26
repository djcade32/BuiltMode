import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, Stack } from "expo-router";
import React from "react";

const ProtectedLayout = () => {
  const { isAuthenticated, isHydrated } = useAuthStore();

  const { activeWorkoutDraft } = useWorkoutStore();

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/signin"} />;
  }

  if (activeWorkoutDraft) {
    return <Redirect href={"/(protected)/modal"} />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="(onboarding)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
    </Stack>
  );
};

export default ProtectedLayout;
