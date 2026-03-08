import { Link } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useWorkoutStore } from "@/stores/workout-store";

export default function ModalScreen() {
  const { clearWorkout } = useWorkoutStore();
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This is a modal</ThemedText>

      <Link href="/" dismissTo style={styles.link} asChild>
        <TouchableOpacity onPress={() => clearWorkout()}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </TouchableOpacity>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
