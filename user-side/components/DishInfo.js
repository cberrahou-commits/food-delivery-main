import { View, Text, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const DishInfo = ({ id, quantity, name, excludedIngredients, specialInstructions }) => {
  const [dishes, setDishes] = useState({});

  useEffect(() => {
    const getDish = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "dishes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDishes(docSnap.data());
        }
      } catch (e) {
        console.warn("DishInfo error:", e);
      }
    };
    getDish();
  }, [id]);

  const dishName = name || dishes?.name || "Plat";
  const dishImage =
    dishes?.image && (dishes.image.startsWith("http") || dishes.image.startsWith("data:image"))
      ? dishes.image
      : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800";

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 6, gap: 10 }}>
      <Text style={{ fontWeight: "800", fontSize: 15, color: "#059669", minWidth: 26, paddingTop: 2 }}>
        {quantity} x
      </Text>

      <Image
        source={{ uri: dishImage }}
        style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: "#E5E7EB" }}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "700", fontSize: 14, color: "#111827" }}>
          {dishName}
        </Text>

        {/* Badge ingrédients exclus (ex: sans salade et tomate) */}
        {excludedIngredients && excludedIngredients.length > 0 && (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderWidth: 1,
              borderColor: "#FECACA",
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 5,
              alignSelf: "flex-start",
              marginTop: 3,
            }}
          >
            <Text style={{ color: "#DC2626", fontWeight: "800", fontSize: 11 }}>
              🚫 Sans : {excludedIngredients.join(", ")}
            </Text>
          </View>
        )}

        {/* Remarque spéciale */}
        {specialInstructions ? (
          <Text style={{ color: "#4B5563", fontStyle: "italic", fontSize: 11, marginTop: 2 }}>
            📝 {specialInstructions}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export default DishInfo;
