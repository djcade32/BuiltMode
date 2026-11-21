import { workoutLiveActivityService } from "@/services/widgets/workout-live-activity-service";
import WorkoutLiveActivity from "@/widgets/WorkoutLiveActivity";
import { Platform } from "react-native";
import { waitFor } from "@testing-library/react-native";

let mockWorkoutState: any;
jest.mock("@/stores/workout-store", () => ({ useWorkoutStore: { getState: () => mockWorkoutState } }));
jest.mock("@/widgets/getWorkoutWidgetLogoUri", () => ({ getWorkoutWidgetLogoUri: async () => "file:///logo.png" }));
jest.mock("@/widgets/WorkoutLiveActivity", () => ({ __esModule: true, default: { start: jest.fn(), getInstances: jest.fn() } }));
jest.mock("expo-widgets", () => ({ addUserInteractionListener: jest.fn(() => ({ remove: jest.fn() })) }));
let instance: { update: jest.Mock; end: jest.Mock };
let workoutNumber = 0;
const state = (elapsedSeconds = 0): any => ({ workoutId: mockWorkoutState.activeWorkoutDraft.sessionId, workoutName: "Workout", startedAtMs: 1000, timerStartedAtMs: 1000, elapsedSeconds, isPaused: false, isResting: false });
beforeEach(async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  await workoutLiveActivityService.end();
  jest.clearAllMocks();
  mockWorkoutState = { activeWorkoutDraft: { sessionId: `w${++workoutNumber}`, status: "active", exercises: [{ id: "e1", name: "Bench", sets: [{ id: "s1", weight: 225, reps: 10 }] }] }, currentExerciseIndex: 0, workoutProgress: {}, isWorkoutComplete: false };
  instance = { update: jest.fn().mockResolvedValue(undefined), end: jest.fn().mockResolvedValue(undefined) };
  (WorkoutLiveActivity.start as jest.Mock).mockReturnValue(instance);
  (WorkoutLiveActivity.getInstances as jest.Mock).mockReturnValue([]);
});
// Import-time initialization has no workout, just a listener.
mockWorkoutState = { activeWorkoutDraft: null };
(WorkoutLiveActivity.getInstances as jest.Mock).mockReturnValue([]);

test("starts once and skips identical updates", async () => {
  await workoutLiveActivityService.sync(state());
  await workoutLiveActivityService.sync(state());
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(1);
  expect(instance.update).not.toHaveBeenCalled();
});
test("missing native activity clears the stale reference and recovers once", async () => {
  await workoutLiveActivityService.sync(state());
  instance.update.mockRejectedValueOnce(new Error("LiveActivityNotFoundException: Can't find live activity with id: old"));
  const replacement = { update: jest.fn().mockResolvedValue(undefined), end: jest.fn().mockResolvedValue(undefined) };
  (WorkoutLiveActivity.start as jest.Mock).mockReturnValue(replacement);
  await expect(workoutLiveActivityService.sync(state(1))).resolves.toBeUndefined();
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(2);
  await workoutLiveActivityService.sync(state(2));
  expect(replacement.update).toHaveBeenCalledTimes(1);
});
test("a second missing activity suppresses repeated errors and restarts for this workout", async () => {
  await workoutLiveActivityService.sync(state());
  instance.update.mockRejectedValue(new Error("LiveActivityNotFoundException"));
  await workoutLiveActivityService.sync(state(1));
  await workoutLiveActivityService.sync(state(2));
  await workoutLiveActivityService.sync(state(3));
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(2);
  expect(instance.update).toHaveBeenCalledTimes(2);
});
test("unexpected native errors propagate instead of triggering recreation", async () => {
  await workoutLiveActivityService.sync(state());
  instance.update.mockRejectedValueOnce(new Error("Permission denied"));
  await expect(workoutLiveActivityService.sync(state(1))).rejects.toThrow("Permission denied");
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(1);
});
test("finishing or stale workouts do not start activities", async () => {
  const stale = state();
  mockWorkoutState.activeWorkoutDraft.status = "finishing";
  await workoutLiveActivityService.sync(stale);
  mockWorkoutState.activeWorkoutDraft.sessionId = "another";
  mockWorkoutState.activeWorkoutDraft.status = "active";
  await workoutLiveActivityService.sync(stale);
  expect(WorkoutLiveActivity.start).not.toHaveBeenCalled();
});
test("end invalidates queued syncs and prevents subsequent updates from restarting the activity", async () => {
  await workoutLiveActivityService.sync(state());
  const pending = workoutLiveActivityService.sync(state(1));
  const ending = workoutLiveActivityService.end();
  await Promise.all([pending, ending]);
  await workoutLiveActivityService.sync(state(2));
  expect(instance.update).not.toHaveBeenCalled();
  expect(instance.end).toHaveBeenCalledTimes(1);
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(1);
});
test("a missing update finishing after end was requested cannot recreate the activity", async () => {
  await workoutLiveActivityService.sync(state());
  let reject!: (error: Error) => void;
  instance.update.mockReturnValueOnce(new Promise((_resolve, rejectUpdate) => { reject = rejectUpdate; }));
  const pending = workoutLiveActivityService.sync(state(1));
  await waitFor(() => expect(instance.update).toHaveBeenCalled());
  const ending = workoutLiveActivityService.end();
  reject(new Error("LiveActivityNotFoundException"));
  await Promise.all([pending, ending]);
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(1);
});
test("ending an already missing native activity still clears cached state", async () => {
  await workoutLiveActivityService.sync(state());
  instance.end.mockRejectedValueOnce(new Error("LiveActivityNotFoundException"));
  await expect(workoutLiveActivityService.end()).resolves.toBeUndefined();
  await workoutLiveActivityService.sync(state(1));
  expect(WorkoutLiveActivity.start).toHaveBeenCalledTimes(1);
});
test("Android performs no native live activity operations", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  await workoutLiveActivityService.sync(state());
  await workoutLiveActivityService.end();
  expect(WorkoutLiveActivity.start).not.toHaveBeenCalled();
});
