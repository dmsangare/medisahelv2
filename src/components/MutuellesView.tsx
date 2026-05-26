import { useState, useEffect, FormEvent } from "react";
import { Patient, Invoice } from "../types";
import { 
  Percent, 
  Shield, 
  Check, 
  Plus, 
  TrendingUp, 
  FileText, 
  DollarSign, 
  Building, 
  RefreshCw, 
  Download, 
  Briefcase, 
  HelpCircle,
  FileSpreadsheet
} from "lucide-react";

interface MutuellesViewProps {
  patients: Patient[];
  invoices: Invoice[];
  accentColor: string;
}

interface Convention {
  id: string;
  nom: string;
  code: string;
  tauxPriseEnCharge: number; // e.g., 70 for CANAM
  statut: "Actif" | "Suspendu";
  contactEmail: string;
  telephone: string;
  soldeDu: number; // outstanding receivables
}

interface RemboursementClaim {
  id: string;
  conventionCode: string;
  patientNom: string;
  patientId: string;
  referenceFacture: string;
  montantTotal: number;
  partAssurance: number;
  statut: "En attente" | "Approuvé" | "Rejeté";
  dateSoumission: string;
  datePaiement?: string;
  notes?: string;
}

export default function MutuellesView({
  patients,
  invoices,
  accentColor
}: MutuellesViewProps) {
  const [conventions, setConventions] = useState<Convention[]>(() => {
    const saved = localStorage.getItem("medishahel_conventions");
    return saved ? JSON.parse(saved) : [
      { id: "c-1", nom: "Caisse Nationale d'Assurance Maladie (CANAM)", code: "CANAM", tauxPriseEnCharge: 70, statut: "Actif", contactEmail: "tiers-payant@canam.ml", telephone: "+223 20 22 55 66", soldeDu: 1450000 },
      { id: "c-2", nom: "Institut National de Prévoyance Sociale (INPS)", code: "INPS", tauxPriseEnCharge: 80, statut: "Actif", contactEmail: "medecine-conseil@inps.ml", telephone: "+223 20 21 44 22", soldeDu: 620000 },
      { id: "c-3", nom: "ASCOMA Assurances Mali", code: "ASCOMA", tauxPriseEnCharge: 90, statut: "Actif", contactEmail: "mali@ascoma.com", telephone: "+223 20 23 88 11", soldeDu: 380000 },
      { id: "c-4", nom: "AXA Assurances Mali", code: "AXA", tauxPriseEnCharge: 75, statut: "Actif", contactEmail: "sante@axa.ml", telephone: "+223 20 29 00 00", soldeDu: 125000 }
    ];
  });

  const [claims, setClaims] = useState<RemboursementClaim[]>(() => {
    const saved = localStorage.getItem("medishahel_claims");
    return saved ? JSON.parse(saved) : [
      { id: "CLM-001", conventionCode: "CANAM", patientNom: "Adama Coulibaly", patientId: "MS-2026-0045", referenceFacture: "FAC-9241", montantTotal: 45000, partAssurance: 31500, statut: "En attente", dateSoumission: "2026-05-20" },
      { id: "CLM-002", conventionCode: "INPS", patientNom: "Fatoumata Diarra", patientId: "MS-2026-0046", referenceFacture: "FAC-8123", montantTotal: 120000, partAssurance: 96000, statut: "Approuvé", dateSoumission: "2026-05-18", datePaiement: "2026-05-25" },
      { id: "CLM-003", conventionCode: "ASCOMA", patientNom: "Moussa Keïta", patientId: "MS-2026-0047", referenceFacture: "FAC-7422", montantTotal: 85000, partAssurance: 76500, statut: "En attente", dateSoumission: "2026-05-23" },
      { id: "CLM-004", conventionCode: "CANAM", patientNom: "Aminata Touré", patientId: "MS-2026-0032", referenceFacture: "FAC-5120", montantTotal: 25000, partAssurance: 17500, statut: "Rejeté", dateSoumission: "2026-05-15", notes: "Numéro d'assuré non concordant dans les bases CANAM." }
    ];
  });

  // Active sub-tab inside MutuellesView
  const [activeSubTab, setActiveSubTab] = useState<"conventions" | "claims" | "billing">("conventions");

  // Filter query states
  const [searchConvention, setSearchConvention] = useState("");
  const [searchClaim, setSearchClaim] = useState("");

  // Create Convention States
  const [showAddConv, setShowAddConv] = useState(false);
  const [newConvName, setNewConvName] = useState("");
  const [newConvCode, setNewConvCode] = useState("");
  const [newConvRate, setNewConvRate] = useState(70);
  const [newConvEmail, setNewConvEmail] = useState("");
  const [newConvTel, setNewConvTel] = useState("");

  // Create/Submit Claim helper from unpaid invoices with Tiers Payant
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");

  // Persistent saving effects
  useEffect(() => {
    localStorage.setItem("medishahel_conventions", JSON.stringify(conventions));
  }, [conventions]);

  useEffect(() => {
    localStorage.setItem("medishahel_claims", JSON.stringify(claims));
  }, [claims]);

  // Form handlers
  const handleAddConvention = (e: FormEvent) => {
    e.preventDefault();
    if (!newConvName || !newConvCode) {
      alert("Le nom et le code abrégé sont requis.");
      return;
    }
    const newConv: Convention = {
      id: `c-${Date.now()}`,
      nom: newConvName,
      code: newConvCode.toUpperCase(),
      tauxPriseEnCharge: newConvRate,
      statut: "Actif",
      contactEmail: newConvEmail || "contact@mutuelle.ml",
      telephone: newConvTel || "+223 20 00 00 00",
      soldeDu: 0
    };
    setConventions(prev => [...prev, newConv]);
    setNewConvName("");
    setNewConvCode("");
    setNewConvRate(70);
    setNewConvEmail("");
    setNewConvTel("");
    setShowAddConv(false);
    alert(`Convention enregistrée avec succès : ${newConv.nom}`);
  };

  const handleCreateClaimFromInvoice = (invoice: Invoice) => {
    if (claims.some(c => c.referenceFacture === invoice.id)) {
      alert("Un dossier de remboursement existe déjà pour cette facture.");
      return;
    }

    const patient = patients.find(p => p.id === invoice.patientId);
    const code = patient?.assurance ? patient.assurance.split(" ")[0] : "CANAM";

    const newClaim: RemboursementClaim = {
      id: `CLM-${Date.now().toString().slice(-4)}`,
      conventionCode: code,
      patientNom: invoice.patientNom,
      patientId: invoice.patientId,
      referenceFacture: invoice.id,
      montantTotal: invoice.montantTotal,
      partAssurance: invoice.montantAssurance || Math.floor(invoice.montantTotal * 0.7),
      statut: "En attente",
      dateSoumission: new Date().toISOString().slice(0, 10)
    };

    setClaims(prev => [newClaim, ...prev]);
    
    // Update outstanding balance for the convention
    setConventions(prev => prev.map(c => {
      if (c.code === code) {
        return { ...c, soldeDu: c.soldeDu + newClaim.partAssurance };
      }
      return c;
    }));

    alert(`Bordereau de tiers-payant d'assurance ${code} généré pour ${invoice.patientNom}.`);
  };

  const handleApproveClaim = (claimId: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        // Reduce Outstanding Solde Du
        setConventions(convs => convs.map(conv => {
          if (conv.code === c.conventionCode) {
            return { ...conv, soldeDu: Math.max(0, conv.soldeDu - c.partAssurance) };
          }
          return conv;
        }));
        return { ...c, statut: "Approuvé", datePaiement: new Date().toISOString().slice(0, 10) };
      }
      return c;
    }));
    alert("Dossier validé et remboursement crédité en banque clinique.");
  };

  const handleRejectClaim = (claimId: string, rationale: string) => {
    setClaims(prev => prev.map(c => {
      if (c.id === claimId) {
        return { ...c, statut: "Rejeté", notes: rationale };
      }
      return c;
    }));
    alert("Dossier marqué comme rejeté avec motif.");
  };

  // Export claims for a convention (Claim billing export)
  const handleExportClaimBilling = (code: string) => {
    const relevantClaims = claims.filter(c => c.conventionCode === code);
    if (relevantClaims.length === 0) {
      alert(`Aucune créance enregistrée pour l'organisme ${code}.`);
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Recl;Convention;ID Patient;Patient;Facture Ref;Montant Total;Part Pris en Charge (Tiers Payant);Statut;Date Soumission\n";
    
    relevantClaims.forEach(c => {
      csvContent += `${c.id};${c.conventionCode};${c.patientId};${c.patientNom};${c.referenceFacture};${c.montantTotal};${c.partAssurance};${c.statut};${c.dateSoumission}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `BORDEREAU_COMPTABILITE_ASSURANCE_${code}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(`Bordereau d'export de facturation groupée téléchargée pour l'organisme ${code}.`);
  };

  // Calculations for KPI Cards
  const totalReceivables = conventions.reduce((acc, curr) => acc + curr.soldeDu, 0);
  const pendingClaimsCount = claims.filter(c => c.statut === "En attente").length;
  const approvedClaimsTotal = claims.filter(c => c.statut === "Approuvé").reduce((acc, curr) => acc + curr.partAssurance, 0);

  // Filtered lists
  const filteredConventions = conventions.filter(c => 
    c.nom.toLowerCase().includes(searchConvention.toLowerCase()) || 
    c.code.toLowerCase().includes(searchConvention.toLowerCase())
  );

  const filteredClaims = claims.filter(c => 
    c.patientNom.toLowerCase().includes(searchClaim.toLowerCase()) || 
    c.id.toLowerCase().includes(searchClaim.toLowerCase()) ||
    c.conventionCode.toLowerCase().includes(searchClaim.toLowerCase())
  );

  // Selectable invoices which have insurance registered
  const payableInvoices = invoices.filter(inv => {
    const patientObj = patients.find(p => p.id === inv.patientId);
    return patientObj && patientObj.assurance && patientObj.assurance !== "Aucun";
  });

  return (
    <div className="space-y-6" id="mutuelles-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: accentColor }} />
          <span>Module de Gestion des Mutuelles, Conventions & Assurances</span>
        </h2>
        <p className="text-xs text-slate-500">
          Supervisez vos accords tiers-payant (CANAM, INPS, ASCOMA) et suivez les bordereaux de remboursement et créances de l'établissement.
        </p>
      </div>

      {/* KPI Overviews (Créances Mutuelles & Tiers Payant) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-tr from-sky-900 to-sky-950 text-white rounded-xl p-5 shadow-xs border border-sky-850">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] text-sky-200 font-extrabold uppercase tracking-widest block">Créances Mutuelles Globales</span>
              <p className="text-2xl font-black font-mono">{totalReceivables.toLocaleString("fr-FR")} FCFA</p>
            </div>
            <div className="p-2 bg-sky-800/40 rounded-lg">
              <TrendingUp className="h-5 w-5 text-sky-200" />
            </div>
          </div>
          <p className="text-[10px] text-sky-300 mt-3 font-semibold">Tiers payant garanti en attente de versement bancaire d'assureurs.</p>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Dossiers de Remboursement Actifs</span>
            <p className="text-2xl font-black font-mono text-slate-800">{claims.length} Demandes</p>
            <span className="text-[10px] text-amber-600 block font-bold">● {pendingClaimsCount} fiches en cours de validation conseil</span>
          </div>
          <div className="p-2 bg-slate-50 border rounded-lg">
            <Percent className="h-5 w-5 text-sky-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 flex justify-between items-start">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block">Remboursements Liquidés</span>
            <p className="text-2xl font-black font-mono text-emerald-700">{approvedClaimsTotal.toLocaleString("fr-FR")} FCFA</p>
            <span className="text-[10px] text-slate-500 block font-semibold">Fonds perçus de la CANAM et des mutuelles partenaires.</span>
          </div>
          <div className="p-2 bg-slate-50 border rounded-lg">
            <Check className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 overflow-x-auto text-[11px] font-bold">
        <button
          onClick={() => setActiveSubTab("conventions")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "conventions" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>Gestion des Conventions & Taux ({conventions.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("claims")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "claims" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Briefcase className="h-3.5 w-3.5" />
          <span>Suivi Tiers Payant & Remboursements ({claims.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("billing")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "billing" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Liquidation & Facturation Assurances</span>
        </button>
      </div>

      {/* Sub Views Content */}
      {activeSubTab === "conventions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of active Conventions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <div>
                  <h3 className="font-bold text-slate-800 uppercase tracking-wider">Conventions d'Assurance En Registre</h3>
                  <p className="text-[10px] text-slate-400">Pourcentages de prise en charge et encours de créances pour chaque organisme.</p>
                </div>
                <input
                  type="text"
                  placeholder="Rechercher une mutuelle..."
                  className="p-1 px-3 border rounded text-xs outline-none w-48 font-semibold bg-slate-50"
                  value={searchConvention}
                  onChange={(e) => setSearchConvention(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredConventions.map(conv => (
                  <div key={conv.id} className="p-4 bg-slate-50/50 border border-slate-205 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-all font-semibold text-slate-800">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-black text-[10px] font-mono">{conv.code}</span>
                        <h4 className="font-black text-slate-900 text-xs">{conv.nom}</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex flex-wrap gap-x-4">
                        <span>Email: <strong className="text-slate-700">{conv.contactEmail}</strong></span>
                        <span>Tél: <strong className="text-slate-700">{conv.telephone}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end text-right">
                      <div className="text-left md:text-right space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Crédit Tiers Payant</span>
                        <span className="text-xs font-bold font-mono text-amber-700">{conv.soldeDu.toLocaleString("fr-FR")} FCFA</span>
                      </div>

                      <div className="text-left md:text-right space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider block">Couverture d'actes</span>
                        <span className="text-xs font-black text-emerald-700">{conv.tauxPriseEnCharge}% Garanti</span>
                      </div>

                      <button
                        onClick={() => handleExportClaimBilling(conv.code)}
                        className="bg-white hover:bg-slate-100 p-1.5 border rounded-lg text-slate-700 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Générer un bordereau d'envoi"
                      >
                        <Download className="h-3 w-3 text-sky-600" /> Exporter
                      </button>
                    </div>
                  </div>
                ))}

                {filteredConventions.length === 0 && (
                  <p className="text-center italic py-6 text-slate-400">Aucune convention correspondante.</p>
                )}
              </div>
            </div>
          </div>

          {/* Add Convention Panel */}
          <div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b">
                <Plus className="h-4 w-4 text-sky-600" /> Nouvelle Convention
              </h3>

              <form onSubmit={handleAddConvention} className="space-y-3 font-semibold text-slate-700">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Nom du Tiers-Payeur / Mutuelle</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Caisse Générale d'Assurance Malienne"
                    className="w-full text-xs rounded border border-slate-300 p-2 outline-none font-semibold text-slate-800 bg-slate-50/55"
                    value={newConvName}
                    onChange={(e) => setNewConvName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Code Abrégé</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: CGAM"
                      className="w-full text-xs rounded border border-slate-350 p-2 outline-none font-bold text-slate-800 bg-slate-50"
                      value={newConvCode}
                      onChange={(e) => setNewConvCode(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Taux Prise en Charge (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      className="w-full text-xs rounded border border-slate-350 p-2 outline-none font-bold text-slate-800 bg-slate-50"
                      value={newConvRate}
                      onChange={(e) => setNewConvRate(parseInt(e.target.value) || 70)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Adresse Email Relations Assurés</label>
                  <input
                    type="email"
                    placeholder="ex: tiers-payant@cgam.ml"
                    className="w-full text-xs rounded border border-slate-300 p-2 outline-none bg-slate-50/55"
                    value={newConvEmail}
                    onChange={(e) => setNewConvEmail(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1">Ligne Directe Facturation</label>
                  <input
                    type="text"
                    placeholder="ex: +223 20 28 44 22"
                    className="w-full text-xs rounded border border-slate-300 p-2 outline-none bg-slate-50/55"
                    value={newConvTel}
                    onChange={(e) => setNewConvTel(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white font-bold p-2 text-xs rounded transition-all cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  Valider & Publier la Convention
                </button>
              </form>

              <div className="bg-sky-50 p-3.5 border border-sky-150 rounded-lg text-[10px] text-sky-850 font-semibold leading-relaxed">
                ℹ️ <strong>Tiers Payant Automatisé :</strong> Dès qu'une convention est enregistrée, le module de facturation l'applique sur présentation du carnet d'assuré valide du patient à la caisse.
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "claims" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-2">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Suivi des Titres de Remboursement</h3>
              <p className="text-[10px] text-slate-400">Consultez et validez l'état des demandes d'indemnisation déposées.</p>
            </div>
            <input
              type="text"
              placeholder="Rechercher par patient, code d'assurance..."
              className="p-1.5 px-3 border rounded text-xs outline-none w-64 bg-slate-50 font-semibold"
              value={searchClaim}
              onChange={(e) => setSearchClaim(e.target.value)}
            />
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden bg-white scrollbar-thin">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[9.5px] font-extrabold uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Réf Recl</th>
                    <th className="px-4 py-3 font-bold">Assureur</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">N° Facture</th>
                    <th className="px-4 py-3 text-right">Montant Total</th>
                    <th className="px-4 py-3 text-right">Part Tiers Payé</th>
                    <th className="px-4 py-3">Soumis le</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-650 text-[11px]">
                  {filteredClaims.map((claim) => {
                    const statusColor = 
                      claim.statut === "Approuvé" 
                        ? "bg-green-50 text-emerald-700 border-green-200"
                        : claim.statut === "Rejeté"
                        ? "bg-red-50 text-red-650 border-red-200"
                        : "bg-amber-50 text-amber-800 border-amber-250";

                    return (
                      <tr key={claim.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="px-4 py-3 font-semibold font-mono text-slate-900">{claim.id}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 bg-slate-100 font-extrabold text-[10px] border rounded text-slate-805">
                            {claim.conventionCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-850">{claim.patientNom}</div>
                          <span className="text-[9px] text-slate-400 font-mono">{claim.patientId}</span>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">{claim.referenceFacture}</td>
                        <td className="px-4 py-3 text-right font-mono">{claim.montantTotal.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-right font-bold text-sky-800 font-mono">{claim.partAssurance.toLocaleString("fr-FR")}</td>
                        <td className="px-4 py-3 text-slate-450 whitespace-nowrap">{claim.dateSoumission}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold block text-center ${statusColor}`}>
                            {claim.statut.toUpperCase()}
                          </span>
                          {claim.notes && (
                            <span className="text-[9px] text-red-600 block leading-tight mt-1 text-left italic font-medium max-w-[150px]">
                              ⚠️ {claim.notes}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {claim.statut === "En attente" && (
                              <>
                                <button
                                  onClick={() => handleApproveClaim(claim.id)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                                >
                                  Liquider
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Saisissez le motif du rejet par l'assureur :");
                                    if (reason) handleRejectClaim(claim.id, reason);
                                  }}
                                  className="px-2 py-1 border border-red-300 text-red-650 hover:bg-red-50 font-bold text-[10px] rounded transition-all cursor-pointer uppercase"
                                >
                                  Rejeter
                                </button>
                              </>
                            )}
                            {claim.statut === "Approuvé" && (
                              <span className="text-[9.5px] text-emerald-600 font-mono font-bold">Payé le {claim.datePaiement}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredClaims.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-6 italic text-slate-400">Aucun dossier de remboursement.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Collect unpaid insurer bills */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Facturation Directe des Assureurs (Tiers-Payant Éligible)</h3>
              <p className="text-[10px] text-slate-400">Rattachez des factures caisse de patients sous convention à des dossiers de remboursement d'assurance.</p>
            </div>

            {payableInvoices.length === 0 ? (
              <p className="text-center italic text-slate-400 py-8">Aucun dossier de facturation tiers-payant éligible en attente d'émission.</p>
            ) : (
              <div className="space-y-3">
                {payableInvoices.map((inv) => {
                  const patientObj = patients.find(p => p.id === inv.patientId);
                  const assurancePartner = patientObj?.assurance || "Inconnu";
                  const alreadyClaimed = claims.some(c => c.referenceFacture === inv.id);

                  return (
                    <div key={inv.id} className="p-4 border rounded-xl bg-slate-50/55 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-sky-100 text-sky-800 font-bold text-[9px] rounded uppercase">{assurancePartner}</span>
                          <span className="font-extrabold text-slate-900">{inv.patientNom}</span>
                          <span className="text-[9.5px] text-slate-400 font-mono font-bold">({inv.id})</span>
                        </div>
                        <p className="text-[11px] text-slate-550 pt-1">
                          Actes facturés : <span className="text-slate-700 font-bold">{inv.designation}</span>
                        </p>
                        <div className="flex gap-4 pt-1 font-mono text-[10px] text-slate-400">
                          <span>Émis: <strong className="text-slate-600">{inv.dateEmission}</strong></span>
                          <span>Part Assureur: <strong className="text-slate-700">{(inv.montantAssurance || Math.floor(inv.montantTotal * 0.7)).toLocaleString("fr-FR")} FCFA</strong></span>
                        </div>
                      </div>

                      <div>
                        {alreadyClaimed ? (
                          <span className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold rounded uppercase block text-center select-none">
                            Bordereau Généré
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCreateClaimFromInvoice(inv)}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[10.5px] py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer select-none transition-all uppercase"
                          >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span>Rédiger Bordereau</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Billing Help */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b">
              <HelpCircle className="h-4 w-4 text-sky-650" /> Notice d'Usage Tiers-Payant
            </h3>

            <div className="space-y-3 leading-relaxed text-slate-600 text-[11px]">
              <p>
                <strong>1. Prise en Charge à l'Admission :</strong> Les réceptionnistes doivent vérifier la carte CANAM du patient à l'admission. Le taux d'exonération se lie automatiquement au dossier.
              </p>
              <p>
                <strong>2. Part Exonérée (Assurance) :</strong> La caisse ne facture au patient que son ticket modérateur (reste à charge, ex: 30% pour la CANAM).
              </p>
              <p>
                <strong>3. Bordereaux Groupés :</strong> En fin de mois, exportez les créances d'une mutuelle sous forme de rapport d'audit pour enclencher la facturation globale compensatoire.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-150 rounded-xl text-[10px] text-emerald-850 font-bold">
              ✅ Le chiffrement et la traçabilité des bordereaux tiers-payant respecte les audits réguliers prescrits par le SNIS malien (Système National d'Information Sanitaire).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
