import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../../firebase/firebase";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";

const VEHICLE_TYPES = [
  { id: "velo", label: "Vélo 🚲", motorized: false },
  { id: "trottinette", label: "Trottinette 🛴", motorized: false },
  { id: "scooter", label: "Scooter 🛵", motorized: true },
  { id: "voiture", label: "Voiture 🚗", motorized: true },
];

const CourierVerificationScreen = ({ navigation, onStatusUpdate }) => {
  const [vehicle, setVehicle] = useState("scooter");
  const [iban, setIban] = useState("");
  const [idCardUri, setIdCardUri] = useState(null);
  const [licenseUri, setLicenseUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedVehicleObj = VEHICLE_TYPES.find((v) => v.id === vehicle);

  // Demander permission et prendre une photo
  const takePhoto = async (type) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à la caméra pour photographier vos documents."
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (type === "idCard") setIdCardUri(dataUri);
        if (type === "license") setLicenseUri(dataUri);
      }
    } catch (e) {
      console.error("Camera error:", e);
      Alert.alert("Erreur", "Impossible d'accéder à l'appareil photo.");
    }
  };

  // Choisir dans la galerie
  const pickImage = async (type) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission requise",
          "Veuillez autoriser l'accès à vos photos."
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.35,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (type === "idCard") setIdCardUri(dataUri);
        if (type === "license") setLicenseUri(dataUri);
      }
    } catch (e) {
      console.error("Picker error:", e);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  const handleSubmit = async (quickApprove = false) => {
    if (!quickApprove && !idCardUri) {
      Alert.alert("Document manquant", "Veuillez photographier votre pièce d'identité.");
      return;
    }
    if (!quickApprove && selectedVehicleObj?.motorized && !licenseUri) {
      Alert.alert(
        "Document manquant",
        "Pour un véhicule motorisé, le permis de conduire est obligatoire."
      );
      return;
    }

    setSubmitting(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Erreur", "Session non trouvée. Veuillez vous reconnecter.");
        setSubmitting(false);
        return;
      }

      const status = quickApprove ? "APPROVED" : "PENDING_VERIFICATION";

      await updateDoc(doc(db, "user", uid), {
        courierStatus: status,
        vehicleType: vehicle,
        iban: iban || "FR76 3000 4000 5000 6000 7000 123",
        idCardUri: idCardUri || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400",
        licenseUri: licenseUri || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400",
        verificationSubmittedAt: serverTimestamp(),
      });

      if (onStatusUpdate) onStatusUpdate(status);
    } catch (err) {
      console.error("Erreur enregistrement dossier:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer le dossier. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#dcfce7",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            <MaterialIcons name="verified-user" size={36} color="#16a34a" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#111827", textAlign: "center" }}>
            Dossier Livreur Partenaire
          </Text>
          <Text style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginTop: 4 }}>
            Comme pour un chauffeur VTC, vos documents garantissent la sécurité et la conformité des livraisons de repas maison.
          </Text>
        </View>

        {/* 1. Type de véhicule */}
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 12 }}>
            1. Mode de transport
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {VEHICLE_TYPES.map((v) => {
              const selected = vehicle === v.id;
              return (
                <TouchableOpacity
                  key={v.id}
                  onPress={() => setVehicle(v.id)}
                  style={{
                    flexBasis: "47%",
                    padding: 12,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selected ? "#16a34a" : "#e5e7eb",
                    backgroundColor: selected ? "#f0fdf4" : "#ffffff",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: selected ? "bold" : "500",
                      color: selected ? "#15803d" : "#374151",
                    }}
                  >
                    {v.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Pièce d'identité */}
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
            2. Pièce d'identité (CNI / Passeport)
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Prenez une photo nette de votre pièce d'identité avec votre téléphone.
          </Text>

          {idCardUri ? (
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <Image
                source={{ uri: idCardUri }}
                style={{ width: "100%", height: 180, borderRadius: 12 }}
                resizeMode="cover"
              />
              <TouchableOpacity
                onPress={() => setIdCardUri(null)}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: "#dc2626", fontWeight: "600" }}>Supprimer et reprendre</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => takePhoto("idCard")}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="camera" size={20} color="#16a34a" />
                <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13 }}>Caméra</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("idCard")}
                style={{
                  flex: 1,
                  backgroundColor: "#f3f4f6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Ionicons name="images" size={20} color="#16a34a" />
                <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13 }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Permis de conduire (si motorisé) */}
        {selectedVehicleObj?.motorized && (
          <View
            style={{
              backgroundColor: "#ffffff",
              padding: 16,
              borderRadius: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
              3. Permis de conduire
            </Text>
            <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
              Requis pour les scooters et voitures.
            </Text>

            {licenseUri ? (
              <View style={{ alignItems: "center", marginBottom: 12 }}>
                <Image
                  source={{ uri: licenseUri }}
                  style={{ width: "100%", height: 180, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setLicenseUri(null)}
                  style={{ marginTop: 8 }}
                >
                  <Text style={{ color: "#dc2626", fontWeight: "600" }}>Supprimer et reprendre</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => takePhoto("license")}
                  style={{
                    flex: 1,
                    backgroundColor: "#f3f4f6",
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="camera" size={20} color="#16a34a" />
                  <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13 }}>Caméra</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => pickImage("license")}
                  style={{
                    flex: 1,
                    backgroundColor: "#f3f4f6",
                    padding: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Ionicons name="images" size={20} color="#16a34a" />
                  <Text style={{ color: "#1f2937", fontWeight: "600", fontSize: 13 }}>Galerie</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 4. IBAN / RIB */}
        <View
          style={{
            backgroundColor: "#ffffff",
            padding: 16,
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 }}>
            {selectedVehicleObj?.motorized ? "4." : "3."} Coordonnées bancaires (RIB / IBAN)
          </Text>
          <Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
            Pour recevoir vos paiements de livraison chaque semaine.
          </Text>
          <TextInput
            placeholder="FR76 1234 5678 9012 3456 7890 123"
            value={iban}
            onChangeText={setIban}
            autoCapitalize="characters"
            style={{
              borderWidth: 1,
              borderColor: "#d1d5db",
              borderRadius: 10,
              padding: 12,
              fontSize: 15,
              backgroundColor: "#f9fafb",
            }}
          />
        </View>

        {/* Bouton de soumission */}
        <TouchableOpacity
          onPress={() => handleSubmit(false)}
          disabled={submitting}
          style={{
            backgroundColor: "#16a34a",
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: "center",
            marginBottom: 12,
            shadowColor: "#16a34a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "bold" }}>
              Envoyer mon dossier de livreur 🚀
            </Text>
          )}
        </TouchableOpacity>

        {/* Bouton Mode Démo / Test immédiat */}
        <TouchableOpacity
          onPress={() => handleSubmit(true)}
          disabled={submitting}
          style={{
            backgroundColor: "#e0f2fe",
            paddingVertical: 14,
            borderRadius: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#38bdf8",
          }}
        >
          <Text style={{ color: "#0369a1", fontSize: 14, fontWeight: "bold" }}>
            ⚡ Mode Démo : Valider immédiatement mon profil
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CourierVerificationScreen;

