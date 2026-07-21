import { Colors, Typography } from "@/constants/theme";
import { usePublicProfile } from "@/hooks/user/usePublicProfile";
import { useMemo } from "react";
import { Image, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { ThemedText } from "../themed-text";

type Props = {
  /**
   * Used to retrieve the canonical public profile through TanStack Query.
   */
  uid?: string;

  /**
   * Snapshot values used while the canonical public profile is loading,
   * when the request fails, or when a legacy user does not yet have a
   * publicProfiles document.
   */
  avatarUrl?: string | null;
  displayName?: string;
  username?: string;

  onPress?: () => void;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

const Avatar = ({
  uid = "",
  avatarUrl = null,
  displayName = "",
  username = "",
  onPress,
  size = 46,
  containerStyle,
}: Props) => {
  const profileFallback = useMemo(
    () => ({
      uid,
      avatarUrl,
      displayName,
      username,
      avatarVersion: 0,
    }),
    [uid, avatarUrl, displayName, username],
  );
  const { profile } = usePublicProfile(uid, profileFallback);
  const resolvedAvatarUrl = profile?.avatarUrl ?? avatarUrl;
  const resolvedDisplayName = profile?.displayName?.trim() || displayName.trim();

  return (
    <TouchableOpacity
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
      style={[
        styles.avatarContainer,
        containerStyle,
        {
          height: size,
          width: size,
          borderRadius: size * 0.26,
        },
      ]}
      onPress={onPress}
    >
      {resolvedAvatarUrl ? (
        <Image
          source={{ uri: resolvedAvatarUrl }}
          style={{
            height: size,
            width: size,
          }}
          resizeMode="cover"
        />
      ) : (
        <ThemedText
          style={[
            styles.avatarText,
            {
              fontSize: Math.max(14, size * 0.39),
            },
          ]}
        >
          {resolvedDisplayName[0]?.toUpperCase() ?? "?"}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};

export default Avatar;

const styles = StyleSheet.create({
  avatarContainer: {
    backgroundColor: "rgba(211, 174, 75, 0.14)",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },

  avatarText: {
    color: Colors.accent.primary,
    fontFamily: Typography.family.primary.bold,
  },
});
