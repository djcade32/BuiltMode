import { Colors } from "@/constants/theme";
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  variation?: "primary" | "secondary";
};

export function ThemedView({ style, variation = "primary", ...otherProps }: ThemedViewProps) {
  const backgroundColor = Colors.background[variation];

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
