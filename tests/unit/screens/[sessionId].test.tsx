import WorkoutHistoryDetails from "@/app/(protected)/(tabs)/(workout)/(workoutHistoryDetails)/[sessionId]";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockSaveWorkoutAsTemplate = jest.fn();
const mockSetInitialWorkout = jest.fn();
const mockToastShow = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({
    sessionId: "session-123",
  }),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock("@/hooks/useQuery", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

jest.mock("@/stores/user-store", () => ({
  useUserStore: () => ({
    user: { uid: "user-123" },
  }),
}));

jest.mock("@/stores/workout-store", () => ({
  useWorkoutStore: () => ({
    saveWorkoutAsTemplate: mockSaveWorkoutAsTemplate,
    setInitialWorkout: mockSetInitialWorkout,
  }),
}));

jest.mock("react-native-toast-message", () => ({
  show: (...args: any[]) => mockToastShow(...args),
}));

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockIcon = ({ name }: any) => <Text>{name}</Text>;

  return {
    MaterialIcons: MockIcon,
    MaterialCommunityIcons: MockIcon,
    FontAwesome: MockIcon,
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock("@/components/workout/workoutHistory/WorkoutHistoryExerciseBreakdown", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockWorkoutHistoryExerciseBreakdown = ({ exercise }: any) => <Text>{exercise.name}</Text>;

  return {
    __esModule: true,
    default: MockWorkoutHistoryExerciseBreakdown,
  };
});

jest.mock("react-native-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockLinearGradient = ({ children, ...props }: any) => <View {...props}>{children}</View>;

  return {
    __esModule: true,
    default: MockLinearGradient,
  };
});

jest.mock("@/components/ui/DropdownMenu", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  const MockDropdownMenu = ({ options }: any) => (
    <View>
      {options.map((option: any) => (
        <TouchableOpacity key={option.text} onPress={option.onSelect}>
          <Text>{option.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return {
    __esModule: true,
    default: MockDropdownMenu,
  };
});

jest.mock("@/components/workout/WorkoutNameSheet", () => {
  const React = require("react");
  const { View, Text, TouchableOpacity } = require("react-native");

  const MockWorkoutNameSheet = ({ visible, onSave, onClose }: any) => {
    if (!visible) return null;

    return (
      <View>
        <Text>Workout Name Sheet</Text>

        <TouchableOpacity onPress={() => onSave("Saved Template")}>
          <Text>Save Template Name</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onClose}>
          <Text>Close Template Sheet</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return {
    __esModule: true,
    default: MockWorkoutNameSheet,
  };
});

const mockWorkout = {
  sessionId: "session-123",
  name: "Push Day",
  workoutType: "strength",
  duration: 1250,
  completedAt: {
    seconds: 1715100000,
    nanoseconds: 0,
  },
  notes: "Felt strong today.",
  exercises: [
    { id: "1", name: "Bench Press", sets: [] },
    { id: "2", name: "Incline DB Press", sets: [] },
  ],
};

const setupSuccessState = (overrides = {}) => {
  mockUseQuery.mockReturnValue({
    data: {
      ...mockWorkout,
      ...overrides,
    },
    isLoading: false,
    error: null,
  });
};

describe("WorkoutHistoryDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSaveWorkoutAsTemplate.mockResolvedValue({
      id: "template-123",
      ...mockWorkout,
    });
  });

  it("renders loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("WORKOUT")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("failed"),
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("Something went wrong loading workout.")).toBeTruthy();
  });

  it("renders workout not found state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("Workout not found.")).toBeTruthy();
  });

  it("renders workout details when data exists", () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("Push Day")).toBeTruthy();
    expect(screen.getByText("Strength")).toBeTruthy();
    expect(screen.getByText("2 exercises")).toBeTruthy();
    expect(screen.getByText("Bench Press")).toBeTruthy();
    expect(screen.getByText("Incline DB Press")).toBeTruthy();
    expect(screen.getByText("NOTES")).toBeTruthy();
    expect(screen.getByText("Felt strong today.")).toBeTruthy();
  });

  it("falls back to workout type when name is empty", () => {
    setupSuccessState({
      name: "",
      workoutType: "conditioning",
      notes: "",
      exercises: [{ id: "1", name: "Sled Push", sets: [] }],
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("Conditioning Workout")).toBeTruthy();
  });

  it("renders singular exercise label when workout has one exercise", () => {
    setupSuccessState({
      name: "Morning Mobility",
      workoutType: "mobility",
      notes: "",
      exercises: [{ id: "1", name: "Hip Opener", sets: [] }],
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("1 exercise")).toBeTruthy();
  });

  it("does not render notes section when notes are empty", () => {
    setupSuccessState({
      notes: "",
      exercises: [{ id: "1", name: "Hip Opener", sets: [] }],
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.queryByText("NOTES")).toBeNull();
  });

  it("navigates back when back button is pressed", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByTestId("workout-details-back-button"));

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it("renders dropdown options", () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("COPY")).toBeTruthy();
    expect(screen.getByText("SAVE AS TEMPLATE")).toBeTruthy();
  });

  it("sets the selected workout as the initial workout when COPY is pressed", () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("COPY"));

    expect(mockSetInitialWorkout).toHaveBeenCalledTimes(1);
    expect(mockSetInitialWorkout).toHaveBeenCalledWith(
      expect.objectContaining({
        exercises: [
          { id: "1", name: "Bench Press", sets: [] },
          { id: "2", name: "Incline DB Press", sets: [] },
        ],
        name: "Push Day",
        workoutType: "strength",
      }),
    );
  });

  it("opens the workout name sheet when SAVE AS TEMPLATE is pressed", () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));

    expect(screen.getByText("Workout Name Sheet")).toBeTruthy();
  });

  it("closes the workout name sheet when close is pressed", () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));
    expect(screen.getByText("Workout Name Sheet")).toBeTruthy();

    fireEvent.press(screen.getByText("Close Template Sheet"));

    expect(screen.queryByText("Workout Name Sheet")).toBeNull();
  });

  it("saves workout as template when template name is submitted", async () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));
    fireEvent.press(screen.getByText("Save Template Name"));

    await waitFor(() => {
      expect(mockSaveWorkoutAsTemplate).toHaveBeenCalledTimes(1);
    });

    expect(mockSaveWorkoutAsTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        ...mockWorkout,
        name: "Saved Template",
      }),
    );
  });

  it("invalidates template-related queries after saving a template", async () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));
    fireEvent.press(screen.getByText("Save Template Name"));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
  });

  it("shows a success toast after saving a template", async () => {
    setupSuccessState();

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));
    fireEvent.press(screen.getByText("Save Template Name"));

    await waitFor(() => {
      expect(mockToastShow).toHaveBeenCalled();
    });
  });

  it("does not save a template when there is no workout data", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    fireEvent.press(screen.getByText("SAVE AS TEMPLATE"));
    expect(mockSaveWorkoutAsTemplate).not.toHaveBeenCalled();
  });
});
