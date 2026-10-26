import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_STORAGE_KEY = "@food_delivery_language";

export const translations = {
  fr: {
    // Général
    appName: "Food Delivery Algérie",
    home: "Accueil",
    searchPlaceholder: "Plats, cuisines familiales, restaurants...",
    cancel: "Annuler",
    confirm: "Confirmer",
    back: "Retour",
    remove: "Supprimer",
    save: "Enregistrer",
    error: "Erreur",
    success: "Succès",
    language: "Langue",
    selectLanguage: "Choisir la langue",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // En-tête
    deliverNow: "Livraison immédiate !",
    currentLocation: "Position actuelle",

    // Menu utilisateur
    myProfile: "Mon Profil",
    myOrders: "Mes Commandes",
    signOut: "Déconnexion",
    signIn: "Connexion",
    signUp: "Créer un compte",
    appLanguage: "Langue de l'application",

    // Cuisinier Maison
    homeCookBannerTitle: "Vous cuisinez avec amour ?",
    homeCookBannerSub: "Proposez vos plats faits maison aux gourmets",
    manageKitchen: "Gérer ma Cuisine Fait Maison",
    viewCookDishes: "Voir mes plats et commandes reçues",
    becomeChef: "Devenir Cuisinier",
    myKitchen: "Ma Cuisine",
    cookSpace: "Mon Espace Cuisinier",
    becomeHomeCook: "Devenir Cuisinier Maison",
    cookSubtitle: "Gérer mes plats maison & commandes",
    cookOnboardSubtitle: "Proposez vos plats faits maison aux voisins",
    ordersReceived: "Commandes Reçues",
    noOrdersYet: "Aucune commande en cours 🚫",
    addDish: "Ajouter un Plat Fait Maison",
    dishName: "Nom du plat",
    dishDesc: "Description & Ingrédients",
    dishPrice: "Prix en Dinars (DA)",
    dishPhoto: "Photo du plat",
    takePhoto: "Prendre une photo",
    chooseGallery: "Choisir depuis la galerie",
    publishDish: "Mettre en vente ce plat",

    // Restaurant & Plats
    menu: "Menu des plats",
    mins: "min",
    deliveryEstimated: "Livraison estimée :",
    cashOnDelivery: "Paiement à la livraison (Espèces)",
    subtotal: "Sous-total",
    deliveryFee: "Frais de livraison",
    orderTotal: "Total de la commande",
    placeOrder: "Commander",
    orderNowBtn: "Commander maintenant",
    viewBasket: "Voir le panier",
    basketEmpty: "Votre panier est vide",
    basketEmptyDesc: "Sélectionnez de délicieux plats traditionnels et faits maison auprès de nos cuisiniers pour commander !",
    discoverMenu: "Découvrir le menu",
    clearBasket: "Vider le panier",
    clearBasketConfirm: "Êtes-vous sûr de vouloir vider tous les plats de votre panier ?",
    changeRestaurantTitle: "Changer de cuisinier / restaurant ?",
    changeRestaurantMsg: "Votre panier contient déjà des plats d'un autre cuisinier.\n\nVoulez-vous vider votre panier actuel pour commander auprès de cette cuisine ?",
    keepBasket: "Conserver le panier",
    clearAndAdd: "Vider et ajouter ce plat",

    // Statuts de commande
    orderPending: "Commande en attente ⏳",
    orderAccepted: "Acceptée par la cuisine 🎉",
    orderDeclined: "Commande refusée ❌",
    orderPreparing: "En préparation en cuisine 🍲",
    orderReady: "Prête pour le coursier 🛵",
    driverAssigned: "Livreur en route vers la cuisine 🚴🏻‍♀️",
    driverPickedUp: "En cours de livraison 🏍️",
    orderDelivered: "Commande livrée ✅",
    orderNumber: "Commande N°",
    fromKitchen: "Cuisine / Restaurant :",

    // Nouveau cycle de commande
    statusPendingApproval: "En attente approbation cuisinier ⏳",
    statusWaitingClient: "En attente de votre accord ⏰",
    statusInPreparation: "En cours de préparation 🍲",
    statusReadyForPickup: "Prête pour le coursier 🛵",
    statusAssignedDelivery: "Livreur en route vers la cuisine 🚴🏻‍♀️",
    statusDelivered: "Commande livrée ✅",
    statusDeclinedCook: "Refusée par le cuisinier ❌",
    statusCancelledClient: "Annulée par le client ❌",

    // Cuisinier - Estimation et cycle
    cookEstimatingTitle: "Estimation du délai de préparation",
    prepTimeLabel: "Délai effectif en minutes :",
    enterPrepTime: "Ex: 25",
    calculatedEndTime: "Heure exacte de fin prévue :",
    validateEstimation: "Valider et envoyer au client ⏱️",
    declineOrder: "Refuser la commande ❌",
    finishPreparation: "Fin de la préparation (Repas prêt 🛵)",
    prepTimeRequired: "Veuillez saisir un délai de préparation valide en minutes.",
    estimationSent: "Estimation envoyée au client avec succès ! En attente de son accord.",
    mealReadyAlert: "Le repas est prêt ! Tous les livreurs disponibles ont été notifiés 🛵",
    indicativePrepTime: "Temps estimé :",
    indicativeTag: "(indicatif)",

    // Client - Validation accord
    cookProposedTime: "Heure estimée de disponibilité :",
    prepDurationProposed: "Délai de préparation :",
    clientAgreeBtn: "Confirmer mon accord 👍",
    clientCancelBtn: "Refuser / Annuler ❌",
    clientConfirmedSuccess: "Votre accord a été confirmé ! La cuisine prépare votre repas 🍲",
    orderCancelledSuccess: "La commande a été annulée.",
    waitingCookEstimation: "Le cuisinier vérifie votre commande et estime le temps...",
    waitingYourConfirmationNotice: "Veuillez confirmer l'heure de disponibilité estimée par le chef pour lancer la cuisson.",

    // Catégories
    categories: "Catégories",
    seeAll: "Voir tout",

    // Navigation McDo
    tabForYou: "Pour vous",
    tabRestaurants: "Restaurants",
    tabOrder: "Commander",
    tabOrders: "Commandes",
    tabPlus: "Plus",

    // Filtres et Villes
    filterAll: "Tous",
    filterRestaurants: "Restaurants",
    filterHomeCook: "Fait-Maison",
    allSpecialties: "Toutes spécialités",
    closestPlaces: "Établissements les plus proches",
    closestSorted: "Classés du plus proche au plus éloigné",
    placesAround: "établissements autour de vous",
    restaurantsAndKitchens: "Restaurants & Cuisines",
    yourPosition: "Votre position",
    nearby: "À proximité",
    atMeters: "à",
    changeWilaya: "Modifier la wilaya / zone",
    noEstablishments: "Aucun établissement disponible",
    noEstablishmentsDesc: "Aucun restaurant ou cuisinier partenaire trouvé dans cette catégorie.",
    clearFilters: "Effacer les filtres",
    viewMenu: "Voir le menu",
    partnerCook: "Fait-Maison · Cuisinier Partenaire",
    partnerRestaurant: "Restaurant Partenaire",
    prepTimePrefix: "Préparation ~",

    // Menu des restaurants & catégories
    menuCategories: "Catégories du menu :",
    allMenu: "Tout",
    loadingMenu: "Chargement de la carte...",
    noDishesAvailable: "Aucun plat disponible",
    menuUpdating: "La carte de cet établissement est en cours de mise à jour.",
    customizableTag: "Personnalisable (ex: sans tomate)",
    without: "Sans",
    dishCountSingle: "plat",
    dishCountPlural: "plats",

    // Personnalisation des ingrédients
    customizeDish: "Personnaliser vos ingrédients",
    customizeSubtitle: "Touchez un ingrédient pour le retirer de votre plat (ex: sans salade, sans tomate).",
    yourChoice: "Votre choix :",
    specialInstructions: "Instructions spéciales pour la cuisine",
    specialSubtitle: "Précisez vos préférences de cuisson, d'assaisonnement ou sauce à part.",
    specialPlaceholder: "Ex: Sauce à part, viande bien cuite, pas trop de sel...",
    addToBasketWithCount: "Ajouter au panier",

    // Page d'accueil (Home)
    welcomeWajbati: "Bienvenue chez Wajbati",
    welcomeSubtitle: "Plats faits-maison préparés à la commande",
    homemadeSpecialty: "SPÉCIALITÉ FAIT-MAISON",
    homemadeBannerTitle: "Craquez pour un plat fait-maison !",
    homemadeBannerDesc: "Cuisiné avec passion par nos chefs locaux.",
    nowAtOurCooks: "En ce moment chez nos cuisiniers",
    algerAndAll: "Alger & Algérie 🇩🇿",
    chooseWilaya: "Choisissez votre Wilaya",

    // Modes de commande & Wilayas
    orderModeModalTitle: "CHOISISSEZ VOTRE MODE DE COMMANDE",
    orderModeDelivery: "Livraison",
    orderModeDeliverySub: "Livré chez vous rapidement par un coursier",
    orderModePickup: "Click & Collect",
    orderModePickupSub: "Récupérez directement chez le cuisinier",
    orderModeDineIn: "Sur place / À table",
    orderModeDineInSub: "Dégustez directement sur place",
    validate: "Valider",
    allWilayas: "Toutes les Wilayas (Toute l'Algérie)",
    searchWilayaPlaceholder: "Rechercher par nom ou numéro (ex: 16, Oran)...",

    // Écran Plus & Paramètres
    guestMode: "Mode Invité",
    guestModeDesc: "Connectez-vous ou inscrivez-vous pour profiter pleinement de l'application.",
    verifiedAccount: "Compte vérifié",
    welcomeSpace: "Bienvenue sur votre espace Wajbati.",
    editProfile: "Modifier mes informations",
    manageCookSubtitle: "Gérer mes plats et commandes",
    becomeCookSubtitle: "Cuisinez et vendez vos plats à domicile",
    becomeRestaurant: "Devenir Restaurant Partenaire",
    becomeRestaurantSub: "Inscrire mon restaurant avec RC & position GPS",
    mySettings: "Mes paramètres",
    personalData: "Gestion des données personnelles",
    locationSettings: "Gestion de la localisation & Wilaya",
    generalInfo: "Informations Générales",
    helpSupport: "Aide & Support Wajbati",
    aboutAlertTitle: "À propos de Wajbati",
    aboutAlertDesc: "Wajbati (وجبتي) est la première plateforme de livraison de plats faits maison préparés avec amour par nos cuisiniers partenaires en Algérie.",
    logoutConfirmTitle: "Déconnexion",
    logoutConfirmMsg: "Êtes-vous sûr de vouloir vous déconnecter ?",
  },

  ar: {
    // Général
    appName: "توصيل الطعام الجزائر",
    home: "الرئيسية",
    searchPlaceholder: "أطباق، مطابخ منزلية، مطاعم...",
    cancel: "إلغاء",
    confirm: "تأكيد",
    back: "رجوع",
    remove: "حذف",
    save: "حفظ",
    error: "خطأ",
    success: "تم بنجاح",
    language: "اللغة",
    selectLanguage: "اختر لغة التطبيق",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // En-tête
    deliverNow: "توصيل فوري!",
    currentLocation: "الموقع الحالي",

    // Menu utilisateur
    myProfile: "ملفي الشخصي",
    myOrders: "طلباتي",
    signOut: "تسجيل الخروج",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    appLanguage: "لغة التطبيق",

    // Cuisinier Maison
    homeCookBannerTitle: "هل تطبخ بحب وشغف؟",
    homeCookBannerSub: "اعرض أطباقك المنزلية والتقليدية للزبائن",
    manageKitchen: "إدارة مطبخي المنزلي",
    viewCookDishes: "عرض أطباقي والطلبات الواردة",
    becomeChef: "انضم كطباخ",
    myKitchen: "مطبخي",
    cookSpace: "فضاء الطباخ المنزلي",
    becomeHomeCook: "انضم كطباخ منزلي",
    cookSubtitle: "إدارة الأطباق المنزلية والطلبات",
    cookOnboardSubtitle: "شارك أطباقك المنزلية الشهية مع جيرانك",
    ordersReceived: "الطلبات الواردة",
    noOrdersYet: "لا توجد طلبات حالياً 🚫",
    addDish: "إضافة طبق منزلي جديد",
    dishName: "اسم الطبق",
    dishDesc: "الوصف والمكونات",
    dishPrice: "السعر بالدينار الجزائري (د.ج)",
    dishPhoto: "صورة الطبق",
    takePhoto: "التقاط صورة بالكاميرا",
    chooseGallery: "اختيار من المعرض",
    publishDish: "عرض الطبق للبيع",

    // Restaurant & Plats
    menu: "قائمة المأكولات",
    mins: "دقيقة",
    deliveryEstimated: "وقت التوصيل التقديري:",
    cashOnDelivery: "الدفع نقداً عند الاستلام",
    subtotal: "المجموع الفرعي",
    deliveryFee: "رسوم التوصيل",
    orderTotal: "المجموع الكلي",
    placeOrder: "تأكيد الطلب",
    orderNowBtn: "اطلب الآن",
    viewBasket: "عرض سلة الطلبات",
    basketEmpty: "سلة الطلبات فارغة",
    basketEmptyDesc: "اختر أشهى المأكولات المنزلية والتقليدية من طباخينا لتأكيد طلبك!",
    discoverMenu: "استكشف القائمة",
    clearBasket: "إفراغ السلة",
    clearBasketConfirm: "هل أنت متأكد من رغبتك في إفراغ سلة الطلبات؟",
    changeRestaurantTitle: "تغيير الطباخ / المطعم؟",
    changeRestaurantMsg: "تحتوي سلتك على أطباق من طباخ آخر.\n\nهل ترغب في إفراغ السلة الحالية والطلب من هذا المطبخ؟",
    keepBasket: "الاحتفاظ بالسلة",
    clearAndAdd: "إفراغ السلة وإضافة الطبق",

    // Statuts de commande
    orderPending: "الطلب قيد الانتظار ⏳",
    orderAccepted: "تم قبول الطلب في المطبخ 🎉",
    orderDeclined: "تم رفض الطلب ❌",
    orderPreparing: "قيد التحضير في المطبخ 🍲",
    orderReady: "الطلب جاهز للتسليم 🛵",
    driverAssigned: "السائق في الطريق إلى المطبخ 🚴🏻‍♀️",
    driverPickedUp: "الطلب في الطريق إليك 🏍️",
    orderDelivered: "تم تسليم الطلب بنجاح ✅",
    orderNumber: "رقم الطلب",
    fromKitchen: "المطبخ / المطعم:",

    // دورة حياة الطلب الجديدة
    statusPendingApproval: "في انتظار موافقة الطباخ ⏳",
    statusWaitingClient: "في انتظار موافقتك على الوقت ⏰",
    statusInPreparation: "قيد التحضير في المطبخ 🍲",
    statusReadyForPickup: "جاهز لاستلام المندوب 🛵",
    statusAssignedDelivery: "المندوب في الطريق إلى المطبخ 🚴🏻‍♀️",
    statusDelivered: "تم تسليم الطلب بنجاح ✅",
    statusDeclinedCook: "تم الرفض من قبل الطباخ ❌",
    statusCancelledClient: "تم الإلغاء من قبل الزبون ❌",

    // الطباخ - التقدير والتحضير
    cookEstimatingTitle: "تقدير مدة التحضير",
    prepTimeLabel: "مدة التحضير الفعلية (بالدقائق):",
    enterPrepTime: "مثال: 25",
    calculatedEndTime: "وقت الانتهاء المتوقع بالضبط:",
    validateEstimation: "تأكيد المدة وإرسالها للزبون ⏱️",
    declineOrder: "رفض الطلب ❌",
    finishPreparation: "انتهاء التحضير (الوجبة جاهزة 🛵)",
    prepTimeRequired: "يرجى إدخال مدة تحضير صحيحة بالدقائق.",
    estimationSent: "تم إرسال التقدير للزبون بنجاح! في انتظار موافقته.",
    mealReadyAlert: "الوجبة جاهزة! تم إشعار جميع عمال التوصيل المتاحين 🛵",
    indicativePrepTime: "الوقت المقدر:",
    indicativeTag: "(تقريبي)",

    // الزبون - الموافقة المزدوجة
    cookProposedTime: "الوقت المقترح لجاهزية الوجبة:",
    prepDurationProposed: "مدة التحضير المقدرة:",
    clientAgreeBtn: "تأكيد موافقتي 👍",
    clientCancelBtn: "رفض / إلغاء ❌",
    clientConfirmedSuccess: "تم تأكيد موافقتك! بدأ تحضير الوجبة في المطبخ 🍲",
    orderCancelledSuccess: "تم إلغاء الطلب بنجاح.",
    waitingCookEstimation: "يقوم الطباخ بمراجعة طلبك وتقدير وقت التحضير...",
    waitingYourConfirmationNotice: "يرجى تأكيد موعد الجاهزية المقترح من الطباخ لبدء عملية الطهي.",

    // Catégories
    categories: "التصنيفات",
    seeAll: "عرض الكل",

    // Navigation McDo
    tabForYou: "من أجلك",
    tabRestaurants: "مطاعم",
    tabOrder: "اطلب الآن",
    tabOrders: "طلباتي",
    tabPlus: "المزيد",

    // Filtres et Villes
    filterAll: "الكل",
    filterRestaurants: "مطاعم",
    filterHomeCook: "منزلي",
    allSpecialties: "جميع التخصصات",
    closestPlaces: "المطاعم والمطابخ الأقرب إليك",
    closestSorted: "مرتبة حسب الأقرب مسافة",
    placesAround: "مؤسسة ومطبخ بالقرب منك",
    restaurantsAndKitchens: "مطاعم ومطابخ",
    yourPosition: "موقعك الحالي",
    nearby: "قريب جداً",
    atMeters: "على بعد",
    changeWilaya: "تغيير الولاية / المنطقة",
    noEstablishments: "لا توجد مطاعم متاحة حالياً",
    noEstablishmentsDesc: "لم يتم العثور على أي مطعم أو طباخ شريك في هذا التصنيف.",
    clearFilters: "إلغاء التصفية",
    viewMenu: "عرض القائمة",
    partnerCook: "منزلي · طباخ معتمد",
    partnerRestaurant: "مطعم معتمد",
    prepTimePrefix: "التحضير ~",

    // Menu des restaurants & catégories
    menuCategories: "أقسام قائمة الطعام:",
    allMenu: "الكل",
    loadingMenu: "جاري تحميل قائمة الطعام...",
    noDishesAvailable: "لا توجد أطباق متاحة حالياً",
    menuUpdating: "قائمة الطعام قيد التحديث من طرف الإدارة.",
    customizableTag: "قابل للتعديل (مثال: بدون طماطم)",
    without: "بدون",
    dishCountSingle: "طبق",
    dishCountPlural: "أطباق",

    // Personnalisation des ingrédients
    customizeDish: "تخصيص مكونات الطبق",
    customizeSubtitle: "المس المكون الذي ترغب في إزالته من وجبتك (مثال: بدون سلطة، بدون طماطم).",
    yourChoice: "اختيارك:",
    specialInstructions: "ملاحظات وتعليمات خاصة للمطبخ",
    specialSubtitle: "حدد تفضيلات الطهي أو التتبيل أو وضع الصلصة على حدة.",
    specialPlaceholder: "مثال: الصلصة على حدة، اللحم مطهو جيداً، قليل الملح...",
    addToBasketWithCount: "إضافة إلى السلة",

    // Page d'accueil (Home)
    welcomeWajbati: "مرحباً بكم في وجبتي",
    welcomeSubtitle: "أطباق منزلية تقليدية تُطهى طازجة عند الطلب",
    homemadeSpecialty: "أطباق منزلية مميزة",
    homemadeBannerTitle: "استمتع بأشهى الأكلات المنزلية!",
    homemadeBannerDesc: "مُعدة بحب وشغف بأيدي طباخينا المحليين.",
    nowAtOurCooks: "أطباق مميزة متوفرة الآن",
    algerAndAll: "الجزائر وكل الولايات 🇩🇿",
    chooseWilaya: "اختر ولايتك",

    // Modes de commande & Wilayas
    orderModeModalTitle: "اختر طريقة استلام طلبك",
    orderModeDelivery: "توصيل إلى المنزل",
    orderModeDeliverySub: "توصيل سريع إلى باب منزلك مع سائق",
    orderModePickup: "استلام من المطعم (Click & Collect)",
    orderModePickupSub: "استلم وجبتك مباشرة وتجنب الانتظار",
    orderModeDineIn: "تناول في المطعم / على الطاولة",
    orderModeDineInSub: "استمتع بوجبتك في عين المكان",
    validate: "تأكيد",
    allWilayas: "كل الولايات (كامل التراب الوطني)",
    searchWilayaPlaceholder: "ابحث بالاسم أو بالرقم (مثال: 16، وهران)...",

    // Écran Plus & Paramètres
    guestMode: "وضع الزائر",
    guestModeDesc: "سجل الدخول أو أنشئ حساباً للاستفادة الكاملة من تطبيق وجبتي.",
    verifiedAccount: "حساب موثق",
    welcomeSpace: "مرحباً بكم في حسابكم على وجبتي.",
    editProfile: "تعديل معلومات حسابي",
    manageCookSubtitle: "إدارة أطباقي والطلبات الواردة",
    becomeCookSubtitle: "اطبخ وابدأ ببيع وجباتك المنزلية من بيتك",
    becomeRestaurant: "انضمام كمطعم شريك",
    becomeRestaurantSub: "تسجيل المطعم مع السجل التجاري والموقع",
    mySettings: "إعداداتي",
    personalData: "إدارة البيانات الشخصية",
    locationSettings: "الموقع والولاية",
    generalInfo: "معلومات عامة",
    helpSupport: "المساعدة والدعم الفني",
    aboutAlertTitle: "حول تطبيق وجبتي",
    aboutAlertDesc: "وجبتي هي المنصة الجزائرية الرائدة لتوصيل المأكولات المنزلية والتقليدية المحضرة بشغف.",
    logoutConfirmTitle: "تسجيل الخروج",
    logoutConfirmMsg: "هل أنت متأكد من رغبتك في تسجيل الخروج؟",
  },

  en: {
    // Général
    appName: "Food Delivery Algeria",
    home: "Home",
    searchPlaceholder: "Dishes, home cooks, restaurants...",
    cancel: "Cancel",
    confirm: "Confirm",
    back: "Back",
    remove: "Remove",
    save: "Save",
    error: "Error",
    success: "Success",
    language: "Language",
    selectLanguage: "Select Language",
    french: "Français",
    arabic: "العربية",
    english: "English",

    // En-tête
    deliverNow: "Deliver Now!",
    currentLocation: "Current Location",

    // Menu utilisateur
    myProfile: "My Profile",
    myOrders: "My Orders",
    signOut: "Sign Out",
    signIn: "Sign In",
    signUp: "Sign Up",
    appLanguage: "App Language",

    // Cuisinier Maison
    homeCookBannerTitle: "Do you cook with love?",
    homeCookBannerSub: "Share your homemade recipes with food lovers",
    manageKitchen: "Manage My Home Kitchen",
    viewCookDishes: "View my dishes and received orders",
    becomeChef: "Become a Cook",
    myKitchen: "My Kitchen",
    cookSpace: "My Cook Space",
    becomeHomeCook: "Become a Home Cook",
    cookSubtitle: "Manage dishes & incoming orders",
    cookOnboardSubtitle: "Share delicious homemade dishes with neighbors",
    ordersReceived: "Orders Received",
    noOrdersYet: "No active orders 🚫",
    addDish: "Add Homemade Dish",
    dishName: "Dish Name",
    dishDesc: "Description & Ingredients",
    dishPrice: "Price in Dinars (DA)",
    dishPhoto: "Dish Photo",
    takePhoto: "Take a Photo",
    chooseGallery: "Choose from Gallery",
    publishDish: "Publish Dish",

    // Restaurant & Plats
    menu: "Menu",
    mins: "mins",
    deliveryEstimated: "Estimated Delivery:",
    cashOnDelivery: "Cash on Delivery",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    orderTotal: "Order Total",
    placeOrder: "Place Order",
    orderNowBtn: "Order Now",
    viewBasket: "View Basket",
    basketEmpty: "Your basket is empty",
    basketEmptyDesc: "Select delicious traditional and homemade dishes from our cooks to start ordering!",
    discoverMenu: "Discover menu",
    clearBasket: "Clear Basket",
    clearBasketConfirm: "Are you sure you want to remove all items from your basket?",
    changeRestaurantTitle: "Change restaurant / cook?",
    changeRestaurantMsg: "Your basket contains items from another cook.\n\nDo you want to clear your current basket and start ordering here?",
    keepBasket: "Keep Basket",
    clearAndAdd: "Clear & Add This Dish",

    // Statuts de commande
    orderPending: "Order Pending ⏳",
    orderAccepted: "Order Accepted 🎉",
    orderDeclined: "Order Declined ❌",
    orderPreparing: "Preparing Food 🍲",
    orderReady: "Ready for Pickup 🛵",
    driverAssigned: "Driver on the way to kitchen 🚴🏻‍♀️",
    driverPickedUp: "On the way to you 🏍️",
    orderDelivered: "Delivered ✅",
    orderNumber: "Order #",
    fromKitchen: "Kitchen / Restaurant:",

    // New order lifecycle
    statusPendingApproval: "Pending Cook Approval ⏳",
    statusWaitingClient: "Awaiting Your Confirmation ⏰",
    statusInPreparation: "In Preparation in Kitchen 🍲",
    statusReadyForPickup: "Ready for Pickup 🛵",
    statusAssignedDelivery: "Driver on the way to kitchen 🚴🏻‍♀️",
    statusDelivered: "Delivered Successfully ✅",
    statusDeclinedCook: "Declined by Cook ❌",
    statusCancelledClient: "Cancelled by Customer ❌",

    // Cook - Estimation and cycle
    cookEstimatingTitle: "Preparation Time Estimation",
    prepTimeLabel: "Effective prep time (in minutes):",
    enterPrepTime: "Ex: 25",
    calculatedEndTime: "Exact Calculated Finish Time:",
    validateEstimation: "Confirm & Send to Customer ⏱️",
    declineOrder: "Decline Order ❌",
    finishPreparation: "Finish Preparation (Meal Ready 🛵)",
    prepTimeRequired: "Please enter a valid preparation time in minutes.",
    estimationSent: "Estimation sent to customer! Awaiting confirmation.",
    mealReadyAlert: "Meal is ready! All available drivers have been notified 🛵",
    indicativePrepTime: "Estimated prep:",
    indicativeTag: "(indicative)",

    // Customer - Agreement
    cookProposedTime: "Cook estimated ready time:",
    prepDurationProposed: "Estimated prep duration:",
    clientAgreeBtn: "Confirm Agreement 👍",
    clientCancelBtn: "Decline / Cancel ❌",
    clientConfirmedSuccess: "Your agreement was confirmed! Kitchen started cooking 🍲",
    orderCancelledSuccess: "Order was cancelled.",
    waitingCookEstimation: "The cook is checking your order and estimating prep time...",
    waitingYourConfirmationNotice: "Please confirm the ready time estimated by the chef to begin cooking.",

    // Catégories
    categories: "Categories",
    seeAll: "See All",

    // Navigation McDo
    tabForYou: "For You",
    tabRestaurants: "Restaurants",
    tabOrder: "Order",
    tabOrders: "Orders",
    tabPlus: "More",

    // Filtres et Villes
    filterAll: "All",
    filterRestaurants: "Restaurants",
    filterHomeCook: "Homemade",
    allSpecialties: "All Specialties",
    closestPlaces: "Closest Establishments",
    closestSorted: "Sorted from closest to farthest",
    placesAround: "places around you",
    restaurantsAndKitchens: "Restaurants & Kitchens",
    yourPosition: "Your location",
    nearby: "Nearby",
    atMeters: "at",
    changeWilaya: "Change wilaya / area",
    noEstablishments: "No establishments available",
    noEstablishmentsDesc: "No partner restaurants or home cooks found in this category.",
    clearFilters: "Clear filters",
    viewMenu: "View Menu",
    partnerCook: "Homemade · Partner Cook",
    partnerRestaurant: "Partner Restaurant",
    prepTimePrefix: "Prep ~",

    // Menu des restaurants & catégories
    menuCategories: "Menu categories:",
    allMenu: "All",
    loadingMenu: "Loading menu...",
    noDishesAvailable: "No dishes available",
    menuUpdating: "The menu of this establishment is currently being updated.",
    customizableTag: "Customizable (e.g. no tomato)",
    without: "Without",
    dishCountSingle: "dish",
    dishCountPlural: "dishes",

    // Personnalisation des ingrédients
    customizeDish: "Customize your ingredients",
    customizeSubtitle: "Tap an ingredient to remove it from your dish (e.g. no lettuce, no tomato).",
    yourChoice: "Your choice:",
    specialInstructions: "Special instructions for the kitchen",
    specialSubtitle: "Specify cooking, seasoning preferences or sauce on the side.",
    specialPlaceholder: "E.g. Sauce on the side, well-done meat, less salt...",
    addToBasketWithCount: "Add to Basket",

    // Page d'accueil (Home)
    welcomeWajbati: "Welcome to Wajbati",
    welcomeSubtitle: "Homemade dishes prepared fresh upon order",
    homemadeSpecialty: "HOMEMADE SPECIALTY",
    homemadeBannerTitle: "Craving a delicious homemade meal!",
    homemadeBannerDesc: "Cooked with passion by our local cooks.",
    nowAtOurCooks: "Currently from our cooks",
    algerAndAll: "Algiers & Algeria 🇩🇿",
    chooseWilaya: "Select your Wilaya",

    // Modes de commande & Wilayas
    orderModeModalTitle: "CHOOSE YOUR ORDER MODE",
    orderModeDelivery: "Delivery",
    orderModeDeliverySub: "Fast delivery to your doorstep with a courier",
    orderModePickup: "Click & Collect",
    orderModePickupSub: "Pick up directly from the cook",
    orderModeDineIn: "Dine-in / At table",
    orderModeDineInSub: "Enjoy your meal directly on-site",
    validate: "Confirm",
    allWilayas: "All Wilayas (All Algeria)",
    searchWilayaPlaceholder: "Search by name or number (e.g. 16, Oran)...",

    // Écran Plus & Paramètres
    guestMode: "Guest Mode",
    guestModeDesc: "Sign in or sign up to enjoy the full Wajbati experience.",
    verifiedAccount: "Verified Account",
    welcomeSpace: "Welcome to your Wajbati account.",
    editProfile: "Edit my information",
    manageCookSubtitle: "Manage my dishes and incoming orders",
    becomeCookSubtitle: "Cook and sell your dishes from home",
    becomeRestaurant: "Become a Partner Restaurant",
    becomeRestaurantSub: "Register restaurant with Trade Register & GPS",
    mySettings: "My Settings",
    personalData: "Personal Data Management",
    locationSettings: "Location & Wilaya Management",
    generalInfo: "General Information",
    helpSupport: "Help & Support Wajbati",
    aboutAlertTitle: "About Wajbati",
    aboutAlertDesc: "Wajbati (وجبتي) is Algeria's leading food delivery platform for homemade and traditional meals prepared with love.",
    logoutConfirmTitle: "Sign Out",
    logoutConfirmMsg: "Are you sure you want to sign out?",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState("fr"); // 'fr', 'ar', 'en'

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved && (saved === "fr" || saved === "ar" || saved === "en")) {
          setLanguageState(saved);
        }
      } catch (e) {
        console.warn("Erreur chargement langue:", e);
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
        console.warn("Erreur sauvegarde langue:", e);
      }
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  // Formatage officiel du Dinar Algérien
  const formatPrice = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return language === "ar" ? "0 د.ج" : "0 DA";
    }
    const num = Number(amount);
    // Si nombre entier, pas de décimale inutile; sinon 2 décimales
    const formattedNum = Number.isInteger(num) ? num.toString() : num.toFixed(2);
    if (language === "ar") {
      return `${formattedNum} د.ج`;
    }
    return `${formattedNum} DA`;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatPrice,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

