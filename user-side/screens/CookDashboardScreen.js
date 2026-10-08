import React, { useState, useEffect } from "react";
import {
  View,
  Text,
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
      });
      Alert.alert(
        "Statut mis à jour",
        newStatus === "READY"
          ? "La commande est prête ! Les livreurs ont été prévenus pour la récupérer 🛵"
          : "Commande passée en préparation 🍲"
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de mettre à jour le statut.");
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
                const isPending = order.status === "PENDING";
                const isPreparing = order.status === "PREPARING";
                const isReady = order.status === "READY";
                const isComplete = order.status === "COMPLETE";

                return (
                  <View
                    key={order.id}
                    className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="text-xs text-gray-400 font-mono">
                          #{order.id.slice(0, 8)}
                        </Text>
                        <Text className="text-base font-bold text-gray-900">
                          Client : {order.userFirstName} {order.userLastName}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {order.userAddress}
                        </Text>
                      </View>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          isPending
                            ? "bg-yellow-100"
                            : isPreparing
                            ? "bg-orange-100"
                            : isReady
                            ? "bg-blue-100"
                            : "bg-green-100"
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            isPending
                              ? "text-yellow-800"
                              : isPreparing
                              ? "text-orange-800"
                              : isReady
                              ? "text-blue-800"
                              : "text-green-800"
                          }`}
                        >
                          {isPending
                            ? "⏳ En attente"
                            : isPreparing
                            ? "🍲 En préparation"
                            : isReady
                            ? "🛵 Prête pour livreur"
                            : "✅ Livrée"}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-base font-extrabold text-green-700 my-2">
                      Total : {formatPrice(order.total)}
                    </Text>

                    {/* Actions sur la commande */}
                    <View className="mt-3 gap-2">
                      {isPending && (
                        <TouchableOpacity
                          onPress={() => updateOrderStatus(order.id, "PREPARING")}
                          className="bg-green-600 p-3 rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-sm">
                            Accepter & Commencer à cuisiner 🍲
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isPreparing && (
                        <TouchableOpacity
                          onPress={() => updateOrderStatus(order.id, "READY")}
                          className="bg-blue-600 p-3 rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-sm">
                            Prêt pour le livreur 🛵 (Alerter les coursiers)
                          </Text>
                        </TouchableOpacity>
                      )}

                      {isReady && (
                        <View className="bg-gray-100 p-3 rounded-xl items-center">
                          <Text className="text-gray-600 text-xs font-semibold">
                            Visible sur la carte GPS des livreurs...
                          </Text>
                        </View>
                      )}
                    </View>
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

