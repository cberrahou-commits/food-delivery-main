// Liste unifiée des catégories culinaires pour Wajbati (Restaurants & Cuisiniers à domicile)
export const FOOD_CATEGORIES = [
  {
    id: "burger",
    name: "Burgers & Sandwichs",
    shortName: "Burgers",
    icon: "🍔",
    description: "Burgers gourmands, pains briochés et sandwichs chauds",
    nameI18n: {
      fr: "Burgers & Sandwichs",
      ar: "برغر وساندويتشات",
      en: "Burgers & Sandwiches",
    },
    shortNameI18n: {
      fr: "Burgers",
      ar: "برغر",
      en: "Burgers",
    },
    descriptionI18n: {
      fr: "Burgers gourmands, pains briochés et sandwichs chauds",
      ar: "برغر لذيذ بخبز البريوش وساندويتشات ساخنة",
      en: "Gourmet burgers, brioche buns, and hot sandwiches",
    },
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
    nameI18n: {
      fr: "Pizzas Artisanales",
      ar: "بيتزا تقليدية وعصرية",
      en: "Artisanal Pizzas",
    },
    shortNameI18n: {
      fr: "Pizzas",
      ar: "بيتزا",
      en: "Pizzas",
    },
    descriptionI18n: {
      fr: "Pizzas au feu de bois, pâte fine et ingrédients frais",
      ar: "بيتزا على الحطب بعجينة طازجة ومكونات فاخرة",
      en: "Wood-fired pizzas with thin crust and fresh ingredients",
    },
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
    nameI18n: {
      fr: "Plats Traditionnels",
      ar: "أطباق تقليدية جزائرية",
      en: "Traditional Dishes",
    },
    shortNameI18n: {
      fr: "Traditionnel",
      ar: "تقليدي",
      en: "Traditional",
    },
    descriptionI18n: {
      fr: "Couscous, Tajines, Rechta, Chakhchoukha et saveurs du terroir",
      ar: "كسكسي، طواجن، رشتة، شخشوخة وأصالة الطبخ الجزائري",
      en: "Couscous, Tajines, Rechta, Chakhchoukha and authentic local dishes",
    },
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
    nameI18n: {
      fr: "Tacos & Fast-Food",
      ar: "تاكوس ووجبات سريعة",
      en: "Tacos & Fast Food",
    },
    shortNameI18n: {
      fr: "Tacos",
      ar: "تاكوس",
      en: "Tacos",
    },
    descriptionI18n: {
      fr: "French tacos, paninis et wraps généreux",
      ar: "تاكوس فرنسي، بانيني وراب محشو ولذيذ",
      en: "French tacos, paninis and generous wraps",
    },
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
    nameI18n: {
      fr: "Pâtes & Gratins",
      ar: "عجائن وغراتان",
      en: "Pasta & Gratins",
    },
    shortNameI18n: {
      fr: "Pâtes",
      ar: "عجائن",
      en: "Pasta",
    },
    descriptionI18n: {
      fr: "Gratins dorés, lasagnes et pâtes fraîches",
      ar: "غراتان شهي، لازانيا ومكرونة طازجة",
      en: "Golden gratins, lasagna and fresh pasta",
    },
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
    nameI18n: {
      fr: "Salades & Entrées",
      ar: "سلطات ومقبلات",
      en: "Salads & Appetizers",
    },
    shortNameI18n: {
      fr: "Salades",
      ar: "سلطات",
      en: "Salads",
    },
    descriptionI18n: {
      fr: "Salades composées fraîches, boureks et soupes",
      ar: "سلطات طازجة مشكلة، بوراك مقرمش وشوربات",
      en: "Fresh mixed salads, crispy boureks and soups",
    },
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
    nameI18n: {
      fr: "Desserts & Pâtisseries",
      ar: "حلويات وتحليات",
      en: "Desserts & Pastries",
    },
    shortNameI18n: {
      fr: "Desserts",
      ar: "حلويات",
      en: "Desserts",
    },
    descriptionI18n: {
      fr: "Gâteaux traditionnels (Baklawa, Makrout), tartes et douceurs",
      ar: "حلويات تقليدية (بقلاوة، مقروط)، تورتات وتحليات منزلية",
      en: "Traditional pastries (Baklawa, Makrout), tarts and sweets",
    },
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
    nameI18n: {
      fr: "Boissons & Jus Frais",
      ar: "مشروبات وعصائر طازجة",
      en: "Drinks & Fresh Juices",
    },
    shortNameI18n: {
      fr: "Boissons",
      ar: "مشروبات",
      en: "Drinks",
    },
    descriptionI18n: {
      fr: "Jus d'orange pressé, sodas et boissons fraîches",
      ar: "عصائر طبيعية طازجة، مشروبات غازية ومياه معدنية",
      en: "Freshly squeezed juice, sodas and cold drinks",
    },
    defaultIngredients: [
      "Glaçons",
      "Rondelle de citron",
      "Menthe fraîche",
    ],
  },
];

