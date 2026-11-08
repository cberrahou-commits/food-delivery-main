import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Platform,
  AppState,
  Vibration,
  Animated,
} from "react-native";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  triggerLocalNotification,
  registerForPushNotificationsAsync,
} from "../services/notificationService";
import { calculateDistanceKm, calculateEtaMinutes, findWilaya } from "../constants/wilayas";

const DriverNotificationWatcher = () => {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(true);

  const initialLoadRef = useRef(true);
  const knownReadyOrdersRef = useRef(new Set());
  const activeWilayaRef = useRef(null);
  const driverCoordsRef = useRef(null);

  const notifyDriver = (title, body, data = {}) => {
    triggerLocalNotification(title, body, data);
    try {
      Vibration.vibrate([0, 600, 200, 600]);
    } catch (e) {
      console.warn("Vibration error:", e);
    }
  };

  // 1. Vérification des permissions et chargement du profil/zone
  const checkPermissionsAndZone = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

      if (granted && user?.uid) {
        registerForPushNotificationsAsync(user.uid);
      }

      // Récupérer la wilaya active
      const savedStr = await AsyncStorage.getItem("@wajbati_driver_wilaya");
      if (savedStr) {
        activeWilayaRef.current = JSON.parse(savedStr);
      } else if (user?.uid) {
        const snap = await getDoc(doc(db, "user", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.wilayaCode || data.wilaya) {
            activeWilayaRef.current = findWilaya({ code: data.wilayaCode, name: data.wilaya });
          }
        }
      }

      // Récupérer les coordonnées GPS actuelles du coursier
      const locPerm = await Location.getForegroundPermissionsAsync();
      if (locPerm.status === "granted") {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (pos?.coords) {
          driverCoordsRef.current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      }
    } catch (err) {
      console.warn("Erreur vérification notification/zone livreur:", err);
    }
  };

  useEffect(() => {
    checkPermissionsAndZone();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissionsAndZone();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.uid]);

  // 2. Écouteur en direct des commandes prêtes : FILTRAGE STRICT PAR ZONE GÉOGRAPHIQUE
  useEffect(() => {
    initialLoadRef.current = true;
    knownReadyOrdersRef.current = new Set();

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["READY_FOR_PICKUP", "READY"])
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (initialLoadRef.current) {
          snapshot.forEach((docSnap) => {
            knownReadyOrdersRef.current.add(docSnap.id);
          });
          initialLoadRef.current = false;
          return;
        }

        // Rafraîchir la zone si disponible
        const savedStr = await AsyncStorage.getItem("@wajbati_driver_wilaya");
        if (savedStr) {
          activeWilayaRef.current = JSON.parse(savedStr);
        }

        snapshot.docChanges().forEach((change) => {
          const orderId = change.doc.id;
          const order = change.doc.data();

          if (
            (change.type === "added" && !knownReadyOrdersRef.current.has(orderId)) ||
            (change.type === "modified" &&
              (order.status === "READY_FOR_PICKUP" || order.status === "READY") &&
              !knownReadyOrdersRef.current.has(orderId))
          ) {
            knownReadyOrdersRef.current.add(orderId);

            // Vérification de la zone géographique
            const activeW = activeWilayaRef.current;
            const rLat = Number(order.restaurantLatitude);
            const rLng = Number(order.restaurantLongitude);
            const dCoords = driverCoordsRef.current;

            let isInZone = false;
            let distKm = null;
            let etaMin = null;

            if (dCoords && rLat && rLng) {
              distKm = calculateDistanceKm(dCoords.latitude, dCoords.longitude, rLat, rLng);
              if (distKm !== Infinity) {
                etaMin = calculateEtaMinutes(distKm);
                // Si à moins de 25 km, considéré dans la zone immédiate
                if (distKm <= 25) {
                  isInZone = true;
                }
              }
            }

            if (activeW) {
              const wCode = String(activeW.code || "").trim();
              const wName = String(activeW.name || "").trim().toLowerCase();
              const rCode = String(order.restaurantWilayaCode || "").trim();
              const rWilaya = String(order.restaurantWilaya || "").toLowerCase();
              const rAddress = String(order.restaurantAddress || "").toLowerCase();

              if (rCode === wCode || rWilaya.includes(wCode) || rWilaya.includes(wName) || rAddress.includes(wName)) {
                isInZone = true;
              }
            } else if (distKm === null) {
              // Si aucune info de localisation ni zone, accepter pour ne pas bloquer
              isInZone = true;
            }

            // Si la commande n'est PAS dans la zone géographique du coursier, NE PAS LE DÉRANGER
            if (!isInZone) {
              console.log(`Commande ${orderId} hors zone géographique du coursier (${order.restaurantWilaya || "autre"}). Ignorée.`);
              return;
            }

            // Calcul du message avec temps de trajet estimé
            const timeInfo = etaMin !== null
              ? `Trajet estimé : ~${etaMin} min (${distKm.toFixed(1)} km).`
              : "Prêt pour le retrait.";

            notifyDriver(
              `🛵 Course prête à ${order.restaurantWilaya || "votre zone"} !`,
              `Plat prêt chez "${order.restaurantName || "le chef"}". ${timeInfo} 1er arrivé, 1er servi !`,
              { orderId, order, type: "NEW_DELIVERY_AVAILABLE" }
            );
          } else if (change.type === "removed") {
            knownReadyOrdersRef.current.delete(orderId);
          }
        });
      },
      (err) => {
        console.warn("Erreur écoute courses disponibles livreur:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  return null;
};

export default DriverNotificationWatcher;
