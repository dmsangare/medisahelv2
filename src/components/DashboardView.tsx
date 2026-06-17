import React, { useState } from "react";
import { Patient } from "../types.ts";
import { 
  Users, 
  Activity, 
  TrendingUp, 
  ShieldAlert, 
  Bed, 
  AlertTriangle, 
  DollarSign, 
  Thermometer,
  Pill,
  Clock
} from "lucide-react";

interface BedAllocation {
  id: string;
  chambre: string;
  service: string;
  statut: string;
  patientNom?: string;
  temperature?: string;
}

interface StockItem {
  id: string;
  nom: string;
  quantite: number;
  seuilAlerte: number;
  datePeremption: string;
}

interface Invoice {
  id: string;
  statut: string;
  montantPatiente: number;
  montantAssurance: number;
}

interface TriageRecord {
  id: string;
  patientNom: string;
  couleur: string;
  plaintePrincipale: string;
}

interface DashboardViewProps {
  patientsList: Patient[];
  bedList: BedAllocation[];
  stockList: StockItem[];
  invoiceList: Invoice[];
  triageList: TriageRecord[];
  onOpenConsultation: () => void;
  clinicName: string;
  clinicSlogan: string;
  accentColor: string;
  onTabRedirect?: (tabId: string, label: string) => void;
  currentUser?: any;
}

