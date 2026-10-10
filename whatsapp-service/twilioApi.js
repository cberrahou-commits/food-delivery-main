const axios = require("axios");
const { formatPhoneNumber } = require("./utils");

/**
 * Envoie un message WhatsApp via Twilio Messaging API
 * https://www.twilio.com/docs/whatsapp/api
 */
async function sendTwilioWhatsAppMessage({ phone, messageText }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    throw new Error(
      "Configuration Twilio manquante. Veuillez renseigner TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN dans le fichier .env"
    );
  }

  const formattedPhone = formatPhoneNumber(phone, true); // +213...
  if (!formattedPhone) {
    throw new Error(`Numéro de téléphone invalide : ${phone}`);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams();
  params.append("To", `whatsapp:${formattedPhone}`);
  params.append("From", fromNumber.startsWith("whatsapp:") ? fromNumber : `whatsapp:${fromNumber}`);
  params.append("Body", messageText);

  try {
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const response = await axios.post(url, params.toString(), {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 10000,
    });

    return {
      success: true,
      provider: "twilio",
      messageId: response.data?.sid,
      status: response.data?.status,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error("❌ Erreur Twilio WhatsApp API:", {
      status: error.response?.status,
      message: errorMsg,
      code: error.response?.data?.code,
    });

    throw new Error(`Erreur Twilio API: ${errorMsg}`);
  }
}

module.exports = {
  sendTwilioWhatsAppMessage,
};

