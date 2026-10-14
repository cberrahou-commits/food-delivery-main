import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Platform,
  ActivityIndicator,
  StatusBar as RNStatusBar,
} from "react-native";
import { UserAuth } from "../contexts/AuthContext";
import { db, auth } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import WhatsAppOtpModal from "../components/WhatsAppOtpModal";

const UserDetails = () => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [address, setAddress] = useState("");

  const { user } = UserAuth();

  useEffect(() => {
    if (user?.displayName) {
      const parts = user.displayName.trim().split(" ");
      if (parts.length > 0 && !firstName) setFirstName(parts[0]);
      if (parts.length > 1 && !lastName) setLastName(parts.slice(1).join(" "));
    }
  }, [user]);

  useEffect(() => {
    getLocationPermission();
  }, []);

  const getLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        getLocation();
      } else {
        // Fallback default coordinates (Alger)
        const defaultCoords = { latitude: 36.7538, longitude: 3.0588 };
        setLocation(defaultCoords);
      }
    } catch (err) {
      console.warn("Location permission error:", err);
      setLocation({ latitude: 36.7538, longitude: 3.0588 });
    }
  };

  const getLocation = async () => {
    try {
      let { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userCoords = { latitude: coords.latitude, longitude: coords.longitude };
      setLocation(userCoords);
      if (!address) {
        reverseGeocodeAndSetAddress(userCoords);
      }
    } catch (err) {
      console.warn("Could not get current position:", err);
      setLocation({ latitude: 36.7538, longitude: 3.0588 });
    }
  };

  // Extraire les informations d'adresse à partir des coordonnées GPS (géocodage inverse)
  const reverseGeocodeAndSetAddress = async (coords) => {
    if (!coords?.latitude || !coords?.longitude) return;
    setIsGeocoding(true);
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results && results.length > 0) {
        const item = results[0];
        const street = item.street || item.name || "";
        const district = item.district || item.subregion || "";
        const city = item.city || item.region || "";

        const parts = [street, district, city].filter(
          (val, idx, arr) => Boolean(val) && arr.indexOf(val) === idx
        );

        const resolved = parts.join(", ");
        if (resolved) {
          setAddress(resolved);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode error:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Clic sur la carte ou déplacement du repère
  const handleMapPress = (coords) => {
    if (!coords?.latitude || !coords?.longitude) return;
    setLocation(coords);
    reverseGeocodeAndSetAddress(coords);
  };

  // Clic sur le bouton rond cible GPS pour déterminer sa position
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission", "Accès à la géolocalisation refusé.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (pos?.coords) {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setLocation(coords);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              ...coords,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            500
          );
        }
        await reverseGeocodeAndSetAddress(coords);
      }
    } catch (err) {
      console.warn("Current location error:", err);
      Alert.alert("Erreur", "Impossible de récupérer votre position GPS.");
    } finally {
      setIsLocating(false);
    }
  };

  const handlePhoneNumberChange = (text) => {
    const formattedPhoneNumber = text.replace(/\D/g, "");
    const limitedPhoneNumber = formattedPhoneNumber.slice(0, 15);
    setPhoneNumber(limitedPhoneNumber);
  };

  const onSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim() || !address.trim()) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (phoneNumber.length < 8) {
      Alert.alert("Numéro invalide", "Le numéro de téléphone doit contenir au moins 8 chiffres.");
      return;
    }

    // Exiger la vérification par WhatsApp pour garantir la fiabilité
    if (!isPhoneVerified) {
      Alert.alert(
        "Vérification WhatsApp requise 🔐",
        "Afin de garantir la fiabilité de vos livraisons et recevoir vos suivis de commande, veuillez valider votre numéro via WhatsApp.",
        [
          {
            text: "Recevoir mon code WhatsApp",
            onPress: () => setOtpModalVisible(true),
          },
          { text: "Annuler", style: "cancel" },
        ]
      );
      return;
    }

    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      Alert.alert("Erreur", "Session utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }

    setSaving(true);
    try {
      const activeLocation = location || { latitude: 48.8566, longitude: 2.3522 };
      console.log("Saving user details for UID:", currentUid);
      await setDoc(
        doc(db, "user", currentUid),
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim(),
          isPhoneVerified: true,
          phoneVerifiedAt: new Date(),
          address: address.trim(),
          latitude: activeLocation.latitude,
          longitude: activeLocation.longitude,
        },
        { merge: true }
      );

      navigation.navigate("Home", {
        userId: currentUid,
      });
    } catch (err) {
      console.error("Error saving user details:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer les détails : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop:
          Platform.OS === "android"
            ? Math.max(insets.top, RNStatusBar.currentHeight || 0, 24)
            : 0,
      }}
    >
      <StatusBar style="auto" />
      <KeyboardAvoidingView
        className="flex-1 px-4 pt-4 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text className="text-[28px] font-bold mb-4 text-black tracking-wide">
          Finaliser mon profil :
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            <Text className="text-sm font-bold mb-1.5 text-gray-800">
              Prénom *
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700"
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Ex: Amine"
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-bold mb-1.5 text-gray-800">
              Nom *
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700"
              value={lastName}
              onChangeText={setLastName}
              placeholder="Ex: Benali"
            />
          </View>

          {/* Numéro de téléphone WhatsApp avec badge de vérification */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-bold text-gray-800">
                Numéro WhatsApp 📱 *
              </Text>
              {isPhoneVerified ? (
                <View className="bg-emerald-100 px-2.5 py-0.5 rounded-full flex-row items-center">
                  <Text className="text-xs font-bold text-emerald-800">
                    ✅ Vérifié
                  </Text>
                </View>
              ) : (
                <View className="bg-amber-100 px-2.5 py-0.5 rounded-full flex-row items-center">
                  <Text className="text-[10px] font-bold text-amber-800">
                    Non vérifié
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 h-12">
              <Text className="text-base font-bold text-gray-600 mr-2">🇩🇿 +213</Text>
              <TextInput
                className="flex-1 text-base text-gray-700"
                value={phoneNumber}
                onChangeText={(txt) => {
                  handlePhoneNumberChange(txt);
                  setIsPhoneVerified(false);
                }}
                placeholder="05 / 06 / 07 XX XX XX"
                keyboardType="phone-pad"
              />
            </View>

            {!isPhoneVerified && phoneNumber.length >= 8 ? (
              <TouchableOpacity
                onPress={() => setOtpModalVisible(true)}
                activeOpacity={0.8}
                className="mt-2 bg-emerald-50 border border-emerald-300 py-2.5 px-3 rounded-xl flex-row items-center justify-center space-x-1.5 shadow-xs"
              >
                <Text className="text-xs font-bold text-emerald-800">
                  💬 Envoyer le code de vérification WhatsApp
                </Text>
              </TouchableOpacity>
            ) : null}
            <Text className="text-[10px] text-gray-400 mt-1">
              Un code de sécurité à 6 chiffres vous sera envoyé par WhatsApp pour valider ce numéro.
            </Text>
          </View>

          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1.5">
              <Text className="text-sm font-bold text-gray-800">
                Adresse de livraison *
              </Text>
              {isGeocoding ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#059669" style={{ marginRight: 4 }} />
                  <Text className="text-[10px] text-emerald-700 font-bold">Détection adresse...</Text>
                </View>
              ) : null}
            </View>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700"
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Rue Didouche Mourad, Alger"
            />
          </View>

          <View className="mt-1 mb-6 rounded-2xl overflow-hidden border border-gray-300 relative h-48">
            {location ? (
              <>
                <MapView
                  ref={mapRef}
                  className="w-full h-full"
                  provider="google"
                  showsUserLocation
                  onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
                  initialRegion={{
                    latitude: location.latitude || 36.7538,
                    longitude: location.longitude || 3.0588,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                  region={
                    location.latitude && location.longitude
                      ? {
                          latitude: location.latitude,
                          longitude: location.longitude,
                          latitudeDelta: 0.008,
                          longitudeDelta: 0.008,
                        }
                      : undefined
                  }
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude || 36.7538,
                      longitude: location.longitude || 3.0588,
                    }}
                    draggable
                    onDragEnd={(e) => handleMapPress(e.nativeEvent.coordinate)}
                    title="Votre adresse"
                    description={address || "Position sélectionnée"}
                  />
                </MapView>

                {/* Bouton rond cible GPS (Ma Position) */}
                <TouchableOpacity
                  onPress={handleUseCurrentLocation}
                  activeOpacity={0.8}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    backgroundColor: "white",
                    borderRadius: 20,
                    width: 38,
                    height: 38,
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 4,
                    borderWidth: 1,
                    borderColor: "#D1D5DB",
                  }}
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: 2,
                        borderColor: "#374151",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#374151",
                        }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleUseCurrentLocation}
                className="w-full h-full items-center justify-center bg-gray-100"
              >
                <Text className="text-green-700 font-bold text-sm">
                  📍 Activer la géolocalisation
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            className="mx-auto w-10/12 my-3 items-center p-3.5 rounded-2xl duration-150 bg-green-500 active:bg-green-600 shadow-md"
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-center text-white font-extrabold text-lg">
                Terminer l'inscription 🚀
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Modal de vérification OTP WhatsApp */}
        <WhatsAppOtpModal
          visible={otpModalVisible}
          phoneNumber={phoneNumber}
          userId={user?.uid || auth.currentUser?.uid}
          onClose={() => setOtpModalVisible(false)}
          onVerified={(clean) => {
            setIsPhoneVerified(true);
            setPhoneNumber(clean);
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UserDetails;
