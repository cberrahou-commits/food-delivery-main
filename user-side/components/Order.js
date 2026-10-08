import { View, Text, Pressable } from "react-native";
import { ArchiveBoxIcon } from "react-native-heroicons/solid";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import DishInfo from "./DishInfo";

const Order = ({ orderId, status, timestamp, restaurantName, total }) => {
  const [dishes, setDishes] = useState([]);
  const [dishIds, setDishIds] = useState([]);

  let statusText, statusColor;
  const orderTimeStamp = timestamp.toDate();
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };
  const formattedDate = orderTimeStamp.toLocaleString("fr-FR", options);

  if (status === "PENDING") {
    statusText = "Commande en attente ⏳";
    statusColor = "text-amber-500";
  } else if (status === "ACCEPTED") {
    statusText = "Acceptée par la cuisine 🎉";
    statusColor = "text-orange-500";
  } else if (status === "DECLINED") {
    statusText = "Commande refusée ❌";
    statusColor = "text-red-500";
  } else if (status === "PREPARING") {
    statusText = "En préparation en cuisine 🍲";
    statusColor = "text-yellow-600";
  } else if (status === "READY") {
    statusText = "Prête pour le coursier 🛵";
    statusColor = "text-green-600";
  } else if (status === "DRIVERACCEPTED") {
    statusText = "Livreur en route vers la cuisine 🚴🏻‍♀️";
    statusColor = "text-green-600";
  } else if (status === "DRIVERPICKEDUP") {
    statusText = "En cours de livraison 🏍️";
    statusColor = "text-green-600"; 
  } else if (status === "COMPLETE") {
    statusText = "Commande livrée ✅";
    statusColor = "text-green-600"; 
  }

  useEffect(() => {
    const getDishId = async () => {
      const dishesRef = collection(db, "orderDishes");
      const q = query(dishesRef, where("orderId", "==", orderId));

      await getDocs(q).then((querySnapshot) => {
        let dishIds = [];
        let items = [];
        querySnapshot.forEach((doc) => {
          items.push({ ...doc.data() });
        });
        setDishes(items);
      });
    };

    getDishId();
  }, []);

  return (
    <View className="flex items-center justify-center">
      <Pressable className="px-6 py-6 mt-4 bg-white w-11/12 h-auto rounded-2xl flex-row justify-between items-center border border-gray-100 shadow shadow-gray-300 ">
        <View className=" w-full">
          <Text className={`font-bold text-2xl ${statusColor}`}>
            {statusText}
          </Text>
          <Text className="text-sm pt-1 text-gray-700">{formattedDate}</Text>
          <Text className="text-sm pt-1 text-gray-700">
            Commande N° #{orderId}
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

          <View className="flex-row justify-between mt-2">
            <Text className="font-semibold text-lg pt-1 text-gray-700">
              Total :
            </Text>
            <Text className="font-semibold text-lg pt-1 text-gray-700">
              {Number(total).toFixed(2)} €
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="font-semibold text-lg pt-1 text-gray-700">
              Cuisine :
            </Text>
            <Text className="font-semibold text-lg pt-1 text-gray-700">
              {restaurantName}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
};

export default Order;
