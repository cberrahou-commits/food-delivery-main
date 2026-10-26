import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
} from "react-native-heroicons/solid";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import * as Location from "expo-location";
import { UserAuth } from "../contexts/AuthContext";
import McDoBottomNav from "../components/McDoBottomNav";
import BasketIcon from "../components/BasketIcon";
import OrderModeModal from "../components/OrderModeModal";
import WilayaSelectorModal from "../components/WilayaSelectorModal";
import { FOOD_CATEGORIES, getCategoryShortName } from "../constants/categories";
import { useLanguage } from "../contexts/LanguageContext";

// Calcul de distance Haversine en kilomètres
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(distKm, t, language) {
  if (distKm === null || distKm === undefined) return t("nearby") || "À proximité";
  if (distKm < 1) {
    const meters = Math.round(distKm * 1000);
    return language === "ar" ? `على بعد ${meters} م` : `à ${meters} m`;
  }
  return language === "ar" ? `على بعد ${distKm.toFixed(1)} كم` : `à ${distKm.toFixed(1)} km`;
}

const MenuCategoriesScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { dbUser } = UserAuth();
  const { t, language } = useLanguage();

  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);
  const [orderModeModalVisible, setOrderModeModalVisible] = useState(false);
  const [orderMode, setOrderMode] = useState("DELIVERY");

  // Type filter: 'all' | 'restaurant' | 'cook'
  const [typeFilter, setTypeFilter] = useState("all");
  // Category filter: null or category id
  const [selectedCatFilter, setSelectedCatFilter] = useState(
    route.params?.selectedCategory || null
  );

  // Position client
  const [clientCoords, setClientCoords] = useState({
    latitude: dbUser?.latitude || 36.7538,
    longitude: dbUser?.longitude || 3.0588,
  });

  useEffect(() => {
    fetchClientLocation();
    fetchEstablishments();
  }, []);

  const fetchClientLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (pos?.coords) {
          setClientCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        }
      }
    } catch (e) {
      console.warn("Client location error:", e);
    }
  };

  const fetchEstablishments = async () => {
    try {
      const snap = await getDocs(collection(db, "restaurants"));
      let list = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        const isApproved =
          data.isVerified === true || data.status === "APPROVED";
        if (isApproved) {
          list.push({
            id: docSnap.id,
            ...data,
            lat: Number(data.lat || 36.7538),
            lng: Number(data.lng || 3.0588),
          });
        }
      });
      setEstablishments(list);
    } catch (err) {
      console.warn("Error fetching establishments:", err);
    } finally {
      setLoading(false);
    }
  };

  // Liste triée par distance géographique croissante (le plus proche en premier)
  const sortedEstablishments = useMemo(() => {
    let list = establishments.map((est) => {
      const distKm = getDistanceInKm(
        clientCoords.latitude,
        clientCoords.longitude,
        est.lat,
        est.lng
      );
      return {
        ...est,
        distanceKm: distKm !== null ? distKm : 9999,
        formattedDistance: formatDistance(distKm, t, language),
      };
    });

    // Tri par éloignement géographique croissant
    list.sort((a, b) => a.distanceKm - b.distanceKm);

    // Filtre par Wilaya si sélectionnée
    if (selectedWilaya) {
      const wCode = String(selectedWilaya.code || "");
      const wName = String(selectedWilaya.name || "").toLowerCase();
      list = list.filter((r) => {
        if (r.wilayaCode && String(r.wilayaCode) === wCode) return true;
        if (
          r.wilaya &&
          (String(r.wilaya).includes(wCode) || String(r.wilaya).toLowerCase().includes(wName))
        )
          return true;
        if (r.address && String(r.address).toLowerCase().includes(wName)) return true;
        return false;
      });
    }

    // Filtre par type (restaurant ou cuisinier maison)
    if (typeFilter === "cook") {
      list = list.filter((r) => r.isCook || r.isHomemade);
    } else if (typeFilter === "restaurant") {
      list = list.filter((r) => !r.isCook && !r.isHomemade);
    }

    // Filtre par catégorie culinaire
    if (selectedCatFilter) {
      const filterLower = selectedCatFilter.toLowerCase();
      list = list.filter((r) => {
        const genre = (r.genre || "").toLowerCase();
        const desc = (r.description || "").toLowerCase();
        return genre.includes(filterLower) || desc.includes(filterLower);
      });
    }

    return list;
  }, [
    establishments,
    clientCoords,
    selectedWilaya,
    typeFilter,
    selectedCatFilter,
  ]);

  const getModeLabel = () => {
    switch (orderMode) {
      case "PICKUP":
        return t("orderModePickup");
      case "DINE_IN":
        return t("orderModeDineIn");
      default:
        return t("orderModeDelivery");
    }
  };

  return (
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
      {/* Header McDo style */}
      <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 10 }}>
        {/* Logo Wajbati en squircle centré */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#076241", // Vert émeraude Wajbati
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 8,
            overflow: "hidden",
          }}
        >
          <Image
            source={require("../assets/logo.png")}
            style={{ width: 44, height: 44, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>

        {/* Ville / Wilaya */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "900",
            color: "#111827",
            letterSpacing: 0.5,
            textAlign: "center",
          }}
        >
          {selectedWilaya?.name
            ? String(selectedWilaya.name).toUpperCase()
            : dbUser?.address
            ? String(dbUser.address).toUpperCase()
            : "ALGER & ENVIRONS"}
        </Text>

        <Text
          style={{
            fontSize: 12,
            color: "#6B7280",
            marginTop: 2,
            textAlign: "center",
          }}
        >
          {selectedWilaya?.code
            ? `Wilaya ${selectedWilaya.code} · Algérie`
            : t("closestSorted")}
        </Text>

        {/* Lien vert modifier la Wilaya */}
        <TouchableOpacity
          onPress={() => setWilayaModalVisible(true)}
          style={{ marginTop: 4 }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#059669",
            }}
          >
            {t("changeWilaya")}
          </Text>
        </TouchableOpacity>

        {/* Sélecteur de mode de commande */}
        <TouchableOpacity
          onPress={() => setOrderModeModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
            paddingHorizontal: 12,
            paddingVertical: 4,
            backgroundColor: "#F3F4F6",
            borderRadius: 16,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }}>
            {getModeLabel()}
          </Text>
          <ChevronDownIcon size={14} color="#111827" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Ligne de séparation fine */}
      <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />

      {/* Filtres par Type (Tous, Restaurants, Cuisiniers) */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
          backgroundColor: "#FAFAFA",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <TouchableOpacity
          onPress={() => setTypeFilter("all")}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: typeFilter === "all" ? "#FFBC0D" : "#E5E7EB",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827" }}>
            🍽️ {t("filterAll")} ({establishments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTypeFilter("restaurant")}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor:
              typeFilter === "restaurant" ? "#059669" : "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: typeFilter === "restaurant" ? "white" : "#111827",
            }}
          >
            🏢 {t("filterRestaurants")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTypeFilter("cook")}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: typeFilter === "cook" ? "#EA580C" : "#E5E7EB",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "800",
              color: typeFilter === "cook" ? "white" : "#111827",
            }}
          >
            🍳 {t("filterHomeCook")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Catégories Culinaires en puces horizontales */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 8,
            gap: 6,
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedCatFilter(null)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 15,
              backgroundColor: !selectedCatFilter ? "#111827" : "#F3F4F6",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: !selectedCatFilter ? "white" : "#4B5563",
              }}
            >
              {t("allSpecialties")}
            </Text>
          </TouchableOpacity>

          {FOOD_CATEGORIES.map((cat) => {
            const isSelected = selectedCatFilter === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() =>
                  setSelectedCatFilter(isSelected ? null : cat.id)
                }
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 15,
                  backgroundColor: isSelected ? "#059669" : "#F3F4F6",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 12 }}>{cat.icon}</Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: isSelected ? "white" : "#4B5563",
                  }}
                >
                  {getCategoryShortName(cat, language)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Liste des Établissements classés par éloignement géographique */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
            {t("closestPlaces")}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>
            📍 {t("closestSorted")}
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={{ marginTop: 8, fontSize: 12, color: "#6B7280" }}>
              Calcul des distances...
            </Text>
          </View>
        ) : sortedEstablishments.length === 0 ? (
          <View
            style={{
              padding: 30,
              backgroundColor: "#F9FAFB",
              borderRadius: 16,
              alignItems: "center",
              marginTop: 20,
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📍</Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "bold",
                color: "#1F2937",
                textAlign: "center",
              }}
            >
              {t("noEstablishments")}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                textAlign: "center",
                marginTop: 4,
              }}
            >
              {t("noEstablishmentsDesc")}
            </Text>
          </View>
        ) : (
          sortedEstablishments.map((est) => {
            const isCook = est.isCook || est.isHomemade;
            const rawImg = est.image || est.exteriorImage;
            const photoUrl =
              rawImg &&
              typeof rawImg === "string" &&
              (rawImg.startsWith("http://") || rawImg.startsWith("https://") || rawImg.startsWith("data:image"))
                ? rawImg
                : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400";

            return (
              <TouchableOpacity
                key={est.id}
                onPress={() => {
                  navigation.navigate("Restaurant", {
                    id: est.id,
                    title: est.title || est.name,
                    rating: est.rating,
                    description: est.description,
                    address: est.address,
                    genre: est.genre,
                    image: est.image,
                    lat: est.lat,
                    lng: est.lng,
                    minDeliveryTime: est.minDeliveryTime,
                    maxDeliveryTime: est.maxDeliveryTime,
                    isCook: est.isCook,
                    isHomemade: est.isHomemade,
                  });
                }}
                activeOpacity={0.88}
                style={{
                  backgroundColor: "white",
                  borderRadius: 18,
                  marginBottom: 14,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", padding: 12 }}>
                  {/* Photo de l'établissement */}
                  <Image
                    source={{ uri: photoUrl }}
                    style={{
                      width: 95,
                      height: 95,
                      borderRadius: 14,
                      backgroundColor: "#F3F4F6",
                    }}
                    resizeMode="cover"
                  />

                  {/* Détails */}
                  <View style={{ flex: 1, marginLeft: 12, justifyContent: "space-between" }}>
                    <View>
                      {/* Badge Type & Badge Distance */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: isCook ? "#FEF3C7" : "#ECFDF5",
                            paddingHorizontal: 7,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "800",
                              color: isCook ? "#B45309" : "#065F46",
                            }}
                          >
                            {isCook ? `🍳 ${t("filterHomeCook")}` : `🏢 ${t("filterRestaurants")}`}
                          </Text>
                        </View>

                        {/* Distance calculée mise en avant */}
                        <View
                          style={{
                            backgroundColor: "#DCFCE7",
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: "#86EFAC",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <MapPinIcon size={11} color="#15803D" />
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: "900",
                              color: "#15803D",
                              marginLeft: 2,
                            }}
                          >
                            {est.formattedDistance}
                          </Text>
                        </View>
                      </View>

                      {/* Nom de l'établissement */}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "900",
                          color: "#111827",
                        }}
                        numberOfLines={1}
                      >
                        {est.name || est.title}
                      </Text>

                      {/* Spécialité culinaire */}
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#6B7280",
                          marginTop: 2,
                        }}
                        numberOfLines={1}
                      >
                        {est.genre || "Cuisine variée"}
                      </Text>
                    </View>

                    {/* Ligne inférieure : Note, Temps de livraison & Bouton Commander */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <StarIcon size={12} color="#F59E0B" />
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "800",
                              color: "#111827",
                              marginLeft: 2,
                            }}
                          >
                            {est.rating || "5.0"}
                          </Text>
                        </View>

                        <Text style={{ fontSize: 10, color: "#9CA3AF" }}>•</Text>

                        <Text style={{ fontSize: 11, color: "#6B7280" }}>
                          {est.minDeliveryTime || 20}-{est.maxDeliveryTime || 35} {t("mins")}
                        </Text>
                      </View>

                      {/* Bouton jaune Commander façon McDo */}
                      <View
                        style={{
                          backgroundColor: "#FFBC0D",
                          paddingHorizontal: 12,
                          paddingVertical: 5,
                          borderRadius: 12,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "900",
                            color: "#111827",
                            marginRight: 2,
                          }}
                        >
                          {t("tabOrder")}
                        </Text>
                        <ChevronRightIcon size={12} color="#111827" />
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Barre de panier flottante */}
      <BasketIcon bottomOffset={60} />

      {/* Barre de navigation McDo */}
      <McDoBottomNav activeTab="menu" />

      {/* Modal choix Wilaya */}
      <WilayaSelectorModal
        visible={wilayaModalVisible}
        onClose={() => setWilayaModalVisible(false)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
      />

      {/* Modal choix mode de commande */}
      <OrderModeModal
        visible={orderModeModalVisible}
        onClose={() => setOrderModeModalVisible(false)}
        selectedMode={orderMode}
        onSelectMode={setOrderMode}
      />
    </SafeAreaView>
  );
};

export default MenuCategoriesScreen;
