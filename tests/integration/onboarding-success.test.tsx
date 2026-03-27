import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import ModeScore from "../../app/(protected)/(onboarding)/modeScore";
import { useUserStore } from "../../stores/user-store";

const mockReplace = jest.fn();
const mockCreateUserProfile = jest.fn();
const mockSignout = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("../../stores/auth-store", () => ({
  useAuthStore: () => ({
    signout: mockSignout,
  }),
}));

jest.mock("../../stores/onboarding-store", () => ({
  useOnboardingStore: () => ({
    createUserProfile: mockCreateUserProfile,
    isCreatingUser: false,
  }),
}));

jest.mock("../../stores/user-store", () => {
  const actual = jest.requireActual("../../stores/user-store");
  return {
    ...actual,
    useUserStore: actual.useUserStore,
  };
});

jest.mock("../../components/themed-text", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ThemedText: ({ children, ...props }: any) => <Text {...props}>{children}</Text>,
  };
});

jest.mock("../../components/themed-view", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    ThemedView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock("../../components/ui/ThemedButton", () => {
  const React = require("react");
  const { Pressable, Text } = require("react-native");
  return function ThemedButton({ title, onPress, disabled }: any) {
    return (
      <Pressable onPress={onPress} disabled={disabled}>
        <Text>{title}</Text>
      </Pressable>
    );
  };
});

jest.mock("react-native-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return function LinearGradient({ children, ...props }: any) {
    return <View {...props}>{children}</View>;
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
  const Icon = (props: any) => <Text>{props.name ?? "icon"}</Text>;

  return {
    FontAwesome5: Icon,
    FontAwesome6: Icon,
    Ionicons: Icon,
    MaterialIcons: Icon,
  };
});

describe("ModeScore onboarding completion", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useUserStore.setState({
      user: null,
    });
  });

  test("successful onboarding completion sets user and routes to tabs", async () => {
    const createdUser = {
      uid: "user-123",
      username: "norman",
      goal: "Cut",
      metrics: ["Weight"],
      displayName: "Norman Cade",
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      homeTimezone: "America/New_York",
      officialStartWeekId: "2026-W13",
      weeklyTargetDays: 4,
      isPracticeWeek: true,
    };

    mockCreateUserProfile.mockResolvedValue(createdUser);

    render(<ModeScore />);

    fireEvent.press(screen.getByText("ENTER MODE"));

    await waitFor(() => {
      expect(mockCreateUserProfile).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(useUserStore.getState().user).toEqual(createdUser);
    });

    expect(mockReplace).toHaveBeenCalledWith("/(protected)/(tabs)");
    expect(mockSignout).not.toHaveBeenCalled();
  });
});
