import { Border, Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type props = TouchableOpacityProps & {
  title: string;
  preIcon?: { familyIcon: any; name: string };
  postIcon?: { familyIcon: any; name: string };
  fontSize?: number
};

const ThemedButton = ({ onPress, title, preIcon, postIcon, style, disabled, fontSize, ...rest }: props) => {
  const renderIcon = (familyIcon: any, name: string) => {
    return React.createElement(familyIcon, {
      name: name,
      size: 16,
      color: Colors.background.primary,
    });
  };

  const preIconComponent = preIcon && renderIcon(preIcon.familyIcon, preIcon.name);
  const postIconComponent = postIcon && renderIcon(postIcon.familyIcon, postIcon.name);

  return (
    <TouchableOpacity
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }, style]}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      {preIconComponent}
      <Text style={[styles.buttonText, { fontSize: fontSize ?? Typography.size.md }]}>{title}</Text>
      {postIconComponent}
    </TouchableOpacity>
  );
};

export default ThemedButton;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.accent.primary,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: Border.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    fontFamily: Typography.family.tertiary.regular,
    color: Colors.background.primary,
  },
});
