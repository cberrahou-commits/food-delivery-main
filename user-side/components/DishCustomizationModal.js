import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StatusBar as RNStatusBar,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { XMarkIcon, CheckIcon, MinusIcon, PlusIcon } from "react-native-heroicons/solid";
import { useLanguage } from "../contexts/LanguageContext";
import { getDefaultIngredientsForDish } from "../constants/categories";

const DishCustomizationModal = ({ visible, onClose, dish, onAddToCart }) => {
  const insets = useSafeAreaInsets();
  const { formatPrice, t } = useLanguage();

  const [quantity, setQuantity] = useState(1);
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [excludedIngredients, setExcludedIngredients] = useState([]);
  const [specialNote, setSpecialNote] = useState("");

  useEffect(() => {
    if (dish && visible) {
      const ingredients = getDefaultIngredientsForDish(dish);
      setAvailableIngredients(ingredients);
      setExcludedIngredients([]);
      setSpecialNote("");
      setQuantity(1);
    }
  }, [dish, visible]);

  if (!dish) return null;

  const toggleIngredient = (ingredient) => {
    if (excludedIngredients.includes(ingredient)) {
      // Réintégrer l'ingrédient
      setExcludedIngredients(excludedIngredients.filter((i) => i !== ingredient));
    } else {
      // Exclure l'ingrédient (ex: sans salade)
      setExcludedIngredients([...excludedIngredients, ingredient]);
    }
  };

  const handleConfirm = () => {
    const summaryExcluded = excludedIngredients.length > 0
      ? `Sans ${excludedIngredients.join(", sans ")}`
      : "";

    const fullInstructions = [summaryExcluded, specialNote.trim()]
      .filter(Boolean)
      .join(" • ");

    onAddToCart({
      ...dish,
      quantity,
      excludedIngredients,
      specialInstructions: fullInstructions,
      customizations: {
        excluded: excludedIngredients,
        note: specialNote.trim(),
      },
      uniqueBasketId: `${dish.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    });

    onClose();
  };

  const unitPrice = parseFloat(dish.price) || 0;
  const totalPrice = unitPrice * quantity;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#F9FAFB",
          paddingTop:
            Platform.OS === "android"
              ? Math.max(insets.top, RNStatusBar.currentHeight || 0, 24)
              : 0,
        }}
      >
        <StatusBar barStyle="dark-content" />

        {/* Header avec Photo & Bouton Fermer */}
        <View style={{ position: "relative", height: 200, backgroundColor: "#E5E7EB" }}>
          <Image
            source={{
              uri:
                dish.image && (dish.image.startsWith("http") || dish.image.startsWith("data:image"))
                  ? dish.image
                  : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <XMarkIcon size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Titre & Prix du Plat */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827", flex: 1, marginRight: 10 }}>
                {dish.name}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: "900", color: "#065F46" }}>
                {formatPrice(unitPrice)}
              </Text>
            </View>

            {dish.description ? (
              <Text style={{ fontSize: 13, color: "#6B7280", marginTop: 6, lineHeight: 18 }}>
                {dish.description}
              </Text>
            ) : null}

            {dish.category ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#ECFDF5",
                  borderWidth: 1,
                  borderColor: "#A7F3D0",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#065F46" }}>
                  📂 {dish.category}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Section Personnalisation Ingrédients (Sans...) */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
                🌿 Personnalisez vos ingrédients
              </Text>
              <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                Touchez un ingrédient pour le retirer de votre plat (ex: sans salade, sans tomate).
              </Text>
            </View>

            {/* Grille de puces ingrédients interactifs */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {availableIngredients.map((ingredient, index) => {
                const isExcluded = excludedIngredients.includes(ingredient);

                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => toggleIngredient(ingredient)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: isExcluded ? "#EF4444" : "#10B981",
                      backgroundColor: isExcluded ? "#FEF2F2" : "#F0FDF4",
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: isExcluded ? "#EF4444" : "#10B981",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 6,
                      }}
                    >
                      {isExcluded ? (
                        <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>✕</Text>
                      ) : (
                        <CheckIcon size={12} color="white" />
                      )}
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: isExcluded ? "#B91C1C" : "#065F46",
                        textDecorationLine: isExcluded ? "line-through" : "none",
                      }}
                    >
                      {isExcluded ? `Sans ${ingredient}` : ingredient}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Récapitulatif dynamique des exclusions */}
            {excludedIngredients.length > 0 && (
              <View
                style={{
                  marginTop: 14,
                  backgroundColor: "#FFFBEB",
                  borderWidth: 1,
                  borderColor: "#FDE68A",
                  borderRadius: 10,
                  padding: 10,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, marginRight: 6 }}>⚠️</Text>
                <Text style={{ fontSize: 12, color: "#92400E", fontWeight: "700", flex: 1 }}>
                  Votre choix : Sans {excludedIngredients.join(", sans ")}
                </Text>
              </View>
            )}
          </View>

          {/* Section Note ou consigne spéciale */}
          <View
            style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 2 }}>
              📝 Instructions spéciales pour la cuisine
            </Text>
            <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 10 }}>
              Précisez vos préférences de cuisson, d'assaisonnement ou sauce à part.
            </Text>

            <TextInput
              value={specialNote}
              onChangeText={setSpecialNote}
              placeholder="Ex: Sauce à part, viande bien cuite, pas trop de sel..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#D1D5DB",
                borderRadius: 10,
                padding: 10,
                fontSize: 13,
                color: "#111827",
                textAlignVertical: "top",
              }}
            />
          </View>
        </ScrollView>

        {/* Barre d'action fixe en bas */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 8,
          }}
        >
          {/* Sélecteur de Quantité */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 12,
              paddingHorizontal: 6,
              paddingVertical: 4,
            }}
          >
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: quantity > 1 ? "white" : "transparent",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MinusIcon size={16} color={quantity > 1 ? "#111827" : "#9CA3AF"} />
            </TouchableOpacity>

            <Text style={{ minWidth: 26, textAlign: "center", fontSize: 15, fontWeight: "900", color: "#111827" }}>
              {quantity}
            </Text>

            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <PlusIcon size={16} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Bouton Ajouter au Panier */}
          <TouchableOpacity
            onPress={handleConfirm}
            activeOpacity={0.88}
            style={{
              flex: 1,
              backgroundColor: "#FFBC0D", // Jaune signature McDo
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827" }}>
              Ajouter au panier • {formatPrice(totalPrice)}
            </Text>
            {excludedIngredients.length > 0 && (
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#92400E", marginTop: 2 }} numberOfLines={1}>
                (Sans {excludedIngredients.join(", sans ")})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default DishCustomizationModal;

