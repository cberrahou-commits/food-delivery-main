import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking } from "react-native";
import { db } from "../../firebase/firebase";

export const openAppSettings = () => {
  Linking.openSettings();
};
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Déclenche une notification système locale immédiate (avec son et vibration)
 * Fonctionne à 100% sur mobile Android/iOS sans aucune dépendance serveur ni clé FCM !
 */
export const triggerLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 250, 250, 250],
        channelId: "default",
        data,
      },
      trigger: null,
    });
    console.log("Notification locale coursier déclenchée :", title);
  } catch (err) {
    console.warn("Erreur déclenchement notification locale coursier :", err);
  }
};

const EAS_PROJECT_ID = "6289e5fd-cb5b-409e-843d-072b21e4a9e1";

/**
 * Enregistre le livreur pour les notifications push et sauvegarde son pushToken
 */
export const registerForPushNotificationsAsync = async (userId) => {
  let token = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Courses & Livraisons",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#3FC060",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    // Demande de permission native directe (affiche le prompt système)
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Permission de notification push refusée pour le livreur (status:", finalStatus, ")");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });
      token = tokenData?.data;
      console.log("Expo Push Token obtenu (Livreur):", token);
    } catch (tokenErr) {
      console.log("Note: Expo Push Token nécessite un build EAS / appareil réel:", tokenErr?.message);
    }

    if (userId && token) {
      const userRef = doc(db, "user", userId);
      await updateDoc(userRef, {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
      });
      console.log("Token push du coursier enregistré dans Firestore");
    }
  } catch (error) {
    console.warn("Erreur enregistrement token push livreur:", error);
  }

  return token;
};

/**
 * Envoie une notification via l'API officielle Expo Push Service
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens) return;

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const validTokens = tokenList.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    console.log("Aucun token push valide trouvé pour notifier le client");
    return;
  }

  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
    channelId: "default",
  }));

  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const resJson = await response.json();
    console.log("Résultat envoi notification Expo au client:", resJson);
    return resJson;
  } catch (error) {
    console.error("Erreur envoi notification client:", error);
  }
};

/**
 * Notifier le client qu'un livreur a accepté sa course
 */
export const notifyClientDriverAssigned = async (userId, driverName, orderId) => {
  try {
    if (!userId) return;
    const userDoc = await getDoc(doc(db, "user", userId));
    if (userDoc.exists()) {
      const token = userDoc.data()?.pushToken;
      if (token) {
        await sendPushNotification(
          token,
          "Livreur en route ! 🛵",
          `${driverName || "Un livreur"} a accepté votre commande et se rend au restaurant.`,
          { orderId, type: "DRIVER_ASSIGNED" }
        );
      }
    }
  } catch (e) {
    console.warn("Erreur notification client (livreur assigné):", e);
  }
};

/**
 * Notifier le client que sa commande a été livrée
 */
export const notifyClientOrderDelivered = async (userId, orderId) => {
  try {
    if (!userId) return;
    const userDoc = await getDoc(doc(db, "user", userId));
    if (userDoc.exists()) {
      const token = userDoc.data()?.pushToken;
      if (token) {
        await sendPushNotification(
          token,
          "Commande livrée ! 🎉",
          "Votre repas vous a été remis en mains propres. Bon appétit !",
          { orderId, type: "ORDER_DELIVERED" }
        );
      }
    }
  } catch (e) {
    console.warn("Erreur notification client (commande livrée):", e);
  }
};

