import { useState, FormEvent } from "react";
import { Invoice, Patient } from "../types";
import { Check, CreditCard, DollarSign, Wallet, FileText, Printer, CheckCircle2, TrendingUp, Percent, Calculator, ArrowRight, XCircle, AlertTriangle } from "lucide-react";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form states
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [designation, setDesignation] = useState("");
  const [montantRaw, setMontantRaw] = useState(0);
  const [remisePourcent, setRemisePourcent] = useState(0);

  // Quotes (Devis) state
  const [devisList, setDevisList] = useState<Array<any>>([
    { id: "DEV-2026-0001", patientNom: "Ousmane Diarra", total: 120000, date: "2026-05-15", detail: "Bilan biologique + ECG d'épreuve" },
    { id: "DEV-2026-0002", patientNom: "Kadiatou Touré", total: 350000, date: "2026-05-20", detail: "Forfait accouchement césarienne maternité" }
  ]);

  // Cash Ledger closing status variables
  const [physicalCashInput, setPhysicalCashInput] = useState(0);
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

  const handleCreateInvoice = (e: FormEvent, customIsAvoir = false) => {
    e.preventDefault();
    if (!selectedPatientId || !designation || montantRaw <= 0) {
      alert("Tous les champs sont requis.");
      return;
    }

    const pat = patients.find(p => p.id === selectedPatientId);
    if (!pat) return;

    // Direct discount evaluation
    const discountedTotal = Math.round(montantRaw * (1 - (remisePourcent / 100)));

    let coveragePercent = 0;
    if (pat.assurance.includes("70%")) coveragePercent = 0.7;
    else if (pat.assurance.includes("80%")) coveragePercent = 0.8;
    else if (pat.assurance.includes("50%")) coveragePercent = 0.5;
    else if (pat.assurance.includes("90%")) coveragePercent = 0.9;

    const amtAssur = Math.round(discountedTotal * coveragePercent);
    const amtPatient = discountedTotal - amtAssur;

    onAddInvoice({
      patientId: selectedPatientId,
      patientNom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      designation: customIsAvoir ? `AVOIR / RECUR : ${designation}` : designation,
      montantTotal: discountedTotal,
      montantAssurance: amtAssur,
      montantPatiente: amtPatient,
      remisePourcent,
      isAvoir: customIsAvoir
    });

    // Reset Form
    setSelectedPatientId("");
    setDesignation("");
    setMontantRaw(0);
    setRemisePourcent(0);
    setShowAddForm(false);

    setMessage(customIsAvoir ? "Avoir / remboursement enregistré avec succès." : "Facture émise avec succès.");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleConvertDevis = (dev: any) => {
    // Generate invoice based on devis details
    onAddInvoice({
      patientId: "MS-2026-0045", // default target
      patientNom: dev.patientNom,
      designation: `CONVERTED DEVIS: ${dev.detail}`,
      montantTotal: dev.total,
      montantAssurance: Math.round(dev.total * 0.7), // default AMO 70%
      montantPatiente: Math.round(dev.total * 0.3)
    });

    setDevisList(prev => prev.filter(d => d.id !== dev.id));
    setMessage(`Devis ${dev.id} converti avec succès en Facture active.`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleCashReconciliation = () => {
    const theoreticalCash = cashTotal;
    const difference = physicalCashInput - theoreticalCash;

    if (difference === 0) {
      setClosingMessage("Clôture parfaite. Le cash physique correspond exactement à la caisse du logiciel.");
    } else if (difference > 0) {
      setClosingMessage(`Incohérence : Excédent détecté de +${difference} FCFA en caisse physique.`);
    } else {
      setClosingMessage(`Incohérence : Déficit de ${difference} FCFA par rapport aux comptes informatisés.`);
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

  return (
    <div className="space-y-6" id="billing-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-205 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" style={{ color: accentColor }} />
            <span>Caisse, Facturation & Prises en Charge</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">Suivi financier de guichet, déduction d'assurance CNSS / AMO, devis et clôtures de caisse.</p>
        </div>

        {/* Local tabs select filter */}
        <div className="bg-slate-100 p-1 rounded-lg border flex items-center text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => { setActiveSubTab("factures"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "factures" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Factures ({invoices.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("devis"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "devis" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Devis ({devisList.length})
          </button>
          <button
            onClick={() => { setActiveSubTab("avoirs"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "avoirs" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Avoirs
          </button>
          <button
            onClick={() => { setActiveSubTab("ledger"); setShowAddForm(false); }}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeSubTab === "ledger" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Clôtures Caisse
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
        <div className="bg-white p-5 rounded-xl border border-slate-200/85">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Fonds de Caisse Patient (Cash)</span>
          <span className="text-xl font-bold font-mono text-emerald-700">{cashTotal.toLocaleString("fr-FR")} F</span>
          <span className="text-[9.5px] text-slate-400 block mt-1 hover:underline">Vérifier coffre-fort</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/85">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Créances Tiers-Payant Assurances</span>
          <span className="text-xl font-bold font-mono text-sky-700">{assuranceClosingTotal.toLocaleString("fr-FR")} F</span>
          <span className="text-[9.5px] text-sky-600 block mt-1 font-semibold">Taux d'épreuve AMO CANAM</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/85">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Flux Orange Money & Moov</span>
          <span className="text-xl font-bold font-mono text-orange-650">{orangeMoneyTotal.toLocaleString("fr-FR")} F</span>
          <span className="text-[9.5px] text-orange-400 block mt-1 font-mono">Simulateur synchrone</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/85">
          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Revenu Journalier Net</span>
          <span className="text-xl font-bold font-mono text-slate-900">{totalFinancialFlow.toLocaleString("fr-FR")} F</span>
          <span className="text-[9.5px] text-emerald-650 font-bold block mt-1">Solde de référence stable</span>
        </div>
      </div>

      {activeSubTab === "factures" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200/80">
            <span className="text-xs font-semibold text-slate-500">Besoin d'enregistrer une encaissement ou traitement ?</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs py-1.5 px-3.5 rounded text-white font-bold cursor-pointer transition-all"
              style={{ backgroundColor: accentColor }}
            >
              Émettre une Facture médicale
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={(e) => handleCreateInvoice(e, false)} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 text-xs font-semibold">
              <h3 className="text-xs font-extrabold text-slate-850 uppercase border-b pb-2">Nouvelle Facture de Prestations Cliniques</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Sélectionner le Dossier Patient</label>
                  <select
                    required
                    className="w-full text-xs font-semibold rounded border border-slate-350 p-2 bg-white"
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
                    className="w-full text-xs p-2 rounded border border-slate-300"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Montant Brut d'acte (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    className="w-full text-xs font-bold font-mono p-2 rounded border border-slate-300"
                    value={montantRaw}
                    onChange={(e) => setMontantRaw(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-550 mb-1 flex items-center gap-1">
                    <Percent className="h-3 w-3 text-sky-650" /> Remise Spéciale (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full text-xs font-bold font-mono p-2 rounded border border-slate-300"
                    value={remisePourcent}
                    onChange={(e) => setRemisePourcent(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={(e) => handleCreateInvoice(e, true)}
                  className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded cursor-pointer font-bold"
                >
                  Émettre un Avoir / Retrait
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white font-bold rounded cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  Valider la Facture
                </button>
              </div>
            </form>
          )}

          {/* List display invoices of clinical treatments */}
          <div className="bg-white border rounded-xl overflow-hidden font-medium text-xs text-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-extrabold text-[10px] text-slate-400 border-b">
                <tr>
                  <th className="px-5 py-3.5">Référence</th>
                  <th className="px-5 py-3.5">Patient</th>
                  <th className="px-5 py-3.5">Acte désigné</th>
                  <th className="px-5 py-3.5 text-right font-mono">Total Net</th>
                  <th className="px-5 py-3.5 text-right font-sans">AMO CANAM (70%)</th>
                  <th className="px-5 py-3.5 text-right font-bold">Ticket Modérateur</th>
                  <th className="px-5 py-3.5 text-center">Encaissement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const isPaid = inv.statut === "Payé";
                  const isAv = inv.isAvoir || inv.designation.includes("AVOIR");

                  return (
                    <tr key={inv.id} className={`hover:bg-slate-50/50 ${isAv ? "bg-red-50/10 text-red-950" : ""}`}>
                      <td className="px-5 py-3 font-mono font-bold text-slate-800">
                        {inv.id} {isAv && <span className="bg-red-200 text-red-800 text-[8px] px-1 font-sans rounded">AVOIR</span>}
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-bold">{inv.patientNom}</div>
                        <span className="text-[10px] text-slate-400 font-mono">({inv.patientId})</span>
                      </td>
                      <td className="px-5 py-3 italic">{inv.designation}</td>
                      <td className="px-5 py-3 text-right font-mono">{inv.montantTotal.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-right font-mono text-sky-700">-{inv.montantAssurance.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{inv.montantPatiente.toLocaleString("fr-FR")} F</td>
                      <td className="px-5 py-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <div className="flex flex-col items-center gap-1.5 justify-center">
                            <span className="text-emerald-700 font-black font-mono text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> {inv.modePaiement}
                            </span>
                            <button
                              onClick={() => {
                                const pWind = window.open("", "_blank");
                                if (!pWind) return;
                                pWind.document.write(`
                                  <html>
                                    <head>
                                      <title>REÇU CLOTURE DE TRANSACTION - #${inv.id}</title>
                                      <style>
                                        body { font-family: 'Courier New', Courier, monospace; padding: 30px; color: #0a0a0a; max-width: 440px; margin: auto; border: 2px dashed #0a0a0a; line-height: 1.4; }
                                        .center { text-align: center; }
                                        .bold { font-weight: bold; }
                                        .uppercase { text-transform: uppercase; }
                                        .line { border-bottom: 1px dashed #000; margin: 15px 0; }
                                        .flex-row { display: flex; justify-content: space-between; }
                                        .logo { font-size: 20px; font-weight: 900; letter-spacing: 1px; }
                                        .badge { border: 1px solid #000; padding: 2px 6px; display: inline-block; font-size: 11px; font-weight: bold; }
                                      </style>
                                    </head>
                                    <body onload="window.print()">
                                      <div class="center logo">CLINIQUE MÉDISAHEL</div>
                                      <div class="center bold">PROXIMITÉ & EXCELLENCE SÉCURISÉE</div>
                                      <div class="center">BAMAKO QUARTIER DE FLEUVE, MALI</div>
                                      <div class="center">Tél: +223 20 22 45 45 / 44 24 24 00</div>
                                      <div class="line"></div>
                                      <div class="center bold uppercase">🧾 REÇU DE PAIEMENT ACQUITTÉ</div>
                                      <div class="center font-mono">ID Reçu: ${inv.id}</div>
                                      <div class="line"></div>
                                      <div class="flex-row"><span>Date:</span> <span class="bold">${new Date().toISOString().replace("T", " ").slice(0, 16)} GMT</span></div>
                                      <div class="flex-row"><span>Dossier Cible:</span> <span class="bold font-mono">${inv.patientId}</span></div>
                                      <div class="flex-row"><span>Patient(e):</span> <span class="bold uppercase">${inv.patientNom}</span></div>
                                      <div class="line"></div>
                                      <div class="bold italic">Prestations médicales:</div>
                                      <div class="flex-row"><span>• ${inv.designation}</span> <span class="bold font-mono">${inv.montantTotal.toLocaleString("fr-FR")} FCFA</span></div>
                                      <div class="line"></div>
                                      <div class="flex-row"><span>Frais Total d'Actes:</span> <span class="font-mono">${inv.montantTotal.toLocaleString("fr-FR")} FCFA</span></div>
                                      <div class="flex-row text-sky-800"><span>AMO Prise en Charge (70%):</span> <span class="font-mono">-${inv.montantAssurance.toLocaleString("fr-FR")} FCFA</span></div>
                                      <div class="flex-row font-bold text-[13px]"><span>Montant Ticket Modérateur:</span> <span class="font-mono">${inv.montantPatiente.toLocaleString("fr-FR")} FCFA</span></div>
                                      <div class="line"></div>
                                      <div class="flex-row"><span>Mode de règlement:</span> <span class="bold uppercase">${inv.modePaiement}</span></div>
                                      <div class="flex-row"><span>Prélèvements Taxes (CNSS):</span> <span>0.00 FCFA</span></div>
                                      <div class="center" style="margin-top: 20px;">
                                        <span class="badge">TRANSACTION APPROUVÉE ET ARCHIVÉE</span>
                                      </div>
                                      <div class="line"></div>
                                      <p class="center italic font-bold" style="font-size: 11px;">MédiSahel Bamako vous souhaite une excellente santé.</p>
                                    </body>
                                  </html>
                                `);
                                pWind.document.close();
                              }}
                              className="text-[9.5px] px-2 py-0.5 bg-slate-55 hover:bg-slate-100 border border-slate-205 text-slate-800 rounded font-bold cursor-pointer flex items-center gap-1 transition-all"
                            >
                              <Printer className="h-3 w-3 text-slate-500" /> Reçu de Caisse
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1.5 justify-center items-center">
                            <div className="flex gap-1 justify-center flex-wrap max-w-[150px]">
                              <button
                                onClick={() => onPayInvoice(inv.id, "Espèces")}
                                className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[9px] font-extrabold cursor-pointer hover:bg-emerald-100 uppercase"
                                title="Règlement par Espèces"
                              >
                                Cash
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Orange Money")}
                                className="px-1.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded text-[9px] font-extrabold cursor-pointer hover:bg-orange-100 uppercase"
                                title="Règlement par Orange Money"
                              >
                                OM
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Wave")}
                                className="px-1.5 py-0.5 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded text-[9px] font-extrabold cursor-pointer hover:bg-cyan-100 uppercase"
                                title="Règlement par Wave"
                              >
                                Wave
                              </button>
                              <button
                                onClick={() => onPayInvoice(inv.id, "Moov Money")}
                                className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[9px] font-extrabold cursor-pointer hover:bg-blue-100 uppercase"
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
                            <span className="text-[9px] font-bold text-slate-400">Sélectionnez le canal</span>
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
              className="bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-3 rounded text-xs transition-all cursor-pointer"
            >
              Émettre un Devis Indicatif
            </button>
          </div>

          <div className="space-y-3">
            {devisList.map(dev => (
              <div key={dev.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-medium">
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
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1">
            <XCircle className="h-4.5 w-4.5 text-red-650" /> Registre d'avoirs & remboursements d'épreuve
          </h3>
          <p className="text-[10.5px] text-slate-400 leading-relaxed font-semibold">Toute correction comptable sur double-écriture doit être émise sous forme d'avoir, réduisant le grand livre journalier pour conserver une parfaite conformité avec la loi fiscale.</p>

          <div className="space-y-3">
            {invoices.filter(i => i.isAvoir || i.designation.includes("AVOIR")).map(inv => (
              <div key={inv.id} className="p-4 bg-red-50/20 border border-red-200 rounded-xl flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-red-800">{inv.patientNom}</h4>
                  <p className="text-slate-450 mt-0.5">Observation : {inv.designation}</p>
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
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-semibold space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-100 font-sans">
              <Calculator className="h-4.5 w-4.5 text-sky-650" /> Réconciliation d'Encaissements
            </h3>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Montant Réel Physiquement Présent dans le tiroir-caisse (FCFA) :</label>
              <input
                type="number"
                placeholder="Entrer le décompte du tiroir"
                className="w-full text-xs font-bold font-mono p-2.5 rounded border border-slate-300 bg-white"
                value={physicalCashInput}
                onChange={(e) => setPhysicalCashInput(parseInt(e.target.value) || 0)}
              />
            </div>

            <button
              onClick={handleCashReconciliation}
              className="w-full text-white font-bold p-2.5 rounded cursor-pointer text-center text-xs"
              style={{ backgroundColor: accentColor }}
            >
              Exécuter Pointage Clôture
            </button>

            {closingMessage && (
              <div className="p-3 bg-slate-50 border border-slate-150 rounded text-[11px] text-slate-600 block leading-relaxed italic border-l-4 border-l-amber-500 font-mono">
                {closingMessage}
              </div>
            )}
          </div>

          {/* Double entry journals database */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-205 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-100 font-sans">Grand livre de comptabilité en partie double</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-medium text-[11px]">
                <thead className="bg-slate-50 font-extrabold uppercase text-[9.5px] text-slate-400 border-b">
                  <tr>
                    <th className="px-3 py-2">Réf Écriture</th>
                    <th className="px-3 py-2">Compte Débité (+)</th>
                    <th className="px-3 py-2">Compte Crédité (-)</th>
                    <th className="px-3 py-2 text-right">Somme</th>
                    <th className="px-3 py-2 text-center">Rapprochement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/40 text-slate-605 font-mono">
                  {paidInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-slate-705">{inv.id}</td>
                      <td className="px-3 py-2 text-emerald-800 font-bold">511 (Caisse Clinique)</td>
                      <td className="px-3 py-2 text-slate-605 text-[10px]/tight">706 (Prestations Services)</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{inv.montantPatiente.toLocaleString("fr-FR")}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] text-sky-700 font-bold font-sans">Automatique</span>
                      </td>
                    </tr>
                  ))}
                  {assuranceClosingTotal > 0 && (
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-bold text-slate-450">AMO-2026</td>
                      <td className="px-3 py-2 text-emerald-800 font-bold">4112 (Créance AMO)</td>
                      <td className="px-3 py-2 text-slate-605">706 (Tiers-Payant)</td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">{assuranceClosingTotal.toLocaleString("fr-FR")}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="text-[10px] text-amber-700 font-bold font-sans animate-pulse">En attente CANAM</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
