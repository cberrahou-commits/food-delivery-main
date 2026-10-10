require("dotenv").config();
const { sendMetaWhatsAppMessage } = require("./metaApi");
const { sendTwilioWhatsAppMessage } = require("./twilioApi");
const { formatPhoneNumber } = require("./utils");

async function runTest() {
  const targetPhone = process.argv[2];

  console.log("========================================================");
  console.log("🚀 TEST D'ENVOI WHATSAPP - FOOD DELIVERY ALGÉRIE");
  console.log("========================================================");

  if (!targetPhone) {
    console.error("❌ Erreur : Veuillez spécifier un numéro de téléphone cible.");
    console.log("\nUsage :");
    console.log("  node test-whatsapp.js 0555123456");
    console.log("  node test-whatsapp.js +213661234567\n");
    process.exit(1);
  }

  const provider = (process.env.WHATSAPP_PROVIDER || "meta").toLowerCase();
  console.log(`Fournisseur sélectionné : [${provider.toUpperCase()}]`);
  console.log(`Numéro brut : ${targetPhone}`);
  console.log(`Numéro formaté : ${formatPhoneNumber(targetPhone, true)}`);
  console.log("--------------------------------------------------------");

  const testMessage = `🍔 *Food Delivery Algérie*\n\nCeci est un message de test automatique de votre système de livraison !\n\nNuméro de commande : #TEST-${Date.now().toString().slice(-4)}\nStatut : ✅ Système WhatsApp Opérationnel !`;

  try {
    let result;
    if (provider === "twilio") {
      console.log("📡 Envoi via Twilio WhatsApp API...");
      result = await sendTwilioWhatsAppMessage({
        phone: targetPhone,
        messageText: testMessage,
      });
    } else {
      console.log("📡 Envoi via Meta Cloud API (WhatsApp Business)...");
      // Si un template est configuré (ex: hello_world de Meta)
      const templateName = process.env.META_TEMPLATE_NAME || null;
      if (templateName) {
        console.log(`Utilisation du template : "${templateName}"`);
      }
      result = await sendMetaWhatsAppMessage({
        phone: targetPhone,
        messageText: testMessage,
        templateName: templateName,
      });
    }

    console.log("\n🎉 SUCCÈS ! Message WhatsApp envoyé avec succès !");
    console.log("Détails de la réponse :", result);
  } catch (err) {
    console.error("\n❌ ÉCHEC DE L'ENVOI :", err.message);
    console.log("\n💡 Conseils de dépannage :");
    if (provider === "meta") {
      console.log("1. Vérifiez que votre META_ACCESS_TOKEN est valide sur https://developers.facebook.com");
      console.log("2. Vérifiez que votre numéro destinataire est bien ajouté dans la liste 'To' des numéros de test.");
      console.log("3. Si vous utilisez un template Meta ('hello_world'), la langue par défaut est généralement 'en_US'.");
    } else {
      console.log("1. Vérifiez que votre téléphone a bien rejoint la Sandbox Twilio en envoyant 'join <mot-cle>' au +1 415 523 8886.");
      console.log("2. Vérifiez vos identifiants TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN.");
    }
  }
}

runTest();

