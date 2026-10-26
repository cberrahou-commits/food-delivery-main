import { View, Text, Pressable, Image, TouchableOpacity, Alert } from "react-native";
import { MinusCircleIcon, PlusCircleIcon, StarIcon, SparklesIcon } from "react-native-heroicons/solid";
import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getLocalizedDish } from "../constants/categories";
import DishCustomizationModal from "./DishCustomizationModal";
import {
  addToBasket,
  clearBasket,
  selectBasketItemsWithId,
  selectBasketItems,
  selectBasketRestaurantId,
  removeFromBasket,
} from "../features/basketSlice";
import { useDispatch, useSelector } from "react-redux";

const DishRow = ({
  id,
  name,
  description,
  price,
  image,
  restaurantId,
  prepTimeMinutes,
  rating,
  reviewCount,
  category,
  customizableIngredients,
  ingredients,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const { t, formatPrice, language } = useLanguage();
  const localized = getLocalizedDish({ name, description }, language);

  const dispatch = useDispatch();
  const items = useSelector((state) => selectBasketItemsWithId(state, id));
  const basketItems = useSelector(selectBasketItems);
  const basketRestaurantId = useSelector(selectBasketRestaurantId);

  const handleCustomizedAddToCart = (customizedDish) => {
    if (
      basketItems.length > 0 &&
      basketRestaurantId &&
      restaurantId &&
      basketRestaurantId !== restaurantId
    ) {
      Alert.alert(
        t("changeRestaurantTitle"),
        t("changeRestaurantMsg"),
        [
          {
            text: t("keepBasket"),
            style: "cancel",
          },
          {
            text: t("clearAndAdd"),
            style: "destructive",
            onPress: () => {
              dispatch(clearBasket());
              dispatch(
                addToBasket({
                  ...customizedDish,
                  restaurantId,
                })
              );
            },
          },
        ]
      );
      return;
    }

    dispatch(
      addToBasket({
        ...customizedDish,
        restaurantId,
      })
    );
  };

  const addItems = () => {
    // Toujours ouvrir la personnalisation pour permettre de choisir sans salade, tomate, etc.
    setCustomModalVisible(true);
  };

  const removeItemFromBasket = () => {
    if (!items.length > 0) return;
    dispatch(removeFromBasket({ id }));
  };

  return (
    <>
      <Pressable
        onPress={() => setCustomModalVisible(true)}
        className="m-2 rounded-3xl bg-white shadow shadow-slate-200 p-4 border border-gray-200"
      >
        <View className="flex-row">
          <View className="flex-1 pr-2 justify-center">
            <Text className="text-xl mb-1 font-semibold">{localized.name}</Text>
            <Text className="text-gray-400">{localized.description}</Text>

            {/* Badge Personnalisable */}
            <View className="flex-row items-center mt-2">
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFBEB",
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <SparklesIcon size={12} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 10, fontWeight: "800", color: "#92400E" }}>
                  {t("customizableTag")}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center flex-wrap gap-2 mt-2">
              <Text className="text-emerald-700 text-base font-bold">
                {formatPrice(price)}
              </Text>
              {rating ? (
                <View className="flex-row items-center space-x-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <StarIcon size={12} color="#F59E0B" />
                  <Text className="text-amber-800 text-xs font-bold">
                    {Number(rating).toFixed(1)} {reviewCount ? `(${reviewCount})` : ""}
                  </Text>
                </View>
              ) : null}
              {prepTimeMinutes ? (
                <View className="bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  <Text className="text-amber-700 text-xs font-semibold">
                    ⏱️ ~{prepTimeMinutes} {t("mins")} {t("indicativeTag")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View>
            <Image
              style={{
                borderWidth: 1,
                borderColor: "#F3F3F4",
              }}
              source={{
                uri:
                  image && (image.startsWith("http") || image.startsWith("data:image"))
                    ? image
                    : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
              }}
              className="w-28 h-28 bg-gray-300 p-4 rounded-xl"
            />
            <View className="bg-white pt-2">
              <View className="flex-row items-center justify-end space-x-2">
                {items.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={removeItemFromBasket}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: "#D1D5DB",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "white",
                      }}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "900", color: "#374151", marginTop: -2 }}>-</Text>
                    </TouchableOpacity>

                    <Text style={{ fontSize: 14, fontWeight: "900", color: "#111827", minWidth: 18, textAlign: "center" }}>
                      {items.length}
                    </Text>
                  </>
                )}

                <TouchableOpacity
                  onPress={addItems}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "#FFBC0D",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827", marginTop: -2 }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      {/* Modal de personnalisation des ingrédients */}
      <DishCustomizationModal
        visible={customModalVisible}
        onClose={() => setCustomModalVisible(false)}
        dish={{
          id,
          restaurantId,
          name: localized.name,
          description: localized.description,
          originalName: name,
          price,
          image,
          prepTimeMinutes,
          category,
          customizableIngredients,
          ingredients,
        }}
        onAddToCart={handleCustomizedAddToCart}
      />
    </>
  );
};

export default DishRow;
