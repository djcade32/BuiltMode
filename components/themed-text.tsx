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
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.primary.regular,
  },
  defaultSemiBold: {
    fontSize: Typography.size.sm,
    fontWeight: "600",
    fontFamily: Typography.family.primary.semibold,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: "bold",
    letterSpacing: -1,
    fontFamily: Typography.family.primary.bold,
  },
  subtitle: {
    fontSize: Typography.size.md,
    fontWeight: "bold",
    fontFamily: Typography.family.primary.bold,
  },
  link: {
    fontSize: Typography.size.sm,
    color: Colors.accent.secondary,
    fontFamily: Typography.family.primary.regular,
  },
});
