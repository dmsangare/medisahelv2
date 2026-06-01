import React, { useState, useEffect } from "react";
import { Calendar, Plus, Search, Check, ShieldAlert, Clock, RefreshCw, UserCheck } from "lucide-react";
import { Appointment, Patient } from "../types.ts";

interface AppointmentsCalendarProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
}

export const AppointmentsCalendar: React.FC<AppointmentsCalendarProps> = ({ token, patients, userRole }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    doctorName: "",
    date: "",
    time: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger l'agenda");
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || !formData.doctorName || !formData.date || !formData.time) {
      setError("Les champs Patient, Médecin, Date et Horaire sont obligatoires.");
      return;
    }

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de planifier le rendez-vous");

      setSuccess("Consultation médicale enregistrée avec succès dans l'agenda !");
      setFormData({ patientId: "", doctorName: "", date: "", time: "", notes: "" });
      setShowAddForm(false);
      fetchAppointments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "CONFIRMED" | "CANCELLED" | "COMPLETED") => {
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error("Changement de planning échoué.");
      setSuccess("Statut du rendez-vous mis à jour.");
      fetchAppointments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getPatientName = (id: string) => {
    const p = patients.find(p => p.id === id);
    return p ? `${p.lastName.toUpperCase()} ${p.firstName}` : "Patient Inconnu";
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="appointments-calendar-card">
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 text-teal-600 mr-2" />
            Agenda Central & Planification des Consultations
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Prise de rendez-vous cliniques, attribution de créneaux aux médecins et suivi de présence en salle d'attente.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
          id="book-appointment-btn"
        >
          <Plus className="h-4 w-4 mr-2" />
          Prendre un Rendez-vous
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="appointment-form">
          <div className="md:col-span-2 lg:col-span-3">
            <h3 className="font-semibold text-sm text-gray-750 uppercase tracking-wider mb-1">Planification de Visite Médicale</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Associer un Patient <span className="text-rose-500">*</span></label>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Médecin Consultant <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.doctorName}
              onChange={e => setFormData({ ...formData, doctorName: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Dr. Ibrahim TOURÉ"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date programmée <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Heure de convocation <span className="text-rose-500">*</span></label>
            <input
              type="time"
              value={formData.time}
              onChange={e => setFormData({ ...formData, time: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes de consultation / Symptômes préliminaires</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Suivi post-opératoire de la vésicule biliaire"
            />
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
              Réserver le Créneau
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

      {/* Agenda Entries */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 border-l-4 border-teal-700 pl-2 text-sm uppercase tracking-wider mb-5">
          Consultations planifiées
        </h3>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading schedules from ledger...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            Aucun rendez-vous de consultation n'est planifié pour cette période.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {appointments.map(item => {
              const bgClass =
                item.status === "COMPLETED"
                  ? "bg-slate-50 border-gray-250"
                  : item.status === "CANCELLED"
                  ? "bg-rose-50/20 border-rose-200"
                  : "bg-teal-50/10 border-teal-200";

              return (
                <div key={item.id} className={`p-4 rounded-2xl border transition-all duration-100 flex flex-col justify-between ${bgClass}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3 text-xs md:text-sm">
                      <div className="flex items-center text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-150 font-bold">
                        <Clock className="h-3.5 w-3.5 mr-1 text-teal-600" />
                        {item.time}
                      </div>

                      <div className="font-mono text-xs text-gray-500 font-semibold">{item.date}</div>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900">{getPatientName(item.patientId)}</h4>
                    <p className="font-sans text-xs text-slate-500 mt-1">Médecin: <strong className="text-slate-800 font-semibold">{item.doctorName}</strong></p>

                    {item.notes && (
                      <p className="text-xs text-gray-700 bg-white/70 border border-gray-100 p-2.5 rounded-lg mt-3 leading-relaxed font-sans font-medium">
                        Motif: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
                    <div>
                      {item.status === "CONFIRMED" ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-sky-100 text-sky-800 font-bold uppercase tracking-wide">Confirmé</span>
                      ) : item.status === "COMPLETED" ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wide">Fait</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-bold uppercase tracking-wide">Annulé</span>
                      )}
                    </div>

                    {item.status === "CONFIRMED" && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleUpdateStatus(item.id, "COMPLETED")}
                          className="p-1 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold cursor-pointer"
                        >
                          Fait
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "CANCELLED")}
                          className="p-1 px-2.5 text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md font-medium cursor-pointer"
                        >
                          Annuler
                        </button>
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
  );
};
