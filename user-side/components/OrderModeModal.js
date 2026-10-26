import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { XMarkIcon } from "react-native-heroicons/outline";
import { useLanguage } from "../contexts/LanguageContext";

const OrderModeModal = ({ visible, onClose, selectedMode = "DELIVERY", onSelectMode }) => {
  const [currentMode, setCurrentMode] = useState(selectedMode);
  const { t } = useLanguage();

  const modes = [
    {
      id: "PICKUP",
      title: t("orderModePickup"),
      subtitle: t("orderModePickupSub"),
      icon: "🚶‍♂️",
    },
    {
      id: "DELIVERY",
      title: t("orderModeDelivery"),
      subtitle: t("orderModeDeliverySub"),
      icon: "🛵",
    },
    {
      id: "DINE_IN",
      title: t("orderModeDineIn"),
      subtitle: t("orderModeDineInSub"),
      icon: "🪑",
    },
  ];

  const handleValidate = () => {
    if (onSelectMode) {
      onSelectMode(currentMode);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Fermer */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <XMarkIcon size={24} color="#111827" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>{t("orderModeModalTitle")}</Text>

          {/* Options */}
          <View style={styles.optionsList}>
            {modes.map((m) => {
              const isSelected = currentMode === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  onPress={() => setCurrentMode(m.id)}
                  style={[
                    styles.modeCard,
                    isSelected && styles.modeCardSelected,
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modeIcon}>{m.icon}</Text>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.modeTitle}>{m.title}</Text>
                    <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bouton Valider Jaune McDo */}
          <TouchableOpacity
            onPress={handleValidate}
            style={styles.validateBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.validateBtnText}>{t("validate")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: "900",
    color: "#1F2937",
    letterSpacing: 0.5,
    marginBottom: 16,
    textAlign: "left",
  },
  optionsList: {
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  modeCardSelected: {
    borderColor: "#FFBC0D", // Bordure dorée signature McDo
    backgroundColor: "#FFFBEB", // Fond très léger jaune
  },
  modeIcon: {
    fontSize: 26,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  modeSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  validateBtn: {
    backgroundColor: "#FFBC0D", // Jaune signature McDo
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  validateBtnText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
});

export default OrderModeModal;

