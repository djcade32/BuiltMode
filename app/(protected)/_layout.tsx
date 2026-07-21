import PendingWorkoutPublisher from "@/components/system/PendingWorkoutPublisher";
import {
  handleInitialNotification,
  registerPushToken,
  subscribeToForegroundNotifications,
  subscribeToNotificationOpens,
  subscribeToPushTokenRefresh,
} from "@/services/notification-service";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { MenuProvider } from "react-native-popup-menu";

const ProtectedLayout = () => {
  // useUserStore.persist.clearStorage();
  // useAuthStore.persist.clearStorage();
  // useWorkoutStore.persist.clearStorage();
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const { activeWorkoutDraft } = useWorkoutStore();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribeForeground = subscribeToForegroundNotifications();
    const unsubscribeNotificationOpen = subscribeToNotificationOpens();

    handleInitialNotification();

    return () => {
      unsubscribeForeground();
      unsubscribeNotificationOpen();
    };
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated || !activeWorkoutDraft) return;

    const targetPath =
      activeWorkoutDraft.status === "finishing" ? "/(protected)/workoutComplete" : "/(protected)/activeWorkout";

    const currentPath =
      pathname === "/workoutComplete"
        ? "/(protected)/workoutComplete"
        : pathname === "/activeWorkout"
          ? "/(protected)/activeWorkout"
          : pathname;

    if (currentPath !== targetPath) {
      router.replace(targetPath);
    }
  }, [isHydrated, isAuthenticated, activeWorkoutDraft, pathname, router]);

  useEffect(() => {
    if (!user?.uid) return;
    registerPushToken();

    const unsubscribe = subscribeToPushTokenRefresh();

    return unsubscribe;
  }, [user?.uid]);

  if (!isHydrated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/signin" />;
  }

  return (
    <MenuProvider>
      {pathname !== "/workoutComplete" ? <PendingWorkoutPublisher /> : null}
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
        <Stack.Screen name="(workoutHistoryDetails)/[sessionId]" options={{ headerShown: false }} />
      </Stack>
    </MenuProvider>
  );
};

export default ProtectedLayout;
