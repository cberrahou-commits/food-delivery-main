import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from "react-native";
import {
  XMarkIcon,
  StarIcon,
  ShieldCheckIcon,
  PhoneIcon,
} from "react-native-heroicons/solid";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";
import { openWhatsApp } from "../constants/wilayas";

const DriverProfileModal = ({ visible, onClose, driverId, initialDriverName, driverPhone }) => {
  const { t, language } = useLanguage();
  const [driverData, setDriverData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible || !driverId) return;

    const fetchDriverDetails = async () => {
      setLoading(true);
      try {
        // 1. Profil livreur
        const docRef = doc(db, "user", driverId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setDriverData(snap.data());
        }

        // 2. Avis reçus par ce livreur
        const q = query(
          collection(db, "reviews"),
          where("driverId", "==", driverId),
          orderBy("createdAt", "desc")
        );
        const revSnap = await getDocs(q);
        const revList = [];
        revSnap.forEach((d) => {
          const data = d.data();
          if (data.driverComment || data.driverRating) {
            revList.push({ id: d.id, ...data });
          }
        });
        setReviews(revList);
      } catch (err) {
        console.warn("Erreur chargement profil livreur:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverDetails();
  }, [visible, driverId]);

  const ratingCount = driverData?.driverRatingCount || 0;
  const ratingValue = driverData?.driverRating;
  const hasRating = ratingCount > 0 && ratingValue !== undefined && ratingValue !== null;

  const phone = driverPhone || driverData?.phoneNumber || driverData?.phone;
  const displayName =
    driverData?.displayName ||
    `${driverData?.firstName || initialDriverName || "Livreur"} ${driverData?.lastName || ""}`.trim();

  const vehicleLabel =
    driverData?.vehicleType === "voiture"
      ? "Voiture 🚗"
      : driverData?.vehicleType === "velo"
      ? "Vélo 🚲"
      : "Scooter / Moto 🛵";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: "88%",
            paddingTop: 16,
            paddingBottom: 28,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ShieldCheckIcon size={22} color="#059669" />
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
                Profil du Coursier Wajbati
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <XMarkIcon size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            {/* Carte Profil */}
            <View
              style={{
                alignItems: "center",
                backgroundColor: "#ECFDF5",
                borderRadius: 20,
                padding: 18,
                borderWidth: 1.5,
                borderColor: "#A7F3D0",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  backgroundColor: "#D1FAE5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  borderWidth: 2.5,
                  borderColor: "#059669",
                  overflow: "hidden",
                }}
              >
                {driverData?.photoURL ? (
                  <Image
                    source={{ uri: driverData.photoURL }}
                    style={{ width: "100%", height: "100%" }}
                  />
                ) : (
                  <Text style={{ fontSize: 32 }}>🛵</Text>
                )}
              </View>

              <Text style={{ fontSize: 20, fontWeight: "900", color: "#111827" }}>
                {displayName}
              </Text>
              <Text style={{ fontSize: 12, color: "#059669", fontWeight: "700", marginTop: 2 }}>
                ✓ Coursier Partenaire Vérifié & Certifié
              </Text>

              {/* Note ou Nouveau */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: hasRating ? "#FEF3C7" : "#F0FDF4",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 14,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: hasRating ? "#FDE68A" : "#BBF7D0",
                }}
              >
                {hasRating ? (
                  <>
                    <StarIcon size={16} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 13, fontWeight: "900", color: "#B45309" }}>
                      {Number(ratingValue).toFixed(1)} / 5 ({ratingCount} avis)
                    </Text>
                  </>
                ) : (
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#065F46" }}>
                    ✨ Nouveau (Pas encore noté)
                  </Text>
                )}
              </View>

              {/* Détails Véhicule et Contact */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  width: "100%",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#A7F3D0",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "#4B5563" }}>Véhicule</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827", marginTop: 2 }}>
                    {vehicleLabel}
                  </Text>
                </View>

                {driverData?.wilaya && (
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 11, color: "#4B5563" }}>Zone</Text>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827", marginTop: 2 }}>
                      {driverData.wilaya}
                    </Text>
                  </View>
                )}
              </View>

              {/* Boutons d'appel & WhatsApp */}
              {phone && (
                <View style={{ flexDirection: "row", gap: 10, marginTop: 14, width: "100%" }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${phone}`)}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "white",
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: "#D1D5DB",
                      gap: 6,
                    }}
                  >
                    <PhoneIcon size={16} color="#111827" />
                    <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827" }}>Appeler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openWhatsApp({ phone, message: "Bonjour ! Je suis le client de votre commande." })}
                    style={{
                      flex: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#25D366",
                      paddingVertical: 10,
                      borderRadius: 12,
                      gap: 6,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "900" }}>WhatsApp 💬</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Avis et commentaires des clients */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#111827", marginBottom: 10 }}>
                💬 Avis des clients ({reviews.length})
              </Text>

              {loading ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator color="#059669" size="small" />
                </View>
              ) : reviews.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#F9FAFB",
                    padding: 20,
                    borderRadius: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                  }}
                >
                  <Text style={{ fontSize: 28, marginBottom: 6 }}>⭐</Text>
                  <Text style={{ fontWeight: "700", color: "#374151", fontSize: 14 }}>
                    Pas encore de commentaires
                  </Text>
                  <Text style={{ color: "#9CA3AF", fontSize: 12, textAlign: "center", marginTop: 4 }}>
                    Ce coursier n'a pas encore reçu de commentaire écrit.
                  </Text>
                </View>
              ) : (
                reviews.map((rev) => (
                  <View
                    key={rev.id}
                    style={{
                      backgroundColor: "white",
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      marginBottom: 10,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }}>
                        {rev.userName || "Client"}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#D97706" }}>
                        {"⭐".repeat(Math.min(5, Math.max(1, rev.driverRating || 5)))}
                      </Text>
                    </View>

                    {rev.driverComment ? (
                      <Text style={{ fontSize: 12, color: "#4B5563", marginTop: 4, fontStyle: "italic" }}>
                        "{rev.driverComment}"
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                        (Note attribuée sans commentaire)
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DriverProfileModal;
