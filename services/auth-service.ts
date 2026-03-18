import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export type SignInParams = {
  email: string;
  password: string;
};

export const signInWithEmail = async ({ email, password }: SignInParams) => {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    return {
      user: credential.user,
    };
  } catch (error: any) {
    throw new Error(mapFirebaseAuthError(error));
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

const mapFirebaseAuthError = (error: any): string => {
  switch (error?.code) {
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default:
      return "Unable to sign in right now.";
  }
};
