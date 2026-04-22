import { ThemedText } from "@/components/themed-text";
import { EXERCISES_GROUPED } from "@/constants/exercises";
import { Border, Colors, Typography } from "@/constants/theme";
import { Exercise, ExerciseMetricType, ExerciseType } from "@/packages/shared/src";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { v4 as uuidv4 } from "uuid";
import { ThemedView } from "../themed-view";
import Input from "../ui/Input";

const SECTION_TITLES = ["strength", "conditioning", "cardio"];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
};

const AddExerciseSheet = ({ visible, onClose, onSelect }: Props) => {
  const [query, setQuery] = useState("");

  const filteredExerciseGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const initalGroups: { title: string; data: any }[] = [];

    SECTION_TITLES.forEach((title) => {
      if (EXERCISES_GROUPED[title]) {
        initalGroups.push({
          title: title.toLocaleUpperCase(),
          data: EXERCISES_GROUPED[title],
        });
      }
    });

    if (!normalized) return initalGroups;

    const filteredGroups: { title: string; data: any }[] = [];

    SECTION_TITLES.forEach((title) => {
      if (EXERCISES_GROUPED[title]) {
        const data = EXERCISES_GROUPED[title].filter((exercise) =>
          exercise.name.toLowerCase().includes(normalized),
        );

        data.length > 0 &&
          filteredGroups.push({
            title: title.toLocaleUpperCase(),
            data,
          });
      }
    });
    return filteredGroups;
  }, [query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const buildExerciseObject = ({ name, type }: { name: string; type: ExerciseType }) => {
    // Get metricType
    let metricType: ExerciseMetricType = "weight_reps";
    switch (type) {
      case "strength":
        metricType = "weight_reps";
        break;

      case "conditioning":
        metricType = "reps_only";
        break;

      case "cardio":
        metricType = "distance";
        break;

      default:
        metricType = "other";
        break;
    }
    const id = `${uuidv4()}-exercise`;
    const exercise: Exercise = {
      id,
      name,
      metricType,
      sets: [],
    };
    return exercise;
  };

  const handleSelect = (item: { name: string; type: ExerciseType }) => {
    const exercise = buildExerciseObject(item);

    onSelect(exercise);
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <ThemedText type="defaultSemiBold">ADD EXERCISE</ThemedText>
              <TouchableOpacity onPress={handleClose} style={{ width: 50 }}>
                <ThemedText style={styles.closeText}>CLOSE</ThemedText>
              </TouchableOpacity>
            </View>

            <Input
              placeholder="Search exercises"
              placeholderTextColor={Colors.icon}
              value={query}
              onChangeText={setQuery}
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
                <TouchableOpacity style={[styles.row]} onPress={() => handleSelect(item)}>
                  <ThemedText>{item.name}</ThemedText>
                  <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.icon} />
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
              keyboardShouldPersistTaps="handled"
            />
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
  },
});

// TODO: Uncomment when time to let user add new exercises that are not listed
// import { ThemedText } from "@/components/themed-text";
// import { EXERCISES_GROUPED } from "@/constants/exercises";
// import { Border, Colors, Typography } from "@/constants/theme";
// import { Entypo, MaterialIcons } from "@expo/vector-icons";
// import React, { useMemo, useState } from "react";
// import { Modal, Pressable, SectionList, StyleSheet, TouchableOpacity, View } from "react-native";
// import { ThemedView } from "../themed-view";
// import Input from "../ui/Input";

// const SECTION_TITLES = ["strength", "conditioning", "cardio"];

// type Props = {
//   visible: boolean;
//   onClose: () => void;
//   onSelect: () => void;
// };

// const AddExerciseSheet = ({ visible, onClose, onSelect }: Props) => {
//   const [query, setQuery] = useState("");
//   const [showAddExerciseView, setShowAddExerciseView] = useState(false);

//   const filteredExerciseGroups = useMemo(() => {
//     const normalized = query.trim().toLowerCase();

//     const initalGroups: { title: string; data: any }[] = [];

//     SECTION_TITLES.forEach((title) => {
//       if (EXERCISES_GROUPED[title]) {
//         initalGroups.push({
//           title: title.toLocaleUpperCase(),
//           data: EXERCISES_GROUPED[title],
//         });
//       }
//     });

//     if (!normalized) return initalGroups;

//     const filteredGroups: { title: string; data: any }[] = [];

//     SECTION_TITLES.forEach((title) => {
//       if (EXERCISES_GROUPED[title]) {
//         const data = EXERCISES_GROUPED[title].filter((exercise) =>
//           exercise.name.toLowerCase().includes(normalized),
//         );

