import { render, screen } from "@testing-library/react-native";
import ProtectedLayout from "../../app/(protected)/_layout";

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
    isAuthenticated: false,
    isHydrated: true,
    isSigningIn: false,
    error: null,
    signin: jest.fn(),
    signup: jest.fn(),
    signout: jest.fn(),
  }),
}));

jest.mock("../../stores/workout-store", () => ({
  useWorkoutStore: () => ({
    activeWorkoutDraft: null,
  }),
}));

describe("protected layout auth guard", () => {
  test("redirects to signin when user is not authenticated", () => {
    render(<ProtectedLayout />);

    expect(screen.getByText("Redirect:/(auth)/signin")).toBeTruthy();
    expect(screen.queryByText("StackRendered")).toBeNull();
    expect(screen.queryByText("Redirect:/activeWorkout")).toBeNull();
  });
});
