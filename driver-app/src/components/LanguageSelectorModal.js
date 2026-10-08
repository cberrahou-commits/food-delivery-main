import React from "react";
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import { useLanguage } from "../contexts/LanguageContext";
import { MaterialIcons } from "@expo/vector-icons";

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
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t("selectLanguage")}</Text>
              <Text style={styles.subTitle}>🇩🇿 Devise : Dinars Algériens (DA / د.ج)</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Languages */}
          <View style={styles.list}>
            {languages.map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => {
                    setLanguage(item.code);
                    onClose();
                  }}
                  style={[
                    styles.item,
                    isSelected ? styles.itemSelected : null,
                  ]}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.flag}>{item.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.itemLabel,
                          isSelected ? styles.itemLabelSelected : null,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.itemNative}>{item.native}</Text>
                    </View>
                  </View>

                  {isSelected && (
                    <MaterialIcons name="check-circle" size={24} color="#16a34a" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={onClose} style={styles.confirmBtn}>
            <Text style={styles.confirmText}>{t("confirm")}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default LanguageSelectorModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxWidth: 380,
    padding: 20,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  subTitle: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    paddingVertical: 14,
    gap: 10,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#f3f4f6",
    backgroundColor: "#f9fafb",
  },
  itemSelected: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  flag: {
    fontSize: 24,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  itemLabelSelected: {
    color: "#15803d",
  },
  itemNative: {
    fontSize: 11,
    color: "#9ca3af",
  },
  confirmBtn: {
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 6,
  },
  confirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
