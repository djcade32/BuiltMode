import { CreateUserProfileResponse } from "@/packages/shared/src";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type UserStore = {
  user: CreateUserProfileResponse | null;
  setUser: (user: CreateUserProfileResponse | null) => void;
  setIsUserHydrated: (value: boolean) => void;
  isUserHydrated: boolean;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,

      isUserHydrated: false,

      setIsUserHydrated: (value) => set({ isUserHydrated: value }),

      setUser(user) {
        set({
          user: user,
        });
      },
    }),

    {
      name: "user-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setIsUserHydrated(true);
      },
    },
  ),
);
