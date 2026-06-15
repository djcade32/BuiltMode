import ViewHistory from "@/app/(protected)/(tabs)/(workout)/viewHistory";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockUseUserWorkoutsInfinite = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock("@/hooks/workouts/useUserWorkoutsInfinite", () => ({
  useUserWorkoutsInfinite: (...args: any[]) => mockUseUserWorkoutsInfinite(...args),
}));

jest.mock("@/stores/user-store", () => ({
  useUserStore: () => ({
    user: { uid: "user-123" },
  }),
}));

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock("@/components/ui/Input", () => {
  const React = require("react");
  const { TextInput } = require("react-native");

  return ({ value, onChangeText, placeholder }: any) => (
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} />
  );
});

jest.mock("@/components/workout/workoutHistory/WorkoutHistorySectionHeader", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return ({ title }: any) => <Text>{title}</Text>;
});

jest.mock("@/components/workout/workoutHistory/WorkoutHistoryCard", () => {
  const React = require("react");
  const { TouchableOpacity, Text, View } = require("react-native");

  return ({ workout, onPress }: any) => (
    <TouchableOpacity onPress={() => onPress(workout)}>
      <View>
        <Text>{workout.name || `${workout.workoutType} Workout`}</Text>
      </View>
    </TouchableOpacity>
  );
});

jest.mock("@/components/workout/workoutHistory/WorkoutHistoryMonthJumpModal", () => {
  const React = require("react");
  const { View, Text } = require("react-native");

  return ({ visible, months }: any) =>
    visible ? (
      <View>
        <Text>Jump to Month Modal</Text>
        {months.map((month: string) => (
          <Text key={month}>{month}</Text>
        ))}
      </View>
    ) : null;
});

const buildWorkout = ({
  sessionId,
  name,
  workoutType,
  completedAtSeconds,
}: {
  sessionId: string;
  name: string;
  workoutType: string;
  completedAtSeconds: number;
}) => ({
  sessionId,
  name,
  workoutType,
  completedAt: {
    seconds: completedAtSeconds,
    nanoseconds: 0,
  },
});

describe("ViewHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    expect(screen.getByText("WORKOUT HISTORY")).toBeTruthy();
  });

  it("renders error state", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: undefined,
      error: new Error("Failed"),
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    expect(screen.getByText("Something went wrong loading workouts.")).toBeTruthy();
  });

  it("renders empty state when no workouts exist", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [{ items: [] }],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    expect(screen.getByText("No workouts found.")).toBeTruthy();
  });

  it("renders workout history cards", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              buildWorkout({
                sessionId: "session-1",
                name: "Push Day",
                workoutType: "strength",
                completedAtSeconds: 1714521600,
              }),
              buildWorkout({
                sessionId: "session-2",
                name: "Morning Run",
                workoutType: "cardio",
                completedAtSeconds: 1711929600,
              }),
            ],
          },
        ],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    expect(screen.getByText("Push Day")).toBeTruthy();
    expect(screen.getByText("Morning Run")).toBeTruthy();
  });

  it("filters workouts based on search query", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              buildWorkout({
                sessionId: "session-1",
                name: "Push Day",
                workoutType: "strength",
                completedAtSeconds: 1714521600,
              }),
              buildWorkout({
                sessionId: "session-2",
                name: "Morning Run",
                workoutType: "cardio",
                completedAtSeconds: 1711929600,
              }),
            ],
          },
        ],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    fireEvent.changeText(screen.getByPlaceholderText("Search workouts"), "push");

    expect(screen.getByText("Push Day")).toBeTruthy();
    expect(screen.queryByText("Morning Run")).toBeNull();
  });

  it("navigates to workout details when a workout card is pressed", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              buildWorkout({
                sessionId: "session-123",
                name: "Push Day",
                workoutType: "strength",
                completedAtSeconds: 1714521600,
              }),
            ],
          },
        ],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    fireEvent.press(screen.getByText("Push Day"));

    expect(mockPush).toHaveBeenCalledWith("/(workoutHistoryDetails)/session-123");
  });

  it("opens month jump modal when jump to month is pressed", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [
          {
            items: [
              buildWorkout({
                sessionId: "session-1",
                name: "Push Day",
                workoutType: "strength",
                completedAtSeconds: 1714521600,
              }),
            ],
          },
        ],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    fireEvent.press(screen.getByText("Jump to Month"));

    expect(screen.getByText("Jump to Month Modal")).toBeTruthy();
  });

  it("does not open month jump modal when there are no sections", () => {
    mockUseUserWorkoutsInfinite.mockReturnValue({
      data: {
        pages: [{ items: [] }],
      },
      error: null,
      isLoading: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    });

    render(<ViewHistory />);

    fireEvent.press(screen.getByText("Jump to Month"));

    expect(screen.queryByText("Jump to Month Modal")).toBeNull();
  });
});
