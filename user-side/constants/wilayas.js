import { Linking, Platform, Alert } from "react-native";

export const ALGERIA_WILAYAS = [
  { code: "01", name: "Adrar", nameAr: "أدرار", lat: 27.8742, lng: -0.2939 },
  { code: "02", name: "Chlef", nameAr: "الشلف", lat: 36.1654, lng: 1.3345 },
  { code: "03", name: "Laghouat", nameAr: "الأغواط", lat: 33.8000, lng: 2.8651 },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي", lat: 35.8755, lng: 7.1135 },
  { code: "05", name: "Batna", nameAr: "باتنة", lat: 35.5558, lng: 6.1741 },
  { code: "06", name: "Béjaïa", nameAr: "بجاية", lat: 36.7559, lng: 5.0843 },
  { code: "07", name: "Biskra", nameAr: "بسكرة", lat: 34.8504, lng: 5.7281 },
  { code: "08", name: "Béchar", nameAr: "بشار", lat: 31.6167, lng: -2.2167 },
  { code: "09", name: "Blida", nameAr: "البليدة", lat: 36.4700, lng: 2.8277 },
  { code: "10", name: "Bouira", nameAr: "البويرة", lat: 36.3749, lng: 3.9020 },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست", lat: 22.7850, lng: 5.5228 },
  { code: "12", name: "Tébessa", nameAr: "تبسة", lat: 35.4042, lng: 8.1242 },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان", lat: 34.8783, lng: -1.3150 },
  { code: "14", name: "Tiaret", nameAr: "تيارت", lat: 35.3710, lng: 1.3170 },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو", lat: 36.7118, lng: 4.0459 },
  { code: "16", name: "Alger", nameAr: "الجزائر", lat: 36.7538, lng: 3.0588 },
  { code: "17", name: "Djelfa", nameAr: "الجلفة", lat: 34.6728, lng: 3.2630 },
  { code: "18", name: "Jijel", nameAr: "جيجل", lat: 36.8206, lng: 5.7667 },
  { code: "19", name: "Sétif", nameAr: "سطيف", lat: 36.1911, lng: 5.4137 },
  { code: "20", name: "Saïda", nameAr: "سعيدة", lat: 34.8303, lng: 0.1517 },
  { code: "21", name: "Skikda", nameAr: "سكيكدة", lat: 36.8663, lng: 6.9049 },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", lat: 35.1899, lng: -0.6308 },
  { code: "23", name: "Annaba", nameAr: "عنابة", lat: 36.9000, lng: 7.7667 },
  { code: "24", name: "Guelma", nameAr: "قالمة", lat: 36.4621, lng: 7.4261 },
  { code: "25", name: "Constantine", nameAr: "قسنطينة", lat: 36.3650, lng: 6.6147 },
  { code: "26", name: "Médéa", nameAr: "المدية", lat: 36.2642, lng: 2.7539 },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم", lat: 35.9312, lng: 0.0892 },
  { code: "28", name: "M'Sila", nameAr: "المسيلة", lat: 35.7058, lng: 4.5419 },
  { code: "29", name: "Mascara", nameAr: "معسكر", lat: 35.3975, lng: 0.1417 },
  { code: "30", name: "Ouargla", nameAr: "ورقلة", lat: 31.9530, lng: 5.3280 },
  { code: "31", name: "Oran", nameAr: "وهران", lat: 35.6976, lng: -0.6337 },
  { code: "32", name: "El Bayadh", nameAr: "البيض", lat: 33.6832, lng: 1.0193 },
  { code: "33", name: "Illizi", nameAr: "إليزي", lat: 26.4833, lng: 8.4667 },
  { code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", lat: 36.0732, lng: 4.7611 },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس", lat: 36.7664, lng: 3.4772 },
  { code: "36", name: "El Tarf", nameAr: "الطارف", lat: 36.7672, lng: 8.3138 },
  { code: "37", name: "Tindouf", nameAr: "تندوف", lat: 27.6761, lng: -8.1277 },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت", lat: 35.6072, lng: 1.8108 },
  { code: "39", name: "El Oued", nameAr: "الوادي", lat: 33.3683, lng: 6.8674 },
  { code: "40", name: "Khenchela", nameAr: "خنشلة", lat: 35.4358, lng: 7.1433 },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس", lat: 36.2864, lng: 7.9511 },
  { code: "42", name: "Tipaza", nameAr: "تيبازة", lat: 36.5897, lng: 2.4475 },
  { code: "43", name: "Mila", nameAr: "ميلة", lat: 36.4503, lng: 6.2644 },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى", lat: 36.2641, lng: 1.9679 },
  { code: "45", name: "Naâma", nameAr: "النعامة", lat: 33.2667, lng: -0.3167 },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت", lat: 35.2975, lng: -1.1404 },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية", lat: 32.4909, lng: 3.6735 },
  { code: "48", name: "Relizane", nameAr: "غليزان", lat: 35.7373, lng: 0.5558 },
  { code: "49", name: "Timimoun", nameAr: "تيميمون", lat: 29.2639, lng: 0.2310 },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", lat: 21.3297, lng: 0.9542 },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال", lat: 34.4264, lng: 5.0647 },
  { code: "52", name: "Béni Abbès", nameAr: "بني عباس", lat: 30.1333, lng: -2.1667 },
  { code: "53", name: "In Salah", nameAr: "عين صالح", lat: 27.1936, lng: 2.4608 },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام", lat: 19.5694, lng: 5.7694 },
  { code: "55", name: "Touggourt", nameAr: "تقرت", lat: 33.1053, lng: 6.0578 },
  { code: "56", name: "Djanet", nameAr: "جانت", lat: 24.5531, lng: 9.4858 },
  { code: "57", name: "El M'Ghair", nameAr: "المغير", lat: 33.9500, lng: 5.9167 },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة", lat: 30.5847, lng: 2.8797 },
];

