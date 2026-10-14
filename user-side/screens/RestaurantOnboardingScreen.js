import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserAuth } from "../contexts/AuthContext";
import {
  ArrowLeftIcon,
  CameraIcon,
  PhotoIcon,
  CheckCircleIcon,
  MapPinIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
} from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import WilayaSelectorModal from "../components/WilayaSelectorModal";
import { ALGERIA_WILAYAS } from "../constants/wilayas";

const RESTAURANT_CATEGORIES = [
  "Burgers & Fast Food",
  "Pizzeria & Feu de Bois",
  "Plats Traditionnels Algériens",
  "Grillades & Chawarma",
  "Sandwiches & Tacos",
  "Poissons & Fruits de Mer",
  "Pâtisserie & Salon de Thé",
  "Syrien & Libanais",
];

const RestaurantOnboardingScreen = () => {
  const navigation = useNavigation();
  const { user, dbUser } = UserAuth();

  const [name, setName] = useState("");
  const [category, setCategory] = useState(RESTAURANT_CATEGORIES[0]);
  const [description, setDescription] = useState(
    "Restaurant proposant des menus gourmands préparés avec des produits frais sélectionnés."
  );
  const [phone, setPhone] = useState(dbUser?.phoneNumber || "");
  const [selectedWilaya, setSelectedWilaya] = useState(
    ALGERIA_WILAYAS.find((w) => w.code === "16") || ALGERIA_WILAYAS[0]
  );
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);

  // Coordonnées GPS sur la carte
  const [markerCoords, setMarkerCoords] = useState({
    latitude: selectedWilaya?.lat || 36.7538,
    longitude: selectedWilaya?.lng || 3.0588,
  });
  const [address, setAddress] = useState("Rue Didouche Mourad, Alger Centre");
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Documents & Photos obligatoires
  const [rcDocumentUri, setRcDocumentUri] = useState(null);
  const [exteriorPhotoUri, setExteriorPhotoUri] = useState(null);
  const [interiorPhotoUri, setInteriorPhotoUri] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Si la wilaya change, recentrer la carte
    if (selectedWilaya) {
      setMarkerCoords({
        latitude: selectedWilaya.lat || 36.7538,
        longitude: selectedWilaya.lng || 3.0588,
      });
    }
  }, [selectedWilaya]);

  // Fonction de reverse geocoding quand l'utilisateur clique sur la carte
  const handleMapPress = async (coords) => {
    setMarkerCoords(coords);
    setIsGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        const item = results[0];
        const parts = [
          item.name || item.street,
          item.district || item.subregion,
          item.city || selectedWilaya?.name,
        ].filter(Boolean);
        const resolvedAddress = parts.join(", ");
        if (resolvedAddress) {
          setAddress(resolvedAddress);
        } else {
          setAddress(
            `Position GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${selectedWilaya?.name || "Alger"})`
          );
        }
      } else {
        setAddress(
          `Position GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${selectedWilaya?.name || "Alger"})`
        );
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
      setAddress(
        `Position GPS: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)} (${selectedWilaya?.name || "Alger"})`
      );
    } finally {
      setIsGeocoding(false);
    }
  };

  const takePhoto = async (target) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission requise", "L'accès à la caméra est nécessaire pour scanner vos documents.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.4,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (target === "rc") setRcDocumentUri(dataUri);
        if (target === "exterior") setExteriorPhotoUri(dataUri);
        if (target === "interior") setInteriorPhotoUri(dataUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'accéder à l'appareil photo.");
    }
  };

  const pickImage = async (target) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission requise", "L'accès à la galerie photos est nécessaire.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.4,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        if (target === "rc") setRcDocumentUri(dataUri);
        if (target === "exterior") setExteriorPhotoUri(dataUri);
        if (target === "interior") setInteriorPhotoUri(dataUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'ouvrir la galerie.");
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner le nom de votre établissement.");
      return;
    }

    if (!phone.trim()) {
      Alert.alert("Champs requis", "Veuillez indiquer un numéro de téléphone de contact.");
      return;
    }

    if (!address.trim()) {
      Alert.alert("Adresse requise", "Veuillez cliquer sur la carte pour renseigner votre adresse.");
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.uid || auth.currentUser?.uid || `owner_${Date.now()}`;
      const restaurantId = `resto_${Date.now()}`;

      const defaultExterior =
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";
      const defaultInterior =
        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

      await setDoc(doc(db, "restaurants", restaurantId), {
        id: restaurantId,
        ownerId: uid,
        name: name.trim(),
        title: name.trim(),
        genre: category,
        description: description.trim(),
        address: address.trim(),
        wilaya: selectedWilaya?.name || "Alger",
        wilayaCode: selectedWilaya?.code || "16",
        phone: phone.trim(),
        phoneNumber: phone.trim(),
        lat: markerCoords.latitude,
        lng: markerCoords.longitude,
        image: exteriorPhotoUri || defaultExterior,
        exteriorImage: exteriorPhotoUri || defaultExterior,
        interiorImage: interiorPhotoUri || defaultInterior,
        rcDocument: rcDocumentUri || "",
        type: "restaurant",
        isCook: false,
        isHomemade: false,
        isHomeCook: false,
        isVerified: false,
        status: "PENDING_VERIFICATION",
        rating: 5.0,
        minDeliveryTime: 20,
        maxDeliveryTime: 40,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        "Dossier Transmis ! 🏢📋",
        "Votre dossier d'inscription restaurant a bien été enregistré avec votre position GPS et vos justificatifs. Notre administration procédera à la vérification de votre Registre de Commerce sous 24h avant l'apparition sur l'application.",
        [
          {
            text: "Retour à l'accueil",
            onPress: () => navigation.navigate("Home"),
          },
        ]
      );
    } catch (err) {
      console.error("Erreur enregistrement restaurant:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer le restaurant : " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <WilayaSelectorModal
        visible={wilayaModalVisible}
        onClose={() => setWilayaModalVisible(false)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        title="Sélectionnez la Wilaya de votre restaurant"
      />

      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            backgroundColor: "#F3F4F6",
            borderRadius: 20,
            marginRight: 12,
          }}
        >
          <ArrowLeftIcon size={20} color="#111827" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>
            Inscrire un Restaurant 🏢
          </Text>
          <Text style={{ fontSize: 11, color: "#6B7280" }}>
            Rejoignez Wajbati et recevez des commandes vérifiées
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Card */}
        <View
          style={{
            backgroundColor: "#ECFDF5",
            borderRadius: 14,
            padding: 14,
            borderWidth: 1,
            borderColor: "#A7F3D0",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: "800", color: "#065F46" }}>
            🛡️ Processus de Validation Partenaire
          </Text>
          <Text style={{ fontSize: 11, color: "#047857", marginTop: 4, lineHeight: 16 }}>
            Pour garantir une qualité optimale à nos clients, chaque restaurant partenaire doit fournir un Registre de Commerce et des photos de ses locaux. Votre établissement sera validé par l'administrateur sous 24h.
          </Text>
        </View>

        {/* Section 1: Informations Générales */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827", marginBottom: 12 }}>
            1. Informations de l'Établissement
          </Text>

          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
            Nom officiel du Restaurant *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Le Gourmet d'Alger"
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: "#111827",
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
            Catégorie culinaire principale
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {RESTAURANT_CATEGORIES.map((cat, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setCategory(cat)}
                  style={{
                    backgroundColor: category === cat ? "#059669" : "#F3F4F6",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: category === cat ? "white" : "#4B5563",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
            Numéro de Téléphone / WhatsApp *
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Ex: 0550 12 34 56"
            keyboardType="phone-pad"
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 14,
              color: "#111827",
              marginBottom: 12,
            }}
          />

          <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151", marginBottom: 4 }}>
            Courte description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Spécialités, horaires, ambiance..."
            multiline
            numberOfLines={2}
            style={{
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: "#D1D5DB",
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 13,
              color: "#111827",
            }}
          />
        </View>

        {/* Section 2: Localisation & Carte Interactive */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827", marginBottom: 4 }}>
            2. Localisation Géographique sur Carte 🗺️
          </Text>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 12 }}>
            Cliquez sur votre position exacte sur la carte : l'adresse s'actualise automatiquement !
          </Text>

          {/* Sélecteur de Wilaya */}
          <TouchableOpacity
            onPress={() => setWilayaModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#F3F4F6",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MapPinIcon size={18} color="#059669" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#111827" }}>
                Wilaya : {selectedWilaya.code} - {selectedWilaya.name}
              </Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#059669" }}>Modifier</Text>
          </TouchableOpacity>

          {/* Carte interactive MapView */}
          <View
            style={{
              borderRadius: 14,
              overflow: "hidden",
              borderWidth: 1.5,
              borderColor: "#D1D5DB",
              height: 220,
              marginBottom: 12,
            }}
          >
            <MapView
              style={{ width: "100%", height: "100%" }}
              initialRegion={{
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              region={{
                latitude: markerCoords.latitude,
                longitude: markerCoords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
            >
              <Marker
                coordinate={markerCoords}
                draggable
                onDragEnd={(e) => handleMapPress(e.nativeEvent.coordinate)}
                title={name || "Mon Restaurant"}
                description={address}
              />
            </MapView>
          </View>

          {/* Champ Adresse Renseigné Automatiquement */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>
                Adresse renseignée automatiquement *
              </Text>
              {isGeocoding && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <ActivityIndicator size="small" color="#059669" />
                  <Text style={{ fontSize: 10, color: "#059669", marginLeft: 4 }}>
                    Géocodage...
                  </Text>
                </View>
              )}
            </View>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Cliquez sur la carte ou saisissez votre adresse"
              style={{
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#059669",
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                color: "#111827",
              }}
            />
          </View>
        </View>

        {/* Section 3: Documents et Photos Obligatoires */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            marginBottom: 20,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827", marginBottom: 4 }}>
            3. Documents & Photos pour la Vérification 📑
          </Text>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 14 }}>
            Requis pour la conformité et l'approbation sur le Web Dashboard
          </Text>

          {/* 3.1 Registre de Commerce (RC) */}
          <View style={{ marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <DocumentTextIcon size={18} color="#B45309" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1F2937" }}>
                  Registre de Commerce (RC) *
                </Text>
              </View>
              {rcDocumentUri && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CheckCircleIcon size={16} color="#059669" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669", marginLeft: 2 }}>
                    Scanné
                  </Text>
                </View>
              )}
            </View>

            {rcDocumentUri ? (
              <Image
                source={{ uri: rcDocumentUri }}
                style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => takePhoto("rc")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CameraIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Scanner</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("rc")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <PhotoIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3.2 Photo de l'Extérieur du Restaurant */}
          <View style={{ marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <BuildingStorefrontIcon size={18} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1F2937" }}>
                  Photo Extérieur (Enseigne / Façade) *
                </Text>
              </View>
              {exteriorPhotoUri && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CheckCircleIcon size={16} color="#059669" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669", marginLeft: 2 }}>
                    Ajoutée
                  </Text>
                </View>
              )}
            </View>

            {exteriorPhotoUri ? (
              <Image
                source={{ uri: exteriorPhotoUri }}
                style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => takePhoto("exterior")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CameraIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Prendre photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("exterior")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <PhotoIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3.3 Photo de l'Intérieur du Restaurant */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <BuildingStorefrontIcon size={18} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#1F2937" }}>
                  Photo Intérieur (Salle / Comptoir / Cuisine) *
                </Text>
              </View>
              {interiorPhotoUri && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <CheckCircleIcon size={16} color="#059669" />
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669", marginLeft: 2 }}>
                    Ajoutée
                  </Text>
                </View>
              )}
            </View>

            {interiorPhotoUri ? (
              <Image
                source={{ uri: interiorPhotoUri }}
                style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }}
                resizeMode="cover"
              />
            ) : null}

            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                onPress={() => takePhoto("interior")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <CameraIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Prendre photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("interior")}
                style={{
                  flex: 1,
                  backgroundColor: "#F3F4F6",
                  paddingVertical: 9,
                  borderRadius: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <PhotoIcon size={16} color="#374151" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#374151" }}>Galerie</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bouton de Soumission */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
          style={{
            backgroundColor: submitting ? "#9CA3AF" : "#059669",
            paddingVertical: 15,
            borderRadius: 14,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ color: "white", fontWeight: "900", fontSize: 15 }}>
              Envoyer mon dossier pour vérification 🚀
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RestaurantOnboardingScreen;

