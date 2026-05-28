import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Activity, AlertTriangle, ChevronRight, Stethoscope, Clock, ShieldAlert } from "lucide-react";

interface Suggestion {
  maladie: string;
  codeCIM10: string;
  probabilite: "Élevée" | "Moyenne" | "Faible" | string;
  explication: string;
  actionsRecommandees: string[];
}

interface AIDiagnosisResult {
  suggestions: Suggestion[];
  niveauUrgence: string;
  conseilsMedicationAvertissement: string;
  simulated?: boolean;
}

interface AIDiagnosisPanelProps {
  patientAge?: string;
  patientSexe?: "M" | "F" | string;
  patientHistory?: string;
  onApplyDiagnostic?: (diag: string, code: string, treatment: string) => void;
}

export default function AIDiagnosisPanel({
  patientAge = "",
  patientSexe = "M",
  patientHistory = "",
  onApplyDiagnostic
}: AIDiagnosisPanelProps) {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState(patientAge);
  const [sex, setSex] = useState(patientSexe);
  const [history, setHistory] = useState(patientHistory);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIDiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError("Veuillez saisir les symptômes réels constatés par le médecin.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem("medishahel_token");
      const resp = await fetch("/api/ai/diagnose", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          symptoms,
          history,
          age,
          sex
        })
      });

      if (!resp.ok) {
        throw new Error("Impossible de joindre le service d'aide au diagnostic");
      }

      const data: AIDiagnosisResult = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la communication avec le module intelligent");
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgenceBadgeColor = (urg: string) => {
    const u = urg.toLowerCase();
    if (u.includes("rouge") || u.includes("immédiat") || u.includes("immediat")) {
      return "bg-red-50 text-red-700 border-red-200 ring-red-500/10";
    }
    if (u.includes("orange") || u.includes("très urgent") || u.includes("tres urgent")) {
      return "bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/10";
    }
    if (u.includes("jaune") || u.includes("urgent")) {
      return "bg-yellow-50 text-yellow-800 border-yellow-200 ring-yellow-500/10";
    }
    return "bg-green-50 text-green-700 border-green-200 ring-green-500/10";
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden" id="ai-diagnosis-widget">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-5 py-3.5 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 animate-pulse text-sky-200" />
          <div>
            <h4 className="font-semibold text-sm">Aide au Diagnostic & Codage CIM-10</h4>
            <p className="text-[11px] text-sky-100 font-medium">Assistant Clinique Intelligent MédiSahel IA</p>
          </div>
        </div>
        <span className="text-[10px] bg-sky-500/40 text-sky-50 px-2 py-0.5 rounded-full uppercase font-semibold">
          Offline Backup Live
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Âge</label>
            <input
              type="text"
              placeholder="ex: 35 ans, 8 mois"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:border-sky-500 focus:outline-none"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sexe</label>
            <select
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:border-sky-500 focus:outline-none"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Antécédents majeurs</label>
            <input
              type="text"
              placeholder="ex: Diabète type II, HTA"
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 focus:border-sky-500 focus:outline-none"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Symptômes cliniques et plaintes du patient <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="Saisissez les symptômes (ex: forte fièvre, courbatures, yeux jaunes, céphalées intenses depuis 3 jours...)"
            className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 focus:border-sky-500 focus:outline-none"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 text-xs px-3 py-2 rounded-lg border border-red-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={isLoading}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          {isLoading ? (
            <>
              <Clock className="h-4 w-4 animate-spin" />
              <span>Analyse clinique en cours par l'ordinateur...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-sky-200" />
              <span>Faire une suggestion diagnostique IA (CIM-10)</span>
            </>
          )}
        </button>

        {/* Results Stream */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 pt-4 border-t border-slate-150 space-y-4"
            >
              {result.simulated && (
                <div className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 flex items-center gap-2 text-[11px] text-amber-800">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Mode Hors-Ligne local activé (simulation intelligente locale active sans clé d'API).</span>
                </div>
              )}

              {/* Triage Urgences level */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Activity className="h-4 w-4 text-sky-600" /> Priorisation recomandée :
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${getUrgenceBadgeColor(result.niveauUrgence)}`}>
                  {result.niveauUrgence}
                </span>
              </div>

              {/* Suggestions list */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Pathologies Différentielles (Classification CIM-10)
                </span>

                <div className="grid grid-cols-1 gap-2.5">
                  {result.suggestions.map((sug, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2 hover:bg-slate-100/50 transition-all text-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h5 className="font-bold text-slate-900">{sug.maladie}</h5>
                          <span className="inline-block mt-0.5 text-[10px] font-mono bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold">
                            CIM-10 : {sug.codeCIM10}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-extrabold ${
                          sug.probabilite === "Élevée" || sug.probabilite === "High"
                            ? "bg-red-100 text-red-800"
                            : sug.probabilite === "Moyenne" || sug.probabilite === "Medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}>
                          P: {sug.probabilite}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed italic">
                        {sug.explication}
                      </p>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-500 block">Actions recommandées :</span>
                        <div className="grid grid-cols-1 gap-0.5">
                          {sug.actionsRecommandees.map((act, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                              <ChevronRight className="h-3 w-3 text-sky-500" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {onApplyDiagnostic && (
                        <button
                          onClick={() => {
                            const treatments = sug.actionsRecommandees.map(a => `- ${a}`).join("\n");
                            onApplyDiagnostic(sug.maladie, sug.codeCIM10, treatments);
                          }}
                          className="mt-1 flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-800 font-semibold uppercase bg-sky-50 border border-sky-150 rounded px-2 py-1 cursor-pointer"
                        >
                          <Stethoscope className="h-3 w-3" />
                          <span>Copier dans l'ordonnance</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Warning Notification Banner */}
              <div className="bg-sky-50 rounded-xl p-3 border border-sky-100/80 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-sky-800 font-bold">
                  <ShieldAlert className="h-4 w-4 text-sky-600" />
                  <span>Prise en charge nationale sahélienne</span>
                </div>
                <p className="text-sky-950 font-medium leading-relaxed">
                  {result.conseilsMedicationAvertissement}
                </p>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
