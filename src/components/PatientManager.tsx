import React, { useState, useEffect } from "react";
import { Search, UserPlus, FileText, Heart, ShieldAlert, Check, ChevronRight } from "lucide-react";
import { Patient } from "../types.ts";

interface PatientManagerProps {
  token: string | null;
  onSelectPatient: (patient: Patient) => void;
}

export const PatientManager: React.FC<PatientManagerProps> = ({ token, onSelectPatient }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "M",
    phone: "",
    email: "",
    bloodType: "A+",
    allergies: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName || !formData.lastName || !formData.nationalId || !formData.dateOfBirth) {
      setError("Les champs Nom, Prénom, NID et Date de Naissance sont requis.");
      return;
    }

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'enregistrer le patient");

      setSuccess("Patient enregistré avec succès !");
      setFormData({
        firstName: "",
        lastName: "",
        nationalId: "",
        dateOfBirth: "",
        gender: "M",
        phone: "",
        email: "",
        bloodType: "A+",
        allergies: "",
        address: ""
      });
      setShowAddForm(false);
      fetchPatients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || p.nationalId.toLowerCase().includes(query) || (p.phone && p.phone.includes(query));
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="patient-manager-card">
      {/* Module Title Section */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Heart className="h-5 w-5 text-teal-600 mr-2" />
            Gestion des Patients
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enregistrement des fiches civiles, signalétique vitale et dossier signalétique d'affiliation.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
          id="add-patient-btn"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {showAddForm ? "Fermer le formulaire" : "Enregistrer un Patient"}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5" id="patient-add-form">
          <div className="md:col-span-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-2">Nouvelle Fiche d'Admission Patient</h3>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prénom(s) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Moussa"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom de famille <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. DIARRA"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro d'Identité National (NID) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. N-19900812-BKO"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de Naissance <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sexe biologique</label>
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone de contact</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="+223 76 54 32 10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="patient@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Groupe Sanguin</label>
            <select
              value={formData.bloodType}
              onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Allergies médicamenteuses connues</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Pénicilline, Aspirine"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse Domiciliaire Résidentielle</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="Quartier résidentiel, Ville, Mali"
            />
          </div>

          <div className="md:col-span-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-750 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              Confirmer l'Enregistrement
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

      {/* Filter and Table List */}
      <div className="p-6">
        <div className="flex bg-slate-100 items-center px-3.5 py-2.5 rounded-xl border border-gray-200 mb-6 max-w-md">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou NID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-sm w-full focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading registry information...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
            Aucun enregistrement ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="patients-table">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Identité & Sexe</th>
                  <th className="py-3 px-4 font-normal">ID National (NID)</th>
                  <th className="py-3 px-4 font-normal">Date de Naissance</th>
                  <th className="py-3 px-4 font-normal">Groupe Sanguin</th>
                  <th className="py-3 px-4 font-normal">Téléphone & Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors duration-100 group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${patient.gender === "M" ? "bg-teal-500" : "bg-rose-400"}`} />
                        <span className="font-sans font-medium text-gray-900">
                          {patient.lastName.toUpperCase()} {patient.firstName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{patient.nationalId}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.dateOfBirth}</td>
                    <td className="py-3 px-4">
                      {patient.bloodType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {patient.bloodType}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-950 font-sans">{patient.phone || "Non spécifié"}</div>
                      <div className="text-xs text-gray-400 font-sans">{patient.email || ""}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors duration-150 cursor-pointer"
                        id={`dme-btn-${patient.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        Accéder au DME
                        <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
