// __tests__/home-screen.test.tsx

import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";

import HomeScreen from "@/app/(protected)/(tabs)/index";

const mockPush = jest.fn();
const mockSetInitialWorkout = jest.fn();

let mockUser: any;

let mockQueryResponses: any = {
  userStats: {
    data: {
      currentWeekStreak: 4,
      bestWeekStreak: 7,
      totalWorkoutsLogged: 42,
      modeScore: 72,
    },
    isLoading: false,
    error: null,
  },
  currentWeekAggregate: {
    data: {
      weekId: "2026-05-11",
      activeDaysThisWeek: 5,
      metTargetThisWeek: true,
      modeScore: 84,
    },
    isLoading: false,
    error: null,
  },
  lastWeekAggregate: {
    data: {
      weekId: "2026-05-04",
      activeDaysThisWeek: 4,
      metTargetThisWeek: false,
      modeScore: 78,
    },
    isLoading: false,
    error: null,
  },
  monthAggregate: {
    data: {
      monthId: "2026-05",
      totalWorkouts: 12,
      activeDaysCount: 8,
    },
    isLoading: false,
    error: null,
  },
};

jest.mock("@/stores/user-store", () => ({
  useUserStore: () => ({
    user: mockUser,
  }),
}));

jest.mock("@/stores/workout-store", () => ({
  useWorkoutStore: () => ({
    setInitialWorkout: mockSetInitialWorkout,
  }),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    SafeAreaView: ({ children }: any) => <View>{children}</View>,
  };
});

jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { Text } = require("react-native");

  const MockIcon = ({ name }: any) => React.createElement(Text, null, name);

  return {
    FontAwesome5: MockIcon,
    FontAwesome6: MockIcon,
    Ionicons: MockIcon,
  };
});

jest.mock("@/components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return {
    ThemedText: ({ children, ...props }: any) => React.createElement(Text, props, children),
  };
});

jest.mock("@/components/ui/ThemedButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");

  return function MockThemedButton({ title, children, onPress }: any) {
    return React.createElement(
      Pressable,
      {
        accessibilityRole: "button",
        onPress,
      },
      React.createElement(Text, null, title ?? children),
    );
  };
});

jest.mock("@/components/ui/Progressbar", () => {
  const React = require("react");
  const { Text } = require("react-native");

  return function MockProgressbar({ percentage }: { percentage: number }) {
    return React.createElement(Text, null, `Progress ${percentage}%`);
  };
});

jest.mock("@/components/home/RecentFriendActivityWidget", () => {
  return function MockRecentFriendActivityWidget() {
    return null;
  };
});

jest.mock("@/services/user-service", () => ({
  fetchUserStats: jest.fn(),
  fetchUserWeekAggregate: jest.fn(),
  fetchUserMonthAggregate: jest.fn(),
}));

jest.mock(
  "@builtmode/shared",
  () => ({
    getWeekId: jest.fn((date: Date | string) => {
      if (date instanceof Date) return "2026-05-04";
      return "2026-05-11";
    }),
    getMonthId: jest.fn(() => "2026-05"),
  }),
  { virtual: true },
);

