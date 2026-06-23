import { ThemedText } from "@/components/themed-text";
import Input from "@/components/ui/Input";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import WorkoutHistoryMonthJumpModal from "@/components/workout/workoutHistory/WorkoutHistoryMonthJumpModal";
import WorkoutHistorySectionHeader from "@/components/workout/workoutHistory/WorkoutHistorySectionHeader";
import { Border, Colors, Typography } from "@/constants/theme";
import { Workout } from "@/functions/src/types/workout";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { getFirestoreMonthSectionLabel } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { RelativePathString, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type WorkoutHistorySection = {
  title: string;
  data: Workout[];
};

const ViewHistory = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: RelativePathString }>();

  const [query, setQuery] = useState("");
  const [isMonthJumpModalVisible, setIsMonthJumpModalVisible] = useState(false);

  const sectionListRef = useRef<SectionList<Workout, WorkoutHistorySection>>(null);

  const { data, error, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserWorkoutsInfinite(id, 20);

  const workouts = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const filteredWorkouts = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return workouts;

    return workouts.filter((workout) => {
      const workoutName =
        workout.name || `${firstLetterToUpperCase(workout.workoutType ?? "")} Workout`;

      return workoutName.toLowerCase().includes(normalized);
    });
  }, [workouts, query]);

  const sections = useMemo<WorkoutHistorySection[]>(() => {
    const grouped = filteredWorkouts.reduce<Record<string, Workout[]>>((acc, workout) => {
      const key = getFirestoreMonthSectionLabel(workout.completedAt);

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(workout);
      return acc;
    }, {});

    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data,
    }));
  }, [filteredWorkouts]);

  const handleOpenMonthJumpModal = () => {
    if (!sections.length) return;
    setIsMonthJumpModalVisible(true);
  };

  const handleJumpToSection = (sectionIndex: number) => {
    sectionListRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      animated: true,
      viewOffset: 0,
    });

    setIsMonthJumpModalVisible(false);
  };

  const handleBack = () => {
    if (returnTo) {
      router.replace(returnTo);
      return;
    }

    router.back();
  };

  if (!id) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconContainer} onPress={handleBack}>
            <FontAwesome6 name="arrow-left" size={14} color={Colors.gray} />
          </TouchableOpacity>
          <View style={{ justifyContent: "center", alignItems: "center", gap: 2 }}>
            <ThemedText style={styles.headerText}>WORKOUT HISTORY</ThemedText>
          </View>
        </View>
        <View style={styles.container}>
          <View style={styles.controlsContainer}>
            <Input
              placeholder="Search workouts"
              placeholderTextColor={Colors.icon}
              value={query}
              onChangeText={setQuery}
              containerStyle={{ marginBottom: 16, borderColor: Colors.inputBorder }}
              preIcon={{
                familyIcon: MaterialIcons,
                name: "search",
              }}
            />

            <TouchableOpacity onPress={handleOpenMonthJumpModal} style={styles.jumpToDateButton}>
              <MaterialIcons name="calendar-today" size={14} color={Colors.icon} />
              <ThemedText style={styles.datePickerText}>Jump to Month</ThemedText>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View style={styles.messageContainer}>
              <ThemedText>Something went wrong loading workouts.</ThemedText>
            </View>
          ) : (
            <SectionList
              ref={sectionListRef}
              sections={sections}
              keyExtractor={(item) => item.sessionId}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={false}
              showsVerticalScrollIndicator={false}
              onEndReachedThreshold={0.5}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              renderSectionHeader={({ section }) => (
                <WorkoutHistorySectionHeader title={section.title} />
              )}
              renderItem={({ item }) => (
                <WorkoutHistoryCard
                  workout={item}
                  onPress={(workout) => {
                    router.push(`/(workoutHistoryDetails)/${workout.sessionId}`);
                  }}
                />
              )}
              SectionSeparatorComponent={() => <View style={styles.sectionSeparator} />}
              ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.messageContainer}>
                  <ThemedText>No workouts found.</ThemedText>
                </View>
              }
            />
          )}

          <WorkoutHistoryMonthJumpModal
            visible={isMonthJumpModalVisible}
            months={sections.map((section) => section.title)}
            onClose={() => setIsMonthJumpModalVisible(false)}
            onSelectMonth={handleJumpToSection}
          />
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ViewHistory;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    backgroundColor: Colors.background.primary,
    flex: 1,
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#15181c49",
    height: 65,
  },
  headerText: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.4,
    fontFamily: Typography.family.primary.semibold,
  },
  iconContainer: {
    position: "absolute",
    left: 24,
    backgroundColor: Colors.background.secondary,
    width: 40,
    height: 40,
    borderRadius: Border.radius.md,
    justifyContent: "center",
    alignItems: "center",
    borderColor: Colors.cardBorder,
    borderWidth: 1,
  },
  controlsContainer: {
    marginTop: 24,
    gap: 8,
    paddingBottom: 8,
  },
  centerState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messageContainer: {
    paddingTop: 24,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Typography.family.primary.bold,
  },
  datePickerText: {
    fontSize: 14,
    fontFamily: Typography.family.primary.semibold,
    color: Colors.icon,
  },
  jumpToDateButton: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionSeparator: {
    height: 20,
  },
  itemSeparator: {
    height: 12,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
