import { db } from "@/lib/firebase";
import { User } from "@/packages/shared/src";
import { doc, getDoc } from "firebase/firestore";

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


