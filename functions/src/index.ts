/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { handleCreateUserProfile } from "./functions/user.js";
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

export const createUserProfile = onCall(async (request) => {
  const { date, user } = request.data;
  if (!date || typeof user !== "object" || user === null) {
    throw new HttpsError("invalid-argument", "Expected { date, user }.");
  }
  const { uid, username, usernameLower, displayName, homeTimezone } = user;
  if (!uid || !username || !usernameLower || !displayName || !homeTimezone) {
    throw new HttpsError(
      "invalid-argument",
      "user must include uid, username, usernameLower, displayName, and homeTimezone.",
    );
  }

  return await handleCreateUserProfile(date, user);
});

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
