import { FeedItem, Friend, FriendRequest, SearchUserResult } from "@builtmode/shared/types/social";
import { Exercise } from "@builtmode/shared/types/workout";
import { Timestamp } from "firebase-admin/firestore";
import {
  addFeedItemToUserFeed,
  addFriendToUserList,
  addRespectToFeedItem,
  createFeedItem,
  createFriendRequest,
  getFriendRequest,
  getUserFriend,
  removeFriend,
  removeFriendRequest,
  removeRespectToFeedItem,
  updateFriendRequest,
  userHasRespectedFeedItem,
} from "../firestore/social.js";
import { getUserByUid } from "../firestore/user.js";
import { db } from "../lib/firebaseAdmin.js";
import { sendPushNotificationToUser } from "../services/notificationService.js";

export async function handleSendFriendRequest(fromUid: string, toUid: string): Promise<boolean> {
  if (fromUid === toUid) {
    console.error("Failed to send request to user. fromUid and toUid cannot be the same: ", toUid);
    return false;
  }
  let requesterDisplayName = "";

  const response = await db.runTransaction(async (tx) => {
    const forwardRequestId = `${fromUid}_${toUid}`;
    const reverseRequestId = `${toUid}_${fromUid}`;

    const forwardRequest = await getFriendRequest(tx, forwardRequestId);
    const reverseRequest = await getFriendRequest(tx, reverseRequestId);

    if (forwardRequest?.status === "pending" || reverseRequest?.status === "pending") {
      console.error("Failed to send request to user. Request already exists.");
      return false;
    }

    const checkIfFriendAlready = await getUserFriend(tx, fromUid, toUid);

    if (checkIfFriendAlready) {
      console.error("Failed to send request to user. Already friend: ", toUid);
      return false;
    }

    const toUserDoc = await getUserByUid(tx, toUid);
    const fromUserDoc = await getUserByUid(tx, fromUid);

    if (toUserDoc.exists) {
      if (!fromUserDoc.exists) {
        console.error("Failed to send request to user. Doesn't exist: ", fromUid);
        return false;
      }
      const toUser = toUserDoc.data();
      const fromUser = fromUserDoc.data();

      requesterDisplayName = fromUser?.displayName;

      const now = Timestamp.now();

      const doc: FriendRequest = {
        requestId: forwardRequestId,
        fromUid,
        toUid,

        fromUsername: fromUser?.username,
        fromDisplayName: fromUser?.displayName,
        fromAvatarUrl: fromUser?.avatarUrl,

        toUsername: toUser?.username,
        toDisplayName: toUser?.displayName,
        toAvatarUrl: toUser?.avatarUrl,

        status: "pending",

        createdAt: now,
        updatedAt: now,
        respondedAt: null,
      };
      createFriendRequest(tx, doc);
      return true;
    }
    console.error("Failed to send request to user. Doesn't exist:", toUid);
    return false;
  });

  response &&
    (await sendPushNotificationToUser({
      recipientUid: toUid,
      title: "New friend request",
      body: `${requesterDisplayName} wants to train with you.`,
      type: "friend_request",
      data: {
        targetUid: toUid,
        fromUid,
        screen: "friendsList",
      },
    }));

  return response;
}

