import WorkoutComplete from "@/app/(protected)/workoutComplete";
import { useQuery } from "@/hooks/useQuery";
import { publishCompletedWorkoutToFeed } from "@/services/workout-service";
import { useUserStore } from "@/stores/user-store";
import { useWorkoutStore } from "@/stores/workout-store";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform, Share } from "react-native";
import { resetWorkoutStore } from "../../test-utils/reset-workout-store";
import {
  makeActiveWorkoutDraft,
  makeCompleteWorkoutResponse,
} from "../../test-utils/workout-fixtures";

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  CameraType: { front: "front" },
}));
const mockReplace = jest.fn();
const mockRedirect = jest.fn((props: any) => null);

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  Redirect: (props: any) => {
    mockRedirect(props);
    return null;
  },
}));

jest.mock("@/hooks/useQuery", () => ({
  useQuery: jest.fn(),
}));

jest.mock("@/services/workout-service", () => ({
  publishCompletedWorkoutToFeed: jest.fn(),
}));

const defaultUser = {
  uid: "123",
  username: "djcade32",
  goal: "BUILD MUSCLE",
  metrics: undefined,
  displayName: "Norman",
  avatarUrl: undefined,
  homeTimezone: "America/New_York",
  officialStartWeekId: "2026-05-18",
  weeklyTargetDays: 5,
  isPracticeWeek: false,
} as const;

