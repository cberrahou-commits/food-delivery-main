import { useState, useEffect } from "react";
import DishInfo from "./DishInfo";
import { db } from "../../firebase/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

const OrderModal = ({ setIsActive, selectedOrder }) => {
  const [dishes, setDishes] = useState([]);
  const [status, setStatus] = useState(selectedOrder?.status || "PENDING_COOK_APPROVAL");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!selectedOrder?.id) return;

    const getDishId = async () => {
      try {
        const dishesRef = collection(db, "orderDishes");
        const q = query(dishesRef, where("orderId", "==", selectedOrder.id));
        const querySnapshot = await getDocs(q);
        let items = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data() });
        });
        setDishes(items);
      } catch (err) {
        console.error("Error fetching dishes for order:", err);
      }
    };

    getDishId();
  }, [selectedOrder?.id]);

  const updateOrderStatusInFirestore = async (newStatus) => {
    setIsUpdating(true);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date(),
      });
      setStatus(newStatus);
    } catch (err) {
      console.error("Error updating order status:", err);
      alert("Erreur lors de la mise à jour du statut : " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusInfo = (st) => {
    switch (st) {
      case "PENDING_COOK_APPROVAL":
      case "PENDING":
        return { text: "En attente approbation cuisinier ⏳", color: "text-amber-600 bg-amber-50 border-amber-300" };
      case "WAITING_CLIENT_CONFIRMATION":
        return { text: "En attente accord client ⏰", color: "text-purple-600 bg-purple-50 border-purple-300" };
      case "IN_PREPARATION":
      case "PREPARING":
        return { text: "En cours de préparation 🍲", color: "text-orange-600 bg-orange-50 border-orange-300" };
      case "READY_FOR_PICKUP":
      case "READY":
        return { text: "Prête pour le coursier (Pool) 🛵", color: "text-blue-600 bg-blue-50 border-blue-300" };
      case "ASSIGNED_TO_DELIVERY":
      case "DRIVERACCEPTED":
      case "DRIVERPICKEDUP":
        return { text: "Livreur assigné (En livraison) 🚴🏻‍♀️", color: "text-indigo-600 bg-indigo-50 border-indigo-300" };
      case "DELIVERED":
      case "COMPLETE":
        return { text: "Commande livrée ✅", color: "text-green-600 bg-green-50 border-green-300" };
      case "DECLINED_BY_COOK":
      case "DECLINED":
        return { text: "Refusée par le cuisinier ❌", color: "text-red-600 bg-red-50 border-red-300" };
      case "CANCELLED_BY_CLIENT":
        return { text: "Annulée par le client ❌", color: "text-red-600 bg-red-50 border-red-300" };
      default:
        return { text: st || "Inconnu", color: "text-gray-600 bg-gray-50 border-gray-300" };
    }
  };

  const currentInfo = getStatusInfo(status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-xs"
        onClick={() => setIsActive(false)}
      ></div>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <div className="relative w-full max-w-2xl p-6 mx-auto bg-white rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
          {/* Fermer */}
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <span className="text-xs font-mono font-bold text-gray-400">
                Commande #{selectedOrder?.id}
              </span>
              <h3 className="text-lg font-bold text-gray-900">
                Détails & Supervision de la commande
              </h3>
            </div>
            <button
              className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-700 transition"
              onClick={() => setIsActive(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Statut actuel */}
          <div className="my-4 p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 bg-gray-50/80">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Statut en Temps Réel
            </span>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-bold border ${currentInfo.color}`}
            >
              {currentInfo.text}
            </span>
          </div>

          {/* Grille Informations Client / Cuisinier / Livreur */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs">
            {/* Client */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700 block mb-1">
                👤 Client
              </span>
              <div className="text-gray-900 font-semibold">
                {selectedOrder?.userFirstName} {selectedOrder?.userLastName}
              </div>
              {selectedOrder?.userPhoneNumber && (
                <div className="text-gray-600 mt-0.5">
                  📞 {selectedOrder?.userPhoneNumber}
                </div>
              )}
              {selectedOrder?.userAddress && (
                <div className="text-gray-500 mt-0.5">
                  📍 {selectedOrder?.userAddress}
                </div>
              )}
            </div>

            {/* Cuisinier / Restaurant */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-bold text-gray-700 block mb-1">
                🍳 Cuisine / Chef
              </span>
              <div className="text-gray-900 font-semibold">
                {selectedOrder?.restaurantName || "Cuisine Partenaire"}
              </div>
              <div className="text-gray-600 mt-0.5">
                ⏱️ Délai estimé :{" "}
                <span className="font-bold">
                  {selectedOrder?.prepTimeMinutes
                    ? `${selectedOrder.prepTimeMinutes} min`
                    : selectedOrder?.initialEstimatedMinutes
                    ? `~${selectedOrder.initialEstimatedMinutes} min (indicatif)`
                    : "Non renseigné"}
                </span>
              </div>
              {selectedOrder?.estimatedReadyTimeStr && (
                <div className="text-gray-600 mt-0.5">
                  🏁 Fin prévue :{" "}
                  <span className="font-bold text-green-700">
                    {selectedOrder.estimatedReadyTimeStr}
                  </span>
                </div>
              )}
            </div>

            {/* Livreur */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 md:col-span-2">
              <span className="font-bold text-gray-700 block mb-1">
                🛵 Livreur Assigné
              </span>
              {selectedOrder?.assignedDriverId || selectedOrder?.driverName ? (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-indigo-900">
                      {selectedOrder?.driverName || "Livreur Partenaire"}
                    </span>
                    {selectedOrder?.driverPhone && (
                      <span className="text-gray-600 ml-2">
                        📞 {selectedOrder.driverPhone}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-semibold">
                    Verrouillé (Assignation exclusive)
                  </span>
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  Aucun livreur pour le moment (visible dans le pool des courses dès que prêt).
                </div>
              )}
            </div>
          </div>

          {/* Plats commandés */}
          <div className="mb-4">
            <h4 className="font-bold text-sm text-gray-700 mb-2">
              Plats commandés
            </h4>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 divide-y divide-gray-200">
              {dishes.length === 0 ? (
                <div className="text-xs text-gray-500 py-1">
                  Chargement des plats...
                </div>
              ) : (
                dishes.map((dish, i) => (
                  <div key={i} className="py-2 first:pt-0 last:pb-0">
                    <DishInfo id={dish.dishId} quantity={dish.quantity} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-3 px-4 bg-green-50 rounded-xl border border-green-200 mb-6">
            <span className="font-bold text-sm text-green-900">
              Total de la commande :
            </span>
            <span className="text-xl font-extrabold text-green-700">
              {Number(selectedOrder?.total || 0).toLocaleString("fr-FR")} DA
            </span>
          </div>

          {/* Panneau de supervision & modification manuelle du statut */}
          <div className="border-t border-gray-100 pt-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-3 text-center">
              Supervision Administrateur · Forcer le statut
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("PENDING_COOK_APPROVAL")}
                className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold border border-amber-200 transition"
              >
                1. Attente cuisinier
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("WAITING_CLIENT_CONFIRMATION")}
                className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold border border-purple-200 transition"
              >
                2. Attente client
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("IN_PREPARATION")}
                className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold border border-orange-200 transition"
              >
                3. En préparation
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("READY_FOR_PICKUP")}
                className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold border border-blue-200 transition"
              >
                4. Prêt (Pool)
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("ASSIGNED_TO_DELIVERY")}
                className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold border border-indigo-200 transition"
              >
                5. Livreur assigné
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("DELIVERED")}
                className="p-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-800 font-semibold border border-green-200 transition"
              >
                6. Livrée ✅
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("DECLINED_BY_COOK")}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 font-semibold border border-red-200 transition"
              >
                Refusée cuisinier ❌
              </button>
              <button
                disabled={isUpdating}
                onClick={() => updateOrderStatusInFirestore("CANCELLED_BY_CLIENT")}
                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 font-semibold border border-red-200 transition"
              >
                Annulée client ❌
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
