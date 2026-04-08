import { functions } from "@/lib/firebase";
import { CompleteWorkoutRequest, CompleteWorkoutResponse } from "@/packages/shared/src";
import { httpsCallable } from "firebase/functions";

/**
 * The function `createCompleteWorkout` sends a request to complete a workout using Firebase Cloud
 * Functions.
 * @param {CompleteWorkoutRequest} workout - The `workout` parameter in the `createCompleteWorkout`
 * function is of type `CompleteWorkoutRequest`. This parameter likely contains the details and data
 * necessary to create a complete workout. It is passed to the `createWorkoutFunction` to initiate the
 * process of completing the workout.
 * @returns The function `createCompleteWorkout` is returning a Promise that resolves to a
 * `CompleteWorkoutResponse` object.
 */
export const createCompleteWorkout = async (
  workout: CompleteWorkoutRequest,
): Promise<CompleteWorkoutResponse> => {
  try {
    const createWorkoutFunction = httpsCallable<CompleteWorkoutRequest, CompleteWorkoutResponse>(
      functions,
      "completeWorkout",
    );

    const workoutResponse = await createWorkoutFunction(workout);
    return workoutResponse.data;
  } catch (error: any) {
    throw error;
  }
};
