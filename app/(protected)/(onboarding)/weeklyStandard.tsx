import OnboardingView from "@/components/onboarding/OnboardingView";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { WeeklyTargetDays } from "@/packages/shared/src";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const NUM_OF_DAYS: Record<WeeklyTargetDays, string> = {
  2: "Starting point.",
  3: "Building consistency.",
  4: "Standard.",
  5: "Balanced discipline.",
  6: "High commitment.",
  7: "Relentless.",
};

const weeklyStandard = () => {
  const router = useRouter();
  const { setWeeklyStandard, nextScreen } = useOnboardingStore();
  const [selected, setSelected] = useState<WeeklyTargetDays>(5);

  const handleConfirmStandard = () => {
    setWeeklyStandard(selected);
    nextScreen();
    router.replace("/(protected)/(onboarding)/avatar");
  };
  return (
    <OnboardingView>
      <ThemedView style={styles.container}>
        <View>
          <View
            style={{
              marginBottom: 24,
            }}
          >
            <ThemedText type="subtitle">SET YOUR{"\n"}WEEKLY STANDARD</ThemedText>
            <LinearGradient
              colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
              start={{ x: 1.0, y: 0.5 }}
              end={{ x: 0.0, y: 0.5 }}
              style={styles.titleUnderline}
            />
          </View>
          <View style={{ gap: 15 }}>
            <ThemedText style={{ color: Colors.gray, fontSize: 14 }}>
              How many days per week will you train?
            </ThemedText>
            <ThemedText style={{ color: Colors.text.secondary, fontSize: 12 }}>
              This becomes your accountability target
            </ThemedText>
          </View>
        </View>
        <View style={{ paddingTop: 50 }}>
          <View>
            <ThemedText style={styles.selectedDayText}>{selected}</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: Colors.gray, textAlign: "center" }}>
              DAYS / WEEK
            </ThemedText>
          </View>
          <View style={styles.numOfDaysContainer}>
            {Object.keys(NUM_OF_DAYS).map((day) => (
              <Pressable key={day} onPress={() => setSelected(Number(day) as WeeklyTargetDays)}>
                <ThemedView
                  style={[
                    styles.numOfDay,
                    {
                      backgroundColor:
                        Number(day) === selected
                          ? Colors.accent.primary
                          : Colors.background.secondary,
                      outlineColor:
                        Number(day) === selected ? Colors.accent.primary : Colors.inputBorder,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.numOfDayText,
                      {
                        color:
                          Number(day) === selected
                            ? Colors.background.primary
                            : Colors.text.secondary,
                      },
                    ]}
                  >
                    {day}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
          </View>
          <View>
            <ThemedText style={styles.numOfDayDescriptionText}>{NUM_OF_DAYS[selected]}</ThemedText>
          </View>
        </View>
        <View style={styles.footerContainer}>
          <ThemedButton
            title="CONFIRM STANDARD"
            fontSize={Typography.size.sm}
            onPress={handleConfirmStandard}
          />
        </View>
      </ThemedView>
    </OnboardingView>
  );
};

export default weeklyStandard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  titleUnderline: {
    height: 1.5,
    width: 50,
    marginTop: 10,
  },
  selectedDayText: {
    fontFamily: Typography.family.tertiary.regular,
    fontSize: 100,
    color: Colors.accent.primary,
    textAlign: "center",
  },
  numOfDaysContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginVertical: 48,
  },
  numOfDay: {
    width: 44,
    height: 56,
    paddingHorizontal: 12,
    paddingVertical: 11,
    justifyContent: "center",
    alignItems: "center",
    outlineWidth: 2,
    borderRadius: Border.radius.md,
  },
  numOfDayText: {
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
  numOfDayDescriptionText: {
    fontSize: 14,
    fontFamily: Typography.family.primary.medium,
    color: Colors.gray,
    textAlign: "center",
  },
  footerContainer: {
    justifyContent: "flex-end",
    flex: 1,
    paddingBottom: 20,
  },
});
