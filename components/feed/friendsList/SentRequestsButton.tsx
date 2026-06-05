import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const SentRequestsButton = ({ onPress, count }: { onPress: () => void; count: number }) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        },
      ]}
      onPress={onPress}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={[styles.friendRequestsIcon, { backgroundColor: "#4a6c8c3a" }]}>
          <FontAwesome name="send" size={16} color={Colors.accent.secondary} />
        </View>
        <View>
          <ThemedText style={styles.friendRequestsCardTitle}>Sent Requests</ThemedText>
          <ThemedText style={styles.friendRequestsCardSubtitle}>Awaiting their response</ThemedText>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={[
            styles.friendRequestsCardNotification,
            {
              backgroundColor: Colors.inputBorder,
            },
          ]}
        >
          <ThemedText
            style={[
              styles.friendRequestsCardNotificationText,
              {
                color: Colors.icon,
              },
            ]}
          >
            {count}
          </ThemedText>
        </View>
        <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.icon} />
      </View>
    </TouchableOpacity>
  );
};

export default SentRequestsButton;

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
  friendRequestsTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 14,
    letterSpacing: 0.35,
    marginBottom: 16,
  },

  friendRequestsIcon: {
    borderRadius: Border.radius.md,
    height: 40,
    width: 40,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  friendRequestsCardTitle: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
  },
  friendRequestsCardSubtitle: {
    fontSize: 12,
    color: Colors.icon,
    marginTop: 5,
  },
  friendRequestsCardNotification: {
    height: 24,
    width: 24,
    backgroundColor: Colors.accent.primary,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  friendRequestsCardNotificationText: {
    color: Colors.background.secondary,
    fontSize: 12,
    fontFamily: Typography.family.primary.bold,
  },
});
