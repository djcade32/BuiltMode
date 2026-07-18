import { signInWithEmail, signOutUser, signUpWithEmail } from "@/services/auth-service";
import { checkForUserProfile } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { storage } from "@/stores/mmkv-storage-wrapper";
import { useUserStore } from "@/stores/user-store";
import { act } from "react";

jest.mock("@/services/auth-service", () => ({
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  signOutUser: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock("@/services/user-service", () => ({
  checkForUserProfile: jest.fn(),
  isUsernameAvailable: jest.fn(),
  createUserProfile: jest.fn(),
}));

const mockedSignInWithEmail = signInWithEmail as jest.MockedFunction<typeof signInWithEmail>;
const mockedSignUpWithEmail = signUpWithEmail as jest.MockedFunction<typeof signUpWithEmail>;
const mockedSignOutUser = signOutUser as jest.MockedFunction<typeof signOutUser>;
const mockedCheckForUserProfile = checkForUserProfile as jest.MockedFunction<
  typeof checkForUserProfile
>;

describe("auth store", () => {
  beforeEach(() => {
    storage.clearAll();
    jest.clearAllMocks();

    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isHydrated: true,
      isSigningIn: false,
      error: null,
    });

    useUserStore.setState({
      user: null,
    });
  });

  test("signin sets loading state then stores authenticated user on success", async () => {
    mockedSignInWithEmail.mockResolvedValue({
      user: {
        uid: "user-123",
        displayName: "norman cade",
        email: "norman@example.com",
      },
    } as any);

    mockedCheckForUserProfile.mockResolvedValue({
      uid: "user-123",
      username: "norman",
      goal: "lean-bulk",
      metrics: undefined,
      displayName: "norman cade",
      avatarUrl: "",
      homeTimezone: "America/New_York",
      officialStartWeekId: "2026-W13",
      weeklyTargetDays: 4,
    } as any);

    let pendingPromise: Promise<void>;

    await act(async () => {
      pendingPromise = useAuthStore.getState().signin("norman@example.com", "password123");

      expect(useAuthStore.getState().isSigningIn).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await pendingPromise;
    });

    expect(mockedSignInWithEmail).toHaveBeenCalledWith({
      email: "norman@example.com",
      password: "password123",
    });

    expect(mockedCheckForUserProfile).toHaveBeenCalledWith("user-123");

    expect(useAuthStore.getState().user).toEqual({
      uid: "user-123",
      displayName: "norman cade",
      email: "norman@example.com",
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isSigningIn).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();

    expect(useUserStore.getState().user).not.toBeNull();
    expect(useUserStore.getState().user?.username).toBe("norman");
  });

  test("signin sets error and clears loading state on failure", async () => {
    mockedSignInWithEmail.mockRejectedValue(new Error("Invalid email or password."));

    await expect(
      act(async () => {
        await useAuthStore.getState().signin("bad@example.com", "wrongpass");
      }),
    ).rejects.toThrow("Invalid email or password.");

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isSigningIn).toBe(false);
    expect(useAuthStore.getState().error).toBe("Invalid email or password.");
  });

  test("signup stores authenticated user on success", async () => {
    mockedSignUpWithEmail.mockResolvedValue({
      user: {
        uid: "new-user-123",
        displayName: "norman cade",
        email: "norman@example.com",
      },
    } as any);

    await act(async () => {
      await useAuthStore.getState().signup("norman cade", "norman@example.com", "Password1");
    });

    expect(mockedSignUpWithEmail).toHaveBeenCalledWith({
      name: "norman cade",
      email: "norman@example.com",
      password: "Password1",
    });

    expect(useAuthStore.getState().user).toEqual({
      uid: "new-user-123",
      displayName: "norman cade",
      email: "norman@example.com",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().error).toBeNull();
  });

  test("signup clears prior error before attempting request", async () => {
    mockedSignUpWithEmail.mockResolvedValue({
      user: {
        uid: "new-user-123",
        displayName: "norman cade",
        email: "norman@example.com",
      },
    } as any);

    useAuthStore.setState({
      error: "old error",
    });

    await act(async () => {
      await useAuthStore.getState().signup("norman cade", "norman@example.com", "Password1");
    });

    expect(useAuthStore.getState().error).toBeNull();
  });

  test("signout clears user and auth state", async () => {
    useAuthStore.setState({
      user: {
        uid: "user-123",
        name: "norman cade",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isHydrated: true,
      isSigningIn: false,
      error: "old error",
    });

    await act(async () => {
      await useAuthStore.getState().signout();
    });

    expect(mockedSignOutUser).toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useUserStore.getState().user).toBeNull();
  });

  test("persists auth state without persisting transient fields", async () => {
    useAuthStore.setState({
      user: {
        uid: "user-123",
        name: "norman cade",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isHydrated: true,
      isSigningIn: true,
      error: "temporary error",
    });

    const raw = storage.getString("auth-storage");

    expect(raw).toBeTruthy();
    expect(raw).toContain("user-123");
    expect(raw).toContain("norman cade");
    expect(raw).toContain("norman@example.com");
    expect(raw).toContain("isAuthenticated");
    expect(raw).not.toContain("temporary error");
    expect(raw).not.toContain("isSigningIn");
    expect(raw).not.toContain("error");
  });
});
