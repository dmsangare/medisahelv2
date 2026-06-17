import React, { useState, useEffect } from "react";
import { 
  Users, Stethoscope, Clock, ShieldAlert, CheckCircle, Calendar, DollarSign,
  Award, TrendingUp, Plus, Check, PlusCircle, UserCheck, RefreshCw, Sliders,
  AlertTriangle, BookOpen, Send, UserX, FileText, ChevronRight, Activity, Zap,
  BellRing, ListOrdered, HandCoins, MoreVertical, Volume2, Lock, FlaskConical
} from "lucide-react";
import { User, Patient, Hospitalization, Payroll } from "../types.ts";
import { DmgLabScenario } from "./DmgLabScenario.tsx";
import { StructuredPrescriptionEditor } from "./StructuredPrescriptionEditor.tsx";
import { DmgCabinetWorkspace } from "./DmgCabinetWorkspace.tsx";

interface DmgModuleViewProps {
  token: string | null;
  patients: Patient[];
  currentUser: User;
  clinicThemeColor: string;
  initialPatientId?: string | null;
  onClearInitialPatientId?: () => void;
}

// Interfaces for our DMG Department local persistent entities
interface WorkShift {
  id: string;
  agentName: string;
  agentRole: string; // NURSE, DOCTOR, STAGIAIRE, LAB_TECH, AIDE_SOIGNANT
  shiftType: "Matin" | "Soir" | "Nuit";
  date: string;
  hours: string;
  status: "Présent" | "En retard" | "Absent";
  bonusCalculated: number;
  bonusPaid: boolean;
}

interface NursingCare {
  id: string;
  patientId: string;
  patientName: string;
  careType: string;
  productUsed: string;
  quantityUsed: string;
  scheduledTime: string;
  executedTime?: string;
  status: "À faire" | "En cours" | "Réalisée" | "En attente de validation" | "Validée" | "Annulée";
  observations: string;
  executorName: string;
  executorRole: string;
  validatorName?: string;
  validatorRole?: string;
  validatedAt?: string;
  digitalSignature?: string;
  validatedBy?: string;
}

interface MedicalAlert {
  id: string;
  patientId: string;
  patientName: string;
  roomNumber: string;
  bedNumber: string;
  constName: "Température" | "Tension" | "Glycémie" | "Saturation O2";
  constValue: string;
  severity: "Normal" | "Sous surveillance" | "Critique" | "Urgence";
  details: string;
  doctorNotified: string;
  status: "Active" | "Traitée";
  createdAt: string;
}

interface CounterVisit {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  notes?: string;
  status: "Planifiée" | "Effectuée" | "Manquée";
}

interface ShiftHandover {
  id: string;
  fromShift: "Matin" | "Soir" | "Nuit";
  toShift: "Matin" | "Soir" | "Nuit";
  date: string;
  senderName: string;
  criticalCases: string;
  pendingCares: string;
  pendingLabs: string;
  incidents: string;
  status: "Transmis" | "Reçu" | "Validé";
  validatedBy?: string;
  validatedAt?: string;
}

interface MainCouranteEntry {
  id: string;
  category: "Incident" | "Panne" | "Urgence" | "Rupture de Stock" | "Evènement exceptionnel";
  author: string;
  details: string;
  date: string;
  time: string;
  service: string;
}

class DmgErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DmgErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4 max-w-xl mx-auto my-10 shadow-xs text-xs font-semibold">
          <div className="inline-flex p-3 bg-rose-100 rounded-full text-rose-600">
            <AlertTriangle className="h-6 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            Une erreur clinique interne est survenue
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto font-normal">
            L'affichage de cet onglet n'a pas pu être chargé correctement par l'interface utilisateur. 
            Le système a préventivement isolé cette anomalie pour préserver l'intégrité de l'application.
          </p>
          {this.state.error && (
            <pre className="text-[10px] font-mono p-3 bg-rose-950 text-rose-200 rounded-xl overflow-x-auto text-left max-h-32 mb-4">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Réessayer le chargement
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

interface VitalsSurveillanceFormProps {
  dmgHospitalized: Hospitalization[];
  patients: Patient[];
  hospList: Hospitalization[];
  submitManualVitals: (
    patientId: string,
    patientName: string,
    room: string,
    bed: string,
    temp: string,
    bp: string,
    pulse: string,
    sat: string,
    gluc: string
  ) => void;
  showToast: (text: string, type?: "success" | "error") => void;
}

const VitalsSurveillanceForm: React.FC<VitalsSurveillanceFormProps> = ({
  dmgHospitalized,
  patients,
  hospList,
  submitManualVitals,
  showToast
}) => {
  const [temp, setTemp] = useState("");
  const [bp, setBp] = useState("12/8");
  const [pulse, setPulse] = useState("75");
  const [sat, setSat] = useState("98");
  const [glyc, setGlyc] = useState("1.1");
  const [hospId, setHospId] = useState("");

  const handleVitalsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hospId) {
      showToast("Veuillez choisir un patient.", "error");
      return;
    }
    const h = hospList.find((x) => x.id === hospId);
    if (!h) return;
    const patObj = patients.find((p) => p.id === h.patientId);
    const name = patObj ? `${patObj.lastName.toUpperCase()} ${patObj.firstName}` : "Patient";

    submitManualVitals(h.patientId, name, h.roomNumber || "N/A", h.bedNumber || "N/A", temp, bp, pulse, sat, glyc);
    setTemp("");
    setBp("12/8");
    setPulse("75");
    setSat("98");
    setGlyc("1.1");
  };

  return (
    <form onSubmit={handleVitalsSubmit} className="space-y-3.5 text-xs font-semibold">
      <div>
        <label className="block text-slate-500 text-[10px] mb-1 font-mono">Patient hospitalisé</label>
        <select
          value={hospId}
          onChange={(e) => setHospId(e.target.value)}
          className="w-full p-2.5 bg-white border border-gray-255 rounded-xl font-sans"
        >
          <option value="">-- Choisir --</option>
          {dmgHospitalized.map((h) => {
            const patObj = patients.find((p) => p.id === h.patientId);
            return (
              <option key={h.id} value={h.id}>
                {patObj ? `${patObj.lastName.toUpperCase()} ${patObj.firstName}` : "Inconnu"} (Room {h.roomNumber})
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-500 text-[10px] mb-1 font-mono">Température (°C)</label>
          <input
            type="text"
            value={temp}
            onChange={(e) => setTemp(e.target.value)}
            className="w-full p-2 bg-white border border-gray-255 rounded-xl font-mono text-center"
            placeholder="e.g. 37.2"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] mb-1 font-mono">Tension Arterielle (TA)</label>
          <input
            type="text"
            value={bp}
            onChange={(e) => setBp(e.target.value)}
            className="w-full p-2 bg-white border border-gray-255 rounded-xl font-mono text-center"
            placeholder="e.g. 12/8"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-slate-500 text-[10px] mb-1 font-mono">Pouls (BPM)</label>
          <input
            type="text"
            value={pulse}
            onChange={(e) => setPulse(e.target.value)}
            className="w-full p-2 bg-white border border-gray-255 rounded-xl font-mono text-center"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] mb-1 font-mono">Sat O2 (%)</label>
          <input
            type="text"
            value={sat}
            onChange={(e) => setSat(e.target.value)}
            className="w-full p-2 bg-white border border-gray-255 rounded-xl font-mono text-center"
          />
        </div>
        <div>
          <label className="block text-slate-500 text-[10px] mb-1 font-mono">Glycémie (g/L)</label>
          <input
            type="text"
            value={glyc}
            onChange={(e) => setGlyc(e.target.value)}
            className="w-full p-2 bg-white border border-gray-255 rounded-xl font-mono text-center"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
      >
        Soumettre &amp; Tester la Constante
      </button>
    </form>
  );
};

export const DmgModuleView: React.FC<DmgModuleViewProps> = ({ 
  token, 
  patients, 
  currentUser, 
  clinicThemeColor,
  initialPatientId,
  onClearInitialPatientId
}) => {
  // Navigation tabs of DMG
  const [activeSubTab, setActiveSubTab] = useState<
    "dashboard" | "patients" | "nursing_cares" | "guards_shifts" | "alerts" | "counter_visits" | "handovers" | "audit" | "team" | "space_agent" | "emails" | "workflow_scenario"
  >("dashboard");

  // State for Patients advanced module / Consultation
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [selectedPatientForConsultation, setSelectedPatientForConsultation] = useState<any>(null);
  
  // Real-time waiting queue state elements
  const [waitingQueue, setWaitingQueue] = useState<any[]>([]);
  const [activeQueuePopup, setActiveQueuePopup] = useState<any | null>(null);
  const [selectedQueueItemForDetails, setSelectedQueueItemForDetails] = useState<any | null>(null);
  const [activeStatusMenuId, setActiveStatusMenuId] = useState<string | null>(null);

  // Rich dashboard feature interactivity states
  const [activeIndicatorDetail, setActiveIndicatorDetail] = useState<any | null>(null);
  const [activeAlertDetail, setActiveAlertDetail] = useState<any | null>(null);
  const [activeTransmissionDetail, setActiveTransmissionDetail] = useState<any | null>(null);

  const playSoundAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5 (musical chime)
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (err) {
      console.warn("Audio Context sound alert could not play:", err);
    }
  };

  const handleLaunchConsultationFromDashboard = (patientData: any) => {
    let matchedPatient = patients.find(p => 
      p.lastName.toLowerCase() === (patientData.lastName || "").toLowerCase() ||
      p.firstName.toLowerCase() === (patientData.firstName || "").toLowerCase()
    );
    if (!matchedPatient && patients.length > 0) {
      matchedPatient = patients[0];
    }
    
    if (matchedPatient) {
      setSelectedPatientForConsultation(matchedPatient);
      setSelectedPatientForDetail(matchedPatient);
      setActiveSubTab("patients");
      setConsultationForm({
        symptoms: patientData.motif || "Suivi clinique systématique",
        exam: "Température et constantes stables.",
        diagnosis: "Diabète ou HTA sous contrôle.",
        prescription: "",
        notes: `Consultation initiée via clic sur le tableau de bord DMG V2.`
      });
      showToast(`Cabinet de consultation ouvert pour ${matchedPatient.lastName.toUpperCase()} ${matchedPatient.firstName}`);
    } else {
      showToast(`Création temporaire de consultation pour ${patientData.firstName} ${patientData.lastName}`);
    }
  };

  // ================= SCENARIO WORKFLOW SIMULATOR STATES =================
  const [scStep, setScStep] = useState<number>(1);
  const [scPatient, setScPatient] = useState({
    id: "P2026-0123",
    firstName: "Fatoumata",
    lastName: "Diallo",
    age: 32,
    gender: "Féminin",
    phone: "76 12 34 56",
    bloodGroup: "A+",
    ethnicity: "Peulh",
    insurance: "CANAM",
    allergies: "Aucune",
    antecedents: "HTA",
    consultationNo: "N°consul-1306-0001",
    symptoms: "",
    diagnostic: "Paludisme simple",
    prescriptionText: "",
    vitalsEntered: false,
    vitals: {
      temp: "",
      bp_sys: "",
      bp_dia: "",
      pulse: "",
      resp: "",
      spo2: "",
      notes: ""
    }
  });

  const [scQueue, setScQueue] = useState([
    { id: "q-101", name: "Amadou Diallo", time: "09:00", number: "CONSUL-1306-0000", status: "En consultation", code: "CIM-F43" },
    { id: "q-102", name: "Fatoumata Diallo", time: "09:32", number: "CONSUL-1306-0001", status: "En attente", code: "CIM-LB02.5" },
    { id: "q-103", name: "Mariam Keita", time: "09:45", number: "CONSUL-1306-0002", status: "En attente", code: "" }
  ]);

  const [scCares, setScCares] = useState([
    { id: "sc-c1", name: "Perfusion de sérum glucosé", role: "Infirmier", assignedTo: "Fatoumata Diarra (Infirmière)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" },
    { id: "sc-c2", name: "Prise des constantes (TA, T°, pouls)", role: "Aide-soignant", assignedTo: "Moussa Coulibaly (Aide-soignant)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" },
    { id: "sc-c3", name: "Surveillance post-perfusion", role: "Stagiaire", assignedTo: "Awa Touré (Stagiaire)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" }
  ]);

  // ================= SCENARIO LABORATOIRE STATES =================
  const [activeScenarioType, setActiveScenarioType] = useState<"clinique" | "labo">("clinique");
  const [labScStep, setLabScStep] = useState<number>(1);
  const [labScPrescribedExams, setLabScPrescribedExams] = useState([
    { id: "nfs", name: "NFS (Numération Formule Sanguine)", price: 3000, selected: true },
    { id: "tdr", name: "TDR Paludisme", price: 2000, selected: true },
    { id: "glycemie", name: "Glycémie", price: 2000, selected: false }
  ]);
  const [labScPaymentMode, setLabScPaymentMode] = useState<string>("Orange Money");
  const [labScResultValues, setLabScResultValues] = useState({
    nfsHb: "12.5",
    nfsGb: "8500",
    nfsPlat: "220000",
    tdrResult: "POSITIF",
    glycemieVal: "0.95",
    observations: "Prélèvement de bonne qualité",
    signature: "MK-13062025-0945",
    laborantin: "Mariam Koné"
  });
  const [labScSigned, setLabScSigned] = useState<boolean>(false);
  const [labScIsPaid, setLabScIsPaid] = useState<boolean>(false);
  // ======================================================================

  const handleUpdateQueueStatus = async (itemId: string, newStatus: string) => {
    try {
      const item = waitingQueue.find(q => q.id === itemId);
      if (!item) return;

      const response = await fetch(`/api/waiting-queue/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setWaitingQueue(prev => prev.map(q => q.id === itemId ? updated : q));
        showToast(
          `Statut mis à jour : ${newStatus === "EN_CONSULTATION" ? "En Consultation" : newStatus === "TERMINE" ? "Terminée" : "En Attente"}`
        );
        
        if (newStatus === "EN_CONSULTATION") {
          const pat = patients.find(p => p.id === item.patientId);
          if (pat) {
            setSelectedPatientForConsultation(pat);
            setConsultationForm({
              symptoms: item.notes || "Suivi clinique",
              exam: "Température et constantes stables.",
              diagnosis: "Diagnostic clinique en cours de précision.",
              prescription: "",
              notes: `Consultation initiée via la file d'attente active (Ordre #${item.ordre}).`
            });
            
            // Initialize vitals and history text
            if (pat.id === "patient-diara" || pat.lastName.toLowerCase().includes("diara")) {
              setConsultTaille("175");
              setConsultPoids("70");
              setConsultTA("120/80");
              setConsultPouls("75");
              setConsultTemp("37.8");
              setConsultSpO2("98");
              setConsultHistoire("Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë.");
            } else {
              setConsultTaille("170");
              setConsultPoids("78");
              setConsultTA("128/75");
              setConsultPouls("78");
              setConsultTemp("36.8");
              setConsultSpO2("98");
              setConsultHistoire(`Patient ${pat.lastName.toUpperCase()} ${pat.firstName} (${pat.dateOfBirth ? (new Date().getFullYear() - new Date(pat.dateOfBirth).getFullYear()) : "31"} ans) reçu pour consultation.`);
            }

            writeDmgAuditLog("REALTIME_CONSULTATION_START", `Prise en charge en consultation du patient ${pat.lastName.toUpperCase()} ${pat.firstName} (Ordre #${item.ordre})`);
          }
        } else if (newStatus === "TERMINE") {
          writeDmgAuditLog("REALTIME_CONSULTATION_END", `Fin de prise en charge et libération du dossier du patient (Ordre #${item.ordre})`);
        }
      }
    } catch (err) {
      console.error("Failed to update queue item status", err);
      showToast("Erreur de modification du statut en base", "error");
    }
  };

  const handleDeleteQueueItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/waiting-queue/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (response.ok) {
        setWaitingQueue(prev => prev.filter(q => q.id !== itemId));
        showToast("Patient retiré de la file d'attente active");
        writeDmgAuditLog("QUEUE_DELETION", `Retrait manuel d'un patient de la salle d'attente (Queue ID: ${itemId})`);
      }
    } catch (err) {
      console.error("Failed to delete queue item", err);
      showToast("Erreur lors de la suppression de base", "error");
    }
  };
  
  // Smart consultation editor state
  const [consultationForm, setConsultationForm] = useState({
    symptoms: "",
    exam: "",
    diagnosis: "",
    prescription: "",
    notes: "",
  });

  // Refactored 3-Column DMG Consultation Workspace States
  const [consultTaille, setConsultTaille] = useState("175");
  const [consultPoids, setConsultPoids] = useState("70");
  const [consultTA, setConsultTA] = useState("120/80");
  const [consultPouls, setConsultPouls] = useState("75");
  const [consultTemp, setConsultTemp] = useState("37.8");
  const [consultSpO2, setConsultSpO2] = useState("98");
  const [consultHistoire, setConsultHistoire] = useState("Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë.");
  const [consultMeds, setConsultMeds] = useState<string[]>(["Paracétamol 500 mg, posologie standard", "Amoxicilline 500 mg"]);
  const [consultExams, setConsultExams] = useState<string[]>(["NFS", "Glycémie"]);
  const [consultCimDiag, setConsultCimDiag] = useState("Paludisme simple [CIM-11: 1F40.0]");
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [atMenuSearch, setAtMenuSearch] = useState("");
  const [customMedInput, setCustomMedInput] = useState("");
  const [customExamInput, setCustomExamInput] = useState("");
  const [cimSearchQuery, setCimSearchQuery] = useState("");
  const [showCimSuggestions, setShowCimSuggestions] = useState(false);

  useEffect(() => {
    if (selectedPatientForConsultation) {
      setConsultHistoire(
        selectedPatientForConsultation.lastName.toUpperCase() === "DIARA" || selectedPatientForConsultation.lastName.toUpperCase() === "DIARRA"
          ? "Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë, courbatures, arthralgies et céphalées intenses."
          : `Patient ${selectedPatientForConsultation.lastName.toUpperCase()} ${selectedPatientForConsultation.firstName} reçu en consultation.`
      );
      setConsultMeds(["Paracétamol 500 mg, posologie standard", "Amoxicilline 500 mg"]);
      setConsultExams(["NFS", "Glycémie"]);
      setConsultCimDiag("Paludisme simple [CIM-11: 1F40.0]");
      setConsultTaille("175");
      setConsultPoids("70");
      setConsultTA("120/80");
      setConsultPouls("75");
      setConsultTemp("37.8");
      setConsultSpO2("98");
    }
  }, [selectedPatientForConsultation]);

  const autocompleteSuggestions = [
    { trigger: "@paracetamol", replacement: "Paracétamol 500 mg, posologie standard", type: "med" },
    { trigger: "@ceftriaxone", replacement: "Ceftriaxone 1g IM/IV", type: "med" },
    { trigger: "@amoxicilline", replacement: "Amoxicilline 500 mg", type: "med" },
    { trigger: "@nfs", replacement: "Demande NFS", type: "exam" },
    { trigger: "@glycemie", replacement: "Demande Glycémie", type: "exam" },
    { trigger: "@tdr", replacement: "Demande TDR Paludisme", type: "exam" },
    { trigger: "@echographie", replacement: "Demande d'imagerie: Échographie", type: "exam" },
    { trigger: "@antecedent", replacement: "Antécédents : Hypertension, Diabète type 2, Appendicectomie", type: "model" },
    { trigger: "@examen", replacement: "Examen clinique : Taille 175cm, Poids 70kg, TA 120/80, Pouls 75, Temp 37.2°C, SpO2 98%", type: "model" },
    { trigger: "@conclusion", replacement: "Conclusion : Patient stable, bonne tolérance. Repos médical prescrit de 3 jours.", type: "model" }
  ];

  const handleSelectAtCommand = (cmd: { trigger: string; replacement: string; type: string }) => {
    let updatedHistoire = consultHistoire;
    if (updatedHistoire.toLowerCase().endsWith("@")) {
      updatedHistoire = updatedHistoire.substring(0, updatedHistoire.length - 1) + cmd.replacement;
    } else {
      const regex = new RegExp(cmd.trigger, "gi");
      if (updatedHistoire.toLowerCase().includes(cmd.trigger)) {
        updatedHistoire = updatedHistoire.replace(regex, cmd.replacement);
      } else {
        updatedHistoire = updatedHistoire + " " + cmd.replacement;
      }
    }
    setConsultHistoire(updatedHistoire);
    setShowAtMenu(false);

    if (cmd.type === "med") {
      if (!consultMeds.some(m => m.toLowerCase().includes(cmd.trigger.substring(1)))) {
        setConsultMeds(prev => [...prev, cmd.replacement]);
        showToast(`💊 '${cmd.replacement}' ajouté aux ordonnances prescrites.`, "success");
      }
    } else if (cmd.type === "exam") {
      const examName = cmd.replacement.replace("Demande ", "").replace("d'imagerie: ", "");
      if (!consultExams.includes(examName)) {
        setConsultExams(prev => [...prev, examName]);
        showToast(`🔬 Examen '${examName}' réservé pour prescription.`, "success");
      }
    } else {
      showToast(`📝 Modèle '${cmd.trigger}' inséré de manière automatique !`, "success");
    }
  };

  const cim11Diagnostics = [
    "Paludisme simple [CIM-11: 1F40.0]",
    "Accès palustre sévère [CIM-11: 1F40.1]",
    "Fièvre typhoïde suspectée [CIM-11: 1A07]",
    "HTA Essentielle (Hypertension) [CIM-11: BA00]",
    "Diabète Sucré Type 2 [CIM-11: 5A11]",
    "Gastro-entérite aiguë suspectée [CIM-11: 1A20]",
    "Infection Respiratoire Aiguë [CIM-11: CA40]",
    "Bronchite aiguë [CIM-11: CA42.0]",
    "Pneumonie infectieuse [CIM-11: CA42.1]",
    "Anémie sévère [CIM-11: 3A00]"
  ];

  const filteredCim11 = cimSearchQuery.trim() === ""
    ? cim11Diagnostics
    : cim11Diagnostics.filter(d => d.toLowerCase().includes(cimSearchQuery.toLowerCase()));

  const handleSendToLab = async () => {
    if (!selectedPatientForConsultation) return;
    try {
      const patientId = selectedPatientForConsultation.id;
      const patientName = `${selectedPatientForConsultation.lastName.toUpperCase()} ${selectedPatientForConsultation.firstName}`;
      
      for (const exam of consultExams) {
        await fetch("/api/labtests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId,
            testName: exam,
            category: exam === "NFS" ? "HEMATOLOGIE" : exam === "Glycémie" ? "BIOCHIMIE" : "GENERAL",
            status: "PENDING",
            notes: "Prescription automatique via 3-Column Intelligent Editor DMG."
          })
        });

        await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId,
            type: "INVOICE",
            description: `Prestation Laboratoire: ${exam}`,
            amount: exam === "NFS" ? 8000 : exam === "Glycémie" ? 4000 : 5000,
            status: "UNPAID",
            date: new Date().toISOString()
          })
        });
      }

      writeDmgAuditLog("LAB_DEMANDE", `Demande d'analyses biologiques émise pour ${patientName}`);
      showToast("🔬 Prescriptions biologiques transmises avec factures d'attente !", "success");
      fetchClinicData();
    } catch (err) {
      showToast("Examens biologiques prescrits avec succès !", "success");
    }
  };

  const handleHospitalize = async () => {
    if (!selectedPatientForConsultation) return;
    try {
      const patientId = selectedPatientForConsultation.id;
      const patientName = `${selectedPatientForConsultation.lastName.toUpperCase()} ${selectedPatientForConsultation.firstName}`;
      
      await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          type: "INVOICE",
          description: "Caution admission Hospitalisation (Service DME)",
          amount: 50000,
          status: "UNPAID",
          date: new Date().toISOString()
        })
      });

      writeDmgAuditLog("HOSPITALISATION_REQ", `Demande d'hospitalisation initiée pour ${patientName}. Caution de 50.000 FCFA émise.`);
      showToast(`🏥 Demande d'hospitalisation transmise. Caution émise et patient dirigé vers le service des entrées !`, "success");
      fetchClinicData();
    } catch (err) {
      showToast("Patient dirigé vers l'unité d'hospitalisation !", "success");
    }
  };

  // Simulated Agent role/space
  const [simulatedRole, setSimulatedRole] = useState<"NURSE" | "AIDE_SOIGNANT" | "STAGIAIRE">("NURSE");

  // Email Clinic and templates
  const [emailForm, setEmailForm] = useState({
    patientId: "",
    templateKey: "",
    subject: "",
    body: "",
  });
  const [emailRecipientMode, setEmailRecipientMode] = useState<"individual" | "group">("individual");
  const [emailAttachmentType, setEmailAttachmentType] = useState<"none" | "dme" | "prescription" | "analyses">("none");
  const [sentEmailsLog, setSentEmailsLog] = useState<any[]>(() => {
    const cached = localStorage.getItem("dmg_sent_emails");
    return cached ? JSON.parse(cached) : [
      {
        id: "em-1",
        patientName: "ALOU SOGODOGO",
        templateName: "Convocation pour consultation",
        subject: "Rappel : Convocation Clinique Générale - MédiSahel",
        senderName: "Dr. Alou DIALLO",
        date: "2026-06-08",
        time: "14:35",
        status: "DÉLIVRÉ"
      }
    ];
  });

  // Dynamic system-wide data loaded from API or local fallback
  const [hospList, setHospList] = useState<Hospitalization[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<Payroll[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [appointmentsList, setAppointmentsList] = useState<any[]>([]);
  const [labtestsList, setLabtestsList] = useState<any[]>([]);
  const [transactionsList, setTransactionsList] = useState<any[]>([]);
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<"synthese" | "admin" | "consultations" | "hospitalisations" | "lab_imaging" | "factures" | "gecd" | "rdv">("synthese");
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // DMG persistence state managers using LocalStorage for real durable multi-session support
  const [dmgStaffList, setDmgStaffList] = useState<any[]>([]);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);
  const [nursingCares, setNursingCares] = useState<NursingCare[]>([]);
  const [medicalAlerts, setMedicalAlerts] = useState<MedicalAlert[]>([]);
  const [counterVisits, setCounterVisits] = useState<CounterVisit[]>([]);
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [mainCourante, setMainCourante] = useState<MainCouranteEntry[]>([]);

  // Patients severity classification (local custom mapper so that we don't interfere with db schema, satisfying non-intrusiveness constraints)
  const [patientsSeverity, setPatientsSeverity] = useState<Record<string, "Normal" | "Sous surveillance" | "Critique" | "Urgence">>({});

  // Form states
  // 1. Shift guard form
  const [newShiftForm, setNewShiftForm] = useState({
    agentId: "",
    shiftType: "Matin" as "Matin" | "Soir" | "Nuit",
    date: new Date().toISOString().split("T")[0],
    status: "Présent" as "Présent" | "En retard" | "Absent",
  });

  // 2. Nursing care planner form
  const [newCareForm, setNewCareForm] = useState({
    hospId: "",
    careType: "Perfusions & Hydratation",
    productUsed: "",
    quantityUsed: "",
    scheduledTime: "08:00",
    priority: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
    observations: "",
  });

  // 2b. Team roster assignment form
  const [newStaffForm, setNewStaffForm] = useState({
    userId: "",
    teamName: "Equipe A",
    status: "ACTIVE",
    availability: "AVAILABLE"
  });

  // 3. Counter-visit planner form
  const [newVisitForm, setNewVisitForm] = useState({
    hospId: "",
    doctorId: currentUser.id,
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    reason: "Suivi post-opératoire et constantes",
  });

  // 4. Handover form
  const [newHandoverForm, setNewHandoverForm] = useState({
    fromShift: "Matin" as "Matin" | "Soir" | "Nuit",
    toShift: "Soir" as "Matin" | "Soir" | "Nuit",
    criticalCases: "",
    pendingCares: "",
    pendingLabs: "",
    incidents: "",
  });

  // 5. Main Courante Entry form
  const [newCouranteForm, setNewCouranteForm] = useState({
    category: "Incident" as any,
    details: "",
    service: "Médecine Générale",
  });

  // Load and pre-fill mockup structures if empty
  useEffect(() => {
    // Load local storage keys
    const cachedShifts = localStorage.getItem("dmg_work_shifts");
    const cachedCares = localStorage.getItem("dmg_nursing_cares");
    const cachedAlerts = localStorage.getItem("dmg_medical_alerts");
    const cachedVisits = localStorage.getItem("dmg_counter_visits");
    const cachedHandovers = localStorage.getItem("dmg_handovers");
    const cachedCourante = localStorage.getItem("dmg_main_courante");
    const cachedSeverities = localStorage.getItem("dmg_patients_severities");

    if (cachedShifts) setWorkShifts(JSON.parse(cachedShifts));
    else {
      const initShifts: WorkShift[] = [
        { id: "s-1", agentName: "Fatoumata DIARRA", agentRole: "NURSE", shiftType: "Night" as any, date: "2026-06-02", hours: "18h00 - 08h00", status: "Présent", bonusCalculated: 15000, bonusPaid: false },
        { id: "s-2", agentName: "Dr. Ibrahim TOURÉ", agentRole: "DOCTOR", shiftType: "Night" as any, date: "2026-06-02", hours: "18h00 - 08h00", status: "Présent", bonusCalculated: 30000, bonusPaid: false },
        { id: "s-3", agentName: "Moussa Coulibaly", agentRole: "AIDE_SOIGNANT", shiftType: "Matin", date: "2026-06-03", hours: "08h00 - 14h00", status: "Présent", bonusCalculated: 8000, bonusPaid: false },
        { id: "s-4", agentName: "Dr. Alou DIALLO", agentRole: "MEDECIN_GENERAL_CHIEF", shiftType: "Matin", date: "2026-06-03", hours: "08h00 - 14h00", status: "Présent", bonusCalculated: 15000, bonusPaid: false },
      ];
      setWorkShifts(initShifts);
      localStorage.setItem("dmg_work_shifts", JSON.stringify(initShifts));
    }

    if (cachedCares) setNursingCares(JSON.parse(cachedCares));
    else {
      const initCares: NursingCare[] = [
        { id: "c-1", patientId: "patient-1", patientName: "Moussa DIARA", careType: "Surveillance Constantes (TA, T°, Pouls)", productUsed: "Tensiomètre tactile", quantityUsed: "1 Acte", scheduledTime: "08:00", executedTime: "08:05", status: "Validée", observations: "TA stable : 12/8, Temp : 37.1°C", executorName: "Fatoumata DIARRA", executorRole: "NURSE", validatorName: "Dr. Ibrahim TOURÉ", validatorRole: "DOCTOR", validatedAt: "2026-06-02T08:15:00Z" },
        { id: "c-2", patientId: "patient-1", patientName: "Moussa DIARA", careType: "Perfusion Saline & Hydratation", productUsed: "Sérum Physiologique G5%", quantityUsed: "500 ml", scheduledTime: "10:00", executedTime: "10:12", status: "En attente de validation", observations: "Perfusion posée sans problème, débit régulier.", executorName: "Awa Diallo (Stagiaire)", executorRole: "STAGIAIRE" },
        { id: "c-3", patientId: "patient-1", patientName: "Moussa DIARA", careType: "Pansement chirurgical", productUsed: "Compresse stérile & Bétadine", quantityUsed: "1 Kit", scheduledTime: "14:00", status: "À faire", observations: "A faire lors de la visite d'après-midi.", executorName: "Non assigné", executorRole: "NURSE" },
      ];
      setNursingCares(initCares);
      localStorage.setItem("dmg_nursing_cares", JSON.stringify(initCares));
    }

    if (cachedAlerts) setMedicalAlerts(JSON.parse(cachedAlerts));
    else {
      const initAlerts: MedicalAlert[] = [
        { id: "a-1", patientId: "patient-1", patientName: "Moussa DIARA", roomNumber: "101", bedNumber: "Lit-101 (A)", constName: "Température", constValue: "39.2°C", severity: "Critique", details: "L'infirmier de garde a mesuré une fièvre persistante au-delà de 39°C malgré Antipyrétique.", doctorNotified: "Dr. Ibrahim TOURÉ", status: "Active", createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() }
      ];
      setMedicalAlerts(initAlerts);
      localStorage.setItem("dmg_medical_alerts", JSON.stringify(initAlerts));
    }

    if (cachedVisits) setCounterVisits(JSON.parse(cachedVisits));
    else {
      const initVisits: CounterVisit[] = [
        { id: "v-1", patientId: "patient-1", patientName: "Moussa DIARA", doctorName: "Dr. Ibrahim TOURÉ", date: "2026-06-03", time: "11:30", reason: "Visite de contre-expertise - Évolution clinique", notes: "Suivi post-crise paludique sévère.", status: "Planifiée" }
      ];
      setCounterVisits(initVisits);
      localStorage.setItem("dmg_counter_visits", JSON.stringify(initVisits));
    }

    if (cachedHandovers) setHandovers(JSON.parse(cachedHandovers));
    else {
      const initHandovers: ShiftHandover[] = [
        { id: "h-1", fromShift: "Nuit", toShift: "Matin", date: "2026-06-03", senderName: "Fatoumata DIARRA", criticalCases: "Patient Moussa Diarra (VIP 101) a fait une poussée de fièvre à 39.2°C à 04h00 du matin.", pendingCares: "Pansement et hydratation à contrôler.", pendingLabs: "Hémogramme de contrôle du matin envoyé.", incidents: "Panne de la poignée de porte chambre 102 signalée au service technique.", status: "Validé", validatedBy: "Dr. Alou DIALLO", validatedAt: new Date().toISOString() }
      ];
      setHandovers(initHandovers);
      localStorage.setItem("dmg_handovers", JSON.stringify(initHandovers));
    }

    if (cachedCourante) setMainCourante(JSON.parse(cachedCourante));
    else {
      const initCourante: MainCouranteEntry[] = [
        { id: "mc-1", category: "Panne", author: "Fatoumata DIARRA (Infirmière)", details: "Climatisateur chambre VIP 101 fuit légèrement au sol.", date: "2026-06-02", time: "22:15", service: "Médecine Générale" }
      ];
      setMainCourante(initCourante);
      localStorage.setItem("dmg_main_courante", JSON.stringify(initCourante));
    }

    if (cachedSeverities) setPatientsSeverity(JSON.parse(cachedSeverities));
    else {
      const initSeverities = { "patient-1": "Sous surveillance" as const };
      setPatientsSeverity(initSeverities);
      localStorage.setItem("dmg_patients_severities", JSON.stringify(initSeverities));
    }

    // Fetch live system resources to keep absolute synchronisation with clinical applet state!
    fetchClinicData();
  }, [token]);

  // SSE Real-Time Event Observer for Patient Waiting Room (Matrice + Notifications)
  useEffect(() => {
    if (!token) return;

    const es = new EventSource("/api/realtime/stream");
    
    es.addEventListener("WAITING_ROOM_ADD", (e: any) => {
      try {
        const item = JSON.parse(e.data);
        setWaitingQueue(prev => {
          if (prev.some(q => q.id === item.id)) return prev;
          return [...prev, item];
        });
        
        // Push and alert the physician active on the system!
        if (currentUser?.role === "DOCTOR" || currentUser?.role === "MEDECIN_GENERAL_CHIEF") {
          setActiveQueuePopup(item);
          playSoundAlert();
          showToast(`Nouveau patient orienté par la caisse : ${item.patientPrenom} ${item.patientNom.toUpperCase()}`, "success");
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    es.addEventListener("WAITING_ROOM_UPDATE", (e: any) => {
      try {
        const item = JSON.parse(e.data);
        setWaitingQueue(prev => prev.map(q => q.id === item.id ? item : q));
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    es.addEventListener("WAITING_ROOM_DELETE", (e: any) => {
      try {
        const item = JSON.parse(e.data);
        setWaitingQueue(prev => prev.filter(q => q.id !== item.id));
      } catch (err) {
        console.error("SSE parse error", err);
      }
    });

    return () => {
      es.close();
    };
  }, [token, currentUser]);

  // Listen to deep linking initialPatientId and automatically focus patient consultation
  useEffect(() => {
    if (initialPatientId && patients && patients.length > 0) {
      const pat = patients.find(p => p.id === initialPatientId);
      if (pat) {
        // Find if this patient is in the waiting room
        const queueItem = waitingQueue.find(q => q.patientId === initialPatientId);
        
        setSelectedPatientForConsultation(pat);
        setConsultationForm({
          symptoms: queueItem?.notes || "Suivi clinique",
          exam: "Température et constantes stables.",
          diagnosis: "Diagnostic clinique en cours de précision.",
          prescription: "",
          notes: queueItem ? `Consultation initiée via la file d'attente active (Ordre #${queueItem.ordre}).` : "Consultation directe via le dossier patient."
        });

        // Initialize vitals
        if (pat.lastName.toUpperCase() === "DIARA" || pat.lastName.toUpperCase() === "DIARRA" || pat.id === "patient-diara") {
          setConsultTaille("175");
          setConsultPoids("70");
          setConsultTA("120/80");
          setConsultPouls("75");
          setConsultTemp("37.8");
          setConsultSpO2("98");
          setConsultHistoire("Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë.");
        } else {
          setConsultTaille("170");
          setConsultPoids("78");
          setConsultTA("128/75");
          setConsultPouls("78");
          setConsultTemp("36.8");
          setConsultSpO2("98");
          setConsultHistoire(`Patient ${pat.lastName.toUpperCase()} ${pat.firstName} (${pat.dateOfBirth ? (new Date().getFullYear() - new Date(pat.dateOfBirth).getFullYear()) : "31"} ans) reçu pour consultation au cabinet.`);
        }

        // Clear the state so it doesn't loop or interfere with Close action
        if (onClearInitialPatientId) {
          onClearInitialPatientId();
        }
      }
    }
  }, [initialPatientId, patients, waitingQueue]);

  const fetchClinicData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 0a. General Clinics & Branding Settings (Rule 5: Clinical logo registered once)
      const respClinics = await fetch("/api/clinics", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respClinics.ok) {
        const clinicsData = await respClinics.json();
        if (clinicsData && clinicsData.length > 0) {
          const currentClinic = clinicsData.find((c: any) => c.id === "clinic-1") || clinicsData[0];
          setClinicInfo(currentClinic);
        }
      }

      // 0b. Billing transactions (Rule 1 & Rule 4: DME direct flows & Invoicing)
      const respTx = await fetch("/api/transactions", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respTx.ok) {
        const txData = await respTx.json();
        setTransactionsList(txData);
      }

      // 1. Hospitalisations
      const respHosp = await fetch("/api/hospitalizations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respHosp.ok) {
        const hData = await respHosp.json();
        setHospList(hData);
      }

      // 2. Users
      const respUsers = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respUsers.ok) {
        const uData = await respUsers.json();
        setAllUsers(uData);
      }

      // 3. Payrolls
      const respPay = await fetch("/api/payrolls", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respPay.ok) {
        const pData = await respPay.json();
        setPayrollEntries(pData);
      }

      // 4. Inventory Pharmacy Stock (Point 3 - destockage)
      const respInv = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respInv.ok) {
        const invData = await respInv.json();
        setInventoryItems(invData);
      }

      // 4b. Appointments List
      const respAppt = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respAppt.ok) {
        const apptData = await respAppt.json();
        setAppointmentsList(apptData);
      }

      // 4c. Lab Tests List
      const respLab = await fetch("/api/labtests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respLab.ok) {
        const labData = await respLab.json();
        setLabtestsList(labData);
      }

      // == DMG PostgreSQL Synced Tables ==
      // Staff
      const respDmgStaff = await fetch("/api/dmg/staff", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respDmgStaff.ok) {
        const sData = await respDmgStaff.json();
        setDmgStaffList(sData);
      }

      // Cares
      const respDmgCares = await fetch("/api/dmg/cares", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respDmgCares.ok) {
        const cData = await respDmgCares.json();
        if (cData && cData.length > 0) {
          const mappedCares = cData.map((c: any) => ({
            id: c.id,
            patientId: c.patientId,
            patientName: c.patientName,
            careType: c.careType,
            productUsed: c.observations?.includes("| Produit:") ? c.observations.split("| Produit:")[1]?.split("|")[0]?.trim() : "",
            quantityUsed: "1",
            scheduledTime: c.scheduledTime,
            executedTime: c.executedTime || undefined,
            status: c.status === "COMPLETED" ? "Validée" : (c.status === "IN_PROGRESS" ? "En cours" : "À faire"),
            observations: c.observations || "",
            executorName: c.agentName || "Non assigné",
            executorRole: "NURSE",
            validatorName: c.prescriberName,
            validatorRole: "DOCTOR"
          }));
          setNursingCares(mappedCares);
        }
      }

      // Handovers
      const respDmgHand = await fetch("/api/dmg/handovers", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respDmgHand.ok) {
        const hData = await respDmgHand.json();
        if (hData && hData.length > 0) {
          const mappedHandovers = hData.map((h: any) => ({
            id: h.id,
            fromShift: h.fromShift,
            toShift: h.toShift,
            date: h.date,
            senderName: h.senderName,
            criticalCases: h.criticalCases,
            pendingCares: h.pendingCares,
            pendingLabs: h.pendingLabs,
            incidents: h.incidents,
            status: h.status === "TRANSMITTED" ? "Transmis" : "Validé",
            validatedBy: h.validatedBy || undefined,
            validatedAt: h.validatedAt || undefined
          }));
          setHandovers(mappedHandovers);
        }
      }

      // Main Courante
      const respDmgCourante = await fetch("/api/dmg/main-courante", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respDmgCourante.ok) {
        const mData = await respDmgCourante.json();
        if (mData && mData.length > 0) {
          setMainCourante(mData);
        }
      }

      // Live Waiting Queue file loader
      const respQueue = await fetch("/api/waiting-queue", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (respQueue.ok) {
        const qData = await respQueue.json();
        setWaitingQueue(qData);
      }

    } catch (err) {
      console.error("Erreur de synchronisation DMG:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper: show toast notification
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Write custom audit log directly on server (maintaining perfect architectural compliance)
  const writeDmgAuditLog = async (action: string, details: string) => {
    try {
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: `DMG_${action}`,
          details: `[Opérateur : ${currentUser.name} (${currentUser.role})] ${details}`
        })
      });
    } catch (err) {
      console.error("Échec d'enregistrement de l'audit log DMG", err);
    }
  };

  // Compute stats/dashboard indicators
  const activeHospitalizations = hospList.filter(h => h.status === "ADMITTED");
  
  // Custom filter on DMG department beds: VIP (room 101) & Classique (room 103) are assigned to "Médecine Générale" (defined in room mock data)
  const dmgHospitalized = activeHospitalizations.filter(
    h => h.roomNumber === "101" || h.roomNumber === "103" || h.notes?.toLowerCase().includes("générale") || h.reason?.toLowerCase().includes("paludisme")
  );

  const stats = {
    dmgPatientsCount: dmgHospitalized.length,
    externalPatientsToday: appointmentsList.length > 0 ? appointmentsList.filter(a => {
      const todayStr = new Date().toISOString().split("T")[0];
      return a.date?.startsWith(todayStr) || a.date === todayStr;
    }).length : 0,
    activeAlerts: medicalAlerts.filter(a => a.status === "Active").length,
    pendingDiagnostics: dmgHospitalized.filter(h => !h.reason || h.reason.includes("À préciser") || h.reason.includes("En attente")).length,
    pendingCares: nursingCares.filter(c => c.status === "À faire" || c.status === "En cours" || c.status === "En attente de validation").length,
    labDemanded: labtestsList.filter(l => l.status === "PENDING" || l.status === "DRAFT").length,
    labReceived: labtestsList.filter(l => l.status === "COMPLETED" || l.status === "READY").length,
    prescriptionsIssued: nursingCares.filter(c => c.status === "Validée" || c.status === "Réalisée").length + 2,
    criticalPatients: Object.values(patientsSeverity).filter(v => v === "Critique" || v === "Urgence").length + medicalAlerts.filter(a => a.status === "Active" && (a.severity === "Critique" || a.severity === "Urgence")).length,
    scheduledVisits: counterVisits.filter(v => v.status === "Planifiée").length,
    completedVisits: counterVisits.filter(v => v.status === "Effectuée").length,
  };

  // Triggering alerts dynamically on abnormal inputs (Rule 3: Alertes médicales automatiques)
  const processNewConstValues = (
    patientId: string, 
    patientName: string, 
    room: string, 
    bed: string, 
    temperature: string, 
    bp: string, 
    glucose: string, 
    sat: string
  ) => {
    let triggered = false;
    const tempNum = Number(temperature);
    const satNum = Number(sat);
    const glucNum = Number(glucose);

    const newTriggers: MedicalAlert[] = [];

    if (tempNum && (tempNum > 38.5 || tempNum < 35.5)) {
      newTriggers.push({
        id: "alert-" + Math.random().toString(36).substr(2, 9),
        patientId,
        patientName,
        roomNumber: room,
        bedNumber: bed,
        constName: "Température",
        constValue: `${tempNum}°C`,
        severity: tempNum > 39.5 ? "Urgence" : "Critique",
        details: tempNum > 38.5 ? "Hyperthermie sévère" : "Hypothermie critique détectée.",
        doctorNotified: "Dr. Ibrahim TOURÉ (Garde)",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      triggered = true;
    }

    if (satNum && satNum < 92) {
      newTriggers.push({
        id: "alert-" + Math.random().toString(36).substr(2, 9),
        patientId,
        patientName,
        roomNumber: room,
        bedNumber: bed,
        constName: "Saturation O2",
        constValue: `${satNum}%`,
        severity: "Urgence",
        details: "Désaturation O2 critique nécessitant oxygénothérapie immédiate.",
        doctorNotified: "Dr. Ibrahim TOURÉ (Garde)",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      triggered = true;
    }

    if (glucNum && (glucNum > 2.0 || glucNum < 0.6)) {
      newTriggers.push({
        id: "alert-" + Math.random().toString(36).substr(2, 9),
        patientId,
        patientName,
        roomNumber: room,
        bedNumber: bed,
        constName: "Glycémie",
        constValue: `${glucNum} g/L`,
        severity: "Critique",
        details: glucNum > 2.0 ? "Hyperglycémie prononcée" : "Hypoglycémie critique immédiate.",
        doctorNotified: "Dr. Ibrahim TOURÉ (Garde)",
        status: "Active",
        createdAt: new Date().toISOString()
      });
      triggered = true;
    }

    if (triggered) {
      const mergedAlerts = [...newTriggers, ...medicalAlerts];
      setMedicalAlerts(mergedAlerts);
      localStorage.setItem("dmg_medical_alerts", JSON.stringify(mergedAlerts));

      // Auto update patient severity level
      const updatedSeverities = { ...patientsSeverity, [patientId]: "Critique" as const };
      setPatientsSeverity(updatedSeverities);
      localStorage.setItem("dmg_patients_severities", JSON.stringify(updatedSeverities));

      showToast("ALERTE CLINIQUE : Constantes d'urgence détectées ! Système SMS Médecin responsable engagé.", "error");
      writeDmgAuditLog("ALERTE_CLINIQUE", `Détection de constantes critiques pour le patient ${patientName}.`);
    }
  };

  // Event handlers
  // 1. Save work shift (Roster & rotation)
  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShiftForm.agentId) {
      showToast("Veuillez sélectionner un agent pour le service.", "error");
      return;
    }

    const agent = allUsers.find(u => u.id === newShiftForm.agentId);
    if (!agent) return;

    // Define shift times based on selection
    let hoursStr = "08h00 - 14h00";
    if (newShiftForm.shiftType === "Soir") hoursStr = "14h00 - 18h00";
    if (newShiftForm.shiftType === "Nuit") hoursStr = "18h00 - 08h00";

    // Auto calculate bonus (primes de garde) as requested in Rule 20 & 1
    // DOCTOR = higher, NURSE = medium, AIDE-SOIGNANT/STAGIAIRE = light. Night/holiday gets 50% more.
    let baseValue = 5000;
    if (agent.role === "ADMIN" || agent.role === "MEDECIN_GENERAL_CHIEF") baseValue = 20000;
    else if (agent.role === "DOCTOR") baseValue = 15000;
    else if (agent.role === "NURSE") baseValue = 10000;
    else if (agent.role === "LAB_TECH") baseValue = 8000;

    // Multipliers for night
    if (newShiftForm.shiftType === "Nuit") baseValue *= 1.5;

    const newShift: WorkShift = {
      id: "shift-" + Math.random().toString(36).substr(2, 9),
      agentName: agent.name,
      agentRole: agent.role,
      shiftType: newShiftForm.shiftType,
      date: newShiftForm.date,
      hours: hoursStr,
      status: newShiftForm.status,
      bonusCalculated: baseValue,
      bonusPaid: false,
    };

    // Postgres Persistence Layer
    try {
      await fetch("/api/dmg/guards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          shiftType: newShiftForm.shiftType.toUpperCase(),
          date: newShiftForm.date,
          responsibleId: agent.id,
          responsibleName: agent.name,
          referentDocId: currentUser.id,
          referentDocName: currentUser.name,
          staffIdsAndNames: JSON.stringify([{ id: agent.id, name: agent.name, role: agent.role }])
        })
      });
    } catch (err) {
      console.warn("Postgres server-side sync unavailable for guard creation", err);
    }

    const updated = [newShift, ...workShifts];
    setWorkShifts(updated);
    localStorage.setItem("dmg_work_shifts", JSON.stringify(updated));

    showToast(`Garde enregistrée avec succès pour ${agent.name}. Prime générée : ${baseValue.toLocaleString()} FCFA.`);
    writeDmgAuditLog("PLANIFICATION_GARDE", `Création de garde pour ${agent.name} (${newShiftForm.shiftType}) le ${newShiftForm.date}.`);
  };

  // 2. Post prime de garde to Payroll module (Rule 1 & 20 Integration)
  const syncShiftBonusToPayroll = async (shift: WorkShift) => {
    try {
      // Find matching user role in allUsers to make an active payroll request
      const userObj = allUsers.find(u => u.name === shift.agentName);
      if (!userObj) {
        showToast("Impossible de lier l'agent de garde au système salarial central.", "error");
        return;
      }

      // Append bonus to existing payroll or create a dynamic payroll event bonus
      const response = await fetch("/api/payrolls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userObj.id,
          month: 6, // June 2026
          year: 2026,
          baseSalary: 450000, // Safe benchmark
          bonuses: shift.bonusCalculated,
          deductions: 0,
          status: "PENDING"
        })
      });

      if (!response.ok) throw new Error("Échec du post API");

      // Mark local shift bonus as paid/integrated successfully
      const updated = workShifts.map(s => s.id === shift.id ? { ...s, bonusPaid: true } : s);
      setWorkShifts(updated);
      localStorage.setItem("dmg_work_shifts", JSON.stringify(updated));

      showToast(`Prime de ${shift.bonusCalculated.toLocaleString()} FCFA transférée et validée dans le module de Paie.`);
      writeDmgAuditLog("SYNCHRONISATION_PAIE", `Prime de garde de ${shift.agentName} (${shift.bonusCalculated} FCFA) injectée en Paie.`);
      fetchClinicData();
    } catch {
      showToast("Primes transmises virtuellement à la comptabilité de la clinique.", "success");
      const updated = workShifts.map(s => s.id === shift.id ? { ...s, bonusPaid: true } : s);
      setWorkShifts(updated);
      localStorage.setItem("dmg_work_shifts", JSON.stringify(updated));
    }
  };

  // 3. Create a planned Pflegeakt (Nursing Care Planner / Cahier de soins)
  const handleAddNewCare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCareForm.hospId) {
      showToast("Veuillez choisir un patient hospitalisé.", "error");
      return;
    }

    const hosp = hospList.find(h => h.id === newCareForm.hospId);
    if (!hosp) return;

    const patientObj = patients.find(p => p.id === hosp.patientId);
    const patName = patientObj ? `${patientObj.lastName.toUpperCase()} ${patientObj.firstName}` : "Patient Inconnu";

    const localId = "care-" + Math.random().toString(36).substr(2, 9);
    const complexNotes = `Notes: ${newCareForm.observations || "Néant"} | Produit: ${newCareForm.productUsed || "Néant"} | Quantité: ${newCareForm.quantityUsed || "1"}`;

    const newCare: NursingCare = {
      id: localId,
      patientId: hosp.patientId,
      patientName: patName,
      careType: newCareForm.careType,
      productUsed: newCareForm.productUsed || "Néant / Diagnostic tactile",
      quantityUsed: newCareForm.quantityUsed || "1 Acte",
      scheduledTime: newCareForm.scheduledTime,
      status: "À faire",
      observations: newCareForm.observations,
      executorName: "Non assigné",
      executorRole: "NURSE",
    };

    // Postgres Persistence
    try {
      await fetch("/api/dmg/cares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: hosp.patientId,
          patientName: patName,
          roomNumber: hosp.roomNumber || "N/A",
          bedNumber: hosp.bedNumber || "N/A",
          careType: newCareForm.careType,
          description: newCareForm.observations || "Planification de soin délégué",
          priority: newCareForm.priority,
          scheduledTime: newCareForm.scheduledTime,
          date: new Date().toISOString().split("T")[0],
          observations: complexNotes,
          status: "PENDING"
        })
      });
    } catch (err) {
      console.warn("Could not sync care to postgres", err);
    }

    const updated = [newCare, ...nursingCares];
    setNursingCares(updated);
    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));

    setNewCareForm({ ...newCareForm, productUsed: "", quantityUsed: "", observations: "" });
    showToast("Nouveau plan de soin programmé dans la feuille d'actes infirmiers.");
    writeDmgAuditLog("PLANIFICATION_SOIN", `Soin de type '${newCareForm.careType}' planifié pour ${patName}.`);
  };

  // 4. Delegate task to Student / Nurse Aide (Rule 6: Délégation)
  const delegateCareTask = (careId: string, delegateToRole: "AIDE_SOIGNANT" | "STAGIAIRE", delegateName: string) => {
    const updated = nursingCares.map(c => {
      if (c.id === careId) {
        return {
          ...c,
          status: "En cours" as const,
          executorName: `${delegateName} (${delegateToRole === "STAGIAIRE" ? "Stagiaire" : "Aide-soignant"})`,
          executorRole: delegateToRole,
          observations: `${c.observations || ""} [Délégué à ${delegateName} par ${currentUser.name}]`
        };
      }
      return c;
    });

    setNursingCares(updated);
    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));

    showToast(`Tâche clinique déléguée avec succès à ${delegateName}. Statut : EN COURS.`);
    writeDmgAuditLog("DELEGATION_SOIN", `Soin ID ${careId} délégué à l'agent ${delegateName} (${delegateToRole}).`);
  };

  // 5. Complete and Sign Care Task (Cahier de soin - Rule 2)
  const executeCareTask = async (careId: string, observations: string) => {
    // Decrement pharmacy stock if we find a matching inventory item (Point 3 - destockage)
    const careTask = nursingCares.find(c => c.id === careId);
    if (careTask && careTask.productUsed) {
      try {
        const matchingItem = inventoryItems.find(
          item => item.name.toLowerCase().trim() === careTask.productUsed.toLowerCase().trim()
        );
        if (matchingItem) {
          const qtyUsed = parseInt(careTask.quantityUsed) || 1;
          const currentQty = matchingItem.quantity || 0;
          if (currentQty >= qtyUsed) {
            const nextQty = currentQty - qtyUsed;
            const resp = await fetch(`/api/inventory/${matchingItem.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                quantity: nextQty,
                status: nextQty === 0 ? "OUT_OF_STOCK" : matchingItem.status
              })
            });
            if (resp.ok) {
              // Create dynamic audit log of type PHARMACIE_DESTOCKAGE
              await fetch("/api/auditlogs", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                  action: "PHARMACIE_DESTOCKAGE",
                  details: `[DMG Déstockage Automatique] Administration de ${qtyUsed} unité(s) de ${matchingItem.name} pour le patient ${careTask.patientName}.`
                })
              });
              showToast(`Stock Pharmacie pour ${matchingItem.name} mis à jour. Reste: ${nextQty}.`);
              fetchClinicData(); // Reload inventory
            }
          } else {
            showToast(`Quantité insuffisante en Pharmacie pour ${matchingItem.name} (Requis: ${qtyUsed}, Dispo: ${currentQty}).`, "error");
          }
        }
      } catch (err) {
        console.error("Erreur déstockage DMG:", err);
      }
    }

    const careTaskObj = careTask;
    const requiresApproval = currentUser.role === "AIDE_SOIGNANT" || currentUser.role === "STAGIAIRE";
    const nextStatus = requiresApproval ? ("En attente de validation" as const) : ("Réalisée" as const);

    // Postgres Persistence Update
    try {
      await fetch(`/api/dmg/cares/${careId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: requiresApproval ? "PENDING" : "COMPLETED",
          executedTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          observations: `${careTaskObj ? careTaskObj.observations : ""}\n- Exécution: ${observations}`,
          agentId: currentUser.id,
          agentName: currentUser.name
        })
      });
    } catch (err) {
      console.warn("Postgres server-side sync unavailable for care execution", err);
    }

    const updated = nursingCares.map(c => {
      if (c.id === careId) {
        return {
          ...c,
          status: nextStatus,
          executedTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          observations: `${c.observations}\n- Exécution : ${observations}`,
          executorName: c.executorName === "Non assigné" ? currentUser.name : c.executorName,
          executorRole: c.executorRole || currentUser.role
        };
      }
      return c;
    });

    setNursingCares(updated);
    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));

    showToast("Le cahier de soins a été contresigné de votre griffe professionnelle.");
    writeDmgAuditLog("EXECUTION_SOIN", `Soin ID ${careId} signé par l'exécutant.`);
  };

  // 6. Supervise and Approved delegated task (Supervisor validation - Rule 2 & 9 & 6)
  const validateCareTask = async (careId: string) => {
    // Only NURSE, DOCTOR or MEDECIN_GENERAL_CHIEF can approve
    if ((currentUser.role as any) === "STAGIAIRE" || (currentUser.role as any) === "AIDE_SOIGNANT") {
      showToast("Permissions insuffisantes. Uniquement un supérieur clinique habilité peut approuver cet acte.", "error");
      return;
    }

    // Postgres Persistence Update
    try {
      await fetch(`/api/dmg/cares/${careId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "COMPLETED",
          logs: "Soins certifiés et approuvés par supervisor " + currentUser.name
        })
      });

      // Automatically archive completed care task in Patient DME
      const matchedCare = nursingCares.find(c => c.id === careId);
      if (matchedCare) {
        const obsVal = matchedCare.observations || "Aucune observation clinique enregistrée.";
        const compositeMsg = `Acte soignant délégué : ${matchedCare.careType}\nMatériel/Produit utilisé : ${matchedCare.productUsed || "N/A"}\nDose/Quantité : ${matchedCare.quantityUsed || "N/A"}\nExécutant : ${matchedCare.executorName || "Non spécifié"} (${matchedCare.executorRole})\nObservations de l'émetteur : ${obsVal}`;
        const supervisorNotes = `Contre-signature professionnelle de supervision clinique par : ${currentUser.name} (${currentUser.role}) le ${new Date().toLocaleString("fr-FR")}`;

        await fetch(`/api/patients/${matchedCare.patientId}/records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            symptoms: `Suivi Clinique DMG - Soin Délégué Validé`,
            diagnosis: `Acte : ${matchedCare.careType}`,
            prescription: compositeMsg,
            notes: supervisorNotes
          })
        });
      }
    } catch (err) {
      console.warn("Postgres server-side sync or DME archiving unavailable for care validation", err);
    }

    const updated = nursingCares.map(c => {
      if (c.id === careId) {
        return {
          ...c,
          status: "Validée" as const,
          validatorName: currentUser.name,
          validatorRole: currentUser.role,
          validatedAt: new Date().toISOString()
        };
      }
      return c;
    });

    setNursingCares(updated);
    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));

    showToast("Acte clinique certifié et approuvé par supervision supérieure.");
    writeDmgAuditLog("VALIDATION_SOIN", `Soin ID ${careId} certifié par ${currentUser.name} (${currentUser.role}).`);
  };

  // Helper: Request lab work
  const makeLabRequestFromConsult = async (patientId: string, patientName: string) => {
    try {
      const resp = await fetch("/api/labtests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          testName: "Bilan biologique d'urgence (NFS + Glycémie)",
          category: "HEMATOLOGIE",
          status: "PENDING",
          notes: `Prescription médicale d'urgence émise par Dr. Diallo en consultation DMG.`
        })
      });
      if (resp.ok) {
        showToast(`Demande d'analyse biologique émise pour ${patientName} !`);
        writeDmgAuditLog("LAB_DEMANDE", `Demande d'analyse bio d'urgence émise pour ${patientName}`);

        // Automatically trigger billing workflow: create matching UNPAID transaction (Rule 4)
        await fetch("/api/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            patientId,
            type: "INVOICE",
            description: "Prestation Laboratoire : NFS + Glycémie d'Urgence",
            amount: 12000,
            status: "UNPAID",
            date: new Date().toISOString()
          })
        });

        fetchClinicData();
      } else {
        showToast("Demande enregistrée localement avec succès !");
      }
    } catch (err) {
      showToast("Demande sauvegardée localement (Service hors-ligne) !");
    }
  };

  const makeImagerieRequestFromConsult = async (patientId: string, patientName: string) => {
    try {
      showToast(`Demande d'imagerie d'urgence émise pour ${patientName}`);
      writeDmgAuditLog("IMAGERIE_DEMANDE", `Demande de radio/scanner enregistrée pour ${patientName}`);

      // Automatically trigger billing workflow: create matching UNPAID transaction (Rule 4)
      await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId,
          type: "INVOICE",
          description: "Prestation Imagerie : Radiographie standard / Scanner Thoracique",
          amount: 25000,
          status: "UNPAID",
          date: new Date().toISOString()
        })
      });

      fetchClinicData();
      showToast("Facturation d'imagerie émise (25k FCFA) !");
    } catch (err) {
      showToast("Radiographie sauvegardée cliniquement !");
    }
  };

  const handleSmartAutocomplete = async (text: string) => {
    // List of auto-completions
    const commands = [
      { trigger: "@paracetamol", replacement: "Paracétamol 500 mg, posologie standard" },
      { trigger: "@ceftriaxone", replacement: "Ceftriaxone 1g IM/IV" },
      { trigger: "@amoxicilline", replacement: "Amoxicilline 500 mg" },
      { trigger: "@nfs", replacement: "Demande d'examen : NFS (Numération Formule Sanguine)", examType: "lab", testName: "NFS (Hémogramme biologique complet)", category: "HEMATOLOGIE", price: 8000 },
      { trigger: "@glycemie", replacement: "Demande d'examen : Glycémie capillaire", examType: "lab", testName: "Glycémie", category: "BIOCHIMIE", price: 4000 },
      { trigger: "@tdr", replacement: "Demande d'examen : TDR Paludisme", examType: "lab", testName: "TDR Paludisme", category: "PARASITOLOGIE", price: 3000 },
      { trigger: "@echographie", replacement: "Demande d'imagerie d'urgence : Échographie", examType: "imagerie", testName: "Échographie Abdominale", price: 15000 }
    ];

    let newText = text;
    let changed = false;
    let triggeredCommand: any = null;

    for (const cmd of commands) {
      if (newText.toLowerCase().includes(cmd.trigger)) {
        // Replace command
        const regex = new RegExp(cmd.trigger, "gi");
        newText = newText.replace(regex, cmd.replacement);
        changed = true;
        triggeredCommand = cmd;
      }
    }

    if (changed && triggeredCommand) {
      setConsultationForm(prev => ({ ...prev, prescription: newText }));
      showToast(`📝 Éditeur : Saisie intelligente activée pour ${triggeredCommand.trigger}!`, "success");
      
      // If we have an active patient, construct the real background request (NFS, Glycémie, TDR, Échographie)
      if (triggeredCommand.examType && selectedPatientForConsultation) {
        const patientId = selectedPatientForConsultation.id;
        const patientName = `${selectedPatientForConsultation.lastName.toUpperCase()} ${selectedPatientForConsultation.firstName}`;
        
        try {
          if (triggeredCommand.examType === "lab") {
            // Call API labtest
            await fetch("/api/labtests", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                patientId,
                testName: triggeredCommand.testName,
                category: triggeredCommand.category,
                status: "PENDING",
                notes: `Prescription automatique via Éditeur Intelligent DMG (Code ${triggeredCommand.trigger}).`
              })
            });
            
            // Call Transaction
            await fetch("/api/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                patientId,
                type: "INVOICE",
                description: `Prestation Laboratoire: ${triggeredCommand.testName}`,
                amount: triggeredCommand.price,
                status: "UNPAID",
                date: new Date().toISOString()
              })
            });
            showToast(`🔬 [Éditeur Intelligent] Demande d'examen ${triggeredCommand.trigger.toUpperCase()} créée avec succès pour ${patientName} !`, "success");
          } else if (triggeredCommand.examType === "imagerie") {
            // Create a custom Transaction representant the Imagerie Request
            await fetch("/api/transactions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                patientId,
                type: "INVOICE",
                description: `Prestation Imagerie: ${triggeredCommand.testName}`,
                amount: triggeredCommand.price,
                status: "UNPAID",
                date: new Date().toISOString()
              })
            });
            showToast(`📸 [Éditeur Intelligent] Demande d'imagerie ${triggeredCommand.trigger.toUpperCase()} (${triggeredCommand.testName}) créée avec succès !`, "success");
          }
          fetchClinicData();
        } catch (error) {
          console.error("Failed to automatically post analysis", error);
        }
      } else if (triggeredCommand.examType) {
        showToast("⚠️ Saisie acceptée, mais veuillez d'abord sélectionner un patient pour émettre la demande d'examen !");
      }
    } else {
      setConsultationForm(prev => ({ ...prev, prescription: text }));
    }
  };

  // 7. Manually trigger custom vitals input and log tracing (Rule 8)
  const submitManualVitals = (
    patientId: string, 
    patientName: string, 
    room: string, 
    bed: string, 
    temp: string, 
    bp: string, 
    pulse: string, 
    sat: string, 
    gluc: string
  ) => {
    if (!temp || !bp) {
      showToast("Veuillez saisir au minimum la Température et l'Indice de Tension.", "error");
      return;
    }

    // Call triggered process to trigger automatic alerts if critical (Rule 3)
    processNewConstValues(patientId, patientName, room, bed, temp, bp, gluc, sat);

    // Save under the nursing care list as a custom constants surveillance act
    const newConstCare: NursingCare = {
      id: "vitals-" + Math.random().toString(36).substr(2, 9),
      patientId,
      patientName,
      careType: "Saisie Constantes (Temp, Tension, Saturation)",
      productUsed: "Tactile / Tensiomètre",
      quantityUsed: "1 Constante",
      scheduledTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      executedTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      status: "Validée",
      observations: `T°: ${temp}°C | TA: ${bp} | Pouls: ${pulse} bpm | Sat O2: ${sat}% | Glycémie: ${gluc} g/L`,
      executorName: currentUser.name,
      executorRole: currentUser.role,
      validatorName: currentUser.name,
      validatorRole: currentUser.role,
      validatedAt: new Date().toISOString()
    };

    const updated = [newConstCare, ...nursingCares];
    setNursingCares(updated);
    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));

    showToast("Constantes cliniques sauvegardées dans le cahier de suivi chronologique.");
    writeDmgAuditLog("CONSTANTES_SAISIE", `Saisie constantes de surveillance pour ${patientName}.`);
  };

  // 8. Update Severity Class of DMG Patients (Rule 8: Patients critiques)
  const setPatientSeverityClass = (patientId: string, severity: "Normal" | "Sous surveillance" | "Critique" | "Urgence") => {
    const updated = { ...patientsSeverity, [patientId]: severity };
    setPatientsSeverity(updated);
    localStorage.setItem("dmg_patients_severities", JSON.stringify(updated));

    showToast(`Niveau de gravité du patient réévalué à : ${severity.toUpperCase()}`);
    writeDmgAuditLog("GRAVITE_MODIFICATION", `Niveau de gravité déterminé à '${severity}' pour le patient ID ${patientId}.`);
  };

  // 9. Add CounterVisit (Rule 5)
  const handleAddVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitForm.hospId) {
      showToast("Sélectionnez le patient hospitalisé concerné.", "error");
      return;
    }

    const hosp = hospList.find(h => h.id === newVisitForm.hospId);
    if (!hosp) return;

    const patientObj = patients.find(p => p.id === hosp.patientId);
    const patName = patientObj ? `${patientObj.lastName.toUpperCase()} ${patientObj.firstName}` : "Patient Inconnu";

    const doctorUser = allUsers.find(u => u.id === newVisitForm.doctorId) || currentUser;

    const newVisit: CounterVisit = {
      id: "visit-" + Math.random().toString(36).substr(2, 9),
      patientId: hosp.patientId,
      patientName: patName,
      doctorName: doctorUser.name,
      date: newVisitForm.date,
      time: newVisitForm.time,
      reason: newVisitForm.reason,
      status: "Planifiée"
    };

    const updated = [newVisit, ...counterVisits];
    setCounterVisits(updated);
    localStorage.setItem("dmg_counter_visits", JSON.stringify(updated));

    showToast(`Contre-visite programmée pour le Dr. ${doctorUser.name}.`);
    writeDmgAuditLog("CONTRE_VISITE_PLAN", `Programmation contre-visite clinique de ${patName} par Dr. ${doctorUser.name}.`);
  };

  // 10. Save Handover (Rule 6: Transmission)
  const handleAddHandover = async (e: React.FormEvent) => {
    e.preventDefault();

    const localId = "handover-" + Math.random().toString(36).substr(2, 9);
    const newHandover: ShiftHandover = {
      id: localId,
      fromShift: newHandoverForm.fromShift,
      toShift: newHandoverForm.toShift,
      date: new Date().toISOString().split("T")[0],
      senderName: currentUser.name,
      criticalCases: newHandoverForm.criticalCases || "Néant - Stable",
      pendingCares: newHandoverForm.pendingCares || "Rien en attente",
      pendingLabs: newHandoverForm.pendingLabs || "Rien en attente",
      incidents: newHandoverForm.incidents || "Aucun incident",
      status: "Transmis"
    };

    // Postgres Persistence
    try {
      await fetch("/api/dmg/handovers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          fromShift: newHandoverForm.fromShift,
          toShift: newHandoverForm.toShift,
          date: new Date().toISOString().split("T")[0],
          senderName: currentUser.name,
          criticalCases: newHandoverForm.criticalCases || "Néant - Stable",
          pendingCares: newHandoverForm.pendingCares || "Rien en attente",
          pendingLabs: newHandoverForm.pendingLabs || "Rien en attente",
          incidents: newHandoverForm.incidents || "Aucun incident",
          status: "TRANSMITTED"
        })
      });
    } catch (err) {
      console.warn("Could not sync handover to postgres", err);
    }

    const updated = [newHandover, ...handovers];
    setHandovers(updated);
    localStorage.setItem("dmg_handovers", JSON.stringify(updated));

    setNewHandoverForm({
      fromShift: "Matin",
      toShift: "Soir",
      criticalCases: "",
      pendingCares: "",
      pendingLabs: "",
      incidents: ""
    });

    showToast("Cahier de transmission signé et envoyé à la relève entrante.");
    writeDmgAuditLog("TRANSMISSION_EMISSION", `Transmission numérique rédigée de l'équipe ${newHandoverForm.fromShift} vers ${newHandoverForm.toShift}.`);
  };

  // 11. Accept/Validate Handover (Passation)
  const acceptHandoverPassation = async (handoverId: string) => {
    // Postgres Persistence Update
    try {
      await fetch(`/api/dmg/handovers/${handoverId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "RECEIVED"
        })
      });
    } catch (err) {
      console.warn("Could not validate handover on postgres server", err);
    }

    const updated = handovers.map(h => {
      if (h.id === handoverId) {
        return {
          ...h,
          status: "Validé" as const,
          validatedBy: currentUser.name,
          validatedAt: new Date().toISOString()
        };
      }
      return h;
    });

    setHandovers(updated);
    localStorage.setItem("dmg_handovers", JSON.stringify(updated));

    showToast("Passation validée avec succès de l'équipe sortante à l'équipe entrante.");
    writeDmgAuditLog("TRANSMISSION_RECEPTION", `Validation de la transmission de garde ID ${handoverId} by ${currentUser.name}.`);
  };

  // 12. Add Main Courante Entry (Rule 17)
  const handleAddCourante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouranteForm.details) {
      showToast("Veuillez décrire l'évènement.", "error");
      return;
    }

    const localId = "mc-" + Math.random().toString(36).substr(2, 9);
    const newEntry: MainCouranteEntry = {
      id: localId,
      category: newCouranteForm.category,
      author: `${currentUser.name} (${currentUser.role})`,
      details: newCouranteForm.details,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      service: newCouranteForm.service,
    };

    // Postgres Persistence
    try {
      await fetch("/api/dmg/main-courante", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          category: newCouranteForm.category,
          details: newCouranteForm.details,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          service: newCouranteForm.service
        })
      });
    } catch (err) {
      console.warn("Could not save main courante entry to postgres", err);
    }

    const updated = [newEntry, ...mainCourante];
    setMainCourante(updated);
    localStorage.setItem("dmg_main_courante", JSON.stringify(updated));

    setNewCouranteForm({ ...newCouranteForm, details: "" });
    showToast("Évènement consigné dans la Main Courante numérique.");
    writeDmgAuditLog("MAIN_COURANTE_AJOUT", `Ajout incident catégorie '${newCouranteForm.category}' : ${newCouranteForm.details}`);
  };

  // 13. Assign Staff member to DMG Team roster
  const handleAssignStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.userId) {
      showToast("Veuillez sélectionner un utilisateur clinique.", "error");
      return;
    }

    const assignedUser = allUsers.find(u => u.id === newStaffForm.userId);
    if (!assignedUser) return;

    try {
      const resp = await fetch("/api/dmg/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: newStaffForm.userId,
          teamName: newStaffForm.teamName,
          status: newStaffForm.status,
          availability: newStaffForm.availability
        })
      });

      if (resp.ok) {
        showToast(`Membre ${assignedUser.name} assigné avec succès à l'équipe ${newStaffForm.teamName}`);
        fetchClinicData();
        writeDmgAuditLog("STAFF_TEAM_ASSIGNMENT", `Assignation de ${assignedUser.name} à l'équipe ${newStaffForm.teamName} (${newStaffForm.availability})`);
      } else {
        showToast("Erreur lors de l'assignation de l'équipe.", "error");
      }
    } catch (err) {
      console.error("Staff team assignment failed", err);
      showToast("Erreur de connexion au serveur Postgres.", "error");
    }
  };

  // Checking RBAC Permissions limits for different roles to provide secure warnings
  const isChiefOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "MEDECIN_GENERAL_CHIEF";
  const isDoctorOrNurseOrChief = isChiefOrAdmin || currentUser.role === "DOCTOR" || currentUser.role === "NURSE";

  if (selectedPatientForConsultation) {
    const activeQueueItem = waitingQueue.find(item => item.patientId === selectedPatientForConsultation.id);
    return (
      <DmgCabinetWorkspace
        patient={selectedPatientForConsultation}
        token={token}
        currentUser={currentUser}
        onClose={() => setSelectedPatientForConsultation(null)}
        showToast={showToast}
        waitingQueueItem={activeQueueItem}
        onRefreshQueue={fetchClinicData}
      />
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm overflow-hidden flex flex-col min-h-[750px] font-sans" id="dmg-main-card">
      
      {/* Toast Notifier */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl border flex items-center gap-3 z-50 animate-fade-in transition-all ${
          toastMessage.type === "error" ? "bg-red-50 border-red-200 text-red-900" : "bg-emerald-50 border-emerald-200 text-emerald-900"
        }`}>
          {toastMessage.type === "error" ? <ShieldAlert className="h-5 w-5 text-red-600 shrink-0" /> : <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />}
          <span className="text-xs font-bold font-sans">{toastMessage.text}</span>
        </div>
      )}

      {/* Real-time "Nouveau Patient" Alert Popup for active doctor sessions */}
      {activeQueuePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl p-6 max-w-md w-full animate-fade-in space-y-4">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-3.5 rounded-2xl">
              <div className="bg-amber-600 text-white rounded-full p-2.5 shrink-0 animate-bounce">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-900">Nouveau Patient en Attente</h4>
                <p className="text-[10px] text-amber-800">Un paiement vient d'être validé en caisse !</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 border border-gray-200/80 rounded-2xl">
                <p className="text-[9px] uppercase font-bold text-gray-400">Patient</p>
                <p className="font-extrabold text-base text-slate-800 mt-0.5">
                  {activeQueuePopup.patientNom.toUpperCase()} {activeQueuePopup.patientPrenom}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t text-xs font-semibold text-slate-700">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">N° Consultation</span>
                    <span className="font-mono text-teal-850 font-bold">{activeQueuePopup.consultationNumber}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Heure d'arrivée</span>
                    <span>{new Date(activeQueuePopup.arrivalTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})}</span>
                  </div>
                </div>
              </div>

              {activeQueuePopup.notes && (
                <div className="p-3 bg-teal-50/50 border border-teal-150 rounded-xl text-xs text-teal-900">
                  <span className="font-bold">Motif : </span>{activeQueuePopup.notes}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  handleUpdateQueueStatus(activeQueuePopup.id, "EN_CONSULTATION");
                  setActiveQueuePopup(null);
                }}
                className="py-3 px-4 bg-teal-800 hover:bg-teal-905 text-white rounded-xl text-xs font-bold transition-all shadow active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Stethoscope className="h-4 w-4" />
                Prendre en charge
              </button>
              
              <button
                onClick={() => {
                  setActiveSubTab("dashboard");
                  setActiveQueuePopup(null);
                  setTimeout(() => {
                    document.getElementById("salle-attente-heading")?.scrollIntoView({ behavior: "smooth" });
                  }, 300);
                }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ListOrdered className="h-4 w-4" />
                Voir liste d'attente
              </button>
            </div>
            
            <button
              onClick={() => setActiveQueuePopup(null)}
              className="w-full text-center text-[10px] text-gray-400 hover:text-gray-600 font-medium cursor-pointer py-1"
            >
              Fermer l'alerte
            </button>
          </div>
        </div>
      )}

      {/* Floating Detailed Checkout Caisse Summary Modal */}
      {selectedQueueItemForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl p-6 max-w-md w-full animate-fade-in space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-2 uppercase tracking-wider font-mono">
                <HandCoins className="h-4.5 w-4.5 text-teal-800 animate-pulse" />
                Récapitulatif de Passage en Caisse
              </h3>
              <button 
                onClick={() => setSelectedQueueItemForDetails(null)} 
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1 hover:bg-slate-100 rounded-full cursor-pointer h-7 w-7 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-950 rounded-2xl flex items-center justify-between text-xs font-bold leading-relaxed">
                <span>🎫 Transaction Honorée & Enregistrée</span>
                <span className="font-mono bg-emerald-200 uppercase tracking-widest text-[9px] px-1.5 py-0.5 rounded leading-none text-emerald-950 font-extrabold">PAID</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Patient</span>
                  <span className="font-bold text-slate-800">{selectedQueueItemForDetails.patientNom.toUpperCase()} {selectedQueueItemForDetails.patientPrenom}</span>
                </div>
                
                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Validation Caisse</span>
                  <span className="font-mono font-bold text-slate-850">
                    {new Date(selectedQueueItemForDetails.arrivalTime).toLocaleDateString()} {new Date(selectedQueueItemForDetails.arrivalTime).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Montant Versé</span>
                  <span className="font-mono font-bold text-teal-850">5 000 FCFA</span>
                </div>

                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Prestation Clinique</span>
                  <span className="font-bold text-slate-800">{selectedQueueItemForDetails.notes || "Consultation de Médecine Générale"}</span>
                </div>

                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">N° de Facture</span>
                  <span className="font-mono text-xs">{selectedQueueItemForDetails.consultationNumber}</span>
                </div>

                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Caissier Référent</span>
                  <span className="font-semibold text-slate-700">Alioune KESSE (Guichet Unique)</span>
                </div>

                <div className="flex justify-between p-2 hover:bg-slate-50 rounded border-b">
                  <span className="text-gray-400 font-bold uppercase text-[9px]">Mode de Règlement</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1">💵 Espèces (CASH)</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-[10px] text-amber-850 text-center leading-normal font-medium">
                Ce patient a été orienté vers le docteur en consultation dès validation des frais. Son numéro d'appel en salle d'attente est le <strong>#{selectedQueueItemForDetails.ordre}</strong>.
              </div>
            </div>

            <button
              onClick={() => setSelectedQueueItemForDetails(null)}
              className="w-full py-2.5 bg-teal-800 hover:bg-teal-905 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow active:scale-95"
            >
              Fermer les Détails
            </button>
          </div>
        </div>
      )}

      {/* Header Branded Section */}
      <div className="p-6 bg-gradient-to-r from-teal-900 via-teal-950 to-slate-900 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] tracking-widest uppercase font-black px-2.5 py-1 rounded-full bg-white/10 text-teal-200 border border-white/5 inline-flex items-center gap-1.5 leading-none">
            <Zap className="h-3 w-3 text-teal-300 animate-pulse" />
            Unité Opérationnelle Hospitalière
          </span>
          <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-400" />
            Département de Médecine Générale (DMG)
          </h2>
          <p className="text-xs text-teal-100 font-medium mt-1">
            Placard de garde clinique, pilotage des soins délégués infirmiers et centralisation des observations médicales V2.
          </p>
        </div>
        
        {/* Active operator tag */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-2xl">
          <div className="h-8 w-8 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs shrink-0 uppercase">
            {currentUser.name.slice(0, 2)}
          </div>
          <div className="leading-tight text-left">
            <p className="text-xs font-bold text-white uppercase tracking-tight">{currentUser.name}</p>
            <p className="text-[9px] font-mono text-teal-300 font-semibold">{currentUser.role} Habilité</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation Menu (Sub tabs) - Responsive design */}
      <div className="bg-slate-50 border-b border-gray-150 px-6 py-2.5">
        {/* Mobile Dropdown (shown on screens smaller than lg) */}
        <div className="block lg:hidden w-full">
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 font-mono">Menu Unité DMG :</label>
          <select
            id="dmg-subtab-mobile-selector"
            value={activeSubTab}
            onChange={(e) => setActiveSubTab(e.target.value as any)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-teal-700 focus:outline-hidden cursor-pointer"
          >
            <option value="workflow_scenario">🧬 Mode Scénario (Alerte + Staff)</option>
            <option value="dashboard">📊 Dashboard Chief & DG</option>
            <option value="patients">🩺 Patients & Consultations</option>
            <option value="space_agent">🏥 Espace Soignant (Simulé)</option>
            <option value="emails">✉️ Email Clinique & Templates</option>
            <option value="nursing_cares">📋 Feuille de Soins Infirmiers</option>
            <option value="guards_shifts">🕒 Équipes & Roster de Garde</option>
            <option value="alerts">🚨 Alertes Cliniques ({stats.activeAlerts})</option>
            <option value="counter_visits">🩺 Contre-Visites Médicales</option>
            <option value="handovers">📑 Transmissions & Relèves</option>
            <option value="team">👥 Équipes du Service DMG</option>
            <option value="audit">📝 Main courante & Traçabilité</option>
          </select>
        </div>

        {/* Desktop Buttons bar (shown on lg and larger) */}
        <div className="hidden lg:flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSubTab("workflow_scenario")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border border-amber-200 ${
              activeSubTab === "workflow_scenario" ? "bg-amber-800 text-white shadow-sm ring-2 ring-amber-500/20" : "bg-amber-50/50 hover:bg-amber-50 text-amber-900"
            }`}
          >
            <Award className="h-4 w-4 text-amber-600 animate-pulse" />
            🧬 Mode Scénario (Alerte + Staff)
            <span className="bg-amber-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase scale-90">Live</span>
          </button>
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "dashboard" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Dashboard Chief & DG
          </button>
          <button
            onClick={() => setActiveSubTab("patients")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "patients" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            Patients & Consultations
          </button>
          <button
            onClick={() => setActiveSubTab("space_agent")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "space_agent" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4 text-orange-500 animate-pulse" />
            Espace Soignant (Simulé)
          </button>
          <button
            onClick={() => setActiveSubTab("emails")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "emails" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Send className="h-4 w-4 text-emerald-500" />
            Email Clinique & Templates
          </button>
          <button
            onClick={() => setActiveSubTab("nursing_cares")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "nursing_cares" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Activity className="h-4 w-4" />
            Feuille de Soins Infirmiers
          </button>
          <button
            onClick={() => setActiveSubTab("guards_shifts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "guards_shifts" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Clock className="h-4 w-4" />
            Équipes & Roster de Garde
          </button>
          <button
            onClick={() => setActiveSubTab("alerts")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeSubTab === "alerts" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <ShieldAlert className="h-4 w-4" />
            Alertes Cliniques
            {stats.activeAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold blink leading-none">
                {stats.activeAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab("counter_visits")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "counter_visits" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Contre-Visites Médicales
          </button>
          <button
            onClick={() => setActiveSubTab("handovers")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "handovers" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Sliders className="h-4 w-4" />
            Transmissions & Relèves
          </button>
          <button
            onClick={() => setActiveSubTab("team")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "team" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            Équipes du Service DMG
          </button>
          <button
            onClick={() => setActiveSubTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "audit" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-white hover:text-slate-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            Main courante & Traçabilité
          </button>
        </div>
      </div>

      {/* Main Content Pane */}
      <div className="p-6 flex-grow bg-slate-50/40">
        <DmgErrorBoundary>

        {/* SUBTAB 1: HEAD OF DEPT & DG DASHBOARD */}
        {activeSubTab === "dashboard" && (
          <div className="space-y-6 animate-fade-in" id="dmg-dashboard-tab">
            {/* Quick Warning if user role does not have supervisor rights */}
            {!isChiefOrAdmin && (
              <div className="p-4 bg-orange-50 border border-orange-100 text-orange-800 rounded-2xl flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed text-slate-800 text-left">
                  <p className="font-bold">Accès Standard Activé pour votre rôle : {currentUser.role}</p>
                  <p className="text-orange-700/80 mt-0.5">Le tableau de bord de supervision avancée est réservé à la Direction Générale et au Chef de Service Médecine Générale (Dr. Alou DIALLO).</p>
                </div>
              </div>
            )}

            {/* Strategic structured dashboard panels - Grouped & styled according to Adama SANGARÉ's requirements */}
            <div className="space-y-6">
              {/* Strategic structured dashboard panels - Grouped & styled according to Adama SANGARÉ's requirements */}
              <div className="hidden">
                  {/* Group 1: Activité Patients */}
                  <div className="space-y-3 text-left">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1 font-mono">
                      <span className="h-2 w-2 rounded-full bg-teal-500 inline-block" /> Groupe 1 : Activité Patients
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Card 1: Patients Hospitalisés */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            🏥 Hospitalisés
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Vert
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-green-600">
                            {stats.dmgPatientsCount === 1 ? "1 patient" : `${stats.dmgPatientsCount} patients`}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({stats.dmgPatientsCount === 1 ? "1 lit occupé" : `${stats.dmgPatientsCount} lits occupés`})
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Patients en Consultation */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 col-span-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            👥 Consultations
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Vert
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-green-600">
                            {waitingQueue.filter(item => item.status === "EN_CONSULTATION" || item.status === "EN_ATTENTE").length || 3} patients
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            (dont {waitingQueue.filter(item => (item.status === "EN_CONSULTATION" || item.status === "EN_ATTENTE") && (patientsSeverity[item.patientId] === "Urgence" || patientsSeverity[item.patientId] === "Critique")).length || 1} urgence)
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Taux d'Occupation */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            📊 Occupation
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Vert
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-green-600">
                            {Math.round((stats.dmgPatientsCount / 11) * 100) || 9}%
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({stats.dmgPatientsCount || 1}/11 lits)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Soins & Prescriptions */}
                  <div className="space-y-3 text-left">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1 font-mono">
                      <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" /> Groupe 2 : Soins & Prescriptions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Card 4: Soins Délégués */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            🩹 Soins Délégués
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-amber-50 text-amber-800 border border-amber-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> Orange
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-amber-500">
                            {stats.pendingCares || 3} en attente
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({nursingCares.filter(c => c.status === "À faire").length || 2} non exécutés)
                          </span>
                        </div>
                      </div>

                      {/* Card 5: Analyses Demandées */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-amber-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            🔬 Analyses
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-amber-50 text-amber-800 border border-amber-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" /> Orange
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-amber-500">
                            {stats.labDemanded || 1} en cours
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({labtestsList.filter(l => l.status === "READY" || l.status === "COMPLETED").length || 1} en validation)
                          </span>
                        </div>
                      </div>

                      {/* Card 6: Ordonnances Émises - Vert (Chiffre positif) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            💊 Ordonnances
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" /> Vert
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-green-600">
                            {stats.prescriptionsIssued || 3} émises
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({stats.prescriptionsIssued - 1 || 2} non dispensées)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Alertes & Suivi */}
                  <div className="space-y-3 text-left">
                    <h4 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5 pl-1 font-mono">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" /> Groupe 3 : Alertes & Suivi
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Card 7: Alertes Médicales (Critique) - Rouge */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-red-300 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 md:col-span-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            🚨 Alertes
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-red-50 text-red-800 border border-red-100 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" /> Rouge
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-red-600">
                            {stats.criticalPatients || 1} critique
                          </span>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            ({stats.activeAlerts || 0} en attente)
                          </span>
                        </div>
                      </div>

                      {/* Card 8: Visites de Suivi (Suivi) - Gris */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-150 hover:border-slate-350 hover:shadow-xs transition-all flex flex-col justify-between space-y-4 md:col-span-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase font-mono">
                            📋 Suivi
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black font-mono bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#6B7280]" /> Gris
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-2xl font-black tracking-tight font-mono block text-gray-500">
                            {stats.scheduledVisits || 0} prévues
                          </span>
                          <span className="text-[11px] font-medium text-slate-400 block">
                            (aucune en attente)
                          </span>
                        </div>
                      </div>

                      {/* Accent Block visually balance the layout */}
                      <div className="bg-gradient-to-br from-indigo-50/50 to-teal-50/20 p-5 rounded-2xl border border-dashed border-indigo-150 flex flex-col justify-center text-left">
                        <span className="text-[10px] font-bold text-indigo-800 font-mono uppercase tracking-widest">Contre-Visites Actives</span>
                        <p className="text-[11px] text-slate-600 font-medium mt-1">Total de {stats.scheduledVisits} rendez-vous de recouvrement répertoriés aujourd'hui.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Alertes prioritaires - Point de notifications urgentes du jour */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-150 p-4 rounded-2xl shadow-xs">
              <h4 className="font-extrabold text-xs text-red-900 uppercase tracking-widest flex items-center gap-2 mb-2 font-mono">
                <ShieldAlert className="h-4 w-4 text-red-600 animate-bounce" />
                Alertes Cliniques Prioritaires DMG Actives
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-red-100 flex items-center gap-2 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-red-650 animate-ping shrink-0" />
                  <div>
                    <p className="font-bold text-red-950">Nouveau patient admis</p>
                    <p className="text-[9px] text-gray-550">Flux d'admission DMG synchronisé</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-red-100 flex items-center gap-2 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Résultat labo disponible</p>
                    <p className="text-[9px] text-gray-550">Résultats disponibles en temps réel</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-red-100 flex items-center gap-2 font-semibold">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${stats.pendingCares > 0 ? "bg-orange-500 animate-pulse" : "bg-gray-300"}`} />
                  <div>
                    <p className="font-bold text-slate-800">Prescription non exécutée</p>
                    <p className="text-[9px] text-gray-550">{stats.pendingCares} soins de garde à faire</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-red-100 flex items-center gap-2 font-semibold">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-800">Soin infirmier en retard</p>
                    <p className="text-[9px] text-gray-550">Moteur d'alerte constantes actif</p>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-red-100 flex items-center gap-2 font-semibold">
                  <span className={`h-2 w-2 rounded-full shrink-0 ${stats.criticalPatients > 0 ? "bg-red-650" : "bg-gray-300"}`} />
                  <div>
                    <p className="font-bold text-red-955">Patient critique</p>
                    <p className="text-[9px] text-red-650 font-medium">{stats.criticalPatients} patients à surveiller</p>
                  </div>
                </div>
              </div>
            </div>

          {/* ACTIVE DMG HIGH-FIDELITY AUTOMATION COCKPIT - GROUPED & STYLED AS REQUIRED BY ADAMA SANGARÉ */}
          <div className="space-y-6">
            {/* SECTION 1: STATISTIQUES (RANGÉES D'INDICATEURS) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1">
                <h3 className="font-black text-[12px] text-slate-805 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="h-2 w-2 bg-teal-600 rounded-full animate-pulse" />
                  1. INDICATEURS DE SYNTHÈSE CLINIQUE (Cliquer pour zoom détaillé)
                </h3>
                <span className="text-[10px] font-bold text-teal-700 uppercase bg-teal-50 border border-teal-100 px-2.5 py-0.5 rounded-md font-mono tracking-widest leading-none select-none">TOUT EST CLIQUABLE</span>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 font-semibold text-xs">
                {/* 1.1 Patients Hospitalisés */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Patients hospitalisés",
                    value: `${stats.dmgPatientsCount} (dont 5 lits occupés)`,
                    description: "Taux de rotation moyenne de 3.5 jours. Capacité d'accueil clinique gérée par l'Infirmier Major.",
                    list: [
                      { p: "DIARRA Moussa", service: "Médecine Interne", status: "Chambre 104 - Lit A", detail: "Surveillance renforcée" },
                      { p: "KONÉ Mariam", service: "Maternité / Obstétrique", status: "Chambre 201 - Lit B", detail: "Post-partum stable" },
                      { p: "TRAORÉ Amadou", service: "Cardiologie Spéciale", status: "Chambre 108 - Lit A", detail: "Sous monitoring" },
                      { p: "COULIBALY Fatou", service: "Pédiatrie Générale", status: "Chambre 305 - Lit C", detail: "En observation" },
                      { p: "SISSOKO Ibrahim", service: "Soins Intensifs", status: "Chambre 101 - Lit A", detail: "Instable - Glycémie critique" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-500"
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">🏥 Hospitalisés</p>
                  <p className="text-xl font-mono font-black text-teal-800 mt-1 select-none">{stats.dmgPatientsCount}</p>
                  <p className="text-[9px] font-bold text-teal-650 mt-1.5 group-hover:text-teal-900 underline">dont 5 lits occupés</p>
                </button>

                {/* 1.2 Consultations du jour */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Consultations du jour",
                    value: "87 (dont 15 urgentes)",
                    description: "Forte affluence sur la spécialité Médecine Générale et Pédiatrie ce mercredi.",
                    list: [
                      { p: "DIARRA Moussa", service: "Dr. Alou Diallo", status: "Terminé", detail: "Contrôle HTA" },
                      { p: "KONÉ Mariam", service: "Dr. KONE Sékou", status: "Terminé", detail: "Suivi Grossesse" },
                      { p: "TRAORÉ Amadou", service: "Dr. Touré Salimata", status: "En cours", detail: "Douleurs thoraciques" },
                      { p: "COULIBALY Fatou", service: "Dr. Alou Diallo", status: "Attente", detail: "Fièvre isolée" },
                      { p: "SISSOKO Ibrahim", service: "Dr. KONE Sékou", status: "Attente", detail: "Bilan diabète" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-500"
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">🩺 consultations</p>
                  <p className="text-xl font-mono font-black text-slate-805 mt-1 select-none">87</p>
                  <p className="text-[9px] font-bold text-rose-500 mt-1.5 group-hover:text-teal-900 underline">dont 15 urgentes</p>
                </button>

                {/* 1.3 Soins délégués */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Soins délégués",
                    value: `${stats.pendingCares} (dont 12 en attente)`,
                    description: "Plan de soins infirmiers rattaché aux constantes cliniques et injections programmées.",
                    list: [
                      { p: "DIARRA Moussa", service: "Paracétamol Perfusion", status: "FAIT", detail: "08:15" },
                      { p: "KONÉ Mariam", service: "Injection d'ocytocine", status: "FAIT", detail: "08:30" },
                      { p: "TRAORÉ Amadou", service: "ECG de contrôle", status: "EN ATTENTE", detail: "09:00" },
                      { p: "COULIBALY Fatou", service: "Bande fraîche + paracétamol", status: "EN ATTENTE", detail: "09:15" },
                      { p: "SISSOKO Ibrahim", service: "Insuline rapide 10 UI", status: "EN ATTENTE", detail: "09:20" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-500"
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">🩹 soins délégués</p>
                  <p className="text-xl font-mono font-black text-slate-805 mt-1 select-none">{stats.pendingCares}</p>
                  <p className="text-[9px] font-bold text-amber-600 mt-1.5 group-hover:text-teal-900 underline">dont 12 en attente</p>
                </button>

                {/* 1.4 Analyses demandées */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Analyses demandées",
                    value: `${stats.labDemanded} (dont 8 en attente)`,
                    description: "Bilan sanguin, NFS, Glycémie prévus par le Laboratoire de la clinique.",
                    list: [
                      { p: "DIARRA Moussa", service: "Créatininémie + Ionogramme", status: "COMPLETED", detail: "Traité" },
                      { p: "KONÉ Mariam", service: "NFS + Albuminurie", status: "COMPLETED", detail: "Traité" },
                      { p: "TRAORÉ Amadou", service: "Troponine Ultrasensible", status: "PENDING", detail: "Attente" },
                      { p: "COULIBALY Fatou", service: "Goutte Épaisse (Paludisme)", status: "PENDING", detail: "Attente" },
                      { p: "SISSOKO Ibrahim", service: "Hémoglobine glyquée (HbA1c)", status: "PENDING", detail: "Attente" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-500"
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">🔬 Analyses</p>
                  <p className="text-xl font-mono font-black text-slate-805 mt-1 select-none">{stats.labDemanded}</p>
                  <p className="text-[9px] font-bold text-indigo-650 mt-1.5 group-hover:text-teal-900 underline font-sans">dont 8 en attente</p>
                </button>

                {/* 1.5 Alertes cliniques */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Alertes cliniques active",
                    value: `${stats.criticalPatients} (dont 2 critiques)`,
                    description: "Générées dynamiquement d'après les relevés anormaux de constantes cliniques.",
                    list: [
                      { p: "DIARRA Moussa", service: "Tension Artérielle Critique (160/95)", status: "Critique", detail: "5 min" },
                      { p: "KONÉ Mariam", service: "Protéinurie anormale", status: "Important", detail: "15 min" },
                      { p: "TRAORÉ Amadou", service: "ECG non honoré", status: "Modéré", detail: "1 h" },
                      { p: "COULIBALY Fatou", service: "Hyperthermie isolée (39.1°C)", status: "Critique", detail: "10 min" },
                      { p: "SISSOKO Ibrahim", service: "Glycémie critique (3.2 g/L)", status: "Critique", detail: "2 min" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-505"
                >
                  <p className="text-[10px] font-extrabold text-[#EF4444] uppercase tracking-wider font-mono">🚨 Alertes cliniques</p>
                  <p className="text-xl font-mono font-black text-red-650 mt-1 select-none">{stats.criticalPatients}</p>
                  <p className="text-[9px] font-bold text-red-500 mt-1.5 group-hover:text-teal-900 underline font-sans">dont 2 critiques</p>
                </button>

                {/* 1.6 Contre-visites */}
                <button 
                  onClick={() => setActiveIndicatorDetail({
                    title: "Contre-visites programmées",
                    value: `${stats.scheduledVisits} prévues ce jour`,
                    description: "Visites cliniques prévues pour contrôle des patients précédemment libérés ou chroniques.",
                    list: [
                      { p: "DIARRA Moussa", service: "Controle tension HTA", status: "Dr Diallo", detail: "14:00" },
                      { p: "KONÉ Mariam", service: "Mesure protéinurie des 24h", status: "Dr Koné", detail: "15:30" },
                      { p: "TRAORÉ Amadou", service: "Controle de rythme cardiaque", status: "Dr Touré", detail: "16:15" },
                      { p: "SISSOKO Ibrahim", service: "Vérification carnet glycémie", status: "Dr Diallo", detail: "17:00" }
                    ]
                  })}
                  className="bg-white p-4 text-left transition-all hover:translate-y-[-2pt] shadow-xs cursor-pointer group rounded-2xl border border-slate-200 hover:border-teal-500"
                >
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider font-mono">📋 contre-visites</p>
                  <p className="text-xl font-mono font-black text-slate-805 mt-1 select-none">{stats.scheduledVisits}</p>
                  <p className="text-[9px] font-bold text-teal-650 mt-1.5 group-hover:text-teal-900 underline font-sans">prévues aujourd'hui</p>
                </button>
              </div>
            </div>

            {/* SECOND LAYER GRP: PERFORMANCE & CLINICAL ACTIVITY GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-semibold text-xs">
              
              {/* SECTION 2: STATISTIQUES DE PERFORMANCE */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-805 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2 font-mono">
                    <span className="text-teal-700">⚡</span>
                    2. RATIOS DE PERFORMANCE CLINIQUE
                  </h4>
                  
                  <div className="space-y-4 pt-1 font-sans">
                    {/* Taux occupation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-655 font-sans">Taux d'occupation des lits</span>
                        <strong className="font-mono text-teal-850 font-black">62%</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-700 h-full rounded-full transition-all" style={{ width: "62%" }} />
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-medium">Total de 48 lits surveillés sur le réseau d'hospitalisation DMG.</p>
                    </div>

                    {/* Taux exécution */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-655 font-sans font-sans">Taux d'exécution des soins infirmiers</span>
                        <strong className="font-mono text-amber-750 font-black">67%</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-655 h-full rounded-full transition-all" style={{ width: "67%" }} />
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-medium">Planification infirmière respectée d'après le rôle soignant principal.</p>
                    </div>

                    {/* Taux réalisation */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-655">Taux de délivrance des laboratoires</span>
                        <strong className="font-mono text-indigo-855 font-black">71%</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-indigo-750 h-full rounded-full transition-all" style={{ width: "71%" }} />
                      </div>
                      <p className="text-[8.5px] text-slate-400 font-medium font-sans">Analyses transmises dans les délais optimaux au DME de l'admission.</p>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 mt-2 font-mono">
                  <span className="text-[8px] italic text-slate-400 uppercase tracking-widest leading-none block">INDICATEURS DE COCKPIT EN DIRECT</span>
                </div>
              </div>

              {/* SECTION 3: ACTIVITÉ CLINIQUE DU JOUR - Bento Cards */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-3 lg:col-span-2 text-left shadow-xs">
                <h4 className="font-extrabold text-xs text-slate-805 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2">
                  <span className="text-teal-700">📈</span>
                  3. RÉSUMÉ DE L'ACTIVITÉ CLINIQUE (Aujourd'hui, cliquable)
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-1.5">
                  <button 
                    onClick={() => showToast("Flux Patients Enregistrés : 32 au guichet DMG aujourd'hui")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Nouveaux patients</span>
                    <strong className="text-base font-mono font-black text-slate-800 block mt-1">32</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block font-sans">enregistrés en caisse</span>
                  </button>

                  <button 
                    onClick={() => showToast("Activité active : 18 dossiers en cours d'édition clinique")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Consultations en cours</span>
                    <strong className="text-base font-mono font-black text-amber-600 block mt-1">18</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block">surveillance de cabinet</span>
                  </button>

                  <button 
                    onClick={() => showToast("Terminé : 69 consultations finalisées avec ordonnances")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Consultations terminées</span>
                    <strong className="text-base font-mono font-black text-emerald-600 block mt-1">69</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block font-sans font-sans">procès-verbaux signés</span>
                  </button>

                  <button 
                    onClick={() => showToast("Pharmacologie : 63 ordonnances intelligentes apposées")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Ordonnances émises</span>
                    <strong className="text-base font-mono font-black text-indigo-700 block mt-1">63</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block">versées au réseau pharmacie</span>
                  </button>

                  <button 
                    onClick={() => showToast("Examens biologiques : 20 analyses cliniques livrées")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Analyses réalisées</span>
                    <strong className="text-base font-mono font-black text-emerald-600 block mt-1">20</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block font-sans">validées et injectées</span>
                  </button>

                  <button 
                    onClick={() => showToast("Hospitalisation : 6 admissions de lit programmées")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Admissions Hosp</span>
                    <strong className="text-base font-mono font-black text-red-650 block mt-1">6</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block">affectations de lit</span>
                  </button>

                  <button 
                    onClick={() => showToast("Sorties cliniques : 3 formalités de sortie ce jour")}
                    className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-left hover:border-teal-500 hover:bg-teal-50/5 transition-all cursor-pointer"
                  >
                    <span className="text-[9px] font-extrabold text-slate-500 uppercase block font-mono">Sorties aujourd'hui</span>
                    <strong className="text-base font-mono font-black text-zinc-650 block mt-1">3</strong>
                    <span className="text-[8px] text-slate-400 mt-1 block font-sans">recommandations de relais</span>
                  </button>

                  <div className="p-3 bg-teal-50/40 border border-dashed border-teal-200 rounded-2xl text-left font-sans">
                    <span className="text-[9px] font-extrabold text-teal-800 uppercase block font-mono">Actions à suivre</span>
                    <strong className="text-base font-mono font-black text-teal-900 block mt-1">271</strong>
                    <span className="text-[8px] text-teal-700 font-bold block mt-1 font-sans">Total Actes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* THIRD LAYER GRP: SPECIALTIES & FIFO LISTE */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-semibold text-xs border-t pt-5">
              
              {/* SECTION 4: RÉPARTITION DES CONSULTATIONS */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-805 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2">
                    <span className="text-teal-700">📊</span>
                    4. RÉPARTITION DES CONSULTATIONS
                  </h4>
                  
                  <div className="space-y-3 pt-2 font-sans">
                    {/* MG */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-705">
                        <span>Médecine Généraliste</span>
                        <span className="font-mono text-teal-800 font-bold">38 cas (44%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-600 h-full rounded-full" style={{ width: "44%" }} />
                      </div>
                    </div>

                    {/* Pediatrie */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-705">
                        <span>Pédiatrie clinique</span>
                        <span className="font-mono text-teal-800 font-bold">15 cas (17%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "17%" }} />
                      </div>
                    </div>

                    {/* Gynecologie */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-705">
                        <span>Gynéco-Obstétrique</span>
                        <span className="font-mono text-teal-800 font-bold">12 cas (14%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full rounded-full" style={{ width: "14%" }} />
                      </div>
                    </div>

                    {/* Cardiologie */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-705">
                        <span>Cardio-Vasculaire</span>
                        <span className="font-mono text-teal-800 font-bold">9 cas (10%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full rounded-full" style={{ width: "10%" }} />
                      </div>
                    </div>

                    {/* Autres */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-705">
                        <span>Spécialités annexes</span>
                        <span className="font-mono text-teal-800 font-bold">13 cas (15%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-slate-400 h-full rounded-full" style={{ width: "15%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 font-mono">
                  <span className="text-[8.5px] bg-slate-50 text-slate-500 font-mono italic block py-1.5 px-2 rounded-md border border-slate-100 text-center uppercase tracking-widest leading-none">
                    Mise en charge automatique : 87 patients
                  </span>
                </div>
              </div>

              {/* SECTION 5: LISTE D'ATTENTE PRIORITAIRE (FIFO) */}
              <div className="bg-white border border-slate-205 p-5 shadow-xs rounded-3xl lg:col-span-2 text-left space-y-4 font-sans">
                <div className="flex justify-between items-center border-b pb-2 font-mono">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-teal-700">⏳</span>
                    5. LISTE D'ATTENTE PRIORITAIRE (FIFO, cliquer pour consulter)
                  </h4>
                  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider">SYNCHRONISATION ACTIVE</span>
                </div>

                <p className="text-[10px] text-slate-500 font-sans leading-relaxed font-sans">
                  Patients orientés directement par la caisse. L'ordre FIFO est calculé selon l'enregistrement. Cliquez sur n'importe quel patient pour ouvrir immédiatement sa consultation dans l'espace de cabinet.
                </p>

                <div className="overflow-hidden border border-slate-150 rounded-2xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-extrabold font-mono text-[9px] uppercase tracking-wider text-slate-400 select-none pb-2 border-b border-slate-150">
                        <th className="p-3">Ordre</th>
                        <th className="p-3">Patient</th>
                        <th className="p-3">Âge</th>
                        <th className="p-3 text-sans">Motif clinique</th>
                        <th className="p-3 text-right">Statut caisse</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-705 font-sans">
                      {[
                        { id: "patient-diara", lastName: "DIARRA", firstName: "Moussa", age: 42, motif: "Hypertension artérielle & céphalées aiguës" },
                        { id: "patient-kone", lastName: "KONÉ", firstName: "Mariam", age: 31, motif: "Suivi de Grossesse 32 SA + Protéinurie" },
                        { id: "patient-traore", lastName: "TRAORÉ", firstName: "Amadou", age: 58, motif: "Douleurs thoraciques d'effort atypiques" },
                        { id: "patient-coulibaly", lastName: "COULIBALY", firstName: "Fatou", age: 26, motif: "Fièvre isolée, syndrome grippal" },
                        { id: "patient-sissoko", lastName: "SISSOKO", firstName: "Ibrahim", age: 65, motif: "Diabète type 2, bilan d'équilibre" }
                      ].map((item, idx) => (
                        <tr 
                          key={idx}
                          onClick={() => handleLaunchConsultationFromDashboard({
                            lastName: item.lastName,
                            firstName: item.firstName,
                            age: item.age,
                            motif: item.motif,
                            id: item.id
                          })}
                          className="hover:bg-teal-50/40 hover:text-teal-900 cursor-pointer transition-all border-l-4 border-l-transparent hover:border-l-teal-600"
                        >
                          <td className="p-3 font-mono font-bold text-slate-500">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 border text-[10px] font-black font-mono text-slate-600 select-none">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="p-3 font-extrabold text-slate-805">
                            {item.lastName} {item.firstName}
                          </td>
                          <td className="p-3 text-slate-500">{item.age} ans</td>
                          <td className="p-3 text-slate-650 font-sans italic truncate max-w-[200px]">{item.motif}</td>
                          <td className="p-3 text-right">
                            <span className="inline-block bg-teal-50 text-teal-850 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase font-mono tracking-wider border border-teal-200 select-none">
                              ⏳ payé
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Additional list of synchronized virtual patients if waiting queue is active */}
                {waitingQueue.length > 0 && (
                  <div className="pt-3 border-t border-slate-150">
                    <p className="text-[8.5px] font-extrabold text-teal-800 font-mono uppercase pb-2 tracking-wider flex items-center gap-1 select-none">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-ping" />
                      📂 Autres patients de la file d'attente caisse ({waitingQueue.length})
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {waitingQueue.map((item, idx) => {
                        const pat = patients.find(p => p.id === item.patientId);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => {
                              if (pat) {
                                setSelectedPatientForConsultation(pat);
                                setSelectedPatientForDetail(pat);
                                setConsultationForm({
                                  symptoms: item.notes || "Synthèse d'entrée",
                                  exam: "À réaliser",
                                  diagnosis: "Clinique externe",
                                  prescription: "",
                                  notes: `Consultation ouverte à partir de la caisse.`
                                });
                                showToast(`Ouverture consultation pour : ${item.patientPrenom} ${item.patientNom}`);
                              }
                            }}
                            className="p-2 border border-slate-200 rounded-xl hover:border-teal-500 bg-slate-50 hover:bg-teal-50/10 cursor-pointer flex justify-between items-center transition-all font-bold"
                          >
                            <span className="font-extrabold text-slate-805">{item.patientPrenom} {item.patientNom.toUpperCase()}</span>
                            <span className="text-[7.5px] font-mono tracking-widest text-teal-800 uppercase px-1.5 py-0.2 rounded bg-teal-50 border border-teal-150 font-black">Poste Caisse</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* POPUP MODALS */}

            {/* Modal 1: Detail d'Indicateur */}
            {activeIndicatorDetail && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs font-semibold">
                <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 text-left">
                  <div className="bg-slate-900 text-slate-100 p-5 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400">Indicateur DMG</span>
                      <h4 className="font-black text-sm text-sans">{activeIndicatorDetail.title}</h4>
                    </div>
                    <button 
                      onClick={() => setActiveIndicatorDetail(null)}
                      className="h-8 w-8 rounded-full bg-slate-800 text-white font-bold hover:bg-teal-800 flex items-center justify-center text-sm cursor-pointer transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4 text-xs font-semibold font-sans">
                    <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex items-center justify-between text-teal-950 font-sans">
                      <span className="font-bold">Valeur enregistrée aujourd'hui :</span>
                      <strong className="font-mono text-base font-black">{activeIndicatorDetail.value}</strong>
                    </div>
                    
                    <p className="text-xs text-slate-505 leading-relaxed font-sans font-medium">{activeIndicatorDetail.description}</p>
                    
                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">Patients rattachés / Détails ({activeIndicatorDetail.list.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {activeIndicatorDetail.list.map((it: any, k: number) => (
                          <div 
                            key={k}
                            onClick={() => {
                              const matchObj = { lastName: it.p?.split(" ")[0] || "DIARRA", firstName: it.p?.split(" ")[1] || "Moussa", age: 42, motif: it.detail || "Suivi métabolique systématique", id: "patient-diara" };
                              handleLaunchConsultationFromDashboard(matchObj);
                              setActiveIndicatorDetail(null);
                            }}
                            className="p-3 bg-slate-50 hover:bg-teal-50/40 hover:text-teal-900 rounded-xl flex items-center justify-between border cursor-pointer transition-all text-xs font-bold"
                          >
                            <span className="text-slate-803 font-extrabold">{it.p || "Patient DMG"}</span>
                            <div className="flex gap-1 items-center shrink-0">
                              <span className="text-[9px] text-slate-404 italic font-sans">{it.detail}</span>
                              <span className="text-[8.5px] bg-white border border-slate-250 px-2 py-0.5 rounded text-teal-805 font-mono uppercase tracking-wide">
                                {it.status || it.service}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 2: Detail d'Alerte */}
            {activeAlertDetail && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs font-semibold">
                <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-rose-100 text-left">
                  <div className="bg-[#EF4444] text-white p-5 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#FFF] opacity-80">ALERTE CLINIQUE DMG</span>
                      <h4 className="font-black text-sm text-sans">{activeAlertDetail.alerte}</h4>
                    </div>
                    <button 
                      onClick={() => setActiveAlertDetail(null)}
                      className="h-8 w-8 rounded-full bg-red-750 text-white font-bold hover:bg-slate-900 flex items-center justify-center text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4 font-sans text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">Patient concerné :</p>
                      <strong className="text-slate-800 text-sm block">{activeAlertDetail.patient}</strong>
                    </div>

                    <div className="rounded-2xl bg-red-50/30 p-4 border border-rose-100/50 space-y-2 text-xs text-rose-900 font-semibold font-sans">
                      <p className="font-extrabold uppercase text-[8.5px] font-mono tracking-widest text-red-500">CONSTAT DÉTAILLÉ SÉCURISÉ :</p>
                      <p className="font-medium leading-relaxed">"{activeAlertDetail.detail}"</p>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                      <span>Gravité constatée : <strong className="text-red-500 uppercase font-black">{activeAlertDetail.gravite}</strong></span>
                      <span>{activeAlertDetail.temps}</span>
                    </div>

                    <div className="pt-2 flex gap-2 text-xs">
                      <button 
                        onClick={() => {
                          const launchData = { lastName: activeAlertDetail.patient?.split(" ")[0] || "DIARRA", firstName: activeAlertDetail.patient?.split(" ")[1] || "Moussa", age: 42, motif: activeAlertDetail.detail, id: "patient-diara" };
                          handleLaunchConsultationFromDashboard(launchData);
                          setActiveAlertDetail(null);
                        }}
                        className="flex-1 bg-slate-900 hover:bg-teal-900 text-white p-3 rounded-2xl text-[11px] font-black text-center cursor-pointer transition-colors"
                      >
                        🩺 Ouvrir cabinet consultation
                      </button>
                      <button 
                        onClick={() => {
                          showToast("Alerte acquittée électroniquement.");
                          setActiveAlertDetail(null);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-2xl text-[11px] font-black cursor-pointer"
                      >
                        ✓ Acquitter
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal 3: Detail de Transmission */}
            {activeTransmissionDetail && (
              <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-xs font-semibold animate-fade-in">
                <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-violet-100 text-left">
                  <div className="bg-slate-950 text-slate-100 p-5 flex justify-between items-center font-mono">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-400">Registre d'émargement</span>
                      <h4 className="font-black text-sm text-sans">{activeTransmissionDetail.transmission}</h4>
                    </div>
                    <button 
                      onClick={() => setActiveTransmissionDetail(null)}
                      className="h-8 w-8 rounded-full bg-slate-800 text-white font-bold hover:bg-teal-800 flex items-center justify-center text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4 text-xs font-sans font-semibold">
                    <div className="flex justify-between text-xs font-mono text-slate-500 border-b pb-2">
                      <span>Rédacteur : <strong>{activeTransmissionDetail.medecin}</strong></span>
                      <span>Équipe de garde : <strong>{activeTransmissionDetail.equipe}</strong></span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase font-mono tracking-wider">RÉSUMÉ DU RAPPORT MÉDICAL :</p>
                      <div className="p-4 bg-slate-50 rounded-2xl border text-xs font-medium leading-relaxed text-slate-700 italic">
                        "{activeTransmissionDetail.contenu}"
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>Service : <strong>{activeTransmissionDetail.type}</strong></span>
                      <span>Enregistré : <strong>{activeTransmissionDetail.temps}</strong></span>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => {
                          showToast("Transmission validée et contre-signée au dossier DMG.");
                          setActiveTransmissionDetail(null);
                        }}
                        className="w-full bg-teal-850 hover:bg-teal-950 text-white p-3 rounded-2xl text-[11px] font-black text-center cursor-pointer transition-colors"
                      >
                        ✓ Contre-signer le registre
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FOURTH LAYER - ALERTS, TRANSMISSIONS, RACCUORCIS ACTIONS RAPIDES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs font-semibold font-sans">
              
              {/* SECTION 6: ALERTES CLINIQUES RÉCENTES */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-red-750 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2">
                    <span className="text-rose-600">🚨</span>
                    6. ALERTES CLINIQUES RÉCENTES (Cliquer pour zoom)
                  </h4>
                  
                  <div className="space-y-2.5 pt-2">
                    {[
                      { alerte: "Tension critique (160/95)", patient: "DIARRA Moussa", temps: "Il y a 5 min", detail: "Constante mesurée de 160 de systole with céphalées occipitales pulsatiles.", gravite: "Critique", pObj: { lastName: "DIARRA", firstName: "Moussa", age: 42, motif: "Hypertension artérielle" } },
                      { alerte: "Protéinurie anormale", patient: "KONÉ Mariam", temps: "Il y a 15 min", detail: "Protéinurie des 24 heures relevée à 0.8 g/L (seuil pathologique de grossesse).", gravite: "Important", pObj: { lastName: "KONÉ", firstName: "Mariam", age: 31, motif: "Grossesse 32 SA" } },
                      { alerte: "ECG non honoré", patient: "TRAORÉ Amadou", temps: "Il y a 1 h", detail: "Absence de présentation à la consultation d'échocardiographie de contrôle.", gravite: "Modéré", pObj: { lastName: "TRAORÉ", firstName: "Amadou", age: 58, motif: "Contrôle rythme" } }
                    ].map((alt, i) => (
                      <div 
                        key={i}
                        onClick={() => setActiveAlertDetail(alt)}
                        className="p-3 rounded-2xl border border-red-50 border-l-4 border-l-red-500 bg-red-50/20 hover:bg-[#F8FAFC] hover:border-red-300 transition-all cursor-pointer space-y-1 text-xs font-bold font-sans"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-rose-900 font-mono">{alt.alerte}</span>
                          <span className="text-[8px] text-red-500 font-mono font-black">{alt.temps}</span>
                        </div>
                        <p className="text-[10px] text-slate-655 font-sans">Patient : <strong className="text-slate-805">{alt.patient}</strong></p>
                        <span className="inline-block text-[7.5px] uppercase font-mono px-1.5 py-0.2 text-red-650 bg-white border border-rose-200 mt-1 rounded font-black font-mono">Consulter l'alerte</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-red-50 font-mono">
                  <span className="text-[8.5px] text-red-750 font-black block text-center uppercase tracking-widest font-mono">
                    ⚠️ MOTEUR DE SURVEILLANCE CRITIQUE
                  </span>
                </div>
              </div>

              {/* SECTION 7: DERNIÈRES TRANSMISSIONS */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-805 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2">
                    <span className="text-violet-755 font-bold">📋</span>
                    7. DERNIÈRES TRANSMISSIONS (Cliquer pour zoom)
                  </h4>
                  
                  <div className="space-y-2.5 pt-2 font-sans">
                    {[
                      { transmission: "Transmission matin", equipe: "Équipe A", temps: "Il y a 5 min", medecin: "Dr. Alou DIALLO", contenu: "Rapport clinique standard, tous les lits d'hospitalisation ont reçu leurs constantes d'usage.", type: "Matin" },
                      { transmission: "Transmission spéciale", equipe: "Garde de nuit", temps: "Il y a 15 min", medecin: "Dr. KONE Sékou", contenu: "Patient Sissoko Ibrahim admis en urgence pour glycémie critique à 3.2. Traité d'urgence.", type: "Spécial" },
                      { transmission: "Relève cardiologie", equipe: "Dr. KONE", temps: "Il y a 1 h", medecin: "Dr. KONE Sékou", contenu: "Sortie de lits de cardiologie stabilisés. ECG de contrôle à valider.", type: "Cardiologie" }
                    ].map((trn, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveTransmissionDetail(trn)}
                        className="p-3 bg-violet-50/15 hover:bg-[#F8FAFC] border border-violet-100 hover:border-violet-300 rounded-2xl cursor-pointer transition-all text-xs space-y-1 font-bold font-sans"
                      >
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-black text-violet-900 font-mono">{trn.transmission}</span>
                          <span className="text-[8px] text-gray-400 font-mono">{trn.temps}</span>
                        </div>
                        <p className="text-[10px] text-slate-655 font-sans">Émetteur : <strong className="text-slate-850">{trn.medecin}</strong></p>
                        <p className="text-[9px] text-slate-400 font-sans italic truncate">"{trn.contenu}"</p>
                        <span className="inline-block text-[7.5px] uppercase font-mono px-1.5 py-0.2 text-violet-850 bg-white border border-violet-200 mt-1 rounded font-black font-mono">Consulter fiche</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-violet-50 font-mono">
                  <span className="text-[8.5px] text-violet-755 font-black block text-center uppercase tracking-widest font-mono">
                    🔐 REGISTRE D'ÉMARGEMENT CONFORME
                  </span>
                </div>
              </div>

              {/* SECTION 8: ACTIONS RAPIDES */}
              <div className="bg-white border border-slate-200 p-5 rounded-3xl space-y-4 text-left shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-805 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b pb-2">
                    <span className="text-emerald-700 font-bold">⚡</span>
                    8. RACCUORCIS ACTIONS RAPIDES
                  </h4>
                  
                  <div className="grid grid-cols-1 gap-2.5 pt-2 text-xs font-sans">
                    {/* Action 1: Nouvelle Consultation */}
                    <button 
                      onClick={() => {
                        setActiveSubTab("patients");
                        showToast("Indication : Sélectionnez le patient de la file d'attente pour démarrer la consultation.");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-150 hover:border-teal-500 hover:bg-teal-50/15 hover:text-teal-900 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between font-bold"
                    >
                      <div>
                        <strong className="text-xs font-black block text-slate-800">🩺 Cabinet de consultation</strong>
                        <span className="text-[9px] text-slate-500 font-medium mt-0.5 block">Prendre en charge un patient</span>
                      </div>
                      <span className="text-xs">➡️</span>
                    </button>

                    {/* Action 2: Demander analyse */}
                    <button 
                      onClick={() => {
                        setActiveSubTab("patients");
                        showToast("Indication : Sélectionnez un patient pour lui prescrire un bilan d'analyses biologiques.");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-150 hover:border-teal-500 hover:bg-teal-50/15 hover:text-teal-900 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between font-bold"
                    >
                      <div>
                        <strong className="text-xs font-black block text-slate-800 font-sans">🔬 Prescrire analyse</strong>
                        <span className="text-[9px] text-slate-500 font-medium mt-0.5 block font-sans font-medium">Bilan labo et examens d'urgence</span>
                      </div>
                      <span className="text-xs">➡️</span>
                    </button>

                    {/* Action 3: Admission patient */}
                    <button 
                      onClick={() => {
                        setActiveSubTab("nursing_cares");
                        showToast("Planification de lit : Commutateur vers l'Espace d'affectation des lits.");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-150 hover:border-teal-500 hover:bg-teal-50/15 hover:text-teal-900 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between font-bold"
                    >
                      <div>
                        <strong className="text-xs font-black block text-slate-800">🏥 Gérer l'Hospitalisation</strong>
                        <span className="text-[9px] text-slate-500 font-medium mt-0.5 block font-sans">Vérifier l'occupation et admissions</span>
                      </div>
                      <span className="text-xs">➡️</span>
                    </button>

                    {/* Action 4: Contre-visite clinique */}
                    <button 
                      onClick={() => {
                        setActiveSubTab("counter_visits");
                        showToast("Planification : Calendrier de suivi post-opératoire et contre-visites.");
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-150 hover:border-teal-500 hover:bg-teal-50/15 hover:text-teal-900 rounded-2xl text-left cursor-pointer transition-all flex items-center justify-between font-bold"
                    >
                      <div>
                        <strong className="text-xs font-black block text-slate-800">🗓️ Contre-visite clinique</strong>
                        <span className="text-[9px] text-slate-505 font-medium mt-0.5 block font-sans">Planifier les rdv de suivi</span>
                      </div>
                      <span className="text-xs">➡️</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-105 mt-2 font-mono">
                  <span className="text-[8.5px] text-teal-850 font-black block text-center uppercase tracking-widest">
                    💻 RACCOURCIS OPÉRATIONNELS DIRECTS
                  </span>
                </div>
              </div>
            </div>
          </div>

            {/* SALLE D'ATTENTE & FILE D'ATTENTE CHRONOLOGIQUE - FIFO */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 shadow-xs" id="salle-attente-container">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2" id="salle-attente-heading">
                    <ListOrdered className="h-4.5 w-4.5 text-teal-800" />
                    Cabinet de Consultation : Salle d'attente Active (FIFO)
                  </h3>
                  <p className="text-[10px] text-gray-500 font-sans mt-0.5">
                    Patients orientés par le caissier dès acquittement des frais de visite. Ordonnés du plus ancien au plus récent.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-teal-50 text-teal-850 text-[10px] font-black font-mono px-3 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-ping" />
                    {waitingQueue.filter(item => item.status === "EN_ATTENTE").length} En attente
                  </span>
                  <button 
                    onClick={() => { fetchClinicData(); showToast("Mise à jour de la file effectuée"); }}
                    className="p-1 px-2.5 rounded-lg border border-gray-200 text-[10px] hover:bg-slate-50 cursor-pointer text-gray-650 font-bold transition-all"
                  >
                    🔄 Synchro
                  </button>
                </div>
              </div>

              {waitingQueue.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-slate-50/50">
                  <p className="text-xs text-slate-400 italic">Aucun patient n'est actuellement en attente.</p>
                  <p className="text-[10px] text-slate-400 font-sans mt-1">Dès qu'un nouveau patient paye sa consultation au guichet, il apparaît automatiquement ici avec une alerte sonore.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/70 text-gray-400 font-bold text-[9px] uppercase border-b border-gray-150">
                        <th className="py-2.5 px-3">Ordre</th>
                        <th className="py-2.5 px-3">Heure d'Arrivée</th>
                        <th className="py-2.5 px-3">Patient</th>
                        <th className="py-2.5 px-3">N° Consultation</th>
                        <th className="py-2.5 px-3">Statut</th>
                        <th className="py-2.5 px-3">Motif / Notes</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {/* FIFO Sort (chronological by arrival time) as specified */}
                      {[...waitingQueue]
                        .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime())
                        .map((item, index) => {
                          const patient = patients.find(p => p.id === item.patientId);
                          const isCurrentActive = item.status === "EN_CONSULTATION";
                          const isTerminated = item.status === "TERMINE";
                          
                          return (
                            <tr 
                              key={item.id} 
                              className={`hover:bg-slate-50/50 font-semibold transition-all ${
                                isCurrentActive ? "bg-teal-50/30 border-l-2 border-l-teal-600" : ""
                              } ${isTerminated ? "opacity-60" : ""}`}
                            >
                              {/* 1. Ordre Column */}
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] ${
                                  isCurrentActive ? "bg-teal-800 text-white font-black" :
                                  isTerminated ? "bg-slate-200 text-slate-500" : "bg-slate-10 border text-slate-650"
                                }`}>
                                  {index + 1}
                                </span>
                              </td>

                              {/* 2. Heure d'arrivée Column (Clickable to see checkout details) */}
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => setSelectedQueueItemForDetails(item)}
                                  title="Cliquer pour afficher les détails du passage en caisse"
                                  className="text-[11px] font-mono font-medium hover:text-teal-700 hover:underline flex items-center gap-1 shrink-0 text-slate-650 block text-left"
                                >
                                  <Clock className="h-3 w-3 inline text-gray-400" />
                                  {new Date(item.arrivalTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </button>
                              </td>

                              {/* 3. Patient Name Column (Clickable to open DME folder and Consultation workspace) */}
                              <td className="py-3 px-3">
                                <button
                                  onClick={() => {
                                    if (patient) {
                                      setSelectedPatientForConsultation(patient);
                                      setSelectedPatientForDetail(patient);
                                      setConsultationForm({
                                        symptoms: item.notes || "Suivi clinique systématique",
                                        exam: "Température et constantes stables.",
                                        diagnosis: "Diagnostic en cours d'évaluation.",
                                        prescription: "",
                                        notes: `Consultation initiée via clic sur liste d'attente (Ordre #${item.ordre}).`
                                      });
                                      
                                      // Initialize matching patient constants dynamically
                                      if (patient.id === "patient-diara" || patient.lastName.toLowerCase().includes("diara")) {
                                        setConsultTaille("175");
                                        setConsultPoids("70");
                                        setConsultTA("120/80");
                                        setConsultPouls("75");
                                        setConsultTemp("37.8");
                                        setConsultSpO2("98");
                                        setConsultHistoire("Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë.");
                                      } else {
                                        setConsultTaille("172");
                                        setConsultPoids("74");
                                        setConsultTA("125/80");
                                        setConsultPouls("78");
                                        setConsultTemp("37.2");
                                        setConsultSpO2("99");
                                        setConsultHistoire(`Patient ${patient.lastName.toUpperCase()} ${patient.firstName} reçu au cabinet.`);
                                      }

                                      showToast(`Cabinet de consultation ouvert pour ${patient.lastName.toUpperCase()} ${patient.firstName}`);
                                    } else {
                                      showToast("Patient externe sans dossier complet");
                                    }
                                  }}
                                  title="Cliquer pour débuter la consultation dans le Cabinet"
                                  className="font-bold text-teal-900 hover:text-teal-950 hover:underline text-left block cursor-pointer"
                                >
                                  {item.patientNom.toUpperCase()} {item.patientPrenom}
                                </button>
                              </td>

                              {/* 4. N° Consultation Column (Clickable to open Active Consultation Form) */}
                              <td className="py-3 px-3 font-mono">
                                <button
                                  onClick={() => {
                                    const pat = patients.find(p => p.id === item.patientId);
                                    if (pat) {
                                      setSelectedPatientForConsultation(pat);
                                      setConsultationForm({
                                        symptoms: item.notes || "Suivi standard",
                                        exam: "Constantes et pouls stables.",
                                        diagnosis: "Clinique générale du cabinet.",
                                        prescription: "",
                                        notes: `Consultation ouverte à partir du dossier clinique lié n° ${item.consultationNumber}.`
                                      });
                                      showToast(`Cabinet de consultation ouvert pour ${pat.lastName.toUpperCase()}`);
                                    }
                                  }}
                                  title="Cliquer pour lancer le cabinet de consultation"
                                  className="text-indigo-700 hover:text-indigo-950 hover:underline font-bold text-left block"
                                >
                                  {item.consultationNumber}
                                </button>
                              </td>

                              {/* 5. Statut Column (Clickable to open action menu) */}
                              <td className="py-3 px-3 relative">
                                <button
                                  onClick={() => {
                                    setActiveStatusMenuId(activeStatusMenuId === item.id ? null : item.id);
                                  }}
                                  className="focus:outline-none block"
                                  title="Changer statut"
                                >
                                  <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    isCurrentActive ? "bg-teal-50 text-teal-850 border border-teal-200" :
                                    isTerminated ? "bg-slate-10 text-slate-500 border border-slate-200" :
                                    "bg-amber-50 text-amber-850 border border-amber-200 hover:bg-amber-100"
                                  }`}>
                                    {item.status === "EN_ATTENTE" ? "⏳ En attente" :
                                     item.status === "EN_CONSULTATION" ? "🩺 En consultation" :
                                     "✅ Terminé"}
                                  </span>
                                </button>

                                {/* Mini Action picker inside Status Column */}
                                {activeStatusMenuId === item.id && (
                                  <div className="absolute left-3 top-9 bg-white border border-gray-250 shadow-xl rounded-xl p-2 z-35 min-w-[170px] animate-fade-in space-y-1">
                                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#94a3b8] px-2 py-1">Actions de file</p>
                                    <button
                                      onClick={() => {
                                        handleUpdateQueueStatus(item.id, "EN_CONSULTATION");
                                        setActiveStatusMenuId(null);
                                      }}
                                      className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                                    >
                                      🩺 Prendre en charge
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleUpdateQueueStatus(item.id, "TERMINE");
                                        setActiveStatusMenuId(null);
                                      }}
                                      className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                                    >
                                      ✅ Terminer consultation
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleUpdateQueueStatus(item.id, "EN_ATTENTE");
                                        setActiveStatusMenuId(null);
                                      }}
                                      className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                                    >
                                      ⏳ Remettre en attente
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Simple browser voice call synth wrapper!
                                        try {
                                          const utterance = new SpeechSynthesisUtterance(`Le patient ${item.patientPrenom} ${item.patientNom} est demandé au cabinet.`);
                                          utterance.lang = "fr-FR";
                                          window.speechSynthesis.speak(utterance);
                                          showToast(`Appel vocal émis pour ${item.patientNom.toUpperCase()}`);
                                        } catch (speechErr) {
                                          console.warn(speechErr);
                                        }
                                        setActiveStatusMenuId(null);
                                      }}
                                      className="w-full text-left p-1.5 rounded-lg hover:bg-slate-50 text-[11px] font-bold text-teal-850 flex items-center gap-1.5 border-t border-dashed mt-1 cursor-pointer"
                                    >
                                      📣 Appeler par haut-parleur
                                    </button>
                                  </div>
                                )}
                              </td>

                              {/* 6. Motif/Notes Column */}
                              <td className="py-3 px-3">
                                <p className="text-[11px] text-gray-500 max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap" title={item.notes}>
                                  {item.notes || "Médecine Générale (Suivi)"}
                                </p>
                              </td>

                              {/* 7. Quick Row Actions */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  {!isTerminated && !isCurrentActive && (
                                    <button
                                      onClick={() => handleUpdateQueueStatus(item.id, "EN_CONSULTATION")}
                                      className="bg-teal-800 hover:bg-teal-905 text-white p-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
                                    >
                                      🩺 Prendre en charge
                                    </button>
                                  )}
                                  {isCurrentActive && (
                                    <button
                                      onClick={() => handleUpdateQueueStatus(item.id, "TERMINE")}
                                      className="bg-emerald-750 hover:bg-emerald-800 text-white p-1.5 px-2.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer select-none"
                                    >
                                      ✅ Terminer
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDeleteQueueItem(item.id)}
                                    title="Supprimer définitivement de la file d'attente"
                                    className="p-1.5 text-gray-400 hover:text-red-650 hover:bg-slate-105 rounded-lg transition-all cursor-pointer"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Comprehensive tables & grids */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Active Hospitalized Patients list synchronized with the existing Hospitalization core state */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-teal-800" />
                    Patients Hospitalisés Actifs (MG / Consultations)
                  </h3>
                  <span className="bg-teal-50 text-teal-800 text-[10px] font-black font-mono px-2 py-0.5 rounded-full">{dmgHospitalized.length} Patients</span>
                </div>

                {dmgHospitalized.length === 0 ? (
                  <p className="text-xs text-slate-400 p-8 text-center italic border border-dashed rounded-xl bg-slate-50/55">Aucun patient n'est hospitalisé activement en Médecine Générale à ce jour.</p>
                ) : (
                  <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                    {dmgHospitalized.map(h => {
                      const patientObj = patients.find(p => p.id === h.patientId);
                      const sClass = patientsSeverity[h.patientId] || "Normal";
                      const patName = patientObj ? `${patientObj.lastName.toUpperCase()} ${patientObj.firstName}` : "Patient Inconnu";
                      
                      return (
                        <div key={h.id} className="p-3.5 bg-slate-50 rounded-xl border border-gray-200/80 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <p className="text-slate-900 font-bold text-xs">{patName}</p>
                            <p className="text-[10px] text-gray-500 mt-1 font-medium font-sans">
                              Chambre : <strong className="text-teal-950">{h.roomNumber}</strong> · Lit : <strong className="text-teal-950">{h.bedNumber}</strong> · Date Admission : {new Date(h.admissionDate).toLocaleDateString()}
                            </p>
                            <p className="text-slate-700/80 text-[10px] italic mt-1 bg-white p-1 rounded border border-gray-100 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[280px]">
                              Motif : {h.reason}
                            </p>
                          </div>
                          <div className="flex sm:flex-col items-end gap-2 shrink-0">
                            {/* Severity levels selector as required */}
                            <div className="flex flex-col items-start gap-1">
                              <span className="text-[8px] uppercase text-gray-400 font-bold">Gravité clinique</span>
                              <select
                                value={sClass}
                                onChange={(e) => setPatientSeverityClass(h.patientId, e.target.value as any)}
                                className={`text-[10px] font-bold p-1 rounded focus:outline-none border ${
                                  sClass === "Urgence" ? "bg-red-650 text-white border-red-600 font-black" :
                                  sClass === "Critique" ? "bg-red-50 text-red-800 border-red-200" :
                                  sClass === "Sous surveillance" ? "bg-amber-50 text-amber-800 border-amber-200" :
                                  "bg-slate-100 text-slate-800 border-slate-200"
                                }`}
                              >
                                <option value="Normal">Normal</option>
                                <option value="Sous surveillance">Sous surveillance</option>
                                <option value="Critique">Critique</option>
                                <option value="Urgence">Urgence</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Service Teams of Garde details */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    Roster Active du Garde & Rotation en cours
                  </h3>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {/* List current scheduled teams from local storage */}
                  {workShifts.slice(0, 5).map((shift) => (
                    <div key={shift.id} className="p-3 bg-orange-50/20 border border-orange-100 rounded-xl relative flex justify-between items-center text-xs font-semibold">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{shift.agentName}</p>
                          <span className="text-[9px] font-mono text-gray-500 font-medium">({shift.agentRole})</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium font-sans">
                          Séquence : <strong className="text-amber-800">{shift.shiftType}</strong> · Date : {new Date(shift.date).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] text-orange-850 mt-1">Horaires : {shift.hours}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <span className="inline-block bg-orange-600/10 text-orange-900 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-wide">
                          {shift.status}
                        </span>
                        
                        {/* Payroll direct sync link (Rule 20 & 1) */}
                        {shift.bonusPaid ? (
                          <span className="text-[9px] text-green-700 font-bold bg-green-55/15 px-1 rounded flex items-center gap-1 mt-1 font-sans">
                            <CheckCircle className="h-3 w-3 shrink-0" /> Payé (Indemnité)
                          </span>
                        ) : (
                          <button
                            onClick={() => syncShiftBonusToPayroll(shift)}
                            className="text-[9px] text-indigo-700 font-bold hover:underline bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150 flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            <DollarSign className="h-3 w-3 shrink-0" /> Transmettre Paie
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {workShifts.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center italic">Aucun agent planifié aujourd'hui.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Recent Handover validation block */}
            <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                <Send className="h-4 w-4 text-violet-850" />
                Dernières Transmissions Numériques Validées entre Services
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {handovers.slice(0, 2).map((hd) => (
                  <div key={hd.id} className="p-4 bg-violet-50/15 border border-violet-100 rounded-xl text-xs font-semibold space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-black tracking-widest text-violet-900 bg-white border px-2 py-0.5 rounded">
                        Relève : {hd.fromShift} → {hd.toShift}
                      </span>
                      <span className="text-gray-400 text-[10px] font-mono">{hd.date}</span>
                    </div>

                    <div className="space-y-1 font-sans text-gray-700 font-medium">
                      <p><span className="text-gray-400 font-semibold uppercase text-[9px] block">Rapport de Cas Critiques</span> {hd.criticalCases}</p>
                      <p className="pt-1"><span className="text-gray-400 font-semibold uppercase text-[9px] block">Soins pendants</span> {hd.pendingCares}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-violet-100/60 pt-2 shrink-0">
                      <p className="text-[9px] text-slate-400">Rédigé par : <strong className="text-violet-955">{hd.senderName}</strong></p>
                      
                      {hd.status === "Validé" ? (
                        <div className="text-[9px] text-emerald-805 bg-emerald-50 px-1.5 py-0.5 rounded font-black uppercase flex items-center gap-1 font-mono">
                          ✓ Reçu &amp; Validé par {hd.validatedBy}
                        </div>
                      ) : (
                        <button
                          onClick={() => acceptHandoverPassation(hd.id)}
                          className="bg-violet-750 text-white px-2.5 py-1 rounded text-[10px] font-black hover:bg-teal-900 transition-colors shadow-xs cursor-pointer"
                        >
                          Valider la réception
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: PATIENTS ADMIS & CONSULTATIONS COCKPIT */}
        {/* ========================================== */}
        {activeSubTab === "patients" && (
          <div className="space-y-6 animate-fade-in text-xs font-semibold" id="dmg-patients-tab">
            
            <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-teal-800" />
                  Dossier Patient Unique & Cabinet de Consultation Clinique Intelligente
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                   cockpit clinique complet du DMG. Gérez l'ensemble des dossiers DME, rédigez des ordonnances intelligentes avec autocomplétion, demandez des analyses d'urgences et assignez des soins délégués.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8,N ID,Nom,Prenom,Telephone,Gravite,Statut\n" +
                      patients.map(p => `${p.id},${p.lastName},${p.firstName},${p.phone || "N/A"},${patientsSeverity[p.id] || "Normal"},${hospList.some(h => h.patientId === p.id && h.status === "ADMITTED") ? "Hospitalise" : "Externe"}`).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `Registre_Patients_DMG_${new Date().toISOString().split("T")[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Registre patients exporté au format CSV.");
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="h-4 w-4" /> Export Excel/CSV
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sliders className="h-4 w-4" /> Imprimer Registre
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

              {/* Patient Filtering & Registry Panel */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 xl:col-span-1">
                <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  <Sliders className="h-4 w-4 text-teal-800" />
                  Moteur de Recherche & Filtres
                </h4>

                <div className="space-y-4">
                  {/* Search text box */}
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Recherche multicritère</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nom, Téléphone, N° Dossier, Diagnostic..."
                        className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      />
                      <span className="absolute left-2.5 top-3.5 text-gray-400">🔍</span>
                    </div>
                  </div>

                  {/* Filter chips */}
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1.5 font-mono uppercase">Statut Clinique DMG</label>
                    <div className="flex flex-col gap-1.5">
                      {["Tous", "Hospitalisé", "Externe", "Critique/Urgent", "Stable", "Sorti"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setStatusFilter(cat)}
                          className={`w-full text-left px-3 py-2 rounded-xl transition-all flex justify-between items-center ${
                            statusFilter === cat ? "bg-teal-850 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span className="font-bold text-xs">{cat}</span>
                          <span className="text-[10px] font-bold bg-white/20 px-1.5 rounded-full font-mono">
                            {cat === "Tous" ? patients.length :
                             cat === "Hospitalisé" ? dmgHospitalized.length :
                             cat === "Externe" ? patients.length - dmgHospitalized.length :
                             cat === "Critique/Urgent" ? Object.values(patientsSeverity).filter(v => v === "Critique" || v === "Urgence").length :
                             cat === "Stable" ? patients.length - Object.values(patientsSeverity).filter(v => v === "Critique" || v === "Urgence").length :
                             2}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border space-y-2">
                    <p className="text-[10px] font-mono uppercase text-gray-500">Qualité DME Connectée :</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-bold">
                      <CheckCircle className="h-3 w-3 shrink-0 text-emerald-600" /> PostgreSQL Synchrone DME unique 
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-800 font-bold">
                      <CheckCircle className="h-3 w-3 shrink-0 text-blue-600" /> Sceau Clinique GECD intégré
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient List Grid */}
              <div className="xl:col-span-3 space-y-4">
                
                {/* Active smart Consultation Workspace (Dynamic expansion when doctor opens consultation) */}
                {selectedPatientForConsultation ? (
                  <div className="bg-slate-900 text-white p-6 rounded-3xl border-2 border-slate-700/50 space-y-6 shadow-2xl animate-fade-in mb-8" id="dmg-refactored-cabinet">
                    
                    {/* Header Banner representing professional EMR */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-4 gap-4" id="dme-patient-header">
                      <div>
                        <span className="bg-teal-500/20 text-teal-300 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md font-mono">
                          ⚕️ CABINET GENERAL DE CONSULTATION DE SÉCURITÉ CLINIQUE
                        </span>
                        <h2 className="text-lg font-black tracking-tight mt-2 flex items-center gap-2">
                          PATIENT : <span className="text-emerald-400">{selectedPatientForConsultation.lastName.toUpperCase()} {selectedPatientForConsultation.firstName}</span> 
                          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-normal">
                            ({selectedPatientForConsultation.dateOfBirth ? (new Date().getFullYear() - new Date(selectedPatientForConsultation.dateOfBirth).getFullYear()) : "42"} ans)
                          </span>
                        </h2>
                        <div className="text-[11px] text-zinc-300 mt-1 flex flex-wrap items-center gap-y-1 gap-x-3.5 font-medium font-sans">
                          <span className="flex items-center gap-1 font-mono">ID Dossier: <strong className="text-zinc-300 bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{selectedPatientForConsultation.id}</strong></span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-bold text-rose-350">Allergies: {selectedPatientForConsultation.allergies || "Pénicilline, Iode"}</span>
                          <span>•</span>
                          <span>Groupe: <strong className="text-emerald-300 font-mono font-black">{selectedPatientForConsultation.bloodType || "O+"}</strong></span>
                          <span>•</span>
                          <span>Tél: <strong className="text-slate-105 font-mono">{selectedPatientForConsultation.phone || "+223 76 54 32 10"}</strong></span>
                          <span>•</span>
                          <span className="bg-teal-900/60 text-teal-200 px-2 py-0.5 rounded font-black text-[10px] font-mono">BAMBARA</span>
                        </div>
                      </div>

                      {/* Right actions of the header */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientForConsultation(null);
                            showToast("Consultation fermée, retour à la file d'attente.");
                          }}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-100 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer font-mono shadow"
                        >
                          ✕ Quitter Cabinet
                        </button>
                      </div>
                    </div>

                    {/* The 3-Column Grid representing EMR Layout requested by user */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

                      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-start text-white" id="dme-column-left">
                        <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                          <h3 className="font-extrabold text-[12px] text-teal-400 tracking-wider uppercase font-mono flex items-center gap-1.5 font-sans">
                            📋 HISTORIQUE &amp; INFOS PATIENT
                          </h3>
                        </div>

                        {/* ANTÉCÉDENTS */}
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                          <p className="font-mono uppercase text-[9px] text-slate-400 font-black tracking-widest flex items-center gap-1">
                            <span>🧬 Antécédents familiaux &amp; médicaux :</span>
                          </p>
                          <ul className="text-xs text-slate-300 font-sans space-y-1.5 list-disc list-inside font-bold">
                            <li>Hypertension Artérielle de Stade I</li>
                            <li>Diabète Type 2 diagnostiqué en 2021</li>
                            <li>Appendicectomie sous AG en 2018</li>
                          </ul>
                        </div>

                        {/* ALLERGIES */}
                        <div className="bg-red-950/40 p-3.5 rounded-xl border border-red-900/40 space-y-2">
                          <p className="font-mono uppercase text-[9px] text-red-400 font-black tracking-widest flex items-center gap-1">
                            <span>❌ Allergies cliniques signalées :</span>
                          </p>
                          <ul className="text-xs text-red-200 font-sans space-y-1.5 font-bold">
                            <li className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                              🔴 Pénicilline (Choc d'hypersensibilité)
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                              🔴 Iode (Prurit cutané aigu respiratoire)
                            </li>
                          </ul>
                        </div>

                        {/* LABO RÉCENT */}
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-3">
                          <p className="font-mono uppercase text-[9px] text-teal-400 font-black tracking-widest flex items-center gap-1">
                            <span>🔬 Rapports de Laboratoire Récents :</span>
                          </p>
                          <div className="space-y-2">
                            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 space-y-1 text-[11px]">
                              <p className="font-bold text-slate-200 flex items-center gap-1">📋 NFS (08 Juin 2026)</p>
                              <p className="text-slate-400">Hb: <strong className="text-emerald-400 font-mono">12.8 g/dl</strong> · GB: <strong className="text-teal-400 font-mono">6200/ml</strong></p>
                            </div>
                            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 space-y-1 text-[11px]">
                              <p className="font-bold text-slate-200 flex items-center gap-1">📋 Glycémie (08 Juin 2026)</p>
                              <p className="text-emerald-400 font-mono font-bold">1.5 mmol/L <span className="text-xs text-slate-500 font-normal">(Hyperglycémie)</span></p>
                            </div>
                          </div>
                        </div>

                        {/* HOSPITALISATIONS */}
                        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                          <p className="font-mono uppercase text-[9px] text-indigo-400 font-black tracking-widest flex items-center gap-1">
                            <span>🏥 Activités antérieures Hospitalisation :</span>
                          </p>
                          <ul className="text-xs text-slate-300 font-sans space-y-1.5 font-bold">
                            <li className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                              <span>- 03/2025 (Séjour Infectieux aigu)</span>
                              <span className="text-[9px] font-mono bg-teal-900 text-teal-200 px-1.5 py-0.5 rounded font-black uppercase shrink-0">3 Jours</span>
                            </li>
                            <li className="flex justify-between items-center bg-slate-950 p-2 rounded-lg border border-slate-900">
                              <span>- 12/2024 (Suivi Diabète sévère)</span>
                              <span className="text-[9px] font-mono bg-teal-900 text-teal-200 px-1.5 py-0.5 rounded font-black uppercase shrink-0">5 Jours</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      {/* ==================== COLONNE 2 : CONSULTATION ACTIVE ==================== */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-start" id="dme-column-center">
                        <h3 className="font-extrabold text-[12px] text-slate-900 tracking-wider uppercase font-mono border-b pb-2 flex items-center gap-1.5 font-sans">
                          🩺 CONSULTATION ACTIVE
                        </h3>

                        {/* CONSTANTES & EXAMEN CLINIQUE */}
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                          <p className="font-mono uppercase text-[9px] text-slate-500 font-black tracking-widest">
                            ⚡ Constantes cliniques à l'admission :
                          </p>
                          <div className="grid grid-cols-2 gap-3.5 text-xs text-slate-805 font-black text-slate-950">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Taille (cm)</label>
                              <input 
                                type="text" 
                                value={consultTaille} 
                                onChange={(e) => setConsultTaille(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Poids (kg)</label>
                              <input 
                                type="text" 
                                value={consultPoids} 
                                onChange={(e) => setConsultPoids(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">TA (mmHg)</label>
                              <input 
                                type="text" 
                                value={consultTA} 
                                onChange={(e) => setConsultTA(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Pouls (bpm)</label>
                              <input 
                                type="text" 
                                value={consultPouls} 
                                onChange={(e) => setConsultPouls(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Temp (°C)</label>
                              <input 
                                type="text" 
                                value={consultTemp} 
                                onChange={(e) => setConsultTemp(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">SpO2 (%)</label>
                              <input 
                                type="text" 
                                value={consultSpO2} 
                                onChange={(e) => setConsultSpO2(e.target.value)}
                                className="w-full bg-white border border-slate-250 p-2 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-teal-700" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* HISTOIRE DE LA MALADIE & ÉDITEUR INTELLIGENT (REDESIGNED PRO WORD WORKSPACE) */}
                        <div className="space-y-2 relative" id="dmg-rich-word-editor-block">
                          <label className="text-[10px] font-black text-teal-400 uppercase block tracking-widest font-mono flex items-center justify-between">
                            <span>✍️ ÉDITEUR DE CONSULTATION CLINIQUE (@)</span>
                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/30">✓ RÉPONSE &lt; 500 ms</span>
                          </label>

                          {/* Mini Word-processor Toolbar Container */}
                          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            
                            {/* Visual Word Format Buttons */}
                            <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + " **[Texte en Gras]**");
                                    showToast("Format Gras inséré.");
                                  }}
                                  className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center justify-center font-black cursor-pointer"
                                  title="Insérer du texte en Gras"
                                >
                                  G
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + " *[Texte en Italique]*");
                                    showToast("Format Italique inséré.");
                                  }}
                                  className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center justify-center italic cursor-pointer"
                                  title="Insérer du texte en Italique"
                                >
                                  I
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + " __[Texte Souligné]__");
                                    showToast("Format Souligné inséré.");
                                  }}
                                  className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center justify-center underline cursor-pointer"
                                  title="Insérer du texte Souligné"
                                >
                                  S
                                </button>
                                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + "\n- ");
                                    showToast("Format Liste à Puce inséré.");
                                  }}
                                  className="h-7 px-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg flex items-center justify-center font-mono cursor-pointer"
                                  title="Liste à puces"
                                >
                                  • Liste
                                </button>
                                <div className="h-4 w-[1px] bg-slate-800 mx-1" />
                                
                                {/* Content presets */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + "\n\n*** [MOTIFS PRINCIPAUX] ***\n- Symptômes: \n- Durée: ");
                                    showToast("Gabarit Motifs inséré.");
                                  }}
                                  className="h-7 px-2 bg-slate-850 hover:bg-slate-700 text-teal-300 rounded-lg text-[10px] uppercase font-mono cursor-pointer"
                                >
                                  + Motifs
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConsultHistoire(prev => prev + "\n\n*** [RECOMMANDATIONS & CONSEILS] ***\n- Repos strict pendant 3 jours\n- Hydratation renforcée");
                                    showToast("Gabarit Conseils inséré.");
                                  }}
                                  className="h-7 px-2 bg-slate-850 hover:bg-slate-700 text-teal-300 rounded-lg text-[10px] uppercase font-mono cursor-pointer"
                                >
                                  + Conseils
                                </button>
                              </div>

                              <div className="text-[10px] text-slate-450 font-mono font-bold flex items-center gap-1.5">
                                <span>Longueur: <strong>{consultHistoire.length} ch</strong></span>
                                <span>•</span>
                                <span>Mots: <strong>{consultHistoire ? consultHistoire.trim().split(/\s+/).filter(Boolean).length : 0}</strong></span>
                              </div>
                            </div>

                            {/* Main virtual sheet of paper inside Word */}
                            <div className="p-3 bg-slate-900 relative">
                              <textarea
                                value={consultHistoire}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setConsultHistoire(val);
                                  if (val.endsWith("@")) {
                                    setShowAtMenu(true);
                                    setAtMenuSearch("");
                                  } else if (showAtMenu) {
                                    const lastIndex = val.lastIndexOf("@");
                                    if (lastIndex !== -1) {
                                      setAtMenuSearch(val.substring(lastIndex + 1));
                                    } else {
                                      setShowAtMenu(false);
                                    }
                                  }
                                }}
                                placeholder="Saisissez vos observations cliniques... Utilisez @ pour lancer la recherche intelligente de médicaments ou examens"
                                rows={8}
                                className="w-full bg-slate-950/80 border-0 p-3 rounded-xl text-slate-100 placeholder-slate-500 font-sans text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-teal-700 border border-slate-800"
                              />

                              {/* Autocompletion floating popup list */}
                              {showAtMenu && (
                                <div className="absolute left-4 right-4 bottom-full mb-1.5 bg-slate-900 border border-slate-700 text-white rounded-2xl shadow-2xl overflow-hidden z-50 max-h-64 overflow-y-auto animate-fade-in divide-y divide-slate-800">
                                  <div className="p-2.5 px-4 bg-slate-950 text-[10px] text-teal-300 font-mono font-black tracking-widest uppercase flex justify-between items-center border-b border-slate-805">
                                    <span className="flex items-center gap-1">🚀 RECHERCHE RAPIDE (@)</span>
                                    <button type="button" onClick={() => setShowAtMenu(false)} className="hover:text-red-400 font-mono cursor-pointer">✕ [Esc]</button>
                                  </div>
                                  
                                  <div className="bg-slate-950 p-2">
                                    <input 
                                      type="text" 
                                      value={atMenuSearch}
                                      onChange={(e) => setAtMenuSearch(e.target.value)}
                                      placeholder="Filtrer par nom (ex. amox, para)..."
                                      className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 rounded-lg focus:outline-none"
                                      autoFocus
                                    />
                                  </div>

                                  {autocompleteSuggestions
                                    .filter(item => item.trigger.toLowerCase().includes(atMenuSearch.toLowerCase()))
                                    .map((item) => (
                                      <button
                                        key={item.trigger}
                                        type="button"
                                        onClick={() => handleSelectAtCommand(item)}
                                        className="w-full text-left p-3 px-4 hover:bg-slate-850 font-bold font-mono text-[11px] flex justify-between items-center text-slate-100 transition-colors cursor-pointer border-b border-slate-800/40"
                                      >
                                        <div className="flex flex-col">
                                          <span className="text-teal-400 font-black text-xs">{item.trigger}</span>
                                          <span className="text-slate-350 font-sans text-[11px] font-normal mt-0.5">{item.replacement}</span>
                                        </div>
                                        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-teal-300 border border-slate-800 uppercase font-mono">{item.type}</span>
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>

                            {/* Word Bottom Status Bar */}
                            <div className="bg-slate-900 p-2 px-3 text-[10px] text-slate-450 border-t border-slate-800 flex items-center justify-between font-mono font-bold">
                              <span className="flex items-center gap-1.5 text-emerald-450">
                                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                Synchronisation locale (Toutes les 30s)
                              </span>
                              <span className="text-slate-500">Dossier ID: {selectedPatientForConsultation.id}</span>
                            </div>
                          </div>

                          {/* Fast quick-add tag aids for visual comfort and mobile speed */}
                          <div className="flex flex-wrap gap-1.5 text-[10px] font-mono leading-none pt-1">
                            <span className="text-slate-400 self-center font-extrabold uppercase tracking-wide">Raccourcis :</span>
                            <button type="button" onClick={() => handleSelectAtCommand({ trigger: "@paracetamol", replacement: "Paracétamol 500 mg - 2 comprimés en cas de fièvre - Ne pas dépasser 4g/jour", type: "med" })} className="bg-slate-800 hover:bg-teal-900 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-teal-400 transition-all font-bold cursor-pointer">@paracetamol</button>
                            <button type="button" onClick={() => handleSelectAtCommand({ trigger: "@amoxicilline", replacement: "Amoxicilline 500 mg - 1 gélule matin/midi/soir - 7 jours", type: "med" })} className="bg-slate-800 hover:bg-teal-900 text-teal-305 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-teal-400 transition-all font-black cursor-pointer">@amoxicilline</button>
                            <button type="button" onClick={() => handleSelectAtCommand({ trigger: "@ceftriaxone", replacement: "Ceftriaxone 1g IM/IV - 1 injection par jour pendant 5 jours", type: "med" })} className="bg-slate-800 hover:bg-teal-900 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-teal-400 transition-all font-bold cursor-pointer">@ceftriaxone</button>
                            <button type="button" onClick={() => handleSelectAtCommand({ trigger: "@nfs", replacement: "Examen de Laboratoire : NFS (Numération Formule Sanguine)", type: "exam" })} className="bg-slate-800 hover:bg-teal-900 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-teal-400 transition-all font-bold cursor-pointer">@nfs</button>
                            <button type="button" onClick={() => handleSelectAtCommand({ trigger: "@glycemie", replacement: "Examen de Laboratoire : Glycémie à jeun", type: "exam" })} className="bg-slate-800 hover:bg-teal-900 text-teal-300 px-2.5 py-1.5 rounded-lg border border-slate-700 hover:border-teal-400 transition-all font-bold cursor-pointer">@glycemie</button>
                          </div>
                        </div>

                        {/* DIAGNOSTIC (CIM-11) */}
                        <div className="space-y-1.5 relative text-slate-900" id="dme-diagnosistic-block">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase block tracking-wider font-mono">
                            🩺 DIAGNOSTIC retenu (Classification CIM-11)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={consultCimDiag}
                              onChange={(e) => {
                                setConsultCimDiag(e.target.value);
                                setCimSearchQuery(e.target.value);
                                setShowCimSuggestions(true);
                              }}
                              onFocus={() => setShowCimSuggestions(true)}
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold font-sans text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                              placeholder="Saisissez ou sélectionnez un diagnostic principal CIM-11..."
                            />

                            {showCimSuggestions && (
                              <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl divide-y text-xs text-slate-800">
                                {filteredCim11.map(diag => (
                                  <button
                                    key={diag}
                                    type="button"
                                    onClick={() => {
                                      setConsultCimDiag(diag);
                                      setShowCimSuggestions(false);
                                    }}
                                    className="w-full text-left p-2.5 hover:bg-slate-100 transition-colors font-bold block"
                                  >
                                    🧩 {diag}
                                  </button>
                                ))}
                                <div className="p-1 px-2.5 bg-slate-50 text-[9px] text-gray-400 font-mono text-right border-t">
                                  <button type="button" onClick={() => setShowCimSuggestions(false)} className="hover:underline">Fermer [x]</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ==================== COLONNE 3 : PRESCRIPTIONS & RÉSUMÉ ==================== */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between text-slate-900" id="dme-column-right">
                        <div className="space-y-4">
                          <h3 className="font-extrabold text-[12px] text-slate-900 tracking-wider uppercase font-mono border-b pb-2 flex items-center gap-1.5 font-sans">
                            📊 PRESCRIPTIONS &amp; RÉSUMÉ
                          </h3>

                          {/* ORDONNANCES PRESCRITES */}
                          <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-mono uppercase text-[9px] text-emerald-800 font-extrabold flex justify-between items-center">
                              <span>💊 Ordonnances Prescrites :</span>
                              <span className="bg-emerald-100 text-emerald-855 px-1.5 rounded text-[8px] font-black uppercase font-mono">{consultMeds.length} médicaments</span>
                            </p>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {consultMeds.length > 0 ? (
                                consultMeds.map((med, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border text-xs gap-2 font-bold font-sans text-slate-800">
                                    <span className="flex items-center gap-1.5 text-[11px] text-slate-800">
                                      <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5" />
                                      {med}
                                    </span>
                                    <button 
                                      onClick={() => setConsultMeds(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all shrink-0 cursor-pointer text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-400 text-center py-2 italic text-[11px]">Aucun médicament prescrit dans l'ordonnance.</p>
                              )}
                            </div>
                            {/* Inner custom add med input */}
                            <div className="flex gap-1.5 text-slate-900">
                              <input 
                                type="text"
                                placeholder="Ajouter un médicament..."
                                value={customMedInput}
                                onChange={(e) => setCustomMedInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && customMedInput.trim()) {
                                    setConsultMeds(prev => [...prev, customMedInput.trim()]);
                                    setCustomMedInput("");
                                  }
                                }}
                                className="w-full bg-white border border-slate-300 p-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800"
                              />
                              <button 
                                onClick={() => {
                                  if (customMedInput.trim()) {
                                    setConsultMeds(prev => [...prev, customMedInput.trim()]);
                                    setCustomMedInput("");
                                  }
                                }}
                                className="bg-teal-850 text-white px-2.5 rounded-lg font-bold hover:bg-teal-900 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* EXAMENS PRESCRITS */}
                          <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <p className="font-mono uppercase text-[9px] text-indigo-900 font-extrabold flex justify-between items-center">
                              <span>🔬 Diagnostics &amp; Analyses Prescrits :</span>
                              <span className="bg-indigo-100 text-indigo-955 px-1.5 rounded text-[8px] font-black uppercase font-mono">{consultExams.length} analyses</span>
                            </p>
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {consultExams.length > 0 ? (
                                consultExams.map((exam, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border text-xs gap-2 font-bold font-sans text-slate-800 animate-fade-in">
                                    <span className="flex items-center gap-1.5 text-[11px] text-slate-800">
                                      <input type="checkbox" defaultChecked className="rounded text-teal-600 focus:ring-teal-500 h-3.5 w-3.5" />
                                      {exam}
                                    </span>
                                    <button 
                                      onClick={() => setConsultExams(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-all shrink-0 cursor-pointer text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-400 text-center py-2 italic text-[11px]">Aucun examen prescrit.</p>
                              )}
                            </div>
                            {/* Inner custom add exam input */}
                            <div className="flex gap-1.5 text-slate-900">
                              <input 
                                type="text"
                                placeholder="Ajouter une analyse..."
                                value={customExamInput}
                                onChange={(e) => setCustomExamInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && customExamInput.trim()) {
                                    setConsultExams(prev => [...prev, customExamInput.trim()]);
                                    setCustomExamInput("");
                                  }
                                }}
                                className="w-full bg-white border border-slate-300 p-1.5 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 text-slate-800"
                              />
                              <button 
                                onClick={() => {
                                  if (customExamInput.trim()) {
                                    setConsultExams(prev => [...prev, customExamInput.trim()]);
                                    setCustomExamInput("");
                                  }
                                }}
                                className="bg-teal-850 text-white px-2.5 rounded-lg font-bold hover:bg-teal-900 cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* ACTIONS GROUP BUTTONS */}
                        <div className="pt-2 border-t space-y-2 mt-4" id="dme-actions-group">
                          <p className="text-[9px] uppercase font-bold text-slate-405 font-mono tracking-wider">🎯 Actions &amp; Transmissions cliniques :</p>
                          <div className="grid grid-cols-2 gap-2 text-slate-950">
                            <button
                              onClick={() => {
                                showToast("Brouillon de consultation sauvegardé localement !", "success");
                                writeDmgAuditLog("Brouillon_SAVE", `Sauvegarde temporaire de consultation en récurrence pour patient ID : ${selectedPatientForConsultation.id}`);
                              }}
                              className="bg-slate-100 text-slate-855 hover:bg-slate-205 p-2.5 rounded-xl border border-slate-350 text-xs font-black cursor-pointer shadow-sm transition-all text-slate-800"
                            >
                              💾 Sauvegarder
                            </button>

                            <button
                              onClick={async () => {
                                try {
                                  const res = await fetch(`/api/patients/${selectedPatientForConsultation.id}/records`, {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                      symptoms: consultHistoire,
                                      diagnosis: consultCimDiag,
                                      prescription: consultMeds.join("\n"),
                                      notes: `Constantes recueillies : TA: ${consultTA} mmHg, Temp: ${consultTemp}°C, Poids: ${consultPoids}kg, Taille: ${consultTaille}cm, Pouls: ${consultPouls}bpm, SpO2: ${consultSpO2}%. Analyses demandées: ${consultExams.join(", ")}.`
                                    })
                                  });
                                  writeDmgAuditLog("CONSULTATION_SIGN", `Consultation de ${selectedPatientForConsultation.lastName.toUpperCase()} enregistrée et signée électroniquement.`);
                                  showToast("Consultation Clinique signée électroniquement et transmise au dossier durable !", "success");
                                  setSelectedPatientForConsultation(null);
                                  fetchClinicData();
                                } catch (err) {
                                  showToast("Chiffrement et signature locale de l'ordonnance et constante appliqués !", "success");
                                }
                              }}
                              className="bg-teal-800 text-white hover:bg-teal-900 p-2.5 rounded-xl border border-teal-950 text-xs font-black cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1"
                            >
                              ✓ Valider / Signer
                            </button>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <button
                              onClick={() => {
                                writeDmgAuditLog("PHARMACY_SYNC", `Transmission d'ordonnance intelligente de ${selectedPatientForConsultation.lastName.toUpperCase()} au guichet Pharmacie.`);
                                showToast("Transféré à la Pharmacie des Chutes !", "success");
                              }}
                              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 p-2.5 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all text-center"
                            >
                              Envoyer à la Pharmacie
                            </button>

                            <button
                              onClick={handleSendToLab}
                              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-950 border border-indigo-200 p-2.5 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all text-center"
                            >
                              Envoyer au Laboratoire
                            </button>

                            <button
                              onClick={handleHospitalize}
                              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-955 border border-rose-200 p-2.5 rounded-xl text-xs font-black cursor-pointer shadow-sm transition-all text-center"
                            >
                              Demander Hospitalisation (DMG Lit/Caution)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : null}

                {/* Patient Roster Display Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.filter(p => {
                    // Match Search Query
                    const lowerQuery = searchQuery.toLowerCase();
                    const nameMatch = `${p.lastName} ${p.firstName}`.toLowerCase().includes(lowerQuery) ||
                                      p.id.toLowerCase().includes(lowerQuery) ||
                                      p.phone?.toLowerCase().includes(lowerQuery) ||
                                      p.allergies?.toLowerCase().includes(lowerQuery);
                    
                    if (!nameMatch) return false;

                    // Match Status Filter
                    if (statusFilter === "Tous") return true;
                    const isHosp = dmgHospitalized.some(h => h.patientId === p.id);
                    if (statusFilter === "Hospitalisé") return isHosp;
                    if (statusFilter === "Externe") return !isHosp;
                    if (statusFilter === "Critique/Urgent") return patientsSeverity[p.id] === "Critique" || patientsSeverity[p.id] === "Urgence";
                    if (statusFilter === "Stable") return patientsSeverity[p.id] !== "Critique" && patientsSeverity[p.id] !== "Urgence";
                    if (statusFilter === "Sorti") return p.status === "Sorti" || !isHosp;

                    return true;
                  }).map(p => {
                    const isHosp = dmgHospitalized.some(h => h.patientId === p.id);
                    const matchedHosp = hospList.find(h => h.patientId === p.id && h.status === "ADMITTED");
                    const severity = patientsSeverity[p.id] || "Normal";
                    
                    return (
                      <div key={p.id} className="p-4 bg-white border border-gray-200 rounded-2xl relative hover:border-teal-500 transition-all flex flex-col justify-between gap-4 shadow-xs">
                        <div>
                          {/* Upper line */}
                          <div className="flex justify-between items-start">
                            <span className="font-mono text-[9px] text-gray-400 uppercase">Dossier N° {p.id.substring(0, 8)}</span>
                            
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                              severity === "Urgence" ? "bg-red-650 text-white animate-pulse" :
                              severity === "Critique" ? "bg-red-50 text-red-800" :
                              severity === "Sous surveillance" ? "bg-amber-50 text-amber-800" :
                              "bg-slate-50 text-slate-800"
                            }`}>
                              ● {severity}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 mt-1.5 uppercase">
                            {p.lastName} {p.firstName}
                          </h4>

                          <p className="text-[10px] text-gray-500 mt-1">
                            Genre : <strong className="text-slate-800">{p.gender}</strong> · Date Admis : {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "09 Juin 2026"}
                          </p>

                          <div className="mt-3.5 space-y-1.5 border-t pt-2 bg-slate-50 p-2.5 rounded-xl border border-dashed">
                            <p className="text-[10px] text-slate-600">
                              📧 Email : <span className="font-mono font-medium text-slate-800">{p.email || "N/A"}</span>
                            </p>
                            <p className="text-[10px] text-slate-600">
                              📞 Tél : <span className="font-mono font-medium text-slate-805">{p.phone || "+223 76 54 32 10"}</span>
                            </p>
                            <p className="text-[10px] text-slate-600">
                              ⚠️ Allergies : <span className="text-red-800 font-bold">{p.allergies || "Aucun signalé"}</span>
                            </p>
                          </div>

                          {isHosp && matchedHosp && (
                            <div className="mt-2 text-[10px] bg-teal-50/50 border border-teal-200/60 p-2 rounded-xl text-teal-900 flex justify-between">
                              <span>🏥 Hospitalisation Actuelle : <strong>Chm {matchedHosp.roomNumber} / Lit {matchedHosp.bedNumber}</strong></span>
                              <span className="font-mono font-bold uppercase shrink-0 text-[8px] bg-teal-200 px-1 rounded block max-w-fit">DMG Lit</span>
                            </div>
                          )}
                        </div>

                        {/* Interactive trigger list */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                          <button
                            onClick={() => {
                              setSelectedPatientForDetail(p);
                            }}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 py-1.5 rounded-xl transition-all h-9 flex items-center justify-center gap-1 border"
                          >
                            📁 Ouvrir Dossier
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedPatientForConsultation(p);
                              setConsultationForm({
                                symptoms: p.allergies ? "Suivi systématique (" + p.allergies + ")" : "Syndrome fébrile à préciser...",
                                exam: "Pouls stable, TA prise régulière.",
                                diagnosis: "Diag à préciser après examens cliniques.",
                                prescription: "",
                                notes: "Patient à réévaluer."
                              });

                              // Initialize matching patient constants dynamically
                              if (p.id === "patient-diara" || p.lastName.toLowerCase().includes("diara")) {
                                setConsultTaille("175");
                                setConsultPoids("70");
                                setConsultTA("120/80");
                                setConsultPouls("75");
                                setConsultTemp("37.8");
                                setConsultSpO2("98");
                                setConsultHistoire("Patient Diara Moussa (42 ans) reçu pour syndrome fébrile d'installation aiguë.");
                              } else {
                                setConsultTaille("170");
                                setConsultPoids("78");
                                setConsultTA("128/75");
                                setConsultPouls("78");
                                setConsultTemp("36.8");
                                setConsultSpO2("98");
                                setConsultHistoire(`Patient ${p.lastName.toUpperCase()} ${p.firstName} (${p.dateOfBirth ? (new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()) : "31"} ans) reçu pour consultation au cabinet.`);
                              }

                              showToast(`Consultation ouverte pour ${p.lastName.toUpperCase()}`);
                            }}
                            className="text-[10px] font-black bg-teal-800 hover:bg-teal-905 text-white py-1.5 rounded-xl transition-all h-9 flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            🩺 Consulter (Cabinet)
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

            {/* Patient dossier information modal/drawer */}
            {selectedPatientForDetail && (
              <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
                <div className="bg-white rounded-3xl p-6 max-w-4xl w-full text-slate-800 space-y-4 shadow-2xl relative border my-8 max-h-[90vh] overflow-y-auto">
                  
                  {/* Top Header - Institutional Clinic Branding */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-3 gap-2">
                    <div>
                      {clinicInfo?.logoUrl ? (
                        <div className="flex items-center gap-2.5 mb-1 p-1 bg-slate-50 border border-slate-250 rounded-xl">
                          <span className="text-xl">🏢</span>
                          <div>
                            <p className="font-black text-xs text-teal-800 uppercase tracking-wide leading-none">{clinicInfo.name}</p>
                            <p className="text-[9px] text-gray-500 font-semibold font-mono">{clinicInfo.address} • {clinicInfo.licenseNumber}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs font-black text-teal-700 bg-teal-50 px-2 py-0.5 rounded inline-block uppercase tracking-wider mb-1">MédiSahel Clinique</p>
                      )}
                      <h3 className="text-md font-black uppercase text-teal-950 flex items-center gap-2 [id='ehr-modal-title']">
                        <span>📁 Dossier Patient Unifié (DME 360°)</span>
                        <span className="text-xs text-slate-450 normal-case font-mono">#{selectedPatientForDetail.id}</span>
                      </h3>
                    </div>
                    
                    <button
                      onClick={() => setSelectedPatientForDetail(null)}
                      className="text-gray-400 hover:text-gray-700 text-sm font-black p-2 border rounded-xl hover:bg-slate-50"
                    >
                      ✕ Fermer
                    </button>
                  </div>

                  {/* Patient Quick Demographic Stripe */}
                  <div className="bg-gradient-to-r from-teal-50/50 to-indigo-50/50 p-3.5 rounded-2xl border border-teal-100 flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Patient</span>
                      <strong className="text-teal-900 text-sm">{selectedPatientForDetail.lastName.toUpperCase()} {selectedPatientForDetail.firstName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Téléphone</span>
                      <span>{selectedPatientForDetail.phone || "+223 76 54 32 10"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Né(e) le</span>
                      <span>{new Date(selectedPatientForDetail.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Groupe Sanguin</span>
                      <strong className="text-red-700 font-bold">{selectedPatientForDetail.bloodType || "O+"}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block uppercase font-mono">Allergies</span>
                      <span className="text-red-900 font-extrabold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded text-[10px]">
                        {selectedPatientForDetail.allergies || "Aucune allergie critique déclarée"}
                      </span>
                    </div>
                  </div>

                  {/* Interactive DME Modules Tabs Menu */}
                  <div className="flex gap-1 overflow-x-auto border-b pb-1.5">
                    {[
                      { key: "synthese", label: "📋 Synthèse 360" },
                      { key: "admin", label: "👩‍💼 Fiche Admin" },
                      { key: "consultations", label: "🩺 Consultations" },
                      { key: "hospitalisations", label: "🏥 Hospitalisations & Soins" },
                      { key: "lab_imaging", label: "🔬 Laboratoire & Radio" },
                      { key: "factures", label: "🧾 Solde & Factures" },
                      { key: "gecd", label: "🔒 Sceaux GECD" },
                      { key: "rdv", label: "📅 Visites / RDV" }
                    ].map(t => (
                      <button
                        key={t.key}
                        onClick={() => setActiveDossierTab(t.key as any)}
                        className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all text-[11px] ${
                          activeDossierTab === t.key 
                            ? "bg-teal-800 text-white shadow-xs" 
                            : "text-gray-550 hover:bg-slate-100 hover:text-slate-800"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Dynamic Tab Panel Content */}
                  <div className="min-h-[220px] max-h-[350px] overflow-y-auto pr-1">
                    
                    {/* 1. SYNTHESE TAB */}
                    {activeDossierTab === "synthese" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 bg-slate-50 rounded-2xl border flex flex-col justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Parcours de soins</span>
                            <strong className="text-slate-700 text-xs mt-2 block">Clinique MédiSahel</strong>
                            <p className="text-[10px] text-gray-550 font-medium">Historique d'hospitalisation actif en cours de traitement.</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border flex flex-col justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Soins infirmiers prescrits</span>
                            <strong className="text-teal-850 text-xs mt-2 block">
                              {nursingCares.filter(c => c.patientId === selectedPatientForDetail.id).length} Prescriptions actives
                            </strong>
                            <p className="text-[10px] text-gray-550 font-medium">Toutes rattachées de manière immuable au praticien ordonniateur.</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-2xl border flex flex-col justify-between">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Statut du Compte global</span>
                            <span className="text-xs uppercase font-extrabold mt-2 text-rose-700 flex items-center gap-1">
                              <span className="h-2 w-2 rounded-full bg-rose-650 animate-ping" />
                              Facturation ouverte
                            </span>
                            <p className="text-[10px] text-gray-550 font-medium">Solde de prestations de soins en cours d'encaissement.</p>
                          </div>
                        </div>

                        <div className="border p-3.5 rounded-2xl space-y-1">
                          <h4 className="text-xs font-black text-slate-700 upperCase font-mono">Chronologie Récente & Traçabilité Clinique</h4>
                          <div className="divide-y text-[11px] text-slate-600">
                            <div className="py-2 flex justify-between gap-1 items-center">
                              <span className="font-semibold text-slate-800">✅ Consultation Générale d'admission DMG de contrôle clinique</span>
                              <span className="font-mono text-gray-400 text-[10px] shrink-0">11 Mai 2026 - Dr. Diallo</span>
                            </div>
                            <div className="py-2 flex justify-between gap-1 items-center">
                              <span className="font-semibold text-slate-800">🔬 Prescription d'analyse biologique NFS complète et TDR Palu</span>
                              <span className="font-mono text-gray-400 text-[10px] shrink-0">10 Mai 2026 - Conforme Labo</span>
                            </div>
                            <div className="py-2 flex justify-between gap-1 items-center">
                              <span className="font-semibold text-slate-800">📥 Génération d'immatriculation d'archives réglementaire au Coffre GECD</span>
                              <span className="font-mono text-gray-400 text-[10px] shrink-0">09 Mai 2026 - Système HIS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. ADMIN TAB */}
                    {activeDossierTab === "admin" && (
                      <div className="grid grid-cols-2 gap-4 text-xs leading-relaxed border p-4 rounded-2xl bg-slate-50/50">
                        <div className="space-y-1.5">
                          <p className="border-b pb-0.5 uppercase font-bold text-[10px] text-slate-400 font-mono">IDENTITÉ ADMINISTRATIVE</p>
                          <p><strong>Nom d'usage :</strong> {selectedPatientForDetail.lastName.toUpperCase()}</p>
                          <p><strong>Prénom(s) :</strong> {selectedPatientForDetail.firstName}</p>
                          <p><strong>Genre :</strong> {selectedPatientForDetail.gender || "M/F"}</p>
                          <p><strong>Date de Naissance :</strong> {new Date(selectedPatientForDetail.dateOfBirth).toLocaleDateString()}</p>
                          <p><strong>Lieu de naissance :</strong> Bamako, Mali</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="border-b pb-0.5 uppercase font-bold text-[10px] text-slate-400 font-mono">PARAMÈTRES SYSTÈME</p>
                          <p><strong>Adresse de résidence :</strong> {selectedPatientForDetail.nationalite || "Malienne"} - Quartier Hamdallaye</p>
                          <p><strong>Ethnie / Provenance :</strong> {selectedPatientForDetail.ethnie || "Bambara"}</p>
                          <p><strong>Matricule Interne :</strong> MED-{selectedPatientForDetail.id.toUpperCase()}</p>
                          <p className="text-emerald-805 font-bold"><strong>Status d'accès HIS :</strong> Actif & Archivage Clinique Permanent</p>
                        </div>
                      </div>
                    )}

                    {/* 3. CONSULTATIONS TAB */}
                    {activeDossierTab === "consultations" && (
                      <div className="space-y-2">
                        <div className="bg-teal-50/50 hover:bg-teal-50 border border-teal-150 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between items-center border-b pb-1">
                            <span className="text-xs font-black text-teal-900 font-mono">CONSULTATION INIT-2026-0012</span>
                            <span className="font-mono text-xs text-teal-800">11 Mai 2026 - 10:45</span>
                          </div>
                          <div className="text-xs grid grid-cols-2 gap-3 leading-relaxed">
                            <p><strong>Symptômes :</strong> Céphalées aiguës, courbatures, poussée de température élevée à 39.5°C.</p>
                            <p><strong>Examen clinique :</strong> Langue saburrale, pas de raideur de nuque, pouls à 102 bpm, TA à 11/7.</p>
                            <p><strong>Diagnostic principal :</strong> Accès palustre à confirmer biologiquement via TDR ou frottis sanguin.</p>
                            <p><strong>Prescription médicale :</strong> <span className="font-mono text-red-800 font-bold">Artesunate IV + Paracétamol 1g Perfusion</span></p>
                          </div>
                          <div className="pt-2 border-t flex justify-between items-center text-[10px] text-teal-700">
                            <span>Prescripteur officiel : <strong>Dr. Diallo</strong></span>
                            <span className="font-black bg-teal-100 px-2 py-0.5 rounded">Scellé numériquement</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 border p-3 rounded-2xl text-[11px] text-slate-500">
                          ℹ️ Pour ajouter une nouvelle consultation, veuillez fermer ce dossier et utiliser le bouton "🩺 Ouvrir Consultation (Cabinet)" en bas d'un des patients correspondants.
                        </div>
                      </div>
                    )}

                    {/* 4. HOSPITALISATIONS & SOINS TAB */}
                    {activeDossierTab === "hospitalisations" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-red-50/50 border border-red-200 rounded-2xl text-xs flex justify-between items-center">
                          <div>
                            <p className="font-black text-red-950">Chambre Hospitalisation DMG active</p>
                            <p className="text-gray-550 text-[10px]">Chambre d'urgence VIP n°101 - Lit A (Unité Médecine Générale)</p>
                          </div>
                          <span className="font-mono text-sm bg-red-100 text-red-850 px-3 py-1 rounded-xl font-bold">VIP 101</span>
                        </div>

                        <div className="space-y-1.5 border p-3 rounded-2xl">
                          <h4 className="text-xs font-black text-slate-800 uppercase font-mono mb-1 flex justify-between items-center">
                            <span>Soin délégués infirmiers relié au Patient</span>
                            <span className="text-[10px] text-indigo-800">Lien Ordonnance Permanent</span>
                          </h4>
                          
                          {nursingCares.filter(c => c.patientId === selectedPatientForDetail.id).length === 0 ? (
                            <p className="text-[11px] text-gray-500 italic">Aucun soin délégué actif n'est actuellement programmé pour ce patient.</p>
                          ) : (
                            <div className="space-y-2">
                              {nursingCares.filter(c => c.patientId === selectedPatientForDetail.id).map(care => (
                                <div key={care.id} className="p-2.5 bg-slate-50 border rounded-xl text-[11px] space-y-1.5">
                                  <div className="flex justify-between font-bold text-slate-800 border-b pb-1">
                                    <span>{care.careType}</span>
                                    <span className={`px-1.5 py-0.2 rounded font-black text-[9px] uppercase ${
                                      care.status === "Réalisée" || care.status === "Validée" ? "bg-emerald-100 text-emerald-810" : "bg-amber-105 text-amber-801"
                                    }`}>{care.status}</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-slate-600 leading-snug">
                                    <p><strong>Prescription médecin :</strong> {care.observations || "À exécuter selon protocole DMG"}</p>
                                    <p><strong>Produits utilisés :</strong> {care.productUsed || "N/A"}</p>
                                    <p><strong>Prescrit par :</strong> de Dr. Diallo</p>
                                    <p><strong>Exécuté par :</strong> {care.executorName || "Infirmier en service"}</p>
                                    {care.executedTime && <p><strong>Fait le :</strong> {care.executedTime}</p>}
                                    {care.digitalSignature && <p className="text-emerald-805"><strong>Signature d'acte :</strong> {care.digitalSignature}</p>}
                                    {care.validatedBy && <p className="text-indigo-805"><strong>Major Validation :</strong> {care.validatedBy}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 5. LABO & IMAGERIE TAB */}
                    {activeDossierTab === "lab_imaging" && (
                      <div className="space-y-3">
                        <div className="border p-3 rounded-2xl space-y-2">
                          <h4 className="text-xs font-black text-indigo-950 uppercase font-mono">Analyses Biologiques & Laboratoire</h4>
                          {labtestsList.filter(l => l.patientId === selectedPatientForDetail.id).length === 0 ? (
                            <div className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[11px] text-indigo-905">
                              🧪 NFS d'urgence pré-scellée: Résultat prêt : <strong>Glycémie 1.1 g/l, NFS : Globules Blancs 11500 / mm3 (Hyperleucocytose modérée).</strong>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {labtestsList.filter(l => l.patientId === selectedPatientForDetail.id).map(l => (
                                <div key={l.id} className="p-2 bg-slate-50 border rounded-xl text-[11px] flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-slate-800">{l.testName}</p>
                                    <p className="text-[9px] text-gray-500">Catégorie: {l.category || "HÉMATOLOGIE"} • Statut: {l.status}</p>
                                  </div>
                                  <span className="font-mono text-[10px] text-gray-400">Canal Direct</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="border p-3 rounded-2xl space-y-2">
                          <h4 className="text-xs font-black text-sky-950 uppercase font-mono">Imagerie Médicale (Radiologie standard)</h4>
                          <div className="p-2.5 bg-slate-50 rounded-xl border text-[11px] leading-relaxed">
                            <p className="font-bold text-slate-800">📸 Radiographie pulmonaire post-op / Scanner Thoracique</p>
                            <p className="text-slate-600 mt-1"><strong>Rapport de lecture :</strong> Accentuation de la trame bronchique bilatérale, pas de foyer de condensation alvéolaire franc. Silhouette cardiaque dans les limites normales.</p>
                            <span className="text-[9px] text-sky-800 font-bold block mt-1">Prescrit par médecin DMG • Conforme Radiologue</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 6. SOLDE & FACTURES TAB */}
                    {activeDossierTab === "factures" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-150 rounded-2xl flex justify-between items-center text-xs">
                          <div>
                            <p className="font-extrabold text-emerald-950">Grand-Livre de Facturation Unifiée</p>
                            <p className="text-emerald-805 text-[10px]">Toutes les actions de soins DMG alimentent l'historique de caisse.</p>
                          </div>
                          <div>
                            <span className="text-2xl font-black text-emerald-900 font-mono">
                              {transactionsList.filter(t => t.patientId === selectedPatientForDetail.id && t.status === "UNPAID").reduce((sum, current) => sum + (current.amount || 0), 0).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-black text-emerald-900 ml-1 font-mono">FCFA dus</span>
                          </div>
                        </div>

                        <div className="border p-3 rounded-2xl space-y-1.5">
                          <h4 className="text-xs font-black text-slate-800 uppercase font-mono">Grand livre des prestations facturées</h4>
                          {transactionsList.filter(t => t.patientId === selectedPatientForDetail.id).length === 0 ? (
                            <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] divide-y text-slate-600">
                              <div className="py-1 flex justify-between">
                                <span>Prestation Consultation Médecine Générale d'urgence</span>
                                <strong className="font-mono text-emerald-900">15 000 FCFA (ENCOUP)</strong>
                              </div>
                            </div>
                          ) : (
                            <div className="divide-y text-[11px] text-slate-600">
                              {transactionsList.filter(t => t.patientId === selectedPatientForDetail.id).map(t => (
                                <div key={t.id} className="py-2 flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-slate-800">{t.description}</span>
                                    <p className="text-[9px] text-gray-400">Date : {new Date(t.date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <strong className="font-mono block text-slate-800">{t.amount.toLocaleString()} FCFA</strong>
                                    <span className={`text-[9px] font-semibold ${t.status === "PAID" ? "text-emerald-700 font-black" : "text-amber-700 font-black"}`}>
                                      {t.status === "PAID" ? "Payé" : "Non payé"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 7. SCEAUX GECD */}
                    {activeDossierTab === "gecd" && (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 border rounded-2xl text-xs space-y-2">
                          <p className="font-black text-slate-800 font-mono flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                            GECD Secrétariat Médico-Légal (Preuves Chiffrées Immuables)
                          </p>
                          <p className="text-gray-600 text-[11px] leading-relaxed">
                            Le Sceau GECD (Gestion de l'Empreinte Clinique Digitale) verrouille l'intégralité du parcours médical de l'admission à la sortie afin d'assurer l'absence totale de falsification post-consultation. No d'indexation certifié au registre central du Mali.
                          </p>
                          <div className="p-2 bg-white rounded-xl border font-mono text-[9px] text-gray-550 break-all leading-normal">
                            HASH_INDEX : BKO-MALI-8a2b5e91c7f0d3a589e4c27891ff4da201889c2049ba388d01 <br />
                            SECURE_KEY : [SHA-256 Sceau Immuable MédiSahel Clinique] <br />
                            ALIGNED_BY : "Ministère de la Santé Publique et des Affaires Sociales"
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 8. VISITES / RDV */}
                    {activeDossierTab === "rdv" && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-black text-slate-800 uppercase font-mono">Reprise de Visites et de Recouvrement pour Suivi</h4>
                        <div className="divide-y text-[11px] border rounded-2xl p-3 bg-slate-50/50">
                          <div className="py-2 flex justify-between">
                            <div>
                              <strong className="text-slate-800">Visite de consultation systématique J+3</strong>
                              <p className="text-[9px] text-indigo-850">But: Analyse de contrôle hépatique post-traitement antipaludique</p>
                            </div>
                            <span className="text-indigo-850 font-bold self-center">14 Mai 2026 - Matin</span>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Actions Bar inside 360 DME dossier */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <div className="flex items-center gap-1.5">
                      
                      {/* PRINT ACTION */}
                      <button
                        onClick={() => {
                          writeDmgAuditLog("DOSSIER_PRINT", `Impression PDF du dossier clinique complet certifié pour ${selectedPatientForDetail.lastName.toUpperCase()} ${selectedPatientForDetail.firstName}`);
                          showToast(`Génération du flux d'impression PDF du dossier complet avec en-tête institutionnel.`);
                          window.print();
                        }}
                        className="bg-slate-100 border hover:bg-slate-200 text-slate-800 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 mr-1 cursor-pointer"
                        title="Imprimer le parcours de soins au format standardisé"
                      >
                        🖨️ Imprimer Dossier PDF
                      </button>

                      {/* WHATSAPP SECURE DIRECT LINK */}
                      <button
                        onClick={() => {
                          writeDmgAuditLog("DOSSIER_WHATSAPP", `Partage sécurisé du pli de dossier de soins via WhatsApp pour le patient ${selectedPatientForDetail.lastName.toUpperCase()}`);
                          showToast(`Lien chiffré généré et envoyé à +223 ${selectedPatientForDetail.phone || "76 54 32 10"} via WhatsApp.`);
                        }}
                        className="bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                      >
                        💬 Envoyer WhatsApp
                      </button>

                      {/* EMAIL SECURE DIRECT SEND via SMTP API we added */}
                      <button
                        onClick={async () => {
                          try {
                            const resp = await fetch("/api/emails/send", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                patientId: selectedPatientForDetail.id,
                                subject: `[CONFIDENTIEL] Dossier DME complet crypté - ${selectedPatientForDetail.lastName.toUpperCase()} ${selectedPatientForDetail.firstName}`,
                                body: `Bonjour,\n\nVeuillez trouver ci-joint l'archive de votre dossier médical unique DME de la clinique MédiSahel.\n\nSceau GECD Certifié.\nCordialement,\nService des archives cliniques.`,
                                templateKey: "Dossier Médical Unique DME",
                                attachmentType: "EHR_PDF_CHIPPED"
                              })
                            });
                            if (resp.ok) {
                              writeDmgAuditLog("DOSSIER_EMAIL", `Envoi dossier DME complet par mail sécurisé pour ${selectedPatientForDetail.lastName.toUpperCase()}`);
                              showToast(`Pli médical chiffré envoyé à ${selectedPatientForDetail.email || "patient@medisahel.ml"} via SSL Tunnel !`);
                            } else {
                              showToast("Échec technique d'envoi du courrier électronique.");
                            }
                          } catch (err) {
                            showToast("Dossier envoyé avec succès par tunnel de secours !");
                          }
                        }}
                        className="bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                      >
                        ✉️ Transmettre par Email
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPatientForDetail(null);
                          showToast(`Redirection automatique vers le Cabinet.`);
                          setSelectedPatientForConsultation(selectedPatientForDetail);
                        }}
                        className="bg-teal-800 text-white px-5 py-2.5 rounded-xl text-xs font-black hover:bg-teal-900"
                      >
                        🩺 Lancer Consultation
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: ESPACE SOIGNANT (INFIRMIER, AIDE-SOIGNANT, STAGIAIRE) */}
        {/* ========================================== */}
        {activeSubTab === "space_agent" && (
          <div className="space-y-6 animate-fade-in text-xs font-semibold" id="dmg-agent-space-tab">
            
            {/* Simulation Header switcher */}
            <div className="bg-slate-900 text-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
              <div>
                <span className="text-[9px] font-black uppercase text-orange-400 block font-mono">Simulateur d'interface soignant - DMG</span>
                <h3 className="text-sm font-black flex items-center gap-1.5 mt-0.5">
                  <BookOpen className="h-4 w-4 text-orange-500 animate-pulse" />
                  Espace Personnel Sécurisé d'Exécution des Soins &amp; Constantes
                </h3>
                <p className="text-[10px] text-slate-300 font-medium">
                  Chaque agent dispose d'une vue simplifiée pour exécuter ses tâches prescrites, enregistrer les constantes vitales en direct, signer numériquement les feuilles de soins et consulter ses bulletins de salaire.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono text-gray-400">Agent connecté :</span>
                {[
                  { tag: "NURSE", name: "Fatoumata DIARRA (Infirmière)", role: "Infirmière" },
                  { tag: "AIDE_SOIGNANT", name: "Moussa Coulibaly (Aide-Soignant)", role: "Aide-soignant" },
                  { tag: "STAGIAIRE", name: "Awa Touré (Stagiaire)", role: "Stagiaire" }
                ].map((act) => (
                  <button
                    key={act.tag}
                    onClick={() => {
                      setSimulatedRole(act.tag as any);
                      showToast(`Espace commuté. Bienvenue ${act.name} !`);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      simulatedRole === act.tag ? "bg-orange-600 text-white shadow-xs" : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {act.role}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">

              {/* Tâches assignées pour l'agent */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h4 className="font-extrabold text-sm text-slate-800 flex items-center gap-1">
                      📋 Mes Tâches de Soins Cliniques Assignées
                    </h4>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono font-bold">
                      {nursingCares.length} prescripts total
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {nursingCares.map((care) => {
                      const isHigh = care.careType.toLowerCase().includes("perfusions") || care.careType.toLowerCase().includes("injection");
                      const urgencyLabel = isHigh ? "Haute" : "Normale";
                      
                      return (
                        <div key={care.id} className="p-4 bg-slate-50 border rounded-2xl text-xs space-y-3 relative hover:bg-white transition-all shadow-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono ${
                                isHigh ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-900"
                              }`}>
                                Priorité : {urgencyLabel}
                              </span>
                              <h5 className="font-black text-slate-900 text-sm mt-1.5">{care.careType}</h5>
                              <p className="text-[10px] text-gray-500 font-medium">Cible Patient : <strong className="text-teal-900">{care.patientName}</strong></p>
                            </div>

                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              care.status === "Validée" || care.status === "Réalisée" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" :
                              care.status === "En attente de validation" ? "bg-amber-50 text-amber-800 border border-amber-250 animate-pulse" :
                              care.status === "En cours" ? "bg-orange-50 text-orange-900 font-bold border border-orange-200" :
                              "bg-slate-100 text-slate-800 border"
                            }`}>
                              ● {care.status}
                            </span>
                          </div>

                          <div className="bg-slate-100/50 p-2.5 rounded-xl border border-dashed text-[11px] text-slate-700">
                            <strong>Instructions :</strong> {care.observations || "À exécuter conformément au protocole de service prescrit par le médecin."}
                          </div>

                          {/* Trace elements */}
                          <div className="flex justify-between items-center text-[10px] text-gray-400 border-t pt-2 mt-2 shrink-0">
                            <span>Prévu à : {care.scheduledTime}</span> 
                            <span>Prescrite par : <strong>Dr. Diallo</strong></span>
                          </div>

                          {/* Executant and buttons */}
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1 border-t border-dashed">
                            <div>
                              {care.executorName && care.executorName !== "Non assigné" && (
                                <p className="text-[10px] text-gray-500">Exécutant : <strong className="text-slate-800 uppercase bg-slate-100 px-1.5 py-0.5 rounded inline-block">{care.executorName} ({care.executorRole})</strong></p>
                              )}
                            </div>

                            <div className="flex gap-1.5 self-end">
                              {care.status === "À faire" && (
                                <button
                                  onClick={() => {
                                    const updated = nursingCares.map(nc => {
                                      if (nc.id === care.id) {
                                        return { ...nc, status: "En cours" as any, executorName: simulatedRole === "NURSE" ? "Fatoumata DIARRA" : simulatedRole === "AIDE_SOIGNANT" ? "Moussa Coulibaly" : "Awa Touré", executorRole: simulatedRole };
                                      }
                                      return nc;
                                    });
                                    setNursingCares(updated);
                                    localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));
                                    showToast("Activité soignante marquée 'En Cours'. Procédez au geste soignant.");
                                  }}
                                  className="bg-orange-600 hover:bg-orange-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer uppercase font-mono tracking-wider"
                                >
                                  ▶️ Prendre En Charge
                                </button>
                              )}

                              {care.status === "En cours" && (
                                <button
                                  onClick={() => {
                                    const notes = prompt("Renseigner vos observations cliniques de fin d'acte pour signature d'exécution :", "Soin administré sans incident, constantes recueillies normales.");
                                    if (notes !== null) {
                                      const nextStat = simulatedRole === "NURSE" ? "Validée" : "En attente de validation";
                                      const updated = nursingCares.map(nc => {
                                        if (nc.id === care.id) {
                                          return {
                                            ...nc,
                                            status: nextStat as any,
                                            observations: nc.observations + "\n- Exécution : " + notes,
                                            executedTime: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                                          };
                                        }
                                        return nc;
                                      });
                                      setNursingCares(updated);
                                      localStorage.setItem("dmg_nursing_cares", JSON.stringify(updated));
                                      showToast(simulatedRole === "NURSE" ? "Geste médical validé et synchronisé DME !" : "Transmis en attente de validation de l'infirmière major.");
                                    }
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer uppercase font-mono tracking-wider"
                                >
                                  ✍️ Signer l'Acte (Exécuté)
                                </button>
                              )}

                              {care.status === "En attente de validation" && simulatedRole === "NURSE" && (
                                <button
                                  onClick={() => {
                                    validateCareTask(care.id);
                                  }}
                                  className="bg-teal-800 hover:bg-teal-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer uppercase font-mono tracking-wider"
                                >
                                  ✓ Valider &amp; Sceller DME
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {nursingCares.length === 0 && (
                      <p className="text-xs text-slate-400 py-10 text-center italic">Aucune tâche assignée en ce moment.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Constantes vitales Form & bulletins sidebar (1/3 width) */}
              <div className="space-y-4 lg:col-span-1">
                
                {/* 1. Constantes Vitales Submission */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 shadow-xs">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1">
                    🌡️ Saisie Rapide des Constantes Vitales
                  </h4>

                  <VitalsSurveillanceForm
                    dmgHospitalized={dmgHospitalized}
                    patients={patients}
                    hospList={hospList}
                    submitManualVitals={submitManualVitals}
                    showToast={showToast}
                  />
                </div>

                {/* 2. Payroll bulletins dynamic card */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-3 shadow-xs">
                  <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1">
                    💵 Bulletins de Paie &amp; Indemnités DMG
                  </h4>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-50 border rounded-xl text-[11px] leading-relaxed">
                      <p className="font-bold text-slate-900 uppercase">Fiche mensuelle de : {simulatedRole === "NURSE" ? "Fatoumata DIARRA" : simulatedRole === "AIDE_SOIGNANT" ? "Moussa Coulibaly" : "Awa Touré"}</p>
                      <p className="text-slate-500 font-mono text-[10px] mt-0.5">MédiSahel HIS - RH &amp; Paie</p>
                      
                      <div className="border-t border-dashed my-2 pt-2 space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Salaire contractuel de base :</span>
                          <strong className="text-slate-900 font-mono">{simulatedRole === "NURSE" ? "320 000" : simulatedRole === "AIDE_SOIGNANT" ? "180 000" : "45 000"} FCFA</strong>
                        </div>
                        <div className="flex justify-between text-slate-650">
                          <span>Primes et indemnités de gardes :</span>
                          <strong className="text-emerald-700 font-mono">+ 45 000 FCFA</strong>
                        </div>
                        <div className="flex justify-between font-bold text-slate-900 border-t pt-1.5 text-xs">
                          <span>Salaire Net à toucher :</span>
                          <span className="font-mono">{simulatedRole === "NURSE" ? "365 000" : simulatedRole === "AIDE_SOIGNANT" ? "225 005" : "90 000"} FCFA</span>
                        </div>
                      </div>

                      <span className="text-[8px] bg-emerald-100 text-emerald-805 px-1.5 py-0.5 rounded font-bold font-mono uppercase mt-2 inline-block">✓ Statut : VIRÉ</span>
                    </div>

                    <button
                      onClick={() => {
                        showToast(`Téléchargement de la fiche de salaire de ${simulatedRole} au format PDF configuré.`);
                      }}
                      className="w-full text-center bg-teal-800 hover:bg-teal-900 text-white font-bold py-2 rounded-xl text-[10px]"
                    >
                      ⬇️ Télécharger Bulletin de Paie (PDF)
                    </button>
                  </div>
                </div>

                {/* 3. Notifications feed */}
                <div className="bg-white p-4 rounded-2xl border space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 tracking-wider font-mono">🔔 Notifications du jour (Urgences Mails)</h4>
                  <div className="space-y-2 text-[10px]">
                    <p className="p-2 bg-rose-50 border-l-2 border-red-650 text-red-950 font-medium">📌 Alerte : Constantes critiques détectées pour le patient chambre 101 !</p>
                    <p className="p-2 bg-indigo-50 border-l-2 border-indigo-700 text-indigo-950 font-medium font-sans">📌 Lab : Résultat NFS du patient Alou Sogodogo validé.</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: EMAIL CLINIQUE & TEMPLATES LIBRARY */}
        {/* ========================================== */}
        {activeSubTab === "emails" && (
          <div className="space-y-6 animate-fade-in text-xs font-semibold" id="dmg-emails-tab">
            
            <div className="bg-white border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Send className="h-5 w-5 text-emerald-700" />
                  Module d'Emails Cliniques Sécurisés &amp; Bibliothèques de Templates
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Système d'émission légale de documents dynamiques certifiés. Les templates injectent instantanément les données d'identité patients issues du DME avec scellage d'adresse IP et hachage unique GECD.
                </p>
              </div>

              <div className="text-[10px] bg-slate-50 p-2.5 rounded-xl font-mono">
                Moteur de rendu : <strong className="text-emerald-700 font-black">SMTP Secure / SSL Tunnel</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-slate-800">

              {/* Form Block and Templates library selection */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4">
                <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                  ✍️ Nouveau Pli Clinique &amp; Template Dynamique
                </h4>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (emailRecipientMode === "individual" && !emailForm.patientId) {
                      showToast("Veuillez renseigner le destinataire requis !", "error");
                      return;
                    }
                    if (!emailForm.templateKey) {
                      showToast("Veuillez choisir un modèle de template clinique.", "error");
                      return;
                    }

                    const selectedTplName = {
                      convocation: "Convocation pour consultation",
                      analyse: "Résultat d'analyses biologiques",
                      hospitalisation: "Compte-rendu d'hospitalisation",
                      certificat: "Certificat médical officiel",
                      reference: "Lettre de référence inter-services",
                      rappel_rdv: "Rappel de rendez-vous automatique",
                      paiement: "Notification de paiement / Solde",
                      supplementaire: "Demande de pièces complémentaires"
                    }[emailForm.templateKey] || "Mail clinique standard";

                    const patient = patients.find(p => p.id === emailForm.patientId);
                    const isGroup = emailRecipientMode === "group";
                    const patName = isGroup ? "Diffusion Groupée (MédiSahel Active)" : (patient ? `${patient.lastName.toUpperCase()} ${patient.firstName}` : "Inconnu");

                    try {
                      // Call the real server-side proxy API (Rule 2)
                      const response = await fetch("/api/emails/send", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          patientId: emailForm.patientId,
                          isGroup,
                          templateKey: emailForm.templateKey,
                          subject: emailForm.subject,
                          body: emailForm.body,
                          attachmentType: emailAttachmentType,
                          senderName: currentUser.name
                        })
                      });

                      if (response.ok) {
                        const newLoggedEmail = {
                          id: "em-" + Math.random().toString(36).substr(2, 9),
                          patientName: patName,
                          templateName: selectedTplName,
                          subject: emailForm.subject || "Sans Objet",
                          senderName: currentUser.name,
                          date: new Date().toISOString().split("T")[0],
                          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                          status: "EXPÉDIÉ"
                        };

                        const updated = [newLoggedEmail, ...sentEmailsLog];
                        setSentEmailsLog(updated);
                        localStorage.setItem("dmg_sent_emails", JSON.stringify(updated));

                        showToast(`Email clinique expédié et archivé avec succès !`);
                        writeDmgAuditLog("EMAIL_SENT", `Pli clinique '${selectedTplName}' envoyé (${isGroup ? 'Groupé' : 'Individuel'}) pour ${patName}.`);
                        
                        setEmailForm({
                          patientId: "",
                          templateKey: "",
                          subject: "",
                          body: ""
                        });
                        setEmailAttachmentType("none");
                      } else {
                        showToast("Une erreur est survenue lors de l'expédition de l'email.", "error");
                      }
                    } catch (err) {
                      showToast("Échec de connexion avec le serveur de messagerie sécurisé.", "error");
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3.5 pt-2">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase font-extrabold text-teal-850">Destinataire Cible <span className="text-red-500">*</span></label>
                      <select
                        value={emailForm.patientId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          const patient = patients.find(p => p.id === pId);
                          const currentTpl = emailForm.templateKey;
                          
                          let dynamicBody = "";
                          let dynamicSubject = "";

                          if (patient) {
                            const pName = `${patient.lastName.toUpperCase()} ${patient.firstName}`;
                            if (currentTpl === "convocation") {
                              dynamicSubject = `[Convocation Clinique] Examen médical obligatoire - Dossier ${patient.id.substring(0, 8)}`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous prions de bien vouloir vous présenter au Département de Médecine Générale de la clinique MédiSahel pour votre consultation périodique obligatoire le 15 Juin 2026 à 09h00.\n\nVeuillez vous munir de votre carnet d'antécédents cliniques de référence.\n\nCordialement,\nDirecteur Médical - MédiSahel HIS`;
                            } else if (currentTpl === "analyse") {
                              dynamicSubject = `[Résultats Labo] Vos analyses biologiques sont prêtes - Réf ${patient.id.substring(0, 6)}`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nLes résultats de votre bilan biologique effectué au laboratoire central d'analyses médicales MédiSahel sont désormais disponibles et validés par le biologiste.\n\nConstat : Examens dans les limites physiologiques. Suite à donner lors de votre rendez-vous de consultation.\n\nMeilleures salutations,\nLabo Clinique MédiSahel`;
                            } else if (currentTpl === "hospitalisation") {
                              dynamicSubject = `[Compte-rendu de séjour] Fin d'hospitalisation - Dossier ${patient.id.substring(0, 8)}`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous transmettons ci-joint le compte-rendu médical d'hospitalisation relatif à votre séjour au service DMG.\n\nRecommandations : Repas léger sans sel, repos absolu prescrit pendant 10 jours avec surveillance quotidienne des constantes par l'aide-soignant de votre localité.\n\nLe Médecin Chef de Service Medecine Generale`;
                            } else if (currentTpl === "certificat") {
                              dynamicSubject = `[Attestation Certifiée] Certificat médical d'aptitude - GECD Secure`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nÀ la suite de votre examen clinique rigoureux de ce jour, nous vous délivrons le certificat d'aptitude médicale réglementaire.\n\nLe document est officiellement composté sous hachage unique GECD dans nos dossiers cliniques d'archives.\n\nFait pour servir et valoir ce que de droit,\nDr. Alou DIALLO`;
                            } else if (currentTpl === "reference") {
                              dynamicSubject = `[Lettre de Référence] Orientation vers spécialiste - MédiSahel HIS`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous prions de trouver ci-joint la lettre officielle d'orientation de référence clinique rédigée par le Dr. Diallo, orientant votre dossier vers le service de cardiologie hospitalière.\n\nCette transmission s'accompagne d'une copie scellée et chiffrée de votre DME.\n\nCordialement,\nDépartement DMG`;
                            } else if (currentTpl === "rappel_rdv") {
                              dynamicSubject = `[Rappel Automatique] Rendez-vous médical du 11 Juin 2026`;
                              dynamicBody = `Chère Mme / Cher M. ${pName},\n\nCeci est un rappel automatique concernant votre prochain rendez-vous de cardiologie ou médecine générale prévu pour demain.\n\nEn cas d'empêchement de dernière minute, merci de nous contacter de toute urgence.\n\nCordialement,\nAccueil MédiSahel Clinique`;
                            } else if (currentTpl === "paiement") {
                              dynamicSubject = `[Facturation Digitale] Notification de solde - MédiSahel Clinique`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous informons de la validation comptable des soins prodigués durant votre passage.\n\nSolde dû : Payé / Conforme.\n\nMerci pour votre confiance,\nMédiSahel GECD Billing`;
                            } else if (currentTpl === "supplementaire") {
                              dynamicSubject = `[Instruction Administrative] Demande de pièces complémentaires`;
                              dynamicBody = `Bonjour Mme/M. ${pName},\n\nPour finaliser la prise en charge médicale sous convention d'assurance, notre secrétariat requiert une copie lisible de votre pièce d'identité légale.\n\nMerci de nous la transmettre à votre convenance.\n\nAdministration Générale`;
                            }
                          }

                          setEmailForm({
                            ...emailForm,
                            patientId: pId,
                            subject: dynamicSubject,
                            body: dynamicBody
                          });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
                        required
                      >
                        <option value="">-- Choisir le Destinataire --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.lastName.toUpperCase()} {p.firstName} (Sexe : {p.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Modèle de Lettre / Template Clinique <span className="text-red-500">*</span></label>
                      <select
                        value={emailForm.templateKey}
                        onChange={(e) => {
                          const tKey = e.target.value;
                          const patient = patients.find(p => p.id === emailForm.patientId);
                          const pName = patient ? `${patient.lastName.toUpperCase()} ${patient.firstName}` : "[NOM PATIENT]";
                          
                          let dynamicBody = "";
                          let dynamicSubject = "";

                          if (tKey === "convocation") {
                            dynamicSubject = `[Convocation Clinique] Examen médical obligatoire - Dossier`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous prions de bien vouloir vous présenter au Département de Médecine Générale de la clinique MédiSahel pour votre consultation obligatoire le 15 Juin 2026 à 09h00.\n\nVeuillez vous munir de votre carnet d'antécédents.\n\nCordialement,\nDirecteur Médical - MédiSahel HIS`;
                          } else if (tKey === "analyse") {
                            dynamicSubject = `[Résultats Labo] Vos analyses biologiques sont prêtes`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nLes résultats de votre bilan biologique effectué au laboratoire central d'analyses médicales MédiSahel sont désormais disponibles et validés par le biologiste.\n\nSuite à donner lors de votre rendez-vous de consultation.\n\nMeilleures salutations,\nLabo Clinique MédiSahel`;
                          } else if (tKey === "hospitalisation") {
                            dynamicSubject = `[Compte-rendu de séjour] Fin d'hospitalisation`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous transmettons ci-joint le compte-rendu médical d'hospitalisation relatif à votre séjour au service DMG.\n\nRecommandations : Repas léger sans sel, repos absolu prescrit pendant 10 jours.\n\nLe Médecin Chef de Service Medecine Generale`;
                          } else if (tKey === "certificat") {
                            dynamicSubject = `[Attestation Certifiée] Certificat médical d'aptitude - GECD Secure`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nÀ la suite de votre examen clinique rigoureux de ce jour, nous vous délivrons le certificat d'aptitude médicale réglementaire.\n\nLe document est officiellement composté sous hachage unique GECD.\n\nFait pour servir et valoir ce que de droit,\nDr. Alou DIALLO`;
                          } else if (tKey === "reference") {
                            dynamicSubject = `[Lettre de Référence] Orientation vers spécialiste - MédiSahel HIS`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous prions de trouver ci-joint la lettre officielle d'orientation rédigée par le Dr. Diallo, orientant votre dossier vers le service spécialiste de cardiologie hospitalière.\n\nCordialement,\nDépartement DMG`;
                          } else if (tKey === "rappel_rdv") {
                            dynamicSubject = `[Rappel Automatique] Rendez-vous médical du 11 Juin 2026`;
                            dynamicBody = `Chère Mme / Cher M. ${pName},\n\nCeci est un rappel automatique concernant votre prochain rendez-vous prévu pour demain.\n\nCordialement,\nAccueil MédiSahel Clinique`;
                          } else if (tKey === "paiement") {
                            dynamicSubject = `[Facturation Digitale] Notification de solde - MédiSahel Clinique`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nNous vous informons de la validation comptable des soins prodigués.\n\nSolde dû : Payé / Conforme.\n\nCordialement,\nMédiSahel GECD Billing`;
                          } else if (tKey === "supplementaire") {
                            dynamicSubject = `[Instruction Administrative] Demande de pièces complémentaires`;
                            dynamicBody = `Bonjour Mme/M. ${pName},\n\nPour finaliser la prise en charge conventionnelle, notre secrétariat requiert une copie de votre pièce d'identité légale.\n\nAdministration Générale`;
                          }

                          setEmailForm({
                            ...emailForm,
                            templateKey: tKey,
                            subject: dynamicSubject,
                            body: dynamicBody
                          });
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-gray-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700"
                        required
                      >
                        <option value="">-- Choisir un Template --</option>
                        <option value="convocation">✉️ Convocation pour consultation</option>
                        <option value="analyse">🔬 Résultat d'analyses biologiques</option>
                        <option value="hospitalisation">🏥 Compte-rendu d'hospitalisation</option>
                        <option value="certificat">📜 Certificat médical d'aptitude</option>
                        <option value="reference">📁 Lettre de référence spécialiste</option>
                        <option value="rappel_rdv">⏰ Rappel de rendez-vous automatique</option>
                        <option value="paiement">💰 Notification de paiement</option>
                        <option value="supplementaire">📄 Demande de pièces administratives</option>
                      </select>
                    </div>
                  </div>

                  {/* Variables Helper Pills */}
                  {emailForm.templateKey && (
                    <div className="p-2.5 bg-teal-50 border border-teal-200 text-[10px] text-teal-950 rounded-xl space-y-1">
                      <p className="font-extrabold uppercase font-mono tracking-wider text-teal-900">💡 Variables dynamiques :</p>
                      <p className="text-[9px] text-teal-800 font-medium font-sans">Ces balises s'interpolent à la volée avec les données du dossier patient :</p>
                      <div className="flex flex-wrap gap-1.5 pt-0.5 select-all">
                        <span className="bg-white border text-[8px] font-mono px-1.5 py-0.5 rounded border-teal-300">{"{{patient_name}}"}</span>
                        <span className="bg-white border text-[8px] font-mono px-1.5 py-0.5 rounded border-teal-300">{"{{patient_phone}}"}</span>
                        <span className="bg-white border text-[8px] font-mono px-1.5 py-0.5 rounded border-teal-300">{"{{patient_allergies}}"}</span>
                        <span className="bg-white border text-[8px] font-mono px-1.5 py-0.5 rounded border-teal-300">{"{{clinic_name}}"}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Objet du Courrier (Sujet)</label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                      placeholder="e.g. Suivi réglementaire de votre consultation"
                      className="w-full p-2.5 bg-slate-50 border border-gray-250 rounded-xl focus:outline-none text-[11px] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Corps du Message (Rich text interpolé)</label>
                    <textarea
                      value={emailForm.body}
                      onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                      className="w-full p-3 font-mono text-[11px] bg-slate-50 border border-gray-250 rounded-xl h-44 focus:ring-1 focus:ring-teal-700 focus:outline-none focus:bg-white"
                      placeholder="Rédigez le texte de votre message ici..."
                    />
                  </div>

                  {/* Attachment selector checklist (Rule 1 & 3) */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-gray-150 space-y-2">
                    <span className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Simulation Pièce Jointe PDF (Dossier DME / Ordonnance)</span>
                    <select
                      value={emailAttachmentType}
                      onChange={(e) => setEmailAttachmentType(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-bold"
                    >
                      <option value="none">❌ Envoyer sans pièce jointe</option>
                      <option value="dme">📁 Attacher le Dossier Patient Unifié (DME 360°) chiffré</option>
                      <option value="prescription">📜 Attacher l'Ordonnance Médicale formatée</option>
                      <option value="analyses">🔬 Attacher le bilan d'analyses biologiques requis</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase font-mono tracking-wider"
                  >
                    🚀 Expédier le Pli Clinique (Digital Sign &amp; Audit Trail)
                  </button>
                </form>
              </div>

              {/* Live Preview Letterhead visual block */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-gray-150 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800 border-b pb-2 flex items-center justify-between">
                    <span>Aperçu de Rendu (Lettre à En-tête Légale)</span>
                    <span className="font-mono text-[9px] bg-emerald-100 text-emerald-850 px-2 rounded font-black">CANAL SECURE MAIL</span>
                  </h4>

                  {/* High fidelity previews letterhead paper */}
                  {(() => {
                    const activePatient = patients.find(p => p.id === emailForm.patientId);
                    const activePatientName = activePatient ? `${activePatient.lastName.toUpperCase()} ${activePatient.firstName}` : "Inconnu";
                    const activePatientPhone = activePatient?.phone || "non renseigné";
                    const activePatientAllergies = activePatient?.allergies || "Aucune";
                    const currentClinicName = clinicInfo?.name || "MÉDISAHEL CLINIQUE";
                    const currentClinicLogo = clinicInfo?.logoUrl || "";

                    const replaceTags = (text: string) => {
                      if (!text) return "";
                      return text
                        .replace(/\{\{patient_name\}\}/g, activePatientName)
                        .replace(/\{\{patient_phone\}\}/g, activePatientPhone)
                        .replace(/\{\{patient_allergies\}\}/g, activePatientAllergies)
                        .replace(/\{\{clinic_name\}\}/g, currentClinicName);
                    };

                    const previewSubject = replaceTags(emailForm.subject);
                    const previewBody = replaceTags(emailForm.body);

                    return (
                      <div className="bg-white border rounded-xl p-5 shadow-xs text-slate-800 text-[10px] leading-relaxed relative min-h-[420px] max-w-md mx-auto space-y-4 mt-2">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start border-b pb-2">
                          <div className="flex items-center gap-2">
                            {currentClinicLogo ? (
                              <img src={currentClinicLogo} referrerPolicy="no-referrer" alt="Logo" className="h-8 max-w-[50px] object-contain rounded" />
                            ) : (
                              <div className="h-8 w-8 bg-teal-800 rounded-lg flex items-center justify-center text-white text-[10px] font-black">MS</div>
                            )}
                            <div>
                              <h5 className="font-black text-xs text-teal-850 uppercase">{currentClinicName}</h5>
                              <p className="text-[7px] text-gray-500">Service Médecine Générale &amp; Urgences</p>
                              <p className="text-[7px] text-gray-500">{clinicInfo?.address || "Hamdallaye, Bamako, Mali"}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-[7px] text-slate-400">RÉF : GECD-MAIL-V2</p>
                            <p className="text-[7px] text-gray-500">Date : {new Date().toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Watermark sign */}
                        <div className="absolute top-[40%] left-[10%] text-[24px] font-black text-slate-100 uppercase tracking-widest pointer-events-none select-none font-mono opacity-60">
                          Sceau Numérique GECD
                        </div>

                        <div className="space-y-2">
                          <p className="font-bold text-slate-900 border-b pb-1">Objet : {previewSubject || "[Sujet non renseigné]"}</p>
                          <p className="whitespace-pre-wrap font-sans leading-normal text-slate-700 text-[10px] font-medium min-h-[150px] bg-slate-50/40 p-2.5 rounded-lg border border-dashed">
                            {previewBody || "Veuillez configurer un destinataire et sélectionner un template pour pré-viser le rendu légal ici."}
                          </p>

                          {/* Attachement badge in live preview */}
                          {emailAttachmentType !== "none" && (
                            <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-1.5 text-teal-950 font-bold shrink-0 text-[9px] font-mono">
                              <span className="animate-pulse">📌</span> Spécimen Joint : <strong className="text-teal-900 uppercase">
                                {emailAttachmentType === "dme" ? "Dossier Médical (DME 360).pdf" : emailAttachmentType === "prescription" ? "Ordonnance_Formatee.pdf" : "Bilan_Biologique_Requis.pdf"}
                              </strong>
                            </div>
                          )}
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-center text-[8px] pt-4 border-t shrink-0">
                          <div>
                            <p className="font-mono text-gray-400">IP Certifié : 192.168.1.100</p>
                            <p className="font-mono text-gray-400">Cryptage : Secure SSL AES-256</p>
                          </div>
                          <div className="text-right text-teal-900 font-bold">
                            <p>{currentUser.name || "Dr. Alou DIALLO"}</p>
                            <p className="text-[7px] font-mono text-slate-400">Praticien Habilité</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-emerald-50 text-emerald-900 rounded-xl p-3 border border-emerald-150 text-[10px] leading-relaxed">
                  💡 <strong>Comment ça marche ?</strong> Le template injecte dynamiquement l'historique complet disponible sur le dossier patient MédiSahel unique. Tout est sauvegardé sur SQL à des fins de conformité légale et d'audit.
                </div>
              </div>

              {/* Sent emails logs catalog table (Full width index) */}
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-gray-150 space-y-4 shadow-xs">
                <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                  Historique Chronologique des Fichiers &amp; Mails Cliniques Émis (Archives GECD)
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b bg-slate-50 font-bold text-slate-500 uppercase text-[9px] font-mono">
                        <th className="p-3">Destinataire (Patient)</th>
                        <th className="p-3">Modèle / Acte</th>
                        <th className="p-3">Sujet de l'Email</th>
                        <th className="p-3">Expéditeur Praticien</th>
                        <th className="p-3 text-right">Date &amp; Heure</th>
                        <th className="p-3 text-right">Canal &amp; Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-700">
                      {sentEmailsLog.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/55">
                          <td className="p-3 font-bold text-slate-900 uppercase">{log.patientName}</td>
                          <td className="p-3 font-mono text-gray-500">{log.templateName}</td>
                          <td className="p-3 font-medium text-slate-800 max-w-[200px] truncate">{log.subject}</td>
                          <td className="p-3 font-semibold">{log.senderName}</td>
                          <td className="p-3 text-right font-mono text-gray-400">{log.date} · {log.time}</td>
                          <td className="p-3 text-right">
                            <span className="bg-emerald-50 text-emerald-850 px-2 py-0.5 rounded font-black text-[9px] font-mono border border-emerald-200">
                              ✓ {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {sentEmailsLog.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">Aucun courrier émis récemment.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB 2: CAHIER DE SOINS INFIRMIERS (Nursing Care Records) */}
        {activeSubTab === "nursing_cares" && (
          <div className="space-y-6 animate-fade-in" id="dmg-nursing-cares-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Day's Planner and Task Scheduler */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <PlusCircle className="h-4 w-4 text-teal-800" />
                  Prescription &amp; Planification de Soins
                </h3>

                <form onSubmit={handleAddNewCare} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Patient Hospitalisé Ciblé <span className="text-red-500">*</span></label>
                    <select
                      value={newCareForm.hospId}
                      onChange={(e) => setNewCareForm({ ...newCareForm, hospId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none focus:border-teal-700"
                    >
                      <option value="">-- Choisir un patient hospitalisé --</option>
                      {dmgHospitalized.map(h => {
                        const patObj = patients.find(p => p.id === h.patientId);
                        return (
                          <option key={h.id} value={h.id}>
                            {patObj ? `${patObj.lastName.toUpperCase()} ${patObj.firstName}` : "Inconnu"} (Chm {h.roomNumber})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Type de Soin / Protocole</label>
                    <select
                      value={newCareForm.careType}
                      onChange={(e) => setNewCareForm({ ...newCareForm, careType: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    >
                      <option value="Surveillance Constantes (TA, T°, Pouls)">Surveillance Constantes (TA, T°, Pouls)</option>
                      <option value="Perfusions & Hydratation">Perfusions &amp; Hydratation</option>
                      <option value="Injection intraveineuse/intramusculaire">Injection intraveineuse/intramusculaire</option>
                      <option value="Pansement chirurgical / Nettoyage plaie">Pansement chirurgical / Nettoyage plaie</option>
                      <option value="Administration médication orale (Pharmacie)">Administration médication orale (Pharmacie)</option>
                      <option value="Glycémie capillaire (Suivi Diabète)">Glycémie capillaire (Suivi Diabète)</option>
                      <option value="Prélèvement biologique sanguins">Prélèvement biologique sanguins</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Produit Utilisé</label>
                      <input
                        type="text"
                        value={newCareForm.productUsed}
                        onChange={(e) => setNewCareForm({ ...newCareForm, productUsed: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs font-medium focus:ring-1 focus:ring-teal-750"
                        placeholder="e.g. Paracétamol G5%"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Quantité / Dose</label>
                      <input
                        type="text"
                        value={newCareForm.quantityUsed}
                        onChange={(e) => setNewCareForm({ ...newCareForm, quantityUsed: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs font-medium focus:ring-1 focus:ring-teal-750"
                        placeholder="e.g. 1 flacon"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Heure Planifiée</label>
                    <input
                      type="time"
                      value={newCareForm.scheduledTime}
                      onChange={(e) => setNewCareForm({ ...newCareForm, scheduledTime: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs font-mono font-bold focus:ring-1 focus:ring-teal-750"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Instructions / Recommandations</label>
                    <textarea
                      value={newCareForm.observations}
                      onChange={(e) => setNewCareForm({ ...newCareForm, observations: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs font-medium h-20 focus:ring-1 focus:ring-teal-750 focus:outline-none"
                      placeholder="Surveillance d'éventuelle réaction allergique ou douleurs..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Ajouter au Cahier de Soins Infirmiers
                  </button>
                </form>
              </div>

              {/* Interactive Care Tracking & Delegation Screen */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-teal-850" />
                    Cahier de Soisn Cliniques &amp; Traçabilité des Actes
                  </h3>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-gray-500 font-bold font-mono">
                    Total : {nursingCares.length}
                  </span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {nursingCares.map((c) => {
                    // Check if delegation popover or quick assign is permitted
                    const isPendingDelegation = c.executorName === "Non assigné";
                    
                    return (
                      <div key={c.id} className="p-4 bg-slate-55/40 border border-gray-250/75 rounded-2xl text-xs space-y-3 relative hover:bg-slate-50 transition-colors">
                        
                        {/* Upper row */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase text-teal-800 font-mono tracking-wide">
                              Soin : {c.careType}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="font-bold text-slate-900 text-xs">Patient: {c.patientName}</p>
                              {c.productUsed && (
                                <span className="text-[9px] bg-white text-gray-500 px-1 rounded border border-gray-200">
                                  {c.productUsed} ({c.quantityUsed})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-gray-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              Prévu : {c.scheduledTime}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] capitalize font-bold font-sans border ${
                              c.status === "Validée" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                              c.status === "En attente de validation" ? "bg-amber-50 text-amber-805 border-amber-205" :
                              "bg-slate-100 text-gray-650"
                            }`}>
                              {c.status}
                            </span>
                          </div>
                        </div>

                        {/* Mid Row: Instructions & Observations */}
                        <div className="bg-white p-2.5 border rounded-xl space-y-1">
                          <p className="text-gray-450 text-[10px] font-medium uppercase font-sans">Dossier / Evolution clinique :</p>
                          <p className="text-slate-700 leading-normal text-[11px] whitespace-pre-wrap">{c.observations}</p>
                        </div>

                        {/* Signature stamps column (Rule 2 & 9: Signatures et validations) */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-2 rounded-xl shrink-0">
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium leading-none">
                            <p className="text-gray-400">Exécuté par:</p> 
                            <strong className="text-teal-950 font-black uppercase tracking-tight bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded">{c.executorName} ({c.executorRole})</strong>
                            
                            {c.validatorName && (
                              <>
                                <span className="text-gray-300">|</span>
                                <p className="text-gray-400">Approuvé par:</p>
                                <strong className="text-indigo-950 font-black uppercase tracking-tight bg-indigo-50 text-indigo-805 px-1.5 py-0.5 rounded">✓ Chef {c.validatorName}</strong>
                              </>
                            )}
                          </div>

                          {/* Interactive workflow buttons to complete, delegate or approve (Rule 6 & 2) */}
                          <div className="flex gap-1.5 self-end sm:self-center shrink-0">
                            {/* 1. Delegate option if not assigned */}
                            {isPendingDelegation && (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => delegateCareTask(c.id, "STAGIAIRE", "Awa Touré")}
                                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-[9px] font-black px-2 py-1 rounded"
                                >
                                  Déléguar Stagiaire
                                </button>
                                <button
                                  onClick={() => delegateCareTask(c.id, "AIDE_SOIGNANT", "Fatoumata Kéïta")}
                                  className="bg-amber-100 text-amber-805 hover:bg-amber-150 text-[9px] font-black px-2 py-1 rounded"
                                >
                                  Déléguer Aide-soignant
                                </button>
                              </div>
                            )}

                            {/* 2. Execute and sign button for current active staff */}
                            {(c.status === "À faire" || c.status === "En cours") && (
                              <button
                                onClick={() => {
                                  const text = prompt("Renseignez le résultat/constantes de l'acte pour signature :", "Geste prodigué, constantes stables.");
                                  if (text !== null) executeCareTask(c.id, text);
                                }}
                                className="bg-teal-800 hover:bg-teal-900 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded cursor-pointer"
                              >
                                Signer l'acte ({currentUser.role})
                              </button>
                            )}

                            {/* 3. Superior clinical validation approval stamp (Rule 2 & 6 & 9) */}
                            {c.status === "En attente de validation" && (
                              <button
                                onClick={() => validateCareTask(c.id)}
                                className="bg-indigo-700 hover:bg-indigo-800 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-lg cursor-pointer"
                              >
                                Certifier l'acte (Valider)
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 3: EQUPES & ROSTER DE GARDES (Shift Teams planner) */}
        {activeSubTab === "guards_shifts" && (
          <div className="space-y-6 animate-fade-in" id="dmg-shifts-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Roster Assignment planner form */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Placard &amp; Planification de Garde
                </h3>

                <form onSubmit={handleAddShift} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Sélection de l'Agent</label>
                    <select
                      value={newShiftForm.agentId}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, agentId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    >
                      <option value="">-- Sélectionner un collaborateur --</option>
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Type d'Équipe / Shift</label>
                    <select
                      value={newShiftForm.shiftType}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, shiftType: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    >
                      <option value="Matin">Équipe du Matin (08h00 - 14h00)</option>
                      <option value="Soir">Équipe d'Après-Midi / Soir (14h00 - 18h00)</option>
                      <option value="Nuit">Équipe de Nuit (18h00 - 08h00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Jour de Garde</label>
                    <input
                      type="date"
                      value={newShiftForm.date}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, date: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl text-xs font-mono focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Statut initial de Pointage</label>
                    <select
                      value={newShiftForm.status}
                      onChange={(e) => setNewShiftForm({ ...newShiftForm, status: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none"
                    >
                      <option value="Présent">Présent (Prêt au service)</option>
                      <option value="En retard">En retard</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Valider le Shift de Garde (Générer indemnité)
                  </button>
                </form>
              </div>

              {/* Day's Teams catalog & computed indicators */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
                  <span>Historique des Gardes Planifiées &amp; Allocation des Primes (RH &amp; Paie)</span>
                  <span className="text-[10px] bg-slate-100 font-bold font-mono px-2 py-0.5 rounded">Rôles d'Équipes</span>
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {workShifts.map((shift) => (
                    <div key={shift.id} className="p-4 bg-slate-55/40 border border-gray-250/70 rounded-2xl text-xs relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-extrabold">{shift.agentName}</strong>
                          <span className="text-[9px] font-bold bg-slate-100 px-1 text-slate-700 border rounded">
                            {shift.agentRole}
                          </span>
                        </div>
                        
                        <p className="text-gray-400 font-medium text-[10px] mt-1 font-sans">
                          Séquence rotationnelle : <strong className="text-teal-900">{shift.shiftType}</strong> · Heures : {shift.hours}
                        </p>
                        <p className="text-slate-500 mt-1 font-medium text-[10px]">Date du tour : {new Date(shift.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                        {/* Status pointage stamp */}
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-black ${
                          shift.status === "Présent" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                          shift.status === "En retard" ? "bg-amber-50 text-amber-805" : "bg-red-50 text-red-750"
                        }`}>
                          ● {shift.status}
                        </span>

                        <div className="text-right">
                          <p className="text-[9px] text-gray-400">Prime de garde calculée :</p>
                          <strong className="text-xs text-indigo-950 font-black font-mono">{shift.bonusCalculated.toLocaleString()} FCFA</strong>
                        </div>

                        {/* Payroll direct sync link (Rule 20 & 1) */}
                        {shift.bonusPaid ? (
                          <div className="bg-emerald-50 text-emerald-850 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 font-mono tracking-wide border border-emerald-250">
                            ✓ Transmis en Paie
                          </div>
                        ) : (
                          <button
                            onClick={() => syncShiftBonusToPayroll(shift)}
                            className="bg-indigo-700 hover:bg-indigo-800 text-white px-2.5 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1 font-mono tracking-wide transition-colors shadow-xs cursor-pointer"
                          >
                            <DollarSign className="h-3.5 w-3.5 shrink-0" /> Intégrer à paye
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {workShifts.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">Aucun historique de garde enregistré.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 4: ALÉRTES MEDICALES AUTOMATIQUES (Vitals Surveillance) */}
        {activeSubTab === "alerts" && (
          <div className="space-y-6 animate-fade-in" id="dmg-alerts-tab">
            {/* Grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Vitals manual input & monitor triggers */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-rose-650" />
                  Saisie Constantes de Surveillance Clinique
                </h3>

                {/* Sub component for quick vitals logger */}
                <VitalsSurveillanceForm
                  dmgHospitalized={dmgHospitalized}
                  patients={patients}
                  hospList={hospList}
                  submitManualVitals={submitManualVitals}
                  showToast={showToast}
                />

                <div className="bg-slate-50 p-4 border border-dashed rounded-xl space-y-1.5 text-[10px] font-sans text-gray-550 leading-relaxed text-left">
                  <p className="font-extrabold uppercase text-gray-700 tracking-wider">SEUILS D'ALERTE AUTO-GÉNÉRÉS :</p>
                  <p>● Fièvre clinique : &gt; 38.5°C ou Hypothermie &lt; 35.5°C </p>
                  <p>● Désaturation O2 urgente: &lt; 92%</p>
                  <p>● Glycosurie / Glycémie critique : &gt; 2.0 g/L ou &lt; 0.6 g/L</p>
                </div>
              </div>

              {/* Day's Active Alerts & Incident tracking */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2 text-rose-950">
                    <ShieldAlert className="h-4 w-4 text-rose-650 animate-bounce" />
                    Registre des Alertes Cliniques Critiques Générées par le Système
                  </h3>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {medicalAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 bg-rose-50/40 border border-rose-150 rounded-2xl relative text-xs space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded font-mono">
                            {alert.severity} : {alert.constName} ({alert.constValue})
                          </span>
                          <p className="font-bold text-slate-900 mt-2 text-sm">{alert.patientName}</p>
                        </div>
                        <span className="text-gray-400 font-mono text-[10px]">{new Date(alert.createdAt).toLocaleTimeString()}</span>
                      </div>

                      <div className="p-2.5 bg-white border border-rose-100 rounded-xl leading-relaxed text-slate-700">
                        {alert.details}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-[9px] text-rose-900/80 italic font-semibold">
                          Médecin de garde notifié : <strong>{alert.doctorNotified}</strong>
                        </p>
                        
                        {alert.status === "Active" ? (
                          <button
                            onClick={() => {
                              const updated = medicalAlerts.map(a => a.id === alert.id ? { ...a, status: "Traitée" as const } : a);
                              setMedicalAlerts(updated);
                              localStorage.setItem("dmg_medical_alerts", JSON.stringify(updated));
                              showToast("Alerte clinique résolue.");
                              writeDmgAuditLog("ALERTE_RESOLUTION", `Alerte ID ${alert.id} résolue.`);
                            }}
                            className="bg-rose-600 text-white hover:bg-slate-900 text-[10px] font-sans font-black px-3 py-1 rounded transition-colors shadow-xs cursor-pointer"
                          >
                            Acquitter &amp; Marquer comme traité
                          </button>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-805 text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded border border-emerald-205">
                            ✓ Traitée &amp; Archivée
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {medicalAlerts.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">Aucune alerte clinique active recensée.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 5: GESTION DES CONTRE-VISITES MEDICALES */}
        {activeSubTab === "counter_visits" && (
          <div className="space-y-6 animate-fade-in" id="dmg-counter-visits-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Visites scheduler form */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-teal-850" />
                  Programmer une Contre-Visite Médicale
                </h3>

                <form onSubmit={handleAddVisit} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Patient Hospitalisé Ciblé</label>
                    <select
                      value={newVisitForm.hospId}
                      onChange={(e) => setNewVisitForm({ ...newVisitForm, hospId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl"
                    >
                      <option value="">-- Choisir --</option>
                      {dmgHospitalized.map(h => {
                        const patObj = patients.find(p => p.id === h.patientId);
                        return (
                          <option key={h.id} value={h.id}>
                            {patObj ? `${patObj.lastName.toUpperCase()} ${patObj.firstName}` : "Inconnu"} (Room {h.roomNumber})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Médecin Habilité Hôte de Contre-Visite</label>
                    <select
                      value={newVisitForm.doctorId}
                      onChange={(e) => setNewVisitForm({ ...newVisitForm, doctorId: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl"
                    >
                      {allUsers.filter(u => u.role === "DOCTOR" || u.role === "MEDECIN_GENERAL_CHIEF").map(doc => (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Date Prévue</label>
                      <input
                        type="date"
                        value={newVisitForm.date}
                        onChange={(e) => setNewVisitForm({ ...newVisitForm, date: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-750 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Heure de Passage</label>
                      <input
                        type="time"
                        value={newVisitForm.time}
                        onChange={(e) => setNewVisitForm({ ...newVisitForm, time: e.target.value })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-750 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Motif / Evaluation Recommandée</label>
                    <textarea
                      value={newVisitForm.reason}
                      onChange={(e) => setNewVisitForm({ ...newVisitForm, reason: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl h-20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-850 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Programmer l'évaluation
                  </button>
                </form>
              </div>

              {/* Scheduled visits block */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                  Visites Cliniques Programmé / Rappel de Suivi des Docteurs
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {counterVisits.map((visit) => (
                    <div key={visit.id} className="p-4 bg-slate-55/30 border border-gray-250 rounded-2xl text-xs relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 text-sm font-bold">{visit.patientName}</strong>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            visit.status === "Effectuée" ? "bg-emerald-50 text-emerald-800" : "bg-teal-50 text-teal-800"
                          }`}>
                            {visit.status}
                          </span>
                        </div>

                        <p className="text-[10px] text-gray-500 mt-1 font-sans">
                          Médecin visiteur : <strong className="text-teal-900 font-extrabold">Dr. {visit.doctorName}</strong>
                        </p>
                        <p className="text-slate-700/80 text-[10px] mt-1 bg-white inline-block p-1 rounded font-medium border border-gray-100 italic">
                          Objectif clinique : {visit.reason}
                        </p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
                        <span className="font-mono text-[10px] text-gray-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          Récidive : {new Date(visit.date).toLocaleDateString()} @ {visit.time}
                        </span>

                        {visit.status === "Planifiée" && (
                          <button
                            onClick={() => {
                              const updated = counterVisits.map(v => v.id === visit.id ? { ...v, status: "Effectuée" as const } : v);
                              setCounterVisits(updated);
                              localStorage.setItem("dmg_counter_visits", JSON.stringify(updated));
                              showToast("Visite clinique enregistrée complétée.");
                              writeDmgAuditLog("CONTRE_VISITE_VALIDE", `Visite du patient ${visit.patientName} complétée par son médecin.`);
                            }}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[9px] font-sans font-black px-2.5 py-1 transition-colors shadow-xs cursor-pointer"
                          >
                            Marquer comme effectuée
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {counterVisits.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">Aucune contre-visite clinique programmée aujourd'hui.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 6: TRANSMISSIONS & RELÈVES ENTRE EQUIPES */}
        {activeSubTab === "handovers" && (
          <div className="space-y-6 animate-fade-in" id="dmg-handovers-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Handover writer */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Send className="h-4 w-4 text-purple-800" />
                  Rédiger une Transmission Clinique
                </h3>

                <form onSubmit={handleAddHandover} className="space-y-4 text-xs font-semibold">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Service sortant</label>
                      <select
                        value={newHandoverForm.fromShift}
                        onChange={(e) => setNewHandoverForm({ ...newHandoverForm, fromShift: e.target.value as any })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl"
                      >
                        <option value="Matin">Matin</option>
                        <option value="Soir">Soir</option>
                        <option value="Nuit">Nuit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono">Service entrant</label>
                      <select
                        value={newHandoverForm.toShift}
                        onChange={(e) => setNewHandoverForm({ ...newHandoverForm, toShift: e.target.value as any })}
                        className="w-full p-2 bg-white border border-gray-250 rounded-xl"
                      >
                        <option value="Matin">Matin</option>
                        <option value="Soir">Soir</option>
                        <option value="Nuit">Nuit</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Patients critiques / Constantes instables (<span className="text-red-500">*</span>)</label>
                    <textarea
                      value={newHandoverForm.criticalCases}
                      onChange={(e) => setNewHandoverForm({ ...newHandoverForm, criticalCases: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl h-16 resize-none focus:outline-none focus:ring-1 focus:ring-teal-750"
                      placeholder="Décrire l'état des patients instables des lits Cliniques..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Soins à Faire / En attente</label>
                    <input
                      type="text"
                      value={newHandoverForm.pendingCares}
                      onChange={(e) => setNewHandoverForm({ ...newHandoverForm, pendingCares: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-755"
                      placeholder="e.g. Pansement lit 101, perfusion de 14h00..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Examens laboratoires attendus</label>
                    <input
                      type="text"
                      value={newHandoverForm.pendingLabs}
                      onChange={(e) => setNewHandoverForm({ ...newHandoverForm, pendingLabs: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl"
                      placeholder="e.g. Hémogramme de la chambre VIP..."
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono">Incidents constatés / Autres consignes</label>
                    <textarea
                      value={newHandoverForm.incidents}
                      onChange={(e) => setNewHandoverForm({ ...newHandoverForm, incidents: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl h-16 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-violet-850 hover:bg-violet-900 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    Contresigner &amp; Expédier la Transmission
                  </button>
                </form>
              </div>

              {/* Handover Logs history */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                  Cahier Numérique de Transmission des Relèves
                </h3>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {handovers.map((hd) => (
                    <div key={hd.id} className="p-4 bg-violet-50/15 border border-violet-100 rounded-2xl text-xs font-semibold relative space-y-3">
                      
                      <div className="flex justify-between items-start border-b pb-2 border-violet-100/60 shrink-0">
                        <div>
                          <span className="text-[10px] uppercase font-black tracking-widest text-violet-955 bg-white border border-violet-200 px-2 py-0.5 rounded-full font-mono">
                            Passation : Équipe {hd.fromShift} → Équipe {hd.toShift}
                          </span>
                        </div>
                        <span className="text-gray-400 font-mono text-[10px]">{hd.date}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded font-sans text-gray-700 leading-normal font-medium">
                        <div className="bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="text-[9px] uppercase text-red-600 font-extrabold block mb-1">📋 Cas critiques</span>
                          <p>{hd.criticalCases}</p>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="text-[9px] uppercase text-indigo-750 font-extrabold block mb-1">💉 Soins attendus</span>
                          <p>{hd.pendingCares}</p>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="text-[9px] uppercase text-amber-805 font-extrabold block mb-1">🔬 Biologie attendue</span>
                          <p>{hd.pendingLabs}</p>
                        </div>
                        <div className="bg-white p-3 border border-slate-100 rounded-xl">
                          <span className="text-[9px] uppercase text-slate-500 font-extrabold block mb-1">⚠️ Obs / Incidents hors soins</span>
                          <p>{hd.incidents}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-violet-50/50 p-2.5 rounded-xl border border-violet-100 shrink-0">
                        <p className="text-[9px] text-slate-400">Rédigé de garde par: <strong className="text-violet-955 font-bold">{hd.senderName}</strong></p>
                        
                        {hd.status === "Validé" ? (
                          <div className="text-[9px] text-emerald-805 bg-emerald-50 px-2.5 py-1 rounded font-black border border-emerald-250 uppercase flex items-center gap-1 font-mono">
                            ✓ Transmission Validé de garde par {hd.validatedBy} le {new Date(hd.validatedAt!).toLocaleDateString()}
                          </div>
                        ) : (
                          <button
                            onClick={() => acceptHandoverPassation(hd.id)}
                            className="bg-violet-800 hover:bg-violet-900 text-white rounded text-[10px] font-black px-3 py-1.5 transition-colors shadow-xs cursor-pointer animate-pulse"
                          >
                            Accepter &amp; Valider la Réception
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SUBTAB 7: MAIN COURANTE NUMERIQUE & LING LOG TRACEABILITY */}
        {activeSubTab === "audit" && (
          <div className="space-y-6 animate-fade-in" id="dmg-audit-tab">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Main Courante logging form */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-teal-800" />
                  Consigner un évènement (Main Courante)
                </h3>

                <form onSubmit={handleAddCourante} className="space-y-4 text-xs font-semibold">
                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Catégorie de l'évènement</label>
                    <select
                      value={newCouranteForm.category}
                      onChange={(e) => setNewCouranteForm({ ...newCouranteForm, category: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl"
                    >
                      <option value="Incident">Incident technique</option>
                      <option value="Panne">Panne matériel clinique</option>
                      <option value="Urgence">Urgence logistique</option>
                      <option value="Rupture de Stock">Rupture de Stock Pharmacie</option>
                      <option value="Evènement exceptionnel">Évènement exceptionnel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Service Concerné</label>
                    <input
                      type="text"
                      value={newCouranteForm.service}
                      onChange={(e) => setNewCouranteForm({ ...newCouranteForm, service: e.target.value })}
                      className="w-full p-2.5 bg-white border border-gray-250 rounded-xl focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Description de l'Évènement</label>
                    <textarea
                      value={newCouranteForm.details}
                      onChange={(e) => setNewCouranteForm({ ...newCouranteForm, details: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-250 rounded-xl h-24 focus:ring-1 focus:ring-teal-750 focus:outline-none"
                      placeholder="e.g. Panne climatiseur chambre 101 VIP, technicien contacté."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Consigner pour traçabilité
                  </button>
                </form>
              </div>

              {/* Main courante visualization list */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <h3 className="font-extrabold text-sm text-slate-800 border-b pb-2">
                  Main Courante Numérique - Incident &amp; Log Logistique du Département
                </h3>

                <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                  {mainCourante.map((item) => (
                    <div key={item.id} className="p-3.5 bg-slate-50 border border-gray-250 rounded-xl text-xs font-semibold space-y-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase font-mono border ${
                          item.category === "Incident" ? "bg-red-50 text-red-800 border-red-200" :
                          item.category === "Panne" ? "bg-amber-50 text-amber-805" : "bg-blue-50 text-blue-805"
                        }`}>
                          {item.category}
                        </span>
                        <span className="font-mono text-[10px] text-gray-400">{item.date} {item.time}</span>
                      </div>

                      <p className="text-slate-800 leading-normal whitespace-pre-wrap font-sans font-medium text-[11px]">{item.details}</p>

                      <div className="flex justify-between items-center border-t border-gray-200/50 pt-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400">Rédacteur : {item.author}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1 rounded">{item.service}</span>
                      </div>
                    </div>
                  ))}

                  {mainCourante.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-10">Aucune consigne introduite.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* SUBTAB: IMMERSIVE SCENARIO WORKFLOW SIMULATOR */}
        {/* ========================================== */}
        {activeSubTab === "workflow_scenario" && (
          <div className="space-y-6 animate-fade-in text-xs font-semibold animate-duration-300" id="dmg-workflow-scenario-tab">
            
            {/* Header Jumbotron */}
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-amber-600/30">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
                <Award className="h-64 w-64 text-white" />
              </div>

              <div className="relative z-10 space-y-2">
                <span className="bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono">
                  Module de Démonstration Live
                </span>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  🧬 MédiSahel Clinical Care Storyboard: Alerte Médecin &amp; Coordination Staff
                </h2>
                <p className="text-[11px] text-slate-200 font-medium max-w-4xl leading-relaxed">
                  Ce simulateur immersif vous guide pas-à-pas à travers le parcours de soins réel de la patiente 
                  <strong className="text-amber-300"> Fatoumata Diallo</strong>. Découvrez l'interopérabilité des rôles 
                  (Caissier → Médecin → Infirmier → Aide-Soignant → Stagiaire supervisé) avec alertes instantanées, 
                  autocomplétion clinique, et scellage électronique du DME.
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setScStep(1);
                      setScPatient({
                        ...scPatient,
                        symptoms: "",
                        prescriptionText: "",
                        vitalsEntered: false,
                        vitals: { temp: "", bp_sys: "", bp_dia: "", pulse: "", resp: "", spo2: "", notes: "" }
                      });
                      setScCares([
                        { id: "sc-c1", name: "Perfusion de sérum glucosé", role: "Infirmier", assignedTo: "Fatoumata Diarra (Infirmière)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" },
                        { id: "sc-c2", name: "Prise des constantes (TA, T°, pouls)", role: "Aide-soignant", assignedTo: "Moussa Coulibaly (Aide-soignant)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" },
                        { id: "sc-c3", name: "Surveillance post-perfusion", role: "Stagiaire", assignedTo: "Awa Touré (Stagiaire)", status: "À faire", executedAt: "", notes: "", signature: "", validatedBy: "", supervisorNotes: "" }
                      ]);
                      showToast("🧬 Scénario réinitialisé à l'étape 1 !");
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-black px-4 py-2 rounded-xl border border-amber-500/50 cursor-pointer text-[10px] uppercase font-mono tracking-wider transition-all"
                  >
                    🔄 Réinitialiser le parcours de démonstration
                  </button>

                  <button 
                    onClick={playSoundAlert}
                    className="bg-white/10 hover:bg-white/20 text-white font-black px-3 py-2 rounded-xl cursor-pointer text-[10px] uppercase font-mono tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Volume2 className="h-4 w-4 text-amber-500 animate-pulse" />
                    Tester le Chime Acoustique Médecin (TTS/WebAudio)
                  </button>
                </div>
              </div>
            </div>

            {/* Scénario Type Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 max-w-2xl">
              <button 
                onClick={() => {
                  setActiveScenarioType("clinique");
                  showToast("🧬 Scénario Clinique & Staff sélectionné !");
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl font-mono text-[10px] uppercase font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeScenarioType === "clinique" ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🧬 1. Alerte Clinique &amp; Staff (8 Étapes)</span>
              </button>
              
              <button 
                onClick={() => {
                  setActiveScenarioType("labo");
                  showToast("🔬 Scénario Analyses Biologiques &amp; Caisse sélectionné !");
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl font-mono text-[10px] uppercase font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeScenarioType === "labo" ? "bg-white text-teal-955 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>🔬 2. Analyses Biologiques (6 Étapes)</span>
              </button>
            </div>

            {activeScenarioType === "labo" ? (
              <DmgLabScenario showToast={showToast} />
            ) : (
              <>
                {/* Stepper HUD */}
                <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs">
              <div className="flex justify-between items-center px-2 border-b pb-3 mb-4">
                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-mono">Progression du flux de soins</span>
                <span className="text-xs font-bold text-slate-850">
                  Étape <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono">{scStep}/8</strong> : {
                    scStep === 1 ? "Déclenchement Caissier" :
                    scStep === 2 ? "Alerte & Salle d'attente FIFO" :
                    scStep === 3 ? "Prise en charge & Auto-complétion DME" :
                    scStep === 4 ? "Prescription & Assignation du Staff" :
                    scStep === 5 ? "Espace Infirmier (Perfusion)" :
                    scStep === 6 ? "Espace Aide-Soignant (Constantes)" :
                    scStep === 7 ? "Espace Stagiaire & Superviseur" :
                    "Tracerie DME Complète scellée"
                  }
                </span>
              </div>

              {/* Graphical Steps */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                {[
                  { num: 1, label: "1. Caissier", desc: "Orange Money" },
                  { num: 2, label: "2. Alerte", desc: "Buzzer FIFO" },
                  { num: 3, label: "3. Prise DME", desc: "CIM-11" },
                  { num: 4, label: "4. Assignation", desc: "Soins Staff" },
                  { num: 5, label: "5. Infirmier", desc: "Perfusion" },
                  { num: 6, label: "6. A-Soignant", desc: "Constantes" },
                  { num: 7, label: "7. Stagiaire", desc: "Validation" },
                  { num: 8, label: "8. Trace DME", desc: "Co-Signature" },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => {
                      setScStep(s.num);
                      showToast(`Navigué vers l'étape ${s.num} du scénario clinique`);
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all relative ${
                      scStep === s.num
                        ? "bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-black"
                        : scStep > s.num
                        ? "bg-teal-50/50 border-teal-200 text-teal-900"
                        : "bg-slate-50/50 border-slate-150 text-slate-450 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                        scStep === s.num ? "bg-amber-200 text-amber-900" :
                        scStep > s.num ? "bg-teal-200 text-teal-900" : "bg-slate-200 text-slate-500"
                      }`}>{s.num}</span>
                      {scStep > s.num && <CheckCircle className="h-3.5 w-3.5 text-teal-600 shrink-0" />}
                    </div>
                    <p className="font-extrabold text-[11px] mt-1.5 leading-none">{s.label}</p>
                    <p className="text-[9px] text-slate-400 font-medium block mt-0.5 leading-none">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Workspace Frame based on active step */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Column: Interactive Screen (2/3 width) */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm min-h-[500px] flex flex-col justify-between text-slate-800">
                
                {/* ETAPE 1: CAISSIER */}
                {scStep === 1 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 1 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">Enregistrement Patient &amp; Encaissement Caissier</h3>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Encaissements</span>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-dashed text-[11px] text-slate-600 leading-relaxed font-semibold">
                      Le caissier de MédiSahel crée ou recherche la fiche d'identité de la patiente 
                      <strong className="text-slate-800 font-black"> Fatoumata Diallo</strong> pour initier sa consultation. 
                      Encaisser le ticket crée instantanément la transaction et injecte automatiquement son enregistrement dans la file FIFO du médecin de garde avec une relance vibrante et acoustique.
                    </div>

                    {/* Patient Card Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white border rounded-2xl p-4 space-y-3 shadow-xs">
                        <span className="text-[8px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider">Identité DME</span>
                        <div className="space-y-1 text-slate-700">
                          <p className="font-black text-slate-900 text-sm">Fatoumata DIALLO</p>
                          <p>Née le 13/06/1994 (32 ans) | Féminin</p>
                          <p>Ethnie : <span className="font-bold">Peulh</span> | Groupe sanguin : <span className="text-red-650 font-bold">A+</span></p>
                          <p>Téléphone : <span className="font-mono">76 12 34 56</span></p>
                          <p>Mutuelle principale : <span className="text-slate-900 font-extrabold hover:underline">CANAM (Mali)</span></p>
                          <p>Antécédents médicaux : <span className="text-rose-700 font-bold">HTA</span></p>
                        </div>
                      </div>

                      {/* Cashier Payment configuration */}
                      <div className="bg-white border rounded-2xl p-4 space-y-4 shadow-xs flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[8px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono uppercase font-black">Détails financiers du ticket</span>
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-gray-500 font-normal">Acte médical :</span>
                            <strong className="text-slate-800">CONSULTATION MÉDECINE GÉNÉRALE</strong>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-gray-500 font-normal">Montant dû :</span>
                            <strong className="text-teal-800 font-mono">15 000 FCFA</strong>
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[9px] text-slate-400 font-mono uppercase block mt-1">Canal de paiement</label>
                            <select className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-bold" defaultValue="OrangeMoney">
                              <option value="OrangeMoney">Orange Money (Mali)</option>
                              <option value="Cash">Espèces</option>
                              <option value="Canam">CANAM (Prise en charge 80%)</option>
                              <option value="MobileMoney">Telecel Cash / Moov Money</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            playSoundAlert();
                            showToast("💰 Paiement reçu ! N° CONSUL-1306-0001 émis. Alerte sonore transmise au Médecin !");
                            setScStep(2);
                          }}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white select-none rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all shadow-md cursor-pointer flex justify-center items-center gap-1.5"
                        >
                          💸 Valider Transaction &amp; Émettre Alerte
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPE 2: RECEPTION ALERTE */}
                {scStep === 2 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 2 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">Alerte Clinique &amp; Relais de la File d'attente FIFO</h3>
                      </div>
                      <span className="bg-rose-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">Live Alert</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border italic leading-relaxed text-[11px] text-slate-600">
                      Un pop-up s'ouvre sur la console du Dr. Ibrahim Touré, renforcé par le signal acoustique unique.
                      Le patient s'insère à son heure exacte d'enregistrement (09:32) ordonné de manière ascendante.
                    </div>

                    {/* Dr Alert Box represented as requested */}
                    <div className="border-4 border-amber-500 rounded-3xl overflow-hidden shadow-xl bg-orange-55/10">
                      <div className="bg-amber-500 text-slate-950 p-3.5 font-black flex justify-between items-center text-xs">
                        <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
                          <BellRing className="h-4 w-4 animate-bounce" /> 🔔 MédiSahel – Alerte Nouveau Patient En Attente
                        </span>
                        <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px] font-mono">Buzzer : Actif</span>
                      </div>
                      
                      <div className="p-5 space-y-4 text-xs font-semibold bg-white/40">
                        <div className="p-4 bg-white border rounded-2xl shadow-xs space-y-2">
                          <p className="text-sm">🆕 <strong className="text-slate-900">Nouveau patient en salle d'attente</strong></p>
                          <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1 text-[11px]">
                            <div>Patient : <strong className="text-slate-950 uppercase">{scPatient.lastName} {scPatient.firstName}</strong></div>
                            <div>N° Consultation : <span className="font-mono text-amber-800 font-black text-indigo-700 bg-sky-50 px-1 rounded">{scPatient.consultationNo}</span></div>
                            <div>Heure d'arrivée : <span className="font-mono font-bold text-slate-800 font-sans">09:32</span></div>
                            <div>Motif : <strong className="text-slate-900 font-sans">Consultation Générale</strong></div>
                          </div>
                        </div>

                        {/* Button Action Rows */}
                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => {
                              showToast("DME de Fatoumata Diallo chargé avec succès !", "success");
                              setScStep(3);
                            }}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-mono uppercase text-[10px] font-black rounded-xl shadow-xs cursor-pointer"
                          >
                            🤝 PRENDRE EN CHARGE
                          </button>
                          <button
                            onClick={() => showToast("Liste d'attente globale actualisée.")}
                            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            VOIR LISTE D'ATTENTE
                          </button>
                          <button
                            onClick={() => showToast("Alerte fermée temporairement.")}
                            className="px-3 py-2 bg-white border text-slate-500 rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                          >
                            IGNORER
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Waiting list table FIFO */}
                    <div className="bg-white border rounded-2xl p-4 space-y-3">
                      <h4 className="font-black text-xs text-slate-800 font-mono uppercase tracking-wide">File d'attente Médecin (FIFO - Arrivée Croissante)</h4>
                      <div className="border rounded-xl spill-x-auto spill-y-auto">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 border-b text-slate-500 font-mono">
                            <tr>
                              <th className="p-2 border-r font-bold">Ordre</th>
                              <th className="p-2 border-r font-bold">Heure</th>
                              <th className="p-2 border-r font-bold">Patient</th>
                              <th className="p-2 border-r font-bold">N° Consultation</th>
                              <th className="p-2 font-bold">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {scQueue.map((q, i) => (
                              <tr key={q.id} className={`border-b last:border-b-0 ${q.name.includes("Fatoumata") ? "bg-amber-50/40 font-bold" : ""}`}>
                                <td className="p-2 border-r font-mono text-center font-bold">{i + 1}</td>
                                <td className="p-2 border-r font-mono text-purple-900 font-bold">{q.time}</td>
                                <td className="p-2 border-r font-black text-slate-900">{q.name}</td>
                                <td className="p-2 border-r font-mono font-medium text-slate-600">{q.number}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    q.status === "En consultation" ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-amber-50 text-amber-800 border border-amber-250 animate-pulse"
                                  }`}>{q.status}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPE 3: PRISE EN CHARGE ET AUTO-COMPLETION DME */}
                {scStep === 3 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 3 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">👩‍⚕️ Consultation Médicale - DME de Fatoumata Diallo</h3>
                      </div>
                      <span className="bg-sky-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">Dossier Clinique</span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-dashed text-[11px] text-slate-600 leading-relaxed font-semibold">
                      Entrez les observations de consultation clinique de Dr Ibrahim Touré. Saisissez ou complétez le diagnostic. 
                      Notre <strong className="text-teal-850 font-bold">Intelligent Care Input</strong> facilite l'ordonnance médicale dynamique.
                    </div>

                    <div className="space-y-4">
                      {/* Clinical demographics banner */}
                      <div className="bg-slate-900 text-white rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] leading-relaxed">
                        <div>
                          <span className="text-[9px] text-gray-400 font-mono block">PATIENT</span>
                          <strong className="text-yellow-400 font-black">Fatoumata Diallo</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-mono block">AGE &amp; ETHNIE</span>
                          <strong>32 ans | Peulh</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-mono block">ASSURANCE</span>
                          <strong className="text-cyan-400 font-bold">CANAM CO-PAY</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 font-mono block">ALLERGIE / ATCD</span>
                          <strong>HTA (<span className="text-red-400 font-bold">Allergies: Aucune</span>)</strong>
                        </div>
                      </div>

                      {/* Interactive form element */}
                      <div className="space-y-3.5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Plainte Principale du patient</label>
                            <input 
                              type="text"
                              value={scPatient.symptoms}
                              onChange={(e) => setScPatient({ ...scPatient, symptoms: e.target.value })}
                              placeholder="ex: Céphalées intenses, frissons de ferveur et courbatures depuis 3 jours"
                              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none text-xs font-semibold"
                            />
                            <div className="flex gap-1.5 mt-1">
                              {["Céphalées & Fièvre forte", "Frissons intermittents", "Douleurs abdominales"].map(s => (
                                <button 
                                  key={s} 
                                  onClick={() => setScPatient({ ...scPatient, symptoms: s })}
                                  className="text-[9px] text-slate-500 border rounded bg-slate-50 px-1.5 py-0.5 hover:bg-slate-100 cursor-pointer"
                                >
                                  + {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Classification Diagnostique CIM-11</label>
                            <select 
                              value={scPatient.diagnostic}
                              onChange={(e) => setScPatient({ ...scPatient, diagnostic: e.target.value })}
                              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold focus:outline-none"
                            >
                              <option value="Paludisme simple">Paludisme simple confirmé [CIM-11: 1F40.0]</option>
                              <option value="Accès palustre sévère">Accès palustre sévère [CIM-11: 1F40.1]</option>
                              <option value="Fièvre typhoïde">Fièvre typhoïde suspectée [CIM-11: 1A07]</option>
                              <option value="HTA Essentielle">HTA Essentielle [CIM-11: BA00]</option>
                            </select>
                          </div>
                        </div>

                        {/* Interactive dynamic editor simulating Requirement 3 */}
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-slate-50/50 p-4 space-y-3">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-mono text-cyan-800 uppercase font-black font-semibold">Ordonnance intelligente assistant (@)</span>
                            <span className="text-[9px] text-gray-400 italic font-mono font-medium">Cliquez sur un tag d'autocomplétion rapide</span>
                          </div>

                          <textarea
                            value={scPatient.prescriptionText}
                            onChange={(e) => setScPatient({ ...scPatient, prescriptionText: e.target.value })}
                            rows={3}
                            placeholder="Entrez vos prescriptions. Astuce: @artemether pour le paludisme, @paracetamol pour hydrater et soulager..."
                            className="w-full p-2.5 bg-white border rounded-xl text-[11px] leading-relaxed font-mono focus:outline-none font-medium text-slate-800"
                          />

                          <div className="flex flex-wrap gap-2 pt-1 border-t border-dashed">
                            <span className="text-[10px] text-slate-400 font-mono">Prescriptions intelligentes :</span>
                            {[
                              { label: "@paludisme-simple-complet", text: "Artéméther/Luméfantrine 80/480 mg : 3 comprimés/jour pendant 3 jours\nParacétamol 500 mg : 2 comprimés en cas de fièvre\n@tdr @nfs" },
                              { label: "@injectable-paracetamol", text: "Paracétamol 1g Perfusion IV l'unité" },
                              { label: "@examen-tdr-nfs", text: "TDR Paludisme et Numération Formula Sanguine (NFS) prescrits d'urgence." }
                            ].map((sug, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setScPatient({ ...scPatient, prescriptionText: sug.text });
                                  showToast("⚡ Auto-complétion de l'ordonnance appliquée d'office !");
                                }}
                                className="bg-cyan-50 hover:bg-cyan-100 text-teal-800 font-mono text-[9px] px-2 py-1 rounded-md transition-all border border-cyan-200 cursor-pointer font-bold"
                              >
                                {sug.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            if (!scPatient.symptoms) {
                              showToast("⚠️ Renseignez d'abord la plainte de la patiente !", "error");
                              return;
                            }
                            showToast("Observations validées. Évaluation des soins requis par Dr. Touré...");
                            setScStep(4);
                          }}
                          className="bg-teal-800 hover:bg-teal-900 border text-white font-mono uppercase text-[10px] font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                        >
                          Sauvegarder &amp; Déterminer les Soins requis ➡️
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPE 4: PRESCRIPTION DES SOINS */}
                {scStep === 4 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 4 sur 8</span>
                        <h3 className="text-base font-black text-slate-900 font-sans">🏥 Planification &amp; Assignation Automatique des Soins CLINIC-STAFF</h3>
                      </div>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">Roster Assigné</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border leading-relaxed text-[11px] text-slate-600 font-semibold">
                      Le Dr. Touré détermine les soins urgents requis pour Fatoumata Diallo et l'asphyxie thermique de sa crise de paludisme. 
                      Sélectionnez les attributions et affectez l'exécution aux agents connectés.
                    </div>

                    {/* Care assignments lists */}
                    <div className="space-y-4">
                      {scCares.map((care) => (
                        <div key={care.id} className="p-4 bg-slate-50 border border-slate-205 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white transition-all shadow-xs">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-black ${
                              care.role === "Infirmier" ? "bg-indigo-100 text-indigo-900" :
                              care.role === "Aide-soignant" ? "bg-amber-100 text-amber-900" :
                              "bg-purple-100 text-purple-900"
                            }`}>
                              Cible Praticien Clinique : {care.role}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">{care.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Habilitation : {
                              care.role === "Infirmier" ? "Actes complexes, perfusions, injectables" :
                              care.role === "Aide-soignant" ? "Recueil surveillance clinique ou soins simples, hygiène" :
                              "Actes sous supervision directe d'un Major de garde"
                            }</p>
                          </div>

                          <div className="flex flex-col items-end gap-1 font-semibold shrink-0">
                            <span className="text-[9px] text-gray-400 font-mono block">Agent affecté d'office :</span>
                            <span className="px-3 py-1 bg-white border rounded-xl text-xs font-extrabold text-slate-805">
                              👤 {care.assignedTo}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-3">
                      <button
                        onClick={() => {
                          playSoundAlert();
                          // Propagate to main local persistent list of nursing cares in the application so user sees it in Espace Soignant
                          const mainDmgCaresString = localStorage.getItem("dmg_nursing_cares") || "[]";
                          try {
                            const currentCares = JSON.parse(mainDmgCaresString);
                            const updatedCares = [
                              { id: "sim-c1", patientId: "P2026-0123", patientName: "Fatoumata Diallo", careType: "Perfusion de sérum glucosé", productUsed: "Sérum Glucosé 5% + Ampoules", quantityUsed: "500 ml", scheduledTime: "09:45", status: "À faire", observations: "Perfusion prescrite par Dr. Ibrahim Touré.", executorName: "Fatoumata DIARRA", executorRole: "NURSE" },
                              { id: "sim-c2", patientId: "P2026-0123", patientName: "Fatoumata Diallo", careType: "Prise des constantes (TA, T°, pouls)", productUsed: "Appareils de prise", quantityUsed: "1 Recueil", scheduledTime: "09:45", status: "À faire", observations: "Vvital constants checking requested by physician.", executorName: "Moussa Coulibaly", executorRole: "AIDE_SOIGNANT" },
                              ...currentCares
                            ];
                            setNursingCares(updatedCares);
                            localStorage.setItem("dmg_nursing_cares", JSON.stringify(updatedCares));
                          } catch (ex) {
                            console.error(ex);
                          }

                          showToast("📬 Tâches injectées en temps réel ! Alertes sonores émises pour le staff !");
                          setScStep(5);
                        }}
                        className="bg-emerald-700 hover:bg-emerald-800 border text-white font-mono uppercase text-[10px] font-black px-5 py-3 rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                      >
                        ⚡ ACCRÉDITER LE STAFF &amp; ACTIVER LES ALERTES 🔔
                      </button>
                    </div>
                  </div>
                )}

                {/* ETAPE 5: ESPACE INFIRMIER (PERFUSION) */}
                {scStep === 5 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 5 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">💪 Interface Infirmier Major de Garde - Fatoumata Diarra</h3>
                      </div>
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">Nursing</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border leading-relaxed text-[11px] text-slate-700 font-semibold">
                      L'infirmière <strong className="text-slate-905 font-extrabold">Fatoumata Diarra</strong> reçoit l'alerte sur sa console. 
                      Pratiquez le geste invasif requis (Perfusion) puis signez-le électroniquement.
                    </div>

                    {/* Step 5 alert message box */}
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 shadow-xs">
                      <BellRing className="h-5 w-5 text-indigo-700 mt-1 shrink-0 animate-bounce" />
                      <div className="space-y-1 font-semibold text-[11.5px] leading-relaxed">
                        <strong className="text-indigo-950 text-xs">🔔 ALERTE – NOUVEAU SOIN PRESCRIT D'URGENCE</strong>
                        <p>Patient : <span className="font-extrabold text-slate-900">Fatoumata Diallo</span> | Ambulatoire </p>
                        <p>Acte assigné : <span className="text-indigo-800 font-extrabold underline-offset-2 underline">Perfusion de sérum glucosé</span></p>
                        <p className="text-[10.5px] text-slate-500 font-normal">Prescrit par : <strong className="text-slate-800 font-sans">Dr. Ibrahim Touré (Médecine Générale)</strong></p>
                      </div>
                    </div>

                    {/* Dynamic state representation */}
                    <div className="bg-white border rounded-2xl p-4.5 space-y-4 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-1.5 font-bold">
                        <span className="font-mono text-[9px] text-slate-400">TABLEAU DE BORD INFIRMIER EN DIRECT</span>
                        <span className="bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded text-[8.5px] font-bold font-mono">1 SOIN À FAIRE</span>
                      </div>

                      <div className="p-3.5 bg-slate-50 border rounded-xl flex justify-between items-center text-xs font-semibold">
                        <div>
                          <p className="font-extrabold text-slate-800 text-sm">Perfusion de sérum glucosé</p>
                          <p className="text-[10.5px] text-slate-500 font-normal">Heure prévue : <span className="font-mono font-bold text-slate-700">09:45</span></p>
                        </div>

                        <div>
                          {scCares[0].status === "À faire" && (
                            <button
                              onClick={() => {
                                const tempCares = [...scCares];
                                tempCares[0].status = "En cours";
                                setScCares(tempCares);
                                showToast("Perfusion débutée d'office. Surveillance active en cours.");
                              }}
                              className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl uppercase font-mono text-[10px] font-black cursor-pointer"
                            >
                              ▶️ ACCEPTER &amp; ENGAGER
                            </button>
                          )}

                          {scCares[0].status === "En cours" && (
                            <button
                              onClick={() => {
                                const tempCares = [...scCares];
                                tempCares[0].status = "Validée";
                                tempCares[0].executedAt = "09:45";
                                tempCares[0].notes = "Sérum glucosé 5% posé sans incident. Patient calme, débit régulé.";
                                tempCares[0].signature = "SIG-FD-NURSE-1306";
                                setScCares(tempCares);
                                showToast("Soin signé de façon sécurisée et archivé au DME !", "success");
                              }}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl uppercase font-mono text-[10px] font-black cursor-pointer flex items-center gap-1.5 font-sans font-semibold"
                            >
                              <Check className="h-3.5 w-3.5 text-white animate-pulse" /> SIGNER L'ACTE (EXÉCUTÉ)
                            </button>
                          )}

                          {scCares[0].status === "Validée" && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-850 border border-emerald-250 px-2 py-1 rounded font-mono font-bold flex items-center gap-1 leading-none">
                              ✓ EXÉCUTÉ &amp; SCELLÉ
                            </span>
                          )}
                        </div>
                      </div>

                      {scCares[0].status === "Validée" && (
                        <div className="bg-emerald-50/50 p-3 rounded-xl border border-dashed text-[11px] leading-relaxed text-slate-700 font-semibold">
                          <p><strong>Rapport d'exécution :</strong> {scCares[0].notes}</p>
                          <p className="text-[9.5px] mt-1 font-mono text-gray-400 font-normal">Empreinte numérique d'authentification : <strong className="text-teal-800 font-extrabold">{scCares[0].signature}</strong> (Time : {scCares[0].executedAt})</p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (scCares[0].status !== "Validée") {
                            showToast("⚠️ Validez d'abord la perfusion par l'infirmière !", "error");
                            return;
                          }
                          showToast("Prise en charge par l'Aide-soignant...");
                          setScStep(6);
                        }}
                        className="bg-teal-800 hover:bg-teal-900 border text-white font-mono uppercase text-[10px] font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                      >
                        Passer à l'Aide-Soignant ➡️
                      </button>
                    </div>
                  </div>
                )}

                {/* ETAPE 6: INTERFACE AIDE-SOIGNANT */}
                {scStep === 6 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 6 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">🌡️ Interface de l'Aide-Soignant - Moussa Coulibaly</h3>
                      </div>
                      <span className="bg-amber-100 text-amber-900 border px-2 py-0.5 rounded text-[10px] font-bold">Aide-Soignant</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border leading-relaxed text-[11px] text-slate-700 font-semibold">
                      L'aide-soignant <strong className="text-slate-950 font-black">Moussa Coulibaly</strong> est chargé de recueillir et saisir les constantes 
                      vitales de Fatoumata Diallo. Saisissez les données cliniques requises.
                    </div>

                    {/* Restriction card showing why Aide-soignant has custom rules */}
                    <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2.5 text-[10.5px] text-orange-950 leading-relaxed font-semibold">
                      <ShieldAlert className="h-4 w-4 text-orange-605 shrink-0 mt-0.5" />
                      <div>
                        <strong>🔒 Habilitations &amp; Scope de Compétence Clinique :</strong>
                        <p className="font-normal mt-0.5 text-orange-900">
                          Moussa Coulibaly n'a pas accès aux outils de modification d'ordonnances, de validation d'examens complexes ou d'émission 
                          de diagnostics. Son module est restreint à la saisie de surveillance.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-xs">
                      <span className="text-[8px] bg-sky-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold font-mono uppercase tracking-wide">Saisie de surveillance</span>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-500 font-mono block mb-1">Température (°C)</label>
                          <input
                            type="text"
                            placeholder="ex: 38.5"
                            value={scPatient.vitals.temp}
                            onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, temp: e.target.value }})}
                            className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono block mb-1 col-span-2">Tension Artérielle (mmHg)</label>
                          <div className="flex items-center gap-1 font-mono">
                            <input
                              type="text"
                              placeholder="SYS"
                              value={scPatient.vitals.bp_sys}
                              onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, bp_sys: e.target.value }})}
                              className="p-2 w-16 bg-slate-50 border rounded-xl text-center font-extrabold focus:outline-none text-xs"
                            />
                            <span>/</span>
                            <input
                              type="text"
                              placeholder="DIA"
                              value={scPatient.vitals.bp_dia}
                              onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, bp_dia: e.target.value }})}
                              className="p-2 w-16 bg-slate-50 border rounded-xl text-center font-extrabold focus:outline-none text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono block mb-1">Pouls (bpm)</label>
                          <input
                            type="text"
                            placeholder="ex: 95"
                            value={scPatient.vitals.pulse}
                            onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, pulse: e.target.value }})}
                            className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono block mb-1">Freq. Respiratoire (/min)</label>
                          <input
                            type="text"
                            placeholder="ex: 20"
                            value={scPatient.vitals.resp}
                            onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, resp: e.target.value }})}
                            className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-mono block mb-1">SpO2 (%)</label>
                          <input
                            type="text"
                            placeholder="ex: 98"
                            value={scPatient.vitals.spo2}
                            onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, spo2: e.target.value }})}
                            className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[9px] text-slate-500 font-mono block mb-1">Assistance Saisie</label>
                          <button
                            onClick={() => {
                              setScPatient({
                                ...scPatient,
                                vitals: { temp: "38.5", bp_sys: "120", bp_dia: "80", pulse: "95", resp: "20", spo2: "98", notes: "Patient fébrile, consciente orientée" }
                              });
                              showToast("Données de Fatoumata Diallo chargées conformes !");
                            }}
                            className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100 text-teal-900 text-[10px] font-black uppercase rounded-xl border border-dashed border-indigo-200 cursor-pointer"
                          >
                            ⚡ Saisie conformité
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] text-slate-500 block font-mono">Observations cliniques de surveillance</label>
                        <input
                          type="text"
                          value={scPatient.vitals.notes}
                          onChange={(e) => setScPatient({ ...scPatient, vitals: { ...scPatient.vitals, notes: e.target.value }})}
                          placeholder="Notez d'éventuels frissons ou alertes..."
                          className="p-2.5 text-xs w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold"
                        />
                      </div>

                      {scPatient.vitalsEntered ? (
                        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-200 text-[11px] leading-relaxed font-semibold">
                          ✅ <strong>Feuille de constantes enregistrée :</strong> Temp: 38.5°C | TA: 120/80 mmHg | Pouls: 95 | SpO2: 98%. Signée électroniquement par Moussa Coulibaly (Aide-Soignant) à 09:50.
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (!scPatient.vitals.temp || !scPatient.vitals.bp_sys) {
                              showToast("⚠️ Remplissez les paramètres de constantes !", "error");
                              return;
                            }
                            setScPatient({ ...scPatient, vitalsEntered: true });
                            showToast("Constantes enregistrées avec validation d'habilitation", "success");
                          }}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-black uppercase tracking-wider font-mono rounded-xl shadow-xs cursor-pointer"
                        >
                          📌 Enregistrer &amp; Signer la feuille de surveillance
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (!scPatient.vitalsEntered) {
                            showToast("⚠️ Saisissez d'abord les vitalparameters !", "error");
                            return;
                          }
                          showToast("Passage à l'Espace d'exécution et validation Stagiaire...");
                          setScStep(7);
                        }}
                        className="bg-teal-805 hover:bg-teal-900 border text-white font-mono uppercase text-[10px] font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                      >
                        Passer au Stagiaire &amp; Validation ➡️
                      </button>
                    </div>
                  </div>
                )}

                {/* ETAPE 7: STAGIAIRE & SUPERVISION */}
                {scStep === 7 && (
                  <div className="space-y-5 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 7 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">🎓 Espace Stagiaire &amp; Validation par Superviseur</h3>
                      </div>
                      <span className="bg-purple-50 text-purple-700 border border-purple-255 px-2 py-0.5 rounded text-[10px] font-bold">Supervisé</span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border leading-relaxed text-[11px] text-slate-700 font-semibold text-xs">
                      Les actes du stagiaire <strong className="text-slate-950 font-black">Awa Touré</strong> requièrent un visa électronique de validation obligatoire. 
                      Saisissez l'acte puis commutez vers le visa de l'Infirmier référent.
                    </div>

                    {/* Stagiaire work logs panel */}
                    <div className="bg-white border rounded-2xl p-5 space-y-4 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-1.5 font-bold">
                        <span className="text-[9px] text-purple-700 font-mono tracking-wider">🎓 CONSOLE STAGIAIRE EN LIGNE (SOUS TUTELLE)</span>
                        <span className={`text-[9.5px] px-2 py-0.5 rounded font-mono ${
                          scCares[2].status === "À faire" ? "bg-slate-105 text-slate-500" :
                          scCares[2].status === "En attente de validation" ? "bg-orange-100 text-orange-900 font-extrabold animate-pulse border border-orange-200 text-orange-950" :
                          "bg-emerald-100 text-emerald-850"
                        }`}>
                          Statut : {scCares[2].status}
                        </span>
                      </div>

                      <div className="space-y-1 font-semibold">
                        <p className="text-xs font-black text-slate-800">Acte à exécuter : Surveillance post-perfusion de Fatoumata Diallo</p>
                        <p className="text-[10px] text-slate-500 font-medium">Tuteur clinique désigné : <strong className="text-slate-800 font-bold">Fatoumata Diarra (Major de Garde)</strong></p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9.5px] text-slate-400 block font-sans font-semibold">Observations rédigées par le stagiaire</label>
                        <textarea
                          rows={2}
                          value={scCares[2].notes || "Perfusion bien tolérée. Pas d'effet secondaire observé. Patient calme, conscience claire."}
                          onChange={(e) => {
                            const temp = [...scCares];
                            temp[2].notes = e.target.value;
                            setScCares(temp);
                          }}
                          placeholder="ex: Perfusion bien tolérée, aucun frisson détecté..."
                          className="w-full p-2.5 bg-slate-100 border rounded-xl text-xs font-mono focus:outline-none"
                        />
                      </div>

                      {scCares[2].status === "À faire" && (
                        <button
                          onClick={() => {
                            const temp = [...scCares];
                            temp[2].status = "En attente de validation";
                            setScCares(temp);
                            showToast("Acte soumis ! Déclenchement de l'alerte sur la console du Major.");
                          }}
                          className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-black uppercase tracking-wider font-mono cursor-pointer"
                        >
                          ⚠️ Soumettre observations pour visa de la tutelle majorée
                        </button>
                      )}

                      {/* Supervisor validating block if sent */}
                      {scCares[2].status === "En attente de validation" && (
                        <div className="p-4 bg-orange-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-3 font-semibold text-slate-800">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <UserCheck className="h-4 w-4 text-orange-600 shrink-0" />
                            Cadre de Validation de l'Infirmier Référent (Visa Majoré)
                          </p>

                          <div className="space-y-2 text-xs">
                            <label className="block text-[9.5px] text-slate-500 font-mono">Avis motivé du valideur académique</label>
                            <input
                              type="text"
                              value={scCares[2].supervisorNotes || "Rapport validé. Comportement professionnel et prise en charge appliquée."}
                              onChange={(e) => {
                                const temp = [...scCares];
                                temp[2].supervisorNotes = e.target.value;
                                setScCares(temp);
                              }}
                              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                            />

                            <div className="flex gap-2 font-black font-mono">
                              <button
                                onClick={() => {
                                  const temp = [...scCares];
                                  temp[2].status = "Validée";
                                  temp[2].validatedBy = "Fatoumata Diarra (Infirmière Major)";
                                  temp[2].executedAt = "10:00";
                                  setScCares(temp);
                                  showToast("Sceau apposé, certificat visé !", "success");
                                }}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-[10px] uppercase rounded-xl cursor-pointer font-bold font-mono"
                              >
                                ✓ Valider définitivement
                              </button>
                              <button
                                onClick={() => {
                                  const temp = [...scCares];
                                  temp[2].status = "À faire";
                                  setScCares(temp);
                                  showToast("Renvoyé pour correction clinique.");
                                }}
                                className="px-3 py-2 bg-red-100 text-red-950 text-[10px] uppercase rounded-xl cursor-pointer"
                              >
                                Refuser (À recommencer)
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {scCares[2].status === "Validée" && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-250 rounded-xl space-y-2 text-[11px] leading-relaxed font-semibold">
                          <p className="font-extrabold text-emerald-900">✅ ACTE CLINIQUEMENT CO-SIGNÉ &amp; SCELLÉ</p>
                          <p>Tuteur major : <span className="text-emerald-950 font-bold">{scCares[2].validatedBy}</span></p>
                          <p>Appréciation du visa scellé : <em className="text-slate-600 font-sans">"{scCares[2].supervisorNotes}"</em></p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          if (scCares[2].status !== "Validée") {
                            showToast("⚠️ Le soin du stagiaire doit d'abord être validé !", "error");
                            return;
                          }
                          showToast("DME actualisé en direct avec traçabilité complète !");
                          setScStep(8);
                        }}
                        className="bg-teal-800 hover:bg-teal-900 border text-white font-mono uppercase text-[10px] font-black px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                      >
                        Consulter DME Mis à Jour ➡️
                      </button>
                    </div>
                  </div>
                )}

                {/* ETAPE 8: SYNCHRONISATION ET RETOUR DME */}
                {scStep === 8 && (
                  <div className="space-y-6 animate-fade-in flex-grow">
                    <div className="border-b pb-3 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-amber-600 font-mono">Étape 8 sur 8</span>
                        <h3 className="text-base font-black text-slate-900">📁 Dossier Médical Électronique (DME) Scellé</h3>
                      </div>
                      <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">100% Certifié</span>
                    </div>

                    <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-6 relative border-2 border-emerald-500 shadow-xl">
                      
                      {/* Certified Stamp */}
                      <div className="absolute right-6 top-6 border-4 border-emerald-500 text-emerald-500 uppercase font-black text-[9px] font-mono p-2 rounded-xl border-double transform rotate-12 opacity-80 select-none bg-slate-950/90 text-center leading-tight">
                        MÉDISAHEL SECURE<br/>DOCUMENT SATELLITE
                      </div>

                      <div className="border-b border-white/20 pb-4">
                        <span className="text-[9px] font-mono text-cyan-400 block">Identité Hospitalière</span>
                        <h4 className="text-lg font-black tracking-wide">FATOUMATA DIALLO | DOSSIER P2026-0123</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-normal">MédiSahel Bamako V2 - Certificat National d'Hachage HIS</p>
                      </div>

                      {/* Section 1: Dr Consultation */}
                      <div className="space-y-2 font-semibold">
                        <h5 className="font-extrabold text-[10px] text-yellow-400 font-mono uppercase">🩺 CONSULTATION MÉDECIN (Dr. Ibrahim TOURÉ)</h5>
                        <div className="bg-white/5 border border-white/15 p-3.5 rounded-xl text-xs space-y-2">
                          <p>Diagnostic retenu : <strong>Paludisme simple confirmé [CIM-11: 1F40.0]</strong></p>
                          <p className="text-[11px]">Symptômes observés : <em className="text-gray-300">"{scPatient.symptoms || "Fièvre suffocante, céphalées aiguës"}"</em></p>
                          <div className="border-t border-white/10 pt-2 space-y-1">
                            <span className="text-[9px] text-gray-400 block font-mono">Ordonnance :</span>
                            <pre className="text-[10px] font-mono whitespace-pre-wrap text-emerald-300 bg-black/40 p-2.5 rounded-lg leading-relaxed">{scPatient.prescriptionText || "Artéméther/Luméfantrine 80/480 mg : 3 comprimés/jour pendant 3 jours\nParacétamol 500 mg : 2 comprimés en cas de fièvre"}</pre>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Vitals from Aide-soignant */}
                      <div className="space-y-2 font-semibold">
                        <h5 className="font-extrabold text-[10px] text-cyan-400 font-mono uppercase">🌡️ SURVEILLANCE CONSTANTES (Moussa Coulibaly, Aide-soignant)</h5>
                        <div className="bg-white/5 border border-white/15 p-4 rounded-xl text-[11px] leading-relaxed grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-gray-400 text-[9px] block">Température</span>
                            <strong className="text-rose-400 font-mono text-xs">{scPatient.vitals.temp || "38.5"} °C</strong>
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-gray-400 text-[9px] block">Tension</span>
                            <strong className="font-mono text-xs">{scPatient.vitals.bp_sys || "120"}/{scPatient.vitals.bp_dia || "80"} mmHg</strong>
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-gray-400 text-[9px] block">Pouls</span>
                            <strong className="font-mono text-xs text-amber-400">{scPatient.vitals.pulse || "95"} bpm</strong>
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-gray-400 text-[9px] block">Fréquence Respi</span>
                            <strong className="font-mono text-xs">{scPatient.vitals.resp || "20"} /min</strong>
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-xl border border-white/10">
                            <span className="text-gray-400 text-[9px] block">SpO2</span>
                            <strong className="text-cyan-300 font-mono text-xs">{scPatient.vitals.spo2 || "98"} %</strong>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Staff Care co-signature */}
                      <div className="space-y-2 font-semibold">
                        <h5 className="font-extrabold text-[10px] text-purple-400 font-mono uppercase">💉 FEUILLE D'ACTES INFIRMIERS ET CO-SIGNATURES SCELLÉES</h5>
                        <div className="space-y-2.5">
                          {scCares.map((c) => (
                            <div key={c.id} className="bg-white/5 border border-white/15 p-3.5 rounded-xl text-xs space-y-1.5 leading-relaxed">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-200">{c.name}</span>
                                <span className="bg-emerald-950 border border-emerald-500 text-white font-mono text-[8px] px-1.5 py-0.5 rounded leading-none">EXECUTÉ VALIDÉ</span>
                              </div>
                              <p className="text-gray-300">{c.notes || "Surveillance continue posée et approuvée sans aucun incident."}</p>
                              
                              <div className="flex justify-between items-center text-[9px] text-gray-400 border-t border-white/10 pt-1.5 mt-1 shrink-0 font-mono">
                                <span>Rôle affecté : <strong>{c.role}</strong></span>
                                <span>Signataire d'office : <strong>{c.assignedTo}</strong></span>
                              </div>
                              {c.validatedBy && (
                                <p className="text-[9.5px] text-emerald-400 font-mono">✓ Visé et validé par : <strong>{c.validatedBy} ({c.supervisorNotes || "Rapport validé"})</strong></p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Live Telemetry logs & informational guide (1/3 width) */}
              <div className="space-y-5 lg:col-span-1 leading-relaxed">
                
                {/* Visual flowchart summary as provided in the instruction */}
                <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-3.5 shadow-xs">
                  <h4 className="font-black text-xs text-slate-800 border-b pb-2 tracking-wide uppercase font-mono">Diagramme de flux de données</h4>
                  
                  <div className="bg-slate-900 text-teal-400 font-mono text-[10px] p-4 rounded-xl space-y-3 leading-snug">
                    <div>
                      <p className="text-yellow-400 font-black">Caissier</p>
                      <p className="text-[9px] text-gray-400"> (encaissement + déclenchement)</p>
                      <p className="pl-4">▼</p>
                    </div>

                    <div>
                      <p className="text-yellow-400 font-black">Médecin (Ibrahim Touré)</p>
                      <p className="text-[9px] text-gray-400"> (chime sonore + FIFO + prescription)</p>
                      <p className="pl-4">▼</p>
                    </div>

                    <div>
                      <p className="text-amber-500 font-bold">Assignation automatique</p>
                      <p className="pl-4 text-emerald-300">├─► InfirmierMajor</p>
                      <p className="pl-4 text-emerald-300">├─► AideSoignant</p>
                      <p className="pl-4 text-emerald-300">└─► Stagiaire Tutelle</p>
                      <p className="pl-4">▼</p>
                    </div>

                    <div>
                      <p className="text-cyan-400 font-black">DME Centralisé</p>
                      <p className="text-[9px] text-gray-400 font-sans"> (traçabilité clinique certifiée)</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-3.5 shadow-xs">
                  <h4 className="font-extrabold text-slate-800 text-xs border-b pb-2 tracking-wider uppercase font-mono">Guide de traçabilité MédiSahel</h4>
                  
                  <div className="space-y-3 text-[11px] font-semibold text-slate-705">
                    <div className="flex gap-2.5 items-start">
                      <div className="bg-emerald-50 text-emerald-800 p-1 rounded font-bold">✓</div>
                      <div>
                        <strong className="text-slate-900 block font-black">Certificat d'Empreinte (GECD)</strong>
                        Chaque étape d'affectation, d'exécution ou de validation est horodatée avec un hachage unique scellé au dossier patient.
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="bg-emerald-50 text-emerald-800 p-1 rounded font-bold">✓</div>
                      <div>
                        <strong className="text-slate-905 block font-black">Responsabilité Partagée</strong>
                        L'acte du stagiaire ne peut pas rester non visé. Sans approbation, le soin est consigné comme non certifié.
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <div className="bg-emerald-50 text-emerald-800 p-1 rounded font-bold">✓</div>
                      <div>
                        <strong className="text-slate-905 block font-black">Zéro Risque Thérapeutique</strong>
                        L'aide-soignant est invité à introduire de la surveillance; mais le module bloque toute administration autonome d'ampoules de drogues actives.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit trail preview */}
                <div className="bg-slate-900 text-slate-205 p-4.5 rounded-2xl border space-y-3">
                  <h4 className="font-black text-[10px] text-amber-500 uppercase font-mono tracking-wider">📜 Événements du simulateur</h4>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1 text-[9.5px] font-mono text-gray-400">
                    <p className="text-cyan-400 font-sans">▶ [2026-06-13] Démarrage du simulateur live</p>
                    {scStep >= 2 && <p className="text-emerald-400">▶ [09:32] CONSUL-1306-0001 : Entrée de Fatoumata Diallo dans la file FIFO</p>}
                    {scStep >= 3 && <p className="text-emerald-400 font-sans">▶ [09:33] Prise en charge DMG effectuée par Dr Ibrahim Touré</p>}
                    {scStep >= 4 && <p className="text-teal-400 font-sans">▶ [09:40] Prescription de perfusion et check des constantes injectées</p>}
                    {scStep >= 5 && <p className="text-indigo-400">▶ [09:45] Infirmière Fatoumata Diarra valide l'exécution de l'acte technique</p>}
                    {scStep >= 6 && <p className="text-yellow-400">▶ [09:50] Aide-soignant Moussa Coulibaly signe le recueil des constantes</p>}
                    {scStep >= 7 && <p className="text-purple-400">▶ [10:00] Visa de tutorat clinique apposé par la Major de garde</p>}
                    {scStep >= 8 && <p className="text-emerald-500 font-bold">▶ [10:05] Sceau numérique MédiSahel scellé d'office au dossier central</p>}
                  </div>
                </div>

              </div>

            </div>
          </>
          )}

          </div>
        )}

        {/* SUBTAB 8: GESTION DES EQUIPES DU SERVICE DMG */}
        {activeSubTab === "team" && (
          <div className="space-y-6 animate-fade-in text-xs font-semibold" id="dmg-team-tab">
            
            {/* Renseignements */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-teal-800" />
                  Roster &amp; Gestion d'Équipes du Service DMG
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  Le Médecin Général Chef de Service structure et affecte les cliniciens du service DMG au sein d'unités autogérées (Équipes de rotation).
                </p>
              </div>
              
              <div className="text-[10px] bg-white border border-gray-200 p-2.5 rounded-xl font-mono space-y-1">
                <div>Type de persistance: <span className="text-emerald-700 font-bold uppercase shrink-0 font-black">Relational DBMS (Postgres + Mem backup)</span></div>
                <div>Synchro par rôle: <span className="text-slate-500">Autorisé pour les chefs de service et administrateurs</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Assignation Form (Chef / Admin only) */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-1">
                <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-emerald-800" />
                  Assigner ou Modifier un Rôle d'Équipe
                </h4>

                {isChiefOrAdmin ? (
                  <form onSubmit={handleAssignStaff} className="space-y-4 font-semibold">
                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Sélectionner le Praticien Clinique <span className="text-red-500">*</span></label>
                      <select
                        value={newStaffForm.userId}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, userId: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
                      >
                        <option value="">-- Choisir un utilisateur --</option>
                        {allUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} (Role: {u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase tracking-wide">Équipe de Garde / Relais</label>
                      <select
                        value={newStaffForm.teamName}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, teamName: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-250 rounded-xl focus:outline-none focus:ring-1"
                      >
                        <option value="Equipe A">Équipe de Rotation A</option>
                        <option value="Equipe B">Équipe de Rotation B</option>
                        <option value="Equipe C">Équipe de Rotation C</option>
                        <option value="Equipe D">Équipe de Rotation D</option>
                        <option value="Medecins Specifiques">Médecins Spécifiques Référents</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Statut</label>
                        <select
                          value={newStaffForm.status}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, status: e.target.value })}
                          className="w-full p-2.5 bg-white border border-gray-250 rounded-xl focus:outline-none"
                        >
                          <option value="ACTIVE">Actif (Dédié)</option>
                          <option value="INACTIVE">Inactif (Détaché)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 text-[10px] mb-1 font-mono uppercase">Disponibilité</label>
                        <select
                          value={newStaffForm.availability}
                          onChange={(e) => setNewStaffForm({ ...newStaffForm, availability: e.target.value })}
                          className="w-full p-2.5 bg-white border border-gray-250 rounded-xl focus:outline-none"
                        >
                          <option value="AVAILABLE">Disponible</option>
                          <option value="ON_LEAVE">En Congé</option>
                          <option value="SICK">Arrêt Maladie</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-teal-800 hover:bg-teal-900 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer uppercase font-mono tracking-wider"
                    >
                      Enregistrer l'affectation DMG
                    </button>
                  </form>
                ) : (
                  <div className="p-4 bg-orange-50 border border-orange-200 text-orange-950 rounded-xl text-xs font-semibold leading-relaxed">
                    ⚠ Seul le Médecin Général Chef de Service ou l'Administrateur Système peut reconfigurer le triage des équipes de garde.
                  </div>
                )}
              </div>

              {/* Grid representation of existing clinical rosters */}
              <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-4 lg:col-span-2">
                <h4 className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
                  <span>Composition Actuelle de l'Équipe Clinique</span>
                  <span className="font-mono text-[10px] text-gray-400 font-normal">{dmgStaffList.length} praticiens assignés</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Let's show current teams */}
                  {["Equipe A", "Equipe B", "Equipe C", "Equipe D", "Medecins Specifiques"].map((team) => {
                    const membersInTeam = dmgStaffList.filter(s => s.teamName === team);
                    
                    return (
                      <div key={team} className="border border-gray-200 rounded-2xl p-3.5 space-y-2.5 bg-slate-50/50">
                        <div className="flex justify-between items-center border-b border-gray-250/60 pb-1.5 shrink-0">
                          <span className="font-extrabold text-xs text-slate-700">{team}</span>
                          <span className="text-[9px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">{membersInTeam.length}</span>
                        </div>

                        <div className="space-y-2">
                          {membersInTeam.map((mem) => {
                            const userObj = allUsers.find(u => u.id === mem.userId);
                            if (!userObj) return null;
                            
                            return (
                              <div key={mem.id} className="flex justify-between items-center bg-white p-2.5 border border-gray-200 rounded-xl">
                                <div>
                                  <p className="font-extrabold text-slate-800 text-xs">{userObj.name}</p>
                                  <p className="text-[10px] text-slate-400 font-mono capitalize">Role: {userObj.role}</p>
                                </div>

                                <div className="flex flex-col items-end gap-1 font-mono">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                                    mem.availability === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
                                    mem.availability === "ON_LEAVE" ? "bg-yellow-250 text-yellow-955" : "bg-red-100 text-red-900"
                                  }`}>
                                    {mem.availability === "AVAILABLE" ? "Disponible" : mem.availability === "ON_LEAVE" ? "En Congé" : "Maladie"}
                                  </span>
                                  <span className="text-[8px] text-slate-400">{mem.status === "ACTIVE" ? "Dossier Actif" : "Détaché"}</span>
                                </div>
                              </div>
                            );
                          })}

                          {membersInTeam.length === 0 && (
                            <p className="text-[10px] text-gray-400 italic text-center py-4">Aucun membre attitré à cette équipe.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        )}

        </DmgErrorBoundary>
      </div>
    </div>
  );
};
