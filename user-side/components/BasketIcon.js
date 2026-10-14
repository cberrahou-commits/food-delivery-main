import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { useLanguage } from "../contexts/LanguageContext";
import { selectBasketItems, selectBasketTotal } from "../features/basketSlice";
import { useNavigation } from "@react-navigation/native";
import { ShoppingBagIcon } from "react-native-heroicons/solid";

const BasketIcon = ({ bottomOffset = 0 }) => {
  const navigation = useNavigation();
  const { t, formatPrice } = useLanguage();

  const items = useSelector(selectBasketItems);
  const basketTotal = useSelector(selectBasketTotal);

  if (items.length === 0) return null;

  return (
    <View
      style={{
        position: "absolute",
        bottom: bottomOffset,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate("Basket")}
        activeOpacity={0.9}
        style={{
          backgroundColor: "#FFBC0D", // Jaune signature McDo
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {/* Sac de commande avec badge rouge */}
        <View style={{ position: "relative", width: 36, height: 36, justifyContent: "center", alignItems: "center" }}>
          <ShoppingBagIcon size={28} color="#1F2937" />
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -4,
              backgroundColor: "#DC2626", // Rouge vif
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 4,
              borderWidth: 1.5,
              borderColor: "#FFBC0D",
            }}
          >
            <Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>
              {items.length}
            </Text>
          </View>
        </View>

        {/* Titre central "Afficher le panier" */}
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 15,
            fontWeight: "800",
            color: "#111827",
            letterSpacing: 0.2,
          }}
        >
          {t("viewBasket") || "Afficher le panier"}
        </Text>

        {/* Prix total à droite */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "900",
            color: "#111827",
          }}
        >
          {formatPrice(basketTotal)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BasketIcon;
