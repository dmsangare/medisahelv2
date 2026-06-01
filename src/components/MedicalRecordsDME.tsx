import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, Check, ShieldAlert, FileText, ClipboardList, PenTool, Clipboard, HeartCrack } from "lucide-react";
import { Patient, MedicalRecord } from "../types.ts";

interface MedicalRecordsDMEProps {
  token: string | null;
  patient: Patient;
  onBack: () => void;
  userRole: string;
}

export const MedicalRecordsDME: React.FC<MedicalRecordsDMEProps> = ({ token, patient, onBack, userRole }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: "",
    diagnosis: "",
    prescription: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/patients/${patient.id}/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger le dossier");
      setRecords(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token, patient.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.symptoms || !formData.diagnosis || !formData.prescription) {
      setError("Les symptômes, le diagnostic et l'ordonnance de prescription sont obligatoires.");
      return;
    }

    try {
      const response = await fetch(`/api/patients/${patient.id}/records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'insérer l'ordonnance");

      setSuccess("Consultation sauvegardée avec succès dans le DME !");
      setFormData({ symptoms: "", diagnosis: "", prescription: "", notes: "" });
      setShowAddForm(false);
      fetchRecords();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const diff = Date.now() - birthDate.getTime();
      const ageDate = new Date(diff);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="space-y-6" id="dme-patient-dashboard">
      {/* Return Navigation bar */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-2 border border-gray-200 rounded-xl bg-white text-gray-700 hover:bg-slate-50 transition-colors shadow-sm focus:outline-none cursor-pointer"
          id="dme-back-btn"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-gray-500">Retour au registre civil</span>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none mt-0.5">
            Dossier Médical Électronique (DME)
          </h2>
        </div>
      </div>

      {/* Patient Signaletic ID Card Banner */}
      <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 grid grid-cols-1 md:grid-cols-4 gap-6" id="patient-identity-banner">
        <div>
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">PATIENT</span>
          <h3 className="text-lg font-bold text-gray-900 mt-1 uppercase">
            {patient.lastName} {patient.firstName}
          </h3>
          <p className="text-sm font-sans text-gray-500 mt-0.5">
            NID: <span className="font-mono text-xs font-semibold">{patient.nationalId}</span>
          </p>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
          <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">Informations Générales</span>
          <dl className="mt-2 space-y-1 text-sm font-sans text-gray-700">
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Âge :</dt>
              <dd className="font-semibold">{getAge(patient.dateOfBirth)} ans ({patient.dateOfBirth})</dd>
            </div>
            <div className="flex justify-between md:justify-start md:space-x-4">
              <dt className="text-gray-400">Sexe :</dt>
              <dd className="font-semibold">{patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</dd>
            </div>
          </dl>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-6">
          <span className="font-mono text-[10px] text-teal-600 uppercase tracking-widest font-bold">Groupe Sanguin</span>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {patient.bloodType || "Non spécifié"}
          </div>
        </div>

        <div className="border-t md:border-t-0 md:border-l border-red-100 bg-red-50/20 rounded-xl md:pl-6 p-3">
          <span className="font-mono text-[10px] text-red-600 uppercase tracking-widest font-bold flex items-center">
            <HeartCrack className="h-3.5 w-3.5 mr-1" />
            Allergies connues
          </span>
          <p className="text-sm font-semibold text-red-700 mt-1.5 leading-snug">
            {patient.allergies || "Aucune allergie connue à ce jour."}
          </p>
        </div>
      </div>

      {/* DME Action Controls */}
      <div className="flex justify-between items-center bg-transparent border-t border-b border-gray-100 py-3">
        <h4 className="font-sans font-semibold text-gray-900 text-sm uppercase tracking-wider">
          Historique Clinique & Consultations ({records.length})
        </h4>
        {(userRole === "DOCTOR" || userRole === "ADMIN") && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="write-consultation-btn"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nouvelle Consultation
          </button>
        )}
      </div>

      {/* Add New Consultation DME Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border-2 border-teal-600 rounded-2xl shadow-md p-6 space-y-4" id="dme-add-record-form">
          <h3 className="text-base font-bold text-teal-800 flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Saisie d'un Rapport d'Examen Médical & Ordonnance
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Symptômes décrits & Motif de consultation <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.symptoms}
                onChange={e => setFormData({ ...formData, symptoms: e.target.value })}
                rows={3}
                placeholder="Ex prime: Fièvre intense, toux chronique, céphalées, courbatures..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Diagnostic clinique établi <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                rows={3}
                placeholder="Ex prime: Broncho-pneumopathie aiguë, Suspicion de paludisme..."
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prescription Thérapeutique & Ordonnance Posologique <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={formData.prescription}
              onChange={e => setFormData({ ...formData, prescription: e.target.value })}
              rows={4}
              placeholder="Médicaments prescrits, dosages exacts, fréquences horaires d'administration et durées du traitement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-sans font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notes internes, recommandations cliniques additionnelles</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Conseils hygiéno-diététiques, examens biologiques de contrôle à prévoir..."
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
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
              Ajouter au Dossier (Signer)
            </button>
          </div>
        </form>
      )}

      {/* Feedback alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Consultation Timeline List */}
      {loading ? (
        <div className="text-center py-10 font-mono text-sm text-gray-400">Loading prescription logs...</div>
      ) : records.length === 0 ? (
        <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-8 text-center" id="dme-empty-state">
          <Clipboard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h5 className="font-sans font-semibold text-gray-900 text-base">Historique médical vierge</h5>
          <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
            Aucune consultation ou ordonnance n'a encore été versée au Dossier Médical Électronique de ce patient.
          </p>
        </div>
      ) : (
        <div className="space-y-6" id="dme-records-timeline">
          {records.map((record, index) => (
            <div
              key={record.id}
              className="bg-white border border-gray-150 rounded-2xl shadow-sm p-6 relative overflow-hidden group"
            >
              {/* Header card indicator with date and doctor */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 mb-4 gap-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                    <PenTool className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="font-sans font-semibold text-gray-900 text-sm">Consultation Clinique</h5>
                    <p className="text-xs text-gray-400 mt-0.5">Rédigé par: <span className="font-medium text-gray-600">{record.doctorName}</span></p>
                  </div>
                </div>
                <div className="font-mono text-xs text-gray-500 bg-slate-100 px-3 py-1 rounded-full self-start md:self-center">
                  {new Date(record.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </div>
              </div>

              {/* Consultation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-1">Motif & Symptômes décrits</h6>
                  <p className="text-gray-700 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100 font-medium">{record.symptoms}</p>
                </div>
                <div>
                  <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-1">Diagnostic du médecin</h6>
                  <p className="text-gray-700 font-sans leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-gray-100 font-semibold text-teal-900">{record.diagnosis}</p>
                </div>
              </div>

              {/* Prescription block */}
              <div className="mt-6 border-t border-dashed border-gray-150 pt-5">
                <h6 className="font-semibold text-gray-800 uppercase tracking-widest text-[10px] mb-2 flex items-center">
                  <FileText className="h-4 w-4 text-emerald-600 mr-1.5" />
                  Prescriptions ordonnées
                </h6>
                <div className="space-y-2">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-gray-800 font-sans leading-relaxed whitespace-pre-line font-medium text-sm">
                    {record.prescription}
                  </div>
                </div>
              </div>

              {/* Special doctor recommendation notes */}
              {record.notes && (
                <div className="mt-4 bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-amber-900 text-xs">
                  <span className="font-mono font-semibold uppercase tracking-wider text-[9px] text-amber-700 block mb-0.5">Recommandations cliniques:</span>
                  <p className="leading-snug">{record.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
