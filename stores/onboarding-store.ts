import { uploadImageAsync } from "@/lib/firestorage";
import {
  CreateUserProfileRequest,
  CreateUserProfileResponse,
  Goal,
  Metrics,
  WeeklyTargetDays,
} from "@/packages/shared/src";
import { createUserProfile } from "@/services/user-service";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type OnboardingStore = {
  username: string | undefined;
  goal: Goal | undefined;
  metrics: Metrics | null | undefined;
  weeklyStandard: WeeklyTargetDays | undefined;
  avatarUrl: string | null | undefined;
  homeTimezone: string | undefined;
  numOfScreens: number;
  currentScreen: number;
  isCreatingUser: boolean;
  nextScreen: () => void;
  prevScreen: () => void;
  setUsername: (username: string) => void;
  setGoal: (goal: Goal) => void;
  setMetrics: (metric: Metrics | null) => void;
  setWeeklyStandard: (weeklyStandard: WeeklyTargetDays) => void;
  setAvatarUrl: (url: string | null) => void;
  setHomeTimezone: (homeTimezone: string) => void;
  createUserProfile: () => Promise<CreateUserProfileResponse | undefined>;
  resetState: () => void;
};

const initialValues = {
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

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialValues,
      nextScreen: () => {
        const screenNum = get().currentScreen + 1;
        if (screenNum > get().numOfScreens) return;
        set({
          currentScreen: screenNum,
        });
      },
      prevScreen: () => {
        const screenNum = get().currentScreen;
        if (screenNum === 0) return;
        set({
          currentScreen: get().currentScreen - 1,
        });
      },
      setUsername: (username: string) => {
        set({
          username,
        });
      },
      setGoal: (goal: Goal) => {
        set({
          goal,
        });
      },
      setMetrics: (metrics: Metrics | null) => {
        set({
          metrics,
        });
      },
      setHomeTimezone: (homeTimezone: string) => {
        set({
          homeTimezone,
        });
      },
      setAvatarUrl: (url: string | null) => {
        set({
          avatarUrl: url,
        });
      },
      setWeeklyStandard: (weeklyStandard: WeeklyTargetDays) => {
        set({
          weeklyStandard,
        });
      },
      createUserProfile: async () => {
        try {
          set({
            isCreatingUser: true,
          });
          const { avatarUrl, username, goal, metrics, weeklyStandard, homeTimezone, resetState } =
            get();
          if (!username || !goal || !weeklyStandard || !homeTimezone) return;
          const displayName = useAuthStore.getState().user?.name;
          let convertedUrl = undefined;
          if (avatarUrl) {
            const uid = useAuthStore.getState().user?.uid;
            if (!uid) {
              console.warn("No User uid, could not upload avatar");
              return;
            }
            convertedUrl = (await uploadImageAsync(avatarUrl, `user-avatars/${uid}`)) ?? "";
          }

          const user: CreateUserProfileRequest = {
            avatarUrl: convertedUrl,
            username,
            displayName: displayName ?? "",
            goal,
            metrics: metrics ?? undefined,
            weeklyTargetDays: weeklyStandard,
            homeTimezone,
          };
          console.log("createdUser: ", user);

          const response = await createUserProfile(user);
          resetState();
          return response;
        } catch (error) {
          throw error;
        } finally {
          set({
            isCreatingUser: false,
          });
        }
      },
      resetState: () => {
        set({
          ...initialValues,
        });
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        ...initialValues,
      }),
    },
  ),
);
