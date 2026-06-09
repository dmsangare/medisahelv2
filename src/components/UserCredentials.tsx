import React, { useState, useEffect, useRef } from "react";
import { 
  UserPlus, Search, Check, ShieldAlert, Key, Shield, 
  Ban, Clock, Settings, X, Lock, Unlock, FileText, 
  AlertTriangle, ArrowRight, ShieldCheck, Activity,
  Layers, GitFork, Users2, Building2, LockKeyhole, CheckSquare, 
  Square, Printer, Download, MapPin, Mail, Phone, Calendar, 
  Award, Heart, Pill, FlaskConical, Stethoscope, HandCoins, 
  Cpu, UserRound, FileCheck, CheckCircle2, ChevronRight, DollarSign
} from "lucide-react";
import { User, Role } from "../types.ts";
import { 
  DEFAULT_ROLE_PERMISSIONS, 
  ALL_MODULES, 
  ALL_PERMISSIONS, 
  userHasPermission,
  GranularPermission
} from "../utils/rbac";

interface UserCredentialsProps {
  token: string | null;
  currentUser: User;
}

// 14 Standard departments
const DEPARTMENTS = [
  { id: "DG", label: "Direction Générale", chef: "Dr. Adama Sangaré", staffCount: 2, desc: "Supervision exécutive, conformité et gouvernance stratégique.", services: ["Administration", "Juridique", "Audit interne"] },
  { id: "MED_GEN", label: "Médecine Générale", chef: "Dr. Ibrahim Touré", staffCount: 12, desc: "Secteur de consultations primaires, traitement ambulatoire et urgences.", services: ["Consultation", "Hospitalisation", "Urgences"] },
  { id: "LABO", label: "Laboratoire d'Analyses", chef: "Moussa Coulibaly", staffCount: 4, desc: "Analyses de biochimie, hématologie et examens microbiologiques.", services: ["Biochimie", "NFS", "Sérologie"] },
  { id: "PHARM", label: "Pharmacie Hospitalière", chef: "Aminata Dembélé", staffCount: 3, desc: "Gestion des stocks, dispensation et approvisionnements médicaux.", services: ["Dispensation", "Gestion Stock", "Caisse Pharm"] },
  { id: "ADMIN", label: "Administration Générale", chef: "Fatim Kéïta", staffCount: 3, desc: "Ressources humaines, relations extérieures et comptabilité.", services: ["RH", "Facturation", "GECD"] },
  { id: "IMAGE", label: "Imagerie Médicale", chef: "Dr. Lamine Diallo", staffCount: 2, desc: "Service d'échographies, radiographies standards et scanners.", services: ["Radiographie", "Échographie"] },
  { id: "PED", label: "Pédiatrie", chef: "Dr. Mariam Sacko", staffCount: 3, desc: "Prise en charge spécialisée des nourrissons et enfants de 0-15 ans.", services: ["Clinique Enfant", "Néonatologie"] },
  { id: "MAT", label: "Gynéco-Obstétrique", chef: "Dr. Awa Traoré", staffCount: 5, desc: "Suivis de grossesse, accouchements et chirurgie gynécologique.", services: ["Bloc Maternité", "Suivi Grossesse"] },
  { id: "CHIR", label: "Chirurgie Générale", chef: "Dr. Alou Diallo", staffCount: 3, desc: "Interventions chirurgicales programmées et urgences viscérales.", services: ["Bloc Opératoire", "Soins Post-OP"] },
  { id: "CARDIO", label: "Cardiologie", chef: "Dr. Sékou Coulibaly", staffCount: 2, desc: "Examens ECG, échographies cardiaques et suivi hypertension.", services: ["EGC", "Consultation Cardio"] },
  { id: "RH", label: "Ressources Humaines", chef: "Fatim Kéïta", staffCount: 2, desc: "Gestion du recrutement, paies, rosters et présence du personnel.", services: ["Paie", "Roster", "Contrats"] },
  { id: "COMPT", label: "Comptabilité", chef: "Awa Traoré", staffCount: 1, desc: "Gestion des investissements, bilans, comptes et fiscalité clinique.", services: ["Trésorerie", "Bilan"] },
  { id: "GECD", label: "GECD / Archives", chef: "Assitan Diabaté", staffCount: 1, desc: "Numérisation des dossiers, rapports, archives et courriers.", services: ["GED", "Numérisation"] },
  { id: "INFO", label: "Informatique & IT", chef: "Dr. Adama Sangaré", staffCount: 1, desc: "Hébergement local de l'ERP MédiSahel, réseaux et sécurité RBAC.", services: ["Support", "Réseau CISCO"] }
];

