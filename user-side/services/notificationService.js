import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Linking } from "react-native";
import { db } from "../firebase";

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

// Configuration du gestionnaire de notifications pour afficher les alertes même quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const EAS_PROJECT_ID = "03c9b1d4-5f83-4aef-9482-472824b75684";

/**
 * Enregistre l'appareil pour les notifications push et sauvegarde le token dans Firestore
 */
export const registerForPushNotificationsAsync = async (userId) => {
  let token = null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Commandes & Livraisons",
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
      console.log("Note: Expo Push Token nécessite un build EAS / appareil réel:", tokenErr?.message);
    }

    if (userId && token) {
      const userRef = doc(db, "user", userId);
      await updateDoc(userRef, {
        pushToken: token,
        pushTokenUpdatedAt: serverTimestamp(),
      });
      console.log("Token push enregistré pour l'utilisateur:", userId);
    }
  } catch (error) {
    console.warn("Erreur enregistrement notifications push:", error);
  }

  return token;
};

/**
 * Envoie une ou plusieurs notifications via l'API officielle Expo Push Service
 */
export const sendPushNotification = async (tokens, title, body, data = {}) => {
  if (!tokens) return;

  const tokenList = Array.isArray(tokens) ? tokens : [tokens];
  const validTokens = tokenList.filter(
    (t) => typeof t === "string" && (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );

  if (validTokens.length === 0) {
    console.log("Aucun token push Expo valide à notifier");
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
        { orderId, type: "ORDER_READY_FOR_PICKUP" }
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

