import { GoalType, Metrics } from "@/packages/shared/src/types/onboarding";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type OnboardingStore = {
  username: string | undefined;
  goal: GoalType | undefined;
  metrics: Metrics | null | undefined;
  weeklyStandard: number | undefined;
  avatarUrl: string | null | undefined;
  homeTimezone: string | undefined;
  numOfScreens: number;
  currentScreen: number;
  nextScreen: () => void;
  prevScreen: () => void;
  setUsername: (username: string) => void;
  setGoal: (goal: GoalType) => void;
  setMetrics: (metric: Metrics | null) => void;
  setWeeklyStandard: (weeklyStandard: number) => void;
  setAvatarUrl: (url: string | null) => void;
  setHomeTimezone: (homeTimezone: string) => void;
};

const initialValues = {
  username: undefined,
  goal: undefined,
  metrics: undefined,
  weeklyStandard: undefined,
  avatarUrl: undefined,
  homeTimezone: undefined,
  numOfScreens: 7,
  currentScreen: 1,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialValues,
      nextScreen: () => {
        const screenNum = get().currentScreen;
        if (screenNum === get().numOfScreens) return;
        set({
          currentScreen: get().currentScreen + 1,
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
      setGoal: (goal: GoalType) => {
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
      setWeeklyStandard: (weeklyStandard: number) => {
        set({
          weeklyStandard,
        });
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
