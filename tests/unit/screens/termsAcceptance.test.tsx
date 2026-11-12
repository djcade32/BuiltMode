import Signup from "@/app/(auth)/signup";
import TermsAcceptanceGate from "@/components/auth/TermsAcceptanceGate";
import { acceptCurrentTerms, hasAcceptedCurrentTerms } from "@/services/legal-service";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import React from "react";
import { Text, TextInput, View } from "react-native";

const mockSignup = jest.fn();
const mockSignout = jest.fn();
const mockPush = jest.fn();
jest.mock("@/services/legal-service", () => ({ acceptCurrentTerms: jest.fn(), hasAcceptedCurrentTerms: jest.fn() }));
jest.mock("@/stores/auth-store", () => ({
  useAuthStore: Object.assign(() => ({ signup: mockSignup, isSigningIn: false, error: null }), { getState: () => ({ signout: mockSignout }) }),
}));
jest.mock("expo-router", () => ({
  Link: ({ href, children }: any) => require("react").cloneElement(children, { onPress: () => mockPush(href) }),
}));
jest.mock("@/components/auth/AuthHeader", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@/components/themed-view", () => ({ ThemedView: require("react-native").View }));
const checkboxLabel = "I agree to the Terms of Service and acknowledge the Privacy Policy";
const gate = (uid = "alice") => <View><TermsAcceptanceGate key={uid} uid={uid}><Text>Protected content</Text></TermsAcceptanceGate></View>;
const agree = () => fireEvent.press(screen.getByRole("checkbox", { name: checkboxLabel }));
const fillSignup = () => {
  const inputs = screen.UNSAFE_getAllByType(TextInput);
  ["Alice", "alice@example.com", "Password1", "Password1"].forEach((value, index) => fireEvent.changeText(inputs[index], value));
};
beforeEach(() => {
  jest.clearAllMocks();
  (hasAcceptedCurrentTerms as jest.Mock).mockResolvedValue(false);
  (acceptCurrentTerms as jest.Mock).mockResolvedValue(undefined);
  mockSignup.mockResolvedValue(undefined);
  mockSignout.mockResolvedValue(undefined);
});
afterEach(cleanup);

test("signup starts unchecked and requires consent even with a valid form", async () => {
  render(<Signup />);
  fillSignup();
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
  fireEvent.press(screen.getByText("CREATE ACCOUNT"));
  expect(mockSignup).not.toHaveBeenCalled();
  agree();
  fireEvent.press(screen.getByText("CREATE ACCOUNT"));
  await waitFor(() => expect(mockSignup).toHaveBeenCalledWith("Alice", "alice@example.com", "Password1", { accepted: true, termsVersion: "2026-11-12" }));
});
test("document links preserve the form and never count as acceptance", () => {
  render(<Signup />);
  fillSignup();
  fireEvent.press(screen.getByText("Terms of Service"));
  expect(mockPush).toHaveBeenLastCalledWith("/terms-of-service");
  fireEvent.press(screen.getByText("Privacy Policy"));
  expect(mockPush).toHaveBeenLastCalledWith("/privacy-policy");
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
  expect(screen.getByDisplayValue("alice@example.com")).toBeTruthy();
});
test("unchecking the agreement disables registration again", () => {
  render(<Signup />);
  fillSignup();
  agree();
  agree();
  fireEvent.press(screen.getByText("CREATE ACCOUNT"));
  expect(mockSignup).not.toHaveBeenCalled();
});
test("consent alone does not allow an invalid form", () => {
  render(<Signup />);
  agree();
  fireEvent.press(screen.getByText("CREATE ACCOUNT"));
  expect(mockSignup).not.toHaveBeenCalled();
});
test("a loading or missing acceptance record never exposes protected content", async () => {
  render(gate());
  expect(screen.queryByText("Protected content")).toBeNull();
  await waitFor(() => expect(screen.getByText("AGREE & CONTINUE")).toBeTruthy());
  fireEvent.press(screen.getByText("AGREE & CONTINUE"));
  expect(acceptCurrentTerms).not.toHaveBeenCalled();
  expect(screen.queryByText("Protected content")).toBeNull();
});
test("accepted accounts pass without another checkbox", async () => {
  (hasAcceptedCurrentTerms as jest.Mock).mockResolvedValue(true);
  render(gate());
  await waitFor(() => expect(screen.getByText("Protected content")).toBeTruthy());
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(acceptCurrentTerms).not.toHaveBeenCalled();
});
test("only a successful save unlocks the app and repeated taps submit once", async () => {
  let resolve!: () => void;
  (acceptCurrentTerms as jest.Mock).mockReturnValue(new Promise<void>((done) => { resolve = done; }));
  render(gate());
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
  agree();
  const button = screen.getByText("AGREE & CONTINUE");
  fireEvent.press(button);
  fireEvent.press(button);
  expect(acceptCurrentTerms).toHaveBeenCalledTimes(1);
  expect(acceptCurrentTerms).toHaveBeenCalledWith("alice", { accepted: true, termsVersion: "2026-11-12" });
  expect(screen.queryByText("Protected content")).toBeNull();
  await act(async () => resolve());
  expect(screen.getByText("Protected content")).toBeTruthy();
});
test("failed save preserves explicit consent for retry", async () => {
  (acceptCurrentTerms as jest.Mock).mockRejectedValueOnce(new Error("Offline"));
  render(gate());
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
  agree();
  fireEvent.press(screen.getByText("AGREE & CONTINUE"));
  await waitFor(() => expect(screen.getByText(/Your agreement could not be saved/)).toBeTruthy());
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(true);
  expect(screen.queryByText("Protected content")).toBeNull();
  fireEvent.press(screen.getByText("AGREE & CONTINUE"));
  await waitFor(() => expect(screen.getByText("Protected content")).toBeTruthy());
});
test("read failure offers retry and does not treat a network error as missing consent", async () => {
  (hasAcceptedCurrentTerms as jest.Mock).mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(true);
  render(gate());
  await waitFor(() => expect(screen.getByText("TRY AGAIN")).toBeTruthy());
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByText("Protected content")).toBeNull();
  fireEvent.press(screen.getByText("TRY AGAIN"));
  await waitFor(() => expect(screen.getByText("Protected content")).toBeTruthy());
});
test("users can decline by signing out without saving acceptance", async () => {
  render(gate());
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
  fireEvent.press(screen.getByText("SIGN OUT"));
  await waitFor(() => expect(mockSignout).toHaveBeenCalledTimes(1));
  expect(acceptCurrentTerms).not.toHaveBeenCalled();
});
test("switching accounts discards a previous account's late acceptance response", async () => {
  let resolve!: () => void;
  (acceptCurrentTerms as jest.Mock).mockReturnValue(new Promise<void>((done) => { resolve = done; }));
  const view = render(gate());
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
  agree();
  fireEvent.press(screen.getByText("AGREE & CONTINUE"));
  view.rerender(gate("bob"));
  await act(async () => resolve());
  await waitFor(() => expect(screen.getByRole("checkbox")).toBeTruthy());
  expect(screen.queryByText("Protected content")).toBeNull();
  expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(false);
});
