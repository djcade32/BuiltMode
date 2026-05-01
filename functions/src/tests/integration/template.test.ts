import { ExerciseMetricType, WorkoutType } from "@builtmode/shared/";
import { Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/https";
import { handleDeleteTemplate, handleSaveAsTemplate } from "../../functions/template";
import { db } from "../../lib/firebaseAdmin.js";

const TEST_UID = "test-user-template-uid";
const TEMPLATE_ID = "test-template-id";

const buildWorkoutRequest = (overrides = {}) => ({
  id: TEMPLATE_ID,
  name: "Push Day Template",
  workoutType: "strength" as WorkoutType,
  notes: "Saved from workout history",
  exercises: [
    {
      id: "exercise-1",
      name: "Bench Press",
      sets: [
        {
          id: "set-1",
          reps: 10,
          weight: 185,
          completed: true,
        },
      ],
      metricType: "weight_reps" as ExerciseMetricType,
    },
  ],
  ...overrides,
});

const createTestUser = async (uid = TEST_UID) => {
  await db.doc(`users/${uid}`).set({
    uid,
    username: "templateuser",
    usernameLower: "templateuser",
    displayName: "Template User",
    goal: "build_muscle",
    weeklyTargetDays: 4,
    homeTimezone: "America/New_York",
    officialStartWeekId: "2026-W01",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
};

const deleteDocIfExists = async (path: string) => {
  const ref = db.doc(path);
  const snap = await ref.get();

  if (snap.exists) {
    await ref.delete();
  }
};

describe("template handlers integration", () => {
  beforeEach(async () => {
    await deleteDocIfExists(`templates/${TEMPLATE_ID}`);
    await deleteDocIfExists(`users/${TEST_UID}`);
  });

  afterAll(async () => {
    await deleteDocIfExists(`templates/${TEMPLATE_ID}`);
    await deleteDocIfExists(`users/${TEST_UID}`);
  });

  describe("handleSaveAsTemplate", () => {
    it("saves a workout as a template for an existing user", async () => {
      await createTestUser();

      const request = buildWorkoutRequest();

      const result = await handleSaveAsTemplate(TEST_UID, request);

      expect(result).toEqual({});

      const templateSnap = await db.doc(`templates/${TEMPLATE_ID}`).get();

      expect(templateSnap.exists).toBe(true);

      const template = templateSnap.data();

      expect(template).toMatchObject({
        id: TEMPLATE_ID,
        uid: TEST_UID,
        name: "Push Day Template",
        workoutType: "strength",
        notes: "Saved from workout history",
        exercises: request.exercises,
      });

      expect(template?.createdAt).toBeInstanceOf(Timestamp);
      expect(template?.updatedAt).toBeInstanceOf(Timestamp);
      expect(template?.completedAt).toBeInstanceOf(Timestamp);
    });

    it("defaults workoutType to other when missing", async () => {
      await createTestUser();

      const request = buildWorkoutRequest({
        workoutType: undefined,
      });

      await handleSaveAsTemplate(TEST_UID, request);

      const templateSnap = await db.doc(`templates/${TEMPLATE_ID}`).get();
      const template = templateSnap.data();

      expect(template?.workoutType).toBe("other");
    });

    it("defaults notes to an empty string when missing", async () => {
      await createTestUser();

      const request = buildWorkoutRequest({
        notes: undefined,
      });

      await handleSaveAsTemplate(TEST_UID, request);

      const templateSnap = await db.doc(`templates/${TEMPLATE_ID}`).get();
      const template = templateSnap.data();

      expect(template?.notes).toBe("");
    });

    it("throws not-found when the user does not exist", async () => {
      const request = buildWorkoutRequest();

      await expect(handleSaveAsTemplate(TEST_UID, request)).rejects.toMatchObject({
        code: "not-found",
        message: "User not found.",
      });
    });

    it("does not create a template when the user does not exist", async () => {
      const request = buildWorkoutRequest();

      await expect(handleSaveAsTemplate(TEST_UID, request)).rejects.toBeInstanceOf(HttpsError);

      const templateSnap = await db.doc(`templates/${TEMPLATE_ID}`).get();

      expect(templateSnap.exists).toBe(false);
    });
  });

  describe("handleDeleteTemplate", () => {
    it("deletes an existing template and returns true", async () => {
      await db.doc(`templates/${TEMPLATE_ID}`).set({
        id: TEMPLATE_ID,
        uid: TEST_UID,
        name: "Push Day Template",
        workoutType: "strength",
        notes: "",
        exercises: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      });

      const result = await handleDeleteTemplate(TEMPLATE_ID);

      expect(result).toBe(true);

      const templateSnap = await db.doc(`templates/${TEMPLATE_ID}`).get();

      expect(templateSnap.exists).toBe(false);
    });

    it("returns true when deleting a non-existing template does not throw", async () => {
      const result = await handleDeleteTemplate("missing-template-id");

      expect(result).toBe(true);
    });
  });
});
