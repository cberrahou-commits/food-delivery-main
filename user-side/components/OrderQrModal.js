import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
} from "react-native";
import QRCode from "qrcode";
import {
  XMarkIcon,
  QrCodeIcon,
  ShieldCheckIcon,
  ShareIcon,
} from "react-native-heroicons/solid";

const OrderQrModal = ({
  visible,
  onClose,
  type = "DELIVERY", // 'PICKUP' (Cuisinier) ou 'DELIVERY' (Client)
  orderId,
  orderCode,
  restaurantName,
  customerName,
}) => {
  const [qrUri, setQrUri] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPickup = type === "PICKUP";
  const safeCode = orderCode || (orderId ? (isPickup ? orderId.slice(-4).toUpperCase() : orderId.slice(0, 4).toUpperCase()) : "0000");
  const shortOrderId = orderId ? orderId.slice(0, 8) : "";

  // Payload formaté en JSON pour le scanner du livreur
  const qrPayload = JSON.stringify({
    type,
    orderId,
    code: safeCode,
  });

  useEffect(() => {
    let isMounted = true;
    if (visible && orderId) {
      setLoading(true);
      QRCode.toDataURL(qrPayload, {
        width: 280,
        margin: 2,
        color: {
          dark: isPickup ? "#b45309" : "#065f46", // ambre pour cuisine, vert pour client
          light: "#ffffff",
        },
      })
        .then((url) => {
          if (isMounted) {
            setQrUri(url);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.warn("QRCode local generation failed, fallback to web:", err);
          if (isMounted) {
            // Fallback web au cas où
            const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
              qrPayload
            )}`;
            setQrUri(fallbackUrl);
            setLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [visible, orderId, safeCode, type]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Food Delivery Algérie\nCommande #${shortOrderId}\nCode ${isPickup ? "de retrait" : "de livraison"} : ${safeCode}`,
      });
    } catch (e) {}
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/65 px-5">
        <View className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl items-center">
          {/* Header */}
          <View className="w-full flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center space-x-2">
              <View
                className={`p-2 rounded-full ${
                  isPickup ? "bg-amber-100" : "bg-emerald-100"
                }`}
              >
                <QrCodeIcon
                  size={24}
                  color={isPickup ? "#d97706" : "#059669"}
                />
              </View>
              <View>
                <Text className="text-base font-extrabold text-gray-900">
                  {isPickup ? "Code Retrait Cuisine" : "Code Réception Client"}
                </Text>
                <Text className="text-xs text-gray-500 font-medium">
                  Commande #{shortOrderId}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="p-1 rounded-full bg-gray-100"
            >
              <XMarkIcon size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Sous-titre info */}
          <Text className="text-xs text-gray-500 text-center mt-3 px-2">
            {isPickup
              ? `Présentez ce QR code au livreur lorsqu'il vient récupérer la commande pour ${customerName || "le client"}.`
              : `Présentez ce QR code à votre livreur lorsqu'il vous remet votre repas.`}
          </Text>

          {/* Conteneur QR Code */}
          <View
            className={`my-4 p-4 rounded-3xl border-2 bg-white items-center justify-center ${
              isPickup ? "border-amber-400" : "border-emerald-400"
            }`}
            style={{ width: 230, height: 230 }}
          >
            {loading ? (
              <ActivityIndicator
                size="large"
                color={isPickup ? "#d97706" : "#059669"}
              />
            ) : qrUri ? (
              <Image
                source={{ uri: qrUri }}
                style={{ width: 200, height: 200 }}
                resizeMode="contain"
              />
            ) : (
              <Text className="text-xs text-gray-400">Erreur affichage QR</Text>
            )}
          </View>

          {/* Badge Code PIN à 4 chiffres */}
          <View
            className={`w-full py-3 px-4 rounded-2xl items-center flex-row justify-between mb-4 ${
              isPickup ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"
            }`}
          >
            <View className="flex-row items-center space-x-2">
              <ShieldCheckIcon
                size={22}
                color={isPickup ? "#d97706" : "#059669"}
              />
              <Text className="text-xs font-semibold text-gray-700">
                Code PIN secours :
              </Text>
            </View>
            <Text
              className={`text-2xl font-black font-mono tracking-widest ${
                isPickup ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {safeCode}
            </Text>
          </View>

          <Text className="text-[11px] text-gray-400 text-center mb-4">
            💡 Si le scan caméra est impossible, donnez ce code PIN au livreur.
          </Text>

          {/* Actions */}
          <View className="w-full flex-row space-x-2">
            <TouchableOpacity
              onPress={handleShare}
              className="flex-1 py-3.5 bg-gray-100 rounded-2xl items-center flex-row justify-center space-x-1"
            >
              <ShareIcon size={18} color="#4b5563" />
              <Text className="text-gray-700 font-bold text-sm">Partager</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className={`flex-1 py-3.5 rounded-2xl items-center ${
                isPickup ? "bg-amber-600" : "bg-emerald-600"
              }`}
            >
              <Text className="text-white font-bold text-sm">Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OrderQrModal;

