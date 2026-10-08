import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHWynUsudT89nbd4XaRTHsajjlxL-WmNs",
  authDomain: "food-delivery-prod-b474f.firebaseapp.com",
  projectId: "food-delivery-prod-b474f",
  storageBucket: "food-delivery-prod-b474f.firebasestorage.app",
  messagingSenderId: "203999238087",
  appId: "1:203999238087:web:5bb682b683710032926be2",
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  authInstance = getAuth(app);
}

import { getStorage } from "firebase/storage";

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);
