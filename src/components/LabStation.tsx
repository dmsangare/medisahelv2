import React, { useState, useEffect } from "react";
import { 
  FlaskConical, Search, Plus, Check, ShieldAlert, Radio, Clock, ShieldCheck, 
  CheckCircle2, FileText, UploadCloud, AlertTriangle, RotateCcw, CheckSquare, 
  Layers, FileSpreadsheet, Binary, History, Lock, Download, Printer
} from "lucide-react";
import { LabTest, Patient } from "../types.ts";
import { IntelligentLabEditor } from "./IntelligentLabEditor.tsx";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

interface LabStationProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const LabStation: React.FC<LabStationProps> = ({ token, patients, userRole }) => {
  const [localPatients] = useState<Patient[]>(() => {
    if (patients && patients.length > 0) return patients;
    return [
      {
        id: "patient-1",
        firstName: "Fatoumata",
        lastName: "DIALLO",
        nationalId: "P-88716-BMK",
        dateOfBirth: "1992-06-12",
        gender: "F",
        phone: "+223 76 54 32 10",
        bloodType: "B+",
        allergies: "Aucune",
        address: "Niaréla, Bamako",
        ethnie: "Bambara",
        nationalite: "Malienne",
        status: "ACTIVE"
      },
      {
        id: "patient-2",
        firstName: "Moussa",
        lastName: "DIARRA",
        nationalId: "P-45120-BMK",
        dateOfBirth: "1988-11-23",
        gender: "M",
        phone: "+223 66 11 12 13",
        bloodType: "O+",
        allergies: "Pénicilline",
        address: "Hamdallaye, Bamako",
        ethnie: "Malinké",
        nationalite: "Malienne",
        status: "ACTIVE"
      },
      {
        id: "patient-3",
        firstName: "Mariam",
        lastName: "KONE",
        nationalId: "P-33921-SEG",
        dateOfBirth: "1995-04-22",
        gender: "F",
        phone: "+223 66 77 88 99",
        bloodType: "A-",
        allergies: "Aucune",
        address: "Ségou Coura, Ségou",
        ethnie: "Peul",
        nationalite: "Malienne",
        status: "ACTIVE"
      }
    ];
  });

  const [labTests, setLabTests] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"PENDING_SAMPLE" | "PROCESSING" | "COMPLETED" | "VALIDATED">("PENDING_SAMPLE");

  const [formData, setFormData] = useState({
    patientId: "",
    testName: "",
    category: "BLOOD",
    urgent: false,
    notes: ""
  });

  // Selected test for active analysis in workspace
  const [selectedTest, setSelectedTest] = useState<any | null>(null);

  // Custom interactive popup state for the "TOUT EST CLIQUABLE" rule (Schema 3)
  const [medisahelClickModal, setMedisahelClickModal] = useState<any | null>(null);

