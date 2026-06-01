import React, { useState, useEffect } from "react";
import { Bed, UserCheck, ShieldAlert, Check, Calendar, Plus, Info, CheckCircle2 } from "lucide-react";
import { Hospitalization, Patient } from "../types.ts";

interface HospitalizationTrackerProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const HospitalizationTracker: React.FC<HospitalizationTrackerProps> = ({ token, patients, userRole }) => {
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    bedNumber: "",
    roomNumber: "",
    reason: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchHospitalizations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hospitalizations", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les hospitalisations");
      setHospitalizations(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalizations();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || !formData.roomNumber || !formData.bedNumber || !formData.reason) {
      setError("Les champs Patient, Chambre, Lit et Motif d'admission sont obligatoires.");
      return;
    }

    try {
      const response = await fetch("/api/hospitalizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Echec de l'admission");

      setSuccess("Patient admis en service d'hospitalisation avec succès !");
      setFormData({ patientId: "", roomNumber: "", bedNumber: "", reason: "", notes: "" });
      setShowAddForm(false);
      fetchHospitalizations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDischarge = async (id: string, dischargeNotes: string) => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/hospitalizations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "DISCHARGED",
          dischargeDate: new Date().toISOString(),
          notes: dischargeNotes
        })
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Échec de sortie");
      }
      setSuccess("Fin d'hospitalisation enregistrée avec succès. Lit libéré.");
      fetchHospitalizations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPatientFullName = (id: string) => {
    const found = patients.find(p => p.id === id);
    return found ? `${found.lastName.toUpperCase()} ${found.firstName}` : "Patient Inconnu";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="hospitalization-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Bed className="h-5 w-5 text-teal-600 mr-2" />
            Suivi des Hospitalisations (Lits & Chambres)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Gestion de l'occupation des lits, admissions en urgence ou programmées et rapports de fin de séjour.
          </p>
        </div>
        {(userRole === "DOCTOR" || userRole === "NURSE" || userRole === "ADMIN") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="admit-patient-btn"
          >
            <Plus className="h-4 w-4 mr-2" />
            Admettre un Patient
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="admit-patient-form">
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Formulaire d'Admission Interne</h3>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro de Chambre <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.roomNumber}
              onChange={e => setFormData({ ...formData, roomNumber: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Chambre 105"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Désignation du Lit <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.bedNumber}
              onChange={e => setFormData({ ...formData, bedNumber: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Lit B"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Motif médical d'hospitalisation <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.reason}
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Complications respiratoires aiguës, observation post-chirurgicale"
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Observations infirmières initiales (Facultatif)</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Constantes stables à l'admission. Perfusion commencée..."
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3">
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
              Admettre le patient
            </button>
          </div>
        </form>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center shadow-xs">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center shadow-xs">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Occupied list vs History */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 border-l-4 border-teal-700 pl-2 text-sm uppercase tracking-wider mb-4">
          Lits Occupés & lits actifs
        </h3>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading hospitalization data...</div>
        ) : hospitalizations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-150 rounded-2xl">
            Aucun lit n'est occupé actuellement dans les services de la clinique.
          </div>
        ) : (
          <div className="space-y-4">
            {hospitalizations.map(item => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  item.status === "ADMITTED" ? "bg-amber-50/20 border-amber-200" : "bg-slate-50 border-gray-200 opacity-80"
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-xl ${item.status === "ADMITTED" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}`}>
                    <Bed className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-gray-900">{getPatientFullName(item.patientId)}</h4>
                    <p className="font-sans font-medium text-xs text-gray-500 mt-1 flex items-center gap-4">
                      <span>Location: <strong className="text-gray-900">{item.roomNumber} - {item.bedNumber}</strong></span>
                      <span>Statut: {item.status === "ADMITTED" ? (
                        <span className="inline-flex px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] uppercase font-bold tracking-wider">Admis</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded bg-gray-250 text-gray-700 text-[10px] uppercase font-bold tracking-wider">Libéré</span>
                      )}</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-2 bg-white/70 p-2.5 rounded-lg border border-gray-100 font-medium">
                      Motif d'admission: <span className="font-semibold">{item.reason}</span>
                    </p>
                    {item.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 flex items-center">
                        <Info className="h-3.5 w-3.5 mr-1 text-slate-400" />
                        Observations: {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between self-stretch gap-2 shrink-0">
                  <div className="font-mono text-xs text-gray-500 space-y-px">
                    <div className="flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-gray-400" />
                      Entrée: {new Date(item.admissionDate).toLocaleDateString("fr-FR")}
                    </div>
                    {item.dischargeDate && (
                      <div className="flex items-center text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-500" />
                        Sortie: {new Date(item.dischargeDate).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>

                  {item.status === "ADMITTED" && (userRole === "DOCTOR" || userRole === "NURSE" || userRole === "ADMIN") && (
                    <button
                      onClick={() => {
                        const dischargeNotes = prompt("Saisir les observations cliniques ou de traitement de sortie du patient :");
                        if (dischargeNotes !== null) {
                          handleDischarge(item.id, dischargeNotes);
                        }
                      }}
                      className="px-3 py-1.5 self-start sm:self-auto rounded-lg text-xs font-semibold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                    >
                      Enregistrer la Sortie
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
