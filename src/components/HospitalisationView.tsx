import { useState, FormEvent } from "react";
import { BedAllocation, Patient } from "../types";
import { 
  Bed, Thermometer, Plus, Clipboard, UserMinus, Percent, 
  Clock, FileText, Check, Heart, ShieldAlert, X, UserPlus, Send, Activity, Printer
} from "lucide-react";

interface HospitalisationViewProps {
  beds: BedAllocation[];
  patients: Patient[];
  onAdmitPatient: (bedId: string, patientId: string) => void;
  onDischargePatient: (bedId: string) => void;
  onAddNurseLog: (bedId: string, log: string) => void;
  onUpdateTemp: (bedId: string, temp: number, pulse: number) => void;
  onUpdateBedStatus?: (bedId: string, statut: "Disponible" | "Occupé" | "Maintenance") => void;
  onChangeBed?: (sourceBedId: string, destBedId: string) => void;
  accentColor: string;
}

export default function HospitalisationView({
  beds,
  patients,
  onAdmitPatient,
  onDischargePatient,
  onAddNurseLog,
  onUpdateTemp,
  onUpdateBedStatus,
  onChangeBed,
  accentColor
}: HospitalisationViewProps) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [patientToAdmit, setPatientToAdmit] = useState("");
  const [nurseLogText, setNurseLogText] = useState("");
  const [tempVal, setTempVal] = useState(37.5);
  const [pulseVal, setPulseVal] = useState(80);
  const [message, setMessage] = useState<string | null>(null);
  
  // Inline Report modal state (Saves iframe popups blockers)
  const [selectedBedForReport, setSelectedBedForReport] = useState<BedAllocation | null>(null);

  // Statistics
  const totalLits = beds.length;
  const litsOccupes = beds.filter(b => b.statut === "Occupé").length;
  const maintenanceLits = beds.filter(b => b.statut === "Maintenance").length;
  const dispoLits = totalLits - litsOccupes - maintenanceLits;

  const occupancyRate = totalLits > 0 ? Math.round((litsOccupes / (totalLits - maintenanceLits)) * 100) : 0;
  const dmsMoyenne = 3.4; // Local average stay (DMS)

  const handleAdmission = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !patientToAdmit) return;
    onAdmitPatient(selectedBedId, patientToAdmit);
    setPatientToAdmit("");
    setMessage(`Le patient a été admis sur le lit ${selectedBedId} avec succès.`);
    setTimeout(() => setMessage(null), 3500);
  };

  const handleAddLog = (e: FormEvent, bedId: string) => {
    e.preventDefault();
    if (!nurseLogText) return;
    const timeString = new Date().toLocaleTimeString("fr-FR").slice(0, 5);
    onAddNurseLog(bedId, `${timeString} - ${nurseLogText}`);
    setNurseLogText("");
    setMessage("Activité infirmière enregistrée sur le dossier d'hospitalisation.");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateTempAndPulse = (bedId: string) => {
    onUpdateTemp(bedId, tempVal, pulseVal);
    setMessage("Saisie constante : Feuille de température journalière actualisée.");
    setTimeout(() => setMessage(null), 3000);
  };

  // Find selected bed metadata
  const activeSelectedBed = beds.find(b => b.id === selectedBedId);

  return (
    <div className="space-y-6" id="hospitalisation-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bed className="h-5 w-5" style={{ color: accentColor }} />
          <span>Gestion Clinique des lits d'Hospitalisation</span>
        </h2>
        <p className="text-xs text-slate-500">Plan de surveillance infirmier intensif et attribution des lits d'hospitalisation locale en temps réel.</p>
      </div>

      {/* Stats Indicators widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Taux d'Occupation</span>
            <span className="text-2xl font-bold text-slate-800 font-mono">{occupancyRate}%</span>
            <span className="text-[10px] text-slate-400 block">{litsOccupes} / {totalLits - maintenanceLits} Lits actifs occupés</span>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Lits Disponibles</span>
            <span className="text-2xl font-bold text-emerald-700 font-mono">{dispoLits}</span>
            <span className="text-[10px] text-emerald-600 block font-semibold">Pret pour accueil</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-650 rounded-xl">
            <Bed className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Durée Moyenne (DMS)</span>
            <span className="text-2xl font-bold text-indigo-700 font-mono">{dmsMoyenne}j</span>
            <span className="text-[10px] text-slate-400 block">Indice de rotation local stable</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Lits en Maintenance</span>
            <span className="text-2xl font-bold text-amber-700 font-mono">{maintenanceLits}</span>
            <span className="text-[10px] text-slate-400 block">Désinfection & Réparations</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg border border-emerald-200 text-xs text-center font-bold">
          {message}
        </div>
      )}

      {/* Main layout bed map block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Beds Matrix visual */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4">
          <div className="pb-2 border-b">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Plan Visuel Tactique des Lits</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Cliquez sur un lit du plan pour attribuer un patient libre ou renseigner la feuille d'observation clinique.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {beds.map(bed => {
              const isOcc = bed.statut === "Occupé";
              const isBg = bed.statut === "Occupé" 
                ? "bg-rose-50/40 border-rose-200 hover:bg-rose-50 text-rose-950" 
                : bed.statut === "Maintenance"
                ? "bg-slate-100/70 border-slate-200 text-slate-400 hover:bg-slate-100"
                : "bg-emerald-50/40 border-emerald-250 hover:bg-emerald-50/80 text-emerald-950";

              return (
                <div
                  key={bed.id}
                  onClick={() => {
                    setSelectedBedId(bed.id);
                    if (isOcc) {
                      setTempVal(bed.temperature || 37.5);
                      setPulseVal(bed.frequenceCardiaque || 80);
                    } else {
                      setTempVal(37.0);
                      setPulseVal(75);
                    }
                  }}
                  className={`p-4 rounded-xl border text-center relative cursor-pointer transition-all duration-150 ${isBg} ${
                    selectedBedId === bed.id ? "ring-2 ring-offset-2 ring-sky-600 shadow" : ""
                  }`}
                >
                  <Bed className={`h-5 w-5 mx-auto ${isOcc ? "text-rose-650" : bed.statut === "Maintenance" ? "text-slate-400" : "text-emerald-750"}`} />
                  <h4 className="font-extrabold text-xs mt-2">{bed.id}</h4>
                  <span className="text-[9.5px] text-slate-400 font-mono block truncate">{bed.chambre}</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-450 font-black block truncate mt-0.5">{bed.service}</span>

                  {isOcc && bed.patientNom && (
                    <div className="mt-2 text-[10px] bg-white/70 py-1 rounded border border-rose-100">
                      <span className="font-bold text-slate-800 block truncate px-1">{bed.patientNom}</span>
                      <span className="text-rose-700 font-semibold flex items-center justify-center gap-0.5 text-[9px] mt-0.5 font-mono">
                        <Thermometer className="h-3 w-3 text-rose-500" /> {bed.temperature || 37.5}°C
                      </span>
                    </div>
                  )}

                  <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${
                    isOcc ? "bg-red-600 animate-pulse" : bed.statut === "Maintenance" ? "bg-slate-500" : "bg-emerald-600"
                  }`}></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected bed manager panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Observations & Actes de Lits</h3>
            {activeSelectedBed && (
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                activeSelectedBed.statut === "Occupé" ? "bg-red-50 text-red-700" : activeSelectedBed.statut === "Maintenance" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
              }`}>
                {activeSelectedBed.statut}
              </span>
            )}
          </div>

          {activeSelectedBed ? (
            <div className="space-y-4 pt-3 text-xs font-semibold">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[9px] text-slate-400 font-extrabold block uppercase tracking-wide">EMPLACEMENT ACTIF</span>
                <h4 className="font-black text-slate-900 text-sm mt-0.5">{activeSelectedBed.id}</h4>
                <p className="text-slate-550 leading-snug mt-1 font-semibold">
                  {activeSelectedBed.chambre} • Service: <strong className="text-slate-800">{activeSelectedBed.service}</strong>
                </p>
              </div>

              {activeSelectedBed.statut === "Maintenance" ? (
                <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 text-center rounded-xl font-medium space-y-2">
                  <ShieldAlert className="h-7 w-7 text-amber-500 mx-auto" />
                  <p className="italic text-[10.5px]">Ce lit fait actuellement l'objet d'une maintenance technique ou de désinfection sanitaire.</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onUpdateBedStatus) {
                        onUpdateBedStatus(activeSelectedBed.id, "Disponible");
                        setMessage("Lit remis en service. Statut de maintenance désactivé.");
                        setTimeout(() => setMessage(null), 3000);
                      }
                    }}
                    className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl cursor-pointer w-full text-xs shadow-xs transition-all"
                  >
                    Remettre le lit en service (Disponible)
                  </button>
                </div>
              ) : activeSelectedBed.statut === "Disponible" ? (
                /* Guided admission form */
                <form onSubmit={handleAdmission} className="space-y-4 animate-fade-in">
                  <div className="flex items-center gap-1.5 text-slate-700 pb-1">
                    <UserPlus className="h-4 w-4 text-[#0284c7]" />
                    <span className="font-bold text-xs uppercase tracking-tight">Admettre un Patient Libre</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wide">Sélectionner le Dossier Clinique :</label>
                    <select
                      required
                      className="w-full text-xs font-semibold rounded-xl border border-slate-350 p-2.5 bg-white shadow-xs focus:ring-1 focus:ring-sky-500"
                      value={patientToAdmit}
                      onChange={(e) => setPatientToAdmit(e.target.value)}
                    >
                      <option value="">-- Sélectionnez un patient disponible --</option>
                      {patients
                        .filter(p => !beds.some(b => b.patientId === p.id))
                        .map(p => (
                          <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} ({p.id})</option>
                        ))
                      }
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white font-bold p-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-2 hover:opacity-95 text-xs transition-all shadow"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Admettre immédiatement</span>
                  </button>

                  <div className="border-t border-slate-200 pt-3 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        if (onUpdateBedStatus) {
                          onUpdateBedStatus(activeSelectedBed.id, "Maintenance");
                          setMessage("Lit mis sous maintenance technique.");
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold p-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-all"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      <span>Placer le lit sous maintenance</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Patient is admitted, show detailed clinic monitor sheet */
                <div className="space-y-4 animate-fade-in">
                  <div className="border border-red-150 rounded-xl p-3 bg-red-50/15 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-red-500 font-extrabold flex items-center gap-1">
                      <Activity className="h-3 w-3 text-red-500 animate-pulse" /> PATIENT ADMIS
                    </span>
                    <p className="font-black text-slate-900 text-xs">{activeSelectedBed.patientNom}</p>
                    <span className="text-[10px] text-slate-450 font-mono">Dossier : {activeSelectedBed.patientId}</span>
                    {patients.find(p => p.id === activeSelectedBed.patientId) && (
                      <span className="block text-[10px] text-teal-800 font-sans font-semibold">
                        {patients.find(p => p.id === activeSelectedBed.patientId)?.nationalite || "Non renseignée"} • {patients.find(p => p.id === activeSelectedBed.patientId)?.ethnie || "Non renseignée"}
                      </span>
                    )}
                    {activeSelectedBed.dateAdmission && (
                      <span className="block text-[10px] text-slate-400 font-medium">Date d'admission : {activeSelectedBed.dateAdmission}</span>
                    )}
                  </div>

                  {/* Temperature & vital signs forms */}
                  <div className="space-y-2 border border-slate-150 rounded-xl p-3 bg-slate-50/70">
                    <span className="text-[9px] uppercase tracking-wider text-slate-450 font-extrabold block mb-1">Activité des Constantes Physiologiques</span>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <label className="block text-[9.5px] text-slate-500">TEMPÉRATURE (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 border border-slate-350 rounded-lg font-bold text-slate-800 bg-white"
                          value={tempVal}
                          onChange={(e) => setTempVal(parseFloat(e.target.value) || 37)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] text-slate-500">FC (BPM)</label>
                        <input
                          type="number"
                          className="w-full p-2 border border-slate-350 rounded-lg font-bold text-slate-800 bg-white"
                          value={pulseVal}
                          onChange={(e) => setPulseVal(parseInt(e.target.value) || 80)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleUpdateTempAndPulse(activeSelectedBed.id)}
                      className="w-full text-xs font-bold bg-slate-200 hover:bg-slate-250 text-slate-800 p-2 rounded-xl cursor-pointer"
                    >
                      Enregistrer constantes de garde
                    </button>
                  </div>

                  {/* Nurse treatment form */}
                  <form onSubmit={(e) => handleAddLog(e, activeSelectedBed.id)} className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Perfusion & Soins Infirmiers du jour</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        placeholder="Ex: Administration paracétamol 1g IVD, Glycémie..."
                        className="flex-1 p-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold text-slate-800"
                        value={nurseLogText}
                        onChange={(e) => setNurseLogText(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="bg-slate-800 hover:bg-slate-900 border text-white p-2 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </form>

                  {/* Log sheets lists */}
                  {activeSelectedBed.soinsInfirmiersLogs && activeSelectedBed.soinsInfirmiersLogs.length > 0 && (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-slate-50 p-3 rounded-lg border border-slate-150">
                      <span className="font-extrabold text-[9.5px] text-slate-400 block pb-1 border-b uppercase">Journal de Soins infirmier</span>
                      <div className="space-y-1">
                        {activeSelectedBed.soinsInfirmiersLogs.map((log, idx) => (
                          <div key={idx} className="text-slate-705 leading-snug italic border-l-2 border-[#0284c7] pl-2 py-0.5 text-[10px]">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Changer de lit */}
                  {onChangeBed && (
                    <div className="border border-indigo-100 rounded-xl p-3 bg-indigo-50/10 space-y-1.5 font-sans">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-600 font-extrabold flex items-center gap-1">
                        🔄 Changement de lit d'alité
                      </span>
                      <select
                        className="w-full text-xs font-semibold p-2 rounded-lg border border-slate-300 bg-white"
                        onChange={(e) => {
                          const destBedId = e.target.value;
                          if (destBedId) {
                            if (confirm(`Confirmez-vous le transfert complet du patient ${activeSelectedBed.patientNom} vers le lit ${destBedId} ?`)) {
                              onChangeBed(activeSelectedBed.id, destBedId);
                              setSelectedBedId(destBedId);
                              setMessage(`Patient transféré avec succès vers le lit ${destBedId}.`);
                              setTimeout(() => setMessage(null), 3500);
                            }
                          }
                          e.target.value = ""; // reset
                        }}
                        defaultValue=""
                      >
                        <option value="">-- Sélectionner lit destinataire --</option>
                        {beds
                          .filter(b => b.statut === "Disponible" && b.id !== activeSelectedBed.id)
                          .map(b => (
                            <option key={b.id} value={b.id}>
                              {b.id} ({b.chambre} - {b.service})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  )}

                  {/* Discharging patient with custom inline modal safety */}
                  <div className="pt-2 border-t flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedBedForReport(activeSelectedBed)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold p-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-[10.5px] transition-all"
                    >
                      <FileText className="h-4 w-4" /> Rapport Lits
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Confirmez-vous la sortie d'hospitalisation de ${activeSelectedBed.patientNom} et la libération complète du lit ${activeSelectedBed.id} ?`)) {
                          onDischargePatient(activeSelectedBed.id);
                          setSelectedBedId(null);
                          setMessage("Patient sorti de l'établissement. Lit disponible.");
                          setTimeout(() => setMessage(null), 3000);
                        }
                      }}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold p-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-[10.5px] transition-all"
                    >
                      <UserMinus className="h-4 w-4" /> Sortie / Congé
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 italic text-center py-12 text-xs">Sélectionnez un lit sur le plan matriciel tactique pour gérer les détails cliniques d'hospitalisation.</p>
          )}
        </div>
      </div>

      {/* Inline clinical report visual modal (Saves iframe browser popup blockers!) */}
      {selectedBedForReport && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center p-4 z-50 animate-fade-in" id="report-modal-gate">
          <div className="max-w-xl w-full bg-slate-100 rounded-2xl shadow-2xl p-5 space-y-4 border border-slate-300 max-h-[90vh] flex flex-col justify-between">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 pb-1 justify-center">
              <FileText className="h-4 w-4 text-sky-600 animate-pulse" /> Compte-rendu Clinique d'Hospitalisation officiel
            </h3>

            {/* Document body simulation */}
            <div className="bg-white border-2 border-slate-200 rounded-lg p-6 font-mono text-[10.5px] text-slate-900 overflow-y-auto flex-1 leading-relaxed shadow-inner">
              <div className="text-center space-y-1 mb-3">
                <h4 className="text-base font-black tracking-tight uppercase leading-none">CLINIQUE MÉDISAHEL</h4>
                <p className="text-[9px] text-slate-450 uppercase leading-none font-bold">Mali — Bamako Quartier du Fleuve</p>
                <p className="text-[8.5px] text-slate-400 font-mono">Décret Réglementaire HIS National - V2</p>
              </div>

              <div className="border-t-2 border-double border-slate-400 my-2"></div>
              
              <div className="text-center font-black text-xs uppercase text-sky-800">RAPPORT CLINIQUE D'ALITÉ EN CHAMBRE</div>
              <div className="text-center text-[9px] text-slate-500 mt-0.5">Identifiant unique Lit : {selectedBedForReport.id}</div>
              
              <div className="border-b border-dashed border-slate-400 my-2"></div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>DATE COMPTE RENDU :</span>
                  <span className="font-bold">{new Date().toISOString().replace("T", " ").slice(0, 16)} UTC</span>
                </div>
                <div className="flex justify-between">
                  <span>PATIENT :</span>
                  <span className="font-bold uppercase">{selectedBedForReport.patientNom}</span>
                </div>
                <div className="flex justify-between">
                  <span>IDENTIFIANT CLINIQUE :</span>
                  <span className="font-bold font-mono">{selectedBedForReport.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span>CHAMBRE D'ALITÉ :</span>
                  <span className="font-bold uppercase">{selectedBedForReport.chambre}</span>
                </div>
                <div className="flex justify-between">
                  <span>UNITÉ CRITIQUE :</span>
                  <span className="font-bold uppercase">{selectedBedForReport.service}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-350 my-2"></div>

              <div className="space-y-0.5">
                <p className="font-black">Dernières Constantes Relevées :</p>
                <div className="flex gap-4">
                  <span>• Température corporelle : <strong className="text-rose-700">{selectedBedForReport.temperature || "37.5"} °C</strong></span>
                  <span>• Pouls cardiaque : <strong className="text-sky-700">{selectedBedForReport.frequenceCardiaque || "80"} BPM</strong></span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-350 my-2"></div>

              <p className="font-black uppercase mb-1">Journal de Traitements & Observations :</p>
              <div className="space-y-1.5 pl-2">
                {selectedBedForReport.soinsInfirmiersLogs && selectedBedForReport.soinsInfirmiersLogs.length > 0 ? (
                  selectedBedForReport.soinsInfirmiersLogs.map((log, idx) => (
                    <div key={idx} className="text-[10px] text-slate-700 italic">• {log}</div>
                  ))
                ) : (
                  <div className="text-[10px] text-slate-400 italic">Pas de logs d'observations infirmières recensés.</div>
                )}
              </div>

              <div className="border-t-2 border-double border-slate-400 my-4"></div>
              
              <div className="text-center font-bold text-[8.5px] italic text-slate-400 leading-snug">
                Ce document officiel est archivé conformément aux directives de protection et gestion des établissements de santé du Sahel.
              </div>
            </div>

            {/* Close & Print Buttons Row */}
            <div className="flex gap-2 font-bold text-xs uppercase">
              <button
                type="button"
                onClick={() => setSelectedBedForReport(null)}
                className="flex-1 py-2.5 bg-slate-205 border border-slate-350 rounded-xl hover:bg-slate-300 text-slate-755 cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="h-3.5 w-3.5" /> Imprimer Rapport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
