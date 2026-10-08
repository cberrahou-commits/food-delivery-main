import React from "react";
import { View, Text, Modal, TouchableOpacity, Pressable } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { CheckCircleIcon, XMarkIcon } from "react-native-heroicons/solid";

const languages = [
  { code: "ar", label: "العربية", flag: "🇩🇿", native: "الجزائر" },
  { code: "fr", label: "Français", flag: "🇫🇷", native: "France / Maghreb" },
  { code: "en", label: "English", flag: "🇬🇧", native: "International" },
];

const LanguageSelectorModal = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center items-center px-4"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
            <View>
              <Text className="text-xl font-extrabold text-gray-900">
                {t("selectLanguage")}
              </Text>
              <Text className="text-xs text-gray-500 mt-0.5">
                🇩🇿 Devise par défaut : Dinars Algériens (DA)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <XMarkIcon size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Options de langue */}
          <View className="py-4 space-y-3">
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => {
                    setLanguage(item.code);
                    onClose();
                  }}
                  className={`flex-row items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-100 bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <View className="flex-row items-center space-x-3">
                    <Text className="text-2xl">{item.flag}</Text>
                    <View>
                      <Text
                        className={`text-base font-bold ${
                          isSelected ? "text-emerald-900" : "text-gray-800"
                        }`}
                      >
                        {item.label}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {item.native}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <CheckCircleIcon size={26} color="#10b981" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="mt-2 bg-emerald-500 py-3.5 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-base">
              {t("confirm")}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default LanguageSelectorModal;

