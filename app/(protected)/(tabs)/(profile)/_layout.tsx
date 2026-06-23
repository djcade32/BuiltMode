import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "profile",
};

const ProfileLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default ProfileLayout;
