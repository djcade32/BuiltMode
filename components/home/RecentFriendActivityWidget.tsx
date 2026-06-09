import { Border, Colors, Typography } from "@/constants/theme";
import { useUserFeedInfinite } from "@/hooks/social/useUserFeedInfinite";
import { formatFirestoreDateTimeISO } from "@/lib/utils/date";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome6 } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const RecentFriendActivityWidget = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const uid = user?.uid ?? "";

  const { data, error, isLoading, hasNextPage, fetchNextPage } = useUserFeedInfinite(uid);

  const feedItems = useMemo(() => {
    const allData = data?.pages.flatMap((page) => page.items) ?? [];
    return allData.filter((item) => item.actorUid !== uid).slice(0, 3);
  }, [data, uid]);

  useEffect(() => {
    if (feedItems.length < 3 && !isLoading && hasNextPage) {
      fetchNextPage();
    }
  }, [feedItems]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>RECENT FRIEND ACTIVITY</ThemedText>
      </View>

      <View>
        {feedItems?.map((item) => {
          const createdAtDayjs = dayjs(formatFirestoreDateTimeISO(item.completedAt));

          return (
            <View style={styles.activityRow} key={item.feedItemId}>
              <View style={styles.avatarContainer}>
                {item.actorAvatarUrl ? (
                  <Image source={{ uri: item.actorAvatarUrl }} style={styles.avatarPic} />
                ) : (
                  <ThemedText style={styles.avatarText}>
                    {item.actorDisplayName?.[0]?.toUpperCase() ?? "?"}
                  </ThemedText>
                )}
              </View>
              <View>
                <View style={{ marginBottom: 5 }}>
                  <ThemedText style={styles.friendName}>{item.actorDisplayName}</ThemedText>
                  <ThemedText style={styles.activitySummary}>@{item.actorUsername}</ThemedText>
                </View>
                <ThemedText style={styles.activitySummary}>
                  {item.exerciseCount} exercises · {item.workoutName}
                </ThemedText>
                <ThemedText style={styles.elapsedTime}>{createdAtDayjs.fromNow()}</ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/(feed)/feed")}>
        <ThemedText style={styles.viewFeedButton}>
          VIEW FEED <FontAwesome6 name="arrow-right" size={12} />
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
};

export default RecentFriendActivityWidget;

const styles = StyleSheet.create({
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
    flexDirection: "row",
    justifyContent: "space-between",
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
  activityRow: {
    paddingTop: 16,
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1f222884",
    paddingBottom: 8,
    gap: 12,
  },
  avatarContainer: {
    borderRadius: 12,
    backgroundColor: "rgba(211, 174, 75, 0.14)",
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderColor: Colors.inputBorder,
    borderWidth: 1,
  },
  avatarPic: {
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
  },
  avatarText: {
    color: Colors.accent.primary,
    fontSize: 18,
    fontFamily: Typography.family.primary.bold,
  },
  friendName: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    lineHeight: 20,
  },
  activitySummary: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.icon,
    marginBottom: 3,
  },
  elapsedTime: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    lineHeight: 15,
    color: Colors.inputBorder,
  },
  viewFeedButton: {
    fontSize: 12,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
    marginTop: 16,
  },
});
