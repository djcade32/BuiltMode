import AccountabilitySummaryWidget from "@/components/profile/AccountabilitySummaryWidget";
import ThisWeekWidget from "@/components/profile/ThisWeekWidget";
import { ThemedText } from "@/components/themed-text";
import Avatar from "@/components/ui/Avatar";
import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
import { Border, Colors, Typography } from "@/constants/theme";
import { useQuery } from "@/hooks/useQuery";
import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
import { fetchUserStats, fetchUserWeekAggregate } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { getWeekId } from "@builtmode/shared";
import { FontAwesome5, FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const profile = () => {
  const { user } = useUserStore();
  const uid = user?.uid ?? "";
  const usersHomeTimezone = user?.homeTimezone;
  const router = useRouter();

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
    queryKey: ["user-stats", uid],
    queryFn: fetchUserStats,
    params: { uid },
    enabled: !!uid,
  });

  const { data: userWeekAggregate, isLoading: isLoadingUserWeekAggregate } = useQuery({
    queryKey: [
      "user-week-aggregate",
      usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
      uid,
    ],
    queryFn: fetchUserWeekAggregate,
    params: {
      uid,
      weekId: usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
    },
    enabled: !!usersHomeTimezone,
  });

  const { data: recentWorkouts, isLoading: isLoadingRecentWorkouts } = useUserWorkoutsInfinite(
    uid,
    3,
  );

  const accountabilitySummaryData = useMemo(() => {
    if (!userStats) return null;
    return {
      modeScore: userStats.modeScore ?? 0,
      consistency: userStats.activity30DayRate,
      adherence: userStats.last30DayWeeklyAdherenceRate,
      bestStreak: userStats.bestWeekStreak,
      targetsMet: userStats.totalTargetsMet,
      totalWorkouts: userStats.totalWorkoutsLogged,
    };
  }, [userStats]);

  const userWeekAggregateData = useMemo(() => {
    return {
      activeDays: userWeekAggregate?.activeDaysThisWeek || 0,
      targetDays: userWeekAggregate?.weeklyTargetDays || userStats?.weeklyTargetDays || 0,
      currentStreakWeek: userWeekAggregate?.streakWeeks || userStats?.currentWeekStreak || 0,
      isPracticeWeek: user?.isPracticeWeek || !userWeekAggregate?.isOfficialWeek || false,
    };
  }, [userWeekAggregate, userStats, user]);

  const recentWorkoutsData = useMemo(() => {
    return (recentWorkouts?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
  }, [recentWorkouts]);

  const isLoadingData = isLoadingUserStats || isLoadingUserWeekAggregate || isLoadingRecentWorkouts;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* BUTTON PLACEHOLDER */}
        <View style={{ width: 40, height: 40 }} />

        <View style={{ justifyContent: "center", alignItems: "center", gap: 2 }}>
          <ThemedText style={styles.headerText}>
            {user?.username?.toLocaleLowerCase() ?? ""}
          </ThemedText>
        </View>

        {/* BUTTON PLACEHOLDER */}
        <TouchableOpacity style={styles.iconContainer} onPress={() => router.push("/settings")}>
          <MaterialIcons name="settings" size={20} color={Colors.gray} />
        </TouchableOpacity>
      </View>
      {isLoadingData ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.icon} />
        </View>
      ) : !uid ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>Profile unavailable</ThemedText>
        </View>
      ) : (
        <ScrollView>
          <View style={styles.mainContentContainer}>
            {/* USER INFO */}
            <View style={styles.userInfoContainer}>
              <Avatar
                avatarUrl={user?.avatarUrl ?? ""}
                displayName={user?.displayName ?? "?"}
                size={65}
                containerStyle={styles.avatar}
              />

              <View style={{ gap: 3, flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ThemedText style={styles.displayName}>{user?.displayName}</ThemedText>
                <ThemedText style={styles.username}>
                  @{user?.username?.toLocaleLowerCase() ?? ""}
                </ThemedText>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {userWeekAggregateData.currentStreakWeek > 0 && (
                  <View style={styles.streakWeekButton}>
                    <View
                      style={{
                        justifyContent: "center",
                        alignItems: "center",
                        flexDirection: "row",
                        gap: 5,
                      }}
                    >
                      <FontAwesome5 name="fire-alt" size={12} color={Colors.accent.primary} />
                      <ThemedText style={styles.streakWeekButtonText}>ON STREAK</ThemedText>
                    </View>
                  </View>
                )}
                {user?.isPracticeWeek && (
                  <View style={styles.practiceWeekBadge}>
                    <ThemedText style={styles.practiceWeekBadgeText}>PRACTICE WEEK</ThemedText>
                  </View>
                )}
              </View>
            </View>

            {/* ACCOUNTABILITY SUMMARY */}
            <AccountabilitySummaryWidget data={accountabilitySummaryData} />
            {/* THIS WEEK */}
            <ThisWeekWidget data={userWeekAggregateData} />
            {/* RECENT WORKOUTS */}
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <ThemedText style={styles.recentWorkoutsTitle}>RECENT WORKOUTS</ThemedText>
                <TouchableOpacity
                  style={{ alignItems: "center", flexDirection: "row" }}
                  hitSlop={15}
                  onPress={() =>
                    router.push({
                      pathname: "/(protected)/(tabs)/(workout)/(viewHistory)/[id]",
                      params: {
                        id: uid,
                        returnTo: "/(protected)/(tabs)/profile",
                      },
                    })
                  }
                >
                  <ThemedText style={styles.recentWorkoutsTitle}>VIEW ALL</ThemedText>
                  <FontAwesome6 name="arrow-right" size={9} color={Colors.icon} />
                </TouchableOpacity>
              </View>
              <View style={{ gap: 12, marginVertical: 10 }}>
                {recentWorkoutsData.map((workout) => (
                  <WorkoutHistoryCard
                    key={workout.sessionId}
                    workout={workout}
                    onPress={() =>
                      router.push({
                        pathname:
                          "/(protected)/(tabs)/(workout)/(workoutHistoryDetails)/[sessionId]",
                        params: {
                          sessionId: workout.sessionId,
                          returnTo: "/(protected)/(tabs)/profile",
                        },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default profile;

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

  mainContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  avatar: {
    outlineWidth: 7,
    outlineColor: "#2A2E3534",
    borderWidth: 3,
    borderColor: Colors.inputBorder,
  },
  userInfoContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  displayName: {
    fontFamily: Typography.family.primary.bold,
    fontSize: 22,
    letterSpacing: -0.66,
  },
  username: {
    fontFamily: Typography.family.secondary.medium,
    fontSize: 12,
    color: Colors.icon,
  },
  unfriendButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#c6a34a38",
    borderWidth: 1,
    borderColor: "#c6a34a52",
    borderRadius: 9999,
  },
  unfriendButtonText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
    color: Colors.accent.primary,
  },
  practiceWeekBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#4A6C8C38",
    borderWidth: 1,
    borderColor: "#4A6C8C52",
    borderRadius: 9999,
  },
  practiceWeekBadgeText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
    color: Colors.accent.secondary,
  },
  streakWeekButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: 9999,
  },
  streakWeekButtonText: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 12,
  },
  recentWorkoutsTitle: {
    fontFamily: Typography.family.secondary.semibold,
    fontSize: 9,
    letterSpacing: 1.98,
    color: Colors.icon,
  },
});

// import AccountabilitySummaryWidget from "@/components/profile/AccountabilitySummaryWidget";
// import ThisWeekWidget from "@/components/profile/ThisWeekWidget";
// import { ThemedText } from "@/components/themed-text";
// import Avatar from "@/components/ui/Avatar";
// import ThemedButton from "@/components/ui/ThemedButton";
// import WorkoutHistoryCard from "@/components/workout/workoutHistory/WorkoutHistoryCard";
// import { Border, Colors, Typography } from "@/constants/theme";
// import { useQuery } from "@/hooks/useQuery";
// import { useUserWorkoutsInfinite } from "@/hooks/workouts/useUserWorkoutsInfinite";
// import { fetchUserStats, fetchUserWeekAggregate } from "@/services/user-service";
// import { useUserStore } from "@/stores/user-store";
// import { getWeekId } from "@builtmode/shared";
// import { FontAwesome5, FontAwesome6, Ionicons, MaterialIcons } from "@expo/vector-icons";
// import { CameraType, CameraView } from "expo-camera";
// import * as ImagePicker from "expo-image-picker";
// import { useCameraPermissions } from "expo-image-picker";
// import { useRouter } from "expo-router";
// import React, { useMemo, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Image,
//   Pressable,
//   ScrollView,
//   StyleSheet,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";

// const profile = () => {
//   const { user } = useUserStore();
//   const uid = user?.uid ?? "";
//   const usersHomeTimezone = user?.homeTimezone;
//   const router = useRouter();
//   const [facing, setFacing] = useState<CameraType>("back");

//   const [showCameraView, setShowCameraView] = useState(false);
//   const [selectedPhoto, setSelectedPhoto] = useState<string | undefined>(undefined);
//   const [savedPhoto, setSavedPhoto] = useState<string | undefined>(undefined);

//   const [permission, requestPermission] = useCameraPermissions();
//   const cameraRef = useRef<CameraView>(null);

//   const { data: userStats, isLoading: isLoadingUserStats } = useQuery({
//     queryKey: ["user-stats", uid],
//     queryFn: fetchUserStats,
//     params: { uid },
//     enabled: !!uid,
//   });

//   const { data: userWeekAggregate, isLoading: isLoadingUserWeekAggregate } = useQuery({
//     queryKey: [
//       "user-week-aggregate",
//       usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
//       uid,
//     ],
//     queryFn: fetchUserWeekAggregate,
//     params: {
//       uid,
//       weekId: usersHomeTimezone ? getWeekId(new Date(), usersHomeTimezone) : "",
//     },
//     enabled: !!usersHomeTimezone,
//   });

//   const { data: recentWorkouts, isLoading: isLoadingRecentWorkouts } = useUserWorkoutsInfinite(
//     uid,
//     3,
//   );

//   const accountabilitySummaryData = useMemo(() => {
//     if (!userStats) return null;
//     return {
//       modeScore: userStats.modeScore ?? 0,
//       consistency: userStats.activity30DayRate,
//       adherence: userStats.last30DayWeeklyAdherenceRate,
//       bestStreak: userStats.bestWeekStreak,
//       targetsMet: userStats.totalTargetsMet,
//       totalWorkouts: userStats.totalWorkoutsLogged,
//     };
//   }, [userStats]);

//   const userWeekAggregateData = useMemo(() => {
//     return {
//       activeDays: userWeekAggregate?.activeDaysThisWeek || 0,
//       targetDays: userWeekAggregate?.weeklyTargetDays || userStats?.weeklyTargetDays || 0,
//       currentStreakWeek: userWeekAggregate?.streakWeeks || userStats?.currentWeekStreak || 0,
//       isPracticeWeek: user?.isPracticeWeek || !userWeekAggregate?.isOfficialWeek || false,
//     };
//   }, [userWeekAggregate, userStats, user]);

//   const recentWorkoutsData = useMemo(() => {
//     return (recentWorkouts?.pages.flatMap((page) => page.items) ?? []).slice(0, 3);
//   }, [recentWorkouts]);

//   const askForCameraPermissions = async () => {
//     if (!permission) return;
//     if (permission && !permission.granted && permission.canAskAgain) {
//       await requestPermission();
//     }
//   };

//   const selectFromGallery = async () => {
//     const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

//     if (!permissionResult.granted) {
//       Alert.alert("Permission required", "Permission to access the media library is required.");
//       return;
//     }

//     let result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ["images"],
//       allowsEditing: true,
//       aspect: [1, 1],
//     });
//     if (!result.assets) return;
//     setSavedPhoto(result.assets[0].uri);
//   };

//   const toggleCameraFacing = () => {
//     setFacing((current) => (current === "back" ? "front" : "back"));
//   };

//   const takePhoto = async () => {
//     try {
//       const photo = await cameraRef.current?.takePictureAsync();
//       if (photo?.uri) {
//         setSelectedPhoto(photo.uri);
//       }
//     } catch (error) {
//       console.error("Failed to capture photo:", error);
//       Alert.alert("Error", "Failed to capture photo. Please try again.");
//     }
//   };

//   const handleAvatarButtonPressed = () => {
//     Alert.alert("Change Profile Photo", "", [
//       {
//         text: "Take Photo",
//         onPress: async () => {
//           await askForCameraPermissions();
//           setShowCameraView(true);
//         },
//       },
//       {
//         text: "Select Photo",
//         onPress: () => selectFromGallery(),
//       },
//       {
//         text: "Cancel",
//         style: "destructive",
//       },
//     ]);
//   };

//   const renderPhotoPreview = (
//     <View style={{ flex: 1 }}>
//       <View style={styles.topBar}>
//         <Ionicons
//           name="close"
//           size={40}
//           color="white"
//           onPress={() => setSelectedPhoto(undefined)}
//           suppressHighlighting
//         />
//       </View>
//       <Image source={{ uri: selectedPhoto }} style={{ flex: 1 }} />
//       <View style={styles.photoPreviewFooter}>
//         <ThemedButton
//           title="SAVE PHOTO"
//           preIcon={{
//             familyIcon: MaterialIcons,
//             name: "save",
//             size: 18,
//           }}
//           fontSize={Typography.size.sm}
//           disabled={false}
//           onPress={() => {
//             setSavedPhoto(selectedPhoto);
//             setShowCameraView(false);
//             setSelectedPhoto(undefined);
//             setFacing("back");
//           }}
//         />
//       </View>
//     </View>
//   );

//   const renderCameraView = (
//     <>
//       {selectedPhoto ? (
//         renderPhotoPreview
//       ) : (
//         <View style={{ flex: 1 }}>
//           <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
//           <View style={styles.topBar}>
//             <Ionicons
//               name="close"
//               size={40}
//               color="white"
//               onPress={() => {
//                 setFacing("back");
//                 setShowCameraView(false);
//               }}
//               suppressHighlighting
//             />
//           </View>
//           <View style={styles.bottomControls}>
//             <TouchableOpacity style={styles.recordButton} onPress={takePhoto} />
//             <Ionicons
//               name="camera-reverse"
//               size={40}
//               color="white"
//               onPress={toggleCameraFacing}
//               suppressHighlighting
//               style={styles.reverseCameraIcon}
//             />
//           </View>
//         </View>
//       )}
//     </>
//   );

//   const handleUploadPhotoPressed = () => {
//     if (!savedPhoto) return;
//   };

//   const isLoadingData = isLoadingUserStats || isLoadingUserWeekAggregate || isLoadingRecentWorkouts;

//   return (
//     <>
//       {showCameraView && renderCameraView}
//       {!showCameraView && !selectedPhoto && (
//         <SafeAreaView style={styles.container} edges={["top"]}>
//           {/* HEADER */}
//           <View style={styles.header}>
//             {/* BUTTON PLACEHOLDER */}
//             <View style={{ width: 40, height: 40 }} />

//             <View style={{ justifyContent: "center", alignItems: "center", gap: 2 }}>
//               <ThemedText style={styles.headerText}>
//                 {user?.username?.toLocaleLowerCase() ?? ""}
//               </ThemedText>
//             </View>

//             {/* BUTTON PLACEHOLDER */}
//             <TouchableOpacity style={styles.iconContainer} onPress={() => router.push("/settings")}>
//               <MaterialIcons name="settings" size={20} color={Colors.gray} />
//             </TouchableOpacity>
//           </View>
//           {isLoadingData ? (
//             <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//               <ActivityIndicator color={Colors.icon} />
//             </View>
//           ) : !uid ? (
//             <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
//               <ThemedText style={{ color: Colors.icon, fontSize: 12 }}>
//                 Profile unavailable
//               </ThemedText>
//             </View>
//           ) : (
//             <ScrollView>
//               <View style={styles.mainContentContainer}>
//                 {/* USER INFO */}
//                 <View style={styles.userInfoContainer}>
//                   <View style={{ position: "relative" }}>
//                     <Avatar
//                       avatarUrl={selectedPhoto ? selectedPhoto : (user?.avatarUrl ?? "")}
//                       displayName={user?.displayName ?? "?"}
//                       size={65}
//                       containerStyle={styles.avatar}
//                     />
//                     <Pressable
//                       style={styles.avatarCircleButton}
//                       onPress={handleAvatarButtonPressed}
//                       hitSlop={15}
//                     >
//                       <FontAwesome6 name="camera" size={10} color={Colors.background.primary} />
//                     </Pressable>
//                   </View>
//                   <View style={{ gap: 3, flex: 1, justifyContent: "center", alignItems: "center" }}>
//                     <ThemedText style={styles.displayName}>{user?.displayName}</ThemedText>
//                     <ThemedText style={styles.username}>
//                       @{user?.username?.toLocaleLowerCase() ?? ""}
//                     </ThemedText>
//                   </View>
//                   <View style={{ flexDirection: "row", gap: 10 }}>
//                     {userWeekAggregateData.currentStreakWeek > 0 && (
//                       <View style={styles.streakWeekButton}>
//                         <View
//                           style={{
//                             justifyContent: "center",
//                             alignItems: "center",
//                             flexDirection: "row",
//                             gap: 5,
//                           }}
//                         >
//                           <FontAwesome5 name="fire-alt" size={12} color={Colors.accent.primary} />
//                           <ThemedText style={styles.streakWeekButtonText}>ON STREAK</ThemedText>
//                         </View>
//                       </View>
//                     )}
//                     {user?.isPracticeWeek && (
//                       <View style={styles.practiceWeekBadge}>
//                         <ThemedText style={styles.practiceWeekBadgeText}>PRACTICE WEEK</ThemedText>
//                       </View>
//                     )}
//                   </View>
//                 </View>

//                 {/* ACCOUNTABILITY SUMMARY */}
//                 <AccountabilitySummaryWidget data={accountabilitySummaryData} />
//                 {/* THIS WEEK */}
//                 <ThisWeekWidget data={userWeekAggregateData} />
//                 {/* RECENT WORKOUTS */}
//                 <View>
//                   <View
//                     style={{
//                       flexDirection: "row",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                     }}
//                   >
//                     <ThemedText style={styles.recentWorkoutsTitle}>RECENT WORKOUTS</ThemedText>
//                     <TouchableOpacity
//                       style={{ alignItems: "center", flexDirection: "row" }}
//                       hitSlop={15}
//                       onPress={() =>
//                         router.push({
//                           pathname: "/(protected)/(tabs)/(workout)/(viewHistory)/[id]",
//                           params: {
//                             id: uid,
//                             returnTo: "/(protected)/(tabs)/profile",
//                           },
//                         })
//                       }
//                     >
//                       <ThemedText style={styles.recentWorkoutsTitle}>VIEW ALL</ThemedText>
//                       <FontAwesome6 name="arrow-right" size={9} color={Colors.icon} />
//                     </TouchableOpacity>
//                   </View>
//                   <View style={{ gap: 12, marginVertical: 10 }}>
//                     {recentWorkoutsData.map((workout) => (
//                       <WorkoutHistoryCard
//                         key={workout.sessionId}
//                         workout={workout}
//                         onPress={() =>
//                           router.push({
//                             pathname:
//                               "/(protected)/(tabs)/(workout)/(workoutHistoryDetails)/[sessionId]",
//                             params: {
//                               sessionId: workout.sessionId,
//                               returnTo: "/(protected)/(tabs)/profile",
//                             },
//                           })
//                         }
//                       />
//                     ))}
//                   </View>
//                 </View>
//               </View>
//             </ScrollView>
//           )}
//         </SafeAreaView>
//       )}
//     </>
//   );
// };

// export default profile;

// const styles = StyleSheet.create({
//   container: {
//     backgroundColor: Colors.background.primary,
//     flex: 1,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     paddingHorizontal: 24,
//     borderBottomWidth: 1,
//     borderBottomColor: "#15181c49",
//     alignItems: "center",
//     height: 65,
//   },
//   headerText: {
//     fontSize: 16,
//     lineHeight: 24,
//     letterSpacing: 0.4,
//     fontFamily: Typography.family.primary.semibold,
//   },
//   iconContainer: {
//     width: 40,
//     height: 40,
//     backgroundColor: Colors.background.secondary,
//     borderColor: Colors.cardBorder,
//     borderWidth: 1,
//     borderRadius: Border.radius.md,
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   mainContentContainer: {
//     paddingHorizontal: 24,
//     paddingTop: 24,
//     gap: 16,
//   },
//   avatar: {
//     outlineWidth: 7,
//     outlineColor: "#2A2E3534",
//     borderWidth: 3,
//     borderColor: Colors.inputBorder,
//   },
//   userInfoContainer: {
//     justifyContent: "center",
//     alignItems: "center",
//     gap: 16,
//   },
//   displayName: {
//     fontFamily: Typography.family.primary.bold,
//     fontSize: 22,
//     letterSpacing: -0.66,
//   },
//   username: {
//     fontFamily: Typography.family.secondary.medium,
//     fontSize: 12,
//     color: Colors.icon,
//   },
//   unfriendButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     backgroundColor: "#c6a34a38",
//     borderWidth: 1,
//     borderColor: "#c6a34a52",
//     borderRadius: 9999,
//   },
//   unfriendButtonText: {
//     fontFamily: Typography.family.secondary.semibold,
//     fontSize: 12,
//     color: Colors.accent.primary,
//   },
//   practiceWeekBadge: {
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     backgroundColor: "#4A6C8C38",
//     borderWidth: 1,
//     borderColor: "#4A6C8C52",
//     borderRadius: 9999,
//   },
//   practiceWeekBadgeText: {
//     fontFamily: Typography.family.secondary.semibold,
//     fontSize: 12,
//     color: Colors.accent.secondary,
//   },
//   streakWeekButton: {
//     paddingVertical: 6,
//     paddingHorizontal: 10,
//     backgroundColor: Colors.background.secondary,
//     borderWidth: 1,
//     borderColor: Colors.cardBorder,
//     borderRadius: 9999,
//   },
//   streakWeekButtonText: {
//     fontFamily: Typography.family.secondary.semibold,
//     fontSize: 12,
//   },
//   recentWorkoutsTitle: {
//     fontFamily: Typography.family.secondary.semibold,
//     fontSize: 9,
//     letterSpacing: 1.98,
//     color: Colors.icon,
//   },

//   avatarCircleButton: {
//     backgroundColor: Colors.accent.primary,
//     width: 20,
//     height: 20,
//     borderRadius: 20 / 2,
//     justifyContent: "center",
//     alignItems: "center",
//     position: "absolute",
//     bottom: -5,
//     right: -5,
//   },

//   camera: {
//     flex: 1,
//   },
//   topBar: {
//     position: "absolute",
//     top: 55,
//     left: 15,
//     zIndex: 100,
//   },
//   bottomControls: {
//     position: "absolute",
//     bottom: 20,
//     flexDirection: "row",
//     alignItems: "center",
//     width: "100%",
//     justifyContent: "center",
//   },
//   recordButton: {
//     width: 80,
//     height: 80,
//     backgroundColor: "white",
//     borderRadius: 40,
//   },
//   reverseCameraIcon: {
//     position: "absolute",
//     bottom: 20,
//     right: 30,
//   },
//   photoPreviewFooter: {
//     position: "absolute",
//     bottom: 45,
//     justifyContent: "center",
//     alignItems: "center",
//     width: "100%",
//   },
// });
