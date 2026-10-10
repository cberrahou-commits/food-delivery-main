import { Linking, Platform, Alert } from "react-native";

export const ALGERIA_WILAYAS = [
  { code: "01", name: "Adrar", nameAr: "أدرار" },
  { code: "02", name: "Chlef", nameAr: "الشلف" },
  { code: "03", name: "Laghouat", nameAr: "الأغواط" },
  { code: "04", name: "Oum El Bouaghi", nameAr: "أم البواقي" },
  { code: "05", name: "Batna", nameAr: "باتنة" },
  { code: "06", name: "Béjaïa", nameAr: "بجاية" },
  { code: "07", name: "Biskra", nameAr: "بسكرة" },
  { code: "08", name: "Béchar", nameAr: "بشار" },
  { code: "09", name: "Blida", nameAr: "البليدة" },
  { code: "10", name: "Bouira", nameAr: "البويرة" },
  { code: "11", name: "Tamanrasset", nameAr: "تمنراست" },
  { code: "12", name: "Tébessa", nameAr: "تبسة" },
  { code: "13", name: "Tlemcen", nameAr: "تلمسان" },
  { code: "14", name: "Tiaret", nameAr: "تيارت" },
  { code: "15", name: "Tizi Ouzou", nameAr: "تيزي وزو" },
  { code: "16", name: "Alger", nameAr: "الجزائر" },
  { code: "17", name: "Djelfa", nameAr: "الجلفة" },
  { code: "18", name: "Jijel", nameAr: "جيجل" },
  { code: "19", name: "Sétif", nameAr: "سطيف" },
  { code: "20", name: "Saïda", nameAr: "سعيدة" },
  { code: "21", name: "Skikda", nameAr: "سكيكدة" },
  { code: "22", name: "Sidi Bel Abbès", nameAr: "سيدي بلعباس" },
  { code: "23", name: "Annaba", nameAr: "عنابة" },
  { code: "24", name: "Guelma", nameAr: "قالمة" },
  { code: "25", name: "Constantine", nameAr: "قسنطينة" },
  { code: "26", name: "Médéa", nameAr: "المدية" },
  { code: "27", name: "Mostaganem", nameAr: "مستغانم" },
  { code: "28", name: "M'Sila", nameAr: "المسيلة" },
  { code: "29", name: "Mascara", nameAr: "معسكر" },
  { code: "30", name: "Ouargla", nameAr: "ورقلة" },
  { code: "31", name: "Oran", nameAr: "وهران" },
  { code: "32", name: "El Bayadh", nameAr: "البيض" },
  { code: "33", name: "Illizi", nameAr: "إليزي" },
  { code: "34", name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج" },
  { code: "35", name: "Boumerdès", nameAr: "بومرداس" },
  { code: "36", name: "El Tarf", nameAr: "الطارف" },
  { code: "37", name: "Tindouf", nameAr: "تندوف" },
  { code: "38", name: "Tissemsilt", nameAr: "تيسمسيلت" },
  { code: "39", name: "El Oued", nameAr: "الوادي" },
  { code: "40", name: "Khenchela", nameAr: "خنشلة" },
  { code: "41", name: "Souk Ahras", nameAr: "سوق أهراس" },
  { code: "42", name: "Tipaza", nameAr: "تيبازة" },
  { code: "43", name: "Mila", nameAr: "ميلة" },
  { code: "44", name: "Aïn Defla", nameAr: "عين الدفلى" },
  { code: "45", name: "Naâma", nameAr: "النعامة" },
  { code: "46", name: "Aïn Témouchent", nameAr: "عين تموشنت" },
  { code: "47", name: "Ghardaïa", nameAr: "غرداية" },
  { code: "48", name: "Relizane", nameAr: "غليزان" },
  { code: "49", name: "Timimoun", nameAr: "تيميمون" },
  { code: "50", name: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار" },
  { code: "51", name: "Ouled Djellal", nameAr: "أولاد جلال" },
  { code: "52", name: "Béni Abbès", nameAr: "بني عباس" },
  { code: "53", name: "In Salah", nameAr: "عين صالح" },
  { code: "54", name: "In Guezzam", nameAr: "عين قزام" },
  { code: "55", name: "Touggourt", nameAr: "تقرت" },
  { code: "56", name: "Djanet", nameAr: "جانت" },
  { code: "57", name: "El M'Ghair", nameAr: "المغير" },
  { code: "58", name: "El Meniaa", nameAr: "المنيعة" },
];

/**
 * Nettoie et formate un numéro algérien pour WhatsApp avec le préfixe international +213
 */
export const formatAlgeriaPhoneForWhatsApp = (rawPhone) => {
  if (!rawPhone) return "";
  let cleaned = String(rawPhone).replace(/[^\d+]/g, "");

  if (cleaned.startsWith("+213")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("00213")) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith("0") && cleaned.length >= 9) {
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
 * Lance le guidage GPS en direct vers les coordonnées indiquées (Google Maps Turn-by-Turn)
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
