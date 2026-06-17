import React, { useState, useEffect, useRef } from "react";
import { 
  FlaskConical, Check, Printer, Save, CheckSquare, Sparkles, 
  AlertCircle, FileText, ShieldCheck, Lock, Unlock, User, 
  Globe, AlertTriangle, X, Eye, FileSpreadsheet, RotateCcw,
  CheckCircle2, Info, ChevronDown, Clock
} from "lucide-react";
import { Patient, LabTest } from "../types.ts";
import { exportToPDF } from "../utils/exportUtils";

export interface IntelligentLabEditorProps {
  selectedTest: LabTest & { requestedBy?: string };
  patient: Patient;
  token: string | null;
  onSaveSuccess: (updatedTest: any) => void;
  showToast: (msg: string, type?: "success" | "error" | "info" | "warning") => void;
  onBackToList?: () => void;
  userRole?: string;
  writeAuditLog?: (action: string, details: string) => void;
}

// Full structure of possible exam parameters as requested
interface ParameterDefinition {
  id: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  type: "number" | "select";
  options?: string[];
  category: string; // NFS, BIOCHEMISTRY, SEROLOGY, etc.
}

const PARAMETER_LIBRARY: Record<string, ParameterDefinition[]> = {
  nfs: [
    { id: "hemo", name: "Hémoglobine", unit: "g/dL", min: 12, max: 16, type: "number", category: "NFS" },
    { id: "hemat", name: "Hématocrite", unit: "%", min: 36, max: 46, type: "number", category: "NFS" },
    { id: "gr", name: "Globules rouges", unit: "M/mm³", min: 4, max: 5.5, type: "number", category: "NFS" },
    { id: "leuco", name: "Leucocytes", unit: "/mm³", min: 4000, max: 10000, type: "number", category: "NFS" },
    { id: "poly_neutro", name: "Polynucléaires neutrophiles", unit: "%", min: 40, max: 75, type: "number", category: "NFS" },
    { id: "poly_eosino", name: "Polynucléaires éosinophiles", unit: "%", min: 1, max: 5, type: "number", category: "NFS" },
    { id: "poly_baso", name: "Polynucléaires basophiles", unit: "%", min: 0, max: 1, type: "number", category: "NFS" },
    { id: "lympho", name: "Lymphocytes", unit: "%", min: 20, max: 45, type: "number", category: "NFS" },
    { id: "mono", name: "Monocytes", unit: "%", min: 2, max: 10, type: "number", category: "NFS" },
    { id: "plaq", name: "Plaquettes", unit: "/mm³", min: 150000, max: 450000, type: "number", category: "NFS" },
    { id: "vs", name: "VS (Vitesse sédimentation)", unit: "mm/h", min: 0, max: 20, type: "number", category: "NFS" }
  ],
  glycemie_a_jeun: [
    { id: "glyc_aj", name: "Glycémie à jeun", unit: "g/L", min: 0.7, max: 1.1, type: "number", category: "Biochimie" }
  ],
  glycemie_post_prandiale: [
    { id: "glyc_pp", name: "Glycémie post-prandiale", unit: "g/L", min: 0.7, max: 1.4, type: "number", category: "Biochimie" }
  ],
  uree: [
    { id: "uree", name: "Urée", unit: "g/L", min: 0.15, max: 0.45, type: "number", category: "Biochimie" }
  ],
  creatinine: [
    { id: "creat", name: "Créatinine", unit: "mg/L", min: 5, max: 12, type: "number", category: "Biochimie" }
  ],
  cholesterol: [
    { id: "chol_tot", name: "Cholestérol total", unit: "g/L", min: 1.5, max: 2.5, type: "number", category: "Biochimie" }
  ],
  triglycerides: [
    { id: "trigly", name: "Triglycérides", unit: "g/L", min: 0.4, max: 1.5, type: "number", category: "Biochimie" }
  ],
  tdr_paludisme: [
    { 
      id: "tdr_palu", 
      name: "TDR Paludisme", 
      unit: "Index", 
      min: 0, 
      max: 100, 
      type: "select", 
      options: ["Négatif", "Positif (Pf)", "Positif (autres)"],
      category: "Sérologie" 
    }
  ],
  vih: [
    { 
      id: "vih_status", 
      name: "VIH", 
      unit: "Index", 
      min: 0, 
      max: 100, 
      type: "select", 
      options: ["Négatif", "Positif", "Indéterminé"],
      category: "Sérologie" 
    }
  ],
  hepatite_b: [
    { 
      id: "hbv_status", 
      name: "Hépatite B (Ag HBs)", 
      unit: "Index", 
      min: 0, 
      max: 100, 
      type: "select", 
      options: ["Négatif", "Positif"],
      category: "Sérologie" 
    }
  ],
  hepatite_c: [
    { 
      id: "hcv_status", 
      name: "Hépatite C", 
      unit: "Index", 
      min: 0, 
      max: 100, 
      type: "select", 
      options: ["Négatif", "Positif"],
      category: "Sérologie" 
    }
  ],
  crp: [
    { id: "crp", name: "CRP", unit: "mg/L", min: 0, max: 5, type: "number", category: "Infectiologie" }
  ]
};

// Available exams for checking/unchecking
const LAB_EXAM_TYPES = [
  { id: "nfs", label: "NFS", category: "HEMATOLOGY", description: "Numération Formule Sanguine" },
  { id: "tdr_paludisme", label: "TDR Paludisme", category: "SEROLOGY", description: "Test Diagnostic Rapide Paludisme" },
  { id: "glycemie_a_jeun", label: "Glycémie à jeun", category: "BIOCHEMISTRY", description: "Volume de glucose à jeun" },
  { id: "glycemie_post_prandiale", label: "Glycémie post-prandiale", category: "BIOCHEMISTRY", description: "Volume de glucose après repas" },
  { id: "urée", label: "Urée", category: "BIOCHEMISTRY", description: "Fonction rénale" },
  { id: "creatinine", label: "Créatinine", category: "BIOCHEMISTRY", description: "Dépistage rénal avancé" },
  { id: "cholesterol", label: "Cholestérol total", category: "BIOCHEMISTRY", description: "Bilan lipidique" },
  { id: "triglycerides", label: "Triglycérides", category: "BIOCHEMISTRY", description: "Bilan lipidique" },
  { id: "vih", label: "VIH", category: "SEROLOGY", description: "Immunologie VIH 1 & 2" },
  { id: "hepatite_b", label: "Hépatite B", category: "SEROLOGY", description: "Antigène HBs" },
  { id: "hepatite_c", label: "Hépatite C", category: "SEROLOGY", description: "Sérologie hépatite C" },
  { id: "crp", label: "CRP", category: "SEROLOGY", description: "Protéine C-Réactive" }
];

