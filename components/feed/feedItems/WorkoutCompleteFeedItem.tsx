import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Colors, Typography } from "@/constants/theme";
import dayjs from "@/lib/dayjs";
import { formatFirestoreDateTimeISO, formatFirestoreTimestamp } from "@/lib/utils/date";
import { durationTimeString } from "@/lib/utils/time";
import { useUserStore } from "@/stores/user-store";
import { FeedItem } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import WeeklyProgressBar from "./WeeklyProgressBar";

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
    photoUrl,
  } = feedItem;

  const hasWorkoutId = Boolean(workoutId);

  const createdAt =
    Math.abs(dayjs(formatFirestoreDateTimeISO(completedAt)).diff(new Date(), "days")) >= 1
      ? formatFirestoreTimestamp(completedAt)
      : dayjs(formatFirestoreDateTimeISO(completedAt)).fromNow();

  const targetMet =
    weeklyProgress === null || weeklyTargetDays === null
      ? false
      : weeklyProgress === weeklyTargetDays && !isPractice;

  const navigateToFriendProfile = (uid: string) =>
    currentUserUid === uid ? router.push("/(profile)/profile") : router.push(`/(friendProfile)/${uid}`);

  const WorkoutSummary = ({ overlay = false }: { overlay?: boolean }) => (
    <View style={overlay ? styles.overlayWorkoutContent : styles.workoutContent}>
      <ThemedText
        style={overlay ? styles.overlayWorkoutName : styles.workoutName}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {workoutName}
      </ThemedText>

      <View style={styles.workoutStats}>
        <View style={[styles.workoutStatContainer, overlay && styles.overlayWorkoutStatContainer]}>
          <ThemedText
            style={[styles.workoutStatNumber, overlay && styles.overlayWorkoutStatNumber]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {exerciseCount}
          </ThemedText>
          <ThemedText style={[styles.workoutStatLabel, overlay && styles.overlayWorkoutStatLabel]}>
            EXERCISES
          </ThemedText>
        </View>

        {durationSeconds ? (
          <View
            style={[
              styles.workoutStatContainer,
              styles.durationWorkoutStatContainer,
              overlay && styles.overlayWorkoutStatContainer,
            ]}
          >
            <ThemedText
              style={[styles.workoutStatNumber, overlay && styles.overlayWorkoutStatNumber]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
            >
              {durationTimeString(durationSeconds)}
            </ThemedText>

            <ThemedText style={[styles.workoutStatLabel, overlay && styles.overlayWorkoutStatLabel]}>
              DURATION
            </ThemedText>
          </View>
        ) : null}

        <View style={[styles.workoutStatContainer, overlay && styles.overlayWorkoutStatContainer]}>
          <ThemedText
            style={[styles.workoutStatNumber, overlay && styles.overlayWorkoutStatNumber]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {totalSets ?? 0}
          </ThemedText>
          <ThemedText
            style={[styles.workoutStatLabel, overlay && styles.overlayWorkoutStatLabel]}
            numberOfLines={1}
          >
            WORKING SETS
          </ThemedText>
        </View>
      </View>
    </View>
  );

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
      <View style={styles.cardBody}>
        <View style={styles.headerRow}>
          <Avatar
            avatarUrl={actorAvatarUrl}
            displayName={actorDisplayName}
            onPress={() => navigateToFriendProfile(actorUid)}
          />

          <View style={styles.headerContent}>
            <View style={styles.nameRow}>
              <TouchableOpacity onPress={() => navigateToFriendProfile(actorUid)} style={styles.nameButton}>
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
                      borderColor: isPractice ? Colors.accent.secondary : Colors.accent.primary,
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.targetMetText,
                      {
                        color: isPractice ? Colors.accent.secondary : Colors.accent.primary,
                      },
                    ]}
                  >
                    {isPractice ? "PRACTICE WEEK" : "TARGET MET"}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.metaRow}>
              <TouchableOpacity onPress={() => navigateToFriendProfile(actorUid)}>
                <ThemedText style={styles.username} ellipsizeMode="tail" numberOfLines={1}>
                  @{actorUsername.toLocaleLowerCase()}
                </ThemedText>
              </TouchableOpacity>

              <ThemedText style={styles.username}> · {createdAt}</ThemedText>
            </View>
          </View>
        </View>

        {photoUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUrl }} style={styles.image} resizeMode="cover" />

            <LinearGradient
              pointerEvents="none"
              colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.72)", "rgba(0,0,0,0.92)"]}
              locations={[0, 0.35, 0.72, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.imageGradient}
            />

            <WorkoutSummary overlay />
          </View>
        ) : (
          <WorkoutSummary />
        )}

        <View style={styles.weeklyProgressContainer}>
          <View style={styles.weeklyProgressHeader}>
            <ThemedText style={styles.weeklyProgressTitle}>
              {isPractice ? "RHYTHM BUILDING" : "WEEKLY PROGRESS"}
            </ThemedText>

            <ThemedText
              style={[
                styles.weeklyProgressStats,
                {
                  color: isPractice ? Colors.icon : Colors.accent.primary,
                },
              ]}
            >
              {weeklyProgress} of {weeklyTargetDays} days
            </ThemedText>
          </View>

          {weeklyProgress != null && weeklyTargetDays != null ? (
            <WeeklyProgressBar
              weeklyProgress={weeklyProgress}
              weeklyTarget={weeklyTargetDays}
              isPractice={isPractice}
            />
          ) : null}
        </View>

        {isPractice ? (
          <View style={styles.practiceNote}>
            <FontAwesome5 name="info-circle" size={12} color={Colors.accent.secondary} />

            <ThemedText style={styles.practiceNoteText}>
              Official tracking starts after practice week ends
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!hasWorkoutId}
          style={styles.viewDetailsContainer}
          onPress={() =>
            workoutId &&
            router.push({
              pathname: "/(protected)/(workoutHistoryDetails)/[sessionId]",
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
    overflow: "hidden",
  },

  cardBody: {
    width: "100%",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },

  headerRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  nameButton: {
    flex: 1,
    minWidth: 0,
  },

  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  username: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 12,
    color: Colors.icon,
  },

  targetMetContainer: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },

  targetMetText: {
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.45,
    fontSize: 9,
  },

  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 5,
    overflow: "hidden",
    borderRadius: 12,
    backgroundColor: Colors.background.primary,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },

  workoutContent: {
    marginTop: 15,
  },

  overlayWorkoutContent: {
    position: "absolute",
    left: 7,
    right: 7,
    bottom: 14,
    zIndex: 2,
  },

  workoutName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 16,
    letterSpacing: -0.4,
  },

  overlayWorkoutName: {
    color: "#FFFFFF",
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
    letterSpacing: -0.5,
    lineHeight: 22,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  workoutStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    justifyContent: "space-between",
  },

  workoutStatContainer: {
    flex: 1,
    minWidth: 0,
    backgroundColor: "#0f111391",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },

  overlayWorkoutStatContainer: {
    backgroundColor: "rgba(7, 8, 10, 0.58)",
  },

  workoutStatNumber: {
    fontFamily: Typography.family.secondary.bold,
    fontSize: 16,
    lineHeight: 20,
    textAlign: "center",
    includeFontPadding: false,
    maxWidth: "100%",
  },

  overlayWorkoutStatNumber: {
    color: "#FFFFFF",
  },

  workoutStatLabel: {
    fontSize: 9,
    letterSpacing: 0.22,
    color: Colors.icon,
    fontFamily: Typography.family.secondary.regular,
    textAlign: "center",
  },

  overlayWorkoutStatLabel: {
    color: "rgba(255,255,255,0.72)",
  },

  weeklyProgressContainer: {
    marginTop: 12,
    gap: 10,
  },

  weeklyProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  practiceNote: {
    marginTop: 5,
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },

  practiceNoteText: {
    color: Colors.icon,
    fontSize: 9,
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "flex-end",
    width: "100%",
  },

  viewDetailsContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },

  viewDetailsButton: {
    color: Colors.accent.primary,
    fontSize: 10,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.5,
    textAlign: "right",
  },

  durationWorkoutStatContainer: {
    flex: 1.35,
  },
});
