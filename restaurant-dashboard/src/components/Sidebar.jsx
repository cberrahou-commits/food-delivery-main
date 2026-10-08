import { useState, useEffect } from "react";
import { navigation } from "../data/navigation";
import { navsFooter } from "../data/navsFooter";
import Orders from "./Orders/Orders";
import OrderHistory from "./OrderHistory/OrderHistory";
import Menu from "./Menu/Menu";
import Settings from "./Settings/Settings";
import { db } from "../firebase/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { DEFAULT_RESTAURANT_ID } from "../config/constants";

const Sidebar = () => {
  const [active, setActive] = useState(0);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState(DEFAULT_RESTAURANT_ID);
  const [restaurant, setRestaurant] = useState({});

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const snap = await getDocs(collection(db, "restaurants"));
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setRestaurants(list);
      } catch (err) {
        console.error("Error fetching restaurants list:", err);
      }
    };
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const getRestaurant = async () => {
      if (!restaurantId) return;
      try {
        const resRef = doc(db, "restaurants", restaurantId);
        const docSnapshot = await getDoc(resRef);
        if (docSnapshot.exists()) {
          setRestaurant({ ...docSnapshot.data(), id: docSnapshot.id });
        }
      } catch (err) {
        console.error("Error fetching restaurant details:", err);
      }
    };

    getRestaurant();
  }, [restaurantId]);

  return (
    <div className="flex h-screen">
      <div className="flex-none w-3/12">
        <nav className="fixed top-0 left-0 w-full h-full border-r bg-white space-y-4 sm:w-80">
          <div className="flex flex-col h-full">
            <div className="h-20 flex items-center px-8">
              <p className="font-bold text-2xl text-gray-800">Dashboard</p>
            </div>

            {/* Sélecteur de restaurant */}
            <div className="px-6 py-2 pb-4 border-b">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Restaurant
              </label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm font-semibold rounded-lg focus:ring-green-500 focus:border-green-500 p-2 cursor-pointer shadow-sm"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name || r.title || r.id}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-auto">
              <ul className="px-4 text-sm font-medium flex-1 pt-2">
                {navigation.map((item, index) => (
                  <li key={index} onClick={() => setActive(index)}>
                    <div
                      className={`my-3 cursor-pointer flex items-center gap-x-2 text-gray-700 text-base p-2 rounded-xl  hover:bg-green-100 active:bg-green-400 duration-150 ${
                        active === index
                          ? "bg-green-100 border-l-4 border-b-4 border-green-500"
                          : ""
                      } `}
                    >
                      <div className="text-gray-500 cursor-pointer">
                        {item.icon}
                      </div>
                      {item.name}
                    </div>
                  </li>
                ))}
              </ul>
              <div>
                <ul className="px-4 pb-4 text-sm font-medium">
                  {navsFooter.map((item, index) => (
                    <li key={index}>
                      <a className="flex items-center gap-x-2 text-gray-700 text-base p-2 rounded-xl  hover:bg-green-100 active:bg-gray-100 duration-150">
                        <div className="text-gray-500">{item.icon}</div>
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
                <div className="py-4 px-4 border-t">
                  <div className="flex items-center gap-x-4">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name || "Restaurant"}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                        Resto
                      </div>
                    )}
                    <div>
                      <span className="block text-gray-700 text-base font-bold">
                        {restaurant.name || "Chargement..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <div className="flex-auto w-64">
        {active === 0 && <Orders restaurantId={restaurantId} />}
        {active === 1 && <Menu restaurantId={restaurantId} />}
        {active === 2 && <OrderHistory restaurantId={restaurantId} />}
        {active === 3 && <Settings />}
      </div>
    </div>
  );
};

export default Sidebar;
