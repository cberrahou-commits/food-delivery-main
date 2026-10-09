import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import OrdersList from "./OrdersList";

const Orders = ({ restaurantId }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    let q;
    if (restaurantId && restaurantId !== "ALL") {
      q = query(
        ordersRef,
        where("restaurantId", "==", restaurantId),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(ordersRef, orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let item = [];
        querySnapshot.forEach((doc) => {
          item.push({ ...doc.data(), id: doc.id });
        });
        setOrders(item);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Orders listener error:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [restaurantId]);

  return (
    <>
      <OrdersList orders={orders} loading={loading} />
    </>
  );
};

export default Orders;
