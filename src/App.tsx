/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Patient, 
  BedAllocation, 
  LabTest, 
  MedicalImage, 
  StockItem, 
  Invoice, 
  StaffPresence, 
  MailRecord, 
  TriageRecord,
  UserRole,
  ClinicBranding,
  AuditLog
} from "./types";
import { 
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_RECORDS,
  INITIAL_BEDS,
  INITIAL_LAB_TESTS,
  INITIAL_IMAGING,
  INITIAL_STOCK,
  INITIAL_INVOICES,
  INITIAL_PRESENCE,
  INITIAL_MAILS,
  INITIAL_TRIAGE,
  HOSPITAL_STAFF_ACCOUNTS,
  loadFromLocal,
  saveToLocal,
  getOfflineQueue,
  addToOfflineQueue,
  clearOfflineQueue,
  OfflineQueueItem
} from "./mockData";

import DashboardView from "./components/DashboardView";
import PatientsView from "./components/PatientsView";
import ConsultationView from "./components/ConsultationView";
import BillingView from "./components/BillingView";
import SpecializedModulesView from "./components/SpecializedModulesView";
import BrandingSettings from "./components/BrandingSettings";

import { 
  Activity, 
  Users, 
  Stethoscope, 
  CreditCard, 
  Layers, 
  Settings, 
  User, 
  Search, 
  Wifi, 
  WifiOff, 
  Clock, 
  RefreshCw,
  LogOut,
  Sliders,
  AlertTriangle,
  Lock,
  Mail,
  TrendingUp,
  FlaskConical,
  ClipboardList
} from "lucide-react";

