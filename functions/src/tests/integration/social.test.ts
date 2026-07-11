// functions/src/tests/integration/social.test.ts

import type { CreateUserProfileRequest } from "@builtmode/shared/types/user";
import {
  handleCancelFriendRequest,
  handleRemoveFriend,
  handleRespondToFriendRequest,
  handleSendFriendRequest,
} from "../../functions/social.js";
import { handleCreateUserProfile } from "../../functions/user.js";
import { db } from "../../lib/firebaseAdmin.js";
import { clearAuth, clearFirestore } from "../utils/clearEmulators.js";

describe("social functions", () => {
  let fromUid: string;
  let toUid: string;
  let thirdUid: string;

  let fromInput: CreateUserProfileRequest;
  let toInput: CreateUserProfileRequest;
  let thirdInput: CreateUserProfileRequest;

  beforeEach(async () => {
    await clearFirestore();
    await clearAuth();

    const unique = Date.now().toString();

    fromUid = `from-user-${unique}`;
    toUid = `to-user-${unique}`;
    thirdUid = `third-user-${unique}`;

    fromInput = {
      username: `fromuser${unique}`,
      displayName: "From User",
      goal: "BUILD MUSCLE",
      metrics: {
        height: 70,
        weight: 204,
        bodyFatPercentage: 16,
        system: "IMPERIAL",
      },
      homeTimezone: "America/New_York",
      weeklyTargetDays: 4,
    };

    toInput = {
      username: `touser${unique}`,
      displayName: "To User",
      goal: "BUILD MUSCLE",
      metrics: {
        height: 68,
        weight: 180,
        bodyFatPercentage: 14,
        system: "IMPERIAL",
      },
      homeTimezone: "America/New_York",
      weeklyTargetDays: 5,
    };

    thirdInput = {
      username: `thirduser${unique}`,
      displayName: "Third User",
      goal: "BUILD MUSCLE",
      metrics: {
        height: 72,
        weight: 210,
        bodyFatPercentage: 18,
        system: "IMPERIAL",
      },
      homeTimezone: "America/New_York",
      weeklyTargetDays: 3,
    };

    await handleCreateUserProfile(fromUid, fromInput);
    await handleCreateUserProfile(toUid, toInput);
    await handleCreateUserProfile(thirdUid, thirdInput);
  });

  describe("handleSendFriendRequest", () => {
    test("creates a pending friend request", async () => {
      const result = await handleSendFriendRequest(fromUid, toUid);

      expect(result).toBe(true);

      const requestId = `${fromUid}_${toUid}`;
      const requestSnap = await db.doc(`friendRequests/${requestId}`).get();

      expect(requestSnap.exists).toBe(true);
      expect(requestSnap.data()).toMatchObject({
        requestId,
        fromUid,
        toUid,
        fromUsername: fromInput.username,
        fromDisplayName: fromInput.displayName,
        toUsername: toInput.username,
        toDisplayName: toInput.displayName,
        status: "pending",
        respondedAt: null,
      });

      expect(requestSnap.data()?.createdAt).toBeDefined();
      expect(requestSnap.data()?.updatedAt).toBeDefined();
    });

    test("returns false when sending a request to self", async () => {
      const result = await handleSendFriendRequest(fromUid, fromUid);

      expect(result).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${fromUid}_${fromUid}`).get();

      expect(requestSnap.exists).toBe(false);
    });

    test("returns false when target user does not exist", async () => {
      const missingUid = "missing-user";

      const result = await handleSendFriendRequest(fromUid, missingUid);

      expect(result).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${fromUid}_${missingUid}`).get();

      expect(requestSnap.exists).toBe(false);
    });

    test("returns false when sender user does not exist", async () => {
      const missingUid = "missing-sender";

      const result = await handleSendFriendRequest(missingUid, toUid);

      expect(result).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${missingUid}_${toUid}`).get();

      expect(requestSnap.exists).toBe(false);
    });

    test("returns false when friend request already exists", async () => {
      const firstResult = await handleSendFriendRequest(fromUid, toUid);
      const secondResult = await handleSendFriendRequest(fromUid, toUid);

      expect(firstResult).toBe(true);
      expect(secondResult).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${fromUid}_${toUid}`).get();

      expect(requestSnap.exists).toBe(true);
      expect(requestSnap.data()?.status).toBe("pending");
    });

    test("returns false when users are already friends", async () => {
      await handleSendFriendRequest(fromUid, toUid);
      await handleRespondToFriendRequest(toUid, `${fromUid}_${toUid}`, "accepted");

      const result = await handleSendFriendRequest(fromUid, toUid);

      expect(result).toBe(false);
    });

    test("returns false when request has already been responded to", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);
      await handleRespondToFriendRequest(toUid, requestId, "declined");

      const result = await handleRespondToFriendRequest(toUid, requestId, "accepted");

      expect(result).toBe(false);

      const [requestSnap, toFriendSnap, fromFriendSnap] = await Promise.all([
        db.doc(`friendRequests/${requestId}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
      ]);

      expect(requestSnap.data()?.status).toBe("declined");
      expect(toFriendSnap.exists).toBe(false);
      expect(fromFriendSnap.exists).toBe(false);
    });

    test("returns false when reverse friend request already exists", async () => {
      await handleSendFriendRequest(toUid, fromUid);

      const result = await handleSendFriendRequest(fromUid, toUid);

      expect(result).toBe(false);

      const forwardSnap = await db.doc(`friendRequests/${fromUid}_${toUid}`).get();
      const reverseSnap = await db.doc(`friendRequests/${toUid}_${fromUid}`).get();

      expect(forwardSnap.exists).toBe(false);
      expect(reverseSnap.exists).toBe(true);
    });
  });

  describe("handleRespondToFriendRequest", () => {
    test("accepts a friend request and creates mirrored friend docs", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);

      const result = await handleRespondToFriendRequest(toUid, requestId, "accepted");

      expect(result).toBe(true);

      const [requestSnap, toFriendSnap, fromFriendSnap] = await Promise.all([
        db.doc(`friendRequests/${requestId}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
      ]);

      expect(requestSnap.exists).toBe(true);
      expect(requestSnap.data()).toMatchObject({
        requestId,
        fromUid,
        toUid,
        status: "accepted",
      });
      expect(requestSnap.data()?.respondedAt).toBeDefined();

      expect(toFriendSnap.exists).toBe(true);
      expect(toFriendSnap.data()).toMatchObject({
        uid: fromUid,
      });

      expect(fromFriendSnap.exists).toBe(true);
      expect(fromFriendSnap.data()).toMatchObject({
        uid: toUid,
      });
    });

    test("declines a friend request and does not create friend docs", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);

      const result = await handleRespondToFriendRequest(toUid, requestId, "declined");

      expect(result).toBe(true);

      const [requestSnap, toFriendSnap, fromFriendSnap] = await Promise.all([
        db.doc(`friendRequests/${requestId}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
      ]);

      expect(requestSnap.exists).toBe(true);
      expect(requestSnap.data()).toMatchObject({
        requestId,
        fromUid,
        toUid,
        status: "declined",
      });
      expect(requestSnap.data()?.respondedAt).toBeDefined();

      expect(toFriendSnap.exists).toBe(false);
      expect(fromFriendSnap.exists).toBe(false);
    });

    test("returns false when request does not exist", async () => {
      const result = await handleRespondToFriendRequest(toUid, "missing-request", "accepted");

      expect(result).toBe(false);
    });

    test("returns false when user is not the request receiver", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);

      const result = await handleRespondToFriendRequest(thirdUid, requestId, "accepted");

      expect(result).toBe(false);

      const [requestSnap, toFriendSnap, fromFriendSnap] = await Promise.all([
        db.doc(`friendRequests/${requestId}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
      ]);

      expect(requestSnap.data()?.status).toBe("pending");
      expect(toFriendSnap.exists).toBe(false);
      expect(fromFriendSnap.exists).toBe(false);
    });
  });

  describe("handleCancelFriendRequest", () => {
    test("cancels a pending friend request", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);

      const result = await handleCancelFriendRequest(fromUid, requestId);

      expect(result).toBe(true);

      const requestSnap = await db.doc(`friendRequests/${requestId}`).get();

      expect(requestSnap.exists).toBe(true);
      expect(requestSnap.data()).toMatchObject({
        requestId,
        fromUid,
        toUid,
        status: "cancelled",
      });
    });

    test("returns false when request does not exist", async () => {
      const result = await handleCancelFriendRequest(fromUid, "missing-request");

      expect(result).toBe(false);
    });

    test("returns false when user is not the sender", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);

      const result = await handleCancelFriendRequest(toUid, requestId);

      expect(result).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${requestId}`).get();

      expect(requestSnap.data()?.status).toBe("pending");
    });

    test("returns false when request is no longer pending", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);
      await handleRespondToFriendRequest(toUid, requestId, "accepted");

      const result = await handleCancelFriendRequest(fromUid, requestId);

      expect(result).toBe(false);

      const requestSnap = await db.doc(`friendRequests/${requestId}`).get();

      expect(requestSnap.data()?.status).toBe("accepted");
    });
  });

  describe("handleRemoveFriend", () => {
    test("removes mirrored friend docs", async () => {
      const requestId = `${fromUid}_${toUid}`;

      await handleSendFriendRequest(fromUid, toUid);
      await handleRespondToFriendRequest(toUid, requestId, "accepted");

      const beforeFromFriendSnap = await db.doc(`users/${fromUid}/friends/${toUid}`).get();
      const beforeToFriendSnap = await db.doc(`users/${toUid}/friends/${fromUid}`).get();

      expect(beforeFromFriendSnap.exists).toBe(true);
      expect(beforeToFriendSnap.exists).toBe(true);

      const result = await handleRemoveFriend(fromUid, toUid);

      expect(result).toBe(true);

      const [afterFromFriendSnap, afterToFriendSnap] = await Promise.all([
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
      ]);

      expect(afterFromFriendSnap.exists).toBe(false);
      expect(afterToFriendSnap.exists).toBe(false);
    });

    test("returns true even if friend docs do not exist", async () => {
      const result = await handleRemoveFriend(fromUid, toUid);

      expect(result).toBe(true);

      const [fromFriendSnap, toFriendSnap] = await Promise.all([
        db.doc(`users/${fromUid}/friends/${toUid}`).get(),
        db.doc(`users/${toUid}/friends/${fromUid}`).get(),
      ]);

      expect(fromFriendSnap.exists).toBe(false);
      expect(toFriendSnap.exists).toBe(false);
    });
  });
});
