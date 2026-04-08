import { CompleteWorkoutRequest, CompleteWorkoutResponse } from "@builtmode/shared/types/workout";
import dayjs from "dayjs";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { updateLeaderboardEntry } from "../firestore/leaderboard.js";
import { getUserByUid } from "../firestore/user.js";
import {
  calculateModeScore,
  createCompleteWorkout,
  createDayMarker,
  createUserWeekAggregate,
  getDayMarker,
  getUserLeaderboardEntry,
  getUserWeekAggregate,
  getWorkoutsWithinLast30Days,
} from "../firestore/workout.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";
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
  const { sessionId, workoutType, notes, exercises, name, duration } = workout;

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

    const isOfficialWeek =
      dayjs(officialStartWeekId).isBefore(dayjs(weekId)) || officialStartWeekId === weekId;

    const dayMarkerExists = (await getDayMarker(tx, uid, weekId, localDateKey)).exists;
    const numOfCompletedWorkoutsLast30Days = await getWorkoutsWithinLast30Days(
      tx,
      uid,
      localDateKey,
    );
    const completedWorkoutsLast30Days = dayMarkerExists
      ? numOfCompletedWorkoutsLast30Days
      : numOfCompletedWorkoutsLast30Days + 1;
    const weekAggregate = await getUserWeekAggregate(tx, uid, weekId);
    const weekAggregateExists = weekAggregate.exists;

    // If weekAgreggate doc exists and there is no workout logged for today, increment activeDaysThisWeek. Else do nothing
    const activeDaysThisWeek = weekAggregateExists
      ? !dayMarkerExists
        ? weekAggregate.get("activeDaysThisWeek") + 1
        : weekAggregate.get("activeDaysThisWeek")
      : 1;
    const metTargetThisWeek = weekAggregateExists ? activeDaysThisWeek >= weeklyTargetDays : false;
    const isDeloadWeek = weekAggregateExists ? weekAggregate.get("isDeloadWeek") : false;
    const streakWeeks = weekAggregateExists ? weekAggregate.get("streakWeeks") : 0;
    const modeScore = isOfficialWeek
      ? calculateModeScore({
          weeklyTarget: weeklyTargetDays,
          completedWorkoutsLast30Days,
          weeklyAdherenceStreak: streakWeeks,
          completedWorkoutsThisWeek: activeDaysThisWeek,
        }).modeScore
      : null;

    const streakStatus = weekAggregateExists ? weekAggregate.get("streakStatus") : false;
    let modeScoreDifference = 0;
    if (weekAggregateExists && modeScore) {
      modeScoreDifference = modeScore - weekAggregate.data()?.modeScore;
    } else if (modeScore) {
      const leaderboardEntry = await getUserLeaderboardEntry(tx, uid);
      if (leaderboardEntry.exists) {
        modeScoreDifference = modeScore - leaderboardEntry.data()?.modeScore;
      }
    }

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
      name: name ?? "",
      voidedAt: null,
      duration,
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

    const updatedLeaderboardEntry: Partial<LeaderboardEntry> = {
      uid,
      modeScore: modeScore === null ? 0 : modeScore,
      streakWeeks,
      updatedAt: now,
      weekId,
      isRanked: isOfficialWeek,
    };

    createCompleteWorkout(tx, workoutDoc);
    createDayMarker(tx, dayMarkerDoc);
    createUserWeekAggregate(tx, uid, weekId, userWeekAggregateDoc);
    updateLeaderboardEntry(tx, updatedLeaderboardEntry);

    return {
      activeDaysThisWeek,
      isOfficialWeek,
      modeScore,
      streakWeeks,
      weekId,
      weeklyTargetDays,
      modeScoreDifference,
      lockedAt: dayjs(lockedAtTimestamp.toDate()).tz(homeTimezone).toString(),
    } as CompleteWorkoutResponse;
  });
}
