import { View, Text, Image, Pressable } from "react-native";
import React from "react";
import {
  ArrowRightIcon,
  StarIcon,
  MapPinIcon,
  SparklesIcon,
} from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";

const SearchCard = ({ results }) => {
  const navigation = useNavigation();
  const { t, formatPrice } = useLanguage();
  const id = results.restaurantId ? results.restaurantId : results.id;

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Restaurant", {
          id,
        });
      }}
      className="mx-auto my-4 rounded-2xl w-11/12 h-32 border border-gray-100 space-x-1 flex-row overflow-hidden"
    >
      <View className="h-32 w-32 my-auto">
        <Image
          source={{
            uri:
              results?.image &&
              (results.image.startsWith("http") || results.image.startsWith("data:image"))
                ? results.image
                : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
          }}
          className="h-32 w-32 rounded-xl"
        />
      </View>

      <View className="px-3 pb-4 space-y-1">
        <Text className="font-bold text-lg py-2">{results.name}</Text>
        {results.price ? (
          <>
            <View className="flex-row items-center space-x-1">
              <Text className="text-emerald-700 font-bold text-base">
                {formatPrice(results.price)}
              </Text>
            </View>
            <View className="mt-2 flex-row items-center space-x-1">
              <ArrowRightIcon color="#16a34a" opacity={0.8} size={20} />
              <Text className="mt-4 my-auto text-xs text-gray-500">{t("discoverMenu")}</Text>
            </View>
          </>
        ) : (
          <>
            <View className="flex-row items-center space-x-1">
              <StarIcon color="green" opacity={0.5} size={22} />
              <Text className="text-sm text-gray-500">
                <Text className="text-green-500">{results.rating}</Text>
              </Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <SparklesIcon color="gold" opacity={0.4} size={22} />
              <Text className="text-sm text-gray-500">{results.genre}</Text>
            </View>

            <View className="flex-row items-center space-x-1">
              <MapPinIcon color="gray" opacity={0.4} size={22} />
              <Text className="text-sm text-gray-500">{results.address}</Text>
            </View>
          </>
        )}
      </View>
    </Pressable>
  );
};

export default SearchCard;
