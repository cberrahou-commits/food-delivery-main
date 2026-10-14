import { useState } from "react";
import { db } from "../../firebase/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { FOOD_CATEGORIES } from "../../data/categories";

const AddDishModal = ({ setIsActive, restaurantId }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("burger");
  const [customizableIngredientsText, setCustomizableIngredientsText] = useState(
    FOOD_CATEGORIES.find((c) => c.id === "burger")?.defaultIngredients?.join(", ") || ""
  );
  const [image, setImage] = useState("");
  const [price, setPrice] = useState("");
  const [prepTime, setPrepTime] = useState("20");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setCategory(selectedCatId);
    const catObj = FOOD_CATEGORIES.find((c) => c.id === selectedCatId);
    if (catObj && catObj.defaultIngredients) {
      setCustomizableIngredientsText(catObj.defaultIngredients.join(", "));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Veuillez saisir le nom du plat.");
      return;
    }

    const parsedPrice = parseFloat(price.replace(",", "."));
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      alert("Veuillez saisir un prix valide en DA.");
      return;
    }

    setLoading(true);
    try {
      const selectedCatObj = FOOD_CATEGORIES.find((c) => c.id === category);
      const categoryName = selectedCatObj ? selectedCatObj.name : "Autres";

      const ingredientsList = customizableIngredientsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const defaultImage =
        image.trim() ||
        (category === "burger"
          ? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600"
          : category === "pizza"
          ? "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600"
          : category === "traditionnel"
          ? "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?w=600"
          : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600");

      await addDoc(collection(db, "dishes"), {
        name: name.trim(),
        category: categoryName,
        categoryId: category,
        customizableIngredients: ingredientsList,
        ingredients: ingredientsList,
        image: defaultImage,
        description: description.trim() || `Délicieux ${name.trim()} préparé avec des ingrédients frais.`,
        price: parsedPrice,
        prepTimeMinutes: parseInt(prepTime) || 20,
        restaurantId: restaurantId,
        createdAt: serverTimestamp(),
      });

      setIsActive(false);
    } catch (err) {
      console.error("Error adding dish:", err);
      alert("Erreur lors de l'ajout du plat : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 w-full h-full bg-black opacity-60"
        onClick={() => setIsActive(false)}
      ></div>
      <div className="flex items-center min-h-screen px-4 py-8">
        <div className="relative w-full max-w-xl p-6 mx-auto bg-white rounded-2xl shadow-2xl">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <h4 className="text-xl font-black text-gray-800">
              Ajouter un plat au menu 🍽️
            </h4>
            <button
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              onClick={() => setIsActive(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Nom du plat */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Nom du plat *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cheeseburger Gourmet, Pizza Margherita, Couscous Royal..."
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
              />
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Catégorie culinaire *
              </label>
              <select
                value={category}
                onChange={handleCategoryChange}
                className="w-full px-3 py-2 text-sm font-semibold text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
              >
                {FOOD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
                <option value="autre">✨ Autre spécialité</option>
              </select>
            </div>

            {/* Ingrédients personnalisables (ex: sans salade et tomate) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Ingrédients personnalisables (séparés par des virgules)
                </label>
                <span className="text-[11px] text-green-700 font-semibold">
                  Option &quot;Sans...&quot;
                </span>
              </div>
              <input
                type="text"
                value={customizableIngredientsText}
                onChange={(e) => setCustomizableIngredientsText(e.target.value)}
                placeholder="Ex: Salade, Tomate, Oignons, Cornichons, Fromage cheddar, Sauce"
                className="w-full px-3 py-2 text-sm text-gray-800 bg-amber-50/50 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                💡 Les clients pourront décocher ces ingrédients sur l&apos;application mobile (ex: un burger sans salade et tomate).
              </p>
            </div>

            {/* Ligne Prix & Temps de préparation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Prix (Dinars DA) *
                </label>
                <input
                  type="text"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex: 850"
                  className="w-full px-3 py-2 text-sm font-bold text-green-700 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Temps préparation (min)
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
                />
              </div>
            </div>

            {/* Lien image */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Lien image du plat (URL)
              </label>
              <input
                type="text"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... (laisser vide pour photo automatique)"
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Description & Recette
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez la composition, les viandes, le fromage et le goût..."
                className="w-full px-3 py-2 text-sm text-gray-800 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:bg-white outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 font-bold text-white bg-green-600 hover:bg-green-700 active:bg-green-800 rounded-xl shadow-md transition duration-150"
            >
              {loading ? "Enregistrement en cours..." : "Enregistrer le plat au menu ✅"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDishModal;
