import SettingsRow from "@/components/settings/SettingsRow";
import TimezonePickerSheet from "@/components/onboarding/TimezonePickerSheet";
import { ThemedText } from "@/components/themed-text";
import { Colors, Typography } from "@/constants/theme";
import dayjs from "@/lib/dayjs";
import { updateHomeTimezone } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { Feather } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Alert, Platform, StyleSheet, TouchableOpacity, View } from "react-native";

export default function HomeTimezoneSetting() {
  const user = useUserStore((state) => state.user);
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedTimezone = useRef<string | null>(null);
  const submitting = useRef(false);
  const { mutateAsync, isPending } = useMutation({ mutationFn: updateHomeTimezone });
  if (!user) return null;

  const pendingAt = user.pendingHomeTimezoneStartsAt;
  const pendingMillis = pendingAt
    ? ("seconds" in pendingAt ? pendingAt.seconds : pendingAt._seconds) * 1000
    : null;
  const formatDate = (millis: number) => `${dayjs(millis).tz(user.homeTimezone).format("MMM D, YYYY [at] h:mm A")} (${user.homeTimezone})`;

  const save = async (homeTimezone: string) => {
    if (submitting.current || useUserStore.getState().user?.uid !== user.uid) return;
    submitting.current = true;
    const uid = user.uid;
    try {
      const result = await mutateAsync({ homeTimezone });
      const currentUser = useUserStore.getState().user;
      if (currentUser?.uid !== uid) return;
      // The callable returns the saved schedule, so the row updates before success is shown.
      useUserStore.getState().setUser({
        ...currentUser,
        pendingHomeTimezone: result.effectiveAt === null ? null : result.homeTimezone,
        pendingHomeTimezoneWeekId: result.effectiveWeekId,
        pendingHomeTimezoneStartsAt: result.effectiveAt === null ? null : {
          _seconds: Math.floor(result.effectiveAt / 1000), _nanoseconds: 0,
        },
      });
      Alert.alert(
        result.effectiveAt === null ? "Timezone Change Canceled" : "Timezone Change Scheduled",
        result.effectiveAt === null
          ? "Your home timezone will stay the same."
          : `Your home timezone will change to ${result.homeTimezone} on ${formatDate(result.effectiveAt)}. Previously logged workouts will stay unchanged.`,
      );
    } catch (error) {
      Alert.alert("Unable to Update Timezone", error instanceof Error ? error.message : "Please try again.");
    } finally {
      submitting.current = false;
    }
  };

  const showConfirmation = () => {
    const timezone = selectedTimezone.current;
    selectedTimezone.current = null;
    if (!timezone || timezone === user.homeTimezone || timezone === user.pendingHomeTimezone) return;

    Alert.alert(
      "Change Home Timezone?",
      `Change to ${timezone}? This takes effect after both timezones reach the next training week. A pending or active deload finishes first. Your workout history stays unchanged.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Schedule Change", onPress: () => void save(timezone) },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <SettingsRow
        title="Home Timezone"
        subtitle={user.homeTimezone}
        preIcon={{ familyIcon: Feather, name: "globe" }}
        postIcon={user.pendingHomeTimezone ? { familyIcon: Feather, name: "clock" } : undefined}
        disabled={isPending}
        onPress={() => setPickerVisible(true)}
      >
        {user.pendingHomeTimezone && (
          <ThemedText style={styles.pending}>
            Pending: {user.pendingHomeTimezone}{pendingMillis !== null ? `\nScheduled for ${formatDate(pendingMillis)}` : ""}
          </ThemedText>
        )}
        {isPending && <ThemedText style={styles.subtitle}>Saving timezone change...</ThemedText>}
      </SettingsRow>

      {user.pendingHomeTimezone && (
        <TouchableOpacity style={styles.cancel} disabled={isPending} onPress={() => void save(user.homeTimezone)} accessibilityRole="button">
          <ThemedText style={styles.action}>Cancel Pending Timezone Change</ThemedText>
        </TouchableOpacity>
      )}
      <TimezonePickerSheet
        visible={pickerVisible}
        selectedTimezone={user.pendingHomeTimezone ?? user.homeTimezone}
        onClose={() => {
          setPickerVisible(false);
          // iOS cannot present an Alert until the native sheet finishes dismissing.
          if (Platform.OS !== "ios") showConfirmation();
        }}
        onDismiss={showConfirmation}
        onSelect={(timezone) => { selectedTimezone.current = timezone.id; }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  subtitle: { fontSize: 10, fontFamily: Typography.family.secondary.regular, color: Colors.icon },
  pending: { fontSize: 10, fontFamily: Typography.family.secondary.regular, color: Colors.accent.secondary },
  action: { fontSize: 13, color: Colors.accent.primary },
  cancel: { paddingHorizontal: 16, paddingBottom: 16 },
});
