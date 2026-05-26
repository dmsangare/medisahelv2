import { useState, FormEvent } from "react";
import { Patient, MedicalRecord } from "../types";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MessageSquare, 
  Send, 
  UserCheck, 
  Stethoscope, 
  AlertCircle, 
  RefreshCw, 
  FileText, 
  PieChart, 
  Activity, 
  Heart,
  CheckCircle2,
  Lock
} from "lucide-react";

interface TeleconsultationViewProps {
  patients: Patient[];
  onAddRecord?: (data: any) => void;
  accentColor: string;
}

export default function TeleconsultationView({
  patients,
  onAddRecord,
  accentColor
}: TeleconsultationViewProps) {
  const [activeCall, setActiveCall] = useState(false);
  const [micState, setMicState] = useState(true);
  const [videoState, setVideoState] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [waitingList, setWaitingList] = useState<Array<{ id: string; nom: string; joinTime: string }>>([
    { id: "MS-2026-0046", nom: "Fatoumata Traoré", joinTime: "09:45" },
    { id: "MS-2026-0048", nom: "Mariam Keïta", joinTime: "10:15" }
  ]);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: "Patient", text: "Bonjour Docteur, j'ai reçu mes résultats sanguins.", time: "10:31" },
    { sender: "Vous", text: "Bonjour. Je regarde ça immédiatement.", time: "10:32" }
  ]);
  const [newMessageText, setNewMessageText] = useState("");

  // E-prescription form states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionMotif, setPrescriptionMotif] = useState("Téléconsultation d'épreuve thérapeutique");
  const [prescriptionDiag, setPrescriptionDiag] = useState("Observation symptomatologique");
  const [prescriptionMedication, setPrescriptionMedication] = useState("Artemether-Lumefantrine 80/480mg (Coartem) : 1 comp matin et soir pendant 3 jours\nParacétamol 1g : 1 comp si fièvre toutes les 6h.");
  const [prescriptionCodeCIM, setPrescriptionCodeCIM] = useState("B50.9"); // Malaria falciparum
  const [isPrescriptionSigned, setIsPrescriptionSigned] = useState(false);

  const handleStartCall = (pNom: string, pId: string) => {
    setSelectedPatientId(pId);
    setActiveCall(true);
    // Remove from waiting queue list
    setWaitingList(prev => prev.filter(w => w.id !== pId));
  };

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessageText) return;
    setChatMessages(prev => [
      ...prev,
      { sender: "Vous", text: newMessageText, time: new Date().toLocaleTimeString("fr-FR").slice(0, 5) }
    ]);
    setNewMessageText("");

    // Simulate automatic remote reply related to malaria / guidance
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: "Patient", text: "D'accord Docteur, j'ai vu que vous m'avez rédigé l'ordonnance. Je passerai la récupérer à la pharmacie interne.", time: new Date().toLocaleTimeString("fr-FR").slice(0, 5) }
      ]);
    }, 2500);
  };

  const handleAddWaiting = () => {
    const pat = patients.find(p => p.id === selectedPatientId);
    if (!pat) {
      alert("Veuillez sélectionner un patient.");
      return;
    }
    if (waitingList.some(w => w.id === selectedPatientId)) {
      alert("Ce patient est déjà inscrit dans la salle d'attente.");
      return;
    }
    setWaitingList(prev => [...prev, {
      id: pat.id,
      nom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      joinTime: new Date().toLocaleTimeString("fr-FR").slice(0, 5)
    }]);
    setSelectedPatientId("");
  };

  const handleSubmitPrescription = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      alert("Aucun patient n'est sélectionné pour l'avis clinique.");
      return;
    }

    if (onAddRecord) {
      onAddRecord({
        patientId: selectedPatientId,
        motif: prescriptionMotif,
        diagnostic: prescriptionDiag,
        codeCIM10: prescriptionCodeCIM,
        prescription: prescriptionMedication,
        examensDemandes: [],
        certificatDuree: 0,
        notesCliniques: "Rédigé à distance via Téléconsultation WebRTC sécurisée intégrée."
      });
      setIsPrescriptionSigned(true);
      setTimeout(() => {
        setIsPrescriptionSigned(false);
        setShowPrescriptionModal(false);
        alert("L'ordonnance électronique chiffrée a été publiée et rattachée avec succès au DME.");
      }, 1500);
    } else {
      alert("Veuillez lier le module de dossier d'actes cliniques.");
    }
  };

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6" id="teleconsultation-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Video className="h-5 w-5" style={{ color: accentColor }} />
          <span>Module de Téléconsultation WebRTC Chiffré</span>
        </h2>
        <p className="text-xs text-slate-500">Service de vidéoconférence médicale sécurisée intégrée permettant l'examen et la prescription clinique en direct.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand: Virtual Waiting Queue */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <UserCheck className="h-4 w-4 text-sky-600 animate-pulse" /> Salle d'Attente Virtuelle (RTC)
            </h3>

            {waitingList.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6">La salle d'attente est actuellement vide.</p>
            ) : (
              <div className="space-y-2">
                {waitingList.map((w) => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100/50 transition-all font-medium">
                    <div>
                      <h4 className="font-bold text-slate-900">{w.nom}</h4>
                      <span className="text-[10px] text-slate-405 font-mono">ID: {w.id} | Inscrit à {w.joinTime}</span>
                    </div>

                    <button
                      onClick={() => handleStartCall(w.nom, w.id)}
                      className="text-white text-[10px] font-bold px-3 py-1.5 bg-sky-600 hover:bg-sky-700 rounded-lg cursor-pointer transition-all uppercase tracking-wide shadow-xs"
                      style={{ backgroundColor: accentColor }}
                    >
                      Appeler
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual Patient admission tool */}
            <div className="pt-3 border-t border-slate-150 space-y-2">
              <label className="block text-[10px] uppercase font-extrabold text-slate-400">Placer un patient du DME en attente :</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-[11px] rounded border border-slate-350 p-1.5 bg-white font-medium"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <option value="">-- Patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddWaiting}
                  className="bg-slate-200 hover:bg-slate-250 text-slate-800 font-bold text-[10px] py-1 px-3.5 rounded uppercase"
                >
                  Inscrire
                </button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-[11px] text-emerald-800 leading-relaxed font-semibold space-y-2">
            <span className="font-bold flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-emerald-700" /> WebRTC Local & Chiffrement Peer-to-Peer</span>
            <p>Ce module utilise le protocole SRTP (Secure Real-Time Transport Protocol) chiffré en AES-128 pour garantir la confidentialité absolue des consultations médicales à distance.</p>
          </div>
        </div>

        {/* Right Hand / Main: Active WebRTC Stream Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between relative min-h-[460px]">
          
          {/* Active Call Status header */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center text-white text-xs">
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${activeCall ? "bg-red-500 animate-pulse" : "bg-slate-500"}`}></span>
              <span className="font-extrabold tracking-tight">
                {activeCall ? `Appel en cours : ${currentPatient ? `${currentPatient.nom.toUpperCase()} ${currentPatient.prenom}` : "Patient Cabinet"}` : "Protocole de signalement WebRTC Libre"}
              </span>
            </div>
            
            {activeCall && (
              <span className="text-[10px] font-mono bg-black/60 backdrop-blur-md px-2.5 py-1 rounded tracking-wider text-emerald-400 border border-emerald-500/20">
                P2P AES-128 SRTP
              </span>
            )}
          </div>

          {/* Video / Screen Share Layout Area */}
          <div className="flex-1 flex items-center justify-center relative bg-[#090d16]">
            {activeCall ? (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {screenShare ? (
                  /* Screen Share Simulation - Shows Constant clinical logs telemetry charts mockup */
                  <div className="w-full h-full bg-slate-900 flex flex-col justify-center items-center p-6 text-slate-300 relative animate-fade-in">
                    <div className="absolute top-16 left-4 right-4 p-3 bg-slate-950/80 border border-slate-800 rounded flex items-center justify-between text-[11px] font-mono">
                      <span className="flex items-center gap-1.5 text-emerald-400 font-bold"><Activity className="h-4 w-4 animate-pulse" /> Partage d'écran : Télémétrie clinique</span>
                      <span>Dossier: {currentPatient?.id}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 w-full max-w-md mt-12 font-semibold">
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                        <span className="text-[10px] text-slate-450 block uppercase font-mono">Pouls ECG constant</span>
                        <div className="flex items-center justify-center gap-2 text-rose-500">
                          <Heart className="h-5 w-5 animate-ping" />
                          <span className="text-xl font-black font-mono">78 bpm</span>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-1">
                        <span className="text-[10px] text-slate-450 block uppercase font-mono">Tension clinique</span>
                        <span className="text-xl font-black text-sky-400 font-mono">12.8 / 8.2</span>
                      </div>
                    </div>

                    <div className="w-full max-w-md h-12 border-t border-dashed border-slate-700 mt-4 flex items-center justify-center text-[10.5px] text-slate-400 text-center italic">
                      L'aide d'épreuve est partagée en direct avec le patient.
                    </div>
                  </div>
                ) : (
                  /* Live Camera Mockup Stream */
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-sky-950/5 to-slate-950 flex flex-col justify-center items-center">
                    {videoState ? (
                      <>
                        <Video className="h-20 w-20 text-sky-400 animate-pulse" />
                        <p className="text-white text-[12px] font-mono font-bold tracking-widest uppercase mt-4">Caméra Distante du Patient Connectée</p>
                        <p className="text-slate-450 text-[10px] font-medium">Bande passante: 1.8 Mbps | Latence de signalement: 12ms</p>
                      </>
                    ) : (
                      <div className="text-slate-500 italic text-xs flex flex-col items-center gap-2 font-semibold">
                        <VideoOff className="h-12 w-12 text-slate-650" />
                        <span>Flux vidéo suspendu par le patient</span>
                      </div>
                    )}

                    {/* Dr Picture-in-Picture Feedback Layout */}
                    <div className="absolute bottom-6 right-6 w-36 h-28 bg-slate-900 rounded-lg overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center">
                      <span className="text-[11px] font-black text-white text-center">Docteur (Vous)</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4 max-w-sm px-6">
                <Video className="h-16 w-16 mx-auto text-slate-800 animate-bounce" />
                <h4 className="text-white font-extrabold text-sm">Système de Visio-Assistance Chiffrée</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Sélectionnez un patient patientant dans la salle d'attente à gauche pour initier le flux média chiffré SRP/WebRTC sécurisé.
                </p>
              </div>
            )}
          </div>

          {/* Audio Feed Controls Bar */}
          <div className="bg-slate-950 p-4 flex items-center justify-between border-t border-slate-900 px-6">
            <div className="flex items-center gap-3">
              <button
                disabled={!activeCall}
                onClick={() => setMicState(!micState)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  micState ? "bg-slate-900 text-white hover:bg-slate-800 border border-slate-800" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
                } disabled:opacity-30`}
              >
                {micState ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              
              <button
                disabled={!activeCall}
                onClick={() => setVideoState(!videoState)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  videoState ? "bg-slate-900 text-white hover:bg-slate-800 border border-slate-800" : "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
                } disabled:opacity-30`}
              >
                {videoState ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>

              <button
                disabled={!activeCall}
                onClick={() => setScreenShare(!screenShare)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  screenShare ? "bg-sky-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800 border border-slate-800"
                } disabled:opacity-30`}
                title="Partager l'écran clinique"
              >
                <Monitor className="h-4 w-4" />
              </button>
            </div>

            {activeCall ? (
              <button
                onClick={() => {
                  setActiveCall(false);
                  setScreenShare(false);
                }}
                className="bg-red-650 hover:bg-red-700 text-white text-xs font-extrabold px-5 py-2 rounded-full cursor-pointer transition-all uppercase tracking-wide"
              >
                Raccrocher
              </button>
            ) : (
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 font-bold">
                <RefreshCw className="h-3 w-3 inline text-slate-600 animate-spin" /> LAN ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected chat & remote E-Prescription (DME Direct) */}
      {activeCall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs font-semibold">
          {/* Secure Live Chat */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col h-[300px]">
            <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MessageSquare className="h-4 w-4 text-sky-600 animate-pulse" /> Messagerie Sécurisée Intégrée
            </h3>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === "Vous" ? "items-end" : "items-start"}`}>
                  <div className={`p-2.5 rounded-lg max-w-[85%] font-medium leading-relaxed shadow-inner ${
                    msg.sender === "Vous" ? "bg-sky-50 text-sky-950 border border-sky-150 rounded-br-none" : "bg-slate-55 text-slate-800 border border-slate-150 rounded-bl-none"
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{msg.sender} @ {msg.time}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-100 pt-3">
              <input
                type="text"
                placeholder="Rédiger votre réponse sécurisée au patient..."
                className="flex-1 p-2 border border-slate-350 bg-slate-50 text-xs text-slate-800 font-semibold rounded outline-none"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded flex items-center justify-center cursor-pointer transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Remote E-prescription form that integrates back into patients physical records */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Stethoscope className="h-4 w-4 text-sky-650" /> Rédiger Ordonnance À Distance (E-Prescription)
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">Toute ordonnance saisie ici est instantanément chiffrée, signée numériquement et injectée dans le dossier DME accessible en pharmacie d'établissement.</p>
            </div>

            <div className="space-y-2 p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] leading-relaxed text-slate-700">
              <p>🏥 <strong>Patient :</strong> {currentPatient ? `${currentPatient.nom.toUpperCase()} ${currentPatient.prenom}` : "Cabinet"}</p>
              <p>🧬 <strong>Assurance liée :</strong> {currentPatient?.assurance || "Aucune"}</p>
            </div>

            <button
              onClick={() => {
                setPrescriptionMotif(`Téléconsultation d'épreuve pour : ${currentPatient?.nom.toUpperCase()}`);
                setShowPrescriptionModal(true);
              }}
              className="w-full text-white font-bold p-2.5 text-xs rounded-lg transition-all cursor-pointer select-none text-center flex items-center justify-center gap-1.5 shadow-xs uppercase tracking-wide"
              style={{ backgroundColor: accentColor }}
            >
              <FileText className="h-4 w-4" />
              <span>Renseigner Ordonnance DME</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive E-Prescription Overlay Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-slate-300 overflow-hidden text-xs">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase">
                <Stethoscope className="h-4 w-4 text-sky-650" />
                Ordonnance Digitale Chiffrée
              </span>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmitPrescription} className="p-5 space-y-3 text-slate-800 font-semibold input-focused-shadow">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-450 mb-1">Code National CIM-10</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs rounded border border-slate-350 p-1.5 font-mono"
                    value={prescriptionCodeCIM}
                    onChange={(e) => setPrescriptionCodeCIM(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-450 mb-1">Diagnostic principal de consultation</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs rounded border border-slate-350 p-1.5"
                    value={prescriptionDiag}
                    onChange={(e) => setPrescriptionDiag(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-450 mb-1">Motif médical de téléconsultation</label>
                <input
                  type="text"
                  required
                  className="w-full text-xs rounded border border-slate-300 p-1.5"
                  value={prescriptionMotif}
                  onChange={(e) => setPrescriptionMotif(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-450 mb-1">médicaments et schéma posologique (Par lignes)</label>
                <textarea
                  rows={4}
                  required
                  className="w-full text-xs rounded border border-slate-300 p-2 font-mono"
                  value={prescriptionMedication}
                  onChange={(e) => setPrescriptionMedication(e.target.value)}
                />
              </div>

              <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-lg text-[10px] text-indigo-850 leading-relaxed font-semibold">
                🔒 <strong>Signature cryptographique :</strong> Au moment de l'enregistrement, l'acte est signé virtuellement et publié sur les serveurs de la pharmacie locale MédiSahel pour délivrance accélérée.
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="p-1 px-3 border rounded text-slate-705 h-9 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPrescriptionSigned}
                  className="px-4 py-1.5 text-white rounded font-bold transition-all flex items-center gap-1 cursor-pointer h-9 disabled:bg-emerald-400"
                  style={{ backgroundColor: accentColor }}
                >
                  {isPrescriptionSigned ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 animate-bounce" /> Signature en cours...
                    </>
                  ) : (
                    "Signer & Publier au DME"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