export async function handleRespondToFriendRequest(
  uid: string,
  requestId: string,
  action: "accepted" | "declined",
): Promise<boolean> {
  let recipientUid = "";
  let toUserDisplayName = "";

  const response = await db.runTransaction(async (tx) => {
    const friendRequest = await getFriendRequest(tx, requestId);

    if (!friendRequest) {
      console.error("Failed to respond to friend request. Request doesn't exist: ", requestId);
      return false;
    }
    if (friendRequest.toUid !== uid) {
      console.error("Failed to respond to friend request. Denied access: ", requestId);
      return false;
    }
    if (friendRequest.status !== "pending") {
      console.error("Failed to respond to friend request. Can only respond to pending requests: ", requestId);
      return false;
    }
    recipientUid = friendRequest.fromUid;
    toUserDisplayName = friendRequest.toDisplayName;

    const now = Timestamp.now();

    const friendRequestDoc: FriendRequest = {
      ...(friendRequest as FriendRequest),
      status: action,
      updatedAt: now,
      respondedAt: now,
    };

    const responderFriendDoc: Friend = {
      uid: friendRequest.fromUid,
      createdAt: now,
      updatedAt: now,
    };

    const requesteeFriendDoc: Friend = {
      uid,
      createdAt: now,
      updatedAt: now,
    };

    updateFriendRequest(tx, friendRequestDoc);
    if (action === "accepted") {
      addFriendToUserList(tx, uid, responderFriendDoc);
      addFriendToUserList(tx, friendRequest.fromUid, requesteeFriendDoc);
    }
    return true;
  });

  response &&
    action == "accepted" &&
    (await sendPushNotificationToUser({
      recipientUid,
      title: "Accepted friend request",
      body: `${toUserDisplayName} accepted your train request.`,
      type: "friend_request",
      data: {
        targetUid: recipientUid,
        screen: "friendsList",
      },
    }));

  return response;
}

export async function handleCancelFriendRequest(uid: string, requestId: string): Promise<boolean> {
  return await db.runTransaction(async (tx) => {
    const friendRequest = await getFriendRequest(tx, requestId);

    if (!friendRequest) {
      console.error("Failed to cancel friend request. Request doesn't exist: ", requestId);
      return false;
    }
    if (friendRequest.fromUid !== uid) {
      console.error("Failed to cancel friend request. Denied access: ", requestId);
      return false;
    }
    if (friendRequest.status !== "pending") {
      console.error("Failed to cancel friend request. Can only cancel pending requests: ", requestId);
      return false;
    }

    const now = Timestamp.now();

    const friendRequestDoc: FriendRequest = {
      ...(friendRequest as FriendRequest),
      status: "cancelled",
      updatedAt: now,
    };

    updateFriendRequest(tx, friendRequestDoc);
    return true;
  });
}

export async function handleSearchUserByUsername(
  requesterUid: string,
  username: string,
): Promise<SearchUserResult | null> {
  const usernameLower = username.trim().toLowerCase();

  if (!usernameLower) {
    return null;
  }
  return await db.runTransaction(async (tx) => {
    const usernameSnap = await tx.get(db.doc(`usernames/${usernameLower}`));

    if (!usernameSnap.exists) {
      return null;
    }

    const usernameData = usernameSnap.data();
    if (!usernameData?.uid) {
      return null;
    }

    const foundUid = usernameData.uid;

    const userSnap = await getUserByUid(tx, foundUid);

    if (!userSnap.exists) {
      return null;
    }

    const foundUser = userSnap.data();

    let relationshipStatus: SearchUserResult["relationshipStatus"] = "none";
    let requestId: string | undefined;

    if (foundUid === requesterUid) {
      relationshipStatus = "self";
    } else {
      const friendDoc = await getUserFriend(tx, requesterUid, foundUid);

      if (friendDoc) {
        relationshipStatus = "friends";
      } else {
        const sentRequestId = `${requesterUid}_${foundUid}`;
        const receivedRequestId = `${foundUid}_${requesterUid}`;

        const [sentRequest, receivedRequest] = await Promise.all([
          getFriendRequest(tx, sentRequestId),
          getFriendRequest(tx, receivedRequestId),
        ]);

        if (sentRequest?.status === "pending") {
          relationshipStatus = "request_sent";
          requestId = sentRequestId;
        } else if (receivedRequest?.status === "pending") {
          relationshipStatus = "request_received";
          requestId = receivedRequestId;
        }
      }
    }

    return {
      uid: foundUid,
      username: foundUser?.username,
      usernameLower: foundUser?.usernameLower,
      displayName: foundUser?.displayName,
      avatarUrl: foundUser?.avatarUrl,
      relationshipStatus,
      ...(requestId ? { requestId } : {}),
    };
  });
}

export async function handleRemoveFriend(uid: string, friendUid: string): Promise<boolean> {
  return await db.runTransaction(async (tx) => {
    removeFriend(tx, uid, friendUid);
    removeFriend(tx, friendUid, uid);
    removeFriendRequest(tx, `${uid}_${friendUid}`);
    removeFriendRequest(tx, `${friendUid}_${uid}`);
    return true;
  });
}

