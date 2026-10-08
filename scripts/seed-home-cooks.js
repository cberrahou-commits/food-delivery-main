const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  addDoc,
  Timestamp,
} = require("firebase/firestore");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} = require("firebase/auth");

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
const auth = getAuth(app);

async function getOrCreateUser(email, password, displayName) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  } catch (err) {
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential" ||
      err.code === "auth/invalid-login-credentials"
    ) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      return cred.user;
    }
    throw err;
  }
}

async function seedHomeCooks() {
  console.log("==================================================");
  console.log(" Injection des Cuisiniers Maison & Plats Artisanaux");
  console.log("==================================================\n");

  // 1. Compte Cuisinier Fatima
  const fatimaUser = await getOrCreateUser(
    "fatima.cuisine@test.com",
    "Password123!",
    "Fatima Zahra"
  );
  const kitchenFatimaId = `kitchen_${fatimaUser.uid}`;

  await setDoc(doc(db, "user", fatimaUser.uid), {
    firstName: "Fatima",
    lastName: "Zahra",
    email: "fatima.cuisine@test.com",
    phoneNumber: "0622334455",
    address: "24 Rue de la Roquette, 75011 Paris",
    latitude: 48.8542,
    longitude: 2.3725,
    role: "user",
    isCook: true,
    kitchenId: kitchenFatimaId,
    cookStatus: "APPROVED",
  });

  // Cuisine de Fatima
  await setDoc(doc(db, "restaurants", kitchenFatimaId), {
    id: kitchenFatimaId,
    ownerId: fatimaUser.uid,
    name: "La Cuisine Familiale de Fatima",
    title: "La Cuisine Familiale de Fatima",
    genre: "Plats Maison & Maghreb",
    description:
      "Plats traditionnels cuisinés avec amour selon les recettes transmises par ma grand-mère. Produits frais, épices ramenées de Fès.",
    address: "24 Rue de la Roquette, 75011 Paris",
    image:
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80",
    rating: 4.95,
    lat: 48.8542,
    lng: 2.3725,
    minDeliveryTime: 25,
    maxDeliveryTime: 40,
    isHomeCook: true,
  });

  console.log(`✓ Cuisine de Fatima créée (${kitchenFatimaId})`);

  // Plats de Fatima
  const fatimaDishes = [
    {
      id: "dish_couscous_fatima",
      restaurantId: kitchenFatimaId,
      name: "Couscous Royal Maison aux 7 Légumes",
      description:
        "Semoule fine roulée main, agneau tendre mijoté 3h, poulet fermier, merguez artisanale, bouillon aux épices douces et légumes frais du marché.",
      price: 18.5,
      image:
        "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop&q=80",
      prepTimeMinutes: 30,
      portionsAvailable: 6,
      isHomemade: true,
    },
    {
      id: "dish_tajine_fatima",
      restaurantId: kitchenFatimaId,
      name: "Tajine d'Agneau aux Pruneaux & Amandes Torréfiées",
      description:
        "Souris d'agneau fondante confite au safran pur, pruneaux caramélisés au miel de fleur d'oranger et amandes croustillantes.",
      price: 19.0,
      image:
        "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=800&auto=format&fit=crop&q=80",
      prepTimeMinutes: 35,
      portionsAvailable: 4,
      isHomemade: true,
    },
    {
      id: "dish_pastilla_fatima",
      restaurantId: kitchenFatimaId,
      name: "Pastilla Croustillante au Poulet & Amandes",
      description:
        "Feuilletage doré ultra croustillant, effiloché de poulet fermier aux oignons confits, cannelle, fleur d'oranger et amandes pilées.",
      price: 11.5,
      image:
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80",
      prepTimeMinutes: 20,
      portionsAvailable: 5,
      isHomemade: true,
    },
  ];

  for (const d of fatimaDishes) {
    const { id, ...data } = d;
    await setDoc(doc(db, "dishes", id), data);
    console.log(`  -> Plat ajouté : ${d.name} (${d.price} €)`);
  }

  // 2. Compte Cuisinière Sophie
  const sophieUser = await getOrCreateUser(
    "sophie.cuisine@test.com",
    "Password123!",
    "Sophie Martin"
  );
  const kitchenSophieId = `kitchen_${sophieUser.uid}`;

  await setDoc(doc(db, "user", sophieUser.uid), {
    firstName: "Sophie",
    lastName: "Martin",
    email: "sophie.cuisine@test.com",
    phoneNumber: "0633445566",
    address: "12 Rue des Martyrs, 75009 Paris",
    latitude: 48.8785,
    longitude: 2.3392,
    role: "user",
    isCook: true,
    kitchenId: kitchenSophieId,
    cookStatus: "APPROVED",
  });

  await setDoc(doc(db, "restaurants", kitchenSophieId), {
    id: kitchenSophieId,
    ownerId: sophieUser.uid,
    name: "L'Atelier Tradition de Sophie",
    title: "L'Atelier Tradition de Sophie",
    genre: "Cuisine Traditionnelle Française",
    description:
      "Cuisine du terroir fait maison avec des viandes d'éleveurs français et des légumes bio de saison. Tout est préparé minute !",
    address: "12 Rue des Martyrs, 75009 Paris",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80",
    rating: 4.9,
    lat: 48.8785,
    lng: 2.3392,
    minDeliveryTime: 25,
    maxDeliveryTime: 40,
    isHomeCook: true,
  });

  console.log(`\n✓ Cuisine de Sophie créée (${kitchenSophieId})`);

  const sophieDishes = [
    {
      id: "dish_bourguignon_sophie",
      restaurantId: kitchenSophieId,
      name: "Boeuf Bourguignon Mijoté 5 Heures",
      description:
        "Paleron de boeuf charolais fondant mariné au vin rouge de Bourgogne, carottes fondantes, lardons fumés et champignons de Paris.",
      price: 17.5,
      image:
        "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&auto=format&fit=crop&q=80",
      prepTimeMinutes: 20,
      portionsAvailable: 8,
      isHomemade: true,
    },
    {
      id: "dish_tatin_sophie",
      restaurantId: kitchenSophieId,
      name: "Tarte Tatin Maison & Crème Fraîche d'Isigny",
      description:
        "Pommes reinettes caramélisées au beurre demi-sel, pâte sablée croustillante maison et noisette de crème crue AOP.",
      price: 6.5,
      image:
        "https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop&q=80",
      prepTimeMinutes: 10,
      portionsAvailable: 6,
      isHomemade: true,
    },
  ];

  for (const d of sophieDishes) {
    const { id, ...data } = d;
    await setDoc(doc(db, "dishes", id), data);
    console.log(`  -> Plat ajouté : ${d.name} (${d.price} €)`);
  }

  // 3. Commande test pour Fatima (pour tester immédiatement le flux de commande de cuisine maison)
  const orderDemoCook = {
    id: "order_demo_homecook_001",
    restaurantId: kitchenFatimaId,
    restaurantName: "La Cuisine Familiale de Fatima",
    restaurantAddress: "24 Rue de la Roquette, 75011 Paris",
    restaurantImage:
      "https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80",
    restaurantLatitude: 48.8542,
    restaurantLongitude: 2.3725,
    userId: "marie_client_demo",
    userFirstName: "Marie",
    userLastName: "Dupont",
    userPhoneNumber: "0612345678",
    userAddress: "48 Rue du Faubourg Saint-Honoré, 75008 Paris",
    userLatitude: 48.8702,
    userLongitude: 2.3168,
    status: "PENDING",
    total: 37.0,
    createdAt: Timestamp.now(),
  };

  await setDoc(doc(db, "orders", orderDemoCook.id), orderDemoCook);
  await setDoc(doc(db, "orderDishes", "order_demo_homecook_001_couscous"), {
    orderId: "order_demo_homecook_001",
    dishId: "dish_couscous_fatima",
    quantity: 2,
  });

  console.log(`\n✓ Commande test en attente créée pour la cuisine de Fatima (order_demo_homecook_001)`);
  console.log("==================================================");
  console.log("SUCCÈS : Cuisines maison et plats injectés !");
  console.log("==================================================");
}

seedHomeCooks()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erreur:", err);
    process.exit(1);
  });

