import { ThemedText } from "@/components/themed-text";
import { EXERCISES_GROUPED } from "@/constants/exercises";
import { Border, Colors, Typography } from "@/constants/theme";
import { firstLetterToUpperCase } from "@/lib/utils/string";
import { Exercise, ExerciseMetricType, ExerciseType, ExerciseUnit } from "@builtmode/shared";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import { ThemedView } from "../themed-view";
import Input from "../ui/Input";
import ThemedButton from "../ui/ThemedButton";

const SECTION_TITLES = ["strength", "conditioning", "cardio"];
const METRICS = ["Weight + Reps", "Reps Only", "Duration", "Distance"];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

const AddExerciseSheet = ({ visible, onClose, onSelect }: Props) => {
  const [query, setQuery] = useState("");
  const [newExerciseInput, setNewExerciseInput] = useState("");
  const [showAddExerciseView, setShowAddExerciseView] = useState(false);
  const [newExerciseWorkoutType, setNewExerciseWorkoutType] = useState(SECTION_TITLES[0]);
  const [newExerciseMetric, setNewExerciseMetric] = useState(METRICS[0]);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setQuery("");
    }
  }, [visible]);

  const filteredExerciseGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const initialGroups: { title: string; data: any }[] = [];

    SECTION_TITLES.forEach((title) => {
      if (EXERCISES_GROUPED[title]) {
        const sortedExercises = [...EXERCISES_GROUPED[title]].sort((a, b) => a.name.localeCompare(b.name));

        initialGroups.push({
          title: title.toUpperCase(),
          data: sortedExercises,
        });
      }
    });

    if (!normalized) return initialGroups;

    const filteredGroups: { title: string; data: any }[] = [];

    SECTION_TITLES.forEach((title) => {
      if (EXERCISES_GROUPED[title]) {
        const data = EXERCISES_GROUPED[title]
          .filter((exercise) => exercise.name.toLowerCase().includes(normalized))
          .sort((a, b) => a.name.localeCompare(b.name));

        if (data.length > 0) {
          filteredGroups.push({
            title: title.toUpperCase(),
            data,
          });
        }
      }
    });

    return filteredGroups;
  }, [query]);

  const handleClose = () => {
    isClosingRef.current = true;
    setQuery("");
    setNewExerciseInput("");
    setNewExerciseWorkoutType(SECTION_TITLES[0]);
    setNewExerciseMetric(METRICS[0]);
    setShowAddExerciseView(false);
    onClose();
  };

  const buildExerciseObject = (item: { name: string; type: ExerciseType; metricType: ExerciseMetricType }) => {
    const { name, metricType } = item;
    const id = `${uuidv4()}-exercise`;
    let units: ExerciseUnit | null = null;
    if (metricType === "distance") {
      units = "mi";
    } else if (metricType === "weight_reps") {
      units = "lbs";
    }

    const exercise: Exercise = {
      id,
      name,
      metricType,
      units,
      sets: [{ id: `${uuidv4()}-set` }, { id: `${uuidv4()}-set` }, { id: `${uuidv4()}-set` }],
    };
    return exercise;
  };

  const handleSelect = (
    item: {
      name: string;
      type: ExerciseType;
      metricType: ExerciseMetricType;
    },
    buildFunc: (item: { name: string; type: ExerciseType; metricType: ExerciseMetricType }) => Exercise,
  ) => {
    const exercise = buildFunc(item);

    onSelect(exercise);
    handleClose();
  };

  const getExerciseMetric = (type: string): ExerciseMetricType => {
    switch (type) {
      case "Weight + Reps":
        return "weight_reps";
      case "Reps Only":
        return "reps_only";
      case "Distance":
        return "distance";
      case "Duration":
        return "duration";
      default:
        return "weight_reps";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            {showAddExerciseView ? (
              <View style={{ flex: 1 }}>
                <View style={styles.newExerciseHeader}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowAddExerciseView(false);
                      setNewExerciseWorkoutType(SECTION_TITLES[0]);
                      setNewExerciseMetric(METRICS[0]);
                      setNewExerciseInput("");
                    }}
                    style={{ position: "absolute", zIndex: 100 }}
                  >
                    <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.icon} />
                  </TouchableOpacity>

                  <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
                    NEW EXERCISE
                  </ThemedText>
                </View>

                <View>
                  <ThemedText style={styles.exerciseSectionSubtitle}>EXERCISE NAME</ThemedText>
                  <Input
                    autoCapitalize="words"
                    placeholder="e.g., Cable Tricep Pushdowns"
                    placeholderTextColor={Colors.icon}
                    value={newExerciseInput}
                    onChangeText={(text) => {
                      if (isClosingRef.current) return;
                      setNewExerciseInput(text);
                    }}
                    containerStyle={{
                      marginBottom: 16,
                    }}
                  />
                </View>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >
                  <View>
                    <ThemedText style={styles.exerciseSectionSubtitle}>EXERCISE TYPE</ThemedText>
                    {SECTION_TITLES.map((title) => (
                      <Pressable
                        key={title}
                        style={[
                          styles.row,
                          {
                            justifyContent: "center",
                            borderColor:
                              newExerciseWorkoutType === title ? Colors.accent.primary : Colors.cardBorder,
                          },
                        ]}
                        onPress={() => setNewExerciseWorkoutType(title)}
                      >
                        <ThemedText style={{ fontFamily: Typography.family.primary.bold }}>
                          {firstLetterToUpperCase(title)}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ marginTop: 16 }}>
                    <ThemedText style={styles.exerciseSectionSubtitle}>EXERCISE METRICS</ThemedText>
                    {METRICS.map((metric) => (
                      <Pressable
                        key={metric}
                        style={[
                          styles.row,
                          {
                            justifyContent: "center",
                            borderColor: newExerciseMetric === metric ? Colors.accent.primary : Colors.cardBorder,
                          },
                        ]}
                        onPress={() => setNewExerciseMetric(metric)}
                      >
                        <ThemedText style={{ fontFamily: Typography.family.primary.bold }}>{metric}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ marginTop: 20 }}>
                    <ThemedButton
                      title="ADD EXERCISE"
                      onPress={() => {
                        const trimmedName = newExerciseInput.trim();
                        if (!trimmedName) return;

                        handleSelect(
                          {
                            name: trimmedName,
                            type: newExerciseWorkoutType.toLocaleLowerCase() as ExerciseType,
                            metricType: getExerciseMetric(newExerciseMetric),
                          },
                          buildExerciseObject,
                        );
                        setNewExerciseInput("");
                        setNewExerciseMetric(METRICS[0]);
                        setNewExerciseWorkoutType(SECTION_TITLES[0]);
                      }}
                    />
                  </View>
                </ScrollView>
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <TouchableOpacity style={{ width: 50 }} onPress={() => setShowAddExerciseView(true)}>
                    <Entypo name="plus" size={20} color={Colors.accent.primary} />
                  </TouchableOpacity>

                  <ThemedText type="defaultSemiBold">ADD EXERCISE</ThemedText>
                  <TouchableOpacity onPress={handleClose} style={{ width: 50 }}>
                    <ThemedText style={styles.closeText}>CLOSE</ThemedText>
                  </TouchableOpacity>
                </View>

                <Input
                  autoCapitalize="words"
                  placeholder="Search exercises"
                  placeholderTextColor={Colors.icon}
                  value={query}
                  onChangeText={(text) => {
                    if (isClosingRef.current) return;
                    setQuery(text);
                  }}
                  containerStyle={{
                    marginBottom: 16,
                  }}
                  preIcon={{
                    familyIcon: MaterialIcons,
                    name: "search",
                  }}
                />

                <SectionList
                  showsVerticalScrollIndicator={false}
                  sections={filteredExerciseGroups}
                  keyExtractor={(item, index) => `${item.name}_${index}`}
                  renderSectionHeader={({ section }) => (
                    <ThemedView style={{ marginBottom: 5, paddingTop: 15 }}>
                      <ThemedText style={styles.exerciseSectionSubtitle}>{section.title}</ThemedText>
                    </ThemedView>
                  )}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.row} onPress={() => handleSelect(item, buildExerciseObject)}>
                      <ThemedText>{item.name}</ThemedText>
                      <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.icon} />
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={[
                    {
                      paddingBottom: 24,
                    },
                  ]}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={() => (
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <ThemedText style={{ color: Colors.icon }}>Exercise not listed</ThemedText>
                      <ThemedButton
                        title="CREATE EXERCISE"
                        onPress={() => {
                          setNewExerciseInput(query);
                          setShowAddExerciseView(true);
                          setQuery("");
                        }}
                      />
                    </View>
                  )}
                />
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddExerciseSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  sheet: {
    height: "78%",
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: Colors.inputBorder,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: Colors.inputBorder,
    alignSelf: "center",
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  closeText: {
    color: Colors.accent.primary,
    fontSize: Typography.size.xs,
    textAlign: "right",
  },
  listContent: {
    paddingBottom: 20,
  },
  row: {
    minHeight: 62,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.background.secondary,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseSectionSubtitle: {
    color: Colors.icon,
    fontSize: 12,
    fontFamily: Typography.family.primary.semibold,
    letterSpacing: 1.8,
    marginBottom: 12,
  },

  newExerciseHeader: {
    position: "relative",
    marginBottom: 16,
  },

  notListedButtonContainer: {
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Border.radius.md,
    padding: 16,
    marginHorizontal: 24,
  },
  notListedButton: {
    fontFamily: Typography.family.primary.semibold,
    fontSize: 12,
    color: Colors.gray,
    textAlign: "center",
    letterSpacing: 1.2,
  },
});
