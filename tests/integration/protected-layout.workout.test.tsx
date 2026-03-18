import { render, screen } from "@testing-library/react-native";
import ProtectedLayout from "../../app/(protected)/_layout";
import { storage } from "../../stores/mmkv-storage-wrapper";
import { useWorkoutStore } from "../../stores/workout-store";

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
  };
});

jest.mock("../../stores/auth-store", () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: true,
    isSigningIn: false,
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
    expect(screen.getByText("StackScreen:(tabs)")).toBeTruthy();
    expect(screen.queryByText("Redirect:/modal")).toBeNull();
  });

  test("redirects to modal when active workout exists", () => {
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

    expect(screen.getByText("Redirect:/modal")).toBeTruthy();
    expect(screen.queryByText("StackRendered")).toBeNull();
  });
});
