import React, { useState, useEffect } from "react";
import { User, Clinic, Patient } from "./types.ts";
import { Header } from "./components/Header.tsx";
import { PatientManager } from "./components/PatientManager.tsx";
import { MedicalRecordsDME } from "./components/MedicalRecordsDME.tsx";
import { HospitalizationTracker } from "./components/HospitalizationTracker.tsx";
import { BillingsAndCashier } from "./components/BillingsAndCashier.tsx";
import { PharmacyStock } from "./components/PharmacyStock.tsx";
import { LabStation } from "./components/LabStation.tsx";
import { HRRoster } from "./components/HRRoster.tsx";
import { PresencesManager } from "./components/PresencesManager.tsx";
import { PayrollsManager } from "./components/PayrollsManager.tsx";
import { AppointmentsCalendar } from "./components/AppointmentsCalendar.tsx";
import { DocumentManager } from "./components/DocumentManager.tsx";
import { AuditTrail } from "./components/AuditTrail.tsx";
import { ClinicBranding } from "./components/ClinicBranding.tsx";
import { UserCredentials } from "./components/UserCredentials.tsx";
import { ChangePasswordModal } from "./components/ChangePasswordModal.tsx";
import { DmgModuleView } from "./components/DmgModuleView.tsx";
import { NursingModuleView } from "./components/NursingModuleView.tsx";
import { ClinicalAdministration } from "./components/ClinicalAdministration.tsx";
import EmailManager from "./components/EmailManager.tsx";
import DashboardView from "./components/DashboardView.tsx";
import EspacePromoteurDG from "./components/EspacePromoteurDG.tsx";
import { 
  Heart, Bed, HandCoins, Pill, FlaskConical, Users, Calendar, 
  FolderGit, Shield, Settings, ShieldCheck, Mail, Key, Activity, ShieldAlert,
  Stethoscope, Clock, ClipboardList, Banknote, Building, ShoppingCart, Layers,
  Check, AlertCircle, LineChart, TrendingUp
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("medisahel_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Attendances checkpoint states
  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [modalClock, setModalClock] = useState("");
  
  // Custom multi-clinic list and active clinic configuration
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [activeClinic, setActiveClinic] = useState<Clinic | null>(null);
  
  // Shared global patients cached state
  const [patients, setPatients] = useState<Patient[]>([]);

  // Selected patient for DME sub-view
  const [selectedDmePatient, setSelectedDmePatient] = useState<Patient | null>(null);

  // Active navigation tab defaulting to central clinical dashboard
  const [activeTab, setActiveTab] = useState("dashboard");

  // Professional Dark mode state with persistence support
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem("medisahel_theme") === "dark");

  // Dashboard active stats state variables
  const [dashboardBeds, setDashboardBeds] = useState<any[]>([]);
  const [dashboardStock, setDashboardStock] = useState<any[]>([]);
  const [dashboardInvoices, setDashboardInvoices] = useState<any[]>([]);
  const [dashboardTriages, setDashboardTriages] = useState<any[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // System functional module states configuration (Point 11 - activation/désactivation persisté)
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem("medisahel_module_states");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      patients: true,
      dme: true,
      hospitalization: true,
      dmg: true,
      billing: true,
      pharmacy_sales: true,
      pharmacy_stock: true,
      lab: true,
      presences: true,
      payroll: true,
      appointments: true,
      documents: true,
      emailing: true
    };
  });

  // Redirect to first allowed module if selected module is unauthorized (RBAC Security)
  useEffect(() => {
    if (currentUser) {
      const isAdmin = currentUser.role === "ADMIN" || (currentUser.permissions && currentUser.permissions.includes("*:ADMIN"));
      if (isAdmin) return;

      if (activeTab === "dashboard") return;

      const allowedKeys = currentUser.allowedModules || [];
      if (allowedKeys.length > 0 && !allowedKeys.includes(activeTab)) {
        const firstAllowed = ["patients", "dme", "hospitalization", "dmg", "billing", "pharmacy_sales", "pharmacy_stock", "lab", "presences", "payroll", "appointments", "documents", "emailing"].find(key => allowedKeys.includes(key));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
        }
      }
    }
  }, [activeTab, currentUser]);

  // Virtual workspaces / tabs state manager (Requirement 2)
  const [virtualTabs, setVirtualTabs] = useState<any[]>([
    { id: "dashboard", label: "Tableau de Bord Principal", tabType: "dashboard" }
  ]);
  const [activeVirtualTabId, setActiveVirtualTabId] = useState("dashboard");
  const [autoSaveToast, setAutoSaveToast] = useState(false);
  const [isDoubleScreenMode, setIsDoubleScreenMode] = useState(false);
  const [secondaryTabId, setSecondaryTabId] = useState("patients");

  // Retractable sidebar, Bookmarks / Favorites, and Visited History States (Requirement 2 & 3)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("medisahel_sidebar_collapsed") === "true";
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("medisahel_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [recentHistory, setRecentHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("medisahel_recent_history");
      return saved ? JSON.parse(saved) : ["dashboard"];
    } catch {
      return ["dashboard"];
    }
  });

  // Track dynamic changes of activeTab to feed our History index
  useEffect(() => {
    if (!activeTab) return;
    setRecentHistory(prev => {
      const filtered = prev.filter(x => x !== activeTab);
      const updated = [activeTab, ...filtered].slice(0, 5); // Peak at 5 items max
      localStorage.setItem("medisahel_recent_history", JSON.stringify(updated));
      return updated;
    });
  }, [activeTab]);

  // Persist favorites when changed
  useEffect(() => {
    localStorage.setItem("medisahel_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("medisahel_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  const toggleFavorite = (moduleId: string) => {
    setFavorites(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(id => id !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  // Real-time server push / synchronization simulation state (Requirement 3)
  const [liveToasts, setLiveToasts] = useState<string[]>([]);
  const triggerToast = (text: string) => {
    setLiveToasts(prev => [...prev.slice(-3), text]);
  };
  const [toastHistory, setToastHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("medisahel_toast_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronize toastHistory to localStorage
  useEffect(() => {
    localStorage.setItem("medisahel_toast_history", JSON.stringify(toastHistory));
  }, [toastHistory]);

  // Automatically feed dynamic toasts to the persistent clinical log, and auto-dismiss active popups after 6s (Point 5)
  useEffect(() => {
    if (liveToasts.length > 0) {
      const latest = liveToasts[liveToasts.length - 1];
      setToastHistory(prev => {
        if (prev.includes(latest)) return prev;
        return [latest, ...prev].slice(0, 40); // cap history at 40 alerts
      });

      // Beautiful Auto-Close after 6 seconds
      const dismissTimer = setTimeout(() => {
        setLiveToasts(prev => prev.filter(t => t !== latest));
      }, 6000);
      return () => clearTimeout(dismissTimer);
    }
  }, [liveToasts]);

  // Auto-save logic triggers every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      setAutoSaveToast(true);
      setTimeout(() => setAutoSaveToast(false), 4000);
    }, 30000);

    return () => clearInterval(autoSaveInterval);
  }, []);

  // Multi-onglets state synchronization using storage events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes("medishahel") || e.key.includes("dmg") || e.key.includes("queue") || e.key.includes("transactions"))) {
        triggerToast("🔄 [Multi-onglets] Données d'activité clinique synchronisées !");
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Realtime Simulation loop (push notifications)
  useEffect(() => {
    const events = [
      "🔬 Laboratoire : Validé résultat d'hématologie pour Diarra Amadou.",
      "💊 Pharmacie : Stock de Paracétamol Injectable mis à jour (+500 flacons).",
      "💰 Caisse : Nouvelle transaction FAC-2026-1051 encaissée (45 000 FCFA).",
      "🛏️ Hospitalisation : Lit B Libéré en Chambre 402.",
      "📋 Médecine Générale : Dr. Ibrahim Touré a mis à jour le dossier DME-849.",
      "📨 GECD : Courrier officiel d'admission de la CNAM enregistré dans l'archive.",
      "👥 Présences : Prise de poste validée pour Fatoumata Diarra (Infirmière)."
    ];

    const interval = setInterval(() => {
      const idx = Math.floor(Math.random() * events.length);
      const newLive = events[idx];
      setLiveToasts(prev => [...prev.slice(-2), newLive]); // Keep max 3
    }, 35000); // every 35s

    return () => clearInterval(interval);
  }, []);

  const spawnVirtualTab = (tabId: string, label: string) => {
    if (!virtualTabs.some(t => t.id === tabId)) {
      setVirtualTabs([...virtualTabs, { id: tabId, label, tabType: tabId }]);
    }
    setActiveVirtualTabId(tabId);
    setActiveTab(tabId);
  };

  const closeVirtualTab = (tabId: string) => {
    if (tabId === "dashboard") return;
    
    // Warning before closing if changes are in progress
    const proceed = window.confirm("Une modification est en cours sur vos formulaires. Voulez-vous enregistrer avant de quitter l'onglet ?");
    if (!proceed) return;

    const filtered = virtualTabs.filter(t => t.id !== tabId);
    setVirtualTabs(filtered);
    if (activeVirtualTabId === tabId) {
      const fallback = filtered[filtered.length - 1];
      setActiveVirtualTabId(fallback.id);
      setActiveTab(fallback.tabType);
    }
  };

  // Login inputs
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Verification helper for current session
  const fetchSession = async (activeToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const fetchClinics = async () => {
    try {
      const resp = await fetch("/api/clinics");
      const list = await resp.json();
      setClinics(list);
      // Find default active clinic or make Bamako (clinic-1) the default active branding
      const defaultClinic = list.find((c: Clinic) => c.id === "clinic-1") || list[0];
      setActiveClinic(defaultClinic);
    } catch (err) {
      console.error("Impossible de charger les brandings cliniques", err);
    }
  };

  const fetchGlobalPatients = async (activeToken: string) => {
    try {
      const response = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (response.ok) {
        const list = await response.json();
        setPatients(list);

        // High-fidelity Multi-window & Multi-tab deep linking state recovery
        const urlParams = new URLSearchParams(window.location.search);
        const pId = urlParams.get("patientId");
        const tabParam = urlParams.get("tab");
        if (pId) {
          const patientFound = list.find((p: any) => p.id === pId);
          if (patientFound) {
            setSelectedDmePatient(patientFound);
            setActiveTab("dme");
          }
        } else if (tabParam) {
          setActiveTab(tabParam);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Synchronise state FROM hash (Requirement 4 & 5 - shareable URL deep links)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "";
      if (!hash) return;

      // Simple modular hashes
      if (hash === "#/dashboard") {
        setActiveTab("dashboard");
        setActiveVirtualTabId("dashboard");
      } else if (hash === "#/patients") {
        setActiveTab("patients");
        setActiveVirtualTabId("patients");
      } else if (hash === "#/pharmacie") {
        setActiveTab("pharmacy_sales");
        setActiveVirtualTabId("pharmacy_sales");
      } else if (hash === "#/laboratoire") {
        setActiveTab("lab");
        setActiveVirtualTabId("lab");
      } else if (hash === "#/hospitalisation") {
        setActiveTab("hospitalization");
        setActiveVirtualTabId("hospitalization");
      } else if (hash === "#/rh") {
        setActiveTab("presences");
        setActiveVirtualTabId("presences");
      } else if (hash === "#/paie") {
        setActiveTab("payroll");
        setActiveVirtualTabId("payroll");
      } else if (hash === "#/espace-dg") {
        setActiveTab("espace_dg");
        setActiveVirtualTabId("espace_dg");
      } else if (hash === "#/surveillance-epidemiologique") {
        setActiveTab("surveillance_epidemio");
        setActiveVirtualTabId("surveillance_epidemio");
      } else if (hash === "#/gouvernance-rbac") {
        setActiveTab("users");
        setActiveVirtualTabId("users");
      }

      // Dynamic path hashes for DME folder: #/patients/P2026-0001
      const patientMatch = hash.match(/^#\/patients\/(.+)$/);
      if (patientMatch && patients.length > 0) {
        const pId = patientMatch[1];
        const found = patients.find(p => p.id === pId || p.nationalId === pId);
        if (found) {
          setSelectedDmePatient(found);
          setActiveTab("dme");
          // Add tab if not already present
          setVirtualTabs(prev => {
            if (!prev.some(t => t.id === "dme")) {
              return [...prev, { id: "dme", label: `Dossier: ${found.lastName.toUpperCase()}`, tabType: "dme" }];
            }
            return prev;
          });
          setActiveVirtualTabId("dme");
        }
      }

      // Consultations (DMG): #/consultations/C...
      if (hash.startsWith("#/consultations")) {
        setActiveTab("dmg");
        setActiveVirtualTabId("dmg");
      }

      // Factures: #/factures/FAC...
      if (hash.startsWith("#/factures")) {
        setActiveTab("billing");
        setActiveVirtualTabId("billing");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Execute immediately if we already have loaded patients
    if (patients.length > 0) {
      handleHashChange();
    }
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [patients]);

  // Synchronise state TO hash (Requirement 4 & 5 - reflect navigation update in Address Bar)
  useEffect(() => {
    if (!currentUser) return; // Wait for session load
    if (activeTab === "dashboard") {
      window.location.hash = "#/dashboard";
    } else if (activeTab === "patients") {
      window.location.hash = "#/patients";
    } else if (activeTab === "pharmacy_sales") {
      window.location.hash = "#/pharmacie";
    } else if (activeTab === "lab") {
      window.location.hash = "#/laboratoire";
    } else if (activeTab === "hospitalization") {
      window.location.hash = "#/hospitalisation";
    } else if (activeTab === "presences") {
      window.location.hash = "#/rh";
    } else if (activeTab === "payroll") {
      window.location.hash = "#/paie";
    } else if (activeTab === "espace_dg") {
      window.location.hash = "#/espace-dg";
    } else if (activeTab === "surveillance_epidemio") {
      window.location.hash = "#/surveillance-epidemiologique";
    } else if (activeTab === "users") {
      window.location.hash = "#/gouvernance-rbac";
    } else if (activeTab === "dme" && selectedDmePatient) {
      window.location.hash = `#/patients/${selectedDmePatient.id}`;
    }
  }, [activeTab, selectedDmePatient, currentUser]);

  const fetchDashboardStats = async (activeToken: string) => {
    try {
      setDashboardLoading(true);
      
      const bedsResponse = await fetch("/api/hospitalization/beds", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (bedsResponse.ok) {
        setDashboardBeds(await bedsResponse.json());
      }
      
      const stockResponse = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (stockResponse.ok) {
        setDashboardStock(await stockResponse.json());
      }

      const invoiceResponse = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (invoiceResponse.ok) {
        setDashboardInvoices(await invoiceResponse.json());
      }

      setDashboardTriages([
        { id: "tr-1", patientNom: "Diarra Amadou", couleur: "Rouge", plaintePrincipale: "Détresse respiratoire, Saturation 84%" },
        { id: "tr-2", patientNom: "Sacko Mariam", couleur: "Orange", plaintePrincipale: "Suspicion fracture fémur avec choc" },
        { id: "tr-3", patientNom: "Keita Souleymane", couleur: "Jaune", plaintePrincipale: "Fièvre isolée 39.5°C persistante" }
      ]);
    } catch (err) {
      console.error("Impossible de charger les KPI du Tableau de bord", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Dark CSS layout activator
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("medisahel_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("medisahel_theme", "light");
    }
  }, [darkMode]);

  // Checks and loads today's checkIn attendance
  const checkDailyAttendance = async (activeToken: string, userId: string) => {
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const rAtt = await fetch("/api/attendances", {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      if (rAtt.ok) {
        const list = await rAtt.json();
        const found = list.find((a: any) => a.userId === userId && a.date === todayStr);
        if (found) {
          setTodayAttendance(found);
          setShowCheckInModal(false);
        } else {
          setTodayAttendance(null);
          setShowCheckInModal(true); // Mandatory block!
        }
      }
    } catch (e) {
      console.error("Erreur de récupération des pointages", e);
    }
  };

  const getDepartmentStartHour = () => {
    if (!currentUser) return "08:00";
    const dep = currentUser.department || "Médecine Générale";
    try {
      const saved = localStorage.getItem("medisahel_department_hours");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[dep]) return parsed[dep].start;
      }
    } catch {}
    return "08:00";
  };

  const checkIsLate = () => {
    if (!modalClock) return false;
    const [currH, currM] = modalClock.split(":").map(Number);
    const startHourStr = getDepartmentStartHour();
    const [startH, startM] = startHourStr.split(":").map(Number);
    
    const tolerance = (() => {
      try {
        const saved = localStorage.getItem("medisahel_tolerance_minutes");
        return saved ? parseInt(saved, 10) : 15;
      } catch { return 15; }
    })();

    const currentTotalMinutes = currH * 60 + currM;
    const limitTotalMinutes = startH * 60 + startM + tolerance;
    return currentTotalMinutes > limitTotalMinutes;
  };

  useEffect(() => {
    if (token && currentUser) {
      checkDailyAttendance(token, currentUser.id);
    } else {
      setTodayAttendance(null);
      setShowCheckInModal(false);
      setShowCheckOutModal(false);
    }
  }, [token, currentUser]);

  // Clock synchronizer for modals
  useEffect(() => {
    if (showCheckInModal || showCheckOutModal) {
      const updateClock = () => {
        const d = new Date();
        const h = d.getHours().toString().padStart(2, "0");
        const m = d.getMinutes().toString().padStart(2, "0");
        const s = d.getSeconds().toString().padStart(2, "0");
        setModalClock(`${h}:${m}:${s}`);
      };
      updateClock();
      const interval = setInterval(updateClock, 1000);
      return () => clearInterval(interval);
    }
  }, [showCheckInModal, showCheckOutModal]);

  const handleArrivalCheckInSubmit = async (selectedReason: string, uploadedDocName: string) => {
    if (!token || !currentUser) return;
    
    const isLate = checkIsLate();
    const todayStr = new Date().toISOString().split("T")[0];
    const timeNow = modalClock ? modalClock.slice(0, 5) : "08:00"; // "HH:MM"

    // Construct final reason
    let finalReason = "";
    if (isLate) {
      finalReason = selectedReason || "Retard signalé";
      if (uploadedDocName) {
        finalReason = `[Justificatif: ${uploadedDocName}] - ${finalReason}`;
      }
    }

    try {
      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: currentUser.id,
          date: todayStr,
          checkIn: timeNow,
          checkOut: null,
          status: isLate ? "LATE" : "PRESENT",
          reason: finalReason
        })
      });

      if (response.ok) {
        const created = await response.json();
        setTodayAttendance(created);
        setShowCheckInModal(false);
        triggerToast("✓ Pointage d'arrivée enregistré automatiquement !");
      }
    } catch (e) {
      console.error(e);
      triggerToast("❌ Erreur pendant le pointage d'arrivée.");
    }
  };

  const handleDepartureCheckOutSubmit = async () => {
    if (!token || !currentUser || !todayAttendance) return;

    const timeNow = modalClock ? modalClock.slice(0, 5) : "16:00"; // "HH:MM"

    try {
      const response = await fetch(`/api/attendances/${todayAttendance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...todayAttendance,
          checkOut: timeNow
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setTodayAttendance(updated);
        setShowCheckOutModal(false);
        triggerToast("🚪 Pointage de départ validé. Bon repos !");
      }
    } catch (e) {
      console.error(e);
      triggerToast("❌ Erreur de sauvegarde du départ.");
    }
  };

  useEffect(() => {
    fetchClinics();
    if (token) {
      fetchSession(token);
      fetchGlobalPatients(token);
      fetchDashboardStats(token);
    }
  }, [token]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Identifiants incorrects.");
      }

      localStorage.setItem("medisahel_token", data.token);
      setToken(data.token);
      setCurrentUser(data.user);
      fetchGlobalPatients(data.token);
      fetchDashboardStats(data.token);
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };



  const handleLogout = () => {
    localStorage.removeItem("medisahel_token");
    setToken(null);
    setCurrentUser(null);
    setSelectedDmePatient(null);
    setActiveTab("patients");
  };

  const handlePasswordChanged = (newToken: string, updatedUser: any) => {
    localStorage.setItem("medisahel_token", newToken);
    setToken(newToken);
    setCurrentUser(updatedUser);
  };

  // Safe callback when clinical branding gets modified in parameters
  const handleClinicBrandingUpdate = (updated: Clinic) => {
    setActiveClinic(updated);
    fetchClinics(); // refresh dropdown list too
  };

  // Modules array with RBAC filters - separated patients/DME and presences/payroll (Point 9 & 10)
  const modules = [
    { id: "dashboard", label: "Tableau de Bord", icon: Activity },
    { id: "patients", label: "Gestion des Patients", icon: Heart },
    { id: "dme", label: "Dossier Médical (DME)", icon: ClipboardList },
    { id: "hospitalization", label: "Hospitalisation", icon: Bed },
    { id: "dmg", label: "Médecine Générale (DMG)", icon: Stethoscope },
    { id: "nursing", label: "Unité de Soins (Infirmier)", icon: ShieldAlert },
    { id: "billing", label: "Facturation & Caisse", icon: HandCoins },
    { id: "pharmacy_sales", label: "Vente Pharmacie", icon: ShoppingCart },
    { id: "pharmacy_stock", label: "Gestion des Stocks", icon: Layers },
    { id: "lab", label: "Laboratoire", icon: FlaskConical },
    { id: "presences", label: "Gestion des Présences", icon: Clock },
    { id: "payroll", label: "Gestion de la Paie", icon: Banknote },
    { id: "appointments", label: "Agenda", icon: Calendar },
    { id: "documents", label: "GECD Archive", icon: FolderGit },
    { id: "emailing", label: "Communication & Emailing", icon: Mail },
    { id: "clinical-admin", label: "Administration Clinique", icon: Building, adminOrDoctorChiefOnly: true },
    { id: "users", label: "Gouvernance & Sécurité", icon: Shield, adminOnly: true },
    { id: "espace_dg", label: "Espace Promoteur / DG", icon: LineChart, superRolesOnly: true },
    { id: "surveillance_epidemio", label: "Surveillance Épidémiologique", icon: TrendingUp, superRolesOnly: true },
    { id: "branding", label: "Branding", icon: Settings, adminOnly: true },
    { id: "audit", label: "Audit Trail", icon: ShieldCheck, adminOnly: true }
  ];

  // Filter modules based strictly on their presence in the user's explicit allowedModules list!
  const allowedModules = modules.filter(mod => {
    if (!currentUser) return false;

    // Admin, Promoteur, and DG always get all modules, bypassing the checks
    const isSuperUser = ["ADMIN", "PROMOTEUR", "DG"].includes(currentUser.role) || (currentUser.permissions && currentUser.permissions.includes("*:ADMIN"));
    if (isSuperUser) {
      if (mod.id in moduleStates && !moduleStates[mod.id]) {
        return false;
      }
      return true;
    }

    // Hide superRolesOnly modules for non-superusers immediately
    if (mod.superRolesOnly) {
      return false;
    }

    // Dashboard is always visible to all authenticated users
    if (mod.id === "dashboard") {
      return true;
    }
    
    const allowedKeys = currentUser.allowedModules || [];
    if (!allowedKeys.includes(mod.id)) {
      return false;
    }
    
    // Hide disabled modules
    if (mod.id in moduleStates && !moduleStates[mod.id]) {
      return false;
    }
    return true;
  });

  // Login View render
  if (!token || !currentUser || !activeClinic) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden" id="login-screen-outer">
        {/* Aesthetic background flares */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[130px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[130px]" />

        {/* Central Core Login Form */}
        <div className="bg-slate-950/80 backdrop-blur-xl max-w-lg w-full rounded-3xl border border-slate-800/60 shadow-2xl p-8 space-y-6 relative z-10" id="login-panel">
          <div className="text-center space-y-2">
            <div 
              className="h-14 w-14 rounded-2xl text-white flex items-center justify-center shadow-lg mx-auto"
              style={{ backgroundColor: activeClinic?.themeColor || "#0f766e" }}
            >
              <Activity className="h-7 w-7" />
            </div>
            
            <h1 className="font-sans font-black text-2xl text-white tracking-tight mt-3">
              {activeClinic?.name}
            </h1>
            <p className="text-xs text-slate-400 font-sans tracking-wide">
              {activeClinic?.address || "Système ERP Intégré d'Administration Hospitalière"}
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center leading-relaxed">
                <ShieldAlert className="h-4 w-4 mr-2 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1.5">Identifiant E-mail Hospitalier</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 focus:border-teal-500 text-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                  placeholder="e.g. admin@medisahel.ml"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1.5">Clé Hospitalière Sécurisée</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-slate-900/60 border border-slate-800 focus:border-teal-500 text-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 text-center text-white bg-teal-700 hover:bg-teal-800 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-150 cursor-pointer shadow-lg"
              id="login-btn"
            >
              {loginLoading ? "Établissement de la session..." : "S'authentifier sur la clinique"}
            </button>
          </form>
        </div>

        {/* Support & IT Assistance Footer - Permanent & Discreet */}
        <div className="mt-6 text-center text-[10.5px] text-slate-400 space-y-1 bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-slate-800/40 max-w-lg w-full font-sans shadow-lg relative z-10" id="adama-support-it-footer">
          <p className="font-extrabold text-slate-300 tracking-wider text-[10px] uppercase">Assistance Technique & Support IT</p>
          <p className="font-bold text-slate-200 mt-1">Adama SANGARÉ</p>
          <p className="text-slate-400 font-medium">Consultant en Solutions Numériques et Formateur Support IT</p>
          <p className="font-bold text-teal-450 uppercase tracking-wide text-[9px]">MIT – Micro Informatique & Télécom</p>
          <p className="text-slate-300 text-[10.5px] mt-1.5 font-medium">
            Téléphone / WhatsApp : <span className="font-bold text-teal-300">+223 73 65 14 67</span>
          </p>
        </div>
      </div>
    );
  }

  // FORCE MANDATORY PASSWORD UPDATE BLOCK (enforcing complete compliance)
  const isAdmin = currentUser.role === "ADMIN" || currentUser.login === "admin" || (currentUser.permissions && currentUser.permissions.includes("*:ADMIN"));
  if (currentUser.mustChangePassword && !isAdmin) {
    return <ChangePasswordModal token={token} onSuccess={handlePasswordChanged} />;
  }

  const renderModuleContent = (targetTab: string) => {
    switch (targetTab) {
      case "dashboard":
        return (
          <DashboardView 
            patientsList={patients}
            bedList={dashboardBeds}
            stockList={dashboardStock}
            invoiceList={dashboardInvoices}
            triageList={dashboardTriages}
            onOpenConsultation={() => spawnVirtualTab("dmg", "Consultations (DMG)")}
            clinicName={activeClinic.name}
            clinicSlogan={activeClinic.logoUrl || "MédiSahel Enterprise - Système Intelligent Hospitalier"}
            accentColor={activeClinic.themeColor}
            onTabRedirect={(tabId, label) => spawnVirtualTab(tabId, label)}
          />
        );
      case "patients":
        return (
          <PatientManager 
            token={token} 
            clinic={activeClinic}
            currentUser={currentUser}
          />
        );
      case "dme":
        return selectedDmePatient ? (
          <MedicalRecordsDME 
            token={token} 
            patient={selectedDmePatient} 
            onBack={() => {
              setSelectedDmePatient(null);
              fetchGlobalPatients(token);
            }}
            userRole={currentUser.role}
            clinic={activeClinic}
            currentUser={currentUser}
          />
        ) : (
          <PatientManager 
            token={token} 
            onSelectPatient={(p) => setSelectedDmePatient(p)} 
            clinic={activeClinic}
            currentUser={currentUser}
          />
        );
      case "hospitalization":
        return (
          <HospitalizationTracker 
            token={token} 
            patients={patients} 
            userRole={currentUser.role} 
            currentUser={currentUser}
          />
        );
      case "dmg":
        return (
          <DmgModuleView
            token={token}
            patients={patients}
            currentUser={currentUser}
            clinicThemeColor={activeClinic.themeColor}
          />
        );
      case "nursing":
        return (
          <NursingModuleView
            token={token}
            patients={patients}
            currentUser={currentUser}
            clinicThemeColor={activeClinic.themeColor}
          />
        );
      case "billing":
        return (
          <BillingsAndCashier 
            token={token} 
            patients={patients} 
            userRole={currentUser.role} 
            clinic={activeClinic}
            currentUser={currentUser}
          />
        );
      case "pharmacy_sales":
        return (
          <PharmacyStock 
            token={token} 
            userRole={currentUser!.role} 
            moduleMode="sales"
            currentUser={currentUser}
          />
        );
      case "pharmacy_stock":
        return (
          <PharmacyStock 
            token={token} 
            userRole={currentUser!.role} 
            moduleMode="stock"
            currentUser={currentUser}
          />
        );
      case "lab":
        return (
          <LabStation 
            token={token} 
            patients={patients} 
            userRole={currentUser.role} 
          />
        );
      case "presences":
        return (
          <PresencesManager 
            token={token} 
            currentUser={currentUser}
            clinicThemeColor={activeClinic.themeColor} 
          />
        );
      case "payroll":
        return (
          <PayrollsManager 
            token={token} 
            currentUser={currentUser}
            clinicThemeColor={activeClinic.themeColor} 
          />
        );
      case "appointments":
        return (
          <AppointmentsCalendar 
            token={token} 
            patients={patients} 
            userRole={currentUser.role} 
          />
        );
      case "documents":
        return (
          <DocumentManager 
            token={token} 
            userRole={currentUser.role} 
            clinic={activeClinic}
            currentUser={currentUser}
          />
        );
      case "emailing":
        return (
          <EmailManager 
            token={token} 
            clinic={activeClinic} 
            currentUser={currentUser}
          />
        );
      case "clinical-admin":
        return (
          <ClinicalAdministration 
            token={token} 
            currentUser={currentUser}
            onSelectPatientDme={(p) => {
              setSelectedDmePatient(p);
              spawnVirtualTab("dme", `Dossier: ${p.lastName.toUpperCase()}`);
            }}
            clinic={activeClinic}
          />
        );
      case "users":
        return (
          <UserCredentials 
            token={token} 
            currentUser={currentUser} 
          />
        );
      case "branding":
        return (
          <ClinicBranding 
            token={token} 
            clinic={activeClinic} 
            onUpdateClinic={handleClinicBrandingUpdate} 
            userRole={currentUser.role} 
            moduleStates={moduleStates}
            onUpdateModuleStates={setModuleStates}
          />
        );
      case "audit":
        return <AuditTrail token={token} />;
      case "espace_dg":
        return (
          <EspacePromoteurDG 
            key="espace_dg"
            token={token}
            currentUser={currentUser}
            clinic={activeClinic}
            initialTab="reporting"
          />
        );
      case "surveillance_epidemio":
        return (
          <EspacePromoteurDG 
            key="surveillance_epidemio"
            token={token}
            currentUser={currentUser}
            clinic={activeClinic}
            initialTab="epidemiology"
          />
        );
      default:
        return (
          <DashboardView 
            patientsList={patients}
            bedList={dashboardBeds}
            stockList={dashboardStock}
            invoiceList={dashboardInvoices}
            triageList={dashboardTriages}
            onOpenConsultation={() => spawnVirtualTab("dmg", "Consultations (DMG)")}
            clinicName={activeClinic.name}
            clinicSlogan={activeClinic.logoUrl || "MédiSahel Enterprise - Système Intelligent Hospitalier"}
            accentColor={activeClinic.themeColor}
            onTabRedirect={(tabId, label) => spawnVirtualTab(tabId, label)}
            currentUser={currentUser}
          />
        );
    }
  };

  // Clinician Admin Panel Render
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900 transition-colors duration-200" id="main-application-frame">
      {/* Complete Branded Header */}
       <Header 
        user={currentUser} 
        clinic={activeClinic} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        toastHistory={toastHistory}
        onClearHistory={() => setToastHistory([])}
        onDepartClick={() => setShowCheckOutModal(true)}
        hasCheckedInToday={!!todayAttendance}
        hasCheckedOutToday={!!todayAttendance?.checkOut}
        patientsList={patients}
        onSelectTab={(tab, arg) => {
          setActiveTab(tab);
          if (arg) {
            if (arg.isPatient && arg.patientName) {
              triggerToast(`🔍 Recherche globale : Accès direct au dossier de "${arg.patientName}"`);
            } else if (arg.isInvoice && arg.invoiceId) {
              triggerToast(`🧾 Recherche globale : Accès direct à la transaction "${arg.invoiceId}"`);
            } else if (arg.isItem && arg.itemName) {
              triggerToast(`📦 Recherche globale : Consultation de l'article de stock "${arg.itemName}"`);
            } else if (arg.focusAnalyses) {
              triggerToast(`🔬 Recherche globale : Accès aux analyses cliniques en attente`);
            } else if (arg.focusCalendar) {
              triggerToast(`📆 Recherche globale : Calendrier de consultation`);
            }
          }
        }}
      />

      {/* Floating Trigger Corridor & Icon */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-2.5 bg-transparent z-[98] hover:bg-teal-700/[0.04] cursor-pointer"
        onMouseEnter={() => setIsSidebarOpen(true)}
        id="sidebar-corridor-trigger"
      />
      <div 
        className="fixed left-0 top-1/2 -translate-y-1/2 w-10 h-16 bg-white border border-l-0 border-slate-200 rounded-r-2xl shadow-xl flex items-center justify-center cursor-pointer z-[95] transition-all hover:bg-slate-50 hover:w-11 group"
        onMouseEnter={() => setIsSidebarOpen(true)}
        id="sidebar-icon-trigger"
        title="Survoler pour ouvrir le menu principal (Cabinet)"
      >
        <span className="text-xl animate-pulse group-hover:scale-125 transition-transform text-teal-800">🏥</span>
      </div>

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside 
          className={`fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-200 z-[100] transition-all duration-300 shadow-2xl flex flex-col p-4 overflow-y-auto ${
            isSidebarOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "-translate-x-full opacity-0 pointer-events-none"
          }`}
          onMouseEnter={() => setIsSidebarOpen(true)}
          onMouseLeave={() => setIsSidebarOpen(false)}
          id="sidemenu-panel"
        >
          {(() => {
            const isSidebarCollapsed = false;
            return (
              <>
                {/* Nouveau Sidebar Premium Design */}
                <div className="mb-4 p-4 rounded-2xl text-white text-center relative space-y-1 shadow-enterprise" style={{ backgroundColor: activeClinic.themeColor }}>
                  <button 
                    onClick={() => setIsSidebarOpen(false)} 
                    className="absolute top-2 right-2 bg-white/20 hover:bg-white/35 p-1.5 rounded-lg text-white cursor-pointer transition-all flex items-center justify-center"
                    title="Agrandir le menu"
                  >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
            <span className="text-[9px] font-mono text-white/80 uppercase tracking-widest block font-black">ENTREPRISE HIS</span>
            {!isSidebarCollapsed && (
              <>
                <p className="font-sans font-extrabold text-sm uppercase tracking-tight truncate px-4">
                  {activeClinic.name}
                </p>
                <p className="text-[10px] text-white/70 font-medium font-sans">MédiSahel Enterprise V3</p>
              </>
            )}
            {isSidebarCollapsed && (
              <p className="font-sans font-black text-xs uppercase tracking-tight">MS</p>
            )}
          </div>

          <nav className="space-y-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-enterprise">
            {/* FAVORITES (Requirement 2 & 3) */}
            {!isSidebarCollapsed && favorites.length > 0 && (
              <div className="space-y-1 mb-3 border-b border-gray-150 pb-3">
                <span className="block text-[9px] font-mono font-bold text-amber-500 px-3 uppercase tracking-wider mb-1.5">
                  ⭐ FAVORIS DE L'UTILISATEUR
                </span>
                {favorites.map(favId => {
                  const m = allowedModules.find(x => x.id === favId);
                  if (!m) return null;
                  const IconC = m.icon;
                  const isFavActive = activeTab === m.id;
                  
                  // Label helper
                  const favLabel = 
                    m.id === "dashboard" ? "Tableau de Bord" :
                    m.id === "patients" ? "Admissions" :
                    m.id === "dme" ? "Dossiers Patients DME" :
                    m.id === "dmg" ? "Consultations (DMG)" :
                    m.id === "nursing" ? "Unité de Soins (Infirmier)" :
                    m.id === "hospitalization" ? "Hospitalisation & Lits" :
                    m.id === "appointments" ? "Agenda & RDV" :
                    m.id === "lab" ? "Laboratoire" :
                    m.id === "pharmacy_sales" ? "Vente Pharmacie" :
                    m.id === "pharmacy_stock" ? "Gestion des Stocks" :
                    m.id === "billing" ? "Facturation & Caisse" :
                    m.id === "presences" ? "Gestion des Présences" :
                    m.id === "payroll" ? "Gestion de la Paie" :
                    m.id === "documents" ? "Courriers & GECD" :
                    m.id === "emailing" ? "Communication Emails" :
                    m.id === "clinical-admin" ? "Supervision Clinique" :
                    m.id === "users" ? "Gouvernance RBAC" :
                    m.id === "branding" ? "Paramètres & Branding" :
                    m.id === "audit" ? "Registre d'Audit" :
                    m.id === "espace_dg" ? "Espace Promoteur / DG" :
                    m.id === "surveillance_epidemio" ? "Surveillance Épidémiologique" :
                    m.label;

                  return (
                    <button
                      key={`fav-${m.id}`}
                      onClick={() => {
                        setSelectedDmePatient(null);
                        setActiveTab(m.id);
                      }}
                      className={`w-full py-1.5 px-3 rounded-lg text-left text-xs font-semibold flex items-center space-x-2 transition-colors duration-100 cursor-pointer ${
                        isFavActive 
                          ? "bg-amber-50 text-amber-950 border border-amber-200" 
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      <IconC className={`h-3.5 w-3.5 shrink-0 ${isFavActive ? "text-amber-500" : "text-amber-400"}`} />
                      <span className="truncate">{favLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {[
              {
                title: "🏥 CLINIQUE",
                moduleIds: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin"]
              },
              {
                title: "📈 STRATÉGIE & PILOTAGE",
                moduleIds: ["espace_dg", "surveillance_epidemio"]
              },
              {
                title: "🔬 MÉDICO-TECHNIQUE",
                moduleIds: ["lab", "pharmacy_sales", "pharmacy_stock"]
              },
              {
                title: "💰 FINANCES",
                moduleIds: ["billing"]
              },
              {
                title: "👥 ADMINISTRATION",
                moduleIds: ["presences", "payroll", "documents", "emailing"]
              },
              {
                title: "🛡 SÉCURITÉ",
                moduleIds: ["users", "audit"]
              },
              {
                title: "⚙ CONFIGURATION",
                moduleIds: ["branding"]
              }
            ].map(category => {
              const catAllowedModules = category.moduleIds
                .map(id => allowedModules.find(m => m.id === id))
                .filter(Boolean);

              if (catAllowedModules.length === 0) return null;

              return (
                <div key={category.title} className="space-y-1">
                  {!isSidebarCollapsed && (
                    <span className="block text-[9px] font-mono font-bold text-gray-400 px-3 uppercase tracking-wider mb-1.5">
                      {category.title}
                    </span>
                  )}
                  {catAllowedModules.map(module => {
                    const IconComp = module!.icon;
                    const isActive = activeTab === module!.id;
                    const isFavorited = favorites.includes(module!.id);
                    const label = 
                      module!.id === "dashboard" ? "Tableau de Bord" :
                      module!.id === "patients" ? "Admissions" :
                      module!.id === "dme" ? "Dossiers Patients DME" :
                      module!.id === "dmg" ? "Consultations (DMG)" :
                      module!.id === "nursing" ? "Unité de Soins (Infirmier)" :
                      module!.id === "hospitalization" ? "Hospitalisation & Lits" :
                      module!.id === "appointments" ? "Agenda & RDV" :
                      module!.id === "lab" ? "Laboratoire" :
                      module!.id === "pharmacy_sales" ? "Vente Pharmacie" :
                      module!.id === "pharmacy_stock" ? "Gestion des Stocks" :
                      module!.id === "billing" ? "Facturation & Caisse" :
                      module!.id === "presences" ? "Gestion des Présences" :
                      module!.id === "payroll" ? "Gestion de la Paie" :
                      module!.id === "documents" ? "Courriers & GECD" :
                      module!.id === "emailing" ? "Communication Emails" :
                      module!.id === "clinical-admin" ? "Supervision Clinique" :
                      module!.id === "users" ? "Gouvernance RBAC" :
                      module!.id === "branding" ? "Paramètres & Branding" :
                      module!.id === "audit" ? "Registre d'Audit" :
                      module!.id === "espace_dg" ? "Espace Promoteur / DG" :
                      module!.id === "surveillance_epidemio" ? "Surveillance Épidémiologique" :
                      module!.label;
                    
                    return (
                      <div key={module!.id} className="relative group flex items-center w-full">
                        <button
                          onClick={() => {
                            setSelectedDmePatient(null); // safely clear DME view
                            setActiveTab(module!.id);
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center space-x-2.5 transition-colors duration-100 cursor-pointer ${
                            isActive 
                              ? "text-white shadow-enterprise font-extrabold" 
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          } ${isSidebarCollapsed ? "justify-center px-1" : ""}`}
                          style={isActive ? { backgroundColor: activeClinic.themeColor } : {}}
                          id={`tab-btn-${module!.id}`}
                        >
                          <IconComp className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                          {!isSidebarCollapsed && <span className="truncate pr-4">{label}</span>}
                        </button>

                        {!isSidebarCollapsed && module!.id !== "dashboard" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(module!.id);
                            }}
                            className={`absolute right-2 p-1 text-[9px] hover:text-amber-500 transition-all ${
                              isFavorited 
                                ? "text-amber-500 opacity-100 scale-110" 
                                : "text-slate-350 opacity-0 group-hover:opacity-100 hover:scale-110"
                            }`}
                            title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
                          >
                            ★
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* HISTORIQUE RÉCENT (Requirement 2 & 3) */}
            {!isSidebarCollapsed && recentHistory.length > 0 && (
              <div className="space-y-1 mt-4 pt-3 border-t border-gray-150">
                <span className="block text-[9px] font-mono font-bold text-gray-400 px-3 uppercase tracking-wider mb-1.5">
                  ⏱️ ACCÈS RÉCENTS
                </span>
                <div className="flex flex-wrap gap-1 px-3">
                  {recentHistory.map(histId => {
                    const m = allowedModules.find(x => x.id === histId);
                    if (!m) return null;
                    
                    const histLabel = 
                      m.id === "dashboard" ? "Tableau de Bord" :
                      m.id === "patients" ? "Admissions" :
                      m.id === "dme" ? "DME" :
                      m.id === "dmg" ? "DMG" :
                      m.id === "nursing" ? "Unité Soins" :
                      m.id === "hospitalization" ? "Hospitalisation" :
                      m.id === "appointments" ? "Agenda" :
                      m.id === "lab" ? "Lab" :
                      m.id === "pharmacy_sales" ? "Vente Pharmacie" :
                      m.id === "pharmacy_stock" ? "Stocks" :
                      m.id === "billing" ? "Caisse" :
                      m.id === "presences" ? "Présences" :
                      m.id === "payroll" ? "Paie" :
                      m.id === "documents" ? "Courriers" :
                      m.id === "emailing" ? "Emails" :
                      m.id === "clinical-admin" ? "Clinique" :
                      m.id === "users" ? "Gouvernance" :
                      m.id === "branding" ? "Paramètres" :
                      m.id === "audit" ? "Audit" :
                      m.id === "espace_dg" ? "Esp. DG" :
                      m.id === "surveillance_epidemio" ? "Epidémio" :
                      m.label;

                    return (
                      <button
                        key={`hist-${m.id}`}
                        onClick={() => {
                          setSelectedDmePatient(null);
                          setActiveTab(m.id);
                        }}
                        className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 py-0.5 rounded px-2 hover:text-slate-800 transition cursor-pointer font-sans"
                      >
                        {histLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* System Default Doctor Configured Signature visualizer (requested) */}
          {!isSidebarCollapsed && (
            <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-150 text-xs text-center space-y-1 shadow-enterprise">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Signature Systémique active</span>
              <p className="font-sans font-extrabold text-teal-950 text-xs italic">
                {activeClinic.logoUrl || "Dr. Adama Sangaré"}
              </p>
              <p className="text-[9px] text-gray-450 italic">Configure depuis l'onglet Branding</p>
            </div>
          )}
              </>
            );
          })()}
        </aside>

        {/* Action Content Core Panel */}
        <main className="flex-grow flex flex-col min-w-0 animate-fade-in space-y-4" id="main-screen-pane">
          {/* BREADCRUMB (Fil d'Ariane) (Requirement 6 - instant backtracking navigation) */}
          <nav className="flex items-center space-x-2 text-[11px] font-medium text-slate-500 bg-white border border-gray-150 py-2.5 px-4 rounded-xl shadow-xs" aria-label="Breadcrumb">
            <button 
              onClick={() => {
                setSelectedDmePatient(null);
                setActiveTab("dashboard");
                setActiveVirtualTabId("dashboard");
              }}
              className="hover:text-teal-700 transition font-bold cursor-pointer"
            >
              Accueil
            </button>
            <span className="text-slate-300">/</span>
            
            {activeTab !== "dashboard" ? (
              <>
                <button 
                  onClick={() => {
                    const parentMap: { [key: string]: string } = {
                      patients: "patients",
                      dme: "patients",
                      dmg: "dmg",
                      nursing: "nursing",
                      hospitalization: "hospitalization",
                      appointments: "appointments",
                      clinical_admin: "clinical-admin",
                      lab: "lab",
                      pharmacy_sales: "pharmacy_sales",
                      pharmacy_stock: "pharmacy_stock",
                      billing: "billing",
                      presences: "presences",
                      payroll: "payroll",
                      documents: "documents",
                      emailing: "emailing",
                      users: "users",
                      audit: "audit",
                      branding: "branding",
                      espace_dg: "espace_dg",
                      surveillance_epidemio: "surveillance_epidemio"
                    };
                    const parent = parentMap[activeTab];
                    if (parent) {
                      setActiveTab(parent);
                      setActiveVirtualTabId(parent);
                    }
                  }}
                  className="hover:text-teal-700 transition font-bold capitalize cursor-pointer"
                >
                  {activeTab === "pharmacy_sales" ? "Vente Pharmacie" :
                   activeTab === "pharmacy_stock" ? "Stocks" :
                   activeTab === "espace_dg" ? "DG & Promoteur" :
                   activeTab === "surveillance_epidemio" ? "Surveillance Épidémiologique" :
                   activeTab === "clinical-admin" ? "Supervision Clinique" :
                   activeTab}
                </button>
                
                {activeTab === "dme" && selectedDmePatient && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-800 font-extrabold font-mono">
                      {selectedDmePatient.firstName} {selectedDmePatient.lastName.toUpperCase()} ({selectedDmePatient.nationalId})
                    </span>
                  </>
                )}
                {activeTab === "dmg" && (
                  <>
                    <span className="text-slate-300">/</span>
                    <span className="text-slate-800 font-extrabold">Session Consultation Active</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-slate-800 font-extrabold">Tableau de Bord</span>
            )}
          </nav>

          {/* VIRTUAL WORKSPACE TABS SECTION (Requirement 2 & 5) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3" id="virtual-workspaces-bar">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] bg-slate-100 text-slate-700 font-extrabold px-2 py-1 rounded font-mono uppercase tracking-wider mr-1">Workspace Onglets :</span>
                {virtualTabs.map((tab) => {
                  const isActive = activeVirtualTabId === tab.id;
                  return (
                    <div 
                      key={tab.id}
                      className={`inline-flex items-center rounded-xl text-xs font-semibold py-1.5 px-3 transition-colors ${
                        isActive 
                          ? "bg-teal-700 text-white shadow-xs" 
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <button 
                        type="button"
                        onClick={() => {
                          setActiveVirtualTabId(tab.id);
                          setActiveTab(tab.tabType);
                        }}
                        className="cursor-pointer font-extrabold focus:outline-none"
                      >
                        {tab.label}
                      </button>
                      {tab.id !== "dashboard" && (
                        <button
                          type="button"
                          onClick={() => closeVirtualTab(tab.id)}
                          className="ml-2 text-[10px] leading-none opacity-60 hover:opacity-100 font-extrabold font-mono focus:outline-none"
                          title="Fermer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const namePrompt = window.prompt("Nom du nouvel onglet de travail ?", "Consultation libre");
                    if (namePrompt) {
                      const newId = "custom-" + Date.now();
                      setVirtualTabs([...virtualTabs, { id: newId, label: namePrompt, tabType: "dmg" }]);
                      setActiveVirtualTabId(newId);
                      setActiveTab("dmg");
                    }
                  }}
                  className="inline-flex items-center justify-center h-7.5 w-7.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-mono font-extrabold cursor-pointer"
                  title="Nouvel Onglet"
                >
                  +
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDoubleScreenMode(!isDoubleScreenMode)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition ${
                    isDoubleScreenMode 
                      ? "bg-slate-900 border-slate-950 text-white" 
                      : "bg-white hover:bg-slate-50 text-slate-700 border-gray-250"
                  }`}
                >
                  <span>💻 Mode Double Écran</span>
                  <span className={`h-2 w-2 rounded-full ${isDoubleScreenMode ? "bg-emerald-500 animate-ping" : "bg-gray-300"}`} />
                </button>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-400 font-sans italic leading-none">
              Astuce : Cliquez sur n'importe quel élément pour ouvrir des onglets synchronisés en temps réel. Sauvegarde automatique active.
            </p>
          </div>

          {/* DYNAMIC SCREEN LAYOUT PANEL COMPILER */}
          {isDoubleScreenMode ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dual-screen-layout-grid">
              {/* PRIMARY VISUAL SCREEN */}
              <div className="space-y-3 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm duration-150">
                <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-[10px] font-mono tracking-widest flex justify-between items-center uppercase font-black">
                  <span>📟 Écran Principal : {activeTab.toUpperCase()}</span>
                  <span className="text-[9px] bg-sky-600 px-1.5 py-0.5 rounded text-white font-black animate-pulse">Affichage Principal</span>
                </div>
                {renderModuleContent(activeTab)}
              </div>

              {/* AUXILIARY VISUAL SCREEN */}
              <div className="space-y-3 bg-white border border-gray-150 rounded-2xl p-4 shadow-sm duration-150">
                <div className="bg-slate-800 text-white px-3 py-2 rounded-xl text-[10px] font-mono tracking-widest flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span>📟 Écran Auxiliaire :</span>
                    <select 
                      value={secondaryTabId}
                      onChange={e => setSecondaryTabId(e.target.value)}
                      className="bg-slate-700 text-slate-100 rounded text-[9px] font-mono font-bold focus:outline-none p-1 shrink"
                    >
                      <option value="dashboard">Tableau de bord</option>
                      <option value="patients">Admissions</option>
                      <option value="dme">Dossier DME</option>
                      <option value="hospitalization">Hospitalisations</option>
                      <option value="dmg">Consultations DMG</option>
                      <option value="billing">Factures & Caisse</option>
                      <option value="pharmacy_sales">Vente Pharmacie</option>
                      <option value="pharmacy_stock">Stocks Pharmacie</option>
                      <option value="lab">Laboratoire</option>
                      <option value="presences">Présences</option>
                      <option value="documents">Archive GECD</option>
                    </select>
                  </div>
                  <span className="text-[9px] bg-teal-600 px-1.5 py-0.5 rounded font-black uppercase text-white">SYNCHRONISÉ</span>
                </div>
                {renderModuleContent(secondaryTabId)}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-enterprise">
              {renderModuleContent(activeTab)}
            </div>
          )}

          {/* FLOATING PERSISTENT REALTIME SYSTEM STATE TOASTERS (Top Right - Point 5) */}
          <div className="fixed top-20 right-5 z-50 space-y-2 pointer-events-none max-w-xs" id="realtime-notifications-stack">
            {autoSaveToast && (
              <div className="p-2.5 bg-slate-900/95 backdrop-blur text-slate-100 text-[9px] font-sans font-bold rounded-lg shadow-md flex items-center space-x-2 border border-slate-700 animate-slide-in pointer-events-auto">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping shrink-0" />
                <span>💾 Sauvegarde auto. effectuée (Mali Nuage)</span>
              </div>
            )}

            {liveToasts.map((toast, index) => (
              <div 
                key={index} 
                className="p-2.5 bg-teal-950/95 backdrop-blur text-teal-50 text-[9px] font-sans font-bold rounded-lg shadow-md flex items-center justify-between border border-teal-800 animate-slide-in pointer-events-auto"
                style={{ animation: 'slideIn 0.2s ease-out' }}
              >
                <div className="flex items-center space-x-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-450 shrink-0 animate-pulse" />
                  <span className="leading-tight text-white">{toast}</span>
                </div>
                <span className="text-[7px] uppercase bg-teal-900 px-1.5 ml-2.5 rounded font-mono font-black shrink-0">Live</span>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* 📅 BLOCKING MANDATORY ARRIVAL POINTAGE MODAL */}
      {showCheckInModal && currentUser && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans" id="mandatory-arrival-modal">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-3xl shadow-2xl p-6 text-white space-y-6 relative overflow-hidden">
            {/* Background ambient light */}
            <div className="absolute top-[-25%] left-[-25%] w-[70%] h-[70%] rounded-full bg-teal-500/5 blur-[100px]" />

            {/* Header info */}
            <div className="text-center space-y-1.5 relative z-10">
              <div className="mx-auto h-12 w-12 bg-teal-500/10 text-teal-400 border border-teal-500/25 rounded-2xl flex items-center justify-center shadow-inner">
                <Clock className="h-6 w-6" />
              </div>
              <h2 className="font-sans font-black text-base uppercase tracking-tight text-slate-100">Pointage Arrivée Obligatoire</h2>
              <p className="text-[11px] text-slate-400">Veuillez signer le registre d'accès clinique pour aujourd'hui.</p>
            </div>

            {/* Live date & clock display */}
            <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-850/60 text-center relative z-10 space-y-1.5">
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block font-black">HEURE CLINIQUE DU MALI</span>
              <div className="font-mono text-3xl font-black text-teal-400 tracking-tight leading-none">
                {modalClock || "08:00:00"}
              </div>
              <span className="text-[10px] text-slate-400 block font-bold capitalize font-sans">
                {new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {/* Lateness threshold warning check */}
            <div className="space-y-3.5 relative z-10">
              {checkIsLate() ? (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex flex-col gap-1">
                  <span className="font-bold uppercase tracking-wide flex items-center">
                    <ShieldAlert className="h-4 w-4 mr-1.5 shrink-0" />
                    🚨 Retard détecté par rapport aux horaires
                  </span>
                  <span className="text-[11px] text-rose-300 font-medium">
                    L'heure d'ouverture pour le département {currentUser.department || "Médecine Générale"} est fixée à {getDepartmentStartHour()} (maximum toléré). Veuillez spécifier le motif obligatoire.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 rounded-xl">
                  <Check className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span className="font-medium">✓ Ponctualité excellente validée pour aujourd'hui !</span>
                </div>
              )}

              {/* Arrival pointage form */}
              <form 
                onSubmit={async e => {
                  e.preventDefault();
                  const reasonField = (document.getElementById("arrival-late-reason") as HTMLSelectElement)?.value || "";
                  const fileInput = document.getElementById("arrival-doc-upload") as HTMLInputElement;
                  const fName = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0].name : "";
                  await handleArrivalCheckInSubmit(reasonField, fName);
                }} 
                className="space-y-4 text-xs font-semibold"
              >
                {/* Conditionally show motifs field if late */}
                {checkIsLate() && (
                  <div className="space-y-3.5 animate-fade-in">
                    <div>
                      <label className="block text-slate-400 text-[10.5px] mb-1.5 font-bold">Raison médicale / Motif du retard <strong className="text-rose-500">*</strong> :</label>
                      <select 
                        required
                        id="arrival-late-reason"
                        className="w-full h-11 px-3 bg-slate-900 border border-slate-800 text-slate-200 focus:border-teal-500 rounded-xl"
                      >
                        <option value="">-- Sélectionnez un motif valide --</option>
                        {(() => {
                          try {
                            const parsed = localStorage.getItem("medisahel_late_reasons");
                            if (parsed) return JSON.parse(parsed).map((r: string, i: number) => <option key={i} value={r}>{r}</option>);
                          } catch {}
                          return ["Transport en panne", "Retard des transports en commun", "Rendez-vous médical", "Problème familial", "Intempéries", "Autre"].map((r, i) => <option key={i} value={r}>{r}</option>);
                        })()}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10.5px] mb-1.5">Document justificatif (Facultatif, pdf/img) :</label>
                      <input 
                        type="file" 
                        id="arrival-doc-upload" 
                        className="w-full text-slate-400 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-teal-400 hover:file:bg-slate-750" 
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-[11px] uppercase tracking-wide cursor-pointer transition-all shadow-md mt-2 leading-none flex items-center justify-center gap-1"
                >
                  <Check className="h-4 w-4 shrink-0" />
                  <span>Enregistrer mon arrivée &amp; Entrer</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 🚪 DEPARTURE POINTAGE MODAL */}
      {showCheckOutModal && currentUser && todayAttendance && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans" id="checkout-modal">
          <div className="bg-white text-slate-900 border border-gray-150 max-w-sm w-full rounded-3xl shadow-2xl p-6 relative">
            <div className="text-center space-y-1.5 mb-5">
              <div className="mx-auto h-12 w-12 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl flex items-center justify-center shadow-inner">
                <Clock className="h-6 w-6" />
              </div>
              <h2 className="font-sans font-black text-base uppercase text-slate-900 leading-none">Clôturer mon Service</h2>
              <p className="text-xs text-gray-400 font-medium">Déclarer l'heure de départ officielle de mon poste.</p>
            </div>

            {/* Time view */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-gray-100 text-center space-y-1 mb-4">
              <span className="text-[9px] font-mono tracking-wider text-gray-400 uppercase block font-bold">HEURE DE SORTIE CONCURRENTIELLE</span>
              <div className="font-mono text-2xl font-black text-teal-800 leading-none">
                {modalClock || "16:00:00"}
              </div>
              <span className="text-[10px] text-gray-500 block font-bold">
                {todayAttendance.date}
              </span>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-850 text-xs rounded-xl flex items-center gap-1.5 leading-relaxed mb-4 font-semibold">
              <AlertCircle className="h-4.5 w-4.5 text-indigo-700 shrink-0" />
              <span>
                Le système enregistrera un départ à {modalClock ? modalClock.slice(0, 5) : "16:00"}. Ce pointage de départ marquera votre sortie officielle dans le registre RH.
              </span>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCheckOutModal(false)}
                className="flex-1 py-3 text-center bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDepartureCheckOutSubmit}
                className="flex-1 py-3 text-center bg-teal-700 hover:bg-teal-850 text-white rounded-xl font-black text-xs uppercase cursor-pointer"
              >
                Signer Départ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

