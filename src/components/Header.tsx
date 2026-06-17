import React, { useState, useEffect, useRef } from "react";
import { 
  LogOut, Shield, User as UserIcon, Calendar, Activity, Sun, Moon, 
  Search, Bell, Mail, MessageSquare, AlertTriangle, CheckSquare, 
  Clock, Heart, ShieldCheck, HelpCircle, FileText, ShieldAlert,
  Award, Pill, FlaskConical, Stethoscope
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const handleResultClick = (item: any) => {
    setShowSearchResults(false);
    setSearchQuery("");
    if (onSelectTab) {
      if (item.type === "patient") {
        onSelectTab("dme", { patientName: item.label, isPatient: true, id: item.id });
      } else if (item.type === "invoice") {
        onSelectTab("billing", { invoiceId: item.label, isInvoice: true });
      } else if (item.type === "drug") {
        onSelectTab("pharmacy_sales", { itemName: item.label, isItem: true });
      } else if (item.type === "lab") {
        onSelectTab("lab", { focusAnalyses: true });
      } else if (item.type === "appointment") {
        onSelectTab("appointments", { focusCalendar: true });
      } else {
        onSelectTab("dashboard");
      }
    }
  };

  // Build the search database dynamically combining static and dynamic patients (Point 3)
  const searchDatabase = [
    ...patientsList.map(p => ({
      id: p.id,
      type: "patient",
      category: "Patient (DME)",
      label: `${p.firstName} ${p.lastName}`.toUpperCase(),
      info: `NID: ${p.nationalId || "N/A"} • Tél: ${p.phone || "N/A"}`,
      desc: `Sexe: ${p.gender || "N/A"} • Ethnie: ${p.ethnie || "N/A"} • Dossier Actif`
    })),
    { type: "patient", category: "Patient", label: "DIARRA AMADOU", info: "N° Dossier: DME-849 • Mopti", desc: "Patient admis - Surveillance réanimation" },
    { type: "patient", category: "Patient", label: "SACKO MARIAM", info: "N° Dossier: DME-1122 • Sevaré", desc: "Hospitalisée - Chambre 402, Lit B" },
    { type: "invoice", category: "Facture", label: "FAC-2026-1049", info: "Montant: 45 000 FCFA • Tiers payant: CNAM", desc: "Facturation - Assurance Mutuelle active" },
    { type: "invoice", category: "Facture", label: "FAC-2026-1050", info: "Montant: 12 500 FCFA • Payé comptant", desc: "Caisse Pharmacie - Reçu acquitté" },
    { type: "lab", category: "Laboratoire", label: "RÉSULTAT NFS & BIOCH", info: "Commanditaire: Dr. Ibrahim Touré", desc: "Analyses de sang complet terminées • Critique" },
    { type: "drug", category: "Médicament", label: "PARACÉTAMOL INJECTABLE 500MG", info: "Stock: 412 flacons • Lot #PM-9941", desc: "Date péremption: 31/12/2026 - Alerte bas" },
    { type: "drug", category: "Médicament", label: "AMOXIClLLINE GÉLULES 250MG", info: "Stock: 80 boîtes • Lot #AM-8840", desc: "Pharmacie principale - Stock suffisant" },
    { type: "collaborator", category: "Collaborateur", label: "DR. IBRAHIM TOURÉ", info: "Rôle: Médecin Généraliste", desc: "Affectation: Service Médecine Générale" },
    { type: "collaborator", category: "Collaborateur", label: "FATOUMATA DIARRA", info: "Rôle: Personnel Infirmier", desc: "Affectation: Hospitalisation & Lits" },
    { type: "appointment", category: "Rendez-vous", label: "SACKO MARIAM - DR. DIALLO", info: "Prévu: 14/06/2026 à 10:30", desc: "Visite de contrôle chirurgie générale" }
  ];

  const filteredSearchResults = debouncedQuery.trim() === "" 
    ? [] 
    : searchDatabase.filter(item => 
        item.label.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        (item.info && item.info.toLowerCase().includes(debouncedQuery.toLowerCase())) ||
        (item.desc && item.desc.toLowerCase().includes(debouncedQuery.toLowerCase()))
      );

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
                  onClick={() => setSearchQuery("")} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-slate-600 text-xs font-mono font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Simulated Live Results Popup */}
            {showSearchResults && searchQuery.trim() !== "" && (
              <div className="absolute top-11 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden text-xs max-h-[350px] overflow-y-auto">
                <div className="bg-slate-50 px-4 py-2 font-mono text-[9px] uppercase tracking-wider text-gray-400 border-b border-gray-100 flex justify-between">
                  <span>Index de la Clinique • {filteredSearchResults.length} résultats</span>
                  <kbd className="bg-white border border-gray-200 px-1 rounded text-4xs">ESC</kbd>
                </div>
                {filteredSearchResults.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic font-medium">
                    Aucune correspondance clinique trouvée pour "{searchQuery}"
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredSearchResults.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleResultClick(item)}
                        className="p-3 hover:bg-slate-50/70 transition-colors cursor-pointer flex justify-between items-start"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{item.label}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-extrabold uppercase ${
                              item.type === "patient" ? "bg-blue-50 text-blue-600 border border-blue-200/30" :
                              item.type === "lab" ? "bg-purple-50 text-purple-600 border border-purple-200/30" :
                              item.type === "drug" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/30" :
                              "bg-orange-50 text-orange-600 border border-orange-200/30"
                            }`}>
                              {item.category}
                            </span>
                          </div>
                          <p className="text-3xs text-slate-500 font-mono mt-0.5">{item.info}</p>
                          <p className="text-3xs text-slate-400 italic mt-0.5">{item.desc}</p>
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
                        
                        return (
                          <div key={index} className="p-3 hover:bg-slate-50/70 flex gap-2.5 items-start">
                            <span className="h-2 w-2 rounded-full bg-teal-500 shrink-0 mt-1.5 animate-pulse"></span>
                            <div className="flex-1">
                              <p className="font-bold text-slate-800 leading-snug">
                                {toast}
                              </p>
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
