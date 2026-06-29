import { getPendingPublishWorkouts, publishCompletedWorkoutToFeed } from "@/services/workout-service";
import { useUserStore } from "@/stores/user-store";
import { useEffect, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

const PENDING_PUBLISH_GRACE_PERIOD_MS = 5 * 60 * 1000;

const PendingWorkoutPublisher = () => {
  const { user } = useUserStore();
  const isPublishingRef = useRef(false);

  const publishPendingWorkouts = async () => {
    if (!user?.uid) return;
    if (isPublishingRef.current) return;

    isPublishingRef.current = true;

    try {
      const cutoffDate = new Date(Date.now() - PENDING_PUBLISH_GRACE_PERIOD_MS);

      const pendingWorkouts = await getPendingPublishWorkouts({
        uid: user.uid,
        completedBefore: cutoffDate,
      });

      for (const workout of pendingWorkouts) {
        await publishCompletedWorkoutToFeed(workout.id, null, null);
      }
    } catch (error) {
      console.error("Failed to publish pending workouts", error);
    } finally {
      isPublishingRef.current = false;
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    publishPendingWorkouts();

    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        publishPendingWorkouts();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.uid]);

  return null;
};

export default PendingWorkoutPublisher;
