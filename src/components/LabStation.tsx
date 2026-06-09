import React, { useState, useEffect } from "react";
import { 
  FlaskConical, Search, Plus, Check, ShieldAlert, Radio, Clock, ShieldCheck, 
  CheckCircle2, FileText, UploadCloud, AlertTriangle, RotateCcw, CheckSquare, 
  Layers, FileSpreadsheet, Binary, History, Lock
} from "lucide-react";
import { LabTest, Patient } from "../types.ts";

interface LabStationProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const LabStation: React.FC<LabStationProps> = ({ token, patients, userRole }) => {
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
      setLabTests(data);

      // Keep selected test in workstation synced if currently editing
      if (selectedTest) {
        const updatedSelected = data.find((t: any) => t.id === selectedTest.id);
        if (updatedSelected) {
          setSelectedTest(updatedSelected);
        }
      }
    } catch (err: any) {
      setError(err.message);
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
    const p = patients.find(p => p.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient de Passage";
  };

  const getPatientFile = (id: string) => {
    return patients.find(p => p.id === id);
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
                {patients.map(p => (
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

                      <div className="font-bold text-gray-900 text-xs truncate">{test.testName}</div>
                      <div className="text-[11px] text-gray-600 mt-1">
                        Patient : <span className="font-semibold text-teal-950">{pat ? `${pat.lastName.toUpperCase()} ${pat.firstName}` : "Inconnu"}</span>
                      </div>
                      <div className="text-[9.5px] text-gray-400 mt-0.5">
                        Prescrit par: Dr. {test.requestedBy}
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
                
                {/* File Header */}
                <div className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col md:flex-row justify-between gap-3.5 shadow-sm">
                  <div>
                    <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest font-bold">Dossier technique de paillasse</span>
                    <h3 className="font-sans font-bold text-teal-950 text-sm mt-0.5">
                      {getPatientName(selectedTest.patientId)}
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {getPatientFile(selectedTest.patientId)?.nationalId ? `NID: ${getPatientFile(selectedTest.patientId)?.nationalId} | ` : ""}
                      {getPatientFile(selectedTest.patientId)?.gender === "M" ? "HOMME" : "FEMME"}  
                      {getPatientFile(selectedTest.patientId)?.dateOfBirth ? ` | DDN: ${new Date(getPatientFile(selectedTest.patientId)!.dateOfBirth).toLocaleDateString("fr-FR")}` : ""}
                    </p>
                  </div>

                  <div className="text-right border-t md:border-t-0 md:border-l border-gray-100 pt-2 md:pt-0 md:pl-4 self-start md:self-center font-mono text-[10.5px]">
                    <div className="text-gray-400">EXAMEN : <span className="font-semibold text-gray-800">{selectedTest.testName}</span></div>
                    <div className="text-gray-400 mt-0.5">PRESCRIT PAR : <span className="font-semibold text-gray-700">Dr. {selectedTest.requestedBy}</span></div>
                  </div>
                </div>

                {/* Verification/Warning alert regarding post validation overrides */}
                {selectedTest.status === "VALIDATED" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1.5 text-xs text-amber-900 shadow-xs">
                    <div className="flex items-center font-black">
                      <AlertTriangle className="h-4.5 w-4.5 mr-2 text-amber-600 animate-bounce" />
                      SÉCURITÉ : RÉSULTATS BIOLOGIQUES CERTIFIÉS
                    </div>
                    <p className="leading-relaxed text-gray-600">
                      Cet examen de laboratoire a déjà été certifié et verrouillé biologiquement. Toute modification de mesure clinique écrasera l'état actuel et **générera automatiquement une nouvelle version de résultats**. Une notification d'amendement sera transmise à l'Audit Log. Le clinicien prescripteur verra l'historique d'override.
                    </p>
                  </div>
                )}

                {/* Centrifugation / Sample launch if status remains Paid */}
                {selectedTest.status === "PAID" && (
                  <div className="p-5 bg-teal-50/40 border border-teal-150 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-xs">
                      <h4 className="font-bold text-teal-900 font-sans">Échantillon reçu en laboratoire (Paiement vérifié)</h4>
                      <p className="text-gray-500 leading-snug mt-1">Vous devez lancer l'analyse pour déverrouiller la saisie de constantes biologiques.</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLaunchCentrifugation(selectedTest.id)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 font-bold text-white text-xs rounded-xl transition-colors cursor-pointer shadow-sm flex items-center"
                    >
                      <Layers className="h-4 w-4 mr-1.5" /> Enregistrer le Prélèvement (Transit)
                    </button>
                  </div>
                )}

                {/* Saisie workstation parameters form */}
                {(selectedTest.status === "PROCESSING" || selectedTest.status === "VALIDATED") && (
                  <div className="space-y-4">
                    
                    {/* Structure Parameters Grid */}
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider border-l-3 border-teal-700 pl-2">
                        Saisie des Paramètres et Constantes Biologiques
                      </h4>

                      {parameters.length === 0 ? (
                        <p className="text-xs text-gray-400 italic text-center py-2">Ce type d'analyse ne possède pas d'arbre de paramètres préfixés. Veuillez renseigner l'interprétation ci-dessous.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 text-gray-400 font-mono uppercase tracking-wider text-[10.5px]">
                                <th className="pb-2">Désignation</th>
                                <th className="pb-2">Valeur Mesurée</th>
                                <th className="pb-2">Unité</th>
                                <th className="pb-2">Valeurs de Référence</th>
                                <th className="pb-2">Interprétation</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {parameters.map((p, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-semibold text-gray-800">{p.name}</td>
                                  <td className="py-2.5">
                                    <input
                                      type="text"
                                      value={p.value}
                                      onChange={e => {
                                        const newParams = [...parameters];
                                        newParams[idx].value = e.target.value;
                                        setParameters(newParams);
                                      }}
                                      className="w-24 px-2 py-1 bg-slate-50 border border-gray-200 rounded-lg text-xs font-bold font-mono focus:bg-white focus:ring-1 focus:ring-teal-700 focus:outline-none"
                                      placeholder="Résultat"
                                    />
                                  </td>
                                  <td className="py-2.5 text-gray-500 font-mono">
                                    <input
                                      type="text"
                                      value={p.unit}
                                      onChange={e => {
                                        const newParams = [...parameters];
                                        newParams[idx].unit = e.target.value;
                                        setParameters(newParams);
                                      }}
                                      className="w-16 px-1.5 py-0.5 border-b border-transparent hover:border-gray-300 text-xs text-gray-600 focus:border-teal-700 focus:outline-none font-mono"
                                    />
                                  </td>
                                  <td className="py-2.5 text-gray-500 font-mono">
                                    <input
                                      type="text"
                                      value={p.reference}
                                      onChange={e => {
                                        const newParams = [...parameters];
                                        newParams[idx].reference = e.target.value;
                                        setParameters(newParams);
                                      }}
                                      className="w-20 px-1.5 py-0.5 border-b border-transparent hover:border-gray-300 text-xs text-gray-600 focus:border-teal-700 focus:outline-none font-mono"
                                    />
                                  </td>
                                  <td className="py-2.5">
                                    <select
                                      value={p.interpretation || "Normal"}
                                      onChange={e => {
                                        const newParams = [...parameters];
                                        newParams[idx].interpretation = e.target.value;
                                        setParameters(newParams);
                                      }}
                                      className="px-2 py-1 bg-slate-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none"
                                    >
                                      <option value="Normal">Normal</option>
                                      <option value="Elevé">Elevé</option>
                                      <option value="Bas">Bas</option>
                                      <option value="Critique">Critique</option>
                                      <option value="Positif">Positif</option>
                                      <option value="Négatif">Négatif</option>
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Interpretation and Technicial Observations */}
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider border-l-3 border-teal-700 pl-2">
                        Synthèse Globale & Validation Biologique
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Conclusion Diagnostique / Interprétation</label>
                          <textarea
                            value={interpretation}
                            onChange={e => setInterpretation(e.target.value)}
                            rows={3}
                            placeholder="e.g. Profil hématologique normal. Légère anémie microcytaire..."
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none focus:bg-white resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Observations Techniques de Paillasse</label>
                          <textarea
                            value={observations}
                            onChange={e => setObservations(e.target.value)}
                            rows={3}
                            placeholder="e.g. Prélèvement de bonne qualité, absence d'hémolyse visible."
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none focus:bg-white resize-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Automated Machine d'Analyse Utilisé</label>
                          <input
                            type="text"
                            value={machineUsed}
                            onChange={e => setMachineUsed(e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none focus:bg-white"
                            placeholder="e.g. Sysmex XN-350 Hematology Analyzer"
                          />
                        </div>

                        {/* File attachments */}
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Rattachement Fichier Automate</label>
                          {uploadedFile ? (
                            <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                              <div className="flex items-center space-x-2 truncate">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="truncate text-xs">
                                  <div className="font-bold text-emerald-950 truncate">{uploadedFile.fileName}</div>
                                  <div className="text-[10px] text-gray-450 uppercase font-mono">{uploadedFile.fileType} | {uploadedFile.fileSize}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setUploadedFile(null)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-200 p-2 text-center rounded-xl bg-slate-50/50">
                              <div className="text-[10px] text-gray-400">Intégrer les RAW DATA de l'automate :</div>
                              <div className="flex justify-center gap-1.5 mt-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAttachMachineReport("XLSX")}
                                  disabled={isUploading}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 text-[10px] font-semibold border rounded-lg text-gray-600 font-mono shadow-xs cursor-pointer"
                                >
                                  {isUploading ? "..." : "+ EXCEL"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAttachMachineReport("PDF")}
                                  disabled={isUploading}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 text-[10px] font-semibold border rounded-lg text-gray-600 font-mono shadow-xs cursor-pointer"
                                >
                                  {isUploading ? "..." : "+ PDF Spectra"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAttachMachineReport("CSV")}
                                  disabled={isUploading}
                                  className="px-2 py-1 bg-white hover:bg-slate-50 text-[10px] font-semibold border rounded-lg text-gray-600 font-mono shadow-xs cursor-pointer"
                                >
                                  {isUploading ? "..." : "+ CSV Integrator"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Override inputs mandatory if validated */}
                    {selectedTest.status === "VALIDATED" && (
                      <div className="bg-white border-2 border-amber-300 p-6 rounded-2xl shadow-sm space-y-3">
                        <label className="block text-xs font-black text-rose-950 uppercase tracking-wide flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-amber-500 shrink-0" /> Restrictive override reason <span className="text-rose-600">*</span>
                        </label>
                        <p className="text-[11px] text-gray-400">Pour assurer la conformité d'audit, expliquez le motif technique/fautes de saisie pour justifier la modification de cet examen déjà validé.</p>
                        <input
                          type="text"
                          value={overrideReason}
                          onChange={e => setOverrideReason(e.target.value)}
                          className="w-full h-11 px-3 py-2 bg-amber-50/10 border border-amber-300 rounded-xl text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          placeholder="e.g. Faute de frappe sur le taux d'hémoglobine lors de la saisie manuelle."
                        />
                      </div>
                    )}

                    {/* Digital Signature seal view */}
                    <div className="p-4 bg-teal-900 text-teal-50 border border-teal-950 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 animate-pulse" />
                          <span className="text-[11px] font-extrabold uppercase font-sans tracking-widest text-emerald-200">Sceau de Protection Bio-Biologique</span>
                        </div>
                        <p className="text-[11.5px] leading-relaxed text-teal-100/80 mt-1 max-w-lg">
                          La validation de cet examen apposera la signature électronique dématérialisée de l'utilisateur **{userRole === "LAB_TECH" ? "Technicien de Labo" : "Administrateur"}** ({token ? "Certificat SSL Actif" : "Bypass Local"}). Le rapport PDF DME sera automatiquement consolidé et verrouillé.
                        </p>
                      </div>

                      <div className="shrink-0 text-center md:text-right border-t md:border-t-0 md:border-l border-teal-800 pt-2.5 md:pt-0 md:pl-4">
                        <span className="text-[9px] font-mono block text-teal-300 uppercase tracking-widest">Opérateur Clinique</span>
                        <span className="text-xs font-bold block mt-0.5">{userRole === "LAB_TECH" ? "Laborantin de service" : "Pr. Biologiste / Admin"}</span>
                        <span className="text-[9.5px] font-mono block text-emerald-300 mt-0.5">Certifié AES-256</span>
                      </div>
                    </div>

                    {/* Technican Action Buttons */}
                    <div className="flex justify-between items-center gap-4 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTest(null)}
                        className="p-2.5 border border-gray-300 bg-white hover:bg-slate-50 text-gray-700 text-xs rounded-xl transition-all cursor-pointer font-sans font-semibold flex items-center shadow-xs"
                      >
                        Fermer le plan clinique
                      </button>

                      <div className="flex gap-2">
                        {selectedTest.status !== "VALIDATED" && (
                          <button
                            type="button"
                            onClick={() => handleSaveWorkspace(false)}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 font-bold text-gray-800 text-xs rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            Sauvegarder Brouillon
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleSaveWorkspace(true)}
                          className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center"
                        >
                          <CheckSquare className="h-4 w-4 mr-1.5" /> 
                          {selectedTest.status === "VALIDATED" ? "Appliquer Modifications (V#)" : "Certifier & Valider l'Examen"}
                        </button>
                      </div>
                    </div>

                    {/* Historical versions of clinical override backup logs */}
                    {selectedTest.results && (() => {
                      let r: any = {};
                      try {
                        r = JSON.parse(selectedTest.results);
                      } catch(e) {}
                      return r.versions && r.versions.length > 0 ? (
                        <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-sm space-y-4 shadow-inner">
                          <h4 className="font-sans font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center">
                            <History className="h-4 w-4 text-teal-700 mr-2" />
                            Historique des Versions de l'Examen ({r.versions.length})
                          </h4>
                          <span className="text-[11px] text-gray-400 block mt-0.5">Ce rapport biologique a fait l'objet de modifications suite à sa validation initiale. Les anciennes constantes écrasées sont préservées ci-dessous par déontologie clinique :</span>

                          <div className="space-y-3.5 divide-y divide-gray-100">
                            {r.versions.map((ver: any, index: number) => {
                              let verPayload: any = {};
                              try {
                                verPayload = JSON.parse(ver.results);
                              } catch(e) {}
                              return (
                                <div key={index} className="pt-3.5 first:pt-0 text-[11px]">
                                  <div className="flex justify-between items-center bg-amber-50/50 p-2 rounded-lg border border-amber-100/60 font-mono">
                                    <span className="font-bold text-amber-900">VERSION #{ver.version}</span>
                                    <span className="text-gray-400">Modifié par : {ver.modifiedBy} le {new Date(ver.modifiedAt).toLocaleString("fr-FR")}</span>
                                  </div>
                                  <p className="mt-1.5 text-gray-600 font-medium">Motif clinique : <span className="text-gray-900 italic font-normal">"{ver.reason}"</span></p>
                                  
                                  {verPayload.parameters && (
                                    <div className="mt-2 text-gray-500 font-mono space-y-1 pl-4 border-l-2 border-gray-150 py-1">
                                      {verPayload.parameters.map((p: any, idx: number) => (
                                        <div key={idx}>• {p.name} : {p.value} {p.unit} ({p.interpretation})</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
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
    </div>
  );
};
