import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Bed, 
  Package, 
  Calendar, 
  FileText, 
  Database, 
  Download, 
  Printer, 
  ShieldAlert, 
  CheckCircle, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  UserPlus, 
  TrendingDown, 
  FileSpreadsheet, 
  Upload,
  ArrowRight,
  ShieldCheck,
  Building,
  Check,
  BookOpen
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

interface ClinicalAdministrationProps {
  token: string | null;
  currentUser: any;
  onSelectPatientDme?: (patient: any) => void;
  clinic?: any;
}

export const ClinicalAdministration: React.FC<ClinicalAdministrationProps> = ({ 
  token, 
  currentUser,
  onSelectPatientDme,
  clinic
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "daily_report" | "weekly_report" | "monthly_report" | "backups" | "medical_library">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [backupsList, setBackupsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [restoreProgress, setRestoreProgress] = useState("");
  
  // Library items & administrable dictionary fields
  const [libraryItems, setLibraryItems] = useState<any[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<string>("ALL");
  const [newItemForm, setNewItemForm] = useState({
    trigger: "",
    label: "",
    text: "",
    category: "MEDICAMENT"
  });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // File upload state for restore drag-and-drop
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/clinical-admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const res = await fetch("/api/clinical-admin/reports/daily", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDailyReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWeeklyReport = async () => {
    try {
      const res = await fetch("/api/clinical-admin/reports/weekly", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setWeeklyReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMonthlyReport = async () => {
    try {
      const res = await fetch("/api/clinical-admin/reports/monthly", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setMonthlyReport(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBackupData = async () => {
    try {
      const statsRes = await fetch("/api/database/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      if (statsRes.ok) setBackupStats(statsData);

      const filesRes = await fetch("/api/database/backups", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const filesData = await filesRes.json();
      if (filesRes.ok) setBackupsList(filesData);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLibraryItems = async () => {
    try {
      const res = await fetch("/api/medical-library", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setLibraryItems(data);
    } catch (err) {
      console.error("Echec chargement biblio:", err);
    }
  };

  const handleCreateOrUpdateLibraryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.trigger.startsWith("@")) {
      setError("Le trigger d'autocomplétion doit obligatoirement commencer par '@' (ex: @para).");
      return;
    }
    setError("");
    setSuccess("");
    try {
      const url = editingItemId ? `/api/medical-library/${editingItemId}` : "/api/medical-library";
      const method = editingItemId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newItemForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(editingItemId ? "Élément de la bibliothèque médicale mis à jour !" : "Nouvel élément ajouté à la bibliothèque médicale !");
      setNewItemForm({ trigger: "", label: "", text: "", category: "MEDICAMENT" });
      setEditingItemId(null);
      fetchLibraryItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditLibraryItem = (item: any) => {
    setEditingItemId(item.id);
    setNewItemForm({
      trigger: item.trigger,
      label: item.label,
      text: item.text,
      category: item.category
    });
  };

  const handleDeleteLibraryItem = async (id: string) => {
    if (!confirm("Voulez-vous vraiment retirer cet élément de la bibliothèque médicale ? En le retirant, les raccourcis d'autocomplétion ne seront plus disponibles.")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/medical-library/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Élément supprimé de la bibliothèque avec succès !");
      fetchLibraryItems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchDailyReport();
      fetchWeeklyReport();
      fetchMonthlyReport();
      fetchBackupData();
      fetchLibraryItems();
    }
  }, [token, activeSubTab]);

  const handleManualBackup = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/database/backup-server", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess("Sauvegarde de la base de données créée sur le serveur avec succès !");
      fetchBackupData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRestoreFromFile = async (file: File) => {
    setError("");
    setSuccess("");
    setRestoreProgress("Analyse de la signature du fichier...");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const payload = JSON.parse(content);
        
        if (!payload || !payload._medishahel_backup_) {
          throw new Error("Signature de sauvegarde incompatible. Signature MédiSahel requise.");
        }
        
        setRestoreProgress("Restauration du schéma et des tables...");
        const res = await fetch("/api/database/restore", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: content
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Impossible de restaurer la sauvegarde");
        
        setSuccess("Restauration de la base effectuée avec succès ! Le système est ré-actualisé.");
        fetchStats();
        fetchBackupData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setRestoreProgress("");
      }
    };
    reader.readAsText(file);
  };

  const handleLocalFileRestore = async (filename: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir restaurer la sauvegarde "${filename}" ? Cette opération écrasera toutes vos données actuelles.`)) {
      return;
    }
    setError("");
    setSuccess("");
    setRestoreProgress("Chargement du fichier depuis le serveur...");
    try {
      const res = await fetch(`/api/database/backups/${filename}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess(`Restauration locale effectuée avec succès depuis "${filename}" !`);
      fetchStats();
      fetchBackupData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRestoreProgress("");
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleRestoreFromFile(e.dataTransfer.files[0]);
    }
  };

  const triggerDownloadBackup = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/database/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `backup_medishahel_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setSuccess("Téléchargement de la base exportée démarré.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Printing utilities
  const handlePrint = (elementId: string) => {
    const printableContent = document.getElementById(elementId)?.innerHTML;
    if (!printableContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "", "width=900,height=800");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Impression - ERP Clinique ${clinic?.name || "MédiSahel"}</title>
            <style>
              body { font-family: sans-serif; color: #1e293b; padding: 40px; line-height: 1.5; }
              .header { text-align: center; border-b: 2px solid ${clinic?.themeColor || '#0f765e'}; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: ${clinic?.themeColor || '#0f765e'}; text-transform: uppercase; }
              .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; background-color: #f8fafc; padding: 20px; border-radius: 8px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
              th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; }
              th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
              .section-title { font-size: 16px; font-weight: bold; color: #0f765e; border-left: 4px solid #0f766e; padding-left: 10px; margin-bottom: 15px; margin-top: 25px; text-transform: uppercase; }
              .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; @media print { position: fixed; bottom: 0; left: 0; right: 0; } }
              .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
              .badge-paid { background-color: #d1fae5; color: #065f46; }
              .badge-unpaid { background-color: #fee2e2; color: #991b1b; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">${clinic?.name || "MédiSahel Clinique Bamako V2"}</div>
              <div class="subtitle">RAPPORT ADMINISTRATIF ET DIRECTORIAL CONSOLIDÉ</div>
            </div>
            ${printableContent}
            <div class="footer">
              Généré automatiquement par le Centre de Contrôle Clinique ${clinic?.name || "MédiSahel"} - ${clinic?.address || "Hamdallaye ACI 2000"}, ${clinic?.city || "Bamako"}, ${clinic?.country || "Mali"}
              <br/>Signature et Cachet Institutionnel de la Direction de l'établissement
            </div>
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCSVExport = (filename: string, headers: string[], rows: any[][]) => {
    let csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelExport = () => {
    if (!monthlyReport) return;
    const headers = ["Service / Activité", "Nombre d'actes d'admissions", "Chiffre d'Affaire Généré (FCFA)"];
    const rows = monthlyReport.deptPerformance.map((dept: any) => [
      dept.name,
      dept.count,
      dept.revenue
    ]);
    const totalRow = [
      "TOTAL GENERAL MENSUEL",
      monthlyReport.deptPerformance.reduce((a: number, b: any) => a + b.count, 0),
      monthlyReport.deptPerformance.reduce((a: number, b: any) => a + b.revenue, 0)
    ];
    rows.push([]);
    rows.push(["Taux de recouvrement des factures", `${monthlyReport.recoveryRate}%`]);
    handleCSVExport(`rapport_mensuel_medishahel_direction_${monthlyReport.monthText.replace(" ", "_")}`, headers, [...rows, totalRow]);
  };

  // Pie chart variables
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
  const pieData = stats ? [
    { name: "Espèces (CASH)", value: stats.caisseBreakdown.CASH },
    { name: "Mobile Money (OM, Wave)", value: stats.caisseBreakdown.MOBILE_MONEY },
    { name: "Carte Bancaire", value: stats.caisseBreakdown.CARD },
    { name: "Assurance Patient", value: stats.caisseBreakdown.INSURANCE }
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6" id="clinical-admin-view">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-100 pb-4 gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Activity className="h-5 w-5 text-teal-600 mr-2" />
            Portail Administration Clinique & Direction
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Supervision globale d'activité clinico-médicale, performances budgétaires, rapports d'activité, et sauvegardes.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl self-start md:self-center">
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "dashboard" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Indicateurs
          </button>
          <button
            onClick={() => setActiveSubTab("daily_report")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "daily_report" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Rapport Journalier
          </button>
          <button
            onClick={() => setActiveSubTab("weekly_report")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "weekly_report" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Rapport Hebdomadaire
          </button>
          <button
            onClick={() => setActiveSubTab("monthly_report")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "monthly_report" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Rapport Mensuel
          </button>
          <button
            onClick={() => setActiveSubTab("backups")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "backups" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Sauvegarde
          </button>
          <button
            onClick={() => setActiveSubTab("medical_library")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-colors ${activeSubTab === "medical_library" ? "bg-white text-teal-700 shadow-xs" : "text-gray-500 hover:text-gray-900"}`}
          >
            Bibliothèque Médicale
          </button>
        </div>
      </div>

      {/* Global Alerts inside PORTAL */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-xl flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 animate-bounce" />
          {success}
        </div>
      )}
      {restoreProgress && (
        <div className="p-4 bg-orange-50 border border-orange-200 text-orange-850 text-sm rounded-xl flex items-center">
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          {restoreProgress}
        </div>
      )}

      {/* RENDER ACTIVE TAB */}
      {activeSubTab === "dashboard" && stats && (
        <div className="space-y-6">
          {/* Dashboard KPIs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">Consultations</span>
                <span className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Activity className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-gray-900">{stats.totalConsultations}</span>
                <span className="text-xs text-emerald-600 block mt-1 font-semibold">
                  +{stats.consultationsToday} aujourd'hui
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">Hospitalisations</span>
                <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Bed className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-gray-900">{stats.activeHospitalised} actifs</span>
                <span className="text-xs text-blue-600 block mt-1 font-semibold">
                  +{stats.admissionsToday} admissions aujourd'hui
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">Recettes Mensuelles</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <DollarSign className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-gray-900">
                  {stats.monthlyRevenue.toLocaleString("fr-FR")} FCFA
                </span>
                <span className="text-xs text-emerald-600 block mt-1 font-semibold">
                  {stats.dailyRevenue.toLocaleString("fr-FR")} FCFA aujourd'hui
                </span>
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">Occupation Lits</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-700">
                  <Clock className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-gray-900">{stats.bedOccupancyRate}%</span>
                <span className="text-xs text-purple-600 block mt-1 font-semibold">
                  Chambres: {stats.roomOccupancyRate}% occupées
                </span>
              </div>
            </div>
          </div>

          {/* Activity Breakdown section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash register daily balance */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                Encaissements Caisse (Aujourd'hui)
              </h3>
              {pieData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6" style={{ height: "230px" }}>
                  <div className="w-full sm:w-1/2 p-2">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => val.toLocaleString("fr-FR") + " FCFA"} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 space-y-2">
                    {pieData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between font-sans text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-gray-500">{item.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{item.value.toLocaleString("fr-FR")} F</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-100 flex justify-between text-sm font-bold text-gray-900">
                      <span>Total</span>
                      <span>{stats.dailyRevenue.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-44 flex flex-col items-center justify-center text-gray-400 font-mono text-xs">
                  Aucune transaction enregistrée aujourd'hui.
                </div>
              )}
            </div>

            {/* Financial Activity Summary */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">
                Diagnostic Budgétaire Cumulé
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Recettes Totales Récoltées</span>
                    <span className="font-bold text-gray-900">{stats.totalReceipts.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: "100%" }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Dépenses Estimées (Salaires & Pharmacie)</span>
                    <span className="font-bold text-gray-900">{stats.totalExpenses.toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full" 
                      style={{ width: `${Math.min(100, (stats.totalExpenses / (stats.totalReceipts || 1)) * 100)}%` }} 
                    />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl grid grid-cols-2 gap-4 text-center mt-2">
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 font-bold block">Patient reçus</span>
                    <p className="text-lg font-extrabold text-gray-900">{stats.totalPatients}</p>
                    <span className="text-[10px] text-teal-600">+{stats.patientsToday} aujourd'hui</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 font-bold block">Ordonnances</span>
                    <p className="text-lg font-extrabold text-gray-900">{stats.totalConsultations}</p>
                    <span className="text-[10px] text-teal-600">+{stats.prescriptionsToday} aujourd'hui</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Alerts Group */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
              <ShieldAlert className="h-5 w-5 text-rose-500 mr-2" />
              Centre d'Alertes Opérationnelles (Direction)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-gray-600">
              {/* Critical Stocks */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] text-rose-700 flex items-center border-b border-rose-50 pb-1">
                  <Package className="h-3.5 w-3.5 mr-1" />
                  Rupture Active de Stock ({stats.criticalStockAlerts.length})
                </h4>
                {stats.criticalStockAlerts.length > 0 ? (
                  <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {stats.criticalStockAlerts.map((e: any) => (
                      <li key={e.id} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-gray-800 truncate">{e.name}</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-100">
                          {e.quantity} / {e.threshold}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 py-4 font-mono">Aucun produit sous le seuil critique.</div>
                )}
              </div>

              {/* Expired / Near expiry */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] text-amber-700 flex items-center border-b border-amber-50 pb-1">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Péremption de Médicaments ({stats.expiredAlerts.length})
                </h4>
                {stats.expiredAlerts.length > 0 ? (
                  <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {stats.expiredAlerts.map((e: any) => (
                      <li key={e.id} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-gray-800 truncate">{e.name}</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${e.status === "EXPIRED" ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-750 border border-amber-100"}`}>
                          {e.status === "EXPIRED" ? "EXPIRÉ" : "PROCHE"} ({new Date(e.expiryDate).toLocaleDateString("fr-FR")})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 py-4 font-mono">Aucun lot expiré sur 30 jours.</div>
                )}
              </div>

              {/* Unpaid / Recovery */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 uppercase tracking-widest text-[10px] text-red-700 flex items-center border-b border-red-50 pb-1">
                  <TrendingDown className="h-3.5 w-3.5 mr-1" />
                  Impayés & Non Recouvrés ({stats.unpaidInvoices.length})
                </h4>
                {stats.unpaidInvoices.length > 0 ? (
                  <ul className="divide-y divide-gray-50 max-h-48 overflow-y-auto">
                    {stats.unpaidInvoices.map((e: any) => (
                      <li key={e.id} className="py-2 flex items-center justify-between">
                        <span className="font-medium text-gray-800 truncate max-w-[130px]">{e.description}</span>
                        <span className="font-bold text-gray-900">{e.amount.toLocaleString("fr-FR")} F</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold text-[9px]">
                          {e.status === "UNPAID" ? "IMP" : "PAR"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 py-4 font-mono">Toutes les factures ont été soldées.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONSOLIDATED DAILY REPORT PANEL */}
      {activeSubTab === "daily_report" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6" id="daily-report-portal">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Rapports Journaliers Automatiques</h3>
              <p className="text-xs text-gray-500 mt-0.5">Membres opérationnels de garde, diagnostic, pharmacie, encaissements, admissions.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePrint("daily-report-printable-area")}
                className="inline-flex items-center px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-700 hover:bg-slate-50 transition shadow-xs select-none cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimer / PDF
              </button>
            </div>
          </div>

          {dailyReport ? (
            <div className="border border-gray-150 rounded-2xl p-6" id="daily-report-printable-area">
              <div className="flex justify-between items-start pb-4 border-b border-slate-150">
                <div>
                  <h4 className="font-sans font-bold text-teal-800 text-lg">{clinic?.name || "MédiSahel Clinique Bamako"}</h4>
                  <p className="text-xs text-gray-500">
                    {clinic?.address || "Hamdallaye ACI 2000"}, {clinic?.city || "Bamako"}, {clinic?.country || "Mali"} | Tél: {clinic?.phone || "+223 20 22 14 67"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">Date du rapport</span>
                  <span className="text-sm font-extrabold text-slate-900">{dailyReport.date}</span>
                </div>
              </div>

              {/* Watch guards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Médecins & Superviseurs de Garde</h5>
                  {dailyReport.doctorGuards.length > 0 ? (
                    <ul className="divide-y divide-gray-100 text-xs">
                      {dailyReport.doctorGuards.map((g: any, i: number) => (
                        <li key={i} className="py-2.5 flex items-center justify-between">
                          <span className="font-bold text-gray-800">{g.name}</span>
                          <span className="text-gray-400">Arrivée: {g.checkIn || "8:00"} ({g.status})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucun médecin enregistré ce jour.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Infirmiers & Responsables de Garde</h5>
                  {dailyReport.nurseGuards.length > 0 ? (
                    <ul className="divide-y divide-gray-100 text-xs">
                      {dailyReport.nurseGuards.map((g: any, i: number) => (
                        <li key={i} className="py-2.5 flex items-center justify-between">
                          <span className="font-bold text-gray-800">{g.name}</span>
                          <span className="text-gray-400">Arrivée: {g.checkIn || "8:00"} ({g.status})</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucun infirmier enregistré ce jour.</p>
                  )}
                </div>
              </div>

              {/* Admissions and Exits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Nouvelles Admissions Hospitalières ({dailyReport.dailyAdmissions.length})</h5>
                  {dailyReport.dailyAdmissions.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-gray-500">
                          <th className="p-2">Chambre/Lit</th>
                          <th className="p-2">Motif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReport.dailyAdmissions.map((a: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-bold font-mono">Ch. {a.roomNumber} - Lit {a.bedNumber}</td>
                            <td className="p-2">{a.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucune admission hospitalière aujourd'hui.</p>
                  )}
                </div>

                <div>
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Décharges & Sorties de Chambre ({dailyReport.dailyDischarges.length})</h5>
                  {dailyReport.dailyDischarges.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-gray-500">
                          <th className="p-2">Chambre/Lit</th>
                          <th className="p-2">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReport.dailyDischarges.map((d: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-bold font-mono">Ch. {d.roomNumber} - Lit {d.bedNumber}</td>
                            <td className="p-2">{d.notes || "Sortie standard ordonnée"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucune sortie clinique enregistrée aujourd'hui.</p>
                  )}
                </div>
              </div>

              {/* Lab Exams and Medicines dispensed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Examens du Laboratoire Demandés ({dailyReport.dailyExams.length})</h5>
                  {dailyReport.dailyExams.length > 0 ? (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-gray-500">
                          <th className="p-2">Examen</th>
                          <th className="p-2">État</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyReport.dailyExams.map((exam: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2 font-semibold text-gray-800">{exam.testName} <span className="text-[9px] text-gray-400">({exam.category})</span></td>
                            <td className="p-2"><span className={`px-1 rounded text-[9px] ${exam.status === "COMPLETED" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{exam.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucun examen de biologie aujourd'hui.</p>
                  )}
                </div>

                <div>
                  <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Prescriptions thérapeutiques dispensées ({dailyReport.dailyMedicines.length})</h5>
                  {dailyReport.dailyMedicines.length > 0 ? (
                    <ul className="divide-y space-y-2 text-xs">
                      {dailyReport.dailyMedicines.map((m: any, i: number) => (
                        <li key={i} className="py-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <span className="font-semibold text-teal-800 block mb-1">Prescrit par: {m.doctorName}</span>
                          <p className="text-gray-650 leading-relaxed font-medium font-mono text-[10px] whitespace-pre-line">{m.medicines}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-2">Aucun médicament ou consommable dispensé.</p>
                  )}
                </div>
              </div>

              {/* Payments log */}
              <div className="mt-6">
                <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Encaissements de Caisse ({dailyReport.dailyPayments.length})</h5>
                {dailyReport.dailyPayments.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="bg-slate-50 text-gray-500">
                        <th className="p-2">Description / Intitule</th>
                        <th className="p-2">Méthode</th>
                        <th className="p-2">Caissier</th>
                        <th className="p-2">État</th>
                        <th className="p-2 text-right">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyReport.dailyPayments.map((p: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="p-2 font-medium text-gray-800">{p.description}</td>
                          <td className="p-2 font-mono text-[10px]">{p.paymentMethod}</td>
                          <td className="p-2">{p.cashierName}</td>
                          <td className="p-2"><span className={`px-1 rounded text-[9px] ${p.status === "PAID" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{p.status}</span></td>
                          <td className="p-2 text-right font-bold text-gray-950">{p.amount.toLocaleString("fr-FR")} FCFA</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                        <td colSpan={4} className="p-3 text-right text-xs uppercase">Chiffre budgétaire journalier</td>
                        <td className="p-3 text-right text-sm font-extrabold text-teal-800">
                          {dailyReport.dailyPayments.filter((t:any) => t.status === "PAID").reduce((a:number,b:any) => a+b.amount, 0).toLocaleString("fr-FR")} FCFA
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">Aucun encaissement validé aujourd'hui.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 font-mono text-xs">Préparation du rapport consolidé...</div>
          )}
        </div>
      )}

      {/* WEEKLY DIRECTION CONSOLIDATED REPORT */}
      {activeSubTab === "weekly_report" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6" id="weekly-report-portal">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Rapport de Direction Hebdomadaire</h3>
              <p className="text-xs text-gray-500 mt-0.5">Statistiques d'activité sur les 7 derniers jours : consultations, hospitalisations, caisse et laboratoire.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExcelExport}
                className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-110 transition shadow-xs select-none cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Exporter Excel (CSV)
              </button>
              <button
                onClick={() => handlePrint("weekly-report-printable-area")}
                className="inline-flex items-center px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-700 hover:bg-slate-50 transition shadow-xs select-none cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimer PDF
              </button>
            </div>
          </div>

          {weeklyReport ? (
            <div className="space-y-6">
              {/* Graphic metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recharts Bar chart for departmental performances */}
                <div className="border border-gray-150 p-4 rounded-xl bg-slate-50/50">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-3">Revenues par services (7 j)</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyReport.deptPerformance}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(val: number) => val.toLocaleString("fr-FR") + " FCFA"} />
                      <Bar dataKey="revenue" fill="#0269a1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-gray-150 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Coefficients Opérationnels</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white border rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Recouvrement</span>
                      <p className="text-xl font-extrabold text-blue-800 mt-1">{weeklyReport.recoveryRate}%</p>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Taux de solvabilité (7 j)</span>
                    </div>
                    <div className="p-3 bg-white border rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Admissions</span>
                      <p className="text-xl font-extrabold text-teal-800 mt-1">{weeklyReport.totalAdmissions}</p>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Hospitalisations (7 j)</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl text-xs font-sans text-gray-700">
                    <span className="font-bold text-gray-900 block mb-1 uppercase text-[9px] tracking-widest text-[#0269a1]">Top Pathologies Détectées (7 j)</span>
                    <ul className="space-y-1-5 mt-1.5">
                      {weeklyReport.topPathologies && weeklyReport.topPathologies.map((patho: any, i: number) => (
                        <li key={i} className="flex justify-between items-center text-[11px] py-0.5">
                          <span className="truncate max-w-[200px] font-medium text-gray-700">{patho.name}</span>
                          <span className="font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded-md border border-teal-150">{patho.count} cas</span>
                        </li>
                      ))}
                      {(!weeklyReport.topPathologies || weeklyReport.topPathologies.length === 0) && (
                        <li className="text-gray-450 text-xs italic">Aucun diagnostic précis saisi cette semaine.</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Printable Table of weekly activities */}
              <div className="border border-gray-150 rounded-2xl p-6" id="weekly-report-printable-area">
                <div className="flex justify-between items-start pb-4 border-b border-slate-150 mb-6">
                  <div>
                    <h4 className="font-sans font-bold text-sky-900 text-lg">{clinic?.name || "MédiSahel"} - Rapport Opérationnel Hebdomadaire</h4>
                    <p className="text-xs text-gray-500">
                      {clinic?.address || "Hamdallaye ACI 2000"}, {clinic?.city || "Bamako"}, {clinic?.country || "Mali"} | Tél: {clinic?.phone || "+223 20 22 14 67"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">Période Hebdomadaire</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{weeklyReport.weekText}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Performance du Service sur la Semaine</h5>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-gray-550 border-b border-slate-200">
                          <th className="p-2.5">Service / Département</th>
                          <th className="p-2.5">Nombre total d’actes / Admissions</th>
                          <th className="p-2.5 text-right font-bold">Chiffre d’Affaire Généré (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyReport.deptPerformance && weeklyReport.deptPerformance.map((dept: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2.5 font-bold text-gray-800">{dept.name}</td>
                            <td className="p-2.5 font-sans text-gray-700">{dept.count} actes</td>
                            <td className="p-2.5 text-right font-bold text-teal-900">{dept.revenue.toLocaleString("fr-FR")} FCFA</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                          <td className="p-3 text-xs uppercase">TOTAL OPERATIONS HEBDOMADAIRES</td>
                          <td className="p-3 font-sans">
                            {weeklyReport.deptPerformance ? weeklyReport.deptPerformance.reduce((a: number, b: any) => a + b.count, 0) : 0} actes
                          </td>
                          <td className="p-3 text-right text-sm font-extrabold text-teal-800">
                            {weeklyReport.deptPerformance ? weeklyReport.deptPerformance.reduce((a: number, b: any) => a + b.revenue, 0).toLocaleString("fr-FR") : 0} FCFA
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="border border-slate-100 p-4 rounded-xl">
                      <h5 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Répartition des Encaissements Caisse (7 j)</h5>
                      <ul className="space-y-1.5 text-xs">
                        <li className="flex justify-between py-1 border-b">
                          <span className="text-gray-650">Espèces / CASH :</span>
                          <span className="font-bold text-gray-800">{(weeklyReport.receiptsByMethod?.CASH || 0).toLocaleString("fr-FR")} FCFA</span>
                        </li>
                        <li className="flex justify-between py-1 border-b">
                          <span className="text-gray-650">Mobile Money (Wave, Orange Money) :</span>
                          <span className="font-bold text-gray-800">{(weeklyReport.receiptsByMethod?.MOBILE_MONEY || 0).toLocaleString("fr-FR")} FCFA</span>
                        </li>
                        <li className="flex justify-between py-1 border-b">
                          <span className="text-gray-650">Carte bancaire (VISA, Master) :</span>
                          <span className="font-bold text-gray-800">{(weeklyReport.receiptsByMethod?.CARD || 0).toLocaleString("fr-FR")} FCFA</span>
                        </li>
                        <li className="flex justify-between py-1">
                          <span className="text-gray-650">Part de l'Assurance (Prise en charge) :</span>
                          <span className="font-bold text-gray-850">{(weeklyReport.receiptsByMethod?.INSURANCE || 0).toLocaleString("fr-FR")} FCFA</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border border-slate-100 p-4 rounded-xl flex flex-col justify-between">
                      <div>
                        <h5 className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Note Opérationnelle Importante</h5>
                        <p className="text-xs text-gray-500 leading-relaxed md:text-[11px]">
                          Ce rapport hebdomadaire consolidé liste toutes les activités médicales, de pharmacie, de laboratoire et d'encaissements financiers. Il offre un instrument d'analyse rapide et de pilotage clinique à court terme pour la Direction Générale et le Promoteur de l'établissement {clinic?.name || "MédiSahel Clinique"}.
                        </p>
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 text-right mt-2">
                        Généré par la Direction le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-405 font-mono text-xs">Chargement en cours du rapport hebdomadaire...</div>
          )}
        </div>
      )}

      {/* MONTHLY DIRECTION CONSOLIDATED REPORT */}
      {activeSubTab === "monthly_report" && (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6" id="monthly-report-portal">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6 gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">Rapport de Direction Mensuel</h3>
              <p className="text-xs text-gray-500 mt-0.5">Statistiques d'activité de médecine, hospitalisation, caisse, pharmacie, et recouvrements.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleExcelExport}
                className="inline-flex items-center px-3.5 py-2 border border-slate-200 bg-emerald-50 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition shadow-xs select-none cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                Exporter Excel (CSV)
              </button>
              <button
                onClick={() => handlePrint("monthly-report-printable-area")}
                className="inline-flex items-center px-3.5 py-2 border border-gray-200 bg-white rounded-xl text-xs font-semibold text-gray-700 hover:bg-slate-50 transition shadow-xs select-none cursor-pointer"
              >
                <Printer className="h-4 w-4 mr-1.5" />
                Imprimer PDF
              </button>
            </div>
          </div>

          {monthlyReport ? (
            <div className="space-y-6">
              {/* Graphic metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recharts Bar chart for departmental performances */}
                <div className="border border-gray-150 p-4 rounded-xl bg-slate-50/50">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest mb-3">Revenues par services</h4>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyReport.deptPerformance}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(val: number) => val.toLocaleString("fr-FR") + " FCFA"} />
                      <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="border border-gray-150 p-5 rounded-xl space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest">Coefficients Opérationnels</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white border rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Recouvrement</span>
                      <p className="text-xl font-extrabold text-blue-800 mt-1">{monthlyReport.recoveryRate}%</p>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Taux de solvabilité financier</span>
                    </div>
                    <div className="p-3 bg-white border rounded-xl text-center">
                      <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold block">Admissions</span>
                      <p className="text-xl font-extrabold text-teal-800 mt-1">{monthlyReport.totalAdmissions}</p>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Hospitalisations du mois</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border rounded-xl text-xs font-sans text-gray-700">
                    <span className="font-bold text-gray-900 block mb-1 uppercase text-[9px] tracking-widest text-slate-450">Médecine Générale (Top Pathologies)</span>
                    <ul className="space-y-1">
                      {monthlyReport.topPathologies.map((patho: any, i: number) => (
                        <li key={i} className="flex justify-between items-center text-[11px]">
                          <span className="truncate max-w-[200px]">{patho.name}</span>
                          <span className="font-bold text-teal-800">{patho.count} cas</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Printable Table of monthly activities */}
              <div className="border border-gray-150 rounded-2xl p-6" id="monthly-report-printable-area">
                <div className="flex justify-between items-start pb-4 border-b border-slate-150 mb-6">
                  <div>
                    <h4 className="font-sans font-bold text-teal-850 text-lg">{clinic?.name || "MédiSahel"} - Rapport Opérationnel Consolidé</h4>
                    <p className="text-xs text-gray-500">
                      {clinic?.address || "Hamdallaye ACI 2000"}, {clinic?.city || "Bamako"}, {clinic?.country || "Mali"} | Tél: {clinic?.phone || "+223 20 22 14 67"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 block">Période Mensuelle</span>
                    <span className="text-sm font-black text-slate-900 uppercase">{monthlyReport.monthText}</span>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Performance Globale par Service</h5>
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 text-gray-550 border-b border-slate-200">
                          <th className="p-2.5">Service / Département</th>
                          <th className="p-2.5">Nombre total d’actes / Admissions</th>
                          <th className="p-2.5 text-right font-bold">Chiffre d’Affaire Génére (FCFA)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.deptPerformance.map((dept: any, i: number) => (
                          <tr key={i} className="border-b">
                            <td className="p-2.5 font-bold text-gray-800">{dept.name}</td>
                            <td className="p-2.5 font-sans">{dept.count} actes</td>
                            <td className="p-2.5 text-right font-bold text-teal-900">{dept.revenue.toLocaleString("fr-FR")} FCFA</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
                          <td className="p-3 text-xs uppercase">TOTAL OPERATIONS MENSUELLES</td>
                          <td className="p-3 font-sans">
                            {monthlyReport.deptPerformance.reduce((a: number, b: any) => a + b.count, 0)} actes
                          </td>
                          <td className="p-3 text-right text-sm font-extrabold text-teal-800">
                            {monthlyReport.deptPerformance.reduce((a: number, b: any) => a + b.revenue, 0).toLocaleString("fr-FR")} FCFA
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Section Recouvrement des Factures</h5>
                      <dl className="space-y-2 text-xs font-sans">
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">Montant total Facturé :</dt>
                          <dd className="font-bold text-gray-900">{monthlyReport.totalInvoiced.toLocaleString("fr-FR")} FCFA</dd>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">Montant total Encaissé :</dt>
                          <dd className="font-bold text-emerald-700">{monthlyReport.totalPaid.toLocaleString("fr-FR")} FCFA</dd>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">Taux de solvabilité / recouvrement :</dt>
                          <dd className="font-extrabold text-blue-700 bg-blue-50 px-2 rounded">{monthlyReport.recoveryRate}%</dd>
                        </div>
                      </dl>
                    </div>

                    <div>
                      <h5 className="section-title text-xs uppercase tracking-wider font-bold text-teal-700 mb-3 border-l-4 border-teal-600 pl-2">Mouvement Admissions Hospitalières</h5>
                      <dl className="space-y-2 text-xs font-sans">
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">Total Admissions du mois :</dt>
                          <dd className="font-bold text-gray-900">{monthlyReport.totalAdmissions} patients</dd>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">Sorties cliniques notifiées :</dt>
                          <dd className="font-bold text-emerald-750">{monthlyReport.dischargedCount} patients</dd>
                        </div>
                        <div className="flex justify-between border-b py-1">
                          <dt className="text-gray-500">En cours d'hospitalisation :</dt>
                          <dd className="font-bold text-amber-700">{monthlyReport.activeCount} lits actifs</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 font-mono text-xs">Préparation du rapport mensuel directionnel...</div>
          )}
        </div>
      )}

      {/* DB RECOVERY OPS (SAUVEGARDE ET RESTAURATION) */}
      {activeSubTab === "backups" && (
        <div className="space-y-6" id="backups-portal">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Stats block database size */}
            <div className="bg-slate-50 border p-5 rounded-2xl flex flex-col justify-between h-40">
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-bold block tracking-wider">Taille de la Base</span>
                <p className="text-2xl font-black text-gray-900 mt-2 font-mono">
                  {backupStats ? backupStats.dbSize : "Calcul..."}
                </p>
                <span className="text-xs text-gray-500 mt-1 block">Fichiers backups JSON locaux</span>
              </div>
              <span className="text-[10px] text-teal-600 font-bold flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Dernière: {backupStats ? backupStats.lastBackup : "-"}
              </span>
            </div>

            <div className="bg-slate-50 border p-5 rounded-2xl flex flex-col justify-between h-40">
              <div>
                <span className="text-[10px] uppercase text-gray-400 font-bold block tracking-wider">Volume des Objets</span>
                <p className="text-2xl font-extrabold text-teal-800 mt-2">
                  {backupStats ? backupStats.totalPatients : "-"} Patients
                </p>
                <span className="text-xs text-gray-500 mt-1 block">
                  {backupStats ? backupStats.totalConsultations : "-"} consults | {backupStats ? backupStats.totalHospitalizations : "-"} hospitalisés
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase font-mono">
                Statut: 100% Fonctionnel PostgreSQL local
              </span>
            </div>

            <div className="border border-dashed border-teal-600 bg-teal-50/20 p-5 rounded-2xl flex flex-col justify-between h-40">
              <div>
                <span className="text-[10px] uppercase text-teal-700 font-bold block tracking-wider">Outils de Sauvegarde</span>
                <p className="text-xs text-slate-650 mt-1 font-semibold">Créez une image instantanée (Snapshot) des tables de la clinique locale.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleManualBackup}
                  className="flex-1 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition select-none cursor-pointer text-center"
                >
                  Sauvegarde Manuelle
                </button>
                <button
                  onClick={triggerDownloadBackup}
                  className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-xs text-gray-700 transition font-bold select-none cursor-pointer"
                  title="Télécharger l'export JSON"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Backup drag drop restore */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div 
              onDragOver={onDragOver}
              onDrop={onDrop}
              className="border-2 border-dashed border-gray-200 hover:border-slate-350 bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xs transition"
              id="backups-drag-box"
            >
              <div className="p-4 bg-teal-50 text-teal-700 rounded-full">
                <Upload className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Glissez-déposez un fichier de sauvegarde</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Importez un fichier JSON avec la signature MédiSahel pour lancer la restauration sécurisée.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Parcourir les fichiers
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files && handleRestoreFromFile(e.target.files[0])} 
                className="hidden" 
                accept=".json"
              />
            </div>

            {/* Local Server Backups list */}
            <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 flex flex-col">
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3">
                Sauvegardes Physiques sur Serveur ({backupsList.length})
              </h4>
              <p className="text-xs text-gray-500 mb-4 font-semibold">Les sauvegardes listées ci-dessous résident physiquement sur le serveur local Ubuntu.</p>
              
              {backupsList.length > 0 ? (
                <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {backupsList.map((b: any) => (
                    <div key={b.filename} className="py-3 flex items-center justify-between font-sans text-xs">
                      <div>
                        <span className="font-bold text-gray-800 block truncate max-w-[200px] font-mono">{b.filename}</span>
                        <span className="text-gray-400 mt-0.5 block">
                          Crée à {new Date(b.createdAt).toLocaleString("fr-FR")} ({b.createdBy})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded">{b.size}</span>
                        <button
                          onClick={() => handleLocalFileRestore(b.filename)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-black text-white text-[10px] rounded-lg font-bold transition cursor-pointer"
                        >
                          Restaurer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 font-mono text-xs py-8">
                  Aucun fichier de sauvegarde trouvé sur le serveur.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "medical_library" && (
        <div className="space-y-6 animate-fade-in" id="medical-library-portal">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Form Column - Left (1/3 width) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4 lg:col-span-1">
              <div className="border-b pb-3">
                <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-teal-800" />
                  {editingItemId ? "Modifier la Fiche Clinique" : "Ajouter une Fiche Clinique"}
                </h3>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                  Raccourcis intelligents d'autocomplétion posologique et examens
                </p>
              </div>

              <form onSubmit={handleCreateOrUpdateLibraryItem} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">
                    Catégorie Thérapeutique / Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newItemForm.category}
                    onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-750 focus:outline-none"
                  >
                    <option value="MEDICAMENT">💊 Médicament &amp; DCI</option>
                    <option value="BIOLOGIE">🧪 Examen Biologique</option>
                    <option value="SOIN">🩹 Protocole &amp; Acte Soignant</option>
                    <option value="PROTOCOLE">📋 Modèle &amp; Consultations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">
                    Raccourci de Saisie (doit commencer par @) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemForm.trigger}
                    onChange={(e) => setNewItemForm({ ...newItemForm, trigger: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-teal-750"
                    placeholder="e.g. @parac"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">
                    Libellé d'affichage court <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newItemForm.label}
                    onChange={(e) => setNewItemForm({ ...newItemForm, label: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-750"
                    placeholder="e.g. 💊 Paracétamol 1g Sachet"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">
                    Contenu ou Posologie d'autocomplétion <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newItemForm.text}
                    onChange={(e) => setNewItemForm({ ...newItemForm, text: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-medium h-32 focus:ring-1 focus:ring-teal-750 focus:outline-none"
                    placeholder="e.g. Paracétamol 1g sachet : 1 sachet à diluer dans un verre d'eau en cas de fièvre, max 3 sachets/jour."
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    {editingItemId ? "Sauvegarder" : "Créer le dictionnaire"}
                  </button>
                  {editingItemId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingItemId(null);
                        setNewItemForm({ trigger: "", label: "", text: "", category: "MEDICAMENT" });
                      }}
                      className="px-3 py-3 border border-slate-200 hover:bg-slate-50 text-gray-755 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Column - Right (2/3 width) */}
            <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4 lg:col-span-2 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Database className="h-4 w-4 text-teal-850" />
                    Catalogue Médical Central &amp; Dictionnaires Cliniques
                  </h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                    Gérez et éditez en temps réel les codes par défaut proposés aux soignants
                  </p>
                </div>
                <span className="text-[10px] bg-slate-100 px-2.5 py-1 rounded-sm text-gray-500 font-bold font-mono">
                  Éléments: {libraryItems.length}
                </span>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                <input
                  type="text"
                  placeholder="Rechercher par trigger ou libellé..."
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  className="p-2 border rounded-xl text-xs focus:ring-1 focus:ring-teal-750 font-medium"
                />
                <select
                  value={libraryCategory}
                  onChange={(e) => setLibraryCategory(e.target.value)}
                  className="p-2 border rounded-xl text-xs bg-white focus:ring-1 focus:ring-teal-750 font-semibold"
                >
                  <option value="ALL">⭐ Toutes les catégories</option>
                  <option value="MEDICAMENT">💊 Médicaments &amp; Ordonnances</option>
                  <option value="BIOLOGIE">🧪 Analyses Biologique</option>
                  <option value="SOIN">🩹 Actes Infirmiers</option>
                  <option value="PROTOCOLE">📋 Modèles de consultations</option>
                </select>
              </div>

              {/* Real list */}
              <div className="flex-1 divide-y divide-gray-100 max-h-[480px] overflow-y-auto pr-2 space-y-3">
                {libraryItems
                  .filter((item) => {
                    const matchCat = libraryCategory === "ALL" || item.category === libraryCategory;
                    const matchText = 
                      item.trigger.toLowerCase().includes(librarySearch.toLowerCase()) ||
                      item.label.toLowerCase().includes(librarySearch.toLowerCase()) ||
                      item.text.toLowerCase().includes(librarySearch.toLowerCase());
                    return matchCat && matchText;
                  })
                  .map((item) => (
                    <div key={item.id} className="py-3 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">
                            {item.trigger}
                          </span>
                          <h4 className="font-bold text-gray-800">{item.label}</h4>
                          <span className="text-[9px] bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-gray-500 tracking-wide">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-gray-650 leading-normal text-[11px] whitespace-pre-wrap pl-1">
                          {item.text}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                        <button
                          onClick={() => handleEditLibraryItem(item)}
                          className="px-2 py-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[10px] rounded font-bold cursor-pointer transition-colors"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteLibraryItem(item.id)}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 text-[10px] rounded font-bold cursor-pointer transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
                {libraryItems.length === 0 && (
                  <div className="py-8 text-center text-gray-400 font-mono">
                    Aucun élément enregistré dans la bibliothèque.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
