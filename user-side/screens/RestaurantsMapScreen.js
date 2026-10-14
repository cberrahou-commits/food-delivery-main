import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { UserAuth } from "../contexts/AuthContext";
import McDoBottomNav from "../components/McDoBottomNav";
import BasketIcon from "../components/BasketIcon";
import {
  ChevronRightIcon,
  XMarkIcon,
  StarIcon,
  ClockIcon,
  MapPinIcon,
} from "react-native-heroicons/solid";

const { width, height } = Dimensions.get("window");

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

function formatDistance(distKm) {
  if (distKm === null || distKm === undefined) return "Proche";
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)} m`;
  }
  return `${distKm.toFixed(1)} km`;
}

const RestaurantsMapScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { dbUser } = UserAuth();
  const mapRef = useRef(null);

  // Position client
  const [clientLocation, setClientLocation] = useState({
    latitude: dbUser?.latitude || 36.7538, // Alger Centre par défaut
    longitude: dbUser?.longitude || 3.0588,
  });
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Établissements & Filtres
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'restaurant' | 'cook'
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);

  useEffect(() => {
    fetchClientLocation();
    fetchEstablishments();
  }, []);

  const fetchClientLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasLocationPermission(true);
        let pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (pos?.coords) {
          const newCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setClientLocation(newCoords);
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                ...newCoords,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              },
              600
            );
          }
        }
      }
    } catch (e) {
      console.warn("Location error:", e);
    }
  };

  const fetchEstablishments = async () => {
    try {
      const snap = await getDocs(collection(db, "restaurants"));
      let list = [];
      snap.forEach((doc) => {
        const data = doc.data();
        const isApproved =
          data.isVerified === true || data.status === "APPROVED";
        if (isApproved && data.lat && data.lng) {
          list.push({
            id: doc.id,
            ...data,
            lat: Number(data.lat),
            lng: Number(data.lng),
          });
        }
      });
      setEstablishments(list);
    } catch (err) {
      console.warn("fetchEstablishments error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Centrer sur un établissement et zoomer
  const handleSelectEstablishment = (item) => {
    setSelectedEstablishment(item);
    if (mapRef.current && item.lat && item.lng) {
      mapRef.current.animateToRegion(
        {
          latitude: item.lat - 0.003, // Décalage léger pour faire place à la carte en bas
          longitude: item.lng,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        500
      );
    }
  };

  // Recenter sur la position du client
  const handleRecenter = () => {
    if (mapRef.current && clientLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: clientLocation.latitude,
          longitude: clientLocation.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        500
      );
    }
  };

  const filteredList = establishments.filter((item) => {
    const isCook = item.isCook || item.isHomemade || item.type === "cook";
    if (filterType === "restaurant" && isCook) return false;
    if (filterType === "cook" && !isCook) return false;
    return true;
  });

  const topOffset =
    Platform.OS === "android"
      ? Math.max(insets.top, (RNStatusBar.currentHeight || 0) + 16, 52) + 10
      : (insets.top > 0 ? insets.top + 8 : 52);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Top Header avec filtres */}
      <View
        style={{
          position: "absolute",
          top: topOffset,
          left: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        {/* Titre & Barre de filtre pilule */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "white",
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
            <View>
              <Text style={{ fontSize: 13, fontWeight: "900", color: "#111827" }}>
                Restaurants & Cuisines
              </Text>
              <Text style={{ fontSize: 10, color: "#6B7280" }}>
                {filteredList.length} établissements autour de vous
              </Text>
            </View>
          </View>

          {/* Filtres Type */}
          <View style={{ flexDirection: "row", gap: 4 }}>
            <TouchableOpacity
              onPress={() => setFilterType("all")}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: filterType === "all" ? "#FFBC0D" : "#F3F4F6",
              }}
            >
              <Text style={{ fontSize: 10, fontWeight: "800", color: "#111827" }}>
                Tous
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType("restaurant")}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor:
                  filterType === "restaurant" ? "#059669" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: filterType === "restaurant" ? "white" : "#111827",
                }}
              >
                🏢 Restos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFilterType("cook")}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: 12,
                backgroundColor: filterType === "cook" ? "#EA580C" : "#F3F4F6",
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "800",
                  color: filterType === "cook" ? "white" : "#111827",
                }}
              >
                🍳 Maison
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MapView Principale */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          initialRegion={{
            latitude: clientLocation.latitude,
            longitude: clientLocation.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          }}
          showsCompass={false}
          onPress={() => setSelectedEstablishment(null)}
        >
          {/* Repère Position Client */}
          <Marker
            coordinate={clientLocation}
            title="Votre position"
            description="Lieu de livraison"
            zIndex={100}
          >
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: "#2563EB",
                  borderWidth: 3,
                  borderColor: "white",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 5,
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "white",
                  }}
                />
              </View>
              <View
                style={{
                  backgroundColor: "#1E3A8A",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  marginTop: 2,
                }}
              >
                <Text style={{ color: "white", fontSize: 9, fontWeight: "800" }}>
                  Vous
                </Text>
              </View>
            </View>
          </Marker>

          {/* Repères Établissements avec photo principale */}
          {filteredList.map((item) => {
            const isCook = item.isCook || item.isHomemade || item.type === "cook";
            const borderColor = isCook ? "#EA580C" : "#059669";
            const badgeIcon = isCook ? "🍳" : "🏢";
            const photoUrl =
              item.image ||
              item.exteriorImage ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200";

            const isSelected = selectedEstablishment?.id === item.id;

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                onPress={(e) => {
                  e.stopPropagation();
                  handleSelectEstablishment(item);
                }}
                zIndex={isSelected ? 50 : 10}
              >
                <View style={{ alignItems: "center" }}>
                  {/* Container avec Photo principale et Badge */}
                  <View
                    style={{
                      width: isSelected ? 52 : 44,
                      height: isSelected ? 52 : 44,
                      borderRadius: isSelected ? 26 : 22,
                      borderWidth: isSelected ? 3.5 : 2.5,
                      borderColor: borderColor,
                      backgroundColor: "white",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 4,
                      elevation: 5,
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      source={{ uri: photoUrl }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Petit badge type resto ou cuisine */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: -4,
                      backgroundColor: borderColor,
                      borderRadius: 10,
                      paddingHorizontal: 4,
                      paddingVertical: 1,
                      borderWidth: 1,
                      borderColor: "white",
                    }}
                  >
                    <Text style={{ fontSize: 9 }}>{badgeIcon}</Text>
                  </View>
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Bouton GPS Recenter Flottant (style crosshair) */}
        <TouchableOpacity
          onPress={handleRecenter}
          activeOpacity={0.8}
          style={{
            position: "absolute",
            right: 16,
            bottom: selectedEstablishment ? 260 : 100,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "white",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
            borderWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              borderWidth: 2,
              borderColor: "#059669",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#059669",
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Fiche Détails Flottante de l'Établissement Sélectionné */}
        {selectedEstablishment && (
          <View
            style={{
              position: "absolute",
              bottom: 80,
              left: 14,
              right: 14,
              backgroundColor: "white",
              borderRadius: 20,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 8,
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            {/* Bouton Fermer */}
            <TouchableOpacity
              onPress={() => setSelectedEstablishment(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 10,
                backgroundColor: "#F3F4F6",
                borderRadius: 15,
                padding: 4,
              }}
            >
              <XMarkIcon size={16} color="#6B7280" />
            </TouchableOpacity>

            <View style={{ flexDirection: "row", gap: 12 }}>
              {/* Photo de l'établissement */}
              <Image
                source={{
                  uri:
                    selectedEstablishment.image ||
                    selectedEstablishment.exteriorImage ||
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
                }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 14,
                }}
                resizeMode="cover"
              />

              {/* Infos */}
              <View style={{ flex: 1, paddingRight: 20 }}>
                {/* Badge Type */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <View
                    style={{
                      backgroundColor:
                        selectedEstablishment.isCook ||
                        selectedEstablishment.isHomemade
                          ? "#FEF3C7"
                          : "#ECFDF5",
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color:
                          selectedEstablishment.isCook ||
                          selectedEstablishment.isHomemade
                            ? "#B45309"
                            : "#065F46",
                      }}
                    >
                      {selectedEstablishment.isCook ||
                      selectedEstablishment.isHomemade
                        ? "🍳 Cuisinier Maison"
                        : "🏢 Restaurant"}
                    </Text>
                  </View>

                  {/* Distance approximative */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F3F4F6",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <MapPinIcon size={10} color="#4B5563" />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "800",
                        color: "#374151",
                        marginLeft: 2,
                      }}
                    >
                      {formatDistance(
                        getDistanceInKm(
                          clientLocation.latitude,
                          clientLocation.longitude,
                          selectedEstablishment.lat,
                          selectedEstablishment.lng
                        )
                      )}
                    </Text>
                  </View>
                </View>

                {/* Nom */}
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "900",
                    color: "#111827",
                  }}
                  numberOfLines={1}
                >
                  {selectedEstablishment.name || selectedEstablishment.title}
                </Text>

                {/* Genre & Note */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
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
                      {selectedEstablishment.rating || "5.0"}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: "#9CA3AF" }}>•</Text>
                  <Text
                    style={{ fontSize: 11, color: "#6B7280" }}
                    numberOfLines={1}
                  >
                    {selectedEstablishment.genre || "Cuisine locale"}
                  </Text>
                </View>

                {/* Description de l'établissement */}
                <Text
                  style={{
                    fontSize: 11,
                    color: "#4B5563",
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                  numberOfLines={2}
                >
                  {selectedEstablishment.description ||
                    selectedEstablishment.address ||
                    "Plats faits-maison préparés à la commande."}
                </Text>
              </View>
            </View>

            {/* Bouton Commander menant directement au menu de l'établissement */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Restaurant", {
                  id: selectedEstablishment.id,
                  title:
                    selectedEstablishment.title || selectedEstablishment.name,
                  rating: selectedEstablishment.rating,
                  description: selectedEstablishment.description,
                  address: selectedEstablishment.address,
                  genre: selectedEstablishment.genre,
                  image: selectedEstablishment.image,
                  lat: selectedEstablishment.lat,
                  lng: selectedEstablishment.lng,
                  minDeliveryTime: selectedEstablishment.minDeliveryTime,
                  maxDeliveryTime: selectedEstablishment.maxDeliveryTime,
                  isCook: selectedEstablishment.isCook,
                  isHomemade: selectedEstablishment.isHomemade,
                });
              }}
              activeOpacity={0.85}
              style={{
                marginTop: 12,
                backgroundColor: "#FFBC0D", // Jaune McDo signature
                paddingVertical: 11,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text
                style={{
                  color: "#111827",
                  fontWeight: "900",
                  fontSize: 14,
                  marginRight: 6,
                }}
              >
                Commander dans cet établissement
              </Text>
              <ChevronRightIcon size={16} color="#111827" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Barre de Panier Jaune McDo */}
      <BasketIcon bottomOffset={60} />

      {/* Barre de navigation McDo avec onglet Restaurants actif */}
      <McDoBottomNav activeTab="restaurants" />
    </SafeAreaView>
  );
};

export default RestaurantsMapScreen;