describe("workoutComplete", () => {
  beforeEach(() => {
    resetWorkoutStore();
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "ios");
    (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({ granted: true });
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({ canceled: false, assets: [{ uri: "file:///workout-photo.jpg" }] });
    jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    useUserStore.setState({ user: null });
    (useQuery as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    (publishCompletedWorkoutToFeed as jest.Mock).mockResolvedValue({ feedStatus: "published" });
  });

  it("redirects if completeWorkoutResponse is missing", () => {
    render(<WorkoutComplete />);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "/(protected)/(tabs)/(workout)/log",
      }),
    );
  });

  it("renders summary info when completeWorkoutResponse exists", () => {
    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: makeCompleteWorkoutResponse() as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    useUserStore.setState({
      user: defaultUser as any,
    });

    const { getByText } = render(<WorkoutComplete />);

    expect(getByText("Workout Complete")).toBeTruthy();
    expect(getByText("01:01:11")).toBeTruthy();
    expect(getByText("82")).toBeTruthy();
    expect(getByText("3")).toBeTruthy();
    expect(getByText("Bench Press")).toBeTruthy();
    expect(getByText("Pull Ups")).toBeTruthy();
    expect(getByText("Keep showing up.")).toBeTruthy();
  });

  it("shows negative consistency copy when mode score drops", () => {
    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: {
        ...makeCompleteWorkoutResponse(),
        modeScoreDifference: -2,
      } as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    useUserStore.setState({ user: defaultUser as any });

    const { getByText } = render(<WorkoutComplete />);
    expect(getByText("Stay consistent.")).toBeTruthy();
  });

  it("clears workout and redirects when SHARE TO FEED is pressed", async () => {
    const clearWorkoutSpy = jest.spyOn(useWorkoutStore.getState(), "clearWorkout");

    useWorkoutStore.setState({
      duration: 3671,
      completeWorkoutResponse: makeCompleteWorkoutResponse() as any,
      activeWorkoutDraft: makeActiveWorkoutDraft() as any,
    });

    useUserStore.setState({ user: defaultUser as any });

    const { getByText } = render(<WorkoutComplete />);
    fireEvent.press(getByText("SHARE TO FEED"));

    await waitFor(() => {
      expect(publishCompletedWorkoutToFeed).toHaveBeenCalledWith("session-1", null, null);
      expect(clearWorkoutSpy).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith("/(protected)/(tabs)/(feed)/feed");
    });
  });

  const prepareSharing = () => {
    useWorkoutStore.setState({ duration: 2700, completeWorkoutResponse: makeCompleteWorkoutResponse() as any, activeWorkoutDraft: { ...makeActiveWorkoutDraft(), name: "Upper Body" } as any });
    useUserStore.setState({ user: defaultUser as any });
  };
  it.each([Share.sharedAction, Share.dismissedAction])("keeps workout and feed unpublished after share result %s", async (action) => {
    prepareSharing();
    const draft = useWorkoutStore.getState().activeWorkoutDraft;
    (Share.share as jest.Mock).mockResolvedValue({ action });
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByLabelText("Share workout"));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({ message: expect.stringContaining("Check out this workout I just completed!") }, expect.any(Object)));
    await waitFor(() => expect(view.getByText("SHARE WORKOUT")).toBeTruthy());
    expect((Share.share as jest.Mock).mock.calls[0][0].message).toContain("Upper Body — 45 min");
    expect(useWorkoutStore.getState().activeWorkoutDraft).toEqual(draft);
    expect(publishCompletedWorkoutToFeed).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    fireEvent.press(view.getByText("SHARE TO FEED"));
    await waitFor(() => expect(publishCompletedWorkoutToFeed).toHaveBeenCalledWith("session-1", null, null));
  });
  it("shows sharing errors without losing the completed workout", async () => {
    prepareSharing();
    (Share.share as jest.Mock).mockRejectedValue(new Error("Unavailable"));
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByLabelText("Share workout"));
    await waitFor(() => expect(alert).toHaveBeenCalledWith("Unable to share workout", expect.any(String)));
    expect(useWorkoutStore.getState().activeWorkoutDraft).not.toBeNull();
    expect(publishCompletedWorkoutToFeed).not.toHaveBeenCalled();
    alert.mockRestore();
  });
  it("prevents duplicate sharing and publishing while the share sheet is open", async () => {
    prepareSharing();
    let resolve!: (value: { action: string }) => void;
    (Share.share as jest.Mock).mockReturnValue(new Promise((done) => { resolve = done; }));
    const view = render(<WorkoutComplete />);
    const button = view.getByLabelText("Share workout");
    fireEvent.press(button);
    fireEvent.press(button);
    fireEvent.press(view.getByText("SHARE TO FEED"));
    expect(Share.share).toHaveBeenCalledTimes(1);
    expect(publishCompletedWorkoutToFeed).not.toHaveBeenCalled();
    await act(async () => resolve({ action: Share.dismissedAction }));
  });
  it("does not share a missing or mismatched workout draft", () => {
    prepareSharing();
    useWorkoutStore.setState({ activeWorkoutDraft: null });
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByLabelText("Share workout"));
    expect(Share.share).not.toHaveBeenCalled();
  });

  it("includes the local workout photo with the message on iOS and retains it after canceling", async () => {
    prepareSharing();
    (Share.share as jest.Mock).mockResolvedValue({ action: Share.dismissedAction });
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByText("TAKE PHOTO"));
    await waitFor(() => expect(view.getByText("RETAKE")).toBeTruthy());
    fireEvent.press(view.getByLabelText("Share workout"));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({
      message: expect.stringContaining("Check out this workout I just completed!"),
      url: "file:///workout-photo.jpg",
    }, expect.any(Object)));
    await waitFor(() => expect(view.getByText("SHARE WORKOUT")).toBeTruthy());
    expect(view.getByText("REMOVE")).toBeTruthy();
    expect(publishCompletedWorkoutToFeed).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useWorkoutStore.getState().activeWorkoutDraft).not.toBeNull();
  });
  it("returns to text-only sharing when the user removes the photo", async () => {
    prepareSharing();
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByText("TAKE PHOTO"));
    await waitFor(() => expect(view.getByText("REMOVE")).toBeTruthy());
    fireEvent.press(view.getByText("REMOVE"));
    fireEvent.press(view.getByLabelText("Share workout"));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({ message: expect.any(String) }, expect.any(Object)));
  });
  it("keeps Android sharing text-only even when a workout photo exists", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    prepareSharing();
    const view = render(<WorkoutComplete />);
    fireEvent.press(view.getByText("TAKE PHOTO"));
    await waitFor(() => expect(view.getByText("RETAKE")).toBeTruthy());
    fireEvent.press(view.getByLabelText("Share workout"));
    await waitFor(() => expect(Share.share).toHaveBeenCalledWith({ message: expect.any(String) }, expect.any(Object)));
  });
});
