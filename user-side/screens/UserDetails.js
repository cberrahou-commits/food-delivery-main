import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
  Button,
  Platform,
  ActivityIndicator,
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
  const [location, setLocation] = useState(null);
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
        // Fallback default coordinates
        setLocation({ latitude: 48.8566, longitude: 2.3522 });
      }
    } catch (err) {
      console.warn("Location permission error:", err);
      setLocation({ latitude: 48.8566, longitude: 2.3522 });
    }
  };

  const getLocation = async () => {
    try {
      let { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(coords);
    } catch (err) {
      console.warn("Could not get current position:", err);
      setLocation({ latitude: 48.8566, longitude: 2.3522 });
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
    <SafeAreaView className="bg-white flex-1">
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
            <Text className="text-sm font-bold mb-1.5 text-gray-800">
              Adresse de livraison *
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700"
              value={address}
              onChangeText={setAddress}
              placeholder="Rue, quartier, résidence..."
            />
          </View>

          <View className="mt-2 mb-6 rounded-2xl overflow-hidden border border-gray-300">
            {location ? (
              <MapView
                className="w-full h-40"
                provider="google"
                showsUserLocation
                initialRegion={{
                  latitude: location.latitude || 0,
                  longitude: location.longitude || 0,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: location.latitude || 0,
                    longitude: location.longitude || 0,
                  }}
                />
              </MapView>
            ) : (
              <Button
                title="Get Current Location"
                onPress={getLocationPermission}
              />
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
