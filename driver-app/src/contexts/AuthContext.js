import { createContext, useContext, useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../../firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Platform, Alert } from "react-native";
import { registerForPushNotificationsAsync } from "../services/notificationService";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  "203999238087-ki66tu99bn0tfe1k54lhnble56lrd6fr.apps.googleusercontent.com";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const provider = new GoogleAuthProvider();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri: "https://auth.expo.io/@chaouki.b/food-delivery-courier",
    },
    {
      useProxy: true,
      projectNameForProxy: "@chaouki.b/food-delivery-courier",
    }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then(async (res) => {
            console.log("Livreur connecté avec Google:", res.user.uid);
            await ensureDriverProfile(res.user);
          })
          .catch((err) => {
            console.error("Erreur Firebase Google Credential:", err);
            Alert.alert("Erreur Google", err.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (response?.type === "error") {
      console.error("Google Auth Session Error:", response.error);
      Alert.alert(
        "Erreur Google",
        response.error?.message || "La connexion Google a échoué."
      );
    }
  }, [response]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Driver auth state:", currentUser?.uid);
      setUser(currentUser);
      if (currentUser?.uid) {
        await ensureDriverProfile(currentUser);
        registerForPushNotificationsAsync(currentUser.uid);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const ensureDriverProfile = async (firebaseUser) => {
    try {
      const userRef = doc(db, "user", firebaseUser.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const parts = (firebaseUser.displayName || "").trim().split(" ");
        await setDoc(userRef, {
          firstName: parts[0] || "Livreur",
          lastName: parts.slice(1).join(" ") || "",
          email: firebaseUser.email || "",
          role: "courier",
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("Could not ensure driver profile in user collection:", e);
    }
  };

  const createUser = async (email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureDriverProfile(cred.user);
    return cred;
  };

  const signInUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = () => {
    return signOut(auth);
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === "web") {
        const res = await signInWithPopup(auth, provider);
        await ensureDriverProfile(res.user);
        return res;
      }
      if (!request) {
        Alert.alert(
          "Initialisation",
          "Le service Google est en cours d'initialisation, veuillez patienter une seconde."
        );
        return;
      }
      await promptAsync({
        useProxy: true,
        projectNameForProxy: "@chaouki.b/food-delivery-courier",
      });
    } catch (err) {
      console.error("signInWithGoogle prompt error:", err);
      Alert.alert("Erreur Google", err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        createUser,
        signInUser,
        signOutUser,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

