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

jest.mock("react-native-draggable-flatlist", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockDraggableFlatList = React.forwardRef(
    ({ data = [], renderItem, ListFooterComponent, ListFooterComponentStyle }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        scrollToEnd: jest.fn(),
        scrollToIndex: jest.fn(),
      }));

      return (
        <View>
          {data.map((item: any, index: number) => (
            <React.Fragment key={item.id ?? index}>
              {renderItem({ item, index, drag: jest.fn(), isActive: false })}
            </React.Fragment>
          ))}
          {ListFooterComponent ? (
            <View style={ListFooterComponentStyle}>
              <ListFooterComponent />
            </View>
          ) : null}
        </View>
      );
    },
  );

  return {
    __esModule: true,
    default: MockDraggableFlatList,
    ScaleDecorator: ({ children }: any) => <>{children}</>,
  };
});

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

    expect(getByText("Start empty or build first")).toBeTruthy();
    expect(getByText("Begin your workout now and add exercises as you go, or build your workout first.")).toBeTruthy();
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
      notes: "",
    });

    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/confirmWorkout");
  });

  it("saves the built workout as a template", async () => {
    const saveTemplateSpy = useWorkoutStore.getState().saveWorkoutAsTemplate as jest.Mock;

    const { getByText } = render(<BuildWorkout />);

    fireEvent.press(getByText("ADD EXERCISE"));
    fireEvent.press(getByText("SELECT_EXERCISE"));
    fireEvent.press(getByText("Save As Template"));

    await waitFor(() => {
      expect(saveTemplateSpy).toHaveBeenCalledWith({
        name: "Strength Workout",
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
    fireEvent.press(getByText("Save As Template"));

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
    fireEvent.press(getByText("Save As Template"));

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
    fireEvent.press(getByText("Save As Template"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalled();
    });

    const toastConfig = (Toast.show as jest.Mock).mock.calls[0][0];

    toastConfig.props.action();

    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/viewTemplates");
  });
});
