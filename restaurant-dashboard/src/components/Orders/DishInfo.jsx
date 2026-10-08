import { useState, useEffect } from "react";
import Image from "next/image";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const DishInfo = ({ id, quantity }) => {
  const [dishes, setDishes] = useState({});

  useEffect(() => {
    const getDish = async () => {
      try {
        const docRef = doc(db, "dishes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDishes(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading dish info:", err);
      }
    };
    if (id) {
      getDish();
    }
  }, [id]);

  return (
    <div className="flex items-center justify-between space-x-3 bg-white py-4 mt-4">
      <div className="flex items-center justify-evenly">
        <div className="font-bold text-2xl text-green-500">
          {quantity} x
        </div>
        <div className="ml-2 font-bold text-xl pt-1 text-gray-700">
          {dishes.name || "Chargement..."}
        </div>
      </div>
      {dishes.image ? (
        <img
          src={dishes.image}
          alt={dishes.name || "Plat"}
          className="rounded-full w-16 h-16 object-cover"
        />
      ) : (
        <div className="rounded-full w-16 h-16 bg-gray-200 flex items-center justify-center text-xs text-gray-500">
          Plat
        </div>
      )}
    </div>
  );
};

export default DishInfo;
