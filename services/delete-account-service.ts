import { auth, functions } from "@/lib/firebase";
import { httpsCallable } from "firebase/functions";

export const deleteBuiltModeAccount = async () => {
  if (!auth.currentUser) throw new Error("Sign in before deleting your account.");
  // Reauthentication happened in the modal; send a token with the new auth_time.
  await auth.currentUser.getIdToken(true);
  const deleteAccount = httpsCallable<{ confirmation: string }, { success: boolean; status: "completed" | "pending" }>(
    functions, "deleteBuiltModeAccount", { timeout: 540_000 },
  );
  const { data } = await deleteAccount({ confirmation: "DELETE" });
  if (!data.success) throw new Error("Account deletion could not be confirmed.");
  return data;
};
