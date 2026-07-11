import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { Image, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  avatarUrl: string | null;
  displayName: string;
  onPress?: () => void;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

const Avatar = ({ avatarUrl, displayName, onPress, size = 46, containerStyle }: Props) => {
  return (
    <TouchableOpacity
      disabled={!onPress}
      style={[styles.avatarContainer, containerStyle, { height: size, width: size }]}
      onPress={onPress}
    >
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} height={size} width={size} />
      ) : (
        <ThemedText style={styles.avatarText}>{displayName?.[0]?.toUpperCase() ?? "?"}</ThemedText>
      )}
    </TouchableOpacity>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatarContainer: {
    borderRadius: 12,
    backgroundColor: "rgba(211, 174, 75, 0.14)",

    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },
  avatarText: {
    color: Colors.accent.primary,
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
});
