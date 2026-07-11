import AccountabilitySummaryWidget from "@/components/profile/AccountabilitySummaryWidget";
import ThisWeekWidget from "@/components/profile/ThisWeekWidget";
import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { removeFriend } from "@/services/social-service";
import {
  fetchUserLeaderboardEntry,
  fetchUsersHomeTimezone,
  fetchUserStats,
  fetchUserWeekAggregate,
} from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
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
          Their completed workouts will appear here.{"\n"}Every session counts.
        </ThemedText>
      </View>
    </View>
  );
};

const FriendProfile = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUserStore();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: RelativePathString }>();

  const queryClient = useQueryClient();

  const { data: userInfo, isLoading: isLoadingUserInfo } = useQuery({
    queryKey: ["user-leaderboard-entry", id],
    queryFn: fetchUserLeaderboardEntry,
    params: { uid: id },
    enabled: !!id,
  });

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ["user-stats", id],
    queryFn: fetchUserStats,
    params: { uid: id },
    enabled: !!id,
  });

  const { mutate: removeFriendFunc, isPending } = useMutation({
    mutationFn: async (friendUid: string) => {
      const result = await removeFriend(friendUid);

      if (!result.success) {
        throw new Error(result.message ?? "Failed to remove friend.");
      }

      return result;
    },
    onSuccess: () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/feed");
      }

      queryClient.invalidateQueries({ queryKey: ["user-friends", user?.uid ?? ""] });
    },
  });

  const { data: usersHomeTimezone } = useQuery({
    queryKey: ["user-homeTimezone", id],
    queryFn: fetchUsersHomeTimezone,
    params: { uid: id ?? "" },
    enabled: !!id,
  });

  const { data: userWeekAggregate, isLoading: isLoadingUserWeekAggregate } = useQuery({
    queryKey: ["user-week-aggregate", usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "", id],
    queryFn: fetchUserWeekAggregate,
    params: {
      uid: id ?? "",
      weekId: usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
    },
    enabled: !!usersHomeTimezone,
  });

  const { data: recentWorkouts, isLoading: isLoadingRecentWorkouts } = useUserWorkoutsInfinite(id, 3);

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
      targetDays: userWeekAggregate?.weeklyTargetDays || userStats?.weeklyTargetDays || 0,
      currentStreakWeek: userWeekAggregate?.streakWeeks || userStats?.currentWeekStreak || 0,
      isPracticeWeek: !userWeekAggregate?.isOfficialWeek || !userInfo?.isRanked || false,
    };
  }, [userWeekAggregate, userStats, userInfo]);

  const recentWorkoutsData = useMemo(() => {
    return (recentWorkouts?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
  }, [recentWorkouts]);

  const handleBack = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    router.back();
  };

  const isLoadingData =
    isLoadingUserInfo || isLoadingUserStats || isLoadingUserWeekAggregate || isLoadingRecentWorkouts;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} style={styles.iconContainer} onPress={handleBack}>
          <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerText}>{userInfo?.usernameLower ?? ""}</ThemedText>
        </View>

        {/* BUTTON PLACEHOLDER */}
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoadingData ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={Colors.icon} />
        </View>
      ) : !userInfo ? (
        <View style={styles.centerState}>
          <ThemedText style={styles.unavailableText}>Profile unavailable</ThemedText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.mainContentContainer}>
            {/* USER INFO */}
            <View style={styles.userInfoContainer}>
              <Avatar
                avatarUrl={userInfo?.avatarUrl ?? ""}
                displayName={userInfo?.displayName ?? "?"}
                size={65}
                containerStyle={styles.avatar}
              />

              <View style={styles.userNameContainer}>
                <ThemedText style={styles.displayName}>{userInfo?.displayName}</ThemedText>
                <ThemedText style={styles.username}>@{userInfo?.usernameLower}</ThemedText>
              </View>

              <View style={styles.badgeRow}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.unfriendButton}
                  onPress={() =>
                    Alert.alert("Are You Sure?", "You will lose access to this user's profile", [
                      {
                        text: "Unfriend",
                        onPress: () => removeFriendFunc(id),
                        style: "destructive",
                      },
                      { text: "Cancel" },
                    ])
                  }
                  disabled={isPending}
                >
                  {isPending ? (
                    <ActivityIndicator color={Colors.accent.primary} size="small" />
                  ) : (
                    <View style={styles.friendBadgeInner}>
                      <FontAwesome5 name="user-check" size={12} color={Colors.accent.primary} />
                      <ThemedText style={styles.unfriendButtonText}>FRIEND</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>

                {userInfo?.streakWeeks > 0 && (
                  <View style={styles.streakWeekButton}>
                    <View style={styles.streakBadgeInner}>
                      <FontAwesome5 name="fire-alt" size={12} color={Colors.accent.primary} />
                      <ThemedText style={styles.streakWeekButtonText}>ON STREAK</ThemedText>
                    </View>
                  </View>
                )}

                {!userInfo?.isRanked && (
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
                          id,
                          returnTo: `/(protected)/(tabs)/(feed)/(friendProfile)/${id}`,
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
                          pathname: "/(protected)/(tabs)/(workout)/(workoutHistoryDetails)/[sessionId]",
                          params: {
                            sessionId: workout.sessionId,
                            returnTo: `/(protected)/(tabs)/(feed)/(friendProfile)/${id}`,
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

export default FriendProfile;

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

  headerTitleContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },

  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },

  headerPlaceholder: {
    width: 40,
    height: 40,
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

  friendBadgeInner: {
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
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
    color: Colors.gray,
    fontFamily: Typography.family.primary.medium,
    fontSize: 14,
    lineHeight: 20,
  },
});
