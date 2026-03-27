import OnboardingView from "@/components/onboarding/OnboardingView";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import Input from "@/components/ui/Input";
import ThemedButton from "@/components/ui/ThemedButton";
import { Colors, Typography } from "@/constants/theme";
import { isUsernameAvailable } from "@/services/user-service";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { Entypo, MaterialIcons } from "@expo/vector-icons/";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ScrollView, StyleSheet, View } from "react-native";

const username = () => {
  const {
    control,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors },
  } = useForm<{ username: string }>({
    defaultValues: { username: "" },
  });
  const router = useRouter();
  const { setUsername, nextScreen } = useOnboardingStore();
  const { username } = useWatch({ control });
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);

  useEffect(() => {
    clearErrors("username");
    if (!username || username.length < 3 || !isValidUsername(username)) {
      setUsernameAvailable(false);
      return;
    }
    let cancelled = false;
    const candidate = username;

    const timeoutId = setTimeout(async () => {
      try {
        const isAvailable = await isUsernameAvailable(candidate);
        if (cancelled) return;
        setUsernameAvailable(isAvailable);
        if (!isAvailable) {
          setError("username", { message: "Username is taken" });
        }
      } catch {
        if (!cancelled) setUsernameAvailable(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [clearErrors, setError, username]);

  const renderPostIcon = () => {
    if (username && usernameAvailable) {
      return {
        familyIcon: MaterialIcons,
        name: "check",
        color: "green",
      };
    } else if (username && !usernameAvailable) {
      return {
        familyIcon: MaterialIcons,
        name: "close",
        color: "red",
      };
    }
    return;
  };

  const isValidUsername = (username: string) => {
    const regex = new RegExp("^[a-zA-Z0-9_.]{3,20}$");
    return regex.test(username);
  };

  const handleConfirmUsername = (data: { username: string }) => {
    const { username } = data;
    setUsername(username);
    nextScreen();
    router.replace("/(protected)/(onboarding)/goal");
  };

  return (
    <OnboardingView>
      <ThemedView style={styles.container}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, gap: 15 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View>
            <View style={styles.titleContainer}>
              <ThemedText type="title" style={{ textAlign: "center" }}>
                Choose Your{"\n"}Username
              </ThemedText>
              <ThemedText style={styles.subtitle}>This is how your circle will see you.</ThemedText>
            </View>
            <View style={{ gap: 12, marginTop: 65 }}>
              <Input
                name="username"
                control={control}
                errors={errors.username}
                preIcon={{
                  familyIcon: Entypo,
                  name: "email",
                  color: Colors.gray,
                }}
                postIcon={renderPostIcon()}
                placeholder="yourname"
                rules={{
                  pattern: /^[a-zA-Z0-9_.]{3,20}$/,
                }}
                changePostIconColorOnFocus={false}
              />
              {!errors.username?.message && username && usernameAvailable && (
                <ThemedText style={styles.usernameAvailableText}>Username is available</ThemedText>
              )}
              <ThemedText style={styles.infoText}>
                3-20 characters. Lowercase letters, numbers, underscore.
              </ThemedText>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <ThemedButton
              title="CONFIRM USERNAME"
              fontSize={Typography.size.sm}
              disabled={
                username?.trim().length === 0 ||
                !isValidUsername(username?.trim() ?? "") ||
                !usernameAvailable
              }
              onPress={handleSubmit(handleConfirmUsername)}
            />
            <ThemedText style={[styles.infoText, { textAlign: "center" }]}>
              You can't change this later.
            </ThemedText>
          </View>
        </ScrollView>
      </ThemedView>
    </OnboardingView>
  );
};

export default username;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    paddingHorizontal: 32,
  },
  titleContainer: {
    paddingTop: 95,
    gap: 12,
  },
  subtitle: {
    color: Colors.gray,
    textAlign: "center",
  },
  usernameAvailableText: {
    color: "green",
    fontSize: Typography.size.xs,
    marginTop: -5,
  },
  infoText: {
    fontSize: Typography.size.xs,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  footerContainer: {
    flex: 1,
    justifyContent: "flex-end",
    gap: 25,
    paddingBottom: 20,
  },
  accentArt1: {
    position: "absolute",
    height: 64,
    width: 4,
    left: 0,
    top: 300,
    opacity: 0.2,
    backgroundColor: Colors.accent.primary,
    zIndex: 100,
  },
  accentArt2: {
    position: "absolute",
    height: 48,
    width: 4,
    right: 0,
    bottom: 240,
    opacity: 0.2,
    backgroundColor: Colors.accent.secondary,
    zIndex: 100,
  },
});
