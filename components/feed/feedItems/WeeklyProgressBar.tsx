import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  weeklyProgress: number;
  weeklyTarget: number;
  isPractice: boolean;
};

const WeeklyProgressBar = ({ weeklyProgress, weeklyTarget, isPractice }: Props) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: weeklyTarget }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.notch,
            {
              backgroundColor:
                weeklyProgress >= index + 1
                  ? isPractice
                    ? Colors.accent.secondary
                    : Colors.accent.primary
                  : Colors.inputBorder,
            },
          ]}
        />
      ))}
    </View>
  );
};

export default WeeklyProgressBar;

const styles = StyleSheet.create({
  container: { height: 6, width: "100%", flexDirection: "row", gap: 5 },
  notch: {
    flex: 1,
    borderRadius: 9999,
  },
});
