import { db, functions } from "@/lib/firebase";
import { CreateUserProfileRequest, CreateUserProfileResponse, User } from "@/packages/shared/src";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

export const checkForUserProfile = async (uid: string): Promise<User | undefined> => {
  try {
    const userDoc = doc(db, `users/${uid}`);
    const user = await getDoc(userDoc);
    if (user.exists()) {
      const {
        uid,
        createdAt,
        displayName,
        homeTimezone,
        goal,
        metrics,
        homeTimezoneSetAt,
        officialStartWeekId,
        updatedAt,
        username,
        usernameLower,
        weeklyTargetDays,
        avatarUrl,
        homeTimezoneUpdatedAt,
      } = user.data();
      const builtUser: User = {
        uid,
        createdAt,
        displayName,
        homeTimezone,
        goal,
        metrics: metrics ?? undefined,
        homeTimezoneSetAt,
        homeTimezoneUpdatedAt: homeTimezoneUpdatedAt ?? "",
        officialStartWeekId,
        updatedAt,
        username,
        usernameLower,
        weeklyTargetDays,
        avatarUrl: avatarUrl ?? "",
      };
      return builtUser;
    }
    return;
  } catch (error: any) {
    throw error;
  }
};

export const isUsernameAvailable = async (username: string): Promise<boolean> => {
  try {
    const usernameDoc = doc(db, `usernames/${username.trim().toLowerCase()}`);
    return !(await getDoc(usernameDoc)).exists();
  } catch (error: any) {
    throw error;
  }
};

/**
 * The function `createUserProfile` creates a user profile by calling a Firebase Cloud Function with
 * the provided user data.
 * @param {CreateUserProfileRequest} user - The `user` parameter in the `createUserProfile` function is
 * of type `CreateUserProfileRequest`. This likely contains the data needed to create a user profile,
 * such as user information like name, email, etc.
 * @returns The function `createUserProfile` is returning a Promise that resolves with a
 * `CreateUserProfileResponse` object.
 */
export const createUserProfile = async (
  user: CreateUserProfileRequest,
): Promise<CreateUserProfileResponse> => {
  try {
    const createUserProfileFunction = httpsCallable<
      CreateUserProfileRequest,
      CreateUserProfileResponse
    >(functions, "createUserProfile");

    const userResponse = await createUserProfileFunction(user);
    return userResponse.data;
  } catch (error: any) {
    throw error;
  }
};
