import { View, Text, Pressable, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import DishInfo from "./DishInfo";
import { useLanguage } from "../contexts/LanguageContext";
import { notifyCookClientConfirmed } from "../services/notificationService";
import { StarIcon } from "react-native-heroicons/solid";
import OrderRatingModal from "./OrderRatingModal";

const Order = ({ orderId, status, timestamp, restaurantName, total, order }) => {
  const [dishes, setDishes] = useState([]);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [hasRatedLocal, setHasRatedLocal] = useState(Boolean(order?.hasRated));
  const { t, formatPrice, language } = useLanguage();

  let statusText, statusColor, badgeBg;
  const orderTimeStamp = timestamp ? timestamp.toDate() : new Date();
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const locale = language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR";
  const formattedDate = orderTimeStamp.toLocaleString(locale, options);

  const isPendingCook =
    status === "PENDING_COOK_APPROVAL" || status === "PENDING";
  const isWaitingClient = status === "WAITING_CLIENT_CONFIRMATION";
  const isPreparing =
    status === "IN_PREPARATION" || status === "PREPARING";
  const isReady =
    status === "READY_FOR_PICKUP" || status === "READY";
  const isAssigned =
    status === "ASSIGNED_TO_DELIVERY" ||
    status === "DRIVERACCEPTED" ||
    status === "DRIVERPICKEDUP";
  const isDelivered =
    status === "DELIVERED" || status === "COMPLETE";
  const isDeclined =
    status === "DECLINED_BY_COOK" || status === "DECLINED";
  const isCancelled = status === "CANCELLED_BY_CLIENT";

  if (isPendingCook) {
    statusText = t("statusPendingApproval");
    statusColor = "text-amber-600";
    badgeBg = "bg-amber-100";
  } else if (isWaitingClient) {
    statusText = t("statusWaitingClient");
    statusColor = "text-purple-600";
    badgeBg = "bg-purple-100";
  } else if (isPreparing) {
    statusText = t("statusInPreparation");
    statusColor = "text-orange-600";
    badgeBg = "bg-orange-100";
  } else if (isReady) {
    statusText = t("statusReadyForPickup");
    statusColor = "text-blue-600";
    badgeBg = "bg-blue-100";
  } else if (isAssigned) {
    statusText = t("statusAssignedDelivery");
    statusColor = "text-indigo-600";
    badgeBg = "bg-indigo-100";
  } else if (isDelivered) {
    statusText = t("statusDelivered");
    statusColor = "text-green-600";
    badgeBg = "bg-green-100";
  } else if (isDeclined) {
    statusText = t("statusDeclinedCook");
    statusColor = "text-red-600";
    badgeBg = "bg-red-100";
  } else if (isCancelled) {
    statusText = t("statusCancelledClient");
    statusColor = "text-red-600";
    badgeBg = "bg-red-100";
  } else {
    statusText = status;
    statusColor = "text-gray-600";
    badgeBg = "bg-gray-100";
  }

  useEffect(() => {
    const getDishId = async () => {
      const dishesRef = collection(db, "orderDishes");
      const q = query(dishesRef, where("orderId", "==", orderId));

      await getDocs(q).then((querySnapshot) => {
        let items = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data() });
        });
        setDishes(items);
      });
    };

    getDishId();
  }, [orderId]);

  // Double validation : Client confirme son accord sur l'heure de fin estimée
  const confirmAgreement = async () => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "IN_PREPARATION",
        clientConfirmedAt: new Date(),
      });

      // Notification Push au cuisinier pour lancer la préparation
      notifyCookClientConfirmed(order?.restaurantId, orderId);

      Alert.alert(t("success"), t("clientConfirmedSuccess"));
    } catch (e) {
      console.error(e);
      Alert.alert(t("error"), "Impossible de confirmer votre accord.");
    }
  };

  // Client refuse / annule la commande
  const cancelOrderByClient = async () => {
    Alert.alert(
      t("cancel"),
      "Êtes-vous sûr de vouloir annuler cette commande ?",
      [
        { text: t("back"), style: "cancel" },
        {
          text: t("cancel"),
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "orders", orderId), {
                status: "CANCELLED_BY_CLIENT",
                cancelledAt: new Date(),
              });
              Alert.alert(t("success"), t("orderCancelledSuccess"));
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex items-center justify-center">
      <View className="px-5 py-5 mt-4 bg-white w-11/12 rounded-2xl border border-gray-100 shadow shadow-gray-200">
        <View className="w-full">
          {/* Header statut */}
          <View className="flex-row items-center justify-between mb-2">
            <View className={`px-3 py-1 rounded-full ${badgeBg}`}>
              <Text className={`font-bold text-xs ${statusColor}`}>
                {statusText}
              </Text>
            </View>
            <Text className="text-xs text-gray-400 font-mono">
              #{orderId.slice(0, 8)}
            </Text>
          </View>

          <Text className="text-xs text-gray-500 mb-1">{formattedDate}</Text>

          {/* LISTE DES PLATS */}
          <View className="my-2 border-t border-b border-gray-50 py-1">
            {dishes.map((dish) => {
              return (
                <DishInfo
                  key={dish.dishId}
                  id={dish.dishId}
                  quantity={dish.quantity}
                />
              );
            })}
          </View>

          {/* TOTAUX & RESTAURANT */}
          <View className="flex-row justify-between mt-2 pt-1">
            <Text className="font-semibold text-base text-gray-700">
              {t("orderTotal")} :
            </Text>
            <Text className="font-bold text-lg text-emerald-800">
              {formatPrice(total)}
            </Text>
          </View>

          <View className="flex-row justify-between mt-1">
            <Text className="font-medium text-sm text-gray-500">
              {t("fromKitchen")}
            </Text>
            <Text className="font-bold text-sm text-gray-800">
              {restaurantName}
            </Text>
          </View>

          {/* ETAPE 1 : PENDING_COOK_APPROVAL -> Attente du cuisinier */}
          {isPendingCook && (
            <View className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <Text className="text-xs text-amber-800 font-medium">
                ⏳ {t("waitingCookEstimation")}
              </Text>
              {order?.initialEstimatedMinutes ? (
                <Text className="text-xs text-amber-700 mt-0.5">
                  Temps indicatif du menu : ~{order.initialEstimatedMinutes} {t("mins")}
                </Text>
              ) : null}
            </View>
          )}

          {/* ETAPE 2 : DOUBLE VALIDATION CLIENT -> WAITING_CLIENT_CONFIRMATION */}
          {isWaitingClient && (
            <View className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-200">
              <View className="flex-row items-center gap-1.5 mb-2">
                <Text className="text-base">⏰</Text>
                <Text className="text-sm font-bold text-purple-900">
                  {t("cookProposedTime")}
                </Text>
              </View>

              <View className="bg-white p-3 rounded-xl border border-purple-100 mb-3">
                <Text className="text-xs text-gray-500">
                  {t("calculatedEndTime")}
                </Text>
                <Text className="text-xl font-extrabold text-purple-800">
                  🏁 {order?.estimatedReadyTimeStr || "..."}{" "}
                  {order?.prepTimeMinutes ? (
                    <Text className="text-sm font-semibold text-gray-600">
                      (dans {order.prepTimeMinutes} {t("mins")})
                    </Text>
                  ) : null}
                </Text>
              </View>

              <Text className="text-xs text-purple-800 mb-3 font-medium">
                {t("waitingYourConfirmationNotice")}
              </Text>

              {/* Boutons d'accord ou de refus */}
              <View className="gap-2">
                <TouchableOpacity
                  onPress={confirmAgreement}
                  className="bg-green-600 p-3.5 rounded-xl items-center shadow-xs"
                >
                  <Text className="text-white font-bold text-sm">
                    {t("clientAgreeBtn")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={cancelOrderByClient}
                  className="bg-red-50 p-2.5 rounded-xl items-center border border-red-200"
                >
                  <Text className="text-red-700 font-bold text-xs">
                    {t("clientCancelBtn")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ETAPE 3 : IN_PREPARATION -> Le repas cuit */}
          {isPreparing && (
            <View className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <Text className="text-xs text-orange-900 font-bold">
                🍲 Le chef prépare votre commande avec soin !
              </Text>
              <Text className="text-xs text-orange-800 mt-0.5">
                Fin de cuisson prévue vers :{" "}
                <Text className="font-bold">
                  {order?.estimatedReadyTimeStr || "..."}
                </Text>
              </Text>
            </View>
          )}

          {/* ETAPE 4 : READY_FOR_PICKUP -> Repas prêt, attente livreur */}
          {isReady && (
            <View className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <Text className="text-xs text-blue-900 font-bold">
                🛵 Vos plats sont prêts et emballés !
              </Text>
              <Text className="text-xs text-blue-700 mt-0.5">
                En attente qu'un livreur disponible prenne en charge la course.
              </Text>
            </View>
          )}

          {/* ETAPE 5 : ASSIGNED_TO_DELIVERY -> Livreur en route */}
          {isAssigned && (
            <View className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <Text className="text-xs text-indigo-900 font-bold">
                🚴🏻‍♀️ Un coursier est en route vers le restaurant !
              </Text>
              {order?.driverName ? (
                <Text className="text-xs text-indigo-800 font-semibold mt-0.5">
                  Livreur : {order.driverName}
                </Text>
              ) : null}
            </View>
          )}

          {/* ETAPE 6 : DELIVERED & NOTATION */}
          {isDelivered && (
            <View className="mt-3">
              {hasRatedLocal || order?.hasRated ? (
                <View className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <View className="flex-row items-center space-x-1.5 mb-1">
                    <StarIcon size={16} color="#059669" />
                    <Text className="text-xs font-bold text-emerald-800">
                      Commande notée ! Merci pour votre avis ⭐
                    </Text>
                  </View>
                  <Text className="text-xs text-emerald-700">
                    Cuisine : {order?.cookRating || 5}/5 ⭐ {order?.driverRating ? `· Livreur : ${order.driverRating}/5 ⭐` : ""}
                  </Text>
                </View>
              ) : (
                <View className="p-3 bg-green-50 rounded-2xl border border-green-200">
                  <Text className="text-xs text-green-800 font-bold mb-2">
                    ✅ Commande livrée ! Bon appétit !
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRatingModalVisible(true)}
                    activeOpacity={0.8}
                    className="bg-amber-500 py-3 px-4 rounded-xl items-center flex-row justify-center space-x-2 shadow-sm"
                  >
                    <StarIcon size={18} color="white" />
                    <Text className="text-white font-bold text-xs">
                      Noter les plats, le chef et le livreur ⭐
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Modal de notation */}
          <OrderRatingModal
            visible={ratingModalVisible}
            onClose={() => setRatingModalVisible(false)}
            order={{ ...order, id: orderId, restaurantName }}
            onRatedSuccess={() => setHasRatedLocal(true)}
          />
        </View>
      </View>
    </View>
  );
};

export default Order;
