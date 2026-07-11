import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "feed",
};

const FeedLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="feed" />
        <Stack.Screen name="friendsList" />
        <Stack.Screen name="findFriends" />
        <Stack.Screen name="(friendProfile)/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default FeedLayout;
