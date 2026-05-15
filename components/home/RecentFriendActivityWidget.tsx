import { Border, Colors, Typography } from "@/constants/theme";
import { FontAwesome6 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "../themed-text";

const RecentFriendActivityWidget = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>RECENT FRIEND ACTIVITY</ThemedText>
      </View>

      <View>
        <View style={styles.activityRow}>
          <Image source={{ uri: "https://i.pravatar.cc/400?img=10" }} style={styles.avatarPic} />
          <View>
            <ThemedText style={styles.friendName}>Maddie Williams</ThemedText>
            <ThemedText style={styles.activitySummary}>Completed Push Day • 5 exercises</ThemedText>
            <ThemedText style={styles.elapsedTime}>2h 15m ago</ThemedText>
          </View>
        </View>
        <View style={styles.activityRow}>
          <Image source={{ uri: "https://i.pravatar.cc/400?img=11" }} style={styles.avatarPic} />
          <View>
            <ThemedText style={styles.friendName}>Trey McBride</ThemedText>
            <ThemedText style={styles.activitySummary}>Completed Push Day • 5 exercises</ThemedText>
            <ThemedText style={styles.elapsedTime}>2h 15m ago</ThemedText>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => router.push("/(protected)/(tabs)/feed")}>
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 6,
    elevation: 6,
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
    paddingBottom: 16,
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
    marginBottom: 4,
  },
  activitySummary: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.icon,
    marginBottom: 8,
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
