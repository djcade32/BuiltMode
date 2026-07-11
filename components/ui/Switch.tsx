import { Border, Colors, Typography } from "@/constants/theme";
import React, { useState } from "react";
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";

type props = {
  options: string[];
  onChange: (value: string) => void;
  defaultIndex?: number;
  optionContainerStyle?: StyleProp<ViewStyle>;
};

const Switch = ({ options, onChange, defaultIndex = 0, optionContainerStyle }: props) => {
  const [selected, setSelected] = useState(options[defaultIndex] ?? options[0]);

  const handleOnPress = (option: string) => {
    onChange(option);
    setSelected(option);
  };
  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <Pressable
          onPress={() => handleOnPress(option)}
          key={index}
          style={[
            styles.optionContainer,
            {
              backgroundColor: selected === option ? Colors.accent.primary : "transparent",
            },
            optionContainerStyle,
          ]}
        >
          <ThemedText
            style={[
              styles.optionText,
              {
                color: selected === option ? Colors.background.primary : Colors.icon,
              },
            ]}
          >
            {option}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
};

export default Switch;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    flexDirection: "row",
    gap: 5,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    padding: 6,
    justifyContent: "space-between",
  },
  optionContainer: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 0.6,
  },
});
