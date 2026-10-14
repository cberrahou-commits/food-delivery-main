import { View, Text, ScrollView, Image, TouchableOpacity, Platform, StatusBar as RNStatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useLayoutEffect, useState, useMemo } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  StarIcon,
} from "react-native-heroicons/solid";
import DishRow from "../components/DishRow";
import BasketIcon from "../components/BasketIcon";
import { useDispatch } from "react-redux";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { setRestaurant } from "../features/restaurantSlice";
import { useLanguage } from "../contexts/LanguageContext";
import { FOOD_CATEGORIES } from "../constants/categories";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
} from "firebase/firestore";
import { StatusBar } from "expo-status-bar";

const RestaurantDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const [dishes, setDishes] = useState([]);
  const [restaurantInfo, setRestaurantInfo] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const {
    params: { id },
  } = useRoute();

  const restaurantUid = id;

  useEffect(() => {
    getDishData();
    dispatch(
      setRestaurantAsync({
        restaurantUid,
      })
    );
  }, []);

  const setRestaurantAsync = createAsyncThunk(
    "restaurant/set",
    async ({ restaurantUid }, { dispatch }) => {
      const docRef = doc(db, "restaurants", restaurantUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data();
        setRestaurantInfo(items);
        dispatch(
          setRestaurant({
            id: restaurantUid,
            name: items.name,
            rating: items.rating,
            address: items.address,
            description: items.description,
            image: items.image,
            lat: items.lat,
            lng: items.lng,
            minDeliveryTime: items.minDeliveryTime,
            maxDeliveryTime: items.maxDeliveryTime,
          })
        );
      }
    }
  );

  const getDishData = async () => {
    const dishRef = collection(db, "dishes");

    const q = query(dishRef, where("restaurantId", "==", restaurantUid));

    await getDocs(q).then((querySnapshot) => {
      let item = [];
      querySnapshot.forEach((doc) => {
        item.push({ ...doc.data(), id: doc.id });
      });
      setDishes(item);
    });
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, []);

  const getDishCategory = (dish) => {
    if (dish?.categoryId) return dish.categoryId;
    const cat = (dish?.category || "").toLowerCase();
    const name = (dish?.name || "").toLowerCase();
    if (cat.includes("burger") || name.includes("burger") || name.includes("sandwich")) return "burger";
    if (cat.includes("pizza") || name.includes("pizza")) return "pizza";
    if (cat.includes("tradition") || name.includes("couscous") || name.includes("tajine") || name.includes("rechta")) return "traditionnel";
    if (cat.includes("tacos") || name.includes("tacos") || name.includes("wrap")) return "tacos";
    if (cat.includes("pate") || cat.includes("gratin") || name.includes("lasagne")) return "pates";
    if (cat.includes("salade") || name.includes("salade")) return "salades";
    if (cat.includes("dessert") || name.includes("gateau") || name.includes("baklawa")) return "desserts";
    if (cat.includes("boisson") || name.includes("jus") || name.includes("coca")) return "boissons";
    return "autre";
  };

  const categoriesPresent = useMemo(() => {
    const ids = new Set();
    dishes.forEach((d) => ids.add(getDishCategory(d)));
    return FOOD_CATEGORIES.filter((c) => ids.has(c.id));
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "all") return dishes;
    return dishes.filter((d) => getDishCategory(d) === selectedCategory);
  }, [dishes, selectedCategory]);

  const dishesGrouped = useMemo(() => {
    if (selectedCategory !== "all") {
      const catObj = FOOD_CATEGORIES.find((c) => c.id === selectedCategory);
      return [
        {
          title: catObj ? `${catObj.icon} ${catObj.name}` : "Menu",
          dishes: filteredDishes,
        },
      ];
    }

    const groups = [];
    FOOD_CATEGORIES.forEach((cat) => {
      const catDishes = dishes.filter((d) => getDishCategory(d) === cat.id);
      if (catDishes.length > 0) {
        groups.push({
          title: `${cat.icon} ${cat.name}`,
          dishes: catDishes,
        });
      }
    });

    const otherDishes = dishes.filter((d) => getDishCategory(d) === "autre");
    if (otherDishes.length > 0) {
      groups.push({
        title: "✨ Autres Spécialités",
        dishes: otherDishes,
      });
    }

    return groups.length > 0 ? groups : [{ title: t("menu") || "Menu", dishes }];
  }, [dishes, filteredDishes, selectedCategory]);

  return (
    <>
      <StatusBar style="auto" />
      <BasketIcon />

      <ScrollView className="bg-white">
        <View className="relative">
          <Image
            source={{
              uri:
                restaurantInfo.image &&
                (restaurantInfo.image.startsWith("http") || restaurantInfo.image.startsWith("data:image"))
                  ? restaurantInfo.image
                  : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            }}
            className="h-60 w-full bg-gray-200"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={navigation.goBack}
            style={{
              position: "absolute",
              top:
                Platform.OS === "android"
                  ? Math.max(insets.top, RNStatusBar.currentHeight || 0, 24) + 12
                  : (insets.top > 0 ? insets.top + 8 : 44),
              left: 16,
              zIndex: 10,
            }}
            className="bg-white p-2 rounded-full shadow-md"
          >
            <ArrowLeftIcon size={24} color="#059669" />
          </TouchableOpacity>
        </View>

        <View className="bg-white px-4 pt-4">
          {/* Badge Type d'établissement : Restaurant vs Cuisinier Partenaire */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: restaurantInfo?.isCook || restaurantInfo?.isHomemade ? "#ECFDF5" : "#EFF6FF",
              borderWidth: 1,
              borderColor: restaurantInfo?.isCook || restaurantInfo?.isHomemade ? "#A7F3D0" : "#BFDBFE",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 8,
              alignSelf: "flex-start",
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: restaurantInfo?.isCook || restaurantInfo?.isHomemade ? "#065F46" : "#1D4ED8",
              }}
            >
              {restaurantInfo?.isCook || restaurantInfo?.isHomemade
                ? "🍳 Cuisinier Partenaire · Fait Maison"
                : "🍽️ Restaurant Partenaire"}
            </Text>
          </View>

          <Text className="text-2xl font-black text-gray-900">{restaurantInfo.name}</Text>

          <View className="flex-row items-center my-1.5 space-x-2">
            <StarIcon color="#F59E0B" size={18} />
            <Text className="text-xs text-gray-500 font-semibold">
              <Text className="text-amber-600 font-bold">{restaurantInfo.rating || 5.0}</Text>{" "}
              {restaurantInfo.reviewCount ? `(${restaurantInfo.reviewCount} avis) ` : ""}·{" "}
              {restaurantInfo.minDeliveryTime || 20} - {restaurantInfo.maxDeliveryTime || 35} {t("mins")}
            </Text>
          </View>

          <View className="flex-row items-center space-x-1 mb-2">
            <MapPinIcon color="#9CA3AF" size={16} />
            <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
              {restaurantInfo.address || "Alger, Algérie"}
            </Text>
          </View>

          {restaurantInfo.description ? (
            <Text className="text-xs text-gray-600 pb-3">
              {restaurantInfo.description}
            </Text>
          ) : null}

          {/* Barre de filtrage par Catégories */}
          <View className="border-t border-gray-100 pt-3 pb-2">
            <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Catégories du menu :
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              <TouchableOpacity
                onPress={() => setSelectedCategory("all")}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: selectedCategory === "all" ? "#FFBC0D" : "#F3F4F6",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: "#111827",
                  }}
                >
                  🍽️ Tout ({dishes.length})
                </Text>
              </TouchableOpacity>

              {categoriesPresent.map((cat) => {
                const count = dishes.filter((d) => getDishCategory(d) === cat.id).length;
                const isSelected = selectedCategory === cat.id;

                return (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 12,
                      backgroundColor: isSelected ? "#FFBC0D" : "#F3F4F6",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#111827",
                      }}
                    >
                      {cat.icon} {cat.shortName} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Liste des Plats groupés par Catégorie */}
        <View className="pb-36 pt-2">
          {dishesGrouped.map((group, gIdx) => (
            <View key={gIdx} className="mb-4">
              <View className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100 mb-1 flex-row items-center justify-between">
                <Text className="font-black text-base text-gray-800">
                  {group.title}
                </Text>
                <Text className="text-xs font-bold text-gray-400">
                  {group.dishes.length} plat{group.dishes.length > 1 ? "s" : ""}
                </Text>
              </View>

              {group.dishes.map((dish, index) => {
                return (
                  <DishRow
                    key={dish.id || index}
                    restaurantId={dish.restaurantId}
                    id={dish.id}
                    name={dish.name}
                    description={dish.description}
                    price={dish.price}
                    image={dish.image}
                    prepTimeMinutes={dish.prepTimeMinutes || dish.prepTime || 25}
                    rating={dish.rating}
                    reviewCount={dish.reviewCount}
                    category={dish.category}
                    customizableIngredients={dish.customizableIngredients}
                    ingredients={dish.ingredients}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default RestaurantDetails;
