import { Border, Colors, Typography } from "@/constants/theme";
import { useUserFeedInfinite } from "@/hooks/social/useUserFeedInfinite";
import { formatFirestoreDateTime } from "@/lib/utils/date";
import { useUserStore } from "@/stores/user-store";
import { FeedItem } from "@builtmode/shared";
import { FontAwesome6 } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const RecentFriendActivityWidget = () => {
  const router = useRouter();
  const { user } = useUserStore();

  const uid = user?.uid ?? "";

  const { data, error, isLoading, hasNextPage, fetchNextPage } = useUserFeedInfinite(uid);

  // Filter out current user activity
  const feedItems = useMemo(() => {
    const getDataWithoutCurrentUser = (
      selectedDataArray: FeedItem[],
      allData: FeedItem[],
      index = 0,
    ) => {
      if (selectedDataArray.length === 3) return selectedDataArray;
      if (index >= allData.length) {
        if (hasNextPage) {
          fetchNextPage();
          return [];
        }
        return selectedDataArray;
      }

      const array = selectedDataArray;

      if (allData[index].actorUid !== uid) {
        array.push(allData[index]);
        getDataWithoutCurrentUser(array, allData, index + 1);
      } else {
        getDataWithoutCurrentUser(array, allData, index + 1);
      }
    };
    const allData = data?.pages.flatMap((page) => page.items) ?? [];

    return getDataWithoutCurrentUser(
      allData.filter((item) => item.actorUid !== uid),
      [],
      0,
    );
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>RECENT FRIEND ACTIVITY</ThemedText>
      </View>

      <View>
        {feedItems?.map((item) => {
          const createdAtDayjs = dayjs(formatFirestoreDateTime(item.completedAt));

          return (
            <View style={styles.activityRow} key={item.feedItemId}>
              {item.actorAvatarUrl ? (
                <Image source={{ uri: item.actorAvatarUrl }} style={styles.avatarPic} />
              ) : (
                <View></View>
              )}
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
  avatarPic: {
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
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