// Helper pour le nom de catégorie traduit
export const getCategoryName = (categoryOrId, lang = "fr") => {
  const cat = typeof categoryOrId === "string"
    ? FOOD_CATEGORIES.find((c) => c.id === categoryOrId)
    : categoryOrId;
  if (!cat) return categoryOrId || "";
  if (cat.nameI18n?.[lang]) return cat.nameI18n[lang];
  return cat.name;
};

// Helper pour le nom court traduit
export const getCategoryShortName = (categoryOrId, lang = "fr") => {
  const cat = typeof categoryOrId === "string"
    ? FOOD_CATEGORIES.find((c) => c.id === categoryOrId)
    : categoryOrId;
  if (!cat) return categoryOrId || "";
  if (cat.shortNameI18n?.[lang]) return cat.shortNameI18n[lang];
  return cat.shortName || cat.name;
};

// Helper pour la description de catégorie traduite
export const getCategoryDescription = (categoryOrId, lang = "fr") => {
  const cat = typeof categoryOrId === "string"
    ? FOOD_CATEGORIES.find((c) => c.id === categoryOrId)
    : categoryOrId;
  if (!cat) return "";
  if (cat.descriptionI18n?.[lang]) return cat.descriptionI18n[lang];
  return cat.description || "";
};

// Dictionnaire multilingue pour les ingrédients personnalisables
export const INGREDIENT_TRANSLATIONS = {
  "Salade": { fr: "Salade", ar: "سلطة", en: "Lettuce" },
  "Tomate": { fr: "Tomate", ar: "طماطم", en: "Tomato" },
  "Tomates fraîches": { fr: "Tomates fraîches", ar: "طماطم طازجة", en: "Fresh tomatoes" },
  "Oignons": { fr: "Oignons", ar: "بصل", en: "Onions" },
  "Oignons caramélisés": { fr: "Oignons caramélisés", ar: "بصل مكرمل", en: "Caramelized onions" },
  "Oignons frits": { fr: "Oignons frits", ar: "بصل مقلي", en: "Fried onions" },
  "Cornichons": { fr: "Cornichons", ar: "مخلل", en: "Pickles" },
  "Cheddar": { fr: "Cheddar", ar: "جبن شيدر", en: "Cheddar cheese" },
  "Fromage cheddar": { fr: "Fromage cheddar", ar: "جبن شيدر", en: "Cheddar cheese" },
  "Mozzarella": { fr: "Mozzarella", ar: "جبن موزاريلا", en: "Mozzarella cheese" },
  "Fromage mozzarella": { fr: "Fromage mozzarella", ar: "جبن موزاريلا", en: "Mozzarella cheese" },
  "Parmesan": { fr: "Parmesan", ar: "جبن بارميزان", en: "Parmesan cheese" },
  "Fromage râpé": { fr: "Fromage râpé", ar: "جبن مبشور", en: "Grated cheese" },
  "Sauce burger": { fr: "Sauce burger", ar: "صلصة البرغر", en: "Burger sauce" },
  "Sauce mayonnaise": { fr: "Sauce mayonnaise", ar: "صلصة المايونيز", en: "Mayonnaise" },
  "Sauce algérienne": { fr: "Sauce algérienne", ar: "صلصة جزائرية", en: "Algerian sauce" },
  "Sauce samouraï": { fr: "Sauce samouraï", ar: "صلصة ساموراي", en: "Samurai sauce" },
  "Sauce fromagère": { fr: "Sauce fromagère", ar: "صلصة الجبن", en: "Cheese sauce" },
  "Sauce cheddar": { fr: "Sauce cheddar", ar: "صلصة الشيدر", en: "Cheddar sauce" },
  "Sauce ranch": { fr: "Sauce ranch", ar: "صلصة رانش", en: "Ranch sauce" },
  "Sauce BBQ": { fr: "Sauce BBQ", ar: "صلصة باربكيو", en: "BBQ sauce" },
  "Sauce barbecue": { fr: "Sauce barbecue", ar: "صلصة باربكيو", en: "BBQ sauce" },
  "Sauce césar": { fr: "Sauce césar", ar: "صلصة سيزر", en: "Caesar sauce" },
  "Sauce tomate": { fr: "Sauce tomate", ar: "صلصة طماطم", en: "Tomato sauce" },
  "Sauce": { fr: "Sauce", ar: "مرق / صلصة", en: "Sauce / Broth" },
  "Sauce crémeuse": { fr: "Sauce crémeuse", ar: "صلصة كريمة", en: "Creamy sauce" },
  "Frites": { fr: "Frites", ar: "بطاطا مقلية", en: "French fries" },
  "Frites à l'intérieur": { fr: "Frites à l'intérieur", ar: "بطاطا مقلية داخل التاكوس", en: "Fries inside" },
  "Pois chiches": { fr: "Pois chiches", ar: "حمص", en: "Chickpeas" },
  "Légumes": { fr: "Légumes", ar: "خضار", en: "Vegetables" },
  "Piment": { fr: "Piment", ar: "فلفل حار", en: "Chili pepper" },
  "Piments": { fr: "Piments", ar: "فلفل حار", en: "Chili peppers" },
  "Piment fort": { fr: "Piment fort", ar: "فلفل حار", en: "Hot pepper" },
  "Piments doux": { fr: "Piments doux", ar: "فلفل حلو", en: "Sweet peppers" },
  "Jalapeños pimentés": { fr: "Jalapeños pimentés", ar: "فلفل هلابينو حار", en: "Spicy jalapeños" },
  "Coriandre": { fr: "Coriandre", ar: "كزبرة", en: "Coriander" },
  "Coriandre fraîche": { fr: "Coriandre fraîche", ar: "كزبرة طازجة", en: "Fresh coriander" },
  "Persil": { fr: "Persil", ar: "بقدونس", en: "Parsley" },
  "Persil frais": { fr: "Persil frais", ar: "بقدونس طازج", en: "Fresh parsley" },
  "Ail": { fr: "Ail", ar: "ثوم", en: "Garlic" },
  "Basilic": { fr: "Basilic", ar: "ريحان", en: "Basil" },
  "Origan": { fr: "Origan", ar: "زعتر بري", en: "Oregano" },
  "Paprika doux": { fr: "Paprika doux", ar: "بابريكا حلوة", en: "Sweet paprika" },
  "Champignons": { fr: "Champignons", ar: "فطر", en: "Mushrooms" },
  "Olives": { fr: "Olives", ar: "زيتون", en: "Olives" },
  "Olives noires": { fr: "Olives noires", ar: "زيتون أسود", en: "Black olives" },
  "Olives vertes": { fr: "Olives vertes", ar: "زيتون أخضر", en: "Green olives" },
  "Poivrons": { fr: "Poivrons", ar: "فلفل رومي", en: "Bell peppers" },
  "Aubergines": { fr: "Aubergines", ar: "باذنجان", en: "Eggplants" },
  "Courgettes": { fr: "Courgettes", ar: "كوسة (قرعة)", en: "Zucchini" },
  "Concombre": { fr: "Concombre", ar: "خيار", en: "Cucumber" },
  "Maïs": { fr: "Maïs", ar: "ذرة", en: "Corn" },
  "Vinaigrette": { fr: "Vinaigrette", ar: "صلصة تتبيل", en: "Vinaigrette dressing" },
  "Croûtons": { fr: "Croûtons", ar: "قطع خبز محمصة", en: "Croutons" },
  "Oeuf": { fr: "Oeuf", ar: "بيض", en: "Egg" },
  "Merguez": { fr: "Merguez", ar: "مرقاز بلدي", en: "Merguez sausage" },
  "Huile piquante": { fr: "Huile piquante", ar: "زيت حار", en: "Hot chili oil" },
  "Coulis caramel": { fr: "Coulis caramel", ar: "صلصة كراميل", en: "Caramel drizzle" },
  "Coulis de fruits rouges": { fr: "Coulis de fruits rouges", ar: "صلصة التوت البري", en: "Berry coulis" },
  "Sucre glace": { fr: "Sucre glace", ar: "سكر ناعم", en: "Powdered sugar" },
  "Miel": { fr: "Miel", ar: "عسل طبيعي", en: "Honey" },
  "Amandes / Noix": { fr: "Amandes / Noix", ar: "لوز / جوز", en: "Almonds / Walnuts" },
  "Cannelle": { fr: "Cannelle", ar: "قرفة", en: "Cinnamon" },
  "Glaçons": { fr: "Glaçons", ar: "مكعبات ثلج", en: "Ice cubes" },
  "Rondelle de citron": { fr: "Rondelle de citron", ar: "شريحة ليمون", en: "Lemon slice" },
  "Menthe fraîche": { fr: "Menthe fraîche", ar: "نعناع طازج", en: "Fresh mint" },
};

