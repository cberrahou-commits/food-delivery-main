import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../../contexts/LanguageContext";
import { calculateDistanceKm, calculateEtaMinutes } from "../../constants/wilayas";

const OrderItem = ({ order, driverLocation }) => {
  const navigation = useNavigation();
  const { t, formatPrice, language } = useLanguage();

  const rLat = Number(order.restaurantLatitude);
  const rLng = Number(order.restaurantLongitude);
  const dLat = driverLocation?.latitude;
  const dLng = driverLocation?.longitude;

  let distanceKm = null;
  let etaMinutes = null;

  if (rLat && rLng && dLat && dLng) {
    distanceKm = calculateDistanceKm(dLat, dLng, rLat, rLng);
    if (distanceKm !== Infinity) {
      etaMinutes = calculateEtaMinutes(distanceKm);
    }
  }

  return (
    <Pressable
      style={{
        flexDirection: "row",
        margin: 10,
        borderColor: "#3FC060",
        borderWidth: 2,
        borderRadius: 14,
        backgroundColor: "white",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
        overflow: "hidden",
      }}
      onPress={() =>
        navigation.navigate("OrdersDeliveryScreen", { order: order })
      }
    >
      <Image
        source={{ uri: order.restaurantImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300" }}
        style={{
          width: "26%",
          height: "100%",
          minHeight: 120,
        }}
        resizeMode="cover"
      />
      <View style={{ flex: 1, marginLeft: 10, paddingVertical: 8, paddingRight: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#111827" }} numberOfLines={1}>
          {order.restaurantName}
        </Text>
        <Text style={{ color: "#6b7280", fontWeight: "500", fontSize: 12 }} numberOfLines={1}>
          {order.restaurantAddress}
        </Text>

        {/* Trajet estimé pour atteindre le restaurateur */}
        {etaMinutes !== null ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fef3c7",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              marginTop: 6,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: "#fde68a",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "800", color: "#92400e" }}>
              {language === "ar"
                ? `⏱️ ~${etaMinutes} دقيقة للوصول للمطعم (${distanceKm.toFixed(1)} كم)`
                : `⏱️ ~${etaMinutes} min pour atteindre le restaurant (${distanceKm.toFixed(1)} km)`}
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#f0fdf4",
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
              marginTop: 6,
              alignSelf: "flex-start",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#166534" }}>
              📍 {order.restaurantWilaya ? `${order.restaurantWilaya}` : "Zone locale"}
            </Text>
          </View>
        )}

        <Text style={{ marginTop: 6, fontWeight: "700", color: "#374151", fontSize: 12 }}>
          {t("deliveryDetails")} : {order.userFirstName} {order.userLastName}
        </Text>
        <Text style={{ color: "#9ca3af", fontWeight: "500", fontSize: 11 }} numberOfLines={1}>
          {order.userAddress}
        </Text>

        {order.total ? (
          <Text style={{ color: "#16a34a", fontWeight: "900", fontSize: 14, marginTop: 4 }}>
            {formatPrice(order.total)}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          paddingHorizontal: 12,
          backgroundColor: "#3FC060",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Entypo
          name="chevron-right"
          size={24}
          color="white"
        />
      </View>
    </Pressable>
  );
};

export default OrderItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
});
