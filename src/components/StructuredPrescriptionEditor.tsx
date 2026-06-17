import React, { useState, useEffect, useRef } from "react";
import { 
  Calendar, User, Plus, Trash2, Edit2, Check, Printer, Send, 
  Save, Sparkles, Bold, Italic, List, Shield, HelpCircle, AlertCircle
} from "lucide-react";
import { Patient, User as ConnectedUser } from "../types.ts";

export interface StructuredPrescriptionEditorProps {
  patients: Patient[];
  currentUser: ConnectedUser;
  activePatient?: Patient | null;
  onSave?: (data: {
    date: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    histoire: string;
    remarque: string;
    medications: string[];
  }) => void;
  onValidate?: (data: {
    date: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    histoire: string;
    remarque: string;
    medications: string[];
  }) => void;
  onPrint?: (data: {
    date: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    histoire: string;
    remarque: string;
    medications: string[];
  }) => void;
  onSendPharmacy?: (data: {
    date: string;
    patientId: string;
    patientName: string;
    doctorName: string;
    histoire: string;
    remarque: string;
    medications: string[];
  }) => void;
  showToast: (msg: string, type?: any) => void;
}

export const StructuredPrescriptionEditor: React.FC<StructuredPrescriptionEditorProps> = ({
  patients,
  currentUser,
  activePatient,
  onSave,
  onValidate,
  onPrint,
  onSendPharmacy,
  showToast
}) => {
  // State for the 6 blocks
  const [date, setDate] = useState(() => {
    return new Date().toISOString().substring(0, 10); // Default to today
  });

  // Patient autocompletion & state
  const [patientInput, setPatientInput] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);

  // Doctor autocompletion & state
  const [doctorInput, setDoctorInput] = useState("");
  const [showDoctorSuggestions, setShowDoctorSuggestions] = useState(false);

  // Histoire (WYSIWYG)
  const [histoire, setHistoire] = useState("");
  const [showHistoireSuggestions, setShowHistoireSuggestions] = useState(false);
  const [histoireQuery, setHistoireQuery] = useState("");
  const histoireRef = useRef<HTMLTextAreaElement | null>(null);

  // Remarque (WYSIWYG)
  const [remarque, setRemarque] = useState("");
  const [showRemarqueSuggestions, setShowRemarqueSuggestions] = useState(false);
  const [remarqueQuery, setRemarqueQuery] = useState("");
  const remarqueRef = useRef<HTMLTextAreaElement | null>(null);

  // Medications list
  const [medInput, setMedInput] = useState("");
  const [addedMeds, setAddedMeds] = useState<string[]>([]);
  const [editingMedIdx, setEditingMedIdx] = useState<number | null>(null);
  const [editingMedVal, setEditingMedVal] = useState("");
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const [medQuery, setMedQuery] = useState("");

  const doctorsList = [
    "Dr. Ibrahim Touré",
    "Dr. Alou DIALLO",
    "Dr. Amadou Sangaré",
    "Dr. Fatoumata Coulibaly",
    "Dr. Oumar Koné"
  ];

  // Auto-fill active patient or doctor on mount / props change
  useEffect(() => {
    if (activePatient) {
      setSelectedPatient(activePatient);
      setPatientInput(`${activePatient.lastName.toUpperCase()} ${activePatient.firstName}`);
    } else {
      setSelectedPatient(null);
      setPatientInput("");
    }
  }, [activePatient]);

  useEffect(() => {
    if (currentUser) {
      const initialDocName = currentUser.name.startsWith("Dr.") ? currentUser.name : `Dr. ${currentUser.name}`;
      setDoctorInput(initialDocName);
    }
  }, [currentUser]);

  // Handle WYSIWYG button actions (inserts tags/markdown around selection or appends)
  const insertFormatting = (
    ref: React.RefObject<HTMLTextAreaElement | null>,
    type: "bold" | "italic" | "list",
    stateVal: string,
    setVal: (v: string) => void
  ) => {
    const textarea = ref.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = stateVal.substring(start, end);

    let formatted = "";
    if (type === "bold") {
      formatted = `**${selectedText || "Texte en gras"}**`;
    } else if (type === "italic") {
      formatted = `*${selectedText || "Texte en italique"}*`;
    } else if (type === "list") {
      formatted = `${stateVal ? "\n" : ""}• ${selectedText || "Élément de liste"}`;
    }

    const newVal = stateVal.substring(0, start) + formatted + stateVal.substring(end);
    setVal(newVal);

    // Reset selection & focus
    setTimeout(() => {
      textarea.focus();
      const offset = formatted.length;
      textarea.setSelectionRange(start + offset, start + offset);
    }, 50);
  };

  // Preset triggers maps
  const histoirePresets = [
    { cmd: "@debut", val: "Patient vu pour..." },
    { cmd: "@antecedent", val: "Antécédents : HTA, Diabète, Allergie connue à..." },
    { cmd: "@examen", val: "Examen clinique : TA, T°, Pouls, SpO2 normaux" },
    { cmd: "@conclusion", val: "Conclusion : Patient stable, bonne tolérance" }
  ];

  const remarquePresets = [
    { cmd: "@repos", val: "Repos de 3 jours" },
    { cmd: "@regime", val: "Régime léger sans sucre" },
    { cmd: "@retour", val: "Retour en consultation si fièvre persistante > 48h" },
    { cmd: "@urgence", val: "Consulter immédiatement en cas de : fièvre élevée, gêne respiratoire..." }
  ];

  const medPresets = [
    // Medications
    { cmd: "@paracetamol", val: "Paracétamol 500 mg - 2 comprimés en cas de fièvre - Ne pas dépasser 4g/jour" },
    { cmd: "@ceftriaxone", val: "Ceftriaxone 1g IM/IV - 1 injection par jour pendant 5 jours" },
    { cmd: "@amoxicilline", val: "Amoxicilline 500 mg - 1 gélule matin/midi/soir - 7 jours" },
    { cmd: "@artemether", val: "Artéméther/Luméfantrine (Coartem) - 4 comprimés matin et soir - 3 jours" },
    { cmd: "@metronidazole", val: "Métronidazole 500 mg - 1 comprimé 3 fois par jour - 7 jours" },
    { cmd: "@ciprofloxacine", val: "Ciprofloxacine 500 mg - 1 comprimé matin et soir - 7 jours" },
    { cmd: "@ibuprofene", val: "Ibuprofène 400 mg - 1 comprimé toutes les 8 heures si douleur" },
    { cmd: "@salbutamol", val: "Salbutamol aérosol doseur (Ventoline) - 2 bouffées si crise d'asthme" },
    { cmd: "@para", val: "Paracétamol 500 mg – 2 comprimés en cas de fièvre – Ne pas dépasser 4g/jour" },
    { cmd: "@amox", val: "Amoxicilline 500 mg – 1 comprimé matin/midi/soir – 7 jours" },
    { cmd: "@artem", val: "Artéméther/Luméfantrine – 3 comprimés/jour – 3 jours – À prendre avec un repas gras" },
    { cmd: "@cef", val: "Ceftriaxone 1g – IM ou IV – 1 injection par jour – Prescription médicale obligatoire" },

    // Exams
    { cmd: "@nfs", val: "Examen de Laboratoire : NFS (Numération Formule Sanguine)" },
    { cmd: "@glycemie", val: "Examen de Laboratoire : Glycémie à jeun" },
    { cmd: "@tdr", val: "Examen de Laboratoire : TDR Paludisme (Test de Diagnostic Rapide)" },
    { cmd: "@crp", val: "Examen de Laboratoire : Protéine C-réactive (CRP)" },
    { cmd: "@widal", val: "Examen de Laboratoire : Sérodiagnostic de Widal et Félix" },
    { cmd: "@ge", val: "Examen de Laboratoire : Goutte Épaisse (recherche de Plasmodium)" },
    { cmd: "@ecbu", val: "Examen de Laboratoire : ECBU (Examen Cytobactériologique des Urines)" },
    { cmd: "@echographie", val: "Imagerie : Échographie abdomino-pelvienne" },
    { cmd: "@rx_thorax", val: "Imagerie : Radiographie du thorax face" },

    // CIM-11 Diagnostics
    { cmd: "@cim:B50", val: "CIM-11: B50 - Paludisme à Plasmodium falciparum (Paludisme sévère)" },
    { cmd: "@cim:B54", val: "CIM-11: B54 - Paludisme, sans précision (Paludisme simple)" },
    { cmd: "@cim:I10", val: "CIM-11: I10 - Hypertension essentielle (primaire)" },
    { cmd: "@cim:E11", val: "CIM-11: E11 - Diabète sucré de type 2" },
    { cmd: "@cim:A09", val: "CIM-11: A09 - Diarrhée et gastro-entérite d'origine infectieuse présumée" },
    { cmd: "@cim:J06", val: "CIM-11: J06 - Infections aiguës des voies respiratoires supérieures" },
    { cmd: "@cim:N39", val: "CIM-11: N39 - Infection urinaire, site non précisé" },
    { cmd: "@cim:J45", val: "CIM-11: J45 - Asthme bronchique" },
    { cmd: "@cim:K29", val: "CIM-11: K29 - Gastrite et duodénite" }
  ];

  // Histoire Autocomplete checks
  const handleHistoireChange = (text: string) => {
    setHistoire(text);
    // Find if user is currently typing a trigger starting with @
    const cursor = histoireRef.current?.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursor);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setHistoireQuery(lastWord.toLowerCase());
      setShowHistoireSuggestions(true);
    } else {
      setShowHistoireSuggestions(false);
    }
  };

  const applyHistoirePreset = (cmd: string, val: string) => {
    const textarea = histoireRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart || 0;
    const textBeforeCursor = histoire.substring(0, cursor);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    // Replace the typed command with the full text
    const beforeText = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
    const afterText = histoire.substring(cursor);

    const updatedText = beforeText + val + afterText;
    setHistoire(updatedText);
    setShowHistoireSuggestions(false);

    // Refocus with offset
    setTimeout(() => {
      textarea.focus();
      const newPos = beforeText.length + val.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);

    showToast(`Modèle appliqué: ${cmd}`, "success");
  };

  // Remarque Autocomplete checks
  const handleRemarqueChange = (text: string) => {
    setRemarque(text);
    const cursor = remarqueRef.current?.selectionStart || 0;
    const textBeforeCursor = text.substring(0, cursor);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith("@")) {
      setRemarqueQuery(lastWord.toLowerCase());
      setShowRemarqueSuggestions(true);
    } else {
      setShowRemarqueSuggestions(false);
    }
  };

  const applyRemarquePreset = (cmd: string, val: string) => {
    const textarea = remarqueRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart || 0;
    const textBeforeCursor = remarque.substring(0, cursor);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    const beforeText = textBeforeCursor.substring(0, textBeforeCursor.length - lastWord.length);
    const afterText = remarque.substring(cursor);

    const updatedText = beforeText + val + afterText;
    setRemarque(updatedText);
    setShowRemarqueSuggestions(false);

    setTimeout(() => {
      textarea.focus();
      const newPos = beforeText.length + val.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);

    showToast(`Modèle appliqué: ${cmd}`, "success");
  };

  // Medication Autocomplete checks
  const handleMedChange = (text: string) => {
    setMedInput(text);
    if (text.includes("@") || text.length > 0) {
      const idx = text.lastIndexOf("@");
      if (idx !== -1) {
        setMedQuery(text.substring(idx).toLowerCase());
        setShowMedSuggestions(true);
      } else {
        setMedQuery(text.toLowerCase());
        setShowMedSuggestions(true);
      }
    } else {
      setShowMedSuggestions(false);
    }
  };

  const applyMedPreset = (cmd: string, val: string) => {
    const idx = medInput.lastIndexOf("@");
    let updatedText = "";
    if (idx !== -1) {
      updatedText = medInput.substring(0, idx) + val;
    } else {
      updatedText = val;
    }
    setMedInput(updatedText);
    setShowMedSuggestions(false);
    showToast(`Médicament autocomplété par ${cmd}`, "success");
  };

  // Patient manual selection
  const selectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientInput(`${p.lastName.toUpperCase()} ${p.firstName}`);
    setShowPatientSuggestions(false);
    showToast(`Patient lié: ${p.lastName.toUpperCase()} ${p.firstName}`, "info");
  };

  // Doctor manual selection
  const selectDoctor = (doc: string) => {
    setDoctorInput(doc);
    setShowDoctorSuggestions(false);
    showToast(`Docteur lié: ${doc}`, "info");
  };

  // Add medication line to the multiple list
  const addMedicationLine = () => {
    if (!medInput.trim()) {
      showToast("Veuillez saisir un médicament ou utiliser un code @.", "error");
      return;
    }
    setAddedMeds([...addedMeds, medInput.trim()]);
    setMedInput("");
    setShowMedSuggestions(false);
    showToast("Médicament ajouté !", "success");
  };

  // Delete medication line
  const removeMedicationLine = (index: number) => {
    const backup = [...addedMeds];
    backup.splice(index, 1);
    setAddedMeds(backup);
    showToast("Médicament retiré.", "warning");
  };

  // Activate edit mode for a medication line
  const startEditingMed = (index: number) => {
    setEditingMedIdx(index);
    setEditingMedVal(addedMeds[index]);
  };

  // Save the edited medication line
  const saveEditedMed = () => {
    if (!editingMedVal.trim()) {
      removeMedicationLine(editingMedIdx!);
      setEditingMedIdx(null);
      return;
    }
    const backup = [...addedMeds];
    backup[editingMedIdx!] = editingMedVal.trim();
    setAddedMeds(backup);
    setEditingMedIdx(null);
    showToast("Médicament modifié avec succès.", "success");
  };

  // Pack structured data to submit
  const getPrescriptionPayload = () => {
    const patName = selectedPatient 
      ? `${selectedPatient.lastName.toUpperCase()} ${selectedPatient.firstName}` 
      : patientInput;

    return {
      date,
      patientId: selectedPatient ? selectedPatient.id : "MANUAL",
      patientName: patName || "Inconnu",
      doctorName: doctorInput || "Dr. Non Spécifié",
      histoire,
      remarque,
      medications: addedMeds
    };
  };

  // Action Triggers
  const handleSaveBtn = () => {
    if (!patientInput.trim()) {
      showToast("Le Patient est obligatoire pour enregistrer l'ordonnance.", "error");
      return;
    }
    const payload = getPrescriptionPayload();
    if (onSave) onSave(payload);
    showToast("💾 Brouillon d'ordonnance sauvegardé avec succès !", "success");
  };

  const handleValidateBtn = () => {
    if (!patientInput.trim()) {
      showToast("Le Patient est obligatoire pour valider l'ordonnance.", "error");
      return;
    }
    if (addedMeds.length === 0) {
      showToast("Veuillez ajouter au moins un médicament avant de valider.", "warning");
    }
    const payload = getPrescriptionPayload();
    if (onValidate) onValidate(payload);
    showToast("✓ Ordonnance officiellement validée et scellée !", "success");
  };

  const handlePrintBtn = () => {
    const payload = getPrescriptionPayload();
    if (onPrint) {
      onPrint(payload);
    } else {
      // Direct printing popup fallback
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Ordonnance Officielle - MédiSahel</title>
              <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; line-height: 1.5; }
                .border-header { border-bottom: 3px double #0f766e; padding-bottom: 16px; margin-bottom: 24px; }
                .logo-section { display: flex; justify-content: space-between; align-items: start; }
                .title { text-align: center; font-size: 20px; font-weight: bold; color: #0f766e; margin: 24px 0; text-transform: uppercase; letter-spacing: 0.05em; }
                .section-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #f8fafc; }
                .section-title { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; }
                .block-text { font-size: 13px; white-space: pre-wrap; font-family: monospace; color: #334155; }
                .meds-list { margin: 0; padding-left: 20px; }
                .meds-item { font-size: 13px; font-weight: bold; margin-bottom: 6px; font-family: monospace; }
                .signature-section { text-align: right; margin-top: 40px; }
                .stamped-seal { border: 2.5px solid #16a34a; color: #16a34a; display: inline-block; padding: 6px 12px; font-weight: bold; border-radius: 6px; transform: rotate(-4deg); font-size: 11px; text-transform: uppercase; margin-top: 8px; }
              </style>
            </head>
            <body>
              <div class="border-header">
                <div class="logo-section">
                  <div>
                    <h2 style="color: #0d9488; margin:0; font-size:22px;">MÉDISAHEL CLINIQUE CENTRAL</h2>
                    <p style="margin: 4px 0 0; font-size:11px; color:#475569;">Hamdallaye ACI 2000, Bamako, Mali · Tél: +223 20 22 14 67</p>
                  </div>
                  <div style="text-align: right; font-size: 12px; color: #475569;">
                    <p style="margin:0;"><strong>Date d'émission:</strong> ${new Date(payload.date).toLocaleDateString("fr-FR")}</p>
                    <p style="margin:4px 0 0;"><strong>Référence :</strong> AES-ORD-${Math.floor(Math.random()*90000+10000)}</p>
                  </div>
                </div>
              </div>

              <div class="title">Ordonnance Médicale de Prescription</div>

              <div style="display: flex; gap: 20, justify-content: space-between; margin-bottom: 24px; font-size:13px;">
                <p style="margin:0;"><strong>Patient :</strong> ${payload.patientName.toUpperCase()} (ID: ${payload.patientId})</p>
                <p style="margin:0;"><strong>Médecin Prescripteur :</strong> ${payload.doctorName}</p>
              </div>

              ${payload.histoire ? `
              <div class="section-box">
                <div class="section-title">Histoire Clinique & Constantes</div>
                <div class="block-text">${payload.histoire}</div>
              </div>
              ` : ""}

              <div class="section-box" style="background-color: #fff; border-color: #0f766e;">
                <div class="section-title" style="color: #0f766e; border-color: #0f766e;">Médications & Traitements Prescrits</div>
                {payload.medications.length > 0 ? (
                  <ul class="meds-list">
                    ${payload.medications.map(med => `<li class="meds-item">• ${med}</li>`).join("")}
                  </ul>
                ) : (
                  <p style="margin:0; font-size:12px; font-style:italic;">Aucune prescription médicamenteuse rédigée.</p>
                )}
              </div>

              ${payload.remarque ? `
              <div class="section-box">
                <div class="section-title">Instructions & Recommandations Spécifiques</div>
                <div class="block-text">${payload.remarque}</div>
              </div>
              ` : ""}

              <div class="signature-section">
                <p style="margin:0; font-size:12px;">Fait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}</p>
                <strong style="font-size:14px; text-transform:uppercase; color:#0f766e;">${payload.doctorName}</strong>
                <div>
                  <div class="stamped-seal">SCELLEMENT ÉLECTRONIQUE SÉCURISÉ</div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        showToast("Impression de l'ordonnance lancée !", "success");
      }
    }
  };

  const handleSendPharmacyBtn = () => {
    if (!patientInput.trim()) {
      showToast("Le Patient est obligatoire pour envoyer à la pharmacie.", "error");
      return;
    }
    const payload = getPrescriptionPayload();
    if (onSendPharmacy) onSendPharmacy(payload);
    showToast("🚀 Ordonnance synchronisée en temps réel et transmise au guichet Pharmacie !", "success");
  };

  // Filters search suggestions for patients autocomplete
  const filteredPatients = patientInput.trim().length > 0
    ? patients.filter(p => 
        `${p.lastName} ${p.firstName}`.toLowerCase().includes(patientInput.toLowerCase()) ||
        p.id.toLowerCase().includes(patientInput.toLowerCase())
      )
    : [];

  // Filter doctor suggestions
  const filteredDoctors = doctorInput.trim().length > 0
    ? doctorsList.filter(d => d.toLowerCase().includes(doctorInput.toLowerCase()))
    : doctorsList;

  // Render presets for buttons
  const fitPresetsHistoire = histoireQuery 
    ? histoirePresets.filter(p => p.cmd.startsWith(histoireQuery))
    : histoirePresets;

  const fitPresetsRemarque = remarqueQuery
    ? remarquePresets.filter(p => p.cmd.startsWith(remarqueQuery))
    : remarquePresets;

  const fitPresetsMed = medQuery
    ? medPresets.filter(p => p.cmd.startsWith(medQuery))
    : medPresets;

  return (
    <div className="bg-slate-50 rounded-3xl border border-gray-250 overflow-hidden shadow-xl text-slate-800 text-xs font-semibold" id="structured-prescription-editor">
      
      {/* Title Header */}
      <div className="bg-teal-800 text-white p-5 flex justify-between items-center select-none border-b border-teal-900">
        <div className="flex items-center gap-2.5">
          <span className="p-2 bg-teal-700/60 rounded-xl text-emerald-300">
            ⚕️
          </span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider font-sans">
              Ajouter une ordonnance
            </h3>
            <span className="text-[10px] text-teal-200 font-medium">
              Intelligence Clinique & Saisie Autocomplétée MédiSahel
            </span>
          </div>
        </div>
        <div className="bg-teal-900 text-teal-300 border border-teal-700/50 rounded-xl px-2.5 py-1 text-[9px] font-mono tracking-tight font-black flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Connected
        </div>
      </div>

      <div className="p-6 space-y-5">
        
        {/* Row 1: Date, Patient, Doctor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* BLOC 1 : DATE */}
          <div className="space-y-1.5 relative">
            <label className="text-slate-500 font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-teal-700" />
              Date d'émission
            </label>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 bg-white rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          {/* BLOC 2 : PATIENT */}
          <div className="space-y-1.5 relative">
            <label className="text-slate-500 font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-teal-700" />
              Patient*
            </label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Renseignez ou recherchez le patient..."
                value={patientInput}
                onChange={(e) => {
                  setPatientInput(e.target.value);
                  setSelectedPatient(null);
                  setShowPatientSuggestions(true);
                }}
                onFocus={() => setShowPatientSuggestions(true)}
                className={`w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none bg-white font-extrabold ${selectedPatient ? "border-emerald-300 ring-1 ring-emerald-400/10 text-emerald-950" : "border-slate-300 text-slate-800"}`}
                required
              />
              {selectedPatient && (
                <span className="absolute right-3 top-3 text-[10px] bg-emerald-100 text-emerald-800 font-mono py-0.5 px-1.5 rounded-md font-bold">
                  Dossier lié: {selectedPatient.id}
                </span>
              )}
            </div>

            {/* Patient autocomplete dropdown */}
            {showPatientSuggestions && patientInput.trim().length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y font-medium text-slate-700">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectPatient(p)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 text-xs flex justify-between items-center cursor-pointer font-semibold"
                    >
                      <div>
                        <strong className="text-slate-900 uppercase">{p.lastName}</strong> {p.firstName}
                        <span className="text-[10px] block text-gray-400 font-mono font-medium">Allergies: {p.allergies || "Aucune"}</span>
                      </div>
                      <span className="font-mono text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">ID: {p.id}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-2.5 text-gray-400 text-center font-medium">Aucun patient trouvé. Saisie libre activée.</div>
                )}
                <div className="p-1 px-2.5 bg-slate-50 text-[9px] text-gray-400 font-mono text-right border-t">
                  <button type="button" onClick={() => setShowPatientSuggestions(false)} className="hover:underline">Fermer [x]</button>
                </div>
              </div>
            )}
          </div>

          {/* BLOC 3 : DOCTEUR */}
          <div className="space-y-1.5 relative">
            <label className="text-slate-500 font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1">
              <span className="text-teal-700">👨‍⚕️</span>
              Docteur
            </label>
            <input 
              type="text"
              placeholder="Nom du médecin prescripteur..."
              value={doctorInput}
              onChange={(e) => {
                setDoctorInput(e.target.value);
                setShowDoctorSuggestions(true);
              }}
              onFocus={() => setShowDoctorSuggestions(true)}
              className="w-full text-xs p-2.5 border border-slate-300 bg-white rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none font-bold"
            />

            {/* Doctor suggestions dropdown */}
            {showDoctorSuggestions && doctorInput.trim().length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y font-medium text-slate-700">
                {filteredDoctors.map(doc => (
                  <button
                    key={doc}
                    type="button"
                    onClick={() => selectDoctor(doc)}
                    className="w-full text-left p-2.5 hover:bg-slate-50 text-xs text-slate-800 font-bold cursor-pointer"
                  >
                    👤 {doc}
                  </button>
                ))}
                <div className="p-1 px-2.5 bg-slate-50 text-[9px] text-gray-400 font-mono text-right border-t">
                  <button type="button" onClick={() => setShowDoctorSuggestions(false)} className="hover:underline">Fermer [x]</button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* BLOC 4 : HISTOIRE (texte enrichi + assistance @) */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs relative space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5">
            <label className="text-slate-700 font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <span>📝</span> Histoire de la Maladie & Constantes
            </label>
            <div className="text-[10px] text-teal-800 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100 font-mono">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>💡 Taper <strong>@</strong> pour insérer des modèles</span>
            </div>
          </div>

          {/* WYSIWYG Buttons Toolbar */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            <button
              type="button"
              onClick={() => insertFormatting(histoireRef, "bold", histoire, setHistoire)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Gras"
            >
              <Bold className="h-3.5 w-3.5 text-slate-600" /> [B]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting(histoireRef, "italic", histoire, setHistoire)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Italique"
            >
              <Italic className="h-3.5 w-3.5 text-slate-600" /> [I]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting(histoireRef, "list", histoire, setHistoire)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Liste"
            >
              <List className="h-3.5 w-3.5 text-slate-600" /> [:] Liste
            </button>
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            {/* Direct Model shortcuts badges for easier assistance */}
            <div className="flex flex-wrap gap-1">
              {histoirePresets.map(preset => (
                <button
                  key={preset.cmd}
                  type="button"
                  onClick={() => {
                    const combined = histoire + (histoire && !histoire.endsWith(" ") ? " " : "") + preset.val;
                    setHistoire(combined);
                    showToast(`Modèle ${preset.cmd} inséré`, "success");
                  }}
                  className="bg-slate-100 hover:bg-teal-50 border hover:border-teal-200 hover:text-teal-900 text-slate-600 text-[9px] px-1.5 py-0.5 rounded transition-all font-mono"
                >
                  {preset.cmd}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={histoireRef}
              rows={3}
              placeholder="Patient vu pour fièvre suspecte de paludisme... (Saisissez @ pour faire apparaître l'assistant de modèles)"
              value={histoire}
              onChange={(e) => handleHistoireChange(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-700 bg-teal-50/5 leading-relaxed focus:outline-none"
            />

            {/* Floating Suggestions for Histoire */}
            {showHistoireSuggestions && (
              <div className="absolute z-50 left-2 bottom-full mb-1 bg-slate-900 text-white border border-slate-800 rounded-xl shadow-xl max-w-sm divide-y divide-slate-800 text-[10.5px] font-mono leading-relaxed overflow-hidden">
                <div className="p-2 bg-slate-950 font-mono font-black text-teal-300 uppercase tracking-widest text-[9px]">Commandes @ Histoire :</div>
                {fitPresetsHistoire.length > 0 ? (
                  fitPresetsHistoire.map(preset => (
                    <button
                      key={preset.cmd}
                      type="button"
                      onClick={() => applyHistoirePreset(preset.cmd, preset.val)}
                      className="w-full text-left p-2 hover:bg-slate-800 flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="font-extrabold text-teal-400">{preset.cmd}</span>
                      <span className="text-slate-300 font-sans italic">"{preset.val}"</span>
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-slate-500 text-center font-sans">Aucun modèle correspondant.</div>
                )}
                <div className="p-1 px-2.5 bg-slate-950 text-[9px] text-slate-500 text-right border-t border-slate-800 font-sans">
                  <button type="button" onClick={() => setShowHistoireSuggestions(false)} className="hover:underline">Masquer</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BLOC 5 : REMARQUE (texte enrichi + assistance @) */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-xs relative space-y-2">
          <div className="flex justify-between items-center border-b pb-1.5">
            <label className="text-slate-700 font-extrabold text-[11px] uppercase tracking-wide flex items-center gap-1">
              <span>⚠️</span> Remarques, Surveillances & Certificats
            </label>
            <div className="text-[10px] text-teal-800 flex items-center gap-1 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100 font-mono">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>💡 Taper <strong>@</strong> pour insérer des modèles</span>
            </div>
          </div>

          {/* WYSIWYG Buttons Toolbar */}
          <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-150">
            <button
              type="button"
              onClick={() => insertFormatting(remarqueRef, "bold", remarque, setRemarque)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Gras"
            >
              <Bold className="h-3.5 w-3.5 text-slate-600" /> [B]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting(remarqueRef, "italic", remarque, setRemarque)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Italique"
            >
              <Italic className="h-3.5 w-3.5 text-slate-600" /> [I]
            </button>
            <button
              type="button"
              onClick={() => insertFormatting(remarqueRef, "list", remarque, setRemarque)}
              className="p-1 px-2 hover:bg-slate-200 text-slate-750 font-bold rounded-lg flex items-center gap-1 text-[10px] cursor-pointer"
              title="Liste"
            >
              <List className="h-3.5 w-3.5 text-slate-600" /> [:] Liste
            </button>
            <div className="h-4 w-px bg-slate-300 mx-2"></div>
            {/* Direct Model shortcuts badges for easier assistance */}
            <div className="flex flex-wrap gap-1">
              {remarquePresets.map(preset => (
                <button
                  key={preset.cmd}
                  type="button"
                  onClick={() => {
                    const combined = remarque + (remarque && !remarque.endsWith(" ") ? " " : "") + preset.val;
                    setRemarque(combined);
                    showToast(`Recommandation ${preset.cmd} insérée`, "success");
                  }}
                  className="bg-slate-100 hover:bg-teal-50 border hover:border-teal-200 hover:text-teal-900 text-slate-600 text-[9px] px-1.5 py-0.5 rounded transition-all font-mono"
                >
                  {preset.cmd}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <textarea
              ref={remarqueRef}
              rows={3}
              placeholder="Repos strict conseillé. Reprendre alimentation à la fin... (Saisissez @ pour faire apparaître l'assistant de modèles)"
              value={remarque}
              onChange={(e) => handleRemarqueChange(e.target.value)}
              className="w-full text-xs p-3 border border-slate-200 rounded-xl font-medium focus:ring-1 focus:ring-teal-700 bg-teal-50/5 leading-relaxed focus:outline-none"
            />

            {/* Floating Suggestions for Remarque */}
            {showRemarqueSuggestions && (
              <div className="absolute z-50 left-2 bottom-full mb-1 bg-slate-900 text-white border border-slate-800 rounded-xl shadow-xl max-w-sm divide-y divide-slate-800 text-[10.5px] font-mono leading-relaxed overflow-hidden">
                <div className="p-2 bg-slate-950 font-mono font-black text-teal-300 uppercase tracking-widest text-[9px]">Commandes @ Médicales :</div>
                {fitPresetsRemarque.length > 0 ? (
                  fitPresetsRemarque.map(preset => (
                    <button
                      key={preset.cmd}
                      type="button"
                      onClick={() => applyRemarquePreset(preset.cmd, preset.val)}
                      className="w-full text-left p-2 hover:bg-slate-800 flex flex-col gap-0.5 transition-colors cursor-pointer"
                    >
                      <span className="font-extrabold text-teal-400">{preset.cmd}</span>
                      <span className="text-slate-300 font-sans italic font-normal">"{preset.val}"</span>
                    </button>
                  ))
                ) : (
                  <div className="p-2 text-slate-500 text-center font-sans">Aucun modèle correspondant.</div>
                )}
                <div className="p-1 px-2.5 bg-slate-950 text-[9px] text-slate-500 text-right border-t border-slate-800 font-sans">
                  <button type="button" onClick={() => setShowRemarqueSuggestions(false)} className="hover:underline">Masquer</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BLOC 6 : MÉDICAMENT (autocomplétion + assistance de la liste) */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="border-b pb-2 flex justify-between items-center select-none">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-1.5 uppercase font-sans tracking-wide text-xs">
              <span>💊</span> Prescriptions Thérapeutiques & Traitements
            </h4>
            <span className="text-[10px] text-teal-850 font-mono bg-teal-50 p-1 px-2 rounded-xl border border-teal-100">
              Saisie Multiple active
            </span>
          </div>

          <div className="space-y-3 relative">
            <div className="flex gap-2.5 items-end relative">
              <div className="flex-1 relative space-y-1">
                <label className="text-slate-500 font-bold text-[9.5px] uppercase font-mono tracking-wider flex justify-between">
                  <span>Médicament à rajouter</span>
                  <span className="text-[9px] text-gray-400 italic font-mono lowercase">typez @ pour codes rapides</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    placeholder="Tapez un médicament, ex: Paracétamol, ou utilisez un raccourci comme @para..."
                    value={medInput}
                    onChange={(e) => handleMedChange(e.target.value)}
                    onFocus={() => setShowMedSuggestions(true)}
                    className="w-full text-xs p-3 border border-slate-300 bg-white rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono"
                  />
                  {medInput.trim() && (
                    <button
                      type="button"
                      onClick={() => setMedInput("")}
                      className="absolute right-3 top-3 text-[10px] text-gray-400 hover:text-slate-800"
                    >
                      Effacer
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={addMedicationLine}
                className="bg-teal-800 hover:bg-teal-900 border text-white font-extrabold p-3 px-5 rounded-xl flex items-center gap-1 cursor-pointer transition-all self-end h-10.5 shadow-sm"
              >
                <Plus className="h-4 w-4" /> [ + ]
              </button>
            </div>

            {/* Autocomplete suggestions dropdown - Medicines and analysis */}
            {showMedSuggestions && medInput.length > 0 && (
              <div className="absolute z-50 left-0 right-14 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y font-mono text-[10.5px]">
                <div className="p-1 px-3 bg-teal-850 text-white text-[9px] font-black uppercase tracking-wider">
                  🧪 Raccourcis Médicaments & analyses biologiques (@) :
                </div>
                {fitPresetsMed.length > 0 ? (
                  fitPresetsMed.map(m => (
                    <button
                      key={m.cmd}
                      type="button"
                      onClick={() => applyMedPreset(m.cmd, m.val)}
                      className="w-full text-left p-2.5 hover:bg-slate-50 text-xs flex justify-between gap-4 cursor-pointer font-semibold divide-x bg-white"
                    >
                      <span className="font-extrabold text-teal-800 shrink-0">{m.cmd}</span>
                      <span className="pl-2 font-mono text-slate-800 font-medium whitespace-pre-wrap">{m.val}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-2.5 text-gray-400 text-center font-sans font-medium">Recherche libre... Cliquez sur [+] pour ajouter votre saisie personnalisée.</div>
                )}
                <div className="p-1 px-2.5 bg-slate-50 text-[9px] text-gray-400 font-mono text-right border-t">
                  <button type="button" onClick={() => setShowMedSuggestions(false)} className="hover:underline">Masquer</button>
                </div>
              </div>
            )}
          </div>

          {/* List of already added medications - edit and delete capability */}
          <div className="p-4 bg-slate-100/50 rounded-2xl border border-gray-200">
            <span className="block text-[10px] text-slate-400 uppercase font-mono tracking-wider mb-2 select-none">
              Médicaments et Analyses prescrits pour l'Ordonnance :
            </span>

            {addedMeds.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {addedMeds.map((med, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-white border rounded-xl hover:border-teal-500 transition-all flex justify-between items-center gap-4 text-xs font-semibold shadow-2xs"
                  >
                    <div className="flex-1 font-mono leading-relaxed font-bold break-all">
                      {editingMedIdx === idx ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={editingMedVal}
                            onChange={(e) => setEditingMedVal(e.target.value)}
                            className="bg-slate-50 p-1.5 border rounded flex-1 focus:outline-none"
                            autoFocus
                          />
                          <button 
                            onClick={saveEditedMed} 
                            className="text-emerald-700 hover:text-emerald-900 border p-1 px-2 rounded font-sans uppercase text-[10px] font-black shrink-0"
                          >
                            Valider
                          </button>
                        </div>
                      ) : (
                        <p className="text-slate-900">• {med}</p>
                      )}
                    </div>

                    {editingMedIdx !== idx && (
                      <div className="flex gap-1.5 shrink-0 select-none">
                        <button
                          type="button"
                          onClick={() => startEditingMed(idx)}
                          className="p-1 text-slate-400 hover:text-indigo-900 transition-colors"
                          title="Modifier la posologie"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMedicationLine(idx)}
                          className="p-1 text-slate-400 hover:text-rose-900 transition-colors"
                          title="Supprimer la ligne"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 bg-white border border-dashed rounded-xl flex flex-col items-center gap-1.5">
                <div className="text-2xl text-slate-300">💊</div>
                <p className="font-semibold text-xs text-slate-500">Aucun traitement ajouté au panier de l'ordonnance.</p>
                <p className="text-[10px] text-gray-400 max-w-sm font-normal">Saisissez un médicament plus haut en tapant un trigger comme <strong className="font-mono text-teal-800">@para</strong> puis cliquez sur la touche <strong className="text-slate-800">[+]</strong> pour alimenter la liste.</p>
              </div>
            )}
          </div>

        </div>

        {/* Action Buttons Frame */}
        <div className="pt-2 border-t flex flex-wrap gap-3 text-xs justify-end">
          
          <button
            type="button"
            onClick={handleSaveBtn}
            className="bg-slate-200 hover:bg-slate-300 border border-slate-300 text-slate-800 px-4 py-2.5 rounded-xl font-black shadow-xs flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Save className="h-4 w-4" />
            <span>SAUVEGARDER</span>
          </button>

          <button
            type="button"
            onClick={handleValidateBtn}
            className="bg-teal-800 hover:bg-teal-905 text-white px-4 py-2.5 rounded-xl font-black shadow-md flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Check className="h-4 w-4" />
            <span>VALIDER</span>
          </button>

          <button
            type="button"
            onClick={handlePrintBtn}
            className="bg-slate-850 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black shadow-md flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Printer className="h-4 w-4" />
            <span>IMPRIMER</span>
          </button>

          <button
            type="button"
            onClick={handleSendPharmacyBtn}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-black shadow-md flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Send className="h-4 w-4 text-emerald-100" />
            <span>ENVOYER PHARMACIE</span>
          </button>

        </div>

      </div>

    </div>
  );
};
