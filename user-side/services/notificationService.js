import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking } from "react-native";
import { db, auth } from "../firebase";

export const openAppSettings = () => {
  Linking.openSettings();
};
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

export const ORDER_NOTIFICATION_CHANNEL_ID = "orders_alerts_loud_v1";
export const COURIER_NOTIFICATION_CHANNEL_ID = "courier_alerts_loud_v1";

// Configuration du gestionnaire de notifications pour afficher les alertes avec son et badge
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
export const configureNotificationChannelAsync = async () => {
  if (Platform.OS === "android") {
    try {
      // 1. Canal dédié aux commandes clients & alertes cuisinier
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

      // 2. Canal dédié aux livreurs
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

      console.log("Canaux de notification sonores MAX configurés (user-side)");
    } catch (err) {
      console.warn("Erreur configuration canaux sonores :", err);
    }
  }
};

/**
 * Déclenche une notification système locale immédiate (avec son et vibration)
 * Fonctionne à 100% sur mobile Android/iOS sans aucune dépendance serveur ni clé FCM !
 */
export const triggerLocalNotification = async (title, body, data = {}) => {
  try {
    await configureNotificationChannelAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 250, 500, 250, 500],
        channelId: ORDER_NOTIFICATION_CHANNEL_ID,
        data,
      },
      trigger: null, // Immédiat !
    });
    console.log("Notification locale sonore déclenchée :", title);
  } catch (err) {
    console.warn("Erreur déclenchement notification locale :", err);
  }
};

const EAS_PROJECT_ID = "03c9b1d4-5f83-4aef-9482-472824b75684";

/**
 * Enregistre l'appareil pour les notifications push et sauvegarde le token dans Firestore
 */
export const registerForPushNotificationsAsync = async (userId) => {
  let token = null;

  try {
    await configureNotificationChannelAsync();

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
      console.log("Permission de notification push non accordée (status:", finalStatus, ")");
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EAS_PROJECT_ID,
      });
      token = tokenData?.data;
      console.log("Expo Push Token obtenu (User Side):", token);
    } catch (tokenErr) {
      console.log("Note Expo Push Token:", tokenErr?.message);
    }

    let devicePushToken = null;
    try {
      const devData = await Notifications.getDevicePushTokenAsync();
      devicePushToken = devData?.data;
      console.log("FCM Device Push Token obtenu:", devicePushToken);
    } catch (devErr) {
      console.log("Note Device Push Token:", devErr?.message);
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
      console.log("Token push enregistré pour l'utilisateur:", currentUid, finalPushToken);

      // Si l'utilisateur est un cuisinier propriétaire de restaurant, répliquer sur le restaurant
      try {
        const uDoc = await getDoc(userRef);
        if (uDoc.exists()) {
          const uData = uDoc.data();
          if (uData.kitchenId) {
            await updateDoc(doc(db, "restaurants", uData.kitchenId), {
              pushToken: finalPushToken,
            });
            console.log("Token push répliqué sur le restaurant du cuisinier:", uData.kitchenId);
          }
        }
      } catch (kErr) {
        console.warn("Notice replication token restaurant:", kErr?.message);
      }
    }
  } catch (error) {
    console.warn("Erreur enregistrement notifications push:", error);
  }

  return token;
};

/**
 * Déclenche manuellement la demande native de permission (débloque ColorOS sur clic utilisateur)
 */
export const requestNotificationPermissionDirectly = async () => {
  try {
    await configureNotificationChannelAsync();
    const { status } = await Notifications.requestPermissionsAsync();
    console.log("Demande directe permission notifications, statut obtenu :", status);
    return status === "granted";
  } catch (err) {
    console.warn("Erreur requestNotificationPermissionDirectly:", err);
    return false;
  }
};

/**
 * Envoie une ou plusieurs notifications via l'API officielle Expo Push Service
 */
export const sendPushNotification = async (tokens, title, body, data = {}, customChannelId = null) => {
  if (!tokens) return;

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const validTokens = tokenList.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    console.log("Aucun token push Expo valide à notifier");
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
    console.log("Résultat envoi notification Expo:", resJson);
    return resJson;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification push:", error);
  }
};

/**
 * 1. Notifier le cuisinier d'une nouvelle commande passée par un client
 */
