import { User } from "@/packages/shared/src";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type UserStore = {
  user: User | null;
  setUser: (user: User | null) => void;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser(user) {
        set({
          user: user,
        });
      },
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
