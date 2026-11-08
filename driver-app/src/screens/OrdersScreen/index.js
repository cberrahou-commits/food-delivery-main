import { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, FlatList, useWindowDimensions, TouchableOpacity, Image } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import OrderItem from "../../components/OrderItem";
import MapView, { Marker } from "react-native-maps";
import { Entypo, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../../../firebase/firebase.js";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import LanguageSelectorModal from "../../components/LanguageSelectorModal";
import WilayaSelectorModal from "../../components/WilayaSelectorModal";
import DriverProfileModal from "../../components/DriverProfileModal";
import { detectDriverWilaya, findWilaya } from "../../constants/wilayas";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [driverRating, setDriverRating] = useState(null);
  const [driverRatingCount, setDriverRatingCount] = useState(0);
  const [driverData, setDriverData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const { user, signOutUser } = useAuth();
  const { t, language } = useLanguage();

  // 1. Écoute en temps réel des commandes prêtes
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

    return unsubscribe;
  }, []);

  // 2. Écoute du profil du coursier en temps réel (notes, zone, etc.)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, "user", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDriverData(data);
        if (data.driverRating !== undefined && data.driverRating !== null) {
          setDriverRating(data.driverRating);
        }
        if (data.driverRatingCount !== undefined) {
          setDriverRatingCount(data.driverRatingCount);
        }
      }
    });
    return unsub;
  }, [user?.uid]);

  // 3. Détection et géolocalisation de la zone géographique du coursier
  useEffect(() => {
    let isMounted = true;

    const initZoneAndLocation = async () => {
      try {
        // A. Vérifier si une wilaya a déjà été sauvegardée
        const savedWilayaStr = await AsyncStorage.getItem("@wajbati_driver_wilaya");
        if (savedWilayaStr) {
          const parsed = JSON.parse(savedWilayaStr);
          if (parsed && isMounted) {
            setSelectedWilaya(parsed);
          }
        }

        // B. Demander la permission GPS et récupérer la position en direct
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (loc?.coords && isMounted) {
            const coords = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setDriverLocation(coords);

            // Mettre à jour la position du coursier dans Firestore pour le dispatching
            if (user?.uid) {
              updateDoc(doc(db, "user", user.uid), {
                latitude: coords.latitude,
                longitude: coords.longitude,
              }).catch(() => {});
            }

            // Si aucune wilaya n'est encore sélectionnée, la détecter automatiquement
            if (!savedWilayaStr) {
              const detected = await detectDriverWilaya({
                user,
                dbUser: driverData,
                LocationModule: Location,
              });
              if (detected && isMounted) {
                setSelectedWilaya(detected);
                AsyncStorage.setItem("@wajbati_driver_wilaya", JSON.stringify(detected));
              }
            }
          }
        }
      } catch (err) {
        console.warn("Zone / Location init error driver:", err);
      }
    };

    initZoneAndLocation();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleSelectWilaya = async (wilaya) => {
    setSelectedWilaya(wilaya);
    try {
      if (wilaya) {
        await AsyncStorage.setItem("@wajbati_driver_wilaya", JSON.stringify(wilaya));
      } else {
        await AsyncStorage.removeItem("@wajbati_driver_wilaya");
      }
    } catch (e) {
      console.warn("AsyncStorage driver wilaya error:", e);
    }
  };

  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["14%", "90%"], []);

  // 4. Filtrage STRICT par zone géographique : le livreur ne voit que les commandes de sa zone
  const filteredOrders = useMemo(() => {
    if (!selectedWilaya) return orders;
    const wCode = String(selectedWilaya.code || "").trim();
    const wName = String(selectedWilaya.name || "").trim().toLowerCase();
    const wNameAr = String(selectedWilaya.nameAr || "").trim().toLowerCase();

    return orders.filter((o) => {
      const oCode = String(o.restaurantWilayaCode || "").trim();
      const oWilaya = String(o.restaurantWilaya || "").toLowerCase();
      const oAddress = String(o.restaurantAddress || "").toLowerCase();

      if (oCode && oCode === wCode) return true;
      if (oWilaya && (oWilaya.includes(wCode) || oWilaya.includes(wName) || (wNameAr && oWilaya.includes(wNameAr)))) return true;
      if (oAddress && (oAddress.includes(wName) || (wCode && oAddress.includes(wCode)) || (wNameAr && oAddress.includes(wNameAr)))) return true;
      return false;
    });
  }, [orders, selectedWilaya]);

  const hasRating = driverRatingCount > 0 && driverRating !== null && driverRating !== undefined;

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
                style={{ backgroundColor: "#16a34a", padding: 6, borderRadius: 20, borderWidth: 2, borderColor: "white" }}
              >
                <Entypo name="shop" size={20} color="white" />
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
            marginHorizontal: 16,
            marginBottom: 16,
          }}
        >
          {/* Clic sur l'avatar ou le nom pour ouvrir le Profil consultable du coursier */}
          <TouchableOpacity
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
            style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
          >
            <Image
              source={require("../../../assets/icon.png")}
              style={{ width: 44, height: 44, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: "#a7f3d0" }}
            />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "800",
                    color: "#064e3b",
                  }}
                >
                  Wajbati <Text style={{ fontSize: 13, color: "#10b981", fontWeight: "bold" }}>وجبتي</Text>
                </Text>

                {/* Badge Note du Livreur : Pas de 5 par défaut si non noté ! */}
                <View
                  style={{
                    backgroundColor: hasRating ? "#fef3c7" : "#ecfdf5",
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: hasRating ? "#fde68a" : "#a7f3d0",
                  }}
                >
                  <Text
                    style={{
                      color: hasRating ? "#b45309" : "#065f46",
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    {hasRating ? `⭐ ${Number(driverRating).toFixed(1)} (${driverRatingCount})` : "✨ Nouveau"}
                  </Text>
                </View>
              </View>

              {/* Compteur de courses dans la zone */}
              <Text style={{ color: "#6b7280", fontSize: 11, marginTop: 1 }}>
                {t("readyOrders") || "Courses disponibles :"} {filteredOrders.length}
              </Text>

              {/* Sélecteur de zone géographique (Wilaya) */}
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
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#166534", marginLeft: 2 }}>
                  {selectedWilaya
                    ? `Zone : ${selectedWilaya.code} - ${selectedWilaya.name}`
                    : "📍 Détecter ma zone..."}
                </Text>
                <Entypo name="chevron-down" size={12} color="#166534" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Langue & Déconnexion */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setLangModalVisible(true)}
              style={{
                paddingHorizontal: 9,
                paddingVertical: 5,
                backgroundColor: "#f0fdf4",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#bbf7d0",
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#16a34a" }}>
                {language === "ar" ? "🇩🇿 عربي" : language === "en" ? "🇬🇧 EN" : "🇫🇷 FR"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={signOutUser}
              style={{
                padding: 7,
                backgroundColor: "#fee2e2",
                borderRadius: 16,
              }}
            >
              <MaterialIcons name="logout" size={18} color="#dc2626" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Liste des commandes filtrées pour cette zone avec calcul du temps estimé */}
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderItem order={item} driverLocation={driverLocation} />
          )}
          ListEmptyComponent={
            <View style={{ padding: 26, alignItems: "center" }}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🛵</Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827", textAlign: "center" }}>
                {selectedWilaya
                  ? `Aucune course prête à ${selectedWilaya.name}`
                  : "Aucune course disponible"}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: "#6b7280",
                  textAlign: "center",
                  marginTop: 6,
                  lineHeight: 18,
                  paddingHorizontal: 12,
                }}
              >
                Vous ne voyez que les commandes de votre zone géographique (
                {selectedWilaya?.name || "active"}). Dès qu'un restaurateur termine une préparation, vous recevrez une alerte avec le temps de trajet estimé !
              </Text>
            </View>
          }
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
        onSelectWilaya={handleSelectWilaya}
        title="Zone géographique de livraison"
      />

      <DriverProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        driverUser={{ ...user, ...driverData }}
        driverRating={driverRating}
        driverRatingCount={driverRatingCount}
        selectedWilaya={selectedWilaya}
      />
    </View>
  );
};

export default OrdersScreen;
