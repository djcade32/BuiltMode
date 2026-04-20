import { ThemedText } from "@/components/themed-text";
import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

type WorkoutHistorySectionHeaderProps = {
  title: string;
};

const WorkoutHistorySectionHeader = ({ title }: WorkoutHistorySectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.accentBar} />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
};

export default WorkoutHistorySectionHeader;

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    flexDirection: "row",
    gap: 8,
  },
  title: {
    color: Colors.gray,
    letterSpacing: 1.8,
    fontFamily: Typography.family.primary.semibold,
  },
  accentBar: {
    height: 20,
    width: 4,
    borderRadius: 9999,
    backgroundColor: Colors.accent.primary,
  },
});
