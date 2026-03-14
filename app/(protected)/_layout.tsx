import { useAuthStore } from "@/stores/useAuthStore";
import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, Stack } from "expo-router";
import React from "react";

const ProtectedLayout = () => {
  const { isAuthenticated } = useAuthStore();
  const { activeWorkoutDraft } = useWorkoutStore();

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/signin"} />;
  }

  if (activeWorkoutDraft) {
    return <Redirect href="/modal" />;
  }

  return (
    <Stack>
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
