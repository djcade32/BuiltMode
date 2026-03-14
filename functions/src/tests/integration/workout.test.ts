import type { CreateUserProfileRequest } from "@builtmode/shared/types/user";
import { CompleteWorkoutRequest } from "@builtmode/shared/types/workout";
import { handleCreateUserProfile } from "../../functions/user.js";
import { handleCompleteWorkout } from "../../functions/workout.js";
import { db } from "../../lib/firebaseAdmin.js";
import { Workout } from "../../types/workout.js";

async function deleteCollection(db: FirebaseFirestore.Firestore, collectionPath: string) {
  const collectionRef = db.collection(collectionPath);
  return await db.recursiveDelete(collectionRef);
}

describe("handleCompleteWorkout", () => {
  const uid = "test-user-123";
  const usernameLower = "djcade32";

  const user: CreateUserProfileRequest = {
    username: "djcade32",
    displayName: "Norman",
    homeTimezone: "America/New_York",
    weeklyTargetDays: 4,
  };

  const workout: CompleteWorkoutRequest = {
    sessionId: "session_9f82ab45",
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

  const workout2: CompleteWorkoutRequest = {
    sessionId: "session_9f82ab32",
    name: "Saturday Grinder",
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

  beforeEach(async () => {
    await Promise.all([
      db
        .doc(`users/${uid}`)
        .delete()
        .catch(() => null),
      db
        .doc(`leaderboardEntries/${uid}`)
        .delete()
        .catch(() => null),
      db
        .doc(`usernames/${usernameLower}`)
        .delete()
        .catch(() => null),
      deleteCollection(db, "workouts").catch(() => null),
      deleteCollection(db, "userWeekDays").catch(() => null),
      deleteCollection(db, "userWeekAggregates").catch(() => null),
    ]);
    await handleCreateUserProfile(uid, user);
  });

  test("creates workout doc, userWeekDays dayMarker doc, and userWeekAggregate doc", async () => {
    await handleCompleteWorkout(uid, workout);

    const workoutDoc = await db.doc(`workouts/${workout.sessionId}`).get();
    const workoutData = workoutDoc.data() as Workout;

    const localDateKey = workoutData.localDateKey;
    const weekId = workoutData.weekId;

    const [dayMarker, weekAggregate] = await Promise.all([
      db.doc(`userWeekDays/${uid}_${weekId}/days/${localDateKey}`).get(),
      db.doc(`userWeekAggregates/${uid}_${weekId}`).get(),
    ]);

    expect(workoutDoc.exists).toBe(true);
    expect(dayMarker.exists).toBe(true);
    expect(weekAggregate.exists).toBe(true);

    expect(workoutData).toMatchObject({
      uid,
      status: "completed",
      voidedAt: null,
      ...workout,
    });

    expect(workoutData.completedAt).toBeDefined();
    expect(workoutData.createdAt).toBeDefined();
    expect(workoutData.updatedAt).toBeDefined();
    expect(workoutData.lockedAt).toBeDefined();

    expect(workoutData.lockedAt.toMillis()).toBe(
      workoutData.completedAt.toMillis() + 5 * 60 * 1000,
    );

    expect(dayMarker.data()).toMatchObject({
      uid,
      weekId,
      localDateKey,
    });

    expect(weekAggregate.data()).toMatchObject({
      uid,
      weekId,
      isOfficialWeek: false,
      weeklyTargetDays: 4,
      activeDaysThisWeek: 1,
      metTargetThisWeek: false,
      streakWeeks: 0,
      streakStatus: false,
      isDeloadWeek: false,
      modeScore: null,
      scoreVersion: 1,
    });
  });

  test("should not increment activeDaysThisWeek when logging two workouts for the same day", async () => {
    await handleCompleteWorkout(uid, workout);
    await handleCompleteWorkout(uid, workout2);

    const workoutDoc = await db.doc(`workouts/${workout2.sessionId}`).get();
    const workoutData = workoutDoc.data() as Workout;

    const localDateKey = workoutData.localDateKey;
    const weekId = workoutData.weekId;

    const [dayMarker, weekAggregate] = await Promise.all([
      db.doc(`userWeekDays/${uid}_${weekId}/days/${localDateKey}`).get(),
      db.doc(`userWeekAggregates/${uid}_${weekId}`).get(),
    ]);

    expect(workoutDoc.exists).toBe(true);
    expect(dayMarker.exists).toBe(true);
    expect(weekAggregate.exists).toBe(true);

    expect(workoutData).toMatchObject({
      uid,
      status: "completed",
      voidedAt: null,
      ...workout2,
    });

    expect(workoutData.completedAt).toBeDefined();
    expect(workoutData.createdAt).toBeDefined();
    expect(workoutData.updatedAt).toBeDefined();
    expect(workoutData.lockedAt).toBeDefined();

    expect(workoutData.lockedAt.toMillis()).toBe(
      workoutData.completedAt.toMillis() + 5 * 60 * 1000,
    );

    expect(dayMarker.data()).toMatchObject({
      uid,
      weekId,
      localDateKey,
    });

    expect(weekAggregate.data()).toMatchObject({
      uid,
      weekId,
      isOfficialWeek: false,
      weeklyTargetDays: 4,
      activeDaysThisWeek: 1,
      metTargetThisWeek: false,
      streakWeeks: 0,
      streakStatus: false,
      isDeloadWeek: false,
      modeScore: null,
      scoreVersion: 1,
    });
  });
  afterAll(async () => {
    await Promise.all([
      db
        .doc(`users/${uid}`)
        .delete()
        .catch(() => null),
      db
        .doc(`leaderboardEntries/${uid}`)
        .delete()
        .catch(() => null),
      db
        .doc(`usernames/${usernameLower}`)
        .delete()
        .catch(() => null),
      deleteCollection(db, "workouts").catch(() => null),
      deleteCollection(db, "userWeekDays").catch(() => null),
      deleteCollection(db, "userWeekAggregates").catch(() => null),
    ]);
  });
});