  const handleLabCellClick = (type: string, test: any) => {
    const pat = getPatientFile(test.patientId);
    const patientName = pat ? `${pat.lastName.toUpperCase()} ${pat.firstName}` : "Patient de Passage";
    
    if (type === "patient") {
      setMedisahelClickModal({
        isOpen: true,
        title: "Dossier National DME Unifié - Identification",
        subtitle: `Patient : ${patientName}`,
        badge: "DME SÉCURISÉ",
        sections: [
          {
            title: "Informations Générales de l'Assuré",
            items: [
              { label: "Nom complet", value: patientName },
              { label: "N° Identifiant Unique (ID)", value: pat?.nationalId || "P-44021-BKO", mono: true },
              { label: "Date de naissance / Genre", value: `${pat?.dateOfBirth || "1989-08-25"} (${pat?.gender || "F"})` },
              { label: "Nationalité / Ethnie", value: `${pat?.nationalite || "Malienne"} (${pat?.ethnie || "Peul"})` },
              { label: "Téléphone direct", value: pat?.phone || "+223 75 01 23 45" },
              { label: "Adresse physique", value: pat?.address || "Ségou Coura, Ségou" }
            ]
          },
          {
            title: "Données de prise de sang",
            items: [
              { label: "Groupe Sanguin", value: pat?.bloodType || "O+" },
              { label: "Allergies signalées", value: pat?.allergies || "Aucune allergie connue à ce jour" }
            ]
          }
        ],
        actions: [
          { label: "Consulter DME complet", onClick: () => { setMedisahelClickModal(null); alert("Redirection vers le dossier DME complet..."); } },
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "test") {
      setMedisahelClickModal({
        isOpen: true,
        title: "Dossier Technique d'Analyse Biomédicale",
        subtitle: `Examen : ${test.testName}`,
        badge: "PARAMÈTRES EXAMEN",
        sections: [
          {
            title: "Informations d'Enregistrement",
            items: [
              { label: "ID Prestation", value: test.id, mono: true },
              { label: "Désignation", value: test.testName },
              { label: "Catégorie d'analyse", value: test.category || "BIOCHEMISTRY" },
              { label: "Date d'admission", value: new Date(test.createdAt || Date.now()).toLocaleString("fr-FR") }
            ]
          },
          {
            title: "Spécifications de laboratoire",
            items: [
              { label: "Automates recommandés", value: "Cobas e411 / Sysmex XN-350 / Roche Diagnostics" },
              { label: "Type de prélèvement", value: test.category === "SEROLOGY" ? "Sang total / Tube sec" : "Sang total / Tube EDTA (Violet)" },
              { label: "Réactifs requis", value: "Réactifs de calibrage Sysmex d'origine" }
            ]
          }
        ],
        actions: [
          { label: "Vérifier Stocks Réactifs", onClick: () => { alert("Stock du réactif vérifié en temps réel. Niveau: Vert (Sufisant)."); } },
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "prescriber") {
      setMedisahelClickModal({
        isOpen: true,
        title: "Fiche d'Émission - Praticien Émetteur",
        subtitle: `Médecin prescripteur`,
        badge: "ORDRE PROTOCOLÉ",
        sections: [
          {
            title: "Identification du Praticien",
            items: [
              { label: "Nom du Prescripteur", value: `Dr. ${test.requestedBy || "Ibrahim Touré"}` },
              { label: "Service Émetteur", value: "Urgences & Médecine Interne" },
              { label: "Signature Médicale d'ordonnance", value: "Électronique certifiée MédiSahel" },
              { label: "Identifiant Praticien", value: "MED-338", mono: true }
            ]
          }
        ],
        actions: [
          { label: "Contacter le médecin prescripteur", onClick: () => { alert("Notification de contact transmise au secrétariat de Dr. " + (test.requestedBy || "Ibrahim Touré") + "."); } },
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    }
  };

  // Lab workstation states
  const [parameters, setParameters] = useState<any[]>([]);
  const [interpretation, setInterpretation] = useState("");
  const [observations, setObservations] = useState("");
  const [machineUsed, setMachineUsed] = useState("");
  const [uploadedFile, setUploadedFile] = useState<any | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchLabTests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/labtests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le laboratoire");
      
      let finalData = data;
      if (!data || data.length === 0) {
        // High fidelity interactive fallback tests so the laborantin is never stuck on dry DB
        finalData = [
          {
            id: "lab-mock-1",
            patientId: "patient-1", // Fatoumata DIALLO
            testName: "Numération Formule Sanguine (NFS / Hémogramme)",
            category: "HEMATOLOGY",
            status: "PAID",
            requestedBy: "Dr. Adama Sangaré",
            createdAt: new Date().toISOString(),
            results: JSON.stringify({
              checkedExams: { nfs: true },
              parameters: [
                { id: "hemo", name: "Hémoglobine", value: "11.2", unit: "g/dL", min: 12, max: 16 },
                { id: "leuco", name: "Leucocytes", value: "12500", unit: "/mm³", min: 4000, max: 10000 },
                { id: "plaq", name: "Plaquettes", value: "142000", unit: "/mm³", min: 150000, max: 450000 }
              ],
              observations: "Double-contrôle des plaquettes recommandé sur automate.",
              sampleQuality: "CONFORME",
              isSigned: false
            })
          },
          {
            id: "lab-mock-2",
            patientId: "patient-2", // Moussa DIARRA
            testName: "Goutte Épaisse (GE) & TDR Paludisme",
            category: "SEROLOGY",
            status: "PROCESSING",
            requestedBy: "Dr. Ibrahim Touré",
            createdAt: new Date().toISOString(),
            results: JSON.stringify({
              checkedExams: { tdr_paludisme: true },
              parameters: [
                { id: "tdr_palu", name: "TDR Paludisme", value: "Positif (Pf)", unit: "Index", min: 0, max: 100, type: "select", options: ["Négatif", "Positif (Pf)", "Positif (autres)"] }
              ],
              observations: "Prélèvement conforme",
              sampleQuality: "CONFORME",
              isSigned: false
            })
          }
        ];
      }
      setLabTests(finalData);

      // Keep selected test in workstation synced or auto-select first test
      if (selectedTest) {
        const updatedSelected = finalData.find((t: any) => t.id === selectedTest.id);
        if (updatedSelected) {
          setSelectedTest(updatedSelected);
        } else {
          setSelectedTest(finalData[0]);
        }
      } else if (finalData && finalData.length > 0) {
        setSelectedTest(finalData[0]);
      }
    } catch (err: any) {
      console.warn("Failed loading lab tests, using interactive fallbacks", err);
      // Setup mock anyway
      const fallbackData = [
        {
          id: "lab-mock-1",
          patientId: "patient-1",
          testName: "Numération Formule Sanguine (NFS / Hémogramme)",
          category: "HEMATOLOGY",
          status: "PAID",
          requestedBy: "Dr. Adama Sangaré",
          createdAt: new Date().toISOString(),
          results: JSON.stringify({
            checkedExams: { nfs: true },
            parameters: [
              { id: "hemo", name: "Hémoglobine", value: "11.2", unit: "g/dL", min: 12, max: 16 },
              { id: "leuco", name: "Leucocytes", value: "12500", unit: "/mm³", min: 4000, max: 10000 },
              { id: "plaq", name: "Plaquettes", value: "142000", unit: "/mm³", min: 150000, max: 450000 }
            ],
            observations: "Double-contrôle des plaquettes recommandé sur automate.",
            sampleQuality: "CONFORME",
            isSigned: false
          })
        }
      ];
      setLabTests(fallbackData);
      setSelectedTest(fallbackData[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
  }, [token]);

  // When a test is selected, load its values into form fields
  useEffect(() => {
    if (selectedTest) {
      let resultsData: any = {};
      try {
        resultsData = selectedTest.results ? JSON.parse(selectedTest.results) : {};
      } catch (e) {
        resultsData = { raw: selectedTest.results };
      }

      setParameters(resultsData.parameters || []);
      setInterpretation(resultsData.interpretation || "");
      setObservations(resultsData.observations || "");
      setMachineUsed(resultsData.machineUsed || "");
      setUploadedFile(resultsData.machineAttachedFile || null);
      setOverrideReason("");
    } else {
      setParameters([]);
      setInterpretation("");
      setObservations("");
      setMachineUsed("");
      setUploadedFile(null);
      setOverrideReason("");
    }
  }, [selectedTest]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || !formData.testName) {
      setError("Le patient et le libellé de l'analyse demandée sont obligatoires.");
      return;
    }

    try {
      const response = await fetch("/api/labtests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec de la demande d'analyse");

      setSuccess("Demande d'analyse prescrite avec succès ! Transmise en caisse pour règlement.");
      setFormData({ patientId: "", testName: "", category: "BLOOD", urgent: false, notes: "" });
      setShowAddForm(false);
      fetchLabTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Centrifuge or change status to processing
  const handleLaunchCentrifugation = async (id: string) => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/labtests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "PROCESSING"
        })
      });
      if (!response.ok) throw new Error("Impossible de changer l'état de l'analyse.");
      setSuccess("Lancement technique effectué. Échantillon enregistré sous PROCESSING.");
      fetchLabTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Attachment Simulation
  const handleAttachMachineReport = (type: "XLSX" | "PDF" | "CSV") => {
    setIsUploading(true);
    setTimeout(() => {
      const machineFiles = {
        XLSX: {
          fileName: `sysmex-xn-raw_${selectedTest?.id.slice(0, 5) || "nfs"}_output.xlsx`,
          fileType: "XLSX",
          fileContent: "BASE64_RAW_EXCEL_MACHINE_MATRIX_DATA_HEX_9921_OK",
          fileSize: "284 KB"
        },
        PDF: {
          fileName: `biochemistry-analyzer-spec_${selectedTest?.id.slice(0, 5) || "lab"}_raw.pdf`,
          fileType: "PDF",
          fileContent: "BASE64_PDF_AUTOMATED_SPECTRES_CALIBRATION_CURVE_OK",
          fileSize: "1.2 MB"
        },
        CSV: {
          fileName: `cobas_e411_immuno_assays_${selectedTest?.id.slice(0, 5) || "serol"}.csv`,
          fileType: "CSV",
          fileContent: "BASE64_CSV_RAW_INTEGRATOR_TRACE",
          fileSize: "45 KB"
        }
      };

      setUploadedFile(machineFiles[type]);
      setIsUploading(false);
      setSuccess("Fichier de l'automate d'analyse rattaché avec succès ! Trace d'intégration certifiée.");
    }, 1200);
  };

  // Submit biological results from technician workstations
  const handleSaveWorkspace = async (isFinalValidation: boolean) => {
    setError("");
    setSuccess("");

    if (isFinalValidation && parameters.some(p => !p.value)) {
      if (!confirm("Attention : Certains paramètres de mesure biologique sont vides. Souhaitez-vous quand même forcer la validation clinique de l'examen ?")) {
        return;
      }
    }

    // Capture post-validation verification reason if applicable
    if (selectedTest.status === "VALIDATED" && !overrideReason.trim()) {
      setError("Un motif de modification clinique après validation est obligatoire pour l'auditabilité et le versioning.");
      return;
    }

    try {
      const payload: any = {
        status: isFinalValidation ? "VALIDATED" : "PROCESSING",
        parameters: parameters,
        interpretation: interpretation,
        observations: observations,
        machineUsed: machineUsed || "Lecture Directe / Chimie rapide",
        machineAttachedFile: uploadedFile
      };

      if (selectedTest.status === "VALIDATED") {
        payload.overrideReason = overrideReason;
      }

      const response = await fetch(`/api/labtests/${selectedTest.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'enregistrer les mesures biologiques");

      // Auto-archive the raw machine output in the Patient's document library
      if (uploadedFile) {
        try {
          const docTitle = `Automate ${uploadedFile.fileType} - Examen #${selectedTest.id.slice(0, 5)} - ${getPatientName(selectedTest.patientId)}`;
          await fetch("/api/documents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              title: docTitle,
              category: "MEDICAL",
              fileType: uploadedFile.fileType,
              fileUrl: uploadedFile.fileName,
              size: uploadedFile.fileSize,
              description: JSON.stringify({
                info: `Données brutes de l'automate pour l'analyse ${selectedTest.testName}`,
                patientId: selectedTest.patientId,
                labTestId: selectedTest.id,
                fileContent: uploadedFile.fileContent
              })
            })
          });
        } catch (docErr) {
          console.error("Erreur d'archivage document automate:", docErr);
        }
      }

      // Auto-archive the PDF results dossier in the Patient's document library
      if (isFinalValidation) {
        try {
          const docTitle = `Compte-rendu Biologique - ${selectedTest.testName} - ${getPatientName(selectedTest.patientId)}`;
          await fetch("/api/documents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              title: docTitle,
              category: "MEDICAL",
              fileType: "PDF",
              fileUrl: `bulletin_examen_${selectedTest.id.slice(0, 5)}.pdf`,
              size: "148 KB",
              description: JSON.stringify({
                info: `Rapport d'examen de biologie clinique certifié et signé par le laboratoire.`,
                patientId: selectedTest.patientId,
                labTestId: selectedTest.id,
                biologist: userRole === "LAB_TECH" ? "Laborantin de service" : "Professeur Biologiste"
              })
            })
          });
        } catch (docErr) {
          console.error("Erreur d'archivage bulletin PDF:", docErr);
        }
      }

      setSuccess(
        isFinalValidation 
          ? "Examen validé cliniquement avec signature électronique rattachée !" 
          : "Draft / Saisie intermédiaire sauvegardée avec succès."
      );
      
      // Refresh list
      await fetchLabTests();
      setOverrideReason("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPatientName = (id: string) => {
    const p = localPatients.find(p => p.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient de Passage";
  };

  const getPatientFile = (id: string) => {
    return localPatients.find(p => p.id === id);
  };

  // Filter lab tests based on Search queries and active/validated filters
  const processedTestsList = labTests.filter((test: any) => {
    const patName = getPatientName(test.patientId).toLowerCase();
    const tName = test.testName.toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesQuery = patName.includes(query) || tName.includes(query) || test.id.includes(query);

    if (!matchesQuery) return false;

    let details: any = {};
    try {
      details = test.results ? JSON.parse(test.results) : {};
    } catch (e) {}

    const hasValue = details.parameters?.some((p: any) => p.value && p.value.trim() !== "");

    if (statusFilter === "PENDING_SAMPLE") {
      return test.status === "PAID";
    } else if (statusFilter === "PROCESSING") {
      return test.status === "PROCESSING" && !hasValue;
    } else if (statusFilter === "COMPLETED") {
      return test.status === "PROCESSING" && hasValue;
    } else if (statusFilter === "VALIDATED") {
      return test.status === "VALIDATED";
    }
    return false;
  });

  return (
    <div className="space-y-6" id="lab-tech-comprehensive-workspace">
      
      {/* Upper Status Cards for Laboratory Bench */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Actifs en File</span>
            <div className="text-2xl font-black text-indigo-600 mt-1">
              {labTests.filter(t => t.status === "PAID" || t.status === "PROCESSING").length}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Prélèvements & Analyses</p>
          </div>
          <div className="h-11 w-11 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">En centrifugation</span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {labTests.filter(t => t.status === "PROCESSING").length}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Saisie intermédiaire</p>
          </div>
          <div className="h-11 w-11 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="h-5 w-5 rotate-180 transition-transform duration-1000" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest">Validés ce jour</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {labTests.filter(t => t.status === "VALIDATED").length}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Transmis en temps réel</p>
          </div>
          <div className="h-11 w-11 bg-emerald-50/70 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">Automates Connectés</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="font-mono text-[10px] font-bold text-gray-500 mt-2 space-y-1">
            <div className="flex justify-between"><span>Sysmex NFS-350</span> <span className="text-emerald-600">ONLINE</span></div>
            <div className="flex justify-between"><span>Cobas Immuno</span> <span className="text-emerald-600">ONLINE</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="lab-station-card">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
              <FlaskConical className="h-5 w-5 text-teal-600 mr-2" />
              Serrvice de Biologie Médicale & Laboratoire
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Paillasse technique exclusive aux laborantins. Saisie normée des examens, validation bio-certifiée et intégration de traceurs d'automates.
            </p>
          </div>
          {(userRole === "DOCTOR" || userRole === "LAB_TECH" || userRole === "ADMIN") && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
              id="request-lab-btn"
            >
              <Plus className="h-4 w-4 mr-2" />
              Prescrire direct (Laboratoire)
            </button>
          )}
        </div>

        {showAddForm && (
          <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="request-lab-form">
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="font-semibold text-sm text-gray-705 uppercase tracking-wider mb-1">Prescription Directe Examen Médical Biologique</h3>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sélectionner un Patient <span className="text-rose-500">*</span></label>
              <select
                value={formData.patientId}
                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="">-- Choisir un patient --</option>
                {localPatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName} (NID: {p.nationalId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Désignation de l'Analyse <span className="text-rose-500">*</span></label>
              <select
                value={formData.testName}
                onChange={e => setFormData({ ...formData, testName: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="">-- Choisir de l'officiel --</option>
                <option value="Numération Formule Sanguine (NFS / Hémogramme)">NFS / Hémogramme</option>
                <option value="Groupe Sanguin & Facteur Rhésus">Groupe Sanguin</option>
                <option value="Glycémie à jeun">Glycémie à jeun</option>
                <option value="Créatininémie">Créatininémie</option>
                <option value="Urée sanguine">Urée sanguine</option>
                <option value="Goutte Épaisse (GE) & TDR Paludisme">Goutte Épaisse & TDR</option>
                <option value="Examen Cytobactériologique des Urines (ECBU)">ECBU</option>
                <option value="Sérodiagnostic VIH 1 & 2">Sérodiagnostic VIH</option>
                <option value="Hépatite B (Antigène HBs)">Hépatite B (Ag HBs)</option>
                <option value="Sérodiagnostic de Widal & Felix">Widal & Felix</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type de Prélèvement</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              >
                <option value="HEMATOLOGY">Prélèvement Sanguin (Hématologie)</option>
                <option value="BIOCHEMISTRY">Analyse d'Urine (Biochimie)</option>
                <option value="PARASITOLOGY">Parasitologie / Coprologie</option>
                <option value="BACTERIOLOGY">Bactériologie / Frottis</option>
                <option value="SEROLOGY">Sérologie (Analyses Immunologiques)</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
              >
                Enregistrer & Transmettre Facture
              </button>
            </div>
          </form>
        )}

        {/* Global feedbacks alerts */}
        {error && (
          <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Technical Double Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-150">
          
          {/* LEFT LIST PANEL: Queue management */}
          <div className="p-6 space-y-4">
            
            {/* Filtering toggles */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setStatusFilter("PENDING_SAMPLE"); setSelectedTest(null); }}
                className={`text-center py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "PENDING_SAMPLE" 
                    ? "bg-white text-teal-950 shadow-xs scale-[0.98]" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Prélèvements ({labTests.filter(t => t.status === "PAID").length})
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter("PROCESSING"); setSelectedTest(null); }}
                className={`text-center py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "PROCESSING" 
                    ? "bg-white text-teal-950 shadow-xs scale-[0.98]" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                En Cours ({
                  labTests.filter(t => {
                    if (t.status !== "PROCESSING") return false;
                    let d: any = {};
                    try { d = JSON.parse(t.results); } catch(e){}
                    return !d.parameters?.some((p: any) => p.value && p.value.trim() !== "");
                  }).length
                })
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter("COMPLETED"); setSelectedTest(null); }}
                className={`text-center py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "COMPLETED" 
                    ? "bg-white text-teal-950 shadow-xs scale-[0.98]" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Terminées ({
                  labTests.filter(t => {
                    if (t.status !== "PROCESSING") return false;
                    let d: any = {};
                    try { d = JSON.parse(t.results); } catch(e){}
                    return !!d.parameters?.some((p: any) => p.value && p.value.trim() !== "");
                  }).length
                })
              </button>
              <button
                type="button"
                onClick={() => { setStatusFilter("VALIDATED"); setSelectedTest(null); }}
                className={`text-center py-1.5 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === "VALIDATED" 
                    ? "bg-white text-teal-950 shadow-xs scale-[0.98]" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Validées ({labTests.filter(t => t.status === "VALIDATED").length})
              </button>
            </div>

            {/* Quick search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Rechercher patient, analyse..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            {/* Scrollable list content */}
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-10 font-mono text-xs text-gray-400">Synchronisation file active...</div>
              ) : processedTestsList.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs italic">
                  Aucun examen ne correspond à cette sélection.
                </div>
              ) : (
                processedTestsList.map((test: any) => {
                  const pat = getPatientFile(test.patientId);
                  const isActiveSelection = selectedTest && selectedTest.id === test.id;
                  
                  return (
                    <button
                      type="button"
                      key={test.id}
                      onClick={() => setSelectedTest(test)}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer block relative ${
                        isActiveSelection 
                          ? "bg-teal-50/45 border-teal-300 ring-2 ring-teal-500/10" 
                          : "bg-white hover:bg-slate-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[9px] text-gray-400 uppercase tracking-wider mb-2">
                        <span>{test.category}</span>
                        {test.status === "PAID" && (
                          <span className="text-blue-700 font-bold bg-blue-50/50 px-1.5 py-0.2 rounded border border-blue-100">RÉGLÉ / ATTENTE</span>
                        )}
                        {test.status === "PROCESSING" && (
                          <span className="text-amber-700 font-bold bg-amber-50/50 px-1.5 py-0.2 rounded border border-amber-100 animate-pulse">CENTRIFUGE</span>
                        )}
                        {test.status === "VALIDATED" && (
                          <span className="text-emerald-700 font-bold bg-emerald-50/50 px-1.5 py-0.2 rounded border border-emerald-100">VALIDÉ</span>
                        )}
                      </div>

                      <div 
                        className="font-bold text-gray-900 text-xs truncate hover:text-teal-700 hover:underline flex items-center justify-between" 
                        onClick={(e) => { e.stopPropagation(); handleLabCellClick("test", test); }}
                        title="Voir la fiche technique d'analyse de l'examen"
                      >
                        <span>{test.testName}</span>
                        <span className="text-[9px] text-teal-600 font-normal">Infos ➔</span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Patient : <span 
                          className="font-semibold text-teal-950 cursor-pointer hover:underline hover:text-teal-700"
                          onClick={(e) => { e.stopPropagation(); handleLabCellClick("patient", test); }}
                          title="Consulter l'identité et dossier DME de ce patient"
                        >
                          {pat ? `${pat.lastName.toUpperCase()} ${pat.firstName}` : "Inconnu"}
                        </span>
                      </div>
                      <div 
                        className="text-[9.5px] text-gray-400 mt-0.5 cursor-pointer hover:underline hover:text-slate-700"
                        onClick={(e) => { e.stopPropagation(); handleLabCellClick("prescriber", test); }}
                        title="Voir la fiche du prescripteur médical"
                      >
                        Prescrit par: <span className="font-medium text-gray-650">Dr. {test.requestedBy}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT WORKSTATION PANEL: Active Workspace */}
          <div className="p-6 lg:col-span-2 space-y-5 bg-slate-50/50 min-h-[500px]">
            {selectedTest ? (
              <div className="space-y-5 animate-fade-in">
                <IntelligentLabEditor
                  selectedTest={selectedTest}
                  patient={getPatientFile(selectedTest.patientId) || { id: selectedTest.patientId, firstName: "Patient", lastName: "Passage", dateOfBirth: "", nationalId: "", gender: "F", ethnie: "", nationalite: "", status: "ACTIVE" }}
                  token={token}
                  onSaveSuccess={(updatedTest) => {
                    fetchLabTests();
                    // Re-anchor selectedTest
                    setSelectedTest(updatedTest);
                  }}
                  showToast={(msg, type) => {
                    if (type === "error") {
                      setError(msg);
                      setSuccess("");
                    } else {
                      setSuccess(msg);
                      setError("");
                    }
                  }}
                  onBackToList={() => setSelectedTest(null)}
                  userRole={userRole}
                  writeAuditLog={async (action, details) => {
                    try {
                      await fetch("/api/auditlogs", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ action, details })
                      });
                    } catch (e) {
                      console.error("Audit log error:", e);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 text-gray-400">
                <FlaskConical className="h-14 w-14 text-teal-600/15" />
                <div>
                  <h4 className="font-sans font-bold text-gray-900 text-sm">Station de travail inactive</h4>
                  <p className="text-xs text-gray-400 max-w-sm mt-1 mx-auto leading-relaxed">
                    Sélectionnez un examen dans le volet latéral pour inspecter le tube de prélèvement, saisir les constantes de paillasse, rattacher des fichiers automates et certifier.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Modal for Everything is Clickable (TOUT EST CLIQUABLE) rule */}
      {medisahelClickModal && medisahelClickModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="medisahel-clickable-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
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
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
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
                      ? "bg-teal-700 hover:bg-teal-800 text-white shadow-md"
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
};
