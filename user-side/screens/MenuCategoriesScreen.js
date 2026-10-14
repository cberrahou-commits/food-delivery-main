import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ChevronRightIcon, ChevronDownIcon } from "react-native-heroicons/outline";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";
import McDoBottomNav from "../components/McDoBottomNav";
import BasketIcon from "../components/BasketIcon";
import OrderModeModal from "../components/OrderModeModal";
import WilayaSelectorModal from "../components/WilayaSelectorModal";
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

const MenuCategoriesScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);
  const [orderModeModalVisible, setOrderModeModalVisible] = useState(false);
  const [orderMode, setOrderMode] = useState("DELIVERY");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        if (list.length > 0) {
          setCategories(list);
        } else {
          setCategories(
            FOOD_CATEGORIES.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              image: CATEGORY_IMAGES[c.id] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300",
            }))
          );
        }
      } catch (e) {
        console.warn("Could not load categories:", e);
      }
    };

    fetchCategories();
  }, []);

  const getModeLabel = () => {
    switch (orderMode) {
      case "PICKUP":
        return "Click & Collect";
      case "DINE_IN":
        return "Sur place";
      default:
        return "Livraison";
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header McDo style */}
      <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 12 }}>
        {/* Logo Wajbati en squircle centré */}
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: "#076241", // Vert émeraude Wajbati
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 12,
            overflow: "hidden",
          }}
        >
          <Image
            source={require("../assets/logo.png")}
            style={{ width: 44, height: 44, borderRadius: 12 }}
            resizeMode="cover"
          />
        </View>

        {/* Ville / Restaurant */}
        <Text
          style={{
            fontSize: 22,
            fontWeight: "900",
            color: "#111827",
            letterSpacing: 0.5,
            textAlign: "center",
          }}
        >
          {selectedWilaya ? selectedWilaya.name.toUpperCase() : "ALGER CENTRE"}
        </Text>

        <Text
          style={{
            fontSize: 13,
            color: "#6B7280",
            marginTop: 2,
            textAlign: "center",
          }}
        >
          {selectedWilaya
            ? `${selectedWilaya.code} · Algérie`
            : "10 Rue Didouche Mourad"}
        </Text>

        {/* Lien vert modifier le restaurant */}
        <TouchableOpacity
          onPress={() => setWilayaModalVisible(true)}
          style={{ marginTop: 4 }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: "#059669", // Vert menthe / émeraude McDo
            }}
          >
            Modifier le restaurant
          </Text>
        </TouchableOpacity>

        {/* Sélecteur de mode de commande */}
        <TouchableOpacity
          onPress={() => setOrderModeModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 8,
            paddingHorizontal: 12,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#111827" }}>
            {getModeLabel()}
          </Text>
          <ChevronDownIcon size={16} color="#111827" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Ligne de séparation fine */}
      <View style={{ height: 1, backgroundColor: "#F3F4F6" }} />

      {/* Liste des catégories façon McDo */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={cat.id || index}
            onPress={() => {
              // Navigue vers l'accueil ou filtre la catégorie
              navigation.navigate("Home", { selectedCategory: cat.id || cat.name });
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 18,
              paddingHorizontal: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
              backgroundColor: "white",
            }}
            activeOpacity={0.7}
          >
            {/* Image / Icône détourée du produit */}
            <View
              style={{
                width: 62,
                height: 52,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <Image
                source={{ uri: cat.image }}
                style={{ width: 58, height: 48, borderRadius: 8 }}
                resizeMode="contain"
              />
            </View>

            {/* Nom de la catégorie en gras */}
            <Text
              style={{
                flex: 1,
                fontSize: 17,
                fontWeight: "800",
                color: "#1F2937",
                letterSpacing: 0.2,
              }}
            >
              {cat.name}
            </Text>

            {/* Chevron droit */}
            <ChevronRightIcon size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Barre de panier jaune flottante au-dessus du menu bas */}
      <BasketIcon bottomOffset={60} />

      {/* Barre de navigation 5 onglets McDo */}
      <McDoBottomNav activeTab="menu" />

      {/* Modal choix Wilaya */}
      <WilayaSelectorModal
        visible={wilayaModalVisible}
        onClose={() => setWilayaModalVisible(false)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
      />

      {/* Modal choix mode de commande */}
      <OrderModeModal
        visible={orderModeModalVisible}
        onClose={() => setOrderModeModalVisible(false)}
        selectedMode={orderMode}
        onSelectMode={setOrderMode}
      />
    </SafeAreaView>
  );
};

export default MenuCategoriesScreen;

