import { View, Text, Image, Pressable } from "react-native";
import {
  MapPinIcon,
  StarIcon,
  SparklesIcon,
} from "react-native-heroicons/solid";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../contexts/LanguageContext";

const RestaurantItem = ({
  id,
  title,
  rating,
  address,
  image,
  description,
  genre,
  lat,
  lng,
  minDeliveryTime,
  maxDeliveryTime,
  isCook,
  isHomemade,
}) => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600";

  const isCookEstablishment = isCook || isHomemade;

  return (
    <Pressable
      onPress={() => {
        navigation.navigate("Restaurant", { id });
      }}
      className="bg-white my-2 flex-row rounded-2xl border border-gray-200 overflow-hidden shadow-xs"
      style={{ elevation: 1 }}
    >
      <View className="h-32 w-32 bg-gray-100">
        <Image
          source={{
            uri:
              image && (image.startsWith("http") || image.startsWith("data:image"))
                ? image
                : DEFAULT_IMAGE,
          }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>

      <View className="px-3 py-2.5 flex-1 justify-center">
        {/* Badge Type: Cuisinier Maison vs Restaurant */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: isCookEstablishment ? "#ECFDF5" : "#EFF6FF",
            borderWidth: 1,
            borderColor: isCookEstablishment ? "#A7F3D0" : "#BFDBFE",
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 6,
            alignSelf: "flex-start",
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "800",
              color: isCookEstablishment ? "#065F46" : "#1D4ED8",
            }}
          >
            {isCookEstablishment ? `🍳 ${t("filterHomeCook")}` : `🍽️ ${t("filterRestaurants")}`}
          </Text>
        </View>

        <Text className="font-bold text-base text-gray-900 leading-tight" numberOfLines={1}>
          {title}
        </Text>

        <View className="flex-row items-center space-x-1 mt-1">
          <StarIcon color="#F59E0B" size={16} />
          <Text className="text-xs text-gray-500 font-semibold">
            <Text className="text-amber-600 font-bold">{rating || 5.0}</Text> ·{" "}
            {minDeliveryTime || 20} - {maxDeliveryTime || 35} {t("mins")}
          </Text>
        </View>

        {genre ? (
          <View className="flex-row items-center space-x-1 mt-0.5">
            <SparklesIcon color="#10B981" size={14} />
            <Text className="text-xs text-gray-500" numberOfLines={1}>{genre}</Text>
          </View>
        ) : null}

        <View className="flex-row items-center space-x-1 mt-0.5">
          <MapPinIcon color="#9CA3AF" size={14} />
          <Text className="text-xs text-gray-400" numberOfLines={1}>
            {address || "Alger, Algérie"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default RestaurantItem;
