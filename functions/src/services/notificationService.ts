import { FieldValue, Timestamp, getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const db = getFirestore();

type NotificationType = "friend_request" | "accepted_friend_request" | "official_week_started";

type SendPushNotificationInput = {
  recipientUid: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, string>;
};

type PushTokenDoc = {
  uid: string;
  token: string;
  platform?: "ios" | "android";
  enabled?: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

const MAX_TOKENS_PER_MULTICAST = 500;

export async function sendPushNotificationToUser({
  recipientUid,
  title,
  body,
  type,
  data = {},
}: SendPushNotificationInput): Promise<void> {
  const tokenSnapshot = await db
    .collection(`users/${recipientUid}/pushTokens`)
    .where("enabled", "==", true)
    .get();

  if (tokenSnapshot.empty) {
    await createNotificationLog({
      recipientUid,
      title,
      body,
      type,
      data,
      status: "skipped_no_tokens",
    });

    return;
  }

  const tokens = tokenSnapshot.docs
    .map((doc) => {
      const tokenDoc = doc.data() as PushTokenDoc;
      return tokenDoc.token;
    })
    .filter(Boolean);

  if (tokens.length === 0) {
    await createNotificationLog({
      recipientUid,
      title,
      body,
      type,
      data,
      status: "skipped_no_tokens",
    });

    return;
  }

  const chunks = chunkArray(tokens, MAX_TOKENS_PER_MULTICAST);

  for (const tokenChunk of chunks) {
    const response = await getMessaging().sendEachForMulticast({
      tokens: tokenChunk,
      notification: {
        title,
        body,
      },
      data: {
        type,
        recipientUid,
        ...data,
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },
    });

    const invalidTokens: string[] = [];

    response.responses.forEach((sendResponse, index) => {
      if (sendResponse.success) return;

      const token = tokenChunk[index];
      const errorCode = sendResponse.error?.code;

      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        invalidTokens.push(token);
      }
    });

    if (invalidTokens.length > 0) {
      await disableInvalidTokens(recipientUid, invalidTokens);
    }

    await createNotificationLog({
      recipientUid,
      title,
      body,
      type,
      data,
      status: "sent",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  }
}

async function disableInvalidTokens(uid: string, invalidTokens: string[]): Promise<void> {
  const tokenSnapshot = await db
    .collection(`users/${uid}/pushTokens`)
    .where("token", "in", invalidTokens.slice(0, 30))
    .get();

  const batch = db.batch();

  tokenSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, {
      enabled: false,
      disabledAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}

async function createNotificationLog(input: {
  recipientUid: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, string>;
  status: "sent" | "skipped_no_tokens";
  successCount?: number;
  failureCount?: number;
}): Promise<void> {
  await db.collection(`users/${input.recipientUid}/notifications`).add({
    title: input.title,
    body: input.body,
    type: input.type,
    data: input.data,
    status: input.status,
    successCount: input.successCount ?? 0,
    failureCount: input.failureCount ?? 0,
    readAt: null,
    createdAt: FieldValue.serverTimestamp(),
  });
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  return chunks;
}
