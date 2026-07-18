import ChangeEmailSheet from "@/components/settings/ChangeEmailModal";
import ChangePasswordModal from "@/components/settings/ChangePasswordModal";
import ChangeWeeklyTargetModal, { type WeeklyTargetDays } from "@/components/settings/ChangeWeeklyTargetModal";
import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import { Border, Colors, Typography } from "@/constants/theme";
import { useUpdateProfileAvatar } from "@/hooks/user/useUpdateProfileAvatar";
// import { deleteBuiltModeAccount } from "@/services/delete-account-service";
import { changeWeeklyTarget } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { useUserStore } from "@/stores/user-store";
import { Entypo, Feather, FontAwesome, FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
  onPress: () => void;
};

const SettingsRow = ({ title, subtitle, onPress, preIcon, postIcon, titleStyle }: SettingsRowProps) => {
  return (
    <TouchableOpacity style={styles.settingsSectionRow} onPress={onPress}>
      <View style={{ gap: 12, alignItems: "center", flexDirection: "row", flexShrink: 1 }}>
        {preIcon && (
          <View style={styles.settingsRowIcon}>
            {React.createElement(preIcon.familyIcon, {
              name: preIcon.name,
              size: 16,
              color: preIcon.color ? preIcon.color : Colors.gray,
            })}
          </View>
        )}
        <View style={{ gap: 5 }}>
          <ThemedText style={[styles.settingsRowTitle, titleStyle]}>{title}</ThemedText>
          {subtitle && <ThemedText style={styles.settingsRowSubtitle}>{subtitle}</ThemedText>}
        </View>
      </View>
      {postIcon ? (
        React.createElement(postIcon.familyIcon, {
          name: postIcon.name,
          size: 20,
          color: postIcon.color ? postIcon.color : Colors.gray,
        })
      ) : (
        <Entypo name="chevron-right" size={24} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );
};

const settings = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { signout, user: authUser } = useAuthStore();
  const uid = user?.uid ?? "";

  const [isChangeEmailVisible, setIsChangeEmailVisible] = useState(false);
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isChangeWeeklyTargetVisible, setIsChangeWeeklyTargetVisible] = useState(false);
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);

  const { mutateAsync: changeUserAvatarUrl, isPending: isChangingAvatar } = useUpdateProfileAvatar();
  const { mutateAsync: handleChangingWeeklyTarget, isPending: isChangingWeeklyTarget } = useMutation({
    mutationFn: changeWeeklyTarget,
  });

  // const { mutateAsync: handleDeletingAccount, isPending: isDeletingAccount } = useMutation({
  //   mutationFn: deleteBuiltModeAccount,
  //   onSuccess: async () => {
  //     setIsDeleteAccountVisible(false);
  //     await signout();
  //   },
  // });

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
              Weekly target changes take effect the following Monday at 4:00 AM
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
    width: "100%",
    justifyContent: "space-between",
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
  },
});
