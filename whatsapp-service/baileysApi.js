const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const path = require("path");
const fs = require("fs");
const { formatPhoneNumber } = require("./utils");

let sock = null;
let isConnected = false;
let qrGenerated = false;

const AUTH_FOLDER = path.join(__dirname, "auth_baileys");

/**
 * Initialise la connexion WhatsApp Web via QR code (Baileys)
 */
async function initBaileys() {
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // On gère nous-mêmes l'affichage propre
    auth: state,
    browser: ["Food Delivery Algérie", "Chrome", "1.0.0"],
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrGenerated = true;
      console.log("\n========================================================");
      console.log("📱 SCANNEZ CE QR CODE AVEC VOTRE TÉLÉPHONE WHATSAPP :");
      console.log("========================================================");
      console.log("1. Ouvrez WhatsApp sur votre téléphone");
      console.log("2. Menu ⋮ (ou Réglages sur iPhone) > 'Appareils connectés'");
      console.log("3. Touchez 'Connecter un appareil'");
      console.log("4. Visez l'écran avec votre appareil photo pour scanner :");
      console.log("--------------------------------------------------------\n");

      qrcode.generate(qr, { small: true });

      console.log("\n--------------------------------------------------------");
      console.log("En attente de connexion...");
      console.log("========================================================\n");
    }

    if (connection === "close") {
      isConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      console.log(`⚠️ Connexion WhatsApp fermée. Raison: ${statusCode || "inconnue"}`);

      if (shouldReconnect) {
        console.log("🔄 Reconnexion automatique à WhatsApp en cours...");
        setTimeout(() => {
          initBaileys();
        }, 3000);
      } else {
        console.log("❌ Déconnecté de WhatsApp. Suppression de la session expirée...");
        try {
          fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        } catch (e) {}
        console.log("Veuillez relancer le service pour rescanner un nouveau QR code.");
      }
    } else if (connection === "open") {
      isConnected = true;
      const userPhone = sock.user?.id ? sock.user.id.split(":")[0] : "Connecté";
      console.log("\n========================================================");
      console.log("🎉 WHATSAPP CONNECTÉ AVEC SUCCÈS !");
      console.log(`📱 Numéro expéditeur : +${userPhone}`);
      console.log("🚀 Envoi direct activé vers TOUS les numéros d'Algérie !");
      console.log("========================================================\n");
    }
  });

  return sock;
}

/**
 * Envoie un message texte libre à n'importe quel numéro via la session connectée
 */
async function sendBaileysWhatsAppMessage({ phone, messageText }) {
  if (!sock || !isConnected) {
    throw new Error(
      "WhatsApp Web n'est pas encore connecté. Veuillez scanner le QR code affiché dans la console."
    );
  }

  const cleanPhone = formatPhoneNumber(phone, false);
  if (!cleanPhone) {
    throw new Error(`Numéro de téléphone invalide : ${phone}`);
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  try {
    const sentMsg = await sock.sendMessage(jid, { text: messageText });
    return {
      success: true,
      provider: "web_qr",
      messageId: sentMsg?.key?.id,
      recipient: cleanPhone,
    };
  } catch (error) {
    console.error(`❌ Erreur envoi message WhatsApp Web à ${cleanPhone}:`, error.message);
    throw error;
  }
}

function isBaileysReady() {
  return isConnected;
}

module.exports = {
  initBaileys,
  sendBaileysWhatsAppMessage,
  isBaileysReady,
};

