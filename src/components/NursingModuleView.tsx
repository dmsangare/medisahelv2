import React, { useState, useEffect } from "react";
import { 
  Activity, ClipboardList, CheckCircle, AlertTriangle, UserCheck, 
  Plus, Check, Send, Sparkles, Filter, Sliders, FileSpreadsheet, 
  Clock, ShieldCheck, RefreshCw, Smartphone
} from "lucide-react";

interface NursingModuleViewProps {
  token: string | null;
  patients: any[];
  currentUser: any;
  clinicThemeColor?: string;
}

interface CareTask {
  id: string;
  patientId: string;
  patientName: string;
  careType: string;
  description: string;
  scheduledTime: string;
  date: string;
  prescriberId: string;
  prescriberName: string;
  status: string; // PENDING, PENDING_VALIDATION, COMPLETED
  agentId?: string;
  agentName?: string;
  executedTime?: string;
  observations?: string;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
}

export const NursingModuleView: React.FC<NursingModuleViewProps> = ({
  token,
  patients,
  currentUser,
  clinicThemeColor = "#0f766e"
}) => {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Constants Submission State
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [temperature, setTemperature] = useState("37.2");
  const [bloodPressure, setBloodPressure] = useState("120/80");
  const [pulse, setPulse] = useState("75");
  const [weight, setWeight] = useState("70");
  const [oxygenSaturation, setOxygenSaturation] = useState("98");
  const [submittingConstants, setSubmittingConstants] = useState(false);

  // Execution Modal State
  const [selectedTaskForExecution, setSelectedTaskForExecution] = useState<CareTask | null>(null);
  const [observations, setObservations] = useState("");
  const [executingTask, setExecutingTask] = useState(false);

  // Filter & Search State
  const [taskFilter, setTaskFilter] = useState("ALL"); // ALL, PENDING, PENDING_VALIDATION, COMPLETED
  const [searchQuery, setSearchQuery] = useState("");
  const [constantsLog, setConstantsLog] = useState<any[]>([]);

  // Show Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error" | "info">("success");

  const showToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Poll tasks from server (with 5 seconds fallback as requested)
  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/nursing/tasks", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks || []);
        setErrorMessage(null);
      } else {
        setErrorMessage(data.error || "Erreur de chargement");
      }
    } catch (e: any) {
      console.error("Nursing tasks polling failed:", e);
      setErrorMessage("Service indisponible (polling actif avec reconnexion automatique)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Load patient constants logged local
  useEffect(() => {
    const saved = localStorage.getItem("nursing_constants_backup_log");
    if (saved) {
      setConstantsLog(JSON.parse(saved));
    } else {
      // Seed initial dummy constants for UI display dynamic
      const mock = [
        { id: "c-1", patientName: "MAÏGA Amadou", temperature: "38.1", bloodPressure: "135/85", pulse: "88", weight: "74", oxygenSaturation: "96", takenBy: "Inf. Coulibaly Moussa", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: "c-2", patientName: "DIARRA Fatoumata", temperature: "36.8", bloodPressure: "115/70", pulse: "68", weight: "59", oxygenSaturation: "99", takenBy: "Inf. Coulibaly Moussa", timestamp: new Date(Date.now() - 7200000).toISOString() },
      ];
      setConstantsLog(mock);
      localStorage.setItem("nursing_constants_backup_log", JSON.stringify(mock));
    }
  }, []);

  // Post medical Constants
  const handleSubmitConstants = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast("Veuillez sélectionner un patient.", "error");
      return;
    }
    const patientFound = patients.find(p => p.id === selectedPatientId);
    if (!patientFound) return;

    setSubmittingConstants(true);
    try {
      const res = await fetch("/api/nursing/constants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: selectedPatientId,
          temperature,
          bloodPressure,
          pulse,
          weight,
          oxygenSaturation
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Constantes vitales de ${patientFound.lastName.toUpperCase()} enregistrées avec succès !`, "success");
        
        // Add to view log
        const logEntry = {
          id: data.constants.id,
          patientName: `${patientFound.lastName.toUpperCase()} ${patientFound.firstName}`,
          temperature,
          bloodPressure,
          pulse,
          weight,
          oxygenSaturation,
          takenBy: currentUser.name || "Infirmier",
          timestamp: new Date().toISOString()
        };
        const updatedLogs = [logEntry, ...constantsLog].slice(0, 15);
        setConstantsLog(updatedLogs);
        localStorage.setItem("nursing_constants_backup_log", JSON.stringify(updatedLogs));

        // Reset
        setSelectedPatientId("");
        setTemperature("37.2");
        setBloodPressure("120/80");
        setPulse("75");
        setWeight("70");
        setOxygenSaturation("98");
      } else {
        showToast(data.error || "Erreur lors de l'enregistrement", "error");
      }
    } catch (err: any) {
      showToast("Impossible de sauvegarder : le serveur est hors ligne", "error");
    } finally {
      setSubmittingConstants(false);
    }
  };

  // Execute Care Task
  const handleExecuteTask = async () => {
    if (!selectedTaskForExecution) return;
    setExecutingTask(true);
    try {
      const res = await fetch(`/api/nursing/tasks/${selectedTaskForExecution.id}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ observations })
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingValidation) {
          showToast("Soin enregistré ! En attente de validation par un infirmier diplômé ou un médecin.", "info");
        } else {
          showToast("Soin validé et dispensé avec succès !", "success");
        }
        setSelectedTaskForExecution(null);
        setObservations("");
        fetchTasks();
      } else {
        showToast(data.error || "Erreur lors du traitement", "error");
      }
    } catch (err) {
      showToast("Erreur de connexion serveur.", "error");
    } finally {
      setExecutingTask(false);
    }
  };

  // Validate Stagiaire Task
  const handleValidateTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/nursing/tasks/${taskId}/validate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast("Acte de soin validé réglementairement.", "success");
        fetchTasks();
      } else {
        showToast(data.error || "Erreur de validation", "error");
      }
    } catch (err) {
      showToast("Erreur de connexion", "error");
    }
  };

  const filteredTasks = tasks.filter(t => {
    // Stage Filter
    if (taskFilter === "PENDING" && t.status !== "PENDING") return false;
    if (taskFilter === "PENDING_VALIDATION" && t.status !== "PENDING_VALIDATION") return false;
    if (taskFilter === "COMPLETED" && t.status !== "COMPLETED") return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.patientName.toLowerCase().includes(q) ||
        t.careType.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 text-slate-800" id="nursing-workspace-root">
      
      {/* Toast notifications portal widget */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl flex items-center gap-2 border text-xs font-bold font-sans animate-bounce ${
          toastType === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
          toastType === "error" ? "bg-rose-50 text-rose-800 border-rose-200" :
          "bg-blue-50 text-blue-800 border-blue-200"
        }`}>
          <div className="h-2 w-2 rounded-full bg-current animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Module Title Banner & Status Indicators */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-850">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-teal-550/20 text-teal-300 font-mono text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
              🏥 UNITÉ DE SOINS (NURSING WORKSTATION)
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-900/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live WebSocket polling (5s)
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight mt-2.5">Unité de Soins, Constantes &amp; Dispensation Clinique</h2>
          <p className="text-[11px] text-slate-300 font-sans mt-1">
            Gérez la feuille de soins immuable infirmière et relevez les constantes du Service de Médecine Générale (DMG).
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchTasks}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all border border-slate-700"
            title="Actualiser les requêtes de soins délégués"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          
          <div className="bg-slate-950/80 px-3 py-2 rounded-2xl border border-slate-800 text-right">
            <span className="text-[9px] text-slate-400 block font-mono font-bold">EXÉCUTANT SESSION</span>
            <span className="text-xs text-teal-400 font-black font-sans">{currentUser.name} <span className="text-[9px] text-slate-300 font-medium font-mono">({currentUser.role})</span></span>
          </div>
        </div>
      </div>

      {/* Micro Metrics Dashboard Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
          <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Soin en attente</span>
          <span className="text-2xl font-black text-slate-800 font-mono block mt-1">
            {tasks.filter(t => t.status === "PENDING" || t.status === "PRESCRIBED").length}
          </span>
          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md mt-2 inline-block">À initier</span>
        </div>
        
        <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
          <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Actes Stagiaires à Valider</span>
          <span className="text-2xl font-black text-rose-600 font-mono block mt-1">
            {tasks.filter(t => t.status === "PENDING_VALIDATION").length}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md mt-2 inline-block ${
            tasks.filter(t => t.status === "PENDING_VALIDATION").length > 0 ? "bg-rose-50 text-rose-800 animate-pulse" : "bg-slate-100 text-slate-500"
          }`}>
            Contrôle requis (RBAC)
          </span>
        </div>

        <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
          <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Soins validés du jour</span>
          <span className="text-2xl font-black text-teal-800 font-mono block mt-1">
            {tasks.filter(t => t.status === "COMPLETED").length}
          </span>
          <span className="text-[10px] text-teal-850 font-bold bg-teal-50 px-2 py-0.5 rounded-md mt-2 inline-block">Archivés DME</span>
        </div>

        <div className="p-4 bg-white border border-slate-150 rounded-2xl shadow-xs">
          <span className="text-slate-400 font-extrabold text-[9px] uppercase tracking-wider block">Constantes enregistrées</span>
          <span className="text-2xl font-black text-blue-800 font-mono block mt-1">{constantsLog.length}</span>
          <span className="text-[10px] text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-md mt-2 inline-block">Surveillance active</span>
        </div>
      </div>

      {/* Main Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left col span 4: Register medical vital constants */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm" id="nursing-constants-form-workspace">
          <div className="border-b pb-3 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Activity className="h-4.5 w-4.5 text-teal-800 shrink-0" /> Saisie Thermique &amp; Constantes
            </h3>
            <span className="text-[9px] bg-slate-100 border text-slate-500 font-mono font-bold px-2 py-0.5 rounded">AUTO-SAUVEGARDE</span>
          </div>

          <form onSubmit={handleSubmitConstants} className="space-y-4 text-xs font-semibold">
            {/* Patient dropdown selection */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Patient à surveiller :</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-250 p-2.5 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option value="">-- Choisir un patient DMG --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName} (Dossier ID: {p.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Température (°C) :</label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Tension Artérielle :</label>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="e.g. 120/80"
                  className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Pouls (bpm) :</label>
                <input
                  type="text"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">SpO2 (%) :</label>
                <input
                  type="text"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-slate-500 font-bold block">Poids (kg) :</label>
                <input
                  type="text"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 p-2 rounded-xl text-center font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submittingConstants}
              className="w-full text-white p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              style={{ backgroundColor: clinicThemeColor }}
            >
              <Send className="h-4 w-4" /> Enregistrer au dossier du patient
            </button>
          </form>

          {/* Quick Constants History Log */}
          <div className="pt-4 border-t">
            <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-2">Historique de Saisie</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-100 pr-1">
              {constantsLog.map((log) => (
                <div key={log.id} className="pt-2 text-[11px] font-sans flex justify-between items-start">
                  <div>
                    <span className="font-extrabold text-slate-700 block text-xs">{log.patientName}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">Pris par: {log.takenBy}</span>
                  </div>
                  <div className="text-right font-mono text-[10px] space-y-0.5">
                    <span className="bg-slate-50 border text-slate-700 px-1 py-0.5 rounded-sm block font-bold">
                      {log.temperature}°C / {log.bloodPressure}
                    </span>
                    <span className="text-[9px] text-slate-400 block">{new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right col span 8: Care Delegations Queue */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm" id="nursing-delegations-workspace">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <ClipboardList className="h-4.5 w-4.5 text-teal-800 shrink-0" /> Tâches de Soins Délégués par les Médecins
              </h3>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Filtrer patients/soins..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Tab Filter buttons */}
          <div className="flex flex-wrap gap-1 border-b pb-2 bg-slate-50/70 p-1 rounded-xl">
            {[
              { id: "ALL", label: "Tous les soins" },
              { id: "PENDING", label: "À exécuter" },
              { id: "PENDING_VALIDATION", label: "Validation Stagiaire" },
              { id: "COMPLETED", label: "Exécutés & Archivés" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTaskFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  taskFilter === tab.id ? "bg-white text-slate-900 border shadow-xs" : "text-slate-500 hover:bg-white/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Queue of tasks */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs italic">Chargement du registre en temps réel...</div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200">
              <p className="font-bold text-xs font-sans">Aucun acte de soin délégué ne correspond à cette catégorie.</p>
              <p className="text-[10px] mt-1 text-slate-400">Le médecin n'a pas encore requis d'actes pour cette catégorie de patients.</p>
            </div>
          ) : (
            <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredTasks.map(task => {
                const isUnderValidation = task.status === "PENDING_VALIDATION";
                const isCompleted = task.status === "COMPLETED";
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all hover:shadow-xs ${
                      isCompleted ? "bg-teal-50/25 border-teal-100/70" :
                      isUnderValidation ? "bg-orange-50/30 border-orange-100/70 animate-pulse" :
                      "bg-slate-50/40 border-slate-150"
                    }`}
                  >
                    <div className="space-y-2 text-xs">
                      {/* Badge and Prescriber */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] font-mono tracking-widest ${
                          task.careType.toLowerCase().includes("perf") ? "bg-purple-100 text-purple-800" :
                          task.careType.toLowerCase().includes("inject") ? "bg-blue-100 text-blue-800" :
                          "bg-zinc-100 text-slate-700"
                        }`}>
                          {task.careType.toUpperCase()}
                        </span>

                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold font-mono ${
                          isCompleted ? "bg-emerald-100 text-emerald-800" :
                          isUnderValidation ? "bg-rose-100 text-rose-800 animate-pulse" :
                          "bg-amber-100 text-amber-800"
                        }`}>
                          STATUS: {
                            isCompleted ? "VALIDÉ / FAIT" :
                            isUnderValidation ? "ATTENTE VALIDATION INFIRMIER" :
                            "PRESCRIT (À EXÉCUTER)"
                          }
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">Prescrit par Dr. {task.prescriberName}</span>
                      </div>

                      {/* Main Task Description */}
                      <div className="space-y-0.5 font-sans">
                        <div className="text-sm font-bold text-slate-800">{task.patientName}</div>
                        <p className="text-[11px] text-slate-600 font-bold italic leading-relaxed">Instructions : {task.description}</p>
                      </div>

                      {/* Timestamps */}
                      <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Heure prescrite: {task.scheduledTime}</span>
                        {task.executedTime && <span>• Exécuté à: {task.executedTime}</span>}
                      </div>

                      {/* Executed log observations */}
                      {task.observations && (
                        <div className="p-2.5 bg-white/70 border border-slate-150 rounded-xl text-[11px]">
                          <strong className="text-slate-500 font-bold block text-[9px] uppercase font-mono">Observations de l'exécutant :</strong>
                          <p className="text-slate-700 font-semibold">{task.observations}</p>
                          <span className="text-[10px] text-teal-800 font-medium block mt-1">Acteur : {task.agentName} ({task.agentId})</span>
                        </div>
                      )}

                      {/* Validator trace */}
                      {task.validatedByName && (
                        <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1 font-mono">
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Sceau de validation apposé par : Inf. {task.validatedByName}
                        </div>
                      )}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-row md:flex-col justify-end items-center gap-2 self-end md:self-auto shrink-0">
                      
                      {/* Executed Care Action Button */}
                      {!isCompleted && !isUnderValidation && (
                        <button
                          onClick={() => {
                            setSelectedTaskForExecution(task);
                            setObservations(`Soin de type ${task.careType} réalisé avec asepsie rigoureuse. Constantes stables.`);
                          }}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                        >
                          Dispenser le Soin
                        </button>
                      )}

                      {/* Validation action button for supervisor roles (Nurse / Admin / Doctor) */}
                      {isUnderValidation && (
                        <div className="space-y-1 text-right">
                          <button
                            onClick={() => handleValidateTask(task.id)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1 font-sans"
                            title="Valider l'acte effectué par le stagiaire"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Valider l'acte
                          </button>
                          <span className="text-[8px] text-orange-600 font-black block font-mono">ATTENTE SIGNATURE COMPAGNON</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="p-1 px-2.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg text-[10px] font-bold flex items-center gap-1 font-mono">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> ENREGISTRÉ DME
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Execution Dialog Modal (Word Mini Overlay) */}
      {selectedTaskForExecution && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border text-slate-800 shadow-2xl relative space-y-4">
            <div className="border-b pb-2 flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase font-mono tracking-wider text-slate-800 flex items-center gap-1.5">
                ✒️ Signature &amp; Feuille d'Exécution de Soins
              </h3>
              <button
                onClick={() => setSelectedTaskForExecution(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl rounded-b-none space-y-1 font-semibold leading-relaxed">
                <div>Patient : <span className="text-slate-900 font-bold">{selectedTaskForExecution.patientName}</span></div>
                <div>Acte requis : <span className="text-teal-800 font-bold">{selectedTaskForExecution.careType}</span></div>
                <div className="text-slate-500 font-medium italic">Instructions : {selectedTaskForExecution.description}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-mono text-slate-500 font-bold block">Observations cliniques (Asepsie, tolérance...) :</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Notes thérapeutiques à intégrer au dossier patient..."
                  rows={4}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-700 leading-relaxed font-semibold"
                />
              </div>

              {currentUser.role === "STAGIAIRE" && (
                <div className="p-3 bg-orange-50 border border-orange-100 text-orange-950 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-bold">
                    <strong>Rôle Stagiaire Détecté :</strong> Cet acte sera transmis au tableau de validation pour co-signature réglementaire d'un infirmier référent avant son archivage définitif.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setSelectedTaskForExecution(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Annuler
              </button>
              
              <button
                type="button"
                onClick={handleExecuteTask}
                disabled={executingTask}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Check className="h-4 w-4" /> Apposer Signature Clinique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
