import { FeedItem } from "@builtmode/shared/types/social";
import { UserMonthAggregate, UserStats } from "@builtmode/shared/types/user";
import { CompleteWorkoutRequest, CompleteWorkoutResponse } from "@builtmode/shared/types/workout";
import dayjs from "dayjs";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { updateLeaderboardEntry } from "../firestore/leaderboard.js";
import {
  createUserMonthAggregates,
  createUserStats,
  createUserWeekAggregate,
  getUserByUid,
  getUserMonthAggregate,
  getUserStats,
  getUserWeekAggregate,
} from "../firestore/user.js";
import {
  calculateModeScore,
  createCompleteWorkout,
  createDayMarker,
  getDayMarker,
  getTotalActiveDaysInMonth,
  getUserLeaderboardEntry,
  getWorkoutsWithinLast30Days,
} from "../firestore/workout.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";
import { DayMarker, UserWeekAggregate, Workout } from "../types/workout.js";
import { handleGetLocalDateKey, handleGetWeekId } from "../utils/weekId.js";
import { createWorkoutCompletedFeedItem, fanoutFeedItemToFriends } from "./social.js";

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
  let feedItemToFanout: FeedItem | null = null;

  const result = await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, uid);
    if (!user.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const homeTimezone = user.get("homeTimezone");
    const officialStartWeekId = user.get("officialStartWeekId");
    const weeklyTargetDays = user.get("weeklyTargetDays");

    const weekId = handleGetWeekId(now.toDate(), homeTimezone);
    const localDateKey = handleGetLocalDateKey(now.toDate(), homeTimezone);
    const monthId = dayjs(localDateKey).format("YYYY-MM");

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

    let streakStatus = weekAggregateExists ? weekAggregate.get("streakStatus") : "inactive";

    // If weekAgreggate doc exists and there is no workout logged for today, increment activeDaysThisWeek. Else do nothing
    const activeDaysThisWeek = weekAggregateExists
      ? !dayMarkerExists
        ? weekAggregate.get("activeDaysThisWeek") + 1
        : weekAggregate.get("activeDaysThisWeek")
      : 1;
    const metTargetThisWeek = weekAggregateExists ? activeDaysThisWeek >= weeklyTargetDays : false;
    const isDeloadWeek = weekAggregateExists ? weekAggregate.get("isDeloadWeek") : false;
    // If weekAgreggate doc exits, there is no workout and target is met increment streak. Else do nothing
    let streakWeeks = 0;
    if (weekAggregateExists) {
      if (metTargetThisWeek && streakStatus === "inactive") {
        streakWeeks = weekAggregate.get("streakWeeks") + 1;
        streakStatus = "active";
      } else {
        streakWeeks = weekAggregate.get("streakWeeks");
      }
    }

    const modeScore = isOfficialWeek
      ? calculateModeScore({
          weeklyTarget: weeklyTargetDays,
          completedWorkoutsLast30Days,
          weeklyAdherenceStreak: streakWeeks,
          completedWorkoutsThisWeek: activeDaysThisWeek,
        }).modeScore
      : null;

    let modeScoreDifference = 0;
    if (weekAggregateExists && modeScore) {
      modeScoreDifference = modeScore - (weekAggregate.data()?.modeScore ?? 0);
    } else if (modeScore) {
      const leaderboardEntry = await getUserLeaderboardEntry(tx, uid);
      if (leaderboardEntry.exists) {
        modeScoreDifference = modeScore - (leaderboardEntry.data()?.modeScore ?? 0);
      }
    }

    const monthAggregate = await getUserMonthAggregate(tx, uid, monthId);
    const monthAggregateExists = monthAggregate.exists;

    const totalWorkoutsInMonth = monthAggregateExists
      ? monthAggregate.data()?.totalWorkouts + 1
      : 1;
    let workoutCountByDate: Record<string, number> = { [localDateKey]: 1 };
    if (monthAggregateExists) {
      if (monthAggregate.data()?.workoutCountByDate[localDateKey]) {
        workoutCountByDate = {
          ...monthAggregate.data()?.workoutCountByDate,
          [localDateKey]: monthAggregate.data()?.workoutCountByDate[localDateKey] + 1,
        };
      } else {
        workoutCountByDate = {
          ...monthAggregate.data()?.workoutCountByDate,
          [localDateKey]: 1,
        };
      }
    }
    const activeDaysInMonth = monthAggregateExists
      ? await getTotalActiveDaysInMonth(tx, uid, localDateKey)
      : 0;
    const activeDaysCount = dayMarkerExists ? activeDaysInMonth : activeDaysInMonth + 1;

    const userStats = await getUserStats(tx, uid);
    const userStatsExists = userStats.exists;

    const bestWeekStreak = userStatsExists
      ? Math.max(streakWeeks, userStats.data()?.bestWeekStreak ?? 0)
      : 0;
    const totalWorkoutsLogged = userStatsExists ? userStats.data()?.totalWorkoutsLogged + 1 : 1;

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

    const userMonthAggregateDoc: UserMonthAggregate = {
      uid,
      monthId,
      totalWorkouts: totalWorkoutsInMonth,
      activeDaysCount,
      workoutCountByDate,
      createdAt: now,
      updatedAt: now,
    };

    const updatedLeaderboardEntry: Partial<LeaderboardEntry> = {
      uid,
      modeScore: modeScore === null ? 0 : modeScore,
      streakWeeks,
      updatedAt: now,
      weekId,
      isRanked: isOfficialWeek,
    };

    const userStatsDoc: UserStats = {
      currentWeekStreak: streakWeeks,
      bestWeekStreak,
      modeScore: modeScore,
      totalWorkoutsLogged,
      weeklyTargetDays,
      updatedAt: now,
    };

    createCompleteWorkout(tx, workoutDoc);
    createDayMarker(tx, dayMarkerDoc);
    createUserWeekAggregate(tx, uid, weekId, userWeekAggregateDoc);
    createUserMonthAggregates(tx, uid, monthId, userMonthAggregateDoc);
    createUserStats(tx, uid, userStatsDoc);
    updateLeaderboardEntry(tx, updatedLeaderboardEntry);
    feedItemToFanout = createWorkoutCompletedFeedItem({
      tx,
      uid,
      user: {
        username: user.get("username"),
        displayName: user.get("displayName"),
        avatarUrl: user.get("avatarUrl"),
        weeklyTargetDays: user.get("weeklyTargetDays"),
      },
      workout: {
        sessionId: workoutDoc.sessionId,
        workoutType: workoutDoc.workoutType,
        name: workoutDoc.name,
        durationSeconds: workoutDoc.duration,
        exercises: workoutDoc.exercises,
        weekId: workoutDoc.weekId,
        localDateKey: workoutDoc.localDateKey,
        caption: "",
      },
      weekAggregate: {
        activeDaysThisWeek: userWeekAggregateDoc.activeDaysThisWeek,
        modeScore: userWeekAggregateDoc.modeScore,
      },
      userStats: {
        currentWeekStreak: userStatsDoc.currentWeekStreak,
      },
    });

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

  if (feedItemToFanout) {
    try {
      await fanoutFeedItemToFriends(uid, feedItemToFanout);
    } catch (error) {
      console.error("Failed to fanout workout feed item", {
        uid,
        feedItemId: feedItemToFanout,
        error,
      });
    }
  }

  return result;
}
