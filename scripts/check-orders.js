const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCHWynUsudT89nbd4XaRTHsajjlxL-WmNs",
  authDomain: "food-delivery-prod-b474f.firebaseapp.com",
  projectId: "food-delivery-prod-b474f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const snap = await getDocs(collection(db, "orders"));
  console.log("Total orders in DB:", snap.size);
  snap.forEach((doc) => {
    const d = doc.data();
    console.log("-----------------------------------------");
    console.log("ID:", doc.id);
    console.log("restaurantId:", d.restaurantId);
    console.log("restaurantName:", d.restaurantName);
    console.log("status:", d.status);
    console.log("total:", d.total);
    console.log("userFirstName:", d.userFirstName);
    console.log(
      "createdAt:",
      d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate() : d.createdAt) : null
    );
  });
}

check().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});

