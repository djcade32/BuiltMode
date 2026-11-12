import FriendProfile from "@/app/(protected)/(tabs)/(feed)/(friendProfile)/[id]";
import BlockedUsers from "@/app/(protected)/(tabs)/(profile)/blockedUsers";
import { useBlockedUsers } from "@/hooks/social/useBlockedUsers";
import { useUserFeedInfinite } from "@/hooks/social/useUserFeedInfinite";
import { blockUser, unblockUser, subscribeToBlockedUsers, getUserFeed } from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Alert } from "react-native";

jest.mock("@/services/social-service", () => ({ blockUser: jest.fn(), unblockUser: jest.fn(), subscribeToBlockedUsers: jest.fn(), getUserFeed: jest.fn(), removeFriend: jest.fn() }));
jest.mock("@/services/user-service", () => ({}));
jest.mock("@/hooks/useQuery", () => ({ useQuery: () => ({ data: { usernameLower: "bob", displayName: "Bob" }, isLoading: false }) }));
jest.mock("@/hooks/workouts/useUserWorkoutsInfinite", () => ({ useUserWorkoutsInfinite: () => ({ data: { pages: [] }, isLoading: false }) }));
jest.mock("@/components/profile/AccountabilitySummaryWidget", () => () => null);
jest.mock("@/components/profile/ThisWeekWidget", () => () => null);
jest.mock("@/components/workout/workoutHistory/WorkoutHistoryCard", () => () => null);
jest.mock("@/components/ui/Avatar", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@builtmode/shared", () => ({ getWeekId: () => "2026-11-09" }));
jest.mock("react-native-popup-menu", () => {
  const { View, TouchableOpacity } = require("react-native");
  return {
    Menu: View, MenuOptions: View, renderers: { ContextMenu: View },
    MenuTrigger: ({ children, ...props }: any) => <TouchableOpacity {...props}>{children}</TouchableOpacity>,
    MenuOption: ({ children, onSelect, disabled }: any) => <TouchableOpacity disabled={disabled} onPress={onSelect}>{children}</TouchableOpacity>,
  };
});

const bob = { uid: "bob", username: "bob", displayName: "Bob" };
let client: QueryClient;
let subscriptions: { uid: string; next: (users: any[]) => void; error: (error: Error) => void; active: boolean }[];
const wrapper = ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const publish = (users: any[], uid = "alice") => act(() => {
  subscriptions.filter((sub) => sub.active && sub.uid === uid).forEach((sub) => sub.next(users));
});
const cachedFeed = () => ({ pages: [{ items: [{ feedItemId: "b1", actorUid: "bob" }, { feedItemId: "c1", actorUid: "charlie" }], hasMore: false }], pageParams: [null] });
const alertButton = (text: string) => (Alert.alert as jest.Mock).mock.calls.at(-1)[2].find((button: any) => button.text === text);
beforeEach(() => {
  jest.clearAllMocks();
  subscriptions = [];
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  useUserStore.getState().setUser({ uid: "alice" } as any);
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "bob" });
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  (subscribeToBlockedUsers as jest.Mock).mockImplementation((uid, next, error) => {
    const sub = { uid, next, error, active: true };
    subscriptions.push(sub);
    return () => { sub.active = false; };
  });
  (blockUser as jest.Mock).mockResolvedValue({ status: "blocked" });
  (unblockUser as jest.Mock).mockResolvedValue({ status: "unblocked" });
  (getUserFeed as jest.Mock).mockResolvedValue(cachedFeed().pages[0]);
});
afterEach(() => { cleanup(); client.clear(); jest.restoreAllMocks(); });