type CreateWorkoutCompletedFeedItemParams = {
  tx: FirebaseFirestore.Transaction;

  uid: string;

  user: {
    username: string;
    displayName: string;
    avatarUrl?: string | null;
    weeklyTargetDays: number;
  };

  workout: {
    sessionId: string;
    workoutType?: string | null;
    name?: string | null;
    durationSeconds?: number | null;
    exercises?: Exercise[];

    weekId: string;
    localDateKey: string;
    localDate: string;

    workoutTimezone: string;
    workoutLocalDate: string;
    workoutLocalTime: string;
    workoutLocalDateTimeISO: string;
    workoutLocalDisplayDate: string;
    workoutLocalDisplayTime: string;
    workoutUtcOffsetMinutes: number;

    caption: string | null;
    photoUrl: string | null;
    respectCount: number;
    isPracticeWeek: boolean;
    completedAt: Timestamp;
  };

  weekAggregate: {
    activeDaysThisWeek: number;
    modeScore?: number | null;
  };

  userStats?: {
    currentWeekStreak?: number;
  };
};

export function createWorkoutCompletedFeedItem({
  tx,
  uid,
  user,
  workout,
  weekAggregate,
  userStats,
}: CreateWorkoutCompletedFeedItemParams) {
  const now = Timestamp.now();

  const feedItemId = `workout_${uid}_${workout.sessionId}`;

  const feedItem: FeedItem = {
    feedItemId,

    actorUid: uid,
    actorUsername: user.username,
    actorDisplayName: user.displayName,
    actorAvatarUrl: user.avatarUrl ?? null,

    type: "workout_completed" as const,
    visibility: "friends" as const,

    workoutId: workout.sessionId,
    workoutType: workout.workoutType ?? null,
    workoutName: workout.name ?? null,
    totalSets: workout.exercises
      ? workout.exercises.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0)
      : null,
    isPracticeWeek: workout.isPracticeWeek,

    durationSeconds: workout.durationSeconds ?? null,
    exerciseCount: workout.exercises ? workout.exercises.length : null,
    completedAt: workout.completedAt ?? now,
    caption: workout.caption,
    photoUrl: workout.photoUrl,
    respectCount: workout.respectCount,

    weekId: workout.weekId,
    localDateKey: workout.localDateKey,

    modeScore: weekAggregate.modeScore ?? null,
    weeklyTargetDays: user.weeklyTargetDays,
    weeklyProgress: weekAggregate.activeDaysThisWeek,
    currentWeekStreak: userStats?.currentWeekStreak ?? null,

    createdAt: now,
    updatedAt: now,
  };

  createFeedItem(tx, feedItem);

  return feedItem;
}

const MAX_BATCH_WRITES = 450;

export async function fanoutFeedItemToFriends(actorUid: string, feedItem: FeedItem) {
  const friendsSnap = await db.collection(`users/${actorUid}/friends`).get();

  const viewerUids = [actorUid, ...friendsSnap.docs.map((doc) => doc.id)];

  let batch = db.batch();
  let writeCount = 0;

  for (const viewerUid of viewerUids) {
    addFeedItemToUserFeed(batch, viewerUid, feedItem);
    writeCount += 1;

    if (writeCount >= MAX_BATCH_WRITES) {
      await batch.commit();
      batch = db.batch();
      writeCount = 0;
    }
  }

  if (writeCount > 0) {
    await batch.commit();
  }
}

export async function handleRespectFeedPost(uid: string, feedItemId: string) {
  return await db.runTransaction(async (tx) => {
    const feedItemAlreadyRespected = await userHasRespectedFeedItem(tx, uid, feedItemId);
    console.log("feedItemAlreadyRespected: ", feedItemAlreadyRespected);
    if (!feedItemAlreadyRespected) {
      await addRespectToFeedItem(tx, uid, feedItemId);
    } else {
      await removeRespectToFeedItem(tx, uid, feedItemId);
    }
  });
}
