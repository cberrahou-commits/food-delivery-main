import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StarIcon, XMarkIcon, SparklesIcon } from "react-native-heroicons/solid";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useLanguage } from "../contexts/LanguageContext";

const STAR_LABELS = {
  5: "Excellent ! 🌟",
  4: "Très bon ! 👍",
  3: "Correct 🙂",
  2: "Moyen 😕",
  1: "Décevant 😞",
};

const StarRatingRow = ({ rating, onChange, size = 32 }) => {
  return (
    <View className="flex-row items-center space-x-2 my-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onChange(star)}
          activeOpacity={0.7}
          className="p-1"
        >
          <StarIcon
            size={size}
            color={star <= rating ? "#F59E0B" : "#E5E7EB"}
          />
        </TouchableOpacity>
      ))}
      <Text className="text-xs font-bold text-amber-700 ml-2">
        {STAR_LABELS[rating] || `${rating}/5`}
      </Text>
    </View>
  );
};

const OrderRatingModal = ({ visible, onClose, order, onRatedSuccess }) => {
  const { t } = useLanguage();
  const [cookRating, setCookRating] = useState(5);
  const [cookComment, setCookComment] = useState("");

  const [dishes, setDishes] = useState([]);
  const [loadingDishes, setLoadingDishes] = useState(false);

  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState("");

  const [submitting, setSubmitting] = useState(false);

  // Charger les plats de la commande
  useEffect(() => {
    if (!visible || !order?.id) return;

    let isMounted = true;
    const fetchOrderDishes = async () => {
      setLoadingDishes(true);
      try {
        const q = query(
          collection(db, "orderDishes"),
          where("orderId", "==", order.id)
        );
        const snap = await getDocs(q);
        const dishList = [];

        for (const dishDoc of snap.docs) {
          const dData = dishDoc.data();
          const dId = dData.dishId;
          let dishDetails = {
            dishId: dId,
            name: "Plat commandé",
            image: null,
            quantity: dData.quantity || 1,
            rating: 5,
            comment: "",
          };

          if (dId) {
            try {
              const dSnap = await getDoc(doc(db, "dishes", dId));
              if (dSnap.exists()) {
                const fetched = dSnap.data();
                dishDetails.name = fetched.name || dishDetails.name;
                dishDetails.image = fetched.image || null;
              }
            } catch (err) {
              console.warn("Erreur chargement plat:", err);
            }
          }
          dishList.push(dishDetails);
        }

        if (isMounted) {
          setDishes(dishList);
        }
      } catch (e) {
        console.error("Erreur fetch orderDishes:", e);
      } finally {
        if (isMounted) setLoadingDishes(false);
      }
    };

    fetchOrderDishes();
    return () => {
      isMounted = false;
    };
  }, [visible, order?.id]);

  const updateDishRating = (index, rating) => {
    setDishes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], rating };
      return copy;
    });
  };

  const updateDishComment = (index, comment) => {
    setDishes((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], comment };
      return copy;
    });
  };

  const handleSubmitRating = async () => {
    if (!order?.id) return;
    setSubmitting(true);

    try {
      const user = auth.currentUser;
      const userId = user?.uid || order.userId || "client_uid";
      const userName = user?.displayName || user?.email?.split("@")[0] || "Client";

      // 1. Enregistrer dans la collection 'reviews'
      await addDoc(collection(db, "reviews"), {
        orderId: order.id,
        userId: userId,
        userName: userName,
        restaurantId: order.restaurantId || null,
        restaurantName: order.restaurantName || "Cuisine",
        cookRating: cookRating,
        cookComment: cookComment.trim(),
        dishesRatings: dishes.map((d) => ({
          dishId: d.dishId,
          name: d.name,
          rating: d.rating,
          comment: d.comment ? d.comment.trim() : "",
        })),
        driverId: order.assignedDriverId || null,
        driverName: order.driverName || null,
        driverRating: order.assignedDriverId ? driverRating : null,
        driverComment: order.assignedDriverId ? driverComment.trim() : null,
        createdAt: serverTimestamp(),
      });

      // 2. Mettre à jour la commande
      await updateDoc(doc(db, "orders", order.id), {
        hasRated: true,
        ratedAt: serverTimestamp(),
        ratings: {
          cookRating: cookRating,
          driverRating: order.assignedDriverId ? driverRating : null,
        },
      });

      // 3. Mettre à jour la note moyenne du restaurant / cuisinier
      if (order.restaurantId) {
        try {
          const restRef = doc(db, "restaurants", order.restaurantId);
          const restSnap = await getDoc(restRef);
          if (restSnap.exists()) {
            const data = restSnap.data();
            const prevRating = typeof data.rating === "number" ? data.rating : 5.0;
            const prevCount = typeof data.reviewCount === "number" ? data.reviewCount : 0;
            const newCount = prevCount + 1;
            const newRating = Number(((prevRating * prevCount + cookRating) / newCount).toFixed(1));
            await updateDoc(restRef, { rating: newRating, reviewCount: newCount });
          }
        } catch (e) {
          console.warn("Erreur mise à jour note restaurant:", e);
        }
      }

      // 4. Mettre à jour la note moyenne de chaque plat noté
      for (const d of dishes) {
        if (!d.dishId) continue;
        try {
          const dishRef = doc(db, "dishes", d.dishId);
          const dishSnap = await getDoc(dishRef);
          if (dishSnap.exists()) {
            const data = dishSnap.data();
            const prevRating = typeof data.rating === "number" ? data.rating : 5.0;
            const prevCount = typeof data.reviewCount === "number" ? data.reviewCount : 0;
            const newCount = prevCount + 1;
            const newRating = Number(((prevRating * prevCount + d.rating) / newCount).toFixed(1));
            await updateDoc(dishRef, { rating: newRating, reviewCount: newCount });
          }
        } catch (e) {
          console.warn("Erreur mise à jour note plat:", e);
        }
      }

      // 5. Mettre à jour la note moyenne du livreur
      if (order.assignedDriverId) {
        try {
          const driverRef = doc(db, "user", order.assignedDriverId);
          const driverSnap = await getDoc(driverRef);
          if (driverSnap.exists()) {
            const data = driverSnap.data();
            const prevRating = typeof data.driverRating === "number" ? data.driverRating : 5.0;
            const prevCount = typeof data.driverRatingCount === "number" ? data.driverRatingCount : 0;
            const newCount = prevCount + 1;
            const newRating = Number(((prevRating * prevCount + driverRating) / newCount).toFixed(1));
            await updateDoc(driverRef, { driverRating: newRating, driverRatingCount: newCount });
          }
        } catch (e) {
          console.warn("Erreur mise à jour note livreur:", e);
        }
      }

      Alert.alert(
        "Merci pour votre avis ! ⭐",
        "Vos évaluations aident nos cuisiniers et nos livreurs à s'améliorer au quotidien."
      );

      if (onRatedSuccess) onRatedSuccess();
      onClose();
    } catch (err) {
      console.error("Erreur enregistrement avis:", err);
      Alert.alert("Erreur", "Impossible d'enregistrer votre évaluation. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasDriver = Boolean(order?.assignedDriverId || order?.driverName);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[90%] pb-8 pt-4 px-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-gray-100">
            <View className="flex-row items-center space-x-2">
              <SparklesIcon size={24} color="#F59E0B" />
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  Évaluer ma commande
                </Text>
                <Text className="text-xs text-gray-500">
                  #{order?.id?.slice(0, 8)} · {order?.restaurantName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-gray-100"
            >
              <XMarkIcon size={20} color="#4B5563" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* 1. NOTER LE CUISINIER / RESTAURANT */}
            <View className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 mb-4">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-base font-bold text-gray-800">
                  👨‍🍳 Le Cuisinier & la Cuisine
                </Text>
                <View className="bg-amber-100 px-2 py-0.5 rounded-md">
                  <Text className="text-xs font-semibold text-amber-800">
                    {order?.restaurantName || "Cuisine"}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-gray-500 mb-2">
                Comment évaluez-vous la fraîcheur, la qualité et la générosité des plats ?
              </Text>

              <StarRatingRow rating={cookRating} onChange={setCookRating} />

              <TextInput
                value={cookComment}
                onChangeText={setCookComment}
                placeholder="Laissez un message d'encouragement au chef (optionnel)..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-800 mt-2"
              />
            </View>

            {/* 2. NOTER LES PLATS */}
            <View className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 mb-4">
              <Text className="text-base font-bold text-gray-800 mb-1">
                🍲 Les Plats Commandés
              </Text>
              <Text className="text-xs text-gray-500 mb-3">
                Donnez une note spécifique à chaque plat dégusté :
              </Text>

              {loadingDishes ? (
                <View className="py-4 items-center">
                  <ActivityIndicator size="small" color="#059669" />
                  <Text className="text-xs text-gray-500 mt-2">
                    Chargement des plats...
                  </Text>
                </View>
              ) : dishes.length === 0 ? (
                <Text className="text-xs text-gray-500 italic">
                  Aucun détail de plat disponible pour cette commande.
                </Text>
              ) : (
                dishes.map((dishItem, idx) => (
                  <View
                    key={dishItem.dishId || idx}
                    className="bg-white p-3 rounded-xl border border-emerald-100 mb-3 shadow-xs"
                  >
                    <View className="flex-row items-center space-x-3 mb-2">
                      <Image
                        source={{
                          uri:
                            dishItem.image &&
                            (dishItem.image.startsWith("http") ||
                              dishItem.image.startsWith("data:image"))
                              ? dishItem.image
                              : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
                        }}
                        className="w-12 h-12 rounded-xl bg-gray-100"
                        resizeMode="cover"
                      />
                      <View className="flex-1">
                        <Text className="font-bold text-sm text-gray-800">
                          {dishItem.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Quantité : {dishItem.quantity}
                        </Text>
                      </View>
                    </View>

                    <StarRatingRow
                      rating={dishItem.rating}
                      onChange={(r) => updateDishRating(idx, r)}
                      size={26}
                    />

                    <TextInput
                      value={dishItem.comment}
                      onChangeText={(c) => updateDishComment(idx, c)}
                      placeholder="Votre avis sur ce plat (saveur, cuisson...)"
                      placeholderTextColor="#9CA3AF"
                      className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs text-gray-800 mt-1"
                    />
                  </View>
                ))
              )}
            </View>

            {/* 3. NOTER LE LIVREUR */}
            {hasDriver && (
              <View className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-200/80 mb-5">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-base font-bold text-gray-800">
                    🛵 Le Livreur
                  </Text>
                  <View className="bg-indigo-100 px-2 py-0.5 rounded-md">
                    <Text className="text-xs font-semibold text-indigo-800">
                      {order?.driverName || "Livreur Partenaire"}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-gray-500 mb-2">
                  Politesse, respect des délais et soin apporté à la livraison :
                </Text>

                <StarRatingRow
                  rating={driverRating}
                  onChange={setDriverRating}
                />

                <TextInput
                  value={driverComment}
                  onChangeText={setDriverComment}
                  placeholder="Un commentaire sur la livraison (optionnel)..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={2}
                  className="bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-800 mt-2"
                />
              </View>
            )}

            {/* Bouton de validation */}
            <TouchableOpacity
              onPress={handleSubmitRating}
              disabled={submitting}
              className={`p-4 rounded-2xl items-center flex-row justify-center space-x-2 mb-6 ${
                submitting ? "bg-amber-400" : "bg-amber-500"
              } shadow-md`}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <StarIcon size={20} color="white" />
                  <Text className="text-white font-bold text-base">
                    Valider et envoyer mes évaluations ⭐
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default OrderRatingModal;

