import Feed from "@/app/(protected)/(tabs)/(feed)/feed";
import { subscribeToPendingFriendRequestCount } from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@/services/social-service", () => ({ subscribeToPendingFriendRequestCount: jest.fn() }));
jest.mock("@/hooks/social/useUserFeedInfinite", () => ({ useUserFeedInfinite: () => ({ data: { pages: [] }, isLoading: false, refetch: jest.fn() }) }));
jest.mock("@/hooks/user/usePublicProfile", () => ({ usePublicProfiles: jest.fn() }));
jest.mock("@/components/feed/feedItems/WorkoutCompleteFeedItem", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: jest.requireActual("react-native").Text }));
let listeners: { next: (count: number) => void; error: (error: Error) => void; unsubscribe: jest.Mock }[];
const setUser = (uid: string) => useUserStore.getState().setUser({ uid } as any);
const publish = (count: number) => act(() => listeners.at(-1)!.next(count));
beforeEach(() => {
  jest.clearAllMocks();
  listeners = [];
  setUser("alice");
  (subscribeToPendingFriendRequestCount as jest.Mock).mockImplementation((_uid, next, error) => {
    const unsubscribe = jest.fn();
    listeners.push({ next, error, unsubscribe });
    return unsubscribe;
  });
});
afterEach(cleanup);

test("zero pending requests hides the badge and the icon still opens friends", () => {
  render(<Feed />);
  publish(0);
  fireEvent.press(screen.getByRole("button", { name: "Friends" }));
  expect(mockPush).toHaveBeenCalledWith("/(protected)/(tabs)/(feed)/friendsList");
  expect(screen.queryByText("0")).toBeNull();
});
test.each([1, 5, 9])("displays %i pending requests", (count) => {
  render(<Feed />);
  publish(count);
  expect(screen.getByText(String(count))).toBeTruthy();
  expect(screen.getByRole("button", { name: `Friends, ${count} pending friend request${count === 1 ? "" : "s"}` })).toBeTruthy();
});
test.each([10, 20])("caps %i requests at 9+", (count) => {
  render(<Feed />);
  publish(count);
  expect(screen.getByText("9+")).toBeTruthy();
  expect(screen.queryByText(String(count))).toBeNull();
});
test("live updates increase, decrease, and remove the badge", () => {
  render(<Feed />);
  publish(1);
  publish(10);
  expect(screen.getByText("9+")).toBeTruthy();
  publish(9);
  expect(screen.getByText("9")).toBeTruthy();
  expect(screen.queryByText("9+")).toBeNull();
  publish(0);
  expect(screen.queryByText("9")).toBeNull();
  expect(screen.getByRole("button", { name: "Friends" })).toBeTruthy();
});
test("account switching unsubscribes and never displays the previous account's count", () => {
  render(<Feed />);
  publish(5);
  const old = listeners[0];
  act(() => setUser("bob"));
  expect(old.unsubscribe).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("5")).toBeNull();
  act(() => old.next(9));
  expect(screen.queryByText("9")).toBeNull();
  publish(1);
  expect(screen.getByText("1")).toBeTruthy();
});
test("unmounting cleans up the listener", () => {
  const view = render(<Feed />);
  view.unmount();
  expect(listeners[0].unsubscribe).toHaveBeenCalledTimes(1);
});
test("signed-out state does not subscribe", () => {
  useUserStore.getState().setUser(null);
  render(<Feed />);
  expect(subscribeToPendingFriendRequestCount).not.toHaveBeenCalled();
});
test("a listener error clears a stale badge", () => {
  const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
  render(<Feed />);
  publish(3);
  act(() => listeners[0].error(new Error("Unavailable")));
  expect(screen.queryByText("3")).toBeNull();
  warning.mockRestore();
});

// Exercise the actual service query separately from the screen's subscription mock.
jest.mock("@/lib/firebase", () => ({ db: {}, functions: {} }));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn((_db, name) => ({ collection: name })),
  where: jest.fn((field, operator, value) => ({ field, operator, value })),
  limit: jest.fn((count) => ({ limit: count })),
  query: jest.fn((...parts) => parts),
  onSnapshot: jest.fn(),
}));
test("service listens only for incoming pending requests and caps reads at ten", () => {
  const firestore = jest.requireMock("firebase/firestore");
  const service = jest.requireActual("@/services/social-service");
  const next = jest.fn();
  const error = jest.fn();
  const unsubscribe = jest.fn();
  firestore.onSnapshot.mockReturnValue(unsubscribe);
  expect(service.subscribeToPendingFriendRequestCount("alice", next, error)).toBe(unsubscribe);
  expect(firestore.onSnapshot).toHaveBeenCalledWith([
    { collection: "friendRequests" },
    { field: "toUid", operator: "==", value: "alice" },
    { field: "status", operator: "==", value: "pending" },
    { limit: 10 },
  ], expect.any(Function), error);
  firestore.onSnapshot.mock.calls[0][1]({ size: 7 });
  expect(next).toHaveBeenCalledWith(7);
});
