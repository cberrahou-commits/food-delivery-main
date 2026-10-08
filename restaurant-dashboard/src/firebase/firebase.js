import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCHWynUsudT89nbd4XaRTHsajjlxL-WmNs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "food-delivery-prod-b474f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "food-delivery-prod-b474f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "food-delivery-prod-b474f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "203999238087",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:203999238087:web:5bb682b683710032926be2",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Init database
export const db = getFirestore(app);
