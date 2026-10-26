import { View, Text, ScrollView, Image, TouchableOpacity, Platform, StatusBar as RNStatusBar, ActivityIndicator } from "react-native";
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
import { setRestaurant } from "../features/restaurantSlice";
import { useLanguage } from "../contexts/LanguageContext";
import { FOOD_CATEGORIES, getCategoryName, getCategoryShortName } from "../constants/categories";
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
  const route = useRoute();
  const dispatch = useDispatch();
  const { t, language } = useLanguage();

  const restaurantUid = route.params?.id || "";
  const [restaurantInfo, setRestaurantInfo] = useState(route.params || {});
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (!restaurantUid) return;
    fetchRestaurantData();
    fetchDishData();
  }, [restaurantUid]);

  const fetchRestaurantData = async () => {
    try {
      const docRef = doc(db, "restaurants", restaurantUid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const items = docSnap.data();
        setRestaurantInfo((prev) => ({ ...prev, ...items }));
        dispatch(
          setRestaurant({
            id: restaurantUid,
            name: items.name || items.title || route.params?.title,
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
    } catch (e) {
      console.warn("fetchRestaurantData error:", e);
    }
  };

  const fetchDishData = async () => {
    try {
      const dishRef = collection(db, "dishes");
      const q = query(dishRef, where("restaurantId", "==", restaurantUid));
      const querySnapshot = await getDocs(q);
      let items = [];
      querySnapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setDishes(items);
    } catch (e) {
      console.warn("fetchDishData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const getDishCategory = (dish) => {
    if (dish?.categoryId) return String(dish.categoryId).toLowerCase();
    const cat = String(dish?.category || "").toLowerCase();
    const name = String(dish?.name || "").toLowerCase();
    if (cat.includes("burger") || name.includes("burger") || name.includes("sandwich")) return "burger";
    if (cat.includes("pizza") || name.includes("pizza")) return "pizza";
    if (
      cat.includes("tradition") ||
      name.includes("couscous") ||
      name.includes("tajine") ||
      name.includes("rechta") ||
      name.includes("chakhchoukha") ||
      name.includes("karantika") ||
      name.includes("trida") ||
      name.includes("djari")
    )
      return "traditionnel";
    if (cat.includes("tacos") || name.includes("tacos") || name.includes("wrap")) return "tacos";
    if (cat.includes("pate") || cat.includes("gratin") || name.includes("lasagne") || name.includes("penne") || name.includes("tagliatelle")) return "pates";
    if (cat.includes("salade") || name.includes("salade") || name.includes("bourek") || name.includes("frite")) return "salades";
    if (cat.includes("dessert") || name.includes("gateau") || name.includes("baklawa") || name.includes("tiramisu") || name.includes("bradj") || name.includes("jawzia")) return "desserts";
    if (cat.includes("boisson") || name.includes("jus") || name.includes("coca") || name.includes("hamoud") || name.includes("cherbet") || name.includes("mojito") || name.includes("the")) return "boissons";
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
          title: catObj ? `${catObj.icon} ${getCategoryName(catObj, language)}` : (t("menu") || "Menu"),
          dishes: filteredDishes,
        },
      ];
    }

    const groups = [];
    FOOD_CATEGORIES.forEach((cat) => {
      const catDishes = dishes.filter((d) => getDishCategory(d) === cat.id);
      if (catDishes.length > 0) {
        groups.push({
          title: `${cat.icon} ${getCategoryName(cat, language)}`,
          dishes: catDishes,
        });
      }
    });

    const otherDishes = dishes.filter((d) => getDishCategory(d) === "autre");
    if (otherDishes.length > 0) {
      groups.push({
        title: language === "ar" ? "✨ أطباق وتخصصات أخرى" : "✨ Autres Spécialités",
        dishes: otherDishes,
      });
    }

    return groups.length > 0 ? groups : [{ title: t("menu") || "Menu", dishes }];
  }, [dishes, filteredDishes, selectedCategory, language]);

  const isCook = restaurantInfo?.isCook || restaurantInfo?.isHomemade;
  const heroImage =
    restaurantInfo.image &&
    typeof restaurantInfo.image === "string" &&
    (restaurantInfo.image.startsWith("http://") ||
      restaurantInfo.image.startsWith("https://") ||
      restaurantInfo.image.startsWith("data:image"))
      ? restaurantInfo.image
      : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800";

  return (
    <>
      <StatusBar style="auto" />
      <BasketIcon />

      <ScrollView className="bg-white" showsVerticalScrollIndicator={false}>
        <View className="relative">
          <Image
            source={{ uri: heroImage }}
            className="h-60 w-full bg-gray-200"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={navigation.goBack}
            style={{
              position: "absolute",
              top:
                Platform.OS === "android"
                  ? Math.max(insets.top, (RNStatusBar.currentHeight || 0) + 16, 52) + 8
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
              backgroundColor: isCook ? "#ECFDF5" : "#EFF6FF",
              borderWidth: 1,
              borderColor: isCook ? "#A7F3D0" : "#BFDBFE",
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
                color: isCook ? "#065F46" : "#1D4ED8",
              }}
            >
              {isCook
                ? `🍳 ${t("partnerCook")}`
                : `🍽️ ${t("partnerRestaurant")}`}
            </Text>
          </View>

          <Text className="text-2xl font-black text-gray-900">
            {restaurantInfo.name || restaurantInfo.title || "Établissement"}
          </Text>

          <View className="flex-row items-center my-1.5 space-x-2">
            <StarIcon color="#F59E0B" size={18} />
            <Text className="text-xs text-gray-500 font-semibold">
              <Text className="text-amber-600 font-bold">{restaurantInfo.rating || "5.0"}</Text>{" "}
              {restaurantInfo.reviewCount ? `(${restaurantInfo.reviewCount} avis) ` : ""}·{" "}
              {restaurantInfo.minDeliveryTime || 20} - {restaurantInfo.maxDeliveryTime || 35} {t("mins")}
            </Text>
          </View>

          <View className="flex-row items-center space-x-1 mb-2">
            <MapPinIcon color="#9CA3AF" size={16} />
            <Text className="text-xs text-gray-500 font-medium" numberOfLines={1}>
              {restaurantInfo.address || "Algérie"}
            </Text>
          </View>

          {restaurantInfo.description ? (
            <Text className="text-xs text-gray-600 pb-3">
              {restaurantInfo.description}
            </Text>
          ) : null}

          {/* Barre de filtrage par Catégories */}
          {categoriesPresent.length > 0 && (
            <View className="border-t border-gray-100 pt-3 pb-2">
              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {t("menuCategories")}
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
                    🍽️ {t("allMenu")} ({dishes.length})
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
                        {cat.icon} {getCategoryShortName(cat, language)} ({count})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Liste des Plats groupés par Catégorie */}
        <View className="pb-36 pt-2">
          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#059669" />
              <Text className="text-gray-400 text-xs mt-3">{t("loadingMenu")}</Text>
            </View>
          ) : dishes.length === 0 ? (
            <View className="py-12 px-6 items-center justify-center">
              <Text style={{ fontSize: 32 }}>🍲</Text>
              <Text className="text-gray-700 font-bold text-base mt-2">{t("noDishesAvailable")}</Text>
              <Text className="text-gray-400 text-xs text-center mt-1">
                {t("menuUpdating")}
              </Text>
            </View>
          ) : (
            dishesGrouped.map((group, gIdx) => (
              <View key={gIdx} className="mb-4">
                <View className="px-4 py-2 bg-gray-50 border-t border-b border-gray-100 mb-1 flex-row items-center justify-between">
                  <Text className="font-black text-base text-gray-800">
                    {group.title}
                  </Text>
                  <Text className="text-xs font-bold text-gray-400">
                    {group.dishes.length} {group.dishes.length > 1 ? t("dishCountPlural") : t("dishCountSingle")}
                  </Text>
                </View>

                {group.dishes.map((dish, index) => {
                  return (
                    <DishRow
                      key={dish.id || index}
                      restaurantId={dish.restaurantId || restaurantUid}
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
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
};

export default RestaurantDetails;
