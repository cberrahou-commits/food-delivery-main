const axios = require("axios");
const { formatPhoneNumber } = require("./utils");

/**
 * Envoie un message WhatsApp via l'API officielle Meta Cloud API (Graph API)
 * https://developers.facebook.com/docs/whatsapp/cloud-api
 */
async function sendMetaWhatsAppMessage({ phone, messageText, templateName, templateParams = [] }) {
  const token = process.env.META_ACCESS_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error(
      "Configuration Meta manquante. Veuillez renseigner META_ACCESS_TOKEN et META_PHONE_NUMBER_ID dans le fichier .env"
    );
  }

  const formattedPhone = formatPhoneNumber(phone, false);
  if (!formattedPhone) {
    throw new Error(`Numéro de téléphone invalide : ${phone}`);
  }

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  let payload;

  // Si un nom de template est spécifié, on utilise le format "template"
  if (templateName) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: templateName === "hello_world" ? "en_US" : (process.env.META_TEMPLATE_LANG || "fr"),
        },
      },
    };

    if (templateParams.length > 0) {
      payload.template.components = [
        {
          type: "body",
          parameters: templateParams.map((param) => ({
            type: "text",
            text: String(param),
          })),
        },
      ];
    }
  } else {
    // Sinon, on envoie un message texte standard
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: messageText,
      },
    };
  }

  try {
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    return {
      success: true,
      provider: "meta",
      messageId: response.data?.messages?.[0]?.id,
      data: response.data,
    };
  } catch (error) {
    const errorDetails = error.response?.data?.error;
    const msg = errorDetails?.message || error.message;
    const code = errorDetails?.code;
    console.error("❌ Erreur Meta WhatsApp Cloud API:", {
      status: error.response?.status,
      message: msg,
      code: code,
      error_data: errorDetails?.error_data,
    });

    if (code === 131030) {
      console.log("\n💡 [Action requise sur Meta] :");
      console.log("   Votre application Meta est en mode Développeur / Test.");
      console.log(`   Pour recevoir des messages sur ${formattedPhone} :`);
      console.log("   1. Allez sur https://developers.facebook.com/apps");
      console.log("   2. WhatsApp > Configuration de l'API (API Setup)");
      console.log("   3. Dans le champ 'À' (To), cliquez sur 'Gérer la liste de numéros de téléphone'");
      console.log(`   4. Ajoutez votre numéro (+213...) et validez le SMS/code Meta.`);
    } else if (code === 131047) {
      console.log("\n💡 [Fenêtre 24h Meta requise] :");
      console.log("   Envoyez d'abord un message (ex: 'Salut') depuis votre WhatsApp vers le numéro de test Meta pour ouvrir la fenêtre de 24h.");
    }

    throw new Error(`Erreur Meta API: ${msg}`);
  }
}

module.exports = {
  sendMetaWhatsAppMessage,
};

