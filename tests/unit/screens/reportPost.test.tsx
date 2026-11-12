import ReportPostModal from "@/components/feed/ReportPostModal";
import WorkoutCompleteFeedItem from "@/components/feed/feedItems/WorkoutCompleteFeedItem";
import { reportFeedPost } from "@/services/social-service";
import { useUserStore } from "@/stores/user-store";
import { FeedItem } from "@/packages/shared/src/types/social";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { Alert, Modal, Platform } from "react-native";

jest.mock("@/services/social-service", () => ({ reportFeedPost: jest.fn(), respectFeedPost: jest.fn(), getFeedItemRespectInfo: jest.fn() }));
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@/components/ui/Avatar", () => () => null);
jest.mock("@/hooks/useQuery", () => ({ useQuery: () => ({ data: { respectCount: 0, isRespected: false } }) }));
jest.mock("@/hooks/user/usePublicProfile", () => ({ usePublicProfile: () => ({ profile: null }) }));
jest.mock("@/components/feed/FeedItemRespectUsersSheet", () => () => null);
jest.mock("@/components/feed/feedItems/WeeklyProgressBar", () => () => null);
jest.mock("react-native-linear-gradient", () => require("react-native").View);

const user = { uid: "alice" } as NonNullable<ReturnType<typeof useUserStore.getState>["user"]>;
const post = { feedItemId: "workout_bob_w1", actorUid: "bob", actorUsername: "bob", actorDisplayName: "Bob", workoutName: "Leg Day", workoutId: "w1", completedAt: { seconds: 1, nanoseconds: 0 } } as FeedItem;
const receipt = { reportId: "report1", status: "submitted" };
let client: QueryClient;
let closed: jest.Mock;

function Form() {
  const [visible, setVisible] = useState(true);
  return <ReportPostModal visible={visible} feedItemId={post.feedItemId} authorUsername="bob" onClose={() => { closed(); setVisible(false); }} />;
}
const renderCard = (feedItem = post) => render(<QueryClientProvider client={client}><WorkoutCompleteFeedItem feedItem={feedItem} /></QueryClientProvider>);
const submit = () => fireEvent.press(screen.getByLabelText("Submit Report"));

beforeEach(() => {
  jest.clearAllMocks();
  jest.replaceProperty(Platform, "OS", "ios");
  jest.spyOn(Alert, "alert").mockImplementation(() => {});
  useUserStore.getState().setUser(user);
  client = new QueryClient({ defaultOptions: { mutations: { retry: false, gcTime: 0 } } });
  closed = jest.fn();
  (reportFeedPost as jest.Mock).mockResolvedValue(receipt);
});
afterEach(() => { cleanup(); client.clear(); jest.restoreAllMocks(); });

test("another user's post menu opens the report form", () => {
  renderCard();
  fireEvent.press(screen.getByLabelText("Post options for @bob"));
  const buttons = (Alert.alert as jest.Mock).mock.calls.at(-1)[2];
  act(() => buttons.find((button: { text: string }) => button.text === "Report Post").onPress());
  expect(screen.getByText("Report Post")).toBeTruthy();
  expect(screen.getByText("Harassment or bullying")).toBeTruthy();
  expect(reportFeedPost).not.toHaveBeenCalled();
});

test("the user's own post has no report menu", () => {
  renderCard({ ...post, actorUid: "alice", actorUsername: "alice" });
  expect(screen.queryByLabelText("Post options for @alice")).toBeNull();
});

test("canceling the form submits nothing", () => {
  render(<Form />);
  fireEvent.press(screen.getByText("Cancel"));
  expect(closed).toHaveBeenCalledTimes(1);
  expect(reportFeedPost).not.toHaveBeenCalled();
});

test("requires a reason and nonblank details for Other", () => {
  render(<Form />);
  submit();
  expect(reportFeedPost).not.toHaveBeenCalled();
  fireEvent.press(screen.getByText("Other"));
  fireEvent.changeText(screen.getByLabelText("Report details"), "   ");
  submit();
  expect(screen.getByText("Please describe why you are reporting this post.")).toBeTruthy();
  expect(reportFeedPost).not.toHaveBeenCalled();
});

test("submits trimmed details and waits for iOS dismissal before confirming receipt", async () => {
  render(<Form />);
  const nativeModal = screen.UNSAFE_getByType(Modal);
  fireEvent.press(screen.getByText("Other"));
  fireEvent.changeText(screen.getByLabelText("Report details"), "  Specific concern  ");
  submit();
  await waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
  expect(reportFeedPost).toHaveBeenCalledWith({ feedItemId: post.feedItemId, reason: "other", details: "Specific concern" });
  expect(Alert.alert).not.toHaveBeenCalled();
  fireEvent(nativeModal, "dismiss");
  expect(Alert.alert).toHaveBeenCalledWith("Report Submitted", expect.stringContaining("submitted for review"));
});

test("Android confirms receipt without relying on onDismiss", async () => {
  jest.replaceProperty(Platform, "OS", "android");
  render(<Form />);
  fireEvent.press(screen.getByText("Spam or scams"));
  submit();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Report Submitted", expect.any(String)));
});

test("duplicate reports show an accurate receipt", async () => {
  (reportFeedPost as jest.Mock).mockResolvedValue({ ...receipt, status: "already_reported" });
  jest.replaceProperty(Platform, "OS", "android");
  render(<Form />);
  fireEvent.press(screen.getByText("Spam or scams"));
  submit();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith("Already Reported", expect.any(String)));
});

test("failures retain the form and details for retry", async () => {
  (reportFeedPost as jest.Mock).mockRejectedValueOnce(new Error("Network unavailable"));
  render(<Form />);
  fireEvent.press(screen.getByText("Harassment or bullying"));
  fireEvent.changeText(screen.getByLabelText("Report details"), "Details to retain");
  submit();
  await waitFor(() => expect(screen.getByText("Network unavailable")).toBeTruthy());
  expect(screen.getByLabelText("Report details").props.value).toBe("Details to retain");
  expect(closed).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
  submit();
  await waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
});

test("prevents repeated taps and dismissal while submitting", async () => {
  let finish!: (value: typeof receipt) => void;
  (reportFeedPost as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  render(<Form />);
  fireEvent.press(screen.getByText("Hate speech"));
  submit(); submit();
  fireEvent.press(screen.getByText("Cancel"));
  expect(reportFeedPost).toHaveBeenCalledTimes(1);
  expect(closed).not.toHaveBeenCalled();
  await act(async () => finish(receipt));
  await waitFor(() => expect(closed).toHaveBeenCalledTimes(1));
});

test("does not show a receipt after leaving the screen", async () => {
  let finish!: (value: typeof receipt) => void;
  (reportFeedPost as jest.Mock).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const { unmount } = render(<Form />);
  fireEvent.press(screen.getByText("Violence or threats"));
  submit();
  unmount();
  await act(async () => finish(receipt));
  expect(closed).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
});
