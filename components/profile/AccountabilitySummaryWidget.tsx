import { Colors, Typography } from "@/constants/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import Progressbar from "../ui/Progressbar";

type Props = {
  data: {
    modeScore: number;
    consistency: number;
    adherence: number;
    bestStreak: number;
    targetsMet: number;
    totalWorkouts: number;
  } | null;
};

const AccountabilitySummaryWidget = ({ data }: Props) => {
  if (!data)
    return (
      <View style={{ height: 150, justifyContent: "center", alignItems: "center" }}>
        <ThemedText style={{ textAlign: "center", color: Colors.icon, fontSize: 12 }}>
          No Accountability{"\n"}
          Summary Available
        </ThemedText>
      </View>
    );
  const { modeScore, consistency, adherence, bestStreak, targetsMet, totalWorkouts } = data;
  return (
    <View style={styles.container}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: Colors.cardBorder,
        }}
      >
        <View>
          <ThemedText style={styles.title}>ACCOUNTABILITY SUMMARY</ThemedText>
        </View>
        <View
          style={{
            flexDirection: "row",
            gap: 16,
            marginTop: 12,
          }}
        >
          <View>
            <ThemedText style={[styles.subtitle, { letterSpacing: 1.44 }]}>MODE SCORE</ThemedText>
            <ThemedText style={styles.modeScoreText}>{modeScore}</ThemedText>
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <View>
              <View style={styles.progressbarTextContainer}>
                <ThemedText style={styles.subtitle}>CONSISTENCY (Last 30 days)</ThemedText>
                <ThemedText
                  style={[
                    styles.subtitle,
                    {
                      fontFamily: Typography.family.secondary.bold,
                      color: Colors.text.primary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {consistency}%
                </ThemedText>
              </View>
              <Progressbar percentage={consistency} height={4} />
            </View>
            <View>
              <View style={styles.progressbarTextContainer}>
                <ThemedText style={styles.subtitle}>ADHERENCE (Last 30 days)</ThemedText>
                <ThemedText
                  style={[
                    styles.subtitle,
                    {
                      fontFamily: Typography.family.secondary.bold,
                      color: Colors.text.primary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {adherence}%
                </ThemedText>
              </View>
              <Progressbar percentage={adherence} height={4} />
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={styles.statContainer}>
          <ThemedText style={styles.statNumber}>{bestStreak}</ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: "center", fontSize: 12 }]}>
            Best{"\n"}
            Streak
          </ThemedText>
        </View>
        <View style={{ width: 1, backgroundColor: Colors.cardBorder, height: "100%" }} />
        <View style={styles.statContainer}>
          <ThemedText style={styles.statNumber}>{targetsMet}</ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: "center", fontSize: 12 }]}>
            Targets{"\n"}
            Met
          </ThemedText>
        </View>
        <View style={{ width: 1, backgroundColor: Colors.cardBorder, height: "100%" }} />
        <View style={styles.statContainer}>
          <ThemedText style={styles.statNumber}>{totalWorkouts}</ThemedText>
          <ThemedText style={[styles.subtitle, { textAlign: "center", fontSize: 12 }]}>
            Total{"\n"}
            Workouts
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

export default AccountabilitySummaryWidget;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
  },
  title: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 9,
    letterSpacing: 1.98,
    color: Colors.icon,
  },
  subtitle: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 8,
    color: Colors.icon,
  },
  modeScoreText: {
    fontFamily: Typography.family.secondary.bold,
    fontSize: 52,
    textAlign: "center",
    color: Colors.accent.primary,
  },
  progressbarTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statContainer: {
    padding: 12,
    width: 110,
  },
  statNumber: {
    fontFamily: Typography.family.secondary.bold,
    fontSize: 20,
    textAlign: "center",
    letterSpacing: -0.6,
  },
});
