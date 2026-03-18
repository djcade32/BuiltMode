import { signInWithEmail, signOutUser, signUpWithEmail } from "@/services/auth-service";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type AuthStore = {
  user: { uid: string; email: string | null } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSigningIn: boolean;
  error: string | null;
  setHydrated: (value: boolean) => void;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signout: () => Promise<void>;
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
      signin: async (email: string, password: string) => {
        set({ isSigningIn: true, error: null });

        try {
          const result = await signInWithEmail({ email, password });

          set({
            user: {
              uid: result.user.uid,
              email: result.user.email,
            },
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
      signup: async (email: string, password: string) => {
        set({ isSigningIn: true, error: null });

        try {
          const result = await signUpWithEmail({ email, password });

          set({
            user: {
              uid: result.user.uid,
              email: result.user.email,
            },
            isSigningIn: false,
            isAuthenticated: true,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Unable to sign up.",
            isSigningIn: false,
          });
        }
      },
      signout: async () => {
        await signOutUser();
        set({ ...initialState, isHydrated: true });
      },
      reset: () => set(initialState),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
