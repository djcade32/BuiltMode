import { Stack } from "expo-router";

const WorkoutLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="log" />
      <Stack.Screen name="buildWorkout" />
    </Stack>
  );
};

export default WorkoutLayout;
