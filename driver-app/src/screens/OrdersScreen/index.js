import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import OrderItem from "../../components/OrderItem";
import MapView, { Marker } from "react-native-maps";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase/firebase.js";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelectorModal from "../../components/LanguageSelectorModal";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const { signOutUser } = useAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "in", ["READY_FOR_PICKUP", "READY"]),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let item = [];
      querySnapshot.forEach((doc) => {
        item.push({ ...doc.data(), id: doc.id });
      });
      setOrders(item);
    });

    return unsubscribe; // Cleanup function to unsubscribe from real-time updates
  }, []);


  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();

  const snapPoints = useMemo(() => ["12%", "90%"], []);

  return (
    <View style={{ backgroundColor: "white", flex: 1 }}>
      <MapView
        style={{
          height,
          width,
        }}
        showsUserLocation
        followsUserLocation
      >
        {orders.map((order, index) => {
          const lat = Number(order.restaurantLatitude);
          const lng = Number(order.restaurantLongitude);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={order.id || `order-${index}`}
              id={order.id}
              title={order.restaurantName || "Restaurant"}
              description={order.restaurantAddress || ""}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
            >
              <View
                style={{ backgroundColor: "green", padding: 5, borderRadius: 20 }}
              >
                <Entypo name="shop" size={24} color="white" />
              </View>
            </Marker>
          );
        })}
      </MapView>
      <BottomSheet ref={bottomSheetRef} snapPoints={snapPoints}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginHorizontal: 20,
            marginBottom: 20,
          }}
        >
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  paddingBottom: 2,
                }}
              >
                {t("driverOnline")}{" "}
              </Text>
              <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 4 }}>
                <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "bold" }}>{t("certified")}</Text>
              </View>
            </View>
            <Text style={{ letterSpacing: 0.5, color: "grey", marginTop: 2 }}>
              {t("readyOrders")} {orders.length}
            </Text>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <TouchableOpacity
              onPress={() => setLangModalVisible(true)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: "#f0fdf4",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#16a34a" }}>
                {language === "ar" ? "🇩🇿 عربي" : language === "en" ? "🇬🇧 EN" : "🇫🇷 FR"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={signOutUser}
              style={{
                padding: 8,
                backgroundColor: "#fee2e2",
                borderRadius: 20,
              }}
            >
              <MaterialIcons name="logout" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>
        <FlatList
          data={orders}
          renderItem={({ item }) => <OrderItem order={item} />}
        />
      </BottomSheet>

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </View>
  );
};

export default OrdersScreen;
