import { ThemedText } from "@/components/themed-text";
import DropdownMenu, { DropdownMenuOption } from "@/components/ui/DropdownMenu";
import Input from "@/components/ui/Input";
import { Border, Colors, Typography } from "@/constants/theme";
import { Template } from "@/functions/src/types/template";
import { useUserTemplatesInfinite } from "@/hooks/workouts/useUserTemplatesInfinite";
import { formatFirestoreTimestamp } from "@/lib/utils/date";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { deleteTemplate } from "@/services/template-service";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
type TemplateItemProps = {
  template: Template;
  onPress: (workout: Template) => void;
  onDelete?: () => void;
};

const TemplateItem = ({ template, onPress, onDelete }: TemplateItemProps) => {
  const { name, exercises, workoutType, completedAt } = template;
  const dropDownOptions: DropdownMenuOption[] = useMemo(
    () => [
      {
        onSelect: onDelete,
        text: "DELETE",
        icon: <FontAwesome6 name="trash" size={10} color={Colors.icon} />,
      },
    ],
    [],
  );

  return (
    <TouchableOpacity style={styles.templateItemContainer} onPress={() => onPress(template)}>
      <DropdownMenu
        options={dropDownOptions}
        menuOptionsCustomStyles={{ optionsContainer: { width: 100 } }}
        menuTriggerStyle={{ position: "absolute", alignSelf: "flex-end", right: 10 }}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 10 }}>
        <ThemedText style={styles.templateItemTitle} ellipsizeMode="tail" numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText style={styles.templateItemDate}>
          {formatFirestoreTimestamp(completedAt)}
        </ThemedText>
      </View>
      <ThemedText
        style={[styles.templateItemNumOfExercises, { marginBottom: 5, color: Colors.gray }]}
      >{`${exercises.length} exercises`}</ThemedText>
      <ThemedText style={styles.templateItemNumOfExercises}>
        {firstLetterToUpperCase(workoutType ?? "other")}
      </ThemedText>
    </TouchableOpacity>
  );
};

const ViewTemplates = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { setInitialWorkout } = useWorkoutStore();

  const [query, setQuery] = useState("");

  const uid = user?.uid ?? "";

  const { data, error, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useUserTemplatesInfinite(uid, 20);

  const { mutate: deleteTemplateFunc, isPending } = useMutation({
    mutationFn: async (id: string) => {
      await deleteTemplate(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
    onError: () => {
      Alert.alert("Error", "Something went wrong. Try again.");
    },
  });

  const templates = useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const filteredTemplates = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return templates;

    return templates.filter((workout) => {
      const workoutName =
        workout.name || `${firstLetterToUpperCase(workout.workoutType ?? "")} Workout`;

      return workoutName.toLowerCase().includes(normalized);
    });
  }, [templates, query]);

  const handleTemplatePress = (template: Template) => {
    setInitialWorkout({
      name: template.name ?? "",
      exercises: template.exercises,
      workoutType: template.workoutType ?? "other",
    });

    router.push("/(protected)/(tabs)/(workout)/buildWorkout");
  };

  if (!uid) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background.primary }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerContainer}>
          <Pressable onPress={() => router.back()} hitSlop={15}>
            <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.icon} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>TEMPLATES</ThemedText>
        </View>

        <View style={styles.controlsContainer}>
          <Input
            placeholder="Search templates"
            placeholderTextColor={Colors.icon}
            value={query}
            onChangeText={setQuery}
            containerStyle={{ marginBottom: 16 }}
            preIcon={{
              familyIcon: MaterialIcons,
              name: "search",
            }}
          />
        </View>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.messageContainer}>
            <ThemedText>Something went wrong loading templates.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            onEndReachedThreshold={0.5}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            renderItem={({ item }) => (
              <TemplateItem
                template={item}
                onPress={(template) => handleTemplatePress(template)}
                onDelete={() => deleteTemplateFunc(item.id)}
              />
            )}
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
                <ThemedText>No templates found.</ThemedText>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ViewTemplates;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    backgroundColor: Colors.background.primary,
    flex: 1,
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

  // Template Item CSS
  templateItemContainer: {
    padding: 16,
    backgroundColor: Colors.background.secondary,
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  templateItemIcon: {
    backgroundColor: "#c6a34a38",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: Border.radius.md,
  },
  templateItemTitle: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 18,
    letterSpacing: 0.45,
    marginBottom: 4,
  },
  templateItemDate: {
    fontFamily: Typography.family.secondary.regular,
    fontSize: 10,
    color: Colors.icon,
  },
  templateItemNumOfExercises: {
    fontSize: 12,
    fontFamily: Typography.family.secondary.regular,
    color: Colors.icon,
  },
});
