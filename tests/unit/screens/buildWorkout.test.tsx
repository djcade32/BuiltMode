import BuildWorkout from "@/app/(protected)/(tabs)/(workout)/buildWorkout";
import { useWorkoutStore } from "@/stores/workout-store";
import { fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

describe("BuildWorkout", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
  });

  it("renders empty state initially", () => {
    const { getByText } = render(<BuildWorkout />);
    expect(getByText("No exercises added")).toBeTruthy();
    expect(getByText("Add at least one exercise to begin.")).toBeTruthy();
  });

  it("opens sheet, adds exercise, and enables build flow", () => {
    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));

    expect(getByText("Sheet Exercise")).toBeTruthy();
  });

  it("sets initial workout and navigates to confirmWorkout when build is completed", () => {
    const setInitialWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "setInitialWorkout");
    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("COMPLETE BUILD"));

    expect(setInitialWorkoutSpy).toHaveBeenCalledWith({
      workoutType: "strength",
      exercises: [
        expect.objectContaining({
          id: "exercise-sheet-1",
          name: "Sheet Exercise",
        }),
      ],
    });

    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/confirmWorkout");
  });
});
