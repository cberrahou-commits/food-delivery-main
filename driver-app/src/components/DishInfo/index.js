import { View, Text, StyleSheet } from "react-native";
import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebase";

const DishInfo = ({ id, quantity, name, excludedIngredients, specialInstructions }) => {
  const [dish, setDish] = useState(null);

  useEffect(() => {
    if (id) getDish();
  }, [id]);

  const getDish = async () => {
    try {
      const docRef = doc(db, "dishes", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setDish(docSnap.data());
      }
    } catch (e) {
      console.log("Error loading dish:", e);
    }
  };

  const displayName = name || dish?.name || "Plat";

  return (
    <View style={styles.container}>
      <View style={styles.orderDetailsContainer}>
        <Text style={styles.orderItemText}>{displayName}</Text>
        <Text style={styles.quantityText}>x {quantity}</Text>
      </View>

      {/* Badges d'ingrédients exclus (ex: sans salade et tomate) */}
      {excludedIngredients && excludedIngredients.length > 0 && (
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>
            🚫 Sans : {excludedIngredients.join(", ")}
          </Text>
        </View>
      )}

      {specialInstructions ? (
        <Text style={styles.noteText}>📝 {specialInstructions}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 6,
  },
  orderDetailsContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "700",
    flex: 1,
  },
  quantityText: {
    fontSize: 16,
    color: "#16a34a",
    fontWeight: "800",
    marginLeft: 8,
  },
  badgeContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 3,
  },
  badgeText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "800",
  },
  noteText: {
    color: "#6b7280",
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 2,
  },
});

export default DishInfo;
