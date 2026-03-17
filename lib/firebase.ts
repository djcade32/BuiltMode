import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  getAuth,
  //@ts-ignore
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCQ8jRXtG4oiI8xPxTiX7yirskttvyEScM",
  authDomain: "builtmode-90430.firebaseapp.com",
  projectId: "builtmode-90430",
  storageBucket: "builtmode-90430.firebasestorage.app",
  messagingSenderId: "181901947527",
  appId: "1:181901947527:web:5b8304145e20d0e74a7e22",
  measurementId: "G-PK7Z4PVE11",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const functions = getFunctions(app);
const db = getFirestore(app);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

if (__DEV__) {
  console.warn("Running Dev mode. Connecting to Firebase Emulator.");
  connectFunctionsEmulator(functions, "localhost", 5001);
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "localhost", 8080);
}

export { auth, db, functions };
