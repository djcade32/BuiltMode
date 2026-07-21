import AccountabilitySummaryWidget from "@/components/profile/AccountabilitySummaryWidget";
import ThisWeekWidget from "@/components/profile/ThisWeekWidget";
import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { fetchUserStats, fetchUserWeekAggregate } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const RecentWorkoutsEmptyState = () => {
  return (
    <View style={styles.emptyRecentWorkoutCard}>
      <View style={styles.emptyRecentIconCircle}>
        <FontAwesome5 name="dumbbell" size={22} color={Colors.accent.primary} />
      </View>

      <View style={styles.emptyRecentCopy}>
        <ThemedText style={styles.emptyRecentTitle}>No recent workouts yet</ThemedText>
        <ThemedText style={styles.emptyRecentBody}>
          Log a workout to see it here.{"\n"}Every session counts.
        </ThemedText>
      </View>
    </View>
  );
};

const profile = () => {
  const { user } = useUserStore();
  const uid = user?.uid ?? "";
  const usersHomeTimezone = user?.homeTimezone;
  const router = useRouter();

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ["user-stats", uid],
    queryFn: fetchUserStats,
    params: { uid },
    enabled: !!uid,
  });

  const { data: userWeekAggregate, isLoading: isLoadingUserWeekAggregate } = useQuery({
    queryKey: ["user-week-aggregate", usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "", uid],
    queryFn: fetchUserWeekAggregate,
    params: {
      uid,
      weekId: usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
    },
    enabled: !!usersHomeTimezone,
  });

  const { data: recentWorkouts, isLoading: isLoadingRecentWorkouts } = useUserWorkoutsInfinite(uid, 3);

  const accountabilitySummaryData = useMemo(() => {
    if (!userStats) return null;

    return {
      modeScore: userStats.modeScore ?? 0,
      consistency: userStats.activity30DayRate,
      adherence: userStats.last30DayWeeklyAdherenceRate,
      bestStreak: userStats.bestWeekStreak,
      targetsMet: userStats.totalTargetsMet,
      totalWorkouts: userStats.totalWorkoutsLogged,
    };
  }, [userStats]);

  const userWeekAggregateData = useMemo(() => {
    return {
      activeDays: userWeekAggregate?.activeDaysThisWeek || 0,
      targetDays: userWeekAggregate?.weeklyTargetDays || userStats?.weeklyTargetDays || 5,
      currentStreakWeek: userWeekAggregate?.streakWeeks || userStats?.currentWeekStreak || 0,
      isPracticeWeek: user?.isPracticeWeek || !userWeekAggregate?.isOfficialWeek || false,
      isStreakActive: userStats?.currentWeekStreak && userStats?.currentWeekStreak > 0 ? true : false,
    };
  }, [userWeekAggregate, userStats, user]);

  const recentWorkoutsData = useMemo(() => {
    return (recentWorkouts?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
  }, [recentWorkouts]);

  const isLoadingData = isLoadingUserStats || isLoadingUserWeekAggregate || isLoadingRecentWorkouts;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={{ width: 40, height: 40 }} />

        <View style={{ justifyContent: "center", alignItems: "center", gap: 2 }}>
          <ThemedText style={styles.headerText}>{user?.username?.toLocaleLowerCase() ?? ""}</ThemedText>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.iconContainer}
          onPress={() => router.push("/settings")}
        >
          <MaterialIcons name="settings" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>

      {isLoadingData ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.icon} />
        </View>
      ) : !uid ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.unavailableText}>Profile unavailable</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContentContainer}>
            {/* USER INFO */}
            <View style={styles.userInfoContainer}>
              <Avatar
                uid={user?.uid ?? ""}
                displayName={user?.displayName}
                size={65}
                containerStyle={styles.avatar}
              />

              <View style={styles.userNameContainer}>
                <ThemedText style={styles.displayName}>{user?.displayName}</ThemedText>
                <ThemedText style={styles.username}>@{user?.username?.toLocaleLowerCase() ?? ""}</ThemedText>
              </View>

              <View style={styles.badgeRow}>
                {userWeekAggregateData.isStreakActive && (
                  <View style={styles.streakWeekButton}>
                    <View style={styles.streakBadgeInner}>
                      <FontAwesome5 name="fire-alt" size={12} color={Colors.accent.primary} />
                      <ThemedText style={styles.streakWeekButtonText}>ON STREAK</ThemedText>
                    </View>
                  </View>
                )}

                {user?.isPracticeWeek && (
                  <View style={styles.practiceWeekBadge}>
                    <ThemedText style={styles.practiceWeekBadgeText}>PRACTICE WEEK</ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* ACCOUNTABILITY SUMMARY */}
            <AccountabilitySummaryWidget data={accountabilitySummaryData} />

            {/* THIS WEEK */}
            <ThisWeekWidget data={userWeekAggregateData} />

            {/* RECENT WORKOUTS */}
            <View style={styles.recentWorkoutsSection}>
              <View style={styles.recentWorkoutsHeader}>
                <ThemedText style={styles.recentWorkoutsTitle}>RECENT WORKOUTS</ThemedText>

                {recentWorkoutsData.length ? (
                  <TouchableOpacity
                    style={styles.viewAllRecentButton}
                    hitSlop={15}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: "/(protected)/(tabs)/(workout)/(viewHistory)/[id]",
                        params: {
                          id: uid,
                          returnTo: "/(protected)/(tabs)/profile",
                        },
                      })
                    }
                  >
                    <ThemedText style={styles.recentWorkoutsTitle}>VIEW ALL</ThemedText>
                    <FontAwesome6 name="arrow-right" size={9} color={Colors.icon} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.recentWorkoutsList}>
                {recentWorkoutsData.length ? (
                  recentWorkoutsData.map((workout) => (
                    <WorkoutHistoryCard
                      key={workout.sessionId}
                      workout={workout}
                      onPress={() =>
                        router.push({
                          pathname: "/(protected)/(workoutHistoryDetails)/[sessionId]",
                          params: {
                            sessionId: workout.sessionId,
                            returnTo: "/(protected)/(tabs)/profile",
                          },
                        })
                      }
                    />
                  ))
                ) : (
                  <RecentWorkoutsEmptyState />
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    alignItems: "center",
    height: 65,
  },

  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },

  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  unavailableText: {
    color: Colors.icon,
    fontSize: 12,
  },

  scrollContent: {
    paddingBottom: 34,
  },

  mainContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },

  avatar: {
    outlineWidth: 7,
    outlineColor: "#2A2E3534",
    borderWidth: 3,
    borderColor: Colors.inputBorder,
  },

  userInfoContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  userNameContainer: {
    gap: 3,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 22,
    letterSpacing: -0.66,
  },

  username: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 12,
    color: Colors.icon,
  },

  badgeRow: {
    flexDirection: "row",
    gap: 10,
  },

  streakBadgeInner: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  unfriendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#c6a34a38",
    borderWidth: 1,
    borderColor: "#c6a34a52",
    borderRadius: 9999,
  },

  unfriendButtonText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
    color: Colors.accent.primary,
  },

  practiceWeekBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#4A6C8C38",
    borderWidth: 1,
    borderColor: "#4A6C8C52",
    borderRadius: 9999,
  },

  practiceWeekBadgeText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
    color: Colors.accent.secondary,
  },

  streakWeekButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 9999,
  },

  streakWeekButtonText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
  },

  recentWorkoutsSection: {
    marginTop: 6,
  },

  recentWorkoutsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  viewAllRecentButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },

  recentWorkoutsTitle: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 9,
    letterSpacing: 1.98,
    color: Colors.icon,
  },

  recentWorkoutsList: {
    gap: 12,
    marginTop: 14,
    marginBottom: 18,
  },

  emptyRecentWorkoutCard: {
    minHeight: 94,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255, 255, 255, 0.11)",
    backgroundColor: "rgba(255, 255, 255, 0.012)",
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 16,
  },

  emptyRecentIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.045)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyRecentCopy: {
    flex: 1,
    gap: 6,
  },

  emptyRecentTitle: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.bold,
    fontSize: 15,
    lineHeight: 20,
  },

  emptyRecentBody: {
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
