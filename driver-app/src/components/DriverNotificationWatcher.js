import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  AppState,
  Linking,
  Modal,
} from "react-native";
import * as Notifications from "expo-notifications";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import {
  triggerLocalNotification,
  registerForPushNotificationsAsync,
} from "../services/notificationService";
import { Ionicons } from "@expo/vector-icons";

const DriverNotificationWatcher = () => {
  const { user } = useAuth();

  const [hasPermission, setHasPermission] = useState(true);
  const [showHelperBanner, setShowHelperBanner] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);

  const initialLoadRef = useRef(true);
  const knownReadyOrdersRef = useRef(new Set());

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
          // Premier chargement : stocker les commandes déjà prêtes sans spammer de sons
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

            triggerLocalNotification(
              "🛵 Nouvelle livraison disponible !",
              `Plat prêt chez ${order.restaurantName || "le chef"}. Premier arrivé, premier servi !`,
              { orderId, type: "NEW_DELIVERY_AVAILABLE" }
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

  // Si les notifications sont déjà autorisées ou si la bannière a été masquée manuellement
  if (hasPermission || !showHelperBanner) {
    return null;
  }

  return (
    <>
      {/* Bannière d'alerte pour livreur */}
      <View
        style={{
          position: "absolute",
          top: Platform.OS === "ios" ? 50 : 35,
          left: 12,
          right: 12,
          zIndex: 9999,
          elevation: 10,
          backgroundColor: "#FEF3C7",
          borderColor: "#F59E0B",
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginRight: 8 }}>
            <Ionicons name="notifications-outline" size={24} color="#D97706" />
            <Text style={{ fontWeight: "700", color: "#92400E", marginLeft: 8, fontSize: 13, flex: 1 }}>
              Notifications inactives (Android 13+)
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelperBanner(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color="#92400E" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: "#78350F", marginTop: 4, lineHeight: 16 }}>
          Pour être averti dès qu'un plat est prêt à être livré (sonnerie & vibreur), activez les notifications. Si grisé, débloquez les paramètres restreints.
        </Text>

        <View style={{ flexDirection: "row", marginTop: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setModalDetailsVisible(true)}
            style={{
              backgroundColor: "#D97706",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
              Guide pas-à-pas 📖
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openSettings()}
            style={{
              backgroundColor: "#3FC060",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
              Ouvrir Paramètres ⚙️
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal explicatif clair Android 13/14/15 */}
      <Modal
        visible={modalDetailsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDetailsVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 20,
              padding: 22,
              width: "100%",
              maxWidth: 380,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 12, textAlign: "center" }}>
              🔔 Activer les alertes courses
            </Text>

            <Text style={{ fontSize: 13, color: "#4B5563", marginBottom: 10, lineHeight: 18 }}>
              Sur Android 13, 14 et 15, les notifications des APK installés manuellement sont bloquées par défaut ("Paramètres restreints").
            </Text>

            <View style={{ backgroundColor: "#F3F4F6", padding: 12, borderRadius: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
                Procédure de déblocage rapide :
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                1️⃣ Cliquez sur <Text style={{ fontWeight: "700" }}>"Ouvrir Paramètres"</Text> ci-dessous.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                2️⃣ Appuyez sur les <Text style={{ fontWeight: "700" }}>3 petits points (⋮)</Text> en haut à droite.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                3️⃣ Appuyez sur <Text style={{ fontWeight: "700", color: "#D97706" }}>"Autoriser les paramètres restreints"</Text> (code/empreinte).
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                4️⃣ Activez l'interrupteur <Text style={{ fontWeight: "700", color: "#10B981" }}>Notifications</Text> !
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalDetailsVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: "#E5E7EB",
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "600", color: "#374151" }}>Fermer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModalDetailsVisible(false);
                  Linking.openSettings();
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  backgroundColor: "#3FC060",
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "bold", color: "white" }}>Ouvrir Paramètres</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default DriverNotificationWatcher;
