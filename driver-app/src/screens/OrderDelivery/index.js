import { useRef, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
  TouchableOpacity,
  Alert,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { FontAwesome5, Fontisto, MaterialIcons, Entypo, Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation } from "@react-navigation/native";
import { openGpsNavigation, openWhatsApp } from "../../constants/wilayas";
import {
  updateDoc,
  doc,
  getDoc,
  collection,
  where,
  query,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import DishInfo from "../../components/DishInfo";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import {
  notifyClientDriverAssigned,
  notifyClientOrderDelivered,
} from "../../services/notificationService";
import styles from "./styles.js";

const OrderDelivery = ({ route }) => {
  const { order } = route.params || {};
  const { user } = useAuth();
  const { t, formatPrice } = useLanguage();
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [dishInfo, setDishInfo] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState(
    order?.status || "READY_FOR_PICKUP"
  );
  const [isAccepting, setIsAccepting] = useState(false);
  const navigation = useNavigation();

  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["14%", "95%"], []);
  const mapRef = useRef(null);

  // Validation robuste des coordonnées
  const restaurantLat = Number(order?.restaurantLatitude);
  const restaurantLng = Number(order?.restaurantLongitude);
  const userLat = Number(order?.userLatitude);
  const userLng = Number(order?.userLongitude);

  const isRestaurantCoordValid =
    !isNaN(restaurantLat) && !isNaN(restaurantLng) && restaurantLat !== 0 && restaurantLng !== 0;

  const isUserCoordValid =
    !isNaN(userLat) && !isNaN(userLng) && userLat !== 0 && userLng !== 0;

  const restaurantLocation = useMemo(
    () =>
      isRestaurantCoordValid
        ? { latitude: restaurantLat, longitude: restaurantLng }
        : null,
    [restaurantLat, restaurantLng, isRestaurantCoordValid]
  );

  const deliveryLocation = useMemo(
    () =>
      isUserCoordValid
        ? { latitude: userLat, longitude: userLng }
        : null,
    [userLat, userLng, isUserCoordValid]
  );

  const isAvailableInPool =
    deliveryStatus === "READY_FOR_PICKUP" || deliveryStatus === "READY";
  const isAssignedToMe =
    deliveryStatus === "ASSIGNED_TO_DELIVERY" ||
    deliveryStatus === "DRIVERACCEPTED" ||
    deliveryStatus === "DRIVERPICKEDUP";
  const isDelivered =
    deliveryStatus === "DELIVERED" || deliveryStatus === "COMPLETE";

  // Région initiale sécurisée pour MapView (jamais d'accès null)
  const initialRegion = useMemo(() => {
    const lat =
      driverLocation?.latitude ||
      restaurantLocation?.latitude ||
      deliveryLocation?.latitude ||
      36.75;
    const lng =
      driverLocation?.longitude ||
      restaurantLocation?.longitude ||
      deliveryLocation?.longitude ||
      3.05;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.07,
      longitudeDelta: 0.07,
    };
  }, [driverLocation, restaurantLocation, deliveryLocation]);

  useEffect(() => {
    getDriverLocation();
    getDishId();

    let foregroundSubscription;
    (async () => {
      try {
        let { status } = await Location.getForegroundPermissionsAsync();
        if (status === "granted") {
          foregroundSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 100,
            },
            (updatedLocation) => {
              if (updatedLocation?.coords) {
                setDriverLocation({
                  latitude: updatedLocation.coords.latitude,
                  longitude: updatedLocation.coords.longitude,
                });
              }
            }
          );
        }
      } catch (e) {
        console.log("watchPositionAsync error:", e);
      }
    })();

    return () => {
      if (foregroundSubscription) {
        try {
          foregroundSubscription.remove();
        } catch (e) {
          console.log("Error removing subscription:", e);
        }
      }
    };
  }, []);

  const getDriverLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Location permission not granted");
        return;
      }

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (location?.coords) {
        setDriverLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch (e) {
      console.log("Error getting driver location:", e);
    }
  };

  const getDishId = async () => {
    if (!order?.id) return;
    try {
      const dishesRef = collection(db, "orderDishes");
      const q = query(dishesRef, where("orderId", "==", order.id));

      const querySnapshot = await getDocs(q);
      let items = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data() });
      });
      setDishInfo(items);
    } catch (e) {
      console.log("Error getting order dishes:", e);
    }
  };

  // Attribution exclusive selon la règle « Premier arrivé, premier servi »
  // Résolution robuste et sans crash de la concurrence
  const handleAcceptOrder = async () => {
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      if (!order?.id) {
        throw new Error("Identifiant de commande introuvable.");
      }

      const orderRef = doc(db, "orders", order.id);
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        throw new Error("ORDER_NOT_FOUND");
      }

      const data = orderDoc.data();
      const currentStatus = data?.status;

      // Vérification de disponibilité dans le pool (Premier arrivé, premier servi)
      if (currentStatus !== "READY_FOR_PICKUP" && currentStatus !== "READY") {
        // Un autre coursier vient de verrouiller la commande une fraction de seconde plus tôt !
        throw new Error("ALREADY_ASSIGNED");
      }

      const driverDisplayName =
        user?.displayName || user?.email?.split("@")[0] || "Livreur Partenaire";

      // Verrouillage exclusif
      await updateDoc(orderRef, {
        status: "ASSIGNED_TO_DELIVERY",
        assignedDriverId: user?.uid || "driver_uid",
        driverName: driverDisplayName,
        driverPhone: user?.phoneNumber || "",
        assignedAt: serverTimestamp(),
      });

      // Assignation réussie
      setDeliveryStatus("ASSIGNED_TO_DELIVERY");

      // Notification Push au client : Livreur assigné et en route !
      if (order?.userId) {
        notifyClientDriverAssigned(order.userId, driverDisplayName, order?.id);
      }

      try {
        bottomSheetRef.current?.snapToIndex(0);
      } catch (e) {
        console.log("BottomSheet snap error:", e);
      }

      if (driverLocation && mapRef.current) {
        try {
          mapRef.current.animateToRegion({
            latitude: Number(driverLocation.latitude),
            longitude: Number(driverLocation.longitude),
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        } catch (e) {
          console.log("Map animate error:", e);
        }
      }

      Alert.alert(t("assignedSuccessTitle"), t("assignedSuccessMsg"));
    } catch (error) {
      console.error("Erreur acceptation commande:", error);
      if (error?.message === "ALREADY_ASSIGNED") {
        Alert.alert(
          t("alreadyAssignedTitle"),
          t("alreadyAssignedMsg"),
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert(
          t("error") || "Erreur",
          "Impossible de verrouiller la commande : " + (error?.message || "Erreur inconnue")
        );
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // Remise effective au client -> Statut DELIVERED
  const handleCompleteDelivery = async () => {
    try {
      if (!order?.id) return;
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: "DELIVERED",
        deliveredAt: serverTimestamp(),
      });
      setDeliveryStatus("DELIVERED");

      // Notification Push au client : Commande livrée !
      if (order?.userId) {
        notifyClientOrderDelivered(order.userId, order?.id);
      }

      Alert.alert(t("orderDeliveredTitle"), t("orderDeliveredMsg"), [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert(t("error") || "Erreur", "Impossible de finaliser la remise.");
    }
  };

  const handleNavToCook = () => {
    openGpsNavigation(
      restaurantLat,
      restaurantLng,
      order?.restaurantAddress,
      order?.restaurantName || "Cuisine"
    );
  };

  const handleNavToClient = () => {
    openGpsNavigation(
      userLat,
      userLng,
      order?.userAddress,
      `${order?.userFirstName || ""} ${order?.userLastName || ""}`.trim() || "Client"
    );
  };

  const handleWhatsAppCook = () => {
    const phone = order?.restaurantPhone || order?.cookPhone;
    const msg = `Bonjour Chef ${order?.restaurantName || ""}, je suis votre livreur Food Delivery pour la commande #${order?.id?.slice(0, 8)}. J'arrive pour récupérer les plats ! 🛵`;
    openWhatsApp({ phone, message: msg });
  };

  const handleWhatsAppClient = () => {
    const phone = order?.userPhoneNumber || order?.userPhone;
    const clientName = `${order?.userFirstName || ""} ${order?.userLastName || ""}`.trim() || "Client";
    const msg = `Bonjour ${clientName}, je suis votre livreur Food Delivery pour votre commande chez ${order?.restaurantName || "le chef"} (Commande #${order?.id?.slice(0, 8)}). Je suis en route pour vous livrer ! 🛵`;
    openWhatsApp({ phone, message: msg });
  };

  const renderButtonTitle = () => {
    if (isAvailableInPool) {
      return isAccepting ? "Verrouillage..." : t("lockOrderBtn");
    }
    if (isAssignedToMe) {
      return t("confirmHandover");
    }
    if (isDelivered) {
      return t("orderDeliveredTitle");
    }
    return t("lockOrderBtn");
  };

  const onButtonpressed = () => {
    if (isAvailableInPool) {
      handleAcceptOrder();
    } else if (isAssignedToMe) {
      handleCompleteDelivery();
    } else if (isDelivered) {
      navigation.goBack();
    }
  };

  // Validation des coordonnées pour le tracé MapViewDirections
  const isDriverCoordValid =
    driverLocation &&
    typeof driverLocation.latitude === "number" &&
    !isNaN(driverLocation.latitude) &&
    typeof driverLocation.longitude === "number" &&
    !isNaN(driverLocation.longitude);

  const targetDestination = isAvailableInPool
    ? (restaurantLocation || deliveryLocation)
    : (deliveryLocation || restaurantLocation);

  const canRenderDirections = isDriverCoordValid && targetDestination;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={{ width, height }}
        provider="google"
        showsUserLocation
        followsUserLocation
        initialRegion={initialRegion}
      >
        {canRenderDirections && (
          <MapViewDirections
            origin={driverLocation}
            destination={targetDestination}
            strokeWidth={5}
            waypoints={
              isAssignedToMe && restaurantLocation && deliveryLocation
                ? [restaurantLocation]
                : []
            }
            strokeColor="#3FC060"
            apikey={
              process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
              "AIzaSyCi-MWuhMrs1DfJqTycPWS8N9KorPuAs-0"
            }
            onError={(errorMessage) => {
              console.log("MapViewDirections info/error:", errorMessage);
            }}
            onReady={(result) => {
              if (result) {
                setTotalMinutes(Number(result.duration) || 0);
                setTotalKm(Number(result.distance) || 0);
              }
            }}
          />
        )}

        {restaurantLocation && (
          <Marker
            coordinate={restaurantLocation}
            title={order?.restaurantName || "Restaurant"}
            description={order?.restaurantAddress || ""}
          >
            <View
              style={{ backgroundColor: "green", padding: 5, borderRadius: 20 }}
            >
              <MaterialIcons name="restaurant" size={30} color="white" />
            </View>
          </Marker>
        )}

        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title={`${order?.userFirstName || ""} ${order?.userLastName || ""}`.trim() || "Client"}
            description={order?.userAddress || ""}
          >
            <View
              style={{ backgroundColor: "green", padding: 7, borderRadius: 20 }}
            >
              <FontAwesome5 name="user" size={28} color="white" />
            </View>
          </Marker>
        )}
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.handleIndicatorContainer}>
          <Text style={styles.routeDetailsText}>
            {(Number(totalMinutes) || 0).toFixed(0)} {t("mins")}
          </Text>
          <FontAwesome5
            name="shopping-bag"
            size={30}
            color="#3FC060"
            style={{ marginHorizontal: 10 }}
          />
          <Text style={styles.routeDetailsText}>
            {(Number(totalKm) || 0).toFixed(2)} {t("km")}
          </Text>
        </View>

        {/* Indicateur de Concurrence & Statut */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 8,
            padding: 8,
            borderRadius: 10,
            backgroundColor: isAvailableInPool
              ? "#fef3c7"
              : isAssignedToMe
              ? "#e0e7ff"
              : "#dcfce7",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "bold",
              color: isAvailableInPool
                ? "#b45309"
                : isAssignedToMe
                ? "#3730a3"
                : "#166534",
              textAlign: "center",
            }}
          >
            {isAvailableInPool
              ? "⚡ Pool disponible : 1er arrivé, 1er servi !"
              : isAssignedToMe
              ? "🔒 Course verrouillée à votre nom"
              : "✅ Course terminée avec succès"}
          </Text>
        </View>

        <View style={styles.deliveryDetailsContainer}>
          <Text style={styles.restaurantName}>{order?.restaurantName}</Text>
          <View style={styles.adressContainer}>
            <Fontisto name="shopping-store" size={22} color="grey" />
            <Text style={styles.adressText}>{order?.restaurantAddress}</Text>
          </View>

          {/* Action GPS & WhatsApp Cuisinier */}
          <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
            <TouchableOpacity
              onPress={handleNavToCook}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#2563eb",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
              }}
            >
              <MaterialIcons name="navigation" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12, marginLeft: 6 }}>
                Itinéraire Chef 🗺️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsAppCook}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#25D366",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12, marginLeft: 4 }}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="user" size={28} color="grey" />
            <Text style={styles.adressText}>
              {order?.userFirstName} {order?.userLastName}
            </Text>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="map-marker-alt" size={30} color="grey" />
            <Text style={styles.adressText}>{order?.userAddress}</Text>
          </View>

          {/* Action GPS & WhatsApp Client */}
          <View style={{ flexDirection: "row", gap: 8, marginVertical: 8 }}>
            <TouchableOpacity
              onPress={handleNavToClient}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#16a34a",
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 12,
              }}
            >
              <MaterialIcons name="navigation" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12, marginLeft: 6 }}>
                Itinéraire Client 🗺️
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsAppClient}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#25D366",
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderRadius: 12,
              }}
            >
              <Ionicons name="logo-whatsapp" size={18} color="white" />
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12, marginLeft: 4 }}>
                WhatsApp
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.orderDetailsContainer}>
            {dishInfo.map((item, index) => {
              return (
                <DishInfo
                  key={index}
                  id={item.dishId}
                  quantity={item.quantity}
                />
              );
            })}
          </View>
        </View>

        {isAvailableInPool && (
          <Pressable
            style={{
              ...styles.buttonContainer,
              backgroundColor: "#000",
              position: "absolute",
              bottom: 80,
              width: "95%",
            }}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>{t("back")}</Text>
          </Pressable>
        )}

        <Pressable
          style={{
            ...styles.buttonContainer,
            backgroundColor: isDelivered ? "#16a34a" : "#3FC060",
          }}
          onPress={onButtonpressed}
        >
          <Text style={styles.buttonText}>{renderButtonTitle()}</Text>
        </Pressable>
      </BottomSheet>
    </View>
  );
};

export default OrderDelivery;
