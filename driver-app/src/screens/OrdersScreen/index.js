import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import OrderItem from "../../components/OrderItem";
import MapView, { Marker } from "react-native-maps";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase/firebase.js";
import { useAuth } from "../../contexts/AuthContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const { signOutUser } = useAuth();

  useEffect(() => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("status", "==", "READY"),
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
        {orders.map((order, index) => (
          <Marker
            key={index + 1}
            id={order.id}
            title={order.restaurantName}
            description={order.restaurantAddress}
            coordinate={{
              latitude: order.restaurantLatitude,
              longitude: order.restaurantLongitude,
            }}
          >
            <View
              style={{ backgroundColor: "green", padding: 5, borderRadius: 20 }}
            >
              <Entypo name="shop" size={24} color="white" />
            </View>
          </Marker>
        ))}
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
                  fontSize: 20,
                  fontWeight: "700",
                  letterSpacing: 0.5,
                  paddingBottom: 2,
                }}
              >
                En ligne (Livreur){" "}
              </Text>
              <View style={{ backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, marginLeft: 4 }}>
                <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "bold" }}>Certifié ✓</Text>
              </View>
            </View>
            <Text style={{ letterSpacing: 0.5, color: "grey" }}>
              Commandes prêtes : {orders.length}
            </Text>
          </View>
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
        <FlatList
          data={orders}
          renderItem={({ item }) => <OrderItem order={item} />}
        />
      </BottomSheet>
    </View>
  );
};

export default OrdersScreen;
