import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Colors, Typography } from "@/constants/theme";
import { useUserStore } from "@/stores/user-store";
import { SearchUserResult } from "@builtmode/shared";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

type FriendCardProps = {
  data: SearchUserResult;
  isPending: boolean;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onCancel: (requestId: string) => void;
  onRemove: (uid: string) => void;
  onSend: (uid: string) => void;
};

const FriendCard = ({
  data,
  isPending,
  onAccept,
  onCancel,
  onDecline,
  onRemove,
  onSend,
}: FriendCardProps) => {
  const { user } = useUserStore();
  const router = useRouter();
  const { displayName, avatarUrl, username, relationshipStatus, uid } = data;
  const navigateToFriendProfile = (uid: string) => router.push(`/(friendProfile)/${uid}`);

  const RequestButton = useMemo(() => {
    if (!user) return null;

    let buttonStyle: StyleProp<ViewStyle> = {
      minWidth: 84,
      height: 34,
      borderRadius: 9,
      backgroundColor: Colors.accent.primary,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
      flexDirection: "row",
      gap: 3,
    };
    let textStyle = {
      color: Colors.background.primary,
      fontSize: 11,
      fontFamily: Typography.family.primary.bold,
      letterSpacing: 0.8,
    };
    let text = "SEND REQUEST";
    let action = () => onSend(uid);

    switch (relationshipStatus) {
      case "self":
        return null;
      case "friends":
        buttonStyle = { ...buttonStyle, backgroundColor: Colors.inputBorder };
        textStyle = { ...textStyle, color: Colors.text.secondary };
        text = "UNFRIEND";
        action = () => onRemove(uid);
        break;
      case "request_received":
        text = "ACCEPT";
        action = () => onAccept(`${uid}_${user.uid}`);

        break;
      case "request_sent":
        buttonStyle = { ...buttonStyle, backgroundColor: Colors.accent.secondary };
        text = "PENDING";
        action = () =>
          Alert.alert("Are You Sure?", "Cancel friend request", [
            {
              text: "Continue",
              onPress: () => onCancel(`${user.uid}_${uid}`),
              style: "destructive",
            },
            { text: "Cancel" },
          ]);
        break;
      case "none":
        break;

      default:
        break;
    }
    return (
      <View style={{ gap: 10 }}>
        <TouchableOpacity style={buttonStyle} onPress={action} disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color={Colors.icon} />
          ) : (
            <>
              {relationshipStatus === "request_sent" && (
                <MaterialCommunityIcons
                  name="clock-time-four"
                  size={14}
                  color={Colors.background.secondary}
                />
              )}
              <ThemedText style={textStyle}>{text}</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {relationshipStatus === "request_received" && (
          <TouchableOpacity
            style={[
              buttonStyle,
              {
                backgroundColor: Colors.background.primary,
                borderWidth: 1,
                borderColor: Colors.cardBorder,
              },
            ]}
            onPress={() => onDecline(`${uid}_${user.uid}`)}
            disabled={isPending}
          >
            {isPending ? (
              <ActivityIndicator color={Colors.icon} />
            ) : (
              <ThemedText style={[textStyle, { color: Colors.icon }]}>DECLINE</ThemedText>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }, [relationshipStatus, isPending, user, uid, onAccept, onCancel, onDecline, onRemove, onSend]);

  return (
    <View style={[styles.cardContainer, styles.container]}>
      <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
        <Avatar
          avatarUrl={avatarUrl}
          displayName={displayName ?? "?"}
          onPress={() => navigateToFriendProfile(uid)}
        />
        <TouchableOpacity onPress={() => navigateToFriendProfile(uid)}>
          <ThemedText style={styles.displayName} ellipsizeMode="tail" numberOfLines={1}>
            {displayName}
          </ThemedText>
          <ThemedText style={styles.username} ellipsizeMode="tail" numberOfLines={1}>
            @{username}
          </ThemedText>
        </TouchableOpacity>
      </View>
      {RequestButton}
    </View>
  );
};

export default FriendCard;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    alignItems: "center",
    gap: 3,
  },
  cardContainer: {
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
});
