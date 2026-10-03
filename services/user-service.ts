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
  UpdateHomeTimezoneRequest,
  UpdateHomeTimezoneResponse,
} from "@builtmode/shared";

import { httpsCallable } from "firebase/functions";

import { uploadImageAsync } from "@/lib/firestorage";
import { firestoreTimestamp, firestoreTimestampV2 } from "@/packages/shared/src/types/firestore";
import { doc, getDoc, getDocFromServer, onSnapshot } from "firebase/firestore";

export const checkForUserProfile = async (
  uid: string,
  source: "default" | "server" = "default",
): Promise<User | undefined> => {
  try {
    const userDocRef = doc(db, `users/${uid}`);
    const userSnap = await (source === "server" ? getDocFromServer(userDocRef) : getDoc(userDocRef));

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
      pendingHomeTimezone: data.pendingHomeTimezone ?? null,
      pendingHomeTimezoneStartsAt: data.pendingHomeTimezoneStartsAt ?? null,
      pendingHomeTimezoneWeekId: data.pendingHomeTimezoneWeekId ?? null,
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
      pendingWeeklyTargetDays: data.pendingWeeklyTargetDays as WeeklyTargetDays,
      pendingWeeklyTargetStartsAt: data.pendingWeeklyTargetStartsAt,
      pendingDeloadWeekStartsAt: data.pendingDeloadWeekStartsAt,
      lastDeloadWeekStartedAt: data.lastDeloadWeekStartedAt,
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

export const changeUserAvatarUrl = async (params: {
  uid: string;
  avatarUrl: string | null;
}): Promise<PublicProfile> => {
  const { avatarUrl, uid } = params;
  try {
    const changeUserAvatarUrlFunction = httpsCallable<{ avatarUrl: string | null }, PublicProfile>(
      functions,
      "changeUserAvatarUrl",
    );
    const convertedUrl = avatarUrl ? ((await uploadImageAsync(avatarUrl, `user-avatars/${uid}`)) ?? null) : null;
    const response = await changeUserAvatarUrlFunction({ avatarUrl: convertedUrl });
    if (!response.data || response.data === undefined) throw Error("Failed to update user avatar url");
    return response.data;
  } catch (error: any) {
    console.error("Failed to update user avatar url: ", error);
    throw error;
  }
};

export const changeWeeklyTarget = async (params: {
  weeklyTarget: WeeklyTargetDays;
}): Promise<firestoreTimestamp | firestoreTimestampV2> => {
  const { weeklyTarget } = params;
  try {
    const changeWeeklyTargetFunction = httpsCallable<
      { weeklyTarget: WeeklyTargetDays },
      firestoreTimestamp | firestoreTimestampV2
    >(functions, "changeWeeklyTarget");

    const response = await changeWeeklyTargetFunction({ weeklyTarget });
    if (!response.data || response.data === undefined) throw Error("Failed to update weekly target");
    return response.data;
  } catch (error: any) {
    console.error("Failed to update weekly target");
    throw error;
  }
};

export const cancelDeloadWeek = async (): Promise<{ success: boolean; msg: string }> => {
  const cancelDeloadWeekFunction = httpsCallable<void, { success: boolean; msg: string }>(
    functions,
    "cancelDeloadWeek",
  );
  const response = await cancelDeloadWeekFunction();
  if (!response.data) throw Error("Failed to cancel deload week");
  return response.data;
};

export const startDeloadWeek = async (): Promise<{ success: boolean; msg: string }> => {
  try {
    const startDeloadWeekFunction = httpsCallable<void, { success: boolean; msg: string }>(
      functions,
      "startDeloadWeek",
    );

    const response = await startDeloadWeekFunction();
    if (!response.data || response.data === undefined) throw Error("Failed to start deload week");
    return response.data;
  } catch (error: any) {
    console.error("Failed to start deload week");
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

  const data = snapshot.data() || {};

  return {
    uid: snapshot.id,
    displayName: typeof data.displayName === "string" ? data.displayName : "",
    username: typeof data.username === "string" ? data.username : "",
    avatarUrl: typeof data.avatarUrl === "string" ? data.avatarUrl : null,
    avatarVersion: typeof data.avatarVersion === "number" ? data.avatarVersion : 0,
    avatarUpdatedAt: data.avatarUpdatedAt,
  };
};

export const updateHomeTimezone = async (params: UpdateHomeTimezoneRequest): Promise<UpdateHomeTimezoneResponse> => {
  const update = httpsCallable<UpdateHomeTimezoneRequest, UpdateHomeTimezoneResponse>(functions, "updateHomeTimezone");
  return (await update(params)).data;
};

type HomeTimezoneFields = Pick<User, "homeTimezone" | "homeTimezoneUpdatedAt" | "pendingHomeTimezone"
  | "pendingHomeTimezoneWeekId" | "pendingHomeTimezoneStartsAt" | "currentWeekId">;

export const subscribeToHomeTimezone = (uid: string, onChange: (fields: HomeTimezoneFields) => void) =>
  onSnapshot(doc(db, `users/${uid}`), (snapshot) => {
    const data = snapshot.data();
    if (!data || typeof data.homeTimezone !== "string") return;
    onChange({
      homeTimezone: data.homeTimezone,
      homeTimezoneUpdatedAt: data.homeTimezoneUpdatedAt,
      pendingHomeTimezone: data.pendingHomeTimezone ?? null,
      pendingHomeTimezoneWeekId: data.pendingHomeTimezoneWeekId ?? null,
      pendingHomeTimezoneStartsAt: data.pendingHomeTimezoneStartsAt ?? null,
      currentWeekId: data.currentWeekId,
    });
  }, (error) => console.error("Unable to sync home timezone:", error));
