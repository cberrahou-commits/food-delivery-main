import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

const PartnerVerifications = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING"); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'
  const [typeFilter, setTypeFilter] = useState("ALL"); // 'ALL' | 'restaurant' | 'cook'
  const [selectedImage, setSelectedImage] = useState(null); // For fullscreen zoom modal
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "restaurants"),
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPartners(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to partners:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const handleApprove = async (partnerId) => {
    setActionLoading((prev) => ({ ...prev, [partnerId]: "approving" }));
    try {
      await updateDoc(doc(db, "restaurants", partnerId), {
        isVerified: true,
        status: "APPROVED",
        verifiedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error approving partner:", err);
      alert("Erreur lors de l'approbation : " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [partnerId]: null }));
    }
  };

  const handleReject = async (partnerId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir rejeter cette demande de partenariat ?")) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [partnerId]: "rejecting" }));
    try {
      await updateDoc(doc(db, "restaurants", partnerId), {
        isVerified: false,
        status: "REJECTED",
        rejectedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error rejecting partner:", err);
      alert("Erreur lors du rejet : " + err.message);
    } finally {
      setActionLoading((prev) => ({ ...prev, [partnerId]: null }));
    }
  };

  const filteredPartners = partners.filter((p) => {
    // Filtrage par type
    const isCook = p.isCook || p.isHomemade || p.type === "cook";
    if (typeFilter === "restaurant" && isCook) return false;
    if (typeFilter === "cook" && !isCook) return false;

    // Filtrage par statut
    const isApproved = p.isVerified === true || p.status === "APPROVED";
    const isRejected = p.status === "REJECTED";
    const isPending = !isApproved && !isRejected;

    if (statusFilter === "PENDING") return isPending;
    if (statusFilter === "APPROVED") return isApproved;
    if (statusFilter === "REJECTED") return isRejected;
    return true;
  });

  const pendingCount = partners.filter(
    (p) => !(p.isVerified === true || p.status === "APPROVED") && p.status !== "REJECTED"
  ).length;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* En-tête */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Vérifications & Approbation des Partenaires
            </h1>
            {pendingCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-1 rounded-full border border-amber-300 animate-pulse">
                {pendingCount} en attente
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Contrôle des Registres de Commerce (RC), géolocalisations GPS et photos des locaux avant activation sur l&apos;application Wajbati
          </p>
        </div>

        {/* Filtres Type */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-xs">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              typeFilter === "ALL"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Tous ({partners.length})
          </button>
          <button
            onClick={() => setTypeFilter("restaurant")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              typeFilter === "restaurant"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🏢 Restaurants
          </button>
          <button
            onClick={() => setTypeFilter("cook")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              typeFilter === "cook"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            🍳 Cuisiniers Maison
          </button>
        </div>
      </div>

      {/* Onglets Statut */}
      <div className="flex items-center gap-3 my-6 border-b border-gray-200 pb-2">
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            statusFilter === "PENDING"
              ? "border-amber-500 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>⏳ En attente de validation</span>
          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-black">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("APPROVED")}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            statusFilter === "APPROVED"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>✅ Approuvés & En ligne</span>
          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-black">
            {partners.filter((p) => p.isVerified === true || p.status === "APPROVED").length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("REJECTED")}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            statusFilter === "REJECTED"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <span>❌ Rejetés</span>
          <span className="bg-rose-100 text-rose-800 text-xs px-2 py-0.5 rounded-full font-black">
            {partners.filter((p) => p.status === "REJECTED").length}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("ALL")}
          className={`pb-2 px-1 text-sm font-bold border-b-2 transition-colors ${
            statusFilter === "ALL"
              ? "border-gray-800 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Tous les dossiers
        </button>
      </div>

      {/* Contenu Principal */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : filteredPartners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-xs max-w-lg mx-auto mt-10">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Aucun dossier dans cette catégorie
          </h3>
          <p className="text-xs text-gray-500">
            {statusFilter === "PENDING"
              ? "Toutes les demandes de restaurants et cuisiniers ont été traitées."
              : "Aucun établissement ne correspond aux critères sélectionnés."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredPartners.map((item) => {
            const isCook = item.isCook || item.isHomemade || item.type === "cook";
            const isApproved = item.isVerified === true || item.status === "APPROVED";
            const isRejected = item.status === "REJECTED";
            const isPending = !isApproved && !isRejected;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Bandeau d'en-tête de carte */}
                  <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img
                          src={item.image || item.exteriorImage || "/logo.png"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isCook
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isCook ? "🍳 Cuisinier Maison" : "🏢 Restaurant"}
                          </span>

                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : isRejected
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                            }`}
                          >
                            {isApproved
                              ? "✅ Actif sur l'app"
                              : isRejected
                              ? "❌ Refusé"
                              : "⏳ Vérification requise"}
                          </span>
                        </div>

                        <h2 className="text-lg font-black text-gray-900 mt-1">
                          {item.name || item.title}
                        </h2>
                        <p className="text-xs text-gray-500 font-medium">
                          {item.genre || "Cuisine générale"}
                        </p>
                      </div>
                    </div>

                    {/* Bouton d'action rapide / indicateur */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        ⭐ {item.rating || "5.0"}
                      </span>
                    </div>
                  </div>

                  {/* Coordonnées & Position */}
                  <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-gray-500 font-semibold">Téléphone / WhatsApp</p>
                      <p className="font-bold text-gray-900 mt-0.5">
                        📞 {item.phone || item.phoneNumber || "Non renseigné"}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500 font-semibold">Wilaya & Ville</p>
                      <p className="font-bold text-gray-900 mt-0.5">
                        📍 {item.wilaya || "Algérie"} {item.wilayaCode ? `(${item.wilayaCode})` : ""}
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <p className="text-gray-500 font-semibold">Adresse Renseignée par Carte GPS</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="font-bold text-gray-800 truncate pr-2">
                          {item.address || "Position GPS automatique"}
                        </p>
                        {item.lat && item.lng ? (
                          <a
                            href={`https://www.google.com/maps?q=${item.lat},${item.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex-shrink-0"
                          >
                            🗺️ Voir Google Maps
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Galerie des Pièces Justificatives (RC, Extérieur, Intérieur) */}
                  <div className="p-5">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                      Pièces & Documents Justificatifs Fournis
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      {/* 1. Registre de Commerce ou Pièce d'identité */}
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700 mb-1 truncate">
                          {isCook ? "Pièce d'Identité" : "Registre de Commerce"}
                        </span>
                        {item.rcDocument || item.idCardDocument ? (
                          <div
                            onClick={() =>
                              setSelectedImage({
                                url: item.rcDocument || item.idCardDocument,
                                title: isCook ? "Pièce d'Identité" : "Registre de Commerce (RC)",
                              })
                            }
                            className="h-28 rounded-xl overflow-hidden border border-gray-300 relative group cursor-pointer bg-gray-100"
                          >
                            <img
                              src={item.rcDocument || item.idCardDocument}
                              alt="Document RC"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                              🔍 Agrandir
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-2 text-center bg-gray-50">
                            <span className="text-lg mb-1">📄</span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Non fourni
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 2. Photo Extérieur / Devanture */}
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700 mb-1 truncate">
                          Extérieur / Enseigne
                        </span>
                        {item.exteriorImage || item.image ? (
                          <div
                            onClick={() =>
                              setSelectedImage({
                                url: item.exteriorImage || item.image,
                                title: "Façade & Extérieur de l'établissement",
                              })
                            }
                            className="h-28 rounded-xl overflow-hidden border border-gray-300 relative group cursor-pointer bg-gray-100"
                          >
                            <img
                              src={item.exteriorImage || item.image}
                              alt="Extérieur"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                              🔍 Agrandir
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-2 text-center bg-gray-50">
                            <span className="text-lg mb-1">🏢</span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Non fourni
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 3. Photo Intérieur / Cuisine */}
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-gray-700 mb-1 truncate">
                          Intérieur / Cuisine
                        </span>
                        {item.interiorImage ? (
                          <div
                            onClick={() =>
                              setSelectedImage({
                                url: item.interiorImage,
                                title: "Salle & Cuisine Intérieure",
                              })
                            }
                            className="h-28 rounded-xl overflow-hidden border border-gray-300 relative group cursor-pointer bg-gray-100"
                          >
                            <img
                              src={item.interiorImage}
                              alt="Intérieur"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                              🔍 Agrandir
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border border-dashed border-gray-300 flex flex-col items-center justify-center p-2 text-center bg-gray-50">
                            <span className="text-lg mb-1">🍽️</span>
                            <span className="text-[10px] text-gray-400 font-semibold">
                              Non fourni
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre d'Actions Inférieure */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-gray-500 font-medium">
                    ID: {item.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {!isApproved && (
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoading[item.id] === "approving"}
                        className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading[item.id] === "approving" ? (
                          <span className="animate-spin mr-1">⌛</span>
                        ) : (
                          "✅ Approuver & Activer sur l'App"
                        )}
                      </button>
                    )}

                    {!isRejected && (
                      <button
                        onClick={() => handleReject(item.id)}
                        disabled={actionLoading[item.id] === "rejecting"}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs px-3 py-2.5 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading[item.id] === "rejecting" ? "..." : "❌ Rejeter"}
                      </button>
                    )}

                    {isApproved && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <span>●</span> Visible et commandable par les clients
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Zoom Image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">
                {selectedImage.title || "Aperçu du document"}
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-gray-400 hover:text-gray-700 font-black text-xl p-1"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-gray-900 flex items-center justify-center max-h-[75vh]">
              <img
                src={selectedImage.url}
                alt="Document en grand"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-right">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerVerifications;