export const notifyCookForNewOrder = async (restaurantId, orderId) => {
  try {
    if (!restaurantId) return;

    // Récupérer le cuisinier propriétaire du restaurant
    const restDoc = await getDoc(doc(db, "restaurants", restaurantId));
    let cookToken = null;

    if (restDoc.exists()) {
      const restData = restDoc.data();
      cookToken = restData.pushToken;

      if (!cookToken && restData.ownerId) {
        const ownerDoc = await getDoc(doc(db, "user", restData.ownerId));
        if (ownerDoc.exists()) {
          cookToken = ownerDoc.data().pushToken;
        }
      }
    }

    if (cookToken) {
      await sendPushNotification(
        cookToken,
        "Nouvelle commande reçue ! 🍳",
        "Un client a commandé chez vous. Saisissez votre délai de préparation pour accepter.",
        { orderId, type: "NEW_ORDER" }
      );
    }
  } catch (e) {
    console.warn("Erreur notification cuisinier (nouvelle commande):", e);
  }
};

/**
 * 2. Notifier le client de l'estimation de temps faite par le cuisinier
 */
export const notifyClientForCookEstimate = async (userId, minutes, readyTimeStr, orderId) => {
  try {
    if (!userId) return;
    const userDoc = await getDoc(doc(db, "user", userId));
    if (userDoc.exists()) {
      const token = userDoc.data()?.pushToken;
      if (token) {
        await sendPushNotification(
          token,
          "Temps estimé par le cuisinier ⏱️",
          `Prêt vers ${readyTimeStr || "bientôt"} (délai : ${minutes} min). Veuillez confirmer votre accord !`,
          { orderId, type: "COOK_ESTIMATE" }
        );
      }
    }
  } catch (e) {
    console.warn("Erreur notification client (estimation cuisinier):", e);
  }
};

/**
 * 3. Notifier le cuisinier que le client a confirmé son accord
 */
export const notifyCookClientConfirmed = async (restaurantId, orderId) => {
  try {
    if (!restaurantId) return;
    const restDoc = await getDoc(doc(db, "restaurants", restaurantId));
    let cookToken = null;

    if (restDoc.exists()) {
      const restData = restDoc.data();
      cookToken = restData.pushToken;

      if (!cookToken && restData.ownerId) {
        const ownerDoc = await getDoc(doc(db, "user", restData.ownerId));
        if (ownerDoc.exists()) {
          cookToken = ownerDoc.data().pushToken;
        }
      }
    }

    if (cookToken) {
      await sendPushNotification(
        cookToken,
        "Accord client confirmé ! 👨‍🍳🔥",
        "Le client a validé votre délai. Vous pouvez lancer la cuisson du repas !",
        { orderId, type: "CLIENT_CONFIRMED" }
      );
    }
  } catch (e) {
    console.warn("Erreur notification cuisinier (accord client):", e);
  }
};

/**
 * 4. Broadcast aux livreurs : le plat est prêt, attribution au 1er arrivé, 1er servi !
 */
export const broadcastOrderReadyToDrivers = async (orderId, restaurantName, restaurantAddress) => {
  try {
    // Récupérer tous les livreurs enregistrés avec un pushToken
    const usersRef = collection(db, "user");
    const q = query(usersRef, where("role", "==", "courier"));
    const snap = await getDocs(q);

    const tokens = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.pushToken) {
        tokens.push(data.pushToken);
      }
    });

    if (tokens.length > 0) {
      console.log(`Diffusion de la course prête à ${tokens.length} livreur(s)...`);
      await sendPushNotification(
        tokens,
        "Nouvelle course disponible ! 🛵⚡",
        `Plat prêt chez "${restaurantName || "Cuisine"}". 1er arrivé, 1er servi !`,
        { orderId, type: "ORDER_READY_FOR_PICKUP" },
        COURIER_NOTIFICATION_CHANNEL_ID
      );
    } else {
      console.log("Aucun livreur avec token push trouvé pour le broadcast.");
    }
  } catch (e) {
    console.warn("Erreur broadcast livreurs (plat prêt):", e);
  }
};

/**
 * 5. Notifier le client que son plat est prêt
 */
export const notifyClientOrderReady = async (userId, restaurantName) => {
  try {
    if (!userId) return;
    const userDoc = await getDoc(doc(db, "user", userId));
    if (userDoc.exists()) {
      const token = userDoc.data()?.pushToken;
      if (token) {
        await sendPushNotification(
          token,
          "Votre plat est prêt ! 🍽️",
          `Votre repas chez "${restaurantName || "le restaurant"}" est prêt. Un livreur va le prendre en charge.`,
          { type: "ORDER_READY" }
        );
      }
    }
  } catch (e) {
    console.warn("Erreur notification client (plat prêt):", e);
  }
};

