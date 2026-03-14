import { Colors, Typography } from "@/constants/theme";
import { StyleSheet, Text, type TextProps } from "react-native";

export type ThemedTextProps = TextProps & {
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
  variation?: "primary" | "secondary";
};

export function ThemedText({
  style,
  variation = "primary",
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = Colors.text[variation];
  return (
    <Text
      style={[
        { color },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "link" ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    fontFamily: Typography.primary.regular,
  },
  defaultSemiBold: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: Typography.primary.semibold,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: -1,
    fontFamily: Typography.primary.bold,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: Typography.primary.bold,
  },
  link: {
    fontSize: 16,
    color: Colors.accent.secondary,
    fontFamily: Typography.primary.regular,
  },
});
