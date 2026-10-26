import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";
import {
  SparklesIcon,
  MapPinIcon,
  QueueListIcon,
  ReceiptPercentIcon,
  EllipsisHorizontalIcon,
} from "react-native-heroicons/outline";
import {
  SparklesIcon as SparklesSolid,
  MapPinIcon as MapPinSolid,
  QueueListIcon as QueueListSolid,
  ReceiptPercentIcon as ReceiptPercentSolid,
  EllipsisHorizontalIcon as EllipsisHorizontalSolid,
} from "react-native-heroicons/solid";

const McDoBottomNav = ({ activeTab = "home" }) => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const tabs = [
    {
      id: "home",
      label: t("tabForYou"),
      screen: "Home",
      iconOutline: SparklesIcon,
      iconSolid: SparklesSolid,
    },
    {
      id: "restaurants",
      label: t("tabRestaurants"),
      screen: "RestaurantsMap",
      iconOutline: MapPinIcon,
      iconSolid: MapPinSolid,
    },
    {
      id: "menu",
      label: t("tabOrder"),
      screen: "MenuCategories",
      iconOutline: QueueListIcon,
      iconSolid: QueueListSolid,
    },
    {
      id: "orders",
      label: t("tabOrders"),
      screen: "Order Details",
      iconOutline: ReceiptPercentIcon,
      iconSolid: ReceiptPercentSolid,
    },
    {
      id: "plus",
      label: t("tabPlus"),
      screen: "Plus",
      iconOutline: EllipsisHorizontalIcon,
      iconSolid: EllipsisHorizontalSolid,
    },
  ];

  return (
    <View className="bg-white border-t border-gray-200 flex-row justify-around items-center pt-2 pb-5 px-1 shadow-lg">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = isActive ? tab.iconSolid : tab.iconOutline;
        const activeColor = "#FFBC0D"; // Jaune signature McDo
        const inactiveColor = "#9CA3AF";

        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => {
              if (tab.screen) {
                navigation.navigate(tab.screen, tab.params || {});
              }
            }}
            className="items-center justify-center flex-1 py-1"
            activeOpacity={0.7}
          >
            <Icon size={24} color={isActive ? activeColor : inactiveColor} />
            <Text
              style={{
                color: isActive ? "#111827" : inactiveColor,
                fontWeight: isActive ? "800" : "500",
                fontSize: 10,
                marginTop: 3,
              }}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default McDoBottomNav;
