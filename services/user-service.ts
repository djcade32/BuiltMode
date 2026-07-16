import { db, functions } from "@/lib/firebase";
import {
  CreateUserProfileRequest,
  CreateUserProfileResponse,
  Goal,
  LeaderboardEntry,
  PublicProfile,
  User,
  UserMonthAggregate,
  UserStats,
  UserWeekAggregate,
  WeeklyTargetDays,
} from "@builtmode/shared";

import { httpsCallable } from "firebase/functions";

import { doc, getDoc } from "firebase/firestore";

export const checkForUserProfile = async (uid: string): Promise<User | undefined> => {
  try {
    const userDocRef = doc(db, `users/${uid}`);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return undefined;
    }

    const data = userSnap.data();

    // Treat incomplete legacy profiles as invalid until backfill is run.
    if (
      typeof data.uid !== "string" ||
      typeof data.displayName !== "string" ||
      typeof data.homeTimezone !== "string" ||
      typeof data.goal !== "string" ||
      typeof data.officialStartWeekId !== "string" ||
      typeof data.username !== "string" ||
      typeof data.usernameLower !== "string" ||
      typeof data.weeklyTargetDays !== "number"
    ) {
      return undefined;
    }

    const createdAt = data.createdAt;
    const updatedAt = data.updatedAt;
    const homeTimezoneSetAt = data.homeTimezoneSetAt;
    const homeTimezoneUpdatedAt = data.homeTimezoneUpdatedAt ?? "";

    // Required timestamp fields must be present and valid
    if (!createdAt || !updatedAt || !homeTimezoneSetAt) {
      return undefined;
    }

    const builtUser: User = {
      uid: data.uid,
      createdAt,
      displayName: data.displayName,
      homeTimezone: data.homeTimezone,
      goal: data.goal as Goal,
      metrics: data.metrics ?? undefined,
      homeTimezoneSetAt,
      homeTimezoneUpdatedAt,
      officialStartWeekId: data.officialStartWeekId,
      officialWeekStatus: data.officialWeekStatus,
      currentWeekId: data.currentWeekId,
      officialStartAt: data.officialStartAt,
      updatedAt,
      username: data.username,
      usernameLower: data.usernameLower,
      weeklyTargetDays: data.weeklyTargetDays as WeeklyTargetDays,
      avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : "",
    };

    return builtUser;
  } catch (error) {
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
export const createUserProfile = async (user: CreateUserProfileRequest): Promise<CreateUserProfileResponse> => {
  try {
    const createUserProfileFunction = httpsCallable<CreateUserProfileRequest, CreateUserProfileResponse>(
      functions,
      "createUserProfile",
    );

    const userResponse = await createUserProfileFunction(user);
    return userResponse.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchUserWeekAggregate = async ({
  params,
}: {
  params: { uid: string; weekId: string };
}): Promise<UserWeekAggregate | null> => {
  const { uid, weekId } = params;
  try {
    const docId = `${uid}_${weekId}`;
    const weekAggregateDoc = doc(db, `userWeekAggregates/${docId}`);
    const snapshot = await getDoc(weekAggregateDoc);
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as UserWeekAggregate;
  } catch (error: any) {
    throw error;
  }
};

export const fetchUserMonthAggregate = async ({
  params,
}: {
  params: { uid: string; monthId: string };
}): Promise<UserMonthAggregate | null> => {
  const { uid, monthId } = params;
  try {
    const docId = `${uid}_${monthId}`;
    const monthAggregateDoc = doc(db, `userMonthAggregates/${docId}`);
    const snapshot = await getDoc(monthAggregateDoc);
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as UserMonthAggregate;
  } catch (error: any) {
    throw error;
  }
};

export const fetchUserStats = async ({ params }: { params: { uid: string } }): Promise<UserStats | null> => {
  const { uid } = params;
  try {
    const userStatsDoc = doc(db, `userStats/${uid}`);
    const snapshot = await getDoc(userStatsDoc);
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as UserStats;
  } catch (error: any) {
    console.error("error: ", error);
    throw error;
  }
};

export const fetchUsersHomeTimezone = async ({ params }: { params: { uid: string } }): Promise<string | null> => {
  try {
    const fetchUsersHomeTimezoneFunction = httpsCallable<{ uid: string }, string>(
      functions,
      "fetchUsersHomeTimezone",
    );
    const response = await fetchUsersHomeTimezoneFunction({ uid: params.uid });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const fetchUserLeaderboardEntry = async ({
  params,
}: {
  params: { uid: string };
}): Promise<LeaderboardEntry | null> => {
  const { uid } = params;
  try {
    const leaderboardEntriesDoc = doc(db, `leaderboardEntries/${uid}`);
    const snapshot = await getDoc(leaderboardEntriesDoc);
    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as LeaderboardEntry;
  } catch (error: any) {
    throw error;
  }
};

export const getPublicProfile = async (uid: string): Promise<PublicProfile | null> => {
  if (!uid) {
    return null;
  }

  const snapshot = await getDoc(doc(db, "publicProfiles", uid));

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    uid: snapshot.id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    username: typeof data.username === "string" ? data.username : "",
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    avatarVersion: typeof data.avatarVersion === "number" ? data.avatarVersion : 0,
    avatarUpdatedAt: data.avatarUpdatedAt,
  };
};