// Traduire un nom d'ingrédient
export const translateIngredient = (ingredient, lang = "fr") => {
  if (!ingredient || typeof ingredient !== "string") return "";
  const trimmed = ingredient.trim();
  const matched = INGREDIENT_TRANSLATIONS[trimmed];
  if (matched && matched[lang]) return matched[lang];

  // Recherche insensible à la casse
  const key = Object.keys(INGREDIENT_TRANSLATIONS).find(
    (k) => k.toLowerCase() === trimmed.toLowerCase()
  );
  if (key && INGREDIENT_TRANSLATIONS[key]?.[lang]) {
    return INGREDIENT_TRANSLATIONS[key][lang];
  }

  return trimmed;
};

// Dictionnaire de traduction des plats les plus populaires et plats témoins de la plateforme
export const DISH_TRANSLATIONS = {
  // Burgers & Fast-food
  "Burger Poulet Crispy Pané Doré": {
    ar: {
      name: "برغر دجاج كريسبي مقرمش",
      description: "فيليه دجاج مقرمش متبل بالبهارات اللذيذة، جبن شيدر ذائب، سلطة وصوص مايونيز متبل.",
    },
    en: {
      name: "Golden Crispy Chicken Burger",
      description: "Crispy chicken breast marinated in mild spices, melted cheddar, lettuce and pepper mayo.",
    },
  },
  "Le Méga Palmier Triple Steaks (3x100g)": {
    ar: {
      name: "ميغا برغر ثلاث طبقات لحم مشوي (3×100غ)",
      description: "ثلاث قطع لحم بقر صافي مشوية على اللهب، ثلاث شرائح شيدر، بصل مكرمل وصلصة باربكيو مدخنة.",
    },
    en: {
      name: "Mega Triple Flame Burger (3x100g)",
      description: "Three flame-grilled pure beef patties, triple cheddar, caramelized onions and smoked BBQ sauce.",
    },
  },
  "Tacos Lyonnais Cordon Bleu & Viande Hachée": {
    ar: {
      name: "تاكوس ليوني بالكوردون بلو واللحم المفروم",
      description: "خبز تورتيلا محمص محشو بالكوردون بلو، لحم مفروم مبهر، بطاطا مقلية وصلصة الجبن المنزلية الشهية.",
    },
    en: {
      name: "Lyonnais Tacos Cordon Bleu & Minced Beef",
      description: "Toasted tortilla filled with crispy cordon bleu, seasoned minced beef, fries and homemade cheese sauce.",
    },
  },
  "Wrap Poulet Croustillant & Cheddar": {
    ar: {
      name: "راب دجاج كرانشي وشيدر",
      description: "تورتيلا ملفوفة ومحمرة، قطع دجاج كرسبي، طماطم طازجة، سلطة وصلصة رانش اللذيذة.",
    },
    en: {
      name: "Crispy Chicken & Cheddar Wrap",
      description: "Toasted flour tortilla, crispy chicken tenders, fresh tomatoes, lettuce and ranch sauce.",
    },
  },
  "Frites Maison Sauce Cheddar Fondu & Jalapeños": {
    ar: {
      name: "بطاطا مقلية بصلصة الشيدر الذائب والهلابينو",
      description: "طبق شهي من البطاطا المقلية الذهبية الطازجة مغطاة بصلصة الشيدر الساخنة وقطع الهلابينو الحارة.",
    },
    en: {
      name: "Loaded Cheddar & Jalapeño Fries",
      description: "Golden fresh fries smothered in warm creamy cheddar sauce and spicy jalapeño slices.",
    },
  },
  "Salade César Poulet Grillé & Parmesan": {
    ar: {
      name: "سلطة سيزر بالدجاج المشوي والبارميزان",
      description: "سلطة رومانية طازجة، شرائح دجاج مشوي بالأعشاب، قطع خبز محمصة بالثوم وجبن بارميزان مع صلصة سيزر.",
    },
    en: {
      name: "Grilled Chicken Caesar Salad",
      description: "Fresh romaine lettuce, herb-grilled chicken tenders, garlic croutons, parmesan shavings and Caesar dressing.",
    },
  },
  "Tiramisu Maison Spéculoos & Coulis Caramel": {
    ar: {
      name: "تيراميسو منزلي بالبسكويت وصوص الكراميل",
      description: "كريمة الماسكاربوني الخفيفة، بسكويت لوتس مقرمش مشبع وصلصة كراميل الزبدة المملحة الشهية.",
    },
    en: {
      name: "Homemade Speculoos & Caramel Tiramisu",
      description: "Light mascarpone cream, soaked crunchy speculoos biscuits and salted butter caramel coulis.",
    },
  },
  "Hamoud Boualem Sélecto Canette 33cl": {
    ar: {
      name: "حمود بوعلام سيلكتو علبة 33 مل",
      description: "المشروب الغازي الجزائري الأسطوري بنكهة التفاح والكراميل الفريدة.",
    },
    en: {
      name: "Hamoud Boualem Selecto 33cl Can",
      description: "The legendary Algerian soda with its unique caramelized apple flavor.",
    },
  },

  // Pizzas
  "Pizza Diávola Piquante Merguez & Piments": {
    ar: {
      name: "بيتزا ديافولا حارة بالمرقاز والفلفل",
      description: "عجينة إيطالية تقليدية، صلصة طماطم، جبن موزاريلا، شرائح مرقاز مشوي، فلفل وزيت زيتون حار.",
    },
    en: {
      name: "Spicy Diavola Merguez Pizza",
      description: "Hand-stretched dough, San Marzano tomato sauce, fior di latte mozzarella, grilled merguez, peppers and spicy oil.",
    },
  },
  "Pizza Végétarienne Grillée au Feu de Bois": {
    ar: {
      name: "بيتزا نباتية مشوية على الحطب",
      description: "صلصة طماطم منزلية، موزاريلا، فلفل حلو متبل، باذنجان وكوسة مشوية وفطر طازج مع الزعتر.",
    },
    en: {
      name: "Wood-Fired Vegetarian Pizza",
      description: "Homemade tomato sauce, melted mozzarella, roasted bell peppers, grilled zucchini, eggplants and mushrooms.",
    },
  },
  "Calzone Traditionnelle Farcie Soufflée": {
    ar: {
      name: "كالزوني تقليدية محشوة ومنتفخة",
      description: "فطيرة بيتزا ذهبية مطهوة على الحطب، محشوة باللحم المفروم، فطر، بيض وجبن موزاريلا وفير.",
    },
    en: {
      name: "Traditional Stuffed Wood-Fired Calzone",
      description: "Golden folded pizza stuffed with seasoned minced beef, sauteed mushrooms, fresh egg and double mozzarella.",
    },
  },
  "Lasagnes Maison Bolognaise Pur Boeuf": {
    ar: {
      name: "لازانيا منزلية بولونيز بلحم البقر",
      description: "طبقات مكرونة طازجة، صلصة بولونيز مطهوة ببطء بالأعشاب، صلصة بشاميل كريمية وغراتان بارميزان.",
    },
    en: {
      name: "Homemade Beef Bolognese Lasagna",
      description: "Fresh pasta sheets, slow-simmered bolognese sauce with herbs, creamy bechamel and parmesan gratin.",
    },
  },
  "Penne All'Arrabbiata Tomate & Basilic Frais": {
    ar: {
      name: "بيني أرابياتا بصلصة الطماطم الحارة والريحان",
      description: "مكرونة بيني بصلصة الطماطم الحارة مع الثوم المكرمل، فلفل أحمر، زيت زيتون بكر وريحان طازج.",
    },
    en: {
      name: "Penne All'Arrabbiata with Fresh Basil",
      description: "Al dente penne in a spicy tomato sauce with confit garlic, dried chilies, extra virgin olive oil and basil.",
    },
  },
  "Pain à l'Ail Gratiné Mozzarella (Garlic Bread)": {
    ar: {
      name: "خبز بالثوم وغراتان الموزاريلا",
      description: "خبز شاباتا منزلي مدهون بزبدة الثوم والبقدونس، مغطى بجبن الموزاريلا ومحمص في فرن البيتزا.",
    },
    en: {
      name: "Garlic Bread Gratin with Mozzarella",
      description: "Homemade ciabatta bread with garlic-parsley butter, topped with melted mozzarella and toasted in wood oven.",
    },
  },
  "Panna Cotta Vanille Bourbon & Fruits Rouges": {
    ar: {
      name: "بانا كوتا بفانيليا البوربون والفواكه الحمراء",
      description: "حلوى كريمية بنكهة فانيليا مدغشقر، مغطاة بصلصة الفراولة والتوت المنعشة.",
    },
    en: {
      name: "Bourbon Vanilla Panna Cotta with Red Berries",
      description: "Creamy dessert flavored with Madagascar bourbon vanilla, topped with tangy strawberry and raspberry coulis.",
    },
  },
  "Hamoud Boualem Gazouz Blanche Canette 33cl": {
    ar: {
      name: "حمود بوعلام غازوز بيضاء (ليموناد) علبة 33 مل",
      description: "الليموناد الغازية الجزائرية الأصلية المنعشة بنكهة الليمون الطبيعي.",
    },
    en: {
      name: "Hamoud Boualem White Lemonade 33cl Can",
      description: "Authentic refreshing sparkling Algerian white lemonade with natural lemon flavor.",
    },
  },

  // Plats Traditionnels Algériens
  "Couscous Royal Agneau, Poulet & Merguez": {
    ar: {
      name: "كسكسي ملكي بلحم الخروف والدجاج والمرقاز",
      description: "كسكسي مفور على البخار بزيت الزيتون البكر، خضار الموسم الطازجة، مرق أحمر غني ولحم خروف طري ودجاج محمر.",
    },
    en: {
      name: "Royal Couscous with Lamb, Chicken & Merguez",
      description: "Steamed semolina with extra virgin olive oil, fresh garden vegetables, rich flavorful broth and tender meat.",
    },
  },
  "Rechta Algéroise au Poulet Fermier & Navets": {
    ar: {
      name: "رشتة عاصمية بالدجاج البلدي واللفت",
      description: "رشتة طازجة مفورة على البخار ومسقية بمرق أبيض خفيف معطر بالقرفة وعود الطيب، مع دجاج محمر وحمص.",
    },
    en: {
      name: "Algiers Rechta with Free-Range Chicken & Turnips",
      description: "Fresh hand-made steamed thin pasta with cinnamon-scented white broth, sweet turnips and chickpeas.",
    },
  },
  "Chakhchoukha de Biskra à l'Agneau & Piments": {
    ar: {
      name: "شخشوخة بسكرية حارة بلحم الخروف والفلفل",
      description: "رقاق رقيق مقطع ومسقي بمرق بسكري حار ولذيذ، مع قطع لحم الخروف الطري والحمص والفلفل الحار.",
    },
    en: {
      name: "Spicy Biskra Chakhchoukha with Lamb",
      description: "Thin shredded flatbread soaked in a rich spicy tomato broth with tender lamb, chickpeas and green chilies.",
    },
  },
  "Tajine Zitoune au Poulet & Champignons": {
    ar: {
      name: "طاجين زيتون بالدجاج والمشروم",
      description: "طبق تقليدي بالزيتون الأخضر المحلى، جزر، فطر طازج ودجاج متبل بالزعفران والزنجبيل في مرق مخثر.",
    },
    en: {
      name: "Chicken & Mushroom Olive Tajine",
      description: "Traditional savory stew with green olives, sweet carrots, fresh mushrooms and tender chicken in a thick sauce.",
    },
  },
  "Garantita / Karantika Oranaise Chaude au Cumin": {
    ar: {
      name: "كرنتيكا وهرانية ساخنة بالكمون والهريسة",
      description: "الطبق الشعبي الأصيل بدقيق الحمص المخبوز في الفرن، قوام كريمي وطبقة علوية ذهبية مع الكمون والهريسة.",
    },
    en: {
      name: "Hot Oran Karantika with Cumin & Harissa",
      description: "Authentic chickpea flour bake with a creamy center and golden crust, served hot with cumin and harissa.",
    },
  },
  "Chorba Frik Traditionnelle à la Coriandre": {
    ar: {
      name: "شوربة فريك تقليدية بالنعناع والكزبرة",
      description: "شوربة الفريك القمح الأخضر المطحون والمطهوة مع اللحم، الحمص والأعشاب العطرية الطازجة.",
    },
    en: {
      name: "Traditional Freekeh Soup with Fresh Coriander",
      description: "Rich green wheat soup simmered with meat, chickpeas, mint, celery and fresh coriander.",
    },
  },
  "Boureks Algérois Viande Hachée & Fromage (3 pcs)": {
    ar: {
      name: "بوراك عاصمي باللحم المفروم والجبن (3 حبات)",
      description: "أوراق ديول مقرمشة محشوة باللحم المفروم المتبل، البصل، البقدونس والجبن الذائب.",
    },
    en: {
      name: "Crispy Algerian Meat Boureks (3 pcs)",
      description: "Crispy golden pastry rolls stuffed with seasoned minced beef, onion, fresh parsley and melted cheese.",
    },
  },
  "Baklawa Traditionnelle aux Amandes & Miel": {
    ar: {
      name: "بقلاوة تقليدية باللوز والعسل الحر",
      description: "طبقات رقيقة ومقرمشة محشوة باللوز المطحون المعطر بماء الزهر ومسقية بالعسل الصافي.",
    },
    en: {
      name: "Traditional Almond & Honey Baklawa",
      description: "Flaky golden phyllo layers filled with orange blossom scented crushed almonds and pure honey syrup.",
    },
  },
  "Makrout El Louz Fondant au Citron": {
    ar: {
      name: "مقروط اللوز العاصمي يذوب في الفم",
      description: "حلوى اللوز النقية الخالية من الفرينة المعطرة ببشور الليمون الطبيعي والمغلفة بالسكر الناعم.",
    },
    en: {
      name: "Melt-in-Mouth Almond Makrout with Lemon",
      description: "Traditional flourless almond pastry infused with fresh lemon zest and coated in powdered sugar.",
    },
  },
  "Thé à la Menthe Fraîche Traditionnel 25cl": {
    ar: {
      name: "شاي بالنعناع الطازج محضر على الأصول 25 مل",
      description: "شاي أخضر أصيل محضر على الجمر مع أوراق النعناع الطازجة والرغوة المميزة.",
    },
    en: {
      name: "Traditional Fresh Mint Tea 25cl",
      description: "Authentic Algerian green tea brewed with fresh mint leaves and served with traditional foam.",
    },
  },
};

