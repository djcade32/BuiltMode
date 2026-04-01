import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const WorkoutLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="log" />
        <Stack.Screen name="buildWorkout" />
        <Stack.Screen name="ready" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default WorkoutLayout;
