import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Workout } from "@/functions/src/types/workout";
import { formatFirestoreTime, formatFirestoreTimestamp } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { durationTimeString } from "@/lib/utils/time";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  workout: Workout;
  onPress?: (workout: Workout) => void;
};

const WorkoutHistoryCard = ({ workout, onPress }: Props) => {
  const workoutTitle =
    workout.name || `${firstLetterToUpperCase(workout.workoutType ?? "")} Workout`;
  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress?.(workout)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <ThemedText style={styles.workoutName} ellipsizeMode="tail" numberOfLines={1}>
          {workoutTitle}
        </ThemedText>
        <View>
          <ThemedText style={styles.workoutTime}>
            {formatFirestoreTimestamp(workout.completedAt)}
          </ThemedText>
          <ThemedText style={[styles.workoutTime, { textAlign: "right" }]}>
            {formatFirestoreTime(workout.completedAt)}
          </ThemedText>
        </View>
      </View>
      <ThemedText
        style={{
          fontFamily: Typography.family.secondary.regular,
          fontSize: 12,
          color: Colors.gray,
          paddingTop: 4,
        }}
      >
        {firstLetterToUpperCase(workout.workoutType ?? "other")}
      </ThemedText>

      <View style={styles.workoutFooterContainer}>
        <ThemedText style={styles.workoutFooterText}>
          <MaterialCommunityIcons name="clock" size={12} /> {durationTimeString(workout.duration)} •{" "}
          {workout.exercises.length} exercises
        </ThemedText>
        <ThemedText style={styles.workoutFooterText}></ThemedText>
      </View>
    </TouchableOpacity>
  );
};

export default WorkoutHistoryCard;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  workoutName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
    letterSpacing: 0.45,
  },
  workoutFooterContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
    paddingTop: 12,
    flexDirection: "row",
    gap: 20,
  },
  workoutFooterText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },
  workoutTime: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    color: Colors.icon,
  },
});
