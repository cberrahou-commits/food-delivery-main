import { useState, useMemo } from "react";
import { db } from "../../firebase/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { FOOD_CATEGORIES } from "../../data/categories";

const MenuItem = ({ setIsActive, dishes, setIsRemoved }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleRemove = async (id) => {
    if (confirm("Supprimer ce plat du menu ?")) {
      await deleteDoc(doc(db, "dishes", id));
      setIsRemoved(true);
    }
  };

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "all") return dishes;
    return dishes.filter(
      (d) =>
        d.categoryId === selectedCategory ||
        (d.category && d.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    );
  }, [dishes, selectedCategory]);

  return (
    <>
      <div className="items-start justify-between sm:flex">
        <div>
          <h4 className="text-gray-800 text-3xl font-black">Menu du Restaurant</h4>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos catégories de plats, prix et ingrédients personnalisables par les clients.
          </p>
        </div>
        <button
          onClick={() => setIsActive(true)}
          className="cursor-pointer inline-flex items-center justify-center gap-2 py-2.5 px-4 mt-3 sm:mt-0 font-bold text-sm text-white bg-green-600 hover:bg-green-700 active:bg-green-800 duration-150 rounded-xl shadow-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
          Ajouter un plat
        </button>
      </div>

      {/* Onglets de filtrage par catégorie */}
      <div className="flex gap-2 overflow-x-auto py-3 mt-6 border-b border-gray-100 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
            selectedCategory === "all"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🍽️ Tous ({dishes.length})
        </button>
        {FOOD_CATEGORIES.map((cat) => {
          const count = dishes.filter(
            (d) =>
              d.categoryId === cat.id ||
              (d.category && d.category.toLowerCase().includes(cat.id.toLowerCase()))
          ).length;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? "bg-green-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.icon} {cat.shortName} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des plats */}
      {filteredDishes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl mt-6 border border-gray-100">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="font-bold text-gray-700 text-base">Aucun plat dans cette catégorie</p>
          <p className="text-gray-500 text-xs mt-1">
            Cliquez sur &quot;Ajouter un plat&quot; pour enrichir votre carte.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {filteredDishes.map((item, index) => {
            const ingredients =
              item.customizableIngredients ||
              item.ingredients ||
              (typeof item.description === "string" ? [] : []);

            return (
              <li key={index} className="py-4 flex items-start justify-between gap-4">
                <div className="flex gap-4 items-start flex-1">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="flex-none w-20 h-20 rounded-xl object-cover bg-gray-100 border border-gray-100 shadow-xs"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base text-gray-900 font-extrabold">
                        {item.name}
                      </span>
                      {item.category && (
                        <span className="text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <span className="block text-sm text-green-700 font-extrabold mt-1">
                      {Number(item.price || 0).toLocaleString("fr-FR")} DA
                    </span>

                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                        {item.description}
                      </p>
                    )}

                    {/* Ingrédients personnalisables */}
                    {Array.isArray(ingredients) && ingredients.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-bold">
                          🌿 Ingrédients :
                        </span>
                        {ingredients.slice(0, 5).map((ing, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {ing}
                          </span>
                        ))}
                        {ingredients.length > 5 && (
                          <span className="text-[10px] text-gray-400">
                            +{ingredients.length - 5}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  className="cursor-pointer p-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                  title="Supprimer le plat"
                >
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default MenuItem;
