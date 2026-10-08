import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRightIcon, ArrowLeftIcon, GlobeAltIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { UserAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelectorModal from "../components/LanguageSelectorModal";

const OptionsScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [langModalVisible, setLangModalVisible] = useState(false);
  const { dbUser, signOutUser } = UserAuth();
  const { t, language } = useLanguage();

  useEffect(() => {
    setName(dbUser?.firstName || "");
  }, [dbUser]);

  const currentLangLabel =
    language === "ar" ? "🇩🇿 العربية" : language === "en" ? "🇬🇧 English" : "🇫🇷 Français";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />

      <View className="flex-1 bg-gray-100">
        <View className="p-5 bg-white shadow-xs">
          <Pressable
            onPress={() => navigation.goBack()}
            className="absolute top-4 left-4 bg-white p-2 rounded-full"
          >
            <ArrowLeftIcon size={26} color="#22c55e" />
          </Pressable>

          <View>
            <Text className="text-xl font-bold text-center">
              {name ? `${name}` : t("appName")}
            </Text>
          </View>
        </View>

        <View className="flex items-center justify-center">
          {/* Choix de la langue */}
          <Pressable
            onPress={() => setLangModalVisible(true)}
            className="px-4 mt-6 bg-white w-11/12 h-16 rounded-2xl flex-row justify-between items-center shadow-sm border border-emerald-100"
          >
            <View className="flex-row items-center space-x-3">
              <GlobeAltIcon size={24} color="#059669" />
              <View>
                <Text className="font-bold text-base text-gray-800">
                  {t("appLanguage")}
                </Text>
                <Text className="text-xs text-emerald-700 font-semibold">
                  {currentLangLabel} (🇩🇿 DA)
                </Text>
              </View>
            </View>
            <ArrowRightIcon size={20} color="#059669" />
          </Pressable>

          <Pressable
            onPress={() => {
              navigation.navigate("Profile");
            }}
            className="px-4 mt-4 bg-white w-11/12 h-16 rounded-2xl flex-row justify-between items-center shadow-sm"
          >
            <Text className="font-bold text-lg text-gray-800">{t("myProfile")}</Text>
            <ArrowRightIcon size={20} color="#00CCBB" />
          </Pressable>

          <Pressable
            onPress={() => {
              navigation.navigate("Order Details");
            }}
            className="px-4 mt-4 bg-white w-11/12 h-16 rounded-2xl flex-row justify-between items-center shadow-sm"
          >
            <Text className="font-bold text-lg text-gray-800">{t("myOrders")}</Text>
            <ArrowRightIcon size={20} color="#00CCBB" />
          </Pressable>

          {/* Espace Cuisinier Fait Maison */}
          <Pressable
            onPress={() => {
              if (dbUser?.isCook) {
                navigation.navigate("CookDashboard", { kitchenId: dbUser?.kitchenId });
              } else {
                navigation.navigate("CookOnboarding");
              }
            }}
            className="px-4 mt-4 bg-green-50 border-2 border-green-500 w-11/12 h-20 rounded-2xl flex-row justify-between items-center shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🍳</Text>
              <View>
                <Text className="font-extrabold text-base text-green-900">
                  {dbUser?.isCook ? t("cookSpace") : t("becomeHomeCook")}
                </Text>
                <Text className="text-xs text-green-700">
                  {dbUser?.isCook ? t("cookSubtitle") : t("cookOnboardSubtitle")}
                </Text>
              </View>
            </View>
            <ArrowRightIcon size={20} color="#16a34a" />
          </Pressable>
        </View>

        <TouchableOpacity
          onPress={signOutUser}
          className="mx-auto w-10/12 my-8 items-center p-3 rounded-2xl active:bg-red-500 duration-150 bg-red-50 border border-red-200"
        >
          <Text className="text-center text-red-600 font-extrabold text-lg">
            {t("signOut")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OptionsScreen;
