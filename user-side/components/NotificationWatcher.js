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

  // Références pour éviter les notifications en double ou à l'ouverture initiale
  const initialClientLoadRef = useRef(true);
  const clientOrderStatusesRef = useRef({});
  const clientOrderReassignedRef = useRef({});

  const initialCookLoadRef = useRef(true);
  const cookOrderStatusesRef = useRef({});

  const notifyUser = (title, body, data = {}) => {
    // 1. Déclenche la notification locale système (barre de statut / lockscreen)
    triggerLocalNotification(title, body, data);

    // 2. Déclenche la vibration matérielle (infaillible sur tous les appareils Android/iOS)
    try {
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (e) {
      console.warn("Vibration error:", e);
    }

    // NOTE: Les bannières visuelles intrusives à l'intérieur de l'application sont désactivées.
  };

  // 1. Vérification des permissions au démarrage et au retour au premier plan
  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);

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

          const isReassignedChange =
            order.cancelReason === "DRIVER_NO_SHOW" ||
            Boolean(order.reassignedAt) ||
            Boolean(order.driverCancelledAt);

          const currentReassignedKey = order.reassignedAt
            ? order.reassignedAt.seconds || String(order.reassignedAt)
            : null;
          const prevReassignedKey = clientOrderReassignedRef.current[orderId];

          if (change.type === "modified") {
            const statusChanged = prevStatus !== newStatus;
            const reassignmentFired =
              currentReassignedKey && currentReassignedKey !== prevReassignedKey;

            if (reassignmentFired) {
              clientOrderReassignedRef.current[orderId] = currentReassignedKey;
            }

            if (statusChanged) {
              clientOrderStatusesRef.current[orderId] = newStatus;

              if (newStatus === "WAITING_CLIENT_CONFIRMATION") {
                const readyTime =
                  order.calculatedReadyTime ||
                  (order.preparationTimeMinutes
                    ? `${order.preparationTimeMinutes} min`
                    : "bientôt");
                notifyUser(
                  "⏱️ Temps estimé par le cuisinier !",
                  `Prêt vers ${readyTime}. Veuillez confirmer votre commande.`,
                  { orderId, type: "COOK_ESTIMATE" }
                );
              } else if (
                newStatus === "IN_PREPARATION" ||
                newStatus === "PREPARING"
              ) {
                notifyUser(
                  "🍳 Préparation en cours !",
                  `Votre commande chez ${
                    order.restaurantName || "le chef"
                  } est en préparation.`,
                  { orderId, type: "IN_PREPARATION" }
                );
              } else if (
                newStatus === "READY_FOR_PICKUP" ||
                newStatus === "READY"
              ) {
                // Si la commande a été réassignée suite à l'absence du livreur initial
                if (
                  isReassignedChange ||
                  prevStatus === "ASSIGNED_TO_DELIVERY" ||
                  prevStatus === "DRIVERACCEPTED"
                ) {
                  notifyUser(
                    "🔄 Recherche d'un nouveau coursier !",
                    `Le livreur précédent ne s'étant pas présenté, votre commande est immédiatement réassignée à un nouveau coursier !`,
                    { orderId, type: "ORDER_REASSIGNED" }
                  );
                } else {
                  notifyUser(
                    "🍽️ Plat prêt pour livraison !",
                    `Votre repas est prêt. Recherche d'un livreur disponible...`,
                    { orderId, type: "READY_FOR_PICKUP" }
                  );
                }
              } else if (
                newStatus === "ASSIGNED_TO_DELIVERY" ||
                newStatus === "DRIVERACCEPTED" ||
                newStatus === "DRIVERPICKEDUP"
              ) {
                notifyUser(
                  "🛵 Livreur en route !",
                  `${
                    order.driverName || "Un livreur"
                  } a pris en charge votre commande et arrive !`,
                  { orderId, type: "ASSIGNED_TO_DELIVERY" }
                );
              } else if (newStatus === "DELIVERED" || newStatus === "COMPLETE") {
                notifyUser(
                  "🎉 Commande livrée !",
                  "Votre repas a été livré ! N'oubliez pas d'évaluer vos plats, votre chef et votre coursier ⭐",
                  { orderId, type: "DELIVERED" }
                );
              }
            } else if (reassignmentFired) {
              // Même si le statut reste READY_FOR_PICKUP, le timestamp de réassignation a changé
              notifyUser(
                "🔄 Recherche d'un nouveau coursier !",
                `Le livreur précédent ne s'étant pas présenté, votre commande est immédiatement réassignée à un nouveau coursier !`,
                { orderId, type: "ORDER_REASSIGNED" }
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

  // Désactivation des bannières à l'intérieur de l'application :
  // Les notifications sont gérées de manière non intrusive par le système (barre de statut / lockscreen) et par vibrations.
  return null;
};

export default NotificationWatcher;
