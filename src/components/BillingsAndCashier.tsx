import React, { useState, useEffect } from "react";
import { HandCoins, ChevronRight, Search, Plus, Check, ShieldAlert, BadgeDollarSign, Wallet, Percent, CircleEllipsis } from "lucide-react";
import { Transaction, Patient } from "../types.ts";

interface BillingsAndCashierProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const BillingsAndCashier: React.FC<BillingsAndCashierProps> = ({ token, patients, userRole }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    type: "INVOICE",
    amount: 0,
    paymentMethod: "CASH",
    description: "",
    status: "UNPAID"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les transactions");
      setTransactions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || formData.amount <= 0 || !formData.description) {
      setError("Le patient, la description et un montant valide sont obligatoires.");
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Echec de l'enregistrement de la facture");

      setSuccess("Facture enregistrée avec succès !");
      setFormData({ patientId: "", type: "INVOICE", amount: 0, paymentMethod: "CASH", description: "", status: "UNPAID" });
      setShowAddForm(false);
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "PAID" | "UNPAID" | "PARTIAL") => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error("Échec d'encaissement");
      setSuccess("Statut de la facture mis à jour avec archivage immédiat.");
      fetchTransactions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPatientName = (id: string) => {
    const p = patients.find(p => p.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient Externe";
  };

  // Compute stats
  const totalRevenue = transactions
    .filter(t => t.status === "PAID")
    .reduce((sum, curr) => sum + curr.amount, 0);

  const pendingRevenue = transactions
    .filter(t => t.status === "UNPAID")
    .reduce((sum, curr) => sum + curr.amount, 0);

  const totalInvoiced = transactions.reduce((sum, curr) => sum + curr.amount, 0);

  return (
    <div className="space-y-6" id="billing-caise-dashboard">
      {/* Overview Stat Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Encaissé Réel</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {totalRevenue.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Fonds validés en caisse</p>
          </div>
          <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Recettes En Attente</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {pendingRevenue.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Factures émises non payées</p>
          </div>
          <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
            <Wallet className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Total Facturé</span>
            <div className="text-2xl font-black text-slate-800 mt-1">
              {totalInvoiced.toLocaleString("fr-FR")} FCFA
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Volume global d'actes</p>
          </div>
          <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-gray-600">
            <Percent className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Billing Table card */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
              <HandCoins className="h-5 w-5 text-teal-600 mr-2" />
              Facturation & Caisse Établissement
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Émission de factures cliniques, encaissement de mobiles-money, assurances et guichet de pharmacie.
            </p>
          </div>
          {(userRole === "CASHIER" || userRole === "ADMIN") && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
              id="new-invoice-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Émettre une Facture / Reçu
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="billing-form">
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-1">Génération d'Acte Financier</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Associer à un Patient <span className="text-rose-500">*</span></label>
              <select
                value={formData.patientId}
                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="">-- Choisir un patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Montant Acte (FCFA) <span className="text-rose-500">*</span></label>
              <input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
                placeholder="e.g. 15000"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Méthode de paiement envisagée / utilisée</label>
              <select
                value={formData.paymentMethod}
                onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="CASH">Espèces (CASH)</option>
                <option value="MOBILE_MONEY">Orange Money / Moov Money</option>
                <option value="CARD">Carte Bancaire Visa/Mastercard</option>
                <option value="INSURANCE">Assurance maladie (Prise en charge)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Détails de l'Acte ou Prestation <span className="text-rose-500">*</span></label>
              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
                placeholder="e.g. Echographie Abdominale + Prise de sang NFS"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Statut Initial</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="UNPAID">Non Payé</option>
                <option value="PAID">Payé d'avance / Reçu d'espèces</option>
                <option value="PARTIAL">Paiement Partiel</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-750 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
              >
                Valider l'Acte Facture
              </button>
            </div>
          </form>
        )}

        {/* Feedback indicators */}
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

        {/* Transactions Table */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-10 font-mono text-sm text-gray-400">Loading ledger transaction list...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              Aucune facture ou reçu n'a encore été émis aujourd'hui.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse" id="billing-ledger-table">
                <thead>
                  <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                    <th className="py-3 px-4 font-normal"> Patient</th>
                    <th className="py-3 px-4 font-normal">Désignation</th>
                    <th className="py-3 px-4 font-normal">Montant</th>
                    <th className="py-3 px-4 font-normal font-mono">Paiement</th>
                    <th className="py-3 px-4 font-normal">État Facture</th>
                    <th className="py-3 px-4 font-normal">Encaissé Par</th>
                    <th className="py-3 px-4 text-right">Actions caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {transactions.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-gray-900">
                        {getPatientName(item.patientId)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 font-medium">
                        {item.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-950">
                        {item.amount.toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-gray-200 text-xs text-gray-600 font-mono font-semibold uppercase">
                          {item.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.status === "PAID" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Encaissé
                          </span>
                        ) : item.status === "UNPAID" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            Impayé
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Partiel
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-500 font-medium">
                        {item.cashierName}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status !== "PAID" && (userRole === "CASHIER" || userRole === "ADMIN") ? (
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(item.id, "PAID")}
                              className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Valider Caisse (Reçu)
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(item.id, "PARTIAL")}
                              className="px-2 py-1 border border-amber-300 text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              Partiel
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono font-medium">Archivé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
