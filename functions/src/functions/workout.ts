import { FeedItem } from "@builtmode/shared/types/social";
import { UserMonthAggregate, UserStats } from "@builtmode/shared/types/user";
import {
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  PublishableWorkoutFields,
  PublishCompletedWorkoutToFeedRequest,
  PublishCompletedWorkoutToFeedResponse,
} from "@builtmode/shared/types/workout";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
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
  getLastFourWeekAggregates,
  getLastFourWeeksAdherenceRate,
  getTotalActiveDaysInMonth,
  getUserLeaderboardEntry,
  getWorkoutsWithinLast30Days,
} from "../firestore/workout.js";
import { db } from "../lib/firebaseAdmin.js";
import { LeaderboardEntry } from "../types/leaderboard.js";
import { DayMarker, UserWeekAggregate, Workout } from "../types/workout.js";
import { handleGetWeekId, handleGetWeekWindow } from "../utils/weekId.js";
import { createWorkoutCompletedFeedItem, fanoutFeedItemToFriends } from "./social.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "UTC";

const getValidTimezone = (timezoneValue: unknown): string => {
  return typeof timezoneValue === "string" && timezoneValue.trim().length > 0 ? timezoneValue : DEFAULT_TIMEZONE;
};

/**
 * Computes the workout owner's local date/time once in Cloud Functions.
 *
 * The mobile app should display these stored fields directly instead of
 * recalculating the workout date from `completedAt`, because React Native/Hermes
 * can format the same instant in the viewer/device timezone.
 */
const getWorkoutTimezoneFields = (completedAt: Date, workoutTimezone: string) => {
  const workoutLocalDateTime = dayjs(completedAt).tz(workoutTimezone);

  return {
    localDateKey: workoutLocalDateTime.format("YYYY-MM-DD"),
    localDate: workoutLocalDateTime.format(),
    monthId: workoutLocalDateTime.format("YYYY-MM"),
    workoutLocalDate: workoutLocalDateTime.format("YYYY-MM-DD"),
    workoutLocalTime: workoutLocalDateTime.format("HH:mm"),
    workoutLocalDateTimeISO: workoutLocalDateTime.format(),
    workoutLocalDisplayDate: workoutLocalDateTime.format("dddd, MMM D"),
    workoutLocalDisplayTime: workoutLocalDateTime.format("h:mm A"),
    workoutUtcOffsetMinutes: workoutLocalDateTime.utcOffset(),
  };
};

