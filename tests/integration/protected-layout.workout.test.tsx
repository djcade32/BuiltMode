import { render, screen } from "@testing-library/react-native";
import ProtectedLayout from "../../app/(protected)/_layout";
import { storage } from "../../stores/mmkv-storage-wrapper";
import { useWorkoutStore } from "../../stores/workout-store";

const mockReplace = jest.fn();

jest.mock("expo-router", () => {
  const React = require("react");
  const { Text, View } = require("react-native");

  const MockStack = ({ children }: { children?: React.ReactNode }) => (
    <View>
      <Text>StackRendered</Text>
      {children}
    </View>
  );

  MockStack.Screen = ({ name }: { name: string }) => <Text>{`StackScreen:${name}`}</Text>;

  return {
    Redirect: ({ href }: { href: string }) => <Text>{`Redirect:${href}`}</Text>,
    Stack: MockStack,
    useRouter: () => ({
      replace: mockReplace,
    }),
    usePathname: () => null,
  };
});

jest.mock("../../stores/auth-store", () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: true,
    isSigningIn: false,
    isHydrated: true,
    error: null,
    signin: jest.fn(),
    signup: jest.fn(),
    signout: jest.fn(),
  }),
}));

describe("active workout guard", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("renders protected stack when no active workout exists", () => {
    render(<ProtectedLayout />);

    expect(screen.getByText("StackRendered")).toBeTruthy();
    expect(screen.getByText("StackScreen:(onboarding)")).toBeTruthy();
    expect(screen.getByText("StackScreen:(tabs)")).toBeTruthy();
    expect(screen.getByText("StackScreen:workoutComplete")).toBeTruthy();
    expect(screen.queryByText("Redirect:/(protected)/activeWorkout")).toBeNull();
  });

  test("redirects to active workout screen when active workout exists", () => {
    useWorkoutStore.setState({
      activeWorkoutDraft: {
        sessionId: "abc123",
        uid: "user1",
        startedAtMs: 123456,
        exercises: [],
        status: "active",
        lastEditedAtMs: 123456,
      },
    });

    render(<ProtectedLayout />);

    expect(mockReplace).toHaveBeenCalledWith("/(protected)/activeWorkout");
    expect(screen.getByText("StackRendered")).toBeTruthy();
  });

  test("redirects to workout complete when active workout is finishing", () => {
    useWorkoutStore.setState({
      activeWorkoutDraft: {
        sessionId: "abc123",
        uid: "user1",
        startedAtMs: 123456,
        exercises: [],
        status: "finishing",
        lastEditedAtMs: 123456,
      },
    });

    render(<ProtectedLayout />);

    expect(mockReplace).toHaveBeenCalledWith("/(protected)/workoutComplete");
    expect(screen.getByText("StackRendered")).toBeTruthy();
  });
});
