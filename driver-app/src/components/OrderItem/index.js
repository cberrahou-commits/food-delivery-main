import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLanguage } from "../../contexts/LanguageContext";

const OrderItem = ({ order }) => {
  const navigation = useNavigation();
  const { t, formatPrice } = useLanguage();
  return (
    <Pressable
      style={{
        flexDirection: "row",
        margin: 10,
        borderColor: "#3FC060",
        borderWidth: 2,
        borderRadius: 12,
      }}
      onPress={() =>
        navigation.navigate("OrdersDeliveryScreen", { order: order })
      }
    >
      <Image
        source={{ uri: order.restaurantImage }}
        style={{
          width: "25%",
          height: "100%",
          borderBottomLeftRadius: 10,
          borderTopLeftRadius: 10,
        }}
      />
      <View style={{ flex: 1, marginLeft: 10, paddingVertical: 5 }}>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>
          {order.restaurantName}
        </Text>
        <Text style={{ color: "grey", fontWeight: "500" }}>
          {order.restaurantAddress}
        </Text>

        <Text style={{ marginTop: 8, fontWeight: "600", color: "#374151" }}>
          {t("deliveryDetails")}
        </Text>
        <Text style={{ color: "grey", fontWeight: "500" }}>
          {order.userFirstName} {order.userLastName}
        </Text>
        <Text style={{ color: "grey", fontWeight: "500" }}>
          {order.userAddress}
        </Text>

        {order.total ? (
          <Text style={{ color: "#16a34a", fontWeight: "bold", fontSize: 15, marginTop: 4 }}>
            {formatPrice(order.total)}
          </Text>
        ) : null}
      </View>

      <View
        style={{
          padding: 5,
          backgroundColor: "#3FC060",
          borderBottomRightRadius: 10,
          borderTopRightRadius: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Entypo
          name="check"
          size={30}
          color="white"
          style={{ marginLeft: "auto" }}
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
