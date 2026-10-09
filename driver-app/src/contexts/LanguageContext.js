import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_STORAGE_KEY = "@driver_app_language";

export const translations = {
  fr: {
    appName: "Food Delivery Livreur",
    driverOnline: "En ligne (Livreur)",
    certified: "Certifié ✓",
    readyOrders: "Commandes prêtes :",
    noOrdersReady: "Aucune commande prête pour le moment",
    deliveryDetails: "Détails de livraison :",
    acceptOrder: "Accepter la course ✅",
    lockOrderBtn: "Accepter la course (1er arrivé, 1er servi) ⚡",
    confirmHandover: "Confirmer la remise au client ✅",
    alreadyAssignedTitle: "Course déjà attribuée ⚠️",
    alreadyAssignedMsg: "Désolé ! Un autre livreur vient d'accepter cette commande une fraction de seconde plus tôt (premier arrivé, premier servi).",
    assignedSuccessTitle: "Course assignée ! 🚀",
    assignedSuccessMsg: "Vous êtes le livreur exclusif de cette commande. Rendez-vous au restaurant pour récupérer le plat.",
    pickupOrder: "Récupérer la commande 🛵",
    paymentReceived: "Paiement espèces reçu 💵",
    completeDelivery: "Terminer la livraison 🎉",
    orderDeliveredTitle: "Commande livrée 🎉",
    orderDeliveredMsg: "Vous avez livré la commande avec succès !",
    statusAssignedDelivery: "Assignée à vous (En cours)",
    statusReadyPickup: "Prête pour le ramassage",
    statusDelivered: "Livrée au client",
    back: "Retour",
    signOut: "Déconnexion",
    signOutConfirm: "Êtes-vous sûr de vouloir vous déconnecter ?",
    cancel: "Annuler",
    confirm: "Confirmer",
    mins: "min",
    km: "km",
    language: "Langue",
    selectLanguage: "Choisir la langue",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // KYC
    kycTitle: "Vérification du Livreur (KYC)",
    kycSubtitle: "Fournissez vos documents pour activer votre compte",
    vehicleType: "Type de véhicule :",
    idCardPhoto: "Photo de la Carte d'Identité / Passeport :",
    licensePhoto: "Photo du Permis de conduire :",
    submitDossier: "Soumettre mon dossier de coursier",
    dossierPendingTitle: "Dossier en cours d'examen ⏳",
    dossierPendingMsg: "Nos équipes valident vos documents sous 24h.",
    refreshStatus: "Actualiser le statut",
    error: "Erreur",
  },

  ar: {
    appName: "توصيل الطعام - السائق",
    driverOnline: "متصل (عامل التوصيل)",
    certified: "موثق ✓",
    readyOrders: "الطلبات الجاهزة للتوصيل:",
    noOrdersReady: "لا توجد طلبات جاهزة حالياً",
    deliveryDetails: "تفاصيل التوصيل:",
    acceptOrder: "قبول التوصيل ✅",
    lockOrderBtn: "قبول المشوار (الأسبقية للأسرع) ⚡",
    confirmHandover: "تأكيد تسليم الطلب للزبون ✅",
    alreadyAssignedTitle: "الطلب محجوز مسبقاً ⚠️",
    alreadyAssignedMsg: "عذراً! قام سائق آخر بقبول هذه الطلبية قبلك بأجزاء من الثانية (الأسبقية لمن يصل أولاً).",
    assignedSuccessTitle: "تم قبول المشوار! 🚀",
    assignedSuccessMsg: "أنت السائق المعتمد لهذا الطلب حصرياً. توجه إلى المطبخ لاستلام الوجبة.",
    pickupOrder: "استلام الطلب من المطبخ 🛵",
    paymentReceived: "تم استلام المبلغ نقداً 💵",
    completeDelivery: "إتمام التوصيل بنجاح 🎉",
    orderDeliveredTitle: "تم تسليم الطلب 🎉",
    orderDeliveredMsg: "لقد قمت بتسليم الطلب للزبون بنجاح!",
    statusAssignedDelivery: "تم تكليفك بالطلب (قيد التوصيل)",
    statusReadyPickup: "جاهزة للاستلام",
    statusDelivered: "تم التسليم للزبون",
    back: "رجوع",
    signOut: "تسجيل الخروج",
    signOutConfirm: "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    mins: "دقيقة",
    km: "كم",
    language: "اللغة",
    selectLanguage: "اختر لغة التطبيق",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // KYC
    kycTitle: "توثيق حساب السائق (KYC)",
    kycSubtitle: "يرجى تقديم وثائق الهوية لتفعيل حسابك",
    vehicleType: "نوع وسيلة النقل:",
    idCardPhoto: "صورة بطاقة التعريف الوطنية:",
    licensePhoto: "صورة رخصة السياقة:",
    submitDossier: "إرسال ملف السائق للتحقق",
    dossierPendingTitle: "الملف قيد المراجعة والتدقيق ⏳",
    dossierPendingMsg: "يقوم فريقنا بمراجعة وثائقك خلال 24 ساعة.",
    refreshStatus: "تحديث الحالة",
    error: "خطأ",
  },

  en: {
    appName: "Food Delivery Courier",
    driverOnline: "Online (Courier)",
    certified: "Certified ✓",
    readyOrders: "Ready Orders:",
    noOrdersReady: "No ready orders at the moment",
    deliveryDetails: "Delivery Details:",
    acceptOrder: "Accept Order ✅",
    lockOrderBtn: "Accept Delivery (1st Come, 1st Served) ⚡",
    confirmHandover: "Confirm Handover to Customer ✅",
    alreadyAssignedTitle: "Order Already Taken ⚠️",
    alreadyAssignedMsg: "Sorry! Another driver accepted this delivery a split second earlier (first come, first served).",
    assignedSuccessTitle: "Order Assigned! 🚀",
    assignedSuccessMsg: "You are the exclusive driver for this order. Head to the kitchen to pick up the meal.",
    pickupOrder: "Pick-Up Order 🛵",
    paymentReceived: "Cash Payment Received 💵",
    completeDelivery: "Complete Delivery 🎉",
    orderDeliveredTitle: "Order Delivered 🎉",
    orderDeliveredMsg: "You delivered the order to the customer successfully!",
    statusAssignedDelivery: "Assigned to you (In delivery)",
    statusReadyPickup: "Ready for pickup",
    statusDelivered: "Delivered to customer",
    back: "Back",
    signOut: "Sign Out",
    signOutConfirm: "Are you sure you want to sign out?",
    cancel: "Cancel",
    confirm: "Confirm",
    mins: "min",
    km: "km",
    language: "Language",
    selectLanguage: "Select Language",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // KYC
    kycTitle: "Courier Verification (KYC)",
    kycSubtitle: "Provide your documents to activate your account",
    vehicleType: "Vehicle Type:",
    idCardPhoto: "National ID / Passport Photo:",
    licensePhoto: "Driver's License Photo:",
    submitDossier: "Submit Courier Documents",
    dossierPendingTitle: "Verification Under Review ⏳",
    dossierPendingMsg: "Our team verifies your documents within 24 hours.",
    refreshStatus: "Refresh Status",
    error: "Error",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("fr");

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.warn("Erreur chargement langue livreur:", e);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang) => {
    if (newLang === "fr" || newLang === "ar" || newLang === "en") {
      setLanguageState(newLang);
      try {
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      } catch (e) {
        console.warn("Erreur sauvegarde langue livreur:", e);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  const formatPrice = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return language === "ar" ? "0 د.ج" : "0 DA";
    }
    const num = Number(amount);
    const formattedNum = Number.isInteger(num) ? num.toString() : num.toFixed(2);
    if (language === "ar") {
      return `${formattedNum} د.ج`;
    }
    return `${formattedNum} DA`;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatPrice,
        isRTL: language === "ar",
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

