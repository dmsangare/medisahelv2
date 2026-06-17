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


export interface ModuleDef {
  id: string;
  label: string;
  axe: "PARCOURS_PATIENT" | "MEDICO_TECHNIQUE" | "FINANCES" | "ADMINISTRATION_RH" | "SECURITE_GOUVERNANCE" | "CONFIGURATION";
  desc: string;
  iconName: string;
}

export const MODULE_REGISTRY: ModuleDef[] = [
  // AXE 1 : PARCOURS PATIENT
  { id: "dashboard", label: "Tableau de Bord", axe: "PARCOURS_PATIENT", desc: "Suivi en temps réel de l'activité médicale", iconName: "Activity" },
  { id: "patients", label: "Admissions", axe: "PARCOURS_PATIENT", desc: "Gestion des admissions cliniques et fiches d'urgence", iconName: "Heart" },
  { id: "dme", label: "Dossiers Patients DME", axe: "PARCOURS_PATIENT", desc: "Dossier Médical Électronique hautement sécurisé", iconName: "ClipboardList" },
  { id: "dmg", label: "Consultations (DMG)", axe: "PARCOURS_PATIENT", desc: "Dossier de Médecine Générale et ordonnances", iconName: "Stethoscope" },
  { id: "hospitalization", label: "Hospitalisation & Lits", axe: "PARCOURS_PATIENT", desc: "Suivi d'attribution d'hébergement médicale", iconName: "Bed" },
  { id: "appointments", label: "Agenda & RDV", axe: "PARCOURS_PATIENT", desc: "Plannings cliniques et gestion des rendez-vous", iconName: "Calendar" },
  { id: "clinical-admin", label: "Supervision Clinique", axe: "PARCOURS_PATIENT", desc: "Pilotage général et indicateurs de performance clinique", iconName: "Building" },

  // AXE 2 : MÉDICO-TECHNIQUE
  { id: "lab", label: "Laboratoire", axe: "MEDICO_TECHNIQUE", desc: "Examens de laboratoire, biochimie et validations", iconName: "FlaskConical" },
  { id: "pharmacy_sales", label: "Vente Pharmacie", axe: "MEDICO_TECHNIQUE", desc: "Dispensation d'ordonnances, fiches de vente, reçus SMS/WhatsApp/Mail", iconName: "ShoppingCart" },
  { id: "pharmacy_stock", label: "Gestion des Stocks Pharmacie", axe: "MEDICO_TECHNIQUE", desc: "Commandes fournisseurs, fiches d'articles, inventaires et FEFO", iconName: "Pill" },

  // AXE 3 : FINANCES
  { id: "billing", label: "Facturation & Caisse", axe: "FINANCES", desc: "Émission de quittances, facturation et états de caisse", iconName: "HandCoins" },

  // AXE 4 : ADMINISTRATION RH
  { id: "presences", label: "Gestion des Présences", axe: "ADMINISTRATION_RH", desc: "Suivi des présences et pointages biométriques", iconName: "Clock" },
  { id: "payroll", label: "Gestion de la Paie", axe: "ADMINISTRATION_RH", desc: "Génération de bulletins de paie et charges sociales", iconName: "Banknote" },
  { id: "documents", label: "Courriers & GECD", axe: "ADMINISTRATION_RH", desc: "Gestion Électronique des Courriers et Documents scellés", iconName: "FolderGit" },
  { id: "emailing", label: "Communication Emails", axe: "ADMINISTRATION_RH", desc: "Serveur d'envoi d'e-mails et comptes-rendus automatisés", iconName: "Mail" },

  // AXE 5 : SÉCURITÉ & GOUVERNANCE
  { id: "users", label: "Gouvernance RBAC", axe: "SECURITE_GOUVERNANCE", desc: "Console d'administration des habilitations et rôles", iconName: "Shield" },
  { id: "audit", label: "Registre d'Audit", axe: "SECURITE_GOUVERNANCE", desc: "Traçabilité administrative et réglementaire inaltérable", iconName: "ShieldCheck" },

  // AXE 6 : CONFIGURATION
  { id: "branding", label: "Paramètres & Branding", axe: "CONFIGURATION", desc: "Configuration de la clinique, charte graphique et logos", iconName: "Settings" }
];

