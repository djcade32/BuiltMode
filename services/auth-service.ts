import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  name: string;
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
    throw new Error(mapFirebaseAuthError(error, "sign in"));
  }
};

export const signUpWithEmail = async ({ name, email, password }: SignUpParams) => {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    return {
      user: credential.user,
    };
  } catch (error) {
    throw new Error(mapFirebaseAuthError(error, "sign up"));
  }
};

export const signOutUser = async () => {
  await signOut(auth);
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Reset password email sent");
  } catch (error) {
    throw error;
  }
};

const mapFirebaseAuthError = (error: any, action: "sign in" | "sign up"): string => {
  switch (error?.code) {
    case "auth/user-not-found":
      return "Invalid email or password.";
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/invalid-email":
      return "Invalid email or password.";
    case "auth/email-already-in-use":
      return "Email already in use.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network Failure. Try again later.";
    default:
      return `Unable to ${action} right now.`;
  }
};
