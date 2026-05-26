import { useState, FormEvent } from "react";
import { BedAllocation, Patient } from "../types";
import { Bed, Thermometer, Plus, Clipboard, UserMinus, Percent, Clock, FileText, Check } from "lucide-react";

interface HospitalisationViewProps {
  beds: BedAllocation[];
  patients: Patient[];
  onAdmitPatient: (bedId: string, patientId: string) => void;
  onDischargePatient: (bedId: string) => void;
  onAddNurseLog: (bedId: string, log: string) => void;
  onUpdateTemp: (bedId: string, temp: number, pulse: number) => void;
  accentColor: string;
}

export default function HospitalisationView({
  beds,
  patients,
  onAdmitPatient,
  onDischargePatient,
  onAddNurseLog,
  onUpdateTemp,
  accentColor
}: HospitalisationViewProps) {
  const [selectedBedId, setSelectedBedId] = useState<string | null>(null);
  const [patientToAdmit, setPatientToAdmit] = useState("");
  const [nurseLogText, setNurseLogText] = useState("");
  const [tempVal, setTempVal] = useState(37.5);
  const [pulseVal, setPulseVal] = useState(80);

  const [message, setMessage] = useState<string | null>(null);

  // Statistics
  const totalLits = beds.length;
  const litsOccupes = beds.filter(b => b.statut === "Occupé").length;
  const maintenanceLits = beds.filter(b => b.statut === "Maintenance").length;
  const dispoLits = totalLits - litsOccupes - maintenanceLits;

  const occupancyRate = totalLits > 0 ? Math.round((litsOccupes / (totalLits - maintenanceLits)) * 100) : 0;
  const dmsMoyenne = 3.4; // constant local computed average stay length (durée moyenne séjour en jours)

  const handleAdmission = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedBedId || !patientToAdmit) return;
    onAdmitPatient(selectedBedId, patientToAdmit);
    setPatientToAdmit("");
    setSelectedBedId(null);
    setMessage("Patient admis en hospitalisation avec succès.");
    setTimeout(() => setMessage(null), 3500);
  };

  const handleAddLog = (e: FormEvent, bedId: string) => {
    e.preventDefault();
    if (!nurseLogText) return;
    onAddNurseLog(bedId, `${new Date().toLocaleTimeString("fr-FR").slice(0, 5)} - ${nurseLogText}`);
    setNurseLogText("");
    setMessage("Soin infirmier loggé.");
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateTempAndPulse = (bedId: string) => {
    onUpdateTemp(bedId, tempVal, pulseVal);
    setMessage("Feuille de température actualisée.");
    setTimeout(() => setMessage(null), 3000);
  };

  // Generate simulated discharge PDF logic
  const handlePrintReport = (bed: BedAllocation) => {
    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Veuillez autoriser les fenêtres pop-up.");
      return;
    }
    const html = `
      <html>
        <head>
          <title>Compte-Rendu d'Hospitalisation</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }
            .content { margin-top: 30px; line-height: 1.6; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .box { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .title { font-weight: bold; color: #0284c7; }
            .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h2>MÉDISHAHEL LOCAL SERVICES - MALI</h2>
            <p>Rapport de Clôture d'Hospitalisation en Clinique</p>
          </div>
          <div class="content">
            <div class="meta-grid">
              <div class="box">
                <span class="title">Informations Patient:</span><br/>
                Nom/Prénom: <strong>${bed.patientNom}</strong><br/>
                Identifiant unique: <strong>${bed.patientId}</strong>
              </div>
              <div class="box">
                <span class="title">Lit & Service:</span><br/>
                Chambre: <strong>${bed.chambre}</strong><br/>
                Service Clinique: <strong>${bed.service}</strong>
              </div>
            </div>

            <h3>Feuille d'Observations de soins :</h3>
            <ul>
              ${(bed.soinsInfirmiersLogs || []).map(log => `<li>${log}</li>`).join("")}
            </ul>

            <h3 style="margin-top:20px;">Paramètres Clôture:</h3>
            <p>Dernière température corporelle: <strong>${bed.temperature || "37.5"} °C</strong><br/>
            Fréquence cardiaque au repos: <strong>${bed.frequenceCardiaque || "80"} bpm</strong></p>

            <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
              <p>Signé à Bamako par le médecin coordinateur sous scellé sécurisé AES-256 local.</p>
            </div>
          </div>
          <div class="footer">
            MEDISHAHEL ENTERPRISE LOCAL EDITION - COMPTE RENDU OFFICIEL CLIENT
          </div>
        </body>
      </html>
    `;
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div className="space-y-6" id="hospitalisation-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Bed className="h-5 w-5" style={{ color: accentColor }} />
          <span>Gestion des Admissions & Hospitalisations</span>
        </h2>
        <p className="text-xs text-slate-500">Plan d'occupation et supervision infirmière des chambres de l'établissement en temps réel.</p>
      </div>

      {/* Stats Indicators widget */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Taux d'Occupation</span>
            <span className="text-2xl font-bold text-slate-800">{occupancyPercentage(occupancyRate)}%</span>
            <span className="text-[10px] text-slate-400 block">{litsOccupes} lits occupés / {totalLits - maintenanceLits}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-650">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Lits Disponibles</span>
            <span className="text-2xl font-bold text-slate-850">{dispoLits}</span>
            <span className="text-[10px] text-slate-400 block">Sur un parc de {totalLits} lits totaux</span>
          </div>
          <div className="p-3 bg-sky-50 rounded-lg text-sky-600">
            <Bed className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Durée Moyenne (DMS)</span>
            <span className="text-2xl font-bold text-slate-800">{dmsMoyenne} jours</span>
            <span className="text-[10px] text-emerald-650 font-medium block">Admissions stables</span>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Lits en Maintenance</span>
            <span className="text-2xl font-bold text-amber-600">{maintenanceLits}</span>
            <span className="text-[10px] text-slate-400 block">Désinfection ou réparation</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <Thermometer className="h-5 w-5" />
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
          <div className="border-b border-slate-100 pb-2">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Plan Visuel Tactique des Lits</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Sélectez un lit disponible pour y affecter un patient en détresse ou un lit occupé pour éditer ses observations cliniques.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {beds.map(bed => {
              const isOcc = bed.statut === "Occupé";
              const isBg = bed.statut === "Occupé" 
                ? "bg-red-50/50 border-red-200 hover:bg-red-50 text-red-950" 
                : bed.statut === "Maintenance"
                ? "bg-slate-100 border-slate-200 text-slate-400"
                : "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 text-emerald-950";

              return (
                <div
                  key={bed.id}
                  onClick={() => {
                    if (bed.statut !== "Maintenance") {
                      setSelectedBedId(bed.id);
                      if (isOcc) {
                        setTempVal(bed.temperature || 37.5);
                        setPulseVal(bed.frequenceCardiaque || 80);
                      }
                    } else {
                      alert("Ce lit est en maintenance technique.");
                    }
                  }}
                  className={`p-4 rounded-xl border text-center relative cursor-pointer transition-all duration-200 ${isBg} ${
                    selectedBedId === bed.id ? "ring-2 ring-offset-2 ring-sky-600" : ""
                  }`}
                >
                  <Bed className={`h-5 w-5 mx-auto ${isOcc ? "text-red-650" : bed.statut === "Maintenance" ? "text-slate-400" : "text-emerald-650"}`} />
                  <h4 className="font-bold text-xs mt-2">{bed.id}</h4>
                  <span className="text-[9.5px] text-slate-400 font-mono block truncate">{bed.chambre}</span>
                  <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold block truncate mt-0.5">{bed.service}</span>

                  {isOcc && bed.patientNom && (
                    <div className="mt-2.5 pt-2 border-t border-red-150/40 text-[10px]">
                      <span className="font-bold text-slate-800 block truncate">{bed.patientNom}</span>
                      <span className="text-red-700 font-bold flex items-center justify-center gap-0.5">
                        <Thermometer className="h-3 w-3 inline text-red-500" /> {bed.temperature || 37.5}°C
                      </span>
                    </div>
                  )}

                  <span className={`absolute top-2 right-2 h-2 w-2 rounded-full ${isOcc ? "bg-red-600 animate-pulse" : bed.statut === "Maintenance" ? "bg-slate-400" : "bg-emerald-600"}`}></span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected bed manager panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Observations de Lit sélectionné</h3>

          {selectedBedId ? (
            (() => {
              const bed = beds.find(b => b.id === selectedBedId);
              if (!bed) return <p className="text-slate-400 text-center italic py-10">Erreur chargement lit.</p>;
              const isOcc = bed.statut === "Occupé";

              return (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">PARAMÈTRES DU LIT :</span>
                    <h4 className="font-extrabold text-[#0284c7] text-sm">{bed.id}</h4>
                    <p className="text-slate-500">{bed.chambre} - Service: <strong className="text-slate-700">{bed.service}</strong></p>
                    <p className="text-slate-400">Statut courant: <strong className={isOcc ? "text-red-700" : "text-emerald-700"}>{bed.statut}</strong></p>
                  </div>

                  {/* If bed is available, show admission panel */}
                  {!isOcc ? (
                    <form onSubmit={handleAdmission} className="space-y-3.5">
                      <h5 className="font-bold text-slate-700 uppercase tracking-widest text-[9.5px]">Admettre un patient sur ce lit</h5>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">Dossier Patient</label>
                        <select
                          required
                          className="w-full text-xs rounded border border-slate-350 p-2 bg-white"
                          value={patientToAdmit}
                          onChange={(e) => setPatientToAdmit(e.target.value)}
                        >
                          <option value="">-- Choisissez le dossier --</option>
                          {patients.filter(p => !beds.some(b => b.patientId === p.id)).map(p => (
                            <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} ({p.id})</option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full text-white font-bold p-2 rounded cursor-pointer flex items-center justify-center gap-1 hover:opacity-95 text-xs font-display"
                        style={{ backgroundColor: accentColor }}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Admettre le Patient</span>
                      </button>
                    </form>
                  ) : (
                    /* If bed is occupied, show observation, parameters update and discharge triggers */
                    <div className="space-y-4">
                      <div className="border border-slate-150 rounded p-3 bg-red-50/10 space-y-1">
                        <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-extrabold">PATIENT HOSPITALISÉ :</span>
                        <p className="font-bold text-slate-900 text-xs">{bed.patientNom}</p>
                        <span className="text-[10px] text-slate-400 font-mono">ID unique: {bed.patientId}</span>
                      </div>

                      {/* Temperature & pulse sheets update form */}
                      <div className="space-y-2 border border-slate-150 rounded p-3 text-xs bg-slate-50/50">
                        <span className="text-[9.5px] uppercase tracking-wider text-slate-450 font-extrabold block mb-1">Constantes Température & Pouls</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-slate-400">Température (°C)</label>
                            <input
                              type="number"
                              step="0.1"
                              className="w-full p-1 border border-slate-300 rounded font-bold text-slate-800"
                              value={tempVal}
                              onChange={(e) => setTempVal(parseFloat(e.target.value) || 37)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-400 font-mono">Pouls (bpm)</label>
                            <input
                              type="number"
                              className="w-full p-1 border border-slate-300 rounded font-bold text-slate-800"
                              value={pulseVal}
                              onChange={(e) => setPulseVal(parseInt(e.target.value) || 75)}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleUpdateTempAndPulse(bed.id)}
                          className="w-full text-xs font-bold bg-slate-200 hover:bg-slate-250 text-slate-800 px-2.5 py-1.5 rounded"
                        >
                          Enregistrer la feuille
                        </button>
                      </div>

                      {/* Nurse logging care routine */}
                      <form onSubmit={(e) => handleAddLog(e, bed.id)} className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Soins Infirmiers & Observations</label>
                        <input
                          type="text"
                          required
                          placeholder="ex: Perfusion Ringer 500ml, injection paracétamol"
                          className="w-full p-2 border border-slate-300 bg-white text-xs text-slate-800 font-semibold"
                          value={nurseLogText}
                          onChange={(e) => setNurseLogText(e.target.value)}
                        />
                        <button
                          type="submit"
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-1.5 text-xs rounded transition-all cursor-pointer"
                        >
                          Enregistrer l'acte de soin
                        </button>
                      </form>

                      {/* Log logs lists inside nurse sheet */}
                      {bed.soinsInfirmiersLogs && bed.soinsInfirmiersLogs.length > 0 && (
                        <div className="space-y-1 text-[10px] max-h-[110px] overflow-y-auto bg-slate-50 p-2 rounded border border-slate-150">
                          <span className="font-extrabold text-slate-400 block pb-1 border-b uppercase">Dossier de soin du jour</span>
                          {bed.soinsInfirmiersLogs.map((log, idx) => (
                            <p key={idx} className="text-slate-700 italic border-l-2 border-[#0284c7] pl-1">{log}</p>
                          ))}
                        </div>
                      )}

                      {/* Discharging actions with simulated local reports */}
                      <div className="pt-2 border-t border-slate-100 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintReport(bed)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold p-2 rounded cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                        >
                          <FileText className="h-4 w-4" /> Rapport PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("Confirmez-vous la sortie définitive et la libération de ce lit ?")) {
                              onDischargePatient(bed.id);
                              setSelectedBedId(null);
                              setMessage("Patient sorti d'hospitalisation.");
                              setTimeout(() => setMessage(null), 3000);
                            }
                          }}
                          className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold p-2 rounded cursor-pointer flex items-center justify-center gap-1 text-[11px]"
                        >
                          <UserMinus className="h-4 w-4" /> Sortie Lit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <p className="text-slate-400 italic text-center py-12">Cliquez sur un lit du plan pour voir et en assurer la maintenance/admission.</p>
          )}

        </div>

      </div>
    </div>
  );
}

function occupancyPercentage(rate: number): number {
  return isNaN(rate) ? 0 : rate;
}
