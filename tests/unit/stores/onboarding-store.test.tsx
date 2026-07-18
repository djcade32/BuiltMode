import { uploadImageAsync } from "@/lib/firestorage";
import { createUserProfile } from "@/services/user-service";
import { useAuthStore } from "@/stores/auth-store";
import { useOnboardingStore } from "@/stores/onboarding-store";

jest.mock("@/lib/firestorage", () => ({
  uploadImageAsync: jest.fn(),
}));

jest.mock("@/services/user-service", () => ({
  createUserProfile: jest.fn(),
}));

const mockedUploadImageAsync = uploadImageAsync as jest.MockedFunction<typeof uploadImageAsync>;
const mockedCreateUserProfile = createUserProfile as jest.MockedFunction<typeof createUserProfile>;

const initialOnboardingState = {
  username: undefined,
  goal: undefined,
  metrics: undefined,
  weeklyStandard: undefined,
  avatarUrl: undefined,
  homeTimezone: undefined,
  numOfScreens: 8,
  currentScreen: 1,
  isCreatingUser: false,
};

describe("onboarding store", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useOnboardingStore.setState(initialOnboardingState);

    useAuthStore.setState({
      user: {
        uid: "user-123",
        name: "Norman Cade",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isHydrated: true,
      isSigningIn: false,
      error: null,
    });
  });

  test("setters update store state", () => {
    const store = useOnboardingStore.getState();

    store.setUsername("norman");
    store.setGoal("Cut" as any);
    store.setMetrics(["Weight", "Body Fat %"] as any);
    store.setWeeklyStandard(4 as any);
    store.setAvatarUrl("file://avatar.jpg");
    store.setHomeTimezone("America/New_York");

    const state = useOnboardingStore.getState();

    expect(state.username).toBe("norman");
    expect(state.goal).toBe("Cut");
    expect(state.metrics).toEqual(["Weight", "Body Fat %"]);
    expect(state.weeklyStandard).toBe(4);
    expect(state.avatarUrl).toBe("file://avatar.jpg");
    expect(state.homeTimezone).toBe("America/New_York");
  });

  test("nextScreen increments currentScreen", () => {
    useOnboardingStore.getState().nextScreen();
    expect(useOnboardingStore.getState().currentScreen).toBe(2);
  });

  test("nextScreen does not exceed numOfScreens", () => {
    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      currentScreen: 8,
    });

    useOnboardingStore.getState().nextScreen();

    expect(useOnboardingStore.getState().currentScreen).toBe(8);
  });

  test("prevScreen decrements currentScreen", () => {
    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      currentScreen: 3,
    });

    useOnboardingStore.getState().prevScreen();

    expect(useOnboardingStore.getState().currentScreen).toBe(2);
  });

  test("prevScreen does not go below 0 based on store guard", () => {
    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      currentScreen: 0,
    });

    useOnboardingStore.getState().prevScreen();

    expect(useOnboardingStore.getState().currentScreen).toBe(0);
  });

  test("createUserProfile returns early if required fields are missing", async () => {
    const response = await useOnboardingStore.getState().createUserProfile();

    expect(response).toBeUndefined();
    expect(mockedUploadImageAsync).not.toHaveBeenCalled();
    expect(mockedCreateUserProfile).not.toHaveBeenCalled();
  });

  test("createUserProfile submits correct payload without avatar", async () => {
    mockedCreateUserProfile.mockResolvedValue({
      uid: "user-123",
      username: "norman",
      displayName: "Norman Cade",
      goal: "Cut",
      metrics: ["Weight"],
      avatarUrl: "",
      homeTimezone: "America/New_York",
      officialStartWeekId: "2026-W13",
      weeklyTargetDays: 4,
      isPracticeWeek: true,
    } as any);

    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      homeTimezone: "America/New_York",
      avatarUrl: undefined,
    });

    const response = await useOnboardingStore.getState().createUserProfile();

    expect(mockedUploadImageAsync).not.toHaveBeenCalled();
    expect(mockedCreateUserProfile).toHaveBeenCalledWith({
      avatarUrl: undefined,
      username: "norman",
      displayName: "Norman Cade",
      goal: "Cut",
      metrics: ["Weight"],
      weeklyTargetDays: 4,
      homeTimezone: "America/New_York",
    });
    expect(response).toBeDefined();
  });

  test("createUserProfile uploads avatar before submitting", async () => {
    mockedUploadImageAsync.mockResolvedValue("https://cdn.example.com/avatar.jpg");
    mockedCreateUserProfile.mockResolvedValue({
      uid: "user-123",
      username: "norman",
      displayName: "Norman Cade",
      goal: "Cut",
      metrics: ["Weight"],
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      homeTimezone: "America/New_York",
      officialStartWeekId: "2026-W13",
      weeklyTargetDays: 4,
      isPracticeWeek: true,
    } as any);

    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      homeTimezone: "America/New_York",
      avatarUrl: "file://avatar.jpg",
    });

    await useOnboardingStore.getState().createUserProfile();

    expect(mockedUploadImageAsync).toHaveBeenCalledWith(
      "file://avatar.jpg",
      "user-avatars/user-123",
    );

    expect(mockedCreateUserProfile).toHaveBeenCalledWith({
      avatarUrl: "https://cdn.example.com/avatar.jpg",
      username: "norman",
      displayName: "Norman Cade",
      goal: "Cut",
      metrics: ["Weight"],
      weeklyTargetDays: 4,
      homeTimezone: "America/New_York",
    });
  });

  test("createUserProfile returns early if avatar exists but auth uid is missing", async () => {
    useAuthStore.setState({
      user: {
        uid: "",
        name: "Norman Cade",
        email: "norman@example.com",
      },
      isAuthenticated: true,
      isHydrated: true,
      isSigningIn: false,
      error: null,
    });

    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      homeTimezone: "America/New_York",
      avatarUrl: "file://avatar.jpg",
    });

    const response = await useOnboardingStore.getState().createUserProfile();

    expect(response).toBeUndefined();
    expect(mockedUploadImageAsync).not.toHaveBeenCalled();
    expect(mockedCreateUserProfile).not.toHaveBeenCalled();
  });

  test("createUserProfile resets store after success", async () => {
    mockedCreateUserProfile.mockResolvedValue({
      uid: "user-123",
      username: "norman",
      displayName: "Norman Cade",
      goal: "Cut",
      metrics: ["Weight"],
      avatarUrl: "",
      homeTimezone: "America/New_York",
      officialStartWeekId: "2026-W13",
      weeklyTargetDays: 4,
      isPracticeWeek: true,
    } as any);

    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      homeTimezone: "America/New_York",
      avatarUrl: undefined,
      currentScreen: 6,
    });

    await useOnboardingStore.getState().createUserProfile();

    const state = useOnboardingStore.getState();

    expect(state.username).toBeUndefined();
    expect(state.goal).toBeUndefined();
    expect(state.metrics).toBeUndefined();
    expect(state.weeklyStandard).toBeUndefined();
    expect(state.avatarUrl).toBeUndefined();
    expect(state.homeTimezone).toBeUndefined();
    expect(state.currentScreen).toBe(1);
  });

  test("resetState restores initial values", () => {
    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      avatarUrl: "file://avatar.jpg",
      homeTimezone: "America/New_York",
      currentScreen: 4,
    });

    useOnboardingStore.getState().resetState();

    expect(useOnboardingStore.getState()).toMatchObject(initialOnboardingState);
  });

  test("createUserProfile rethrows service errors", async () => {
    mockedCreateUserProfile.mockRejectedValue(new Error("Profile creation failed"));

    useOnboardingStore.setState({
      ...useOnboardingStore.getState(),
      username: "norman",
      goal: "Cut" as any,
      metrics: ["Weight"] as any,
      weeklyStandard: 4 as any,
      homeTimezone: "America/New_York",
    });

    await expect(useOnboardingStore.getState().createUserProfile()).rejects.toThrow(
      "Profile creation failed",
    );
  });
});
