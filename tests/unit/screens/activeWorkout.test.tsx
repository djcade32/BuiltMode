import ActiveWorkout from "@/app/(protected)/activeWorkout";
import { useWorkoutStore } from "@/stores/workout-store";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import {
  makeActiveWorkoutDraft,
  makeCompleteWorkoutResponse,
} from "../../test-utils/workout-fixtures";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("react-timer-hook", () => ({
  useStopwatch: () => ({
    pause: jest.fn(),
    start: jest.fn(),
    reset: jest.fn(),
    hours: 0,
    minutes: 7,
    seconds: 0,
    isRunning: true,
    totalSeconds: 420,
  }),
}));

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};

  return {
    __esModule: true,
    default: {
      ...Reanimated.default,
      View: View,
    },
    useSharedValue: (value: any) => ({ value }),
    useAnimatedStyle: () => ({}),
    withRepeat: (value: any) => value,
    withSequence: (...args: any[]) => args[0],
    withTiming: (value: any) => value,
    View: React.forwardRef((props: any, ref: any) => <div ref={ref} {...props} />),
  };
});

describe("activeWorkout", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();

    useWorkoutStore.setState({
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
      workoutProgress: {
        "exercise-1": { sets: [{ id: "set-1" } as any], completed: false },
        "exercise-2": { sets: [{ id: "set-2" } as any], completed: false },
      },
      isWorkoutComplete: false,
      currentExerciseIndex: 0,
    });
  });

  it("renders current exercise", () => {
    const { getAllByText } = render(<ActiveWorkout />);
    expect(getAllByText("Bench Press").length).toBeGreaterThan(0);
  });

  it("advances current exercise when current exercise is completed", () => {
    const { getByText } = render(<ActiveWorkout />);
    fireEvent.press(getByText("COMPLETE_CURRENT_EXERCISE"));

    expect(useWorkoutStore.getState().currentExerciseIndex).toBe(1);
  });

  it("disables COMPLETE WORKOUT button until workout is complete", () => {
    const { getByTestId } = render(<ActiveWorkout />);
    const button = getByTestId("complete-workout-button");
    expect(button.props.accessibilityState.disabled).toBe(true);
  });

  it("enables COMPLETE WORKOUT button when workout is complete", () => {
    useWorkoutStore.setState({ isWorkoutComplete: true });

    const { getByTestId } = render(<ActiveWorkout />);
    const button = getByTestId("complete-workout-button");
    expect(button.props.accessibilityState.disabled).toBe(false);
  });

  it("logs workout and navigates to complete screen", async () => {
    const logWorkoutSpy = jest
      .spyOn(useWorkoutStore.getState(), "logWorkout")
      .mockResolvedValue(makeCompleteWorkoutResponse() as any);

    useWorkoutStore.setState({ isWorkoutComplete: true });

    const { getByText } = render(<ActiveWorkout />);
    fireEvent.press(getByText("COMPLETE WORKOUT"));

    await waitFor(() => {
      expect(logWorkoutSpy).toHaveBeenCalledWith(420);
      expect(mockReplace).toHaveBeenCalledWith("/(protected)/workoutComplete");
    });
  });

  it("shows exit confirmation when exit is selected", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const { getByText } = render(<ActiveWorkout />);

    fireEvent.press(getByText("Exit"));

    expect(alertSpy).toHaveBeenCalledWith(
      "Are You Sure?",
      "All workout progress will be lost.",
      expect.any(Array),
    );
  });

  it("clears workout when exit is confirmed", () => {
    const clearWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "clearWorkout");

    jest.spyOn(Alert, "alert").mockImplementation((title, message, buttons) => {
      const destructive = buttons?.find((b: any) => b.text === "Continue");
      destructive?.onPress?.();
    });

    const { getByText } = render(<ActiveWorkout />);
    fireEvent.press(getByText("Exit"));

    expect(clearWorkoutSpy).toHaveBeenCalled();
  });
});
