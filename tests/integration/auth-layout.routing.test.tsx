import { render, screen } from "@testing-library/react-native";
import React from "react";
import AuthLayout from "../../app/(auth)/_layout";

let mockAuthState = {
  isAuthenticated: false,
  isHydrated: true,
};

let mockUserState = {
  user: null as any,
};

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
  useAuthStore: () => mockAuthState,
}));

jest.mock("../../stores/user-store", () => ({
  useUserStore: () => mockUserState,
}));

describe("auth layout routing", () => {
  beforeEach(() => {
    mockAuthState = {
      isAuthenticated: false,
      isHydrated: true,
    };

    mockUserState = {
      user: null,
    };
  });

  test("renders auth stack when user is not authenticated", () => {
    render(<AuthLayout />);

    expect(screen.getByText("StackRendered")).toBeTruthy();
    expect(screen.getByText("StackScreen:signin")).toBeTruthy();
    expect(screen.getByText("StackScreen:signup")).toBeTruthy();
    expect(screen.getByText("StackScreen:forgot")).toBeTruthy();
  });

  test("redirects authenticated user without profile to onboarding", () => {
    mockAuthState = {
      isAuthenticated: true,
      isHydrated: true,
    };

    mockUserState = {
      user: null,
    };

    render(<AuthLayout />);

    expect(screen.getByText("Redirect:/(protected)/(onboarding)/welcome")).toBeTruthy();
    expect(screen.queryByText("StackRendered")).toBeNull();
  });

  test("redirects authenticated user with profile to root", () => {
    mockAuthState = {
      isAuthenticated: true,
      isHydrated: true,
    };

    mockUserState = {
      user: {
        uid: "user-123",
        username: "norman",
      },
    };

    render(<AuthLayout />);

    expect(screen.getByText("Redirect:/")).toBeTruthy();
    expect(screen.queryByText("StackRendered")).toBeNull();
  });
});
