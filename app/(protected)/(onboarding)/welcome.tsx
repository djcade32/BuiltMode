import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const Welcome = () => {
  const router = useRouter()
  const { nextScreen } = useOnboardingStore()
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

  const handleEnterModePressed = () => {
    nextScreen()
    router.replace("/(protected)/(onboarding)/username")
  }
  return (
    <View style={styles.container}>


      <View style={{ height: "70%", justifyContent: "space-between" }}>
        <ThemedView>
          <Image source={require("@/assets/images/full_logo.png")} style={styles.logo} />
          <View style={styles.logoUnderlineContainer}>
            <View style={{ height: 2, backgroundColor: Colors.accent.primary, width: 35 }} />
            <View
              style={{
                height: 2,
                backgroundColor: Colors.accent.primary,
                width: 10,
                opacity: 0.25,
              }}
            />
          </View>
        </ThemedView>

        <View style={{ gap: 40 }}>
          <ThemedView>
            <ThemedText type="subtitle" style={{ textAlign: "center" }}>
              WELCOME TO {"\n"} BUILTMODE
            </ThemedText>
            <LinearGradient
              colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR, SECONDARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
          </ThemedView>

          <ThemedView style={styles.subtitle}>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: Colors.text.secondary, textAlign: "center" }}
            >
              Build Daily.
            </ThemedText>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: Colors.text.primary, textAlign: "center" }}
            >
              Become Relentless.
            </ThemedText>
          </ThemedView>
        </View>

        <ThemedView>
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
            <ThemedText style={styles.systemBadgeText}>SYSTEM READY</ThemedText>
          </ThemedView>
          <ThemedButton
            style={{ width: "80%", alignSelf: "center" }}
            title="ENTER MODE"
            postIcon={{
              familyIcon: FontAwesome6,
              name: "arrow-right",
            }}
            onPress={handleEnterModePressed}
          />
        </ThemedView>
      </View>

      <ThemedView style={styles.footerContainer}>
        <View
          style={{
            borderTopColor: Colors.inputBorder,
            borderTopWidth: 1,
            padding: 16,
          }}
        >
          <ThemedText style={styles.footerText}>DISCIPLINE COMPOUNDS</ThemedText>
        </View>
      </ThemedView>

    </View>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingTop: 100
  },
  headerContainer: {
    width: "85%",
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  logo: {
    height: 55,
    width: "100%",
    objectFit: "contain",
  },
  logoUnderlineContainer: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    columnGap: 5,
  },
  titleUnderline: {
    height: 1.5,
    width: 60,
    alignSelf: "center",
    marginTop: 15,
  },
  subtitle: {
    justifyContent: "center",
    gap: 5,
  },
  systemBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    marginBottom: 15,
  },
  systemBadgeText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.text.secondary,
  },
  footerContainer: {
    paddingHorizontal: 20,
    bottom: 0,
    width: "100%",
    position: "absolute",
  },
  footerText: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    color: Colors.inputBorder,
    letterSpacing: 2,
    textAlign: "center",
  },
});
