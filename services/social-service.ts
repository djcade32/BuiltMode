import { InfinitePage } from "@/hooks/useInfiniteQuery";
import { db, functions } from "@/lib/firebase";
import { chunkArray } from "@/lib/utils/chunk";
import { FeedItem, FriendRequest, SearchUserResult } from "@builtmode/shared";
import {
  collection,
  doc,
  DocumentData,
  documentId,
  DocumentSnapshot,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

type SocialResult = {
  success: boolean;
  message?: string;
};

export const sendFriendRequest = async (toUid: string): Promise<SocialResult> => {
  const sendFriendRequestFunction = httpsCallable<{ id: string }, boolean>(
    functions,
    "sendFriendRequest",
  );

  if (!toUid.trim()) {
    return { success: false, message: "toUid is required." };
  }
  try {
    const response = await sendFriendRequestFunction({ id: toUid });
    return response.data
      ? { success: true }
      : { success: false, message: `Error sending friend request to ${toUid}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error ? err.message : `Error sending friend request to ${toUid}.`,
    };
  }
};

export const respondToFriendRequest = async (
  requestId: string,
  action: "accepted" | "declined",
): Promise<SocialResult> => {
  const respondToFriendRequestFunction = httpsCallable<
    { requestId: string; action: "accepted" | "declined" },
    boolean
  >(functions, "respondToFriendRequest");

  if (!requestId.trim()) {
    return { success: false, message: "requestId is required." };
  }

  try {
    const response = await respondToFriendRequestFunction({ requestId, action });
    return response.data
      ? { success: true }
      : { success: false, message: `Error responding to friend request: ${requestId}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error
          ? err.message
          : `Error responding to friend request: ${requestId}.`,
    };
  }
};

export const cancelFriendRequest = async (requestId: string): Promise<SocialResult> => {
  const cancelFriendRequestFunction = httpsCallable<{ requestId: string }, boolean>(
    functions,
    "cancelFriendRequest",
  );

  if (!requestId.trim()) {
    return { success: false, message: "requestId is required." };
  }

  try {
    const response = await cancelFriendRequestFunction({ requestId });
    return response.data
      ? { success: true }
      : { success: false, message: `Error canceling friend request: ${requestId}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error
          ? err.message
          : `Error canceling friend request: ${requestId}.`,
    };
  }
};

export const searchUserByUsername = async (username: string): Promise<SearchUserResult | null> => {
  const SearchUserByUsernameFunction = httpsCallable<{ username: string }, SearchUserResult | null>(
    functions,
    "searchUserByUsername",
  );

  if (!username.trim()) {
    console.error("username is required");
    return null;
  }

  try {
    const response = await SearchUserByUsernameFunction({ username });
    return response.data;
  } catch (err) {
    throw err instanceof globalThis.Error
      ? err
      : new Error(`Error searching for user by username: ${username}.`);
  }
};

export const removeFriend = async (friendUid: string): Promise<SocialResult> => {
  const removeFriendFunction = httpsCallable<{ friendUid: string }, boolean>(
    functions,
    "removeFriend",
  );

  if (!friendUid.trim()) {
    return { success: false, message: "friendUid is required." };
  }

  try {
    const response = await removeFriendFunction({ friendUid });
    return response.data
      ? { success: true }
      : { success: false, message: `Error removing friend: ${friendUid}.` };
  } catch (err) {
    return {
      success: false,
      message:
        err instanceof globalThis.Error ? err.message : `Error removing friend: ${friendUid}.`,
    };
  }
};

export const getIncomingFriendRequests = async ({
  params,
}: {
  params: { uid: string };
}): Promise<FriendRequest[]> => {
  const requestsRef = collection(db, "friendRequests");

  const requestsQuery = query(
    requestsRef,
    where("toUid", "==", params.uid),
    where("status", "==", "pending"),
    orderBy("updatedAt", "desc"),
  );

  const snapshot = await getDocs(requestsQuery);

  const items: FriendRequest[] = snapshot.docs.map((doc) => ({
    ...(doc.data() as FriendRequest),
  }));

  return items;
};

export const getSentFriendRequests = async ({
  params,
}: {
  params: { uid: string };
}): Promise<FriendRequest[]> => {
  const requestsRef = collection(db, "friendRequests");

  const requestsQuery = query(
    requestsRef,
    where("fromUid", "==", params.uid),
    where("status", "==", "pending"),
    orderBy("updatedAt", "desc"),
  );

  const snapshot = await getDocs(requestsQuery);

  const items: FriendRequest[] = snapshot.docs.map((doc) => ({
    ...(doc.data() as FriendRequest),
  }));

  return items;
};

type FeedCursor = QueryDocumentSnapshot<DocumentData>;

export const getUserFeed = async ({
  pageParam,
  params,
  limit: pageSize,
}: {
  pageParam?: FeedCursor | null;
  params: { uid: string };
  limit: number;
}): Promise<InfinitePage<FeedItem, FeedCursor>> => {
  const feedRef = collection(db, `userFeeds/${params.uid}/items`);

  const feedQuery = pageParam
    ? query(feedRef, orderBy("createdAd", "desc"), startAfter(pageParam), limit(pageSize))
    : query(feedRef, orderBy("createdAt", "desc"), limit(pageSize));

  const snapshot = await getDocs(feedQuery);

  const items: FeedItem[] = snapshot.docs.map((doc) => ({
    ...(doc.data() as FeedItem),
  }));

  const hasMore = snapshot.docs.length === pageSize;
  const nextCursor = hasMore ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
};

const FRIENDS_PAGE_SIZE = 20;

type GetUserFriendsParams = {
  uid: string;
  cursor?: DocumentSnapshot;
  searchUsername?: string;
  limitCount?: number;
};

type GetUserFriendsResponse = {
  friends: any[];
  nextCursor: DocumentSnapshot | null;
  total: number;
};

const normalizeUsername = (username: string) => {
  return username.trim().toLowerCase().replace(/^@/, "");
};

export async function getUserFriends({
  params,
}: {
  params: GetUserFriendsParams;
}): Promise<GetUserFriendsResponse> {
  const { uid, cursor, searchUsername, limitCount = FRIENDS_PAGE_SIZE } = params;

  const normalizedSearchUsername = searchUsername ? normalizeUsername(searchUsername) : "";

  if (normalizedSearchUsername) {
    return getUserFriendsByExactUsername({
      uid,
      usernameLower: normalizedSearchUsername,
    });
  }

  const friendsRef = collection(db, `users/${uid}/friends`);

  const friendsQuery = cursor
    ? query(friendsRef, orderBy("createdAt", "desc"), startAfter(cursor), limit(limitCount))
    : query(friendsRef, orderBy("createdAt", "desc"), limit(limitCount));

  const friendsSnap = await getDocs(friendsQuery);

  const friendIds = friendsSnap.docs.map((doc) => doc.id);

  if (friendIds.length === 0) {
    return {
      friends: [],
      nextCursor: null,
      total: 0,
    };
  }

  const friends = await getLeaderboardEntriesForFriendIds(friendIds);

  const nextCursor = friendsSnap.docs[friendsSnap.docs.length - 1] ?? null;

  return {
    friends,
    nextCursor,
    total: friendIds.length,
  };
}

async function getLeaderboardEntriesForFriendIds(friendIds: string[]) {
  const chunks = chunkArray(friendIds, 10);

  const profileSnaps = await Promise.all(
    chunks.map((ids) =>
      getDocs(query(collection(db, "leaderboardEntries"), where(documentId(), "in", ids))),
    ),
  );

  const profileItems = profileSnaps.flatMap((snap) =>
    snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
    })),
  );

  const profileByUid = new Map(profileItems.map((profile) => [profile.uid, profile]));

  return friendIds.map((friendId) => profileByUid.get(friendId)).filter(Boolean);
}

async function getUserFriendsByExactUsername({
  uid,
  usernameLower,
}: {
  uid: string;
  usernameLower: string;
}): Promise<GetUserFriendsResponse> {
  const usernameSnap = await getDoc(doc(db, `usernames/${usernameLower}`));

  if (!usernameSnap.exists()) {
    return {
      friends: [],
      nextCursor: null,
      total: 0,
    };
  }

  const usernameData = usernameSnap.data();

  const friendUid = usernameData?.uid;

  if (!friendUid || friendUid === uid) {
    return {
      friends: [],
      nextCursor: null,
      total: 0,
    };
  }

  const friendRelationshipSnap = await getDoc(doc(db, `users/${uid}/friends/${friendUid}`));

  if (!friendRelationshipSnap.exists()) {
    return {
      friends: [],
      nextCursor: null,
      total: 0,
    };
  }

  const leaderboardSnap = await getDoc(doc(db, `leaderboardEntries/${friendUid}`));

  if (!leaderboardSnap.exists()) {
    return {
      friends: [],
      nextCursor: null,
      total: 0,
    };
  }

  return {
    friends: [
      {
        uid: leaderboardSnap.id,
        ...leaderboardSnap.data(),
      },
    ],
    nextCursor: null,
    total: 1,
  };
}