// Helper pour localiser un plat complet (titre et description)
export const getLocalizedDish = (dish, lang = "fr") => {
  if (!dish) return { name: "", description: "" };
  if (lang === "fr") {
    return {
      name: dish.name || "",
      description: dish.description || "",
    };
  }

  // 1. Vérifier si le plat stocke déjà ses traductions dans Firestore
  if (lang === "ar") {
    const arName = dish.nameAr || dish.name_ar;
    const arDesc = dish.descriptionAr || dish.description_ar;
    if (arName) {
      return {
        name: arName,
        description: arDesc || dish.description || "",
      };
    }
  } else if (lang === "en") {
    const enName = dish.nameEn || dish.name_en;
    const enDesc = dish.descriptionEn || dish.description_en;
    if (enName) {
      return {
        name: enName,
        description: enDesc || dish.description || "",
      };
    }
  }

  // 2. Vérifier dans notre dictionnaire de plats connus
  const dName = (dish.name || "").trim();
  const matched = DISH_TRANSLATIONS[dName];
  if (matched && matched[lang]) {
    return {
      name: matched[lang].name || dish.name || "",
      description: matched[lang].description || dish.description || "",
    };
  }

  // 3. Correspondance partielle si le nom commence par une entrée connue
  for (const [key, trans] of Object.entries(DISH_TRANSLATIONS)) {
    if (dName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(dName.toLowerCase())) {
      if (trans[lang]) {
        return {
          name: trans[lang].name || dish.name,
          description: trans[lang].description || dish.description,
        };
      }
    }
  }

  // 4. Repli avec nom d'origine si non traduit
  return {
    name: dish.name || "",
    description: dish.description || "",
  };
};

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
  if (catId.includes("tradition") || nameLower.includes("couscous") || nameLower.includes("tajine") || nameLower.includes("rechta") || nameLower.includes("chakhchoukha")) {
    return FOOD_CATEGORIES.find((c) => c.id === "traditionnel").defaultIngredients;
  }
  if (catId.includes("pate") || catId.includes("gratin") || nameLower.includes("gratin") || nameLower.includes("lasagne") || nameLower.includes("penne")) {
    return FOOD_CATEGORIES.find((c) => c.id === "pates").defaultIngredients;
  }
  if (catId.includes("salade") || nameLower.includes("salade")) {
    return FOOD_CATEGORIES.find((c) => c.id === "salades").defaultIngredients;
  }
  if (catId.includes("dessert") || nameLower.includes("gateau") || nameLower.includes("baklawa") || nameLower.includes("tiramisu")) {
    return FOOD_CATEGORIES.find((c) => c.id === "desserts").defaultIngredients;
  }
  if (catId.includes("boisson") || catId.includes("jus") || nameLower.includes("jus") || nameLower.includes("hamoud")) {
    return FOOD_CATEGORIES.find((c) => c.id === "boissons").defaultIngredients;
  }

  // Par défaut pour tout plat salé :
  return ["Sauce", "Oignons", "Épices fortes", "Sel"];
};
