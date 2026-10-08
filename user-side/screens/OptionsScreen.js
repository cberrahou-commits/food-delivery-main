import { View, Text, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRightIcon, ArrowLeftIcon } from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { UserAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";

const OptionsScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const { dbUser, signOutUser } = UserAuth();

  console.log("dbuser in options:", dbUser)

  useEffect(() => {
    setName(dbUser?.firstName);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-100">
        <View className="p-5 bg-white shadow-xs ">
          <Pressable
            // onPress={navigation.navigate("Home")}
            className="absolute top-4 left-4 bg-white p-2 rounded-full"
          >
            <ArrowLeftIcon size={30} color="#22c55e" />
          </Pressable>

          <View>
            <Text className="text-xl font-bold text-center">Hey {name}</Text>
          </View>
        </View>

        <View className="flex items-center justify-center">
          <Pressable
            onPress={() => {
              navigation.navigate("Profile");
            }}
            className="px-4 mt-6 bg-white w-11/12 h-16 rounded-2xl flex-row justify-between items-center shadow-sm"
          >
            <Text className=" font-bold text-lg">My Profile</Text>
            <ArrowRightIcon size={20} color="#00CCBB" />
          </Pressable>

          <Pressable
            onPress={() => {
              navigation.navigate("Order Details");
            }}
            className="px-4 mt-6 bg-white w-11/12 h-16 rounded-2xl flex-row justify-between items-center shadow-sm "
          >
            <Text className=" font-bold text-lg">My Orders</Text>
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
            className="px-4 mt-6 bg-green-50 border-2 border-green-500 w-11/12 h-20 rounded-2xl flex-row justify-between items-center shadow-sm"
          >
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">🍳</Text>
              <View>
                <Text className="font-extrabold text-base text-green-900">
                  {dbUser?.isCook ? "Mon Espace Cuisinier" : "Devenir Cuisinier Maison"}
                </Text>
                <Text className="text-xs text-green-700">
                  {dbUser?.isCook ? "Gérer mes plats maison & commandes" : "Proposez vos plats faits maison aux voisins"}
                </Text>
              </View>
            </View>
            <ArrowRightIcon size={20} color="#16a34a" />
          </Pressable>
        </View>

        <TouchableOpacity
          onPress={signOutUser}
          className="mx-auto w-10/12 my-8 items-center p-2 rounded-2xl  hover:bg-green-200 active:bg-green-400 duration-150 bg-green-300 border-l-4 border-b-4 border-green-600"
        >
          <Text className="text-center text-gray-700 font-extrabold text-xl">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default OptionsScreen;
