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
import { db } from "../firebase";
import { UserAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import {
  triggerLocalNotification,
  registerForPushNotificationsAsync,
} from "../services/notificationService";
import { BellAlertIcon, XMarkIcon } from "react-native-heroicons/solid";

const NotificationWatcher = () => {
  const { user, dbUser } = UserAuth();
  const { t, language } = useLanguage();

  const [hasPermission, setHasPermission] = useState(true);
  const [showHelperBanner, setShowHelperBanner] = useState(false);
  const [modalDetailsVisible, setModalDetailsVisible] = useState(false);

  // Références pour éviter les notifications en double ou à l'ouverture initiale
  const initialClientLoadRef = useRef(true);
  const clientOrderStatusesRef = useRef({});

  const initialCookLoadRef = useRef(true);
  const cookOrderStatusesRef = useRef({});

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
          // Premier chargement : enregistrer l'état actuel de chaque commande sans notifier
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

            // Déclencher les alertes selon le nouveau statut
            if (newStatus === "WAITING_CLIENT_CONFIRMATION") {
              const readyTime = order.calculatedReadyTime || (order.preparationTimeMinutes ? `${order.preparationTimeMinutes} min` : "bientôt");
              triggerLocalNotification(
                "⏱️ Temps estimé par le cuisinier !",
                `Prêt vers ${readyTime}. Veuillez confirmer votre commande.`,
                { orderId, type: "COOK_ESTIMATE" }
              );
            } else if (newStatus === "IN_PREPARATION" || newStatus === "PREPARING") {
              triggerLocalNotification(
                "🍳 Préparation en cours !",
                `Votre commande chez ${order.restaurantName || "le chef"} est en préparation.`,
                { orderId, type: "IN_PREPARATION" }
              );
            } else if (newStatus === "READY_FOR_PICKUP" || newStatus === "READY") {
              triggerLocalNotification(
                "🍽️ Plat prêt pour livraison !",
                `Votre repas est prêt. Recherche d'un livreur disponible...`,
                { orderId, type: "READY_FOR_PICKUP" }
              );
            } else if (newStatus === "ASSIGNED_TO_DELIVERY" || newStatus === "DRIVERACCEPTED" || newStatus === "DRIVERPICKEDUP") {
              triggerLocalNotification(
                "🛵 Livreur en route !",
                `${order.driverName || "Un livreur"} a pris en charge votre commande et arrive !`,
                { orderId, type: "ASSIGNED_TO_DELIVERY" }
              );
            } else if (newStatus === "DELIVERED" || newStatus === "COMPLETE") {
              triggerLocalNotification(
                "🎉 Commande livrée !",
                "Votre repas a été livré avec succès. Bon appétit !",
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
              triggerLocalNotification(
                "🍳 Nouvelle commande reçue !",
                `Commande de ${order.userName || "Client"} (${order.total || 0} DA). Indiquez votre temps de préparation.`,
                { orderId, type: "NEW_ORDER_COOK" }
              );
            }
          } else if (change.type === "modified" && prevStatus !== newStatus) {
            cookOrderStatusesRef.current[orderId] = newStatus;
            if (newStatus === "IN_PREPARATION" && prevStatus === "WAITING_CLIENT_CONFIRMATION") {
              triggerLocalNotification(
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

  // Si les notifications sont accordées ou si la bannière a été masquée
  if (hasPermission || !showHelperBanner) {
    return null;
  }

  return (
    <>
      {/* Bannière d'aide pour Android 13+ / Permissions */}
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
            <BellAlertIcon size={24} color="#D97706" />
            <Text style={{ fontWeight: "700", color: "#92400E", marginLeft: 8, fontSize: 13, flex: 1 }}>
              Notifications inactives (Android 13+)
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowHelperBanner(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <XMarkIcon size={20} color="#92400E" />
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 12, color: "#78350F", marginTop: 4, lineHeight: 16 }}>
          Pour sonner lors des nouvelles commandes, activez les notifications. Si l'option est grisée, débloquez les paramètres restreints.
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

      {/* Modal explicatif clair avec instructions Android 13/14/15 */}
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
              🔔 Activer les notifications
            </Text>

            <Text style={{ fontSize: 13, color: "#4B5563", marginBottom: 10, lineHeight: 18 }}>
              Sur Android 13, 14 et 15, les applications installées hors Play Store ont les notifications bloquées par sécurité ("Paramètres restreints").
            </Text>

            <View style={{ backgroundColor: "#F3F4F6", padding: 12, borderRadius: 10, marginBottom: 14 }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 }}>
                Comment les débloquer en 3 étapes :
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                1️⃣ Cliquez sur <Text style={{ fontWeight: "700" }}>"Ouvrir Paramètres"</Text> ci-dessous.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                2️⃣ Appuyez sur les <Text style={{ fontWeight: "700" }}>3 petits points (⋮)</Text> en haut à droite.
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                3️⃣ Choisissez <Text style={{ fontWeight: "700", color: "#D97706" }}>"Autoriser les paramètres restreints"</Text> (validez par empreinte/code).
              </Text>
              <Text style={{ fontSize: 12, color: "#374151", marginVertical: 2 }}>
                4️⃣ Activez enfin l'interrupteur <Text style={{ fontWeight: "700", color: "#10B981" }}>Notifications</Text> !
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
