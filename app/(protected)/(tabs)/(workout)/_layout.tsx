import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export const unstable_settings = {
  initialRouteName: "log",
};

const WorkoutLayout = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
        <Stack.Screen name="log" />
        <Stack.Screen name="buildWorkout" />
        <Stack.Screen name="confirmWorkout" />
        <Stack.Screen name="(workoutHistoryDetails)/[sessionId]" />
        <Stack.Screen name="(viewHistory)/[id]" />
        <Stack.Screen name="viewTemplates" />
      </Stack>
    </GestureHandlerRootView>
  );
};

export default WorkoutLayout;
