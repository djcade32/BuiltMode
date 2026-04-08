import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { MenuProvider } from "react-native-popup-menu";

const ProtectedLayout = () => {
  // useWorkoutStore.persist.clearStorage();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { activeWorkoutDraft } = useWorkoutStore();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !activeWorkoutDraft) return;

    const isOnActiveWorkout = pathname === "/activeWorkout";
    const isOnWorkoutComplete = pathname === "/workoutComplete";

    if (!isOnActiveWorkout && !isOnWorkoutComplete) {
      if (activeWorkoutDraft.status === "finishing") {
        router.replace("/(protected)/workoutComplete");
      } else {
        router.replace("/(protected)/activeWorkout");
      }
    }
  }, [isHydrated, isAuthenticated, activeWorkoutDraft, pathname, router]);

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <MenuProvider>
      <Stack>
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="activeWorkout"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
        <Stack.Screen
          name="workoutComplete"
          options={{
            headerShown: false,
            presentation: "fullScreenModal",
            animation: "fade",
          }}
        />
      </Stack>
    </MenuProvider>
  );
};

export default ProtectedLayout;
