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
              {orders.length === 0 && (
                <View className="flex-1 bg-white justify-center items-center py-20">
                  <Text className="text-lg font-bold text-gray-500">
                    {t("noOrdersYet")}
                  </Text>
                </View>
              )}

              {orders.map((order, index) => {
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
      </SafeAreaView>
    </>
  );
};

export default OrderDetailsScreen;
