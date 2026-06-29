import { Workout } from "@/functions/src/types/workout";
import { InfinitePage } from "@/hooks/useInfiniteQuery";
import { db, functions } from "@/lib/firebase";
import { CompleteWorkoutRequest, CompleteWorkoutResponse, PublishCompletedWorkoutToFeedResponse } from "@/packages/shared/src";
import { collection, doc, DocumentData, getDoc, getDocs, limit, orderBy, query, QueryDocumentSnapshot, startAfter, Timestamp, where } from "firebase/firestore";
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
export const createCompleteWorkout = async (workout: CompleteWorkoutRequest): Promise<CompleteWorkoutResponse> => {
  const createWorkoutFunction = httpsCallable<CompleteWorkoutRequest, CompleteWorkoutResponse>(functions, "completeWorkout");
  const workoutResponse = await createWorkoutFunction(workout);
  return workoutResponse.data;
};

export const publishCompletedWorkoutToFeed = async (sessionId: string, photoUrl: string | null, caption: string | null): Promise<PublishCompletedWorkoutToFeedResponse> => {
  const publishCompletedWorkoutToFeedFunction = httpsCallable<{ sessionId: string; photoUrl: string | null; caption: string | null }, PublishCompletedWorkoutToFeedResponse>(
    functions,
    "publishCompletedWorkoutToFeed",
  );
  const response = await publishCompletedWorkoutToFeedFunction({ photoUrl, caption, sessionId });
  return response.data;
};

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

type WorkoutCursor = QueryDocumentSnapshot<DocumentData>;

export const getUserWorkouts = async ({
  pageParam,
  params,
  limit: pageSize,
}: {
  pageParam?: WorkoutCursor | null;
  params: { uid: string };
  limit: number;
}): Promise<InfinitePage<Workout, WorkoutCursor>> => {
  try {
    const workoutsRef = collection(db, "workouts");

    const workoutsQuery = pageParam
      ? query(workoutsRef, where("uid", "==", params.uid), orderBy("completedAt", "desc"), startAfter(pageParam), limit(pageSize))
      : query(workoutsRef, where("uid", "==", params.uid), orderBy("completedAt", "desc"), limit(pageSize));

    const snapshot = await getDocs(workoutsQuery);

    const items: Workout[] = snapshot.docs.map((doc) => ({
      ...(doc.data() as Workout),
    }));

    const hasMore = snapshot.docs.length === pageSize;
    const nextCursor = hasMore ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  } catch (error) {
    console.error("error fetching user workouts: ", error);
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
    };
  }
};

export const getWorkoutBySessionId = async ({ params }: { params: { sessionId: string } }): Promise<Workout | undefined> => {
  const workoutDoc = doc(db, `workouts/${params.sessionId}`);
  const fetchedDoc = await getDoc(workoutDoc);

  if (fetchedDoc.exists()) {
    return {
      ...(fetchedDoc.data() as Workout),
    };
  }
};

export const getPendingPublishWorkouts = async ({ uid, completedBefore }: { uid: string; completedBefore: Date }) => {
  const q = query(
    collection(db, "workouts"),
    where("uid", "==", uid),
    where("status", "==", "completed"),
    where("feedStatus", "==", "pending_publish"),
    where("completedAt", "<=", Timestamp.fromDate(completedBefore)),
    orderBy("completedAt", "asc"),
    limit(5),
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