test("profile menu offers Block User and confirmation does not block on cancel", async () => {
  render(<FriendProfile />, { wrapper });
  publish([]);
  await waitFor(() => expect(screen.getByText("Block User")).toBeTruthy());
  fireEvent.press(screen.getByText("Block User"));
  expect(Alert.alert).toHaveBeenCalledWith("Block this user?", expect.any(String), expect.any(Array));
  expect(alertButton("Cancel")).toMatchObject({ style: "cancel" });
  expect(blockUser).not.toHaveBeenCalled();
  await act(async () => { await alertButton("Block User").onPress(); });
  expect(blockUser).toHaveBeenCalledWith("bob");
});
test("own profile has no block menu", () => {
  (useLocalSearchParams as jest.Mock).mockReturnValue({ id: "alice" });
  render(<FriendProfile />, { wrapper });
  expect(screen.queryByText("Block User")).toBeNull();
});
test("failed block displays an error and allows retry", async () => {
  (blockUser as jest.Mock).mockRejectedValue(new Error("Offline"));
  render(<FriendProfile />, { wrapper });
  publish([]);
  await waitFor(() => expect(screen.getByText("Block User")).toBeTruthy());
  fireEvent.press(screen.getByText("Block User"));
  await act(async () => { await alertButton("Block User").onPress(); });
  expect(Alert.alert).toHaveBeenLastCalledWith("Unable to block user", expect.any(String));
  expect(screen.getByText("Block User")).toBeTruthy();
});
test("blocked users screen unblocks only after confirmation", async () => {
  render(<BlockedUsers />, { wrapper });
  publish([bob]);
  await waitFor(() => expect(screen.getByLabelText("Unblock bob")).toBeTruthy());
  fireEvent.press(screen.getByLabelText("Unblock bob"));
  expect(unblockUser).not.toHaveBeenCalled();
  await act(async () => { await alertButton("Unblock").onPress(); });
  expect(unblockUser).toHaveBeenCalledWith("bob");
  await waitFor(() => expect(screen.getByText("You haven’t blocked anyone.")).toBeTruthy());
});
test("failed unblock keeps the user in the list", async () => {
  (unblockUser as jest.Mock).mockRejectedValue(new Error("Offline"));
  render(<BlockedUsers />, { wrapper });
  publish([bob]);
  await waitFor(() => expect(screen.getByLabelText("Unblock bob")).toBeTruthy());
  fireEvent.press(screen.getByLabelText("Unblock bob"));
  await act(async () => { await alertButton("Unblock").onPress(); });
  expect(screen.getByLabelText("Unblock bob")).toBeTruthy();
  expect(Alert.alert).toHaveBeenLastCalledWith("Unable to unblock user", expect.any(String));
});
test("block hides cached posts immediately across consumers, rolls back failures, and ignores double taps", async () => {
  let reject!: (error: Error) => void;
  (blockUser as jest.Mock).mockReturnValue(new Promise((_resolve, rejectPromise) => { reject = rejectPromise; }));
  const { result } = renderHook(() => ({ blocks: useBlockedUsers("alice"), feed: useUserFeedInfinite("alice") }), { wrapper });
  publish([]);
  await waitFor(() => expect(result.current.feed.data?.pages[0].items).toHaveLength(2));
  let operation!: Promise<unknown>;
  act(() => { operation = result.current.blocks.setBlocked(bob, true).catch(() => undefined); });
  await waitFor(() => expect(result.current.feed.data?.pages[0].items.map((item) => item.actorUid)).toEqual(["charlie"]));
  await act(async () => { await result.current.blocks.setBlocked(bob, true); });
  expect(blockUser).toHaveBeenCalledTimes(1);
  await act(async () => { reject(new Error("Offline")); await operation; });
  await waitFor(() => expect(result.current.feed.data?.pages[0].items).toHaveLength(2));
});
test("fresh server block list filters old cache and new fetches, including another device's block", async () => {
  client.setQueryData(["user-feed", "alice", { params: { uid: "alice" }, limit: 15 }], cachedFeed());
  const { result } = renderHook(() => useUserFeedInfinite("alice"), { wrapper });
  expect(result.current.data).toBeUndefined();
  publish([bob]);
  await waitFor(() => expect(result.current.data?.pages[0].items.map((item) => item.actorUid)).toEqual(["charlie"]));
  await act(async () => { await result.current.refetch(); });
  expect(result.current.data?.pages[0].items.map((item) => item.actorUid)).toEqual(["charlie"]);
});
test("block list errors do not expose a cached feed", async () => {
  const { result } = renderHook(() => useUserFeedInfinite("alice"), { wrapper });
  act(() => subscriptions.forEach((sub) => sub.error(new Error("Permission denied"))));
  await waitFor(() => expect(result.current.error?.message).toBe("Permission denied"));
  expect(result.current.data).toBeUndefined();
});
test("pagination advances when a whole page is blocked", async () => {
  (getUserFeed as jest.Mock)
    .mockResolvedValueOnce({ items: [{ actorUid: "bob", feedItemId: "b1" }], hasMore: true, nextCursor: "next" })
    .mockResolvedValueOnce({ items: [{ actorUid: "charlie", feedItemId: "c1" }], hasMore: false });
  const { result } = renderHook(() => useUserFeedInfinite("alice"), { wrapper });
  publish([bob]);
  await waitFor(() => expect(result.current.data?.pages.flatMap((page) => page.items).map((item) => item.actorUid)).toEqual(["charlie"]));
  expect(getUserFeed).toHaveBeenCalledTimes(2);
});
test("switching accounts waits for that account's block list", async () => {
  const { result, rerender } = renderHook<ReturnType<typeof useUserFeedInfinite>, { uid: string }>(({ uid }) => useUserFeedInfinite(uid), { wrapper, initialProps: { uid: "alice" } });
  publish([bob]);
  await waitFor(() => expect(result.current.data).toBeDefined());
  rerender({ uid: "charlie" });
  expect(result.current.data).toBeUndefined();
  publish([], "charlie");
  await waitFor(() => expect(result.current.data?.pages[0].items).toHaveLength(2));
});

test("successful block stays hidden before its listener update and clears all cached feed sizes", async () => {
  const homeKey = ["user-feed", "alice", { params: { uid: "alice" }, limit: 3 }];
  client.setQueryData(homeKey, cachedFeed());
  const { result } = renderHook(() => ({ blocks: useBlockedUsers("alice"), feed: useUserFeedInfinite("alice") }), { wrapper });
  publish([]);
  await waitFor(() => expect(result.current.feed.data?.pages[0].items).toHaveLength(2));
  await act(async () => { await result.current.blocks.setBlocked(bob, true); });
  publish([]); // The callable can complete before the listener sees its write.
  await waitFor(() => expect(result.current.feed.data?.pages[0].items.map((item) => item.actorUid)).toEqual(["charlie"]));
  expect(client.getQueryData<any>(homeKey).pages[0].items.map((item: any) => item.actorUid)).toEqual(["charlie"]);
  publish([bob]);
  await waitFor(() => expect(client.getQueryData(["pending-blocks", "alice"])).toEqual([]));
  expect(result.current.feed.data?.pages[0].items.map((item) => item.actorUid)).toEqual(["charlie"]);
});
