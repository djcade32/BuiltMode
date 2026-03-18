import { useAuthStore } from "@/stores/auth-store";
import { Redirect, Stack } from "expo-router";
import "react-native-reanimated";

export default function AuthLayout() {
  const { isAuthenticated, isHydrated } = useAuthStore();

  if (!isHydrated) {
    console.log("Checking if hydrated: ", isHydrated);
    return null; // or a loading spinner
  }

  if (isAuthenticated) {
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