/**
 * Calcule la distance en km entre 2 coordonnées GPS (formule Haversine)
 */
export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);
  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) return Infinity;

  const R = 6371; // Rayon de la Terre en km
  const dLat = ((numLat2 - numLat1) * Math.PI) / 180;
  const dLon = ((numLon2 - numLon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((numLat1 * Math.PI) / 180) *
      Math.cos((numLat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Trouve une wilaya correspondante à partir :
 * 1. D'un code (ex: "31")
 * 2. D'un nom ou texte (ex: "Oran", "Es Senia, Oran")
 * 3. De coordonnées GPS (lat, lng) - wilaya la plus proche
 */
export const findWilaya = ({ code, name, coords } = {}) => {
  // 1. Recherche par code
  if (code != null) {
    const cleanCode = String(code).trim().padStart(2, "0");
    const byCode = ALGERIA_WILAYAS.find((w) => w.code === cleanCode);
    if (byCode) return byCode;
  }

  // 2. Recherche par nom ou texte d'adresse
  if (name && typeof name === "string") {
    const q = name.toLowerCase().trim();
    // Recherche exacte d'abord
    const exact = ALGERIA_WILAYAS.find(
      (w) => w.name.toLowerCase() === q || w.nameAr === q
    );
    if (exact) return exact;

    // Recherche par inclusion de nom de wilaya
    const included = ALGERIA_WILAYAS.find(
      (w) =>
        q.includes(w.name.toLowerCase()) ||
        w.name.toLowerCase().includes(q) ||
        (w.nameAr && q.includes(w.nameAr))
    );
    if (included) return included;
  }

  // 3. Recherche par coordonnées GPS (trouve le chef-lieu de wilaya le plus proche)
  if (coords && coords.latitude != null && coords.longitude != null) {
    let closestWilaya = null;
    let minDistance = Infinity;

    for (const w of ALGERIA_WILAYAS) {
      if (w.lat != null && w.lng != null) {
        const dist = calculateDistanceKm(coords.latitude, coords.longitude, w.lat, w.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestWilaya = w;
        }
      }
    }

    if (closestWilaya && minDistance <= 250) {
      return closestWilaya;
    }
  }

  return null;
};

/**
 * Détecte automatiquement la Wilaya de localisation du client :
 * 1. Vérifie le profil utilisateur (wilaya, wilayaCode, address, lat/lng)
 * 2. Utilise le GPS en direct via le module Location (reverse geocoding et coordonnées de proximité)
 */
export const detectClientWilaya = async ({ user, dbUser, LocationModule } = {}) => {
  // 1. Priorité aux données du profil utilisateur
  if (dbUser?.wilayaCode || dbUser?.wilaya) {
    const fromProfile = findWilaya({
      code: dbUser.wilayaCode,
      name: dbUser.wilaya,
    });
    if (fromProfile) return fromProfile;
  }

  if (dbUser?.address) {
    const fromAddress = findWilaya({ name: dbUser.address });
    if (fromAddress) return fromAddress;
  }

  if (dbUser?.latitude && dbUser?.longitude) {
    const fromCoords = findWilaya({
      coords: { latitude: Number(dbUser.latitude), longitude: Number(dbUser.longitude) },
    });
    if (fromCoords) return fromCoords;
  }

  // 2. Détection par GPS en direct si LocationModule est fourni
  if (LocationModule) {
    try {
      const { status } = await LocationModule.getForegroundPermissionsAsync();
      let granted = status === "granted";
      if (!granted) {
        const req = await LocationModule.requestForegroundPermissionsAsync();
        granted = req.status === "granted";
      }

      if (granted) {
        const pos = await LocationModule.getCurrentPositionAsync({
          accuracy: LocationModule.Accuracy.Balanced,
        });

        if (pos?.coords) {
          const { latitude, longitude } = pos.coords;

          // Essayer le géocodage inverse
          try {
            const geocode = await LocationModule.reverseGeocodeAsync({ latitude, longitude });
            if (geocode && geocode.length > 0) {
              const item = geocode[0];
              const textCandidates = [item.city, item.region, item.subregion, item.district]
                .filter(Boolean)
                .join(" ");

              // Essai par code postal (ex: 31000 -> Wilaya 31 Oran)
              if (item.postalCode && item.postalCode.length >= 2) {
                const codeCandidate = item.postalCode.substring(0, 2);
                const fromZip = findWilaya({ code: codeCandidate });
                if (fromZip) return fromZip;
              }

              const fromGeocode = findWilaya({ name: textCandidates });
              if (fromGeocode) return fromGeocode;
            }
          } catch (geoErr) {
            console.warn("reverseGeocode error:", geoErr);
          }

          // Fallback par calcul de coordonnées GPS vers le chef-lieu le plus proche
          const fromGpsCoords = findWilaya({ coords: { latitude, longitude } });
          if (fromGpsCoords) return fromGpsCoords;
        }
      }
    } catch (e) {
      console.warn("detectClientWilaya GPS error:", e);
    }
  }

  return null;
};

/**
 * Nettoie et formate un numéro algérien pour WhatsApp avec le préfixe international +213
 * Exemples:
 *   "0555123456" -> "213555123456"
 *   "+213 555 12 34 56" -> "213555123456"
 *   "0770 99 88 77" -> "213770998877"
 */
export const formatAlgeriaPhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return "";
  let cleaned = String(rawPhone).replace(/[^\d+]/g, "");

  // Si commence par +213
  if (cleaned.startsWith("+213")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("00213")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0") && cleaned.length >= 9) {
    // Numéro standard algérien 05xx, 06xx, 07xx -> remplacer 0 par 213
    cleaned = `213${cleaned.substring(1)}`;
  } else if (!cleaned.startsWith("213") && (cleaned.startsWith("5") || cleaned.startsWith("6") || cleaned.startsWith("7"))) {
    cleaned = `213${cleaned}`;
  }

  return cleaned;
};

/**
 * Ouvre WhatsApp avec un message pré-rempli pour notifier ou contacter
 */
export const openWhatsApp = async ({ phone, message = "" }) => {
  const cleanPhone = formatAlgeriaPhoneForWhatsApp(phone);
  if (!cleanPhone) {
    Alert.alert("Numéro manquant", "Le numéro de téléphone n'est pas renseigné.");
    return false;
  }

  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${cleanPhone}${message ? `?text=${encodedMsg}` : ""}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      await Linking.openURL(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`);
      return true;
    }
  } catch (err) {
    console.error("Erreur ouverture WhatsApp:", err);
    Alert.alert("Erreur WhatsApp", "Impossible d'ouvrir WhatsApp sur cet appareil.");
    return false;
  }
};

/**
 * Lance le guidage GPS en direct (Google Maps / Apple Maps turn-by-turn navigation)
 */
export const openGpsNavigation = (lat, lng, address = "", label = "Destination") => {
  const numLat = Number(lat);
  const numLng = Number(lng);
  const hasCoords = !isNaN(numLat) && !isNaN(numLng) && numLat !== 0 && numLng !== 0;

  if (hasCoords) {
    const url = Platform.select({
      android: `google.navigation:q=${numLat},${numLng}&mode=d`,
      ios: `maps://app?daddr=${numLat},${numLng}&dirflg=d`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`,
    });

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(
            `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`
          );
        }
      })
      .catch(() => {
        Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${numLat},${numLng}&travelmode=driving`
        );
      });
  } else if (address && address.trim()) {
    const encoded = encodeURIComponent(address.trim());
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
  } else {
    Alert.alert("Position introuvable", "Aucune coordonnée ni adresse n'a été trouvée pour cet itinéraire.");
  }
};

