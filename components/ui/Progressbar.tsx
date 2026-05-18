import { Colors } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  percentage: number;
};

const Progressbar = ({ percentage = 0 }: Props) => {
  return (
    <View style={styles.progressbarOuter}>
      <View
        style={[
          styles.progressbarInner,
          {
            width: `${percentage}%`,
          },
        ]}
      />
    </View>
  );
};

export default Progressbar;

const styles = StyleSheet.create({
  progressbarOuter: {
    width: "100%",
    borderRadius: 9999,
    backgroundColor: Colors.cardBorder,
    height: 8,
  },
  progressbarInner: {
    backgroundColor: Colors.accent.primary,
    flex: 1,
    borderRadius: 9999,
  },
});