jest.mock("@/hooks/useQuery", () => ({
  useQuery: jest.fn(({ queryKey, params }: any) => {
    const queryName = queryKey[0];

    if (queryName === "user-stats") {
      return mockQueryResponses.userStats;
    }

    if (queryName === "user-month-aggregate") {
      return mockQueryResponses.monthAggregate;
    }

    if (queryName === "user-week-aggregate") {
      if (params?.weekId === "2026-05-04") {
        return mockQueryResponses.lastWeekAggregate;
      }

      return mockQueryResponses.currentWeekAggregate;
    }

    return {
      data: null,
      isLoading: false,
      error: null,
    };
  }),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = {
      uid: "user-123",
      username: "norman",
      displayName: "Norman",
      homeTimezone: "America/New_York",
      weeklyTargetDays: 5,
      isPracticeWeek: false,
    };

    mockQueryResponses = {
      userStats: {
        data: {
          currentWeekStreak: 4,
          bestWeekStreak: 7,
          totalWorkoutsLogged: 42,
          modeScore: 72,
        },
        isLoading: false,
        error: null,
      },
      currentWeekAggregate: {
        data: {
          weekId: "2026-05-11",
          activeDaysThisWeek: 5,
          metTargetThisWeek: true,
          modeScore: 84,
        },
        isLoading: false,
        error: null,
      },
      lastWeekAggregate: {
        data: {
          weekId: "2026-05-04",
          activeDaysThisWeek: 4,
          metTargetThisWeek: false,
          modeScore: 78,
        },
        isLoading: false,
        error: null,
      },
      monthAggregate: {
        data: {
          monthId: "2026-05",
          totalWorkouts: 12,
          activeDaysCount: 8,
        },
        isLoading: false,
        error: null,
      },
    };
  });

  it("returns null when there is no authenticated user", () => {
    mockUser = null;

    const { toJSON } = render(<HomeScreen />);

    expect(toJSON()).toBeNull();
  });

  it("renders the normal home screen with all functional widgets", () => {
    render(<HomeScreen />);

    expect(screen.getByText("WEEK STREAK")).toBeTruthy();
    expect(screen.getByText("Consecutive Weeks Meeting Target")).toBeTruthy();

    expect(screen.getByText("TRAINING TARGET")).toBeTruthy();
    expect(screen.getByText("THIS WEEK")).toBeTruthy();
    expect(screen.getByText("5 Days / Week")).toBeTruthy();
    expect(screen.getByText("Progress 80%")).toBeTruthy();

    expect(screen.getByText("MODE SCORE")).toBeTruthy();
    expect(screen.getByText("72")).toBeTruthy();
    expect(screen.getByTestId("mode-score-diff")).toHaveTextContent("arrow-down -6 This Week");
    expect(screen.getByText("This Week")).toBeTruthy();

    expect(screen.getByText("PERFORMANCE SNAPSHOT")).toBeTruthy();
    expect(screen.getByText("Best")).toBeTruthy();
    expect(screen.getByText("Week Streak")).toBeTruthy();
    expect(screen.getByText("7")).toBeTruthy();

    expect(screen.getByText("Workouts")).toBeTruthy();
    expect(screen.getByText("12")).toBeTruthy();

    expect(screen.getByText("Active Days ")).toBeTruthy();
    expect(screen.getByText("8")).toBeTruthy();

    expect(screen.getByText("LOG WORKOUT")).toBeTruthy();
  });

  it("starts a new workout when the log workout button is pressed", () => {
    render(<HomeScreen />);

    fireEvent.press(screen.getByText("LOG WORKOUT"));

    expect(mockSetInitialWorkout).toHaveBeenCalledWith(null);
    expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(workout)/buildWorkout");
  });

  it("does not render ModeScoreWidget during practice week", () => {
    mockUser = {
      ...mockUser,
      isPracticeWeek: true,
    };

    render(<HomeScreen />);

    // expect(screen.getByText("OFFICIAL START")).toBeTruthy();
    expect(screen.getByText("MONDAY")).toBeTruthy();
    expect(screen.getByText("Your first official week begins soon.")).toBeTruthy();

    expect(screen.queryByText("MODE SCORE")).toBeNull();
  });

  it("renders practice week versions of TrainingTargetWidget and PerformanceSnapshotWidget", () => {
    mockUser = {
      ...mockUser,
      isPracticeWeek: true,
    };

    render(<HomeScreen />);

    expect(screen.getByText("TRAINING TARGET")).toBeTruthy();
    expect(screen.getAllByText("OFFICIAL START").length).toBeGreaterThan(0);
    expect(screen.getByText("5 Days / Week")).toBeTruthy();
    expect(screen.getByText("Your streak and Mode Score activate next week.")).toBeTruthy();

    expect(screen.getByText("PREPARATION")).toBeTruthy();
    expect(screen.getByText("Workouts")).toBeTruthy();
    expect(screen.getByText("Before Start")).toBeTruthy();
    expect(screen.getByText("42")).toBeTruthy();

    expect(screen.queryByText("Week Streak")).toBeNull();
    expect(screen.queryByText("Active Days ")).toBeNull();
  });

  it("renders widget error states when aggregate queries fail", () => {
    mockQueryResponses = {
      userStats: {
        data: null,
        isLoading: false,
        error: new Error("Failed to load user stats"),
      },
      currentWeekAggregate: {
        data: null,
        isLoading: false,
        error: new Error("Failed to load week aggregate"),
      },
      lastWeekAggregate: {
        data: null,
        isLoading: false,
        error: new Error("Failed to load last week aggregate"),
      },
      monthAggregate: {
        data: null,
        isLoading: false,
        error: new Error("Failed to load month aggregate"),
      },
    };

    render(<HomeScreen />);

    expect(screen.getByText("Error loading training metrics")).toBeTruthy();
    expect(screen.getByText("Error loading mode score")).toBeTruthy();
    expect(screen.getByText("Error loading performance snapshot")).toBeTruthy();
  });

  it("renders non-target-met training progress correctly", () => {
    mockQueryResponses.currentWeekAggregate = {
      data: {
        weekId: "2026-05-11",
        activeDaysThisWeek: 3,
        metTargetThisWeek: false,
        modeScore: 80,
      },
      isLoading: false,
      error: null,
    };

    render(<HomeScreen />);

    expect(screen.getByText("TRAINING TARGET")).toBeTruthy();
    expect(screen.getByText("Progress 80%")).toBeTruthy();
    expect(screen.queryByText("Target met")).toBeNull();
  });

  it("renders a negative mode score change from last week", () => {
    mockQueryResponses.userStats = {
      data: {
        currentWeekStreak: 4,
        bestWeekStreak: 7,
        totalWorkoutsLogged: 42,
        modeScore: 72,
      },
      isLoading: false,
      error: null,
    };

    mockQueryResponses.lastWeekAggregate = {
      data: {
        weekId: "2026-05-04",
        activeDaysThisWeek: 5,
        metTargetThisWeek: true,
        modeScore: 78,
      },
      isLoading: false,
      error: null,
    };

    render(<HomeScreen />);

    expect(screen.getByText("MODE SCORE")).toBeTruthy();
    expect(screen.getByText("72")).toBeTruthy();
    expect(screen.getByTestId("mode-score-diff")).toHaveTextContent("arrow-down -6 This Week");
  });
});
