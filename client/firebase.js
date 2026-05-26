import { Platform } from "react-native";
import {
  initializeApp,
  getApps,
  getApp,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  browserLocalPersistence,
  getReactNativePersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || String(v).trim().length === 0)
  .map(([k]) => k);

if (missingKeys.length) {
  console.error("Firebase config missing env vars:", missingKeys);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase Auth instance
export const auth =
  Platform.OS === "web"
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });

export const provider = new GoogleAuthProvider();

// Ensure web uses localStorage persistence so session survives refresh
if (Platform.OS === "web") {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.warn("Firebase persistence error:", error);
  });
}

export const db = getFirestore(app);

console.log("Firebase initialized");

export default app;


