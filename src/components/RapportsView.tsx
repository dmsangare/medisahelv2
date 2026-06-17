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
  UserCheck,
  User,
  Clock,
  MapPin
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
  const [activeSubTab, setActiveSubTab] = useState<"snis" | "fins" | "kpis" | "inps" | "canam" | "mdo">("snis");

  // Dynamic demographics indicators
  const ethnieStats = patients.reduce((acc: Record<string, number>, p) => {
    const eth = p.ethnie || "Non renseignée";
    acc[eth] = (acc[eth] || 0) + 1;
    return acc;
  }, {});

  const nationaliteStats = patients.reduce((acc: Record<string, number>, p) => {
    const nat = p.nationalite || "Non renseignée";
    acc[nat] = (acc[nat] || 0) + 1;
    return acc;
  }, {});

  const genderStats = patients.reduce((acc: Record<string, number>, p) => {
    const s = p.gender === "M" ? "Masculin (M)" : p.gender === "F" ? "Féminin (F)" : "Non spécifié";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const communeStats = patients.reduce((acc: Record<string, number>, p) => {
    const c = p.commune || "Non renseignée";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const ageGroupStats = patients.reduce((acc: Record<string, number>, p) => {
    if (!p.dateOfBirth) {
      acc["Non spécifié"] = (acc["Non spécifié"] || 0) + 1;
      return acc;
    }
    try {
      const birthday = new Date(p.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthday.getFullYear();
      const m = today.getMonth() - birthday.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
        age--;
      }
      let grp = "65+ ans";
      if (age < 5) grp = "0-4 ans (Nourrissons)";
      else if (age < 15) grp = "5-14 ans (Enfants)";
      else if (age < 45) grp = "15-44 ans (Jeunes / Adultes)";
      else if (age < 65) grp = "45-64 ans (Séniors)";
      acc[grp] = (acc[grp] || 0) + 1;
    } catch (e) {
      acc["Non spécifié"] = (acc["Non spécifié"] || 0) + 1;
    }
    return acc;
  }, {});

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

  const handleExportINPS = () => {
    const headers = ["Code_Dossier_INPS", "Raison_Sociale_Employeur", "Salarie_Assure_Identite", "Type_Sinistre_Incapacite", "Nature_Infection_Traumatisme", "Frais_Medicaux_Prise_En_Charge_FCFA", "Duree_Incapacite_Jours", "Status_Approbation"];
    const rows = [
      ["INPS-2026-0081", "BRAMALI SA", "Moussa TRAORÉ", "Accident du Travail", "Traumatisme membre supérieur droit", "45000", "15", "CAP-ACCEPTEE"],
      ["INPS-2026-0082", "BATIMEX SARL", "Aramatou KEITA", "Maladie Professionnelle", "Pneumoconiose de contact / inhalation", "95000", "30", "SOUS-REVUE"],
      ["INPS-2026-0083", "MALI TELECOM (SOTELMA)", "Ibrahim COULIBALY", "Accident du Travail", "Chute de hauteur avec entorse lombaire", "12500", "7", "APPROUVE"],
      ["INPS-2026-0084", "OFFICE DU NIGER", "Fatoumata DIARRA", "Accident de Trajet", "Contusion thoracique", "28000", "10", "APPROUVE"]
    ];
    handleCSVExport("MEDISHAHEL_RAPPORT_TRIMESTRE_INPS", headers, rows);
  };

  const handleExportCANAM = () => {
    const headers = ["Num_Bordereau_CANAM", "Identifiant_AMO_CANAM", "Nom_Beneficiaire_Patient", "Prestation_Medicale_Realisee", "Montant_Total_Prestation_FCFA", "Prise_En_Charge_AMO_80_FCFA", "Ticket_Modérateur_20_FCFA", "Statut_Dossier"];
    const rows = [
      ["BORD-CANAM-2026-041", "AMO-ML-991204-B", "Mariam KONE", "Hospitalisation VIP + Bilan NFS", "45000", "36000", "9000", "VALIDE_SANS_REJET"],
      ["BORD-CANAM-2026-042", "AMO-ML-842210-H", "Aminata DIALLO", "Consultation externe + Test TDR", "15000", "12000", "3000", "APPROUVE"],
      ["BORD-CANAM-2026-043", "AMO-ML-735102-C", "Bakary SACKO", "Échographie Abdominale d'urgence", "25000", "20000", "5000", "VALIDE_SANS_REJET"],
      ["BORD-CANAM-2026-044", "AMO-ML-190457-A", "Salif COULIBALY", "Examen ECBU Urinaire", "12000", "9600", "2400", "EN_COURS_LIQUIDATION"]
    ];
    handleCSVExport("MEDISHAHEL_BORDEREAU_RECETTES_CANAM", headers, rows);
  };

  const handleExportMDO = () => {
    const headers = ["Pathologie_Surveillance_MDO", "Cas_Cumules_Etablissement", "Seuil_Alerte_Epidemio", "District_Surveillance_Bamako", "Declaration_Obligatoire_Status"];
    const rows = [
      ["Paludisme Grave (GE+)", "8", "10 cas / quinzaine", "BAMAKO COMMUNE III", "DÉCLARÉ_IMMEDIAT"],
      ["Méningite Cérébro-spinale", "0", "1 cas d'alerte", "BAMAKO COMMUNE III", "VIERGE"],
      ["Rougeole / Exanthème", "2", "3 cas d'alerte", "BAMAKO COMMUNE III", "DÉCLARÉ_EN_COURS"],
      ["Choléra / Diarrhée aqueuse", "0", "1 cas d'alerte", "BAMAKO COMMUNE III", "VIERGE"],
      ["Fièvre Jaune", "0", "1 cas d'alerte", "BAMAKO COMMUNE III", "VIERGE"],
      ["Tuberculose active pulmonaire", "1", "5 cas d'alerte", "BAMAKO COMMUNE III", "DÉCLARÉ_MENSUEL"]
    ];
    handleCSVExport("MEDISHAHEL_SURVEILLANCE_MDO_SANTE", headers, rows);
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

  const handlePrintINPSReport = () => {
    const pWind = window.open("", "_blank");
    if (!pWind) return;
    pWind.document.write(`
      <html>
        <head>
          <title>RAPPORT TRIMESTRIEL INPS - INSTITUT NATIONAL DE PRÉVOYANCE SOCIALE</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 50px; line-height: 1.5; color: #000; }
            .inps-header { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
            .inps-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
            .section-meteo { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; text-transform: uppercase; font-weight: bold; }
            .grand-titre { text-align: center; margin: 25px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .certified-stamp { border: 2px solid #2563eb; color: #2563eb; padding: 8px 15px; font-size: 11px; font-weight: bold; transform: rotate(-1deg); display: inline-block; text-transform: uppercase; margin-top: 30px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="inps-header">
            RÉPUBLIQUE DU MALI<br/>
            Un Peuple - Un But - Une Foi<br/>
            <span class="inps-title">INSTITUT NATIONAL DE PRÉVOYANCE SOCIALE (INPS - MALI)</span><br/>
            <span>DIRECTION DES PRESTATIONS FAMILIALES ET ACCIDENTS DU TRAVAIL</span>
          </div>

          <div class="section-meteo">
            <div>
              <strong>ORGANISME DE SOINS :</strong> CLINIQUE CENTRALE MÉDISAHEL<br/>
              <strong>CONVENTION ADHÉRENTE :</strong> N° COD-2026-INPS/SAHEL
            </div>
            <div style="text-align: right;">
              <strong>RÉFÉRENCE RAPPORT :</strong> INPS-ML-TRIM-${new Date().getFullYear()}-02<br/>
              <strong>MOIS SOCIAL :</strong> ${new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })}
            </div>
          </div>

          <div class="grand-titre">RAPPORT EXÉCUTIF TRIMESTRIEL DES ACCIDENTS DU TRAVAIL ET ARRETS SOCIALES</div>

          <p>Le présent rapport transmet de manière contradictoire les dossiers de sinistres professionnels, accidents de trajet et maladies professionnelles validés au sein de la Clinique centrale MédiSahel Mali pour liquidation directe.</p>

          <table>
            <thead>
              <tr>
                <th>Code INPS</th>
                <th>Employeur / Affiliation</th>
                <th>Salarie Assuré</th>
                <th>Type de Sinistre Clinique</th>
                <th>Nombre Jours d'Incapacité</th>
                <th>Frais Médicaux (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>INPS-2026-0081</strong></td>
                <td>BRAMALI SA</td>
                <td>Moussa TRAORÉ</td>
                <td>Accident du Travail (Traumatisme membre supp.)</td>
                <td>15 Jours</td>
                <td>45 000 FCFA</td>
              </tr>
              <tr>
                <td><strong>INPS-2026-0082</strong></td>
                <td>BATIMEX SARL</td>
                <td>Aramatou KEITA</td>
                <td>Maladie Professionnelle (Pneumoconiose de contact)</td>
                <td>30 Jours</td>
                <td>95 000 FCFA</td>
              </tr>
              <tr>
                <td><strong>INPS-2026-0083</strong></td>
                <td>MALI TELECOM (SOTELMA)</td>
                <td>Ibrahim COULIBALY</td>
                <td>Accident du Travail (Entorse lombaire aiguë)</td>
                <td>7 Jours</td>
                <td>12 500 FCFA</td>
              </tr>
              <tr>
                <td><strong>INPS-2026-0084</strong></td>
                <td>OFFICE DU NIGER</td>
                <td>Fatoumata DIARRA</td>
                <td>Accident de Trajet (Contusion pulmonaire)</td>
                <td>10 Jours</td>
                <td>28 000 FCFA</td>
              </tr>
            </tbody>
          </table>

          <div class="certified-stamp">CONFORME AUX PROTOCOLES LIQUIDATEURS INPS MALI</div>

          <div class="signatures">
            <div>
              <strong>Pour la Commission Médicale INPS :</strong><br/>
              <em>Contrôleur-Général Adjoint aux Sinistres</em><br/><br/>
            </div>
            <div style="text-align: right;">
              <strong>Le Directeur de Clinique :</strong><br/>
              <em>Dr. Adama Sangaré</em><br/><br/>
              Cachet de la Caisse Principale MédiSahel
            </div>
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
  };

  const handlePrintCANAMReport = () => {
    const pWind = window.open("", "_blank");
    if (!pWind) return;
    pWind.document.write(`
      <html>
        <head>
          <title>BORDEREAU MENSUEL CANAM / AMO - CAISSE NATIONALE D'ASSURANCE MALADIE</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 50px; line-height: 1.5; color: #000; }
            .canam-header { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
            .canam-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
            .section-meteo { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; text-transform: uppercase; font-weight: bold; }
            .grand-titre { text-align: center; margin: 25px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .certified-stamp { border: 2px solid #16a34a; color: #16a34a; padding: 8px 15px; font-size: 11px; font-weight: bold; transform: rotate(1deg); display: inline-block; text-transform: uppercase; margin-top: 30px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="canam-header">
            RÉPUBLIQUE DU MALI<br/>
            Un Peuple - Un But - Une Foi<br/>
            <span class="canam-title">CAISSE NATIONALE D'ASSURANCE MALADIE (CANAM - MALI)</span><br/>
            <span>EXPLOITATION DES DOSSIERS AMO • TIERS PAYANT CENTRALISÉ</span>
          </div>

          <div class="section-meteo font-mono">
            <div>
              <strong>ÉTABLISSEMENT AGREE :</strong> CLINIQUE MÉDISAHEL BAMAKO<br/>
              <strong>CONVENTION AMO :</strong> N° 9422/MS-CANAM-2026
            </div>
            <div style="text-align: right;">
              <strong>BORDEREAU N° :</strong> BORD-CANAM-2026-OM410<br/>
              <strong>MOIS DES RECETTES :</strong> ${new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })}
            </div>
          </div>

          <div class="grand-titre">BORDEREAU RÉCAPITULATIF RECOURT POUR LE COMPTE DE LA CANAM (PART ASSURANCE 80%)</div>

          <p>Le présent relevé de facturation dresse les prises en charge accordées aux bénéficiaires de l'Assurance Maladie Obligatoire (AMO) au cours de la période d'exercice réglementaire.</p>

          <table>
            <thead>
              <tr>
                <th>Bordereau CANAM</th>
                <th>Identifiant AMO Assuré</th>
                <th>Bénéficiaire (Patient)</th>
                <th>Nature Acte Clinique</th>
                <th>Montant Total (FCFA)</th>
                <th>Prise en Charge AMO (80%)</th>
                <th>Ticket Modérateur (20%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>BORD-CANAM-2026-041</strong></td>
                <td>AMO-ML-991204-B</td>
                <td>Mariam KONE</td>
                <td>Hospitalisation VIP + Bilan NFS</td>
                <td>45 050 FCFA</td>
                <td style="color: #16a34a; font-weight: bold;">36 040 FCFA</td>
                <td>9 010 FCFA</td>
              </tr>
              <tr>
                <td><strong>BORD-CANAM-2026-042</strong></td>
                <td>AMO-ML-842210-H</td>
                <td>Aminata DIALLO</td>
                <td>Consultation externe + Test TDR</td>
                <td>15 000 FCFA</td>
                <td style="color: #16a34a; font-weight: bold;">12 000 FCFA</td>
                <td>3 000 FCFA</td>
              </tr>
              <tr>
                <td><strong>BORD-CANAM-2026-043</strong></td>
                <td>AMO-ML-735102-C</td>
                <td>Bakary SACKO</td>
                <td>Échographie Abdominale d'urgence</td>
                <td>25 000 FCFA</td>
                <td style="color: #16a34a; font-weight: bold;">20 000 FCFA</td>
                <td>5 000 FCFA</td>
              </tr>
              <tr>
                <td><strong>BORD-CANAM-2026-044</strong></td>
                <td>AMO-ML-190457-A</td>
                <td>Salif COULIBALY</td>
                <td>Examen ECBU Urinaire</td>
                <td>12 000 FCFA</td>
                <td style="color: #16a34a; font-weight: bold;">9 600 FCFA</td>
                <td>2 400 FCFA</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f2f2f2;">
                <td colSpan="4">CUMUL DU BORDEREAU</td>
                <td>97 050 FCFA</td>
                <td style="color: #16a34a;">77 640 FCFA</td>
                <td>19 410 FCFA</td>
              </tr>
            </tfoot>
          </table>

          <div class="certified-stamp">CONFORME AUX PROTOCOLES LIQUIDATEURS AMO CANAM MALI</div>

          <div class="signatures">
            <div>
              <strong>Pour la Commission de Validation Clinique :</strong><br/>
              <em>Médecin Conseil Canam Région Bamako</em><br/><br/>
            </div>
            <div style="text-align: right;">
              <strong>La Présidente de Clinique :</strong><br/>
              <em>Adama SANGARÉ</em><br/><br/>
              Signature & Paraphe de contrôle
            </div>
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
  };

  const handlePrintMDOReport = () => {
    const pWind = window.open("", "_blank");
    if (!pWind) return;
    pWind.document.write(`
      <html>
        <head>
          <title>FICHE ÉPIDÉMIOLOGIQUE - MALADIES À DÉCLARATION OBLIGATOIRE (MDO)</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 50px; line-height: 1.5; color: #000; }
            .mdo-header { text-align: center; text-transform: uppercase; font-weight: bold; font-size: 14px; margin-bottom: 25px; }
            .mdo-title { font-size: 16px; font-weight: 900; letter-spacing: 0.5px; }
            .section-meteo { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; text-transform: uppercase; font-weight: bold; }
            .grand-titre { text-align: center; margin: 25px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .certified-stamp { border: 2px solid #dc2626; color: #dc2626; padding: 8px 15px; font-size: 11px; font-weight: bold; transform: rotate(-1deg); display: inline-block; text-transform: uppercase; margin-top: 30px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; font-size: 13px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="mdo-header">
            RÉPUBLIQUE DU MALI<br/>
            Un Peuple - Un But - Une Foi<br/>
            <span class="mdo-title">MINISTÈRE DE LA SANTÉ ET DU DÉVELOPPEMENT SOCIAL</span><br/>
            <span>DIRECTION NATIONAL DE LA SANTÉ (SURVEILLANCE ÉPIDÉMIOLOGIQUE MDO)</span>
          </div>

          <div class="section-meteo">
            <div>
              <strong>DISTRICT SANITAIRE :</strong> BAMAKO COMMUNE III<br/>
              <strong>POINT SENTINELLE :</strong> CLINIQUE GLOBALE MÉDISAHEL BAMAKO
            </div>
            <div style="text-align: right;">
              <strong>RÉFÉRENCE MDO :</strong> MDO-WHO-ML-2026-C3<br/>
              <strong>SEMAINE ÉPIDÉMIOLOGIQUE :</strong> Semaine active ${new Date().getMonth() + 1}-2026
            </div>
          </div>

          <div class="grand-titre">REGISTRE MENSUEL DE SURVEILLANCE DES MALADIES À DÉCLARATION OBLIGATOIRE (MDO)</div>

          <p>Le présent canevas récapitule les pathologies d'alerte épidémiologique immédiate et hebdomadaire surveillés sur le sol du district central de Bamako, conformément aux statuts de l'OMS.</p>

          <table>
            <thead>
              <tr>
                <th>Pathologie Sous Surveillance (MDO)</th>
                <th>Symptomatologie Clé</th>
                <th>Cas Cumulés</th>
                <th>Seuil d'Alerte District</th>
                <th>Statut Alerte / Riposte</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Paludisme Grave (Goutte Épaisse +)</strong></td>
                <td>Fièvre + Anémie + Troubles neuros</td>
                <td style="color: #dc2626; font-weight: bold;">8 cas</td>
                <td>10 cas / quinzaine</td>
                <td>Vigilance Épidémique</td>
              </tr>
              <tr>
                <td><strong>Méningite Cérébro-spinale</strong></td>
                <td>Raideur de nuque + Purpura</td>
                <td>0 cas</td>
                <td>1 cas</td>
                <td>Normal</td>
              </tr>
              <tr>
                <td><strong>Rougeole / Exanthème fébrile</strong></td>
                <td>Éruption cutanée généralisée</td>
                <td style="color: #d97706; font-weight: bold;">2 cas</td>
                <td>3 cas</td>
                <td>Sous-surveillance étroite</td>
              </tr>
              <tr>
                <td><strong>Choléra / Diarrhée Cholériforme</strong></td>
                <td>Selles "eau de riz" + déshydratation intense</td>
                <td>0 cas</td>
                <td>1 cas</td>
                <td>Normal</td>
              </tr>
              <tr>
                <td><strong>Fièvre Jaune</strong></td>
                <td>Ictère fébrile + Douleurs lombaires</td>
                <td>0 cas</td>
                <td>1 cas</td>
                <td>Normal</td>
              </tr>
              <tr>
                <td><strong>Tuberculose Active Pulmonaire</strong></td>
                <td>Toux durable > 3 semaines + hémoptysie</td>
                <td>1 cas</td>
                <td>5 cas / mois</td>
                <td>Suivi thérapeutique DOPE</td>
              </tr>
            </tbody>
          </table>

          <div class="certified-stamp">TRANSMIS D'URGENCE AU RESPONSABLE DE RIPOSTE COMMUNAL</div>

          <div class="signatures">
            <div>
              <strong>Pour la Surveillance Départementale :</strong><br/>
              <em>Chargée d'Éco-épidémiologie de Secteur</em><br/><br/>
            </div>
            <div style="text-align: right;">
              <strong>Le Directeur Médical :</strong><br/>
              <em>Dr. Ibrahim Touré</em><br/><br/>
              Cachet officiel d'admission de MédiSahel
            </div>
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
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
        <div className="bg-slate-100 p-1.5 rounded-lg border flex flex-wrap items-center gap-1 text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab("snis")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "snis" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            📋 Canevas SNIS
          </button>
          <button
            onClick={() => setActiveSubTab("inps")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "inps" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            🏢 Rapport INPS
          </button>
          <button
            onClick={() => setActiveSubTab("canam")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "canam" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            🟢 Bordereau CANAM (AMO)
          </button>
          <button
            onClick={() => setActiveSubTab("mdo")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "mdo" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            🚨 Surveillance MDO
          </button>
          <button
            onClick={() => setActiveSubTab("fins")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "fins" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            💰 Trésorerie & Caisse
          </button>
          <button
            onClick={() => setActiveSubTab("kpis")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSubTab === "kpis" ? "bg-white text-slate-900 shadow-3xs font-bold" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            📈 Flux & Rendements
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
      ) : activeSubTab === "inps" ? (
        <div className="space-y-6 animate-fade-in">
          {/* INPS Tab View */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-5 w-5 text-blue-650" /> Accident du Travail & Cotisations INPS (Mali)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Rapports trimestriels pour l'Institut National de Prévoyance Sociale (INPS). Déclaration de sinistres et arrêts de travail.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportINPS}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Exporter INPS Excel (CSV)
                </button>
                <button
                  onClick={handlePrintINPSReport}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Editer Rapport Officiel PDF (INPS)
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Total Charges INPS</span>
                <strong className="text-lg text-slate-900 block font-mono">180.500 FCFA</strong>
                <span className="text-[10px] text-slate-500">Taux de remboursement : 100% direct-payant</span>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Accidents Du Travail Actifs</span>
                <strong className="text-lg text-slate-900 block font-mono">3 Sinistres déclarés</strong>
                <span className="text-[10px] text-blue-600 font-bold">Certificat initial visé</span>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Incapacités Cumulées</span>
                <strong className="text-lg text-slate-900 block font-mono">62 Jours d'arrêt</strong>
                <span className="text-[10px] text-amber-600 font-bold">Moyenne 20.6 jours par dossier</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-700 uppercase border-b">
                  <tr>
                    <th className="p-3">Réf INPS</th>
                    <th className="p-3">Employeur Clinique</th>
                    <th className="p-3">Salarié Assuré</th>
                    <th className="p-3">Type & Nature Sinistre</th>
                    <th className="p-3 text-right">Frais Médicaux</th>
                    <th className="p-3 text-right">Incapacité</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">INPS-2026-0081</td>
                    <td className="p-3">BRAMALI SA</td>
                    <td className="p-3">Moussa TRAORÉ</td>
                    <td className="p-3">Accident du Travail (Traumatisme membre supp.)</td>
                    <td className="p-3 text-right font-mono text-emerald-700">45 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-amber-700">15 Jours</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">INPS-2026-0082</td>
                    <td className="p-3">BATIMEX SARL</td>
                    <td className="p-3">Aramatou KEITA</td>
                    <td className="p-3">Maladie Professionnelle (Pneumoconiose de contact)</td>
                    <td className="p-3 text-right font-mono text-emerald-700">95 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-amber-700">30 Jours</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">INPS-2026-0083</td>
                    <td className="p-3">MALI TELECOM (SOTELMA)</td>
                    <td className="p-3">Ibrahim COULIBALY</td>
                    <td className="p-3 font-medium">Accident du Travail (Entorse lombaire aiguë)</td>
                    <td className="p-3 text-right font-mono text-emerald-700">12 500 FCFA</td>
                    <td className="p-3 text-right font-mono text-amber-700">7 Jours</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">INPS-2026-0084</td>
                    <td className="p-3">OFFICE DU NIGER</td>
                    <td className="p-3">Fatoumata DIARRA</td>
                    <td className="p-3 font-medium">Accident de Trajet (Contusion pulmonaire)</td>
                    <td className="p-3 text-right font-mono text-emerald-700">28 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-amber-700">10 Jours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === "canam" ? (
        <div className="space-y-6 animate-fade-in">
          {/* CANAM Tab View */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" /> Caisse Nationale d'Assurance Maladie (CANAM - AMO Mali)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Bordereaux de liquidation de tiers-payant centralisés de la part d'assurance (AMO 80%) et régie de régulation sanitaire.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportCANAM}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Exporter CANAM Excel (CSV)
                </button>
                <button
                  onClick={handlePrintCANAMReport}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Editer Rapport Officiel PDF (CANAM)
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Facturation Brute AMO</span>
                <strong className="text-lg text-slate-900 block font-mono">97.050 FCFA</strong>
                <span className="text-[10px] text-slate-500">Total actes assujettis aux ayants-droit</span>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Part Prise En Charge AMO (80%)</span>
                <strong className="text-lg text-emerald-705 block font-mono">77.640 FCFA</strong>
                <span className="text-[10px] text-emerald-600 font-bold">Remboursement direct en cours</span>
              </div>
              <div className="p-4 bg-slate-50 border rounded-lg">
                <span className="text-slate-400 block font-mono text-[9px] uppercase font-black">Ticket Modérateur (20%)</span>
                <strong className="text-lg text-slate-900 block font-mono">19.410 FCFA</strong>
                <span className="text-[10px] text-slate-500">Recouvré directement en caisse des patients</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-700 uppercase border-b">
                  <tr>
                    <th className="p-3">Num Bordereau</th>
                    <th className="p-3">Matricule AMO</th>
                    <th className="p-3">Bénéficiaire (Patient)</th>
                    <th className="p-3">Prestation Exécutée</th>
                    <th className="p-3 text-right">Montant Brut</th>
                    <th className="p-3 text-right">Frais AMO (80%)</th>
                    <th className="p-3 text-right">Part Patient (20%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">BORD-CANAM-2026-041</td>
                    <td className="p-3 font-mono">AMO-ML-991204-B</td>
                    <td className="p-3">Mariam KONE</td>
                    <td className="p-3">Hospitalisation VIP + Bilan NFS</td>
                    <td className="p-3 text-right font-mono">45 050 FCFA</td>
                    <td className="p-3 text-right font-mono text-emerald-700">36 040 FCFA</td>
                    <td className="p-3 text-right font-mono">9 010 FCFA</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">BORD-CANAM-2026-042</td>
                    <td className="p-3 font-mono">AMO-ML-842210-H</td>
                    <td className="p-3">Aminata DIALLO</td>
                    <td className="p-3">Consultation externe + Test TDR</td>
                    <td className="p-3 text-right font-mono">15 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-emerald-700">12 000 FCFA</td>
                    <td className="p-3 text-right font-mono">3 000 FCFA</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">BORD-CANAM-2026-043</td>
                    <td className="p-3 font-mono">AMO-ML-735102-C</td>
                    <td className="p-3">Bakary SACKO</td>
                    <td className="p-3 font-medium">Échographie Abdominale d'urgence</td>
                    <td className="p-3 text-right font-mono">25 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-emerald-700">20 000 FCFA</td>
                    <td className="p-3 text-right font-mono">5 000 FCFA</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold">BORD-CANAM-2026-044</td>
                    <td className="p-3 font-mono">AMO-ML-190457-A</td>
                    <td className="p-3">Salif COULIBALY</td>
                    <td className="p-3 font-medium">Examen ECBU Urinaire</td>
                    <td className="p-3 text-right font-mono">12 000 FCFA</td>
                    <td className="p-3 text-right font-mono text-emerald-700">9 600 FCFA</td>
                    <td className="p-3 text-right font-mono">2 400 FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeSubTab === "mdo" ? (
        <div className="space-y-6 animate-fade-in">
          {/* MDO Tab View */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-5 w-5 text-red-650" /> Maladies à Déclaration Obligatoire (MDO - RSS Mali)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  Tableau d'alerte épidémiologique et registre sanitaire de déclaration obligatoire pour le Ministère de la Santé Malien.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleExportMDO}
                  className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-bold py-1.5 px-3 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Exporter MDO Excel (CSV)
                </button>
                <button
                  onClick={handlePrintMDOReport}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="h-4 w-4" /> Editer Rapport Officiel PDF (MDO)
                </button>
              </div>
            </div>

            {/* Quick warning banner */}
            <div className="bg-red-50 text-red-955 p-3.5 rounded-xl border border-red-200/50 text-[10.5px] font-medium leading-relaxed">
              <strong>📢 Vigilance Épidémiologique SNIS Mali :</strong> Tous les cas suspectés ou détectés de méningite cérébro-spinale ou choléra doivent faire l'objet d'une télédiffusion sécurisée instantanée à la Direction Nationale de la Santé (DNS) sous 24h.
            </div>

            {/* Table */}
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-xs text-left text-slate-600">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-700 uppercase border-b">
                  <tr>
                    <th className="p-3">MALADIE EN SURVEILLANCE</th>
                    <th className="p-3">Seuil critique district</th>
                    <th className="p-3">Symptômes clés d'accueil</th>
                    <th className="p-3 text-center">Fiches déclarées</th>
                    <th className="p-3 text-right">Statut Riposte</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">Paludisme Grave (GE+)</td>
                    <td className="p-3">10 cas / quinzaine</td>
                    <td className="p-3 text-slate-500 font-normal">Fièvre intense + anémie + convulsions</td>
                    <td className="p-3 text-center font-bold text-red-650 font-mono">8 CAS</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 text-[9px] bg-red-50 text-red-700 font-extrabold rounded">DÉCLARÉ IMMEDIAT</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">Méningite Cérébro-spinale</td>
                    <td className="p-3">1 cas d'alerte</td>
                    <td className="p-3 text-slate-500 font-normal">Céphalées intenses + raideur méningée</td>
                    <td className="p-3 text-center font-mono">0 CAS</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 text-[9px] bg-sky-50 text-slate-700 font-extrabold rounded">VIERGE</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">Rougeole / Exanthème suspect</td>
                    <td className="p-3">3 cas d'alerte</td>
                    <td className="p-3 text-slate-500 font-normal">Éruption morbilliforme + toux + fièvre</td>
                    <td className="p-3 text-center font-bold font-mono text-amber-700">2 CAS</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 text-[9px] bg-amber-50 text-amber-700 font-extrabold rounded">SOUS VIGILANCE</span></td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold">Choléra / Diarrhée aqueuse d'urgence</td>
                    <td className="p-3">1 cas d'alerte</td>
                    <td className="p-3 text-slate-500 font-normal">Diarrhée "eau de riz" + vomissements rapides</td>
                    <td className="p-3 text-center font-mono">0 CAS</td>
                    <td className="p-3 text-right"><span className="px-2 py-0.5 text-[9px] bg-sky-50 text-slate-700 font-extrabold rounded">VIERGE</span></td>
                  </tr>
                </tbody>
              </table>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-3xs space-y-4 text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-teal-600" /> Répartition Ethnique des Patients
              </h3>
              <div className="max-h-60 overflow-y-auto text-xs space-y-2 pr-1">
                {Object.entries(ethnieStats).map(([eth, count]) => {
                  const percentage = ((count / (patients.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={eth} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 bg-white shadow-3xs">
                      <span className="font-medium text-slate-700">{eth}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-gray-500">{count} {count > 1 ? "patients" : "patient"}</span>
                        <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-3xs space-y-4 text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <User className="h-4.5 w-4.5 text-rose-500" /> Répartition par Sexe
              </h3>
              <div className="max-h-60 overflow-y-auto text-xs space-y-2 pr-1">
                {Object.entries(genderStats).map(([gender, count]) => {
                  const percentage = ((count / (patients.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={gender} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 bg-white shadow-3xs">
                      <span className="font-medium text-slate-700">{gender}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-gray-500">{count} {count > 1 ? "patients" : "patient"}</span>
                        <span className="font-bold text-rose-750 bg-rose-50 px-2 py-0.5 rounded-md">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-3xs space-y-4 text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-orange-500" /> Répartition par Tranche d'âge
              </h3>
              <div className="max-h-60 overflow-y-auto text-xs space-y-2 pr-1">
                {Object.entries(ageGroupStats).map(([ageGroup, count]) => {
                  const percentage = ((count / (patients.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={ageGroup} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 bg-white shadow-3xs">
                      <span className="font-medium text-slate-700">{ageGroup}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-gray-500">{count} {count > 1 ? "patients" : "patient"}</span>
                        <span className="font-bold text-orange-750 bg-orange-50 px-2 py-0.5 rounded-md">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-3xs space-y-4 text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <MapPin className="h-4.5 w-4.5 text-emerald-600" /> Répartition par Commune
              </h3>
              <div className="max-h-60 overflow-y-auto text-xs space-y-2 pr-1">
                {Object.entries(communeStats).map(([commune, count]) => {
                  const percentage = ((count / (patients.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={commune} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 bg-white shadow-3xs">
                      <span className="font-medium text-slate-700">{commune}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-gray-500">{count} {count > 1 ? "patients" : "patient"}</span>
                        <span className="font-bold text-emerald-750 bg-emerald-50 px-2 py-0.5 rounded-md">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-3xs space-y-4 text-xs font-semibold">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
                <Layers className="h-4.5 w-4.5 text-indigo-650" /> Répartition par Nationalité des Patients
              </h3>
              <div className="max-h-60 overflow-y-auto text-xs space-y-2 pr-1">
                {Object.entries(nationaliteStats).map(([nat, count]) => {
                  const percentage = ((count / (patients.length || 1)) * 100).toFixed(1);
                  return (
                    <div key={nat} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-slate-100 bg-white shadow-3xs">
                      <span className="font-medium text-slate-700">{nat}</span>
                      <div className="flex items-center space-x-3 font-mono">
                        <span className="text-gray-500">{count} {count > 1 ? "patients" : "patient"}</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
