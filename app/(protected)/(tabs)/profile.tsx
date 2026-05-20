import { Colors } from "@/constants/theme";
import {
  cancelFriendRequest,
  respondToFriendRequest,
  sendFriendRequest,
} from "@/services/social-service";
import { useAuthStore } from "@/stores/auth-store";
import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Button, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const profile = () => {
  const { signout } = useAuthStore();

  const { mutate: sendFriendRequestFunc } = useMutation({
    mutationFn: async (id: string) => {
      const result = await sendFriendRequest(id);
      if (!result.success) {
        throw new Error(result.message ?? "Failed to send friend request.");
      }
    },
  });

  const { mutate: respondToFriendRequestFunc } = useMutation({
    mutationFn: async ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accepted" | "declined";
    }) => {
      const result = await respondToFriendRequest(requestId, action);

      if (!result.success) {
        throw new Error(result.message ?? "Failed to respond to friend request.");
      }

      return result;
    },
  });

  const { mutate: cancelFriendRequestFunc } = useMutation({
    mutationFn: async (requestId: string) => {
      const result = await cancelFriendRequest(requestId);

      if (!result.success) {
        throw new Error(result.message ?? "Failed to cancel friend request.");
      }

      return result;
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Button title="Sign out" onPress={signout} />
      <Button
        title="Send Friend Request"
        onPress={() => sendFriendRequestFunc("G5TXMZMdhcSy7c8RriJe5VBdwTLC")}
      />
      <Button
        title="Accept Friend Request"
        onPress={() =>
          respondToFriendRequestFunc({
            requestId: "bAJ35fKo1TggwvdVdISZugWBGtEc_G5TXMZMdhcSy7c8RriJe5VBdwTLC",
            action: "accepted",
          })
        }
      />
      <Button
        title="Cancel Friend Request"
        onPress={() =>
          cancelFriendRequestFunc("bAJ35fKo1TggwvdVdISZugWBGtEc_G5TXMZMdhcSy7c8RriJe5VBdwTLC")
        }
      />
    </SafeAreaView>
  );
};

export default profile;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
});
