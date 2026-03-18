import { signInWithEmail, signOutUser } from "@/services/auth-service";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./mmkv-storage-wrapper";

type AuthStore = {
  user: { uid: string; email: string | null } | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isSigningIn: boolean;
  error: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  signout: () => Promise<void>;
  reset: () => void;
};

const initialState = {
  user: null,
  isSigningIn: false,
  error: null,
  isAuthenticated: false,
  isHydrated: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,
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
      signup: async (email: string, password: string, username: string) => {
        try {
        } catch (error) {
          throw error;
        }
      },
      signout: async () => {
        set(initialState);
        await signOutUser();
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
        state?.isHydrated !== undefined && useAuthStore.setState({ isHydrated: true });
      },
    },
  ),
);
