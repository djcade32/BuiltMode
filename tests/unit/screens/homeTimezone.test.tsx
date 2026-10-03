import HomeTimezoneSetting from "@/components/settings/HomeTimezoneSetting";
import HomeTimezoneSync from "@/components/system/HomeTimezoneSync";
import { subscribeToHomeTimezone, updateHomeTimezone } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";

jest.mock("@/services/user-service", () => ({ updateHomeTimezone: jest.fn(), subscribeToHomeTimezone: jest.fn() }));
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@expo/vector-icons", () => ({ Feather: "Icon", Entypo: "Icon" }));
jest.mock("@/components/onboarding/TimezonePickerSheet", () => {
  const { Button } = require("react-native");
  return ({ visible, onSelect, onClose, onDismiss }: any) => visible ? <Button title="Select Los Angeles" onPress={() => {
    onSelect({ id: "America/Los_Angeles" }); onClose();
  }} /> : <Button title="Finish Closing Picker" onPress={onDismiss} />;
});
const profile = { uid: "u1", homeTimezone: "America/New_York", pendingHomeTimezone: null } as unknown as NonNullable<ReturnType<typeof useUserStore.getState>["user"]>;
const result = { homeTimezone: "America/Los_Angeles", effectiveWeekId: "2026-10-05", effectiveAt: Date.parse("2026-10-05T11:00:00Z") };
let client: QueryClient;
beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  useUserStore.getState().setUser(profile);
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  (updateHomeTimezone as jest.Mock).mockResolvedValue(result);
});
afterEach(() => { cleanup(); client.clear(); jest.restoreAllMocks(); });
const renderSetting = () => render(<QueryClientProvider client={client}><HomeTimezoneSetting /></QueryClientProvider>);
const selectTimezone = () => {
  fireEvent.press(screen.getByText("Home Timezone"));
  fireEvent.press(screen.getByText(/select los angeles/i));
  fireEvent.press(screen.getByText("Finish Closing Picker"));
};
const alertButton = (text: string) => (Alert.alert as jest.Mock).mock.calls.at(-1)[2]
  .find((button: { text: string }) => button.text === text);
const confirmTimezone = () => act(() => { alertButton("Schedule Change").onPress(); });

test("requires confirmation, then displays the saved schedule while keeping the active timezone", async () => {
  renderSetting(); selectTimezone();
  expect(updateHomeTimezone).not.toHaveBeenCalled();
  confirmTimezone();
  await waitFor(() => expect(screen.getByText(/Pending: America\/Los_Angeles/)).toBeTruthy());
  expect(useUserStore.getState().user?.homeTimezone).toBe("America/New_York");
  expect(Alert.alert).toHaveBeenCalledWith("Timezone Change Scheduled", expect.stringContaining("Oct 5, 2026 at 7:00 AM"));
});

test("cancels a pending change and immediately clears the pending row", async () => {
  useUserStore.getState().setUser({ ...profile, pendingHomeTimezone: result.homeTimezone });
  (updateHomeTimezone as jest.Mock).mockResolvedValue({ homeTimezone: profile.homeTimezone, effectiveAt: null, effectiveWeekId: null });
  renderSetting();
  fireEvent.press(screen.getByText("Cancel Pending Timezone Change"));
  await waitFor(() => expect(screen.queryByText(/Pending:/)).toBeNull());
  expect((updateHomeTimezone as jest.Mock).mock.calls[0][0]).toEqual({ homeTimezone: profile.homeTimezone });
  expect(useUserStore.getState().user?.homeTimezone).toBe(profile.homeTimezone);
});

test("preserves the current state on a failed request", async () => {
  (updateHomeTimezone as jest.Mock).mockRejectedValue(new Error("Offline"));
  renderSetting(); selectTimezone();
  confirmTimezone();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Unable to Update Timezone", "Offline"));
  expect(useUserStore.getState().user?.pendingHomeTimezone).toBeNull();
});

test("prevents duplicate submissions while saving", async () => {
  let finish!: (value: typeof result) => void;
  (updateHomeTimezone as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  renderSetting(); selectTimezone();
  confirmTimezone();
  confirmTimezone();
  await waitFor(() => expect(updateHomeTimezone).toHaveBeenCalledTimes(1));
  await act(async () => finish(result));
  await waitFor(() => expect(screen.queryByText("Saving timezone change...")).toBeNull());
});

test("does not overwrite a different account after leaving Settings", async () => {
  let finish!: (value: typeof result) => void;
  (updateHomeTimezone as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const { unmount } = renderSetting(); selectTimezone();
  confirmTimezone();
  await waitFor(() => expect(updateHomeTimezone).toHaveBeenCalled());
  unmount();
  await act(async () => { useUserStore.getState().setUser({ ...profile, uid: "u2" }); finish(result); });
  expect(useUserStore.getState().user?.uid).toBe("u2");
  expect(useUserStore.getState().user?.pendingHomeTimezone).toBeNull();
});

test("syncs a server-applied change and unsubscribes on unmount", () => {
  const unsubscribe = jest.fn();
  let receive!: (value: any) => void;
  (subscribeToHomeTimezone as jest.Mock).mockImplementation((_uid, callback) => { receive = callback; return unsubscribe; });
  const { unmount } = render(<HomeTimezoneSync />);
  act(() => receive({ homeTimezone: result.homeTimezone, pendingHomeTimezone: null }));
  expect(useUserStore.getState().user?.homeTimezone).toBe(result.homeTimezone);
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});


test("waits for the iOS picker to dismiss and keeps confirmation out of the row", () => {
  renderSetting();
  fireEvent.press(screen.getByText("Home Timezone"));
  fireEvent.press(screen.getByText(/select los angeles/i));
  expect(Alert.alert).not.toHaveBeenCalled();
  expect(screen.queryByText("Schedule Timezone Change")).toBeNull();
  fireEvent.press(screen.getByText("Finish Closing Picker"));
  expect(Alert.alert).toHaveBeenCalledWith("Change Home Timezone?", expect.stringContaining("America/Los_Angeles"), expect.any(Array));
  expect(updateHomeTimezone).not.toHaveBeenCalled();
  expect(alertButton("Cancel")).toMatchObject({ style: "cancel" });
  expect(alertButton("Cancel").onPress).toBeUndefined();
  expect(useUserStore.getState().user?.pendingHomeTimezone).toBeNull();
});

test("shows confirmation on Android without relying on iOS dismissal events", () => {
  jest.replaceProperty(Platform, "OS", "android");
  renderSetting();
  fireEvent.press(screen.getByText("Home Timezone"));
  fireEvent.press(screen.getByText(/select los angeles/i));
  expect(Alert.alert).toHaveBeenCalledTimes(1);
  expect(alertButton("Schedule Change")).toBeDefined();
});
