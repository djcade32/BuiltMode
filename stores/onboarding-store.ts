import { GoalType, Metrics } from "@/packages/shared/src/types/onboarding";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type OnboardingStore = {
  username: string | undefined;
  goal: GoalType | undefined;
  homeTimezone: string | undefined;
  metrics: Metrics | undefined;
  numOfScreens: number;
  currentScreen: number;
  nextScreen: () => void;
  prevScreen: () => void;
  setUsername: (username: string) => void;
  setHomeTimezone: (homeTimezone: string) => void;
  setMetrics: (metric: Metrics) => void;
  setGoal: (goal: GoalType) => void;
};

const initialValues = {
  username: undefined,
  homeTimezone: undefined,
  goal: undefined,
  metrics: undefined,
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
      setHomeTimezone: (homeTimezone: string) => {
        set({
          homeTimezone,
        });
      },
      setGoal: (goal: GoalType) => {
        set({
          goal,
        });
      },
      setMetrics: (metrics: Metrics) => {
        set({
          metrics,
        });
      },
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
