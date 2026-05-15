import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { fetchUserMonthAggregate, fetchUserStats } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getMonthId } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";

const PerformanceSnapshotWidget = () => {
  const { user } = useUserStore();

  if (!user) return null;

  const {
    data: userStatsData,
    isLoading: userStatsIsLoading,
    error: userStatsError,
  } = useQuery({
    queryKey: ["user-stats", user.uid],
    queryFn: fetchUserStats,
    params: { uid: user?.uid },
    enabled: !!user,
  });

  const {
    data: monthAggregateData,
    isLoading: monthAggregateIsLoading,
    error: monthAggregateError,
  } = useQuery({
    queryKey: ["user-month-aggregate", getMonthId(Date(), user.homeTimezone)],
    queryFn: fetchUserMonthAggregate,
    params: { uid: user.uid, monthId: getMonthId(Date(), user.homeTimezone) },
    enabled: !!user,
  });

  return (
    <View style={styles.container}>
      {userStatsIsLoading || monthAggregateIsLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator />
        </View>
      ) : userStatsError || !userStatsData || monthAggregateError || !monthAggregateData ? (
        <View style={styles.loading}>
          <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
            Error loading performance snapshot
          </ThemedText>
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>
              {user.isPracticeWeek ? "PREPARATION" : "PERFORMANCE SNAPSHOT"}
            </ThemedText>
          </View>

          <View>
            {user.isPracticeWeek ? null : (
              <View style={styles.metricContainer}>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View style={styles.iconContainer}>
                    <FontAwesome5 name="fire-alt" size={14} color={Colors.accent.primary} />
                  </View>
                  <View>
                    <ThemedText style={styles.metricSubtitle}>Best</ThemedText>
                    <ThemedText style={styles.metricTitle}>Week Streak</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.metricNumber}>{userStatsData.bestWeekStreak}</ThemedText>
              </View>
            )}
            <View
              style={[
                styles.metricContainer,
                {
                  paddingTop: user.isPracticeWeek ? 0 : 16,
                  borderBottomWidth: user.isPracticeWeek ? 0 : 1,
                  paddingBottom: user.isPracticeWeek ? 0 : 16,
                },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={styles.iconContainer}>
                  <FontAwesome6 name="dumbbell" size={14} color={Colors.accent.primary} />
                </View>
                <View>
                  <ThemedText style={styles.metricSubtitle}>Workouts</ThemedText>
                  <ThemedText style={styles.metricTitle}>
                    {user.isPracticeWeek ? "Before Start" : "This Month"}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.metricNumber}>
                {user.isPracticeWeek
                  ? (userStatsData.totalWorkoutsLogged ?? 0)
                  : monthAggregateData.totalWorkouts}
              </ThemedText>
            </View>

            {user.isPracticeWeek ? null : (
              <View
                style={[
                  { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
                  { paddingTop: 16 },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View style={styles.iconContainer}>
                    <FontAwesome5 name="calendar-alt" size={14} color={Colors.accent.primary} />
                  </View>
                  <View>
                    <ThemedText style={styles.metricSubtitle}>Active Days </ThemedText>
                    <ThemedText style={styles.metricTitle}>This Month</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.metricNumber}>
                  {monthAggregateData.activeDaysCount}
                </ThemedText>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

export default PerformanceSnapshotWidget;

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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#1f222884",
    paddingBottom: 12,
  },
  headerTitle: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    letterSpacing: 2.4,
    lineHeight: 16,
    color: Colors.icon,
  },
  infoTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  targetDaysText: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  metricContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomColor: "#1f222884",
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  metricTitle: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  metricSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family.primary.medium,
    lineHeight: 16,
    color: Colors.icon,
  },
  metricNumber: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: Typography.family.primary.bold,
  },
  iconContainer: {
    backgroundColor: Colors.input,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
});
