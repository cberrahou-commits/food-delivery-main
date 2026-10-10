require("dotenv").config();
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
} = require("firebase/firestore");
const { sendMetaWhatsAppMessage } = require("./metaApi");
const { sendTwilioWhatsAppMessage } = require("./twilioApi");

// 1. Initialisation Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCHWynUsudT89nbd4XaRTHsajjlxL-WmNs",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "food-delivery-prod-b474f.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "food-delivery-prod-b474f",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "food-delivery-prod-b474f.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "804475459341",
  appId: process.env.FIREBASE_APP_ID || "1:804475459341:web:d2ea31b0fc216e5428a2a8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Cache mémoire des statuts notifiés pour éviter tout doublon
const notifiedStatusCache = new Map();

// Heure de démarrage du service (pour ne pas notifier les vieilles commandes de l'historique)
const serviceStartTime = Date.now();

console.log("========================================================");
console.log("🚀 SERVICE DE NOTIFICATIONS WHATSAPP FIRESTORE DÉMARRÉ");
console.log("========================================================");
console.log(`Projet Firebase : ${firebaseConfig.projectId}`);
console.log(`Fournisseur WhatsApp : ${(process.env.WHATSAPP_PROVIDER || "meta").toUpperCase()}`);
console.log("Écoute en temps réel des commandes dans 'orders'...");
console.log("--------------------------------------------------------");

/**
 * Envoie une notification WhatsApp en fonction du fournisseur configuré
 */
async function dispatchWhatsApp({ phone, messageText, templateName, templateParams }) {
  if (!phone) {
    console.log("⚠️ Aucun numéro de téléphone disponible pour cette notification.");
    return;
  }

  const provider = (process.env.WHATSAPP_PROVIDER || "meta").toLowerCase();

  if (provider === "twilio") {
    return await sendTwilioWhatsAppMessage({ phone, messageText });
  } else {
    return await sendMetaWhatsAppMessage({
      phone,
      messageText,
      templateName,
      templateParams,
    });
  }
}

/**
 * Traite le changement de statut d'une commande
 */
async function handleOrderStatusChange(orderId, orderData) {
  const status = orderData.status;
  const lastStatus = notifiedStatusCache.get(orderId);

  // Si le statut n'a pas changé ou a déjà été notifié pour cette commande
  if (lastStatus === status) {
    return;
  }

  // Vérifier la date de création : si la commande date de plus de 30 minutes avant le démarrage
  const createdAtMs = orderData.createdAt?.toMillis
    ? orderData.createdAt.toMillis()
    : orderData.createdAt?.seconds
    ? orderData.createdAt.seconds * 1000
    : Date.now();

  if (createdAtMs < serviceStartTime - 30 * 60 * 1000 && !lastStatus) {
    // Ancienne commande historique au premier démarrage, on mémorise son statut sans spammer
    notifiedStatusCache.set(orderId, status);
    return;
  }

  console.log(`\n🔔 Changement détecté : Commande #${orderId.slice(0, 6)} -> [${status}]`);
  notifiedStatusCache.set(orderId, status);

  const clientPhone = orderData.userPhoneNumber;
  const cookPhone = orderData.restaurantPhone;
  const restaurantName = orderData.restaurantName || "Cuisine Partenaire";
  const shortId = orderId.slice(0, 6);

  try {
    switch (status) {
      // 1. Cuisinier a estimé le temps -> Client doit confirmer
      case "WAITING_CLIENT_CONFIRMATION": {
        const timeStr = orderData.estimatedReadyTimeStr || "bientôt";
        const mins = orderData.prepTimeMinutes || 25;
        const msg =
          `👨‍🍳 *Mise à jour Commande #${shortId}*\n\n` +
          `Le chef cuisinier de *${restaurantName}* a estimé la fin de préparation pour *${timeStr}* (~${mins} min).\n\n` +
          `👉 Merci d'ouvrir l'application pour accepter ou refuser cette heure de fin de cuisson.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
          templateName: process.env.META_TEMPLATE_ORDER_UPDATE || null,
          templateParams: [shortId, `Fin prévue à ${timeStr}`],
        });
        console.log(`✅ Client notifié sur WhatsApp pour confirmation de l'heure (#${shortId})`);
        break;
      }

      // 2. Client a accepté l'heure -> Cuisson démarre
      case "IN_PREPARATION": {
        if (cookPhone) {
          const msg =
            `🍳 *Commande #${shortId} Confirmée !*\n\n` +
            `Le client a validé votre estimation. Vous pouvez commencer la préparation en cuisine !`;

          await dispatchWhatsApp({
            phone: cookPhone,
            messageText: msg,
            templateName: process.env.META_TEMPLATE_COOK_START || null,
            templateParams: [shortId, "Préparation lancée"],
          });
          console.log(`✅ Cuisinier notifié sur WhatsApp du début de cuisson (#${shortId})`);
        }
        break;
      }

      // 3. Plats prêts & emballés -> Attente livreur
      case "READY_FOR_PICKUP":
      case "READY": {
        const msg =
          `🥡 *Commande #${shortId} Prête et Emballée !*\n\n` +
          `Vos plats chez *${restaurantName}* sont prêts. Un livreur partenaire disponible dans votre Wilaya va être assigné à votre livraison.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
          templateName: process.env.META_TEMPLATE_ORDER_READY || null,
          templateParams: [shortId, "Plats prêts pour le livreur"],
        });
        console.log(`✅ Client notifié sur WhatsApp : repas prêt (#${shortId})`);
        break;
      }

      // 4. Livreur assigné et en route
      case "ASSIGNED_TO_DELIVERY": {
        const driverName = orderData.driverName || "Votre livreur";
        const msg =
          `🛵 *Livreur en route ! (Commande #${shortId})*\n\n` +
          `*${driverName}* a pris en charge votre commande et se dirige vers votre adresse :\n📍 ${orderData.userAddress || "Votre domicile"}`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
          templateName: process.env.META_TEMPLATE_DRIVER_ASSIGNED || null,
          templateParams: [shortId, `Livreur ${driverName} en route`],
        });
        console.log(`✅ Client notifié sur WhatsApp : coursier en route (#${shortId})`);
        break;
      }

      // 5. Commande livrée avec succès
      case "DELIVERED": {
        const msg =
          `✅ *Commande #${shortId} Livrée avec Succès !*\n\n` +
          `Nous espérons que vous allez vous régaler ! Bon appétit ! 🍽️\n\n` +
          `⭐ Vous pouvez dès maintenant noter le chef et le livreur dans l'application.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
          templateName: process.env.META_TEMPLATE_DELIVERED || null,
          templateParams: [shortId, "Livraison terminée"],
        });
        console.log(`✅ Client notifié sur WhatsApp : commande livrée (#${shortId})`);
        break;
      }

      default:
        // Autres statuts (PENDING, DECLINED, etc.)
        break;
    }
  } catch (err) {
    console.error(`❌ Erreur lors de l'envoi de notification pour #${shortId}:`, err.message);
  }
}

// 2. Écouteur Firestore en temps réel
const ordersCol = collection(db, "orders");

const unsubscribe = onSnapshot(
  ordersCol,
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const orderData = change.doc.data();
      const orderId = change.doc.id;

      if (change.type === "added" || change.type === "modified") {
        handleOrderStatusChange(orderId, orderData);
      }
    });
  },
  (error) => {
    console.error("❌ Erreur écouteur Firestore:", error);
  }
);

// Arrêt propre
process.on("SIGINT", () => {
  console.log("\nArrêt du service WhatsApp...");
  unsubscribe();
  process.exit(0);
});

