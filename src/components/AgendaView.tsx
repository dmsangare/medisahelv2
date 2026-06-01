import { useState, FormEvent } from "react";
import { Appointment, Patient } from "../types";
import { Calendar, Clock, PlusCircle, CheckCircle2, User, Home, AlertCircle, MessageSquare, XCircle } from "lucide-react";

interface AgendaViewProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddAppointment: (data: Omit<Appointment, "id" | "createdAt">) => void;
  onUpdateAppointment: (id: string, updatedFields: Partial<Appointment>) => void;
  accentColor: string;
}

export default function AgendaView({
  appointments,
  patients,
  onAddAppointment,
  onUpdateAppointment,
  accentColor
}: AgendaViewProps) {
  const [selectedMed, setSelectedMed] = useState<string>("Tous");
  const [showForm, setShowForm] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");

  // Form states
  const [patId, setPatId] = useState("");
  const [medecin, setMedecin] = useState("Dr. Sangaré (Généraliste)");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [heure, setHeure] = useState("08:30");
  const [salle, setSalle] = useState("Bureau de Consultation A");
  const [notes, setNotes] = useState("");

  // Notification logs state and handler for Module 2
  const [notificationLogs, setNotificationLogs] = useState<Array<{ id: string; apptNom: string; type: string; channel: "SMS" | "WhatsApp"; msg: string; time: string }>>([]);

  const triggerNotification = (appt: Appointment, type: "Confirmation" | "Rappel J-1" | "Rappel H-1", channel: "SMS" | "WhatsApp") => {
    const textConfig = {
      "Confirmation": `Bonjour ${appt.patientNom}, votre RDV du ${appt.date} à ${appt.heure} avec ${appt.medecin} est CONFIRMÉ. Clinique MédiSahel.`,
      "Rappel J-1": `Rappel: Bonjour ${appt.patientNom}, vous avez RDV DEMAIN le ${appt.date} à ${appt.heure} avec le ${appt.medecin}.`,
      "Rappel H-1": `Rappel Urgent: Bonjour ${appt.patientNom}, votre consultation débute dans 1 HEURE (${appt.heure}) avec ${appt.medecin}. Merci de vous présenter.`
    };

    const newLog = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      apptNom: appt.patientNom,
      type,
      channel,
      msg: textConfig[type],
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    };

    setNotificationLogs(prev => [newLog, ...prev]);
  };

  const doctorsList = [
    "Dr. Sangaré (Généraliste)",
    "Dr. Diallo (Pédiatre / Gynécologue)",
    "Dr. Keïta (Généraliste)",
    "Sage-femme Fanta Diallo"
  ];

  const hasConflict = (med: string, d: string, h: string) => {
    return appointments.some(appt => appt.medecin === med && appt.date === d && appt.heure === h && appt.statut !== "Annulé");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!patId) {
      alert("Veuillez sélectionner un patient.");
      return;
    }
    const pat = patients.find(p => p.id === patId);
    if (!pat) return;

    if (hasConflict(medecin, date, heure)) {
      if (!confirm(`Attention : Le Dr. ${medecin} a déjà un rendez-vous à la même heure (${heure}) le ${date}. Souhaitez-vous forcer l'enregistrement malgré le conflit d'horaire ?`)) {
        return;
      }
    }

    onAddAppointment({
      patientId: patId,
      patientNom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      medecin,
      date,
      heure,
      salle,
      statut: "Confirmé",
      notes
    });

    setPatId("");
    setNotes("");
    setShowForm(false);
  };

  const filteredAppts = appointments.filter(a => selectedMed === "Tous" || a.medecin === selectedMed);

  const finalAppts = filteredAppts
    .filter(a => {
      if (!patientSearch) return true;
      return a.patientNom.toLowerCase().includes(patientSearch.toLowerCase()) || 
             a.patientId.toLowerCase().includes(patientSearch.toLowerCase());
    })
    .sort((a, b) => a.heure.localeCompare(b.heure)); // chronological sorting by default

  return (
    <div className="space-y-6" id="agenda-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" style={{ color: accentColor }} />
            <span>Agenda & Planification des Rendez-vous</span>
          </h2>
          <p className="text-xs text-slate-500">Planification des consultations cliniques par praticien et alertes SMS de relance.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer self-start"
          style={{ backgroundColor: accentColor }}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Nouveau RDV</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Practician filter sidebar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filtre Praticiens</h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedMed("Tous")}
              className={`w-full text-left text-xs p-2.5 rounded-lg font-semibold transition-all ${
                selectedMed === "Tous" ? "bg-slate-50 text-slate-900 font-extrabold" : "text-slate-600 hover:bg-slate-50/50"
              }`}
            >
              Tous les praticiens
            </button>
            {doctorsList.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedMed(doc)}
                className={`w-full text-left text-xs p-2.5 rounded-lg font-semibold transition-all truncate block ${
                  selectedMed === doc ? "bg-slate-50 text-slate-900 font-extrabold" : "text-slate-600 hover:bg-slate-50/50"
                }`}
              >
                {doc}
              </button>
            ))}
          </div>

          <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-lg text-[10.5px] text-slate-550 space-y-2 leading-relaxed">
            <span className="font-bold text-slate-700 block uppercase tracking-wider flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Relances Client & Statut
            </span>
            <p>La passerelle émet de façon synchrone :</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Confirmation Immédiate</li>
              <li>Relance automatique J-1</li>
              <li>Alerte patient à H-1 de l'acte</li>
            </ul>

            <div className="mt-3 pt-3 border-t border-slate-200">
              <span className="font-bold text-xs text-slate-700 block mb-1">Dernières Activités SMS:</span>
              {notificationLogs.length === 0 ? (
                <span className="text-[10px] text-slate-400 italic">Aucun envoi déclenché. Utilisez les boutons d'alerte ci-contre.</span>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {notificationLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-1.5 bg-white border border-slate-200 rounded text-[9px] space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-605">
                        <span className={log.channel === "SMS" ? "text-blue-700" : "text-emerald-700"}>[{log.channel}] {log.type}</span>
                        <span className="text-slate-400">{log.time}</span>
                      </div>
                      <p className="text-slate-500 font-medium truncate">{log.msg}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center slot grid */}
        <div className="lg:col-span-3 space-y-4">
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm animate-fade-in text-xs">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Planifier un Rendez-vous</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Dossier Patient</label>
                  <select
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-semibold"
                    value={patId}
                    onChange={(e) => setPatId(e.target.value)}
                  >
                    <option value="">-- Choisissez le dossier patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} (Dossier: {p.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Praticien cible</label>
                  <select
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-semibold"
                    value={medecin}
                    onChange={(e) => setMedecin(e.target.value)}
                  >
                    {doctorsList.map((doc, idx) => (
                      <option key={idx} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-bold"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Heure</label>
                    <input
                      type="text"
                      placeholder="ex: 09:30"
                      required
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-bold"
                      value={heure}
                      onChange={(e) => setHeure(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Salle / Bureau</label>
                    <select
                      className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white font-semibold"
                      value={salle}
                      onChange={(e) => setSalle(e.target.value)}
                    >
                      <option value="Bureau de Consultation A">Bureau de Consultation A</option>
                      <option value="Bureau de Consultation B">Bureau de Consultation B</option>
                      <option value="Cabine de Pédiatrie">Cabine de Pédiatrie</option>
                      <option value="Salle de Téléconsultation (Visio Clavardage)">Téléconsultation Vidéo Securisée</option>
                      <option value="Bloc Maternité">Bloc d'Accouchement Maternité</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Notes ou motifs</label>
                  <input
                    type="text"
                    placeholder="Suivi post-op, urgence fébrile, etc."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {hasConflict(medecin, date, heure) && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>
                    Attention : Conflit d'horaire. Le <strong>{medecin}</strong> a déjà une consultation de planifiée le {date} à {heure}.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg cursor-pointer font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  Confirmer le Rendez-vous
                </button>
              </div>
            </form>
          )}

          {/* List queue grid */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-3 font-semibold">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session du jour : {date} ({finalAppts.length} actes)</h3>
              <input
                type="text"
                placeholder="🔍 Rechercher par patient..."
                className="text-xs p-1.5 px-3 border border-slate-300 rounded-lg max-w-xs font-medium outline-none focus:border-indigo-500"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
              />
            </div>

            {finalAppts.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs italic">Aucun acte médical planifié pour ce filtre.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {finalAppts.map((appt, idx) => {
                  const stateStyles = 
                    appt.statut === "Confirmé" 
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : appt.statut === "Terminé"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : appt.statut === "Reporté"
                      ? "bg-amber-50 text-amber-700 border-amber-250"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  const isTele = appt.salle.includes("Téléconsultation");

                  return (
                    <div key={appt.id} className="p-4 bg-white border border-slate-200 rounded-xl relative hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-medium shadow-xs">
                      {/* Queue position badge */}
                      <div className="absolute top-3.5 right-4 text-[10px] font-mono text-slate-400 font-extrabold bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                        QUEUE TICKET #{String(idx + 1).padStart(3, "0")}
                      </div>

                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${stateStyles}`}>
                            {appt.statut}
                          </span>
                          <span className="font-extrabold text-slate-900 text-[13px]">{appt.patientNom}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({appt.patientId})</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 pt-1 text-[11px] text-slate-500 font-mono">
                          <span className="flex items-center gap-1.5 font-sans"><User className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Praticien : <strong className="text-slate-700">{appt.medecin}</strong></span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Heure : <strong className="text-slate-700">{appt.heure}</strong></span>
                          <span className="flex items-center gap-1.5"><Home className="h-3.5 w-3.5 text-slate-400 shrink-0" /> Salle allocation : <strong className="text-slate-705">{appt.salle}</strong></span>
                        </div>

                        {appt.notes && (
                          <p className="text-[11px] italic text-slate-400 pt-0.5">Motif: {appt.notes}</p>
                        )}

                        {/* Interactive Teleconsultation Module if room matches */}
                        {isTele && (
                          <div className="mt-2.5 p-2 bg-pink-50/50 border border-pink-100 rounded-lg flex items-center justify-between gap-4 max-w-md">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-pink-500 animate-ping" />
                              <span className="text-[10px] font-extrabold text-pink-700 uppercase tracking-wider">Téléconsultation en ligne</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                alert(`🔄 [Téléconsultation] Lancement du salon virtuel crypté pour le patient ${appt.patientNom}.\nFlux caméra/micro activés selon l'accord CNIL malien.`);
                              }}
                              className="bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-[9.5px] px-2.5 py-1 rounded-md transition-all cursor-pointer shadow-xs"
                            >
                              Démarrer l'Appel Vidéo
                            </button>
                          </div>
                        )}

                        {/* Automatic Gateway & SMS WhatsApp Alerts section */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                          <span className="text-[9.5px] text-slate-400 font-extrabold uppercase mr-1">Rappels :</span>
                          <button
                            type="button"
                            onClick={() => triggerNotification(appt, "Confirmation", "SMS")}
                            className="bg-blue-50/80 hover:bg-blue-100 text-blue-750 font-bold text-[9.5px] p-1 px-2 rounded border border-blue-200 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            📩 Envoi Confirmation SMS
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerNotification(appt, "Rappel J-1", "WhatsApp")}
                            className="bg-emerald-50/80 hover:bg-emerald-100 text-emerald-850 font-bold text-[9.5px] p-1 px-2 rounded border border-emerald-250 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            🟢 WhatsApp J-1
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerNotification(appt, "Rappel H-1", "SMS")}
                            className="bg-amber-50/80 hover:bg-amber-100 text-amber-850 font-bold text-[9.5px] p-1 px-2 rounded border border-amber-250 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            ⏰ Rappel H-1 SMS
                          </button>
                        </div>
                      </div>

                      {/* Micro actions status changer */}
                      <div className="flex items-center gap-1.5 self-end md:self-center">
                        <button
                          onClick={() => onUpdateAppointment(appt.id, { statut: "Terminé" })}
                          className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Terminer
                        </button>
                        <button
                          onClick={() => onUpdateAppointment(appt.id, { statut: "Reporté" })}
                          className="p-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-250 text-[10px] font-extrabold cursor-pointer transition-all"
                        >
                          Reporter
                        </button>
                        <button
                          onClick={() => onUpdateAppointment(appt.id, { statut: "Annulé" })}
                          className="p-1 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 text-[10px] font-extrabold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-500" /> Annuler
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
