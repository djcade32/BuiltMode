import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const adminApp = getApps().length ? getApps()[0] : initializeApp();

const db = getFirestore(adminApp);
const auth = getAuth(adminApp);

export { adminApp, auth, db };
