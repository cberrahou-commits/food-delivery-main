const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCHWynUsudT89nbd4XaRTHsajjlxL-WmNs",
  authDomain: "food-delivery-prod-b474f.firebaseapp.com",
  projectId: "food-delivery-prod-b474f",
  storageBucket: "food-delivery-prod-b474f.firebasestorage.app",
  messagingSenderId: "203999238087",
  appId: "1:203999238087:web:5bb682b683710032926be2",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedSimulationData() {
  console.log("===============================================================");
  console.log(" 🚀 Seed Wajbati : Établissements, Cuisiniers & Menus (Algérie)");
  console.log("===============================================================\n");

  // 1. Catégories Culinaires Wajbati
  console.log("[1/4] Enregistrement des catégories culinaires...");
  const categories = [
    {
      id: "burger",
      name: "Burgers & Sandwichs",
      shortName: "Burgers",
      icon: "🍔",
      description: "Burgers gourmands, pains briochés et sandwichs chauds",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    },
    {
      id: "pizza",
      name: "Pizzas Artisanales",
      shortName: "Pizzas",
      icon: "🍕",
      description: "Pizzas au feu de bois, pâte fine et ingrédients frais",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
    },
    {
      id: "traditionnel",
      name: "Plats Traditionnels",
      shortName: "Traditionnel",
      icon: "🍲",
      description: "Couscous, Tajines, Rechta, Chakhchoukha et saveurs du terroir",
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400",
    },
    {
      id: "tacos",
      name: "Tacos & Fast-Food",
      shortName: "Tacos",
      icon: "🌯",
      description: "French tacos, paninis et wraps généreux",
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    },
    {
      id: "pates",
      name: "Pâtes & Gratins",
      shortName: "Pâtes",
      icon: "🍝",
      description: "Gratins dorés, lasagnes et pâtes fraîches",
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400",
    },
    {
      id: "salades",
      name: "Salades & Entrées",
      shortName: "Salades",
      icon: "🥗",
      description: "Salades composées fraîches, boureks et soupes",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
    },
    {
      id: "desserts",
      name: "Desserts & Pâtisseries",
      shortName: "Desserts",
      icon: "🍰",
      description: "Gâteaux traditionnels (Baklawa, Makrout), tartes et douceurs",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400",
    },
    {
      id: "boissons",
      name: "Boissons & Jus Frais",
      shortName: "Boissons",
      icon: "🥤",
      description: "Sodas algériens, jus d'orange pressé, thé à la menthe",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400",
    },
  ];

  for (const cat of categories) {
    await setDoc(doc(db, "categories", cat.id), cat);
  }
  console.log(`  ✓ ${categories.length} catégories enregistrées.\n`);

  // 2. Établissements (Restaurants & Cuisiniers à Domicile)
  console.log("[2/4] Création des Établissements (Restaurants & Cuisiniers)...");
  const establishments = [
    // RESTAURANT 1 (Principal - lié au Restaurant Dashboard Next.js)
    {
      id: "5IdiasERdP0Xq0otooZn",
      name: "Wajbati Gourmet Burger & Grill",
      title: "Wajbati Gourmet Burger & Grill",
      genre: "Burgers & Sandwichs",
      description: "Burgers artisanaux cuits à la flamme, pains boulangers et sauces maison secrètes.",
      address: "12 Rue Didouche Mourad, Alger Centre",
      wilaya: "Alger",
      wilayaCode: "16",
      phone: "0550 12 34 56",
      phoneNumber: "0550 12 34 56",
      lat: 36.7684,
      lng: 3.0533,
      rating: 4.9,
      minDeliveryTime: 20,
      maxDeliveryTime: 35,
      type: "restaurant",
      isCook: false,
      isHomemade: false,
      isHomeCook: false,
      isVerified: true,
      status: "APPROVED",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      exteriorImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      interiorImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      rcDocument: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
      createdAt: serverTimestamp(),
    },
    // RESTAURANT 2 (Pizzeria Italienne & Feu de Bois)
    {
      id: "resto_romana_alger",
      name: "Pizzeria Romana Express",
      title: "Pizzeria Romana Express",
      genre: "Pizzas Artisanales",
      description: "Véritables pizzas au feu de bois, pâte maturée 48h et mozzarella di bufala.",
      address: "24 Boulevard du 11 Décembre, Hydra, Alger",
      wilaya: "Alger",
      wilayaCode: "16",
      phone: "0560 98 76 54",
      phoneNumber: "0560 98 76 54",
      lat: 36.7451,
      lng: 3.0382,
      rating: 4.85,
      minDeliveryTime: 25,
      maxDeliveryTime: 40,
      type: "restaurant",
      isCook: false,
      isHomemade: false,
      isHomeCook: false,
      isVerified: true,
      status: "APPROVED",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
      exteriorImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
      interiorImage: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800",
      rcDocument: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
      createdAt: serverTimestamp(),
    },
    // RESTAURANT 3 (Dar El Dey - Plats Traditionnels Algérois)
    {
      id: "resto_dar_el_dey",
      name: "Restaurant Dar El Dey",
      title: "Restaurant Dar El Dey",
      genre: "Plats Traditionnels",
      description: "Haute gastronomie algéroise dans la tradition : Couscous d'agneau, Rechta, Tajines et Boureks.",
      address: "5 Rue des Frères Bouadou, Bir Mourad Raïs, Alger",
      wilaya: "Alger",
      wilayaCode: "16",
      phone: "0770 45 67 89",
      phoneNumber: "0770 45 67 89",
      lat: 36.7321,
      lng: 3.0512,
      rating: 4.95,
      minDeliveryTime: 30,
      maxDeliveryTime: 50,
      type: "restaurant",
      isCook: false,
      isHomemade: false,
      isHomeCook: false,
      isVerified: true,
      status: "APPROVED",
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800",
      exteriorImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
      interiorImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      rcDocument: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
      createdAt: serverTimestamp(),
    },

    // CUISINIER À DOMICILE 1 (Khadidja Cuisine Kouba)
    {
      id: "kitchen_khadidja_kouba",
      name: "Khadidja Cuisine Traditionnelle",
      title: "Khadidja Cuisine Traditionnelle",
      genre: "Plats Traditionnels",
      description: "Plats préparés à la maison avec des ingrédients frais du marché local. Recettes de famille généreuses.",
      address: "Quartier Ben Omar, Kouba, Alger",
      wilaya: "Alger",
      wilayaCode: "16",
      phone: "0661 22 33 44",
      phoneNumber: "0661 22 33 44",
      lat: 36.7265,
      lng: 3.0841,
      rating: 4.98,
      minDeliveryTime: 35,
      maxDeliveryTime: 55,
      type: "cook",
      isCook: true,
      isHomemade: true,
      isHomeCook: true,
      isVerified: true,
      status: "APPROVED",
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800",
      interiorImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
      idCardDocument: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
      createdAt: serverTimestamp(),
    },

    // CUISINIER À DOMICILE 2 (Chef Yasmine Saveurs & Tajines)
    {
      id: "kitchen_yasmine_alger",
      name: "Chef Yasmine - Saveurs & Tajines",
      title: "Chef Yasmine - Saveurs & Tajines",
      genre: "Plats Traditionnels",
      description: "Tajines parfumés aux épices du sud, douceurs orientales et pâtisseries faites maison.",
      address: "Bab El Oued, Alger",
      wilaya: "Alger",
      wilayaCode: "16",
      phone: "0670 11 22 33",
      phoneNumber: "0670 11 22 33",
      lat: 36.7891,
      lng: 3.0519,
      rating: 4.92,
      minDeliveryTime: 30,
      maxDeliveryTime: 50,
      type: "cook",
      isCook: true,
      isHomemade: true,
      isHomeCook: true,
      isVerified: true,
      status: "APPROVED",
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=800",
      interiorImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
      idCardDocument: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
      createdAt: serverTimestamp(),
    },

    // RESTAURANT EN ATTENTE DE VÉRIFICATION (Pour tester le Web Dashboard)
    {
      id: "resto_pending_oran",
      name: "Le Ksar d'Oran (En Attente)",
      title: "Le Ksar d'Oran (En Attente)",
      genre: "Burgers & Fast Food",
      description: "Dossier en attente de vérification par l'administrateur Wajbati.",
      address: "Front de Mer, Oran",
      wilaya: "Oran",
      wilayaCode: "31",
      phone: "0555 77 88 99",
      phoneNumber: "0555 77 88 99",
      lat: 35.7051,
      lng: -0.6382,
      rating: 5.0,
      minDeliveryTime: 25,
      maxDeliveryTime: 40,
      type: "restaurant",
      isCook: false,
      isHomemade: false,
      isHomeCook: false,
      isVerified: false,
      status: "PENDING_VERIFICATION",
      image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      exteriorImage: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
      interiorImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
      rcDocument: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800",
      createdAt: serverTimestamp(),
    },

    // CUISINIER EN ATTENTE DE VÉRIFICATION (Pour tester le Web Dashboard)
    {
      id: "cook_pending_constantine",
      name: "Nadia Saveurs Cirta (En Attente)",
      title: "Nadia Saveurs Cirta (En Attente)",
      genre: "Plats Traditionnels",
      description: "Cuisine à domicile constantinoise en cours d'audit.",
      address: "Bellevue, Constantine",
      wilaya: "Constantine",
      wilayaCode: "25",
      phone: "0660 33 44 55",
      phoneNumber: "0660 33 44 55",
      lat: 36.365,
      lng: 6.6147,
      rating: 5.0,
      minDeliveryTime: 30,
      maxDeliveryTime: 45,
      type: "cook",
      isCook: true,
      isHomemade: true,
      isHomeCook: true,
      isVerified: false,
      status: "PENDING_VERIFICATION",
      image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
      interiorImage: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800",
      idCardDocument: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800",
      createdAt: serverTimestamp(),
    },
  ];

  for (const est of establishments) {
    await setDoc(doc(db, "restaurants", est.id), est);
    console.log(`  ✓ Établissement créé : ${est.name} [${est.status}]`);
  }
  console.log("");

  // 3. Menus et Plats Catégorisés avec Ingrédients Personnalisables
  console.log("[3/4] Création des Menus & Plats avec Ingrédients Personnalisables...");
  const dishes = [
    // PLATS POUR "5IdiasERdP0Xq0otooZn" (Wajbati Gourmet Burger)
    {
      id: "dish_cheeseburger_smash",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "burger",
      name: "Cheeseburger Gourmand Smash",
      description: "Steak de bœuf smashé, double cheddar fondant, salade croquante, tomate fraîche et oignons caramélisés.",
      price: 650, // DZD
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600",
      customizableIngredients: [
        "Salade",
        "Tomate",
        "Oignons",
        "Cornichons",
        "Fromage cheddar",
        "Sauce burger",
      ],
    },
    {
      id: "dish_crispy_chicken_burger",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "burger",
      name: "Burger Poulet Crispy Maison",
      description: "Filet de poulet croustillant pané aux épices, salade, tomate fraîche et mayonnaise relevée.",
      price: 600, // DZD
      image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600",
      customizableIngredients: [
        "Salade",
        "Tomate",
        "Sauce mayonnaise",
        "Fromage cheddar",
        "Cornichons",
      ],
    },
    {
      id: "dish_bbq_smash_double",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "burger",
      name: "Double Bacon Halal BBQ Burger",
      description: "Deux steaks de bœuf 150g, tranches de bacon de bœuf halal grillé, sauce barbecue fumée, oignons frits.",
      price: 850, // DZD
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600",
      customizableIngredients: [
        "Salade",
        "Tomate",
        "Oignons",
        "Sauce burger",
        "Fromage cheddar",
      ],
    },
    {
      id: "dish_tacos_lyonnais",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "tacos",
      name: "Tacos Double Viande (Poulet & Viande Hachée)",
      description: "Galette toastée généreuse, sauce fromagère onctueuse maison, frites dorées, poulet mariné et bœuf.",
      price: 700, // DZD
      image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600",
      customizableIngredients: [
        "Sauce fromagère",
        "Frites à l'intérieur",
        "Oignons",
        "Sauce algérienne",
      ],
    },
    {
      id: "dish_frites_paprika",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "burger",
      name: "Grande Portion de Frites Maison au Paprika",
      description: "Pommes de terre fraîches coupées à la main, frites dans une huile propre et assaisonnées au paprika doux.",
      price: 250, // DZD
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600",
      customizableIngredients: ["Sauce mayonnaise", "Sauce burger"],
    },
    {
      id: "dish_hamoud_boualem",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      category: "boissons",
      name: "Hamoud Boualem Sélecto 33cl",
      description: "La boisson gazeuse algérienne mythique au goût caramel unique, servie très fraîche.",
      price: 120, // DZD
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600",
      customizableIngredients: [],
    },

    // PLATS POUR "resto_romana_alger" (Pizzeria Romana Express)
    {
      id: "dish_pizza_margherita",
      restaurantId: "resto_romana_alger",
      category: "pizza",
      name: "Pizza Margherita Di Bufala",
      description: "Sauce tomate San Marzano, mozzarella fondante, feuilles de basilic frais et filet d'huile d'olive.",
      price: 750, // DZD
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600",
      customizableIngredients: [
        "Sauce tomate",
        "Fromage mozzarella",
        "Origan",
        "Olives noires",
      ],
    },
    {
      id: "dish_pizza_4fromages",
      restaurantId: "resto_romana_alger",
      category: "pizza",
      name: "Pizza 4 Fromages au Feu de Bois",
      description: "Mozzarella, gorgonzola, emmental et parmesan affiné sur base crème fraîche ou tomate.",
      price: 950, // DZD
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600",
      customizableIngredients: [
        "Fromage mozzarella",
        "Origan",
        "Olives noires",
        "Champignons",
      ],
    },
    {
      id: "dish_pizza_carnivore",
      restaurantId: "resto_romana_alger",
      category: "pizza",
      name: "Pizza Carnivore Viande Hachée & Merguez",
      description: "Généreuse garniture de viande hachée fraîche assaisonnée, merguez artisanales, oignons et poivrons.",
      price: 1100, // DZD
      image: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600",
      customizableIngredients: [
        "Oignons",
        "Sauce tomate",
        "Fromage mozzarella",
        "Olives noires",
      ],
    },
    {
      id: "dish_calzone_soufflee",
      restaurantId: "resto_romana_alger",
      category: "pizza",
      name: "Calzone Soufflée Farcie",
      description: "Pizza pliée en chausson dorée au four, farcie au fromage fondant, dinde fumée et champignons.",
      price: 850, // DZD
      image: "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=600",
      customizableIngredients: [
        "Champignons",
        "Fromage mozzarella",
        "Sauce tomate",
      ],
    },

    // PLATS POUR "resto_dar_el_dey" (Restaurant Dar El Dey - Alger)
    {
      id: "dish_couscous_royal",
      restaurantId: "resto_dar_el_dey",
      category: "traditionnel",
      name: "Couscous Royal Agneau & Poulet Fermier",
      description: "Semoule roulée main, gigot d'agneau fondant, cuisse de poulet dorée, légumes de saison et bouillon parfumé.",
      price: 1300, // DZD
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600",
      customizableIngredients: [
        "Pois chiches",
        "Légumes",
        "Piment fort",
        "Coriandre fraîche",
        "Oignons frits",
      ],
    },
    {
      id: "dish_rechta_algeroise",
      restaurantId: "resto_dar_el_dey",
      category: "traditionnel",
      name: "Rechta Algéroise Sauce Blanche",
      description: "Pâtes fines artisanales algéroises cuites à la vapeur, poulet tendre, navets fondants et cannelle de Ceylan.",
      price: 1100, // DZD
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600",
      customizableIngredients: [
        "Pois chiches",
        "Légumes",
        "Coriandre fraîche",
      ],
    },
    {
      id: "dish_tajine_zitoun",
      restaurantId: "resto_dar_el_dey",
      category: "traditionnel",
      name: "Tajine Zitoun au Veau & Champignons",
      description: "Morceaux de veau mijotés, olives vertes déssalées avec soin, rondelles de carottes et sauce safranée onctueuse.",
      price: 1200, // DZD
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600",
      customizableIngredients: [
        "Légumes",
        "Pois chiches",
        "Coriandre fraîche",
      ],
    },
    {
      id: "dish_chorba_bourek",
      restaurantId: "resto_dar_el_dey",
      category: "salades",
      name: "Chorba Frik Traditionnelle & 2 Boureks Viande",
      description: "Soupe de blé concassé vert à l'agneau et coriandre, accompagnée de 2 boureks croustillants viande hachée.",
      price: 750, // DZD
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600",
      customizableIngredients: [
        "Coriandre fraîche",
        "Oignons",
      ],
    },

    // PLATS POUR "kitchen_khadidja_kouba" (Cuisinière Maison Khadidja)
    {
      id: "dish_chakhchoukha_biskra",
      restaurantId: "kitchen_khadidja_kouba",
      category: "traditionnel",
      name: "Chakhchoukha de Biskra Authentique",
      description: "Feuilles de rougeg faites maison effeuillées, sauce rouge relevée au ras-el-hanout biskri et bœuf fondant.",
      price: 950, // DZD
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600",
      customizableIngredients: [
        "Piment fort",
        "Pois chiches",
        "Sauce",
        "Oignons frits",
      ],
    },
    {
      id: "dish_trida_maison",
      restaurantId: "kitchen_khadidja_kouba",
      category: "traditionnel",
      name: "Trida Constantinoise au Poulet & Beurre Fermier",
      description: "Petits carrés de pâte confectionnés à la main, cuits à la vapeur, garnis de poulet doré, pois chiches et œufs durs.",
      price: 1000, // DZD
      image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600",
      customizableIngredients: [
        "Pois chiches",
        "Légumes",
        "Sauce",
      ],
    },
    {
      id: "dish_makrout_miel",
      restaurantId: "kitchen_khadidja_kouba",
      category: "desserts",
      name: "Boîte de 6 Makrouts Artisanaux au Miel Pur",
      description: "Semoule fine pur beurre, pâte de dattes (Ghers) parfumée à la cannelle et fleur d'oranger, trempés dans le miel pur.",
      price: 600, // DZD
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      customizableIngredients: [],
    },

    // PLATS POUR "kitchen_yasmine_alger" (Cuisinière Maison Yasmine)
    {
      id: "dish_lham_lahlou",
      restaurantId: "kitchen_yasmine_alger",
      category: "traditionnel",
      name: "Tajine Lham Lahlou aux Pruneaux & Amandes",
      description: "Plat festif sucré-salé, viande d'agneau tendre, pruneaux moelleux, abricots secs, amandes effilées et fleur d'oranger.",
      price: 1250, // DZD
      image: "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=600",
      customizableIngredients: [
        "Sauce",
        "Coriandre fraîche",
      ],
    },
    {
      id: "dish_mtewem_algerois",
      restaurantId: "kitchen_yasmine_alger",
      category: "traditionnel",
      name: "Mtewem Algérois Boulettes d'Agneau & Amandes",
      description: "Boulettes fondantes d'agneau parfumé à l'ail et cumin, morceaux de viande, pois chiches et amandes dorées.",
      price: 1150, // DZD
      image: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600",
      customizableIngredients: [
        "Pois chiches",
        "Sauce",
        "Coriandre fraîche",
      ],
    },
    {
      id: "dish_baklawa_amandes",
      restaurantId: "kitchen_yasmine_alger",
      category: "desserts",
      name: "Plateau de Baklawa Algéroise aux Amandes (4 pcs)",
      description: "Pâte feuilletée croustillante, farce riche aux amandes algériennes et eau de rose, dorée au miel.",
      price: 550, // DZD
      image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600",
      customizableIngredients: [],
    },
  ];

  for (const d of dishes) {
    await setDoc(doc(db, "dishes", d.id), d);
    console.log(`  ✓ Plat créé : ${d.name} (${d.price} DZD)`);
  }
  console.log(`\n  ✓ ${dishes.length} plats créés avec options de personnalisation d'ingrédients.`);

  console.log("\n===============================================================");
  console.log(" 🎉 Base de données initialisée avec succès !");
  console.log(" • 5 Établissements vérifiés & actifs (Restaurants + Cuisiniers)");
  console.log(" • 2 Établissements en attente de validation (Pour le Web Dashboard)");
  console.log(" • Menus catégorisés avec exclusion d'ingrédients (ex: sans salade et tomate)");
  console.log("===============================================================\n");
}

seedSimulationData()
  .then(() => {
    console.log("Script terminé avec succès.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Erreur d'exécution du seed:", err);
    process.exit(1);
  });

