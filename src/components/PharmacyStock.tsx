import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Check, ShieldAlert, ArrowUpRight, ShieldCheck, AlertTriangle } from "lucide-react";
import { InventoryItem } from "../types.ts";

interface PharmacyStockProps {
  token: string | null;
  userRole: string;
}

export const PharmacyStock: React.FC<PharmacyStockProps> = ({ token, userRole }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "MEDICINE",
    quantity: 0,
    threshold: 10,
    price: 0,
    expiryDate: "",
    supplier: "",
    location: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le stock");
      setItems(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.sku || formData.price <= 0 || formData.quantity < 0) {
      setError("Les champs Nom, SKU, Prix et Quantité initiale sont requis.");
      return;
    }

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Echec de chargement de l'article");

      setSuccess("Nouvel article enregistré en pharmacie !");
      setFormData({
        name: "",
        sku: "",
        category: "MEDICINE",
        quantity: 0,
        threshold: 10,
        price: 0,
        expiryDate: "",
        supplier: "",
        location: ""
      });
      setShowAddForm(false);
      fetchItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdjustQuantity = async (id: string, currentQty: number, adjustment: number) => {
    setError("");
    setSuccess("");
    const finalQty = currentQty + adjustment;
    if (finalQty < 0) {
      setError("Le stock final disponible d'un médicament ne peut pas être inférieur à zéro.");
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: finalQty })
      });
      if (!response.ok) throw new Error("Impossible d'ajuster le stock.");
      setSuccess("Quantité de stock réajustée avec mise à jour immédiate.");
      fetchItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredItems = items.filter(item => {
    const term = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(term) || item.sku.toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="pharmacy-stock-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Pill className="h-5 w-5 text-teal-600 mr-2" />
            Pharmacie & Gestion de Stock Officine
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Suivi des approvisionnements, alertes de péremption, stocks critiques et inventaire de dispensation.
          </p>
        </div>
        {(userRole === "PHARMACIST" || userRole === "ADMIN") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="add-medicine-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Produit / Lot
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="add-medicine-form">
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm text-gray-750 uppercase tracking-wider mb-1">Enregistrement de Produit Pharmaceutique</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Désignation Générique <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Paracétamol Biogaran 1g Effervescent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro SKU de Lot / Code barre <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. SKU-PARA-1000G"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Catégorie pharmacologique</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="MEDICINE">Médicament Curatif</option>
              <option value="CONSUMABLE">Consommable de soin (Seringues, Gants)</option>
              <option value="EQUIPMENT">Équipement (Tensiomètres, Lecteurs GA)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix de Vente Unitaire (FCFA) <span className="text-rose-500">*</span></label>
            <input
              type="number"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="3500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantité Initiale en Stock <span className="text-rose-500">*</span></label>
            <input
              type="number"
              value={formData.quantity}
              onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="100"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Seuil minimal d'alerte critique</label>
            <input
              type="number"
              value={formData.threshold}
              onChange={e => setFormData({ ...formData, threshold: parseInt(e.target.value) || 10 })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date d'Expiration (Péremption)</label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Grossiste / Laboratoire Fournisseur</label>
            <input
              type="text"
              value={formData.supplier}
              onChange={e => setFormData({ ...formData, supplier: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Laborex Mali"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Emplacement rayon physique</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Étagère C - Range 1"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              Enregistrer en Stock
            </button>
          </div>
        </form>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Item inventory Search + Table */}
      <div className="p-6">
        <div className="flex bg-slate-100 items-center px-3.5 py-2.5 rounded-xl border border-gray-200 mb-6 max-w-sm">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Rechercher par libellé ou SKU complet..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading pharmacopeia registry...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun article pharmaceutique trouvé dans la pharmacopée officinale.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="inventory-table">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Libellé Article</th>
                  <th className="py-3 px-4 font-normal">Numéro SKU</th>
                  <th className="py-3 px-4 font-normal">Emplacement</th>
                  <th className="py-3 px-4 font-normal">Date Péremption</th>
                  <th className="py-3 px-4 font-normal">Prix Public</th>
                  <th className="py-3 px-4 font-normal text-center">Quantité Restante</th>
                  <th className="py-3 px-4 text-right">Ravitaillement dispensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredItems.map(item => {
                  const isLowStock = item.quantity <= item.threshold;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-semibold text-gray-900">
                        {item.name}
                        {isLowStock && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Rupture Proche ({item.threshold})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">{item.sku}</td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">{item.location || "-"}</td>
                      <td className="py-3.5 px-4 font-mono text-xs text-gray-500">{item.expiryDate || "Inconnu"}</td>
                      <td className="py-3.5 px-4 font-semibold text-gray-950">{item.price.toLocaleString("fr-FR")} FCFA</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-xl text-xs font-bold ${
                          isLowStock ? "bg-red-50 text-red-700 border border-red-150" : "bg-teal-50 text-teal-800 border border-teal-150"
                        }`}>
                          {item.quantity} unités
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {(userRole === "PHARMACIST" || userRole === "ADMIN") ? (
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => handleAdjustQuantity(item.id, item.quantity, 10)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer"
                              title="+10 Boîtes"
                            >
                              +10 Boîtes
                            </button>
                            <button
                              onClick={() => handleAdjustQuantity(item.id, item.quantity, -1)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 cursor-pointer"
                              title="-1 Boîte dispensé"
                            >
                              Dispensation (-1)
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">Consultez Pharmacien</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
