// Configuration Cloudinary pour Wajbati Livreur
// Vous pouvez définir votre Cloud Name et votre Upload Preset ici ou dans votre fichier .env

export const CLOUDINARY_CONFIG = {
  // Nom de votre cloud Cloudinary (visible sur le tableau de bord Cloudinary : "Cloud name")
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || "wajbati",

  // Nom de votre Upload Preset NON SIGNÉ (Unsigned)
  // Dans la console Cloudinary : Settings > Upload > Upload presets > Add upload preset > Signing Mode: "Unsigned"
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "wajbati_unsigned",

  // Dossier racine pour organiser toutes les photos du projet
  defaultFolder: "wajbati",
};
