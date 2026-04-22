import WorkoutHistoryDetails from "@/app/(protected)/(tabs)/(workout)/workoutHistoryDetails/[sessionId]";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

const mockBack = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
  useLocalSearchParams: () => ({
    sessionId: "session-123",
  }),
}));

jest.mock("@/hooks/useQuery", () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
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

jest.mock("react-native-popup-menu", () => {
  const React = require("react");
  const { View, TouchableOpacity } = require("react-native");

  return {
    Menu: ({ children }: any) => <View>{children}</View>,
    MenuTrigger: ({ children, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>{children}</TouchableOpacity>
    ),
    MenuOptions: ({ children }: any) => <View>{children}</View>,
    MenuOption: ({ children, onSelect }: any) => (
      <TouchableOpacity onPress={onSelect}>{children}</TouchableOpacity>
    ),
    renderers: {
      ContextMenu: "ContextMenu",
    },
  };
});

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");

  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
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

describe("WorkoutHistoryDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(screen.getByText("Something went wrong loading workouts.")).toBeTruthy();
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
    mockUseQuery.mockReturnValue({
      data: {
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
          { id: "1", name: "Bench Press" },
          { id: "2", name: "Incline DB Press" },
        ],
      },
      isLoading: false,
      error: null,
    });

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
    mockUseQuery.mockReturnValue({
      data: {
        sessionId: "session-123",
        name: "",
        workoutType: "conditioning",
        duration: 600,
        completedAt: {
          seconds: 1715100000,
          nanoseconds: 0,
        },
        notes: "",
        exercises: [{ id: "1", name: "Sled Push" }],
      },
      isLoading: false,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("Conditioning Workout")).toBeTruthy();
  });

  it("renders singular exercise label when workout has one exercise", () => {
    mockUseQuery.mockReturnValue({
      data: {
        sessionId: "session-123",
        name: "Morning Mobility",
        workoutType: "mobility",
        duration: 300,
        completedAt: {
          seconds: 1715100000,
          nanoseconds: 0,
        },
        notes: "",
        exercises: [{ id: "1", name: "Hip Opener" }],
      },
      isLoading: false,
      error: null,
    });

    render(<WorkoutHistoryDetails />);

    expect(screen.getByText("1 exercise")).toBeTruthy();
  });

  it("does not render notes section when notes are empty", () => {
    mockUseQuery.mockReturnValue({
      data: {
        sessionId: "session-123",
        name: "Morning Mobility",
        workoutType: "mobility",
        duration: 300,
        completedAt: {
          seconds: 1715100000,
          nanoseconds: 0,
        },
        notes: "",
        exercises: [{ id: "1", name: "Hip Opener" }],
      },
      isLoading: false,
      error: null,
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

    expect(mockBack).toHaveBeenCalled();
  });
});
