import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  TextInput,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";
import { selectRestaurant } from "../features/restaurantSlice";
import { selectUser } from "../features/userSlice";
import { useSelector, useDispatch } from "react-redux";
import {
  XMarkIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from "react-native-heroicons/outline";
import {
  addToBasket,
  removeFromBasket,
  clearBasket,
  selectBasketItems,
  selectBasketTotal,
} from "../features/basketSlice";
import { UserAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { notifyCookForNewOrder } from "../services/notificationService";
import OrderModeModal from "../components/OrderModeModal";

const BasketScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t, formatPrice } = useLanguage();
  const basketTotal = useSelector(selectBasketTotal);
  const restaurant = useSelector(selectRestaurant);
  const dbUser = useSelector(selectUser);
  const items = useSelector(selectBasketItems);
  const [groupItemsInBucket, setGroupItemsInBucket] = useState({});
  const dispatch = useDispatch();
  const { user } = UserAuth();

  const [orderModeModalVisible, setOrderModeModalVisible] = useState(false);
  const [orderMode, setOrderMode] = useState("DELIVERY");

  // Frais de livraison standard en Algérie : 200 DA (gratuit en click & collect)
  const deliveryFee = items.length === 0 || orderMode === "PICKUP" ? 0 : 200;

  useEffect(() => {
    const groupItems = items.reduce((results, item) => {
      const groupKey = `${item.id}_${item.excludedIngredients?.slice().sort().join("-") || "none"}_${item.specialInstructions || ""}`;
      (results[groupKey] = results[groupKey] || []).push(item);
      return results;
    }, {});
    setGroupItemsInBucket(groupItems);
  }, [items]);

  const [phoneNumber, setPhoneNumber] = useState(dbUser?.phoneNumber || "");

  useEffect(() => {
    if (dbUser?.phoneNumber && !phoneNumber) {
      setPhoneNumber(dbUser.phoneNumber);
    }
  }, [dbUser?.phoneNumber]);

  const ordersCollection = collection(db, "orders");
  const orderDishesCollection = collection(db, "orderDishes");

  const handleClearBasket = () => {
    Alert.alert(
      t("clearBasket"),
      t("clearBasketConfirm"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("clearBasket"),
          style: "destructive",
          onPress: () => dispatch(clearBasket()),
        },
      ]
    );
  };

  const createOrder = async () => {
    if (items.length === 0) {
      Alert.alert(t("basketEmpty"), t("basketEmptyDesc"));
      return;
    }

    try {
      const pickupCode = String(Math.floor(1000 + Math.random() * 9000));
      const deliveryCode = String(Math.floor(1000 + Math.random() * 9000));

      const newOrderRef = await addDoc(ordersCollection, {
        userId: user?.uid || "guest",
        userFirstName: dbUser?.firstName || "Client",
        userLastName: dbUser?.lastName || "Wajbati",
        userAddress: dbUser?.address || "Alger",
        userPhoneNumber: phoneNumber || dbUser?.phoneNumber || "",
        total: basketTotal + deliveryFee,
        subtotal: basketTotal,
        deliveryFee: deliveryFee,
        orderMode: orderMode,
        status: "PENDING_COOK_APPROVAL",
        pickupCode: pickupCode,
        deliveryCode: deliveryCode,
        createdAt: serverTimestamp(),
        restaurantId: restaurant?.id || "default",
        restaurantName: restaurant?.name || restaurant?.title || "Cuisine Wajbati",
        restaurantWilayaCode: restaurant?.wilayaCode || "16",
        restaurantWilaya: restaurant?.wilaya || "Alger",
        restaurantAddress: restaurant?.address || "",
        restaurantLatitude: restaurant?.latitude || 36.7538,
        restaurantLongitude: restaurant?.longitude || 3.0588,
        userLatitude: dbUser?.latitude || 36.7538,
        userLongitude: dbUser?.longitude || 3.0588,
      });

      for (const item of items) {
        await addDoc(orderDishesCollection, {
          orderId: newOrderRef.id,
          dishId: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          category: item.category || "",
          excludedIngredients: item.excludedIngredients || [],
          specialInstructions: item.specialInstructions || "",
          customizations: item.customizations || null,
        });
      }

      dispatch(clearBasket());
      notifyCookForNewOrder(restaurant?.id, newOrderRef.id);
      navigation.navigate("PreparingOrderScreen");
    } catch (error) {
      console.error("Erreur commande:", error);
      Alert.alert(t("error"), "Impossible de valider la commande. Veuillez réessayer.");
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop:
          Platform.OS === "android"
            ? Math.max(insets.top, (StatusBar.currentHeight || 0) + 16, 52)
            : 0,
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header Panier McDo (Image 4) */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity onPress={navigation.goBack} style={{ padding: 4 }}>
              <XMarkIcon size={24} color="#111827" />
            </TouchableOpacity>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: "#111827",
                marginLeft: 16,
              }}
            >
              Panier
            </Text>
          </View>

          {items.length > 0 && (
            <TouchableOpacity onPress={handleClearBasket} style={{ padding: 4 }}>
              <TrashIcon size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Rappel Restaurant / Ville */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "900",
            color: "#111827",
            letterSpacing: 0.3,
          }}
        >
          {restaurant?.name
            ? restaurant.name.toUpperCase()
            : "ALGER CENTRE"}
        </Text>
        <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
          {restaurant?.address || "10 Rue Didouche Mourad"}
        </Text>

        {/* Dropdown mode de commande */}
        <TouchableOpacity
          onPress={() => setOrderModeModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }}>
            {orderMode === "PICKUP"
              ? "Click & Collect"
              : orderMode === "DINE_IN"
              ? "Sur place"
              : "Livraison à domicile"}
          </Text>
          <ChevronDownIcon size={14} color="#111827" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 50, marginBottom: 12 }}>🛒</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827", textAlign: "center" }}>
            Votre panier est vide
          </Text>
          <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 6, lineHeight: 18 }}>
            Découvrez nos spécialités faites maison et ajoutez vos plats préférés.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("MenuCategories")}
            style={{
              marginTop: 20,
              backgroundColor: "#FFBC0D",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "900", color: "#111827" }}>
              Découvrir le menu
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Liste des plats dans le panier façon McDo */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            {Object.entries(groupItemsInBucket).map(([key, dishGroup]) => {
              const dish = dishGroup[0];
              const qty = dishGroup.length;
              const linePrice = dish?.price * qty;

              return (
                <View
                  key={key}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F3F4F6",
                    backgroundColor: "white",
                  }}
                >
                  {/* Nom du plat et lien Modifier */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "800",
                        color: "#111827",
                        flex: 1,
                      }}
                    >
                      {dish?.name}
                    </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#059669",
                        }}
                      >
                        Modifier
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Badges d'ingrédients exclus (ex: sans salade, sans tomate) */}
                  {dish?.excludedIngredients && dish.excludedIngredients.length > 0 && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#FEF2F2",
                        borderWidth: 1,
                        borderColor: "#FECACA",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        alignSelf: "flex-start",
                        marginBottom: 6,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "800", color: "#DC2626" }}>
                        🚫 Sans : {dish.excludedIngredients.join(", ")}
                      </Text>
                    </View>
                  )}

                  {/* Consignes particulières pour le chef */}
                  {dish?.customizations?.note ? (
                    <Text
                      style={{
                        fontSize: 11,
                        color: "#4B5563",
                        fontStyle: "italic",
                        marginBottom: 8,
                      }}
                    >
                      📝 Note : {dish.customizations.note}
                    </Text>
                  ) : null}

                  {/* Ligne Quantité (-) QTY (+) et Prix */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                      {/* Bouton Moins */}
                      <TouchableOpacity
                        onPress={() =>
                          dispatch(
                            removeFromBasket({
                              id: dish?.id,
                              uniqueBasketId: dish?.uniqueBasketId,
                            })
                          )
                        }
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: "#D1D5DB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        activeOpacity={0.7}
                      >
                        <MinusIcon size={16} color="#4B5563" />
                      </TouchableOpacity>

                      {/* Nombre */}
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
                        {qty}
                      </Text>

                      {/* Bouton Plus Jaune McDo */}
                      <TouchableOpacity
                        onPress={() => dispatch(addToBasket(dish))}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: "#FFBC0D",
                          backgroundColor: "#FFFBEB",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                        activeOpacity={0.7}
                      >
                        <PlusIcon size={16} color="#B45309" />
                      </TouchableOpacity>
                    </View>

                    {/* Prix de la ligne */}
                    <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
                      {formatPrice(linePrice)}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Ligne "🍟 Ajouter un produit" (Image 4) */}
            <TouchableOpacity
              onPress={() => navigation.navigate("MenuCategories")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 18,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                backgroundColor: "white",
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, marginRight: 14 }}>🍟</Text>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: "800",
                  color: "#1F2937",
                }}
              >
                Ajouter un produit
              </Text>
              <PlusIcon size={20} color="#6B7280" />
            </TouchableOpacity>

            {/* Suivi WhatsApp */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingVertical: 14,
                backgroundColor: "#F9FAFB",
                marginVertical: 10,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827", marginBottom: 6 }}>
                📱 Numéro WhatsApp pour suivi en temps réel :
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  height: 44,
                }}
              >
                <Text style={{ fontWeight: "800", color: "#374151", marginRight: 8 }}>
                  🇩🇿 +213
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="05 / 06 / 07 XX XX XX"
                  keyboardType="phone-pad"
                  style={{ flex: 1, fontSize: 14, color: "#111827" }}
                />
              </View>
            </View>
          </ScrollView>

          {/* Footer McDo : Sous-Total & Bouton Jaune Valider le panier (Image 4) */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 14,
              paddingBottom: 24,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
              backgroundColor: "white",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827" }}>
                Sous-Total
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
                {formatPrice(basketTotal + deliveryFee)}
              </Text>
            </View>

            <TouchableOpacity
              onPress={createOrder}
              activeOpacity={0.88}
              style={{
                backgroundColor: "#FFBC0D", // Jaune signature McDo
                paddingVertical: 15,
                borderRadius: 10,
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#111827",
                  letterSpacing: 0.2,
                }}
              >
                Valider le panier
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Modal Mode de commande */}
      <OrderModeModal
        visible={orderModeModalVisible}
        onClose={() => setOrderModeModalVisible(false)}
        selectedMode={orderMode}
        onSelectMode={setOrderMode}
      />
    </SafeAreaView>
  );
};

export default BasketScreen;
