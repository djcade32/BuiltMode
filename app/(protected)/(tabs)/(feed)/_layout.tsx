import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const FeedLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="feed" />
        <Stack.Screen name="findFriends" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default FeedLayout;
