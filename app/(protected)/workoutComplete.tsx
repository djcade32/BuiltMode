import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { breakdownSeconds } from "@/lib/utils/conversions";
import { ExerciseMetricType } from "@/packages/shared/src";
import { useWorkoutStore } from "@/stores/workout-store";
import { Redirect, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const workoutComplete = () => {
  const router = useRouter();
  const { duration, completeWorkoutResponse, clearWorkout, activeWorkoutDraft } = useWorkoutStore();

  const durationStr = useMemo(() => {
    if (!duration) return "00:00:00";
    const breakdown = breakdownSeconds(duration);
    const { minutes, hours, seconds } = breakdown;
    return `${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  }, [duration]);

  const getExerciseMetricText = (type: ExerciseMetricType) => {
    switch (type) {
      case "weight_reps":
        return "set";
      case "reps_only":
      case "duration":
        return "round";
      case "distance":
        return "attempt";

      default:
        return "set";
    }
  };

  const handleDone = () => {
    clearWorkout();
    router.replace("/(protected)/(tabs)/(workout)/log");
  };

  const isTrainingTargetMet =
    completeWorkoutResponse?.activeDaysThisWeek === completeWorkoutResponse?.weeklyTargetDays;

  if (!completeWorkoutResponse) return <Redirect href={"/(protected)/(tabs)/(workout)/log"} />;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: Colors.background.primary }}
    >
      <ThemedView style={styles.container}>
        <View style={{ gap: 8, paddingBottom: 32 }}>
          <ThemedText type="title" style={{ textAlign: "center" }}>
            Workout Complete
          </ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: "center" }]}>
            SESSION LOGGED.
          </ThemedText>
        </View>

        <View>
          <View style={styles.timeInfoContainer}>
            <ThemedText style={styles.duration}>{durationStr}</ThemedText>
            <ThemedText style={[styles.subtitle, { textAlign: "center" }]}>DURATION</ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>MODE SCORE</ThemedText>
          <View style={styles.modeScoreContainer}>
            <View
              style={{
                justifyContent: "space-between",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <ThemedText style={styles.modeScoreText}>
                {completeWorkoutResponse.modeScore ?? 0}
              </ThemedText>
              {completeWorkoutResponse.modeScoreDifference ? (
                <ThemedText
                  style={{
                    fontFamily: Typography.family.secondary.semibold,
                    fontSize: 14,
                    color: Colors.accent.primary,
                  }}
                >
                  {completeWorkoutResponse.modeScoreDifference >= 1 ? "+" : "-"}
                  {Math.abs(completeWorkoutResponse.modeScoreDifference)} today
                </ThemedText>
              ) : (
                <></>
              )}
            </View>

            <ThemedText style={styles.modeScoreInfoText}>
              Based on recent activity and adherence.
            </ThemedText>
          </View>
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>WEEK PROGRESS</ThemedText>
          <View style={[styles.modeScoreContainer, isTrainingTargetMet ? styles.targetMet : null]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <ThemedText style={styles.progressText}>
                <ThemedText
                  style={[
                    styles.progressText,
                    isTrainingTargetMet ? { color: Colors.accent.primary } : null,
                  ]}
                >
                  {completeWorkoutResponse?.activeDaysThisWeek}
                </ThemedText>
                /{completeWorkoutResponse?.weeklyTargetDays}
              </ThemedText>
              <ThemedText style={styles.daysCompletedText}>DAYS COMPLETED</ThemedText>
            </View>

            {isTrainingTargetMet && (
              <ThemedText style={{ fontSize: 12, color: Colors.gray }}>
                You met your standard for the week.
              </ThemedText>
            )}
            <View
              style={{ backgroundColor: Colors.background.primary, height: 6, borderRadius: 3 }}
            >
              <View
                style={{
                  backgroundColor: Colors.accent.primary,
                  height: 6,
                  width: `${
                    completeWorkoutResponse.weeklyTargetDays > 0
                      ? (completeWorkoutResponse.activeDaysThisWeek /
                          completeWorkoutResponse.weeklyTargetDays) *
                        100
                      : 0
                  }%`,
                  borderRadius: 3,
                }}
              />
            </View>
            {isTrainingTargetMet && (
              <ThemedText style={{ fontSize: 12, color: Colors.icon }}>
                Additional workouts still count toward your history.
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.section}>
          <ThemedText style={styles.subtitle}>SESSION BREAKDOWN</ThemedText>
          <View style={{ gap: 12 }}>
            {activeWorkoutDraft?.exercises.map((exercise, index) => (
              <View key={exercise.id} style={styles.exerciseContainer}>
                <View style={styles.listNumContainer}>
                  <ThemedText style={styles.listNumText}>{index + 1}</ThemedText>
                </View>
                <View>
                  <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                  <ThemedText
                    style={styles.exerciseSet}
                  >{`${exercise.sets.length} ${getExerciseMetricText(exercise.metricType)}${exercise.sets.length > 1 ? "s" : ""}`}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>

        <ThemedText
          style={{
            color: Colors.icon,
            fontSize: 12,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          {isTrainingTargetMet
            ? "Great Work!"
            : completeWorkoutResponse.modeScoreDifference > -1
              ? "Keep showing up."
              : "Stay consistent."}
        </ThemedText>

        <View style={styles.footContainer}>
          <ThemedButton title="DONE" onPress={handleDone} />
        </View>
      </ThemedView>
    </ScrollView>
  );
};

export default workoutComplete;

const styles = StyleSheet.create({
  container: {
    paddingTop: 74,
    flex: 1,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
    color: Colors.icon,
  },
  section: {
    flex: 1,
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 16,
  },
  timeInfoContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
    paddingBottom: 32,
  },
  duration: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 60,
    textAlign: "center",
  },
  modeScoreContainer: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  modeScoreText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 48,
  },
  modeScoreInfoText: {
    fontSize: 12,
    color: Colors.icon,
  },
  progressText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 24,
  },
  daysCompletedText: {
    fontSize: 12,
    color: Colors.icon,
    letterSpacing: 0.6,
    fontFamily: Typography.family.primary.semibold,
  },
  exerciseContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  listNumContainer: {
    backgroundColor: "#c6a34a38",
    justifyContent: "center",
    alignItems: "center",
    height: 32,
    width: 32,
    borderRadius: 8,
  },
  listNumText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.accent.primary,
  },
  exerciseName: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
  },
  exerciseSet: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
    marginTop: 3,
  },
  footContainer: {
    // paddingHorizontal: 24,
    // paddingTop: 24,
    padding: 24,
    borderTopColor: Colors.background.secondary,
    borderTopWidth: 1,
  },

  targetMet: {
    borderTopColor: Colors.accent.primary,
    borderTopWidth: 3,
  },
});
