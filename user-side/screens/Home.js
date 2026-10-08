import { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { UserAuth } from "../contexts/AuthContext";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { XCircleIcon } from "react-native-heroicons/solid";

import { ChevronDownIcon, UserIcon } from "react-native-heroicons/outline";
import Categories from "../components/Categories";
import featuredData from "../assets/featuredData.json";
import FeaturedRow from "../components/FeaturedRow";
import RestaurantItem from "../components/RestaurantItem";
import { db, auth } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Search from "../components/Search";
import { useDispatch } from "react-redux";
import { setUser } from "../features/userSlice";
import { StatusBar } from "expo-status-bar";
import MapView from "react-native-maps";
import SearchCard from "../components/SearchCard";

const Home = () => {
  const { user, dbUser } = UserAuth();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [restaurant, setRestaurant] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [searchInputHasValue, setSearchInputHasValue] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    getUserData();
    getResData();
    getDishes();
  }, [user]);

  const getUserData = async () => {
    const currentUid = user?.uid || auth.currentUser?.uid;
    if (!currentUid) return;

    try {
      const userRef = doc(db, "user", currentUid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        dispatch(
          setUser({
            uid: currentUid,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            address: data.address,
            latitude: data.latitude,
            longitude: data.longitude,
          })
        );
      }
    } catch (err) {
      console.warn("getUserData error:", err);
    }
  };

  const getResData = async () => {
    const resRef = collection(db, "restaurants");

    await getDocs(resRef).then((querySnapshot) => {
      let restaurants = [];
      querySnapshot.forEach((doc) => {
        restaurants.push({ ...doc.data(), id: doc.id });
      });
      setRestaurant(restaurants);
    });
  };

  const getDishes = async () => {
    const dishesRef = collection(db, "dishes");

    await getDocs(dishesRef).then((querySnapshot) => {
      let dishes = [];
      querySnapshot.forEach((doc) => {
        dishes.push({ ...doc.data(), id: doc.id });
      });
      setDishes(dishes);
    });
  };
  console.log("Results in Home:", searchResults);
  return (
    <SafeAreaView className="bg-white pt-4">
      {/* Header */}
      <StatusBar style="auto" />
      <View className="flex-row pb-3 items-center mx-4 space-x-2">
        <Image
          source={{
            uri: "https://links.papareact.com/wru",
          }}
          className="h-8 w-8 bg-gray-300 p-4 rounded-full"
        />

        <View className="flex-1">
          <Text className="font-bold  text-gray-400 text-sm">Deliver Now!</Text>
          <TouchableOpacity onPress={() => setModalVisible(!modalVisible)}>
            <Text className="font-bold text-xl">
              Current Location
              <ChevronDownIcon size={20} color="#48bb78" />
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            navigation.navigate("Options");
          }}
        >
          <UserIcon size={35} color="#48bb78" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <Search
        restaurants={restaurant}
        dishes={dishes}
        setSearchInputHasValue={setSearchInputHasValue}
        setSearchResults={setSearchResults}
      />

      {/* Body */}
      <ScrollView
        className="bg-white"
        contentContainerStyle={{
          paddingBottom: 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        {searchInputHasValue ? (
          searchResults.map((result, index) => {
            return <SearchCard key={index} results={result} />;
          })
        ) : (
          <>
            {/* Bannière Mode Cuisinier Fait Maison */}
            <TouchableOpacity
              onPress={() => {
                if (dbUser?.isCook) {
                  navigation.navigate("CookDashboard", { kitchenId: dbUser?.kitchenId });
                } else {
                  navigation.navigate("CookOnboarding");
                }
              }}
              className="mx-4 my-2.5 bg-emerald-600 rounded-2xl p-3.5 flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-row items-center space-x-3 flex-1">
                <Text className="text-2xl">🍳</Text>
                <View className="flex-1">
                  <Text className="text-white font-bold text-sm">
                    {dbUser?.isCook ? "Gérer ma Cuisine Fait Maison" : "Vous cuisinez avec amour ?"}
                  </Text>
                  <Text className="text-emerald-100 text-xs">
                    {dbUser?.isCook ? "Voir mes plats et commandes reçues" : "Proposez vos plats faits maison aux gourmets"}
                  </Text>
                </View>
              </View>
              <View className="bg-white px-3 py-1.5 rounded-xl ml-2">
                <Text className="text-emerald-800 font-extrabold text-xs">
                  {dbUser?.isCook ? "Ma Cuisine" : "Devenir Chef"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Categories */}
            <Categories />

            <Modal
              animationType="slide"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}
            >
              <View className="flex-1 justify-center items-center rounded-t-3xl mt-96 bg-white z-30 border-2 border-gray-200 space-y-4">
                <View className=" w-full flex-row justify-between items-center ">
                  <Text className="ml-4 text-2xl font-bold text-center text-gray-700">
                    Current Location
                  </Text>

                  <TouchableOpacity
                    onPress={() => setModalVisible(!modalVisible)}
                    className="rounded-full mr-4"
                  >
                    <XCircleIcon color="#00CCBB" height={48} width={48} />
                  </TouchableOpacity>
                </View>
                <View className="w-full h-80 rounded-2xl overflow-hidden border border-gray-300">
                  <MapView
                    className="w-full h-full"
                    provider="google"
                    showsUserLocation
                  />
                </View>
              </View>
            </Modal>

            {/* Featured Rows */}
            {featuredData.map((item, index) => {
              return (
                <FeaturedRow
                  key={index}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  featuredCategory="featured"
                />
              );
            })}
            <View className="px-4">
              <Text className="my-4 font-bold text-2xl">
                Explore all restaurants
              </Text>
              {restaurant.map((item, index) => {
                return (
                  <RestaurantItem
                    key={index}
                    id={item.id}
                    title={item.name}
                    rating={item.rating}
                    description={item.description}
                    address={item.address}
                    genre={item.genre}
                    image={item.image}
                    lat={item.lat}
                    lng={item.lng}
                    minDeliveryTime={item.minDeliveryTime}
                    maxDeliveryTime={item.maxDeliveryTime}
                  />
                );
              })}
            </View>

            {/* <Text className="mt-4 text-center font-light text-xs">
          Made with ❤ by Rushad
        </Text> */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;
