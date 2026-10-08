import { View, Text, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DishInfo from "./DishInfo";
import { useLanguage } from "../contexts/LanguageContext";

const Order = ({ orderId, status, timestamp, restaurantName, total }) => {
  const [dishes, setDishes] = useState([]);
  const { t, formatPrice, language } = useLanguage();

  let statusText, statusColor;
  const orderTimeStamp = timestamp ? timestamp.toDate() : new Date();
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  const locale = language === "ar" ? "ar-DZ" : language === "en" ? "en-US" : "fr-FR";
  const formattedDate = orderTimeStamp.toLocaleString(locale, options);

  if (status === "PENDING") {
    statusText = t("orderPending");
    statusColor = "text-amber-500";
  } else if (status === "ACCEPTED") {
    statusText = t("orderAccepted");
    statusColor = "text-orange-500";
  } else if (status === "DECLINED") {
    statusText = t("orderDeclined");
    statusColor = "text-red-500";
  } else if (status === "PREPARING") {
    statusText = t("orderPreparing");
    statusColor = "text-yellow-600";
  } else if (status === "READY") {
    statusText = t("orderReady");
    statusColor = "text-green-600";
  } else if (status === "DRIVERACCEPTED") {
    statusText = t("driverAssigned");
    statusColor = "text-green-600";
  } else if (status === "DRIVERPICKEDUP") {
    statusText = t("driverPickedUp");
    statusColor = "text-green-600"; 
  } else if (status === "COMPLETE") {
    statusText = t("orderDelivered");
    statusColor = "text-green-600"; 
  } else {
    statusText = status;
    statusColor = "text-gray-600";
  }

  useEffect(() => {
    const getDishId = async () => {
      const dishesRef = collection(db, "orderDishes");
      const q = query(dishesRef, where("orderId", "==", orderId));

      await getDocs(q).then((querySnapshot) => {
        let items = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data() });
        });
        setDishes(items);
      });
    };

    getDishId();
  }, [orderId]);

  return (
    <View className="flex items-center justify-center">
      <Pressable className="px-6 py-6 mt-4 bg-white w-11/12 h-auto rounded-2xl flex-row justify-between items-center border border-gray-100 shadow shadow-gray-300 ">
        <View className=" w-full">
          <Text className={`font-bold text-2xl ${statusColor}`}>
            {statusText}
          </Text>
          <Text className="text-sm pt-1 text-gray-700">{formattedDate}</Text>
          <Text className="text-sm pt-1 text-gray-700 font-medium">
            {t("orderNumber")} #{orderId}
          </Text>
          <View>
            {dishes.map((dish) => {
              return (
                <DishInfo
                  key={dish.dishId}
                  id={dish.dishId}
                  quantity={dish.quantity}
                />
              );
            })}
          </View>

          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
            <Text className="font-semibold text-lg text-gray-700">
              {t("orderTotal")} :
            </Text>
            <Text className="font-bold text-lg text-emerald-800">
              {formatPrice(total)}
            </Text>
          </View>

          <View className="flex-row justify-between mt-1">
            <Text className="font-semibold text-base text-gray-600">
              {t("fromKitchen")}
            </Text>
            <Text className="font-semibold text-base text-gray-800">
              {restaurantName}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default Order;
