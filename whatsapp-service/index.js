require("dotenv").config();
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
} = require("firebase/firestore");
const { sendMetaWhatsAppMessage } = require("./metaApi");
const { sendTwilioWhatsAppMessage } = require("./twilioApi");
const { initBaileys, sendBaileysWhatsAppMessage, isBaileysReady } = require("./baileysApi");

// Fournisseur actif
const activeProvider = (process.env.WHATSAPP_PROVIDER || "web").toLowerCase();

// Si le fournisseur est WhatsApp Web QR Code, on initialise la session
if (activeProvider === "web" || activeProvider === "baileys" || activeProvider === "qr") {
  console.log("🔄 Initialisation de la passerelle WhatsApp Web (Scan QR Code)...");
  initBaileys().catch((err) => {
    console.error("❌ Erreur initialisation Baileys:", err);
  });
}

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
console.log(`Fournisseur WhatsApp : ${activeProvider.toUpperCase()}`);
console.log("Écoute en temps réel des commandes dans 'orders'...");
console.log("Écoute des demandes OTP dans 'phoneVerifications'...");
console.log("--------------------------------------------------------");

/**
 * Envoie une notification WhatsApp en fonction du fournisseur configuré
 */
async function dispatchWhatsApp({ phone, messageText, templateName, templateParams }) {
  if (!phone) {
    console.log("⚠️ Aucun numéro de téléphone disponible pour cette notification.");
    return;
  }

  const provider = (process.env.WHATSAPP_PROVIDER || "web").toLowerCase();

  if (provider === "web" || provider === "baileys" || provider === "qr") {
    return await sendBaileysWhatsAppMessage({ phone, messageText });
  } else if (provider === "twilio") {
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

  console.log(`\n🔔 Changement détecté : Commande #${orderId.slice(0, 6)} -> [${status}] (Précédent: ${lastStatus || "Nouveau"})`);
  notifiedStatusCache.set(orderId, status);

  let clientPhone =
    orderData.userPhoneNumber ||
    orderData.phoneNumber ||
    orderData.userPhone ||
    orderData.phone;
  let cookPhone =
    orderData.restaurantPhone ||
    orderData.cookPhone;

  // Si le numéro du client n'est pas direct sur la commande, chercher dans son profil utilisateur
  if (!clientPhone && orderData.userId) {
    try {
      const userSnap = await getDoc(doc(db, "user", orderData.userId));
      if (userSnap.exists()) {
        const u = userSnap.data();
        clientPhone = u.phoneNumber || u.phone;
      }
    } catch (e) {}
  }

  // Si le numéro du cuisinier n'est pas direct sur la commande, chercher dans la fiche du restaurant
  if (!cookPhone && orderData.restaurantId) {
    try {
      const restSnap = await getDoc(doc(db, "restaurants", orderData.restaurantId));
      if (restSnap.exists()) {
        const r = restSnap.data();
        cookPhone = r.phone || r.phoneNumber;
      }
    } catch (e) {}
  }

  const restaurantName = orderData.restaurantName || "Cuisine Partenaire";
  const shortId = orderId.slice(0, 6);
  const total = orderData.total || 0;

  try {
    switch (status) {
      // 0. NOUVELLE COMMANDE PASSÉE PAR LE CLIENT
      case "PENDING_COOK_APPROVAL":
      case "PENDING":
      case "NEW": {
        const msgClient =
          `🍔 *Food Delivery Algérie*\n\n` +
          `✅ *Votre commande #${shortId} a été enregistrée !*\n` +
          `Restaurant : *${restaurantName}*\n` +
          `💰 Montant total : *${total} DA*\n\n` +
          `👨‍🍳 Votre commande a été transmise au chef cuisinier. Vous recevrez un message dès que le chef aura validé l'heure de préparation.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msgClient,
        });
        console.log(`✅ Client notifié sur WhatsApp pour création de commande (#${shortId})`);

        if (cookPhone) {
          const msgCook =
            `🔔 *Nouvelle Commande Reçue ! (#${shortId})*\n\n` +
            `Un client vient de commander chez *${restaurantName}* !\n` +
            `💰 Montant : *${total} DA*\n\n` +
            `👉 Veuillez ouvrir votre tableau de bord restaurant pour indiquer l'heure de fin de cuisson.`;

          await dispatchWhatsApp({
            phone: cookPhone,
            messageText: msgCook,
          });
          console.log(`✅ Cuisinier notifié sur WhatsApp pour nouvelle commande (#${shortId})`);
        }
        break;
      }

      // 1. Cuisinier a estimé le temps -> Client doit confirmer
      case "WAITING_CLIENT_CONFIRMATION": {
        const timeStr = orderData.estimatedReadyTimeStr || "bientôt";
        const mins = orderData.prepTimeMinutes || 25;
        const msg =
          `👨‍🍳 *Mise à jour Commande #${shortId}*\n\n` +
          `Le chef de *${restaurantName}* a estimé la fin de préparation pour *${timeStr}* (~${mins} min).\n\n` +
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
      case "IN_PREPARATION":
      case "PREPARING": {
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

        const msgClient =
          `🍳 *Préparation en cours ! (Commande #${shortId})*\n\n` +
          `Le chef cuisinier prépare actuellement vos plats avec soin chez *${restaurantName}*.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msgClient,
        });
        console.log(`✅ Client notifié sur WhatsApp du début de cuisson (#${shortId})`);
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

      // 4. Livreur assigné et en route vers le restaurant
      case "ASSIGNED_TO_DELIVERY":
      case "DRIVERACCEPTED": {
        const driverName = orderData.driverName || "Votre livreur";
        const msg =
          `🛵 *Livreur assigné ! (Commande #${shortId})*\n\n` +
          `*${driverName}* a pris en charge votre commande et se dirige vers *${restaurantName}* pour récupérer vos plats.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
          templateName: process.env.META_TEMPLATE_DRIVER_ASSIGNED || null,
          templateParams: [shortId, `Livreur ${driverName} en route`],
        });
        console.log(`✅ Client notifié sur WhatsApp : coursier assigné (#${shortId})`);
        break;
      }

      // 5. Livreur a récupéré les plats chez le chef et roule vers le client
      case "DRIVERPICKEDUP":
      case "ON_THE_WAY": {
        const driverName = orderData.driverName || "Votre livreur";
        const address = orderData.userAddress || "Votre domicile";
        const msg =
          `🛵 *Livreur en route vers chez vous ! (Commande #${shortId})*\n\n` +
          `*${driverName}* a récupéré vos plats et se dirige vers votre adresse :\n📍 ${address}`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
        });
        console.log(`✅ Client notifié sur WhatsApp : coursier en route (#${shortId})`);
        break;
      }

      // 6. Commande livrée avec succès
      case "DELIVERED":
      case "COMPLETE": {
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

      // 7. Commande refusée par le cuisinier
      case "DECLINED_BY_COOK":
      case "DECLINED": {
        const msg =
          `❌ *Commande Non Confirmée (#${shortId})*\n\n` +
          `Le chef de *${restaurantName}* ne peut malheureusement pas prendre en charge votre commande actuellement.`;

        await dispatchWhatsApp({
          phone: clientPhone,
          messageText: msg,
        });
        console.log(`✅ Client notifié sur WhatsApp du refus de commande (#${shortId})`);
        break;
      }

      default:
        // Autres statuts
        break;
    }
  } catch (err) {
    console.error(`❌ Erreur lors de l'envoi de notification pour #${shortId}:`, err.message);
  }
}

// 2. Écouteur Firestore en temps réel
const ordersCol = collection(db, "orders");
let isInitialOrdersLoad = true;

const unsubscribe = onSnapshot(
  ordersCol,
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      const orderData = change.doc.data();
      const orderId = change.doc.id;

      if (isInitialOrdersLoad) {
        // Mémoriser l'état initial des commandes existantes pour ne pas envoyer d'anciens spams
        notifiedStatusCache.set(orderId, orderData.status);
        return;
      }

      if (change.type === "added" || change.type === "modified") {
        handleOrderStatusChange(orderId, orderData);
      }
    });

    if (isInitialOrdersLoad) {
      isInitialOrdersLoad = false;
      console.log(`✅ Synchronisation initiale : ${notifiedStatusCache.size} commandes existantes en mémoire.`);
      console.log("👂 Écoute active : Toute nouvelle commande ou changement de statut sera notifié sur WhatsApp !");
      console.log("--------------------------------------------------------");
    }
  },
  (error) => {
    console.error("❌ Erreur écouteur Firestore orders:", error);
  }
);

// 3. Écouteur Firestore pour la vérification OTP de numéro WhatsApp
const verifCol = collection(db, "phoneVerifications");

const unsubscribeVerif = onSnapshot(
  verifCol,
  (snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      const data = change.doc.data();
      const verifId = change.doc.id;

      if (
        (change.type === "added" || change.type === "modified") &&
        data.status === "REQUESTED"
      ) {
        const targetPhone = data.formattedPhone || data.phone || data.phoneNumber;
        const code = data.code;

        console.log(`\n🔐 Demande de vérification WhatsApp reçue pour : ${targetPhone}`);

        if (!targetPhone || !code) {
          console.warn("⚠️ Données incomplètes pour la vérification OTP:", data);
          return;
        }

        const otpMessage =
          `🔐 *Food Delivery Algérie*\n\n` +
          `Votre code de vérification WhatsApp est : *${code}*\n\n` +
          `Entrez ce code dans l'application pour valider votre numéro de téléphone.\n` +
          `⏱️ Ce code expire dans 10 minutes. Ne le partagez avec personne.`;

        try {
          // Marquer en cours pour éviter les envois concurrents
          await updateDoc(doc(db, "phoneVerifications", verifId), {
            status: "PROCESSING",
          });

          await dispatchWhatsApp({
            phone: targetPhone,
            messageText: otpMessage,
            templateName: process.env.META_TEMPLATE_OTP || null,
            templateParams: [code],
          });

          await updateDoc(doc(db, "phoneVerifications", verifId), {
            status: "SENT",
            sentAt: new Date(),
          });

          console.log(`✅ Code OTP WhatsApp [${code}] envoyé avec succès à ${targetPhone}`);
        } catch (err) {
          console.error(`❌ Échec envoi code OTP WhatsApp à ${targetPhone}:`, err.message);
          await updateDoc(doc(db, "phoneVerifications", verifId), {
            status: "FAILED",
            error: err.message,
          }).catch(() => {});
        }
      }
    });
  },
  (error) => {
    console.error("❌ Erreur écouteur phoneVerifications:", error);
  }
);

// Arrêt propre
process.on("SIGINT", () => {
  console.log("\nArrêt du service WhatsApp...");
  unsubscribe();
  unsubscribeVerif();
  process.exit(0);
});

