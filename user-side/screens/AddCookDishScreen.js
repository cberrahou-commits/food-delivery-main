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
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowLeftIcon, CameraIcon, PhotoIcon, SparklesIcon } from "react-native-heroicons/solid";
import { useNavigation, useRoute } from "@react-navigation/native";

const AddCookDishScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { kitchenId } = route.params || {};

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [prepTime, setPrepTime] = useState("25");
  const [portions, setPortions] = useState("4");
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Prise de photo avec le téléphone
  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission", "L'accès à la caméra est nécessaire pour photographier votre plat.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible d'ouvrir l'appareil photo.");
    }
  };

  // Sélection depuis la galerie du téléphone
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission", "L'accès à vos photos est requis.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sélectionner la photo.");
    }
  };

  const handleAddDish = async () => {
    if (!name.trim()) {
      Alert.alert("Champ manquant", "Veuillez renseigner le nom de votre plat maison.");
      return;
    }
    const parsedPrice = parseFloat(price.replace(",", "."));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Prix invalide", "Veuillez indiquer un prix valide en euros (ex: 12.50).");
      return;
    }

    setLoading(true);
    try {
      // Image par défaut si aucune photo prise
      const finalImage =
        imageUri ||
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80";

      await addDoc(collection(db, "dishes"), {
        restaurantId: kitchenId,
        name: name.trim(),
        description: description.trim() || "Plat artisanal fait maison avec amour et ingrédients frais.",
        price: parsedPrice,
        image: finalImage,
        prepTimeMinutes: parseInt(prepTime) || 25,
        portionsAvailable: parseInt(portions) || 4,
        isHomemade: true,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Plat publié ! 🍲", "Votre plat fait maison est en ligne et prêt à être commandé !", [
        {
          text: "Super !",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error("Erreur ajout plat:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer le plat. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* En-tête */}
        <View className="flex-row items-center mb-5">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 bg-white rounded-full shadow-sm mr-3"
          >
            <ArrowLeftIcon size={24} color="#16a34a" />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-bold text-gray-900">
              Nouveau Plat Fait Maison 🍳
            </Text>
            <Text className="text-xs text-gray-500">
              Photographiez et décrivez votre plat pour vos clients
            </Text>
          </View>
        </View>

        {/* Section Photo du plat avec téléphone */}
        <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-5 shadow-sm">
          <Text className="text-base font-bold text-gray-800 mb-1">
            Photo de votre plat maison 📸
          </Text>
          <Text className="text-xs text-gray-500 mb-3">
            Prenez votre plat en photo directement à la sortie de la cuisine !
          </Text>

          {imageUri ? (
            <View className="items-center mb-3">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-52 rounded-xl"
                resizeMode="cover"
              />
              <TouchableOpacity onPress={() => setImageUri(null)} className="mt-2">
                <Text className="text-red-500 font-semibold text-sm">
                  Supprimer et reprendre une photo
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 bg-green-50 border-2 border-dashed border-green-500 p-4 rounded-xl items-center justify-center gap-2"
              >
                <CameraIcon size={28} color="#16a34a" />
                <Text className="font-bold text-green-700 text-sm">
                  Prendre une photo
                </Text>
                <Text className="text-xs text-gray-500">avec le smartphone</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 bg-gray-50 border-2 border-dashed border-gray-300 p-4 rounded-xl items-center justify-center gap-2"
              >
                <PhotoIcon size={28} color="#4b5563" />
                <Text className="font-bold text-gray-700 text-sm">
                  Galerie photo
                </Text>
                <Text className="text-xs text-gray-500">choisir une image</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Formulaire détails du plat */}
        <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-6 shadow-sm">
          {/* Nom */}
          <Text className="text-sm font-bold text-gray-800 mb-1">
            Nom du plat *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Couscous Royal Maison, Lasagnes Italiennes..."
            className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50 mb-4"
          />

          {/* Description */}
          <Text className="text-sm font-bold text-gray-800 mb-1">
            Description & Recette maison *
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Détaillez vos ingrédients frais, épices, savoir-faire artisanal..."
            className="border border-gray-300 rounded-xl p-3 text-sm bg-gray-50 mb-4"
          />

          {/* Ligne Prix & Portions */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800 mb-1">
                Prix par part (€) *
              </Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="Ex: 14.50"
                className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50 font-bold text-green-700"
              />
            </View>

            <View className="flex-1">
              <Text className="text-sm font-bold text-gray-800 mb-1">
                Portions prêtes
              </Text>
              <TextInput
                value={portions}
                onChangeText={setPortions}
                keyboardType="numeric"
                placeholder="Ex: 4"
                className="border border-gray-300 rounded-xl p-3 text-base bg-gray-50 text-gray-800 font-semibold"
              />
            </View>
          </View>

          {/* Temps de préparation */}
          <Text className="text-sm font-bold text-gray-800 mb-1">
            Temps de préparation estimé (minutes)
          </Text>
          <TextInput
            value={prepTime}
            onChangeText={setPrepTime}
            keyboardType="numeric"
            placeholder="Ex: 25"
            className="border border-gray-300 rounded-xl p-3 text-sm bg-gray-50"
          />
        </View>

        {/* Bouton Publier le plat */}
        <TouchableOpacity
          onPress={handleAddDish}
          disabled={loading}
          className="bg-green-600 p-4 rounded-2xl items-center shadow-md mb-8"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-bold">
              Publier mon plat fait maison 🍲
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddCookDishScreen;

