import { act } from "react";
import { signInWithEmail } from "../../services/auth-service";
import { useAuthStore } from "../../stores/auth-store";
import { storage } from "../../stores/mmkv-storage-wrapper";

jest.mock("../../services/auth-service", () => ({
  signInWithEmail: jest.fn(),
  signOutUser: jest.fn(),
}));

const mockedSignInWithEmail = signInWithEmail as jest.MockedFunction<typeof signInWithEmail>;

describe("auth store", () => {
  beforeEach(() => {
    storage.clearAll();
    jest.clearAllMocks();

    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isSigningIn: false,
      error: null,
    });
  });

  test("signin sets loading state then stores authenticated user on success", async () => {
    mockedSignInWithEmail.mockResolvedValue({
      user: {
        uid: "user-123",
        email: "norman@example.com",
      },
    } as any);

    let pendingPromise: Promise<void>;

    await act(async () => {
      pendingPromise = useAuthStore.getState().signin("norman@example.com", "password123");

      expect(useAuthStore.getState().isSigningIn).toBe(true);
      expect(useAuthStore.getState().error).toBeNull();

      await pendingPromise!;
    });

    expect(mockedSignInWithEmail).toHaveBeenCalledWith({
      email: "norman@example.com",
      password: "password123",
    });

    expect(useAuthStore.getState().user).toEqual({
      uid: "user-123",
      email: "norman@example.com",
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().isSigningIn).toBe(false);
    expect(useAuthStore.getState().error).toBeNull();
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

  test("signout clears user and auth state", async () => {
    useAuthStore.setState({
      user: {
        uid: "user-123",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isSigningIn: false,
      error: "old error",
    });

    await act(async () => {
      await useAuthStore.getState().signout();
    });

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  test("persists auth state without persisting transient fields", async () => {
    useAuthStore.setState({
      user: {
        uid: "user-123",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isSigningIn: true,
      error: "temporary error",
    });

    const raw = storage.getString("auth-storage");

    expect(raw).toBeTruthy();
    expect(raw).toContain("user-123");
    expect(raw).toContain("norman@example.com");
    expect(raw).toContain("isAuthenticated");
    expect(raw).not.toContain("temporary error");
    expect(raw).not.toContain("isSigningIn");
    expect(raw).not.toContain("error");
  });
});
