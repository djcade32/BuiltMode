import HomeScreen from "@/app/(protected)/(tabs)/index";
import Profile from "@/app/(protected)/(tabs)/(profile)/profile";
import { render, screen } from "@testing-library/react-native";
import React from "react";

let mockIsDeloadWeek = false;
const mockUser = { uid: "u1", username: "user", displayName: "User", isPracticeWeek: false, pendingDeloadWeekStartsAt: { seconds: 2_000_000_000 } };
jest.mock("@/stores/user-store", () => ({ useUserStore: () => ({ user: mockUser }) }));
jest.mock("@/stores/workout-store", () => ({ useWorkoutStore: () => ({ setInitialWorkout: jest.fn() }) }));
jest.mock("@/hooks/user/useCurrentWeekAggregate", () => ({
  useCurrentWeekAggregate: () => ({ data: { isDeloadWeek: mockIsDeloadWeek, isOfficialWeek: true }, isLoading: false, refetch: jest.fn() }),
}));
jest.mock("@/hooks/useQuery", () => ({
  useQuery: () => ({ data: { currentWeekStreak: 4 }, isLoading: false, refetch: jest.fn() }),
}));
jest.mock("@/hooks/workouts/useUserWorkoutsInfinite", () => ({
  useUserWorkoutsInfinite: () => ({ data: { pages: [] }, isLoading: false }),
}));
jest.mock("@/services/user-service", () => ({}));
jest.mock("@/components/home/ModeScoreWidget", () => () => null);
jest.mock("@/components/home/PerformanceSnapshotWidget", () => () => null);
jest.mock("@/components/home/RecentFriendActivityWidget", () => () => null);
jest.mock("@/components/home/TrainingTargetWidget", () => () => null);
jest.mock("@/components/profile/AccountabilitySummaryWidget", () => () => null);
jest.mock("@/components/profile/ThisWeekWidget", () => () => null);
jest.mock("@/components/workout/workoutHistory/WorkoutHistoryCard", () => () => null);
jest.mock("@/components/ui/Avatar", () => () => null);
jest.mock("@/components/ui/ThemedButton", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));

describe.each([["Home", HomeScreen], ["Profile", Profile]] as const)("%s deload indicator", (_name, Screen) => {
  test("shows an active deload", () => {
    mockIsDeloadWeek = true;
    render(<Screen />);
    expect(screen.getByText("DELOAD WEEK")).toBeTruthy();
  });

  test("does not show an indicator for a pending or ended deload", () => {
    mockIsDeloadWeek = false;
    render(<Screen />);
    expect(screen.queryByText("DELOAD WEEK")).toBeNull();
  });
});

test("Home explains streak protection", () => {
  mockIsDeloadWeek = true;
  render(<HomeScreen />);
  expect(screen.getByText("Take time to recover. Your streak is protected this week.")).toBeTruthy();
});

test("Profile keeps the streak badge alongside the deload badge", () => {
  mockIsDeloadWeek = true;
  render(<Profile />);
  expect(screen.getByText("DELOAD WEEK")).toBeTruthy();
  expect(screen.getByText("ON STREAK")).toBeTruthy();
});
