import React, { useState, useEffect, useRef } from "react";
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
import WhatsAppOtpModal from "../components/WhatsAppOtpModal";

const ProfileScreen = () => {
  const navigation = useNavigation();
  const dbUser = useSelector(selectUser);
  const { user } = UserAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasPushToken, setHasPushToken] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);

  const mapRef = useRef(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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
          setIsPhoneVerified(Boolean(data.isPhoneVerified));
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

  // Extraire les informations de l'adresse à partir des coordonnées GPS (géocodage inverse)
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
  const handleMapPress = (event) => {
    const coords = event.nativeEvent.coordinate;
    setUserLocation(coords);
    reverseGeocodeAndSetAddress(coords);
  };

  // Clic sur le bouton rond cible GPS pour déterminer sa position et extraire l'adresse
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
        setUserLocation(coords);
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
        isPhoneVerified: isPhoneVerified,
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
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-gray-600">
                  Numéro WhatsApp 📱
                </Text>
                {isPhoneVerified ? (
                  <View className="bg-emerald-100 px-2 py-0.5 rounded-full flex-row items-center">
                    <Text className="text-[10px] font-bold text-emerald-800">
                      ✅ Vérifié
                    </Text>
                  </View>
                ) : (
                  <View className="bg-amber-100 px-2 py-0.5 rounded-full flex-row items-center">
                    <Text className="text-[10px] font-bold text-amber-800">
                      Non vérifié
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center bg-gray-50 border border-gray-300 rounded-xl px-3.5 h-11">
                <Text className="text-sm font-bold text-gray-600 mr-2">🇩🇿 +213</Text>
                <TextInput
                  className="flex-1 text-sm text-gray-800"
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
                  className="mt-2 bg-emerald-50 border border-emerald-300 py-2 px-3 rounded-xl flex-row items-center justify-center space-x-1"
                >
                  <Text className="text-xs font-bold text-emerald-800">
                    💬 Vérifier ce numéro sur WhatsApp
                  </Text>
                </TouchableOpacity>
              ) : null}

              {phoneNumberError ? (
                <Text className="text-xs text-red-500 mt-1">{phoneNumberError}</Text>
              ) : null}
            </View>

            <View className="mb-2">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xs font-bold text-gray-600">
                  Adresse de livraison / Cuisine
                </Text>
                {isGeocoding ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#059669" style={{ marginRight: 4 }} />
                    <Text className="text-[10px] text-emerald-700 font-bold">Détection adresse...</Text>
                  </View>
                ) : null}
              </View>
              <TextInput
                className="bg-gray-50 border border-gray-300 text-sm h-11 px-3.5 rounded-xl text-gray-800"
                value={address}
                onChangeText={setAddress}
                placeholder="Ex: 12 Rue Didouche Mourad, Alger"
              />
            </View>
          </View>

          {/* Section Emplacement Carte */}
          <View className="bg-white p-4 rounded-2xl border border-gray-200 mb-5 shadow-xs">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-sm font-bold text-gray-900">
                Position Géographique (Carte)
              </Text>
              <Text className="text-[11px] text-emerald-600 font-bold">
                Point GPS exact
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mb-3">
              Touchez la carte ou déplacez le repère pour ajuster votre point exact. L'adresse se remplit automatiquement.
            </Text>

            <View className="rounded-xl overflow-hidden border border-gray-300 h-48 relative">
              {location || userLocation.latitude ? (
                <>
                  <MapView
                    ref={mapRef}
                    className="w-full h-full"
                    provider="google"
                    showsUserLocation
                    onPress={handleMapPress}
                    initialRegion={{
                      latitude: userLocation.latitude || location?.latitude || 36.7538,
                      longitude: userLocation.longitude || location?.longitude || 3.0588,
                      latitudeDelta: 0.008,
                      longitudeDelta: 0.008,
                    }}
                    region={
                      userLocation.latitude && userLocation.longitude
                        ? {
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                            latitudeDelta: 0.008,
                            longitudeDelta: 0.008,
                          }
                        : undefined
                    }
                  >
                    <Marker
                      coordinate={{
                        latitude: userLocation.latitude || location?.latitude || 36.7538,
                        longitude: userLocation.longitude || location?.longitude || 3.0588,
                      }}
                      draggable
                      onDragEnd={handleMapPress}
                      title="Votre position"
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

        {/* Modal de vérification OTP WhatsApp */}
        <WhatsAppOtpModal
          visible={otpModalVisible}
          phoneNumber={phoneNumber}
          userId={user?.uid}
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

export default ProfileScreen;
