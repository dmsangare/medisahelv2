import { useState, FormEvent } from "react";
import { Invoice, Patient } from "../types";
import { 
  Check, CreditCard, DollarSign, Wallet, FileText, Printer, 
  CheckCircle2, TrendingUp, Percent, Calculator, ArrowRight, 
  XCircle, AlertTriangle, Eye, ArrowDownRight, ArrowUpRight, Search, Clock, Calendar
} from "lucide-react";

interface BillingViewProps {
  invoices: Invoice[];
  patients: Patient[];
  onPayInvoice: (invoiceId: string, paymentMode: Invoice["modePaiement"]) => void;
  onAddInvoice: (newInvoice: Omit<Invoice, "id" | "statut" | "dateEmission"> & { remisePourcent?: number; isAvoir?: boolean }) => void;
  accentColor: string;
}

export default function BillingView({
  invoices,
  patients,
  onPayInvoice,
  onAddInvoice,
  accentColor
}: BillingViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"factures" | "devis" | "avoirs" | "ledger">("factures");
  const [filterStatut, setFilterStatut] = useState<"Tous" | "Payé" | "Impayé">("Tous");
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Guided Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [docType, setDocType] = useState<"facture" | "avoir">("facture");
  const [designation, setDesignation] = useState("");
  const [montantRaw, setMontantRaw] = useState<number>(0);
  const [remisePourcent, setRemisePourcent] = useState<number>(0);

  // Receipt Modal State (resolves iFrame window.open blocking)
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<Invoice | null>(null);

  // Quotes (Devis) state
  const [devisList, setDevisList] = useState<Array<any>>([
    { id: "DEV-2026-0001", patientNom: "Ousmane Diarra", total: 120000, date: "2026-05-15", detail: "Bilan biologique + ECG d'épreuve" },
    { id: "DEV-2026-0002", patientNom: "Kadiatou Touré", total: 350000, date: "2026-05-20", detail: "Forfait accouchement césarienne maternité" }
  ]);

  // Cash Ledger closing status variables
  const [physicalCashInput, setPhysicalCashInput] = useState<number>(0);
  const [closingMessage, setClosingMessage] = useState<string | null>(null);

  // Double entry accounting ledger mock (extracted logically from payments)
  const paidInvoices = invoices.filter(i => i.statut === "Payé");
  const totalFinancialFlow = invoices.reduce((sum, item) => sum + (item.montantTotal * (item.isAvoir ? -1 : 1)), 0);

  const cashClosingTotal = paidInvoices.reduce((sum, current) => sum + current.montantPatiente, 0);
  const assuranceClosingTotal = paidInvoices.reduce((sum, current) => sum + current.montantAssurance, 0);

  const orangeMoneyTotal = paidInvoices
    .filter(i => i.modePaiement === "Orange Money")
    .reduce((sum, i) => sum + i.montantPatiente, 0);
  const waveTotal = paidInvoices
    .filter(i => i.modePaiement === "Wave")
    .reduce((sum, i) => sum + i.montantPatiente, 0);
  const cashTotal = paidInvoices
    .filter(i => i.modePaiement === "Espèces")
    .reduce((sum, i) => sum + i.montantPatiente, 0);

  // Real-time calculation helpers (creates visual guidance in current form)
  const activePatient = patients.find(p => p.id === selectedPatientId);
  const discountedTotal = Math.round(montantRaw * (1 - (remisePourcent / 100)));
  
  // Calculate insurance coverage based on patient model
  let activeCoveragePercent = 0;
  if (activePatient) {
    if (activePatient.assurance.includes("70%")) activeCoveragePercent = 0.7;
    else if (activePatient.assurance.includes("80%")) activeCoveragePercent = 0.8;
    else if (activePatient.assurance.includes("50%")) activeCoveragePercent = 0.5;
    else if (activePatient.assurance.includes("90%")) activeCoveragePercent = 0.9;
  }

  const expectedAssuranceShare = Math.round(discountedTotal * activeCoveragePercent);
  const expectedPatientShare = discountedTotal - expectedAssuranceShare;

  const handleCreateInvoice = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !designation || montantRaw <= 0) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!activePatient) return;

    const isAvoirDoc = docType === "avoir";

    onAddInvoice({
      patientId: selectedPatientId,
      patientNom: `${activePatient.nom.toUpperCase()} ${activePatient.prenom}`,
      designation: isAvoirDoc ? `AVOIR / REMBOURSEMENT : ${designation}` : designation,
      montantTotal: discountedTotal,
      montantAssurance: expectedAssuranceShare,
      montantPatiente: expectedPatientShare,
      remisePourcent,
      isAvoir: isAvoirDoc
    });

    // Reset Form
    setSelectedPatientId("");
    setDesignation("");
    setMontantRaw(0);
    setRemisePourcent(0);
    setDocType("facture");
    setShowAddForm(false);

    setMessage(isAvoirDoc ? "Avoir comptable enregistré avec succès." : "Facture médicale émise avec succès.");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleConvertDevis = (dev: any) => {
    onAddInvoice({
      patientId: "MS-2026-0045",
      patientNom: dev.patientNom,
      designation: `DEVIS CONVERTI: ${dev.detail}`,
      montantTotal: dev.total,
      montantAssurance: Math.round(dev.total * 0.7), // Fallback CANAM 70%
      montantPatiente: Math.round(dev.total * 0.3)
    });

    setDevisList(prev => prev.filter(d => d.id !== dev.id));
    setMessage(`Devis ${dev.id} converti en facture active avec succès.`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCashReconciliation = () => {
    const theoreticalCash = cashTotal;
    const difference = physicalCashInput - theoreticalCash;

    if (difference === 0) {
      setClosingMessage("L'encaisse physique est rigoureusement identique au livre comptable.");
    } else if (difference > 0) {
      setClosingMessage(`Écart détecté : Excédent de +${difference.toLocaleString("fr-FR")} FCFA dans le tiroir-caisse.`);
    } else {
      setClosingMessage(`Écart critique constaté : Manque-à-gagner de ${difference.toLocaleString("fr-FR")} FCFA par rapport au logiciel.`);
    }
  };

  const handleCreateNewQuote = () => {
    const pat = patients[Math.floor(Math.random() * patients.length)];
    const prices = [45000, 150000, 32000, 15000];
    const services = ["Bilan prénatal d'épreuve", "Césarienne Maternité", "Fiche analyses imagerie", "TDR Malaria simple"];
    const idx = Math.floor(Math.random() * services.length);

    const newQuote = {
      id: `DEV-2026-${Date.now().toString().slice(-4)}`,
      patientNom: pat ? `${pat.nom.toUpperCase()} ${pat.prenom}` : "Patient Bamako",
      total: prices[idx],
      date: new Date().toISOString().split("T")[0],
      detail: services[idx]
    };

    setDevisList([newQuote, ...devisList]);
    setMessage("Nouveau devis indicatif initialisé.");
    setTimeout(() => setMessage(null), 2500);
  };

  // Filter invoices list
  const filteredInvoices = invoices.filter(inv => {
    if (filterStatut === "Payé") return inv.statut === "Payé";
    if (filterStatut === "Impayé") return inv.statut === "Impayé";
    return true;
  });

  return (
    <div className="space-y-6" id="billing-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: accentColor }} />
            <span>Gestion de la Caisse, Facturation & Prises en Charge</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Suivi financier des de guichets, déduction d'assurance (AMO / CANAM), devis et clôtures de caisse.</p>
        </div>

        {/* Local tabs select filter */}
        <div className="bg-slate-100 p-1 rounded-lg border flex items-center text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => { setActiveSubTab("factures"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "factures" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Factures & Règlements ({invoices.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("devis"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "devis" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Devis & Estimations ({devisList.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("avoirs"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "avoirs" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Registre d'Avoirs
          </button>
          <button
            onClick={() => { setActiveSubTab("ledger"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "ledger" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Clôture & Journal de Caisse
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-250 text-xs text-center font-bold">
          {message}
        </div>
      )}

      {/* Financial high level indicators grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Encaissements Espèces (Secours local)</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{cashTotal.toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[9.5px] text-slate-400 block mt-1">Pointage physique nécessaire</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Prises en Charge Tiers-Payant (AMO / CANAM)</span>
          <span className="text-xl font-bold font-mono text-sky-700">{assuranceClosingTotal.toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[9.5px] text-sky-600 block mt-1 font-semibold">Taux réglementaires validés</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Frais Mobile Money (Orange Money/Wave)</span>
          <span className="text-xl font-bold font-mono text-orange-600">{(orangeMoneyTotal + waveTotal).toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[9.5px] text-orange-400 block mt-1">Télé-réception des flux directes</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Total Journalier Brut</span>
          <span className="text-xl font-bold font-mono text-slate-900">{totalFinancialFlow.toLocaleString("fr-FR")} FCFA</span>
          <span className="text-[9.5px] text-emerald-600 font-bold block mt-1">Factures & Avoirs comptabilisés</span>
        </div>
      </div>

      {activeSubTab === "factures" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-700">Enregistrer de nouvelles opérations cliniques ?</span>
              <p className="text-[10px] text-slate-450 mt-0.5">Calculateur d'insurabilité dynamique.</p>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs py-2 px-4 rounded-xl text-white font-bold cursor-pointer transition-all hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Émettre une Facture médicale ou un Avoir
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateInvoice} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4 text-xs font-semibold animate-fade-in">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-xs font-extrabold text-slate-850 uppercase">Formulaire de Facturation Guidé</h3>
                
                {/* Document selector change */}
                <div className="bg-slate-100 p-1 rounded-lg border flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDocType("facture")}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      docType === "facture" ? "bg-white text-slate-800 shadow" : "text-slate-400"
                    }`}
                  >
                    Facture standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocType("avoir")}
                    className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                      docType === "avoir" ? "bg-red-500 text-white shadow" : "text-slate-400"
                    }`}
                  >
                    Avoir de crédit
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Dossier Patient Associé</label>
                  <select
                    required
                    className="w-full text-xs font-semibold rounded-xl border border-slate-350 p-2.5 bg-white"
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                  >
                    <option value="">-- Patient cible --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} ({p.assurance})</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Désignation de l'acte / soins cliniques</label>
                  <input
                    type="text"
                    required
                    placeholder="Consultation gynécologiques, accouchement, etc."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tarif de Référence Brut (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-300 bg-white"
                    value={montantRaw}
                    onChange={(e) => setMontantRaw(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-550 mb-1 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5 text-sky-650" /> Remise Exceptionnelle (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-300 bg-white"
                    value={remisePourcent}
                    onChange={(e) => setRemisePourcent(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Dynamic Guidance Panel */}
              {selectedPatientId && activePatient && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Assurabilité du patient</span>
                    <p className="text-[11.5px] text-slate-700 font-semibold leading-none">
                      Patient bénéficiant de : <strong className="text-sky-800 underline">{activePatient.assurance}</strong>
                    </p>
                    <p className="text-[10px] text-slate-450 leading-relaxed max-w-md">
                      MédiSahel simule la part de remboursement AMO CANAM Mali du ticket tiers-payeur.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 font-mono">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mb-1">Part canam (AMO)</span>
                      <strong className="text-sky-700 text-xs">{expectedAssuranceShare.toLocaleString("fr-FR")} F</strong>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mb-1">Ticket Modérateur</span>
                      <strong className="text-rose-700 text-xs">{expectedPatientShare.toLocaleString("fr-FR")} F</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-150 text-slate-700 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold rounded-xl cursor-pointer"
                  style={{ backgroundColor: docType === "voir" ? "#dc2626" : accentColor }}
                >
                  {docType === "voir" ? "Générer l'Avoir" : "Valider la Facture"}
                </button>
              </div>
            </form>
          )}

          {/* Satus filter tabs for invoice list */}
          <div className="flex items-center gap-1 border-b">
            <button
              onClick={() => setFilterStatut("Tous")}
              className={`p-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                filterStatut === "Tous" ? "border-sky-600 text-sky-800" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Toutes les transactions ({invoices.length})
            </button>
            <button
              onClick={() => setFilterStatut("Payé")}
              className={`p-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                filterStatut === "Payé" ? "border-emerald-600 text-emerald-800" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              Reglées / Acquittées ({invoices.filter(i => i.statut === "Payé").length})
            </button>
            <button
              onClick={() => setFilterStatut("Impayé")}
              className={`p-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                filterStatut === "Impayé" ? "border-rose-600 text-rose-800" : "border-transparent text-slate-400 hover:text-slate-700"
              }`}
            >
              En attente ticket {invoices.filter(i => i.statut === "Impayé").length}
            </button>
          </div>

          <div className="bg-white border rounded-xl overflow-hidden font-medium text-xs text-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-extrabold text-[10px] text-slate-400 border-b">
                <tr>
                  <th className="px-5 py-3.5">Référence</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Acte désigné</th>
                  <th className="px-5 py-3.5 text-right font-mono">Total Brut</th>
                  <th className="px-5 py-3.5 text-right font-sans">Prise en charge (AMO)</th>
                  <th className="px-5 py-3.5 text-right font-bold">Ticket Modérateur</th>
                  <th className="px-5 py-3.5 text-center">Règlement / Preuves</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.statut === "Payé";
                  const isAv = inv.isAvoir || inv.designation.includes("AVOIR");

                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/50 ${isAv ? "bg-rose-50/25 text-rose-950" : ""}`}>
                      <td className="px-5 py-3 font-mono font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{inv.id}</span>
                        {isAv && <span className="bg-rose-100 text-rose-700 text-[8px] px-1.5 py-0.5 rounded font-sans uppercase font-black">Avoir</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold">{inv.patientNom}</div>
                        <span className="text-[10px] text-slate-400 font-mono">({inv.patientId})</span>
                      </td>
                      <td className="px-5 py-3 italic text-slate-600">{inv.designation}</td>
                      <td className="px-5 py-3 text-right font-mono text-slate-700">{inv.montantTotal.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-right font-mono text-sky-700">-{inv.montantAssurance.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{inv.montantPatiente.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <span className="text-emerald-700 font-extrabold font-mono text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Encaissé par {inv.modePaiement}
                            </span>
                            <button
                              onClick={() => setSelectedInvoiceForReceipt(inv)}
                              className="text-[9.5px] px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-lg font-bold cursor-pointer flex items-center gap-1 transition-all"
                            >
                              <Printer className="h-3 w-3 text-slate-500" /> Aperçu Reçu
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 justify-center items-center">
                            <div className="flex gap-1 justify-center flex-wrap max-w-[150px]">
                              <button
                                onClick={() => onPayInvoice(inv.id, "Espèces")}
                                className="px-1.5 py-0.5 bg-emerald-55 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded text-[9px] font-extrabold cursor-pointer hover:bg-emerald-200 uppercase"
                                title="Règlement par Espèces"
                              >
                                Espèces
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Orange Money")}
                                className="px-1.5 py-0.5 bg-orange-100 border border-orange-200 text-orange-850 rounded text-[9px] font-extrabold cursor-pointer hover:bg-orange-200 uppercase"
                                title="Règlement par Orange Money"
                              >
                                OM
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Wave")}
                                className="px-1.5 py-0.5 bg-cyan-100 border border-cyan-200 text-cyan-850 rounded text-[9px] font-extrabold cursor-pointer hover:bg-cyan-200 uppercase"
                                title="Règlement par Wave"
                              >
                                Wave
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Moov Money")}
                                className="px-1.5 py-0.5 bg-blue-100 border border-blue-200 text-blue-800 rounded text-[9px] font-extrabold cursor-pointer hover:bg-blue-200 uppercase"
                                title="Règlement par Moov Money"
                              >
                                Moov
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Carte bancaire")}
                                className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 text-slate-700 rounded text-[9px] font-extrabold cursor-pointer hover:bg-slate-200 uppercase"
                                title="Règlement par Carte de Crédit"
                              >
                                CB
                              </button>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Canal de versement</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "devis" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
          <div className="flex justify-between items-center border-b pb-3.5 border-slate-100">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Registre des Estimations de tarifs (Devis)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Indications de tarifications cliniques à titre informatif, transformables en factures réglementaires.</p>
            </div>
            <button
              onClick={handleCreateNewQuote}
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-3.5 rounded-lg text-xs transition-all cursor-pointer"
            >
              Émettre un Devis Indicatif
            </button>
          </div>

          <div className="space-y-3">
            {devisList.map(dev => (
              <div key={dev.id} className="p-4 bg-slate-50 border border-slate-205 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-medium">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">{dev.id}</span>
                    <h4 className="font-bold text-slate-900">{dev.patientNom}</h4>
                  </div>
                  <p className="text-slate-500 text-[11px] pt-1">Prestation: <strong>{dev.detail}</strong></p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-0.5">Généré le: {dev.date}</span>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <span className="font-mono font-bold text-slate-900 bg-slate-200/50 p-1 px-2.5 rounded">{dev.total.toLocaleString("fr-FR")} FCFA</span>
                  <button
                    onClick={() => handleConvertDevis(dev)}
                    className="p-1 px-3 bg-[#0284c7] hover:bg-sky-700 text-white text-[10px] rounded font-bold uppercase cursor-pointer"
                  >
                    Activer Facture <ArrowRight className="h-3 w-3 inline ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "avoirs" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <XCircle className="h-4.5 w-4.5 text-red-650" /> Registre d'avoirs & remboursements de caisse
          </h3>
          <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">
            Toute correction comptable sur double-écriture doit être émise sous forme d'avoir, réduisant le grand livre journalier pour conserver une parfaite conformité avec la loi fiscale.
          </p>

          <div className="space-y-3">
            {invoices.filter(i => i.isAvoir || i.designation.includes("AVOIR")).map(inv => (
              <div key={inv.id} className="p-4 bg-red-50/20 border border-red-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-red-800">{inv.patientNom}</h4>
                  <p className="text-slate-500 mt-0.5">Observation : {inv.designation}</p>
                  <span className="text-[10.5px] font-mono text-slate-400">{inv.id} • Émise le {inv.dateEmission ? String(inv.dateEmission).slice(0, 10) : "2026-05-31"}</span>
                </div>
                <strong className="text-red-700 font-mono text-sm">-{inv.montantTotal.toLocaleString("fr-FR")} FCFA</strong>
              </div>
            ))}
            {invoices.filter(i => i.isAvoir || i.designation.includes("AVOIR")).length === 0 && (
              <p className="text-center py-6 text-slate-400 italic font-medium">Aucun avoir émis au cours de cette session.</p>
            )}
          </div>
        </div>
      )}

      {activeSubTab === "ledger" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cash balancing closing procedures */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-semibold space-y-4 h-fit">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 font-sans">
              <Calculator className="h-4.5 w-4.5 text-sky-650" /> Pointage physique de la caisse
            </h3>

            <div className="space-y-2">
              <div>
                <span className="text-[10px] text-slate-450 uppercase font-black block">Fonds Cash Théorique :</span>
                <strong className="text-slate-800 text-sm font-mono">{cashTotal.toLocaleString("fr-FR")} FCFA</strong>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Encaisse Réelle Comptée (Tiroir) :</label>
                <input
                  type="number"
                  placeholder="Saisir la monnaie physique présente"
                  className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-300 bg-white"
                  value={physicalCashInput}
                  onChange={(e) => setPhysicalCashInput(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <button
              onClick={handleCashReconciliation}
              className="w-full text-white font-bold p-2.5 rounded-xl cursor-pointer text-center text-xs hover:opacity-95"
              style={{ backgroundColor: accentColor }}
            >
              Faire Réconciliation
            </button>

            {closingMessage && (
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl text-[11px] text-slate-650 leading-relaxed font-semibold italic border-l-4 border-l-amber-500 font-mono">
                {closingMessage}
              </div>
            )}
          </div>

          {/* Double entry journals database */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 font-sans flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-slate-500 animate-pulse" />
              <span>Journal des entrées de caisse (Temps-Réel)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-medium text-[11px]">
                <thead className="bg-slate-50 font-extrabold uppercase text-[9.5px] text-slate-400 border-b">
                  <tr>
                    <th className="px-3 py-2">ID Pièce</th>
                    <th className="px-3 py-2">Imputation Débit (+)</th>
                    <th className="px-3 py-2">Imputation Crédit (-)</th>
                    <th className="px-3 py-2 text-right">Montant Réglé</th>
                    <th className="px-3 py-2 text-center">Canal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-slate-600 font-mono">
                  {paidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-slate-850">{inv.id}</td>
                      <td className="px-3 py-2 text-emerald-800 font-black">511 (Avoir Liquidité Caisse)</td>
                      <td className="px-3 py-2 text-slate-500 text-[10px]">706 (Honoraire Actes Soins)</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{inv.montantPatiente.toLocaleString("fr-FR")}</td>
                      <td className="px-3 py-2 text-center text-[10px] font-sans font-extrabold text-emerald-700 bg-emerald-50 rounded">
                        {inv.modePaiement}
                      </td>
                    </tr>
                  ))}
                  {assuranceClosingTotal > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-sky-850">AMO-MALI</td>
                      <td className="px-3 py-2 text-sky-800 font-black">4112 (Créance Organisme CANAM)</td>
                      <td className="px-3 py-2 text-slate-500 text-[10px]">706 (Tiers-Payeur Remboursable)</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{assuranceClosingTotal.toLocaleString("fr-FR")}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] text-amber-700 font-bold font-sans animate-pulse bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">Traitement AMO</span>
                      </td>
                    </tr>
                  )}
                  {paidInvoices.length === 0 && assuranceClosingTotal === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 italic">Aucune écriture comptable active aujourd'hui.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stunning thermal printer receipt preview modal (Saves iframe blockers!) */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in" id="receipt-modal-gate">
          <div className="max-w-md w-full bg-slate-100 rounded-2xl shadow-2xl p-5 space-y-4 border border-slate-350 overflow-hidden transform duration-200 max-h-[90vh] flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 pb-1 justify-center">
              <Printer className="h-4 w-4 animate-bounce" /> Aperçu d'impression MédiSahel 2026
            </h3>

            {/* Thermal Slip Simulation Sheet */}
            <div className="bg-white border-2 border-slate-300 rounded-lg p-5 font-mono text-[11px] text-slate-900 overflow-y-auto flex-1 select-none pointer-events-none" id="thermal-receipt-sheet">
              <div className="text-center space-y-0.5 mb-2">
                <h4 className="text-base font-black tracking-tighter uppercase leading-none">CLINIQUE MÉDISAHEL</h4>
                <p className="text-[9px] text-slate-500 font-bold">L'Excellence Clinique & Proximité</p>
                <p className="text-[9px] text-slate-400 leading-none">Bamako Quartier du Fleuve — Mali</p>
                <p className="text-[9px] text-slate-450">Tél: 20 22 45 45 / 44 24 24 00</p>
              </div>

              <div className="border-t border-dashed border-slate-450 my-2"></div>
              
              <div className="text-center font-bold text-xs">🧾 PIÈCE JUSTIFICATIVE ACQUITTEE</div>
              <div className="text-center text-[9px] text-slate-500">ID Reçu : {selectedInvoiceForReceipt.id}</div>
              
              <div className="border-b border-dashed border-slate-450 my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>DATE :</span>
                  <span className="font-bold">{new Date().toISOString().replace("T", " ").slice(0, 16)} UTC</span>
                </div>
                <div className="flex justify-between">
                  <span>DOSSIER CLINIQUE :</span>
                  <span className="font-bold">{selectedInvoiceForReceipt.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT(E) :</span>
                  <span className="font-bold uppercase text-[10px]">{selectedInvoiceForReceipt.patientNom}</span>
                </div>
                {selectedInvoiceForReceipt.caissier && (
                  <div className="flex justify-between">
                    <span>OPERATEUR CAISSE :</span>
                    <span className="font-bold">{selectedInvoiceForReceipt.caissier}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-450 my-2"></div>

              <strong className="block italic mb-1.5">Actes & Soins Administrés :</strong>
              <div className="flex justify-between font-sans text-slate-700">
                <span className="text-[10px] leading-tight">• {selectedInvoiceForReceipt.designation}</span>
                <span className="font-mono text-[11px] font-extrabold shrink-0">{selectedInvoiceForReceipt.montantTotal.toLocaleString("fr-FR")} FCFA</span>
              </div>

              <div className="border-t border-dashed border-slate-450 my-2"></div>

              <div className="space-y-0.5">
                <div className="flex justify-between">
                  <span>Bilan total brut :</span>
                  <span className="font-bold">{selectedInvoiceForReceipt.montantTotal.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between text-sky-850">
                  <span>AMO Prise En Charge (70%) :</span>
                  <span className="font-bold">-{selectedInvoiceForReceipt.montantAssurance.toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between text-[12px] font-black border-t pt-1">
                  <span>TICKET MODERATEUR :</span>
                  <span>{selectedInvoiceForReceipt.montantPatiente.toLocaleString("fr-FR")} F</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-450 my-2"></div>
              
              <div className="flex justify-between">
                <span>RÈGLEMENT :</span>
                <span className="font-bold uppercase text-emerald-800">{selectedInvoiceForReceipt.modePaiement}</span>
              </div>
              <div className="flex justify-between">
                <span>STATUT TRANSACTION :</span>
                <span className="font-bold text-emerald-800 font-sans tracking-tight">APPROUVÉE / VALIDE</span>
              </div>

              <div className="border-t border-dashed border-slate-450 my-3"></div>
              
              <div className="text-center font-bold text-[9px] italic text-slate-500 leading-snug">
                MédiSahel vous remercie de votre confiance.<br/>Prenez soin de vous !
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedInvoiceForReceipt(null)}
                className="flex-1 py-2.5 bg-slate-205 border border-slate-350 rounded-xl hover:bg-slate-300 text-slate-755 font-bold cursor-pointer text-xs uppercase"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer text-xs uppercase shadow-md"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer le ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