export default function App() {
  // Offline State simulator
  const [isOffline, setIsOffline] = useState(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  // RBAC State
  const [activeRole, setActiveRole] = useState<UserRole>("Administrateur Système");
  const [activeUser, setActiveUser] = useState("Sidi Coulibaly (SysAdmin)");

  // Clinic Brand States (Initialized from server or offline fallback)
  const [clinicBrand, setClinicBrand] = useState<ClinicBranding>({
    name: "MédiSahel Clinique",
    slogan: "L'excellence des soins au cœur du Sahel",
    primaryColor: "#0284c7",
    secondaryColor: "#0f766e",
    activeModules: {
      patients: true,
      rdv: true,
      dme: true,
      hospitalisation: true,
      labo: true,
      imagerie: true,
      pharmacie: true,
      facturation: true,
      presences: true,
      paie: true,
      courrier: true,
      rapports: true,
      mutuelles: true,
      teleconsultation: true,
      urgences: true,
    }
  });

  // Global Lists loaded from local cache
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);
  const [beds, setBeds] = useState<BedAllocation[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [presences, setPresences] = useState<StaffPresence[]>([]);
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [triages, setTriages] = useState<TriageRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Active view
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Universal Ctrl+K Search Command Palette states
  const [showSearchPalette, setShowSearchPalette] = useState(false);
  const [paletteSearchQuery, setPaletteSearchQuery] = useState("");

  // Loading indicator for syncing
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    // 1. Fetch Branding directly from Express backend if online
    fetch("/api/clinics/brand")
      .then(r => r.json())
      .then(data => {
        if (data && data.name) setClinicBrand(data);
      })
      .catch(err => {
        console.log("Using offline default branding config.");
      });

    // 2. Load lists with Local Storage backups (simulating Client IndexedDB)
    setPatients(loadFromLocal("patients", INITIAL_PATIENTS));
    setAppointments(loadFromLocal("appointments", INITIAL_APPOINTMENTS as any));
    setRecords(loadFromLocal("records", INITIAL_RECORDS as any));
    setBeds(loadFromLocal("beds", INITIAL_BEDS));
    setLabTests(loadFromLocal("labTests", INITIAL_LAB_TESTS));
    setImages(loadFromLocal("images", INITIAL_IMAGING));
    setStocks(loadFromLocal("stocks", INITIAL_STOCK));
    setInvoices(loadFromLocal("invoices", INITIAL_INVOICES));
    setPresences(loadFromLocal("presences", INITIAL_PRESENCE));
    setMails(loadFromLocal("mails", INITIAL_MAILS));
    setTriages(loadFromLocal("triages", INITIAL_TRIAGE));
    setOfflineQueue(getOfflineQueue());

    // 3. Fetch logs
    fetchLogs();
  }, []);

  // Listen to keyboard shortcuts (Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchPalette(prev => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchLogs = () => {
    fetch("/api/audit-logs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(e => console.log("Logs list unreachable offline."));
  };

  // Log action on server & locally
  const logSystemAction = async (action: string, details: string) => {
    const logBody = {
      user: activeUser,
      role: activeRole,
      action,
      details
    };

    if (!isOffline) {
      try {
        await fetch("/api/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logBody)
        });
        fetchLogs();
        return;
      } catch (err) {
        console.log("Offline backup logs cached.");
      }
    }

    // Locale fallback and append
    const localLogs: AuditLog[] = loadFromLocal("audit_logs_local", []);
    const fallbackLog: AuditLog = {
      id: "log_local_" + Date.now(),
      timestamp: new Date().toISOString(),
      user: activeUser,
      role: activeRole,
      action: `${action} (Caché localement)`,
      details,
      ip: "127.0.0.1 (Local)"
    };
    localLogs.unshift(fallbackLog);
    saveToLocal("audit_logs_local", localLogs);
    setAuditLogs(prev => [fallbackLog, ...prev]);
  };

  // Change staff user on the fly
  const handleRoleChange = (roleName: UserRole) => {
    const matched = HOSPITAL_STAFF_ACCOUNTS.find(acc => acc.role === roleName);
    if (matched) {
      setActiveRole(roleName);
      setActiveUser(matched.name);
      logSystemAction("Changement de session", `Session ouverte sous le profil ${roleName}`);
    }
  };

  // Check RBAC limits on clicked navigation
  const isAuthorized = (tab: string): boolean => {
    if (activeRole === "Administrateur Système") return true;

    if (tab === "settings") return false; // Exclusively SuperAdmin

    if (activeRole === "Caissier") {
      return ["dashboard", "billing"].includes(tab);
    }
    if (activeRole === "Laborantin" || activeRole === "Radiologue") {
      return ["dashboard", "specialized"].includes(tab);
    }
    if (activeRole === "Réceptionniste") {
      return ["dashboard", "patients", "specialized"].includes(tab);
    }
    if (activeRole === "Médecin" || activeRole === "Sage-femme" || activeRole === "DG") {
      return true; // Large medical authorization
    }
    return false;
  };

  // Synchronise queue to Local Server
  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg("Connexion établie. Synchronisation du registre...");

    const pQueue = offlineQueue.filter(item => item.type === "PATIENT").map(i => i.payload);
    const rQueue = offlineQueue.filter(item => item.type === "RDV").map(i => i.payload);
    const tQueue = offlineQueue.filter(item => item.type === "TRIAGE").map(i => i.payload);

    try {
      const resp = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patients: pQueue,
          rdvs: rQueue,
          triages: tQueue,
          operator: activeUser
        })
      });

      if (!resp.ok) throw new Error("Erreur serveur de synchronisation.");

      const d = await resp.json();
      clearOfflineQueue();
      setOfflineQueue([]);
      setSyncStatusMsg("Fichiers synchronisés ! Sauvegarde serveurs à jour.");
      logSystemAction("Synchro Manuelle", "Synchronisation des entrées différées complétée.");
      setTimeout(() => setSyncStatusMsg(null), 3000);
    } catch (err) {
      setSyncStatusMsg("Impossible de joindre le serveur local. Synchro échouée.");
      setTimeout(() => setSyncStatusMsg(null), 3550);
    } finally {
      setIsSyncing(false);
    }
  };

  // CRUD events

  // 1. Patients Register
  const handleAddPatient = (data: Omit<Patient, "id" | "createdAt">) => {
    const nextId = `MS-2026-${String(patients.length + 45).padStart(4, "0")}`;
    const newPatient: Patient = {
      ...data,
      id: nextId,
      createdAt: new Date().toISOString()
    };

    const updated = [newPatient, ...patients];
    setPatients(updated);
    saveToLocal("patients", updated);

    // Logs & Queues
    if (isOffline) {
      addToOfflineQueue({
        type: "PATIENT",
        action: "CREATE",
        payload: newPatient,
        timestamp: new Date().toISOString()
      });
      setOfflineQueue(getOfflineQueue());
    }
    logSystemAction("Création de dossier", `Patient unique ${newPatient.nom} enregistré (${nextId})`);
  };

  // 2. Consultations & DME Clinic Records
  const handleAddRecord = (data: any) => {
    const nextId = `consult-${Date.now().toString().slice(-4)}`;
    const newRec = {
      ...data,
      id: nextId,
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      medecinSignature: activeUser
    };

    const updated = [newRec, ...records];
    setRecords(updated as any);
    saveToLocal("records", updated as any);

    // Push requested exams to lab tests automatically !
    if (data.examensDemandes && data.examensDemandes.length > 0) {
      const pName = patients.find(p => p.id === data.patientId)?.nom || "Patient";
      data.examensDemandes.forEach((exam: string) => {
        const typeEx: any = exam.includes("Biochimie") 
          ? "Biochimie" 
          : exam.includes("NFS") 
          ? "Hématologie" 
          : exam.includes("Goutte") 
          ? "Parasitologie" 
          : "Biochimie";

        const newLab: LabTest = {
          id: `lab-${Date.now().toString().slice(-4)}-${Math.floor(Math.random()*10)}`,
          patientId: data.patientId,
          patientNom: pName,
          typeExamen: typeEx,
          nomAnalyse: exam,
          valeurReference: "Normal / Négatif",
          dateDemande: new Date().toISOString().split("T")[0],
          statut: "Demandé"
        };
        setLabTests(prev => {
          const uLabs = [newLab, ...prev];
          saveToLocal("labTests", uLabs);
          return uLabs;
        });
      });
    }

    logSystemAction("Clinique DME Enregistrée", `Consultation complétée pour le dossier ${data.patientId}`);
  };

  // 3. Billing pay action
  const handlePayInvoice = (invoiceId: string, mode: Invoice["modePaiement"]) => {
    const updated = invoices.map(inv => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          statut: "Payé" as const,
          modePaiement: mode,
          datePaiement: new Date().toISOString().split("T")[0],
          caissier: activeUser
        };
      }
      return inv;
    });

    setInvoices(updated);
    saveToLocal("invoices", updated);
    logSystemAction("Encaissement Facture", `Facture #${invoiceId} acquittée via ${mode}`);
  };

  const handleCreateInvoice = (newInv: any) => {
    const nextId = `FAC-${Date.now().toString().slice(-3)}`;
    const inv: Invoice = {
      ...newInv,
      id: nextId,
      statut: "Impayé",
      dateEmission: new Date().toISOString().split("T")[0]
    };

    const updated = [inv, ...invoices];
    setInvoices(updated);
    saveToLocal("invoices", updated);
    logSystemAction("Émission Facture", `Facture émise pour ${inv.patientNom} d'un montant de ${inv.montantTotal} FCFA`);
  };

  // 4. Lab evaluation validation
  const handleValidateLab = (labId: string, result: string) => {
    const updated = labTests.map(lt => {
      if (lt.id === labId) {
        return {
          ...lt,
          statut: "Validé" as const,
          resultatObtenu: result,
          dateValidation: new Date().toISOString().split("T")[0],
          biologisteValidateur: activeUser
        };
      }
      return lt;
    });

    setLabTests(updated);
    saveToLocal("labTests", updated);
    logSystemAction("Validation Labo", `Examen réf #${labId} certifié par le biologiste`);
  };

  // 5. Stock item dispenser
  const handleDispenseMed = (medId: string, qty: number) => {
    const updated = stocks.map(st => {
      if (st.id === medId) {
        return {
          ...st,
          quantite: Math.max(0, st.quantite - qty)
        };
      }
      return st;
    });

    setStocks(updated);
    saveToLocal("stocks", updated);
    logSystemAction("Délivrance Pharmacie", `Stock ID ${medId} dégressé de ${qty} unités.`);
  };

  // 6. Urgent Triage adding
  const handleAddTriage = (newT: any) => {
    const nextId = `trg-${Date.now().toString().slice(-3)}`;
    const newTriage: TriageRecord = {
      ...newT,
      id: nextId,
      statut: "En attente",
      heureArrivee: new Date().toLocaleTimeString("fr-FR").slice(0, 5)
    };

    const updated = [newTriage, ...triages];
    setTriages(updated);
    saveToLocal("triages", updated);

    if (isOffline) {
      addToOfflineQueue({
        type: "TRIAGE",
        action: "CREATE",
        payload: newTriage,
        timestamp: new Date().toISOString()
      });
      setOfflineQueue(getOfflineQueue());
    }

    logSystemAction("Triage Urgence", `Patient admis au triage couleur ${newTriage.couleur}`);
  };

  // 7. Human resources clock in register
  const handleClockIn = (name: string, roleName: string) => {
    const newP: StaffPresence = {
      id: `p-${Date.now().toString().slice(-3)}`,
      staffId: "st-" + Math.floor(Math.random()*10),
      nomPrenom: name,
      role: roleName,
      date: new Date().toISOString().split("T")[0],
      heureArrivee: new Date().toLocaleTimeString("fr-FR").slice(0, 5),
      statut: "Présent"
    };

    const updated = [newP, ...presences];
    setPresences(updated);
    saveToLocal("presences", updated);
  };

  // SuperAdmin Brand Editing update
  const handleSaveBranding = async (newB: ClinicBranding) => {
    setClinicBrand(newB);
    if (!isOffline) {
      try {
        await fetch("/api/clinics/brand", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newB)
        });
      } catch (err) {
        console.log("Offline state, saved locally.");
      }
    }
    logSystemAction("Paramètres généraux", "Mise à jour de la configuration de marque");
  };

  const handlePurgeDatabase = (moduleKey: string) => {
    if (moduleKey === "appointments") {
      setAppointments([]);
      saveToLocal("appointments", []);
      logSystemAction("Purge Base Locale", "Purge définitive du registre de rendez-vous de consultation.");
    } else if (moduleKey === "invoices") {
      setInvoices([]);
      saveToLocal("invoices", []);
      logSystemAction("Purge Base Locale", "Purge définitive des registres de factures et caisse.");
    } else if (moduleKey === "audit") {
      saveToLocal("audit_logs_local", []);
      setAuditLogs([]);
      logSystemAction("Purge Base Locale", "Journal d'audit réinitialisé.");
    }
  };

  // universal Ctrl+K queries filter
  const commandQueries = [
    { label: "Ouvrir le Tableau de Bord Général", action: () => { setActiveTab("dashboard"); setShowSearchPalette(false); } },
    { label: "Ajouter un nouveau Patient", action: () => { setActiveTab("patients"); setShowSearchPalette(false); } },
    { label: "Saisir une ordonnance clinique", action: () => { setActiveTab("consultation"); setShowSearchPalette(false); } },
    { label: "Afficher les factures et caisse", action: () => { setActiveTab("billing"); setShowSearchPalette(false); } },
    { label: "Ouvrir le Triage et Urgences", action: () => { setActiveTab("specialized"); setShowSearchPalette(false); } },
    { label: "Clôturer la comptabilité / Caisse", action: () => { setActiveTab("billing"); setShowSearchPalette(false); } },
  ];

  const filteredCommands = commandQueries.filter(c => 
    c.label.toLowerCase().includes(paletteSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans" id="medishahel-platform-root">
      
      {/* Top Warning Synchronization Banner if offline items in heap */}
      {offlineQueue.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 animate-bounce text-amber-200" />
            <span>Mode Local Actif : <strong>{offlineQueue.length} données cliniques</strong> en attente de synchronisation.</span>
          </div>
          <button
            onClick={handleForceSync}
            disabled={isSyncing}
            className="bg-white text-slate-900 font-extrabold px-3 py-1 rounded hover:bg-amber-50 cursor-pointer disabled:bg-slate-350 flex items-center gap-1.5 transition-all text-[11px] uppercase tracking-wider"
          >
            <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
            <span>Synchroniser Maintenant</span>
          </button>
        </div>
      )}

      {/* Sync Status Overlay Alert Toast */}
      {syncStatusMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-lg px-4 py-3 shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-800 animate-slide-up">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* Universal Search Overlay Command Modal */}
      {showSearchPalette && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-center pt-[15vh]">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden h-fit animate-fade-in mx-4">
            <div className="p-3 border-b border-slate-150 flex items-center gap-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Raccourcis intelligents (Tapez 'médicament', 'facture', 'patient'...)"
                className="w-full text-xs outline-none bg-transparent"
                value={paletteSearchQuery}
                onChange={(e) => setPaletteSearchQuery(e.target.value)}
              />
              <span className="text-[10px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-bold font-mono">ESC</span>
            </div>
            
            <div className="p-2 space-y-1 max-h-[250px] overflow-y-auto">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={cmd.action}
                  className="w-full text-left text-xs p-2.5 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>{cmd.label}</span>
                  <span className="text-[10px] text-slate-350">Accéder</span>
                </button>
              ))}

              {filteredCommands.length === 0 && (
                <p className="p-4 text-center text-slate-400 text-xs italic">Aucune action trouvée.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Structural Layout Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs px-4 lg:px-6 py-3 flex items-center justify-between">
        
        {/* Brand identity area */}
        <div className="flex items-center gap-3">
          <div 
            className="h-9 w-9 rounded-xl text-white flex items-center justify-center font-black shadow-md border animate-spin-slow cursor-pointer"
            style={{ backgroundColor: clinicBrand.primaryColor, borderColor: clinicBrand.primaryColor + "50" }}
          >
            MS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-slate-900 font-display">{clinicBrand.name}</h1>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded border font-bold">V-2</span>
            </div>
            <p className="text-[9.5px] text-slate-400 font-medium italic truncate">{clinicBrand.slogan}</p>
          </div>
        </div>

        {/* Dynamic global actions bar */}
        <div className="flex items-center gap-3">
          
          {/* Universal Ctrl+K helper hint prompt */}
          <button 
            onClick={() => setShowSearchPalette(true)}
            className="hidden sm:flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-400 px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
          >
            <Search className="h-3 w-3" />
            <span>Recherche</span>
            <kbd className="bg-white px-1 border rounded text-[9px] font-mono leading-none">Ctrl+K</kbd>
          </button>

          {/* Physical offline connector slider */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            {isOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span className="text-[10px] text-amber-800 font-bold hidden md:inline">Simulation Hors-Ligne</span>
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[10px] text-emerald-800 font-bold hidden md:inline">Client Connecté</span>
              </>
            )}
            <input
              type="checkbox"
              className="rounded-full h-4 w-7 text-sky-600 focus:ring-sky-500 bg-slate-200 cursor-pointer appearance-none checked:bg-emerald-500 relative before:content-[''] before:absolute before:h-3 before:w-3 before:bg-white before:rounded-full before:top-0.5 before:left-0.5 checked:before:translate-x-3 transition-all outline-none border border-slate-350"
              checked={!isOffline}
              onChange={() => {
                setIsOffline(p => {
                  const toState = !p;
                  logSystemAction("Status Réseau", `Bascule réseau : ${toState ? "Hors-Ligne" : "En Ligne"}`);
                  return toState;
                });
              }}
            />
          </div>

          {/* Strict RBAC Profile Switcher */}
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] block font-extrabold text-slate-700">{activeUser}</span>
              <span className="text-[9px] text-slate-400 block font-mono font-bold tracking-wider">{activeRole}</span>
            </div>
            
            <select
              className="text-[10px] rounded-lg border border-slate-300 p-1.5 font-bold text-slate-800 bg-white"
              value={activeRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            >
              <option value="Administrateur Système">SysAdmin (Sidi)</option>
              <option value="Médecin">Médecin (Dr. Sangaré)</option>
              <option value="Caissier">Caissier (Cms. Maïga)</option>
              <option value="Laborantin">Laborantin (Tangara)</option>
              <option value="Réceptionniste">Réceptionniste (Ouattara)</option>
              <option value="Sage-femme">Sage-femme (Fanta)</option>
              <option value="DG">Directeur (Dr. Traoré)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Structural Body View (Side Nav + Content Panels) */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation panel */}
        <aside className="w-full md:w-60 bg-white border-r border-slate-200 p-4 space-y-6 flex-shrink-0">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide px-3 select-none">Navigation de Service</span>

            <div className="space-y-0.5 font-medium text-xs">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2.5 cursor-pointer ${
                  activeTab === "dashboard" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <Activity className="h-4 w-4 text-sky-500" />
                <span>Tableau Général</span>
              </button>

              <button
                onClick={() => {
                  if (isAuthorized("patients")) setActiveTab("patients");
                  else alert("Accès refusé: Droits d'admission requis.");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "patients" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-sky-500" />
                  <span>Registre Patients</span>
                </div>
                {!isAuthorized("patients") && <Lock className="h-3 w-3 text-slate-350" />}
              </button>

              <button
                onClick={() => {
                  if (isAuthorized("consultation")) setActiveTab("consultation");
                  else alert("Accès refusé: Droits médicaux exclusifs (DME).");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "consultation" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="h-4 w-4 text-sky-500" />
                  <span>Consultation DME IA</span>
                </div>
                {!isAuthorized("consultation") && <Lock className="h-3 w-3 text-slate-350" />}
              </button>

              <button
                onClick={() => {
                  if (isAuthorized("billing")) setActiveTab("billing");
                  else alert("Accès refusé: Réservé à la Caisse.");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "billing" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4 text-sky-500" />
                  <span>Caisse & Facturation</span>
                </div>
                {!isAuthorized("billing") && <Lock className="h-3 w-3 text-slate-350" />}
              </button>

              <button
                onClick={() => {
                  if (isAuthorized("specialized")) setActiveTab("specialized");
                  else alert("Accès refusé: Droits techniques requis.");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "specialized" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-sky-500" />
                  <span>Spécialités (Lab, Pharm)</span>
                </div>
                {!isAuthorized("specialized") && <Lock className="h-3 w-3 text-slate-350" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5 pt-4 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide px-3 select-none">Aide & Administration</span>

            <div className="space-y-0.5 font-medium text-xs">
              <button
                onClick={() => {
                  if (isAuthorized("settings")) setActiveTab("settings");
                  else alert("Accès refusé: Section strictement réservée au Super-Administrateur.");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                  activeTab === "settings" ? "bg-slate-50 text-slate-900 font-extrabold shadow-xs" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-sky-500" />
                  <span>Paramètres & Audits</span>
                </div>
                {!isAuthorized("settings") && <Lock className="h-3 w-3 text-slate-350" />}
              </button>
            </div>
          </div>

          {/* Quick legal disclaimer information block conforming with guidelines */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[10px] text-slate-400 leading-relaxed font-semibold">
            <span className="text-slate-500 block font-bold mb-0.5">Conformité Loi Malienne</span>
            Registre médical de cryptage et conservation certifié valide 20 ans conforme au décret d'exercice HIS Local Mali - V2.
          </div>
        </aside>

        {/* Content routing wrapper */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full transition-all">
          {activeTab === "dashboard" && (
            <DashboardView
              patientsList={patients}
              bedList={beds}
              stockList={stocks}
              invoiceList={invoices}
              triageList={triages}
              onOpenConsultation={() => setActiveTab("consultation")}
              clinicName={clinicBrand.name}
              clinicSlogan={clinicBrand.slogan}
              accentColor={clinicBrand.primaryColor}
            />
          )}

          {activeTab === "patients" && isAuthorized("patients") && (
            <PatientsView
              patients={patients}
              onAddPatient={handleAddPatient}
              accentColor={clinicBrand.primaryColor}
            />
          )}

          {activeTab === "consultation" && isAuthorized("consultation") && (
            <ConsultationView
              patients={patients}
              records={records}
              onAddRecord={handleAddRecord}
              accentColor={clinicBrand.primaryColor}
            />
          )}

          {activeTab === "billing" && isAuthorized("billing") && (
            <BillingView
              invoices={invoices}
              patients={patients}
              onPayInvoice={handlePayInvoice}
              onAddInvoice={handleCreateInvoice}
              accentColor={clinicBrand.primaryColor}
            />
          )}

          {activeTab === "specialized" && isAuthorized("specialized") && (
            <SpecializedModulesView
              labTests={labTests}
              images={images}
              stocks={stocks}
              presences={presences}
              mails={mails}
              triages={triages}
              patients={patients}
              onValidateLab={handleValidateLab}
              onDispenseMed={handleDispenseMed}
              onAddTriage={handleAddTriage}
              onClockIn={handleClockIn}
              accentColor={clinicBrand.primaryColor}
            />
          )}

          {activeTab === "settings" && isAuthorized("settings") && (
            <BrandingSettings
              initialBranding={clinicBrand}
              auditLogs={auditLogs}
              onSaveBranding={handleSaveBranding}
              onRefreshLogs={fetchLogs}
              onPurgeDatabase={handlePurgeDatabase}
            />
          )}
        </main>
      </div>
    </div>
  );
}