export const IntelligentLabEditor: React.FC<IntelligentLabEditorProps> = ({
  selectedTest,
  patient,
  token,
  onSaveSuccess,
  showToast,
  onBackToList,
  userRole = "LAB_TECH",
  writeAuditLog
}) => {
  // Checkboxes for prescribed exams (initially checked based on selectedTest.testName)
  const [checkedExams, setCheckedExams] = useState<Record<string, boolean>>({});

  // Form states
  const [values, setValues] = useState<Record<string, string>>({});
  const [remarks, setRemarks] = useState("");
  const [sampleQuality, setSampleQuality] = useState<"CONFORME" | "NON_CONFORME" | "A_CONTROLER">("CONFORME");
  const [nonConformeReason, setNonConformeReason] = useState("");
  
  // Signature info
  const [technicianName, setTechnicianName] = useState("Mariam Koné");
  const [signaturePassword, setSignaturePassword] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [ipMachine, setIpMachine] = useState("192.168.1.45");
  const [isSigned, setIsSigned] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);

  // Automate machine attachment simulation
  const [attachedMachine, setAttachedMachine] = useState<string>("Cobas e411 / Sysmex XN-350");
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; timestamp: string } | null>(null);
  const [isInjectingFile, setIsInjectingFile] = useState(false);

  // Autocomplete state
  const [showAtSuggestions, setShowAtSuggestions] = useState(false);
  const [atQuery, setAtQuery] = useState("");
  const remarksRef = useRef<HTMLTextAreaElement | null>(null);

  // Preview final report state
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  // Built-in @ commands
  const AT_COMMANDS = [
    { cmd: "@conforme", text: "Prélèvement conforme" },
    { cmd: "@hemolyse", text: "Échantillon hémolysé" },
    { 
      cmd: "@telephone", 
      text: () => {
        const d = new Date();
        const df = d.toLocaleDateString("fr-FR");
        return `Résultat transmis au médecin le ${df}`;
      } 
    },
    { cmd: "@urgence", text: "Résultat critique transmis en urgence." },
    { cmd: "@fin", text: "Fin du compte-rendu. Signé électroniquement." }
  ];

  // Map incoming test content to initialize the checkboxes
  useEffect(() => {
    const defaultChecks: Record<string, boolean> = {};
    const nameLower = selectedTest.testName.toLowerCase();

    // Auto check matching libraries
    if (nameLower.includes("nfs") || nameLower.includes("sanguine") || nameLower.includes("hémogramme") || nameLower.includes("hematology")) {
      defaultChecks["nfs"] = true;
    }
    if (nameLower.includes("tdr") || nameLower.includes("paludisme") || nameLower.includes("goutte")) {
      defaultChecks["tdr_paludisme"] = true;
    }
    if (nameLower.includes("glycémie") || nameLower.includes("glucose")) {
      if (nameLower.includes("post-prandiale")) {
        defaultChecks["glycemie_post_prandiale"] = true;
      } else {
        defaultChecks["glycemie_a_jeun"] = true;
      }
    }
    if (nameLower.includes("créatinine") || nameLower.includes("créat")) {
      defaultChecks["creatinine"] = true;
    }
    if (nameLower.includes("urée")) {
      defaultChecks["urée"] = true;
    }
    if (nameLower.includes("vih")) {
      defaultChecks["vih"] = true;
    }
    if (nameLower.includes("hépatite b") || nameLower.includes("hbs")) {
      defaultChecks["hepatite_b"] = true;
    }
    if (nameLower.includes("hépatite c")) {
      defaultChecks["hepatite_c"] = true;
    }
    if (nameLower.includes("crp") || nameLower.includes("c-réactive")) {
      defaultChecks["crp"] = true;
    }

    // Default to NFS if absolutely nothing matched so we show some data structure
    if (Object.keys(defaultChecks).length === 0) {
      defaultChecks["nfs"] = true;
    }

    // Load any saved results if they exist In PostgreSQL JSON string format
    let existingParams: Record<string, string> = {};
    if (selectedTest.results) {
      try {
        const parsed = JSON.parse(selectedTest.results);
        if (parsed.parameters && Array.isArray(parsed.parameters)) {
          parsed.parameters.forEach((param: any) => {
            existingParams[param.id] = param.value;
          });
        }
        if (parsed.checkedExams) {
          setCheckedExams(parsed.checkedExams);
        } else {
          setCheckedExams(defaultChecks);
        }
        if (parsed.interpretation || parsed.observations) {
          setRemarks(parsed.observations || parsed.interpretation || "");
        }
        if (parsed.sampleQuality) {
          setSampleQuality(parsed.sampleQuality);
        }
        if (parsed.nonConformeReason) {
          setNonConformeReason(parsed.nonConformeReason);
        }
        if (parsed.technicianName) {
          setTechnicianName(parsed.technicianName);
        }
        if (parsed.isSigned) {
          setIsSigned(parsed.isSigned);
          setSignedAt(parsed.signedAt || "");
          setIpMachine(parsed.ipMachine || "192.168.1.45");
        }
        if (parsed.attachedFile) {
          setAttachedFile(parsed.attachedFile);
        }
      } catch (err) {
        console.warn("Could not load parsed biochemical results", err);
        setCheckedExams(defaultChecks);
      }
    } else {
      setCheckedExams(defaultChecks);
    }

    // Pre-fill parameters with default dummy or normal values for easy review
    const initialVals: Record<string, string> = { ...existingParams };
    Object.keys(PARAMETER_LIBRARY).forEach(examId => {
      PARAMETER_LIBRARY[examId].forEach(p => {
        if (!initialVals[p.id]) {
          // Put median value
          if (p.type === "number") {
            const med = (p.min + p.max) / 2;
            initialVals[p.id] = p.id === "crp" ? "2.1" : med.toFixed(p.id === "gr" ? 1 : 0);
          } else if (p.type === "select") {
            initialVals[p.id] = "Négatif";
          }
        }
      });
    });

    setValues(initialVals);
    
    // Auto-generate realistic IP for the technician machine
    setIpMachine("192.168.1." + Math.floor(Math.random() * 80 + 20));
  }, [selectedTest]);

  // Handle keyboard autocomplete popup for observations
  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setRemarks(text);

    // Look for "@" trigger near cursor
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/\s/).pop() || "";

    if (lastWord.startsWith("@")) {
      const q = lastWord.substring(1).toLowerCase();
      setAtQuery(q);
      setShowAtSuggestions(true);
    } else {
      setShowAtSuggestions(false);
    }
  };

  // Insert targeted dynamic text model
  const handleInsertAtCommand = (replacement: string) => {
    if (!remarksRef.current) return;
    const textbox = remarksRef.current;
    const text = remarks;
    const cursorPosition = textbox.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    const textAfterCursor = text.substring(cursorPosition);

    const words = textBeforeCursor.split(/\s/);
    // Remove the partial @word
    words.pop();
    const joinedBefore = words.join(" ");
    const glue = joinedBefore ? " " : "";

    const newText = joinedBefore + glue + replacement + " " + textAfterCursor;
    setRemarks(newText);
    setShowAtSuggestions(false);

    // Reset cursor position
    setTimeout(() => {
      textbox.focus();
      const newPos = (joinedBefore + glue + replacement + " ").length;
      textbox.setSelectionRange(newPos, newPos);
    }, 50);
  };

  // Verify parameters out of boundaries
  const getOutRangeAlert = (param: ParameterDefinition, valStr: string) => {
    if (param.type === "select") {
      if (valStr && valStr !== "Négatif" && valStr !== "Normal") {
        return { isAlert: true, type: "CRITICAL", label: "Positif / Anormal" };
      }
      return null;
    }

    const val = parseFloat(valStr);
    if (isNaN(val)) return null;

    if (val < param.min) {
      return { isAlert: true, type: "BAS", label: `Bas (inférieur à ${param.min})` };
    }
    if (val > param.max) {
      return { isAlert: true, type: "HAUT", label: `Elevé (supérieur à ${param.max})` };
    }
    return null;
  };

  // Toggle dynamic checked exam checkbox
  const handleExamCheckboxToggle = (examId: string) => {
    if (isSigned) {
      showToast("Cet examen est verrouillé par signature électronique.", "warning");
      return;
    }
    setCheckedExams(prev => ({ ...prev, [examId]: !prev[examId] }));
  };

  // Simulate automated lab machines payload injection
  const handleInjectMachineFile = () => {
    setIsInjectingFile(true);
    setTimeout(() => {
      const filename = `sysmex-xn350-chem_${selectedTest.id.substring(0, 6)}.xlsx`;
      setAttachedFile({
        name: filename,
        size: "312 KB",
        timestamp: new Date().toLocaleString()
      });
      setIsInjectingFile(false);
      showToast("Analyses importées automatiquement de l'automate !", "success");
      
      // Seed some out of normal values to show physiological alert alerts
      const newValues = { ...values };
      // NFS
      newValues["hemo"] = "11.2"; // Low (normal 12 - 16)
      newValues["leuco"] = "12500"; // High (normal 4k - 10k)
      newValues["plaq"] = "142000"; // Low (normal 150k - 450k)
      // TDR
      newValues["tdr_palu"] = "Positif (Plasmodium falciparum)"; // Out of range select
      // VIH
      newValues["vih_status"] = "Négatif";
      // CRP
      newValues["crp"] = "48.2"; // Heavily out of range (normal < 5)

      setValues(newValues);
      setRemarks("Prélèvement conforme. Importation automate réussie. Traces d'urgences identifiées d'après l'audit immunologique.");
      if (writeAuditLog) {
        writeAuditLog("LAB_AUTOMATE_IMPORT", `Fichier automate ${filename} rattaché aux analyses du patient ${patient.lastName.toUpperCase()}`);
      }
    }, 1000);
  };

  // Save changes as draft
  const handleSaveDraft = async () => {
    try {
      const activeParams: any[] = [];
      Object.keys(checkedExams).forEach(examId => {
        if (checkedExams[examId] && PARAMETER_LIBRARY[examId]) {
          PARAMETER_LIBRARY[examId].forEach(param => {
            activeParams.push({
              id: param.id,
              name: param.name,
              value: values[param.id] || "",
              unit: param.unit,
              reference: `${param.min}-${param.max} ${param.unit}`,
              interpretation: getOutRangeAlert(param, values[param.id] || "") ? "Anormal" : "Normal"
            });
          });
        }
      });

      const resultsPayload = {
        checkedExams,
        parameters: activeParams,
        observations: remarks,
        sampleQuality,
        nonConformeReason: sampleQuality === "NON_CONFORME" ? nonConformeReason : "",
        technicianName,
        attachedFile,
        isSigned: false
      };

      const res = await fetch(`/api/labtests/${selectedTest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "PROCESSING",
          results: JSON.stringify(resultsPayload)
        })
      });

      if (!res.ok) throw new Error("Could not save lab draft");
      
      showToast("Draft de laboratoire sauvegardé !", "success");
      if (writeAuditLog) {
        writeAuditLog("LAB_SAVE_DRAFT", `Brouillon de paillasse sauvegardé pour l'examen de ${patient.lastName.toUpperCase()}`);
      }
      onSaveSuccess(await res.json());
    } catch (err: any) {
      showToast("Erreur lors de la sauvegarde : " + err.message, "error");
    }
  };

  // Request credentials for secure signature
  const triggerSignaturePrompt = () => {
    if (Object.keys(checkedExams).filter(k => checkedExams[k]).length === 0) {
      showToast("Veuillez sélectionner au moins un examen à analyser.", "error");
      return;
    }
    
    // Check if any critical parameters are empty
    let emptyParamName = "";
    Object.keys(checkedExams).forEach(examId => {
      if (checkedExams[examId] && PARAMETER_LIBRARY[examId]) {
        PARAMETER_LIBRARY[examId].forEach(param => {
          if (!values[param.id]) {
            emptyParamName = param.name;
          }
        });
      }
    });

    if (emptyParamName) {
      showToast(`Le paramètre "${emptyParamName}" n'est pas renseigné ! Veuillez remplir toutes les valeurs manuelles ou automates.`, "warning");
      return;
    }

    setShowSignatureModal(true);
  };

  // Perform secure electronic signature with password check
  const handleSignAndCommit = async () => {
    if (!signaturePassword) {
      showToast("Le mot de passe de signature sécurisé est obligatoire !", "error");
      return;
    }

    try {
      const activeParams: any[] = [];
      Object.keys(checkedExams).forEach(examId => {
        if (checkedExams[examId] && PARAMETER_LIBRARY[examId]) {
          PARAMETER_LIBRARY[examId].forEach(param => {
            activeParams.push({
              id: param.id,
              name: param.name,
              value: values[param.id] || "",
              unit: param.unit,
              reference: param.type === "select" ? "Index qualitatif" : `${param.min}-${param.max}`,
              interpretation: getOutRangeAlert(param, values[param.id] || "") ? "Hors Norme" : "Normal"
            });
          });
        }
      });

      const timestamp = new Date().toLocaleString("fr-FR");
      const resultsPayload = {
        checkedExams,
        parameters: activeParams,
        observations: remarks || "Fin du compte-rendu. Analyses réalisées sans anomalie technique majeure.",
        sampleQuality,
        nonConformeReason: sampleQuality === "NON_CONFORME" ? nonConformeReason : "",
        technicianName,
        attachedFile,
        isSigned: true,
        signedAt: timestamp,
        ipMachine
      };

      // Set state locally
      setIsSigned(true);
      setSignedAt(timestamp);
      setShowSignatureModal(false);

      // Call API to store in PostgreSQL and change status to VALIDATED
      const res = await fetch(`/api/labtests/${selectedTest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "VALIDATED",
          results: JSON.stringify(resultsPayload)
        })
      });

      if (!res.ok) throw new Error("Could not execute signature submission");

      showToast(`Examen bio-certifié avec succès ! Dossier verrouillé et transmis en temps réel au médecin prescripteur Dr. ${selectedTest.requestedBy || "Ibrahim Touré"}.`, "success");
      
      if (writeAuditLog) {
        writeAuditLog("LAB_BIO_SIGNATURE", `Analyse bio-signée par le laborantin ${technicianName} pour le patient ${patient.lastName.toUpperCase()} (${selectedTest.testName}). Hash: ${Math.random().toString(16).substring(2, 10).toUpperCase()}`);
      }
      
      const responseData = await res.json();
      onSaveSuccess(responseData);
    } catch (err: any) {
      showToast("Erreur de sceau électronique : " + err.message, "error");
    }
  };

  // Filter parameters currently active to display in Right box
  const getActiveParameters = () => {
    const list: { param: ParameterDefinition; examId: string }[] = [];
    Object.keys(checkedExams).forEach(examId => {
      if (checkedExams[examId] && PARAMETER_LIBRARY[examId]) {
        PARAMETER_LIBRARY[examId].forEach(p => {
          list.push({ param: p, examId });
        });
      }
    });
    return list;
  };

  const activeParameters = getActiveParameters();

  return (
    <div className="bg-slate-50 p-1.5 rounded-3xl border border-slate-200/90 shadow-xl space-y-6" id="medisahel-intelligent-lab-station">
      
      {/* Brand header panel with dynamic color indicators */}
      <div className="bg-gradient-to-r from-teal-900 to-indigo-950 p-6 rounded-2xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-teal-800/10 rounded-full blur-2xl" />
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="bg-white/10 p-3 rounded-xl border border-white/10 text-teal-300">
            <FlaskConical className="h-6.5 w-6.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-teal-400/20 text-teal-300 font-bold px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                CENTRIFUGE USE ONLY
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <h2 className="text-lg font-extrabold tracking-tight font-sans mt-1">🔬 MÉDISAHEL LAB – STATION DE TRAVAIL TECHNICIEN</h2>
            <p className="text-xs text-teal-200/80 font-mono mt-0.5">Automates Synchro & Sceau de validation électronique biologique</p>
          </div>
        </div>

        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer transition-all relative z-10"
          >
            ← Retourner à la file d'attente
          </button>
        )}
      </div>

      {/* Demande details panel (the upper summary bar) */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs shadow-xs relative">
        <div className="absolute -right-1 -top-1">
          {isSigned ? (
            <span className="bg-emerald-150 text-emerald-900 font-extrabold px-3 py-1 text-[10px] font-mono border border-emerald-300 rounded-bl-xl rounded-tr-xl flex items-center gap-1 shadow-sm uppercase">
              <Check className="h-3.5 w-3.5 text-emerald-700" /> Sceau Certifié & Transmis
            </span>
          ) : (
            <span className="bg-amber-150 text-amber-900 font-extrabold px-3 py-1 text-[10px] font-mono border border-amber-350 rounded-bl-xl rounded-tr-xl flex items-center gap-1 shadow-sm uppercase">
              <Clock className="h-3.5 w-3.5 text-amber-700 animate-spin" /> Saisie Biologique en cours
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">N° DEMANDE EXAMEN</p>
          <p className="font-mono text-slate-900 font-black text-xs">LAB-2026-{selectedTest.id.substring(0, 4).toUpperCase()}</p>
          <p className="text-slate-500 text-[10.5px]">N° Dossier: {selectedTest.id}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">PATIENT DU CONTRÔLE</p>
          <p className="font-extrabold text-slate-900 font-sans text-xs">{patient.lastName.toUpperCase()} {patient.firstName}</p>
          <p className="text-slate-500 text-[10.5px]">Identifiant patient: P2026-0{patient.nationalId || "123"}</p>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">MÉDECIN PRESCRIPTEUR</p>
          <p className="font-semibold text-slate-900 font-sans text-xs">Dr. {selectedTest.requestedBy || "Ibrahim Touré"}</p>
          <p className="text-slate-500 text-[10.5px]">Consul: CONSUL-{selectedTest.id.substring(0,3).toUpperCase()}</p>
        </div>

        <div className="space-y-1.5 col-span-2 lg:col-span-1 pt-1 lg:pt-0">
          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">STATUT COMPTABLE</p>
          <div className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-805 rounded-lg border border-emerald-250 font-mono font-bold text-[10px]">
            ✅ PAYÉ ET VALIDÉ
          </div>
        </div>
      </div>

      {/* Main Two-Column Panel (Left: Examens prescrits, Right: Saisie des résultats) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: EXAMENS PRESCRITS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
              📋 Examens prescrits
            </h4>
            <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
              {Object.keys(checkedExams).filter(k => checkedExams[k]).length} actif(s)
            </span>
          </div>

          <p className="text-[11px] text-slate-450 leading-relaxed">
            Cochez les analyses demandées par le médecin clinicien. Cela chargera les constantes adéquates dans le tableau de saisie.
          </p>

          <div className="space-y-2 mt-4 max-h-[420px] overflow-y-auto pr-1">
            {LAB_EXAM_TYPES.map(exam => (
              <label 
                key={exam.id}
                onClick={() => handleExamCheckboxToggle(exam.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                  checkedExams[exam.id] 
                    ? "bg-teal-50/40 border-teal-300 ring-1 ring-teal-500/10 font-bold" 
                    : "bg-stone-50/30 hover:bg-slate-50 border-slate-200"
                } ${isSigned ? "opacity-75 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <input 
                  type="checkbox"
                  checked={!!checkedExams[exam.id]}
                  readOnly
                  disabled={isSigned}
                  className="h-4 w-4 accent-teal-700 rounded border-slate-300 mt-0.5 text-teal-600 focus:ring-teal-500"
                />
                <div>
                  <div className="text-[12px] text-slate-900 font-bold leading-tight">{exam.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{exam.description}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Automate integration action */}
          <div className="border-t border-slate-100 pt-4 mt-2">
            <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              💻 SYNCHRONISATION AUTOMATES DIRECTE
            </h5>
            <p className="text-[10.5px] text-slate-500 leading-snug mb-3">
              Intégrer en temps réel les constantes issues des automates rattachés (Cobas, Sysmex) par déversement de fichier brut securisé.
            </p>
            {attachedFile ? (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-emerald-800 flex items-center gap-1 truncate">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                    {attachedFile.name}
                  </span>
                  <button
                    type="button"
                    disabled={isSigned}
                    onClick={() => setAttachedFile(null)}
                    className="text-stone-400 hover:text-rose-600 disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="text-[9.5px] text-slate-500 flex justify-between font-mono">
                  <span>Taille: {attachedFile.size}</span>
                  <span>IP: {ipMachine}</span>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSigned || isInjectingFile}
                onClick={handleInjectMachineFile}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                {isInjectingFile ? "Lecture de la paillasse..." : "Déverser Données Automate"}
              </button>
            )}
          </div>
        </div>

        {/* Right column: SAISIE DES RÉSULTATS (2/3 width) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider font-sans flex items-center gap-1.5">
              🧪 Saisie des résultats
            </h4>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono font-bold">
              {activeParameters.length} paramètre(s) de mesure
            </span>
          </div>

          {activeParameters.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <FlaskConical className="h-12 w-12 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 italic max-w-sm mx-auto">
                Aucun examen sélectionné. Cochez les analyses à paillasse sur le volet de gauche pour démarrer la saisie structurée.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-150 text-slate-405 font-mono uppercase tracking-wider text-[10px] bg-slate-50/50">
                    <th className="p-2 pl-3">Paramètre</th>
                    <th className="p-2">Valeur Mesurée</th>
                    <th className="p-2">Normes de Référence</th>
                    <th className="p-2">Unité</th>
                    <th className="p-2 pr-3 text-right">Interprétation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeParameters.map(({ param }) => {
                    const alert = getOutRangeAlert(param, values[param.id] || "");
                    return (
                      <tr key={param.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-2.5 pl-3">
                          <span className="font-bold text-slate-800 text-[12px]">{param.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono block">({param.category})</span>
                        </td>
                        <td className="p-2.5">
                          {param.type === "select" ? (
                            <select
                              value={values[param.id] || ""}
                              disabled={isSigned}
                              onChange={e => setValues(prev => ({ ...prev, [param.id]: e.target.value }))}
                              className={`w-44 h-8 px-2 bg-slate-50/40 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-teal-700 focus:outline-none focus:bg-white ${
                                alert 
                                  ? "border-rose-400 bg-rose-50 text-rose-900 font-extrabold focus:ring-rose-500" 
                                  : values[param.id] === "Négatif" || values[param.id] === "Normal"
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900 focus:ring-emerald-500"
                                  : ""
                              } ${isSigned ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              {param.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="relative">
                              <input
                                type="text"
                                value={values[param.id] || ""}
                                disabled={isSigned}
                                onChange={e => setValues(prev => ({ ...prev, [param.id]: e.target.value }))}
                                className={`w-28 h-8 px-2.5 border rounded-lg text-xs font-bold font-mono focus:ring-1 focus:outline-none ${
                                  alert?.type === "BAS"
                                    ? "border-blue-400 bg-blue-50 text-blue-900 focus:ring-blue-500"
                                    : alert?.type === "HAUT"
                                    ? "border-rose-400 bg-rose-50 text-rose-900 focus:ring-rose-500 font-extrabold"
                                    : values[param.id]
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-950 focus:ring-emerald-500"
                                    : "border-slate-300 text-slate-905 bg-slate-50/40"
                                } ${isSigned ? "opacity-65 cursor-not-allowed" : ""}`}
                                placeholder="Mesure"
                              />
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-500 text-[11px]">
                          {param.type === "select" ? (
                            <span className="text-slate-400 italic">Index Qualitatif</span>
                          ) : (
                            <span className="font-semibold text-slate-600">{param.min} – {param.max}</span>
                          )}
                        </td>
                        <td className="p-2.5 font-mono text-slate-400 uppercase text-[10.5px]">
                          {param.unit}
                        </td>
                        <td className="p-2.5 pr-3 text-right">
                          {alert ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black font-mono uppercase tracking-wide ${
                              alert.type === "BAS" 
                                ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                : "bg-rose-100 text-rose-800 border border-rose-200"
                            }`}>
                              {alert.type === "BAS" ? "🔵 " : "🔴 "} {alert.label}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                              🟢 Normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Observations & Autocomplete Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <label className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5 uppercase font-sans tracking-wide">
            📝 Observations / Commentaires Techniques
          </label>
          <span className="text-[10px] text-slate-405 font-mono">
            💡 Astuce: Tapez un code <span className="font-bold text-teal-700">@</span> pour activer les modèles d'analyses
          </span>
        </div>

        <div className="relative">
          <textarea
            ref={remarksRef}
            disabled={isSigned}
            value={remarks}
            onChange={handleRemarksChange}
            className={`w-full p-3 border border-slate-250 bg-teal-50/10 rounded-xl h-24 text-[12px] text-slate-900 border-teal-200/50 focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono ${
              isSigned ? "opacity-75 cursor-not-allowed bg-stone-50" : ""
            }`}
            placeholder="Tapez un code commençant par @ pour insérer rapidement des diagnostics récurrents (ex: @conforme, @hemolyse, @controle, @telephone, @urgence)..."
          />

          {/* Floated dynamic @ suggestions trigger */}
          {showAtSuggestions && (
            <div className="absolute left-3 bottom-full mb-1 z-35 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 w-72 overflow-y-auto animate-fade-in divide-y">
              <div className="p-2 bg-slate-50 text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Macro-Modèles @ Laboratoire
              </div>
              {AT_COMMANDS.filter(cmd => cmd.cmd.includes(atQuery)).map((cmd, idx) => {
                const textValue = typeof cmd.text === "function" ? cmd.text() : cmd.text;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInsertAtCommand(textValue)}
                    className="w-full p-2 hover:bg-teal-50 text-left text-xs flex justify-between items-center transition-colors font-mono"
                  >
                    <span className="font-bold text-teal-705 pr-2">{cmd.cmd}</span>
                    <span className="text-[10px] text-slate-500 truncate flex-1 block">{textValue}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Action macro tags for easier clicking (tablet compatible) */}
        <div className="text-xs">
          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1.5 font-mono">
            Saisie d'un clic (Modèles prédéfinis) :
          </p>
          <div className="flex flex-wrap gap-2">
            {AT_COMMANDS.map((item, idx) => {
              const textValue = typeof item.text === "function" ? item.text() : item.text;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isSigned}
                  onClick={() => {
                    const combined = remarks + (remarks ? "\n" : "") + textValue;
                    setRemarks(combined);
                  }}
                  className="bg-slate-100 hover:bg-teal-50 border border-slate-200 text-slate-700 hover:text-teal-900 px-3 py-1.5 rounded-lg text-[10.5px] font-bold transition-all disabled:opacity-50 flex items-center gap-1 font-mono"
                >
                  <span className="text-teal-800 font-black">{item.cmd}</span>
                  <span className="text-slate-400 font-normal">({item.cmd === "@conforme" ? "Conforme" : item.cmd === "@hemolyse" ? "Hémolyse" : item.cmd === "@controle" ? "Double-Contrôle" : "Pli"})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Qualité du Prélèvement Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
        <h4 className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5 uppercase font-sans tracking-wide border-b pb-2">
          🧪 Qualité du prélèvement & Conformité
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div className="flex flex-wrap gap-4 items-center">
            {[
              { id: "CONFORME", label: "🟢 Prélèvement conforme", bg: "bg-emerald-50 text-emerald-800 border-emerald-200" },
              { id: "NON_CONFORME", label: "🔴 Non conforme / Inexploitable", bg: "bg-rose-50 text-rose-800 border-rose-200" },
              { id: "A_CONTROLER", label: "🟡 À contrôler / Flacon suspect", bg: "bg-amber-50 text-amber-800 border-amber-200" }
            ].map(col => (
              <label 
                key={col.id} 
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                  sampleQuality === col.id ? col.bg + " font-bold scale-[1.01]" : "border-slate-200 bg-white"
                } ${isSigned ? "opacity-50 pointer-events-none" : ""}`}
              >
                <input
                  type="radio"
                  name="sample_pref"
                  checked={sampleQuality === col.id}
                  disabled={isSigned}
                  onChange={() => setSampleQuality(col.id as any)}
                  className="h-4 w-4 accent-teal-800"
                />
                <span>{col.label}</span>
              </label>
            ))}
          </div>

          <div>
            {(sampleQuality === "NON_CONFORME" || sampleQuality === "A_CONTROLER") && (
              <div className="space-y-1.5 animate-fade-in">
                <p className="block text-slate-500 font-bold text-[10px] font-mono uppercase">Motif précis ou anomalie identifiée :</p>
                <input
                  type="text"
                  disabled={isSigned}
                  value={nonConformeReason}
                  onChange={e => setNonConformeReason(e.target.value)}
                  className="w-full p-2 border border-rose-250 bg-rose-50/50 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 text-rose-950"
                  placeholder="e.g. Volume insuffisant, tube fêlé, échantillon trop hémolysé..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Signature & Authentication Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-205 shadow-xs space-y-4">
        <h4 className="font-extrabold text-xs text-teal-950 flex items-center gap-1.5 uppercase font-sans tracking-wide">
          🔏 Signature électronique du laborantin
        </h4>

        {isSigned ? (
          <div className="bg-emerald-50 border border-emerald-250 p-4.5 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-emerald-950">ANALYSE INTÉGRALEMENT VALIDÉE ET SIGNÉE ÉLECTRONIQUEMENT</p>
              <p className="text-slate-650 leading-relaxed mt-1 font-mono">
                Signé par : <span className="font-bold underline">{technicianName}</span> (Habilité Biologiste Clinique) <br/>
                Date & Heure : {signedAt || new Date().toLocaleString()} (Scellement UTC) <br/>
                IP Certification : {ipMachine} (Machine ID : MEDISAHEL-STAB-F04)
              </p>
              <div className="mt-3 inline-flex items-center gap-1 text-[9.5px] bg-emerald-100 text-emerald-900 border border-emerald-350 px-2 py-0.5 rounded uppercase font-black tracking-wider">
                🔒 REGISTRE DME VERROUILLÉ (POSTGRESQL)
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50/50 border border-amber-205 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-xs">
              <h5 className="font-bold text-amber-955">Validation de Paillasse avec Sceau Responsable</h5>
              <p className="text-slate-600 leading-normal mt-0.5 max-w-xl">
                La signature électronique sécurisée consolide le bulletin biologique en un document unique dématérialisé. Une fois scellé, le résultat est envoyé au médecin prescripteur en temps réel.
              </p>
            </div>

            <button
              type="button"
              onClick={triggerSignaturePrompt}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
            >
              <CheckSquare className="h-4 w-4" />
              Saisir Identifiants & Signer
            </button>
          </div>
        )}
      </div>

      {/* Footer / Toolbar Actions wrapper */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-slate-200 pt-5 pr-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPdfPreview(true)}
            className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-805 hover:text-indigo-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Eye className="h-4 w-4" />
            📊 Aperçu Résultat (PDF)
          </button>
          
          <button
            type="button"
            onClick={() => {
              window.print();
              showToast("Impression biologique envoyée à l'imprimante thermique locale !", "info");
              if (writeAuditLog) writeAuditLog("LAB_PRINT", `Impression papier du compte-rendu pour le patient ${patient.lastName.toUpperCase()}`);
            }}
            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            🖨️ Imprimer Direct
          </button>
        </div>

        <div className="flex gap-2">
          {!isSigned && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-stone-200 hover:bg-stone-300 border border-stone-300 text-stone-850 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              💾 Sauvegarder Brouillon
            </button>
          )}

          <button
            type="button"
            onClick={isSigned ? () => setShowPdfPreview(true) : triggerSignaturePrompt}
            className={`font-bold py-2.5 px-6 rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md cursor-pointer ${
              isSigned 
                ? "bg-slate-900 border border-slate-950 text-white" 
                : "bg-teal-800 hover:bg-teal-900 text-white"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            {isSigned ? "Compte-Rendu Final Bio-Locké" : "🔏 Signer & Valider l'Examen"}
          </button>
        </div>
      </div>

      {/* DIALOG SIGNATURE MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-300 w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="bg-teal-900 text-white p-5 flex justify-between items-center">
              <span className="font-extrabold text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                🔏 Autorisation de Signature Biologique
              </span>
              <button 
                onClick={() => setShowSignatureModal(false)}
                className="text-white hover:bg-white/10 rounded-lg p-1"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Je soussigné(e) certifie avoir réalisé les analyses biologiques ci-dessus et attester l'exactitude des résultats de mesures précitées.
              </p>

              <div>
                <label className="block text-slate-500 font-bold text-[10px] font-mono uppercase mb-1">
                  Laborantin Signataire du Service :
                </label>
                <div className="relative">
                  <select
                    value={technicianName}
                    onChange={e => setTechnicianName(e.target.value)}
                    className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                  >
                    <option value="Mariam Koné">Mariam Koné (Habilité Sanguine)</option>
                    <option value="Alou Diallo">Dr. Alou Diallo (Biologiste Principal)</option>
                    <option value="Fanta Sow">Fanta Sow (Technicienne Supérieure)</option>
                    <option value="Ousmane Coulibaly">Ousmane Coulibaly (Qualiticien Lab)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold text-[10px] font-mono uppercase mb-1">
                  Mot de passe sécurisé : <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={signaturePassword}
                  onChange={e => setSignaturePassword(e.target.value)}
                  className="w-full h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                  placeholder="Saisissez votre code PIN ou mot de passe de laborant..."
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl font-mono text-[10px] text-slate-500 space-y-1">
                <div>Certification IP : <span className="text-slate-800 font-bold">{ipMachine}</span> (Automatique)</div>
                <div>Horodatage système : <span className="text-slate-800 font-bold">{new Date().toLocaleString("fr-FR")}</span> (Seulement rattaché)</div>
                <div>Statut cryptographie : <span className="text-emerald-700 font-bold">SSL Chiffré / AES-256 Actif</span></div>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-600 mt-0.5 shrink-0" />
                <div className="text-[11px] text-rose-950 font-medium leading-tight">
                  ⚠️ Une fois signé, le résultat est envoyé au médecin prescripteur immédiatement. 
                  🔒 Le caissier et la réception n'auront pas accès à ce résultat confidentiel d'après les règles de sécurité.
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSignAndCommit}
                className="px-5 py-2.5 bg-teal-850 hover:bg-teal-900 border border-teal-900 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                CONFIRMER LA SIGNATURE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC COMPTE RENDU PDF DIALOG COMPONENT */}
      {showPdfPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-250 w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in-up">
            
            {/* Header control bar */}
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center font-mono print:hidden">
              <span className="text-xs font-bold flex items-center gap-1">
                🛡️ BULLETIN BIOLOGIQUE CONSOLIDÉ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportToPDF("lab-report-pdf-page", `Bulletin_Examen_Lab_${selectedTest.id.substring(0, 5)}`)}
                  className="px-3.5 py-1.5 bg-teal-650 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all uppercase"
                >
                  <Printer className="h-3 w-3" /> Exporter PDF / Imprimer
                </button>
                <button 
                  onClick={() => setShowPdfPreview(false)}
                  className="text-white hover:bg-white/10 rounded-lg p-1 cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Simulated exact PDF Page Paper view matching instructions */}
            <div className="p-8 max-h-[500px] overflow-y-auto bg-stone-50/50">
              <div className="bg-white p-8 border border-slate-250 shadow-md max-w-2xl mx-auto rounded-lg text-slate-800 space-y-6" id="lab-report-pdf-page">
                
                {/* PDF Header Logo and address */}
                <div className="border-b-2 border-teal-700 pb-3 flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h2 className="text-sm font-black tracking-wider text-teal-950 font-sans uppercase">
                      MÉDISAHEL CLINIQUE BAMAKO V2
                    </h2>
                    <p className="text-[10px] text-teal-800 font-bold font-mono">
                      Laboratoire d'Analyses Médicales Agrée M-2026
                    </p>
                    <p className="text-[9.5px] text-slate-500 font-mono">
                      Hamdallaye ACI 2000, Bamako – Tél: +223 73 65 14 67 / +223 20 22 14 67
                    </p>
                  </div>
                  <div className="text-right text-[9.5px] text-slate-400 font-mono">
                    <p>Mali Réf: LAB-{selectedTest.id.substring(0, 5).toUpperCase()}</p>
                    <p>DME Synchro: SQL-Active</p>
                  </div>
                </div>

                {/* PDF Title */}
                <div className="text-center bg-teal-50/35 border-y border-teal-200 py-2.5">
                  <h3 className="text-[12px] font-black text-teal-950 uppercase tracking-widest font-mono">
                    COMPTE-RENDU D'ANALYSES BIOLOGIQUES
                  </h3>
                </div>

                {/* Patient/Metadata info block */}
                <div className="grid grid-cols-2 gap-4 text-[11px] bg-slate-50/50 p-4 rounded-xl border">
                  <div className="space-y-1">
                    <p>Patient : <span className="font-extrabold text-slate-900">{patient.lastName.toUpperCase()} {patient.firstName}</span></p>
                    <p>DDN : <span className="font-semibold text-slate-700">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("fr-FR") : "13/06/1994"}</span> | Genre : {patient.gender === "M" ? "Masculin" : "Féminin"}</p>
                    <p>Identifiant DME : <span className="font-mono text-slate-600">P2026-0{patient.nationalId || "123"}</span></p>
                  </div>

                  <div className="space-y-1 text-right">
                    <p>Médecin prescripteur : <span className="font-bold text-slate-900">Dr. {selectedTest.requestedBy || "Ibrahim Touré"}</span></p>
                    <p>Date d'analyse : <span className="font-semibold text-slate-700">{signedAt ? signedAt.split(" ")[0] : new Date().toLocaleDateString("fr-FR")}</span></p>
                    <p>Prélèvement : <span className="font-mono text-emerald-700 font-bold uppercase">{sampleQuality}</span></p>
                  </div>
                </div>

                {/* Main Results Table in PDF */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider font-mono border-b pb-1">
                    RÉSULTATS DE MESURES :
                  </h4>

                  <div className="border rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-[11px]">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-500 font-mono font-bold">
                          <th className="p-2 Pl-3">Analyse / Paramètre</th>
                          <th className="p-2 text-center">Valeur</th>
                          <th className="p-2 text-center font-mono">Norme</th>
                          <th className="p-2">Unité</th>
                          <th className="p-2 pr-3 text-right">Interprétation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-800">
                        {activeParameters.map(({ param }) => {
                          const val = values[param.id] || "";
                          const alert = getOutRangeAlert(param, val);
                          return (
                            <tr key={param.id} className="hover:bg-slate-50/50">
                              <td className="p-2 pl-3 font-semibold">{param.name}</td>
                              <td className="p-2 text-center font-bold font-mono">{val || "N/A"}</td>
                              <td className="p-2 text-center font-mono text-slate-500">
                                {param.type === "select" ? "-" : `${param.min}-${param.max}`}
                              </td>
                              <td className="p-2 font-mono text-slate-400 lowercase">{param.unit}</td>
                              <td className="p-2 pr-3 text-right font-bold text-[10px]">
                                {alert ? (
                                  <span className={alert.type === "BAS" ? "text-blue-700" : "text-rose-700"}>
                                    {alert.type === "BAS" ? "🔵 " : "🔴 "} {alert.label}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700">
                                    🟢 Normal
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks & Observations Block in PDF */}
                <div className="space-y-1.5 bg-stone-50 border-l-3 border-teal-700 p-3.5 rounded-r-xl">
                  <p className="text-[10px] font-mono font-black text-teal-950 uppercase">Observations de paillasse :</p>
                  <p className="text-[11px] text-slate-700 italic leading-snug">
                    {remarks || "Prélèvement conforme. Analyse certifiée conforme."}
                  </p>
                </div>

                {/* PDF Signature space */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="text-[10.5px] text-slate-500 space-y-1 font-mono">
                    <p>Certification : <span className="font-semibold text-slate-700">AES-256 Scellé</span></p>
                    <p>IP machine : {ipMachine}</p>
                    <p className="text-[9.5px]">Ce bulletin a valeur légale conforme d'original.</p>
                  </div>

                  <div className="text-right text-[11px] space-y-1">
                    <p className="font-bold text-slate-900">Dr/Laborantin de Service</p>
                    <p className="font-mono text-slate-500">{technicianName}</p>
                    {isSigned ? (
                      <div className="mt-2 inline-block border-2 border-emerald-500 text-emerald-700 bg-emerald-50 px-3 py-1 font-mono text-[9px] font-black rounded rotate-1 tracking-widest uppercase">
                        ✓ SIGNATURE ÉLECTRONIQUE
                      </div>
                    ) : (
                      <div className="mt-2 inline-block border-2 border-amber-500 text-amber-700 bg-amber-50 px-3 py-1 font-mono text-[9px] font-black rounded rotate-1 tracking-widest uppercase">
                        DOUBLON NON VALIDÉ
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t flex justify-between items-center">
              <span className="text-[11px] font-mono text-slate-400">
                Machine : {attachedMachine}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPdfPreview(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-800"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                    showToast("Envoi impression biologique...", "success");
                  }}
                  className="px-5 py-2.5 bg-teal-800 hover:bg-teal-700 border border-teal-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  🖨️ Imprimer la farde
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
