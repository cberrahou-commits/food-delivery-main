import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  ChevronRightIcon,
  UserCircleIcon,
  MapPinIcon,
  BellAlertIcon,
  LanguageIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "react-native-heroicons/outline";
import { UserAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import McDoBottomNav from "../components/McDoBottomNav";
import LanguageSelectorModal from "../components/LanguageSelectorModal";

const PlusScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, dbUser, signOutUser } = UserAuth();
  const { t, language } = useLanguage();
  const [langModalVisible, setLangModalVisible] = useState(false);

  const isGuest = !user;

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              if (signOutUser) await signOutUser();
            } catch (e) {
              console.warn("Logout error:", e);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop:
          Platform.OS === "android"
            ? Math.max(insets.top, StatusBar.currentHeight || 0, 24)
            : Math.max(insets.top, 20),
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo centré en haut façon McDo */}
        <View style={{ alignItems: "center", paddingTop: 16, paddingBottom: 10 }}>
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 14,
              backgroundColor: "#076241",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
              overflow: "hidden",
            }}
          >
            <Image
              source={require("../assets/logo.png")}
              style={{ width: 46, height: 46, borderRadius: 12 }}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Section En-tête Utilisateur / Mode Invité */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 26,
              fontWeight: "900",
              color: "#111827",
              letterSpacing: 0.2,
            }}
          >
            {isGuest
              ? "Mode Invité"
              : `${dbUser?.firstName || "Utilisateur"} ${dbUser?.lastName || ""}`}
          </Text>

          <Text
            style={{
              fontSize: 13,
              color: "#4B5563",
              marginTop: 4,
              lineHeight: 18,
            }}
          >
            {isGuest
              ? "Connectez-vous ou inscrivez-vous pour profiter pleinement de l'application."
              : dbUser?.phoneNumber
              ? `📞 ${dbUser.phoneNumber} · Compte vérifié`
              : "Bienvenue sur votre espace Wajbati."}
          </Text>

          {/* Boutons Connexion / Inscription ou Modifier Profil */}
          {isGuest ? (
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Options")}
                style={{
                  flex: 1,
                  backgroundColor: "#FFBC0D", // Jaune signature McDo
                  paddingVertical: 13,
                  borderRadius: 10,
                  alignItems: "center",
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900" }}>
                  Connexion
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Options")}
                style={{
                  flex: 1,
                  backgroundColor: "white",
                  paddingVertical: 13,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: "#D1D5DB",
                  alignItems: "center",
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#111827", fontSize: 14, fontWeight: "900" }}>
                  Inscription
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={{
                marginTop: 14,
                backgroundColor: "#F3F4F6",
                paddingVertical: 11,
                paddingHorizontal: 16,
                borderRadius: 10,
                alignSelf: "flex-start",
              }}
            >
              <Text style={{ color: "#1F2937", fontSize: 13, fontWeight: "800" }}>
                Modifier mes informations
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Espace Cuisinier Partenaire */}
        <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => {
              if (dbUser?.isCook) {
                navigation.navigate("CookDashboard", { kitchenId: dbUser?.kitchenId });
              } else {
                navigation.navigate("CookOnboarding");
              }
            }}
            style={{
              backgroundColor: "#ECFDF5",
              borderWidth: 1.5,
              borderColor: "#A7F3D0",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 26, marginRight: 12 }}>🍳</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#065F46" }}>
                  {dbUser?.isCook ? "Mon Espace Cuisinier" : "Devenir Cuisinier Partenaire"}
                </Text>
                <Text style={{ fontSize: 11, color: "#047857", marginTop: 2 }}>
                  {dbUser?.isCook ? "Gérer mes plats et commandes" : "Cuisinez et vendez vos plats à domicile"}
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={18} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Espace Restaurant Partenaire */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("RestaurantOnboarding")}
            style={{
              backgroundColor: "#F8FAFC",
              borderWidth: 1.5,
              borderColor: "#CBD5E1",
              borderRadius: 14,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={{ fontSize: 26, marginRight: 12 }}>🏢</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "900", color: "#0F172A" }}>
                  Devenir Restaurant Partenaire
                </Text>
                <Text style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  Inscrire mon restaurant avec RC & position GPS
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={18} color="#0284C7" />
          </TouchableOpacity>
        </View>

        {/* Section : Mes paramètres (façon McDo) */}
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "900",
              color: "#1F2937",
              paddingHorizontal: 20,
              marginBottom: 8,
              letterSpacing: 0.3,
            }}
          >
            Mes paramètres
          </Text>

          <View style={{ borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Profile")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <UserCircleIcon size={22} color="#4B5563" style={{ marginRight: 14 }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                Gestion des données personnelles
              </Text>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setLangModalVisible(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <LanguageIcon size={22} color="#4B5563" style={{ marginRight: 14 }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                Langue de l'application
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "bold", color: "#059669", marginRight: 8 }}>
                {language === "ar" ? "العربية" : language === "en" ? "English" : "Français"}
              </Text>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Home")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <MapPinIcon size={22} color="#4B5563" style={{ marginRight: 14 }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                Gestion de la localisation & Wilaya
              </Text>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section : Informations Générales */}
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "900",
              color: "#1F2937",
              paddingHorizontal: 20,
              marginBottom: 8,
              letterSpacing: 0.3,
            }}
          >
            Informations Générales
          </Text>

          <View style={{ borderTopWidth: 1, borderTopColor: "#F3F4F6" }}>
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "À propos de Wajbati",
                  "Wajbati (وجبتي) est la première plateforme de livraison de plats faits maison préparés avec amour par nos cuisiniers partenaires en Algérie."
                );
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 15,
                paddingHorizontal: 20,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
              }}
            >
              <QuestionMarkCircleIcon size={22} color="#4B5563" style={{ marginRight: 14 }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#1F2937" }}>
                Aide & Support Wajbati
              </Text>
              <ChevronRightIcon size={18} color="#9CA3AF" />
            </TouchableOpacity>

            {user && (
              <TouchableOpacity
                onPress={handleLogout}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                }}
              >
                <ArrowRightOnRectangleIcon size={22} color="#DC2626" style={{ marginRight: 14 }} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: "#DC2626" }}>
                  Déconnexion
                </Text>
                <ChevronRightIcon size={18} color="#DC2626" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Barre de navigation 5 onglets McDo */}
      <McDoBottomNav activeTab="plus" />

      {/* Modal choix de langue */}
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default PlusScreen;

