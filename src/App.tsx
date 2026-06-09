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
import { ClinicalAdministration } from "./components/ClinicalAdministration.tsx";
import EmailManager from "./components/EmailManager.tsx";
import DashboardView from "./components/DashboardView.tsx";
import { 
  Heart, Bed, HandCoins, Pill, FlaskConical, Users, Calendar, 
  FolderGit, Shield, Settings, ShieldCheck, Mail, Key, Activity, ShieldAlert,
  Stethoscope, Clock, ClipboardList, Banknote, Building
} from "lucide-react";

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("medisahel_token"));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
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
      pharmacy: true,
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
    if (currentUser && currentUser.role !== "ADMIN") {
      const allowedKeys = currentUser.allowedModules || [];
      if (allowedKeys.length > 0 && !allowedKeys.includes(activeTab)) {
        const firstAllowed = ["patients", "dme", "hospitalization", "dmg", "billing", "pharmacy", "lab", "presences", "payroll", "appointments", "documents", "emailing"].find(key => allowedKeys.includes(key));
        if (firstAllowed) {
          setActiveTab(firstAllowed);
        }
      }
    }
  }, [activeTab, currentUser]);

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
      }
    } catch (err) {
      console.error(err);
    }
  };

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
    { id: "billing", label: "Facturation & Caisse", icon: HandCoins },
    { id: "pharmacy", label: "Pharmacie & Stock", icon: Pill },
    { id: "lab", label: "Laboratoire", icon: FlaskConical },
    { id: "presences", label: "Gestion des Présences", icon: Clock },
    { id: "payroll", label: "Gestion de la Paie", icon: Banknote },
    { id: "appointments", label: "Agenda", icon: Calendar },
    { id: "documents", label: "GECD Archive", icon: FolderGit },
    { id: "emailing", label: "Communication & Emailing", icon: Mail },
    { id: "clinical-admin", label: "Administration Clinique", icon: Building, adminOrDoctorChiefOnly: true },
    { id: "users", label: "Gouvernance & Sécurité", icon: Shield, adminOnly: true },
    { id: "branding", label: "Branding", icon: Settings, adminOnly: true },
    { id: "audit", label: "Audit Trail", icon: ShieldCheck, adminOnly: true }
  ];

  // Filter modules based on user role and allowed modules permissions!
  const allowedModules = modules.filter(mod => {
    if (!currentUser) return false;
    if (mod.id === "dashboard") return true; // Central clinician dashboard is always open to all authenticated users
    if (mod.adminOnly && currentUser.role !== "ADMIN") return false;
    if (mod.adminOrDoctorChiefOnly && currentUser.role !== "ADMIN" && currentUser.role !== "MEDECIN_GENERAL_CHIEF") return false;
    // Non-admin users are restricted to their explicit permitted modules list
    if (currentUser.role !== "ADMIN" && currentUser.role !== "MEDECIN_GENERAL_CHIEF") {
      const allowedKeys = currentUser.allowedModules || [];
      if (!allowedKeys.includes(mod.id)) {
        return false;
      }
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
  if (currentUser.mustChangePassword) {
    return <ChangePasswordModal token={token} onSuccess={handlePasswordChanged} />;
  }

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
      />

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 font-sans" id="sidemenu-panel">
          {/* Nouveau Sidebar Premium Design */}
          <div className="mb-4 p-4.5 rounded-2xl text-white text-center space-y-1 shadow-enterprise" style={{ backgroundColor: activeClinic.themeColor }}>
            <span className="text-[9px] font-mono text-white/80 uppercase tracking-widest block font-black">ENTREPRISE HIS</span>
            <p className="font-sans font-extrabold text-sm uppercase tracking-tight truncate">
              {activeClinic.name}
            </p>
            <p className="text-[10px] text-white/70 font-medium">MédiSahel Enterprise V3</p>
          </div>

          <nav className="space-y-4 bg-white p-3 rounded-2xl border border-gray-150 shadow-enterprise">
            {[
              {
                title: "🏥 CLINIQUE",
                moduleIds: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin"]
              },
              {
                title: "🔬 MÉDICO-TECHNIQUE",
                moduleIds: ["lab", "pharmacy"]
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
                  <span className="block text-[9px] font-mono font-bold text-gray-400 px-3 uppercase tracking-wider mb-1.5">
                    {category.title}
                  </span>
                  {catAllowedModules.map(module => {
                    const IconComp = module!.icon;
                    const isActive = activeTab === module!.id;
                    const label = 
                      module!.id === "dashboard" ? "Tableau de Bord" :
                      module!.id === "patients" ? "Admissions" :
                      module!.id === "dme" ? "Dossiers Patients DME" :
                      module!.id === "dmg" ? "Consultations (DMG)" :
                      module!.id === "hospitalization" ? "Hospitalisation & Lits" :
                      module!.id === "appointments" ? "Agenda & RDV" :
                      module!.id === "lab" ? "Laboratoire" :
                      module!.id === "pharmacy" ? "Pharmacie & Stock" :
                      module!.id === "billing" ? "Facturation & Caisse" :
                      module!.id === "presences" ? "Gestion des Présences" :
                      module!.id === "payroll" ? "Gestion de la Paie" :
                      module!.id === "documents" ? "Courriers & GECD" :
                      module!.id === "emailing" ? "Communication Emails" :
                      module!.id === "clinical-admin" ? "Supervision Clinique" :
                      module!.id === "users" ? "Gouvernance RBAC" :
                      module!.id === "branding" ? "Paramètres & Branding" :
                      module!.id === "audit" ? "Registre d'Audit" :
                      module!.label;
                    
                    return (
                      <button
                        key={module!.id}
                        onClick={() => {
                          setSelectedDmePatient(null); // safely clear DME view
                          setActiveTab(module!.id);
                        }}
                        className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center space-x-2.5 transition-colors duration-100 cursor-pointer ${
                          isActive 
                            ? "text-white shadow-enterprise font-extrabold" 
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                        style={isActive ? { backgroundColor: activeClinic.themeColor } : {}}
                        id={`tab-btn-${module!.id}`}
                      >
                        <IconComp className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          {/* System Default Doctor Configured Signature visualizer (requested) */}
          <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-150 text-xs text-center space-y-1 shadow-enterprise">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-bold">Signature Systémique active</span>
            <p className="font-sans font-extrabold text-teal-950 text-xs italic">
              {activeClinic.logoUrl || "Dr. Adama Sangaré"}
            </p>
            <p className="text-[9px] text-gray-450 italic">Configure depuis l'onglet Branding</p>
          </div>
        </aside>

        {/* Action Content Core Panel */}
        <main className="flex-grow flex flex-col min-w-0 animate-fade-in" id="main-screen-pane">
          {activeTab === "dashboard" && (
            <DashboardView 
              patientsList={patients}
              bedList={dashboardBeds}
              stockList={dashboardStock}
              invoiceList={dashboardInvoices}
              triageList={dashboardTriages}
              onOpenConsultation={() => setActiveTab("dmg")}
              clinicName={activeClinic.name}
              clinicSlogan={activeClinic.logoUrl || "MédiSahel Enterprise - Système Intelligent Hospitalier"}
              accentColor={activeClinic.themeColor}
            />
          )}

          {activeTab === "patients" && (
            <PatientManager 
              token={token} 
              clinic={activeClinic}
              currentUser={currentUser}
            />
          )}

          {activeTab === "dme" && (
            selectedDmePatient ? (
              <MedicalRecordsDME 
                token={token} 
                patient={selectedDmePatient} 
                onBack={() => {
                  setSelectedDmePatient(null);
                  fetchGlobalPatients(token); // refresh items
                }}
                userRole={currentUser.role}
                clinic={activeClinic}
              />
            ) : (
              <PatientManager 
                token={token} 
                onSelectPatient={(p) => setSelectedDmePatient(p)} 
                clinic={activeClinic}
                currentUser={currentUser}
              />
            )
          )}

          {activeTab === "hospitalization" && (
            <HospitalizationTracker 
              token={token} 
              patients={patients} 
              userRole={currentUser.role} 
            />
          )}

          {activeTab === "dmg" && (
            <DmgModuleView
              token={token}
              patients={patients}
              currentUser={currentUser}
              clinicThemeColor={activeClinic.themeColor}
            />
          )}

          {activeTab === "billing" && (
            <BillingsAndCashier 
              token={token} 
              patients={patients} 
              userRole={currentUser.role} 
              clinic={activeClinic}
            />
          )}

          {activeTab === "pharmacy" && (
            <PharmacyStock 
              token={token} 
              userRole={currentUser.role} 
            />
          )}

          {activeTab === "lab" && (
            <LabStation 
              token={token} 
              patients={patients} 
              userRole={currentUser.role} 
            />
          )}

          {activeTab === "presences" && (
            <PresencesManager 
              token={token} 
              currentUser={currentUser}
              clinicThemeColor={activeClinic.themeColor} 
            />
          )}

          {activeTab === "payroll" && (
            <PayrollsManager 
              token={token} 
              currentUser={currentUser}
              clinicThemeColor={activeClinic.themeColor} 
            />
          )}

          {activeTab === "appointments" && (
            <AppointmentsCalendar 
              token={token} 
              patients={patients} 
              userRole={currentUser.role} 
            />
          )}

          {activeTab === "documents" && (
            <DocumentManager 
              token={token} 
              userRole={currentUser.role} 
              clinic={activeClinic}
            />
          )}

          {activeTab === "emailing" && (
            <EmailManager 
              token={token} 
              clinic={activeClinic} 
              currentUser={currentUser}
            />
          )}

          {activeTab === "clinical-admin" && (
            <ClinicalAdministration 
              token={token} 
              currentUser={currentUser}
              onSelectPatientDme={(p) => {
                setSelectedDmePatient(p);
                setActiveTab("dme");
              }}
              clinic={activeClinic}
            />
          )}

          {activeTab === "users" && (
            <UserCredentials 
              token={token} 
              currentUser={currentUser} 
            />
          )}

          {activeTab === "branding" && (
            <ClinicBranding 
              token={token} 
              clinic={activeClinic} 
              onUpdateClinic={handleClinicBrandingUpdate} 
              userRole={currentUser.role} 
              moduleStates={moduleStates}
              onUpdateModuleStates={setModuleStates}
            />
          )}

          {activeTab === "audit" && (
            <AuditTrail token={token} />
          )}
        </main>
      </div>
    </div>
  );
}
