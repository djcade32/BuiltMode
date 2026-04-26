import { ThemedText } from "@/components/themed-text";
import ThemedButton from "@/components/ui/ThemedButton";
import { Border, Colors, Typography } from "@/constants/theme";
import { useUserTemplatesInfinite } from "@/hooks/workouts/useUserTemplatesInfinite";
import { useUserStore } from "@/stores/user-store";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TEMPLATES = [
  {
    title: "Push Day",
    numOfExercises: 5,
  },
  {
    title: "Pull Day",
    numOfExercises: 7,
  },
  {
    title: "Shoulders Workout",
    numOfExercises: 3,
  },
];

type TemplateItemProps = {
  icon: { iconFamily: any; name: string };
  title: string;
  numOfExercises: number;
};

const TemplateItem = ({ icon, title, numOfExercises }: TemplateItemProps) => {
  // const renderIcon = React.createElement(icon.iconFamily, {
  //   name: icon.name,
  //   size: 17,
  //   color: Colors.accent.primary,
  // });
  return (
    <TouchableOpacity style={styles.templateItemContainer}>
      {/* <View style={styles.templateItemIcon}>{renderIcon}</View> */}
      <View
        style={{
          justifyContent: "space-between",
          flexDirection: "row",
          flex: 1,
          alignItems: "center",
        }}
      >
        <View>
          <ThemedText style={styles.templateItemTitle}>{title}</ThemedText>
          <ThemedText
            style={styles.templateItemNumOfExercises}
          >{`${numOfExercises} exercises`}</ThemedText>
        </View>
        <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.icon} />
      </View>
    </TouchableOpacity>
  );
};

const log = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const uid = user?.uid ?? "";

  const { data, error, isLoading } = useUserTemplatesInfinite(uid, 3);

  const recentTemplates = useMemo(() => {
    return (data?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
  }, [data]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <ThemedText type="title">LOG</ThemedText>
        <ThemedText style={styles.subtitle}>Build your session. Then start.</ThemedText>
      </View>
      <ThemedButton
        title="BUILD WORKOUT"
        fontSize={Typography.size.sm}
        onPress={() => router.push("/(protected)/(tabs)/(workout)/buildWorkout")}
      />
      <View style={styles.templatesSection}>
        <ThemedText style={styles.templatesSectionTitle}>RECENT TEMPLATES</ThemedText>
        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <ThemedText>Something went wrong loading templates.</ThemedText>
          </View>
        ) : !data ? (
          <View style={styles.messageContainer}>
            <ThemedText>Templates not found.</ThemedText>
          </View>
        ) : (
          <>
            <View style={styles.templatesContainer}>
              {recentTemplates.map((template, index) => (
                <TemplateItem
                  key={index}
                  title={template.name}
                  numOfExercises={template.exercises.length}
                  icon={{
                    iconFamily: FontAwesome6,
                    name: "dumbbell",
                  }}
                />
              ))}
            </View>
          </>
        )}
      </View>
      <Link href={"/(protected)/(tabs)/(workout)/viewHistory"} asChild style={{ marginTop: 48 }}>
        <TouchableOpacity>
          <ThemedText style={styles.viewHistoryButton}>VIEW HISTORY</ThemedText>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
};

export default log;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  titleContainer: {
    gap: 8,
    paddingBottom: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.icon,
    fontFamily: Typography.family.primary.medium,
  },
  templatesSection: {
    paddingTop: 48,
    minHeight: 200,
  },
  templatesSectionTitle: {
    fontSize: 12,
    color: Colors.icon,
    fontFamily: Typography.family.primary.semibold,
  },
  templatesContainer: {
    paddingTop: 16,
    gap: 12,
  },
  templateItemContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    gap: 12,
    alignItems: "center",
  },
  templateItemIcon: {
    backgroundColor: "#c6a34a38",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: Border.radius.md,
  },
  templateItemTitle: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
  },
  templateItemNumOfExercises: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
  viewHistoryButton: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 14,
    color: Colors.icon,
    textAlign: "center",
    letterSpacing: 0.7,
  },

  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    paddingTop: 24,
  },
});
