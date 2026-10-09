import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserAuth } from "../contexts/AuthContext";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "react-native-heroicons/solid";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";
import DishInfo from "../components/DishInfo";

const CookOrderDishes = ({ orderId }) => {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const q = query(
      collection(db, "orderDishes"),
      where("orderId", "==", orderId)
    );
    getDocs(q)
      .then((snap) => {
        const list = [];
        snap.forEach((d) => list.push(d.data()));
        setItems(list);
      })
      .catch(console.error);
  }, [orderId]);

  if (items.length === 0) return null;

  return (
    <View className="my-2 border-t border-b border-gray-100 py-2">
      {items.map((dish) => (
        <DishInfo key={dish.dishId} id={dish.dishId} quantity={dish.quantity} />
      ))}
    </View>
  );
};

const CookDashboardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, dbUser } = UserAuth();
  const { t, formatPrice } = useLanguage();

  const uid = user?.uid || auth.currentUser?.uid;
  const kitchenId = route.params?.kitchenId || dbUser?.kitchenId || `kitchen_${uid}`;

  const [activeTab, setActiveTab] = useState("dishes"); // 'dishes' | 'orders'
  const [kitchenInfo, setKitchenInfo] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prepTimes, setPrepTimes] = useState({});
  const [loading, setLoading] = useState(true);

  // Charger les infos de la cuisine
  useEffect(() => {
    if (!kitchenId) return;

    const fetchKitchen = async () => {
      try {
        const docRef = doc(db, "restaurants", kitchenId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setKitchenInfo(snap.data());
        }
      } catch (e) {
        console.error("Error fetching kitchen:", e);
      }
    };
    fetchKitchen();
  }, [kitchenId]);

  // Écouter les plats du cuisinier en direct
  useEffect(() => {
    if (!kitchenId) return;

    const q = query(collection(db, "dishes"), where("restaurantId", "==", kitchenId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setDishes(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching dishes:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [kitchenId]);

  // Écouter les commandes adressées à cette cuisine en direct
  useEffect(() => {
    if (!kitchenId) return;

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", kitchenId),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setOrders(list);
      },
      (err) => {
        console.error("Error fetching orders:", err);
      }
    );

    return unsubscribe;
  }, [kitchenId]);

  const handlePrepTimeChange = (orderId, value) => {
    setPrepTimes((prev) => ({
      ...prev,
      [orderId]: value,
    }));
  };

  const getCalculatedTime = (prepMin) => {
    const m = parseInt(prepMin) || 0;
    const now = new Date();
    const finish = new Date(now.getTime() + m * 60000);
    const hours = String(finish.getHours()).padStart(2, "0");
    const mins = String(finish.getMinutes()).padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const validateCookEstimation = async (order) => {
    const rawVal =
      prepTimes[order.id] !== undefined
        ? prepTimes[order.id]
        : order.initialEstimatedMinutes || 25;
    const prepMin = parseInt(rawVal);
    if (!prepMin || isNaN(prepMin) || prepMin <= 0) {
      Alert.alert(t("error"), t("prepTimeRequired"));
      return;
    }

    try {
      const readyDate = new Date(Date.now() + prepMin * 60000);
      const hours = String(readyDate.getHours()).padStart(2, "0");
      const mins = String(readyDate.getMinutes()).padStart(2, "0");
      const timeStr = `${hours}:${mins}`;

      await updateDoc(doc(db, "orders", order.id), {
        status: "WAITING_CLIENT_CONFIRMATION",
        prepTimeMinutes: prepMin,
        estimatedReadyAt: readyDate,
        estimatedReadyTimeStr: timeStr,
        cookEstimatedAt: new Date(),
      });

      Alert.alert(t("success"), t("estimationSent"));
    } catch (e) {
      console.error(e);
      Alert.alert(t("error"), "Impossible d'enregistrer l'estimation.");
    }
  };

  const declineOrderByCook = async (orderId) => {
    Alert.alert(
      t("declineOrder"),
      "Êtes-vous sûr de vouloir refuser cette commande ?",
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("declineOrder"),
          style: "destructive",
          onPress: async () => {
            try {
              await updateDoc(doc(db, "orders", orderId), {
                status: "DECLINED_BY_COOK",
                declinedAt: new Date(),
              });
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const markOrderReady = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "READY_FOR_PICKUP",
        readyAt: new Date(),
      });
      Alert.alert(t("success"), t("mealReadyAlert"));
    } catch (e) {
      console.error(e);
      Alert.alert(t("error"), "Impossible de marquer le plat comme prêt.");
    }
  };

  const handleDeleteDish = async (dishId, dishName) => {
    Alert.alert(
      "Supprimer le plat",
      `Êtes-vous sûr de vouloir retirer "${dishName}" de votre carte ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "dishes", dishId));
            } catch (e) {
              console.error(e);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header avec bascule vers Mode Client */}
      <View className="bg-white px-5 pt-3 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center">
              <Text className="text-xl">🍳</Text>
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">
                {kitchenInfo?.name || "Ma Cuisine Maison"}
              </Text>
              <Text className="text-xs text-green-700 font-semibold">
                Chef Fait Maison Certifié ✓
              </Text>
            </View>
          </View>

          {/* Bouton de bascule vers le mode Client */}
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            className="bg-gray-100 px-3 py-2 rounded-xl flex-row items-center gap-1 border border-gray-200"
          >
            <Text className="text-xs font-bold text-gray-700">🛒 Mode Client</Text>
          </TouchableOpacity>
        </View>

        {/* Onglets Plats / Commandes */}
        <View className="flex-row bg-gray-100 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab("dishes")}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === "dishes" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                activeTab === "dishes" ? "text-green-700" : "text-gray-500"
              }`}
            >
              Mes Plats ({dishes.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("orders")}
            className={`flex-1 py-2.5 rounded-lg items-center ${
              activeTab === "orders" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                activeTab === "orders" ? "text-green-700" : "text-gray-500"
              }`}
            >
              Commandes Reçues ({orders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENU ONGLET 1 : PLATS */}
      {activeTab === "dishes" && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Bouton Ajouter un plat */}
          <TouchableOpacity
            onPress={() => navigation.navigate("AddCookDish", { kitchenId })}
            className="bg-green-600 p-4 rounded-2xl flex-row items-center justify-center gap-2 shadow-sm mb-6"
          >
            <PlusIcon size={22} color="#ffffff" />
            <Text className="text-white font-bold text-base">
              Ajouter un plat fait maison 🍲
            </Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator color="#16a34a" size="large" />
          ) : dishes.length === 0 ? (
            <View className="bg-white p-8 rounded-2xl items-center border border-gray-200">
              <Text className="text-4xl mb-3">🥘</Text>
              <Text className="text-lg font-bold text-gray-800 text-center">
                Aucun plat pour le moment
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-1 mb-4">
                Utilisez votre téléphone pour photographier votre premier plat et commencer à régaler vos voisins !
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("AddCookDish", { kitchenId })}
                className="bg-green-100 px-4 py-2.5 rounded-xl border border-green-300"
              >
                <Text className="text-green-800 font-bold text-sm">
                  + Prendre en photo un plat
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="gap-4">
              {dishes.map((dish) => (
                <View
                  key={dish.id}
                  className="bg-white p-4 rounded-2xl border border-gray-200 flex-row gap-4 shadow-xs"
                >
                  <Image
                    source={{ uri: dish.image }}
                    className="w-24 h-24 rounded-xl object-cover bg-gray-100"
                  />
                  <View className="flex-1 justify-between">
                    <View>
                      <Text className="text-base font-bold text-gray-900">
                        {dish.name}
                      </Text>
                      <Text
                        className="text-xs text-gray-500 mt-1"
                        numberOfLines={2}
                      >
                        {dish.description}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-base font-extrabold text-green-700">
                        {formatPrice(dish.price)}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteDish(dish.id, dish.name)}
                        className="p-1.5 bg-red-50 rounded-lg"
                      >
                        <TrashIcon size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* CONTENU ONGLET 2 : COMMANDES REÇUES */}
      {activeTab === "orders" && (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {orders.length === 0 ? (
            <View className="bg-white p-8 rounded-2xl items-center border border-gray-200">
              <Text className="text-4xl mb-3">📬</Text>
              <Text className="text-lg font-bold text-gray-800 text-center">
                Aucune commande pour l'instant
              </Text>
              <Text className="text-sm text-gray-500 text-center mt-1">
                Dès qu'un client passe commande de l'un de vos plats faits maison, elle s'affichera ici en direct !
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              {orders.map((order) => {
                const isPendingCook =
                  order.status === "PENDING_COOK_APPROVAL" ||
                  order.status === "PENDING";
                const isWaitingClient =
                  order.status === "WAITING_CLIENT_CONFIRMATION";
                const isPreparing =
                  order.status === "IN_PREPARATION" ||
                  order.status === "PREPARING";
                const isReady =
                  order.status === "READY_FOR_PICKUP" ||
                  order.status === "READY";
                const isAssigned =
                  order.status === "ASSIGNED_TO_DELIVERY";
                const isDelivered =
                  order.status === "DELIVERED" ||
                  order.status === "COMPLETE";
                const isDeclined =
                  order.status === "DECLINED_BY_COOK" ||
                  order.status === "DECLINED";
                const isCancelled =
                  order.status === "CANCELLED_BY_CLIENT";

                // Estimation values
                const currentPrepMin = parseInt(
                  prepTimes[order.id] !== undefined
                    ? prepTimes[order.id]
                    : order.initialEstimatedMinutes || 25
                ) || 0;
                const calculatedEndStr = getCalculatedTime(currentPrepMin);

                // Status text and badge styling
                let statusLabel = order.status;
                let badgeBg = "bg-gray-100";
                let badgeText = "text-gray-800";

                if (isPendingCook) {
                  statusLabel = t("statusPendingApproval");
                  badgeBg = "bg-amber-100";
                  badgeText = "text-amber-800";
                } else if (isWaitingClient) {
                  statusLabel = t("statusWaitingClient");
                  badgeBg = "bg-purple-100";
                  badgeText = "text-purple-800";
                } else if (isPreparing) {
                  statusLabel = t("statusInPreparation");
                  badgeBg = "bg-orange-100";
                  badgeText = "text-orange-800";
                } else if (isReady) {
                  statusLabel = t("statusReadyForPickup");
                  badgeBg = "bg-blue-100";
                  badgeText = "text-blue-800";
                } else if (isAssigned) {
                  statusLabel = t("statusAssignedDelivery");
                  badgeBg = "bg-indigo-100";
                  badgeText = "text-indigo-800";
                } else if (isDelivered) {
                  statusLabel = t("statusDelivered");
                  badgeBg = "bg-green-100";
                  badgeText = "text-green-800";
                } else if (isDeclined) {
                  statusLabel = t("statusDeclinedCook");
                  badgeBg = "bg-red-100";
                  badgeText = "text-red-800";
                } else if (isCancelled) {
                  statusLabel = t("statusCancelledClient");
                  badgeBg = "bg-red-100";
                  badgeText = "text-red-800";
                }

                return (
                  <View
                    key={order.id}
                    className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs mb-4"
                  >
                    {/* En-tête commande */}
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 pr-2">
                        <Text className="text-xs text-gray-400 font-mono">
                          #{order.id.slice(0, 8)}
                        </Text>
                        <Text className="text-base font-bold text-gray-900">
                          {order.userFirstName} {order.userLastName}
                        </Text>
                        {order.userPhoneNumber ? (
                          <Text className="text-xs text-gray-600 font-medium">
                            📞 {order.userPhoneNumber}
                          </Text>
                        ) : null}
                        <Text className="text-xs text-gray-500 mt-0.5">
                          📍 {order.userAddress}
                        </Text>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${badgeBg}`}>
                        <Text className={`text-xs font-bold ${badgeText}`}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>

                    {/* Plats commandés */}
                    <CookOrderDishes orderId={order.id} />

                    <View className="flex-row justify-between items-center my-2">
                      <Text className="text-sm font-semibold text-gray-600">
                        {t("orderTotal")} :
                      </Text>
                      <Text className="text-lg font-extrabold text-green-700">
                        {formatPrice(order.total)}
                      </Text>
                    </View>

                    {/* ETAPE 1 : PENDING_COOK_APPROVAL -> Saisie obligatoire du délai de préparation */}
                    {isPendingCook && (
                      <View className="mt-3 p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
                        <View className="flex-row items-center gap-2 mb-2">
                          <Text className="text-base">⏱️</Text>
                          <Text className="text-sm font-bold text-amber-900">
                            {t("cookEstimatingTitle")}
                          </Text>
                        </View>
                        <Text className="text-xs text-amber-800 mb-2">
                          {t("prepTimeLabel")}
                        </Text>

                        {/* Champ saisie minutes */}
                        <View className="flex-row items-center gap-2 mb-3">
                          <TextInput
                            keyboardType="numeric"
                            value={String(currentPrepMin)}
                            onChangeText={(val) =>
                              handlePrepTimeChange(order.id, val)
                            }
                            placeholder={t("enterPrepTime")}
                            className="bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-lg font-bold text-gray-800 w-24 text-center"
                          />
                          <Text className="text-sm font-semibold text-amber-900">
                            {t("mins")}
                          </Text>

                          {/* Boutons rapides */}
                          <View className="flex-row flex-1 justify-end gap-1.5 flex-wrap">
                            {[15, 25, 35, 45].map((preset) => (
                              <TouchableOpacity
                                key={preset}
                                onPress={() =>
                                  handlePrepTimeChange(order.id, String(preset))
                                }
                                className={`px-2.5 py-1.5 rounded-lg border ${
                                  currentPrepMin === preset
                                    ? "bg-amber-600 border-amber-600"
                                    : "bg-white border-amber-300"
                                }`}
                              >
                                <Text
                                  className={`text-xs font-bold ${
                                    currentPrepMin === preset
                                      ? "text-white"
                                      : "text-amber-800"
                                  }`}
                                >
                                  {preset}m
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>

                        {/* Calcul heure exacte de fin : Heure actuelle + Temps de préparation */}
                        <View className="bg-white/80 p-3 rounded-xl border border-amber-200/80 mb-3">
                          <Text className="text-xs text-gray-600">
                            {t("calculatedEndTime")}
                          </Text>
                          <Text className="text-base font-extrabold text-green-700">
                            🏁 {calculatedEndStr} ({currentPrepMin} {t("mins")})
                          </Text>
                        </View>

                        {/* Boutons d'action */}
                        <View className="gap-2">
                          <TouchableOpacity
                            onPress={() => validateCookEstimation(order)}
                            className="bg-green-600 p-3.5 rounded-xl items-center shadow-xs"
                          >
                            <Text className="text-white font-bold text-sm">
                              {t("validateEstimation")}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => declineOrderByCook(order.id)}
                            className="bg-red-50 p-2.5 rounded-xl items-center border border-red-200"
                          >
                            <Text className="text-red-700 font-bold text-xs">
                              {t("declineOrder")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* ETAPE 2 : WAITING_CLIENT_CONFIRMATION */}
                    {isWaitingClient && (
                      <View className="mt-3 p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                        <Text className="text-xs font-bold text-purple-900 mb-1">
                          ⏰ Estimation transmise au client
                        </Text>
                        <Text className="text-xs text-purple-700">
                          Délai : {order.prepTimeMinutes} {t("mins")} · Fin prévue à :{" "}
                          <Text className="font-bold">
                            {order.estimatedReadyTimeStr || getCalculatedTime(order.prepTimeMinutes)}
                          </Text>
                        </Text>
                        <Text className="text-xs text-purple-600 mt-1 italic">
                          En attente de l'accord du client pour commencer la préparation.
                        </Text>
                      </View>
                    )}

                    {/* ETAPE 3 : IN_PREPARATION -> Bouton « Fin de la préparation » */}
                    {isPreparing && (
                      <View className="mt-3 gap-2">
                        <View className="p-3 bg-orange-50 border border-orange-200 rounded-xl mb-1">
                          <Text className="text-xs font-bold text-orange-900">
                            🍲 Accord client reçu ! Cuisson en cours
                          </Text>
                          <Text className="text-xs text-orange-700">
                            Heure de fin estimée :{" "}
                            <Text className="font-bold">
                              {order.estimatedReadyTimeStr || "..."}
                            </Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => markOrderReady(order.id)}
                          className="bg-green-600 p-3.5 rounded-xl items-center shadow-sm"
                        >
                          <Text className="text-white font-bold text-sm">
                            {t("finishPreparation")}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* ETAPE 4 : READY_FOR_PICKUP */}
                    {isReady && (
                      <View className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                        <Text className="text-xs font-bold text-blue-900">
                          🛵 Repas prêt et emballé !
                        </Text>
                        <Text className="text-xs text-blue-700 mt-0.5">
                          Notification envoyée à tous les livreurs disponibles. Dès qu'un livreur accepte, il sera assigné en exclusivité.
                        </Text>
                      </View>
                    )}

                    {/* ETAPE 5 : ASSIGNED_TO_DELIVERY */}
                    {isAssigned && (
                      <View className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                        <Text className="text-xs font-bold text-indigo-900">
                          🚴🏻‍♀️ Livreur en route vers votre cuisine !
                        </Text>
                        <Text className="text-xs text-indigo-800 font-semibold mt-1">
                          Livreur : {order.driverName || "Livreur Partenaire"}
                        </Text>
                        {order.driverPhone ? (
                          <Text className="text-xs text-indigo-700">
                            Téléphone : {order.driverPhone}
                          </Text>
                        ) : null}
                      </View>
                    )}

                    {/* ETAPE 6 : DELIVERED */}
                    {isDelivered && (
                      <View className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <Text className="text-xs font-bold text-green-800">
                          ✅ Repas remis au client avec succès !
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default CookDashboardScreen;

