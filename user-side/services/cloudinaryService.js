import { CLOUDINARY_CONFIG } from "../config/cloudinary";

/**
 * Upload une image vers Cloudinary
 * @param {string} imageUri - URI de l'image (file://... ou data:image/jpeg;base64,...)
 * @param {string} folder - Sous-dossier Cloudinary (ex: 'dishes', 'restaurants', 'documents', 'profiles')
 * @returns {Promise<string>} - L'URL HTTPS sécurisée de l'image hébergée sur Cloudinary (CDN)
 */
export const uploadImageToCloudinary = async (imageUri, folder = "general") => {
  if (!imageUri || typeof imageUri !== "string") return null;

  // Si l'image est déjà une URL distante (Cloudinary, Unsplash, Firebase, etc.), ne pas la ré-uploader
  if (imageUri.startsWith("http://") || imageUri.startsWith("https://")) {
    return imageUri;
  }

  const { cloudName, uploadPreset, defaultFolder } = CLOUDINARY_CONFIG;

  if (!cloudName || cloudName === "VOTRE_CLOUD_NAME") {
    console.warn("⚠️ Cloudinary n'est pas encore configuré (cloudName vide). Conservation de l'image locale.");
    return imageUri;
  }

  const formData = new FormData();

  // Si c'est déjà un data URI base64
  if (imageUri.startsWith("data:image")) {
    formData.append("file", imageUri);
  } else {
    // Fichier local (ex: file:///data/user/0/...)
    const filename = imageUri.split("/").pop() || `photo_${Date.now()}.jpg`;
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : "image/jpeg";

    formData.append("file", {
      uri: imageUri,
      name: filename,
      type,
    });
  }

  formData.append("upload_preset", uploadPreset);
  const targetFolder = `${defaultFolder}/${folder}`;
  formData.append("folder", targetFolder);

  try {
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Erreur réponse Cloudinary:", data);
      throw new Error(data.error?.message || "Erreur lors de l'upload sur Cloudinary");
    }

    return data.secure_url;
  } catch (err) {
    console.error("Échec de l'upload Cloudinary:", err);
    throw err;
  }
};

/**
 * Upload simultané de plusieurs images vers Cloudinary
 * @param {Object} imagesMap - Objet avec clés et URIs, ex: { exterior: '...', interior: '...', rc: '...' }
 * @param {string} folder - Dossier de destination
 * @returns {Promise<Object>} - Objet avec les URLs Cloudinary correspondantes
 */
export const uploadMultipleImagesToCloudinary = async (imagesMap, folder = "general") => {
  const keys = Object.keys(imagesMap);
  const results = {};

  await Promise.all(
    keys.map(async (key) => {
      const uri = imagesMap[key];
      if (!uri) {
        results[key] = "";
        return;
      }
      try {
        const uploadedUrl = await uploadImageToCloudinary(uri, folder);
        results[key] = uploadedUrl;
      } catch (err) {
        console.warn(`Erreur upload Cloudinary pour [${key}]:`, err);
        // Si erreur, on garde l'URI de base en secours pour ne pas bloquer l'utilisateur
        results[key] = uri;
      }
    })
  );

  return results;
};