/** 
  Completes workout.

  Updates the following Firestore documents:
  - `workouts/{sessionId}`
  - `userWeekDays/{uid}_{weekId}/days/{localDateKey}`
  - `userWeekAggregates/{uid}_{weekId}`
  - `leaderboardEntries/{uid}`

  Feed publishing is intentionally not done here. The completed workout is saved
  as `pending_publish`, then the Workout Complete screen can call
  `handlePublishCompletedWorkoutToFeed` after the user adds/skips a photo.

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
  const result = await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, uid);

    const fetchedUserStats = await getUserStats(tx, uid);
    const userStatsExists = fetchedUserStats.exists;

    if (!user.exists) {
      throw new HttpsError("not-found", "User not found.");
    }
    if (!userStatsExists) {
      throw new HttpsError("not-found", "User stats not found.");
    }

    const userStats = fetchedUserStats.data() as UserStats;

    const homeTimezone = getValidTimezone(user.get("homeTimezone"));
    const workoutTimezone = homeTimezone;
    const officialStartWeekId = user.get("officialStartWeekId");
    const weeklyTargetDays = user.get("weeklyTargetDays");

    const completedAtDate = now.toDate();
    const workoutTimezoneFields = getWorkoutTimezoneFields(completedAtDate, workoutTimezone);

    const weekId = handleGetWeekId(completedAtDate, workoutTimezone);
    const localDateKey = workoutTimezoneFields.localDateKey;
    const localDate = workoutTimezoneFields.localDate;
    const monthId = workoutTimezoneFields.monthId;

    const isOfficialWeek = dayjs(officialStartWeekId).isBefore(dayjs(weekId)) || officialStartWeekId === weekId;

    const dayMarkerExists = (await getDayMarker(tx, uid, weekId, localDateKey)).exists;
    const numOfCompletedWorkoutsLast30Days = await getWorkoutsWithinLast30Days(tx, uid, localDateKey);
    const completedWorkoutsLast30Days = dayMarkerExists
      ? numOfCompletedWorkoutsLast30Days
      : numOfCompletedWorkoutsLast30Days + 1;
    const weekAggregate = await getUserWeekAggregate(tx, uid, weekId);
    const weekAggregateExists = weekAggregate.exists;

    const last4WeekAggregates = await getLastFourWeekAggregates(tx, uid, weekId);

    const lastFourWeeksAdherenceRate = getLastFourWeeksAdherenceRate(last4WeekAggregates);

    let streakStatus = weekAggregateExists ? weekAggregate.get("streakStatus") : "inactive";

    // If weekAgreggate doc exists and there is no workout logged for today, increment activeDaysThisWeek. Else do nothing
    const activeDaysThisWeek = weekAggregateExists
      ? !dayMarkerExists
        ? weekAggregate.get("activeDaysThisWeek") + 1
        : weekAggregate.get("activeDaysThisWeek")
      : 1;

    const metTargetThisWeek = activeDaysThisWeek >= weeklyTargetDays;
    const isDeloadWeek = weekAggregateExists ? weekAggregate.get("isDeloadWeek") : false;
    let targetMetAt = null;
    let streakCreditedAt = null;
    // If weekAgreggate doc exits, there is no workout and target is met increment streak. Else do nothing
    let streakWeeks = userStats.currentWeekStreak;

    if (metTargetThisWeek && streakStatus === "inactive") {
      targetMetAt = now;
      streakCreditedAt = now;
      streakWeeks = streakWeeks + 1;
      streakStatus = "active";
    } else {
      streakWeeks = streakWeeks;
    }

    const lastFinalizedWeek = last4WeekAggregates[0];
    const calculatedStats = calculateModeScore({
      weeklyTarget: weeklyTargetDays,
      completedWorkoutsLast30Days,
      weeklyAdherenceStreak: streakWeeks,
      completedWorkoutsThisWeek: activeDaysThisWeek,
      completedWorkoutsLastFinalizedWeek: lastFinalizedWeek?.activeDaysThisWeek,
      weeklyTargetLastFinalizedWeek: lastFinalizedWeek?.weeklyTargetDays,
    });

    console.log("calculatedStats: ", calculatedStats);

    const modeScore = isOfficialWeek ? calculatedStats.modeScore : null;

    const activity30DayRate = isOfficialWeek ? calculatedStats.activity30DayScore : 0;

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

    const totalWorkoutsInMonth = monthAggregateExists ? monthAggregate.data()?.totalWorkouts + 1 : 1;
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
    const activeDaysInMonth = monthAggregateExists ? await getTotalActiveDaysInMonth(tx, uid, localDateKey) : 0;
    const activeDaysCount = dayMarkerExists ? activeDaysInMonth : activeDaysInMonth + 1;

    const bestWeekStreak = userStatsExists ? Math.max(streakWeeks, userStats.bestWeekStreak ?? 0) : 0;
    const totalWorkoutsLogged = userStatsExists ? userStats.totalWorkoutsLogged + 1 : 1;
    const previousTotalTargetsMet = userStatsExists ? (userStats.totalTargetsMet ?? 0) : 0;
    const newlyMetTargetThisWeek =
      isOfficialWeek && metTargetThisWeek && !(weekAggregateExists && weekAggregate.get("metTargetThisWeek"));

    const totalTargetsMet = newlyMetTargetThisWeek ? previousTotalTargetsMet + 1 : previousTotalTargetsMet;

    const workoutDoc: Workout & PublishableWorkoutFields = {
      sessionId,
      exercises,
      workoutType: workoutType ?? "other",
      notes: notes ?? "",
      photoUrl: null,
      feedStatus: "pending_publish",
      feedPublishedAt: null,
      caption: null,
      completedAt: now,
      createdAt: now,
      localDateKey,
      localDate,
      lockedAt: lockedAtTimestamp,
      status: "completed",
      uid,
      updatedAt: now,
      weekId,
      name: name ?? "",
      voidedAt: null,
      duration,
      workoutTimezone,
      workoutLocalDate: workoutTimezoneFields.workoutLocalDate,
      workoutLocalTime: workoutTimezoneFields.workoutLocalTime,
      workoutLocalDateTimeISO: workoutTimezoneFields.workoutLocalDateTimeISO,
      workoutLocalDisplayDate: workoutTimezoneFields.workoutLocalDisplayDate,
      workoutLocalDisplayTime: workoutTimezoneFields.workoutLocalDisplayTime,
      workoutUtcOffsetMinutes: workoutTimezoneFields.workoutUtcOffsetMinutes,
    };

    const dayMarkerDoc: DayMarker = {
      uid,
      localDateKey,
      createdAt: now,
      weekId,
    };
    const weekWindow = handleGetWeekWindow(completedAtDate, workoutTimezone);

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
      weekEndAt: weekWindow.weekEndAt,
      weekStartAt: weekWindow.weekStartAt,
      streakCreditedAt,
      finalizedAt: null,
      targetMetAt,
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
      last30DayWeeklyAdherenceRate: lastFourWeeksAdherenceRate.adherenceRate,
      activity30DayRate,
      totalTargetsMet,
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
    return {
      activeDaysThisWeek,
      isOfficialWeek,
      modeScore,
      streakWeeks,
      weekId,
      weeklyTargetDays,
      modeScoreDifference,
      lockedAt: dayjs(lockedAtTimestamp.toDate()).tz(workoutTimezone).format(),
      workoutTimezone,
      localDate,
      workoutLocalDate: workoutTimezoneFields.workoutLocalDate,
      workoutLocalTime: workoutTimezoneFields.workoutLocalTime,
      workoutLocalDateTimeISO: workoutTimezoneFields.workoutLocalDateTimeISO,
      workoutLocalDisplayDate: workoutTimezoneFields.workoutLocalDisplayDate,
      workoutLocalDisplayTime: workoutTimezoneFields.workoutLocalDisplayTime,
      workoutUtcOffsetMinutes: workoutTimezoneFields.workoutUtcOffsetMinutes,
      sessionId,
      photoUrl: null,
      caption: null,
    } as CompleteWorkoutResponse;
  });

  return result;
}

/**
 * Publishes an already-completed workout to the social feed.
 *
 * This is intentionally separate from `handleCompleteWorkout` so the app can:
 * - save the workout immediately when Active Mode ends
 * - let the user add an optional post-workout photo on the complete screen
 * - publish/fan-out only when the completion flow is finalized
 */
