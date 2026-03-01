import { initializeApp } from "firebase/app";
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

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app); // Optional: specify region here if not us-central1
// For local development with the emulator:
connectFunctionsEmulator(functions, "localhost", 5001); //

// const analytics = getAnalytics(app);

export { functions };
