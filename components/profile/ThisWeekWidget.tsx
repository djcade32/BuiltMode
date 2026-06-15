import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import WeeklyProgressBar from "../feed/feedItems/WeeklyProgressBar";
import { ThemedText } from "../themed-text";

type Props = {
  data: {
    activeDays: number;
    targetDays: number;
    currentStreakWeek: number;
    isPracticeWeek: boolean;
  };
};

const ThisWeekWidget = ({ data }: Props) => {
  const isPractice = data.isPracticeWeek;
  return (
    <View style={styles.container}>
      <View>
        <ThemedText style={styles.title}>THIS WEEK</ThemedText>
      </View>
      <View style={{ gap: 5 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <ThemedText style={styles.subtitle}>
            {isPractice ? "RHYTHM BUILDING" : "WEEKLY PROGRESS"}
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              { color: isPractice ? Colors.accent.secondary : Colors.accent.primary },
            ]}
          >
            {data.activeDays} of {data.targetDays} days
          </ThemedText>
        </View>
        <WeeklyProgressBar
          weeklyProgress={data.activeDays}
          weeklyTarget={data.targetDays}
          isPractice={isPractice}
        />
        <View style={{ marginTop: 10 }}>
          <ThemedText style={[styles.subtitle, { fontSize: 12, marginBottom: 5 }]}>
            CURRENT STREAK
          </ThemedText>
          <ThemedText
            style={[
              styles.subtitle,
              {
                fontSize: 14,
                color: Colors.text.primary,
                fontFamily: Typography.family.secondary.bold,
              },
            ]}
          >
            {data.currentStreakWeek}
            <ThemedText style={[styles.subtitle, { fontSize: 12 }]}>weeks</ThemedText>
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

export default ThisWeekWidget;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  title: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 9,
    letterSpacing: 1.98,
    color: Colors.icon,
  },
  subtitle: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 8,
    color: Colors.icon,
  },
});
