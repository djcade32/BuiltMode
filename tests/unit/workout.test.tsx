import { render, screen } from "@testing-library/react-native";
import { act } from "react";
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

describe("workout store", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("startWorkout sets activeWorkout", () => {
    const workout = {
      sessionId: "abc123",
      uid: "user1",
    };

    act(() => {
      useWorkoutStore.getState().startWorkout(workout);
    });

    expect(useWorkoutStore.getState().activeWorkoutDraft).toMatchObject({
      sessionId: "abc123",
      uid: "user1",
      exercises: [],
      status: "active",
    });
    expect(useWorkoutStore.getState().activeWorkoutDraft?.startedAtMs).toEqual(expect.any(Number));
    expect(useWorkoutStore.getState().activeWorkoutDraft?.lastEditedAtMs).toEqual(
      expect.any(Number),
    );
  });
});

describe("workout persistence", () => {
  beforeEach(() => {
    storage.clearAll();
    useWorkoutStore.setState({
      activeWorkoutDraft: null,
    });
  });

  test("startWorkout persists active workout", () => {
    const workout = {
      sessionId: "abc123",
      uid: "user1",
      startedAtMs: 123456,
      exercises: [],
      status: "active" as const,
      lastEditedAtMs: 123456,
    };

    useWorkoutStore.getState().startWorkout(workout);

    const raw = storage.getString("workout-store");
    expect(raw).toBeTruthy();
    expect(raw).toContain("abc123");
  });
});

describe("active workout guard", () => {
  beforeEach(() => {
    useWorkoutStore.setState({ activeWorkoutDraft: null });
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
