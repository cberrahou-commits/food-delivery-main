import { db } from "../../firebase/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import AddDishModal from "./AddDishModal";
import MenuItem from "./MenuItem";
import { DEFAULT_RESTAURANT_ID } from "../../config/constants";

const Menu = ({ restaurantId = DEFAULT_RESTAURANT_ID }) => {
  const [isActive, setIsActive] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);
  const [dishes, setDishes] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;

    const getDishes = async () => {
      try {
        const dishesRef = collection(db, "dishes");
        const q = query(dishesRef, where("restaurantId", "==", restaurantId));

        const querySnapshot = await getDocs(q);
        let item = [];
        querySnapshot.forEach((doc) => {
          item.push({ ...doc.data(), id: doc.id });
        });
        setDishes(item);
      } catch (err) {
        console.error("Error fetching dishes:", err);
      }
    };

    getDishes();
    setIsRemoved(false);
  }, [isActive, isRemoved, restaurantId]);

  return (
    <div className="max-w-4xl pt-8 px-4 md:px-8">
      {isActive && (
        <AddDishModal setIsActive={setIsActive} restaurantId={restaurantId} />
      )}
      <MenuItem
        setIsActive={setIsActive}
        dishes={dishes}
        setIsRemoved={setIsRemoved}
      />
    </div>
  );
};

export default Menu;
