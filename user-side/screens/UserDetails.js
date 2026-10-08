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

const UserDetails = () => {
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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

    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) {
      Alert.alert("Erreur", "Session utilisateur introuvable. Veuillez vous reconnecter.");
      return;
    }

    setSaving(true);
    try {
      const activeLocation = location || { latitude: 48.8566, longitude: 2.3522 };
      console.log("Saving user details for UID:", currentUid);
      await setDoc(doc(db, "user", currentUid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        latitude: activeLocation.latitude,
        longitude: activeLocation.longitude,
      });

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
          More details:
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-4">
            <Text className="text-[21px] font-bold mb-2 text-gray-800">
              First Name
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700  focus:ring focus:ring-green-400 focus:border-green-400"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[21px] font-bold mb-2 text-gray-800">
              Last Name
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700  focus:ring focus:ring-green-400 focus:border-green-400"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[21px] font-bold mb-2 text-gray-800">
              Phone Number
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700  focus:ring focus:ring-green-400 focus:border-green-400"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              keyboardType="phone-pad"
            />
          </View>

          <View className="mb-4">
            <Text className="text-[21px] font-bold mb-2 text-gray-800">
              Street Address
            </Text>
            <TextInput
              className="bg-white border border-gray-200 text-base h-12 px-4 rounded-xl text-gray-700  focus:ring focus:ring-green-400 focus:border-green-400"
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View className="mt-4 mb-6 rounded-2xl overflow-hidden border border-gray-300">
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
            className="mx-auto w-10/12 my-3 items-center p-3 rounded-2xl duration-150 bg-green-400 border-l-4 border-b-4 border-green-600"
          >
            {saving ? (
              <ActivityIndicator color="#1f2937" />
            ) : (
              <Text className="text-center text-gray-800 font-extrabold text-xl">
                Terminer l'inscription
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default UserDetails;
