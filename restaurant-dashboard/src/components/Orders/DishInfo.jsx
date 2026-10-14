import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";

const DishInfo = ({ id, quantity, name, excludedIngredients, specialInstructions }) => {
  const [dishData, setDishData] = useState({});

  useEffect(() => {
    const getDish = async () => {
      try {
        const docRef = doc(db, "dishes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDishData(docSnap.data());
        }
      } catch (err) {
        console.error("Error loading dish info:", err);
      }
    };
    if (id) {
      getDish();
    }
  }, [id]);

  const displayName = name || dishData.name || "Chargement...";
  const displayImage = dishData.image || null;

  return (
    <div className="flex items-center justify-between space-x-3 bg-white py-3">
      <div className="flex items-start space-x-3">
        <div className="font-bold text-xl text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          {quantity}x
        </div>
        <div>
          <div className="font-bold text-base text-gray-800">
            {displayName}
          </div>

          {/* Badges d'ingrédients exclus (ex: sans salade et tomate) */}
          {excludedIngredients && excludedIngredients.length > 0 && (
            <div className="mt-1">
              <span className="inline-flex items-center text-xs font-bold bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md">
                🚫 Sans : {excludedIngredients.join(", ")}
              </span>
            </div>
          )}

          {/* Consignes particulières pour la cuisine */}
          {specialInstructions && (
            <div className="mt-1 text-xs text-amber-800 italic bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-block">
              📝 Note : {specialInstructions}
            </div>
          )}
        </div>
      </div>

      {displayImage ? (
        <img
          src={displayImage}
          alt={displayName}
          className="rounded-xl w-14 h-14 object-cover border border-gray-100"
        />
      ) : (
        <div className="rounded-xl w-14 h-14 bg-gray-100 flex items-center justify-center text-xs text-gray-400">
          🍽️
        </div>
      )}
    </div>
  );
};

export default DishInfo;
