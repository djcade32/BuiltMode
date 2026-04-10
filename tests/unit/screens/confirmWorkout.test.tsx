import ConfirmWorkout from "@/app/(protected)/(tabs)/(workout)/confirmWorkout";
import { useWorkoutStore } from "@/stores/workout-store";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import { makeInitialWorkout } from "../../test-utils/workout-fixtures";

const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    back: mockBack,
  }),
}));

jest.mock("uuid", () => ({
  v4: () => "mock-session-id",
}));

jest.mock("@/stores/user-store", () => ({
  useUserStore: () => ({
    user: {
      uid: "user-1",
    },
  }),
}));

describe("confirmWorkout", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
  });

  it("redirects to buildWorkout if initialWorkout is missing", async () => {
    render(<ConfirmWorkout />);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it("renders workout preview when initial workout exists", () => {
    useWorkoutStore.setState({
      initialWorkout: makeInitialWorkout(),
    });

    const { getByText } = render(<ConfirmWorkout />);

    expect(getByText("READY TO\nBEGIN?")).toBeTruthy();
    expect(getByText("Bench Press")).toBeTruthy();
    expect(getByText("Pull Ups")).toBeTruthy();
  });

  it("starts workout when START WORKOUT is pressed", () => {
    const startWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "startWorkout");

    useWorkoutStore.setState({
      initialWorkout: makeInitialWorkout(),
    });

    const { getByText } = render(<ConfirmWorkout />);
    fireEvent.press(getByText("START WORKOUT"));

    expect(startWorkoutSpy).toHaveBeenCalledWith({
      sessionId: "mock-session-id",
      uid: "user-1",
      exercises: expect.any(Array),
      workoutType: "strength",
    });
  });

  it("goes back when GO BACK is pressed", () => {
    useWorkoutStore.setState({
      initialWorkout: makeInitialWorkout(),
    });

    const { getByText } = render(<ConfirmWorkout />);
    fireEvent.press(getByText("GO BACK"));

    expect(mockBack).toHaveBeenCalled();
  });
});
