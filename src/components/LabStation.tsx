import React, { useState, useEffect } from "react";
import { FlaskConical, Search, Plus, Check, ShieldAlert, Radio, Clock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { LabTest, Patient } from "../types.ts";

interface LabStationProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const LabStation: React.FC<LabStationProps> = ({ token, patients, userRole }) => {
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    testName: "",
    category: "BLOOD"
  });
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
  }, [token]);

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

      setSuccess("Demande d'analyse prescrite avec succès ! Dispatching immédiat au laboratoire.");
      setFormData({ patientId: "", testName: "", category: "BLOOD" });
      setShowAddForm(false);
      fetchLabTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePublishResults = async (id: string, findings: string) => {
    setError("");
    setSuccess("");
    if (!findings.trim()) {
      setError("Les conclusions écrites de l'analyse ne peuvent pas être vides.");
      return;
    }

    try {
      const response = await fetch(`/api/labtests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "COMPLETED",
          results: findings
        })
      });
      if (!response.ok) throw new Error("Impossible d'enregistrer les conclusions.");
      setSuccess("Résultats d'analyse biologiques certifiés et rattachés au dossier !");
      fetchLabTests();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPatientName = (id: string) => {
    const p = patients.find(p => p.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient Inconnu";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="lab-station-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <FlaskConical className="h-5 w-5 text-teal-600 mr-2" />
            Station d'Analyses Biologiques & Laboratoire
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Demandes d'examens (NFS, TDR, examens d'urine, imageries), saisie de résultats sécurisés et validation de signatures.
          </p>
        </div>
        {(userRole === "DOCTOR" || userRole === "LAB_TECH" || userRole === "ADMIN") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="request-lab-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Prescrire un examen labo
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="request-lab-form">
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm text-gray-750 uppercase tracking-wider mb-1">Prescription d'Examen Médical Biologique</h3>
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
            <input
              type="text"
              value={formData.testName}
              onChange={e => setFormData({ ...formData, testName: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. NFS + Trophozoïtes du paludisme, Glycémie à jeun"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type de Prélèvement</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="BLOOD">Prélèvement Sanguin (Hématologie)</option>
              <option value="URINE">Analyse d'Urine (Biochimie)</option>
              <option value="IMAGING">Imagerie Médicale (Echographie, Radio)</option>
              <option value="OTHER">Autres types de swab / frottis</option>
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
              Envoyer en prescription labo
            </button>
          </div>
        </form>
      )}

      {/* Alerts */}
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

      {/* Test Queue Listings */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 border-l-4 border-teal-700 pl-2 text-sm uppercase tracking-wider mb-5">
          Suivi des examens
        </h3>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading lab queue list...</div>
        ) : labTests.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun examen biologique n'a été rattaché à la file active du laboratoire d'analyse.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {labTests.map(test => {
              const completed = test.status === "COMPLETED";
              return (
                <div
                  key={test.id}
                  className={`p-5 rounded-2xl border transition-all duration-150 relative overflow-hidden flex flex-col justify-between ${
                    completed ? "bg-slate-50 border-gray-200" : "bg-teal-50/10 border-teal-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-100 border border-gray-200 text-gray-600 uppercase">
                        {test.category}
                      </span>
                      {completed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Certifié
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                          <Clock className="h-3 w-3 mr-1" /> En attente
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-gray-950">{test.testName}</h4>
                    <p className="font-sans text-xs font-medium text-gray-500 mt-1">
                      Patient : <strong className="text-gray-900">{getPatientName(test.patientId)}</strong>
                    </p>
                    <p className="font-sans text-[11px] text-gray-400 mt-0.5">
                      Prescrit par: <span className="font-medium text-gray-600">{test.requestedBy}</span>
                    </p>

                    {/* Results conclusions */}
                    <div className="mt-4 bg-white p-3.5 rounded-xl border border-gray-150 text-sm font-sans font-medium text-gray-800 min-h-16 flex flex-col justify-center">
                      <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block mb-1">Résultats Certifiés:</span>
                      {completed ? (
                        <p className="text-teal-950 font-semibold">{test.results}</p>
                      ) : (
                        <p className="text-gray-400 italic">Prelevement et centrifugation en cours, conclusions non encore renseignees.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions for lab tech */}
                  {!completed && (userRole === "LAB_TECH" || userRole === "ADMIN") && (
                    <div className="mt-5 pt-3 border-t border-dashed border-gray-150 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-gray-400">Renseigner résultats</span>
                      <button
                        onClick={() => {
                          const findings = prompt(`Saisir les observations et mesures biologiques certifiées pour : ${test.testName}`);
                          if (findings) {
                            handlePublishResults(test.id, findings);
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        Enregistrer conclusions
                      </button>
                    </div>
                  )}

                  {completed && test.performedBy && (
                    <div className="mt-4 text-[10px] font-mono text-gray-400 border-t border-gray-100 pt-2 text-right">
                      Technicien: <span className="font-medium text-gray-600">{test.performedBy}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
