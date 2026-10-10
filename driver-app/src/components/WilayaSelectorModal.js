import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { ALGERIA_WILAYAS } from "../constants/wilayas";

const WilayaSelectorModal = ({
  visible,
  onClose,
  selectedWilaya,
  onSelectWilaya,
  includeAllOption = true,
  title = "Sélectionnez votre Wilaya",
}) => {
  const [search, setSearch] = useState("");

  const filteredWilayas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALGERIA_WILAYAS;
    return ALGERIA_WILAYAS.filter(
      (w) =>
        w.code.includes(q) ||
        w.name.toLowerCase().includes(q) ||
        w.nameAr.includes(q)
    );
  }, [search]);

  const handleSelect = (wilaya) => {
    onSelectWilaya(wilaya);
    setSearch("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: "85%",
            paddingBottom: 30,
            paddingTop: 16,
            paddingHorizontal: 20,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#f3f4f6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="location-on" size={26} color="#16a34a" />
              <View style={{ marginLeft: 8 }}>
                <Text style={{ fontSize: 16, fontWeight: "bold", color: "#111827" }}>
                  {title}
                </Text>
                <Text style={{ fontSize: 11, color: "#6b7280" }}>
                  58 Wilayas d'Algérie 🇩🇿
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                padding: 6,
                borderRadius: 20,
                backgroundColor: "#f3f4f6",
              }}
            >
              <Ionicons name="close" size={20} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* Recherche rapide */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              marginVertical: 12,
            }}
          >
            <Ionicons name="search" size={18} color="#9ca3af" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher (ex: 16, Oran)..."
              placeholderTextColor="#9ca3af"
              style={{ flex: 1, marginLeft: 8, fontSize: 13, color: "#111827" }}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Liste */}
          <FlatList
            data={filteredWilayas}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              includeAllOption ? (
                <TouchableOpacity
                  onPress={() => handleSelect(null)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 12,
                    marginBottom: 8,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: !selectedWilaya ? "#86efac" : "#e5e7eb",
                    backgroundColor: !selectedWilaya ? "#f0fdf4" : "#f9fafb",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 16, marginRight: 8 }}>🇩🇿</Text>
                    <Text style={{ fontWeight: "bold", fontSize: 13, color: "#111827" }}>
                      Toutes les Wilayas (Toute l'Algérie)
                    </Text>
                  </View>
                  {!selectedWilaya && (
                    <MaterialIcons name="check" size={18} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ) : null
            }
            renderItem={({ item }) => {
              const isSelected =
                selectedWilaya?.code === item.code ||
                selectedWilaya === item.code ||
                selectedWilaya === item.name;

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: 10,
                    marginBottom: 6,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: isSelected ? "#4ade80" : "#f3f4f6",
                    backgroundColor: isSelected ? "#f0fdf4" : "white",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: "#dcfce7",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        minWidth: 32,
                        alignItems: "center",
                        marginRight: 10,
                      }}
                    >
                      <Text style={{ color: "#14532d", fontWeight: "bold", fontSize: 11 }}>
                        {item.code}
                      </Text>
                    </View>
                    <Text style={{ fontWeight: "600", fontSize: 13, color: "#1f2937" }}>
                      {item.name}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#6b7280", marginRight: 6 }}>
                      {item.nameAr}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color="#16a34a" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default WilayaSelectorModal;

