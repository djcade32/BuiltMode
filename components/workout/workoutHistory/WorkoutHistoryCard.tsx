import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { Workout } from "@/functions/src/types/workout";
import { formatWorkoutLocalDate } from "@/lib/utils/date";
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
      <View
        style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <ThemedText style={styles.workoutName} ellipsizeMode="tail" numberOfLines={1}>
          {workoutTitle}
        </ThemedText>
        <View>
          <ThemedText style={[styles.workoutTime,{ textAlign: "right" }]}>
            {formatWorkoutLocalDate(workout.workoutLocalDate)}
          </ThemedText>
          <ThemedText style={[styles.workoutTime, { textAlign: "right" }]}>
            {workout.workoutLocalDisplayTime}
          </ThemedText>
          <ThemedText style={[styles.workoutTime, { textAlign: "right" }]}>
            ({workout.workoutTimezone})
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
    flexShrink: 1,
    paddingRight: 8,
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