export default function DashboardView({
  patientsList,
  bedList,
  stockList,
  invoiceList,
  triageList,
  onOpenConsultation,
  clinicName,
  clinicSlogan,
  accentColor,
  onTabRedirect,
  currentUser
}: DashboardViewProps) {
  const [medisahelClickModal, setMedisahelClickModal] = useState<any | null>(null);

  const handleTriageClick = (trg: TriageRecord) => {
    setMedisahelClickModal({
      isOpen: true,
      title: "Fiche d'Admission & Triage des Urgences",
      subtitle: `Patient : ${trg.patientNom}`,
      badge: `URGENCE ${trg.couleur.toUpperCase()}`,
      sections: [
        {
          title: "Évaluation Clinique Initiale",
          items: [
            { label: "Nom du Patient", value: trg.patientNom },
            { label: "Plainte principale / Motif", value: trg.plaintePrincipale },
            { label: "Niveau de gravité (Code tri)", value: trg.couleur },
            { label: "Infirmier de Tri d'accueil", value: "Sokhna DIOP (Adjointe de Garde)" }
          ]
        },
        {
          title: "Paramètres vitaux mesurés au SAS",
          items: [
            { label: "Température corporelle", value: trg.couleur === "Rouge" ? "39.5 °C" : "38.2 °C" },
            { label: "Tension Artérielle (BP)", value: trg.couleur === "Rouge" ? "85/45 mmHg" : "120/75 mmHg" },
            { label: "Fréquence Cardiaque (Pouls)", value: trg.couleur === "Rouge" ? "128 bpm" : "85 bpm" },
            { label: "Saturation Oxygène (SpO2)", value: trg.couleur === "Rouge" ? "88%" : "96%" }
          ]
        }
      ],
      actions: [
        { label: "Lancer prise en charge immédiate", onClick: () => { setMedisahelClickModal(null); onOpenConsultation(); }, primary: true },
        { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
      ]
    });
  };

  const handleBedClick = (bed: BedAllocation) => {
    const isOcc = bed.statut === "Occupé";
    setMedisahelClickModal({
      isOpen: true,
      title: `Supervision de l'Attribution du Lit - ${bed.id}`,
      subtitle: `Chambre : ${bed.chambre} | Service : ${bed.service}`,
      badge: bed.statut.toUpperCase(),
      sections: [
        {
          title: "Détails d'attribution",
          items: [
            { label: "Référence Lit", value: bed.id },
            { label: "Chambre d'hospitalisation", value: bed.chambre },
            { label: "Service Médical", value: bed.service },
            { label: "Statut d'occupation", value: bed.statut }
          ]
        },
        {
          title: "Patient hébergé actuel",
          items: [
            { label: "Nom complet du patient", value: isOcc && bed.patientNom ? bed.patientNom : "Lit vacant / Disponible" },
            { label: "Constante de température", value: isOcc ? `${bed.temperature || "37.5"}°C` : "N/A" },
            { label: "Infirmière responsable", value: "Salif KEITA (Garde active)" }
          ]
        }
      ],
      actions: [
        { label: "Gérer l'affectation du lit", onClick: () => { setMedisahelClickModal(null); onTabRedirect?.("hospitalization", "Hospitalisations"); }, primary: true },
        { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
      ]
    });
  };

  // Stats calculations
  const totalPatientsCount = patientsList.length;
  
  const occupiedBeds = bedList.filter(b => b.statut === "Occupé");
  const occupancyPercentage = bedList.length > 0 ? Math.round((occupiedBeds.length / bedList.length) * 100) : 0;

  const totalRevenue = invoiceList
    .filter(i => i.statut === "Payé")
    .reduce((sum, current) => sum + current.montantPatiente + current.montantAssurance, 0);

  const lowStockItems = stockList.filter(s => s.quantite <= s.seuilAlerte);
  const expiringSoonCount = stockList.filter(s => {
    const monthsLeft = (new Date(s.datePeremption).getTime() - Date.now()) / (1000 * 3600 * 24 * 30.4);
    return monthsLeft <= 2; // under 60 days
  }).length;

  // Custom SVG path computations for professional visual reports
  const mockDailyTrend = [12, 18, 15, 23, 30, 24, 28]; // admissions across past week
  const maxVal = Math.max(...mockDailyTrend);
  const chartHeight = 100;
  const chartWidth = 500;
  const points = mockDailyTrend.map((val, idx) => {
    const x = (idx / (mockDailyTrend.length - 1)) * chartWidth;
    const y = chartHeight - (val / maxVal) * 80 - 10;
    return `${x},${y}`;
  }).join(" ");

  // Custom cockpit generator helper by profile-role (Requirement 7)
  const renderProfileCockpit = () => {
    if (!currentUser) return null;

    const role = currentUser.role || "DOCTOR";
    const name = currentUser.name || "Praticien Sahel";

    const baseWidgetStyle = "bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3";

    if (["ADMIN", "PROMOTEUR", "DG"].includes(role)) {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-dg">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Espace Direction & Promoteur</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">HAUTE STRATÉGIE</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("espace_dg", "Espace Promoteur / DG")} className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📊 Reporting & Finances</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">États comptables réels</span>
            </button>
            <button onClick={() => onTabRedirect?.("surveillance_epidemio", "Surveillance")} className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🦠 Surveillance MDO</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Maladies obligatoires</span>
            </button>
            <button onClick={() => onTabRedirect?.("users", "Gouvernance RBAC")} className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🛡️ Gouvernance RBAC</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Accès & signatures</span>
            </button>
            <button onClick={() => onTabRedirect?.("audit", "Registre d'Audit")} className="p-2.5 rounded-lg border border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📜 Registre d'Audit</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Traçabilité légale</span>
            </button>
          </div>
        </div>
      );
    }

    if (["DOCTOR", "MEDECIN_GENERAL_CHIEF"].includes(role)) {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-doctor">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Cockpit Praticien DME & Consultations</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">MÉDECIN</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={onOpenConsultation} className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🩺 Cabinet de Consultations</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Lancer dossier DMG</span>
            </button>
            <button onClick={() => onTabRedirect?.("dme", "Dossier Patient DME")} className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📁 DME Confidentiel</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Dossiers originaux patient</span>
            </button>
            <button onClick={() => onTabRedirect?.("appointments", "Agenda")} className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📅 Planning & RDVs</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Patients planifiés</span>
            </button>
            <button onClick={() => onTabRedirect?.("clinical-admin", "Supervision Clinique")} className="p-2.5 rounded-lg border border-slate-100 hover:border-teal-300 hover:bg-teal-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">✍️ Contre-signatures</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Validation des soins stagiaires</span>
            </button>
          </div>
        </div>
      );
    }

    if (["NURSE", "AIDE_SOIGNANT", "STAGIAIRE"].includes(role)) {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-nurse">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Bed className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Cockpit Hospitalisation & Surveillance Clinique</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">SOIGNANT</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("hospitalization", "Lits")} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🛌 Lits & Gardes</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Hospitalisations et constantes</span>
            </button>
            <button onClick={() => onTabRedirect?.("patients", "Patients")} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📋 Admissions & Triages</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Arrivées et urgences</span>
            </button>
            <button onClick={() => onTabRedirect?.("dmg", "Consultations")} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">💉 Administration Actes</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Valider actes infirmiers</span>
            </button>
            <button onClick={() => onTabRedirect?.("documents", "Archive")} className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📂 Fiches Médicales GECD</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Documents & rapports</span>
            </button>
          </div>
        </div>
      );
    }

    if (role === "LAB_TECH") {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-lab">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                <Activity className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Paillasse Laboratoire & Résultats d'examens</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">EXAMENS</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("lab", "Laboratoire")} className="p-2.5 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🔬 Paillasse d'Analyses</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Saisir NFS, chimie, parasito</span>
            </button>
            <button onClick={() => onTabRedirect?.("dme", "DME")} className="p-2.5 rounded-lg border border-slate-100 hover:border-purple-300 hover:bg-purple-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📁 Dossiers Cliniques</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Historiques et antécédents</span>
            </button>
          </div>
        </div>
      );
    }

    if (["PHARMACIST", "GESTIONNAIRE_STOCK"].includes(role)) {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-pharmacist">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                <Pill className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Officine & Gestion des Stocks (FEFO)</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">PHARMACIE</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("pharmacy_sales", "Vente pharmacie")} className="p-2.5 rounded-lg border border-slate-100 hover:border-sky-300 hover:bg-sky-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">💊 Vente & Dispensation</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Vente comptant ordonnances</span>
            </button>
            <button onClick={() => onTabRedirect?.("pharmacy_stock", "Gestion des stocks")} className="p-2.5 rounded-lg border border-slate-100 hover:border-sky-300 hover:bg-sky-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📦 Lots & Inventaire FEFO</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Péremptions et alertes</span>
            </button>
          </div>
        </div>
      );
    }

    if (role === "CASHIER") {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-cashier">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <DollarSign className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Caisse Centrale & Facturation Mutuelle</h4>
                <p className="text-[10px] text-slate-400 font-medium">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">COMPTABILITÉ</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("billing", "Comptabilité")} className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">💵 Caisse & Encaissements</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Facturer des soins ou des lits</span>
            </button>
            <button onClick={() => onTabRedirect?.("pharmacy_sales", "Vente pharmacie")} className="p-2.5 rounded-lg border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">💊 Ventes Pharmacie</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Encaissements ordonnances</span>
            </button>
          </div>
        </div>
      );
    }

    if (role === "HR") {
      return (
        <div className={baseWidgetStyle} id="profile-cockpit-hr">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                <Clock className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold font-display text-slate-800">Gestion des Présences & Bulletins de Paie</h4>
                <p className="text-[10px] text-slate-400 font-medium font-sans">Connecté en tant que {name}</p>
              </div>
            </div>
            <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-mono font-bold uppercase">RH</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs pt-1">
            <button onClick={() => onTabRedirect?.("presences", "Présences")} className="p-2.5 rounded-lg border border-slate-100 hover:border-rose-300 hover:bg-rose-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">⏱️ Présences & Absences</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Pointages et retards de l'équipe</span>
            </button>
            <button onClick={() => onTabRedirect?.("payroll", "Paie")} className="p-2.5 rounded-lg border border-slate-100 hover:border-rose-300 hover:bg-rose-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">🪙 Bulletins de Paie & Primes</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Générer les salaires Sahel</span>
            </button>
            <button onClick={() => onTabRedirect?.("documents", "GECD Archive")} className="p-2.5 rounded-lg border border-slate-100 hover:border-rose-300 hover:bg-rose-50/20 text-left cursor-pointer transition">
              <p className="font-bold text-slate-705">📂 Documents RH</p>
              <span className="text-[9px] text-slate-400 block mt-0.5">Contrats et attestations</span>
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6" id="dashboard-view-wrapper">
      {/* Clinic branding welcome unit */}
      <div 
        className="rounded-xl p-6 text-white bg-gradient-to-r relative overflow-hidden shadow-sm"
        style={{ backgroundImage: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)` }}
      >
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] bg-white/20 text-white font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase">
            Système Centralisé Établissement
          </span>
          <h2 className="text-xl font-bold mt-2 font-display">{clinicName}</h2>
          <p className="text-xs text-slate-100 italic mt-1 font-medium">{clinicSlogan}</p>
          <div className="flex gap-2.5 mt-4">
            <button 
              onClick={onOpenConsultation}
              className="bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs py-1.5 px-3.5 rounded-lg cursor-pointer transition-all shadow-md"
            >
              Nouvelle Consultation
            </button>
            <div className="bg-black/15 text-white border border-white/20 font-mono text-[11px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Serveur Local Synchrone</span>
            </div>
          </div>
        </div>
        {/* Abstract background vector glyphs */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <Activity className="h-32 w-32" />
        </div>
      </div>

      {/* Dynamic profile-specific cockpit workspace (Requirement 7) */}
      {renderProfileCockpit()}

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Patients */}
        <div 
          onClick={() => onTabRedirect?.("patients", "Dossiers Patients")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-sky-300 hover:bg-slate-50/70 transition-all group duration-150"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider group-hover:text-sky-600 transition-colors">Patients Enregistrés</span>
            <span className="text-2xl font-bold text-slate-800">{String(totalPatientsCount).padStart(2, "0")}</span>
            <span className="text-[10px] text-slate-400 block">+2 aujourd'hui</span>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 2: Bed state */}
        <div 
          onClick={() => onTabRedirect?.("hospitalisation", "Hospitalisation & Lits")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/25 transition-all group duration-150"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Occupation Lits</span>
            <span className="text-2xl font-bold text-slate-800">{occupancyPercentage}%</span>
            <span className="text-[10px] text-slate-400 block">{occupiedBeds.length} lit(s) occupé(s) / {bedList.length}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-105 transition-transform">
            <Bed className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 3: Monétaire caisse */}
        <div 
          onClick={() => onTabRedirect?.("billing", "Caisse & Transac.")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-300 hover:bg-amber-50/25 transition-all group duration-150"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider group-hover:text-amber-700 transition-colors">Chiffre d'Affaires</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">{totalRevenue.toLocaleString("fr-FR")} FCFA</span>
            <span className="text-[10px] text-emerald-600 font-medium block">Liquidités collectées 100%</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600 group-hover:scale-105 transition-transform">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Stat 4: Rupture Alertes */}
        <div 
          onClick={() => onTabRedirect?.("stock", "Pharmacie & Stock")}
          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-red-300 hover:bg-red-50/25 transition-all group duration-150"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider group-hover:text-red-700 transition-colors">Alerte Pharmacie</span>
            <span className="text-2xl font-bold text-red-600">
              {lowStockItems.length + expiringSoonCount}
            </span>
            <span className="text-[10px] text-red-500 font-medium block">
              {lowStockItems.length} ruptures | {expiringSoonCount} périmés bientôt
            </span>
          </div>
          <div className={`p-3 rounded-lg group-hover:scale-105 transition-transform ${lowStockItems.length > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Middle Grid - Activity Analytics and Priority Bed Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom SVG Graphical Admissions Curve (Free from hydration issues) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Flux des Admissions Récentes</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Visites reçues sur les 7 derniers jours par le médecin</p>
            </div>
            <span className="text-[11px] text-sky-600 font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +22.4% vs semaine passée
            </span>
          </div>

          <div className="py-2" id="canvas-reports-graph">
            <div className="relative">
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1="10" x2={chartWidth} y2="10" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2={chartWidth} y2="90" stroke="#f5f5f7" strokeWidth="1" />

                {/* Spline area */}
                <polyline
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="2.5"
                  points={points}
                />

                {/* Data points */}
                {mockDailyTrend.map((val, idx) => {
                  const x = (idx / (mockDailyTrend.length - 1)) * chartWidth;
                  const y = chartHeight - (val / maxVal) * 80 - 10;
                  return (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="3.5"
                        fill="white"
                        stroke={accentColor}
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#64748b"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between text-[10px] font-semibold text-slate-400 font-mono mt-3">
              <span>Mardi</span>
              <span>Mercredi</span>
              <span>Jeudi</span>
              <span>Vendredi</span>
              <span>Samedi</span>
              <span>Dimanche</span>
              <span>Aujourd'hui</span>
            </div>
          </div>
        </div>

        {/* Triage & Urgent Patients List queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-orange-500" /> Triage des Urgences Actif
          </h3>
          
          {triageList.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center py-6">Aucun patient aux urgences.</p>
          ) : (
            <div className="space-y-2 max-h-[140px] overflow-y-auto">
              {triageList.map((trg) => {
                const badgeStyle = 
                  trg.couleur === "Rouge" 
                    ? "bg-red-50 text-red-700 border-red-200" 
                    : trg.couleur === "Orange"
                    ? "bg-orange-50 text-orange-700 border-orange-200"
                    : trg.couleur === "Jaune"
                    ? "bg-yellow-50 text-yellow-800 border-yellow-250"
                    : "bg-green-50 text-green-700 border-green-200";

                return (
                  <div 
                    key={trg.id} 
                    onClick={() => handleTriageClick(trg)}
                    className="p-2.5 rounded-lg border border-slate-150 flex items-center justify-between text-xs cursor-pointer hover:bg-orange-50/50 hover:border-orange-200 transition-all duration-150 select-none active:scale-98"
                  >
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 hover:text-orange-700 hover:underline">{trg.patientNom}</h4>
                      <p className="text-[11px] text-slate-500 italic max-w-[150px] truncate">{trg.plaintePrincipale}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeStyle}`}>
                      {trg.couleur}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bed Layout view list */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-sky-600" /> Plan d'occupation des lits et chambres
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Visualisez en temps réel la disponibilité par service (Salles d'hospitalisation de la clinique)</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {bedList.map((bed) => {
            const isOcc = bed.statut === "Occupé";
            const isMaint = bed.statut === "Maintenance";
            
            return (
              <div
                key={bed.id}
                onClick={() => handleBedClick(bed)}
                className={`p-3.5 rounded-lg border text-center relative cursor-pointer hover:scale-105 active:scale-95 select-none transition-all duration-150 ${
                  isOcc
                    ? "bg-red-50/40 border-red-200 text-red-950 shadow-xs hover:border-red-400"
                    : isMaint
                    ? "bg-slate-100 border-slate-250 text-slate-500 hover:bg-slate-150"
                    : "bg-emerald-50/40 border-emerald-200 text-emerald-950 hover:shadow-md hover:border-emerald-400"
                }`}
              >
                <div className="flex justify-center mb-1">
                  <Bed className={`h-4 w-4 ${isOcc ? "text-red-600" : isMaint ? "text-slate-400" : "text-emerald-600"}`} />
                </div>
                <h5 className="font-bold text-xs">{bed.id}</h5>
                <p className="text-[9px] text-slate-400 font-semibold truncate mt-0.5">{bed.chambre}</p>
                <span className="text-[9px] text-slate-400 font-mono italic block truncate">{bed.service}</span>

                {isOcc && bed.patientNom && (
                  <div className="mt-1.5 pt-1.5 border-t border-red-150/40 text-[9px]">
                    <span className="font-bold text-slate-800 block truncate">{bed.patientNom}</span>
                    <span className="text-red-700 font-semibold flex items-center justify-center gap-0.5">
                      <Thermometer className="h-3 w-3 inline text-red-500" /> {bed.temperature || "37.5"}°C
                    </span>
                  </div>
                )}

                <span className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                  isOcc ? "bg-red-600" : isMaint ? "bg-slate-600" : "bg-emerald-600"
                }`}></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Modal for Everything is Clickable (TOUT EST CLIQUABLE) rule */}
      {medisahelClickModal && medisahelClickModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="medisahel-clickable-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {medisahelClickModal.badge || "MÉD_SAHEL SECURE"}
                </span>
                <h3 className="text-sm font-bold font-display text-slate-800 mt-1">{medisahelClickModal.title}</h3>
                {medisahelClickModal.subtitle && (
                  <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5">{medisahelClickModal.subtitle}</p>
                )}
              </div>
              <button 
                onClick={() => setMedisahelClickModal(null)}
                className="p-1 px-2 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto w-full">
              {medisahelClickModal.sections.map((sect: any, sIdx: number) => (
                <div key={sIdx} className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                    {sect.title} :
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                    {sect.items.map((item: any, iIdx: number) => (
                      <div key={iIdx} className="flex justify-between items-start gap-4 text-xs font-sans">
                        <span className="text-slate-400 font-medium">{item.label}</span>
                        <span className={`text-right text-slate-800 font-semibold ${item.mono ? "font-mono text-[10px]" : ""}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-wrap justify-end gap-2.5">
              {medisahelClickModal.actions?.map((act: any, aIdx: number) => (
                <button
                  key={aIdx}
                  onClick={act.onClick}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    act.primary 
                      ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md"
                      : "bg-white hover:bg-slate-100 text-slate-705 border border-slate-200"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
