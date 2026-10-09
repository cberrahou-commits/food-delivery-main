import { useRef, useMemo, useEffect, useState } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  ActivityIndicator,
  Pressable,
  Alert,
} from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";
import { FontAwesome5, Fontisto } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Entypo, MaterialIcons, Ionicons } from "@expo/vector-icons";
import MapViewDirections from "react-native-maps-directions";
import { useNavigation } from "@react-navigation/native";
import {
  updateDoc,
  doc,
  collection,
  where,
  query,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import DishInfo from "../../components/DishInfo";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./styles.js";

const OrderDelivery = ({ route }) => {
  const { order } = route.params;
  const { user } = useAuth();
  const { t, formatPrice } = useLanguage();
  const [driverLocation, setDriverLocation] = useState(null);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [dishInfo, setDishInfo] = useState([]);
  const [deliveryStatus, setDeliveryStatus] = useState(
    order.status || "READY_FOR_PICKUP"
  );
  const [isAccepting, setIsAccepting] = useState(false);
  const navigation = useNavigation();

  const bottomSheetRef = useRef(null);
  const { width, height } = useWindowDimensions();
  const snapPoints = useMemo(() => ["14%", "95%"], []);
  const mapRef = useRef(null);

  const restaurantLocation = {
    latitude: order.restaurantLatitude,
    longitude: order.restaurantLongitude,
  };
  const deliveryLocation = {
    latitude: order.userLatitude,
    longitude: order.userLongitude,
  };

  const isAvailableInPool =
    deliveryStatus === "READY_FOR_PICKUP" || deliveryStatus === "READY";
  const isAssignedToMe =
    deliveryStatus === "ASSIGNED_TO_DELIVERY" ||
    deliveryStatus === "DRIVERACCEPTED" ||
    deliveryStatus === "DRIVERPICKEDUP";
  const isDelivered =
    deliveryStatus === "DELIVERED" || deliveryStatus === "COMPLETE";

  useEffect(() => {
    getDriverLocation();
    getDishId();

    let foregroundSubscription;
    (async () => {
      try {
        foregroundSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 100,
          },
          (updatedLocation) => {
            setDriverLocation({
              latitude: updatedLocation.coords.latitude,
              longitude: updatedLocation.coords.longitude,
            });
          }
        );
      } catch (e) {
        console.log(e);
      }
    })();

    return () => {
      if (foregroundSubscription) {
        foregroundSubscription.remove();
      }
    };
  }, []);

  const getDriverLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (!status === "granted") {
      console.log("Location permission not granted");
      return;
    }

    let location = await Location.getCurrentPositionAsync();
    setDriverLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
  };

  const getDishId = async () => {
    const dishesRef = collection(db, "orderDishes");
    const q = query(dishesRef, where("orderId", "==", order.id));

    await getDocs(q).then((querySnapshot) => {
      let items = [];
      querySnapshot.forEach((doc) => {
        items.push({ ...doc.data() });
      });
      setDishInfo(items);
    });
  };

  // Attribution exclusive selon la règle « Premier arrivé, premier servi »
  // avec prévention atomique de la concurrence (Race Condition)
  const handleAcceptOrder = async () => {
    if (isAccepting) return;
    setIsAccepting(true);

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, "orders", order.id);
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists()) {
          throw new Error("ORDER_NOT_FOUND");
        }

        const data = orderDoc.data();
        const currentStatus = data.status;

        // Vérification de disponibilité dans le pool
        if (currentStatus !== "READY_FOR_PICKUP" && currentStatus !== "READY") {
          // Un autre coursier vient de verrouiller la commande une fraction de seconde plus tôt !
          throw new Error("ALREADY_ASSIGNED");
        }

        const driverDisplayName =
          user?.displayName || user?.email?.split("@")[0] || "Livreur Partenaire";

        // Verrouillage exclusif
        transaction.update(orderRef, {
          status: "ASSIGNED_TO_DELIVERY",
          assignedDriverId: user?.uid || "driver_uid",
          driverName: driverDisplayName,
          driverPhone: user?.phoneNumber || "",
          assignedAt: serverTimestamp(),
        });
      });

      // Assignation réussie
      setDeliveryStatus("ASSIGNED_TO_DELIVERY");
      bottomSheetRef.current?.collapse();
      if (driverLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
      Alert.alert(t("assignedSuccessTitle"), t("assignedSuccessMsg"));
    } catch (error) {
      if (error.message === "ALREADY_ASSIGNED") {
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
        Alert.alert(t("error"), "Impossible de verrouiller la commande : " + error.message);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // Remise effective au client -> Statut DELIVERED
  const handleCompleteDelivery = async () => {
    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: "DELIVERED",
        deliveredAt: serverTimestamp(),
      });
      setDeliveryStatus("DELIVERED");
      Alert.alert(
        t("orderDeliveredTitle"),
        t("orderDeliveredMsg"),
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert(t("error"), "Impossible de finaliser la remise.");
    }
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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={{ width, height }}
        provider="google"
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.07,
          longitudeDelta: 0.07,
        }}
      >
        <MapViewDirections
          origin={driverLocation}
          destination={
            isAvailableInPool ? restaurantLocation : deliveryLocation
          }
          strokeWidth={5}
          waypoints={isAssignedToMe ? [restaurantLocation] : []}
          strokeColor="green"
          apikey={
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
            "AIzaSyCi-MWuhMrs1DfJqTycPWS8N9KorPuAs-0"
          }
          onReady={(result) => {
            setTotalMinutes(result.duration);
            setTotalKm(result.distance);
          }}
        />
        <Marker
          coordinate={{
            latitude: order.restaurantLatitude,
            longitude: order.restaurantLongitude,
          }}
          title={order.restaurantName}
          description={order.restaurantAddress}
        >
          <View
            style={{ backgroundColor: "green", padding: 5, borderRadius: 20 }}
          >
            <MaterialIcons name="restaurant" size={30} color="white" />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: order.userLatitude,
            longitude: order.userLongitude,
          }}
          title={`${order.userFirstName || ""} ${order.userLastName || ""}`.trim() || "Client"}
        >
          <View
            style={{ backgroundColor: "green", padding: 7, borderRadius: 20 }}
          >
            <FontAwesome5 name="user" size={28} color="white" />
          </View>
        </Marker>
      </MapView>

      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.handleIndicatorContainer}>
          <Text style={styles.routeDetailsText}>
            {totalMinutes.toFixed(0)} {t("mins")}
          </Text>
          <FontAwesome5
            name="shopping-bag"
            size={30}
            color="#3FC060"
            style={{ marginHorizontal: 10 }}
          />
          <Text style={styles.routeDetailsText}>
            {totalKm.toFixed(2)} {t("km")}
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
          <Text style={styles.restaurantName}>{order.restaurantName}</Text>
          <View style={styles.adressContainer}>
            <Fontisto name="shopping-store" size={22} color="grey" />
            <Text style={styles.adressText}>{order.restaurantAddress}</Text>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="user" size={28} color="grey" />
            <Text style={styles.adressText}>
              {order.userFirstName} {order.userLastName}
            </Text>
          </View>

          <View style={styles.adressContainer}>
            <FontAwesome5 name="map-marker-alt" size={30} color="grey" />
            <Text style={styles.adressText}>{order.userAddress}</Text>
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