//         data.length > 0 &&
//           filteredGroups.push({
//             title: title.toLocaleUpperCase(),
//             data,
//           });
//       }
//     });
//     return filteredGroups;
//   }, [query]);

//   const handleClose = () => {
//     setQuery("");
//     setShowAddExerciseView(false);
//     onClose();
//   };

//   return (
//     <Modal
//       visible={visible}
//       transparent
//       animationType="slide"
//       presentationStyle="overFullScreen"
//       onRequestClose={handleClose}
//     >
//       <Pressable style={styles.backdrop} onPress={handleClose}>
//         <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
//           <View style={styles.handle} />
//           {showAddExerciseView ? (
//             <>
//               <View style={styles.newExerciseHeader}>
//                 <TouchableOpacity
//                   onPress={() => setShowAddExerciseView(false)}
//                   style={{ position: "absolute", zIndex: 100 }}
//                 >
//                   <MaterialIcons name="keyboard-arrow-left" size={24} color={Colors.icon} />
//                 </TouchableOpacity>

//                 <ThemedText type="defaultSemiBold" style={{ textAlign: "center" }}>
//                   NEW EXERCISE
//                 </ThemedText>
//               </View>
//             </>
//           ) : (
//             <>
//               <View style={styles.header}>
//                 <TouchableOpacity
//                   style={{ width: 50 }}
//                   onPress={() => setShowAddExerciseView(true)}
//                 >
//                   <Entypo name="plus" size={20} color={Colors.accent.primary} />
//                 </TouchableOpacity>

//                 <ThemedText type="defaultSemiBold">ADD EXERCISE</ThemedText>
//                 <TouchableOpacity onPress={handleClose} style={{ width: 50 }}>
//                   <ThemedText style={styles.closeText}>CLOSE</ThemedText>
//                 </TouchableOpacity>
//               </View>

//               <Input
//                 placeholder="Search exercises"
//                 placeholderTextColor={Colors.icon}
//                 value={query}
//                 onChangeText={setQuery}
//                 containerStyle={{
//                   marginBottom: 16,
//                 }}
//                 preIcon={{
//                   familyIcon: MaterialIcons,
//                   name: "search",
//                 }}
//               />

//               <SectionList
//                 showsVerticalScrollIndicator={false}
//                 sections={filteredExerciseGroups}
//                 keyExtractor={(item, index) => `${item.name}_${index}`}
//                 renderSectionHeader={({ section }) => (
//                   <ThemedView style={{ marginBottom: 5, paddingTop: 15 }}>
//                     <ThemedText style={styles.exerciseSectionSubtitle}>{section.title}</ThemedText>
//                   </ThemedView>
//                 )}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity style={[styles.row]} onPress={() => {}}>
//                     <ThemedText>{item.name}</ThemedText>
//                     <MaterialIcons name="keyboard-arrow-right" size={24} color={Colors.icon} />
//                   </TouchableOpacity>
//                 )}
//                 contentContainerStyle={{ paddingBottom: 24 }}
//               />
//             </>
//           )}
//         </Pressable>
//       </Pressable>
//     </Modal>
//   );
// };

// export default AddExerciseSheet;

// const styles = StyleSheet.create({
//   backdrop: {
//     flex: 1,
//     justifyContent: "flex-end",
//     backgroundColor: "rgba(0,0,0,0.45)",
//   },
//   sheet: {
//     height: "78%",
//     backgroundColor: Colors.background.primary,
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     paddingTop: 12,
//     paddingHorizontal: 20,
//     borderTopWidth: 1,
//     borderColor: Colors.inputBorder,
//   },
//   handle: {
//     width: 42,
//     height: 4,
//     borderRadius: 999,
//     backgroundColor: Colors.inputBorder,
//     alignSelf: "center",
//     marginBottom: 18,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },

//   closeText: {
//     color: Colors.accent.primary,
//     fontSize: Typography.size.xs,
//     textAlign: "right",
//   },
//   listContent: {
//     paddingBottom: 20,
//   },
//   row: {
//     minHeight: 62,
//     paddingVertical: 14,
//     paddingHorizontal: 14,
//     borderWidth: 1,
//     borderColor: Colors.inputBorder,
//     borderRadius: Border.radius.md,
//     backgroundColor: Colors.background.secondary,
//     marginBottom: 10,
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//   },
//   exerciseSectionSubtitle: {
//     color: Colors.icon,
//     fontSize: 12,
//     fontFamily: Typography.family.primary.semibold,
//     letterSpacing: 1.8,
//     marginBottom: 12,
//   },

//   newExerciseHeader: {
//     position: "relative",
//   },
// });
