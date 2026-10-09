import { useState, useMemo } from "react";
import OrderItem from "./OrderItem";
import OrderModal from "./OrderModal";

const OrdersList = ({ orders = [], loading = false }) => {
  const [isActive, setIsActive] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Calcul des statistiques globales
  const stats = useMemo(() => {
    let pendingCook = 0;
    let waitingClient = 0;
    let preparing = 0;
    let readyPool = 0;
    let inDelivery = 0;
    let delivered = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      totalRevenue += Number(o.total || 0);
      const st = o.status;
      if (st === "PENDING_COOK_APPROVAL" || st === "PENDING") pendingCook++;
      else if (st === "WAITING_CLIENT_CONFIRMATION") waitingClient++;
      else if (st === "IN_PREPARATION" || st === "PREPARING") preparing++;
      else if (st === "READY_FOR_PICKUP" || st === "READY") readyPool++;
      else if (
        st === "ASSIGNED_TO_DELIVERY" ||
        st === "DRIVERACCEPTED" ||
        st === "DRIVERPICKEDUP"
      )
        inDelivery++;
      else if (st === "DELIVERED" || st === "COMPLETE") delivered++;
      else if (
        st === "DECLINED_BY_COOK" ||
        st === "CANCELLED_BY_CLIENT" ||
        st === "DECLINED"
      )
        cancelled++;
    });

    return {
      total: orders.length,
      pendingCook,
      waitingClient,
      preparing,
      readyPool,
      inDelivery,
      delivered,
      cancelled,
      totalRevenue,
    };
  }, [orders]);

  // Filtrage selon onglet et recherche
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filtre de statut
      let matchesTab = true;
      const st = order.status;
      if (activeTab === "PENDING") {
        matchesTab = st === "PENDING_COOK_APPROVAL" || st === "PENDING";
      } else if (activeTab === "WAITING_CLIENT") {
        matchesTab = st === "WAITING_CLIENT_CONFIRMATION";
      } else if (activeTab === "PREPARING") {
        matchesTab = st === "IN_PREPARATION" || st === "PREPARING";
      } else if (activeTab === "READY") {
        matchesTab = st === "READY_FOR_PICKUP" || st === "READY";
      } else if (activeTab === "IN_DELIVERY") {
        matchesTab =
          st === "ASSIGNED_TO_DELIVERY" ||
          st === "DRIVERACCEPTED" ||
          st === "DRIVERPICKEDUP";
      } else if (activeTab === "DELIVERED") {
        matchesTab = st === "DELIVERED" || st === "COMPLETE";
      } else if (activeTab === "CANCELLED") {
        matchesTab =
          st === "DECLINED_BY_COOK" ||
          st === "CANCELLED_BY_CLIENT" ||
          st === "DECLINED";
      }

      if (!matchesTab) return false;

      // Filtre de recherche texte
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = order.id?.toLowerCase().includes(q);
        const nameMatch = `${order.userFirstName || ""} ${order.userLastName || ""}`
          .toLowerCase()
          .includes(q);
        const restMatch = order.restaurantName?.toLowerCase().includes(q);
        return idMatch || nameMatch || restMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  const tabs = [
    { id: "ALL", label: "Toutes", count: stats.total },
    { id: "PENDING", label: "Attente Cuisinier", count: stats.pendingCook },
    { id: "WAITING_CLIENT", label: "Attente Client", count: stats.waitingClient },
    { id: "PREPARING", label: "En Préparation", count: stats.preparing },
    { id: "READY", label: "Prêtes (Pool)", count: stats.readyPool },
    { id: "IN_DELIVERY", label: "En Livraison", count: stats.inDelivery },
    { id: "DELIVERED", label: "Livrées", count: stats.delivered },
    { id: "CANCELLED", label: "Annulées / Refusées", count: stats.cancelled },
  ];

  return (
    <>
      {isActive && selectedOrder && (
        <OrderModal setIsActive={setIsActive} selectedOrder={selectedOrder} />
      )}

      <div className="max-w-7xl mx-auto pt-6 px-4 md:px-8 pb-16">
        {/* En-tête */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Supervision des Commandes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cycle de vie en temps réel · Clients, Cuisiniers et Livreurs
            </p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Chiffre d&apos;Affaires Global :
            </span>
            <span className="text-xl font-extrabold text-emerald-700">
              {stats.totalRevenue.toLocaleString("fr-FR")} DA
            </span>
          </div>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs">
            <span className="text-xs text-gray-500 block">Total Commandes</span>
            <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
          </div>
          <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
            <span className="text-xs text-amber-800 block">Attente Cuisinier</span>
            <span className="text-2xl font-bold text-amber-700">
              {stats.pendingCook}
            </span>
          </div>
          <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200">
            <span className="text-xs text-purple-800 block">Attente Client</span>
            <span className="text-2xl font-bold text-purple-700">
              {stats.waitingClient}
            </span>
          </div>
          <div className="bg-orange-50 p-3.5 rounded-2xl border border-orange-200">
            <span className="text-xs text-orange-800 block">En Préparation</span>
            <span className="text-2xl font-bold text-orange-700">
              {stats.preparing}
            </span>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
            <span className="text-xs text-blue-800 block">Pool Livreurs</span>
            <span className="text-2xl font-bold text-blue-700">
              {stats.readyPool}
            </span>
          </div>
          <div className="bg-green-50 p-3.5 rounded-2xl border border-green-200">
            <span className="text-xs text-green-800 block">Livrées</span>
            <span className="text-2xl font-bold text-green-700">
              {stats.delivered}
            </span>
          </div>
        </div>

        {/* Barre de recherche & Onglets */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-6 space-y-4">
          {/* Recherche */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par N° de commande, nom de client, restaurant..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Onglets de filtrage */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? "bg-gray-900 text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id
                      ? "bg-gray-700 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tableau des commandes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              Chargement des commandes en direct...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl block mb-2">📋</span>
              <h4 className="font-bold text-gray-700 text-base">
                Aucune commande dans cette catégorie
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Toutes les nouvelles commandes s&apos;afficheront ici en temps réel.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left text-sm">
                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Heure</th>
                    <th className="py-3 px-4">N° Commande</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Cuisine</th>
                    <th className="py-3 px-4">Montant</th>
                    <th className="py-3 px-4">Statut Cycle de Vie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedOrder(item);
                        setIsActive(true);
                      }}
                      className="cursor-pointer hover:bg-gray-50/70 transition"
                    >
                      <OrderItem
                        date={item.createdAt}
                        id={item.id}
                        firstName={item.userFirstName}
                        lastName={item.userLastName}
                        restaurantName={item.restaurantName}
                        total={item.total}
                        status={item.status}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrdersList;
