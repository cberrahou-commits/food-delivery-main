import { useEffect, useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import OrderItem from "../Orders/OrderItem";
import OrderModal from "../Orders/OrderModal";
import { DEFAULT_RESTAURANT_ID } from "../../config/constants";

const OrderHistory = ({ restaurantId = DEFAULT_RESTAURANT_ID }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const getOrders = async () => {
      try {
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

        const querySnapshot = await getDocs(q);
        let item = [];
        querySnapshot.forEach((doc) => {
          item.push({ ...doc.data(), id: doc.id });
        });
        setOrders(item);
      } catch (err) {
        console.error("Error fetching order history:", err);
      }
    };

    getOrders();
  }, [restaurantId]);

  return (
    <>
      {isActive && selectedOrder && (
        <OrderModal setIsActive={setIsActive} selectedOrder={selectedOrder} />
      )}

      <div className="max-w-screen-xl mx-auto pt-8 px-4 md:px-8">
        <div className="items-start justify-between md:flex mb-6">
          <div className="max-w-lg">
            <h3 className="text-gray-900 text-3xl font-bold">
              Historique des Commandes
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Historique complet de toutes les commandes passées sur la plateforme.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {orders.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              Aucune commande trouvée dans l&apos;historique.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm text-left">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">N° Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Cuisine</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedOrder(item);
                        setIsActive(true);
                      }}
                      className="cursor-pointer hover:bg-gray-50/70 transition"
                    >
                      <OrderItem
                        date={item.createdAt}
                        id={item.id}
                        firstName={item.userFirstName}
                        lastName={item.userLastName}
                        restaurantName={item.restaurantName}
                        total={item.total}
                        status={item.status}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrderHistory;
