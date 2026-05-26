import { useState, FormEvent } from "react";
import { Patient } from "../types";
import { Video, VideoOff, Mic, MicOff, Monitor, MessageSquare, Send, UserCheck, Stethoscope, AlertCircle, RefreshCw } from "lucide-react";

interface TeleconsultationViewProps {
  patients: Patient[];
  accentColor: string;
}

export default function TeleconsultationView({
  patients,
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

    // Simulate automatic remote reply
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: "Patient", text: "D'accord, merci pour ces explications.", time: new Date().toLocaleTimeString("fr-FR").slice(0, 5) }
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
      alert("Patient déjà dans la salle d'attente.");
      return;
    }
    setWaitingList(prev => [...prev, {
      id: pat.id,
      nom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      joinTime: new Date().toLocaleTimeString("fr-FR").slice(0, 5)
    }]);
    setSelectedPatientId("");
  };

  return (
    <div className="space-y-6" id="teleconsultation-view-wrapper">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Video className="h-5 w-5" style={{ color: accentColor }} />
          <span>Module de Téléconsultation WebRTC Local</span>
        </h2>
        <p className="text-xs text-slate-500">Service de vidéoconférence médicale sécurisée intégrée, sans connexion internet externe requise.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Waiting queue & Caller setup panel */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <UserCheck className="h-4 w-4 text-sky-600" /> Salle d'Attente Virtuelle
            </h3>

            {waitingList.length === 0 ? (
              <p className="text-slate-400 italic text-center py-6">La salle d'attente est vide.</p>
            ) : (
              <div className="space-y-2">
                {waitingList.map((w) => (
                  <div key={w.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between hover:bg-slate-100/50 transition-all font-medium">
                    <div>
                      <h4 className="font-bold text-slate-900">{w.nom}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {w.id} | Joint à {w.joinTime}</span>
                    </div>

                    <button
                      onClick={() => handleStartCall(w.nom, w.id)}
                      className="text-white text-[10px] font-bold px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-all uppercase"
                    >
                      Appeler
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Manual adding tool */}
            <div className="pt-3 border-t border-slate-150 space-y-2">
              <label className="block text-[10px] uppercase font-extrabold text-slate-450 block">Placer un patient dans la salle :</label>
              <div className="flex gap-2">
                <select
                  className="flex-1 text-[11px] rounded border border-slate-350 p-1 bg-white font-medium"
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
                  className="bg-slate-250 hover:bg-slate-300 text-slate-800 border font-bold text-[10px] py-1 px-3 rounded uppercase"
                >
                  Inscrire
                </button>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-[11px] text-amber-800 leading-relaxed font-semibold space-y-2">
            <span className="font-bold flex items-center gap-1"><AlertCircle className="h-3.5 w-3.5 text-amber-600" /> Architecture locale WebRTC</span>
            <p>Ce module fonctionne en réseau local (LAN). La voix et le flux vidéo s'échangent sans dépendance internet grâce à la topologie de signaling intégrée au serveur d'établissement.</p>
          </div>
        </div>

        {/* Center Live WebRTC simulator canvas */}
        <div className="lg:col-span-2 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between relative min-h-[450px]">
          
          {/* Top banner status overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center text-white text-xs">
            <div className="bg-black/40 backdrop-blur-md px-3 py-1 bg-opacity-70 rounded-full flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${activeCall ? "bg-red-500 animate-pulse" : "bg-slate-400"}`}></span>
              <span className="font-bold tracking-tight">
                {activeCall ? `Appel en cours : ${patients.find(p => p.id === selectedPatientId)?.nom || "Patient Cabinet"}` : "Serveur de signalement en sommeil"}
              </span>
            </div>
            
            {activeCall && (
              <span className="text-[10px] font-mono bg-black/40 backdrop-blur-md px-2 py-0.5 rounded tracking-widest text-emerald-400">
                SECURE WebRTC AES-128
              </span>
            )}
          </div>

          {/* Video simulation canvas */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center relative">
            {activeCall ? (
              videoState ? (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  {/* Fake patient live camera layout rendering */}
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-sky-950/20 to-slate-950 flex flex-col justify-center items-center">
                    <Video className="h-16 w-16 text-sky-450 animate-pulse" />
                    <p className="text-white text-[11px] font-mono font-semibold tracking-wider uppercase mt-4">Simulation Caméra Patient Réseau</p>
                    <p className="text-slate-400 text-[10px]">Taux de trames: 30fps (Audio PCM 48kHz)</p>
                  </div>

                  {/* Doctor feedback window absolute position */}
                  <div className="absolute bottom-4 right-4 w-32 h-24 bg-slate-800 rounded-lg overflow-hidden border border-white/20 shadow-lg flex items-center justify-center">
                    <span className="text-[12px] font-extrabold text-white">Vous (Médecin)</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-550 italic text-xs flex flex-col items-center gap-2">
                  <VideoOff className="h-10 w-10 text-slate-500" />
                  <span>Caméra distante déconnectée</span>
                </div>
              )
            ) : (
              <div className="text-center space-y-4 max-w-sm px-6">
                <Video className="h-14 w-14 mx-auto text-slate-700 animate-bounce" />
                <h4 className="text-white font-bold text-sm">Système de visio-assistance clinique</h4>
                <p className="text-[10.5px] text-slate-500 leading-relaxed">Cliquez sur un patient en attente pour initier un appel chiffré. Le flux audio et sémantique se gère en local.</p>
              </div>
            )}
          </div>

          {/* Action video control indicators bar */}
          <div className="bg-slate-950/80 backdrop-blur-md p-4 flex items-center justify-between border-t border-slate-900 px-6">
            <div className="flex items-center gap-3">
              <button
                disabled={!activeCall}
                onClick={() => setMicState(!micState)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  micState ? "bg-slate-800 text-white hover:bg-slate-705" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                } disabled:opacity-40`}
              >
                {micState ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              
              <button
                disabled={!activeCall}
                onClick={() => setVideoState(!videoState)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  videoState ? "bg-slate-800 text-white hover:bg-slate-705" : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                } disabled:opacity-40`}
              >
                {videoState ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>

              <button
                disabled={!activeCall}
                onClick={() => setScreenShare(!screenShare)}
                className={`p-2.5 rounded-full cursor-pointer transition-all ${
                  screenShare ? "bg-emerald-600 text-white" : "bg-slate-800 text-white hover:bg-slate-705"
                } disabled:opacity-40`}
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
                className="bg-red-650 hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2 rounded-full cursor-pointer transition-all uppercase tracking-wide"
              >
                Raccrocher
              </button>
            ) : (
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <RefreshCw className="h-3 w-3 inline text-slate-600 animate-spin" /> LAN ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connected chat & remote DME section */}
      {activeCall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in text-xs">
          {/* Realtime messaging log */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col h-[280px]">
            <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MessageSquare className="h-4 w-4 text-sky-600" /> Messagerie Patient Sécurisée
            </h3>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === "Vous" ? "items-end" : "items-start"}`}>
                  <div className={`p-2.5 rounded-lg max-w-[80%] font-medium leading-relaxed ${
                    msg.sender === "Vous" ? "bg-sky-50 text-sky-950 border border-sky-150 rounded-br-none" : "bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-none"
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
                placeholder="Message à envoyer..."
                className="flex-1 p-2 border border-slate-350 bg-slate-50 text-xs text-slate-800 font-semibold"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
              />
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Quick clinical instructions panel */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 font-semibold text-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                <Stethoscope className="h-4 w-4 text-sky-600" /> Actes de télé-prescription à distance
              </h3>
              <p className="text-[10px] text-slate-500 leading-relaxed pt-1">Rédiger un certificat d'inaptitude temporaire de repos d'épreuve ou une prescription clinique en direct pour l'ajouter au DME.</p>
            </div>

            <div className="space-y-2 p-3 bg-slate-50 border border-slate-150 rounded text-[11px] leading-relaxed">
              <span className="font-extrabold text-[10px] text-slate-400 block uppercase">CONSEILS DIRECTS PAR LE PRATICIEN :</span>
              <p>1. Les ordonnances d'épreuve se lient directement au dossier.</p>
              <p>2. Demander au patient de s'orienter vers la pharmacie d'établissement pour son retrait.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => alert("Lancement de l'outil d'ordonnance synchronisée...")}
                className="w-full text-white font-bold p-2 text-xs rounded transition-all cursor-pointer select-none text-center"
                style={{ backgroundColor: accentColor }}
              >
                Renseigner Prescription DME Courante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
