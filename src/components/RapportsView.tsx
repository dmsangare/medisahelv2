import { useState } from "react";
import { Patient, BedAllocation, StockItem, Invoice, TriageRecord } from "../types";
import { TrendingUp, FileText, Download, ShieldCheck, Activity, BarChart2, DollarSign, Calendar, AlertTriangle } from "lucide-react";

interface RapportsViewProps {
  patients: Patient[];
  beds: BedAllocation[];
  stocks: StockItem[];
  invoices: Invoice[];
  triages: TriageRecord[];
  accentColor: string;
}

export default function RapportsView({
  patients,
  beds,
  stocks,
  invoices,
  triages,
  accentColor
}: RapportsViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"snis" | "fins" | "kpis">("snis");

  // Local helper for downloads
  const handleCSVExport = (filename: string, headers: string[], rows: any[][]) => {
    let content = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleXMLExport = (filename: string, rootElement: string, objectArray: Record<string, any>[]) => {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootElement}>\n`;
    objectArray.forEach(obj => {
      xml += "  <item>\n";
      Object.entries(obj).forEach(([key, val]) => {
        xml += `    <${key}>${val}</${key}>\n`;
      });
      xml += "  </item>\n";
    });
    xml += `</${rootElement}>`;

    const blob = new Blob([xml], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPIs
  const totalInvoiced = invoices.reduce((sum, current) => sum + current.montantTotal, 0);
  const totalPaid = invoices.filter(i => i.statut === "Payé").reduce((sum, current) => sum + current.montantPatiente + current.montantAssurance, 0);
  const totalPending = totalInvoiced - totalPaid;

  const totalCANAMCoverage = invoices.filter(i => i.statut === "Payé").reduce((sum, current) => sum + current.montantAssurance, 0);
  const cashIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Espèces").reduce((sum, current) => sum + current.montantPatiente, 0);
  const mobileIncome = totalPaid - cashIncome - totalCANAMCoverage;

  // Mali Ministry SNIS Mock Calculations
  const malariaCases = 14; 
  const cpnPregnancyFollowUps = 9;
  const accidentsCount = triages.length;

  const handleExportSNIS = () => {
    const headers = ["Donnee_SNIS", "Indicateur", "Valeur_Cumulee_Mois"];
    const rows = [
      ["Paludisme_Simple", "Nombre de diagnostics confirmes TDR/GE", String(malariaCases)],
      ["Visites_Maternite_CPN", "Nombre de visites prenatales CPN1", String(cpnPregnancyFollowUps)],
      ["Urgences_Recues_Triage", "Fiches urgences triees chronologies", String(accidentsCount)],
      ["Duree_Moyenne_Séjour", "DMS Hospitalisation jours", "3.4"]
    ];
    handleCSVExport("MEDISHAHEL_RAPPORT_SNIS_MALI", headers, rows);
  };

  const handleExportFinancialsCSV = () => {
    const headers = ["Reference", "Patient", "Montant_Total", "Assurance_PriseEnCharge", "Part_Patiente_Recouvree", "Statut_Paiement"];
    const rows = invoices.map(i => [
      i.id,
      i.patientNom,
      String(i.montantTotal),
      String(i.montantAssurance),
      String(i.montantPatiente),
      i.statut
    ]);
    handleCSVExport("MEDISHAHEL_RAPPORT_FINANCIER", headers, rows);
  };

  const handleExportFinancialsXML = () => {
    const data = invoices.map(i => ({
      reference: i.id,
      patient: i.patientNom,
      total: i.montantTotal,
      assurance: i.montantAssurance,
      recouvrement: i.montantPatiente,
      statut: i.statut
    }));
    handleXMLExport("MEDISHAHEL_RAPPORT_FINANCIER_XML", "rapport_financier", data);
  };

  return (
    <div className="space-y-6" id="reports-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5" style={{ color: accentColor }} />
            <span>Rapports d'Activité & Statistiques Établissement</span>
          </h2>
          <p className="text-xs text-slate-500">Superficie d'évaluation pour la direction et génération des rapports officiels du Ministère de la Santé (Mali).</p>
        </div>

        {/* Local subtabs navigation bar */}
        <div className="bg-slate-100 p-1.5 rounded-lg border flex items-center text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab("snis")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "snis" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            Rapports Nationaux SNIS
          </button>
          <button
            onClick={() => setActiveSubTab("fins")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "fins" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            Statuts Financiers & Caisse
          </button>
          <button
            onClick={() => setActiveSubTab("kpis")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "kpis" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            Rendements & DMS KPIs
          </button>
        </div>
      </div>

      {activeSubTab === "snis" ? (
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-850 flex items-center gap-1.5">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> Système National d'Information Sanitaire (Rapports SNIS)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Fiches d'actes cumulés émis périodiquement pour les rapports départementaux d'épreuves du Ministère malien.</p>
              </div>

              <button
                onClick={handleExportSNIS}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer self-start sm:self-center transition-all"
              >
                <Download className="h-4 w-4" /> Export CSV SNIS
              </button>
            </div>

            {/* Mali Specific SNIS criteria blocks list */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase">MALADIE ENDÉMIQUE :</span>
                <h4 className="font-bold text-slate-900">Paludisme Simple / Grave</h4>
                <p className="text-slate-500 font-mono">Total diagnostiqués : <strong className="text-slate-900">{malariaCases} cas</strong></p>
                <span className="text-[10px] bg-sky-50 text-[#0284c7] px-2 py-0.5 rounded border border-sky-150 inline-block font-bold">Inscrire dans l'annuaire</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase">SANTÉ MATERNELLE :</span>
                <h4 className="font-bold text-slate-900">Gestation & Consultation CPN</h4>
                <p className="text-slate-500 font-mono">Actes CPN1 recouvrent : <strong className="text-slate-900">{cpnPregnancyFollowUps} visites</strong></p>
                <span className="text-[10px] bg-sky-50 text-[#0284c7] px-2 py-0.5 rounded border border-sky-150 inline-block font-bold">Modèles obstétriques</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase">URGENCES CLINIQUES :</span>
                <h4 className="font-bold text-slate-900">Triage des Admissions</h4>
                <p className="text-slate-500 font-mono">Admission triage : <strong className="text-slate-900">{accidentsCount} dossiers</strong></p>
                <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200 inline-block font-bold font-sans">Vigilance immédiate</span>
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === "fins" ? (
        <div className="space-y-4">
          {/* Quick monetary summary box */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Chiffre Émis Total</span>
                <span className="text-xl font-bold font-mono text-slate-850">{totalInvoiced.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Total Encaissé / Liquidités</span>
                <span className="text-xl font-bold font-mono text-emerald-700">{totalPaid.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Restant Dû / Impayés</span>
                <span className="text-xl font-bold font-mono text-amber-700">{totalPending.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
          </div>

          {/* Export tools */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Trésorerie, Caisse & Prise en charge CANAM</h3>
                <p className="text-[10.5px] text-slate-400">Ventilation de caisse, remboursements mutuelles, et états financiers de fin de journée.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExportFinancialsCSV}
                  className="bg-slate-850 hover:bg-slate-900 text-white font-bold p-2 px-3.5 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> CSV Excel
                </button>
                <button
                  onClick={handleExportFinancialsXML}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-bold p-2 px-3.5 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> XML Financier
                </button>
              </div>
            </div>

            {/* In-depth financials rows display */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-black">Prise en charge CANAM (70%)</span>
                <p className="text-lg font-bold text-slate-905 mt-1 font-mono">{totalCANAMCoverage.toLocaleString("fr-FR")} FCFA</p>
                <span className="text-[10px] text-slate-400 block font-normal">Créances mutuelles à recouvrer</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-black">Encaissements Liquidités Caisse</span>
                <p className="text-lg font-bold text-emerald-700 mt-1 font-mono">{cashIncome.toLocaleString("fr-FR")} FCFA</p>
                <span className="text-[10px] text-slate-400 block font-normal">Fonds physiques tiroir-caisse</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-black">Recettes Mobile Money</span>
                <p className="text-lg font-bold text-sky-700 mt-1 font-mono">{mobileIncome.toLocaleString("fr-FR")} FCFA</p>
                <span className="text-[10px] text-slate-400 block font-normal">Collectés Orange / Wave / Moov</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* KPIs & throughput */
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Activity className="h-4.5 w-4.5 text-[#0284c7]" /> Rendements d'Hospitalisation & Délais d'Attente
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Durée de Séjour de Référence</span>
              <h4 className="text-base font-bold text-slate-850">DMS calculée : <strong>3.4 jours de moyenne</strong></h4>
              <p className="text-slate-400 text-[10.5px] leading-relaxed">Cette constante estime le flux de rotation des lits d'hospitalisation de médecine générale de la clinique courante.</p>
            </div>

            <div className="p-4 border border-slate-200 rounded-xl space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-black block">Triage et Prise en Soins</span>
              <h4 className="text-base font-bold text-slate-850">Admission d'Épreuve : <strong>12 minutes d'attente moyenne</strong></h4>
              <p className="text-slate-400 text-[10.5px] leading-relaxed">Mesure de vélocité depuis le pointage triage couleur (Rouge / Orange / Jaune) jusqu'à la prescription DME.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
