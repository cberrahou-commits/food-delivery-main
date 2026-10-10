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
import WilayaSelectorModal from "../../components/WilayaSelectorModal";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
} from "firebase/firestore";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [driverRating, setDriverRating] = useState(5.0);
  const [driverRatingCount, setDriverRatingCount] = useState(0);
  const { user, signOutUser } = useAuth();
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

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "user", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.driverRating !== undefined) setDriverRating(data.driverRating);
        if (data.driverRatingCount !== undefined) setDriverRatingCount(data.driverRatingCount);
      }
    });
    return unsub;
  }, [user?.uid]);


  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();

  const snapPoints = useMemo(() => ["12%", "90%"], []);

  const filteredOrders = useMemo(() => {
    if (!selectedWilaya) return orders;
    const wCode = selectedWilaya.code;
    const wName = selectedWilaya.name.toLowerCase();
    return orders.filter((o) => {
      if (o.restaurantWilayaCode === wCode) return true;
      if (
        o.restaurantWilaya &&
        (o.restaurantWilaya.includes(wCode) ||
          o.restaurantWilaya.toLowerCase().includes(wName))
      )
        return true;
      if (
        o.restaurantAddress &&
        o.restaurantAddress.toLowerCase().includes(wName)
      )
        return true;
      return false;
    });
  }, [orders, selectedWilaya]);

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
        {filteredOrders.map((order, index) => {
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
              <View style={{ backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 6 }}>
                <Text style={{ color: "#b45309", fontSize: 11, fontWeight: "bold" }}>⭐ {Number(driverRating).toFixed(1)} ({driverRatingCount})</Text>
              </View>
            </View>
            <Text style={{ letterSpacing: 0.5, color: "grey", marginTop: 2 }}>
              {t("readyOrders")} {filteredOrders.length}
            </Text>
            <TouchableOpacity
              onPress={() => setWilayaModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#f0fdf4",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#bbf7d0",
                marginTop: 4,
                alignSelf: "flex-start",
              }}
            >
              <Entypo name="location-pin" size={13} color="#16a34a" />
              <Text style={{ fontSize: 11, fontWeight: "bold", color: "#166534", marginLeft: 2 }}>
                {selectedWilaya ? `${selectedWilaya.code} - ${selectedWilaya.name}` : "Toutes les Wilayas 🇩🇿"}
              </Text>
            </TouchableOpacity>
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
          data={filteredOrders}
          renderItem={({ item }) => <OrderItem order={item} />}
        />
      </BottomSheet>

      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <WilayaSelectorModal
        visible={wilayaModalVisible}
        onClose={() => setWilayaModalVisible(false)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        title="Filtrer les commandes par Wilaya"
      />
    </View>
  );
};

export default OrdersScreen;
