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

    // 2. Vibration matérielle (infaillible sur OnePlus / ColorOS)
    try {
      Vibration.vibrate([0, 600, 200, 600]);
    } catch (e) {
      console.warn("Vibration error:", e);
    }

    // 3. Bannière In-App en temps réel
    setInAppAlert({
      id: Date.now(),
      title,
      body,
      data,
    });

    Animated.spring(slideAnim, {
      toValue: Platform.OS === "ios" ? 50 : 35,
      useNativeDriver: true,
      tension: 60,
      friction: 8,
    }).start();

    setTimeout(() => {
      dismissInAppAlert();
    }, 8000);
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

  return (
    <>
      {/* 1. Alerte In-App Flottante pour Livreur */}
      {inAppAlert && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 12,
            right: 12,
            transform: [{ translateY: slideAnim }],
            zIndex: 99999,
            elevation: 20,
            backgroundColor: "#1E293B",
            borderRadius: 16,
            padding: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            borderLeftWidth: 5,
            borderLeftColor: "#3FC060",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text style={{ color: "#3FC060", fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>
                {inAppAlert.title}
              </Text>
              <Text style={{ color: "#E2E8F0", fontSize: 13, lineHeight: 17 }}>
                {inAppAlert.body}
              </Text>
            </View>
            <TouchableOpacity onPress={dismissInAppAlert} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                dismissInAppAlert();
                if (inAppAlert.data?.order) {
                  try {
                    navigation.navigate("OrderDelivery", { order: inAppAlert.data.order });
                  } catch (e) {
                    try { navigation.navigate("Orders"); } catch(err){}
                  }
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#3FC060",
                paddingVertical: 5,
                paddingHorizontal: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>Prendre la course</Text>
              <Ionicons name="chevron-forward" size={14} color="white" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* 2. Bannière d'alerte pour livreur si notifications système restreintes */}
      {!hasPermission && showHelperBanner && (
        <View
          style={{
            position: "absolute",
            top: Platform.OS === "ios" ? 50 : 35,
            left: 12,
            right: 12,
            zIndex: 9998,
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
                Alertes système restreintes (ColorOS)
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowHelperBanner(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={20} color="#92400E" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: "#78350F", marginTop: 4, lineHeight: 16 }}>
            Les alertes vibrent et s'affichent dans l'application. Pour les recevoir aussi écran éteint, débloquez ColorOS.
          </Text>

          <View style={{ flexDirection: "row", marginTop: 8, gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity
              onPress={async () => {
                const granted = await requestNotificationPermissionDirectly();
                if (granted) {
                  setHasPermission(true);
                  setShowHelperBanner(false);
                  if (user?.uid) registerForPushNotificationsAsync(user.uid);
                } else {
                  setModalDetailsVisible(true);
                }
              }}
              style={{
                backgroundColor: "#2563EB",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                Autoriser les alertes 🔔
              </Text>
            </TouchableOpacity>

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
                Guide ColorOS 📖
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
                Paramètres ⚙️
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 3. Modal explicatif clair ColorOS / OnePlus */}
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
              📱 Déblocage ColorOS / OnePlus
            </Text>

            <Text style={{ fontSize: 13, color: "#4B5563", marginBottom: 10, lineHeight: 18 }}>
              Sur ColorOS, le système bloque les interrupteurs par défaut pour les APKs. Voici comment le déverrouiller :
            </Text>

            <View style={{ backgroundColor: "#F3F4F6", padding: 12, borderRadius: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                1️⃣ Allez dans <Text style={{ fontWeight: "700" }}>Paramètres &gt; Applications &gt; Gestion des applications</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                2️⃣ En haut à droite, appuyez sur les <Text style={{ fontWeight: "700" }}>3 petits points (⋮)</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                3️⃣ Cliquez sur <Text style={{ fontWeight: "700", color: "#D97706" }}>"Réinitialiser les préférences des applications"</Text>. (Cela débloque immédiatement les interrupteurs grisés !).
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                4️⃣ Dans <Text style={{ fontWeight: "700" }}>Utilisation de la batterie</Text>, cochez <Text style={{ fontWeight: "700", color: "#10B981" }}>"Autoriser l'activité en arrière-plan"</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                5️⃣ Activez impérativement <Text style={{ fontWeight: "700", color: "#2563EB" }}>"Lancement automatique"</Text> (Auto-start). C'est ce paramètre qui permet à ColorOS de réveiller l'application livreur lorsque l'écran est éteint.
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
