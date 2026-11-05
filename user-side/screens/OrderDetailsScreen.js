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

          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            <View className="mb-20">
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
              ) : orders.length === 0 ? (
                <View className="flex-1 bg-white justify-center items-center py-20">
                  <Text className="text-lg font-bold text-gray-500">
                    {t("noOrdersYet")}
                  </Text>
                </View>
              ) : null}

              {user && orders.map((order, index) => {
                return (
                  <Order
                    key={index}
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
