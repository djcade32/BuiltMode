import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  connectAuthEmulator,
  getAuth,
  //@ts-ignore
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCQ8jRXtG4oiI8xPxTiX7yirskttvyEScM",
  authDomain: "builtmode-90430.firebaseapp.com",
  projectId: "builtmode-90430",
  storageBucket: "builtmode-90430.firebasestorage.app",
  messagingSenderId: "181901947527",
  appId: "1:181901947527:web:5b8304145e20d0e74a7e22",
  measurementId: "G-PK7Z4PVE11",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const functions = getFunctions(app);
const db = getFirestore(app);
const storage = getStorage(app);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  console.warn("initializeAuth failed, falling back to getAuth:", error);
  auth = getAuth(app);
}
const EMULATOR_HOST = "10.0.0.17";
if (__DEV__) {
  console.warn("Running Dev mode. Connecting to Firebase Emulator.");
  connectAuthEmulator(auth, `http://${EMULATOR_HOST}:9099`);
  connectFirestoreEmulator(db, EMULATOR_HOST, 8080);
  connectFunctionsEmulator(functions, EMULATOR_HOST, 5001);
  connectStorageEmulator(storage, EMULATOR_HOST, 9199);
  // connectFunctionsEmulator(functions, "localhost", 5001);
  // connectAuthEmulator(auth, "http://10.0.0.17:9099");
  // connectFirestoreEmulator(db, "localhost", 8080);
}

export { auth, db, functions };
