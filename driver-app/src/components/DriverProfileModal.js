import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons, Entypo, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { db } from "../../firebase/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";

const DriverProfileModal = ({
  visible,
  onClose,
  driverUser,
  driverRating,
  driverRatingCount,
  selectedWilaya,
}) => {
  const { t, language } = useLanguage();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (!visible || !driverUser?.uid) return;

    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        const q = query(
          collection(db, "reviews"),
          where("driverId", "==", driverUser.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.driverComment || data.driverRating) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        setReviews(list);
      } catch (err) {
        console.warn("Erreur chargement avis livreur:", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [visible, driverUser?.uid]);

  const hasRating = driverRatingCount > 0 && driverRating !== undefined && driverRating !== null;
  const ratingText = hasRating
    ? `⭐ ${Number(driverRating).toFixed(1)} / 5 (${driverRatingCount} ${t("reviews") || "avis"})`
    : (t("notRatedYet") || "✨ Nouveau (Pas encore noté)");

  const vehicleLabel =
    driverUser?.vehicleType === "voiture"
      ? "Voiture 🚗"
      : driverUser?.vehicleType === "velo"
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
              borderBottomColor: "#f3f4f6",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: "#111827" }}>
              {t("driverProfile") || "Profil du Coursier"}
            </Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
            {/* Carte Livreur */}
            <View
              style={{
                alignItems: "center",
                backgroundColor: "#f0fdf4",
                borderRadius: 20,
                padding: 18,
                borderWidth: 1.5,
                borderColor: "#bbf7d0",
                marginBottom: 20,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: "#dcfce7",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: "#16a34a",
                }}
              >
                {driverUser?.photoURL ? (
                  <Image
                    source={{ uri: driverUser.photoURL }}
                    style={{ width: "100%", height: "100%", borderRadius: 36 }}
                  />
                ) : (
                  <FontAwesome5 name="motorcycle" size={32} color="#16a34a" />
                )}
              </View>

              <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>
                {driverUser?.displayName || `${driverUser?.firstName || "Coursier"} ${driverUser?.lastName || ""}`}
              </Text>
              <Text style={{ fontSize: 12, color: "#16a34a", fontWeight: "700", marginTop: 2 }}>
                ✓ {t("certifiedCourier") || "Coursier Partenaire Vérifié"}
              </Text>

              {/* Badge Note */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: hasRating ? "#fef3c7" : "#ecfdf5",
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 14,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: hasRating ? "#fde68a" : "#a7f3d0",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "800",
                    color: hasRating ? "#92400e" : "#065f46",
                  }}
                >
                  {ratingText}
                </Text>
              </View>

              {/* Informations détails */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                  width: "100%",
                  marginTop: 16,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: "#bbf7d0",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "#6b7280" }}>Véhicule</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827", marginTop: 2 }}>
                    {vehicleLabel}
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "#6b7280" }}>Zone d'activité</Text>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827", marginTop: 2 }}>
                    {selectedWilaya ? `${selectedWilaya.code} - ${selectedWilaya.name}` : "Algérie 🇩🇿"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Section Commentaires & Avis des clients */}
            <View style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }}>
                  💬 {t("customerReviews") || "Avis & Commentaires clients"} ({reviews.length})
                </Text>
              </View>

              {loadingReviews ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <ActivityIndicator color="#16a34a" size="small" />
                </View>
              ) : reviews.length === 0 ? (
                <View
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: 20,
                    borderRadius: 16,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#e5e7eb",
                  }}
                >
                  <Text style={{ fontSize: 26, marginBottom: 6 }}>🌟</Text>
                  <Text style={{ fontWeight: "700", color: "#374151", fontSize: 14 }}>
                    {t("noReviewsYet") || "Aucun commentaire pour l'instant"}
                  </Text>
                  <Text style={{ color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 4 }}>
                    {t("noReviewsDesc") || "Effectuez des livraisons pour recevoir vos premiers avis clients !"}
                  </Text>
                </View>
              ) : (
                reviews.map((rev) => {
                  return (
                    <View
                      key={rev.id}
                      style={{
                        backgroundColor: "white",
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        marginBottom: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
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
                          {rev.userName || "Client Wajbati"}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ fontSize: 12, fontWeight: "800", color: "#b45309" }}>
                            {"⭐".repeat(Math.min(5, Math.max(1, rev.driverRating || 5)))}
                          </Text>
                        </View>
                      </View>

                      {rev.driverComment ? (
                        <Text style={{ fontSize: 12, color: "#4b5563", marginTop: 4, fontStyle: "italic" }}>
                          "{rev.driverComment}"
                        </Text>
                      ) : (
                        <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                          (Note attribuée sans commentaire)
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DriverProfileModal;
