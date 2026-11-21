import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import ProtectedLayout from "../../app/(protected)/_layout";
import { acceptCurrentTerms, hasAcceptedCurrentTerms } from "@/services/legal-service";
import { registerPushToken, subscribeToForegroundNotifications } from "@/services/notification-service";

let mockAuthState = { user: null as { uid: string } | null, isAuthenticated: false, isHydrated: true };
let mockDraft: any = null;
const mockReplace = jest.fn();
jest.mock("expo-router", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  const MockStack = ({ children }: { children?: React.ReactNode }) => <View><Text>StackRendered</Text>{children}</View>;
  MockStack.Screen = ({ name }: { name: string }) => <Text>{`StackScreen:${name}`}</Text>;
  return {
    Redirect: ({ href }: { href: string }) => <Text>{`Redirect:${href}`}</Text>,
    Stack: MockStack,
    Link: ({ children }: any) => children,
    useRouter: () => ({ replace: mockReplace }),
    usePathname: () => "/feed",
  };
});
jest.mock("@/services/legal-service", () => ({ acceptCurrentTerms: jest.fn(), hasAcceptedCurrentTerms: jest.fn() }));
jest.mock("@/services/notification-service", () => ({
  registerPushToken: jest.fn(), handleInitialNotification: jest.fn(),
  subscribeToForegroundNotifications: jest.fn(() => jest.fn()), subscribeToNotificationOpens: jest.fn(() => jest.fn()), subscribeToPushTokenRefresh: jest.fn(() => jest.fn()),
}));
jest.mock("@/components/system/HomeTimezoneSync", () => () => null);
jest.mock("@/components/system/PendingWorkoutPublisher", () => () => {
  const { Text } = require("react-native");
  return <Text>PublisherMounted</Text>;
});
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("../../stores/auth-store", () => ({
  useAuthStore: Object.assign(() => mockAuthState, { getState: () => ({ signout: jest.fn() }) }),
}));
jest.mock("../../stores/workout-store", () => ({ useWorkoutStore: () => ({ activeWorkoutDraft: mockDraft }) }));
beforeEach(() => {
  jest.clearAllMocks();
  mockAuthState = { user: null, isAuthenticated: false, isHydrated: true };
  mockDraft = null;
  (hasAcceptedCurrentTerms as jest.Mock).mockResolvedValue(false);
  (acceptCurrentTerms as jest.Mock).mockResolvedValue(undefined);
});
afterEach(cleanup);

test("redirects signed-out users without starting protected side effects", () => {
  render(<ProtectedLayout />);
  expect(screen.getByText("Redirect:/(auth)/signin")).toBeTruthy();
  expect(screen.queryByText("StackRendered")).toBeNull();
  expect(hasAcceptedCurrentTerms).not.toHaveBeenCalled();
  expect(subscribeToForegroundNotifications).not.toHaveBeenCalled();
});
test("existing users and active workouts cannot bypass missing acceptance", async () => {
  mockAuthState = { user: { uid: "alice" }, isAuthenticated: true, isHydrated: true };
  mockDraft = { status: "finishing" };
  render(<ProtectedLayout />);
  await waitFor(() => expect(screen.getByText("AGREE & CONTINUE")).toBeTruthy());
  expect(screen.queryByText("StackRendered")).toBeNull();
  expect(screen.queryByText("PublisherMounted")).toBeNull();
  expect(registerPushToken).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole("checkbox"));
  fireEvent.press(screen.getByText("AGREE & CONTINUE"));
  await waitFor(() => expect(screen.getByText("StackRendered")).toBeTruthy());
  expect(registerPushToken).toHaveBeenCalled();
  expect(screen.getByText("PublisherMounted")).toBeTruthy();
  expect(mockReplace).toHaveBeenCalledWith("/(protected)/workoutComplete");
});
test("persisted login waits for a fresh acceptance check and fails closed", async () => {
  mockAuthState = { user: { uid: "alice" }, isAuthenticated: true, isHydrated: true };
  (hasAcceptedCurrentTerms as jest.Mock).mockRejectedValue(new Error("Unavailable"));
  render(<ProtectedLayout />);
  expect(screen.queryByText("StackRendered")).toBeNull();
  await waitFor(() => expect(screen.getByText("TRY AGAIN")).toBeTruthy());
  expect(screen.queryByText("StackRendered")).toBeNull();
  expect(registerPushToken).not.toHaveBeenCalled();
});
test("account change remounts the acceptance gate without inheriting consent", async () => {
  mockAuthState = { user: { uid: "alice" }, isAuthenticated: true, isHydrated: true };
  (hasAcceptedCurrentTerms as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
  const view = render(<ProtectedLayout />);
  await waitFor(() => expect(screen.getByText("StackRendered")).toBeTruthy());
  mockAuthState = { user: { uid: "bob" }, isAuthenticated: true, isHydrated: true };
  act(() => view.rerender(<ProtectedLayout />));
  expect(screen.queryByText("StackRendered")).toBeNull();
  await waitFor(() => expect(screen.getByText("AGREE & CONTINUE")).toBeTruthy());
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
});
