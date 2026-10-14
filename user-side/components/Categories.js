import { ScrollView, Text, TouchableOpacity, Image, View } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { FOOD_CATEGORIES } from "../constants/categories";

const CATEGORY_IMAGES = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
  pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300",
  traditionnel: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=300",
  tacos: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300",
  pates: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=300",
  salades: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300",
  desserts: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300",
  boissons: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=300",
};

const Categories = () => {
  const navigation = useNavigation();

  return (
    <ScrollView
      horizontal
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 6,
        gap: 10,
      }}
      showsHorizontalScrollIndicator={false}
    >
      {FOOD_CATEGORIES.map((category) => {
        const img =
          CATEGORY_IMAGES[category.id] ||
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300";

        return (
          <TouchableOpacity
            key={category.id}
            onPress={() =>
              navigation.navigate("MenuCategories", {
                selectedCategory: category.id,
              })
            }
            activeOpacity={0.8}
            style={{
              alignItems: "center",
              width: 80,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1.5,
                borderColor: "#E5E7EB",
                backgroundColor: "#F9FAFB",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: img }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "800",
                color: "#1F2937",
                marginTop: 6,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {category.shortName || category.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

export default Categories;
