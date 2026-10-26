import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { UserAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelectorModal from "../components/LanguageSelectorModal";
import WilayaSelectorModal from "../components/WilayaSelectorModal";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { XCircleIcon } from "react-native-heroicons/solid";

import { ChevronDownIcon, UserIcon } from "react-native-heroicons/outline";
import { ChevronRightIcon, FireIcon } from "react-native-heroicons/solid";
import BasketIcon from "../components/BasketIcon";
import McDoBottomNav from "../components/McDoBottomNav";
import Categories from "../components/Categories";
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
  const insets = useSafeAreaInsets();
  const { user, dbUser } = UserAuth();
  const { t, language } = useLanguage();
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [restaurant, setRestaurant] = useState([]);
  const [selectedWilaya, setSelectedWilaya] = useState(null);
  const [wilayaModalVisible, setWilayaModalVisible] = useState(false);
  const [langModalVisible, setLangModalVisible] = useState(false);
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
    try {
      const resRef = collection(db, "restaurants");
      const querySnapshot = await getDocs(resRef);
      let restaurants = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // N'afficher que les établissements (Restaurants & Cuisiniers) validés par l'administration
        const isApproved = data.isVerified === true || data.status === "APPROVED";
        if (isApproved) {
          restaurants.push({ ...data, id: doc.id });
        }
      });
      setRestaurant(restaurants);
    } catch (err) {
      console.warn("getResData error:", err);
    }
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

  const [establishmentFilter, setEstablishmentFilter] = useState("all"); // 'all' | 'restaurant' | 'cook'

  const filteredRestaurants = useMemo(() => {
    let list = restaurant;
    if (selectedWilaya) {
      const wCode = selectedWilaya.code;
      const wName = selectedWilaya.name.toLowerCase();
      list = list.filter((r) => {
        if (r.wilayaCode === wCode) return true;
        if (
          r.wilaya &&
          (r.wilaya.includes(wCode) || r.wilaya.toLowerCase().includes(wName))
        )
          return true;
        if (r.address && r.address.toLowerCase().includes(wName)) return true;
        return false;
      });
    }

    if (establishmentFilter === "cook") {
      return list.filter((r) => r.isCook || r.isHomemade);
    } else if (establishmentFilter === "restaurant") {
      return list.filter((r) => !r.isCook && !r.isHomemade);
    }
    return list;
  }, [restaurant, selectedWilaya, establishmentFilter]);

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: "white",
        paddingTop:
          Platform.OS === "android"
            ? Math.max(insets.top, (RNStatusBar.currentHeight || 0) + 16, 52)
            : Math.max(insets.top, 44),
      }}
    >
      <StatusBar style="dark" backgroundColor="white" />
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
      <WilayaSelectorModal
        visible={wilayaModalVisible}
        onClose={() => setWilayaModalVisible(false)}
        selectedWilaya={selectedWilaya}
        onSelectWilaya={setSelectedWilaya}
        title={t("chooseWilaya")}
      />

      {/* Top Header McDo style avec Logo Wajbati centré */}
      <View style={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          {/* Sélecteur Wilaya à gauche */}
          <TouchableOpacity
            onPress={() => setWilayaModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#111827", marginRight: 4 }} numberOfLines={1}>
              {selectedWilaya
                ? `📍 ${selectedWilaya.code} - ${selectedWilaya.name}`
                : `📍 ${t("algerAndAll")}`}
            </Text>
            <ChevronDownIcon size={14} color="#059669" />
          </TouchableOpacity>

          {/* Logo centré dans son squircle émeraude façon McDo */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
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
              style={{ width: 42, height: 42, borderRadius: 11 }}
              resizeMode="cover"
            />
          </View>

          {/* Actions à droite : Langue & Plus/Profil */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setLangModalVisible(true)}
              style={{
                backgroundColor: "#ECFDF5",
                borderWidth: 1,
                borderColor: "#A7F3D0",
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#065F46" }}>
                {language === "ar" ? "🇩🇿 عربي" : language === "en" ? "🇬🇧 EN" : "🇫🇷 FR"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Plus")}
              style={{
                backgroundColor: "#F3F4F6",
                padding: 7,
                borderRadius: 20,
              }}
              activeOpacity={0.8}
            >
              <UserIcon size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Titre Bienvenue chez Wajbati façon McDo */}
        <View style={{ marginTop: 10, marginBottom: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111827", letterSpacing: -0.3 }}>
            {t("welcomeWajbati")}
          </Text>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "600", marginTop: 2 }}>
            {t("welcomeSubtitle")}
          </Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        style={{ flex: 1, backgroundColor: "white" }}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search */}
        <Search
          restaurants={restaurant}
          dishes={dishes}
          setSearchInputHasValue={setSearchInputHasValue}
          setSearchResults={setSearchResults}
        />

        {searchInputHasValue ? (
          searchResults.map((result, index) => {
            return <SearchCard key={index} results={result} />;
          })
        ) : (
          <>
            {/* Catégories Culinaires Wajbati */}
            <Categories />

            {/* McDo Hero Card Banner (Image 1) */}
            <View style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: "#FFFBEB",
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: "#FDE68A",
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 5,
                  elevation: 2,
                }}
              >
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#FEF3C7",
                      alignSelf: "flex-start",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      marginBottom: 8,
                    }}
                  >
                    <FireIcon size={12} color="#D97706" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: "800", color: "#B45309" }}>
                      {t("homemadeSpecialty")}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "900",
                      color: "#111827",
                      lineHeight: 22,
                    }}
                  >
                    {t("homemadeBannerTitle")}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#4B5563",
                      marginTop: 4,
                      marginBottom: 14,
                    }}
                  >
                    {t("homemadeBannerDesc")}
                  </Text>

                  {/* Bouton Jaune McDo */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("MenuCategories")}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: "#FFBC0D",
                      alignSelf: "flex-start",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 9,
                      paddingHorizontal: 16,
                      borderRadius: 25,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.15,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "#111827",
                        fontWeight: "900",
                        fontSize: 13,
                        marginRight: 4,
                      }}
                    >
                      {t("tabOrder")}
                    </Text>
                    <ChevronRightIcon size={14} color="#111827" />
                  </TouchableOpacity>
                </View>

                {/* Photo appétissante */}
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=400",
                  }}
                  style={{
                    width: 105,
                    height: 105,
                    borderRadius: 16,
                  }}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Section "En ce moment chez nos cuisiniers" (Carrousel McDo) */}
            <View style={{ marginTop: 4, marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#111827" }}>
                  {t("nowAtOurCooks")}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("MenuCategories")}>
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#059669" }}>{t("seeAll")}</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {/* Carte 1 */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("MenuCategories")}
                  activeOpacity={0.9}
                  style={{
                    width: 190,
                    backgroundColor: "white",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=350",
                    }}
                    style={{ width: "100%", height: 100 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }} numberOfLines={1}>
                      Tajines & Couscous
                    </Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }} numberOfLines={1}>
                      Recettes traditionnelles
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Carte 2 */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("MenuCategories")}
                  activeOpacity={0.9}
                  style={{
                    width: 190,
                    backgroundColor: "white",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=350",
                    }}
                    style={{ width: "100%", height: 100 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }} numberOfLines={1}>
                      Burgers & Sandwiches
                    </Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }} numberOfLines={1}>
                      Pains frais & viandes marinées
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Carte 3 */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("MenuCategories")}
                  activeOpacity={0.9}
                  style={{
                    width: 190,
                    backgroundColor: "white",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#E5E7EB",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 1,
                  }}
                >
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=350",
                    }}
                    style={{ width: "100%", height: 100 }}
                    resizeMode="cover"
                  />
                  <View style={{ padding: 10 }}>
                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#111827" }} numberOfLines={1}>
                      Pâtisseries & Desserts
                    </Text>
                    <Text style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }} numberOfLines={1}>
                      Gâteaux orientaux & douceurs
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Bannière Mode Cuisinier Fait Maison */}
            <TouchableOpacity
              onPress={() => {
                if (dbUser?.isCook) {
                  navigation.navigate("CookDashboard", { kitchenId: dbUser?.kitchenId });
                } else {
                  navigation.navigate("CookOnboarding");
                }
              }}
              style={{
                marginHorizontal: 16,
                marginVertical: 10,
                backgroundColor: "#059669",
                borderRadius: 16,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🍳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                    {dbUser?.isCook ? t("manageKitchen") : t("homeCookBannerTitle")}
                  </Text>
                  <Text style={{ color: "#D1FAE5", fontSize: 11, marginTop: 2 }}>
                    {dbUser?.isCook ? t("viewCookDishes") : t("homeCookBannerSub")}
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: "white", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 8 }}>
                <Text style={{ color: "#065F46", fontWeight: "900", fontSize: 11 }}>
                  {dbUser?.isCook ? t("myKitchen") : t("becomeChef")}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Bannière Mode Restaurant Partenaire */}
            <TouchableOpacity
              onPress={() => navigation.navigate("RestaurantOnboarding")}
              style={{
                marginHorizontal: 16,
                marginVertical: 4,
                backgroundColor: "#1E293B",
                borderRadius: 16,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🏢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "white", fontWeight: "bold", fontSize: 14 }}>
                    Vous êtes restaurateur ?
                  </Text>
                  <Text style={{ color: "#CBD5E1", fontSize: 11, marginTop: 2 }}>
                    Inscrivez votre restaurant avec RC & géolocalisation
                  </Text>
                </View>
              </View>
              <View style={{ backgroundColor: "#FFBC0D", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginLeft: 8 }}>
                <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 11 }}>
                  Inscrire mon resto
                </Text>
              </View>
            </TouchableOpacity>

            {/* Cuisines de la Wilaya & Filtre Restaurants / Cuisiniers */}
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ marginTop: 14, marginBottom: 10, fontWeight: "900", fontSize: 20, color: "#111827" }}>
                {selectedWilaya
                  ? `Établissements à ${selectedWilaya.name}`
                  : "Tous les établissements"}
              </Text>

              {/* Filtres : Tous / Restaurants / Cuisiniers Fait-Maison */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <TouchableOpacity
                  onPress={() => setEstablishmentFilter("all")}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: establishmentFilter === "all" ? "#FFBC0D" : "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827" }}>
                    🍽️ Tous ({restaurant.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setEstablishmentFilter("restaurant")}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: establishmentFilter === "restaurant" ? "#FFBC0D" : "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827" }}>
                    🏢 Restaurants ({restaurant.filter((r) => !r.isCook && !r.isHomemade).length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setEstablishmentFilter("cook")}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 12,
                    backgroundColor: establishmentFilter === "cook" ? "#FFBC0D" : "#F3F4F6",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#111827" }}>
                    🍳 Fait-Maison ({restaurant.filter((r) => r.isCook || r.isHomemade).length})
                  </Text>
                </TouchableOpacity>
              </View>

              {filteredRestaurants.length === 0 ? (
                <View style={{ backgroundColor: "#F9FAFB", padding: 24, borderRadius: 16, alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB", marginVertical: 12 }}>
                  <Text style={{ fontSize: 28, marginBottom: 8 }}>📍</Text>
                  <Text style={{ fontWeight: "bold", color: "#1F2937", fontSize: 15, textAlign: "center" }}>
                    Aucun établissement pour le moment
                  </Text>
                  <Text style={{ color: "#6B7280", fontSize: 12, textAlign: "center", marginTop: 4 }}>
                    {selectedWilaya
                      ? `Aucune cuisine enregistrée dans la Wilaya de ${selectedWilaya.name}. Choisissez "Toutes les Wilayas" pour explorer toute l'Algérie.`
                      : "Aucun établissement n'est disponible pour le moment."}
                  </Text>
                </View>
              ) : (
                filteredRestaurants.map((item, index) => {
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
                      isCook={item.isCook}
                      isHomemade={item.isHomemade}
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Barre de Panier Jaune McDo */}
      <BasketIcon bottomOffset={60} />

      {/* Barre de navigation 5 onglets McDo */}
      <McDoBottomNav activeTab="home" />
    </SafeAreaView>
  );
};

export default Home;
