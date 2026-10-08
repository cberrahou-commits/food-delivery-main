const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
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
    console.log(`  -> Connecte au compte : ${email} (${cred.user.uid})`);
    return cred.user;
  } catch (err) {
    if (
      err.code === "auth/user-not-found" ||
      err.code === "auth/invalid-credential" ||
      err.code === "auth/invalid-login-credentials"
    ) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      console.log(`  -> Nouveau compte cree : ${email} (${cred.user.uid})`);
      return cred.user;
    }
    throw err;
  }
}

async function seedDatabase() {
  console.log("=================================================");
  console.log(" Remplissage complet de la base de donnees");
  console.log(" Projet Firebase : food-delivery-prod-b474f");
  console.log("=================================================\n");

  // 1. CREATION / CONNEXION DES UTILISATEURS AUTHENTIFIES
  console.log("[1/5] Creation des comptes de test Firebase Auth...");
  const clientUser = await getOrCreateUser(
    "marie.dupont@test.com",
    "Password123!",
    "Marie Dupont"
  );
  await setDoc(doc(db, "user", clientUser.uid), {
    firstName: "Marie",
    lastName: "Dupont",
    email: "marie.dupont@test.com",
    phoneNumber: "0612345678",
    address: "48 Rue du Faubourg Saint-Honore, 75008 Paris",
    latitude: 48.8702,
    longitude: 2.3168,
    role: "user",
  });
  console.log(`  -> Profil client enregistre dans Firestore (/user/${clientUser.uid})`);

  const driverUser = await getOrCreateUser(
    "karim.livreur@test.com",
    "Password123!",
    "Karim Bennani"
  );
  await setDoc(doc(db, "user", driverUser.uid), {
    firstName: "Karim",
    lastName: "Bennani",
    email: "karim.livreur@test.com",
    phoneNumber: "0789012345",
    address: "1 Place de la Bastille, 75011 Paris",
    latitude: 48.8531,
    longitude: 2.3691,
    role: "courier",
  });
  console.log(`  -> Profil livreur enregistre dans Firestore (/user/${driverUser.uid})`);

  // 2. RESTAURANTS
  console.log("\n[2/5] Insertion des restaurants...");
  const restaurants = [
    {
      id: "5IdiasERdP0Xq0otooZn", // ID lie au Restaurant Dashboard Next.js
      name: "Le Gourmet Burger Paris",
      title: "Le Gourmet Burger Paris",
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      address: "15 Rue de Rivoli, 75001 Paris",
      genre: "Burgers & Grill",
      rating: 4.8,
      description:
        "Burgers gourmets prepares a la commande avec du boeuf francais et sauces artisanales.",
      lat: 48.8566,
      lng: 2.3522,
      minDeliveryTime: 20,
      maxDeliveryTime: 35,
    },
    {
      id: "pizza_deliziosa_paris",
      name: "Pizzeria Bella Napoli",
      title: "Pizzeria Bella Napoli",
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
      address: "28 Boulevard Saint-Germain, 75005 Paris",
      genre: "Italien & Pizzas",
      rating: 4.9,
      description:
        "Pizzas napolitaines artisanales cuites au feu de bois avec mozzarella di bufala AOP.",
      lat: 48.8505,
      lng: 2.3488,
      minDeliveryTime: 15,
      maxDeliveryTime: 30,
    },
    {
      id: "tokyo_sushi_bar",
      name: "Tokyo Sushi Express",
      title: "Tokyo Sushi Express",
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&auto=format&fit=crop&q=80",
      address: "45 Rue Sainte-Anne, 75002 Paris",
      genre: "Japonais & Sushi",
      rating: 4.7,
      description:
        "Sushis, makis, sashimis et gyozas d'une fraicheur incomparable prepares par nos chefs.",
      lat: 48.8682,
      lng: 2.3364,
      minDeliveryTime: 25,
      maxDeliveryTime: 40,
    },
  ];

  for (const r of restaurants) {
    const { id, ...data } = r;
    await setDoc(doc(db, "restaurants", id), data);
    console.log(`  -> Restaurant ajoute : ${r.name}`);
  }

  // 3. PLATS (DISHES)
  console.log("\n[3/5] Insertion des plats (dishes)...");
  const dishes = [
    // Plats pour Le Gourmet Burger Paris
    {
      id: "dish_burger_classic",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      name: "Classic Cheese & Bacon Burger",
      description:
        "Steak hache boucher 150g, cheddar mature, bacon fume croustillant, oignons caramelises.",
      price: 14.9,
      image:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_burger_truffle",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      name: "Burger Truffe & Parmesan",
      description:
        "Boeuf charolais, creme onctueuse de truffe noire, roquette poivree et copeaux de parmesan.",
      price: 17.5,
      image:
        "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_fries_home",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      name: "Frites Maison & Sauce Cheddar",
      description:
        "Pommes de terre fraiches de Picardie coupees main, double cuisson, nappage cheddar chaud.",
      price: 5.5,
      image:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_cookie_caramel",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      name: "Maxi Cookie Chocolat & Caramel",
      description:
        "Cookie artisanal XXL aux pepites de chocolat noir bio et coeur coulant caramel beurre sale.",
      price: 4.5,
      image:
        "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&auto=format&fit=crop&q=80",
    },

    // Plats pour Pizzeria Bella Napoli
    {
      id: "dish_pizza_margherita",
      restaurantId: "pizza_deliziosa_paris",
      name: "Pizza Margherita DOP",
      description:
        "Tomates San Marzano, mozzarella fior di latte, basilic frais de Campanie, huile d'olive vierge.",
      price: 12.0,
      image:
        "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_pizza_burrata",
      restaurantId: "pizza_deliziosa_paris",
      name: "Pizza Truffe & Burrata Entiere",
      description:
        "Creme de truffe, champignons frais, jambon blanc aux herbes et burrata pugliese 125g.",
      price: 16.5,
      image:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_tiramisu",
      restaurantId: "pizza_deliziosa_paris",
      name: "Tiramisu Classico Della Casa",
      description:
        "Recette venitienne authentique au mascarpone onctueux et biscuits imbibes au cafe.",
      price: 6.5,
      image:
        "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
    },

    // Plats pour Tokyo Sushi Express
    {
      id: "dish_sushi_combo",
      restaurantId: "tokyo_sushi_bar",
      name: "Plateau Saumon Royal (18 pieces)",
      description:
        "6 Saumon Maki, 6 California Saumon Avocat, 6 Sushi Nigiri au saumon d'Ecosse label rouge.",
      price: 19.9,
      image:
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600&auto=format&fit=crop&q=80",
    },
    {
      id: "dish_gyozas",
      restaurantId: "tokyo_sushi_bar",
      name: "Gyozas Poulet Grilles (6 pcs)",
      description:
        "Raviolis japonais dores a la poele avec farce fondante au poulet et sauce soja au vinaigre de riz.",
      price: 7.0,
      image:
        "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=600&auto=format&fit=crop&q=80",
    },
  ];

  for (const d of dishes) {
    const { id, ...data } = d;
    await setDoc(doc(db, "dishes", id), data);
    console.log(`  -> Plat ajoute : ${d.name} (${d.price.toFixed(2)} EUR)`);
  }

  // 4. COMMANDES DE TEST (ORDERS)
  console.log("\n[4/5] Insertion des commandes actives...");
  const orders = [
    // Commande 1 : En attente (PENDING) -> Visible sur le Dashboard Restaurant Vercel
    {
      id: "order_demo_pending_001",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      restaurantName: "Le Gourmet Burger Paris",
      restaurantAddress: "15 Rue de Rivoli, 75001 Paris",
      restaurantImage:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      restaurantLatitude: 48.8566,
      restaurantLongitude: 2.3522,
      userId: clientUser.uid,
      userFirstName: "Marie",
      userLastName: "Dupont",
      userPhoneNumber: "0612345678",
      userAddress: "48 Rue du Faubourg Saint-Honore, 75008 Paris",
      userLatitude: 48.8702,
      userLongitude: 2.3168,
      status: "PENDING", // Visible sur Dashboard Restaurant
      total: 37.9,
      createdAt: Timestamp.now(),
    },
    // Commande 2 : Prete (READY) -> Visible dans l'App Livreur sur la carte et la liste
    {
      id: "order_demo_ready_002",
      restaurantId: "5IdiasERdP0Xq0otooZn",
      restaurantName: "Le Gourmet Burger Paris",
      restaurantAddress: "15 Rue de Rivoli, 75001 Paris",
      restaurantImage:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80",
      restaurantLatitude: 48.8566,
      restaurantLongitude: 2.3522,
      userId: clientUser.uid,
      userFirstName: "Marie",
      userLastName: "Dupont",
      userPhoneNumber: "0612345678",
      userAddress: "10 Boulevard Haussmann, 75009 Paris",
      userLatitude: 48.8724,
      userLongitude: 2.3318,
      status: "READY", // Visible sur Driver App
      total: 24.9,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000)),
    },
    // Commande 3 : Prete (READY) chez Pizzeria Bella Napoli
    {
      id: "order_demo_ready_003",
      restaurantId: "pizza_deliziosa_paris",
      restaurantName: "Pizzeria Bella Napoli",
      restaurantAddress: "28 Boulevard Saint-Germain, 75005 Paris",
      restaurantImage:
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
      restaurantLatitude: 48.8505,
      restaurantLongitude: 2.3488,
      userId: clientUser.uid,
      userFirstName: "Marie",
      userLastName: "Dupont",
      userPhoneNumber: "0612345678",
      userAddress: "12 Rue Monge, 75005 Paris",
      userLatitude: 48.8472,
      userLongitude: 2.3525,
      status: "READY", // Visible sur Driver App
      total: 35.0,
      createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 60 * 1000)),
    },
  ];

  for (const o of orders) {
    const { id, ...data } = o;
    await setDoc(doc(db, "orders", id), data);
    console.log(`  -> Commande creee : ${id} [Status: ${o.status}]`);
  }

  // 5. DETAIL DES COMMANDES (ORDER DISHES)
  console.log("\n[5/5] Association des plats aux commandes (orderDishes)...");
  const orderDishes = [
    // Commande 1
    {
      id: "order_demo_pending_001_burger_classic",
      orderId: "order_demo_pending_001",
      dishId: "dish_burger_classic",
      quantity: 2,
    },
    {
      id: "order_demo_pending_001_fries",
      orderId: "order_demo_pending_001",
      dishId: "dish_fries_home",
      quantity: 1,
    },
    // Commande 2
    {
      id: "order_demo_ready_002_burger_truffle",
      orderId: "order_demo_ready_002",
      dishId: "dish_burger_truffle",
      quantity: 1,
    },
    {
      id: "order_demo_ready_002_cookie",
      orderId: "order_demo_ready_002",
      dishId: "dish_cookie_caramel",
      quantity: 1,
    },
    // Commande 3
    {
      id: "order_demo_ready_003_pizza_burrata",
      orderId: "order_demo_ready_003",
      dishId: "dish_pizza_burrata",
      quantity: 1,
    },
    {
      id: "order_demo_ready_003_tiramisu",
      orderId: "order_demo_ready_003",
      dishId: "dish_tiramisu",
      quantity: 2,
    },
  ];

  for (const od of orderDishes) {
    const { id, ...data } = od;
    await setDoc(doc(db, "orderDishes", id), data);
    console.log(`  -> Plat associe : ${od.dishId} x${od.quantity}`);
  }

  console.log("\n=================================================");
  console.log(" SUCCES TOTAL ! Base de donnees Firestore remplie");
  console.log("=================================================");
  console.log("Comptes de test crees :");
  console.log("  • Client  : marie.dupont@test.com / Password123!");
  console.log("  • Livreur : karim.livreur@test.com / Password123!");
  console.log("\nFlux opérationnel pret pour vos tests :");
  console.log("  1. Dashboard Restaurant (https://restaurant-dashboard-pied-alpha.vercel.app)");
  console.log("     -> Commande 'order_demo_pending_001' PENDING a accepter & preparer");
  console.log("  2. App Livreur");
  console.log("     -> 2 commandes READY sur la carte pretes a etre livrees");
  console.log("  3. App Client");
  console.log("     -> 3 restaurants parisiens avec leurs menus complets");
}

seedDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("ERREUR lors du remplissage :", err);
    process.exit(1);
  });

