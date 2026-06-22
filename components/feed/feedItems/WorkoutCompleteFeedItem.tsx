import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Colors, Typography } from "@/constants/theme";
import { formatFirestoreDateTimeISO, formatFirestoreTimestamp } from "@/lib/utils/date";
import { durationTimeString } from "@/lib/utils/time";
import { useUserStore } from "@/stores/user-store";
import { FeedItem } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import WeeklyProgressBar from "./WeeklyProgressBar";

dayjs.extend(relativeTime);

const WorkoutCompleteFeedItem = ({ feedItem }: { feedItem: FeedItem }) => {
  const { user } = useUserStore();
  const currentUserUid = user?.uid ?? "";
  const router = useRouter();
  const {
    actorUid,
    actorAvatarUrl,
    actorDisplayName,
    actorUsername,
    workoutName,
    exerciseCount,
    durationSeconds,
    completedAt,
    totalSets,
    weeklyTargetDays,
    weeklyProgress,
    workoutId,
    isPracticeWeek: isPractice,
  } = feedItem;

  const hasWorkoutId = Boolean(workoutId);

  const createdAt =
    Math.abs(dayjs(formatFirestoreDateTimeISO(completedAt)).diff(new Date(), "days")) >= 1
      ? formatFirestoreTimestamp(completedAt)
      : dayjs(formatFirestoreDateTimeISO(completedAt)).fromNow();
  const targetMet = weeklyProgress === weeklyTargetDays && !isPractice;
  const navigateToFriendProfile = (uid: string) =>
    currentUserUid === uid
      ? router.push("/(profile)/profile")
      : router.push(`/(friendProfile)/${uid}`);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: targetMet ? Colors.accent.primary : Colors.cardBorder,
          borderTopWidth: targetMet ? 3 : 1,
        },
      ]}
    >
      <View
        style={{ gap: 3, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, padding: 20 }}
      >
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar
            avatarUrl={actorAvatarUrl}
            displayName={actorDisplayName}
            onPress={() => navigateToFriendProfile(actorUid)}
          />
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity onPress={() => navigateToFriendProfile(actorUid)}>
                <ThemedText style={styles.displayName} ellipsizeMode="tail" numberOfLines={1}>
                  {actorDisplayName}
                </ThemedText>
              </TouchableOpacity>
              {(targetMet || isPractice) && (
                <View
                  style={[
                    styles.targetMetContainer,
                    {
                      backgroundColor: isPractice ? "#4a6c8c3a" : "#c6a34a38",
                      borderWidth: 1,
                      borderColor: isPractice ? Colors.accent.secondary : Colors.accent.primary,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.targetMetText,
                      { color: isPractice ? Colors.accent.secondary : Colors.accent.primary },
                    ]}
                  >
                    {isPractice ? "PRACTICE WEEK" : "TARGET MET"}
                  </ThemedText>
                </View>
              )}
            </View>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity onPress={() => navigateToFriendProfile(actorUid)}>
                <ThemedText style={styles.username} ellipsizeMode="tail" numberOfLines={1}>
                  @{actorUsername.toLocaleLowerCase()}
                </ThemedText>
              </TouchableOpacity>
              <ThemedText style={styles.username}> · {createdAt}</ThemedText>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 15 }}>
          <ThemedText style={styles.workoutName}>{workoutName}</ThemedText>
          <View style={styles.workoutStats}>
            <View style={styles.workoutStatContainer}>
              <ThemedText style={styles.workoutStatNumber}>{exerciseCount}</ThemedText>
              <ThemedText style={styles.workoutStatLabel}>EXERCISES</ThemedText>
            </View>
            {durationSeconds && (
              <View style={styles.workoutStatContainer}>
                <ThemedText style={styles.workoutStatNumber}>
                  {durationTimeString(durationSeconds)}
                </ThemedText>
                <ThemedText style={styles.workoutStatLabel}>DURATION</ThemedText>
              </View>
            )}
            <View style={styles.workoutStatContainer}>
              <ThemedText style={styles.workoutStatNumber}>{totalSets ?? 0}</ThemedText>
              <ThemedText style={styles.workoutStatLabel}>WORKING SETS</ThemedText>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 12, gap: 10 }}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <ThemedText style={styles.weeklyProgressTitle}>
              {isPractice ? "RHYTHM BUILDING" : "WEEKLY PROGRESS"}
            </ThemedText>
            <ThemedText
              style={[
                styles.weeklyProgressStats,
                { color: isPractice ? Colors.icon : Colors.accent.primary },
              ]}
            >
              {weeklyProgress} of {weeklyTargetDays} days
            </ThemedText>
          </View>
          {weeklyProgress != null && weeklyTargetDays != null && (
            <WeeklyProgressBar
              weeklyProgress={weeklyProgress}
              weeklyTarget={weeklyTargetDays}
              isPractice={isPractice}
            />
          )}
        </View>
        {isPractice && (
          <View style={{ marginTop: 5, flexDirection: "row", gap: 5, alignItems: "center" }}>
            <FontAwesome5 name="info-circle" size={12} color={Colors.accent.secondary} />

            <ThemedText style={{ color: Colors.icon, fontSize: 9 }}>
              Official tracking starts after practice week ends
            </ThemedText>
          </View>
        )}
      </View>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, alignItems: "flex-end" }}>
        <TouchableOpacity
          disabled={!hasWorkoutId}
          style={{ alignItems: "center", flexDirection: "row", gap: 5 }}
          onPress={() =>
            workoutId &&
            router.push({
              pathname: "/(protected)/(tabs)/(workout)/(workoutHistoryDetails)/[sessionId]",
              params: {
                sessionId: workoutId,
                returnTo: `/(protected)/(tabs)/(feed)/feed`,
              },
            })
          }
          hitSlop={15}
        >
          <ThemedText style={styles.viewDetailsButton}>VIEW DETAILS</ThemedText>
          <FontAwesome6 name="arrow-right" size={10} color={Colors.accent.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default WorkoutCompleteFeedItem;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.65,
    // shadowRadius: 6,
    // elevation: 6,
  },
  avatarContainer: {
    borderRadius: 12,
    backgroundColor: "rgba(211, 174, 75, 0.14)",
    height: 46,
    width: 46,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderColor: Colors.inputBorder,
    borderWidth: 1,
  },
  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },
  username: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
    marginTop: 3,
  },
  avatarText: {
    color: Colors.accent.primary,
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
  workoutName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 16,
    letterSpacing: -0.4,
  },
  workoutStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "space-between",
  },
  workoutStatContainer: {
    backgroundColor: "#0f111391",
    padding: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  workoutStatNumber: {
    fontFamily: Typography.family.secondary.bold,
  },
  workoutStatLabel: {
    fontSize: 9,
    letterSpacing: 0.22,
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
  },
  weeklyProgressTitle: {
    color: Colors.icon,
    fontSize: 9,
    letterSpacing: 1.35,
    fontFamily: Typography.family.primary.bold,
  },
  weeklyProgressStats: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 9,
  },
  viewDetailsButton: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.5,
  },
  targetMetContainer: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
  },
  targetMetText: {
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.45,
    fontSize: 9,
  },
});
