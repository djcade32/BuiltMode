import OnboardingView from "@/components/onboarding/OnboardingView";
import TimezonePickerSheet from "@/components/onboarding/TimezonePickerSheet";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { TIMEZONE_OPTIONS, TimezoneOption } from "@/constants/timezones";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getCalendars } from "expo-localization";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const HomeTimezone = () => {
  const router = useRouter();
  const { setHomeTimezone } = useOnboardingStore();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

  useEffect(() => {
    const detectedTimezone = getCalendars()[0]?.timeZone ?? "America/New_York";
    setSelectedTimezone(detectedTimezone);
  }, []);

  const selectedTimezoneOption = useMemo<TimezoneOption | undefined>(() => {
    return TIMEZONE_OPTIONS.find((tz) => tz.id === selectedTimezone);
  }, [selectedTimezone]);

  const timezoneLabel = selectedTimezoneOption?.label ?? selectedTimezone.replaceAll("_", " ");

  const timezoneSubtitle = selectedTimezoneOption?.subtitle ?? selectedTimezone;

  const handleConfirm = () => {
    setHomeTimezone(selectedTimezone);
    router.push("/(protected)/(onboarding)/modeScore");
  };

  return (
    <OnboardingView>
      <ThemedView style={styles.container}>
        <View>
          <View style={styles.titleContainer}>
            <ThemedText type="subtitle">CONFIRM YOUR{"\n"}TIMEZONE</ThemedText>
            <LinearGradient
              colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
          </View>

          <ThemedText style={styles.subText}>
            Your timezone determines when your training day and week reset.
          </ThemedText>
        </View>

        <View style={styles.mainContentContainer}>
          <View style={styles.timezoneCardContainer}>
            <View style={{ gap: 8 }}>
              <View style={styles.timezoneHeaderRow}>
                <ThemedText style={styles.timezoneSecondaryText}>AUTO-DETECTED</ThemedText>
                <TouchableOpacity onPress={() => setIsSheetOpen(true)}>
                  <ThemedText style={styles.changeText}>CHANGE</ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText type="defaultSemiBold">{timezoneLabel}</ThemedText>
              <ThemedText style={styles.timezoneSecondaryText}>{timezoneSubtitle}</ThemedText>
            </View>

            <View style={styles.timezoneCardFooterContainer}>
              <MaterialCommunityIcons name="clock" size={14} color={Colors.accent.primary} />
              <ThemedText style={styles.timezoneSecondaryText}>
                Daily reset:{" "}
                <ThemedText type="defaultSemiBold" style={{ fontSize: 12 }}>
                  4:00 AM
                </ThemedText>{" "}
                local time
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.footerContainer}>
          <ThemedText style={styles.infoText}>
            This setting affects streaks, weekly targets, and Mode Score.
          </ThemedText>

          <ThemedButton
            title="CONFIRM TIMEZONE"
            fontSize={Typography.size.sm}
            disabled={!selectedTimezone}
            onPress={handleConfirm}
          />
        </View>
      </ThemedView>

      <TimezonePickerSheet
        visible={isSheetOpen}
        selectedTimezone={selectedTimezone}
        onClose={() => setIsSheetOpen(false)}
        onSelect={(timezone) => setSelectedTimezone(timezone.id)}
      />
    </OnboardingView>
  );
};

export default HomeTimezone;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleUnderline: {
    height: 1.5,
    width: 50,
    marginTop: 10,
  },
  subText: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 22,
  },
  mainContentContainer: {
    flex: 1,
    paddingTop: 32,
  },
  timezoneCardContainer: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    borderColor: Colors.inputBorder,
    padding: 20,
  },
  timezoneHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timezoneSecondaryText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.secondary.regular,
  },
  changeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.secondary.regular,
  },
  timezoneCardFooterContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.inputBorder,
    marginTop: 16,
  },
  footerContainer: {
    gap: 32,
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  infoText: {
    color: Colors.icon,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 22,
  },
});
