import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Shield, User as UserIcon, Calendar, Activity, Sun, Moon, 
  Search, Bell, Mail, MessageSquare, AlertTriangle, CheckSquare, 
  Clock, Heart, ShieldCheck, HelpCircle, FileText, ShieldAlert,
  Award, Pill, FlaskConical, Stethoscope, Printer, Download, Filter
} from "lucide-react";
import { User, Clinic } from "../types.ts";

interface HeaderProps {
  user: User;
  clinic: Clinic;
  onLogout: () => void;
  activeTab: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  toastHistory?: string[];
  onClearHistory?: () => void;
  onSelectTab?: (tab: string, arg?: any) => void;
  onDepartClick?: () => void;
  hasCheckedInToday?: boolean;
  hasCheckedOutToday?: boolean;
  patientsList?: any[];
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  clinic, 
  onLogout, 
  activeTab, 
  darkMode, 
  onToggleDarkMode,
  toastHistory = [],
  onClearHistory,
  onSelectTab,
  onDepartClick,
  hasCheckedInToday = false,
  hasCheckedOutToday = false,
  patientsList = []
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showEmailMenu, setShowEmailMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  // Advanced filters state
  const [filterType, setFilterType] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDoctor, setFilterDoctor] = useState("");

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch search results from the backend in real-time
  useEffect(() => {
    if (!showSearchResults || searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      const q = debouncedQuery.trim();
      const stoken = localStorage.getItem("medisahel_token");
      if (!stoken) return;

      setSearchLoading(true);
      try {
        const url = `/api/search/global?query=${encodeURIComponent(q)}&type=${filterType}&date=${filterDate}&status=${filterStatus}&doctor=${encodeURIComponent(filterDoctor)}`;
        const res = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${stoken}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Failed to query global search backend:", err);
      } finally {
        setSearchLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, filterType, filterDate, filterStatus, filterDoctor, showSearchResults]);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const handleResultClick = (item: any) => {
    setShowSearchResults(false);
    setSearchQuery("");
    if (onSelectTab) {
      if (item.type === "patient") {
        onSelectTab("dme", { patientName: item.patient, isPatient: true, id: item.id });
      } else if (item.type === "consultation") {
        onSelectTab("dmg", { consultationId: item.id, isConsultation: true });
      } else if (item.type === "facture") {
        onSelectTab("billing", { invoiceId: item.id, isInvoice: true });
      } else if (item.type === "analyse") {
        onSelectTab("lab", { focusAnalyses: true });
      } else if (item.type === "ordonnance") {
        onSelectTab("pharmacy_sales", { prescriptionId: item.id, isPrescription: true });
      } else if (item.type === "document" || item.type === "imagerie") {
        onSelectTab("documents", { focusDocuments: true });
      } else {
        onSelectTab("dashboard");
      }
    }
  };

  // Export as XLS (CSV format)
  const handleExportExcel = () => {
    if (searchResults.length === 0) return;
    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Type;Identifiant/N°;Patient;Date;Auteur/Réf;Titre;Détails;Statut\n";
    
    searchResults.forEach(item => {
      const typeLabel = item.category || item.type;
      const refNum = item.number || item.id;
      const patName = item.patient || "N/A";
      const itemDate = item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "N/A";
      const docName = item.doctor || "N/A";
      const title = (item.title || "").replace(/;/g, ",").replace(/\n/g, " ");
      const details = (item.details || "").replace(/;/g, ",").replace(/\n/g, " ");
      const status = item.status || "N/A";
      
      csvContent += `${typeLabel};${refNum};${patName};${itemDate};${docName};${title};${details};${status}\n`;
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `recherche_medisahel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export as PDF (using Print view)
  const handleExportPDF = () => {
    if (searchResults.length === 0) return;
    
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const rows = searchResults.map(item => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 10px; font-weight: bold; color: #0f172a;">${item.category || item.type}</td>
        <td style="padding: 10px; font-family: monospace; color: #475569;">${item.number || item.id}</td>
        <td style="padding: 10px;">${item.patient || "N/A"}</td>
        <td style="padding: 10px; white-space: nowrap;">${item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "N/A"}</td>
        <td style="padding: 10px;">${item.doctor || "N/A"}</td>
        <td style="padding: 10px; font-weight: 500;">${item.title}</td>
        <td style="padding: 10px; color: #64748b;">${item.details || ""}</td>
        <td style="padding: 10px; text-align: right;"><span style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase;">${item.status}</span></td>
      </tr>
    `).join("");
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport de Recherche Globale - MédiSahel</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #334155; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .headline { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .subline { font-size: 12px; color: #64748b; margin-top: 5px; }
            .clinic-name { font-size: 16px; font-weight: bold; color: #0d9488; }
            table { width: 100%; border-collapse: collapse; text-align: left; }
            th { background-color: #f8fafc; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 10px; border-bottom: 1px solid #cbd5e1; }
            .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="headline">Rapport de Recherche Globale</div>
              <div class="subline">Critères : "${searchQuery}" • Extraits le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</div>
            </div>
            <div style="text-align: right;">
              <div class="clinic-name">${clinic.name}</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">ERP Hospitalier MédiSahel</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Réf/Id</th>
                <th>Patient</th>
                <th>Date</th>
                <th>Créateur/Auteur</th>
                <th>Titre / Diagnostic</th>
                <th>Détails</th>
                <th style="text-align: right;">Statut</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div class="footer">
            Document généré par l'ERP MédiSahel Clinique. Cachet numérique de conformité : ${clinic.licenseNumber || "N/A"}.
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 transition-colors duration-150">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* ZONE GAUCHE : Logo & Clinique Info (Point 1 Header Premium) */}
          <div className="flex items-center space-x-3 shrink-0">
            <div 
              className="p-2.5 rounded-xl text-white flex items-center justify-center shadow-md animate-pulse"
              style={{ backgroundColor: clinic.themeColor }}
              id="clinic-logo-container"
            >
              <Activity className="h-5 w-5" id="clinic-logo-icon" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-sans font-black tracking-tight text-slate-900 text-sm md:text-md leading-none">
                  {clinic.name}
                </h1>
                <span className="bg-teal-50 text-teal-700 text-[8px] font-mono px-1.5 py-0.5 rounded font-black uppercase border border-teal-200/30">
                  V3.5 PRO Enterprise
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[9px] text-gray-400 font-mono leading-none">
                  Mopti Sahel
                </span>
                <span className="inline-flex items-center px-1 rounded bg-teal-500/10 text-teal-600 text-[8px] font-bold font-mono border border-teal-500/20">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full mr-1 animate-ping"></span>
                  Licence Active
                </span>
              </div>
            </div>
          </div>

          {/* ZONE CENTRALE : Recherche Universelle Interactive (Point 1 Central Universal Search) */}
          <div className="flex-grow max-w-xl relative hidden lg:block" ref={searchRef}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Recherche globale (Patient, dossier, facture, labo, médicament...)"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600 transition-all font-sans text-slate-800"
                id="header-universal-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                    setFilterDate("all");
                    setFilterStatus("all");
                    setFilterDoctor("");
                  }} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-slate-600 text-xs font-mono font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Smart Search Panel Popover Dashboard */}
            {showSearchResults && searchQuery.trim() !== "" && (
              <div className="absolute top-11 right-0 w-[95vw] md:w-[780px] md:-right-24 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs">
                {/* Advanced Filters Bar */}
                <div className="bg-slate-50 p-3.5 border-b border-gray-100 flex flex-wrap gap-2.5 items-end justify-between">
                  {/* Left Column Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Filter Type */}
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-550 mb-1 uppercase font-mono tracking-wider">Type</span>
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="p-1 px-2 border border-gray-200 rounded-lg text-3xs font-medium bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                      >
                        <option value="all">Tout</option>
                        <option value="patient">Patients (DME)</option>
                        <option value="consultation">Consultations</option>
                        <option value="ordonnance">Ordonnances</option>
                        <option value="analyse">Analyses Labo</option>
                        <option value="facture">Factures</option>
                        <option value="document">Documents GECD</option>
                        <option value="imagerie">Examens Imagerie</option>
                      </select>
                    </div>

                    {/* Filter Date */}
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-550 mb-1 uppercase font-mono tracking-wider">Période</span>
                      <select 
                        value={filterDate} 
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="p-1 px-2 border border-gray-200 rounded-lg text-3xs font-medium bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                      >
                        <option value="all">Toutes dates</option>
                        <option value="today">Aujourd'hui</option>
                        <option value="week">Cette semaine</option>
                        <option value="month">Ce mois-ci</option>
                        <option value="year">Cette année</option>
                      </select>
                    </div>

                    {/* Filter Status */}
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-550 mb-1 uppercase font-mono tracking-wider">Statut</span>
                      <select 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="p-1 px-2 border border-gray-200 rounded-lg text-3xs font-medium bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                      >
                        <option value="all">Tous statuts</option>
                        <option value="pending">En attente</option>
                        <option value="validated">Validé / Prêt</option>
                        <option value="paid">Payé</option>
                      </select>
                    </div>

                    {/* Filter Doctor */}
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-slate-550 mb-1 uppercase font-mono tracking-wider">Médecin</span>
                      <input 
                        type="text"
                        placeholder="Chercher praticien..."
                        value={filterDoctor} 
                        onChange={(e) => setFilterDoctor(e.target.value)}
                        className="p-1 px-2 border border-gray-200 rounded-lg text-3xs bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 font-sans w-28 placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Right Column Action Exports */}
                  <div className="flex items-center gap-1.5 self-end">
                    <button 
                      onClick={handleExportExcel}
                      disabled={searchResults.length === 0}
                      className="p-1 px-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-3xs font-extrabold cursor-pointer hover:bg-emerald-100/70 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    >
                      <Download className="h-3 w-3" />
                      <span>Excel (XLS)</span>
                    </button>
                    <button 
                      onClick={handleExportPDF}
                      disabled={searchResults.length === 0}
                      className="p-1 px-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-3xs font-extrabold cursor-pointer hover:bg-indigo-100/70 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                    >
                      <Printer className="h-3 w-3" />
                      <span>Imprimer (PDF)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-100 px-4 py-1.5 font-mono text-[9px] uppercase tracking-wider text-gray-550 border-b border-gray-150 flex justify-between items-center">
                  <span>Index d'ERP Clinique • {searchLoading ? "Recherche en cours..." : `${searchResults.length} résultats correspondants`}</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="bg-white border border-gray-250 px-1 rounded text-4xs">ESC</kbd>
                  </div>
                </div>

                {searchLoading ? (
                  <div className="p-8 text-center text-slate-400 italic font-medium flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full" />
                    <span>Recherche en cours dans la base de données...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 italic font-medium">
                    Aucune correspondance clinique ou document trouvé pour "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto">
                    {searchResults.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleResultClick(item)}
                        className="p-3 hover:bg-slate-50/75 transition-colors cursor-pointer flex justify-between items-start gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-800 text-xs">{item.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase shrink-0 border ${
                              item.type === "patient" ? "bg-blue-50 text-blue-700 border-blue-200/40" :
                              item.type === "consultation" ? "bg-teal-50 text-teal-700 border-teal-200/40" :
                              item.type === "analyse" ? "bg-purple-50 text-purple-700 border-purple-200/40" :
                              item.type === "ordonnance" ? "bg-amber-50 text-amber-700 border-amber-200/40" :
                              item.type === "facture" ? "bg-emerald-50 text-emerald-800 border-emerald-200/40" :
                              item.type === "imagerie" ? "bg-rose-50 text-rose-700 border-rose-200/40" :
                              "bg-slate-50 text-slate-600 border-slate-200/40"
                            }`}>
                              {item.category || item.type}
                            </span>
                            <span className="text-[9px] font-mono font-extrabold text-slate-500 uppercase shrink-0">
                              {item.number}
                            </span>
                          </div>
                          
                          {/* Metadata row details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mt-1 text-3xs text-slate-500 font-sans">
                            <p><span className="font-semibold text-slate-650">Patient:</span> <span className="font-bold text-slate-800">{item.patient}</span></p>
                            <p><span className="font-semibold text-slate-650">Créé par:</span> <span className="font-semibold text-slate-700">{item.doctor || "N/A"}</span></p>
                          </div>
                          <p className="text-3xs text-slate-400 italic mt-0.5 line-clamp-2">{item.details}</p>
                        </div>
                        <div className="text-right shrink-0 self-center">
                          <p className="text-4xs text-slate-450 font-mono font-bold leading-none mb-1">
                            {item.date ? new Date(item.date).toLocaleDateString("fr-FR") : "N/A"}
                          </p>
                          <span className="inline-block bg-slate-100 text-slate-700 text-[8px] font-extrabold font-mono px-1 py-0.2 rounded border border-slate-250">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ZONE DROITE : Actions, Notification Center, Profil (Point 1 Central & Right Notification Area) */}
          <div className="flex items-center space-x-3 shrink-0">
            
            {/* Professional Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl border border-gray-200 hover:bg-slate-50 text-gray-400 hover:text-teal-600 transition-all cursor-pointer flex items-center justify-center relative"
              title={darkMode ? "Mode Clair" : "Mode Sombre"}
              id="header-darkmode-toggle"
            >
              {darkMode ? (
                <Sun className="h-4.5 w-4.5 text-yellow-500 animate-spin-slow" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-500" />
              )}
            </button>

            {/* Message Interne (Point 4 Alerte Messages) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMessageMenu(!showMessageMenu);
                  setShowNotificationMenu(false);
                  setShowEmailMenu(false);
                }}
                className="p-2 rounded-xl border border-gray-200 hover:bg-slate-50 text-gray-400 hover:text-blue-600 transition-all cursor-pointer flex items-center justify-center relative"
              >
                <MessageSquare className="h-4.5 w-4.5 text-slate-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-500 ring-2 ring-white"></span>
              </button>
              {showMessageMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-250 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                  <div className="bg-slate-900 text-slate-100 p-3 flex justify-between items-center">
                    <span className="font-bold font-mono text-[10px] uppercase">Messagerie Interne Hospitalière</span>
                    <span className="bg-blue-600 text-white text-[8px] font-mono px-1 rounded-full">1 New</span>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
                    <div className="p-3 hover:bg-slate-50">
                      <p className="font-semibold text-slate-800">Dr. Alou Diallo (Médecin Chef)</p>
                      <p className="text-3xs text-slate-500 mt-1">"Merci de valider le lot d'insuline rapide reçu de la pharmacie de garde hier soir."</p>
                      <span className="text-4xs text-slate-400 font-mono mt-1 block">Il y a 10 min • Urgent</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Emailing Direct Portal */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowEmailMenu(!showEmailMenu);
                  setShowNotificationMenu(false);
                  setShowMessageMenu(false);
                }}
                className="p-2 rounded-xl border border-gray-200 hover:bg-slate-50 text-gray-400 hover:text-orange-600 transition-all cursor-pointer flex items-center justify-center relative"
              >
                <Mail className="h-4.5 w-4.5 text-slate-500" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white"></span>
              </button>
              {showEmailMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-250 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
                  <div className="bg-slate-900 text-slate-100 p-3 flex justify-between items-center">
                    <span className="font-bold font-mono text-[10px] uppercase">Campagnes & Emails</span>
                  </div>
                  <div className="p-3 text-center text-slate-400 italic py-6">
                    Aucun email en cours d'envoi.
                  </div>
                </div>
              )}
            </div>

            {/* Notification Center (Point 4 Notifications Temps Réel Complètes) */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  setShowEmailMenu(false);
                  setShowMessageMenu(false);
                }}
                ref={bellRef}
                className="p-1.5 rounded-xl border border-gray-200 hover:bg-slate-50 text-gray-400 hover:text-red-650 transition-all cursor-pointer flex items-center justify-center relative"
                id="header-notifications-bell-btn"
              >
                <Bell className="h-4.5 w-4.5 text-slate-500" />
                {toastHistory.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-600 text-white rounded-full font-mono text-[8px] font-black flex items-center justify-center ring-2 ring-white animate-bounce">
                    {toastHistory.length}
                  </span>
                )}
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-250 rounded-2xl shadow-xl z-50 overflow-hidden text-xs text-left font-sans">
                  <div className="bg-slate-900 text-slate-100 p-3.5 flex justify-between items-center border-b border-gray-800">
                    <span className="font-bold font-mono text-[10px] uppercase">Alertes de Sûreté & Cliniques ({toastHistory.length})</span>
                    {onClearHistory && toastHistory.length > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearHistory();
                        }}
                        className="text-[9px] font-bold text-rose-300 hover:text-rose-100 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/20"
                      >
                        Effacer tout
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto">
                    
                    {toastHistory.length > 0 ? (
                      toastHistory.map((toast, index) => {
                        let badgeBg = "bg-teal-50 text-teal-700";
                        if (toast.includes("🔬") || toast.includes("Laboratoire")) badgeBg = "bg-purple-50 text-purple-705 border border-purple-100";
                        else if (toast.includes("💰") || toast.includes("Caisse")) badgeBg = "bg-emerald-50 text-emerald-800 border border-emerald-100";
                        else if (toast.includes("💊") || toast.includes("Pharmacie")) badgeBg = "bg-amber-50 text-amber-800 border border-amber-100";
                        
                        const isNewPatientAlert = toast.includes("Nouveau patient") || toast.includes("patient orienté") || toast.includes("caisse");
                        let matchedPatient: any = null;
                        if (isNewPatientAlert && patientsList && patientsList.length > 0) {
                          matchedPatient = patientsList.find(p => {
                            const lName = p.lastName.toUpperCase();
                            const fName = p.firstName.toUpperCase();
                            return toast.toUpperCase().includes(lName) || toast.toUpperCase().includes(fName);
                          });
                        }

                        return (
                          <div 
                            key={index} 
                            onClick={() => {
                              if (matchedPatient && onSelectTab) {
                                window.location.hash = `#/dmg/consultation/${matchedPatient.id}`;
                                onSelectTab("dmg", { isConsultationRedirect: true, id: matchedPatient.id });
                                setShowNotificationMenu(false);
                              }
                            }}
                            className={`p-3 flex gap-2.5 items-start transition-all ${
                              matchedPatient ? "cursor-pointer hover:bg-teal-50/70 bg-teal-50/10 border-l-2 border-teal-500" : "hover:bg-slate-50/70"
                            }`}
                          >
                            <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5 animate-pulse"></span>
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 leading-snug">
                                {toast}
                              </p>
                              {matchedPatient && (
                                <span className="text-[7.5px] font-extrabold text-teal-700 block mt-0.5 underline">
                                  ➡️ Ouvrir la consultation de {matchedPatient.firstName} {matchedPatient.lastName.toUpperCase()}
                                </span>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <span className={`text-[8px] tracking-wide font-mono uppercase px-1 py-0.2 rounded font-black ${badgeBg}`}>
                                  En temps réel
                                </span>
                                <span className="text-[8px] text-gray-450 font-mono">Clinique Sahel</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-10 text-center text-slate-400 italic">
                        Aucune notification récente enregistrée dans le registre d'historique.
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>

            {/* Separator vertical track */}
            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            {/* User credentials details block */}
            <div className="hidden md:flex flex-col text-right">
              <span className="font-sans font-black text-xs text-slate-900 flex items-center justify-end leading-none">
                {user.name}
              </span>
              <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest flex items-center justify-end mt-1.5">
                <Shield className="h-3 w-3 mr-1 text-teal-700" />
                {user.role}
              </span>
            </div>

            {/* Permanent departure button */}
            {onDepartClick && (
              <button
                id="header-depart-btn"
                onClick={onDepartClick}
                disabled={hasCheckedOutToday || !hasCheckedInToday}
                className={`p-2 px-3 ml-2 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all outline-none ${
                  hasCheckedOutToday
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : !hasCheckedInToday
                    ? "bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-150"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-750 hover:text-amber-850 border border-amber-250 cursor-pointer shadow-xs"
                }`}
                title={hasCheckedOutToday ? "Départ déjà validé pour aujourd'hui" : !hasCheckedInToday ? "Vous devez d'abord pointer votre arrivée" : "Enregistrer mon de départ aujourd'hui"}
              >
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{hasCheckedOutToday ? "DÉPART SIGNALÉ" : "🚪 DÉPART"}</span>
              </button>
            )}

            {/* Logout trigger button */}
            <button
              onClick={onLogout}
              className="p-2 ml-1 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg transition-colors duration-150 inline-flex items-center space-x-1.5 text-xs font-semibold cursor-pointer focus:outline-none"
              title="Se déconnecter"
              id="logout-btn"
            >
              <LogOut className="h-4 w-4 text-slate-400 hover:text-rose-600" />
              <span className="hidden sm:inline text-slate-600 font-bold hover:text-rose-700">Sortie</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
