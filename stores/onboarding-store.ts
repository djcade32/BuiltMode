import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type OnboardingStore = {
  numOfScreens: number;
  currentScreen: number;
  nextScreen: () => void;
  prevScreen: () => void;
};

const initialValues = {
  numOfScreens: 7,
  currentScreen: 1,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialValues,
      nextScreen: () =>{
        const screenNum = get().currentScreen;
        if(screenNum === get().numOfScreens) return;
        set({
            currentScreen: get().currentScreen + 1
        })
      },
      prevScreen: ()=>{
        const screenNum = get().currentScreen;
        if(screenNum === 0) return;
        set({
          currentScreen:  get().currentScreen - 1
        })
      }
    }),
    {
      name: "onboarding-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);