export const UserCredentials: React.FC<UserCredentialsProps> = ({ token, currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Default tab configured to Visual Organigramme for hospital topology presentation
  const [activeTab, setActiveTab] = useState<
    "organigramme" | "dashboard" | "users" | "permissions" | "departments" | "sessions" | "audit" | "security"
  >("organigramme");

  // Selection states for detail panels
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profile360Tab, setProfile360Tab] = useState<
    "identity" | "access" | "documents" | "contract" | "salary" | "presences" | "history" | "audit"
  >("identity");

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  // Security policies
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [lockoutThreshold, setLockoutThreshold] = useState("3");
  const [pwdExpiryDays, setPwdExpiryDays] = useState("90");
  const [mfaKey, setMfaKey] = useState("MEDISAHEL_ROOT_SECURE_V3");

  // Connected Sessions list (Simulated for security controls)
  const [activeSessions, setActiveSessions] = useState([
    { id: "sess-1", userId: "user-admin", userName: "Dr. Adama Sangaré", role: "ADMIN", ip: "192.168.1.100", device: "Chrome 125 / macOS", station: "Bureau Direction - Poste 1", loginTime: "09:12:05" },
    { id: "sess-2", userId: "user-doctor", userName: "Dr. Ibrahim Touré", role: "MEDECIN_GENERAL_CHIEF", ip: "192.168.1.105", device: "Safari / iPad OS", station: "Box Consultation - Tablette A", loginTime: "10:30:41" },
    { id: "sess-3", userId: "user-pharmacist", userName: "Aminata Dembélé", role: "PHARMACIST", ip: "192.168.1.189", device: "Chrome / Windows 11", station: "Caisse Pharmacie - Poste Central", loginTime: "08:15:22" },
    { id: "sess-4", userId: "user-nurse", userName: "Fatoumata Diarra", role: "NURSE", ip: "192.168.1.144", device: "Android / Chrome Mobile", station: "Salle de soins - Tablette B", loginTime: "11:05:13" }
  ]);

  // Form enrollment data with exact hierarchical mapping fields
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    login: "",
    email: "",
    role: "DOCTOR" as Role,
    password: "",
    mustChangePassword: true,
    phone: "",
    department: "Médecine Générale",
    profession: "Médecin Référent",
    contractType: "CDI",
    gender: "F",
    dob: "1988-06-15",
    address: "BP 42, Quartier Mossinkoré, Mopti",
    nina: "1 88 04 940 210 M",
    matricule: "",
    hireDate: "2024-01-10",
    supervisorId: "user-admin",
    signaturePad: "ACTIVÉ",
    sealText: "CLINIQUE SAHEL SAHELO-SOUDANAISE - CACHET ACCRÉDITÉ",
    ordNum: ""
  });

  // Load backend users or supplement with rich fallback targets matching Malian staff
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Supplement with default personnel if backend list is short
        if (data.length < 3) {
          const defaults: User[] = [
            { id: "user-admin", name: "Dr. Adama Sangaré", login: "asangare", email: "dmsangare@gmail.com", role: "ADMIN", department: "Direction Générale", status: "ACTIVE", profession: "Promoteur It & Biomédical", contractType: "CDI", phone: "+223 76 11 22 33", hireDate: "2020-05-15" } as any,
            { id: "user-dg", name: "Fatim Kéïta", login: "fkeita", email: "fkeita@medisahel.ml", role: "ADMIN", department: "Direction Générale", status: "ACTIVE", profession: "Directrice Générale", contractType: "CDI", phone: "+223 66 55 44 33", hireDate: "2021-02-12" } as any,
            { id: "user-chief", name: "Dr. Ibrahim Touré", login: "itoure", email: "itoure@medisahel.ml", role: "MEDECIN_GENERAL_CHIEF", department: "Médecine Générale", status: "ACTIVE", profession: "Médecin Chef", contractType: "CDI", phone: "+223 74 12 34 56", hireDate: "2022-01-10" } as any,
            { id: "user-nurse", name: "Fatoumata Diarra", login: "fdiarra", email: "fdiarra@medisahel.ml", role: "NURSE", department: "Médecine Générale", status: "ACTIVE", profession: "Infirmière Hospitalière", contractType: "CDI", phone: "+223 60 44 55 66", hireDate: "2024-01-15" } as any,
            { id: "user-biologist", name: "Moussa Coulibaly", login: "mcoulibaly", email: "mcoulibaly@medisahel.ml", role: "LAB_TECH", department: "Laboratoire d'Analyses", status: "ACTIVE", profession: "Biologiste Responsable", contractType: "CDI", phone: "+223 71 88 99 00", hireDate: "2023-04-01" } as any,
            { id: "user-pharmacist", name: "Aminata Dembélé", login: "adembele", email: "adembele@medisahel.ml", role: "PHARMACIST", department: "Pharmacie Hospitalière", status: "ACTIVE", profession: "Pharmacienne Responsable", contractType: "CDI", phone: "+223 75 44 99 22", hireDate: "2023-09-10" } as any
          ];
          setUsers([...defaults, ...data.filter((u: any) => !defaults.some(d => d.id === u.id))]);
        } else {
          setUsers(data);
        }
      } else {
        setError(data.error || "Échec chargement utilisateurs.");
      }
    } catch {
      setError("Échec de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const resp = await fetch("/api/auditlogs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        setAuditLogs(data);
      }
    } catch {
      console.error("Audit log loading failed.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [token]);

  // Handle Enrollment POST (creating new hospital user)
  const handleEnrollUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName || !formData.lastName || !formData.login || !formData.email || !formData.password) {
      setError("Le nom, prénom, email, identifiant unique et mot de passe de sûreté sont obligatoires.");
      return;
    }

    const compiledMatricule = formData.matricule || `MS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const compiledPayload = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName.toUpperCase()}`,
      matricule: compiledMatricule,
      allowedModules: ["patients", "dme", "dmg", "appointments"]
    };

    try {
      const resp = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(compiledPayload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Échec d'enrôlement.");

      setSuccess(`L'agent ${compiledPayload.name} a été enrôlé sous le matricule ${compiledMatricule}.`);
      setShowAddForm(false);
      fetchUsers();
      fetchAuditLogs();
      setFormData({
        firstName: "", lastName: "", login: "", email: "", role: "DOCTOR", password: "",
        mustChangePassword: true, phone: "", department: "Médecine Générale", profession: "Médecin Référent",
        contractType: "CDI", gender: "F", dob: "1988-06-15", address: "BP 42, Quartier Mossinkoré, Mopti",
        nina: "1 88 04 940 210 M", matricule: "", hireDate: "2024-01-10", supervisorId: "user-admin",
        signaturePad: "ACTIVÉ", sealText: "CLINIQUE SAHEL SAHELO-SOUDANAISE - CACHET ACCRÉDITÉ", ordNum: ""
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (resp.ok) {
        setSuccess(`Le statut du compte a été mis à jour avec succès : [ ${newStatus} ]`);
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, status: newStatus } as any);
        }
        fetchUsers();
      }
    } catch {
      setError("Échec d'actualisation du statut de l'habilitation.");
    }
  };

  const handleToggleModulePermission = (modId: string) => {
    if (!selectedUser) return;
    const list = selectedUser.allowedModules || [];
    const updated = list.includes(modId) ? list.filter(i => i !== modId) : [...list, modId];
    setSelectedUser({ ...selectedUser, allowedModules: updated });
  };

  const handleTriggerMockAccessChange = (cellKey: string) => {
    setSuccess(`Habilitation granulaire modifiée avec succès pour le rôle DOCTOR [ ${cellKey} ].`);
    setTimeout(() => setSuccess(""), 4000);
  };

  // Badge Visualizer Helper based on exactly 5 ranks requested (Point 9 Badges de responsabilité)
  const renderResponsibilityBadge = (role: Role, userDept?: string) => {
    // Promoter rule
    if (role === "ADMIN" && userDept === "Direction Générale") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 shadow-sm">
          🌟 PROMOTEUR
        </span>
      );
    }
    // Directeur Général
    if (role === "ADMIN") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-950 text-slate-100 border border-slate-900">
          👑 DIR. GÉNÉRAL
        </span>
      );
    }
    // Médecin Chef
    if (role === "MEDECIN_GENERAL_CHIEF") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-400">
          ⚕️ MÉDECIN CHEF
        </span>
      );
    }
    // Chef de Service
    if (role === "PHARMACIST" || role === "LAB_TECH" || (userDept && userDept.includes("Chef"))) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
          🛡️ CHEF DE SERVICE
        </span>
      );
    }
    // Personnel
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-300">
        🩺 PERSONNEL
      </span>
    );
  };

  const filteredUsers = users.filter(u => {
    const low = searchQuery.toLowerCase();
    const matchQuery = u.name.toLowerCase().includes(low) || 
                       u.email.toLowerCase().includes(low) || 
                       (u.profession && u.profession.toLowerCase().includes(low));
    const matchDept = deptFilter ? u.department === deptFilter : true;
    return matchQuery && matchDept;
  });

  return (
    <div className="space-y-6" id="gov-rbac-panel-v3">
      
      {/* Visual Header Banner for Governance (Point 8 Visual Premium Style) */}
      <div className="bg-gradient-to-r from-[#0F766E] to-[#2563EB] text-white p-6 rounded-[18px] shadow-enterprise flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2 bg-white/10 rounded font-mono text-3xs font-black uppercase">Sécurités & Habilitations</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <h2 className="text-xl font-black tracking-tight uppercase">CENTRE DE GOUVERNANCE HOSPITALIÈRE</h2>
          <p className="text-xs text-white/80 max-w-xl font-sans">
            Administration stratégique, contrôle de sûreté granulaire, audit de conformité de l'établissement et organigramme clinique général de MédiSahel.
          </p>
        </div>

        <div className="bg-[#111827]/40 border border-white/10 p-4 rounded-[12px] flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#0F766E] border border-white/20 flex items-center justify-center font-black text-xs">AS</div>
          <div className="text-3xs leading-tight">
            <p className="font-bold text-white">{currentUser.name}</p>
            <p className="text-white/60 uppercase font-mono">{currentUser.role} • Sahel ERP III</p>
            <p className="text-emerald-400 font-extrabold uppercase mt-1">● SÛRETÉ ACTIVE</p>
          </div>
        </div>
      </div>

      {/* Segment Controllers - Navigation inside Governance (Organigramme made Default Point 2) */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 border-b border-gray-200 pb-1 shrink-0">
        {[
          { id: "organigramme", label: "Hierarchie & Organigramme", icon: GitFork },
          { id: "dashboard", label: "Tableau de Bord Exécutif", icon: Activity },
          { id: "users", label: "Collaborateurs (Fiche 360°)", icon: Users2 },
          { id: "permissions", label: "Matrice des Droits", icon: Layers },
          { id: "departments", label: "Cartes des Départements", icon: Building2 },
          { id: "sessions", label: "Sessions Ouvertes", icon: Clock },
          { id: "audit", label: "Audit & Traçabilité", icon: FileText },
          { id: "security", label: "Politiques Securités & MFA", icon: LockKeyhole }
        ].map(item => {
          const IconComp = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id !== "users") setSelectedUser(null);
              }}
              className={`py-2 px-3.5 rounded-t-xl text-3xs font-black uppercase tracking-wider shrink-0 flex items-center space-x-2 border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? "border-[#0F766E] text-[#0F766E] bg-[#0F766E]/5 font-black" 
                  : "border-transparent text-gray-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <IconComp className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Alerts Feed */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center animate-fade-in">
          <ShieldAlert className="h-4 w-4 mr-2 text-[#DC2626]" /> <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-[#DC2626] font-bold">×</button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center animate-fade-in animate-pulse">
          <ShieldCheck className="h-4 w-4 mr-2 text-[#0F766E]" /> <span>{success}</span>
          <button onClick={() => setSuccess("")} className="ml-auto text-[#0F766E] font-bold">×</button>
        </div>
      )}

      {/* TAB 1: ORGANIGRAMME HOSPITALIER PRINCIPAL (Point 2 Setup hierarchy flow) */}
      {activeTab === "organigramme" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">Hiérarchie Décisionnelle Administrative & Médicale</h3>
              <p className="text-xs text-gray-500">Cartographie opérationnelle de l'établissement du Sahel, des directeurs généraux aux techniciens en salle.</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-3xs font-black uppercase flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" /> Imprimer Organigramme
            </button>
          </div>

          <div className="bg-slate-100/50 p-8 rounded-[18px] border border-gray-200 overflow-x-auto flex flex-col items-center">
            
            {/* Structured diagram */}
            <div className="flex flex-col items-center space-y-8 min-w-[850px]">
              
              {/* RANK INTERMEDIARY 1: Gold Badge (Promoteur) */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-amber-50 to-orange-100/80 border-2 border-amber-400 p-4 rounded-[18px] text-center shadow-md w-72 relative transition-all hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-amber-300">
                      🏆 PROMOTEUR
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-slate-900 text-sm mt-1">Dr. Adama Sangaré</h4>
                  <p className="text-[10px] text-amber-900 font-bold uppercase tracking-wide mt-1">Direction Générale & Sécurités ERP</p>
                  <p className="text-[9px] text-amber-800 italic mt-0.5 font-sans">Fondateur Accrédité IT</p>
                </div>
              </div>

              {/* Vertical link track */}
              <div className="h-6 w-0.5 bg-amber-400"></div>

              {/* RANK INTERMEDIARY 2: Black Badge (Directeur Général) */}
              <div className="flex flex-col items-center">
                <div className="bg-slate-950 text-white border-2 border-slate-900 p-4 rounded-[18px] text-center shadow-md w-72 relative transition-all hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-white text-slate-950 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-900">
                      🌑 DIRECTION GENERALE
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-slate-100 text-sm mt-1">Fatim Kéïta</h4>
                  <p className="text-[9px] text-[#0F766E] font-black uppercase mt-1">Directeur Général Administratif</p>
                  <div className="flex justify-center flex-wrap gap-1 mt-2">
                    <span className="bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">Comptable (Awa)</span>
                    <span className="bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">RH</span>
                    <span className="bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded font-mono">Informatique</span>
                  </div>
                </div>
              </div>

              {/* Vertical link track */}
              <div className="h-6 w-0.5 bg-slate-900"></div>

              {/* RANK INTERMEDIARY 3: Blue Badge (Médecin Chef) */}
              <div className="flex flex-col items-center">
                <div className="bg-white border-2 border-blue-500 p-4 rounded-[18px] text-center shadow-md w-72 relative transition-all hover:-translate-y-1">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                      🩺 SUPERVISION MEDICALE
                    </span>
                  </div>
                  <h4 className="font-sans font-black text-slate-900 text-sm mt-1">Dr. Ibrahim Touré</h4>
                  <p className="text-[10px] text-blue-700 font-black uppercase tracking-wide mt-1">Médecin Chef Département</p>
                  <p className="text-[9px] text-gray-500 font-sans italic">Approbateur des Protocoles de Soins</p>
                </div>
              </div>

              <div className="w-[80%] h-0.5 bg-gray-300"></div>

              {/* Horizontal block splitting into specialty cards */}
              <div className="grid grid-cols-4 gap-4 w-full">
                
                {/* Medicine division */}
                <div className="bg-white p-3 rounded-xl border border-gray-150 text-center relative pt-4 shadow-sm border-t-4 border-t-purple-500">
                  <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                    Médecine Générale
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Chef de Service</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Dr. Ibrahim Touré</p>
                  <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    <span className="text-4xs uppercase block text-gray-400">Personnel Rattaché</span>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium">10 Médecins & Infirmiers</p>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium font-mono">2 Stagiaires • 1 Aide</p>
                  </div>
                </div>

                {/* Lab division */}
                <div className="bg-white p-3 rounded-xl border border-gray-150 text-center relative pt-4 shadow-sm border-t-4 border-t-purple-500">
                  <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                    Laboratoire d'analyses
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Chef Biologiste</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Moussa Coulibaly</p>
                  <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    <span className="text-4xs uppercase block text-gray-400">Personnel Rattaché</span>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium">3 Techniciens Supérieurs</p>
                  </div>
                </div>

                {/* Pharma division */}
                <div className="bg-white p-3 rounded-xl border border-gray-150 text-center relative pt-4 shadow-sm border-t-4 border-t-purple-500">
                  <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                    Pharmacie / Officine
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Chef Pharmacienne</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Aminata Dembélé</p>
                  <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    <span className="text-4xs uppercase block text-gray-400">Personnel Rattaché</span>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium">1 Gestionnaire de Stock</p>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium">1 Caissière d'Officine</p>
                  </div>
                </div>

                {/* Admin division */}
                <div className="bg-white p-3 rounded-xl border border-gray-150 text-center relative pt-4 shadow-sm border-t-4 border-t-slate-800">
                  <span className="bg-slate-100 text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide absolute -top-2.5 left-1/2 transform -translate-x-1/2">
                    Secrétariat / Caisse
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono">Chef Responsable</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">Fatim Kéïta</p>
                  <div className="border-t border-gray-100 mt-2 pt-2 space-y-1">
                    <span className="text-4xs uppercase block text-gray-400">Personnel Rattaché</span>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium">1 Comptable Principal</p>
                    <p className="text-[9px] bg-slate-50 rounded py-0.5 text-slate-600 font-medium font-mono">1 Caissier Principal (Caisse-Central)</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTIVES DASHBOARD VIEW (Point 1 Pro dashboard stats) */}
      {activeTab === "dashboard" && (
        <div className="space-y-6">
          
          {/* Dashboard 8 KPIs Row (Point 1 Dashboard professionnel) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" id="exec-dashboard-stats-row">
            
            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#0F766E] transition-all">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Effectif Total</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-slate-800">{users.length}</span>
                <span className="text-4xs text-gray-400 font-mono uppercase">Agents</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-emerald-500 transition-all">
              <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider block">Présents Auj.</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-emerald-800">{users.filter(u => u.status !=="BLOCKED").length - 1}</span>
                <span className="text-4xs text-emerald-600 font-mono uppercase">Postes</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-amber-500 transition-all">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider block">Personnel Absent</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-amber-800">1</span>
                <span className="text-4xs text-amber-500 font-mono uppercase">Congé</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#0F766E] transition-all">
              <span className="text-[10px] font-mono text-teal-600 uppercase tracking-wider block">Comptes Actifs</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-teal-800">{users.filter(u => u.status === "ACTIVE").length}</span>
                <span className="text-4xs text-teal-600 font-mono uppercase">Habilités</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-orange-500 transition-all">
              <span className="text-[10px] font-mono text-orange-500 uppercase tracking-wider block">Suspendus</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-orange-800">{users.filter(u => u.status === "SUSPENDED").length}</span>
                <span className="text-4xs text-orange-500 font-mono tracking-wider uppercase">Bloqués</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#2563EB] transition-all">
              <span className="text-[10px] font-mono text-[#2563EB] uppercase tracking-wider block">Logins Auj.</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-indigo-850">21</span>
                <span className="text-4xs text-[#2563EB] font-mono uppercase">Sessions</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#0F766E] transition-all">
              <span className="text-[10px] font-mono text-gray-400 block uppercase tracking-wider">Déptms Actifs</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-slate-800">14</span>
                <span className="text-4xs text-gray-400 font-mono uppercase">Fiches</span>
              </div>
            </div>

            <div className="bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#DC2626] transition-all">
              <span className="text-[10px] font-mono text-[#DC2626] uppercase tracking-wider block font-bold">Alertes Sûreté</span>
              <div className="flex items-baseline gap-1 mt-2.5">
                <span className="text-2xl font-black text-[#DC2626]">3</span>
                <span className="text-[8px] bg-red-50 text-red-700 px-1 py-0.5 rounded uppercase font-bold text-4xs leading-none">Menaces</span>
              </div>
            </div>

          </div>

          {/* Graphics Plots and Histograms Row (Point 1 Graphs specifications) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-graphics">
            
            {/* Chart 1: Répartition par département */}
            <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Répartition effective du Personnel par Département</h4>
                <p className="text-[10px] text-gray-400">Nombre d'agents affectés sur les 14 services hospitaliers de Mopti</p>
              </div>

              <div className="space-y-3">
                {[
                  { name: "Direction Générale & Administrations", value: 4, width: "80%", color: "bg-[#0F766E]", count: "4 agents" },
                  { name: "Médecine Générale (DMG) / Urgences", value: 12, width: "100%", color: "bg-[#2563EB]", count: "12 agents" },
                  { name: "Biologie Médicale & Laboratoires", value: 4, width: "45%", color: "bg-purple-600", count: "4 agents" },
                  { name: "Gestion Stocks & Pharmacie", value: 3, width: "35%", color: "bg-emerald-500", count: "3 agents" },
                  { name: "Gestation Financières & Caisses", value: 3, width: "35%", color: "bg-orange-500", count: "3 agents" }
                ].map((item, id) => (
                  <div key={id} className="space-y-1">
                    <div className="flex justify-between items-center text-3xs font-medium">
                      <span className="text-slate-700">{item.name}</span>
                      <span className="font-mono text-slate-900 font-bold">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: item.width }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Répartition par fonction */}
            <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Pyramide des Rôles Médicaux & Fonctions</h4>
                <p className="text-[10px] text-gray-400">Distribution hiérarchique selon les fiches RH validées V3</p>
              </div>

              <div className="space-y-3">
                {[
                  { title: "Directeurs & Promoteurs (ADMIN)", percentage: "20%", count: "3 Agents", width: "w-[20%]" },
                  { title: "Médecins Spécialistes / Référents (DOCTOR)", percentage: "55%", count: "8 Agents", width: "w-[55%]" },
                  { title: "Infirmier.e.s d'État (NURSE)", percentage: "75%", count: "11 Agents", width: "w-[75%]" },
                  { title: "Techniciens de Santé (LAB, PHARM)", percentage: "40%", count: "6 Agents", width: "w-[40%]" },
                  { title: "Auxiliaires de soins / Caissiers (CASHIER, AIDE)", percentage: "30%", count: "4 Agents", width: "w-[30%]" }
                ].map((row, idx) => (
                  <div key={idx} className="flex items-center justify-between text-3xs border-b border-gray-50 pb-2">
                    <div className="flex-1">
                      <p className="font-bold text-slate-700">{row.title}</p>
                      <div className="w-full bg-slate-100 h-1.5 rounded mt-1 overflow-hidden">
                        <div className={`h-full bg-teal-600 ${row.width}`}></div>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <span className="font-mono text-slate-800 font-black">{row.count}</span>
                      <span className="block text-[8px] text-gray-400">{row.percentage}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Activité des connexions */}
            <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
              <div className="border-b border-gray-100 pb-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-705">Activité horaire des Connexions (Trafic)</h4>
                <p className="text-[10px] text-gray-400">Volume de requêtes SQL et authentifications traitées aujourd'hui</p>
              </div>

              <div className="flex items-end justify-between h-40 pt-4 bg-slate-50 border border-slate-100 rounded-xl px-4">
                {[
                  { hr: "08h", height: "h-[45%]", req: "50" },
                  { hr: "10h", height: "h-[85%]", req: "110" },
                  { hr: "12h", height: "h-[98%]", req: "140" },
                  { hr: "14h", height: "h-[65%]", req: "80" },
                  { hr: "16h", height: "h-[50%]", req: "65" },
                  { hr: "18h", height: "h-[30%]", req: "35" }
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center flex-grow space-y-2">
                    <span className="text-[8px] font-mono font-bold text-gray-400">{bar.req} SQL</span>
                    <div className={`w-8 ${bar.height} bg-[#0F766E]/80 rounded-t-md hover:bg-[#0F766E] transition-colors relative`}></div>
                    <span className="text-4xs font-mono font-bold text-slate-800">{bar.hr}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Historique des incidents */}
            <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between">
              <div>
                <div className="border-b border-gray-100 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-500">Flux d'incidents & Alarmes de Sûreté</h4>
                  <p className="text-[10px] text-gray-400">Registre des comportements malveillants révoqués par l'ERP</p>
                </div>

                <div className="divide-y divide-gray-100 mt-2 space-y-2">
                  <div className="flex items-start justify-between text-3xs py-2">
                    <div>
                      <span className="bg-red-50 text-[#DC2626] font-bold font-mono px-1.5 py-0.5 rounded text-4xs uppercase">CRITIQUE</span>
                      <p className="font-bold text-slate-800 mt-1">Brute-Force Mot de Passe</p>
                      <p className="text-slate-500">IP 196.12.99.102 (Sevaré) - Bloqué après 3 échecs</p>
                    </div>
                    <span className="text-gray-450 font-mono text-[9px]">Il y a 30m</span>
                  </div>
                  <div className="flex items-start justify-between text-3xs py-2">
                    <div>
                      <span className="bg-amber-50 text-amber-700 font-bold font-mono px-1.5 py-0.5 rounded text-4xs uppercase">AVERTISSEMENT</span>
                      <p className="font-bold text-slate-800 mt-1">Accès Non-Habilité refusé</p>
                      <p className="text-slate-500">Agent fdiarra a tenté de charger le module 'Ressources de Paie'.</p>
                    </div>
                    <span className="text-gray-450 font-mono text-[9px]">Il y a 2h</span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setActiveTab("security")}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold uppercase rounded-xl text-3xs mt-4 tracking-wider"
              >
                Supervision Sécurité global &rarr;
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: FICHE COLLABORATEUR AVEC DETAILED PANELS EN 8 TABS (Point 3 Setup colaborador fiche) */}
      {activeTab === "users" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1 max-w-xl flex gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par collaborateur, matricule, spécialité..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-9 w-full bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                />
              </div>
              <select
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                className="h-9 bg-slate-50 border border-gray-200 rounded-xl text-xs px-2"
              >
                <option value="">Tous les Départements</option>
                {DEPARTMENTS.map(d => (
                  <option key={d.id} value={d.label}>{d.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setShowAddForm(true);
                setSelectedUser(null);
              }}
              className="px-4 py-2.5 bg-[#0F766E] hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-enterprise"
            >
              <UserPlus className="h-4 w-4" /> Recruter Collaborateur
            </button>
          </div>

          {/* Recrutement Form Card (Point 10 Affectation interactive de hierarchie lors de la creation) */}
          {showAddForm && (
            <form onSubmit={handleEnrollUser} className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-md space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h4 className="font-sans font-black text-sm uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-4.5 w-4.5 text-[#0F766E]" />
                  Enrôlement Hiérarchique & Affectation du Collaborateur
                </h4>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-slate-800">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Prénom*</label>
                  <input
                    type="text" required
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="Fatoumata"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Nom de Famille*</label>
                  <input
                    type="text" required
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="Diarra"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Identifiant Unique (Login)*</label>
                  <input
                    type="text" required
                    value={formData.login}
                    onChange={e => setFormData({ ...formData, login: e.target.value.toLowerCase().replace(/\s+/g,"") })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono"
                    placeholder="e.g. fdiarra"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">E-mail Institutionnel*</label>
                  <input
                    type="email" required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="fdiarra@medisahel.ml"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Téléphone Principal*</label>
                  <input
                    type="text" required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono"
                    placeholder="+223 60 44 55 66"
                  />
                </div>
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">N° Matricule Unique (Optionnel)</label>
                  <input
                    type="text"
                    value={formData.matricule}
                    onChange={e => setFormData({ ...formData, matricule: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono"
                    placeholder="Généré automatiquement si vide"
                  />
                </div>
                
                {/* Département selection */}
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Département Affecté*</label>
                  <select
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d.id} value={d.label}>{d.label}</option>
                    ))}
                  </select>
                </div>

                {/* Service lié selection */}
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Service Médical Interne / Unité*</label>
                  <input
                    type="text" required
                    value={formData.profession}
                    onChange={e => setFormData({ ...formData, profession: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                    placeholder="Infirmière Hospitalière"
                  />
                </div>

                {/* Supérieur hiérarchique matching (Point 10 supervisor binding) */}
                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Supérieur Hiérarchique*</label>
                  <select
                    value={formData.supervisorId}
                    onChange={e => setFormData({ ...formData, supervisorId: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="user-admin">Dr. Adama Sangaré (Promoteur - Direction)</option>
                    <option value="user-chief">Dr. Ibrahim Touré (Médecin Chef - Soins)</option>
                    <option value="user-dg">Fatim Kéïta (Directrice Générale - Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Rôle Principal Accrédité*</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                    className="w-full h-9 px-2 bg-slate-50 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="DOCTOR">Médecin de Spécialité / Référent</option>
                    <option value="MEDECIN_GENERAL_CHIEF">Médecin Chef Département</option>
                    <option value="NURSE">Personnel Infirmier</option>
                    <option value="PHARMACIST">Pharmacien Hospitalier</option>
                    <option value="LAB_TECH">Technicien Supérieur Biologie</option>
                    <option value="CASHIER">Caissier Principal</option>
                    <option value="ADMIN">Administrateur Système IT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Type de Contrat*</label>
                  <select
                    value={formData.contractType}
                    onChange={e => setFormData({ ...formData, contractType: e.target.value })}
                    className="w-full h-9 px-2 bg-slate-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="CDI">CDI (Contrat Durée Indéterminée)</option>
                    <option value="CDD">CDD (Contrat Durée Déterminée)</option>
                    <option value="PRESTATAIRE">Consultant / Prestataire</option>
                    <option value="STAGE">Convention de Stage Médicale</option>
                  </select>
                </div>

                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Code National NINA (Mali)*</label>
                  <input
                    type="text" required
                    value={formData.nina}
                    onChange={e => setFormData({ ...formData, nina: e.target.value })}
                    className="w-full h-9 px-3 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono"
                    placeholder="1 88 04 940 210 M"
                  />
                </div>

                <div>
                  <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1 font-bold text-[#0F766E]">Mot de Passe de Connexion Base*</label>
                  <input
                    type="password" required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full h-9 px-3 bg-[#0F766E]/5 border border-[#0F766E]/25 rounded-xl text-xs font-mono"
                    placeholder="Saisir initiale secrète"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button" onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0F766E] hover:bg-teal-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-enterprise cursor-pointer"
                >
                  Valider Recrutement & Générer Habilitation
                </button>
              </div>
            </form>
          )}

          {/* Fiche Collaborateur 360 Open State (Point 3 Complete Fiche Collaborateur en 8 tabs) */}
          {selectedUser && (
            <div className="bg-white rounded-[18px] border border-gray-150 shadow-md overflow-hidden animate-fade-in" id="ficha-colaborateur-360">
              
              {/* Header block with badges */}
              <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-slate-800 text-[#0F766E] font-black border-2 border-slate-700 flex items-center justify-center text-lg shadow-inner">
                    {selectedUser.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-black text-slate-100 text-base">{selectedUser.name}</span>
                      {renderResponsibilityBadge(selectedUser.role, selectedUser.department)}
                    </div>
                    <p className="text-xs text-gray-400 font-sans mt-0.5">
                      Matricule: <span className="font-mono font-bold text-[#0F766E]">{selectedUser.matricule || "MS-9941"}</span> • {selectedUser.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-3xs">
                  <button
                    onClick={() => handleUpdateUserStatus(selectedUser.id, selectedUser.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                    className={`h-8 px-3 rounded-lg font-bold uppercase transition-all ${
                      selectedUser.status === "ACTIVE" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {selectedUser.status === "ACTIVE" ? "Suspendre" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(selectedUser.id, "BLOCKED")}
                    className="h-8 px-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg font-bold uppercase"
                  >
                    Bloquer
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="h-8 w-8 rounded-full bg-slate-800 text-gray-400 hover:text-white flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Fiche Tab Selectors (Exactly 8 tabs defined in requirements Point 3) */}
              <div className="flex flex-nowrap overflow-x-auto bg-slate-50 border-b border-gray-150 p-2 gap-1 pb-1 shrink-0">
                {[
                  { id: "identity", label: "Informations" },
                  { id: "access", label: "Accès & Habilitations" },
                  { id: "documents", label: "Documents GED" },
                  { id: "contract", label: "Contrat Travail" },
                  { id: "salary", label: "Salaire & Grille" },
                  { id: "presences", label: "Présences & Shifts" },
                  { id: "history", label: "Historique Activités" },
                  { id: "audit", label: "Audit Traçabilité" }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setProfile360Tab(item.id as any)}
                    className={`py-1.5 px-3.5 rounded-lg text-3xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      profile360Tab === item.id 
                        ? "bg-white text-[#0F766E] shadow-sm font-black border border-gray-200" 
                        : "text-gray-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Extended Panels */}
              <div className="p-5 text-xs font-sans text-slate-700 min-h-[300px]">
                
                {/* PANEL 1: Identity & Infos */}
                {profile360Tab === "identity" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                      <h5 className="font-bold text-slate-850 uppercase border-b pb-1 font-mono text-[10px]">Identité Physique</h5>
                      <p><strong>Nom complet:</strong> {selectedUser.name}</p>
                      <p><strong>Genre:</strong> {selectedUser.gender || "Femme / Homme"}</p>
                      <p><strong>Identifiant system:</strong> @{selectedUser.login}</p>
                      <p><strong>N° NINA National:</strong> {selectedUser.nina || "1 88 04 940 210 M"}</p>
                    </div>

                    <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                      <h5 className="font-bold text-slate-850 uppercase border-b pb-1 font-mono text-[10px]">Coordonnées de communication</h5>
                      <p><strong>Téléphone mobile:</strong> {selectedUser.phone || "+223 76 11 22 33"}</p>
                      <p><strong>E-mail d'accès:</strong> {selectedUser.email}</p>
                      <p><strong>Adresse de résidence:</strong> BP 12, Quartier Commercial Mopti</p>
                    </div>

                    <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                      <h5 className="font-bold text-slate-850 uppercase border-b pb-1 font-mono text-[10px]">Hiérarchie Hospitalière</h5>
                      <p><strong>Département affecté:</strong> {selectedUser.department}</p>
                      <p><strong>Fonction accréditée:</strong> {selectedUser.profession || "Soin"}</p>
                      <p><strong>Supérieur Direct:</strong> Dr. Adama Sangaré (Promoteur)</p>
                    </div>
                  </div>
                )}

                {/* PANEL 2: Allowed modules */}
                {profile360Tab === "access" && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-[12px] border border-gray-150">
                      <h5 className="font-black text-[10px] uppercase font-mono tracking-wider text-[#0F766E] mb-1">Autorisations des Modules ERP</h5>
                      <p className="text-3xs text-gray-400">Sélectionnez les modules autorisés pour ce profil personnel rattaché.</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: "patients", label: "🏥 Admissions & Patients" },
                        { id: "dme", label: "📂 Dossiers Médicaux (DME)" },
                        { id: "dmg", label: "🩺 Consultations (DMG)" },
                        { id: "hospitalization", label: "🛏️ Hospitalisation & Lits" },
                        { id: "pharmacy", label: "💊 Pharmacie & Officine" },
                        { id: "lab", label: "🧪 Laboratoire d'Analyses" },
                        { id: "billing", label: "💰 Facturation & Caisses" },
                        { id: "presences", label: "👥 Présences des personnels" }
                      ].map(mod => {
                        const isGranted = (selectedUser.allowedModules || []).includes(mod.id);
                        return (
                          <button
                            type="button"
                            key={mod.id}
                            onClick={() => handleToggleModulePermission(mod.id)}
                            className={`p-3 rounded-xl border text-left text-3xs font-semibold flex items-center justify-between transition-all ${
                              isGranted 
                                ? "bg-teal-50 border-teal-300 text-teal-850" 
                                : "bg-white border-gray-200 text-gray-500 hover:bg-slate-50"
                            }`}
                          >
                            <span>{mod.label}</span>
                            <span>{isGranted ? "✅" : "❌"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* PANEL 3: Documents GED */}
                {profile360Tab === "documents" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 rounded-[12px] p-4 bg-slate-50/50 space-y-3">
                      <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-800">Dossier Certificats & Pièces Jointes</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                          <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-[#0F766E]" /> Contrat_Travail_Signe.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">CONFORME</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                          <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-[#0F766E]" /> Attestation_Diplome_Medecine.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">ACCRÉDITÉ</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100">
                          <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-[#0F766E]" /> Copie_NINA_Conforme.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">CONFORME</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-[12px] p-4 bg-white flex flex-col items-center justify-center text-center space-y-2">
                      <span className="text-2xl">📤</span>
                      <p className="font-black text-[10px] uppercase font-mono tracking-wider text-slate-700">Importer un nouveau justificatif</p>
                      <p className="text-3xs text-gray-400">PDF, JPG, PNG signés numériquement de taille maximale à 5 Mo</p>
                      <button type="button" className="px-3 py-1 bg-[#0F766E] text-white rounded font-bold hover:bg-teal-800 text-3xs">Uploader</button>
                    </div>
                  </div>
                )}

                {/* PANEL 4: Contrat Travail */}
                {profile360Tab === "contract" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 bg-slate-50/50 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1">Statut Contractuel de l'agent</h5>
                      <p><strong>Type de Contrat de travail:</strong> {selectedUser.contractType || "CDI"}</p>
                      <p><strong>Date légale d'embauche:</strong> {selectedUser.hireDate || "2024-01-10"}</p>
                      <p><strong>Durée de période d'essai:</strong> 3 Mois (Validé)</p>
                      <p><strong>Lieu légal d'exercice:</strong> Sahelienne Polyclinique, Mopti</p>
                    </div>

                    <div className="border border-gray-150 bg-white rounded-xl p-4 space-y-2">
                      <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1">Heures & Présences Prévues</h5>
                      <p><strong>Volume horaire hebdomadaire:</strong> 40 Heures / Semaine</p>
                      <p><strong>Horaires de garde types:</strong> Roster Unifié Hospitalier (Équipes Jour / Nuit alternées)</p>
                      <span className="text-3xs bg-[#2563EB]/10 text-[#2563EB] px-2 py-0.5 rounded-full font-mono font-bold">CONVENTION CONFORME</span>
                    </div>
                  </div>
                )}

                {/* PANEL 5: Salaire & Bank */}
                {profile360Tab === "salary" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 bg-slate-50/50 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1 text-[#0F766E]">Salaire Hospitalier & Indemnités</h5>
                      <p><strong>Salaire de Base Brut mensuel:</strong> 450 000 FCFA</p>
                      <p><strong>Primes de technicité médicale:</strong> 72 000 FCFA/mois</p>
                      <p><strong>Indemnité de logement & garde:</strong> 50 000 FCFA/mois</p>
                      <p><strong>Net à payer estimé:</strong> 492 500 FCFA</p>
                    </div>

                    <div className="border border-gray-150 bg-white rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1 text-slate-800">Coordonnées de virement</h5>
                      <p><strong>Domiciliation Bancaire:</strong> BDM SA (Malian Development Bank) - Mopti</p>
                      <p><strong>Identifiant BAN / IBAN:</strong> ML21 40994 00021 948123 0928</p>
                      <span className="text-[8px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-black uppercase tracking-widest block w-max border border-emerald-200">Visa Comptabilité: OK</span>
                    </div>
                  </div>
                )}

                {/* PANEL 6: Présences & Gardes */}
                {profile360Tab === "presences" && (
                  <div className="space-y-4">
                    <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-800">Pointage des Accès Clinique</h5>
                    <div className="space-y-2 font-mono text-3xs">
                      <div className="flex justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span>Lundi 08 Juin - Badgeage Entrée</span>
                        <span className="text-emerald-700 font-bold">07:58:11 (CONFORME)</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span>Lundi 08 Juin - Badgeage Sortie</span>
                        <span className="text-emerald-700 font-bold">16:32:01 (CONFORME)</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-50 border border-slate-100 rounded-lg">
                        <span>Mardi 09 Juin - Badgeage Entrée</span>
                        <span className="text-[#0F766E] font-bold">08:02:11 (À L'HEURE)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 7: Historique Clinique */}
                {profile360Tab === "history" && (
                  <div className="space-y-4">
                    <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-850">Historique des actes rattachés rattaché</h5>
                    <div className="text-3xs space-y-1.5 font-mono">
                      <p className="p-2 bg-[#2563EB]/5 rounded border-l-2 border-[#2563EB]">1. Validation finale de la consultation ambulatoire pour Diarra Amadou (Hier)</p>
                      <p className="p-2 bg-[#2563EB]/5 rounded border-l-2 border-[#2563EB]">2. Ordonnance médicale émise contenant Amoxicilline et Paracétamol (Hier)</p>
                    </div>
                  </div>
                )}

                {/* PANEL 8: Audit log */}
                {profile360Tab === "audit" && (
                  <div className="space-y-4">
                    <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-red-650">Registre de Sécurités de {selectedUser.name}</h5>
                    <div className="space-y-2">
                      <div className="p-3 bg-[#111827] text-[#0F766E] rounded-xl font-mono text-3xs space-y-1">
                        <p><strong>[LOGIN SUCCESS]</strong> Authentification 2FA validée via IP 192.168.1.100 (Aujourd'hui)</p>
                        <p><strong>[DME_VIEW]</strong> Consultation confidentielle du patient Sacko Mariam (MédiSahel V3)</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Table display of agents */}
          <div className="bg-white rounded-[18px] border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-mono text-3xs uppercase tracking-widest text-gray-400">
                    <th className="py-3 px-6">Collaborateur</th>
                    <th className="py-3 px-6">Matricule</th>
                    <th className="py-3 px-6">Département Affectation</th>
                    <th className="py-3 px-6">Statut Sûreté</th>
                    <th className="py-3 px-6 text-right">Action Visibilité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8.5 w-8.5 rounded-full bg-[#0F766E]/5 text-[#0F766E] border border-[#0F766E]/20 flex items-center justify-center font-black uppercase text-3xs">
                            {u.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-none">{u.name}</p>
                            <p className="text-4xs text-gray-400 font-mono mt-1 uppercase tracking-wider">{u.profession || "Personnel Hospitalier"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[10px] font-bold text-[#0F766E]">
                        {u.matricule || "MS-2026-CH01"}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-semibold text-slate-800">{u.department}</span>
                        <span className="block text-[8px] text-gray-400 uppercase tracking-widest mt-0.5">{u.contractType || "CDI"}</span>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-4xs font-black uppercase tracking-wide border ${
                          u.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                            : "bg-red-50 text-red-800 border-red-300"
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setProfile360Tab("identity");
                            setShowAddForm(false);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-4xs font-extrabold uppercase tracking-wide cursor-pointer"
                        >
                          Dossier 360°
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: PERMISSIONS MATRIX WITH ON/OFF SWITCHES (Point 4 Switch ON/OFF Matrix) */}
      {activeTab === "permissions" && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm">
            <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">ON/OFF Matrice interactive d'Accréditations des Habilitations</h3>
            <p className="text-xs text-gray-400">Modifiez instantanément les droits opérationnels de chaque module thérapeutique de l'ERP hospitalier.</p>
          </div>

          <div className="bg-white rounded-[18px] border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-150 font-mono text-3xs uppercase tracking-widest text-gray-400">
                    <th className="py-3.5 px-6">Modules Hospitaliers</th>
                    {["Voir", "Créer", "Modifier", "Supprimer", "Imprimer", "Exporter", "Valider", "Signer"].map((headerLabel, idx) => (
                      <th key={idx} className="py-3.5 px-4 text-center">{headerLabel}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700 font-sans">
                  {[
                    { id: "patients", label: "🏥 Admissions & Patients" },
                    { id: "dme", label: "📂 Dossiers Médicaux Confidentiels (DME)" },
                    { id: "lab", label: "🧪 Laboratoire & Hématologie" },
                    { id: "pharmacy", label: "💊 Pharmacie & Officine" },
                    { id: "billing", label: "💰 Facturation & Caisses" },
                    { id: "presences", label: "👥 Gestion des Présences (RH)" },
                    { id: "documents", label: "📄 Courriers & Archives (GECD)" },
                    { id: "emailing", label: "📧 Communication Emailing" }
                  ].map(mod => (
                    <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-6 font-bold text-slate-800">{mod.label}</td>
                      {["VIEW", "CREATE", "EDIT", "DELETE", "PRINT", "EXPORT", "VALIDATE", "APPROVE"].map((actionType, idy) => {
                        const cellKey = `${mod.id}:${actionType}`;
                        // Visual check default based on doctor
                        const isChecked = DEFAULT_ROLE_PERMISSIONS.DOCTOR.includes(`${mod.id}:${actionType === "APPROVE" ? "VALIDATE" : actionType}`) || actionType == "VIEW";
                        return (
                          <td key={idy} className="py-3.5 px-4 text-center">
                            
                            {/* Visual Toggle Switch ON/OFF (Point 4 Switch ON/OFF with relative colors) */}
                            <button
                              type="button"
                              onClick={() => handleTriggerMockAccessChange(cellKey)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isChecked ? "bg-[#0F766E]" : "bg-gray-250"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  isChecked ? "translate-x-5" : "translate-x-0"
                                }`}
                              ></span>
                            </button>

                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CARTE DES DEPARTEMENTS (Point 5 Card of Departments) */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm">
            <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">Les 14 Départements & Services Spécialisés de la Clinique</h3>
            <p className="text-xs text-gray-500">Cartographie unifiée avec supervision de service, nombre d'agents et unités médicales subordonnées.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEPARTMENTS.map(dept => (
              <div key={dept.id} className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col justify-between hover:border-[#0F766E] transition-all relative">
                
                {/* Visual Department Badge */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="p-1 px-2.5 bg-[#0F766E]/5 text-[#0F766E] font-mono text-3xs font-black rounded uppercase">
                      Code: {dept.id}
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 rounded-full border border-emerald-200">
                      SÛRETÉ OK
                    </span>
                  </div>

                  <h4 className="font-sans font-black text-slate-800 text-sm">{dept.label}</h4>
                  <p className="text-2xs text-gray-500 leading-normal">{dept.desc}</p>
                </div>

                {/* Supervisor, staff and services info (Point 5 requirements) */}
                <div className="border-t border-gray-100 mt-4 pt-3.5 space-y-2.5 text-3xs">
                  <div className="flex justify-between text-gray-600">
                    <div>
                      <span className="block text-[8px] uppercase text-gray-400 font-mono">Chef de service</span>
                      <strong className="text-slate-800 text-2xs">{dept.chef}</strong>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] uppercase text-gray-400 font-mono">Personnel affecté</span>
                      <strong className="text-slate-800 text-2xs">{dept.staffCount} Agents</strong>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[8px] uppercase text-gray-400 font-mono mb-1">Services liés</span>
                    <div className="flex flex-wrap gap-1">
                      {dept.services.map((serv, index) => (
                        <span key={index} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-100">
                          {serv}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SESSIONS ACTIVES (Point 6 Sessions actives interface) */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-850 uppercase tracking-wider">Supervision des Sessions Actives & Connexions Postes</h3>
              <p className="text-xs text-gray-500">Contrôlez les terminaux accédant actuellement au système. Possibilité de déconnexion d'urgence.</p>
            </div>
            <button
              onClick={() => {
                setActiveSessions([]);
                setSuccess("Toutes les sessions de l'ERP hospitalier ont été déconnectées pour des raisons de sûreté.");
              }}
              className="px-4 py-2 bg-[#DC2626]/10 hover:bg-[#DC2626]/20 border border-red-300 text-[#DC2626] rounded-xl text-3xs font-black uppercase transition-all"
            >
              Fermer Tous les Accès
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map(sess => (
              <div key={sess.id} className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm hover:border-[#0F766E] transition-all space-y-3 font-sans text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-sans font-black text-slate-800 text-sm leading-none">{sess.userName}</h4>
                    <p className="text-4xs font-mono text-gray-400 uppercase tracking-widest mt-1.5">{sess.role}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-800 px-2 py-0.5 text-4xs font-extrabold border border-emerald-300">
                    POSTE CONNECTÉ
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1 font-mono text-4xs text-slate-600 leading-relaxed">
                  <p><strong>Adresse IP:</strong> {sess.ip}</p>
                  <p><strong>Terminal de connexion:</strong> {sess.device}</p>
                  <p><strong>Emplacement Station:</strong> {sess.station}</p>
                  <p><strong>Heure de connexion:</strong> {sess.loginTime} (Mopti UTC)</p>
                </div>

                <div className="flex gap-2 pt-1 font-mono text-4xs">
                  <button
                    onClick={() => {
                      setActiveSessions(activeSessions.filter(s => s.id !== sess.id));
                      setSuccess(`L'accès actif de l'utilisateur ${sess.userName} a été révoqué avec succès.`);
                    }}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold uppercase rounded-lg border border-gray-200 cursor-pointer"
                  >
                    Déconnecter
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateUserStatus(sess.userId, "SUSPENDED");
                      setActiveSessions(activeSessions.filter(s => s.id !== sess.id));
                    }}
                    className="py-2 px-3 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-100 border border-amber-300 font-extrabold uppercase"
                  >
                    Suspendre
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateUserStatus(sess.userId, "BLOCKED");
                      setActiveSessions(activeSessions.filter(s => s.id !== sess.id));
                    }}
                    className="py-2 px-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-100 border border-red-300 font-extrabold uppercase"
                  >
                    Bloquer
                  </button>
                </div>
              </div>
            ))}
            {activeSessions.length === 0 && (
              <div className="col-span-2 bg-slate-50 border border-dashed text-slate-400 p-8 text-center uppercase font-mono text-3xs rounded-[18px]">
                Aucune session active actuellement.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: BANK-STYLE AUDIT TRAIL (Point 7 Registry design) */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-[18px] border border-gray-150 shadow-sm">
            <h3 className="text-sm font-bold font-mono text-slate-850 uppercase tracking-wider">Registre d'Audit & Journal des Traces de Sûreté</h3>
            <p className="text-xs text-gray-500">Consultation des actions cliniques et d'accès effectuées sur l'ERP MédiSahel.</p>
          </div>

          <div className="bg-white rounded-[18px] border border-gray-150 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 font-mono text-3xs uppercase tracking-widest text-gray-400">
                    <th className="py-3 px-6">Horodatage (UTC)</th>
                    <th className="py-3 px-6">Agent / Habilité</th>
                    <th className="py-3 px-6">Action Réalisée</th>
                    <th className="py-3 px-6">Module Cible</th>
                    <th className="py-3 px-6">Adresse IP</th>
                    <th className="py-3 px-6">Résultat Preuve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans text-slate-700">
                  {[
                    { ts: "09/06/2026 12:45:12", user: "Dr. Ibrahim Touré", role: "MEDECIN_GENERAL_CHIEF", action: "PATIENT_CREATE", module: "Admissions", ip: "192.168.1.105", status: "SUCCESS", details: "Création dossier Sacko Mariam" },
                    { ts: "09/06/2026 11:20:05", user: "Fatoumata Diarra", role: "NURSE", action: "DME_CREATE", module: "DME Confidentiel", ip: "192.168.1.144", status: "SUCCESS", details: "Mise à jour tension patient" },
                    { ts: "09/06/2026 10:15:30", user: "Sékou Coulibaly (Hack)", role: "STAGIAIRE", action: "ACCESS_DENIED", module: "Ressources de Paie", ip: "192.168.5.21", status: "INCIDENT", details: "Tentative d'accès non autorisé" },
                    { ts: "09/06/2026 09:30:41", user: "Fatim Kéïta", role: "ADMIN", action: "EXCEL_EXPORT", module: "Comptabilité", ip: "192.168.1.100", status: "WARNING", details: "Exportation états financiers" },
                    { ts: "09/06/2026 08:00:15", user: "Dr. Adama Sangaré", role: "ADMIN", action: "USER_CREATE", module: "Gouvernance", ip: "192.168.1.100", status: "SUCCESS", details: "Enrôlement Fatoumata Diarra" }
                  ].map((log, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6 font-mono text-slate-500 whitespace-nowrap">{log.ts}</td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <strong className="text-slate-900 block leading-none">{log.user}</strong>
                        <span className="text-[9px] font-mono text-gray-400 uppercase mt-1 block">{log.role}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 p-1 px-1.5 rounded text-4xs">{log.action}</span>
                      </td>
                      <td className="py-3 px-6 font-semibold">{log.module}</td>
                      <td className="py-3 px-6 font-mono text-sky-850 text-3xs">{log.ip}</td>
                      <td className="py-3 px-6">
                        {/* Status reflective representation colors requested Vert Orange Rouge (Point 7 colors) */}
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-4xs font-black uppercase border font-mono tracking-wider ${
                          log.status === "SUCCESS" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                          log.status === "WARNING" ? "bg-amber-50 text-amber-800 border-amber-200" :
                          "bg-red-50 text-red-800 border-red-200 font-extrabold animate-pulse"
                        }`}>
                          {log.status === "SUCCESS" ? "Succès" : log.status === "WARNING" ? "Avertissement" : "Incident"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: POLITIQUES DE SECURITE & MFA CODES */}
      {activeTab === "security" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="security-politics-mfa">
          
          <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <LockKeyhole className="h-4.5 w-4.5 text-[#0F766E]" /> Politique de blocage brute force
              </h4>
              <p className="text-3xs text-gray-400">Verrous d'accès aux infrastructures d'accréditations globales</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <strong className="block text-slate-700">Seuil de blocage bruteforce</strong>
                  <span className="text-3xs text-gray-400">Nombre de tentatives d'accès toléré</span>
                </div>
                <select
                  value={lockoutThreshold}
                  onChange={e => setLockoutThreshold(e.target.value)}
                  className="h-8 pr-6 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                >
                  <option value="3">3 échecs (Haute sécurité)</option>
                  <option value="5">5 échecs (Standard)</option>
                  <option value="10">10 échecs (Souple)</option>
                </select>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <strong className="block text-slate-700">Durée légale de mot de passe</strong>
                  <span className="text-3xs text-gray-400">Intervalle de renouvellement du code requis</span>
                </div>
                <select
                  value={pwdExpiryDays}
                  onChange={e => setPwdExpiryDays(e.target.value)}
                  className="h-8 pr-6 bg-white border border-gray-200 rounded-lg text-xs font-mono"
                >
                  <option value="30">30 Jours</option>
                  <option value="90">90 Jours (Standard)</option>
                  <option value="180">180 Jours</option>
                </select>
              </div>

              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <strong className="block text-slate-700">Double authentification MFA OTP</strong>
                  <span className="text-3xs text-gray-400">Contrôle de sûreté supplémentaire</span>
                </div>
                <button
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`px-3 py-1 text-3xs font-black uppercase rounded-lg cursor-pointer ${
                    mfaEnabled ? "bg-teal-50 text-teal-800 border border-teal-300" : "bg-gray-100 text-gray-500 border border-gray-200"
                  }`}
                >
                  {mfaEnabled ? "Actif" : "Inactif"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSuccess("Politique de sécurité appliquée dans le registre unifié de l'ERP.")}
                className="w-full h-10 bg-[#0F766E] text-white rounded-xl uppercase font-black text-xs tracking-wider cursor-pointer font-sans"
              >
                Appliquer Nouvelles Directives
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
            <div className="border-b border-gray-100 pb-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Cpu className="h-4.5 w-4.5 text-[#0F766E]" /> Jeton OTP actif
              </h4>
              <p className="text-3xs text-gray-400">Simulateur cryptographique de code secret instantané</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50/50 border border-dashed rounded-xl space-y-2">
              <span className="text-4xs font-mono uppercase text-gray-400">Code MFA Temporaire d'accès</span>
              <span className="text-3xl font-mono font-black tracking-widest text-[#0F766E] bg-teal-50 p-2 px-6 rounded-xl border border-teal-200 shadow-sm animate-pulse">
                {Math.floor(100000 + Math.random() * 900000)}
              </span>
              <span className="text-4xs text-gray-400 font-mono">Secret principal : {mfaKey}</span>
            </div>

            <div className="space-y-1">
              <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1">Algorithme Cryptographique Secret</label>
              <input
                type="text"
                value={mfaKey}
                onChange={e => setMfaKey(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50 border border-gray-250 rounded-lg text-xs font-mono"
              />
            </div>

            <button
              onClick={() => setSuccess("La graine racine cryptographique Algorithme a été recalculée.")}
              className="w-full h-9 bg-slate-900 text-white rounded-lg text-3xs font-black uppercase tracking-wider cursor-pointer"
            >
              Régénérer Secret Racine
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
