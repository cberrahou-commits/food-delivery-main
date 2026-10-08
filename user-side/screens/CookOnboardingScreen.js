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
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { UserAuth } from "../contexts/AuthContext";
import { ArrowLeftIcon, CameraIcon, PhotoIcon, CheckBadgeIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";

const SPECIALITIES = [
  "Cuisine Orientale & Maghreb",
  "Cuisine Traditionnelle Française",
  "Cuisine Italienne & Méditerranéenne",
  "Cuisine Asiatique & Wok",
  "Cuisine Africaine & Créole",
  "Pâtisseries & Desserts Maison",
  "Cuisine Végétarienne & Healthy",
];

const CookOnboardingScreen = () => {
  const navigation = useNavigation();
  const { user, dbUser } = UserAuth();

  const [kitchenName, setKitchenName] = useState(
    dbUser ? `La Cuisine de ${dbUser.firstName || "Chef"}` : "Ma Cuisine Maison"
  );
  const [speciality, setSpeciality] = useState(SPECIALITIES[0]);
  const [description, setDescription] = useState(
    "Plats familiaux et authentiques préparés chaque jour avec des ingrédients frais du marché."
  );
  const [address, setAddress] = useState(
    dbUser?.address || "15 Rue de Rivoli, 75001 Paris"
  );
  const [idCardUri, setIdCardUri] = useState(null);
  const [kitchenPhotoUri, setKitchenPhotoUri] = useState(
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&auto=format&fit=crop&q=80"
  );
  const [submitting, setSubmitting] = useState(false);

  const takePhoto = async (target) => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission", "Accès à la caméra requis.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        if (target === "idCard") setIdCardUri(res.assets[0].uri);
        if (target === "kitchen") setKitchenPhotoUri(res.assets[0].uri);
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
        Alert.alert("Permission", "Accès à la galerie requis.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        if (target === "idCard") setIdCardUri(res.assets[0].uri);
        if (target === "kitchen") setKitchenPhotoUri(res.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'ouvrir la galerie.");
    }
  };

  const handleRegisterKitchen = async () => {
    if (!kitchenName.trim()) {
      Alert.alert("Erreur", "Veuillez renseigner le nom de votre cuisine.");
      return;
    }

    setSubmitting(true);
    try {
      const uid = user?.uid || auth.currentUser?.uid;
      if (!uid) {
        Alert.alert("Erreur", "Utilisateur non identifié.");
        setSubmitting(false);
        return;
      }

      const kitchenId = `kitchen_${uid}`;

      // 1. Créer la cuisine dans restaurants
      await setDoc(doc(db, "restaurants", kitchenId), {
        id: kitchenId,
        ownerId: uid,
        name: kitchenName,
        title: kitchenName,
        genre: speciality,
        description: description,
        address: address,
        image: kitchenPhotoUri,
        rating: 5.0,
        lat: dbUser?.latitude || 48.8566,
        lng: dbUser?.longitude || 2.3522,
        minDeliveryTime: 25,
        maxDeliveryTime: 40,
        isHomeCook: true,
        createdAt: serverTimestamp(),
      });

      // 2. Mettre à jour le profil utilisateur
      await updateDoc(doc(db, "user", uid), {
        isCook: true,
        kitchenId: kitchenId,
        cookStatus: "APPROVED",
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Félicitations ! 🎉",
        "Votre cuisine maison est maintenant active. Vous pouvez ajouter vos premiers plats !",
        [
          {
            text: "Accéder à ma cuisine",
            onPress: () => navigation.replace("CookDashboard", { kitchenId }),
          },
        ]
      );
    } catch (err) {
      console.error("Erreur enregistrement cuisine:", err);
      Alert.alert("Erreur", "Impossible de créer la cuisine. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 bg-white rounded-full shadow-sm mr-3"
          >
            <ArrowLeftIcon size={24} color="#16a34a" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">
              Devenir Cuisinier Maison 🍳
            </Text>
            <Text className="text-sm text-gray-500">
              Proposez vos recettes faites maison aux gourmets de votre quartier
            </Text>
          </View>
        </View>

        {/* Formulaire */}
        <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-4 shadow-sm">
          <Text className="text-base font-bold text-gray-800 mb-1">
            1. Nom de votre cuisine / atelier
          </Text>
          <TextInput
            value={kitchenName}
            onChangeText={setKitchenName}
            placeholder="Ex: La Cuisine de Samia, Délices d'Orient..."
            className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50 mb-4"
          />

          <Text className="text-base font-bold text-gray-800 mb-2">
            2. Spécialité culinaire
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SPECIALITIES.map((spec) => (
              <TouchableOpacity
                key={spec}
                onPress={() => setSpeciality(spec)}
                className={`px-3 py-2 rounded-xl border ${
                  speciality === spec
                    ? "bg-green-100 border-green-600"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <Text
                  className={`text-xs ${
                    speciality === spec
                      ? "text-green-800 font-bold"
                      : "text-gray-700 font-medium"
                  }`}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-gray-800 mb-1">
            3. Description & Histoire de vos plats
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            placeholder="Racontez votre passion, vos ingrédients faits maison..."
            className="border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 mb-4"
          />

          <Text className="text-base font-bold text-gray-800 mb-1">
            4. Adresse de préparation (lieu de retrait livreur)
          </Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Adresse complète"
            className="border border-gray-300 rounded-xl p-3 text-sm bg-gray-50"
          />
        </View>

        {/* Photo de profil de la cuisine */}
        <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-4 shadow-sm">
          <Text className="text-base font-bold text-gray-800 mb-1">
            5. Photo de votre cuisine / chef
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Une belle photo donne envie aux clients de commander chez vous.
          </Text>

          {kitchenPhotoUri && (
            <Image
              source={{ uri: kitchenPhotoUri }}
              className="w-full h-44 rounded-xl mb-3"
              resizeMode="cover"
            />
          )}

          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => takePhoto("kitchen")}
              className="flex-1 flex-row items-center justify-center p-3 rounded-xl bg-gray-100 gap-2"
            >
              <CameraIcon size={20} color="#16a34a" />
              <Text className="font-semibold text-gray-800 text-sm">Appareil photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage("kitchen")}
              className="flex-1 flex-row items-center justify-center p-3 rounded-xl bg-gray-100 gap-2"
            >
              <PhotoIcon size={20} color="#16a34a" />
              <Text className="font-semibold text-gray-800 text-sm">Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pièce d'identité (Dossier KYC cuisinier) */}
        <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-6 shadow-sm">
          <Text className="text-base font-bold text-gray-800 mb-1">
            6. Pièce d'identité (Vérification légale)
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Scan ou photo de votre CNI/Passeport pour certifier votre profil cuisinier.
          </Text>

          {idCardUri ? (
            <View className="items-center mb-2">
              <Image source={{ uri: idCardUri }} className="w-full h-36 rounded-xl" />
              <TouchableOpacity onPress={() => setIdCardUri(null)} className="mt-2">
                <Text className="text-red-500 font-bold text-xs">Changer la photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => takePhoto("idCard")}
                className="flex-1 flex-row items-center justify-center p-3 rounded-xl bg-gray-100 gap-2"
              >
                <CameraIcon size={20} color="#16a34a" />
                <Text className="font-semibold text-gray-800 text-sm">Photographier CNI</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage("idCard")}
                className="flex-1 flex-row items-center justify-center p-3 rounded-xl bg-gray-100 gap-2"
              >
                <PhotoIcon size={20} color="#16a34a" />
                <Text className="font-semibold text-gray-800 text-sm">Choisir fichier</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bouton de validation */}
        <TouchableOpacity
          onPress={handleRegisterKitchen}
          disabled={submitting}
          className="bg-green-600 p-4 rounded-2xl items-center shadow-md mb-8"
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Ouvrir ma cuisine maison 🚀
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CookOnboardingScreen;

