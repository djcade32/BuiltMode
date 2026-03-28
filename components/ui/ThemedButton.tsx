import { Border, Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, TouchableOpacityProps } from "react-native";

type props = TouchableOpacityProps & {
  title: string;
  preIcon?: { familyIcon: any; name: string; size?: number };
  postIcon?: { familyIcon: any; name: string; size?: number };
  fontSize?: number;
};

const ThemedButton = ({
  onPress,
  title,
  preIcon,
  postIcon,
  style,
  disabled,
  fontSize,
  ...rest
}: props) => {
  const renderIcon = (familyIcon: any, name: string, size: number = 16) => {
    return React.createElement(familyIcon, {
      name: name,
      size: size,
      color: Colors.background.primary,
    });
  };

  const preIconComponent = preIcon && renderIcon(preIcon.familyIcon, preIcon.name, preIcon.size);
  const postIconComponent =
    postIcon && renderIcon(postIcon.familyIcon, postIcon.name, postIcon.size);

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

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonText: {
    fontFamily: Typography.family.tertiary.regular,
    color: Colors.background.primary,
  },
});
