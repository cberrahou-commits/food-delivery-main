import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase";
import { useAuth } from "../../contexts/AuthContext";

const VerificationPendingScreen = ({ onStatusUpdate, onResubmit }) => {
  const { signOutUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleInstantApproval = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "user", uid), {
          courierStatus: "APPROVED",
        });
        if (onStatusUpdate) onStatusUpdate("APPROVED");
      }
    } catch (e) {
      console.error("Instant approval error:", e);
      Alert.alert("Erreur", "Impossible d'approuver le compte en mode démo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 24, justifyContent: "space-between" }}>
      <View style={{ alignItems: "center", marginTop: 40 }}>
        {/* Animated badge */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: "#fef3c7",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
            borderWidth: 4,
            borderColor: "#fde68a",
          }}
        >
          <MaterialIcons name="hourglass-top" size={50} color="#d97706" />
        </View>

        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center", marginBottom: 12 }}>
          Dossier en cours d'examen ⏳
        </Text>

        <Text style={{ fontSize: 15, color: "#4b5563", textAlign: "center", lineHeight: 24, paddingHorizontal: 10 }}>
          Merci d'avoir transmis vos pièces justificatives (Pièce d'identité, permis & RIB).
        </Text>

        <View
          style={{
            backgroundColor: "#f9fafb",
            borderRadius: 16,
            padding: 16,
            marginTop: 24,
            width: "100%",
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
            <Text style={{ fontSize: 14, color: "#374151", marginLeft: 8, fontWeight: "500" }}>
              Documents d'identité reçus
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <MaterialIcons name="check-circle" size={20} color="#16a34a" />
            <Text style={{ fontSize: 14, color: "#374151", marginLeft: 8, fontWeight: "500" }}>
              Type de véhicule enregistré
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MaterialIcons name="pending" size={20} color="#d97706" />
            <Text style={{ fontSize: 14, color: "#b45309", marginLeft: 8, fontWeight: "600" }}>
              Vérification administrative en cours (délai : ~24h)
            </Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 12, marginBottom: 20 }}>
        {/* Mode Démo : Valider immédiatement */}
        <TouchableOpacity
          onPress={handleInstantApproval}
          disabled={loading}
          style={{
            backgroundColor: "#16a34a",
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 15, fontWeight: "bold" }}>
              ⚡ Mode Démo : Activer mon compte immédiatement
            </Text>
          )}
        </TouchableOpacity>

        {/* Modifier mon dossier */}
        {onResubmit && (
          <TouchableOpacity
            onPress={onResubmit}
            style={{
              backgroundColor: "#f3f4f6",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#374151", fontSize: 14, fontWeight: "600" }}>
              Modifier mes documents
            </Text>
          </TouchableOpacity>
        )}

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={signOutUser}
          style={{
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#dc2626", fontSize: 14, fontWeight: "600" }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default VerificationPendingScreen;

