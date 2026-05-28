import { useState } from "react";
import { Patient, BedAllocation, StockItem, Invoice, TriageRecord } from "../types";
import { 
  TrendingUp, 
  FileText, 
  Download, 
  ShieldCheck, 
  Activity, 
  BarChart2, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Layers,
  Heart,
  UserCheck
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from "recharts";

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

  // Financial calculations
  const totalInvoiced = invoices.reduce((sum, current) => sum + current.montantTotal, 0);
  const totalPaid = invoices.filter(i => i.statut === "Payé").reduce((sum, current) => sum + current.montantPatiente + current.montantAssurance, 0);
  const totalPending = totalInvoiced - totalPaid;

  const totalCANAMCoverage = invoices.filter(i => i.statut === "Payé").reduce((sum, current) => sum + current.montantAssurance, 0);
  const cashIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Espèces").reduce((sum, current) => sum + current.montantPatiente, 0);
  const orangeIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Orange Money").reduce((sum, current) => sum + current.montantPatiente, 0);
  const waveIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Wave").reduce((sum, current) => sum + current.montantPatiente, 0);
  const moovIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Moov Money").reduce((sum, current) => sum + current.montantPatiente, 0);
  const ccIncome = invoices.filter(i => i.statut === "Payé" && i.modePaiement === "Carte bancaire").reduce((sum, current) => sum + current.montantPatiente, 0);

  // Recharts Financial Breakdown Data
  const financialChartData = [
    { name: "Espèces (Cash)", montant: cashIncome, fill: "#10b981" },
    { name: "Orange Money", montant: orangeIncome, fill: "#f97316" },
    { name: "Wave Mali", montant: waveIncome, fill: "#06b6d4" },
    { name: "Moov Money", montant: moovIncome, fill: "#3b82f6" },
    { name: "Carte Bancaire", montant: ccIncome, fill: "#64748b" },
    { name: "Tiers Payant (Assurance)", montant: totalCANAMCoverage, fill: "#8b5cf6" }
  ];

  // Pathology indicators
  const diagnostics = [
    { name: "Paludisme Simple TDR+", value: 18, color: "#ef4444" },
    { name: "Paludisme Grave GE+", value: 8, color: "#b91c1c" },
    { name: "Infections Resp. (IRA)", value: 12, color: "#f59e0b" },
    { name: "Gastro-entérite", value: 15, color: "#10b981" },
    { name: "CPN Obstétricale", value: 9, color: "#ec4899" },
    { name: "Traumatismes / Plaies", value: triages.length, color: "#6366f1" }
  ];

  // Daily Admissions Triage Chart Data
  const admissionTrendsData = [
    { jour: "Lundi", admissions: 5 },
    { jour: "Mardi", admissions: 8 },
    { jour: "Mercredi", admissions: triages.length + 2 },
    { jour: "Jeudi", admissions: 6 },
    { jour: "Vendredi", admissions: 11 },
    { jour: "Samedi", admissions: 4 },
    { jour: "Dimanche", admissions: 7 }
  ];

  const handleExportSNIS = () => {
    const headers = ["Donnee_SNIS_Mali", "Indicateur_Ministeriel", "Valeur_Cumulee_Etablissement"];
    const rows = [
      ["Paludisme_Simple_TDR", "Nombre de diagnostics confirmes par TDR", "18"],
      ["Paludisme_Grave", "Goutte Epaisse positive confirmée", "8"],
      ["Visites_Maternite_CPN", "Nombre de visites prenatales CPN1", "9"],
      ["Urgences_Recues_Triage", "Fiches urgences triees chronologies", String(triages.length)],
      ["Maladies_Diarrhéiques", "Gastro-enterites aigues chez les moins de 5 ans", "15"],
      ["Duree_Moyenne_Sejour", "Duree moyenne d'affectation de lits en jours", "3.4"]
    ];
    handleCSVExport("MEDISHAHEL_RAPPORT_SNIS_MALI", headers, rows);
  };

  const handleExportFinancialsCSV = () => {
    const headers = ["Reference", "Patient", "Montant_Total", "Assurance_PriseEnCharge", "Part_Patiente_Recouvree", "Canal_Paiement", "Statut"];
    const rows = invoices.map(i => [
      i.id,
      i.patientNom,
      String(i.montantTotal),
      String(i.montantAssurance),
      String(i.montantPatiente),
      i.modePaiement || "En attente",
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
      modePaiement: i.modePaiement || "Non defini",
      statut: i.statut
    }));
    handleXMLExport("MEDISHAHEL_RAPPORT_FINANCIER_XML", "rapport_financier", data);
  };

  const handlePrintMinistryReport = () => {
    const pWind = window.open("", "_blank");
    if (!pWind) return;

    pWind.document.write(`
      <html>
        <head>
          <title>RAPPORT NATIONAL SNIS - MINISTÈRE DE LA SANTÉ DU MALI</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 50px; line-height: 1.5; color: #000; }
            .mali-header { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
            .ministry-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
            .section-meteo { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; text-transform: uppercase; font-weight: bold; }
            .grand-titre { text-align: center; margin: 25px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .certified-stamp { border: 2px solid #ef4444; color: #ef4444; padding: 8px 15px; font-size: 11px; font-weight: bold; transform: rotate(-3deg); display: inline-block; text-transform: uppercase; margin-top: 30px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="mali-header">
            RÉPUBLIQUE DU MALI<br/>
            Un Peuple - Un But - Une Foi<br/>
            <span class="ministry-title">MINISTÈRE DE LA SANTÉ ET DU DÉVELOPPEMENT SOCIAL</span><br/>
            <span>DIRECTION NATIONALE DE LA SANTÉ (DNS)</span>
          </div>

          <div class="section-meteo font-mono">
            <div>
              <strong>DISTRICT SANITAIRE :</strong> BAMAKO COMMUNE III<br/>
              <strong>ÉTABLISSEMENT :</strong> CLINIQUE MÉDISAHEL (N° 2026/MS-HP)
            </div>
            <div style="text-align: right;">
              <strong>RÉFÉRENCE RAPPORT :</strong> SNIS-ML-${new Date().getFullYear()}-${new Date().getMonth() + 1}<br/>
              <strong>MOIS D'ÉVALUATION :</strong> ${new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })}
            </div>
          </div>

          <div class="grand-titre">RAPPORT D'ACTIVITÉS SANITAIRES MENSUEL (CANEVAS NATIONAL SNIS)</div>

          <p>Le présent rapport dresse les indicateurs épidémiologiques et de santé publique consolidés au sein de la Clinique Centrale MédiSahel pour communication au guichet du district sanitaire de tutelle.</p>

          <table>
            <thead>
              <tr>
                <th>Code SNIS</th>
                <th>Désignation Pathologie / Acte Clinique</th>
                <th>Groupe cible</th>
                <th>Cas Détectés / Consultations</th>
                <th>Statut Seuil Alerte</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ML-PALU-01</strong></td>
                <td>Paludisme Simple Confirmé par TDR</td>
                <td>Tout âge</td>
                <td>18</td>
                <td>Normal</td>
              </tr>
              <tr>
                <td><strong>ML-PALU-02</strong></td>
                <td>Paludisme Grave Goutte Epaisse+</td>
                <td>Tout âge</td>
                <td>8</td>
                <td>Seuil d'urgence vigilant</td>
              </tr>
              <tr>
                <td><strong>ML-IRA-10</strong></td>
                <td>Infections Respiratoires Aiguës (IRA)</td>
                <td>Moins de 5 ans</td>
                <td>12</td>
                <td>Saisonnier stable</td>
              </tr>
              <tr>
                <td><strong>ML-MAT-04</strong></td>
                <td>Consultations Prénatales (CPN 1) réalisés</td>
                <td>Femmes enceintes</td>
                <td>9</td>
                <td>Conforme aux objectifs</td>
              </tr>
              <tr>
                <td><strong>ML-DIAR-03</strong></td>
                <td>Maladies Diarrhéiques & Parasitaires</td>
                <td>Moins de 5 ans</td>
                <td>15</td>
                <td>Normal</td>
              </tr>
              <tr>
                <td><strong>ML-URG-11</strong></td>
                <td>Admissions Urgentes de Triage Clinique</td>
                <td>Tout âge</td>
                <td>${triages.length}</td>
                <td>Contrôlé</td>
              </tr>
            </tbody>
          </table>

          <div class="certified-stamp">CONFORME AUX PROTOCOLES DNS - CERTIFIÉ ÉPREUVE</div>

          <div class="signatures">
            <div>
              <strong>Pour la Commission de Contrôle :</strong><br/>
              <em>Inspecteur Sanitaire de Secteur</em><br/><br/>
              Cachet officiel requis
            </div>
            <div style="text-align: right;">
              <strong>Le Directeur Médical Coordinateur :</strong><br/>
              <em>Dr. S. Sangaré</em><br/><br/>
              Signature & Paraphe manuscrite
            </div>
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
  };

  return (
    <div className="space-y-6" id="reports-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart2 className="h-5 w-5" style={{ color: accentColor }} />
            <span>Module 12 – Rapports Réglementaires, Analyses & SNIS</span>
          </h2>
          <p className="text-xs text-slate-500">
            Analyses décisionnelles en temps réel, distribution financière analytique et canevas SNIS réglementaires du Ministère malien.
          </p>
        </div>

        {/* Local subtabs navigation bar */}
        <div className="bg-slate-100 p-1.5 rounded-lg border flex items-center text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab("snis")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "snis" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            📋 Canevas Officiel SNIS
          </button>
          <button
            onClick={() => setActiveSubTab("fins")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "fins" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            💰 Trésorerie & Caisse Analytique
          </button>
          <button
            onClick={() => setActiveSubTab("kpis")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "kpis" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            📈 Flux & Rendements Cliniques
          </button>
        </div>
      </div>

      {activeSubTab === "snis" ? (
        <div className="space-y-6 animate-fade-in">
          {/* Top critical card offering downloads in Ministry form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Système National d'Information Sanitaire (Mali - SNIS)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Rapports légaux des taux d'incidence épidémiologiques et d'activités obstétricales pour la Direction Nationale de la Santé du Mali.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportSNIS}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Export CSV (Excel)
                </button>
                <button
                  onClick={handlePrintMinistryReport}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Imprimer Rapport Officiel PDF
                </button>
              </div>
            </div>

            {/* Quick metrics grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase font-mono">CODE: ML-PALU-01</span>
                <h4 className="font-bold text-slate-900">Paludisme Simple TDR+</h4>
                <p className="text-slate-505 font-mono">Fréquence cumulée : <strong className="text-slate-900 text-sm">18 cas</strong></p>
                <span className="text-[10px] text-slate-450 italic leading-none block">Indicateur de saison pluvieuse</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase font-mono">CODE: ML-PALU-02</span>
                <h4 className="font-bold text-slate-900">Paludisme Grave GE+</h4>
                <p className="text-slate-505 font-mono">Fréquence cumulée : <strong className="text-red-700 text-sm">8 cas</strong></p>
                <span className="text-[10px] text-amber-600 font-bold leading-none block">Contrôle de sérologie requis</span>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase font-mono">CODE: ML-MAT-04</span>
                <h4 className="font-bold text-slate-900">CPN 1 Obstétrique</h4>
                <p className="text-slate-505 font-mono">Fréquence cumulée : <strong className="text-pink-600 text-sm">9 suivis</strong></p>
                <span className="text-[10px] text-slate-450 italic leading-none block">Dossiers de maternité et carnet</span>
              </div>

              <div className="p-4 bg-slate-55 border border-slate-200 rounded-lg text-xs space-y-1">
                <span className="text-[10px] text-slate-400 tracking-wider block uppercase font-mono">CODE: ML-URG-11</span>
                <h4 className="font-bold text-slate-900">Urgences Triage Clinique</h4>
                <p className="text-slate-505 font-mono">Fréquence cumulée : <strong className="text-slate-900 text-sm">{triages.length} fiches</strong></p>
                <span className="text-[10px] text-indigo-600 font-bold leading-none block">Index de saturation clinique</span>
              </div>
            </div>
          </div>

          {/* Visual Recharts section for Pathologies */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-3xs">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Heart className="h-4 w-4 text-red-650" /> Distribution Graphique des Pathologies Détectées
              </h3>
              
              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={diagnostics} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#64748b" }} />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {diagnostics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pathologies percentage legend card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">Sévérité du Tableau Clinique</h3>
              <div className="space-y-3 text-xs">
                {diagnostics.map((d, index) => (
                  <div key={index} className="flex justify-between items-center font-medium">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }}></span>
                      <span className="text-slate-700">{d.name}</span>
                    </span>
                    <strong className="font-mono text-slate-900">{d.value} rpts</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : activeSubTab === "fins" ? (
        <div className="space-y-6 animate-fade-in">
          {/* Top analytical financial layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Total Émis (Prestations)</span>
                <span className="text-xl font-bold font-mono text-slate-850">{totalInvoiced.toLocaleString("fr-FR")} F</span>
              </div>
              <DollarSign className="h-6 w-6 text-slate-400" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Total Encaissé / Trésor</span>
                <span className="text-xl font-bold font-mono text-emerald-700">{totalPaid.toLocaleString("fr-FR")} F</span>
              </div>
              <DollarSign className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase pb-1">Encours Administratif (Dû)</span>
                <span className="text-xl font-bold font-mono text-amber-700">{totalPending.toLocaleString("fr-FR")} F</span>
              </div>
              <DollarSign className="h-6 w-6 text-amber-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Chart for revenues */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="h-4.5 w-4.5 text-emerald-600" /> Ventilation des recettes par moyen de règlement
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">Exprimé en FCFA</span>
              </div>

              <div className="h-64 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialChartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                    <XAxis type="number" tick={{ fill: "#64748b" }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} />
                    <Tooltip cursor={{ fill: "#f8fafc" }} />
                    <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                      {financialChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick action box */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 font-semibold text-xs text-slate-800 shadow-3xs">
              <h3 className="font-bold text-xs text-slate-705 uppercase tracking-wider border-b pb-2 flex items-center gap-1">
                <Layers className="h-4 w-4 text-sky-650" /> Centre d'Exports Comptables
              </h3>
              
              <p className="text-[10.5px] font-sans text-slate-400 font-medium leading-relaxed">
                Sauvegardez l'intégralité du grand livre de facturation pour vos outils comptables (SAGE / Excel / XML Douanes).
              </p>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleExportFinancialsCSV}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-250 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4 text-slate-500" />
                  <span>Exporter Journal Factures (CSV)</span>
                </button>

                <button
                  onClick={handleExportFinancialsXML}
                  className="w-full bg-slate-105 hover:bg-slate-200 text-slate-800 border border-slate-250 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>Générer Schema de Trésor (XML)</span>
                </button>
              </div>

              <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-900 leading-normal">
                <strong>💡 Note Tiers-Payant:</strong> La prise en charge AMO par la CANAM (Caisse Nationale d'Assurance Maladie) requiert l'envoi d'un duplicata XML structuré à la fin de chaque quinzaine administrative.
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Yields & Flow analysis kpis */
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-3xs space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Activity className="h-4.5 w-4.5 text-[#0284c7]" /> Courbe d'affluence des admissions (Triage moyen)
              </h3>

              <div className="h-60 text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={admissionTrendsData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                    <XAxis dataKey="jour" tick={{ fill: "#64748b" }} />
                    <YAxis tick={{ fill: "#64748b" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="admissions" stroke={accentColor} strokeWidth={2.5} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 space-y-4 shadow-3xs text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <UserCheck className="h-4.5 w-4.5 text-indigo-600" /> Indicateurs Opérationnels Clés (DMS & Rendements)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black font-mono">DURÉE MOYENNE SÉJOUR</span>
                  <h4 className="text-xl font-black text-slate-900">3.4 Jours</h4>
                  <p className="text-slate-500 leading-relaxed text-[10px] font-normal">
                    Durée de garde et occupation des lits d'hospitalisation de médecine interne.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black font-mono">DÉLAI DE PRISE EN CHARGE</span>
                  <h4 className="text-xl font-black text-slate-900">12 minutes</h4>
                  <p className="text-slate-500 leading-relaxed text-[10px] font-normal">
                    Temps moyen d'attente d'incorporation clinique après constitution du ticket modérateur.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-150 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black font-mono">LOBBYING DE GARDE</span>
                  <h4 className="text-xl font-black text-slate-900">88%</h4>
                  <p className="text-slate-500 leading-relaxed text-[10px] font-normal">
                    Taux d'affection de personnel en service continu de nuit.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-black font-mono">TAUX DE RECOUVREMENT</span>
                  <h3 className="text-xl font-black text-purple-900">
                    {((totalPaid / (totalInvoiced || 1)) * 100).toFixed(1)}%
                  </h3>
                  <p className="text-slate-500 leading-relaxed text-[10px] font-normal">
                    Index de liquidation immédiate des fiches d'actes d'officines et de soins cliniques.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
