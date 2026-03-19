import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Redirect, Stack } from "expo-router";
import "react-native-reanimated";

export default function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();
  const { user } = useUserStore();

  if (!isHydrated) {
    return null; // or a loading spinner
  }

  if (isAuthenticated) {
    if (!user) {
      return <Redirect href={"/(protected)/(onboarding)/welcome"} />;
    }
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot" />
    </Stack>
  );
}
