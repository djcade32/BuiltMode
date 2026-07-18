import { handleGetWeekId } from "@/lib/utils/weekId";
import { resetPassword, signInWithEmail, signOutUser, signUpWithEmail } from "@/services/auth-service";
import { unregisterPushToken } from "@/services/notification-service";
import { checkForUserProfile } from "@/services/user-service";
import { User } from "firebase/auth";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";
import { useUserStore } from "./user-store";

type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSigningIn: boolean;
  error: string | null;
  setHydrated: (value: boolean) => void;
  signin: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  reset: () => void;
};

const initialState = {
  user: null,
  isSigningIn: false,
  error: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      isHydrated: false,

      setHydrated: (value) => set({ isHydrated: value }),

      signin: async (email: string, password: string): Promise<void> => {
        set({ isSigningIn: true, error: null });
        useUserStore.getState().setUser(null);

        try {
          const result = await signInWithEmail({ email, password });

          const userFromDb = await checkForUserProfile(result.user.uid);
          if (userFromDb) {
            const user = {
              ...userFromDb,
              isPracticeWeek:
                handleGetWeekId(new Date(), userFromDb.homeTimezone) < userFromDb.officialStartWeekId,
            };
            useUserStore.getState().setUser(user);
          }
          set({
            user: result.user,
            isSigningIn: false,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unable to sign in.",
            isSigningIn: false,
          });
          throw error;
        }
      },

      signup: async (name: string, email: string, password: string) => {
        set({ isSigningIn: true, error: null });
        useUserStore.getState().setUser(null);

        try {
          const result = await signUpWithEmail({ name, email, password });

          set({
            user: result.user,
            isSigningIn: false,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unable to sign up.",
            isSigningIn: false,
          });
          throw error;
        }
      },

      signout: async () => {
        await unregisterPushToken();
        await signOutUser();
        set({ ...initialState, isHydrated: true });
        useUserStore.getState().setUser(null);
      },

      reset: () => set(initialState),

      resetPassword: async (email: string) => {
        await resetPassword(email);
      },
    }),

    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => async (state) => {
        state?.setHydrated(true);

        if (state?.user?.uid) {
          const freshUser = await checkForUserProfile(state.user.uid);
          freshUser &&
            useUserStore.getState().setUser({
              ...freshUser,
              isPracticeWeek: freshUser.officialWeekStatus === "practice",
            });
        }
      },
    },
  ),
);
