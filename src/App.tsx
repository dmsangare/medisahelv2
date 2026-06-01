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
import { AppointmentsCalendar } from "./components/AppointmentsCalendar.tsx";
import { DocumentManager } from "./components/DocumentManager.tsx";
import { AuditTrail } from "./components/AuditTrail.tsx";
import { ClinicBranding } from "./components/ClinicBranding.tsx";
import { UserCredentials } from "./components/UserCredentials.tsx";
import { ChangePasswordModal } from "./components/ChangePasswordModal.tsx";
import { 
  Heart, Bed, HandCoins, Pill, FlaskConical, Users, Calendar, 
  FolderGit, Shield, Settings, ShieldCheck, Mail, Key, Activity, ShieldAlert 
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

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("patients");

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

  useEffect(() => {
    fetchClinics();
    if (token) {
      fetchSession(token);
      fetchGlobalPatients(token);
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

  // Modules array with RBAC filters
  const modules = [
    { id: "patients", label: "Patients & DME", icon: Heart },
    { id: "hospitalization", label: "Hospitalisation", icon: Bed },
    { id: "billing", label: "Facturation & Caisse", icon: HandCoins },
    { id: "pharmacy", label: "Pharmacie & Stock", icon: Pill },
    { id: "lab", label: "Laboratoire", icon: FlaskConical },
    { id: "hr", label: "Présences & Paie", icon: Users },
    { id: "appointments", label: "Agenda", icon: Calendar },
    { id: "documents", label: "GECD Archive", icon: FolderGit },
    { id: "users", label: "Utilisateurs (RBAC)", icon: Shield, adminOnly: true },
    { id: "branding", label: "Branding", icon: Settings, adminOnly: true },
    { id: "audit", label: "Audit Trail", icon: ShieldCheck, adminOnly: true }
  ];

  // Filter modules based on user role
  const allowedModules = modules.filter(mod => {
    if (!currentUser) return false;
    if (mod.adminOnly && currentUser.role !== "ADMIN") return false;
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
      </div>
    );
  }

  // FORCE MANDATORY PASSWORD UPDATE BLOCK (enforcing complete compliance)
  if (currentUser.mustChangePassword) {
    return <ChangePasswordModal token={token} onSuccess={handlePasswordChanged} />;
  }

  // Clinician Admin Panel Render
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900" id="main-application-frame">
      {/* Complete Branded Header */}
      <Header 
        user={currentUser} 
        clinic={activeClinic} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
      />

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col md:flex-row gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 shrink-0 font-sans" id="sidemenu-panel">
          <nav className="space-y-1 bg-white p-3 rounded-2xl border border-gray-150 shadow-xs">
            {allowedModules.map(module => {
              const IconComp = module.icon;
              const isActive = activeTab === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => {
                    setSelectedDmePatient(null); // safely clear DME view
                    setActiveTab(module.id);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-left text-xs font-semibold flex items-center space-x-3 transition-colors duration-100 cursor-pointer ${
                    isActive 
                      ? "text-white shadow-xs" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                  style={isActive ? { backgroundColor: activeClinic.themeColor } : {}}
                  id={`tab-btn-${module.id}`}
                >
                  <IconComp className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{module.label}</span>
                </button>
              );
            })}
          </nav>

          {/* System Default Doctor Configured Signature visualizer (requested) */}
          <div className="mt-4 bg-white p-4 rounded-2xl border border-gray-150 text-xs text-center space-y-1">
            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block">Signature Systémique active</span>
            <p className="font-extrabold text-teal-950 text-sm font-sans italic">
              {activeClinic.logoUrl || "Dr. Adama Sangaré"}
            </p>
            <p className="text-[9px] text-gray-400 italic">Configure depuis l'onglet Branding</p>
          </div>
        </aside>

        {/* Action Content Core Panel */}
        <main className="flex-grow flex flex-col min-w-0" id="main-screen-pane">
          {activeTab === "patients" && (
            selectedDmePatient ? (
              <MedicalRecordsDME 
                token={token} 
                patient={selectedDmePatient} 
                onBack={() => {
                  setSelectedDmePatient(null);
                  fetchGlobalPatients(token); // refresh items
                }}
                userRole={currentUser.role}
              />
            ) : (
              <PatientManager 
                token={token} 
                onSelectPatient={(p) => setSelectedDmePatient(p)} 
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

          {activeTab === "billing" && (
            <BillingsAndCashier 
              token={token} 
              patients={patients} 
              userRole={currentUser.role} 
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

          {activeTab === "hr" && (
            <HRRoster 
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
