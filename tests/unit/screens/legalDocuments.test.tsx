import PrivacyPolicy from "@/app/privacy-policy";
import TermsOfService from "@/app/terms-of-service";
import Signup from "@/app/(auth)/signup";
import { fireEvent, render, screen } from "@testing-library/react-native";
import React from "react";
import { Linking } from "react-native";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }),
  Link: ({ href, children }: any) => require("react").cloneElement(children, { onPress: () => mockPush(href) }),
}));
jest.mock("@/stores/auth-store", () => ({ useAuthStore: () => ({ signup: jest.fn(), isSigningIn: false, error: null }) }));
jest.mock("@/components/auth/AuthHeader", () => () => null);
jest.mock("@/components/ui/FormInput", () => () => null);
jest.mock("@/components/ui/ThemedButton", () => () => null);
jest.mock("@/components/themed-text", () => ({ ThemedText: require("react-native").Text }));
jest.mock("@/components/themed-view", () => ({ ThemedView: require("react-native").View }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: require("react-native").View }));

beforeEach(() => { jest.clearAllMocks(); mockCanGoBack = true; });

test.each([["Privacy Policy", PrivacyPolicy, "11. Contact Us"], ["Terms of Service", TermsOfService, "14. Contact"]] as const)(
  "%s displays the supplied document without requiring an account", (title, Screen, lastHeading) => {
    render(<Screen />);
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.getByText(`BuiltMode ${title}`)).toBeTruthy();
    expect(screen.getByText("Effective date: October 3, 2026")).toBeTruthy();
    expect(screen.queryByText(/Placeholder/)).toBeNull();
    expect(screen.getByText(lastHeading)).toBeTruthy();
  },
);

test("privacy policy renders subheadings and opens the supplied documentation link", () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  render(<PrivacyPolicy />);
  expect(screen.getByText("Information you provide")).toBeTruthy();
  expect(screen.getByText("Apple Health")).toBeTruthy();
  fireEvent.press(screen.getByText("Firebase’s Privacy and Security documentation"));
  expect(openURL).toHaveBeenCalledWith("https://firebase.google.com/support/privacy");
  openURL.mockRestore();
});

test("contact email opens the email app", () => {
  const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  render(<TermsOfService />);
  fireEvent.press(screen.getAllByText("normancade@gmail.com")[0]);
  expect(openURL).toHaveBeenCalledWith("mailto:normancade@gmail.com");
  openURL.mockRestore();
});

test("returns to the originating screen", () => {
  render(<PrivacyPolicy />);
  fireEvent.press(screen.getByLabelText("Go back"));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

test("handles a document opened without navigation history", () => {
  mockCanGoBack = false;
  render(<TermsOfService />);
  fireEvent.press(screen.getByLabelText("Go back"));
  expect(mockReplace).toHaveBeenCalledWith("/");
});

test("signup links open the correct documents", () => {
  render(<Signup />);
  fireEvent.press(screen.getByText("Terms of Service"));
  expect(mockPush).toHaveBeenLastCalledWith("/terms-of-service");
  fireEvent.press(screen.getByText("Privacy Policy"));
  expect(mockPush).toHaveBeenLastCalledWith("/privacy-policy");
});
