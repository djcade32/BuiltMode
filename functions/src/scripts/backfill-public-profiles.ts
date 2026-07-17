import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldPath, FieldValue, getFirestore, QueryDocumentSnapshot } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;

if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID must be provided.");
}

initializeApp({
  credential: applicationDefault(),
  projectId,
});

const db = getFirestore();

const PAGE_SIZE = 200;

type LegacyUserData = {
  username?: unknown;
  displayName?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  avatarUrl?: unknown;
  photoUrl?: unknown;
  photoURL?: unknown;
};

const getString = (value: unknown): string | undefined => {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
};

const buildDisplayName = (data: LegacyUserData, username: string): string => {
  const explicitDisplayName = getString(data.displayName);

  if (explicitDisplayName) {
    return explicitDisplayName;
  }

  const firstName = getString(data.firstName);
  const lastName = getString(data.lastName);

  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return fullName || username;
};

const buildAvatarUrl = (data: LegacyUserData): string | null => {
  return getString(data.avatarUrl) ?? getString(data.photoUrl) ?? getString(data.photoURL) ?? null;
};

const backfillPublicProfiles = async (): Promise<void> => {
  let cursor: QueryDocumentSnapshot | undefined;

  let scannedCount = 0;
  let createdCount = 0;
  let skippedExistingCount = 0;
  let skippedInvalidCount = 0;

  while (true) {
    let usersQuery = db.collection("users").orderBy(FieldPath.documentId()).limit(PAGE_SIZE);

    if (cursor) {
      usersQuery = usersQuery.startAfter(cursor);
    }

    const usersSnapshot = await usersQuery.get();

    if (usersSnapshot.empty) {
      break;
    }

    const publicProfileRefs = usersSnapshot.docs.map((userDocument) =>
      db.collection("publicProfiles").doc(userDocument.id),
    );

    /*
     * Read the destination documents first so the
     * migration never overwrites a profile that has
     * already been created or updated.
     */
    const existingProfiles = await db.getAll(...publicProfileRefs);

    const existingProfileIds = new Set(
      existingProfiles.filter((profile) => profile.exists).map((profile) => profile.id),
    );

    const writer = db.bulkWriter();

    writer.onWriteError((error) => {
      console.error("Public-profile migration write failed", {
        documentPath: error.documentRef.path,
        failedAttempts: error.failedAttempts,
        code: error.code,
        message: error.message,
      });

      /*
       * Retry transient failures a limited
       * number of times.
       */
      return error.failedAttempts < 5;
    });

    for (const userDocument of usersSnapshot.docs) {
      scannedCount += 1;

      if (existingProfileIds.has(userDocument.id)) {
        skippedExistingCount += 1;
        continue;
      }

      const data = userDocument.data() as LegacyUserData;

      const username = getString(data.username);

      if (!username) {
        skippedInvalidCount += 1;

        console.warn("Skipping user without username", {
          uid: userDocument.id,
        });

        continue;
      }

      const publicProfile = {
        uid: userDocument.id,
        username,
        displayName: buildDisplayName(data, username),
        avatarUrl: buildAvatarUrl(data),
        avatarVersion: 0,
        avatarUpdatedAt: FieldValue.serverTimestamp(),
      };

      writer.set(db.collection("publicProfiles").doc(userDocument.id), publicProfile);

      createdCount += 1;
    }

    await writer.close();

    console.log("Migration page completed", {
      scannedCount,
      createdCount,
      skippedExistingCount,
      skippedInvalidCount,
    });

    cursor = usersSnapshot.docs[usersSnapshot.docs.length - 1];
  }

  console.log("Public-profile migration completed", {
    scannedCount,
    createdCount,
    skippedExistingCount,
    skippedInvalidCount,
  });
};

backfillPublicProfiles()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error("Public-profile migration failed", error);

    process.exit(1);
  });
