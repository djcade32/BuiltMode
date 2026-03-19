import { Border, Colors, Typography } from "@/constants/theme";
import Constants from "expo-constants";
import { usePathname } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { ThemedText } from "../themed-text";
import { ThemedView } from "../themed-view";

const AuthHeader = () => {
  const pathname = usePathname();
  const isForgotScreen = pathname === "/forgot";
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      true,
    );

    scale.value = withRepeat(
      withSequence(withTiming(1.4, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1,
      true,
    );
  }, []);
  return (
    <ThemedView>
      <ThemedView>
        <ThemedText style={styles.version}>v{Constants.expoConfig?.version}</ThemedText>
        <Image source={require("@/assets/images/full_logo.png")} style={styles.logo} />
      </ThemedView>
      {!isForgotScreen && (
        <ThemedView style={styles.subtitle}>
          <ThemedText type="defaultSemiBold" style={{ color: Colors.text.secondary }}>
            Build Daily.
          </ThemedText>
          <ThemedText type="defaultSemiBold" style={{ color: Colors.text.primary }}>
            {" "}
            Become Relentless
          </ThemedText>
        </ThemedView>
      )}

      <View style={[{ alignItems: "center" }, isForgotScreen && { marginTop: 20 }]}>
        <ThemedView style={styles.systemBadgeContainer}>
          <Animated.View
            style={[
              {
                backgroundColor: "green",
                height: 7,
                aspectRatio: 1,
                borderRadius: 3.5,
              },
              animatedStyle,
            ]}
          />
          <ThemedText style={styles.systemBadgeText}>SYSTEM OPERATIONAL</ThemedText>
        </ThemedView>
      </View>
    </ThemedView>
  );
};

export default AuthHeader;

const styles = StyleSheet.create({
  version: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.accent.secondary,
    position: "absolute",
    top: -15,
    right: 70,
  },
  logo: {
    height: 40,
    width: "100%",
    objectFit: "contain",
  },
  subtitle: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  systemBadgeContainer: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.lg,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  systemBadgeText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
