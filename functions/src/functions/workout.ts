import { CompleteWorkoutRequest, CompleteWorkoutResponse } from "@builtmode/shared/types/workout";
import dayjs from "dayjs";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { getUserByUid } from "../firestore/user.js";
import {
  calculateModeScore,
  createCompleteWorkout,
  createDayMarker,
  createUserWeekAggregate,
  getDayMarker,
  getUserWeekAggregate,
  getWorkoutsWithinLast30Days,
} from "../firestore/workout.js";
import { db } from "../lib/firebaseAdmin.js";
import { DayMarker, UserWeekAggregate, Workout } from "../types/workout.js";
import { handleGetLocalDateKey, handleGetWeekId } from "../utils/weekId.js";

/** 
  Completes workout.

  Updates the following Firestore documents:
  - `workouts/{sessionId}`
  - `userWeekDays/{uid}_{weekId}/days/{localDateKey}`
  - `userWeekAggregates/{uid}_{weekId}`
  - `leaderboardEntries/{uid}`

  @param {string} uid User's uid
  @param {CompleteWorkoutRequest} workout Workout object to save in Firestore
  @return On success return user's workout metrics
*/
export async function handleCompleteWorkout(
  uid: string,
  workout: CompleteWorkoutRequest,
): Promise<CompleteWorkoutResponse> {
  const { sessionId, workoutType, notes, exercises, name } = workout;

  const now = Timestamp.now();
  const lockedAt = now.toDate();
  lockedAt.setMinutes(lockedAt.getMinutes() + 5);
  const lockedAtTimestamp = Timestamp.fromDate(lockedAt);

  return await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, uid);
    if (!user.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const homeTimezone = user.get("homeTimezone");
    const officialStartWeekId = user.get("officialStartWeekId");
    const weeklyTargetDays = user.get("weeklyTargetDays");

    const weekId = handleGetWeekId(now.toDate(), homeTimezone);
    const localDateKey = handleGetLocalDateKey(now.toDate(), homeTimezone);
    const numOfCompletedWorkoutsLast30Days = await getWorkoutsWithinLast30Days(
      tx,
      uid,
      localDateKey,
    );

    const isOfficialWeek = officialStartWeekId < weekId;

    const dayMarkerExists = (await getDayMarker(tx, uid, weekId, localDateKey)).exists;
    const weekAggregate = await getUserWeekAggregate(tx, uid, weekId);
    const weekAggregateExists = weekAggregate.exists;

    // If weekAgreggate doc exists and there is no workout logged for today, increment activeDaysThisWeek. Else do nothing
    const activeDaysThisWeek = weekAggregateExists
      ? !dayMarkerExists
        ? weekAggregate.get("activeDaysThisWeek") + 1
        : weekAggregate.get("activeDaysThisWeek")
      : 1;
    const metTargetThisWeek = weekAggregateExists ? activeDaysThisWeek > weeklyTargetDays : false;
    const isDeloadWeek = weekAggregateExists ? weekAggregate.get("isDeloadWeek") : false;
    const streakWeeks = weekAggregateExists ? weekAggregate.get("streakWeeks") : 0;
    const modeScore =
      weekAggregateExists && isOfficialWeek
        ? calculateModeScore({
            weeklyTarget: weeklyTargetDays,
            completedWorkoutsLast30Days: numOfCompletedWorkoutsLast30Days,
            weeklyAdherenceStreak: streakWeeks,
            completedWorkoutsThisWeek: activeDaysThisWeek,
          }).modeScore
        : null;
    const streakStatus = weekAggregateExists ? weekAggregate.get("streakStatus") : false;

    const workoutDoc: Workout = {
      sessionId,
      exercises,
      workoutType: workoutType ?? "other",
      notes: notes ?? "",
      completedAt: now,
      createdAt: now,
      localDateKey,
      lockedAt: lockedAtTimestamp,
      status: "completed",
      uid,
      updatedAt: now,
      weekId,
      name,
      voidedAt: null,
    };

    const dayMarkerDoc: DayMarker = {
      uid,
      localDateKey,
      createdAt: now,
      weekId,
    };

    const userWeekAggregateDoc: UserWeekAggregate = {
      uid,
      isOfficialWeek,
      weeklyTargetDays,
      activeDaysThisWeek,
      metTargetThisWeek,
      modeScore,
      scoreVersion: 1,
      streakStatus,
      streakWeeks,
      updatedAt: now,
      weekId,
      isDeloadWeek,
    };

    createCompleteWorkout(tx, workoutDoc);
    createDayMarker(tx, dayMarkerDoc);
    createUserWeekAggregate(tx, uid, weekId, userWeekAggregateDoc);

    return {
      activeDaysThisWeek,
      isOfficialWeek,
      modeScore: null,
      streakWeeks,
      weekId,
      weeklyTargetDays,
      lockedAt: dayjs(lockedAtTimestamp.toDate()).tz(homeTimezone).toString(),
    } as CompleteWorkoutResponse;
  });
}
