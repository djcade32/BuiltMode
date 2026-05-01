// import BuildWorkout from "@/app/(protected)/(tabs)/(workout)/buildWorkout";
// import { useWorkoutStore } from "@/stores/workout-store";
// import { fireEvent, render } from "@testing-library/react-native";
// import React from "react";
// import { resetWorkoutStore } from "../../test-utils/reset-workout-store";

// const mockPush = jest.fn();
// const mockBack = jest.fn();

// jest.mock("expo-router", () => ({
//   useRouter: () => ({
//     push: mockPush,
//     back: mockBack,
//   }),
// }));

// describe("BuildWorkout", () => {
//   beforeEach(() => {
//     resetWorkoutStore();
//     jest.clearAllMocks();
//   });

//   it("renders empty state initially", () => {
//     const { getByText } = render(<BuildWorkout />);
//     expect(getByText("No exercises added")).toBeTruthy();
//     expect(getByText("Add at least one exercise to begin.")).toBeTruthy();
//   });

//   it("opens sheet, adds exercise, and enables build flow", () => {
//     const { getByText } = render(<BuildWorkout />);

//     fireEvent.press(getByText("ADD EXERCISE"));
//     fireEvent.press(getByText("SELECT_EXERCISE"));

//     expect(getByText("Sheet Exercise")).toBeTruthy();
//   });

//   it("sets initial workout and navigates to confirmWorkout when build is completed", () => {
//     const setInitialWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "setInitialWorkout");
//     const { getByText } = render(<BuildWorkout />);

//     fireEvent.press(getByText("ADD EXERCISE"));
//     fireEvent.press(getByText("SELECT_EXERCISE"));
//     fireEvent.press(getByText("COMPLETE BUILD"));

//     expect(setInitialWorkoutSpy).toHaveBeenCalledWith({
//       workoutType: "strength",
//       exercises: [
//         expect.objectContaining({
//           id: "exercise-sheet-1",
//           name: "Sheet Exercise",
//         }),
//       ],
//       name: "Strength Workout",
//     });

//     expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/confirmWorkout");
//   });
// });

import BuildWorkout from "@/app/(protected)/(tabs)/(workout)/buildWorkout";
import { useWorkoutStore } from "@/stores/workout-store";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import Toast from "react-native-toast-message";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockInvalidateQueries = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock("@/stores/user-store", () => ({
  useUserStore: () => ({
    user: { uid: "user-123" },
  }),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

describe("BuildWorkout", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();

    jest.spyOn(useWorkoutStore.getState(), "saveWorkoutAsTemplate").mockResolvedValue({
      id: "template-123",
      name: "Strength Workout",
      workoutType: "strength",
      exercises: [],
      notes: "",
    } as any);
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
      name: "Strength Workout",
    });

    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/confirmWorkout");
  });

  it("saves the built workout as a template", async () => {
    const saveTemplateSpy = useWorkoutStore.getState().saveWorkoutAsTemplate as jest.Mock;

    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("SAVE AS TEMPLATE"));

    await waitFor(() => {
      expect(saveTemplateSpy).toHaveBeenCalledWith({
        name: undefined,
        workoutType: "strength",
        exercises: [
          expect.objectContaining({
            id: "exercise-sheet-1",
            name: "Sheet Exercise",
          }),
        ],
        notes: "",
      });
    });
  });

  it("invalidates templates query after saving template", async () => {
    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("SAVE AS TEMPLATE"));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["templates", "user-123"],
      });
    });
  });

  it("shows success toast after saving template", async () => {
    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("SAVE AS TEMPLATE"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          text1: "Workout saved as template",
          props: expect.objectContaining({
            actionText: "View",
          }),
        }),
      );
    });
  });

  it("toast view action navigates to view templates", async () => {
    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("SAVE AS TEMPLATE"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled();
    });

    const toastConfig = (Toast.show as jest.Mock).mock.calls[0][0];

    toastConfig.props.action();

    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/viewTemplates");
  });
});
