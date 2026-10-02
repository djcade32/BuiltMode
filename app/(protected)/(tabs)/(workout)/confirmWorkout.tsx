import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType } from "@/packages/shared/src";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { Entypo, FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";

const ExerciseListRow = ({ exercise, index }: { exercise: Exercise; index: number }) => {
  const setText = (metricType: ExerciseMetricType) => {
    switch (metricType) {
      case "weight_reps":
        return "set";

      case "duration":
      case "time":
      case "reps_only":
        return "round";

      case "distance":
        return "attempt";

      case "calories":
        return "cal";
      case "other":

      default:
        return "set";
    }
  };

  const setValue = exercise.sets.length;
  return (
    <View key={exercise.id} style={styles.exerciseListRowContainer}>
      <View style={styles.listNumberContainer}>
        <ThemedText style={styles.listNumberText}>{index}</ThemedText>
      </View>
      <ThemedText style={styles.listExerciseName}>{exercise.name}</ThemedText>
      <ThemedText
        style={styles.listSetText}
      >{`${setValue} ${setText(exercise.metricType)}${setValue > 1 ? "s" : ""}`}</ThemedText>
    </View>
  );
};

const Ready = () => {
  const router = useRouter();

  const { initialWorkout, startWorkout } = useWorkoutStore();
  const { user } = useUserStore();

  if (!initialWorkout) {
    return <Redirect href={"/(protected)/(tabs)/(workout)/buildWorkout"} />;
  }

  const handleStartWorkout = () => {
    if (!user) return;
    const id = `${uuidv4()}-workout`;
    startWorkout({
      name: initialWorkout.name,
      sessionId: id,
      uid: user?.uid,
      exercises: initialWorkout.exercises,
      workoutType: initialWorkout.workoutType,
      notes: initialWorkout.notes,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingTop: 64 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <View style={styles.boltIconCircle}>
            <FontAwesome6 name="bolt" size={30} color={Colors.accent.primary} />
          </View>
          <ThemedText type="title" style={styles.headerTitle}>
            READY TO{"\n"}BEGIN?
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>Once you start, stay locked in.</ThemedText>
        </View>

        <View style={styles.sessionCardContainer}>
          <View style={{ gap: 8, paddingBottom: 16 }}>
            <ThemedText style={styles.sessionCardTitle}>TODAY'S SESSION</ThemedText>
            <ThemedText style={styles.sessionWorkoutName}>{initialWorkout.name}</ThemedText>
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: Colors.cardBorder }}>
            <View style={styles.exercisesContainer}>
              <ThemedText style={styles.exerciseListTitle}>EXERCISE LIST</ThemedText>
              <View style={{ gap: 12, paddingTop: 15 }}>
                {initialWorkout.exercises.map((exercise, index) => (
                  <ExerciseListRow key={exercise.id} exercise={exercise} index={index + 1} />
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <FontAwesome5 name="info-circle" size={14} color={Colors.accent.primary} />
          <ThemedText style={styles.infoText}>
            Active Mode locks your screen. Focus only on your workout. Timer starts now.
          </ThemedText>
        </View>
        <View style={{ gap: 12, paddingBottom: 32 }}>
          <ThemedButton
            preIcon={{
              familyIcon: Entypo,
              name: "controller-play",
            }}
            title="START WORKOUT"
            fontSize={Typography.size.sm}
            onPress={handleStartWorkout}
            style={{ marginTop: 32 }}
          />
          <ThemedButton
            title="GO BACK"
            fontSize={Typography.size.sm}
            onPress={() => router.back()}
            textStyle={styles.goBackButtonText}
            style={styles.goBackButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Ready;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  boltIconCircle: {
    backgroundColor: Colors.background.secondary,
    width: 80,
    height: 80,
    borderRadius: 80 / 2,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    textAlign: "center",
    lineHeight: 45,
    marginTop: 24,
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    letterSpacing: 0.35,
    color: Colors.icon,
  },
  sessionCardContainer: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  sessionCardTitle: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
  },
  sessionWorkoutName: {
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
  exercisesContainer: {
    paddingTop: 20,
  },
  exerciseListTitle: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
  },
  exerciseListRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  listNumberContainer: {
    backgroundColor: Colors.input,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  listNumberText: {
    color: Colors.accent.primary,
    fontSize: 12,
    fontFamily: Typography.family.secondary.semibold,
  },
  listExerciseName: {
    flex: 1,
    marginLeft: 10,
    marginRight: 5,
    fontSize: 14,
    fontFamily: Typography.family.primary.medium,
  },
  listSetText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  infoContainer: {
    backgroundColor: "#15181c8e",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#c6a34a38",
    padding: 16,
    gap: 10,
    marginTop: 24,
  },
  infoText: {
    fontSize: 12,
    color: Colors.gray,
    flexShrink: 1,
    lineHeight: 19,
  },
  goBackButton: {
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    // Remove shadow
    shadowColor: "none",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  goBackButtonText: {
    color: Colors.gray,
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
  },
});
