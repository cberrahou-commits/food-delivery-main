import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar as RNStatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "react-native-heroicons/solid";
import Order from "../components/Order";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { UserAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";
import McDoBottomNav from "../components/McDoBottomNav";

const OrderDetailsScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = UserAuth();
  const { t } = useLanguage();
  const navigation = useNavigation();

  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'toRate', 'active', 'delivered'

  useEffect(() => {
    if (!user?.uid) return;

    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("userId", "==", user.uid),
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
        console.warn("Orders onSnapshot error:", error);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Sous-ensembles de commandes
  const toRateOrders = orders.filter(
    (o) => (o.status === "DELIVERED" || o.status === "COMPLETE") && !o.hasRated
  );
  const activeOrders = orders.filter(
    (o) =>
      o.status !== "DELIVERED" &&
      o.status !== "COMPLETE" &&
      o.status !== "DECLINED_BY_COOK" &&
      o.status !== "CANCELLED_BY_CLIENT"
  );
  const historyOrders = orders.filter(
    (o) =>
      o.status === "DELIVERED" ||
      o.status === "COMPLETE" ||
      o.status === "DECLINED_BY_COOK" ||
      o.status === "CANCELLED_BY_CLIENT"
  );

  const displayedOrders =
    activeFilter === "toRate"
      ? toRateOrders
      : activeFilter === "active"
      ? activeOrders
      : activeFilter === "delivered"
      ? historyOrders
      : orders;

  return (
    <>
      <StatusBar style="dark" />

      <SafeAreaView
        edges={["left", "right", "bottom"]}
        style={{
          flex: 1,
          backgroundColor: "white",
          paddingTop:
            Platform.OS === "android"
              ? Math.max(insets.top, (RNStatusBar.currentHeight || 0) + 16, 52)
              : Math.max(insets.top, 44),
        }}
      >
        <View className=" bg-white">
          <View className="p-5 bg-white shadow-xs">
            <TouchableOpacity
              onPress={navigation.goBack}
              className="absolute top-4 left-4 bg-white p-2 rounded-full"
            >
              <ArrowLeftIcon size={30} color="#00CCBB" />
            </TouchableOpacity>

            <View>
              <Text className="text-xl font-bold text-center">{t("myOrders")}</Text>
            </View>
          </View>

          {/* Onglets de filtrage avec volet spécial Commandes à noter */}
          {user && orders.length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {/* 1. Toutes */}
                <TouchableOpacity
                  onPress={() => setActiveFilter("all")}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: activeFilter === "all" ? "#111827" : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: activeFilter === "all" ? "white" : "#4B5563",
                    }}
                  >
                    {t("allOrdersTab") || "Toutes"} ({orders.length})
                  </Text>
                </TouchableOpacity>

                {/* 2. Volet spécial À Noter */}
                <TouchableOpacity
                  onPress={() => setActiveFilter("toRate")}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor:
                      activeFilter === "toRate"
                        ? "#D97706"
                        : toRateOrders.length > 0
                        ? "#FEF3C7"
                        : "#F3F4F6",
                    borderWidth: toRateOrders.length > 0 ? 1 : 0,
                    borderColor: "#F59E0B",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color:
                        activeFilter === "toRate"
                          ? "white"
                          : toRateOrders.length > 0
                          ? "#B45309"
                          : "#4B5563",
                    }}
                  >
                    ⭐ {t("toRateTab") || "À noter"} ({toRateOrders.length})
                  </Text>
                </TouchableOpacity>

                {/* 3. En cours */}
                <TouchableOpacity
                  onPress={() => setActiveFilter("active")}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: activeFilter === "active" ? "#111827" : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: activeFilter === "active" ? "white" : "#4B5563",
                    }}
                  >
                    🛵 {t("activeOrdersTab") || "En cours"} ({activeOrders.length})
                  </Text>
                </TouchableOpacity>

                {/* 4. Historique */}
                <TouchableOpacity
                  onPress={() => setActiveFilter("delivered")}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: activeFilter === "delivered" ? "#111827" : "#F3F4F6",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: activeFilter === "delivered" ? "white" : "#4B5563",
                    }}
                  >
                    ✅ {t("deliveredOrdersTab") || "Historique"} ({historyOrders.length})
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="mb-20">
              {/* Bannière d'alerte spéciale Commandes à noter */}
              {user && toRateOrders.length > 0 && activeFilter !== "toRate" && (
                <View
                  style={{
                    marginHorizontal: 16,
                    marginTop: 6,
                    marginBottom: 12,
                    backgroundColor: "#FEF3C7",
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: "#FDE68A",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 16 }}>⭐</Text>
                      <Text style={{ fontWeight: "900", color: "#92400E", fontSize: 13 }}>
                        {t("pendingReviews") || "Commandes à noter"} ({toRateOrders.length})
                      </Text>
                    </View>
                    <Text style={{ color: "#B45309", fontSize: 11, marginTop: 2 }}>
                      {t("pendingReviewsSubtitle") || "Donnez votre avis sur le restaurant et le livreur !"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setActiveFilter("toRate")}
                    style={{
                      backgroundColor: "#D97706",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "white", fontWeight: "900", fontSize: 11 }}>
                      {t("rateNow") || "Noter ⭐"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {!user ? (
                <View className="flex-1 bg-white justify-center items-center py-16 px-6">
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: "#FEF3C7",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text style={{ fontSize: 32 }}>📦</Text>
                  </View>
                  <Text className="text-xl font-black text-gray-900 text-center mb-2">
                    Suivez vos commandes en direct
                  </Text>
                  <Text className="text-sm text-gray-500 text-center mb-6 leading-5">
                    Connectez-vous ou créez votre compte pour suivre le livreur en temps réel et retrouver tout votre historique.
                  </Text>
                  <View style={{ flexDirection: "row", gap: 12, width: "100%", maxWidth: 320 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("SignIn")}
                      style={{
                        flex: 1,
                        backgroundColor: "#FFBC0D",
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#111827" }}>Se connecter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("SignUp")}
                      style={{
                        flex: 1,
                        backgroundColor: "white",
                        borderWidth: 1.5,
                        borderColor: "#D1D5DB",
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontWeight: "900", color: "#111827" }}>S'inscrire</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : displayedOrders.length === 0 ? (
                <View className="flex-1 bg-white justify-center items-center py-20 px-6">
                  {activeFilter === "toRate" ? (
                    <>
                      <Text style={{ fontSize: 36, marginBottom: 8 }}>🎉</Text>
                      <Text className="text-base font-black text-gray-800 text-center">
                        Toutes vos commandes sont notées !
                      </Text>
                      <Text className="text-xs text-gray-500 text-center mt-1">
                        Merci de contribuer à la communauté Wajbati avec vos avis.
                      </Text>
                    </>
                  ) : (
                    <Text className="text-lg font-bold text-gray-500">
                      {t("noOrdersYet")}
                    </Text>
                  )}
                </View>
              ) : null}

              {user && displayedOrders.map((order, index) => {
                return (
                  <Order
                    key={order.id || index}
                    orderId={order.id}
                    order={order}
                    status={order.status}
                    restaurantId={order.restaurantId}
                    restaurantName={order.restaurantName}
                    total={order.total}
                    timestamp={order.createdAt}
                  />
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Barre de navigation 5 onglets McDo */}
        <McDoBottomNav activeTab="orders" />
      </SafeAreaView>
    </>
  );
};

export default OrderDetailsScreen;
