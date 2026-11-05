import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  AppState,
  Linking,
  Modal,
  Vibration,
  Animated,
} from "react-native";
import * as Notifications from "expo-notifications";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  triggerLocalNotification,
  registerForPushNotificationsAsync,
  requestNotificationPermissionDirectly,
} from "../services/notificationService";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const DriverNotificationWatcher = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [hasPermission, setHasPermission] = useState(true);
  const [showHelperBanner, setShowHelperBanner] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);

  // Alerte In-App visuelle et vibration
  const [inAppAlert, setInAppAlert] = useState(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;

  const initialLoadRef = useRef(true);
  const knownReadyOrdersRef = useRef(new Set());

  const notifyDriver = (title, body, data = {}) => {
    // 1. Notification locale système (si autorisée)
    triggerLocalNotification(title, body, data);

    // 2. Vibration matérielle (infaillible sur OnePlus / ColorOS / Android)
    try {
      Vibration.vibrate([0, 600, 200, 600]);
    } catch (e) {
      console.warn("Vibration error:", e);
    }

    // NOTE: Les bannières visuelles intrusives à l'intérieur de l'application sont désactivées.
  };

  const dismissInAppAlert = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setInAppAlert(null);
    });
  };

  // 1. Vérification des permissions au démarrage et lors du retour dans l'application
  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);
      setShowHelperBanner(!granted);

      if (granted && user?.uid) {
        registerForPushNotificationsAsync(user.uid);
      }
    } catch (err) {
      console.warn("Erreur vérification permission notification livreur:", err);
    }
  };

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user?.uid]);

  // 2. Écouteur en direct de toutes les courses disponibles (READY_FOR_PICKUP)
  useEffect(() => {
    initialLoadRef.current = true;
    knownReadyOrdersRef.current = new Set();

    const q = query(
      collection(db, "orders"),
      where("status", "in", ["READY_FOR_PICKUP", "READY"])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (initialLoadRef.current) {
          snapshot.forEach((docSnap) => {
            knownReadyOrdersRef.current.add(docSnap.id);
          });
          initialLoadRef.current = false;
          return;
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

            notifyDriver(
              "🛵 Nouvelle livraison disponible !",
              `Plat prêt chez ${order.restaurantName || "le chef"}. Premier arrivé, premier servi !`,
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

  // Désactivation des bannières dans l application
  return null;
};

export default DriverNotificationWatcher;
