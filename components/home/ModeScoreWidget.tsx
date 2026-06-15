import { Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { fetchUserStats, fetchUserWeekAggregate } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { FontAwesome6 } from "@expo/vector-icons";
import dayjs from "dayjs";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

const ModeScoreWidget = () => {
  const { user } = useUserStore();

  const uid = user?.uid;
  const homeTimezone = user?.homeTimezone;

  const { data, isLoading, error } = useQuery({
    queryKey: ["user-week-aggregate", getWeekId(Date(), homeTimezone ?? ""), uid],
    queryFn: fetchUserWeekAggregate,
    params: { uid: uid ?? "", weekId: getWeekId(Date(), homeTimezone ?? "") },
    enabled: !!uid,
  });

  const { data: lastWeek } = useQuery({
    queryKey: [
      "user-week-aggregate",
      getWeekId(dayjs(Date()).subtract(7, "days").toDate(), homeTimezone ?? ""),
    ],
    queryFn: fetchUserWeekAggregate,
    params: {
      uid: uid ?? "",
      weekId: getWeekId(dayjs(Date()).subtract(7, "days").toDate(), homeTimezone ?? ""),
    },
    enabled: !!user,
  });

  const { data: userStats } = useQuery({
    queryKey: ["user-stats", uid],
    queryFn: fetchUserStats,
    params: { uid: uid ?? "" },
    enabled: !!uid,
  });

  const getModeScoreDiffNumber = useMemo(() => {
    if (lastWeek?.modeScore == null || userStats?.modeScore == null) return "";
    return `${userStats.modeScore > lastWeek.modeScore ? "+" : ""}${userStats.modeScore - lastWeek.modeScore}`;
  }, [lastWeek?.modeScore, userStats?.modeScore]);

  if (!user?.weeklyTargetDays) return null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.loading}>
          <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
            Error loading mode score
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>MODE SCORE</ThemedText>
          </View>

          <View style={styles.infoTextContainer}>
            <ThemedText style={styles.modeScoreNumber}>{userStats?.modeScore ?? 0}</ThemedText>
            {!!lastWeek && getModeScoreDiffNumber !== "" ? (
              <ThemedText
                testID="mode-score-diff"
                style={{
                  fontSize: 12,
                  lineHeight: 16,
                  color: Colors.accent.primary,
                }}
              >
                {getModeScoreDiffNumber.includes("+") ? (
                  <FontAwesome6 name="arrow-up" size={12} />
                ) : getModeScoreDiffNumber === "0" ? null : (
                  <FontAwesome6 name="arrow-down" size={12} />
                )}{" "}
                {getModeScoreDiffNumber}{" "}
                <ThemedText
                  style={{
                    fontSize: 12,
                    lineHeight: 16,
                    color: Colors.icon,
                  }}
                >
                  This Week
                </ThemedText>
              </ThemedText>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
};

export default ModeScoreWidget;

const styles = StyleSheet.create({
  loading: {
    justifyContent: "center",
    alignItems: "center",
    height: 80,
  },
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,

    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.65,
    // shadowRadius: 6,
    // elevation: 6,
  },
  header: {
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
    color: Colors.icon,
    marginBottom: 12,
  },
  infoTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  targetDaysText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  modeScoreNumber: {
    fontFamily: Typography.family.tertiary.regular,
    fontSize: 48,
    lineHeight: 48,
  },
});
