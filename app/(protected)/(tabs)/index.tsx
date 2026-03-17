import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc";
import { Button, StyleSheet } from "react-native";

import { functions } from "@/lib/firebase";
import { CompleteWorkoutRequest, CompleteWorkoutResponse } from "@/packages/shared/src";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { httpsCallable } from "firebase/functions";
import { SafeAreaView } from "react-native-safe-area-context";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function HomeScreen() {
  const { activeWorkoutDraft, startWorkout } = useWorkoutStore();
  const { signout } = useAuthStore();
  const callFunction = async () => {
    console.log("calling function");

    try {
      // const createUserProfile = httpsCallable<CreateUserProfileRequest, CreateUserProfileResponse>(
      //   functions,
      //   "createUserProfile",
      // );

      // const user = await createUserProfile({
      //   username: "djcade32",
      //   displayName: "Norman",
      //   homeTimezone: "America/New_York",
      //   weeklyTargetDays: 4,
      // });
      // console.log("created user: ", user);

      const workout: CompleteWorkoutRequest = {
        sessionId: "session_9f82ab47",
        name: "Thursday Grinder",
        workoutType: "conditioning",
        exercises: [
          {
            id: "ex_1",
            name: "Back Squat",
            metricType: "weight_reps",
            notes: "Focus on depth",

            sets: [
              {
                id: "set_1",
                reps: 5,
                weight: 225,
                rpe: 7,
                completed: true,
              },
              {
                id: "set_2",
                reps: 5,
                weight: 245,
                rpe: 8,
                completed: true,
              },
              {
                id: "set_3",
                reps: 3,
                weight: 275,
                rpe: 9,
                completed: true,
              },
            ],
          },

          {
            id: "ex_2",
            name: "Pull Ups",
            metricType: "reps_only",

            sets: [
              {
                id: "set_4",
                reps: 12,
                completed: true,
              },
              {
                id: "set_5",
                reps: 10,
                completed: true,
              },
              {
                id: "set_6",
                reps: 8,
                completed: true,
              },
            ],
          },

          {
            id: "ex_3",
            name: "Assault Bike",
            metricType: "calories",

            sets: [
              {
                id: "set_7",
                calories: 20,
                durationSec: 60,
                completed: true,
              },
              {
                id: "set_8",
                calories: 18,
                durationSec: 60,
                completed: true,
              },
            ],
          },

          {
            id: "ex_4",
            name: "1 Mile Run",
            metricType: "distance",

            sets: [
              {
                id: "set_9",
                distanceMeters: 1609,
                durationSec: 480,
                completed: true,
              },
            ],
          },
        ],
      };

      const completeWorkout = httpsCallable<CompleteWorkoutRequest, CompleteWorkoutResponse>(
        functions,
        "completeWorkout",
      );

      const resp = await completeWorkout(workout);
      console.log("Workout logged: ", resp.data);
    } catch (err) {
      console.error("Error calling function:", err);
    }
  };

  return (
    <SafeAreaView>
      <Button title="Sign out" onPress={signout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
