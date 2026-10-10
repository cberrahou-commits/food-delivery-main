import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking } from "react-native";
import { db, auth } from "../../firebase/firebase";

export const openAppSettings = () => {
  Linking.openSettings();
};
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export const COURIER_NOTIFICATION_CHANNEL_ID = "courier_alerts_loud_v1";
export const ORDER_NOTIFICATION_CHANNEL_ID = "orders_alerts_loud_v1";

// Configuration du gestionnaire de notifications pour forcer l'affichage avec sonnerie et badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Configure les canaux Android en priorité MAX avec sonnerie et vibration forcées
 */
export const configureNotificationChannelsAsync = async () => {
  if (Platform.OS === "android") {
    try {
      // 1. Canal dédié aux courses et livraisons (Livreur)
      await Notifications.setNotificationChannelAsync(COURIER_NOTIFICATION_CHANNEL_ID, {
        name: "Alertes Courses & Livraisons (Sonnerie & Vibreur)",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: "#3FC060",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });

      // 2. Canal de compatibilité alertes commandes
      await Notifications.setNotificationChannelAsync(ORDER_NOTIFICATION_CHANNEL_ID, {
        name: "Alertes Commandes (Sonnerie & Vibreur)",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500, 250, 500],
        lightColor: "#3FC060",
        sound: "default",
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        audioAttributes: {
          usage: Notifications.AndroidAudioUsage.NOTIFICATION_RINGTONE,
          contentType: Notifications.AndroidAudioContentType.SONIFICATION,
        },
      });

      console.log("Canaux de notification sonores MAX configurés (driver-app)");
    } catch (err) {
      console.warn("Erreur configuration canaux sonores driver :", err);
    }
  }
};

/**
 * Déclenche une notification système locale immédiate (avec sonnerie et vibration)
 * Fonctionne à 100% sur mobile Android/iOS sans aucune dépendance serveur ni clé FCM !
 */
export const triggerLocalNotification = async (title, body, data = {}) => {
  try {
    await configureNotificationChannelsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 250, 500, 250, 500],
        channelId: COURIER_NOTIFICATION_CHANNEL_ID,
        data,
      },
      trigger: null,
    });
    console.log("Notification locale coursier sonore déclenchée :", title);
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
    await configureNotificationChannelsAsync();

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
      console.log("Note Expo Push Token (Livreur):", tokenErr?.message);
    }

    let devicePushToken = null;
    try {
      const devData = await Notifications.getDevicePushTokenAsync();
      devicePushToken = devData?.data;
      console.log("FCM Device Push Token obtenu (Livreur):", devicePushToken);
    } catch (devErr) {
      console.log("Note Device Push Token (Livreur):", devErr?.message);
    }

    const currentUid = userId || auth?.currentUser?.uid;
    const finalPushToken = token || devicePushToken;

    if (currentUid && finalPushToken) {
      const userRef = doc(db, "user", currentUid);
      await updateDoc(userRef, {
        pushToken: finalPushToken,
        fcmToken: devicePushToken || null,
        pushTokenUpdatedAt: serverTimestamp(),
      });
      console.log("Token push du coursier enregistré dans Firestore pour:", currentUid, finalPushToken);
    }
  } catch (error) {
    console.warn("Erreur enregistrement token push livreur:", error);
  }

  return token;
};

/**
 * Déclenche manuellement la demande native de permission (débloque ColorOS sur clic livreur)
 */
export const requestNotificationPermissionDirectly = async () => {
  try {
    await configureNotificationChannelsAsync();
    const { status } = await Notifications.requestPermissionsAsync();
    console.log("Demande directe permission notifications livreur, statut :", status);
    return status === "granted";
  } catch (err) {
    console.warn("Erreur requestNotificationPermissionDirectly livreur:", err);
    return false;
  }
};

/**
 * Envoie une notification via l'API officielle Expo Push Service
 */
export const sendPushNotification = async (tokens, title, body, data = {}, customChannelId = null) => {
  if (!tokens) return;

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const validTokens = tokenList.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    console.log("Aucun token push valide trouvé pour notifier le client");
    return;
  }

  const channelId = customChannelId || ORDER_NOTIFICATION_CHANNEL_ID;

  const messages = validTokens.map((to) => ({
    to,
    sound: "default",
    title,
    body,
    data,
    priority: "high",
    channelId,
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
          { orderId, type: "DRIVER_ASSIGNED" },
          ORDER_NOTIFICATION_CHANNEL_ID
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
          { orderId, type: "ORDER_DELIVERED" },
          ORDER_NOTIFICATION_CHANNEL_ID
        );
      }
    }
  } catch (e) {
    console.warn("Erreur notification client (commande livrée):", e);
  }
};