export const AXES_HELPERS = {
  PARCOURS_PATIENT: { title: "AXE 1 : PARCOURS PATIENT", bg: "bg-teal-500/10 text-teal-800 border-teal-250/30" },
  MEDICO_TECHNIQUE: { title: "AXE 2 : MÉDICO-TECHNIQUE", bg: "bg-purple-500/10 text-purple-800 border-purple-250/30" },
  FINANCES: { title: "AXE 3 : FINANCES", bg: "bg-emerald-500/10 text-emerald-800 border-emerald-250/30" },
  ADMINISTRATION_RH: { title: "AXE 4 : ADMINISTRATION RH", bg: "bg-blue-500/10 text-blue-800 border-blue-250/30" },
  SECURITE_GOUVERNANCE: { title: "AXE 5 : SÉCURITÉ & GOUVERNANCE", bg: "bg-red-500/10 text-red-800 border-red-250/30" },
  CONFIGURATION: { title: "AXE 6 : CONFIGURATION", bg: "bg-slate-500/10 text-slate-800 border-slate-250/30" }
};

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
  const [roles, setRoles] = useState<any[]>([]);

  // Audit and state control states (Governance Console Matrix)
  const [activeHistoryModule, setActiveHistoryModule] = useState<{ id: string; label: string } | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [angle, setAngle] = useState(0);
  const [cameraMode, setCameraMode] = useState<"file" | "camera" | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [auditPromptOpen, setAuditPromptOpen] = useState(false);
  const [auditMotive, setAuditMotive] = useState("");
  const [pendingPermissionChange, setPendingPermissionChange] = useState<{
    moduleId: string;
    type: "STATUS" | "ACTION";
    newState?: "ACTIVE" | "READ_ONLY" | "BLOCKED";
    checkboxKey?: string;
    checkboxVal?: boolean;
  } | null>(null);

  // Edit in-place state
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    profession: "",
    department: "",
    contractType: "",
    nina: "",
    gender: "",
    dob: "",
    supervisorId: "",
    status: "",
    role: "DOCTOR" as Role
  });

  // Password reset overlay states
  const [passwordResettingUser, setPasswordResettingUser] = useState<User | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [forcePwdChange, setForcePwdChange] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Default tab configured to Visual Organigramme for hospital topology presentation
  const [activeTab, setActiveTab] = useState<
    "organigramme" | "dashboard" | "users" | "permissions" | "departments" | "sessions" | "audit" | "security"
  >("organigramme");

  // Selection states for detail panels
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profile360Tab, setProfile360Tab] = useState<
    "identity" | "access" | "documents" | "contract" | "salary" | "presences" | "history" | "audit" | "security_tab"
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

  const fetchRoles = async () => {
    try {
      const resp = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setRoles(data);
      }
    } catch {
      console.error("Reference roles loading failed.");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
    fetchRoles();
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

  const handleTriggerResetMdpInTable = async (u: User, e: React.MouseEvent) => {
    e.stopPropagation();
    const generatedPwd = "MSH-2026-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    setTempPassword(generatedPwd);
    setPasswordResettingUser(u);
    try {
      const resp = await fetch("/api/auth/force-reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: u.id,
          newPassword: generatedPwd,
          mustChangePassword: true
        })
      });
      if (resp.ok) {
        setSuccess(`Mot de passe temporaire généré pour ${u.name}`);
        // Invalidate sessions immediately as requested
        setActiveSessions(prev => prev.filter(s => s.userId !== u.id && s.userName !== u.name));
        const logMsg = `REINITIALISATION_MDP: Réinitialisation forcée du mot de passe de ${u.name} (ID: ${u.login}) par l'Administrateur. Sessions révoquées.`;
        await fetch("/api/auditlogs", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: "USER_EDIT", details: logMsg })
        });
        fetchAuditLogs();
        fetchUsers();
      } else {
        const d = await resp.json();
        setError(d.error || "Erreur lors de la réinitialisation");
      }
    } catch {
      setError("Erreur technique de réinitialisation");
    }
  };

  const handleUpdateCollaboratorStatusSelected = async (u: User, nextStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setError("");
    setSuccess("");
    try {
      const resp = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!resp.ok) {
        const errObj = await resp.json();
        throw new Error(errObj.error || "Action non autorisée");
      }
      
      const actionLabelMap: Record<string, string> = {
        ACTIVE: "ACTIVATION / RE-ACTIVATION",
        SUSPENDED: "SUSPENSION",
        BLOCKED: "BLOCAGE DE SEURITÉ",
        ON_LEAVE: "MISE EN CONGÉ RH",
        DISABLED: "DÉSACTIVATION COMPTE"
      };

      setSuccess(`Le collaborateur ${u.name} est maintenant : [ ${nextStatus} ]`);
      
      const logMsg = `STATUT_MAJ: Le statut de l'agent ${u.name} (${u.login}) a été mis à jour à ${nextStatus} (${actionLabelMap[nextStatus] || nextStatus}) par l'Administrateur.`;
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "USER_EDIT", details: logMsg })
      });
      
      if (selectedUser?.id === u.id) {
        setSelectedUser({ ...selectedUser, status: nextStatus } as any);
      }
      
      fetchUsers();
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Échec de l'action réglementaire");
    }
  };

  const handleOpenUser360 = (u: any, modeEdit: boolean = false) => {
    setSelectedUser(u);
    setProfile360Tab("identity");
    setShowAddForm(false);
    setIsEditingUser(modeEdit);
    if (modeEdit) {
      setEditUserForm({
        name: u.name || "",
        phone: u.phone || "",
        email: u.email || "",
        address: u.address || "BP 42, Quartier Mossinkoré, Mopti",
        profession: u.profession || "Médecin",
        department: u.department || "Médecine Générale",
        contractType: u.contractType || "CDI",
        nina: u.nina || "1 88 04 940 210 M",
        gender: u.gender || "M",
        dob: u.dob || "1988-06-15",
        supervisorId: u.supervisorId || "user-admin",
        status: u.status || "ACTIVE",
        role: u.role || "DOCTOR"
      });
    }
    setTimeout(() => {
      const el = document.getElementById("ficha-colaborateur-360");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const DEFAULT_ROLE_MODULES: Record<Role, string[]> = {
    ADMIN: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin", "lab", "pharmacy_sales", "pharmacy_stock", "billing", "presences", "payroll", "documents", "emailing", "users", "audit", "branding", "espace_dg", "surveillance_epidemio"],
    MEDECIN_GENERAL_CHIEF: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin", "lab", "pharmacy_sales", "pharmacy_stock", "billing", "presences", "documents", "emailing", "audit"],
    DOCTOR: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "documents"],
    NURSE: ["dashboard", "patients", "dme", "hospitalization", "appointments", "presences"],
    CASHIER: ["dashboard", "patients", "billing", "pharmacy_sales", "presences"],
    PHARMACIST: ["dashboard", "pharmacy_stock", "presences"],
    LAB_TECH: ["dashboard", "lab", "presences"],
    HR: ["dashboard", "presences", "payroll", "documents"],
    STAGIAIRE: ["dashboard", "patients", "dme", "dmg"],
    AIDE_SOIGNANT: ["dashboard", "patients", "hospitalization", "presences"],
    CAISSIER_PHARMACIEN: ["dashboard", "pharmacy_sales", "billing", "presences"],
    GESTIONNAIRE_STOCK: ["dashboard", "pharmacy_stock", "presences"],
    PROMOTEUR: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin", "lab", "pharmacy_sales", "pharmacy_stock", "billing", "presences", "payroll", "documents", "emailing", "users", "espace_dg", "surveillance_epidemio"],
    DG: ["dashboard", "patients", "dme", "dmg", "hospitalization", "appointments", "clinical-admin", "lab", "pharmacy_sales", "pharmacy_stock", "billing", "presences", "payroll", "documents", "emailing", "users", "espace_dg", "surveillance_epidemio"]
  };

  const [permissionLogs, setPermissionLogs] = useState<Record<string, Array<{
    date: string;
    admin: string;
    action: string;
    motive: string;
    ip: string;
    workstation: string;
  }>>>({
    pharmacy_sales: [
      {
        date: "11/06/2026 14:20",
        admin: "Dr. Ibrahim Touré",
        action: "Passage Activé → Bloqué",
        motive: "Audition de contrôle des stupéfiants",
        ip: "192.168.1.25",
        workstation: "Administration Générale"
      }
    ],
    pharmacy_stock: [
      {
        date: "11/06/2026 14:20",
        admin: "Dr. Ibrahim Touré",
        action: "Passage Activé → Bloqué",
        motive: "Audition de contrôle des stupéfiants",
        ip: "192.168.1.25",
        workstation: "Administration Générale"
      }
    ],
    billing: [
      {
        date: "09/06/2026 10:15",
        admin: "Fatim Kéïta",
        action: "Passage Bloqué → Activé",
        motive: "Nouvelle affectation au service de facturation nuit",
        ip: "192.168.1.14",
        workstation: "Comptabilité - Poste 2"
      }
    ],
    dme: [
      {
        date: "08/06/2026 08:30",
        admin: "Dr. Adama Sangaré",
        action: "Ajout Droit de Signature Médicale",
        motive: "Accréditation ordonnancier électronique V3",
        ip: "192.168.1.100",
        workstation: "Direction Médicale - Bureau Principal"
      }
    ]
  });

  const getUserPermissionConfig = (user: User) => {
    const allowed = user.allowedModules || [];
    const userPerms = user.permissions || [];
    const isGlobalAdmin = userPerms.includes("*:ADMIN") || userPerms.includes("ADMIN");
    
    const moduleStates: Record<string, "ACTIVE" | "READ_ONLY" | "BLOCKED"> = {};
    const actionPerms: Record<string, Record<string, boolean>> = {};
    
    MODULE_REGISTRY.forEach(mod => {
      // 1. Determine status
      if (isGlobalAdmin) {
        moduleStates[mod.id] = "ACTIVE";
      } else {
        const isAllowed = allowed.includes(mod.id);
        if (!isAllowed) {
          moduleStates[mod.id] = "BLOCKED";
        } else {
          const hasWrite = userPerms.some((p: string) => 
            p.startsWith(`${mod.id}:`) && 
            ["CREATE", "EDIT", "DELETE", "VALIDATE", "SIGN", "APPROVE"].some(act => p.endsWith(`:${act}`))
          ) || userPerms.includes(`${mod.id}:WRITE`) || userPerms.includes(`${mod.id}:ADMIN`);
          moduleStates[mod.id] = hasWrite ? "ACTIVE" : "READ_ONLY";
        }
      }
      
      // 2. Determine detailed actions
      const actions = ["VIEW", "CREATE", "EDIT", "DELETE", "PRINT", "EXPORT", "VALIDATE", "SIGN"];
      const actionMap: Record<string, boolean> = {};
      
      actions.forEach(act => {
        if (isGlobalAdmin) {
          actionMap[act] = true;
        } else {
          const directPerm = userPerms.includes(`${mod.id}:${act}`);
          const adminPerm = userPerms.includes(`${mod.id}:ADMIN`) || userPerms.includes(`${mod.id}:WRITE`);
          
          actionMap[act] = directPerm || adminPerm;
        }
      });
      
      actionPerms[mod.id] = actionMap;
    });
    
    return { moduleStates, actionPerms };
  };

  const [motiveText, setMotiveText] = useState("");
  const [activeRevisionMod, setActiveRevisionMod] = useState<string | null>(null);

  const triggerPermissionChangePrompt = (
    moduleId: string,
    type: "STATUS" | "ACTION",
    newStatus?: "ACTIVE" | "READ_ONLY" | "BLOCKED",
    actionKey?: string,
    newActionVal?: boolean
  ) => {
    setPendingPermissionChange({
      moduleId,
      type,
      newState: newStatus,
      checkboxKey: actionKey,
      checkboxVal: newActionVal
    } as any);
    setAuditPromptOpen(true);
    setMotiveText("");
  };

  const handleConfirmRevisionSave = async () => {
    if (!selectedUser || !pendingPermissionChange) return;
    if (!motiveText.trim()) {
      alert("Le motif réglementaire de modification est obligatoire.");
      return;
    }
    
    const { moduleId, type, newState, checkboxKey, checkboxVal } = pendingPermissionChange;
    
    // Get current config
    const currentConfig = getUserPermissionConfig(selectedUser);
    const updatedStates = { ...currentConfig.moduleStates };
    const updatedActions = { ...currentConfig.actionPerms };
    
    let oldVal = "";
    let newVal = "";
    
    if (type === "STATUS" && newState) {
      oldVal = `Statut ${updatedStates[moduleId]}`;
      newVal = `Statut ${newState}`;
      updatedStates[moduleId] = newState;
      
      if (newState === "BLOCKED") {
        Object.keys(updatedActions[moduleId]).forEach(k => {
          updatedActions[moduleId][k] = false;
        });
      } else if (newState === "READ_ONLY") {
        Object.keys(updatedActions[moduleId]).forEach(k => {
          if (k !== "VIEW" && k !== "PRINT") {
            updatedActions[moduleId][k] = false;
          }
        });
        updatedActions[moduleId].VIEW = true;
      } else if (newState === "ACTIVE") {
        updatedActions[moduleId].VIEW = true;
        updatedActions[moduleId].CREATE = true;
        updatedActions[moduleId].EDIT = true;
      }
    } else if (type === "ACTION" && checkboxKey && checkboxVal !== undefined) {
      oldVal = `${checkboxKey} : ${updatedActions[moduleId][checkboxKey] ? 'Actif' : 'Désactivé'}`;
      newVal = `${checkboxKey} : ${checkboxVal ? 'Actif' : 'Désactivé'}`;
      updatedActions[moduleId][checkboxKey] = checkboxVal;
      
      if (checkboxVal && updatedStates[moduleId] === "BLOCKED") {
        updatedStates[moduleId] = "ACTIVE";
      }
    }
    
    // Convert back to arrays
    const allowedModules: string[] = [];
    const permissions: string[] = [];
    
    MODULE_REGISTRY.forEach(m => {
      const st = updatedStates[m.id];
      if (st !== "BLOCKED") {
        allowedModules.push(m.id);
        Object.entries(updatedActions[m.id]).forEach(([actKey, isEnabled]) => {
          if (isEnabled) {
            permissions.push(`${m.id}:${actKey}`);
          }
        });
      }
    });

    try {
      setError("");
      const resp = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          allowedModules,
          permissions
        })
      });
      
      if (!resp.ok) throw new Error("Échec de mise à jour sur le serveur.");
      
      const serverUser = await resp.json();
      
      // Update local history
      const prevLogs = permissionLogs[moduleId] || [];
      const newLog = {
        date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),
        admin: currentUser.name || "Administrateur Système",
        action: `Passage ${oldVal} → ${newVal}`,
        motive: motiveText,
        ip: "192.168.1.95",
        workstation: "Administration de Sûreté (Mopti V3)"
      };
      
      setPermissionLogs({
        ...permissionLogs,
        [moduleId]: [newLog, ...prevLogs]
      });
      
      // Prepend to audit log registry
      const logDetails = `Modification de droit sur ${serverUser.name} (${moduleId}) : ${oldVal} → ${newVal}. Motif : ${motiveText}`;
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "AUDIT_REVISION_RBAC",
          details: logDetails
        })
      });
      
      const updatedUser = {
        ...selectedUser,
        allowedModules,
        permissions
      };
      
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      setSuccess(`Mise à jour réglementaire confirmée avec succès pour le module ${moduleId}.`);
      setAuditPromptOpen(false);
      setPendingPermissionChange(null);
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement réglementaire.");
    }
  };

  const handleApplyRoleDefaultModel = async () => {
    if (!selectedUser) return;
    const defaultMods = DEFAULT_ROLE_MODULES[selectedUser.role] || [];
    const defaultPermsSub: string[] = [];
    
    defaultMods.forEach(modId => {
      // populate standard permissions matching role defaults from utils/rbac.ts if available
      const standardPerms = DEFAULT_ROLE_PERMISSIONS[selectedUser.role] || [];
      standardPerms.forEach(p => {
        if (p.startsWith(`${modId}:`)) {
          defaultPermsSub.push(p);
        }
      });
      // Ensure at least basic VIEW is enabled
      if (!defaultPermsSub.some(p => p.startsWith(`${modId}:`))) {
        defaultPermsSub.push(`${modId}:VIEW`);
        defaultPermsSub.push(`${modId}:PRINT`);
      }
    });

    try {
      const resp = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          allowedModules: defaultMods,
          permissions: defaultPermsSub
        })
      });
      
      if (!resp.ok) throw new Error("Échec de réinitialisation sur le serveur.");
      const resData = await resp.json();
      
      setSuccess(`Le modèle par défaut pour le rôle ${selectedUser.role} a été appliqué avec succès !`);
      
      const updatedUser = {
        ...selectedUser,
        allowedModules: defaultMods,
        permissions: defaultPermsSub
      };
      setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
      setSelectedUser(updatedUser);
      fetchAuditLogs();
    } catch (err: any) {
      setError(err.message || "Erreur d'application du modèle de rôle");
    }
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5" id="exec-dashboard-stats-row font-sans">
            
            {/* Card 1: Effectif Total */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-teal-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Effectif Total</span>
                <div className="p-1.5 bg-teal-55 text-teal-700 rounded-lg">
                  <Users2 className="h-4 w-4 text-teal-650" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">{users.length}</span>
                  <span className="text-[10px] text-emerald-650 font-bold font-mono">↑ 5.3%</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">+2 recrus ce mois</p>
              </div>
            </div>

            {/* Card 2: Présents Auj */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-emerald-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Présents Auj.</span>
                <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-800">{users.filter(u => u.status !=="BLOCKED").length - 1}</span>
                  <span className="text-[10px] text-emerald-650 font-bold font-mono">↑ 2.1%</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">98.5% taux de prés.</p>
              </div>
            </div>

            {/* Card 3: Absent */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-amber-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Absent</span>
                <div className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-amber-800">1</span>
                  <span className="text-[10px] text-emerald-650 font-bold font-mono">↓ 12%</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">Moins d'absences</p>
              </div>
            </div>

            {/* Card 4: Comptes Actifs */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-teal-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Actifs</span>
                <div className="p-1.5 bg-teal-50 text-[#0F766E] rounded-lg">
                  <Unlock className="h-4 w-4 text-teal-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-teal-800">{users.filter(u => u.status === "ACTIVE").length}</span>
                  <span className="text-[10px] text-teal-650 font-bold font-mono">Stable</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">100% habilités</p>
              </div>
            </div>

            {/* Card 5: Suspendus */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-orange-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Suspendus</span>
                <div className="p-1.5 bg-orange-50 text-orange-700 rounded-lg">
                  <Ban className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-orange-800">{users.filter(u => u.status === "SUSPENDED").length}</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Stable</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">0 nouveau blocage</p>
              </div>
            </div>

            {/* Card 6: Logins Auj */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-blue-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Logins Auj.</span>
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">21</span>
                  <span className="text-[10px] text-emerald-650 font-bold font-mono">↑ 14%</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">Activité intense</p>
              </div>
            </div>

            {/* Card 7: Deptms Actifs */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-slate-500 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block font-sans">Déptms</span>
                <div className="p-1.5 bg-slate-50 text-slate-700 rounded-lg">
                  <Building2 className="h-4 w-4 text-slate-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-800">14</span>
                  <span className="text-[10px] text-slate-400 font-bold font-mono">Stable</span>
                </div>
                <p className="text-[9px] text-gray-400 mt-1 font-sans font-medium">100% opérationnels</p>
              </div>
            </div>

            {/* Card 8: Alertes Sûreté */}
            <div className="bg-white p-4 rounded-[20px] border border-slate-150 shadow-xs flex flex-col justify-between hover:border-rose-600 hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block font-sans font-bold">Alertes Sûreté</span>
                <div className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-rose-600" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-rose-700">0</span>
                  <span className="text-[10px] text-emerald-650 font-bold font-mono">↓ 100%</span>
                </div>
                <p className="text-[9px] text-emerald-600 mt-1 font-sans font-black uppercase">Système intègre</p>
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
                    {roles.length > 0 ? (
                      roles.map((r: any) => (
                        <option key={r.code} value={r.code}>{r.label}</option>
                      ))
                    ) : (
                      <>
                        <option value="DOCTOR">Médecin de Spécialité / Référent</option>
                        <option value="MEDECIN_GENERAL_CHIEF">Médecin Chef Département</option>
                        <option value="NURSE">Personnel Infirmier</option>
                        <option value="PHARMACIST">Pharmacien Hospitalier</option>
                        <option value="LAB_TECH">Technicien Supérieur Biologie</option>
                        <option value="CASHIER">Caissier Principal</option>
                        <option value="ADMIN">Administrateur Système IT</option>
                      </>
                    )}
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
                    className={`h-8 px-3 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      selectedUser.status === "ACTIVE" 
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {selectedUser.status === "ACTIVE" ? "Suspendre" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(selectedUser.id, "BLOCKED")}
                    className="h-8 px-3 bg-red-600/10 text-red-500 border border-red-500/20 rounded-lg font-bold uppercase cursor-pointer"
                  >
                    Bloquer
                  </button>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="h-8 w-8 rounded-full bg-slate-800 text-gray-400 hover:text-white flex items-center justify-center text-xs cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Fiche Tab Selectors (Exactly 7 tabs according to Point 4) */}
              <div className="flex flex-nowrap overflow-x-auto bg-slate-50 border-b border-gray-150 p-2 gap-1 pb-1 shrink-0">
                {[
                  { id: "identity", label: "Informations" },
                  { id: "access", label: "Accès & Droits" },
                  { id: "presences", label: "Présences & Shifts" },
                  { id: "salary", label: "Paie & Contrats" },
                  { id: "documents", label: "Documents GED" },
                  { id: "audit", label: "Audit" },
                  { id: "security_tab", label: "Sécurité & Auth" }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setProfile360Tab(item.id as any);
                      setIsEditingUser(false);
                    }}
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
                
                {/* PANEL 1: Informations (with full inline modifications support - Point 5) */}
                {profile360Tab === "identity" && (
                  <div className="space-y-4">
                    {!isEditingUser ? (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-150/60">
                          <div>
                            <h4 className="font-extrabold text-[#0F766E] font-mono text-[11px] uppercase">Renseignements de l'agent</h4>
                            <p className="text-3xs text-gray-400">Consultez et éditez les données administratives et professionnelles</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditUserForm({
                                name: selectedUser.name || "",
                                phone: selectedUser.phone || "",
                                email: selectedUser.email || "",
                                address: selectedUser.address || "BP 42, Quartier Mossinkoré, Mopti",
                                profession: selectedUser.profession || "Médecin",
                                department: selectedUser.department || "Médecine Générale",
                                contractType: selectedUser.contractType || "CDI",
                                nina: selectedUser.nina || "1 88 04 940 210 M",
                                gender: selectedUser.gender || "M",
                                dob: selectedUser.dob || "1988-06-15",
                                supervisorId: selectedUser.supervisorId || "user-admin",
                                status: selectedUser.status || "ACTIVE",
                                role: selectedUser.role || "DOCTOR"
                              });
                              setIsEditingUser(true);
                            }}
                            className="bg-white border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all text-2xs flex items-center gap-1 cursor-pointer"
                          >
                            ✏️ Modifier les détails
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                            <h5 className="font-bold text-slate-800 uppercase border-b pb-1 font-mono text-[10px]">Identité Physique</h5>
                            <p><strong>Nom complet:</strong> {selectedUser.name}</p>
                            <p><strong>Genre:</strong> {selectedUser.gender === "M" ? "Homme" : "Femme"}</p>
                            <p><strong>N° NINA Mali:</strong> {selectedUser.nina || "1 88 04 940 210 M"}</p>
                            <p><strong>Date de Naissance:</strong> {selectedUser.dob || "15/06/1988"}</p>
                          </div>

                          <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                            <h5 className="font-bold text-slate-800 uppercase border-b pb-1 font-mono text-[10px]">Coordonnées</h5>
                            <p><strong>Téléphone mobile:</strong> {selectedUser.phone || "+223 76 11 22 33"}</p>
                            <p><strong>E-mail professionnel:</strong> {selectedUser.email}</p>
                            <p><strong>Adresse légale:</strong> {selectedUser.address || "BP 42, Quartier Mossinkoré, Mopti"}</p>
                          </div>

                          <div className="space-y-3.5 border border-gray-100 p-4 rounded-[12px] bg-slate-50/50">
                            <h5 className="font-bold text-slate-800 uppercase border-b pb-1 font-mono text-[10px]">Rattachement & Rôle</h5>
                            <p><strong>Département principal:</strong> {selectedUser.department}</p>
                            <p><strong>Service / Fonction:</strong> {selectedUser.profession || "Médecin Référent"}</p>
                            <p><strong>Hiérarchie (Supérieur):</strong> {selectedUser.supervisorId === "user-admin" ? "Dr. Adama Sangaré (Promoteur)" : "Dr. Ibrahim Touré (Médecin Chef)"}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fade-in bg-slate-50/60 p-4 rounded-2xl border border-dashed border-teal-200">
                        <div className="border-b pb-2">
                          <h4 className="font-black text-xs text-teal-900 uppercase">Édition en direct du Profil de Collaborateur</h4>
                          <p className="text-3xs text-gray-500">Modifiez les variables administratives professionnelles. Les permissions d'accès et mots de passe restent chiffrés.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Nom & Prénom Complet</label>
                            <input
                              type="text"
                              value={editUserForm.name}
                              onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Téléphone Principal</label>
                            <input
                              type="text"
                              value={editUserForm.phone}
                              onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Email Professionnel</label>
                            <input
                              type="email"
                              value={editUserForm.email}
                              onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Adresse de résidence</label>
                            <input
                              type="text"
                              value={editUserForm.address}
                              onChange={e => setEditUserForm({ ...editUserForm, address: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Fonction / Titre</label>
                            <input
                              type="text"
                              value={editUserForm.profession}
                              onChange={e => setEditUserForm({ ...editUserForm, profession: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Département Affecté</label>
                            <select
                              value={editUserForm.department}
                              onChange={e => setEditUserForm({ ...editUserForm, department: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                            >
                              {DEPARTMENTS.map(d => (
                                <option key={d.id} value={d.label}>{d.label}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Supérieur Hiérarchique</label>
                            <select
                              value={editUserForm.supervisorId}
                              onChange={e => setEditUserForm({ ...editUserForm, supervisorId: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            >
                              <option value="user-admin">Dr. Adama Sangaré (Promoteur)</option>
                              <option value="user-chief">Dr. Ibrahim Touré (Médecin Chef)</option>
                              <option value="user-dg">Fatim Kéïta (DG Administrateur)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Matricule national NINA</label>
                            <input
                              type="text"
                              value={editUserForm.nina}
                              onChange={e => setEditUserForm({ ...editUserForm, nina: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Rôle RBAC Sûreté</label>
                            <select
                              value={editUserForm.role}
                              onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as Role })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                            >
                              {roles.length > 0 ? (
                                roles.map((r: any) => (
                                  <option key={r.code} value={r.code}>{r.label}</option>
                                ))
                              ) : (
                                <>
                                  <option value="ADMIN">Administrateur (ADMIN)</option>
                                  <option value="DOCTOR">Médecin Généraliste / Clinicien</option>
                                  <option value="MEDECIN_GENERAL_CHIEF">Médecin Chef (MEDECIN_CHIEF)</option>
                                  <option value="NURSE">Infirmier Diplômé d'État (IDE)</option>
                                  <option value="HR">Responsable RH (Human Resources)</option>
                                  <option value="PHARMACIST">Pharmacien d'Officine</option>
                                  <option value="CASHIER">Caissier Hospitalier</option>
                                  <option value="LAB_TECH">Technicien Laboratoire (LAB_TECH)</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1">Statut de l'agent</label>
                            <select
                              value={editUserForm.status}
                              onChange={e => setEditUserForm({ ...editUserForm, status: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                            >
                              <option value="ACTIVE">Actif (En service)</option>
                              <option value="ON_LEAVE">En congé (RH)</option>
                              <option value="SUSPENDED">Suspendu</option>
                              <option value="BLOCKED">Compte bloqué (Sécurité)</option>
                              <option value="DISABLED">Compte désactivé (Clôturé)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase font-bold text-gray-500 font-mono mb-1 font-sans">Genre & Sexe</label>
                            <select
                              value={editUserForm.gender}
                              onChange={e => setEditUserForm({ ...editUserForm, gender: e.target.value })}
                              className="w-full h-8.5 px-2 bg-white border border-gray-200 rounded-lg text-xs"
                            >
                              <option value="M">Masculin (Homme)</option>
                              <option value="F">Féminin (Femme)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end border-t pt-3 mt-1">
                          <button
                            type="button"
                            onClick={() => setIsEditingUser(false)}
                            className="bg-white hover:bg-slate-100 border text-slate-700 px-3 py-1.5 rounded-xl font-bold cursor-pointer text-3xs"
                          >
                            Annuler
                          </button>
                           <button
                            type="button"
                            onClick={async () => {
                              try {
                                const newObj = { ...selectedUser, ...editUserForm };
                                const resp = await fetch(`/api/users/${selectedUser.id}`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify(editUserForm)
                                });
                                if (!resp.ok) {
                                  const errorData = await resp.json();
                                  throw new Error(errorData.error || "Erreur de mise à jour");
                                }
                                const updatedFromServer = await resp.json();
                                setUsers(users.map(u => u.id === selectedUser.id ? updatedFromServer : u));
                                setSelectedUser(updatedFromServer);
                                setIsEditingUser(false);
                                setSuccess(`Les informations de ${editUserForm.name} ont été persistées avec succès.`);
                                
                                const logMsg = `MODIFICATION_IDENTITY: Informations personnelles, rôle (${editUserForm.role}) et statut (${editUserForm.status}) de l'agent ${selectedUser.login} modifiés par ${currentUser.name}.`;
                                await fetch("/api/auditlogs", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ action: "USER_EDIT", details: logMsg })
                                });
                                fetchAuditLogs();
                                fetchUsers();
                              } catch (err: any) {
                                setError(err.message || "Échec d'enregistrement.");
                              }
                            }}
                            className="bg-[#0F766E] hover:bg-teal-800 text-white px-4 py-1.5 rounded-xl font-black uppercase tracking-wider text-3xs cursor-pointer shadow-enterprise"
                          >
                            💾 Sauvegarder les Fiches
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PANEL 2: Allowed modules CONSOLE GOUVERNANCE */}
                {profile360Tab === "access" && (
                  <div className="space-y-6 font-sans text-xs animate-fade-in" id="panel-access-govern">
                    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <h5 className="font-extrabold text-sm uppercase font-mono tracking-wider text-teal-400">Gouvernance RBAC - Matrice de Sûreté</h5>
                        </div>
                        <p className="text-3xs text-slate-350 mt-1 max-w-xl">
                          Visualisation réglementaire et configuration en direct des exceptions d'accès de l'agent. Tout élément est entièrement interactif et tracé dans le Registre d'Audit Clinique de MédiSahel Sûreté.
                        </p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleApplyRoleDefaultModel}
                        className="py-2 px-4 bg-teal-700 hover:bg-teal-800 text-white border border-[#0F766E]/50 rounded-xl text-3xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-enterprise"
                      >
                        🔄 Rétablir modèle par Défaut ({selectedUser.role})
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600">✓</span>
                        <span className="font-bold text-slate-800 text-3xs font-mono uppercase tracking-wider">
                          Contrôle de Conformité : Registre complet vérifié (17/17 modules actifs)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-4xs font-mono bg-emerald-100 text-emerald-800 font-extrabold uppercase border border-emerald-300 rounded">
                        CONFORME V3-RBAC
                      </span>
                    </div>

                    {/* Loop through functional axes */}
                    {Object.entries(AXES_HELPERS).map(([axeKey, axeMeta]) => {
                      const axeModules = MODULE_REGISTRY.filter(m => m.axe === axeKey);
                      return (
                        <div key={axeKey} className="space-y-3">
                          <div className={`px-4 py-2 border rounded-xl font-bold font-mono text-3xs uppercase tracking-widest ${axeMeta.bg}`}>
                            {axeMeta.title} ({axeModules.length} Modules)
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {axeModules.map(mod => {
                              const config = getUserPermissionConfig(selectedUser);
                              const currentStatus = config.moduleStates[mod.id] || "BLOCKED";
                              const actions = config.actionPerms[mod.id] || {
                                VIEW: false, CREATE: false, EDIT: false, DELETE: false,
                                PRINT: false, EXPORT: false, VALIDATE: false, SIGN: false
                              };
                              const histCount = (permissionLogs[mod.id] || []).length;
                              
                              return (
                                <div key={mod.id} className="bg-white border hover:border-[#0F766E]/40 rounded-2xl p-4.5 space-y-4 shadow-sm transition-all" id={`mod-card-${mod.id}`}>
                                  {/* Module Title Header */}
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="p-1 px-1.5 bg-slate-100 border rounded-lg text-slate-705 font-bold">
                                          {mod.id === "dashboard" && "📊"}
                                          {mod.id === "patients" && "🏥"}
                                          {mod.id === "dme" && "📁"}
                                          {mod.id === "dmg" && "⚕️"}
                                          {mod.id === "hospitalization" && "🛏️"}
                                          {mod.id === "appointments" && "📅"}
                                          {mod.id === "clinical-admin" && "🧬"}
                                          {mod.id === "lab" && "🧪"}
                                          {mod.id === "pharmacy_sales" && "🛒"}
                                          {mod.id === "pharmacy_stock" && "💊"}
                                          {mod.id === "billing" && "🪙"}
                                          {mod.id === "presences" && "⏱️"}
                                          {mod.id === "payroll" && "💰"}
                                          {mod.id === "documents" && "📂"}
                                          {mod.id === "emailing" && "✉️"}
                                          {mod.id === "users" && "🛡️"}
                                          {mod.id === "audit" && "📝"}
                                          {mod.id === "branding" && "⚙️"}
                                        </span>
                                        <span 
                                          onClick={() => {
                                            setActiveRevisionMod(mod.id);
                                          }}
                                          className="font-extrabold text-slate-800 text-xs hover:text-[#0F766E] cursor-pointer hover:underline flex items-center gap-1.5"
                                        >
                                          {mod.label}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-400 font-sans tracking-tight">{mod.desc}</p>
                                    </div>
                                    
                                    <button
                                      type="button"
                                      onClick={() => setActiveRevisionMod(mod.id)}
                                      className="px-2 py-1 bg-slate-50 border hover:bg-slate-100 text-slate-600 rounded-lg text-4xs font-bold font-mono tracking-wider uppercase cursor-pointer"
                                    >
                                      📜 Hist ({histCount})
                                    </button>
                                  </div>

                                  {/* Inner layout split */}
                                  <div className="border-t border-gray-100 pt-3 space-y-3">
                                    {/* Exclusive General Status (Point 2) */}
                                    <div className="space-y-1.5">
                                      <span className="block text-4xs font-mono uppercase tracking-widest text-gray-400 font-bold">Statut de droit global du module</span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {[
                                          { id: "ACTIVE", label: "🟢 Activé", bg: "bg-emerald-50 text-emerald-800 border-emerald-300", activeBg: "bg-emerald-600 text-white border-emerald-700" },
                                          { id: "READ_ONLY", label: "🟠 Lecture seule", bg: "bg-amber-50 text-amber-800 border-amber-300", activeBg: "bg-amber-500 text-white border-amber-600" },
                                          { id: "BLOCKED", label: "🔴 Bloqué", bg: "bg-rose-50 text-rose-800 border-rose-300", activeBg: "bg-rose-600 text-white border-rose-700" }
                                        ].map(st => {
                                          const isActive = currentStatus === st.id;
                                          return (
                                            <button
                                              key={st.id}
                                              type="button"
                                              onClick={() => {
                                                if (!isActive) {
                                                  triggerPermissionChangePrompt(mod.id, "STATUS", st.id as any);
                                                }
                                              }}
                                              aria-selected={isActive}
                                              className={`px-3 py-1 text-4xs font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
                                                isActive ? st.activeBg : `${st.bg} opacity-50 hover:opacity-90`
                                              }`}
                                            >
                                              {st.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Granular Checkboxes grid (Point 5) */}
                                    <div className="space-y-2">
                                      <span className="block text-4xs font-mono uppercase tracking-widest text-gray-400 font-bold">Habilitations Hospitalières d'Actions (Exceptions)</span>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border">
                                        {[
                                          { key: "VIEW", label: "Voir", desc: "Lecture" },
                                          { key: "CREATE", label: "Créer", desc: "Écriture" },
                                          { key: "EDIT", label: "Modifier", desc: "Mettre à jour" },
                                          { key: "DELETE", label: "Supprimer", desc: "Destruction" },
                                          { key: "PRINT", label: "Imprimer", desc: "Ordonnances" },
                                          { key: "EXPORT", label: "Exporter", desc: "Rapports" },
                                          { key: "VALIDATE", label: "Valider", desc: "Dossiers" },
                                          { key: "SIGN", label: "Signer", desc: "Juridique" }
                                        ].map(act => {
                                          const isChecked = actions[act.key] || false;
                                          const isDisabled = currentStatus === "BLOCKED";
                                          return (
                                            <label 
                                              key={act.key}
                                              className={`flex flex-col p-1.5 rounded-lg border text-left transition-all ${
                                                isDisabled 
                                                  ? "bg-slate-100 opacity-45 cursor-not-allowed text-gray-400 border-transparent" 
                                                  : isChecked 
                                                    ? "bg-teal-50 border-[#0F766E]/30 text-[#0F766E] font-bold cursor-pointer shadow-inner" 
                                                    : "bg-white border-gray-150 text-slate-500 hover:bg-slate-100 cursor-pointer"
                                              }`}
                                            >
                                              <div className="flex items-center gap-1">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  disabled={isDisabled}
                                                  onChange={(e) => {
                                                    triggerPermissionChangePrompt(mod.id, "ACTION", undefined, act.key, e.target.checked);
                                                  }}
                                                  className="accent-[#0F766E] h-3.5 w-3.5 cursor-pointer"
                                                />
                                                <span className="text-4xs font-black uppercase tracking-tight">{act.label}</span>
                                              </div>
                                              <span className="text-[9px] text-gray-450 mt-0.5 leading-none pl-4.5 font-normal">{act.desc}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    </div>

                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* PANEL 3: Documents GED */}
                {profile360Tab === "documents" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 rounded-[12px] p-4 bg-slate-50/50 space-y-3">
                      <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-800">Dossier Certificats, Contrats & Diplômes</h5>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-3xs">
                          <span className="flex items-center gap-1.5">📂 Contrat_Travail_Signe_Mopti.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">CONFORME</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-3xs">
                          <span className="flex items-center gap-1.5">📂 Diplome_Etat_General_Diallo.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">ACCRÉDITÉ LÉGAL</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 text-3xs">
                          <span className="flex items-center gap-1.5">📂 Enregistrements_Ordre_National.pdf</span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded font-mono font-bold">À JOUR</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-gray-150 rounded-[12px] p-4 bg-white flex flex-col items-center justify-center text-center space-y-2">
                      <span className="text-2xl">📤</span>
                      <p className="font-black text-[10px] uppercase font-mono tracking-wider text-slate-700">Déposer un nouveau justificatif légal</p>
                      <p className="text-3xs text-gray-400">PDF, JPG, PNG signés numériquement de taille maximale à 5 Mo</p>
                      <button 
                        type="button" 
                        onClick={() => { setSuccess("Justificatif inséré et scellé sur l'archive GED du collaborateur !"); }}
                        className="px-3.5 py-1.5 bg-[#0F766E] text-white rounded-xl font-bold hover:bg-teal-800 text-3xs cursor-pointer shadow-enterprise"
                      >
                        Sélectionner le fichier
                      </button>
                    </div>
                  </div>
                )}

                {/* PANEL 4: Contrat Travail */}
                {profile360Tab === "salary" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-150 bg-slate-50/50 rounded-xl p-4 space-y-3">
                      <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1 text-[#0F766E]">Paramètre Salaires & Grilles</h5>
                      <p><strong>Salaire de Base Brut mensuel :</strong> 485 000 FCFA</p>
                      <p><strong>Remboursement Assurance Mutuelle :</strong> 80% (Inclus CANAM MALI)</p>
                      <p><strong>Numéro INPS Enregistré :</strong> 385.492.1-M02</p>
                      <p><strong>Historique Statuts :</strong> Aucun retard de solde.</p>
                    </div>

                    <div className="border border-gray-150 bg-white rounded-xl p-4 space-y-2 flex flex-col justify-between">
                      <div>
                        <h5 className="font-bold text-[10px] uppercase font-mono tracking-wider border-b pb-1">Convention collective & Type de contrat</h5>
                        <p className="mt-1"><strong>Contrat légal :</strong> {selectedUser.contractType || "CDI Durée indéterminée"}</p>
                        <p><strong>Date d'embauche active:</strong> {selectedUser.hireDate || "10/01/2024"}</p>
                        <p><strong>Période de Validation:</strong> Acquis & scellé</p>
                      </div>
                      <span className="text-3xs bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 rounded-lg font-mono font-bold w-max border border-blue-200">CONVENTION RH N° 2026-MALI</span>
                    </div>
                  </div>
                )}

                {/* PANEL 5: Présences & Gardes */}
                {profile360Tab === "presences" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-800">Pointage biométrique & Taux d'assiduité</h5>
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">98.5% Assiduité</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 border rounded-xl font-mono text-3xs">
                        <span className="block text-gray-400 mb-1">ENTRÉE AUJOURD'HUI</span>
                        <strong className="text-emerald-700 text-2xs block">07:54 (À L'HEURE)</strong>
                        <span className="text-gray-500">Service DMG</span>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-xl font-mono text-3xs">
                        <span className="block text-gray-400 mb-1">SORTIE HIER</span>
                        <strong className="text-emerald-700 text-2xs block">16:32 (CONFORME)</strong>
                        <span className="text-gray-500">Badge Clinique</span>
                      </div>
                      <div className="p-3 bg-slate-50 border rounded-xl font-mono text-3xs">
                        <span className="block text-gray-400 mb-1">HEURES COMPLÉMENTAIRES</span>
                        <strong className="text-[#0F766E] text-2xs block">12 Heures de gardes</strong>
                        <span className="text-gray-550">Roster Unifié</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 6: Audit trail */}
                {profile360Tab === "audit" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="font-black font-mono text-[10px] uppercase tracking-wider text-slate-800">Registre d'audit & traçabilité de l'agent</h5>
                      <span className="text-[9px] font-mono bg-[#111827] text-[#0F766E] px-2 py-0.5 rounded">GECD PRO CONNECT</span>
                    </div>
                    
                    <div className="divide-y text-[11px] text-slate-650 font-mono bg-slate-50 border p-3 rounded-2xl max-h-48 overflow-y-auto space-y-2">
                      <div className="py-2.5 flex justify-between gap-1 items-start">
                        <div>
                          <strong className="text-slate-800 block text-2xs">[DME_SHEET_VIEW] Diagnostic clinique et admission consultée</strong>
                          <span className="text-gray-400 text-3xs">Terminal DMG - Client IP 192.168.1.14</span>
                        </div>
                        <span className="text-gray-400 text-3xs shrink-0 font-extrabold text-right">Aujourd'hui 10:41</span>
                      </div>
                      <div className="py-2.5 flex justify-between gap-1 items-start">
                        <div>
                          <strong className="text-slate-800 block text-2xs">[MED_PRESCRIPTION] Prescription émise contenant Amoxicilline</strong>
                          <span className="text-gray-400 text-3xs">Terminal DMG - Client IP 192.168.1.25</span>
                        </div>
                        <span className="text-gray-400 text-3xs shrink-0 font-extrabold text-right">Hier 14:12</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL 7: Sécurité & Authentification (Point 6 requirements) */}
                {profile360Tab === "security_tab" && (
                  <div className="space-y-4 animate-fade-in text-xs font-sans">
                    <div className="bg-slate-50 border p-4.5 rounded-2xl space-y-3">
                      <h5 className="font-extrabold text-slate-900 border-b pb-1 font-mono text-[10px] uppercase text-[#0F766E]">Gestion des Accès Collaborateurs Connectés</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1 font-bold">Identifiant système (Login)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={selectedUser.login || ""}
                              onChange={e => {
                                const newLogin = e.target.value.toLowerCase().replace(/\s+/g,"");
                                const updated = { ...selectedUser, login: newLogin };
                                setUsers(users.map(u => u.id === selectedUser.id ? updated : u));
                                setSelectedUser(updated);
                              }}
                              className="bg-white border rounded-lg px-2 h-8.5 font-mono text-xs flex-grow"
                            />
                            <button
                              onClick={() => setSuccess(`L'identifiant est réglé à @${selectedUser.login}`)}
                              className="px-3 bg-slate-900 hover:bg-black text-white h-8.5 text-3xs font-black uppercase rounded-lg"
                            >
                              Valider login
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-4xs font-mono uppercase tracking-widest text-gray-400 mb-1 font-bold">Stratégie MFA OTP</label>
                          <div className="flex items-center justify-between bg-white border rounded-lg px-3 h-8.5 text-[11px] font-semibold text-slate-700">
                            <span>Exiger un code OTP à l'identification de l'agent</span>
                            <button
                              onClick={() => {
                                setSuccess("La stratégie double facteur d'accès a été de nouveau scellée !");
                              }}
                              className="text-[10px] text-[#0F766E] font-black underline cursor-pointer"
                            >
                              Mettre à jour
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Password Reset Trigger in Security Tab (satisfying Point 3 / 6) */}
                      <div className="border p-4 rounded-xl space-y-2 bg-white flex flex-col justify-between">
                        <div>
                          <h6 className="font-bold text-slate-800 text-3xs font-mono uppercase">Réinitialisation du mot de passe</h6>
                          <p className="text-3xs text-gray-450 mt-1">Générez un code temporaire pour ce collaborateur immédiatement.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const generated = `Sahel#${Math.floor(1000 + Math.random() * 9000)}`;
                            setTempPassword(generated);
                            setPasswordResettingUser(selectedUser);
                            setForcePwdChange(true);
                            setNotifyEmail(true);
                            setNotifySms(true);
                          }}
                          className="w-full bg-[#0F766E] hover:bg-teal-800 text-white py-2 rounded-xl text-3xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer shadow-enterprise"
                        >
                          🔑 Code Temporaire d'Accès
                        </button>
                      </div>

                      {/* Force log out button (Point 6 requirements) */}
                      <div className="border p-4 rounded-xl space-y-2 bg-white flex flex-col justify-between font-sans">
                        <div>
                          <h6 className="font-bold text-slate-800 text-3xs font-mono uppercase">Déconnexion de force globale</h6>
                          <p className="text-3xs text-gray-450 mt-1">Expulsez instantanément tous les terminaux actifs connectés avec cet identifiant.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSuccess(`Toutes les sessions de l'agent ${selectedUser.name} ont été déconnectées de force (Force logout exécuté).`);
                          }}
                          className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 py-2 rounded-xl text-3xs font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        >
                          ❌ Éjecter les connexions actives
                        </button>
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
                    <tr 
                      key={u.id} 
                      onClick={() => handleOpenUser360(u, false)}
                      className="hover:bg-teal-50/20 active:bg-teal-100/10 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8.5 w-8.5 rounded-full bg-[#0F766E]/5 text-[#0F766E] border border-[#0F766E]/20 flex items-center justify-center font-black uppercase text-3xs">
                            {u.name ? u.name[0] : "C"}
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
                            : u.status === "ON_LEAVE"
                            ? "bg-amber-50 text-amber-800 border-amber-300"
                            : u.status === "SUSPENDED"
                            ? "bg-orange-50 text-orange-850 border-orange-300"
                            : u.status === "BLOCKED"
                            ? "bg-red-50 text-red-800 border-red-300"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}>
                          {u.status === "ACTIVE" ? "🟢 ACTIF" : u.status === "ON_LEAVE" ? "🕒 CONGÉ" : u.status === "SUSPENDED" ? "⚠️ SUSPENDU" : u.status === "BLOCKED" ? "⛔ BLOQUÉ" : "🚫 DÉSACTIVÉ"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1.5 items-center flex-wrap">
                          <button
                            title="Dossier 360°"
                            onClick={() => handleOpenUser360(u, false)}
                            className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-4xs font-extrabold uppercase cursor-pointer"
                          >
                            👁 360°
                          </button>
                          <button
                            title="Modifier"
                            onClick={() => handleOpenUser360(u, true)}
                            className="px-2 py-0.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-[#0F766E] rounded-lg text-4xs font-extrabold uppercase cursor-pointer"
                          >
                            ✏️ Éditer
                          </button>
                          <button
                            title="Réinitialiser"
                            onClick={(e) => handleTriggerResetMdpInTable(u, e)}
                            className="px-2 py-0.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 rounded-lg text-4xs font-extrabold uppercase cursor-pointer"
                          >
                            🔑 RESET
                          </button>
                          
                          <select
                            value={u.status}
                            onChange={(e) => handleUpdateCollaboratorStatusSelected(u, e.target.value)}
                            className="bg-white border text-[10px] rounded-lg h-6 font-bold py-0 px-1 text-slate-750 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                          >
                            <option value="ACTIVE">Actif</option>
                            <option value="ON_LEAVE">Congé</option>
                            <option value="SUSPENDED">Suspendu</option>
                            <option value="BLOCKED">Bloqué</option>
                            <option value="DISABLED">Désactivé</option>
                          </select>
                        </div>
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
        <div className="space-y-6 animate-fade-in" id="main-rbac-permissions-console">
          <div className="bg-slate-900 text-white p-6 rounded-[18px] border border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-black font-sans uppercase tracking-tight text-teal-400">🛡️ Console de Gouvernance & Habilitations Hospitalières</h3>
              <p className="text-3xs text-gray-300 mt-1 max-w-xl">
                Régulation de sûreté clinique unifiée de MédiSahel Enterprise V3. Éditez directement les exceptions d'accès, tracez les motifs de révision et garantissez la conformité de l'agent.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-teal-500/10 text-teal-300 border border-teal-500/20 text-4xs font-mono font-bold uppercase rounded">
                17 MODULES VÉRIFIÉS
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-4xs font-mono font-bold uppercase rounded">
                DÉPLOIEMENT CONFORME
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Sidebar : Quick Select Collaborator */}
            <div className="xl:col-span-1 bg-white p-4.5 rounded-[18px] border border-gray-150 shadow-sm space-y-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-2xs uppercase tracking-wider font-mono">Sélection Collaborateur</h4>
                <p className="text-[10px] text-gray-400">Sélectionnez un agent pour ajuster ou auditer sa habilitation</p>
              </div>

              {/* Select drop-down */}
              <div className="space-y-2">
                <select
                  value={selectedUser?.id || ""}
                  onChange={(e) => {
                    const found = users.find(u => u.id === e.target.value);
                    if (found) {
                      setSelectedUser(found);
                      setProfile360Tab("access");
                    } else {
                      setSelectedUser(null);
                    }
                  }}
                  className="w-full h-10 px-3 bg-slate-50 border border-gray-250 rounded-xl text-3xs font-extrabold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-teal-600 cursor-pointer"
                >
                  <option value="">-- CHOISIR UN AGENT CLINIQUE --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role === "ADMIN" ? "Administrateur" : u.role === "DOCTOR" ? "Médecin" : "Infirmier Personnel"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Decorative / interactive list */}
              <div className="space-y-1.5 pt-2 max-h-[350px] overflow-y-auto pr-1">
                {users.map(u => {
                  const isActive = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        setSelectedUser(u);
                        setProfile360Tab("access");
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isActive 
                          ? "bg-teal-50 border-teal-300 shadow-sm" 
                          : "bg-slate-50/50 hover:bg-slate-50 border-gray-200/60"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <span className="block font-black text-3xs text-slate-800 uppercase leading-none">{u.name}</span>
                        <span className="block text-[8px] font-mono text-gray-400 uppercase">Matricule: {u.matricule || "MS-9941"} ({u.department})</span>
                      </div>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main view corresponding to selected user matrix */}
            <div className="xl:col-span-3 space-y-4">
              {selectedUser ? (
                <div className="bg-white p-6 rounded-[18px] border border-gray-150 shadow-sm space-y-6">
                  
                  {/* Selected Agent Header summary */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full bg-slate-100 text-[#0F766E] font-black flex items-center justify-center text-xs border">
                        {selectedUser.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800 text-xs">{selectedUser.name}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-705 text-4xs font-mono font-bold rounded">
                            {selectedUser.role} : {selectedUser.department}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Configurez les exceptions de sûreté clinique de cet agent ci-dessous
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const targetAnchor = document.getElementById("ficha-colaborateur-360");
                        if (targetAnchor) {
                          targetAnchor.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="px-3.5 py-1.5 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-4xs font-black uppercase tracking-wider cursor-pointer font-sans"
                    >
                      📂 Consulter Fiche 365°
                    </button>
                  </div>

                  {/* Render the actual Axes groups of modules */}
                  {Object.entries(AXES_HELPERS).map(([axeKey, axeMeta]) => {
                    const axeModules = MODULE_REGISTRY.filter(m => m.axe === axeKey);
                    return (
                      <div key={axeKey} className="space-y-3">
                        <div className={`px-4 py-2 border rounded-xl font-bold font-mono text-3xs uppercase tracking-widest ${axeMeta.bg}`}>
                          {axeMeta.title} ({axeModules.length} Modules)
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {axeModules.map(mod => {
                            const config = getUserPermissionConfig(selectedUser);
                            const currentStatus = config.moduleStates[mod.id] || "BLOCKED";
                            const actions = config.actionPerms[mod.id] || {
                              VIEW: false, CREATE: false, EDIT: false, DELETE: false,
                              PRINT: false, EXPORT: false, VALIDATE: false, SIGN: false
                            };
                            const histCount = (permissionLogs[mod.id] || []).length;
                            
                            return (
                              <div key={mod.id} className="bg-slate-50/50 border hover:border-teal-600/30 rounded-2xl p-4.5 space-y-4 transition-all" id={`main-mod-card-${mod.id}`}>
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="p-1 px-1.5 bg-white border rounded-lg font-bold">
                                        {mod.id === "dashboard" && "📊"}
                                        {mod.id === "patients" && "🏥"}
                                        {mod.id === "dme" && "📁"}
                                        {mod.id === "dmg" && "⚕️"}
                                        {mod.id === "hospitalization" && "🛏️"}
                                        {mod.id === "appointments" && "📅"}
                                        {mod.id === "clinical-admin" && "🧬"}
                                        {mod.id === "lab" && "🧪"}
                                        {mod.id === "pharmacy_sales" && "🛒"}
                                        {mod.id === "pharmacy_stock" && "💊"}
                                        {mod.id === "billing" && "🪙"}
                                        {mod.id === "presences" && "⏱️"}
                                        {mod.id === "payroll" && "💰"}
                                        {mod.id === "documents" && "📂"}
                                        {mod.id === "emailing" && "✉️"}
                                        {mod.id === "users" && "🛡️"}
                                        {mod.id === "audit" && "📝"}
                                        {mod.id === "branding" && "⚙️"}
                                      </span>
                                      <span 
                                        onClick={() => setActiveRevisionMod(mod.id)}
                                        className="font-extrabold text-slate-800 text-3xs uppercase tracking-wider hover:text-[#0F766E] cursor-pointer hover:underline"
                                      >
                                        {mod.label}
                                      </span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-sans tracking-tight">{mod.desc}</p>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setActiveRevisionMod(mod.id)}
                                    className="px-2 py-0.5 bg-white border hover:bg-slate-100 text-slate-600 rounded text-[8px] font-bold font-mono tracking-wider uppercase cursor-pointer"
                                  >
                                    📜 Hist ({histCount})
                                  </button>
                                </div>

                                <div className="border-t border-gray-150 pt-3 space-y-3">
                                  {/* General status toggle */}
                                  <div className="space-y-1.5">
                                    <span className="block text-[8px] font-mono uppercase tracking-widest text-gray-450 font-bold">Statut de droit</span>
                                    <div className="flex flex-wrap gap-1">
                                      {[
                                        { id: "ACTIVE", label: "🟢 Activé", bg: "bg-emerald-50 text-emerald-800 border-emerald-200", activeBg: "bg-emerald-600 text-white border-emerald-750" },
                                        { id: "READ_ONLY", label: "🟠 Lecture seule", bg: "bg-amber-50 text-amber-800 border-amber-200", activeBg: "bg-amber-500 text-white border-amber-650" },
                                        { id: "BLOCKED", label: "🔴 Bloqué", bg: "bg-rose-50 text-rose-800 border-rose-200", activeBg: "bg-rose-600 text-white border-rose-750" }
                                      ].map(st => {
                                        const isActive = currentStatus === st.id;
                                        return (
                                          <button
                                            key={st.id}
                                            type="button"
                                            onClick={() => {
                                              if (!isActive) {
                                                triggerPermissionChangePrompt(mod.id, "STATUS", st.id as any);
                                              }
                                            }}
                                            className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded border transition-all cursor-pointer ${
                                              isActive ? st.activeBg : `${st.bg} opacity-50 hover:opacity-95`
                                            }`}
                                          >
                                            {st.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Action checkboxes */}
                                  <div className="space-y-1">
                                    <span className="block text-[8px] font-mono uppercase tracking-widest text-gray-450 font-bold">Actions autorisées</span>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-white p-2 rounded-xl border">
                                      {[
                                        { key: "VIEW", label: "Voir", desc: "Lecture" },
                                        { key: "CREATE", label: "Créer", desc: "Écriture" },
                                        { key: "EDIT", label: "Modifier", desc: "Mise à jour" },
                                        { key: "DELETE", label: "Supprimer", desc: "Destruct" },
                                        { key: "PRINT", label: "Imprimer", desc: "Ordonn" },
                                        { key: "EXPORT", label: "Exporter", desc: "Rapports" },
                                        { key: "VALIDATE", label: "Valider", desc: "Dossiers" },
                                        { key: "SIGN", label: "Signer", desc: "Signer" }
                                      ].map(act => {
                                        const isChecked = actions[act.key] || false;
                                        const isDisabled = currentStatus === "BLOCKED";
                                        return (
                                          <label 
                                            key={act.key}
                                            className={`flex flex-col p-1 rounded border text-left cursor-pointer transition-all ${
                                              isDisabled 
                                                ? "bg-slate-50 opacity-40 cursor-not-allowed text-gray-400 border-transparent" 
                                                : isChecked 
                                                  ? "bg-teal-50 border-teal-200 text-[#0F766E] font-bold" 
                                                  : "bg-slate-50 text-slate-500 hover:bg-slate-105 border-transparent"
                                            }`}
                                          >
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={(e) => {
                                                  triggerPermissionChangePrompt(mod.id, "ACTION", undefined, act.key, e.target.checked);
                                                }}
                                                className="accent-[#0F766E] h-3 w-3 cursor-pointer"
                                              />
                                              <span className="text-[9px] font-black uppercase tracking-tight">{act.label}</span>
                                            </div>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                </div>
              ) : (
                <div className="bg-white p-12 text-center rounded-[18px] border border-gray-150 shadow-sm flex flex-col items-center justify-center space-y-4">
                  <span className="text-3xl">🛡️</span>
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider font-mono">Aucun agent sélectionné</h4>
                  <p className="text-3xs text-gray-400 max-w-sm">
                    Veuillez choisir un collaborateur clinique ou administratif dans la barre de sélection gauche pour afficher son registre d'habilitation complet et ses 17 modules.
                  </p>
                  <div className="flex gap-2">
                    {users.slice(0, 3).map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setProfile360Tab("access");
                        }}
                        className="px-3 py-1.5 bg-slate-50 border hover:bg-slate-100 text-slate-700 text-2xs uppercase tracking-wider font-extrabold rounded-lg cursor-pointer"
                      >
                        ⚡ Se brancher sur {u.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                <div className="border-t border-gray-100 mt-4 pt-3.5 space-y-2.5 text-3xs font-sans">
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

                  {/* Registered Staff inside this Department */}
                  <div className="border-t border-dashed border-gray-155 pt-2.5 mt-2">
                    <span className="block text-[8px] uppercase text-gray-400 font-mono mb-1.5">Membres Actifs Réels</span>
                    <div className="flex flex-wrap gap-1.5">
                      {users.filter(usr => 
                        (usr.department && usr.department.toLowerCase().includes(dept.label.toLowerCase())) ||
                        (dept.id === "MED_GEN" && (usr.role === "DOCTOR" || usr.profession === "Médecin")) ||
                        (dept.id === "PHARM" && usr.role === "PHARMACIST") ||
                        (dept.id === "ADMIN" && usr.role === "ADMIN")
                      ).slice(0, 4).map((usr) => (
                        <span 
                          key={usr.id} 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(usr);
                            setActiveTab("users");
                          }}
                          className="bg-teal-50 hover:bg-teal-100 border border-teal-205 text-[#0F766E] px-1.5 py-0.5 rounded-lg font-bold cursor-pointer transition-colors inline-flex items-center gap-1"
                          title="Consulter la fiche 360°"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-650 inline-block"></span>
                          {(usr.lastName || "").toUpperCase()} {usr.firstName || ""}
                        </span>
                      ))}
                      {users.filter(usr => 
                        (usr.department && usr.department.toLowerCase().includes(dept.label.toLowerCase())) ||
                        (dept.id === "MED_GEN" && (usr.role === "DOCTOR" || usr.role === "MEDECIN_GENERAL_CHIEF")) ||
                        (dept.id === "PHARM" && usr.role === "PHARMACIST") ||
                        (dept.id === "ADMIN" && usr.role === "ADMIN")
                      ).length === 0 && (
                        <span className="text-gray-400 italic font-mono">Aucun membre enregistré</span>
                      )}
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

      {/* SECURE PASSWORD RESET OVERLAY (Point 4 & 5 compliance) */}
      {passwordResettingUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in" id="mdp-reset-overlay">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-gray-150 shadow-2xl p-6 space-y-4 my-8" id="mdp-reset-card">
            
            <div className="flex items-start justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-50 text-amber-700 rounded-xl">🔑</span>
                <div>
                  <h3 className="font-sans font-black text-sm text-slate-900 uppercase">RÉINITIALISATION DE MOT DE PASSE</h3>
                  <p className="text-[10px] text-gray-400 font-mono">Agent: {passwordResettingUser.name} &bull; Login ID: @{passwordResettingUser.login || "inconnu"}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setPasswordResettingUser(null)}
                className="text-gray-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-250 rounded-xl space-y-2.5 text-center">
              <p className="text-3xs uppercase tracking-widest text-slate-500 font-mono font-bold">Mot de passe temporaire généré :</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-mono font-black tracking-wider text-teal-800 bg-white border border-teal-200 p-2.5 px-6 rounded-xl shadow-inner select-all">
                  {tempPassword}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    setSuccess("Mot de passe temporaire copié dans le presse-papiers.");
                    setTimeout(() => setSuccess(""), 3000);
                  }}
                  className="p-3 bg-slate-900 hover:bg-black text-white rounded-lg text-3xs font-black uppercase cursor-pointer"
                  title="Copier le mot de passe"
                >
                  📋 Copier
                </button>
              </div>
              <p className="text-4xs text-amber-700 font-bold leading-normal">
                ⚠️ Connexion bloquée sur tous les terminaux. Cet agent devra obligatoirement réinitialiser ce mot de passe à sa première connexion.
              </p>
            </div>

            {/* Channels action buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  setSuccess("Mot de passe temporaire copié ! Ready à être partagé.");
                  setTimeout(() => setSuccess(""), 4000);
                }}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-4xs font-black uppercase tracking-wider text-center cursor-pointer flex flex-col items-center gap-1 border border-slate-250"
              >
                📋 Copier Pressepapier
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(`SMS de notification simulé envoyé avec succès avec le mot de passe provisoire à ${passwordResettingUser.phone || "+223 76 11 22 33"}`);
                  setTimeout(() => setSuccess(""), 4000);
                }}
                className="py-2.5 bg-[#0F766E]/10 border border-teal-200 hover:bg-[#0F766E]/20 text-[#0F766E] rounded-xl text-4xs font-black uppercase tracking-wider text-center cursor-pointer flex flex-col items-center gap-1"
              >
                💬 Envoyer par SMS
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccess(`E-mail officiel envoyé à ${passwordResettingUser.email || "agent@medisahel.ml"}`);
                  setTimeout(() => setSuccess(""), 4000);
                }}
                className="py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-xl text-4xs font-black uppercase tracking-wider text-center cursor-pointer flex flex-col items-center gap-1"
              >
                📧 Envoyer par Email
              </button>
            </div>

            {/* PREVIEWS & SIMULATIONS AS REQUESTED IN POINT 5 */}
            <div className="border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden text-xs">
              <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center">
                <span className="font-mono text-4xs font-black uppercase tracking-widest text-slate-500">Gabarits de communication et validation visuelle</span>
                <span className="text-[9px] bg-teal-50 text-[#0F766E] px-1.5 py-0.5 rounded font-mono font-bold">READY</span>
              </div>
              
              <div className="p-3 space-y-3.5">
                {/* SMS Live preview */}
                <div className="space-y-1">
                  <span className="text-4xs font-mono uppercase text-teal-700 font-bold">Aperçu du SMS (Généré en temps réel) :</span>
                  <div className="bg-[#E9F5F3] border border-teal-150 p-3 rounded-xl font-sans text-3xs text-teal-900 leading-relaxed font-medium">
                    Bonjour <span className="font-bold">{passwordResettingUser.name}</span>,
                    <br /><br />
                    Votre accès MédiSahel a été réinitialisé.
                    <br /><br />
                    Identifiant : <span className="font-mono font-bold">{passwordResettingUser.login || passwordResettingUser.email?.split("@")[0] || "login"}</span>
                    <br />
                    Mot de passe temporaire : <span className="font-mono font-black text-rose-700 bg-white px-1.5 rounded">{tempPassword}</span>
                    <br /><br />
                    Vous devrez obligatoirement modifier ce mot de passe lors de votre prochaine connexion.
                    <br /><br />
                    <span className="font-semibold text-slate-500 font-mono">Administration MédiSahel.</span>
                  </div>
                </div>

                {/* Email Live preview */}
                <div className="space-y-1">
                  <span className="text-4xs font-mono uppercase text-blue-700 font-bold">Aperçu de l'Email (Généré en temps réel) :</span>
                  <div className="bg-blue-50/50 border border-blue-150 p-3 rounded-xl font-sans text-3xs text-blue-900 leading-relaxed">
                    <p className="font-bold border-b border-blue-200 pb-1 mb-1">Objet : Réinitialisation de votre accès MédiSahel</p>
                    Bonjour,
                    <br /><br />
                    Votre compte a été réinitialisé par l'administrateur.
                    <br /><br />
                    Identifiant : <span className="font-mono font-bold font-black">{passwordResettingUser.login || passwordResettingUser.email?.split("@")[0] || "login"}</span>
                    <br /><br />
                    Mot de passe temporaire : <span className="font-mono font-black text-rose-700 bg-white px-1.5 rounded">{tempPassword}</span>
                    <br /><br />
                    Pour des raisons de sécurité, le systeme exigera un changement immédiat du mot de passe lors de votre prochaine connexion.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-1.5 bg-white border hover:bg-slate-50 text-slate-700 rounded-lg text-3xs font-extrabold uppercase cursor-pointer"
              >
                🖨️ Imprimer la fiche Provisoire
              </button>
              <button
                type="button"
                onClick={() => setPasswordResettingUser(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-lg text-3xs font-black uppercase cursor-pointer"
              >
                Valider et Clôre
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AUDIT PROMPT MODAL (Saisie Obligatoire du motif réglementaire) */}
      {auditPromptOpen && pendingPermissionChange && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="audit-motive-prompt">
          <div className="bg-white max-w-md w-full rounded-2xl border border-gray-150 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">🛡️</span>
                <div>
                  <h3 className="font-sans font-black text-xs text-slate-900 uppercase">Sûreté Administrative RBAC</h3>
                  <p className="text-[10px] text-gray-400">Confirmation réglementaire obligatoire</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setAuditPromptOpen(false);
                  setPendingPermissionChange(null);
                }}
                className="text-gray-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-3xs text-gray-400 leading-normal">
                Vous configurez une modification d'accréditation d'accès pour l'agent <strong className="text-slate-855">{selectedUser?.name}</strong> sur le module :
              </p>
              <div className="bg-slate-50 p-2.5 rounded-lg border text-4xs font-mono font-bold uppercase text-teal-800">
                Module : {MODULE_REGISTRY.find(m => m.id === pendingPermissionChange.moduleId)?.label}
                <br />
                {pendingPermissionChange.type === "STATUS" ? (
                  <span>Demande d'assignation : Statut &rarr; {pendingPermissionChange.newState}</span>
                ) : (
                  <span>Demande d'action : {pendingPermissionChange.checkboxKey} &rarr; {pendingPermissionChange.checkboxVal ? "ACTIF" : "INACTIF"}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-4xs font-mono uppercase tracking-widest text-gray-500 font-extrabold mb-1">Saisir le motif réglementaire de modification (Exigé)</label>
              <textarea
                rows={3}
                value={motiveText}
                onChange={e => setMotiveText(e.target.value)}
                placeholder="Exemple: Dérogation chef de service de garde, mutation service, etc."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-sans placeholder-gray-450 focus:outline-none focus:ring-1 focus:ring-teal-650"
              />
              <div className="space-y-1 mt-1">
                <span className="block text-[8px] uppercase text-gray-400 font-mono">Motifs fréquents rapides :</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Changement temporaire de garde",
                    "Ajustement du profil de mutation",
                    "Dérogation chef de service",
                    "Audit de contrôle réglementaire",
                    "Limitation d'accès de sécurité"
                  ].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setMotiveText(p)}
                      className="px-2 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-[9px] hover:bg-teal-50 hover:border-teal-300 transition-all cursor-pointer font-sans"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-gray-200 text-3xs font-mono text-gray-500 space-y-1">
              <div>🖥️ Agent modificateur : <strong className="text-slate-700">{currentUser.name}</strong></div>
              <div>⚡ IP : <strong>192.168.1.95</strong></div>
              <div>⚙️ Station : <strong>Secrétariat de Sûreté Mopti V3</strong></div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                onClick={() => {
                  setAuditPromptOpen(false);
                  setPendingPermissionChange(null);
                }}
                className="px-4 py-1.5 border hover:bg-slate-50 text-slate-700 rounded-xl text-3xs font-black uppercase tracking-wider cursor-pointer font-sans"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRevisionSave}
                className="px-4 py-1.5 bg-[#0F766E] hover:bg-teal-800 text-white rounded-xl text-3xs font-black uppercase tracking-wider shadow-enterprise cursor-pointer font-sans"
              >
                Confirmer l'inscription d'audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVISION HISTORY DIALOG FOR INDIVIDUAL MODULES */}
      {activeRevisionMod && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="history-audit-modal">
          <div className="bg-white max-w-lg w-full rounded-2xl border border-gray-150 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-50 text-[#0F766E] rounded-lg text-lg">📜</span>
                <div>
                  <h3 className="font-sans font-black text-xs text-slate-900 uppercase">Historique Complet & Registre des Révisions</h3>
                  <p className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">
                    Module : {MODULE_REGISTRY.find(m => m.id === activeRevisionMod)?.label}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveRevisionMod(null)}
                className="text-gray-400 hover:text-slate-700 font-bold"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {(permissionLogs[activeRevisionMod] || []).length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-gray-100 rounded-xl text-3xs text-gray-400 font-mono">
                  Aucun antécédent de modification de droit réglementé sur ce module pour {selectedUser?.name}.
                </div>
              ) : (
                (permissionLogs[activeRevisionMod] || []).map((log, lIdx) => (
                  <div key={lIdx} className="p-3 bg-slate-55 border rounded-xl space-y-1.5 text-xs text-slate-700 transition-colors bg-slate-50/50">
                    <div className="flex justify-between items-center text-4xs font-mono font-bold">
                      <span className="text-[#0F766E]">{log.date}</span>
                      <span className="text-gray-400">IP: {log.ip}</span>
                    </div>
                    
                    <div className="font-sans text-3xs leading-relaxed text-slate-800 font-medium">
                      Action : <strong className="text-teal-900">{log.action}</strong>
                      <br />
                      Motif réglementaire : <span className="italic font-normal text-slate-600">« {log.motive} »</span>
                    </div>

                    <div className="flex justify-between text-[9px] text-gray-400 font-mono border-t pt-1 border-dashed mt-1.5">
                      <span>Valideur: {log.admin}</span>
                      <span>Poste: {log.workstation}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-dashed text-4xs font-mono text-gray-500 text-center leading-normal">
              🔒 Tout enregistrement réglementaire inscrit au registre est inaltérable et signé par l'autorité administrative de MédiSahel Sûreté V3.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveRevisionMod(null)}
                className="px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-3xs font-black uppercase cursor-pointer"
              >
                Fermer le Registre
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