export async function handlePublishCompletedWorkoutToFeed(
  uid: string,
  request: PublishCompletedWorkoutToFeedRequest,
): Promise<PublishCompletedWorkoutToFeedResponse> {
  const sessionId = request.sessionId?.trim();

  if (!sessionId) {
    throw new HttpsError("invalid-argument", "sessionId is required.");
  }

  const photoUrl = request.photoUrl ?? null;
  const caption = request.caption ?? null;
  const now = Timestamp.now();
  let feedItemToFanout: FeedItem | null = null;

  const result = await db.runTransaction(async (tx) => {
    const user = await getUserByUid(tx, uid);

    if (!user.exists) {
      throw new HttpsError("not-found", "User not found.");
    }

    const workoutRef = db.collection("workouts").doc(sessionId);
    const workoutSnap = await tx.get(workoutRef);

    if (!workoutSnap.exists) {
      throw new HttpsError("not-found", "Workout not found.");
    }

    const workoutDoc = workoutSnap.data() as Workout & Partial<PublishableWorkoutFields>;

    if (workoutDoc.uid !== uid) {
      throw new HttpsError("permission-denied", "You cannot publish another user's workout.");
    }

    if (workoutDoc.status !== "completed") {
      throw new HttpsError("failed-precondition", "Only completed workouts can be published.");
    }

    const existingFeedStatus = workoutDoc.feedStatus ?? "pending_publish";
    const existingPhotoUrl = workoutDoc.photoUrl ?? null;
    const nextPhotoUrl = photoUrl ?? existingPhotoUrl;

    if (existingFeedStatus === "published") {
      return {
        sessionId,
        feedStatus: "published",
        alreadyPublished: true,
        photoUrl: existingPhotoUrl,
      } as PublishCompletedWorkoutToFeedResponse;
    }

    const weekAggregateSnap = await getUserWeekAggregate(tx, uid, workoutDoc.weekId);
    if (!weekAggregateSnap.exists) {
      throw new HttpsError("not-found", "User week aggregate not found.");
    }

    const userStatsSnap = await getUserStats(tx, uid);
    if (!userStatsSnap.exists) {
      throw new HttpsError("not-found", "User stats not found.");
    }

    const weekAggregate = weekAggregateSnap.data() as UserWeekAggregate;
    const userStats = userStatsSnap.data() as UserStats;

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
        localDate: workoutDoc.localDate,
        workoutTimezone: workoutDoc.workoutTimezone,
        workoutLocalDate: workoutDoc.workoutLocalDate,
        workoutLocalTime: workoutDoc.workoutLocalTime,
        workoutLocalDateTimeISO: workoutDoc.workoutLocalDateTimeISO,
        workoutLocalDisplayDate: workoutDoc.workoutLocalDisplayDate,
        workoutLocalDisplayTime: workoutDoc.workoutLocalDisplayTime,
        workoutUtcOffsetMinutes: workoutDoc.workoutUtcOffsetMinutes,
        completedAt: workoutDoc.completedAt,
        isPracticeWeek: !weekAggregate.isOfficialWeek,
        caption,
        photoUrl: nextPhotoUrl,
      },
      weekAggregate: {
        activeDaysThisWeek: weekAggregate.activeDaysThisWeek,
        modeScore: weekAggregate.modeScore,
      },
      userStats: {
        currentWeekStreak: userStats.currentWeekStreak,
      },
    });

    tx.update(workoutRef, {
      photoUrl: nextPhotoUrl,
      feedStatus: "published",
      feedPublishedAt: now,
      caption,
      updatedAt: now,
    });

    return {
      sessionId,
      feedStatus: "published",
      alreadyPublished: false,
      photoUrl: nextPhotoUrl,
    } as PublishCompletedWorkoutToFeedResponse;
  });

  if (feedItemToFanout) {
    try {
      await fanoutFeedItemToFriends(uid, feedItemToFanout);
    } catch (error) {
      // TODO: Implement retry logic here
      console.error("Failed to fanout workout feed item", {
        uid,
        feedItem: feedItemToFanout,
        error,
      });
    }
  }

  return result;
}
