const OrderItem = ({
  date,
  id,
  total,
  status,
  lastName,
  firstName,
  restaurantName,
}) => {
  let formattedDate = "";
  try {
    const orderTimeStamp = date?.toDate
      ? date.toDate()
      : date
      ? new Date(date)
      : new Date();
    const options = {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };
    formattedDate = orderTimeStamp.toLocaleString("fr-FR", options);
  } catch (e) {
    formattedDate = "Date inconnue";
  }

  const getStatusBadge = () => {
    switch (status) {
      case "PENDING_COOK_APPROVAL":
      case "PENDING":
        return {
          label: "⏳ Attente cuisinier",
          className: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "WAITING_CLIENT_CONFIRMATION":
        return {
          label: "⏰ Attente accord client",
          className: "bg-purple-100 text-purple-800 border-purple-300",
        };
      case "IN_PREPARATION":
      case "PREPARING":
        return {
          label: "🍲 En préparation",
          className: "bg-orange-100 text-orange-800 border-orange-300",
        };
      case "READY_FOR_PICKUP":
      case "READY":
        return {
          label: "🛵 Prête (Pool)",
          className: "bg-blue-100 text-blue-800 border-blue-300",
        };
      case "ASSIGNED_TO_DELIVERY":
      case "DRIVERACCEPTED":
      case "DRIVERPICKEDUP":
        return {
          label: "🚴🏻‍♀️ Livreur en route",
          className: "bg-indigo-100 text-indigo-800 border-indigo-300",
        };
      case "DELIVERED":
      case "COMPLETE":
        return {
          label: "✅ Livrée",
          className: "bg-green-100 text-green-800 border-green-300",
        };
      case "DECLINED_BY_COOK":
      case "DECLINED":
        return {
          label: "❌ Refusée cuisinier",
          className: "bg-red-100 text-red-800 border-red-300",
        };
      case "CANCELLED_BY_CLIENT":
        return {
          label: "❌ Annulée client",
          className: "bg-red-100 text-red-800 border-red-300",
        };
      default:
        return {
          label: status || "Inconnu",
          className: "bg-gray-100 text-gray-800 border-gray-300",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <>
      <td className="pr-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
        {formattedDate}
      </td>
      <td className="pr-4 py-3.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">
        #{id?.slice(0, 8)}
      </td>
      <td className="pr-4 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">
        {firstName} {lastName}
      </td>
      <td className="pr-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
        {restaurantName || "Cuisine"}
      </td>
      <td className="pr-4 py-3.5 text-sm font-bold text-emerald-700 whitespace-nowrap">
        {Number(total || 0).toLocaleString("fr-FR")} DA
      </td>
      <td className="pr-4 py-3.5 whitespace-nowrap">
        <span
          className={`px-2.5 py-1 rounded-full font-semibold text-xs border ${badge.className}`}
        >
          {badge.label}
        </span>
      </td>
    </>
  );
};

export default OrderItem;
