import WorkoutComplete from "@/app/(protected)/workoutComplete";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import {
  makeActiveWorkoutDraft,
  makeCompleteWorkoutResponse,
} from "../../test-utils/workout-fixtures";

const mockReplace = jest.fn();
const mockRedirect = jest.fn((props: any) => null);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

describe("workoutComplete", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
  });

  it("redirects if completeWorkoutResponse is missing", () => {
    render(<WorkoutComplete />);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "/(protected)/(tabs)/(workout)/log",
      }),
    );
  });

  it("renders summary info when completeWorkoutResponse exists", () => {
    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: makeCompleteWorkoutResponse() as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    useUserStore.setState({
      user: {
        uid: "123",
        username: "djcade32",
        goal: "BUILD MUSCLE",
        metrics: undefined,
        displayName: "Norman",
        avatarUrl: undefined,
        homeTimezone: "America, NY",
        officialStartWeekId: "2026-05-18",
        weeklyTargetDays: 5,
        isPracticeWeek: false,
      },
    });

    const { getByText } = render(<WorkoutComplete />);

    expect(getByText("Workout Complete")).toBeTruthy();
    expect(getByText("01:01:11")).toBeTruthy();
    expect(getByText("82")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("Bench Press")).toBeTruthy();
    expect(getByText("Pull Ups")).toBeTruthy();
    expect(getByText("Keep showing up.")).toBeTruthy();
  });

  it("shows negative consistency copy when mode score drops", () => {
    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: {
        ...makeCompleteWorkoutResponse(),
        modeScoreDifference: -2,
      } as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    const { getByText } = render(<WorkoutComplete />);
    expect(getByText("Stay consistent.")).toBeTruthy();
  });

  it("clears workout and redirects when DONE is pressed", () => {
    const clearWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "clearWorkout");

    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: makeCompleteWorkoutResponse() as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    const { getByText } = render(<WorkoutComplete />);
    fireEvent.press(getByText("DONE"));

    expect(clearWorkoutSpy).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/log");
  });
});
