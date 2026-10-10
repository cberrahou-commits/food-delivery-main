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
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { UserAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import {
  ArrowLeftIcon,
  CameraIcon,
  PhotoIcon,
  BellAlertIcon,
  CheckBadgeIcon,
} from "react-native-heroicons/solid";
import { selectUser } from "../features/userSlice";
import { useSelector } from "react-redux";
import {
  registerForPushNotificationsAsync,
  triggerLocalNotification,
} from "../services/notificationService";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dbUser = useSelector(selectUser);
  const { user } = UserAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPushToken, setHasPushToken] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  const [locationPermission, setLocationPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [userLocation, setUserLocation] = useState({
    latitude: null,
    longitude: null,
  });

  // 1. Charger les données du profil depuis Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!user?.uid) return;
        const userDocRef = doc(db, "user", user.uid);
        const snap = await getDoc(userDocRef);

        if (snap.exists()) {
          const data = snap.data();
          setFirstName(data.firstName || (data.name ? data.name.split(" ")[0] : ""));
          setLastName(data.lastName || (data.name ? data.name.split(" ").slice(1).join(" ") : ""));
          setPhoneNumber(data.phoneNumber || data.phone || "");
          setAddress(data.address || "");
          setProfileImage(data.profileImage || data.photoURL || null);
          setHasPushToken(Boolean(data.pushToken || data.fcmToken));

          if (data.latitude && data.longitude) {
            setUserLocation({
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
            });
          }
        } else if (dbUser) {
          setFirstName(dbUser.firstName || "");
          setLastName(dbUser.lastName || "");
          setPhoneNumber(dbUser.phoneNumber || "");
          setAddress(dbUser.address || "");
          setProfileImage(dbUser.profileImage || null);
        }
      } catch (err) {
        console.warn("Erreur chargement profil:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    getLocationPermission();
  }, [user?.uid]);

  const getLocationPermission = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === "granted") {
        let { coords } = await Location.getCurrentPositionAsync({});
        setLocation(coords);
      }
    } catch (e) {
      console.warn("Erreur géolocalisation:", e);
    }
  };

  // 2. Gestion de la photo de profil (Appareil photo)
  const takeProfilePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès à l'appareil photo est nécessaire.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.35,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfileImage(dataUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de prendre la photo.");
    }
  };

  // 3. Gestion de la photo de profil (Galerie)
  const pickProfilePhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission requise", "L'accès à la galerie photo est requis.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.35,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const dataUri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setProfileImage(dataUri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    }
  };

  const handlePhoneNumberChange = (text) => {
    const formatted = text.replace(/[^\d+]/g, "");
    setPhoneNumber(formatted);
    if (formatted.length > 0 && formatted.length < 8) {
      setPhoneNumberError("Numéro de téléphone trop court.");
    } else {
      setPhoneNumberError("");
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setUserLocation({
      latitude,
      longitude,
    });
  };

  // 4. Test et Réenregistrement des notifications
  const handleTestNotifications = async () => {
    setTestingNotification(true);
    try {
      const token = await registerForPushNotificationsAsync(user?.uid);
      await triggerLocalNotification(
        "Notifications Actives ! 🔔",
        "Votre téléphone est correctement configuré pour recevoir les alertes.",
        { type: "TEST_NOTIFICATION" }
      );

      if (token) {
        setHasPushToken(true);
        Alert.alert(
          "Notifications Configurées ! 🎉",
          "Votre token de notification est bien enregistré.\n\n📱 Note OnePlus (ColorOS) :\nPour recevoir les notifications même quand l'application est fermée, assurez-vous d'activer 'Lancement automatique' dans Paramètres > Applications > Gestion des applications > Food Delivery > Utilisation de la batterie."
        );
      } else {
        Alert.alert(
          "Autorisation requise",
          "Veuillez autoriser les notifications dans les paramètres de votre téléphone (Paramètres > Applications > Food Delivery > Notifications)."
        );
      }
    } catch (err) {
      console.warn("Erreur test notification:", err);
      Alert.alert("Erreur", "Impossible d'activer les notifications : " + err.message);
    } finally {
      setTestingNotification(false);
    }
  };

  // 5. Sauvegarde du profil
  const onSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Champs requis", "Veuillez renseigner votre prénom et votre nom.");
      return;
    }

    setSaving(true);
    try {
      const dataToUpdate = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        updatedAt: new Date(),
      };

      if (profileImage) {
        dataToUpdate.profileImage = profileImage;
      }

      if (userLocation.latitude && userLocation.longitude) {
        dataToUpdate.latitude = userLocation.latitude;
        dataToUpdate.longitude = userLocation.longitude;
      } else if (location?.latitude && location?.longitude) {
        dataToUpdate.latitude = location.latitude;
        dataToUpdate.longitude = location.longitude;
      }

      // Mise à jour avec fusion pour ne JAMAIS écraser le rôle ou le token
      await setDoc(doc(db, "user", user.uid), dataToUpdate, { merge: true });

      Alert.alert("Succès ! 🎉", "Vos informations de profil ont été enregistrées.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error("Erreur enregistrement profil:", err);
      Alert.alert("Erreur", "Impossible de sauvegarder votre profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="bg-white flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-3 text-gray-500 font-semibold">Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-gray-50 flex-1">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="p-4 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 bg-gray-100 rounded-full"
        >
          <ArrowLeftIcon size={22} color="#16a34a" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">
          Mon Profil & Paramètres
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {/* Section Photo de Profil */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 items-center mb-5 shadow-xs">
            <View className="relative mb-3">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-24 h-24 rounded-full border-2 border-green-500"
                />
              ) : (
                <View className="w-24 h-24 rounded-full bg-green-100 border-2 border-green-500 items-center justify-center">
                  <Text className="text-3xl font-extrabold text-green-700">
                    {(firstName[0] || user?.email?.[0] || "U").toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-sm font-bold text-gray-800 mb-2">
              Photo de profil
            </Text>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={takeProfilePhoto}
                className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300"
              >
                <CameraIcon size={16} color="#4b5563" />
                <Text className="text-xs font-semibold text-gray-700 ml-1.5">
                  Prendre
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickProfilePhoto}
                className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-300"
              >
                <PhotoIcon size={16} color="#4b5563" />
                <Text className="text-xs font-semibold text-gray-700 ml-1.5">
                  Galerie
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Notifications & Diagnostic OnePlus */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-5 shadow-xs">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <BellAlertIcon size={22} color={hasPushToken ? "#16a34a" : "#d97706"} />
                <Text className="font-bold text-gray-900 text-sm">
                  Notifications Push
                </Text>
              </View>
              <View
                className={`px-2.5 py-0.5 rounded-full ${
                  hasPushToken ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    hasPushToken ? "text-green-800" : "text-amber-800"
                  }`}
                >
                  {hasPushToken ? "Actives ✓" : "À vérifier ⚠️"}
                </Text>
              </View>
            </View>

            <Text className="text-xs text-gray-500 mb-3 leading-4">
              Recevez les alertes de commandes, préparation et livraison en temps réel.
            </Text>

            <TouchableOpacity
              onPress={handleTestNotifications}
              disabled={testingNotification}
              className="bg-green-50 border border-green-500 py-2.5 px-4 rounded-xl items-center flex-row justify-center gap-2"
            >
              {testingNotification ? (
                <ActivityIndicator size="small" color="#16a34a" />
              ) : (
                <>
                  <BellAlertIcon size={18} color="#16a34a" />
                  <Text className="text-green-800 font-bold text-xs">
                    Tester & Mettre à jour les notifications
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* Note pour OnePlus / ColorOS */}
            <View className="mt-3 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <Text className="text-[11px] text-amber-900 leading-4 font-medium">
                💡 <Text className="font-bold">OnePlus / ColorOS :</Text> Pour recevoir les alertes quand l'application est fermée, autorisez <Text className="font-bold">"Lancement automatique"</Text> dans Paramètres &gt; Applications &gt; Food Delivery &gt; Batterie.
              </Text>
            </View>
          </View>

          {/* Formulaire Informations Personnelles */}
          <View className="bg-white p-5 rounded-2xl border border-gray-200 mb-5 shadow-xs">
            <Text className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
              Informations Personnelles
            </Text>

            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-600 mb-1">
                Prénom *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-sm h-11 px-3.5 rounded-xl text-gray-800"
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Votre prénom"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-600 mb-1">
                Nom *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-sm h-11 px-3.5 rounded-xl text-gray-800"
                value={lastName}
                onChangeText={setLastName}
                placeholder="Votre nom"
              />
            </View>

            <View className="mb-4">
              <Text className="text-xs font-bold text-gray-600 mb-1">
                Numéro de téléphone
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-sm h-11 px-3.5 rounded-xl text-gray-800"
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="+33 6 12 34 56 78"
                keyboardType="phone-pad"
              />
              {phoneNumberError ? (
                <Text className="text-xs text-red-500 mt-1">{phoneNumberError}</Text>
              ) : null}
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-gray-600 mb-1">
                Adresse de livraison / Cuisine
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-sm h-11 px-3.5 rounded-xl text-gray-800"
                value={address}
                onChangeText={setAddress}
                placeholder="Ex: 12 Rue de la Paix, Paris"
              />
            </View>
          </View>

          {/* Section Emplacement Carte */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-5 shadow-xs">
            <Text className="text-sm font-bold text-gray-900 mb-2">
              Position Géographique (Carte)
            </Text>
            <Text className="text-xs text-gray-500 mb-3">
              Déplacez le repère pour ajuster votre point exact de livraison ou de cuisine.
            </Text>

            <View className="rounded-xl overflow-hidden border border-gray-300 h-44">
              {location || userLocation.latitude ? (
                <MapView
                  className="w-full h-full"
                  provider="google"
                  showsUserLocation
                  initialRegion={{
                    latitude: userLocation.latitude || location?.latitude || 48.8566,
                    longitude: userLocation.longitude || location?.longitude || 2.3522,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude || location?.latitude || 48.8566,
                      longitude: userLocation.longitude || location?.longitude || 2.3522,
                    }}
                    draggable
                    onDragEnd={handleMapPress}
                  />
                </MapView>
              ) : (
                <TouchableOpacity
                  onPress={getLocationPermission}
                  className="w-full h-full items-center justify-center bg-gray-100"
                >
                  <Text className="text-green-700 font-bold text-sm">
                    📍 Activer la géolocalisation
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bouton Enregistrer */}
          <TouchableOpacity
            onPress={onSave}
            disabled={saving}
            className="w-full bg-green-600 py-3.5 rounded-xl items-center shadow-md mb-8 active:bg-green-700"
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Enregistrer les modifications
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
