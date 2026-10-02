import ChangeEmailSheet from "@/components/settings/ChangeEmailModal";
import ChangePasswordModal from "@/components/settings/ChangePasswordModal";
import ChangeWeeklyTargetModal, { type WeeklyTargetDays } from "@/components/settings/ChangeWeeklyTargetModal";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Border, Colors, Typography } from "@/constants/theme";
import { useUpdateProfileAvatar } from "@/hooks/user/useUpdateProfileAvatar";
import dayjs from "@/lib/dayjs";
import { handleGetWeekId } from "@/lib/utils/weekId";
// import { getWeekId } from "@/packages/shared/src";
// import { deleteBuiltModeAccount } from "@/services/delete-account-service";
import { cancelDeloadWeek, changeWeeklyTarget, checkForUserProfile, startDeloadWeek } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Entypo, Feather, FontAwesome, FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  ScrollView,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SettingsRowProps = {
  title: string;
  titleStyle?: TextStyle;
  subtitle?: string;
  preIcon?: { familyIcon: any; name: string; color?: string };
  postIcon?: { familyIcon: any; name: string; color?: string };
  disabled?: boolean;
  onPress: () => void;
};

const SettingsRow = ({
  title,
  subtitle,
  onPress,
  preIcon,
  postIcon,
  titleStyle,
  disabled = false,
}: SettingsRowProps) => {
  return (
    <TouchableOpacity style={styles.settingsSectionRow} onPress={onPress} disabled={disabled}>
      <View style={{ flexDirection: "row", flex: 1, gap: 12, alignItems: "center" }}>
        {preIcon && (
          <View style={styles.settingsRowIcon}>
            {React.createElement(preIcon.familyIcon, {
              name: preIcon.name,
              size: 16,
              color: preIcon.color ? preIcon.color : Colors.gray,
            })}
          </View>
        )}
        <View style={{ gap: 5, flexShrink: 1 }}>
          <ThemedText style={[styles.settingsRowTitle, titleStyle]}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.settingsRowSubtitle}>{subtitle}</ThemedText>}
        </View>
      </View>
      <View>
        {postIcon ? (
          React.createElement(postIcon.familyIcon, {
            name: postIcon.name,
            size: 20,
            color: postIcon.color ? postIcon.color : Colors.gray,
          })
        ) : (
          <Entypo name="chevron-right" size={24} color={Colors.gray} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const settings = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { signout, user: authUser } = useAuthStore();
  const uid = user?.uid ?? "";
  const usersHomeTimezone = user?.homeTimezone;

  const [isChangeEmailVisible, setIsChangeEmailVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isChangeWeeklyTargetVisible, setIsChangeWeeklyTargetVisible] = useState(false);
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);

  const { mutateAsync: changeUserAvatarUrl, isPending: isChangingAvatar } = useUpdateProfileAvatar();
  const { mutateAsync: handleChangingWeeklyTarget, isPending: isChangingWeeklyTarget } = useMutation({
    mutationFn: changeWeeklyTarget,
  });
  const runDeloadWeekAction = async (action: typeof startDeloadWeek) => {
    const actionUid = useUserStore.getState().user?.uid;
    const result = await action();
    if (!result.success) return result;

    try {
      if (!actionUid) throw new Error("Missing user for deload refresh");
      const refreshedUser = await checkForUserProfile(actionUid, "server");
      if (!refreshedUser) throw new Error("User profile could not be refreshed");

      // Do not restore a signed-out user or overwrite a different account.
      if (useUserStore.getState().user?.uid === actionUid) {
        useUserStore.getState().setUser({
          ...refreshedUser,
          isPracticeWeek:
            handleGetWeekId(new Date(), refreshedUser.homeTimezone) < refreshedUser.officialStartWeekId,
        });
      }
      return result;
    } catch (error) {
      console.error("Deload saved, but user refresh failed:", error);
      return {
        ...result,
        msg: `${result.msg}\n\nYour change was saved, but the screen could not refresh. It may still show your previous deload status.`,
      };
    }
  };

  const { mutateAsync: handleStartDeloadWeek, isPending: isStartingDeloadWeek } = useMutation({
    mutationFn: () => runDeloadWeekAction(startDeloadWeek),
  });
  const { mutateAsync: handleCancelDeloadWeek, isPending: isCancelingDeloadWeek } = useMutation({
    mutationFn: () => runDeloadWeekAction(cancelDeloadWeek),
  });

  const hasPendingDeloadWeek = !!user?.pendingDeloadWeekStartsAt;
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const refreshNow = () => setNow(Date.now());
    const interval = setInterval(refreshNow, 60_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshNow();
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const lastDeloadWeekStartedAt = user?.lastDeloadWeekStartedAt;
  let nextEligibleDeloadWeekAt = 0;
  if (lastDeloadWeekStartedAt) {
    const seconds =
      "_seconds" in lastDeloadWeekStartedAt ? lastDeloadWeekStartedAt._seconds : lastDeloadWeekStartedAt.seconds;
    const nanoseconds =
      "_nanoseconds" in lastDeloadWeekStartedAt
        ? lastDeloadWeekStartedAt._nanoseconds
        : lastDeloadWeekStartedAt.nanoseconds;
    const lastStartedAt = seconds * 1000 + Math.floor(nanoseconds / 1_000_000);
    nextEligibleDeloadWeekAt = dayjs.utc(lastStartedAt).add(8, "weeks").valueOf();
  }

  const isDeloadWeekOnCooldown = !!lastDeloadWeekStartedAt && now <= nextEligibleDeloadWeekAt;
  const isDeloadWeekEligible = !hasPendingDeloadWeek && !isDeloadWeekOnCooldown;
  // Round partial days up so the countdown never promises availability early.
  const remainingDays = isDeloadWeekOnCooldown
    ? Math.max(1, Math.ceil((nextEligibleDeloadWeekAt - now) / 86_400_000))
    : 0;
  const weeks = Math.floor(remainingDays / 7);
  const days = remainingDays % 7;
  const deloadCooldownLabel = `Available in ${weeks} ${weeks === 1 ? "week" : "weeks"} and ${days} ${days === 1 ? "day" : "days"}`;

  const currentWeeklyTarget: WeeklyTargetDays =
    user?.weeklyTargetDays === 2 ||
    user?.weeklyTargetDays === 3 ||
    user?.weeklyTargetDays === 4 ||
    user?.weeklyTargetDays === 5 ||
    user?.weeklyTargetDays === 6 ||
    user?.weeklyTargetDays === 7
      ? user.weeklyTargetDays
      : 5;

  const saveWeeklyTarget = async (weeklyTarget: WeeklyTargetDays) => {
    await handleChangingWeeklyTarget({ weeklyTarget });
  };

  const showPermissionAlert = (permissionName: "camera" | "photo library") => {
    Alert.alert(
      "Permission Required",
      `BuiltMode needs access to your ${permissionName} to change your profile picture.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            void Linking.openSettings();
          },
        },
      ],
    );
  };

  const saveSelectedAvatar = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled) return;

    const selectedAvatarUri = result.assets[0]?.uri;

    if (!selectedAvatarUri) {
      Alert.alert("Unable to Use Photo", "BuiltMode could not read the selected photo. Please try again.");
      return;
    }

    try {
      await changeUserAvatarUrl({
        uid,
        avatarUrl: selectedAvatarUri,
      });
    } catch (error) {
      console.error("Unable to change profile picture:", error);
      Alert.alert("Update Failed", "Your profile picture could not be updated. Please try again.");
    }
  };

  const chooseAvatarFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showPermissionAlert("photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      await saveSelectedAvatar(result);
    } catch (error) {
      console.error("Unable to open photo library:", error);
      Alert.alert("Photo Library Error", "BuiltMode could not open your photo library. Please try again.");
    }
  };

  const takeAvatarPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        showPermissionAlert("camera");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      await saveSelectedAvatar(result);
    } catch (error) {
      console.error("Unable to open camera:", error);
      Alert.alert("Camera Error", "BuiltMode could not open your camera. Please try again.");
    }
  };

  const handleChangeProfilePicture = () => {
    if (isChangingAvatar) return;

    Alert.alert("Change Profile Picture", "Choose how you want to add your new profile picture.", [
      {
        text: "Take Photo",
        onPress: () => {
          void takeAvatarPhoto();
        },
      },
      {
        text: "Choose from Library",
        onPress: () => {
          void chooseAvatarFromLibrary();
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const showDeleteAccountWarning = () => {
    Alert.alert(
      "Delete BuiltMode Account?",
      "This permanently deletes your account and associated BuiltMode data, including workouts, photos, progress, streaks, friendships, and profile information. This action cannot be undone and your data cannot be recovered.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => setIsDeleteAccountVisible(true),
        },
      ],
    );
  };

  const deleteAccount = async () => {
    // await handleDeletingAccount();
  };

  const showCancelDeloadWeekConfirmationModal = () => {
    if (isStartingDeloadWeek || isCancelingDeloadWeek || !hasPendingDeloadWeek) return;

    Alert.alert(
      "Cancel Scheduled Deload?",
      "Next week will remain a regular training week.",
      [
        { text: "Keep Scheduled", style: "cancel" },
        {
          text: "Cancel Deload",
          style: "destructive",
          onPress: async () => {
            if (!useUserStore.getState().user?.pendingDeloadWeekStartsAt) return;
            try {
              const result = await handleCancelDeloadWeek();
              Alert.alert(result.success ? "Deload Canceled" : "Unable to Cancel", result.msg);
            } catch (error) {
              console.error("Error canceling deload week:", error);
              Alert.alert("Unable to Cancel", "Please try again. Your cancellation could not be confirmed.");
            }
          },
        },
      ],
    );
  };

  const showDeloadWeekConfirmationModal = () => {
    if (isStartingDeloadWeek || isCancelingDeloadWeek || !isDeloadWeekEligible) return;

    Alert.alert(
      "Start Deload Week?",
      "Your deload week will begin next Monday at 4:00 AM. During your deload week, you can take time to recover without affecting your BuiltMode streak.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Schedule Deload",
          onPress: async () => {
            if (useUserStore.getState().user?.pendingDeloadWeekStartsAt) return;

            try {
              const result = await handleStartDeloadWeek();
              Alert.alert(result.success ? "Deload Scheduled" : "Unable to Schedule", result.msg);
            } catch (error) {
              console.error("Error scheduling deload week:", error);
              Alert.alert("Unable to Schedule", "Please try again. Your scheduled deload could not be confirmed.");
            }
          },
        },
      ],
    );
  };

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

      <ScrollView
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 8 }}>
          <ThemedText style={styles.settingsSectionTitle}>ACCOUNT</ThemedText>
          <View style={styles.settingsSection}>
            <TouchableOpacity
              style={styles.settingsSectionRow}
              onPress={handleChangeProfilePicture}
              disabled={isChangingAvatar}
              activeOpacity={0.8}
            >
              <View style={{ gap: 12, alignItems: "center", flexDirection: "row" }}>
                <Avatar uid={uid} avatarUrl={user?.avatarUrl} displayName={user?.displayName} size={40} />
                <View style={{ gap: 5 }}>
                  <ThemedText style={styles.settingsRowTitle}>Profile Picture</ThemedText>
                  <ThemedText style={styles.settingsRowSubtitle}>
                    {isChangingAvatar ? "Saving profile picture..." : "Change profile picture"}
                  </ThemedText>
                </View>
              </View>

              {isChangingAvatar ? (
                <ActivityIndicator size="small" color={Colors.accent.primary} />
              ) : (
                <Entypo name="chevron-right" size={24} color={Colors.gray} />
              )}
            </TouchableOpacity>

            <View style={styles.separator} />

            <SettingsRow
              title="Email Address"
              subtitle={authUser?.email ?? ""}
              preIcon={{
                familyIcon: FontAwesome,
                name: "envelope",
              }}
              onPress={() => setIsChangeEmailVisible(true)}
            />

            <View style={styles.separator} />

            <SettingsRow
              title="Password"
              subtitle="Change password"
              preIcon={{
                familyIcon: FontAwesome,
                name: "lock",
              }}
              onPress={() => setIsChangePasswordVisible(true)}
            />
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={styles.settingsSectionTitle}>APP PREFERENCES</ThemedText>
          <View style={styles.settingsSection}>
            <SettingsRow
              title="Weekly Target"
              subtitle={`Change weekly target from ${currentWeeklyTarget} days`}
              preIcon={{
                familyIcon: Feather,
                name: "target",
              }}
              onPress={() => setIsChangeWeeklyTargetVisible(true)}
            />

            <View style={styles.separator} />

            <SettingsRow
              title={
                hasPendingDeloadWeek
                  ? "Deload Week Scheduled"
                  : isDeloadWeekOnCooldown
                    ? "Deload Week Cooldown"
                    : "Deload Week"
              }
              subtitle={
                hasPendingDeloadWeek
                  ? "Your deload week starts next Monday at 4:00 AM. Tap to cancel."
                  : isDeloadWeekOnCooldown
                    ? deloadCooldownLabel
                    : "Declare next week a deload week for recovery"
              }
              preIcon={{
                familyIcon: MaterialIcons,
                name: "restore",
              }}
              postIcon={
                hasPendingDeloadWeek
                  ? { familyIcon: Feather, name: "clock" }
                  : isDeloadWeekOnCooldown
                    ? { familyIcon: Feather, name: "lock" }
                    : undefined
              }
              onPress={
                hasPendingDeloadWeek ? showCancelDeloadWeekConfirmationModal : showDeloadWeekConfirmationModal
              }
              disabled={
                isStartingDeloadWeek || isCancelingDeloadWeek || (!hasPendingDeloadWeek && !isDeloadWeekEligible)
              }
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 5,
              borderColor: Colors.cardBorder,
              backgroundColor: "#15181c49",
              padding: 16,
              borderRadius: Border.radius.md,
              borderWidth: 1,
            }}
          >
            <FontAwesome5 name="info-circle" size={12} color={Colors.accent.secondary} />
            <ThemedText style={styles.settingsInfoText}>
              Weekly target changes and Deload week take effect the following Monday at 4:00 AM
            </ThemedText>
          </View>
        </View>

        <View style={{ gap: 8 }}>
          <ThemedText style={styles.settingsSectionTitle}>LEGAL & DATA</ThemedText>
          <View style={styles.settingsSection}>
            <SettingsRow
              title="Terms of Service"
              onPress={() => {}}
              titleStyle={{ color: Colors.text.secondary }}
              postIcon={{
                familyIcon: MaterialIcons,
                name: "open-in-new",
                color: Colors.icon,
              }}
            />

            <View style={styles.separator} />

            <SettingsRow
              title="Privacy Policy"
              onPress={() => {}}
              titleStyle={{ color: Colors.text.secondary }}
              postIcon={{
                familyIcon: MaterialIcons,
                name: "open-in-new",
                color: Colors.icon,
              }}
            />

            {/* <View style={styles.separator} />

            <SettingsRow
              title="Delete Account"
              onPress={showDeleteAccountWarning}
              titleStyle={{ color: Colors.error }}
              postIcon={{
                familyIcon: Entypo,
                name: "chevron-right",
                color: Colors.error,
              }}
            /> */}
          </View>
        </View>

        <View style={styles.settingsSection}>
          <SettingsRow
            title="Sign Out"
            onPress={signout}
            preIcon={{
              familyIcon: MaterialIcons,
              name: "logout",
            }}
          />
        </View>
      </ScrollView>

      <ChangeEmailSheet visible={isChangeEmailVisible} onClose={() => setIsChangeEmailVisible(false)} />

      <ChangePasswordModal visible={isChangePasswordVisible} onClose={() => setIsChangePasswordVisible(false)} />

      <ChangeWeeklyTargetModal
        visible={isChangeWeeklyTargetVisible}
        currentTarget={currentWeeklyTarget}
        isSubmitting={isChangingWeeklyTarget}
        onClose={() => setIsChangeWeeklyTargetVisible(false)}
        onSave={saveWeeklyTarget}
        pendingWeeklyTargetChange={user?.pendingWeeklyTargetDays ?? null}
      />

      <DeleteAccountModal
        visible={isDeleteAccountVisible}
        isDeleting={false}
        // isDeleting={isDeletingAccount}
        onClose={() => setIsDeleteAccountVisible(false)}
        onDeleteAccount={deleteAccount}
      />
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

  settingsSection: {
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.cardBorder,
    borderWidth: 1,
    alignItems: "center",
  },
  settingsSectionTitle: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 10,
    color: Colors.icon,
  },
  settingsSectionRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 16,
    justifyContent: "space-between",
    width: "100%",
  },
  settingsRowTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.bold,
  },
  settingsRowSubtitle: {
    fontSize: 10,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
  separator: {
    backgroundColor: Colors.cardBorder,
    height: 1,
    width: "90%",
  },
  settingsRowIcon: {
    backgroundColor: Colors.background.primary,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    borderColor: Colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  settingsInfoText: {
    fontSize: 10,
    color: Colors.icon,
    flexShrink: 1,
    lineHeight: 18,
  },
});
