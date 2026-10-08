import { View, Text, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Currency from "react-currency-formatter";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { selectRestaurant } from "../features/restaurantSlice";
import { selectUser } from "../features/userSlice";
import { useSelector, useDispatch } from "react-redux";
import { XCircleIcon, TrashIcon } from "react-native-heroicons/solid";
import {
  removeFromBasket,
  clearBasket,
  selectBasketItems,
  selectBasketTotal,
} from "../features/basketSlice";
import { UserAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  doc,
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const BasketScreen = () => {
  const navigation = useNavigation();
  const basketTotal = useSelector(selectBasketTotal);
  const restaurant = useSelector(selectRestaurant);
  const dbUser = useSelector(selectUser);
  const items = useSelector(selectBasketItems);
  const [groupItemsInBucket, setGroupItemsInBucket] = useState({});
  const dispatch = useDispatch();
  const { user } = UserAuth();

  const deliveryFee = items.length === 0 ? 0 : 2.50;

  useEffect(() => {
    const groupItems = items.reduce((results, item) => {
      (results[item.id] = results[item.id] || []).push(item);
      return results;
    }, {});
    setGroupItemsInBucket(groupItems);
  }, [items]);

  const ordersCollection = collection(db, "orders");
  const orderDishesCollection = collection(db, "orderDishes");

  const handleClearBasket = () => {
    Alert.alert(
      "Vider le panier ?",
      "Êtes-vous sûr de vouloir retirer tous les plats de votre panier ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Vider le panier",
          style: "destructive",
          onPress: () => dispatch(clearBasket()),
        },
      ]
    );
  };

  const createOrder = async () => {
    if (items.length === 0) {
      Alert.alert("Panier vide", "Veuillez ajouter des plats avant de commander.");
      return;
    }

    try {
      const newOrderRef = await addDoc(ordersCollection, {
        restaurantName: restaurant?.name || "Cuisine Partenaire",
        restaurantId: restaurant?.id || "",
        restaurantAddress: restaurant?.address || "",
        restaurantImage: restaurant?.image || "",
        restaurantLatitude: restaurant?.lat || 0,
        restaurantLongitude: restaurant?.lng || 0,
        userId: user?.uid || "",
        userFirstName: dbUser?.firstName || "",
        userLastName: dbUser?.lastName || "",
        userLatitude: dbUser?.latitude || 0,
        userLongitude: dbUser?.longitude || 0,
        userAddress: dbUser?.address || "",
        userPhoneNumber: dbUser?.phoneNumber || "",
        status: "PENDING",
        total: Number((basketTotal + deliveryFee).toFixed(2)),
        createdAt: serverTimestamp(),
      });

      await Promise.all(
        Object.entries(groupItemsInBucket).map(([key, dishGroup]) => {
          return setDoc(doc(orderDishesCollection, `${newOrderRef.id}_${key}`), {
            quantity: dishGroup.length,
            orderId: newOrderRef.id,
            dishId: key,
          });
        })
      );

      // Vider le panier après commande réussie
      dispatch(clearBasket());

      navigation.navigate("PreparingOrderScreen");
    } catch (error) {
      console.error("Erreur commande:", error);
      Alert.alert("Erreur", "Impossible de valider la commande. Veuillez réessayer.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* En-tête */}
        <View className="p-3 border-b border-[#4ade80] bg-white shadow-xs flex-row items-center justify-between">
          <View className="w-12">
            {items.length > 0 && (
              <TouchableOpacity onPress={handleClearBasket} className="p-2">
                <TrashIcon color="#ef4444" size={24} />
              </TouchableOpacity>
            )}
          </View>

          <View className="flex-1">
            <Text className="text-lg font-bold text-center">Mon Panier</Text>
            <Text className="text-center text-gray-400 text-xs">
              {restaurant?.name || restaurant?.title || "Cuisine Sélectionnée"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={navigation.goBack}
            className="w-12 items-end pr-2"
          >
            <XCircleIcon color="#4ade80" height={40} width={40} />
          </TouchableOpacity>
        </View>

        {items.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20 px-6">
            <Text className="text-6xl mb-4">🛒</Text>
            <Text className="text-2xl font-bold text-gray-800 text-center">
              Votre panier est vide
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-6">
              Sélectionnez de délicieux plats faits maison auprès de nos cuisiniers pour commander !
            </Text>
            <TouchableOpacity
              onPress={navigation.goBack}
              className="mt-6 bg-[#22c55e] px-8 py-3.5 rounded-2xl shadow-sm shadow-green-500/30"
            >
              <Text className="text-white font-bold text-base">
                Découvrir le menu
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Info Livraison */}
            <View className="flex-row items-center space-x-4 px-4 py-3 bg-white my-3 border border-gray-100">
              <Image
                source={{
                  uri: "https://www.pngitem.com/pimgs/m/533-5338534_motor-21-philosophychicchic-home-delivery-service-bike-hd.png",
                }}
                className="h-7 w-7 bg-gray-300 p-4 rounded-full"
              />
              <Text className="flex-1 text-gray-700">
                Livraison estimée : {restaurant?.minDeliveryTime || 20}-{restaurant?.maxDeliveryTime || 35} min
              </Text>
            </View>

            {/* Liste des plats */}
            <ScrollView className="divide-y divide-gray-200 flex-1">
              {Object.entries(groupItemsInBucket).map(([key, dishGroup]) => (
                <View
                  key={key}
                  className="flex-row items-center space-x-3 bg-white py-3 px-5 border-t border-gray-100"
                >
                  <Text className="text-[#22c55e] font-bold">{dishGroup.length} x</Text>
                  <Image
                    source={{ uri: dishGroup[0]?.image || restaurant?.image }}
                    className="h-12 w-12 rounded-xl bg-gray-100"
                  />
                  <Text className="flex-1 font-medium text-gray-800">{dishGroup[0]?.name}</Text>
                  <Text className="text-gray-700 font-semibold">
                    <Currency quantity={dishGroup[0]?.price * dishGroup.length} currency="EUR" />
                  </Text>
                  <TouchableOpacity
                    onPress={() => dispatch(removeFromBasket({ id: key }))}
                    className="p-1"
                  >
                    <Text className="text-[#ef4444] text-xs font-semibold">
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            {/* Mode de paiement */}
            <View className="flex-row items-center space-x-4 px-4 py-3 bg-white my-2 border border-gray-100">
              <Image
                source={{
                  uri: "https://img.icons8.com/?size=512&id=76948&format=png",
                }}
                className="h-7 w-7 bg-gray-300 p-4 rounded-full"
              />
              <Text className="flex-1 text-gray-700">Paiement à la livraison (Espèces)</Text>
            </View>

            {/* Résumé prix */}
            <View className="p-5 bg-white space-y-3 border-t border-gray-100">
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Sous-total</Text>
                <Text className="text-gray-600 font-medium">
                  <Currency quantity={basketTotal} currency="EUR" />
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500">Frais de livraison</Text>
                <Text className="text-gray-600 font-medium">
                  <Currency quantity={deliveryFee} currency="EUR" />
                </Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-100">
                <Text className="font-bold text-base text-gray-800">Total de la commande</Text>
                <Text className="font-extrabold text-lg text-gray-900">
                  <Currency quantity={basketTotal + deliveryFee} currency="EUR" />
                </Text>
              </View>

              <TouchableOpacity
                onPress={createOrder}
                className="rounded-2xl p-4 bg-[#22c55e] active:bg-[#16a34a] duration-150 shadow-md shadow-green-600/30 mt-2"
              >
                <Text className="text-center text-white font-extrabold text-lg">
                  Commander ({((basketTotal + deliveryFee)).toFixed(2)} €)
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

export default BasketScreen;
