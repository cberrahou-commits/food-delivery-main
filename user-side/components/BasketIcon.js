import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useSelector } from "react-redux";
import { useLanguage } from "../contexts/LanguageContext";
import { selectBasketItems, selectBasketTotal } from "../features/basketSlice";
import { useNavigation } from "@react-navigation/native";

const BasketIcon = () => {
  const navigation = useNavigation();
  const { t, formatPrice } = useLanguage();

  const items = useSelector(selectBasketItems);
  const basketTotal = useSelector(selectBasketTotal);

  if (items.length === 0) return null;

  return (
    <View className="absolute bottom-4 w-full z-50">
      <TouchableOpacity
        onPress={() => navigation.navigate("Basket")}
        className="bg-[#22c55e] mx-4 px-4 py-3 rounded-2xl items-center space-x-2 flex-row shadow-lg shadow-green-700/30"
      >
        <Text className="text-white font-extrabold text-base bg-[#16a34a] py-1.5 px-3 rounded-full">
          {items.length}
        </Text>
        <Text className="flex-1 text-white font-extrabold text-lg text-center">
          {t("viewBasket")}
        </Text>
        <Text className="text-lg text-white font-extrabold">
          {formatPrice(basketTotal)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default BasketIcon;
