import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Colors, Typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

type Props = {
  uid: string;
  avatarUrl: string;
  displayName: string;
  username: string;
  removeFriend: () => void;
  isPending: boolean;
};

const FriendsListCard = ({ uid, avatarUrl, displayName, username, removeFriend, isPending }: Props) => {
  const router = useRouter();
  const navigateToFriendProfile = (uid: string) => router.push(`/(friendProfile)/${uid}`);
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Avatar avatarUrl={avatarUrl} displayName={displayName} onPress={() => navigateToFriendProfile(uid)} />
        <TouchableOpacity onPress={() => navigateToFriendProfile(uid)}>
          <ThemedText style={styles.displayName} ellipsizeMode="tail" numberOfLines={1}>
            {displayName}
          </ThemedText>
          <ThemedText style={styles.username} ellipsizeMode="tail" numberOfLines={1}>
            @{username}
          </ThemedText>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={removeFriend} disabled={isPending}>
        {isPending ? (
          <ActivityIndicator color={Colors.text.secondary} />
        ) : (
          <ThemedText style={styles.buttonText}>UNFRIEND</ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default FriendsListCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },

  avatarContainer: {
    borderRadius: 12,
    backgroundColor: "rgba(211, 174, 75, 0.14)",
    height: 46,
    width: 46,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
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

  button: {
    minWidth: 84,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 3,
  },
  buttonText: {
    color: Colors.text.secondary,
    fontSize: 11,
    fontFamily: Typography.family.primary.bold,
    letterSpacing: 0.8,
  },
});
