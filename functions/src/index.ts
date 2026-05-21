/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { saveAsTemplateRequestSchema } from "@builtmode/shared/schemas/template";
import { createUserProfileRequestSchema } from "@builtmode/shared/schemas/user";
import { completeWorkoutRequestSchema } from "@builtmode/shared/schemas/workout";
import { SaveAsTemplateRequest } from "@builtmode/shared/types/template";
import { CreateUserProfileRequest } from "@builtmode/shared/types/user";
import { CompleteWorkoutRequest } from "@builtmode/shared/types/workout";
import { setGlobalOptions } from "firebase-functions/v2";
import { CallableRequest, HttpsError, onCall } from "firebase-functions/v2/https";
import {
  handleCancelFriendRequest,
  handleRespondToFriendRequest,
  handleSearchUserByUsername,
  handleSendFriendRequest,
} from "./functions/social.js";
import { handleDeleteTemplate, handleSaveAsTemplate } from "./functions/template.js";
import { handleCreateUserProfile } from "./functions/user.js";
import { handleCompleteWorkout } from "./functions/workout.js";
import { assertValidTimezone } from "./utils/time.js";
import { handleGetNextOfficialStartWeekId, handleGetWeekId } from "./utils/weekId.js";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

export const createUserProfile = onCall(
  async (request: CallableRequest<CreateUserProfileRequest>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const parsed = createUserProfileRequestSchema.safeParse(request.data);

    if (!parsed.success) {
      throw new HttpsError("invalid-argument", "Invalid profile payload.");
    }

    assertValidTimezone(parsed.data.homeTimezone);

    return await handleCreateUserProfile(request.auth.uid, parsed.data);
  },
);

export const getWeekId = onCall((request) => {
  const { date, homeTimezone } = request.data;
  if (!date || typeof homeTimezone !== "string") {
    throw new HttpsError("invalid-argument", "Expected { date, homeTimezone }.");
  }
  return handleGetWeekId(date, homeTimezone);
});

export const getNextOfficialStartWeekId = onCall((request) => {
  const { date, homeTimezone } = request.data;
  if (!date || typeof homeTimezone !== "string") {
    throw new HttpsError("invalid-argument", "Expected { date, homeTimezone }.");
  }
  return handleGetNextOfficialStartWeekId(date, homeTimezone);
});

export const completeWorkout = onCall(async (request: CallableRequest<CompleteWorkoutRequest>) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const parsed = completeWorkoutRequestSchema.safeParse(request.data);

  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid complete workout payload.");
  }

  return await handleCompleteWorkout(request.auth.uid, parsed.data);
});

export const saveAsTemplate = onCall(async (request: CallableRequest<SaveAsTemplateRequest>) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const parsed = saveAsTemplateRequestSchema.safeParse(request.data);

  if (!parsed.success) {
    throw new HttpsError("invalid-argument", "Invalid save as template payload.");
  }

  return await handleSaveAsTemplate(request.auth.uid, parsed.data);
});

export const deleteTemplate = onCall(async (request: CallableRequest<{ id: string }>) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const { id } = request.data;

  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "Invalid delete template payload.");
  }

  return await handleDeleteTemplate(request.auth.uid, id);
});

export const sendFriendRequest = onCall(async (request: CallableRequest<{ id: string }>) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const { id } = request.data;

  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "Invalid sendFriendRequest payload.");
  }

  return await handleSendFriendRequest(request.auth.uid, id);
});

export const respondToFriendRequest = onCall(
  async (request: CallableRequest<{ requestId: string; action: "accepted" | "declined" }>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const { requestId, action } = request.data;

    if (!requestId || typeof requestId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid respondToFriendRequest payload.");
    }
    if (!action && action !== "accepted" && action !== "declined") {
      throw new HttpsError("invalid-argument", "Invalid action for respondToFriendRequest.");
    }

    return await handleRespondToFriendRequest(request.auth.uid, requestId, action);
  },
);

export const cancelFriendRequest = onCall(
  async (request: CallableRequest<{ requestId: string }>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const { requestId } = request.data;

    if (!requestId || typeof requestId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid cancelFriendRequest payload.");
    }

    return await handleCancelFriendRequest(request.auth.uid, requestId);
  },
);

export const searchUserByUsername = onCall(
  async (request: CallableRequest<{ username: string }>) => {
    if (!request.auth?.uid) {
      throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const { username } = request.data;

    if (!username || typeof username !== "string") {
      throw new HttpsError("invalid-argument", "Invalid searchUserByUsername payload.");
    }

    return await handleSearchUserByUsername(request.auth.uid, username);
  },
);
