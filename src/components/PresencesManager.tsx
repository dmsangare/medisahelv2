import React, { useState, useEffect } from "react";
import { 
  Users, Clock, Check, ShieldAlert, AlertCircle, FileText, 
  Settings, TrendingUp, DollarSign, PieChart, Activity, Download, 
  Trash2, UserCheck, Calendar, ShieldCheck, HelpCircle, Printer
} from "lucide-react";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { User, Attendance } from "../types.ts";

interface PresencesManagerProps {
  token: string | null;
  currentUser: User;
  clinicThemeColor: string;
}

export const PresencesManager: React.FC<PresencesManagerProps> = ({ token, currentUser, clinicThemeColor }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs states
  // Standard users can only view registry and history. Admin/HR can view the Espace Directeur & Paramètres
  const isAdminOrHR = currentUser.role === "ADMIN" || currentUser.role === "HR" || currentUser.login === "admin";
  const [activeTab, setActiveTab] = useState<"registry" | "history" | "director" | "settings">(
    isAdminOrHR ? "director" : "registry"
  );

  // Period filter for Director Tab: "JOUR" (Aujourd'hui) | "SEMAINE" (Cette Semaine) | "MOIS" (Ce Mois) | "ANNEE" (Cette Année)
  const [directorPeriod, setDirectorPeriod] = useState<"JOUR" | "SEMAINE" | "MOIS" | "ANNEE">("MOIS");

  // Local Storage Settings
  const [departmentHours, setDepartmentHours] = useState<Record<string, { start: string; end: string }>>(() => {
    try {
      const saved = localStorage.getItem("medisahel_department_hours");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      "Médecine Générale": { start: "08:00", end: "16:00" },
      "Urgences": { start: "08:00", end: "20:00" },
      "Laboratoire": { start: "07:30", end: "15:30" },
      "Pharmacie": { start: "08:00", end: "17:00" },
      "Caisse": { start: "07:45", end: "16:00" },
      "Administration": { start: "08:30", end: "17:30" }
    };
  });

  const [toleranceMinutes, setToleranceMinutes] = useState<number>(() => {
    const saved = localStorage.getItem("medisahel_tolerance_minutes");
    return saved ? parseInt(saved, 10) : 15;
  });

  const [lateReasons, setLateReasons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("medisahel_late_reasons");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      "Transport en panne",
      "Retard des transports en commun",
      "Rendez-vous médical",
      "Problème familial",
      "Intempéries",
      "Autre"
    ];
  });

  // Settings New Entry
  const [newReason, setNewReason] = useState("");

  // Pointage Manual form state (for manually adding points by administrators)
  const [pointageUser, setPointageUser] = useState("");
  const [pointageDate, setPointageDate] = useState(new Date().toISOString().split("T")[0]);
  const [pointageCheckIn, setPointageCheckIn] = useState("08:00");
  const [pointageCheckOut, setPointageCheckOut] = useState("");
  const [pointageStatus, setPointageStatus] = useState<"PRESENT" | "LATE" | "ABSENT">("PRESENT");
  const [pointageReason, setPointageReason] = useState("");

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Users
      const rUsers = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (rUsers.ok) {
        const dUsers = await rUsers.json();
        setUsers(dUsers);
      }

      // 2. Fetch Attendances
      const rAtt = await fetch("/api/attendances", { headers: { Authorization: `Bearer ${token}` } });
      if (rAtt.ok) {
        const dAtt = await rAtt.json();
        setAttendances(dAtt);
      }

      // 3. Fetch Transactions (for Director's cash metrics)
      const rTrans = await fetch("/api/transactions", { headers: { Authorization: `Bearer ${token}` } });
      if (rTrans.ok) {
        const dTrans = await rTrans.json();
        setTransactions(dTrans);
      }
    } catch (err) {
      console.error(err);
      setError("Indisponibilité temporaire du serveur de données RH.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Saves department configurations
  const saveDepartmentHours = (updated: typeof departmentHours) => {
    setDepartmentHours(updated);
    localStorage.setItem("medisahel_department_hours", JSON.stringify(updated));
    setSuccess("Horaires de service par département sauvegardés !");
    setTimeout(() => setSuccess(""), 4000);
  };

  const saveToleranceMinutes = (val: number) => {
    setToleranceMinutes(val);
    localStorage.setItem("medisahel_tolerance_minutes", String(val));
    setSuccess("Tolérance de retard mise à jour à " + val + " minutes !");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleAddReason = () => {
    if (!newReason.trim()) return;
    const updated = [...lateReasons, newReason.trim()];
    setLateReasons(updated);
    localStorage.setItem("medisahel_late_reasons", JSON.stringify(updated));
    setNewReason("");
    setSuccess("Nouveau motif de retard ajouté !");
    setTimeout(() => setSuccess(""), 4500);
  };

  const handleDeleteReason = (idx: number) => {
    const updated = lateReasons.filter((_, i) => i !== idx);
    setLateReasons(updated);
    localStorage.setItem("medisahel_late_reasons", JSON.stringify(updated));
    setSuccess("Motif de retard supprimé !");
    setTimeout(() => setSuccess(""), 4000);
  };

  // Submit manual pointage
  const handlePointageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetUser = pointageUser || currentUser.id;
    if (!targetUser) {
      setError("Veuillez sélectionner un employé.");
      return;
    }

    try {
      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: targetUser,
          date: pointageDate,
          checkIn: pointageCheckIn,
          checkOut: pointageCheckOut || null,
          status: pointageStatus,
          reason: pointageReason
        })
      });

      if (!response.ok) throw new Error("Échec d'enregistrement du pointage.");

      // Write to audit logs
      const targetUserObj = users.find(u => u.id === targetUser) || currentUser;
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "RH_POINTAGE_REGLEMENT",
          details: `Enregistrement manuel du pointage de ${targetUserObj.name} le ${pointageDate} (${pointageStatus})`
        })
      });

      setSuccess(`Registre mis à jour avec succès pour ${targetUserObj.name}.`);
      setPointageUser("");
      setPointageReason("");
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Helpers
  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.name : "Agent Hospitalier";
  };

  const getUserDetails = (id: string) => {
    return users.find(u => u.id === id);
  };

  const getUserRole = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.role : "Personnel";
  };

  const getDepartmentForUser = (userObj: any) => {
    if (!userObj) return "Médecine Générale";
    if (userObj.department) return userObj.department;
    // Map based on role default
    const r = userObj.role;
    if (r === "DOCTOR" || r === "MEDECIN_GENERAL_CHIEF") return "Médecine Générale";
    if (r === "NURSE" || r === "AIDE_SOIGNANT") return "Urgences";
    if (r === "LAB_TECH") return "Laboratoire";
    if (r === "PHARMACIST") return "Pharmacie";
    if (r === "CASHIER") return "Caisse";
    return "Administration";
  };

  // -------------------------------------------------------------
  // PART A : STATISTICS CALCULATOR FOR THE "ESPACE DIRECTEUR"
  // -------------------------------------------------------------
  const getFilteredData = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Helper: calculate if date matches selected period
    const isWithinPeriod = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;

      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (directorPeriod) {
        case "JOUR":
          return dateStr === todayStr;
        case "SEMAINE":
          return diffDays <= 7;
        case "MOIS":
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        case "ANNEE":
          return d.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    };

    // Filtered attendances and transactions
    const filteredAttendances = attendances.filter(a => isWithinPeriod(a.date));
    const filteredTransactions = transactions.filter(t => {
      if (t.status !== "PAID" && t.status !== "PARTIAL") return false;
      const tDate = t.date ? t.date.split("T")[0] : todayStr;
      return isWithinPeriod(tDate);
    });

    // Compute metrics
    const totalTransactionsAmount = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const subConsultation = filteredTransactions
      .filter(t => t.category === "CONSULTATION")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const subLab = filteredTransactions
      .filter(t => t.category === "LAB")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const subPharmSales = filteredTransactions
      .filter(t => t.category === "PHARMACY")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const subHospitalization = filteredTransactions
      .filter(t => t.category === "HOSPITALIZATION")
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const subMobilePay = filteredTransactions
      .filter(t => {
        const m = (t.paymentMethod || "").toUpperCase();
        return m.includes("ORANGE") || m.includes("WAVE") || m.includes("MOOV") || m.includes("OM");
      })
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    // Presence diagnostics
    const totalPresences = filteredAttendances.length;
    const totalLate = filteredAttendances.filter(a => a.status === "LATE").length;
    const totalAbsent = filteredAttendances.filter(a => a.status === "ABSENT").length;
    const totalPresent = filteredAttendances.filter(a => a.status === "PRESENT").length;

    const punctualityRate = totalPresences > 0 
      ? Math.round(((totalPresent) / (totalPresent + totalLate)) * 100) 
      : 100;

    // Detailed late list
    const lateList = filteredAttendances.filter(a => a.status === "LATE");

    return {
      totalTransactionsAmount,
      subConsultation,
      subLab,
      subPharmSales,
      subHospitalization,
      subMobilePay,
      totalPresences,
      totalLate,
      totalAbsent,
      totalPresent,
      punctualityRate,
      lateList,
      filteredTransactions,
      filteredAttendances
    };
  };

  const stats = getFilteredData();

  // Create datasets for chart rendering
  const getChartData = () => {
    return [
      { name: "Consultations", Montant: stats.subConsultation },
      { name: "Analyses Labo", Montant: stats.subLab },
      { name: "Vente Pharmacie", Montant: stats.subPharmSales },
      { name: "Hospitalisations", Montant: stats.subHospitalization },
      { name: "Moins Mobiles", Montant: stats.subMobilePay }
    ];
  };

  // -------------------------------------------------------------
  // PART B : HIGH FIDELITY REPORT INTEGRATION (PDF PRINT PREVIEW & EXCEL EXPORTER)
  // -------------------------------------------------------------
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Blocage de popups activé. Veuillez autoriser les fenêtres popups pour éditer le certificat PDF.");
      return;
    }

    const todayStr = new Date().toLocaleDateString("fr-FR", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    const html = `
      <html>
        <head>
          <title>MédiSahel - Rapport Synthèse Direction Générale</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: "Inter", sans-serif; padding: 40px; margin: 0; color: #1e293b; background: #fff; }
            .header-table { width: 100%; border-bottom: 3px double #0f766e; padding-bottom: 15px; margin-bottom: 25px; }
            .logo-header { font-size: 20px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: -0.5px; }
            .clinic-info { text-align: right; font-size: 11px; color: #475569; line-height: 1.4; }
            .report-title-container { text-align: center; margin: 25px 0; }
            .report-title { font-size: 22px; font-weight: 700; color: #1e293b; text-transform: uppercase; margin: 0; letter-spacing: -0.3px; }
            .report-subtitle { font-size: 11px; font-weight: 500; color: #64748b; text-transform: uppercase; margin-top: 5px; }
            .meta-block { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; padding: 15px; background: #f8fafc; border-radius: 8px; }
            .meta-item { line-height: 1.6; }
            .section-title { font-size: 13px; font-weight: 700; color: #0f766e; text-transform: uppercase; margin: 25px 0 10px 0; border-bottom: 1.5px solid #0f766e; padding-bottom: 5px; }
            .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }
            .metric-card { outline: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; background: #fafbfe; }
            .metric-card-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .metric-card-val { font-size: 16px; font-weight: 700; color: #0f766e; margin-top: 4px; }
            .grid-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11.5px; }
            .grid-table th, .grid-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            .grid-table th { background: #f1f5f9; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #334155; }
            .late-status { color: #b45309; font-weight: bold; }
            .present-status { color: #047857; font-weight: bold; }
            .absent-status { color: #be123c; font-weight: bold; }
            .signatures-block { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
            .signature-box { text-align: center; width: 220px; }
            .signature-name { font-weight: bold; margin-top: 40px; text-decoration: underline; color: #0f766e;}
            .official-seal { font-size: 9px; color: #94a3b8; font-style: italic; margin-top: 5px; }
            .footer { position: fixed; bottom: 20px; width: 100%; text-align: center; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print()">
          <table class="header-table">
            <tr>
              <td class="logo-header">🏥 MÉDISAHEL CLINIQUE</td>
              <td class="clinic-info">
                CENTRE MÉDICAL ET CLINIQUE PRIVÉ BAMAKO<br/>
                Sotuba ACI, Avenue de l'Hôpital, BP 1450 Mali<br/>
                Tél: +223 20 22 45 88 / Direction: Dr. Adama SANGARÉ
              </td>
            </tr>
          </table>

          <div class="report-title-container">
            <h1 class="report-title">RAPPORT OFFICIEL STATISTIQUES & PRÉSENCES</h1>
            <div class="report-subtitle">Période d'évaluation : ${directorPeriod} (Édition Automatique)</div>
          </div>

          <div class="meta-block">
            <div class="meta-item">
              Généré par : <strong>Dr. Adama SANGARÉ</strong> (Directeur Général)<br/>
              Visa de sécurité : <strong>DG-MEDISAHEL-VALIDÉ</strong>
            </div>
            <div class="meta-item" style="text-align: right">
              Date d'émission : <strong>${todayStr}</strong><br/>
              Unité monétaire : <strong>Franc CFA (XOF)</strong>
            </div>
          </div>

          <h2 class="section-title">Synthèse de la Caisse & Activités</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-card-label">Chiffre d'Affaires Encaissé</div>
              <div class="metric-card-val">${stats.totalTransactionsAmount.toLocaleString("fr-FR")} XOF</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Prestations Consultations</div>
              <div class="metric-card-val">${stats.subConsultation.toLocaleString("fr-FR")} XOF</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Recettes Analyses Labo</div>
              <div class="metric-card-val">${stats.subLab.toLocaleString("fr-FR")} XOF</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Ventes Pharmacie</div>
              <div class="metric-card-val">${stats.subPharmSales.toLocaleString("fr-FR")} XOF</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Hospitalisations</div>
              <div class="metric-card-val">${stats.subHospitalization.toLocaleString("fr-FR")} XOF</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Règlements Mobiles Encaissés</div>
              <div class="metric-card-val">${stats.subMobilePay.toLocaleString("fr-FR")} XOF</div>
            </div>
          </div>

          <h2 class="section-title">Synthèse de Présences & Gardes</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div class="metric-card-label">Total Pointages Enregistrés</div>
              <div class="metric-card-val">${stats.totalPresences}</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Taux de Ponctualité moyen</div>
              <div class="metric-card-val">${stats.punctualityRate}%</div>
            </div>
            <div class="metric-card">
              <div class="metric-card-label">Volume total des Retards</div>
              <div class="metric-card-val" style="color: #b45309">${stats.totalLate} retards</div>
            </div>
          </div>

          <h2 class="section-title">Détail des Pointages et Justifications</h2>
          <table class="grid-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Service (Département)</th>
                <th>Entrée Enregistrée</th>
                <th>Départ Enregistré</th>
                <th>Statut de présence</th>
                <th>Justifications / Motifs de Retard</th>
              </tr>
            </thead>
            <tbody>
              ${stats.filteredAttendances.length === 0 ? "<tr><td colspan='7' style='text-align:center;'>Aucune présence enregistrée dans cette période.</td></tr>" : 
                stats.filteredAttendances.map(a => {
                  const userDet = getUserDetails(a.userId);
                  const dep = getDepartmentForUser(userDet);
                  const isLate = a.status === "LATE";
                  const isAbs = a.status === "ABSENT";
                  const styleVal = isLate ? "late-status" : isAbs ? "absent-status" : "present-status";
                  return `
                    <tr>
                      <td><strong>${a.date}</strong></td>
                      <td>${getUserName(a.userId)}</td>
                      <td>${dep}</td>
                      <td>${a.checkIn || "Néant"}</td>
                      <td>${a.checkOut || "-"}</td>
                      <td class="${styleVal}"><strong>${a.status}</strong></td>
                      <td style="font-style: italic; color:#475569;">${a.reason || "Néant / Ponctuel"}</td>
                    </tr>
                  `;
                }).join("")
              }
            </tbody>
          </table>

          <div class="signatures-block">
            <div class="signature-box" style="text-align: left">
              <strong>Visa de Contrôle RH</strong>
              <div class="signature-name" style="margin-top: 35px;">Service des Ressources Humaines</div>
              <div class="official-seal">MédiSahel Bamako</div>
            </div>
            <div class="signature-box" style="text-align: right">
              <strong>Le Directeur Général</strong>
              <div class="signature-name" style="margin-top: 35px; color: #0f766e;">Dr. Adama SANGARÉ</div>
              <div class="official-seal">Approuvé par signature électronique</div>
            </div>
          </div>

          <div class="footer">
            MédiSahel Clinique Bamako V2 - Certifications des Registres Locaux - Page 1 / 1
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportExcel = () => {
    // Generate styled XML / CSV data stream representing attendance tables and Caisse summaries
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "RAPPORT EXCEL EXCLUSIF - MEDISAHEL CLINIQUE BAMAKO\n";
    csvContent += "Fiche Synthese Direction Generale et Caisse\n";
    csvContent += `Echelle d'évaluation : ${directorPeriod}\n\n`;

    csvContent += "PARTIE 1 : STATISTIQUES FINANCIERES CAISSE\n";
    csvContent += `Chiffre d'Affaires Total (FCFA);${stats.totalTransactionsAmount}\n`;
    csvContent += `Consultations (FCFA);${stats.subConsultation}\n`;
    csvContent += `Analyses Laboratoire (FCFA);${stats.subLab}\n`;
    csvContent += `Ventes Pharmacie (FCFA);${stats.subPharmSales}\n`;
    csvContent += `Hospitalisations (FCFA);${stats.subHospitalization}\n`;
    csvContent += `Paiements Mobiles Encaisses (FCFA);${stats.subMobilePay}\n\n`;

    csvContent += "PARTIE 2 : DIAGNOSTICS DE PRESENCE DU PERSONNEL\n";
    csvContent += `Pointages Totaux enregistres;${stats.totalPresences}\n`;
    csvContent += `Taux d'assiduite moyen (%);${stats.punctualityRate}%\n`;
    csvContent += `Total Retards enregistres;${stats.totalLate}\n`;
    csvContent += `Total Absences enregistres;${stats.totalAbsent}\n\n`;

    csvContent += "REGISTRE CHRONOLOGIQUE DES POINTAGES ET RETARDS\n";
    csvContent += "Date;Collaborateur;Role;Departement;Heure Entree;Heure Sortie;Statut;Motif de Retard\n";

    stats.filteredAttendances.forEach(a => {
      const u = getUserDetails(a.userId);
      const dep = getDepartmentForUser(u);
      csvContent += `${a.date};${getUserName(a.userId)};${getUserRole(a.userId)};${dep};${a.checkIn || ""};${a.checkOut || ""};${a.status};${a.reason || ""}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const downloadLink = document.createElement("a");
    downloadLink.setAttribute("href", encodedUri);
    downloadLink.setAttribute("download", `medisahel_registre_presences_${directorPeriod.toLowerCase()}.csv`);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setSuccess("Rapport Excel converti et téléchargé avec succès !");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div className="space-y-6" id="presences-control-dashboard">
      {/* Visual Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-sans font-extrabold text-xl text-slate-900 leading-none flex items-center gap-2">
              <span>Gestion des Présences & Horaires</span>
              <span className="hidden sm:inline-flex text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-250 font-mono tracking-widest uppercase p-1 rounded font-black">
                Station Active
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              Fiches de pointage d'arrivée et départ obligatoires, calcul des indices de ponctualité, rapports exclusifs de direction et configuration des tolérances de garde de la clinique.
            </p>
          </div>
        </div>

        {/* Global tab routing selection */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex flex-wrap items-center text-xs font-bold gap-1 self-start md:self-center">
          {isAdminOrHR && (
            <button
              onClick={() => setActiveTab("director")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "director" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📊 Espace Directeur / RH
            </button>
          )}
          <button
            onClick={() => setActiveTab("registry")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "registry" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📋 Registre Clinique
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "history" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            👤 Mon Historique
          </button>
          {isAdminOrHR && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === "settings" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ⚙️ Paramètres Horaires
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center animate-fade-in shadow-xs" id="presence-error-banner">
          <ShieldAlert className="h-5 w-5 mr-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center animate-fade-in shadow-xs" id="presence-success-banner">
          <Check className="h-5 w-5 mr-3 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* COMPONENT BODY RENDERING BASED ON ACTIVE TAB */}

      {/* TAB 1 : DIRECTOR EXCLUSIVE METRICS DASHBOARD */}
      {activeTab === "director" && isAdminOrHR && (
        <div className="space-y-6" id="director-executive-tab">
          {/* Quick period control bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-md">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#10b981] font-bold">Menu Directeur Général</span>
              <h3 className="font-sans font-black text-sm text-slate-100 uppercase mt-0.5">Analyses Financières de la Caisse & Présences</h3>
              <p className="text-[11px] text-slate-350">Données calculées en temps réel d'après les transactions validées et les registres d'assiduité du personnel.</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Period selection */}
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-semibold">
                {(["JOUR", "SEMAINE", "MOIS", "ANNEE"] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setDirectorPeriod(p)}
                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                      directorPeriod === p ? "bg-teal-600 text-white font-extrabold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {p === "JOUR" ? "Jour" : p === "SEMAINE" ? "Semaine" : p === "MOIS" ? "Mois" : "Année"}
                  </button>
                ))}
              </div>

              {/* Download actions */}
              <button
                onClick={handleExportPDF}
                className="bg-teal-700 hover:bg-teal-850 px-3.5 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Rapport d'activité mensuel PDF"
                id="director-export-pdf"
              >
                <FileText className="h-4 w-4" />
                <span>PDF Actes</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="bg-slate-800 hover:bg-slate-750 px-3.5 py-1.5 rounded-lg text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Rapport de synthèse de paie Excel"
                id="director-export-excel"
              >
                <Download className="h-4 w-4" />
                <span>EXCEL Fiche</span>
              </button>
            </div>
          </div>

          {/* Metrics Grids */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. CA Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Chiffre d'Affaires</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-slate-900 block truncate">
                  {stats.totalTransactionsAmount.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-emerald-600 font-mono font-extrabold">FCFA Encaissés</span>
              </div>
            </div>

            {/* 2. Consultation Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Consultations</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-teal-850 block truncate">
                  {stats.subConsultation.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">FCFA valorisés</span>
              </div>
            </div>

            {/* 3. Analyses Lab Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Analyses Labo</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-indigo-850 block truncate">
                  {stats.subLab.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Recettes analyses</span>
              </div>
            </div>

            {/* 4. Pharmacie Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Ventes Pharmacie</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-amber-800 block truncate">
                  {stats.subPharmSales.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Dispensation stock</span>
              </div>
            </div>

            {/* 5. Hospitalisation Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Hospitalisations</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-rose-800 block truncate">
                  {stats.subHospitalization.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Lits d'admission</span>
              </div>
            </div>

            {/* 6. Mobile Pay Card */}
            <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-mono font-black text-gray-400 uppercase tracking-widest font-bold">Paiements Mobiles</span>
              <div className="mt-2">
                <span className="font-sans font-black text-base text-sky-850 block truncate">
                  {stats.subMobilePay.toLocaleString("fr-FR")}
                </span>
                <span className="text-[10px] text-[#10b981] font-mono font-bold font-medium">OM / Wave / Moov</span>
              </div>
            </div>
          </div>

          {/* Presence diagnostics and Recharts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Visual Recharts Bar Chart of Caisse */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
              <h4 className="font-sans font-bold text-xs text-slate-900 uppercase tracking-wider border-b pb-2">Répartition Financière par Acte de Soins ({directorPeriod})</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9.5} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9.5} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(val) => [`${val.toLocaleString()} FCFA`, 'Montant']} />
                    <Bar dataKey="Montant" fill={clinicThemeColor || "#0f766e" } radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick presence statistics card and late employee lists */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs space-y-4">
              <h4 className="font-sans font-bold text-xs text-slate-900 uppercase tracking-wider border-b pb-2">Diagnostic Ponctualité de la Période</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-indigo-805 uppercase">Taux d'Assiduité</span>
                  <span className="font-bold text-2xl text-indigo-900 leading-none mt-1">{stats.punctualityRate}%</span>
                </div>
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 flex flex-col justify-center text-center">
                  <span className="text-[10px] font-bold text-amber-805 uppercase">Volume Retards</span>
                  <span className="font-bold text-2xl text-amber-800 leading-none mt-1">{stats.totalLate}</span>
                </div>
              </div>

              {/* Late list chronological */}
              <div className="space-y-2.5">
                <span className="text-[10px] text-gray-400 font-mono tracking-wide uppercase font-bold block">🚨 Employés en retard à la clinique</span>
                
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {stats.lateList.length === 0 ? (
                    <p className="text-gray-400 italic text-[11px] text-center py-4">Félicitations, aucun retard enregistré pour la période.</p>
                  ) : (
                    stats.lateList.map((a, idx) => {
                      const u = getUserDetails(a.userId);
                      const dep = getDepartmentForUser(u);
                      const theoryStart = departmentHours[dep]?.start || "08:00";
                      return (
                        <div key={idx} className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-100 text-[11px] font-medium leading-relaxed">
                          <div className="flex justify-between font-bold text-gray-900 leading-none">
                            <span>{getUserName(a.userId)}</span>
                            <span className="text-amber-850 font-mono">Arrivée: {a.checkIn}</span>
                          </div>
                          <div className="flex justify-between text-gray-500 text-[10.5px] mt-1.5">
                            <span>Théorique : {theoryStart} ({dep})</span>
                            <span className="italic truncate max-w-[160px]" title={a.reason || undefined}>Raison : {a.reason || "Non mentionné"}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2 : GENERAL CLINICAL ATTENDANCE REGISTER */}
      {activeTab === "registry" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="registry-tab-body">
          
          {/* Manual Entry Form Column (Protected for Admin/HR) */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-bold text-gray-950 text-xs uppercase tracking-wider border-b pb-2 flex items-center">
              <Clock className="h-4.5 w-4.5 text-indigo-600 mr-2" />
              Saisir un Pointage d'Exception
            </h3>
            
            <form onSubmit={handlePointageSubmit} className="space-y-3.5 text-xs font-semibold">
              <div>
                <label className="block text-gray-500 mb-1">Employé :</label>
                <select
                  required
                  value={pointageUser}
                  onChange={e => {
                    setPointageUser(e.target.value);
                    // Autofill default checked value based on department theoretical hours
                    const selectedU = users.find(u => u.id === e.target.value);
                    const dep = getDepartmentForUser(selectedU);
                    const theoryT = departmentHours[dep]?.start || "08:00";
                    setPointageCheckIn(theoryT);
                  }}
                  className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs"
                >
                  <option value="">-- Sélectionnez l'agent --</option>
                  <option value={currentUser.id}>Moi-même ({currentUser.name})</option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Date d'effet :</label>
                  <input
                    type="date"
                    required
                    value={pointageDate}
                    onChange={e => setPointageDate(e.target.value)}
                    className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Statut Initial :</label>
                  <select
                    value={pointageStatus}
                    onChange={e => setPointageStatus(e.target.value as any)}
                    className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                  >
                    <option value="PRESENT">À l'heure</option>
                    <option value="LATE">Retard</option>
                    <option value="ABSENT">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-1">Heure Arrivée :</label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    required
                    value={pointageCheckIn}
                    onChange={e => setCheckInValue(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Heure Départ :</label>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={pointageCheckOut}
                    onChange={e => setPointageCheckOut(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Justification / Motif :</label>
                <select
                  value={pointageReason}
                  onChange={e => setPointageReason(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs"
                >
                  <option value="">-- Motif de Retard / Justificatif --</option>
                  {lateReasons.map((r, i) => (
                    <option key={i} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 text-center text-white bg-indigo-750 hover:bg-indigo-850 rounded-xl text-xs font-bold uppercase cursor-pointer"
              >
                Signer Registre Exceptionnel
              </button>
            </form>
          </div>

          {/* Attendance Log Table */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-3">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center">
                <Users className="h-4.5 w-4.5 text-indigo-600 mr-2" />
                Registre National des Présences
              </h3>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const dataToExport = attendances.map(att => {
                      const usr = users.find(u => u.id === att.userId);
                      return {
                        collab: usr ? `${(usr.lastName || "").toUpperCase()} ${usr.firstName || ""}` : att.userId,
                        role: usr?.role || "--",
                        service: usr?.department || "Médecine Générale",
                        date: att.date,
                        checkIn: att.checkIn || "--:--",
                        checkOut: att.checkOut || "--:--",
                        status: att.status === "LATE" ? "Retard" : att.status === "ABSENT" ? "Absent" : "Présent",
                        reason: att.reason || "Ponctuel de service"
                      };
                    });
                    exportToExcel(dataToExport, "REGISTRE_PRESENCES_COLLABORATEURS", {
                      collab: "Collaborateur",
                      role: "Rôle / Fonction",
                      service: "Département / Service",
                      date: "Date",
                      checkIn: "Heure d'Arrivée",
                      checkOut: "Heure de Départ",
                      status: "Statut de Présence",
                      reason: "Justification / Commentaire"
                    });
                  }}
                  className="inline-flex items-center px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Exporter le registre en Excel"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportToPDF("attendance-roster-report-table", "Registre d'Émargement Clinique des Présences")}
                  className="inline-flex items-center px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  title="Imprimer le registre"
                >
                  <Printer className="h-3.5 w-3.5 mr-1 text-indigo-650" />
                  Imprimer
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans text-gray-700" id="attendance-roster-report-table">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-mono uppercase bg-slate-50 text-[10px]">
                    <th className="py-2.5 px-4 font-normal">Collaborateur</th>
                    <th className="py-2.5 px-4 font-normal">Service</th>
                    <th className="py-2.5 px-4 font-normal">Date Générale</th>
                    <th className="py-2.5 px-4 font-normal">Horaires</th>
                    <th className="py-2.5 px-4 font-normal text-center">Décalage / Statuts</th>
                    <th className="py-2.5 px-4 font-normal">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 italic">
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-gray-400 font-medium">Aucun pointage approuvé dans la base de données.</td>
                    </tr>
                  ) : (
                    attendances.map(att => {
                      const userObj = getUserDetails(att.userId);
                      const dep = getDepartmentForUser(userObj);
                      const isLate = att.status === "LATE";
                      const isAbs = att.status === "ABSENT";
                      return (
                        <tr key={att.id} className="hover:bg-slate-50 not-italic">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {getUserName(att.userId)}
                            <span className="block text-[9.5px] font-mono text-gray-400 font-normal uppercase tracking-wide">{getUserRole(att.userId)}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-700 font-medium">{dep}</td>
                          <td className="py-3 px-4 font-semibold text-gray-650">{att.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-[11px] text-gray-500">
                            Arrivée: <strong className="text-indigo-805">{att.checkIn || "--:--"}</strong> <br/>
                            Départ: <span className="text-amber-805">{att.checkOut || "Heure active"}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isLate ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-orange-100 text-orange-850 animate-pulse border border-orange-150">LATE (RETARD)</span>
                            ) : isAbs ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-rose-100 text-rose-850 border border-rose-150">ABSENT</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-850 border border-emerald-150">PRESENT</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate font-medium" title={att.reason || undefined}>
                            {att.reason || "Ponctuel de service"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 : PERSONAL EMPLOYEE ATTENDANCE HISTORY TAB */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4" id="history-tab-body">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5 border-b pb-2">
              <UserCheck className="h-5 w-5 text-indigo-700" />
              Historique Personnel de Pointage – {currentUser.name}
            </h3>
            <p className="text-xs text-gray-400 mt-1">Consultez en toute transparence vos heures certifiées d'arrivée, de départ ainsi que vos heures de retard.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-400 font-mono uppercase bg-slate-50 text-[10px]">
                  <th className="py-2.5 px-4 font-normal">Date générale</th>
                  <th className="py-2.5 px-4 font-normal">Heure d'arrivée</th>
                  <th className="py-2.5 px-4 font-normal">Heure de départ</th>
                  <th className="py-2.5 px-4 font-normal">Heures Travaillées</th>
                  <th className="py-2.5 px-4 font-normal">Statut du pointage</th>
                  <th className="py-2.5 px-4 font-normal">Commentaire / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {attendances.filter(a => a.userId === currentUser.id).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-400 italic font-semibold">Aucun pointage personnel enregistré pour aujourd'hui.</td>
                  </tr>
                ) : (
                  attendances
                    .filter(a => a.userId === currentUser.id)
                    .map(att => {
                      const isLate = att.status === "LATE";
                      const isAbs = att.status === "ABSENT";
                      
                      // Calculate duration
                      let durationText = "-";
                      if (att.checkIn && att.checkOut) {
                        const [ciH, ciM] = att.checkIn.split(":").map(Number);
                        const [coH, coM] = att.checkOut.split(":").map(Number);
                        if (!isNaN(ciH) && !isNaN(coH)) {
                          let diff = (coH * 60 + coM) - (ciH * 60 + ciM);
                          if (diff < 0) diff += 24 * 60;
                          const hrs = Math.floor(diff / 60);
                          const mns = diff % 60;
                          durationText = `${hrs}h ${mns.toString().padStart(2, '0')}m`;
                        }
                      }

                      return (
                        <tr key={att.id} className="hover:bg-slate-50 text-[11px] text-gray-700">
                          <td className="py-3 px-4 font-bold text-slate-900">{att.date}</td>
                          <td className="py-3 px-4 font-mono font-bold text-indigo-700">{att.checkIn || "--:--"}</td>
                          <td className="py-3 px-4 font-mono font-bold text-amber-700">{att.checkOut || "--:--"}</td>
                          <td className="py-3 px-4 font-mono font-bold text-teal-800">{durationText}</td>
                          <td className="py-3 px-4">
                            {isLate ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-orange-100 text-orange-850">Late (Retard)</span>
                            ) : isAbs ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-rose-100 text-rose-855">Absent</span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-855">Present</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-500 italic max-w-sm truncate">{att.reason || "Ponctuel"}</td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4 : EDITABLE CONFIGURATOR SETTINGS (ADMIN / HR EXCLUSIVE) */}
      {activeTab === "settings" && isAdminOrHR && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="settings-tab-body">
          
          {/* Department times */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h4 className="font-sans font-bold text-xs text-slate-950 uppercase tracking-wider border-b pb-2 flex items-center">
              <Settings className="h-4.5 w-4.5 text-teal-600 mr-2" />
              Horaires par département
            </h4>

            <p className="text-[11px] text-gray-400 font-medium">
              Veuillez configurer l'heure d'ouverture et l'heure de sortie requises par département clinique hospitalier.
            </p>

            <div className="space-y-3.5 pt-2 text-xs font-semibold text-gray-700">
              {Object.entries(departmentHours).map(([dep, hours]) => (
                <div key={dep} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 border-b border-gray-100">
                  <span className="font-bold text-slate-900 truncate max-w-[180px]">{dep}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-gray-400 text-[10.5px]">Début:</span>
                      <input
                        type="text"
                        value={hours.start}
                        onChange={e => {
                          const updated = { ...departmentHours, [dep]: { ...hours, start: e.target.value } };
                          saveDepartmentHours(updated);
                        }}
                        className="w-16 h-8 text-center bg-slate-50 border border-gray-250 rounded font-medium focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-gray-400 text-[10.5px]">Fin:</span>
                      <input
                        type="text"
                        value={hours.end}
                        onChange={e => {
                          const updated = { ...departmentHours, [dep]: { ...hours, end: e.target.value } };
                          saveDepartmentHours(updated);
                        }}
                        className="w-16 h-8 text-center bg-slate-50 border border-gray-250 rounded font-medium focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tolerance settings */}
            <div className="pt-4 border-t border-gray-150 space-y-2 text-xs font-semibold">
              <label className="block text-slate-850 font-bold">Durée tolérée pour retards (Minutes) :</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={toleranceMinutes}
                  onChange={e => saveToleranceMinutes(parseInt(e.target.value, 10) || 0)}
                  className="w-20 h-10 px-3 bg-slate-50 border border-teal-250 font-bold font-mono text-center text-teal-700 rounded-xl"
                />
                <span className="text-[11px] text-gray-400 font-medium leading-relaxed">
                  Minutes de battement accordées à l'exception du pointage d'arrivée. (Par exemple, 15 minutes tolérées décantent un début théorique de 08:00 jusqu'à 08:15).
                </span>
              </div>
            </div>
          </div>

          {/* Customizable motif options */}
          <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            <h4 className="font-sans font-bold text-xs text-slate-950 uppercase tracking-wider border-b pb-2 flex items-center">
              <AlertCircle className="h-4.5 w-4.5 text-teal-600 mr-2" />
              Motifs et Preuves de Retard
            </h4>

            <p className="text-[11px] text-gray-400 font-medium">
              Personnalisez les motifs de retards et d'absences disponibles dans la boîte de sélection des collaborateurs cliniciens.
            </p>

            <div className="space-y-1.5 pt-2 max-h-[220px] overflow-y-auto">
              {lateReasons.map((r, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-gray-150 text-slate-805 leading-none font-semibold text-xs transition-all">
                  <span>{r}</span>
                  <button
                    onClick={() => handleDeleteReason(idx)}
                    className="p-1 text-slate-400 hover:text-rose-650 cursor-pointer"
                    title="Supprimer ce motif"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add motif form */}
            <div className="pt-4 border-t border-gray-150 flex gap-2">
              <input
                type="text"
                placeholder="ex. Congestion fluviale, Panne technique..."
                value={newReason}
                onChange={e => setNewReason(e.target.value)}
                className="flex-1 h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button
                onClick={handleAddReason}
                className="bg-teal-700 hover:bg-teal-850 px-4 h-10 rounded-xl text-white font-bold text-xs transition-all cursor-pointer whitespace-nowrap"
              >
                Ajouter Motif
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Fallback setter helper if React TS properties check
  function setCheckInValue(v: string) {
    setPointageCheckIn(v);
  }
};
