import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleProp, StyleSheet, TextStyle, View } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  hours: number;
  minutes: number;
  seconds: number;
  style?: StyleProp<TextStyle>;
};

export const StopwatchDisplay = ({ hours, minutes, seconds, style }: Props) => {
  return (
    <View>
      <ThemedText style={[styles.timer, style]}>
        {`${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  timer: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 14,
    letterSpacing: -0.35,
    color: Colors.accent.primary,
  },
});
