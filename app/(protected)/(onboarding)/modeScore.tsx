import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome5, FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_GRADIENT_COLOR = Colors.accent.primary;
const SECONDARY_GRADIENT_COLOR = Colors.background.primary;

const BUILTMODE_REWARDS_POINTS = ["Consistency", "Structure", "Recovery", "Follow-through"];
const IT_DOES_NOT_REWARD_POINTS = ["Overtraining", "Volume Inflation", "Intensity exaggeration"];

const ModeScore = () => {
  const router = useRouter();
  const { createUserProfile, isCreatingUser } = useOnboardingStore();
  const { signout } = useAuthStore();
  const { setUser } = useUserStore();

  const SectionTitle = ({ title }: { title: string }) => {
    return (
      <View style={styles.subtitleContainer}>
        <View style={styles.subtitleAccent} />
        <ThemedText style={styles.subtitle}>{title}</ThemedText>
      </View>
    );
  };

  const BulletPoint = ({ text }: { text: string }) => {
    return (
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            backgroundColor: Colors.accent.primary,
            width: 5,
            height: 5,
            borderRadius: 5 / 2,
          }}
        />
        <ThemedText style={{ fontSize: 14, color: Colors.gray }}>{text}</ThemedText>
      </View>
    );
  };

  function ErrorAlert() {
    return Alert.alert("Oops", "There was an error onboarding you.", [
      { text: "Try again", onPress: handleEnterModePressed },
      {
        text: "Cancel",
        onPress: () => {
          signout();
          router.replace("/(auth)/signin");
        },
        style: "destructive",
      },
    ]);
  }

  const handleEnterModePressed = async () => {
    try {
      const user = await createUserProfile();
      if (user) {
        setUser(user);
        router.replace("/(protected)/(tabs)");
      } else {
        ErrorAlert();
      }
    } catch (error) {
      console.error("Error creating user profile: ", error);
      ErrorAlert();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background.primary }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.container}>
          <View>
            <View style={styles.titleContainer}>
              <ThemedText type="subtitle">WHAT IS{"\n"}MODE SCORE?</ThemedText>
              <LinearGradient
                colors={[SECONDARY_GRADIENT_COLOR, PRIMARY_GRADIENT_COLOR]}
                start={{ x: 1.0, y: 0.5 }}
                end={{ x: 0.0, y: 0.5 }}
                style={styles.titleUnderline}
              />
            </View>

            <ThemedText style={styles.subText}>A reflection of your discipline.</ThemedText>
          </View>
          <View style={styles.mainContentContainer}>
            <View>
              <SectionTitle title="WHAT IT MEASURES" />
              <ThemedText style={{ fontSize: 14, color: Colors.gray, lineHeight: 22 }}>
                Mode Score reflects how consistently you meet your declared training standard.
              </ThemedText>
              <View style={{ gap: 5, marginTop: 15 }}>
                <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                  It does not measure intensity.
                </ThemedText>
                <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                  It measures adherence.
                </ThemedText>
              </View>
            </View>

            <View>
              <SectionTitle title="WHAT IMPACTS YOUR SCORE" />
              <View style={{ gap: 20 }}>
                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardTitleContainer}>
                    <ThemedText style={styles.sectionCardTitle}>Weekly Streak</ThemedText>
                    <View
                      style={{
                        padding: 9,
                        backgroundColor: Colors.background.primary,
                        borderRadius: Border.radius.sm,
                      }}
                    >
                      <Ionicons name="flame" size={14} color={Colors.accent.primary} />
                    </View>
                  </View>
                  <ThemedText style={{ fontSize: 14, color: Colors.gray, lineHeight: 22 }}>
                    Consecutive weeks meeting your training target.
                  </ThemedText>
                  <View style={{ gap: 5, marginTop: 20 }}>
                    <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                      Missed weeks reset streak.
                    </ThemedText>
                    <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                      Deload weeks pause streak.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardTitleContainer}>
                    <ThemedText style={styles.sectionCardTitle}>Weekly Adherence</ThemedText>
                    <View
                      style={{
                        padding: 9,
                        backgroundColor: Colors.background.primary,
                        borderRadius: Border.radius.sm,
                      }}
                    >
                      <MaterialIcons name="check" size={14} color={Colors.accent.primary} />
                    </View>
                  </View>
                  <ThemedText style={{ fontSize: 14, color: Colors.gray, lineHeight: 22 }}>
                    Workouts completed relative to your weekly target.
                  </ThemedText>
                  <View style={{ gap: 5, marginTop: 20 }}>
                    <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                      Exceeding your target does not increase score.
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.sectionCard}>
                  <View style={styles.sectionCardTitleContainer}>
                    <ThemedText style={styles.sectionCardTitle}>30-Day Activity</ThemedText>
                    <View
                      style={{
                        padding: 9,
                        backgroundColor: Colors.background.primary,
                        borderRadius: Border.radius.sm,
                      }}
                    >
                      <FontAwesome5 name="calendar-alt" size={14} color={Colors.accent.primary} />
                    </View>
                  </View>
                  <ThemedText style={{ fontSize: 14, color: Colors.gray, lineHeight: 22 }}>
                    Your training frequency over the past 30 days.
                  </ThemedText>
                </View>
              </View>
            </View>

            <View>
              <SectionTitle title="PRINCIPLES" />
              <View style={{ marginTop: 10 }}>
                <ThemedText style={{ fontFamily: Typography.family.primary.bold, fontSize: 14 }}>
                  BuiltMode rewards:
                </ThemedText>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {BUILTMODE_REWARDS_POINTS.map((point) => (
                    <BulletPoint key={point} text={point} />
                  ))}
                </View>
              </View>
              <View style={{ marginTop: 24 }}>
                <ThemedText style={{ fontFamily: Typography.family.primary.bold, fontSize: 14 }}>
                  It does not reward:
                </ThemedText>
                <View style={{ gap: 10, marginTop: 12 }}>
                  {IT_DOES_NOT_REWARD_POINTS.map((point) => (
                    <BulletPoint key={point} text={point} />
                  ))}
                </View>
              </View>
            </View>

            <View>
              <SectionTitle title="YOUR SNAPSHOT" />
              <View
                style={{
                  backgroundColor: Colors.background.secondary,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: Colors.cardBorder,
                  borderRadius: Border.radius.md,
                }}
              >
                <View>
                  <ThemedText style={{ fontSize: 12, color: Colors.icon, letterSpacing: 0.6 }}>
                    WEEKLY STREAK
                  </ThemedText>
                  <View
                    style={{
                      paddingTop: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 20,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontFamily: Typography.family.tertiary.regular,
                        fontSize: 30,
                        color: Colors.accent.primary,
                      }}
                    >
                      8
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: Colors.gray }}>Weeks</ThemedText>
                  </View>
                </View>

                <View
                  style={{ borderTopColor: Colors.cardBorder, borderTopWidth: 1, paddingTop: 24 }}
                >
                  <ThemedText style={{ fontSize: 12, color: Colors.icon, letterSpacing: 0.6 }}>
                    THIS WEEK
                  </ThemedText>
                  <View
                    style={{
                      paddingTop: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: 20,
                    }}
                  >
                    <ThemedText
                      style={{
                        fontFamily: Typography.family.tertiary.regular,
                        fontSize: 30,
                      }}
                    >
                      3
                      <ThemedText
                        style={{
                          fontFamily: Typography.family.tertiary.regular,
                          color: Colors.icon,
                          fontSize: 18,
                        }}
                      >
                        {" "}
                        / 5
                      </ThemedText>
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: Colors.gray }}>Sessions</ThemedText>
                  </View>
                </View>

                <View
                  style={{ borderTopColor: Colors.cardBorder, borderTopWidth: 1, paddingTop: 24 }}
                >
                  <ThemedText style={{ fontSize: 12, color: Colors.icon, letterSpacing: 0.6 }}>
                    30-DAY ACTIVITY
                  </ThemedText>
                  <View
                    style={{
                      paddingTop: 8,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <ThemedText
                      style={{
                        fontFamily: Typography.family.tertiary.regular,
                        fontSize: 30,
                      }}
                    >
                      72
                      <ThemedText
                        style={{
                          fontFamily: Typography.family.tertiary.regular,
                          color: Colors.icon,
                          fontSize: 18,
                        }}
                      >
                        {" "}
                        %
                      </ThemedText>
                    </ThemedText>
                    <ThemedText style={{ fontSize: 14, color: Colors.gray }}>Adherence</ThemedText>
                  </View>
                </View>
              </View>
            </View>

            <ThemedText style={{ color: Colors.icon, fontSize: 12, textAlign: "center" }}>
              No calculated score breakdown shown.
            </ThemedText>

            <View
              style={{
                backgroundColor: Colors.background.secondary,
                borderWidth: 1,
                borderColor: "#c6a34a38",
                padding: 24,
                borderRadius: Border.radius.md,
                gap: 24,
                marginBottom: 40,
              }}
            >
              <View style={{ gap: 12 }}>
                <ThemedText style={{ color: Colors.icon, fontSize: 12, letterSpacing: 0.6 }}>
                  THE GOAL OF THIS SCREEN IS NOT:
                </ThemedText>
                <ThemedText
                  style={{
                    textDecorationLine: "line-through",
                    fontFamily: Typography.family.primary.bold,
                    fontSize: 18,
                    color: Colors.gray,
                  }}
                >
                  "Maximize your score."
                </ThemedText>
              </View>

              <View style={{ gap: 8 }}>
                <ThemedText style={{ color: Colors.icon, fontSize: 12, letterSpacing: 0.6 }}>
                  IT IS:
                </ThemedText>
                <ThemedText
                  style={{
                    fontFamily: Typography.family.tertiary.regular,
                    fontSize: 20,
                    color: Colors.accent.primary,
                    lineHeight: 25,
                  }}
                >
                  Understand what matters.
                </ThemedText>
              </View>

              <View style={{ gap: 5 }}>
                <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
                  The system remains credible.
                </ThemedText>
                <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>Not hackable.</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.footerContainer}>
            <ThemedButton
              title="ENTER MODE"
              fontSize={Typography.size.sm}
              onPress={handleEnterModePressed}
              postIcon={{
                familyIcon: FontAwesome6,
                name: "arrow-right",
              }}
              disabled={isCreatingUser}
            />
          </View>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ModeScore;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 32,
  },
  titleContainer: {
    marginBottom: 24,
  },
  titleUnderline: {
    height: 1.5,
    width: 50,
    marginTop: 10,
  },
  subText: {
    color: Colors.icon,
    fontSize: 14,
    lineHeight: 22,
  },
  mainContentContainer: {
    flex: 1,
    gap: 32,
    paddingTop: 32,
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  subtitleAccent: {
    height: 24,
    width: 3,
    backgroundColor: Colors.accent.primary,
    borderRadius: Border.radius.sm,
  },
  subtitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 12,
    color: Colors.gray,
    letterSpacing: 1.2,
  },
  sectionCard: {
    backgroundColor: Colors.background.secondary,
    padding: 20,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionCardTitleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontFamily: Typography.family.primary.bold,
  },
  footerContainer: {
    gap: 32,
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
});
