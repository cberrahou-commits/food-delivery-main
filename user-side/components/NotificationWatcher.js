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
import { db } from "../firebase";
import { UserAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  triggerLocalNotification,
  registerForPushNotificationsAsync,
  requestNotificationPermissionDirectly,
} from "../services/notificationService";
import { BellAlertIcon, XMarkIcon, ChevronRightIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";

const NotificationWatcher = () => {
  const { user, dbUser } = UserAuth();
  const { t, language } = useLanguage();
  const navigation = useNavigation();

  const [hasPermission, setHasPermission] = useState(true);
  const [showHelperBanner, setShowHelperBanner] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);

  // Alerte In-App visuelle (garantit l'affichage même si l'OS bloque les notifications système)
  const [inAppAlert, setInAppAlert] = useState(null);
  const slideAnim = useRef(new Animated.Value(-120)).current;

  // Références pour éviter les notifications en double ou à l'ouverture initiale
  const initialClientLoadRef = useRef(true);
  const clientOrderStatusesRef = useRef({});

  const initialCookLoadRef = useRef(true);
  const cookOrderStatusesRef = useRef({});

  const notifyUser = (title, body, data = {}) => {
    // 1. Déclenche la notification locale système (marche sur Android 12, etc.)
    triggerLocalNotification(title, body, data);

    // 2. Déclenche la vibration matérielle (infaillible sur OnePlus / ColorOS)
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn("Vibration error:", e);
    }

    // 3. Affiche la bannière visuelle In-App à l'écran
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

    // Fermeture automatique après 8 secondes
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

  // 1. Vérification des permissions au démarrage et au retour au premier plan
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
      console.warn("Erreur vérification permission notification:", err);
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

  // 2. Écouteur en temps réel pour le CLIENT (Commandes de l'utilisateur)
  useEffect(() => {
    if (!user?.uid) return;

    initialClientLoadRef.current = true;
    clientOrderStatusesRef.current = {};

    const q = query(collection(db, "orders"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (initialClientLoadRef.current) {
          snapshot.forEach((docSnap) => {
            clientOrderStatusesRef.current[docSnap.id] = docSnap.data().status;
          });
          initialClientLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const orderId = change.doc.id;
          const order = change.doc.data();
          const prevStatus = clientOrderStatusesRef.current[orderId];
          const newStatus = order.status;

          if (change.type === "modified" && prevStatus !== newStatus) {
            clientOrderStatusesRef.current[orderId] = newStatus;

            if (newStatus === "WAITING_CLIENT_CONFIRMATION") {
              const readyTime = order.calculatedReadyTime || (order.preparationTimeMinutes ? `${order.preparationTimeMinutes} min` : "bientôt");
              notifyUser(
                "⏱️ Temps estimé par le cuisinier !",
                `Prêt vers ${readyTime}. Veuillez confirmer votre commande.`,
                { orderId, type: "COOK_ESTIMATE" }
              );
            } else if (newStatus === "IN_PREPARATION" || newStatus === "PREPARING") {
              notifyUser(
                "🍳 Préparation en cours !",
                `Votre commande chez ${order.restaurantName || "le chef"} est en préparation.`,
                { orderId, type: "IN_PREPARATION" }
              );
            } else if (newStatus === "READY_FOR_PICKUP" || newStatus === "READY") {
              notifyUser(
                "🍽️ Plat prêt pour livraison !",
                `Votre repas est prêt. Recherche d'un livreur disponible...`,
                { orderId, type: "READY_FOR_PICKUP" }
              );
            } else if (newStatus === "ASSIGNED_TO_DELIVERY" || newStatus === "DRIVERACCEPTED" || newStatus === "DRIVERPICKEDUP") {
              notifyUser(
                "🛵 Livreur en route !",
                `${order.driverName || "Un livreur"} a pris en charge votre commande et arrive !`,
                { orderId, type: "ASSIGNED_TO_DELIVERY" }
              );
            } else if (newStatus === "DELIVERED" || newStatus === "COMPLETE") {
              notifyUser(
                "🎉 Commande livrée !",
                "Votre repas a été livré ! N'oubliez pas d'évaluer vos plats, votre chef et votre coursier ⭐",
                { orderId, type: "DELIVERED" }
              );
            }
          }
        });
      },
      (err) => {
        console.warn("Erreur écoute notifications client:", err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // 3. Écouteur en temps réel pour le CUISINIER (Commandes adressées à sa cuisine)
  const kitchenId = dbUser?.kitchenId || (dbUser?.isCook && user?.uid ? `kitchen_${user.uid}` : null);

  useEffect(() => {
    if (!kitchenId) return;

    initialCookLoadRef.current = true;
    cookOrderStatusesRef.current = {};

    const q = query(
      collection(db, "orders"),
      where("restaurantId", "==", kitchenId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (initialCookLoadRef.current) {
          snapshot.forEach((docSnap) => {
            cookOrderStatusesRef.current[docSnap.id] = docSnap.data().status;
          });
          initialCookLoadRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          const orderId = change.doc.id;
          const order = change.doc.data();
          const prevStatus = cookOrderStatusesRef.current[orderId];
          const newStatus = order.status;

          if (change.type === "added" && !cookOrderStatusesRef.current[orderId]) {
            cookOrderStatusesRef.current[orderId] = newStatus;
            if (newStatus === "PENDING_COOK_APPROVAL" || newStatus === "PENDING") {
              notifyUser(
                "🍳 Nouvelle commande reçue !",
                `Commande de ${order.userName || "Client"} (${order.total || 0} DA). Indiquez votre temps de préparation.`,
                { orderId, type: "NEW_ORDER_COOK" }
              );
            }
          } else if (change.type === "modified" && prevStatus !== newStatus) {
            cookOrderStatusesRef.current[orderId] = newStatus;
            if (newStatus === "IN_PREPARATION" && prevStatus === "WAITING_CLIENT_CONFIRMATION") {
              notifyUser(
                "👨‍🍳 Cuisson confirmée par le client !",
                `Le client a accepté votre délai (${order.preparationTimeMinutes || ""} min). Lancez la cuisson !`,
                { orderId, type: "CLIENT_CONFIRMED" }
              );
            }
          }
        });
      },
      (err) => {
        console.warn("Erreur écoute notifications cuisinier:", err);
      }
    );

    return () => unsubscribe();
  }, [kitchenId]);

  return (
    <>
      {/* 1. Alerte In-App Flottante (Visible et tactile directement dans l'application) */}
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
            backgroundColor: "#111827",
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
              <Text style={{ color: "#E5E7EB", fontSize: 13, lineHeight: 17 }}>
                {inAppAlert.body}
              </Text>
            </View>
            <TouchableOpacity onPress={dismissInAppAlert} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XMarkIcon size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                dismissInAppAlert();
                if (inAppAlert.data?.type === "NEW_ORDER_COOK" && kitchenId) {
                  try { navigation.navigate("CookDashboard", { kitchenId }); } catch(e){}
                } else {
                  try { navigation.navigate("Order Details"); } catch(e){}
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
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>Voir</Text>
              <ChevronRightIcon size={14} color="white" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* 2. Bannière d'aide pour Android 13+ / ColorOS si les notifications système sont encore inactives */}
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
              <BellAlertIcon size={24} color="#D97706" />
              <Text style={{ fontWeight: "700", color: "#92400E", marginLeft: 8, fontSize: 13, flex: 1 }}>
                Alertes système restreintes (ColorOS)
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowHelperBanner(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <XMarkIcon size={20} color="#92400E" />
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 12, color: "#78350F", marginTop: 4, lineHeight: 16 }}>
            Les alertes s'affichent et vibrent dans l'application. Pour les recevoir aussi téléphone verrouillé, débloquez ColorOS.
          </Text>

          <View style={{ flexDirection: "row", marginTop: 8, gap: 8, flexWrap: "wrap" }}>
            <TouchableOpacity
              onPress={async () => {
                const granted = await requestNotificationPermissionDirectly();
                if (granted) {
                  setHasPermission(true);
                  setShowHelperBanner(false);
                  if (user?.uid) registerForPushNotificationsAsync(user.uid);
                }
              }}
              style={{
                backgroundColor: "#10B981",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 12 }}>
                Autoriser maintenant 🔔
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
                Débloquer ColorOS 📖
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              style={{
                backgroundColor: "#4B5563",
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

      {/* 3. Modal explicatif spécial ColorOS / OnePlus */}
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
              Sur ColorOS, le système grise l'interrupteur pour économiser la batterie ou par sécurité. Voici la solution certifiée :
            </Text>

            <View style={{ backgroundColor: "#F3F4F6", padding: 12, borderRadius: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                1️⃣ Allez dans <Text style={{ fontWeight: "700" }}>Paramètres &gt; Applications &gt; Gestion des applications</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                2️⃣ En haut à droite, appuyez sur les <Text style={{ fontWeight: "700" }}>3 petits points (⋮)</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                3️⃣ Cliquez sur <Text style={{ fontWeight: "700", color: "#D97706" }}>"Réinitialiser les préférences des applications"</Text>. (Cela débloque instantanément les interrupteurs grisés !).
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                4️⃣ Dans <Text style={{ fontWeight: "700" }}>Utilisation de la batterie</Text>, cochez <Text style={{ fontWeight: "700", color: "#10B981" }}>"Autoriser l'activité en arrière-plan"</Text>.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 3 }}>
                5️⃣ Activez impérativement <Text style={{ fontWeight: "700", color: "#2563EB" }}>"Lancement automatique"</Text> (Auto-start). C'est cette option qui permet à ColorOS de réveiller l'application et de faire sonner le téléphone quand l'application est fermée.
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

export default NotificationWatcher;
