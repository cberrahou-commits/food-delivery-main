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
import { auth, db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Platform, Alert } from "react-native";
import { registerForPushNotificationsAsync } from "../services/notificationService";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = "203999238087-ki66tu99bn0tfe1k54lhnble56lrd6fr.apps.googleusercontent.com";

const UserContext = createContext();

export const AuthContextProvder = ({ children }) => {
  const [user, setUser] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const provider = new GoogleAuthProvider();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      clientId: GOOGLE_WEB_CLIENT_ID,
      redirectUri: "https://auth.expo.io/@chaouki.b/food-delivery-user",
    },
    {
      useProxy: true,
      projectNameForProxy: "@chaouki.b/food-delivery-user",
    }
  );

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (id_token) {
        setLoading(true);
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then((res) => {
            console.log("Connecté avec Google avec succès:", res.user.uid);
          })
          .catch((err) => {
            console.error("Erreur Firebase Google Credential:", err);
            Alert.alert("Erreur de connexion Google", err.message);
          })
          .finally(() => {
            setLoading(false);
          });
      }
    } else if (response?.type === "error") {
      console.error("Google Auth Session Error:", response.error);
      Alert.alert("Erreur Google", response.error?.message || "La connexion Google a échoué.");
    }
  }, [response]);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth currentUser:", currentUser?.uid);
      setUser(currentUser);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser?.uid) {
        registerForPushNotificationsAsync(currentUser.uid);
        const userRef = doc(db, "user", currentUser.uid);
        unsubscribeSnapshot = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setDbUser(docSnap.data());
              console.log("DB USER updated:", docSnap.data());
            } else {
              setDbUser(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error("Firestore user snapshot error:", err);
            setDbUser(null);
            setLoading(false);
          }
        );
      } else {
        setDbUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const createUser = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signOutUser = () => {
    return signOut(auth);
  };

  const signInUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    try {
      if (Platform.OS === "web") {
        return await signInWithPopup(auth, provider);
      }
      if (!request) {
        Alert.alert(
          "Initialisation",
          "Le service d'authentification Google est en cours d'initialisation. Veuillez patienter une seconde et réessayer."
        );
        return;
      }
      await promptAsync({
        useProxy: true,
        projectNameForProxy: "@chaouki.b/food-delivery-user",
      });
    } catch (err) {
      console.error("signInWithGoogle prompt error:", err);
      Alert.alert("Erreur Google", err.message);
    }
  };

  return (
    <UserContext.Provider
      value={{
        createUser,
        user,
        loading,
        signOutUser,
        signInUser,
        dbUser,
        signInWithGoogle,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(UserContext);
};
