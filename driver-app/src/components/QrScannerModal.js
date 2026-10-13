import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const SCAN_SIZE = width * 0.68;

const QrScannerModal = ({
  visible,
  onClose,
  type = "PICKUP", // 'PICKUP' (retrait cuisine) ou 'DELIVERY' (livraison client)
  targetOrderId,
  expectedCode,
  onSuccess,
}) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const isPickup = type === "PICKUP";
  const themeColor = isPickup ? "#D97706" : "#059669";
  const cleanExpectedCode = String(
    expectedCode ||
      (targetOrderId
        ? isPickup
          ? targetOrderId.slice(-4).toUpperCase()
          : targetOrderId.slice(0, 4).toUpperCase()
        : "")
  ).toUpperCase();

  useEffect(() => {
    if (visible) {
      setScanned(false);
      setSuccess(false);
      setErrorMsg("");
      setManualCode("");

      (async () => {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === "granted");
      })();
    }
  }, [visible]);

  const handleBarCodeScanned = ({ type: barcodeType, data }) => {
    if (scanned || success) return;

    setErrorMsg("");
    let parsed = null;

    try {
      parsed = JSON.parse(data);
    } catch (e) {
      // Support legacy string format: TYPE:orderId:code
      if (data && data.includes(":")) {
        const parts = data.split(":");
        if (parts.length >= 3) {
          parsed = { type: parts[0], orderId: parts[1], code: parts[2] };
        }
      }
    }

    if (!parsed) {
      // Vérifier si c'est directement le code PIN
      if (data && String(data).trim().toUpperCase() === cleanExpectedCode) {
        handleValidationSuccess();
        return;
      }
      setErrorMsg("Format de QR code non reconnu.");
      return;
    }

    // Vérification du type (PICKUP vs DELIVERY)
    if (parsed.type && parsed.type !== type) {
      setErrorMsg(
        isPickup
          ? "Attention : ce QR code est un code de livraison, pas de retrait !"
          : "Attention : ce QR code est un code de retrait, pas de livraison !"
      );
      return;
    }

    // Vérification de la commande ou du code
    const orderMatch =
      !parsed.orderId ||
      parsed.orderId === targetOrderId ||
      targetOrderId.startsWith(parsed.orderId) ||
      parsed.orderId.startsWith(targetOrderId);

    const codeMatch =
      String(parsed.code).trim().toUpperCase() === cleanExpectedCode;

    if (orderMatch || codeMatch) {
      handleValidationSuccess();
    } else {
      setErrorMsg("Ce QR code ne correspond pas à cette commande.");
    }
  };

  const handleManualSubmit = () => {
    const input = manualCode.trim().toUpperCase();
    if (!input) {
      setErrorMsg("Veuillez saisir le code PIN.");
      return;
    }

    if (input === cleanExpectedCode) {
      handleValidationSuccess();
    } else {
      setErrorMsg("Code PIN incorrect. Veuillez vérifier avec l'interlocuteur.");
    }
  };

  const handleValidationSuccess = () => {
    setScanned(true);
    setSuccess(true);
    setErrorMsg("");

    setTimeout(() => {
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }, 800);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>
              {isPickup ? "Scan Retrait Cuisine 📦" : "Scan Remise Client 🏠"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Commande #{targetOrderId ? targetOrderId.slice(0, 6) : ""}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Camera Scanner View */}
        <View style={styles.cameraWrapper}>
          {hasPermission === null ? (
            <View style={styles.permContainer}>
              <ActivityIndicator size="large" color="#3FC060" />
              <Text style={styles.permText}>Demande d'accès caméra...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.permContainer}>
              <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
              <Text style={styles.permText}>
                Accès caméra refusé. Utilisez le code PIN ci-dessous.
              </Text>
            </View>
          ) : (
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            >
              {/* Overlay avec viseur */}
              <View style={styles.overlay}>
                <View style={styles.overlayTop}>
                  <Text style={styles.instructionText}>
                    {isPickup
                      ? "Visez le QR Code affiché par le cuisinier"
                      : "Visez le QR Code affiché par le client"}
                  </Text>
                </View>

                <View style={styles.targetRow}>
                  <View style={styles.overlaySide} />
                  <View
                    style={[
                      styles.targetBox,
                      { borderColor: success ? "#10B981" : themeColor },
                    ]}
                  >
                    {success ? (
                      <View style={styles.successBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={70}
                          color="#10B981"
                        />
                        <Text style={styles.successText}>Validé ! 🎉</Text>
                      </View>
                    ) : (
                      <>
                        <View
                          style={[
                            styles.corner,
                            styles.tl,
                            { borderColor: themeColor },
                          ]}
                        />
                        <View
                          style={[
                            styles.corner,
                            styles.tr,
                            { borderColor: themeColor },
                          ]}
                        />
                        <View
                          style={[
                            styles.corner,
                            styles.bl,
                            { borderColor: themeColor },
                          ]}
                        />
                        <View
                          style={[
                            styles.corner,
                            styles.br,
                            { borderColor: themeColor },
                          ]}
                        />
                      </>
                    )}
                  </View>
                  <View style={styles.overlaySide} />
                </View>

                <View style={styles.overlayBottom} />
              </View>
            </BarCodeScanner>
          )}
        </View>

        {/* Message d'erreur éventuel */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <MaterialIcons name="error-outline" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Panneau inférieur : Saisie manuelle de secours */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.bottomCard}
        >
          <View style={styles.manualHeader}>
            <Ionicons name="keypad-outline" size={18} color="#4B5563" />
            <Text style={styles.manualTitle}>
              Secours : Code PIN (4 chiffres)
            </Text>
          </View>
          <Text style={styles.manualSubtitle}>
            Si le scan est impossible, demandez le code à l'interlocuteur :
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.pinInput}
              value={manualCode}
              onChangeText={(t) => {
                setManualCode(t);
                setErrorMsg("");
              }}
              placeholder="Ex: 4821"
              placeholderTextColor="#9CA3AF"
              maxLength={6}
              autoCapitalize="characters"
              keyboardType="default"
            />

            <TouchableOpacity
              onPress={handleManualSubmit}
              disabled={success || !manualCode.trim()}
              style={[
                styles.submitBtn,
                {
                  backgroundColor: manualCode.trim() ? themeColor : "#D1D5DB",
                },
              ]}
            >
              <Text style={styles.submitBtnText}>Valider</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#1F2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "#374151",
    borderRadius: 20,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cameraWrapper: {
    flex: 1,
    backgroundColor: "#000000",
    overflow: "hidden",
  },
  permContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  permText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  overlay: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  targetRow: {
    flexDirection: "row",
    height: SCAN_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  targetBox: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderWidth: 2,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 24,
    height: 24,
  },
  tl: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  tr: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bl: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  br: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  successBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 16,
    borderRadius: 20,
  },
  successText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#065F46",
    marginTop: 4,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  manualHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  manualTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginLeft: 6,
  },
  manualSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  pinInput: {
    flex: 1,
    height: 48,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 16,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
    color: "#111827",
    textAlign: "center",
  },
  submitBtn: {
    marginLeft: 10,
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default QrScannerModal;

