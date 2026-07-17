import { ThemedText } from "@/components/themed-text";
import { Border, Colors, Typography } from "@/constants/theme";
import { useUpdateProfileAvatar } from "@/hooks/user/useUpdateProfileAvatar";
import { changeWeeklyTarget } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { FontAwesome6 } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const settings = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { signout } = useAuthStore();
  const uid = user?.uid ?? "";
  const usersHomeTimezone = user?.homeTimezone;

  const queryClient = useQueryClient();

  const { mutate: changeUserAvatarUrl } = useUpdateProfileAvatar();
  const { mutate: handleChangingWeeklyTarget } = useMutation({
    mutationFn: changeWeeklyTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-stats", uid] });
      queryClient.invalidateQueries({
        queryKey: ["user-week-aggregate", usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "", uid],
      });
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconContainer} onPress={() => router.back()}>
          <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
        </TouchableOpacity>

        <ThemedText style={styles.headerText}>Settings</ThemedText>

        {/* BUTTON PLACEHOLDER */}
        <View style={{ width: 40, height: 40 }} />
      </View>
      <View style={{ paddingTop: 16 }}>
        <TouchableOpacity style={styles.signOutButtonContainer} onPress={signout}>
          <ThemedText style={styles.signOutButton}>SIGN OUT</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButtonContainer}
          onPress={() =>
            changeUserAvatarUrl({
              avatarUrl:
                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2080&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            })
          }
        >
          <ThemedText style={styles.signOutButton}>Change User Avatar</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signOutButtonContainer}
          onPress={() =>
            handleChangingWeeklyTarget({
              weeklyTarget: 5,
            })
          }
        >
          <ThemedText style={styles.signOutButton}>Change Weekly Target</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default settings;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    alignItems: "center",
    height: 65,
  },
  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
  },

  signOutButtonContainer: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 16,
    marginHorizontal: 24,
  },
  signOutButton: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center",
    letterSpacing: 1.2,
  },
});
