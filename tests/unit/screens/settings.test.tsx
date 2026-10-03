import Settings from "@/app/(protected)/(tabs)/(profile)/settings";
import { cancelDeloadWeek, checkForUserProfile, startDeloadWeek } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import { deleteBuiltModeAccount } from "@/services/delete-account-service";
import { signOutUser } from "@/services/auth-service";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";

jest.mock("@/services/user-service", () => ({
  cancelDeloadWeek: jest.fn(), startDeloadWeek: jest.fn(),
  checkForUserProfile: jest.fn(), changeWeeklyTarget: jest.fn(),
}));
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: Object.assign(() => ({ signout: jest.fn(), user: null }), { getState: () => ({ reset: jest.fn() }) }),
}));
jest.mock("@/services/delete-account-service", () => ({ deleteBuiltModeAccount: jest.fn() }));
jest.mock("@/services/auth-service", () => ({ signOutUser: jest.fn() }));
jest.mock("@/stores/workout-store", () => ({ useWorkoutStore: { getState: () => ({ clearWorkout: jest.fn() }) } }));
jest.mock("@/stores/onboarding-store", () => ({ useOnboardingStore: { getState: () => ({ resetState: jest.fn() }) } }));
jest.mock("@/hooks/user/useUpdateProfileAvatar", () => ({
  useUpdateProfileAvatar: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));
jest.mock("@/components/settings/ChangeEmailModal", () => () => null);
jest.mock("@/components/settings/ChangePasswordModal", () => () => null);
jest.mock("@/components/settings/ChangeWeeklyTargetModal", () => () => null);
jest.mock("@/components/settings/DeleteAccountModal", () => {
  const React = require("react");
  const { Button } = require("react-native");
  return ({ visible, onDeleteAccount }: any) => visible
    ? <Button title="Confirm Test Deletion" onPress={onDeleteAccount} /> : null;
});
jest.mock("@/components/ui/Avatar", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@expo/vector-icons", () => ({
  Entypo: "Icon", Feather: "Icon", FontAwesome: "Icon", FontAwesome5: "Icon",
  FontAwesome6: "Icon", MaterialIcons: "Icon",
}));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));
jest.mock("expo-image-picker", () => ({}));

const pending = { seconds: 2_000_000_000, nanoseconds: 0 };
const profile = {
  uid: "u1", displayName: "User", homeTimezone: "America/New_York",
  officialStartWeekId: "2026-01-05", weeklyTargetDays: 5, isPracticeWeek: false,
  pendingDeloadWeekStartsAt: null,
} as unknown as NonNullable<ReturnType<typeof useUserStore.getState>["user"]>;

describe("Settings deload refresh", () => {
  let queryClient: QueryClient;
  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
    jest.clearAllMocks();
    useUserStore.getState().setUser(profile);
    jest.spyOn(Alert, "alert").mockImplementation(() => {});
    (startDeloadWeek as jest.Mock).mockResolvedValue({ success: true, msg: "Scheduled." });
    (cancelDeloadWeek as jest.Mock).mockResolvedValue({ success: true, msg: "Canceled." });
  });
  afterEach(() => {
    cleanup();
    queryClient.clear();
    jest.restoreAllMocks();
  });

  const renderSettings = () => render(
    <QueryClientProvider client={queryClient}>
      <Settings />
    </QueryClientProvider>,
  );

  const confirm = async (label: string) => {
    const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2];
    await act(async () => { await buttons.find((button: { text: string }) => button.text === label).onPress(); });
  };

  test("refreshes the store and pending row before showing scheduling success", async () => {
    (checkForUserProfile as jest.Mock).mockResolvedValue({ ...profile, pendingDeloadWeekStartsAt: pending });
    renderSettings();
    fireEvent.press(screen.getByText("Deload Week"));
    await confirm("Schedule Deload");
    await waitFor(() => expect(screen.getByText("Deload Week Scheduled")).toBeTruthy());
    expect(checkForUserProfile).toHaveBeenCalledWith("u1", "server");
    expect(Alert.alert).toHaveBeenLastCalledWith("Deload Scheduled", "Scheduled.");
  });

  test("returns the canceled row to the available state", async () => {
    useUserStore.getState().setUser({ ...profile, pendingDeloadWeekStartsAt: pending });
    (checkForUserProfile as jest.Mock).mockResolvedValue(profile);
    renderSettings();
    fireEvent.press(screen.getByText("Deload Week Scheduled"));
    await confirm("Cancel Deload");
    await waitFor(() => expect(screen.getByText("Deload Week")).toBeTruthy());
    expect(useUserStore.getState().user?.pendingDeloadWeekStartsAt).toBeNull();
    expect(Alert.alert).toHaveBeenLastCalledWith("Deload Canceled", "Canceled.");
  });

  test("reports a saved change separately from a refresh failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    (checkForUserProfile as jest.Mock).mockRejectedValue(new Error("Offline"));
    renderSettings();
    fireEvent.press(screen.getByText("Deload Week"));
    await confirm("Schedule Deload");
    expect(Alert.alert).toHaveBeenLastCalledWith("Deload Scheduled", expect.stringContaining("Your change was saved"));
  });

  test("keeps the action disabled and delays success until the refresh finishes", async () => {
    let finishRefresh!: (value: typeof profile) => void;
    (checkForUserProfile as jest.Mock).mockReturnValue(new Promise((resolve) => { finishRefresh = resolve; }));
    renderSettings();
    fireEvent.press(screen.getByText("Deload Week"));
    const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2];
    let completion!: Promise<void>;
    await act(async () => {
      completion = buttons.find((button: { text: string }) => button.text === "Schedule Deload").onPress();
    });
    await waitFor(() => {
      expect(screen.getByText("Deload Week")).toBeDisabled();
    });
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishRefresh({ ...profile, pendingDeloadWeekStartsAt: pending });
      await completion;
    });
    expect(Alert.alert).toHaveBeenLastCalledWith("Deload Scheduled", "Scheduled.");
  });

  test.each(["completed", "pending"])("deletion clears local user and cached queries (%s)", async (status) => {
    (deleteBuiltModeAccount as jest.Mock).mockResolvedValue({ success: true, status });
    (signOutUser as jest.Mock).mockResolvedValue(undefined);
    queryClient.setQueryData(["private-user-data"], { secret: "cached" });
    renderSettings();
    fireEvent.press(screen.getByText("Delete Account"));
    await confirm("Continue");
    await act(async () => { fireEvent.press(screen.getByText("Confirm Test Deletion")); });
    await waitFor(() => expect(useUserStore.getState().user).toBeNull());
    expect(queryClient.getQueryData(["private-user-data"])).toBeUndefined();
    expect(signOutUser).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenLastCalledWith(status === "completed" ? "Account Deleted" : "Account Deletion Started", expect.any(String));
  });
});
