import { View, Text, Pressable, Image, TouchableOpacity, Alert } from "react-native";
import { MinusCircleIcon, PlusCircleIcon } from "react-native-heroicons/solid";
import React, { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
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
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { t, formatPrice } = useLanguage();

  const dispatch = useDispatch();
  const items = useSelector((state) => selectBasketItemsWithId(state, id));
  const basketItems = useSelector(selectBasketItems);
  const basketRestaurantId = useSelector(selectBasketRestaurantId);

  const addItems = () => {
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
                addToBasket({ id, restaurantId, name, description, price, image, prepTimeMinutes })
              );
            },
          },
        ]
      );
      return;
    }

    dispatch(
      addToBasket({ id, restaurantId, name, description, price, image, prepTimeMinutes })
    );
  };

  const removeItemFromBasket = () => {
    if (!items.length > 0) return;

    dispatch(removeFromBasket({ id }));
  };

  return (
    <>
      <Pressable
        onPress={() => setIsPressed(!isPressed)}
        className="m-2  rounded-3xl bg-white shadow shadow-slate-200 p-4 border border-gray-200"
      >
        <View className="flex-row">
          <View className="flex-1 pr-2 justify-center">
            <Text className="text-xl mb-1 font-semibold">{name}</Text>
            <Text className="text-gray-400">{description}</Text>
            <View className="flex-row items-center flex-wrap gap-2 mt-2">
              <Text className="text-emerald-700 text-base font-bold">
                {formatPrice(price)}
              </Text>
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
                uri: image,
              }}
              className="w-28 h-28 bg-gray-300 p-4 rounded-xl"
            />
            <View className="bg-white pt-3">
              <View className="flex-row items-center justify-between ">
                <TouchableOpacity onPress={removeItemFromBasket}>
                  <MinusCircleIcon
                    color={items.length > 0 ? "#4ade80" : "lightgray"}
                    size={42}
                  />
                </TouchableOpacity>

                {items.length === 0 ? (
                  <Text> </Text>
                ) : (
                  <Text>{items.length}</Text>
                )}

                <TouchableOpacity onPress={addItems}>
                  <PlusCircleIcon color="#4ade80" size={42} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    </>
  );
};

export default DishRow;
