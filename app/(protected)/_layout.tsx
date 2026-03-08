import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, Stack } from "expo-router";
import React from "react";

const ProtectedLayout = () => {
  const { activeWorkoutDraft } = useWorkoutStore();

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
    </Stack>
  );
};

export default ProtectedLayout;
