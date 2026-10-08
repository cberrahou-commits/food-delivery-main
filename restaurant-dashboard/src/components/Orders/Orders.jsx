import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import OrdersList from "./OrdersList";
import { DEFAULT_RESTAURANT_ID } from "../../config/constants";

const Orders = ({ restaurantId = DEFAULT_RESTAURANT_ID }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("restaurantId", "==", restaurantId),
      where("status", "==", "PENDING"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let item = [];
        querySnapshot.forEach((doc) => {
          item.push({ ...doc.data(), id: doc.id });
        });
        setOrders(item);
      },
      (error) => {
        console.error("Firestore Orders listener error:", error);
      }
    );

    return unsubscribe;
  }, [restaurantId]);

  return (
    <>
      <OrdersList orders={orders} />
    </>
  );
};

export default Orders;
