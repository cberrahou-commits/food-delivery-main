import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { MapPinIcon, XMarkIcon, MagnifyingGlassIcon, CheckIcon } from "react-native-heroicons/solid";
import { ALGERIA_WILAYAS } from "../constants/wilayas";
import { useLanguage } from "../contexts/LanguageContext";

const WilayaSelectorModal = ({
  visible,
  onClose,
  selectedWilaya,
  onSelectWilaya,
  includeAllOption = true,
  title = "Sélectionnez votre Wilaya",
}) => {
  const [search, setSearch] = useState("");
  const { language } = useLanguage();

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
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[85%] pb-8 pt-4 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center space-x-2">
              <MapPinIcon size={24} color="#16a34a" />
              <View>
                <Text className="text-lg font-bold text-gray-900">{title}</Text>
                <Text className="text-xs text-gray-500">
                  58 Wilayas d'Algérie 🇩🇿
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-gray-100"
            >
              <XMarkIcon size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Recherche rapide */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2 my-3">
            <MagnifyingGlassIcon size={18} color="#9CA3AF" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Rechercher par nom ou numéro (ex: 16, Oran)..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-sm text-gray-900"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <XMarkIcon size={16} color="#9CA3AF" />
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
                  className={`flex-row items-center justify-between p-3.5 mb-2 rounded-xl border ${
                    !selectedWilaya
                      ? "bg-green-50 border-green-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <View className="flex-row items-center space-x-2">
                    <Text className="text-base">🇩🇿</Text>
                    <Text className="font-bold text-sm text-gray-900">
                      Toutes les Wilayas (Toute l'Algérie)
                    </Text>
                  </View>
                  {!selectedWilaya && <CheckIcon size={18} color="#16a34a" />}
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
                  className={`flex-row items-center justify-between p-3 mb-1.5 rounded-xl border ${
                    isSelected
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <View className="flex-row items-center space-x-3 flex-1">
                    <View className="bg-emerald-100 px-2 py-1 rounded-md min-w-[36px] items-center">
                      <Text className="text-emerald-900 font-extrabold text-xs">
                        {item.code}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-sm text-gray-900">
                        {item.name}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center space-x-2">
                    <Text className="text-sm font-semibold text-gray-500">
                      {item.nameAr}
                    </Text>
                    {isSelected && <CheckIcon size={18} color="#16a34a" />}
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

