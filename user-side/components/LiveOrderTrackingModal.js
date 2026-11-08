import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "react-native-heroicons/solid";
import { openWhatsApp } from "../constants/wilayas";
import { useLanguage } from "../contexts/LanguageContext";
import DriverProfileModal from "./DriverProfileModal";


// Calcul de distance Haversine en kilomètres
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const LiveOrderTrackingModal = ({
  visible,
  onClose,
  orderId,
  initialOrder = {},
  onOpenQrCode,
}) => {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const mapRef = useRef(null);

  const [orderData, setOrderData] = useState(initialOrder);
  const [loading, setLoading] = useState(true);
  const [driverProfileVisible, setDriverProfileVisible] = useState(false);

  // Écoute en temps réel STRICTEMENT de la commande du client pour suivre SON livreur
  useEffect(() => {
    if (!orderId || !visible) return;

    setLoading(true);
    const unsub = onSnapshot(
      doc(db, "orders", orderId),
      (docSnap) => {
        if (docSnap.exists()) {
          setOrderData({ id: docSnap.id, ...docSnap.data() });
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Live tracking snapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [orderId, visible]);

  const currentOrder = orderData?.id ? orderData : initialOrder;
  const status = currentOrder?.status || "ASSIGNED_TO_DELIVERY";

  // Coordonnées du Client
  const clientLat = Number(currentOrder?.userLatitude || 36.7538);
  const clientLng = Number(currentOrder?.userLongitude || 3.0588);

  // Coordonnées du Restaurant / Cuisinier
  const restoLat = Number(currentOrder?.restaurantLatitude || 36.7538);
  const restoLng = Number(currentOrder?.restaurantLongitude || 3.0588);

  // Coordonnées en direct du Livreur (exclusivement assigné à cette commande)
  const driverLat = currentOrder?.driverLatitude
    ? Number(currentOrder.driverLatitude)
    : null;
  const driverLng = currentOrder?.driverLongitude
    ? Number(currentOrder.driverLongitude)
    : null;
  const driverHeading = Number(currentOrder?.driverHeading || 0);

  const isPickedUp = status === "DRIVERPICKEDUP";
  const isDelivered = status === "DELIVERED" || status === "COMPLETE";

  // Destination actuelle du coursier :
  // - Si les plats ne sont pas encore récupérés : il va vers le restaurant
  // - Si les plats sont récupérés : il va vers le client
  const targetLat = isPickedUp ? clientLat : restoLat;
  const targetLng = isPickedUp ? clientLng : restoLng;

  // Calcul de la distance restante
  const remainingKm = useMemo(() => {
    if (!driverLat || !driverLng) return null;
    return getDistanceInKm(driverLat, driverLng, targetLat, targetLng);
  }, [driverLat, driverLng, targetLat, targetLng]);

  // Estimation du temps d'arrivée (environ 35 km/h en ville avec marge)
  const estimatedArrivalMinutes = useMemo(() => {
    if (remainingKm === null) return 10;
    const mins = Math.round((remainingKm / 30) * 60) + 2;
    return Math.max(1, mins);
  }, [remainingKm]);

  // Centrage initial et automatique sur la carte
  useEffect(() => {
    if (!visible || !mapRef.current) return;

    const latToCenter = driverLat || restoLat || clientLat;
    const lngToCenter = driverLng || restoLng || clientLng;

    setTimeout(() => {
      try {
        mapRef.current?.animateToRegion(
          {
            latitude: latToCenter - 0.003,
            longitude: lngToCenter,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          800
        );
      } catch (e) {}
    }, 400);
  }, [visible, driverLat, driverLng]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    const lat = driverLat || restoLat;
    const lng = driverLng || restoLng;
    mapRef.current.animateToRegion(
      {
        latitude: lat - 0.002,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      500
    );
  };

  const polylineCoords = useMemo(() => {
    if (!driverLat || !driverLng) return [];
    return [
      { latitude: driverLat, longitude: driverLng },
      { latitude: targetLat, longitude: targetLng },
    ];
  }, [driverLat, driverLng, targetLat, targetLng]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
        {/* CARTE INTERACTIVE PLEIN ÉCRAN */}
        <MapView
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          initialRegion={{
            latitude: (driverLat || restoLat || 36.75) - 0.003,
            longitude: driverLng || restoLng || 3.05,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsUserLocation={false}
          showsCompass={false}
        >
          {/* Tracé visuel entre le livreur et sa destination */}
          {polylineCoords.length >= 2 && (
            <Polyline
              coordinates={polylineCoords}
              strokeColor="#059669"
              strokeWidth={4}
              lineDashPattern={[6, 4]}
            />
          )}

          {/* 1. Point Client (Votre adresse de livraison) */}
          <Marker
            coordinate={{ latitude: clientLat, longitude: clientLng }}
            title="Votre adresse de livraison"
            description={currentOrder?.userAddress || "Destination"}
          >
            <View
              style={{
                backgroundColor: "#111827",
                padding: 7,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 16 }}>🏠</Text>
            </View>
          </Marker>

          {/* 2. Point Restaurant / Cuisine */}
          <Marker
            coordinate={{ latitude: restoLat, longitude: restoLng }}
            title={currentOrder?.restaurantName || "Cuisine"}
            description={currentOrder?.restaurantAddress || "Restaurant"}
          >
            <View
              style={{
                backgroundColor: "#D97706",
                padding: 7,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: "white",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 3,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 16 }}>🍳</Text>
            </View>
          </Marker>

          {/* 3. POINT LIVREUR EN TEMPS RÉEL (UNIQUEMENT VOTRE COURSIER) */}
          {driverLat && driverLng && (
            <Marker
              coordinate={{ latitude: driverLat, longitude: driverLng }}
              title={currentOrder?.driverName || "Votre livreur Wajbati"}
              description={
                isPickedUp
                  ? "En route vers chez vous !"
                  : "En route vers le restaurant"
              }
              flat={true}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={{ alignItems: "center" }}>
                {/* Bulle nom du livreur */}
                <View
                  style={{
                    backgroundColor: "white",
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 10,
                    marginBottom: 4,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "800",
                      color: "#065F46",
                    }}
                  >
                    🛵 {currentOrder?.driverName || "Livreur"}
                  </Text>
                </View>

                {/* Icône Scooter orientée */}
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "#059669",
                    justifyContent: "center",
                    alignItems: "center",
                    borderWidth: 3,
                    borderColor: "white",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    elevation: 6,
                    transform: [{ rotate: `${driverHeading}deg` }],
                  }}
                >
                  <Text style={{ fontSize: 22 }}>🛵</Text>
                </View>
              </View>
            </Marker>
          )}
        </MapView>

        {/* BOUTON RETOUR & TITRE EN HAUT (Floating Header) */}
        <View
          style={{
            position: "absolute",
            top:
              Platform.OS === "android"
                ? Math.max(insets.top, (RNStatusBar.currentHeight || 0) + 10, 44)
                : Math.max(insets.top, 44),
            left: 16,
            right: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <ArrowLeftIcon size={22} color="#111827" />
          </TouchableOpacity>

          {/* Pastille Clignotante "EN DIRECT" */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
              gap: 6,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: "#10B981",
              }}
            />
            <Text style={{ fontSize: 11, fontWeight: "900", color: "#065F46" }}>
              SUIVI DU LIVREUR EN DIRECT
            </Text>
          </View>

          {/* Bouton Recentrer sur le livreur */}
          <TouchableOpacity
            onPress={handleRecenter}
            style={{
              backgroundColor: "white",
              padding: 10,
              borderRadius: 25,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>🎯</Text>
          </TouchableOpacity>
        </View>

        {/* CARTE D'INFORMATIONS DU COURSIER EN BAS (Floating Bottom Card) */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 20,
            paddingBottom: Math.max(insets.bottom + 12, 28),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 12,
          }}
        >
          {/* Poignée supérieure */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: "#E5E7EB",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 14,
            }}
          />

          {/* Statut & Délai d'arrivée */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#111827",
                  marginBottom: 2,
                }}
              >
                {isPickedUp
                  ? "Arrivée chez vous estimée"
                  : "Le livreur va au restaurant"}
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280" }} numberOfLines={1}>
                {isPickedUp
                  ? `Livraison à : ${currentOrder?.userAddress || "Votre domicile"}`
                  : `Retrait à : ${currentOrder?.restaurantName || "Cuisine"}`}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "#ECFDF5",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#A7F3D0",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, fontWeight: "900", color: "#065F46" }}
              >
                ~{estimatedArrivalMinutes} min
              </Text>
              {remainingKm !== null && (
                <Text style={{ fontSize: 10, color: "#059669", fontWeight: "700" }}>
                  {remainingKm.toFixed(1)} km
                </Text>
              )}
            </View>
          </View>

          {/* Barre d'état étapes de livraison */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F9FAFB",
              padding: 10,
              borderRadius: 14,
              marginBottom: 14,
              gap: 8,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#059669",
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#111827" }}>
                {isPickedUp
                  ? "🍲 Vos plats sont en route avec le livreur"
                  : "👨‍🍳 Commande en cours de récupération chez le chef"}
              </Text>
              <Text style={{ fontSize: 10, color: "#6B7280", marginTop: 1 }}>
                {driverLat
                  ? "GPS actif : position mise à jour en temps réel"
                  : "Connexion au signal GPS du coursier..."}
              </Text>
            </View>
          </View>

          {/* Profil du Livreur et Actions directes */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
            }}
          >
            {/* Infos Livreur (Cliquable pour consulter son profil complet avec avis) */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDriverProfileVisible(true)}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#E0F2FE",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#BAE6FD",
                }}
              >
                <Text style={{ fontSize: 20 }}>🛵</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}
                    numberOfLines={1}
                  >
                    {currentOrder?.driverName || "Livreur Wajbati"}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#D97706", fontWeight: "800" }}>⭐ Profil</Text>
                </View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>
                  {currentOrder?.vehicleType === "voiture"
                    ? "En voiture 🚗"
                    : currentOrder?.vehicleType === "velo"
                    ? "En vélo 🚲"
                    : "En scooter 🛵"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Boutons d'appel & WhatsApp & QR Code */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {currentOrder?.driverPhone ? (
                <>
                  {/* Appel direct */}
                  <TouchableOpacity
                    onPress={() =>
                      Linking.openURL(`tel:${currentOrder.driverPhone}`)
                    }
                    style={{
                      backgroundColor: "#F3F4F6",
                      padding: 10,
                      borderRadius: 14,
                    }}
                  >
                    <PhoneIcon size={18} color="#111827" />
                  </TouchableOpacity>

                  {/* WhatsApp Livreur */}
                  <TouchableOpacity
                    onPress={() =>
                      openWhatsApp({
                        phone: currentOrder.driverPhone,
                        message: `Bonjour ! Je suis le client de la commande #${orderId.slice(
                          0,
                          6
                        )}. Mon adresse est : ${currentOrder?.userAddress || ""}`,
                      })
                    }
                    style={{
                      backgroundColor: "#ECFDF5",
                      padding: 10,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#A7F3D0",
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>💬</Text>
                  </TouchableOpacity>
                </>
              ) : null}

              {/* Bouton QR Code réception */}
              {onOpenQrCode && (
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenQrCode();
                  }}
                  style={{
                    backgroundColor: "#059669",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 14,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Text style={{ color: "white", fontSize: 11, fontWeight: "800" }}>
                    QR Réception
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Modal Profil Consultable du Livreur */}
      <DriverProfileModal
        visible={driverProfileVisible}
        onClose={() => setDriverProfileVisible(false)}
        driverId={currentOrder?.assignedDriverId || currentOrder?.driverId}
        initialDriverName={currentOrder?.driverName}
        driverPhone={currentOrder?.driverPhone}
      />
    </Modal>
  );
};

export default LiveOrderTrackingModal;

