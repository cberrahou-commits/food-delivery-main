// Liste unifiée des catégories culinaires pour Wajbati (Restaurants & Cuisiniers à domicile)
export const FOOD_CATEGORIES = [
  {
    id: "burger",
    name: "Burgers & Sandwichs",
    shortName: "Burgers",
    icon: "🍔",
    description: "Burgers gourmands, pains briochés et sandwichs chauds",
    defaultIngredients: [
      "Salade",
      "Tomate",
      "Oignons",
      "Cornichons",
      "Fromage cheddar",
      "Sauce burger",
      "Sauce mayonnaise",
    ],
  },
  {
    id: "pizza",
    name: "Pizzas Artisanales",
    shortName: "Pizzas",
    icon: "🍕",
    description: "Pizzas au feu de bois, pâte fine et ingrédients frais",
    defaultIngredients: [
      "Sauce tomate",
      "Fromage mozzarella",
      "Olives noires",
      "Champignons",
      "Origan",
      "Oignons",
    ],
  },
  {
    id: "traditionnel",
    name: "Plats Traditionnels",
    shortName: "Traditionnel",
    icon: "🍲",
    description: "Couscous, Tajines, Rechta, Chakhchoukha et saveurs du terroir",
    defaultIngredients: [
      "Pois chiches",
      "Légumes",
      "Sauce",
      "Piment fort",
      "Coriandre fraîche",
      "Oignons frits",
    ],
  },
  {
    id: "tacos",
    name: "Tacos & Fast-Food",
    shortName: "Tacos",
    icon: "🌯",
    description: "French tacos, paninis et wraps généreux",
    defaultIngredients: [
      "Sauce fromagère",
      "Frites à l'intérieur",
      "Salade",
      "Tomate",
      "Oignons",
      "Sauce algérienne",
      "Sauce samouraï",
    ],
  },
  {
    id: "pates",
    name: "Pâtes & Gratins",
    shortName: "Pâtes",
    icon: "🍝",
    description: "Gratins dorés, lasagnes et pâtes fraîches",
    defaultIngredients: [
      "Fromage râpé",
      "Sauce crémeuse",
      "Ail",
      "Persil frais",
      "Champignons",
    ],
  },
  {
    id: "salades",
    name: "Salades & Entrées",
    shortName: "Salades",
    icon: "🥗",
    description: "Salades composées fraîches, boureks et soupes",
    defaultIngredients: [
      "Vinaigrette",
      "Oignons",
      "Olives",
      "Concombre",
      "Maïs",
    ],
  },
  {
    id: "desserts",
    name: "Desserts & Pâtisseries",
    shortName: "Desserts",
    icon: "🍰",
    description: "Gâteaux traditionnels (Baklawa, Makrout), tartes et douceurs",
    defaultIngredients: [
      "Sucre glace",
      "Miel",
      "Amandes / Noix",
      "Cannelle",
    ],
  },
  {
    id: "boissons",
    name: "Boissons & Jus Frais",
    shortName: "Boissons",
    icon: "🥤",
    description: "Jus d'orange pressé, sodas et boissons fraîches",
    defaultIngredients: [
      "Glaçons",
      "Rondelle de citron",
      "Menthe fraîche",
    ],
  },
];

// Helper pour retrouver les ingrédients par défaut selon la catégorie ou le nom du plat
export const getDefaultIngredientsForDish = (dish) => {
  if (dish?.customizableIngredients && Array.isArray(dish.customizableIngredients) && dish.customizableIngredients.length > 0) {
    return dish.customizableIngredients;
  }
  if (dish?.ingredients && Array.isArray(dish.ingredients) && dish.ingredients.length > 0) {
    return dish.ingredients;
  }
  if (typeof dish?.ingredients === "string" && dish.ingredients.trim()) {
    return dish.ingredients.split(",").map((s) => s.trim()).filter(Boolean);
  }

  const catId = (dish?.category || "").toLowerCase();
  const nameLower = (dish?.name || "").toLowerCase();

  if (catId.includes("burger") || nameLower.includes("burger") || nameLower.includes("sandwich")) {
    return FOOD_CATEGORIES.find((c) => c.id === "burger").defaultIngredients;
  }
  if (catId.includes("pizza") || nameLower.includes("pizza")) {
    return FOOD_CATEGORIES.find((c) => c.id === "pizza").defaultIngredients;
  }
  if (catId.includes("tacos") || nameLower.includes("tacos") || nameLower.includes("wrap")) {
    return FOOD_CATEGORIES.find((c) => c.id === "tacos").defaultIngredients;
  }
  if (catId.includes("tradition") || nameLower.includes("couscous") || nameLower.includes("tajine") || nameLower.includes("rechta")) {
    return FOOD_CATEGORIES.find((c) => c.id === "traditionnel").defaultIngredients;
  }
  if (catId.includes("pate") || catId.includes("gratin") || nameLower.includes("gratin") || nameLower.includes("lasagne")) {
    return FOOD_CATEGORIES.find((c) => c.id === "pates").defaultIngredients;
  }
  if (catId.includes("salade") || nameLower.includes("salade")) {
    return FOOD_CATEGORIES.find((c) => c.id === "salades").defaultIngredients;
  }
  if (catId.includes("boisson") || catId.includes("jus") || nameLower.includes("jus")) {
    return FOOD_CATEGORIES.find((c) => c.id === "boissons").defaultIngredients;
  }

  // Par défaut pour tout plat salé :
  return ["Sauce", "Oignons", "Épices fortes", "Sel"];
};
