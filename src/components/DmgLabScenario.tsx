import React, { useState } from "react";
import { 
  Users, Stethoscope, Clock, ShieldAlert, CheckCircle, Award, TrendingUp, Plus, Check,
  UserCheck, AlertTriangle, Send, FileText, ChevronRight, Activity, Zap,
  BellRing, Volume2, Lock, FlaskConical, DollarSign
} from "lucide-react";

interface DmgLabScenarioProps {
  showToast: (msg: string, type?: any) => void;
}

export const DmgLabScenario: React.FC<DmgLabScenarioProps> = ({ showToast }) => {
  const [step, setStep] = useState<number>(1);
  
  // Scenarios state data
  const [selectedExams, setSelectedExams] = useState({
    nfs: true,
    tdr: true,
    glycemie: false
  });

  const [paymentMode, setPaymentMode] = useState<string>("Orange Money");
  const [paymentValidated, setPaymentValidated] = useState<boolean>(false);
  const [activeLabAction, setActiveLabAction] = useState<"pending" | "running" | "signed">("pending");
  
  // Results form
  const [results, setResults] = useState({
    nfsHb: "12.5",
    nfsGb: "8500",
    nfsPlat: "220000",
    tdrResult: "POSITIF",
    glycemieVal: "0.95",
    observations: "Prélèvement de bonne qualité",
    laborantinSign: "Mariam Koné",
    signatureHash: "MK-13062025-0945"
  });

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = "sine";
      // High-quality notification chime (G5 -> C6)
      oscillator.frequency.setValueAtTime(783.99, audioCtx.currentTime); // G5
      oscillator.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.15); // C6
      
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (err) {
      console.warn("Chime failed:", err);
    }
  };

  // Pricing config
  const PRICES = {
    consultation: 5000,
    nfs: 3000,
    tdr: 2000,
    glycemie: 2000
  };

  const calculateTotal = () => {
    let tot = PRICES.consultation;
    if (selectedExams.nfs) tot += PRICES.nfs;
    if (selectedExams.tdr) tot += PRICES.tdr;
    if (selectedExams.glycemie) tot += PRICES.glycemie;
    return tot;
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs font-semibold animate-duration-300" id="lab-scenario-component">
      
      {/* HUD Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-amber-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden border border-teal-600/30">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-12">
          <FlaskConical className="h-64 w-64 text-teal-400" />
        </div>

        <div className="relative z-10 space-y-2">
          <span className="bg-teal-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono">
            Scénario 2 : Interopérabilité &amp; Confidentialité
          </span>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
            🔬 Parcours Complet d'Analyses Biologiques (Médecin ➔ Caisse ➔ Labo ➔ Médecin)
          </h2>
          <p className="text-[11px] text-slate-200 font-medium max-w-4xl leading-relaxed">
            Ce simulateur orchestre le circuit d'analyses d'urgence de la patiente <strong className="text-amber-300">Fatoumata Diallo</strong>. 
            Découvrez comment le système gère les habilitations strictes : le <strong>Caissier encaisse</strong> mais n'a 
            <strong> aucun accès au secret médical</strong>, tandis que le <strong>Laborantin valide</strong> et transmet en exclusivité 
            les résultats biologiques au <strong>Médecin prescripteur</strong> pour son DME.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button 
              onClick={() => {
                setStep(1);
                setSelectedExams({ nfs: true, tdr: true, glycemie: false });
                setPaymentValidated(false);
                setActiveLabAction("pending");
                setResults({
                  nfsHb: "12.5",
                  nfsGb: "8500",
                  nfsPlat: "220000",
                  tdrResult: "POSITIF",
                  glycemieVal: "0.95",
                  observations: "Prélèvement de bonne qualité",
                  laborantinSign: "Mariam Koné",
                  signatureHash: "MK-13062025-0945"
                });
                showToast("🧬 Scénario d'analyses réinitialisé à l'étape 1 !", "info");
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white font-black px-4 py-2 rounded-xl border border-teal-500/50 cursor-pointer text-[10px] uppercase font-mono tracking-wider transition-all"
            >
              🔄 Réinitialiser le scénario Laboratoire
            </button>

            <button 
              onClick={playChime}
              className="bg-white/10 hover:bg-white/20 text-white font-black px-3 py-2 rounded-xl cursor-pointer text-[10px] uppercase font-mono tracking-wider transition-all flex items-center gap-1.5"
            >
              <Volume2 className="h-4 w-4 text-teal-400 animate-pulse" />
              Tester le signal sonore Clinique (Chime d'Alerte)
            </button>
          </div>
        </div>
      </div>

      {/* Stepper HUD */}
      <div className="bg-white rounded-2xl border border-gray-150 p-4 shadow-xs">
        <div className="flex justify-between items-center px-1 border-b pb-3 mb-4">
          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-mono">Filière d'analyses et de facturation</span>
          <span className="text-xs font-bold text-slate-850">
            Fiche patient : <strong className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md font-mono">Fatoumata DIALLO (32 ans)</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { num: 1, label: "1. Médecin", desc: "Prescription d'examen" },
            { num: 2, label: "2. Caissier", desc: "Paiement de facture" },
            { num: 3, label: "3. Laborantin", desc: "Analyses & Saisie" },
            { num: 4, label: "4. Système", desc: "Routage sécurisé" },
            { num: 5, label: "5. Médecin", desc: "Réception & Dossier" },
            { num: 6, label: "6. Sécurité", desc: "Refus d'accès Caisse" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => {
                setStep(s.num);
                showToast(`Navigué vers l'étape ${s.num} du parcours d'analyses`);
              }}
              className={`p-2.5 rounded-xl text-left border transition-all relative ${
                step === s.num
                  ? "bg-teal-50 border-teal-500 ring-2 ring-teal-500/20 text-teal-950 font-black"
                  : step > s.num
                  ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                  : "bg-slate-50/50 border-slate-150 text-slate-450 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-1.5 justify-between">
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full ${
                  step === s.num ? "bg-teal-200 text-teal-900" :
                  step > s.num ? "bg-emerald-200 text-emerald-900" : "bg-slate-200 text-slate-500"
                }`}>{s.num}</span>
                {step > s.num && <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              </div>
              <p className="font-extrabold text-[11px] mt-1.5 leading-none">{s.label}</p>
              <p className="text-[9px] text-slate-400 font-medium block mt-0.5 leading-none">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Step screen (2/3 col) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-150 p-6 shadow-sm min-h-[500px] flex flex-col justify-between text-slate-800">
          
          {/* STEP 1: PRESCRIPTION MÉDECIN */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono">Étape 1 sur 6 – Diagnostic &amp; Prescription</span>
                  <h3 className="text-base font-black text-slate-900">📝 Consultation du Praticien &amp; Éditeur d'Examens Biologiques</h3>
                </div>
                <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">Dr. Ibrahim Touré</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-dashed text-[11px] text-slate-650 leading-relaxed font-semibold">
                Pendant sa consultation, le Dr. Ibrahim Touré diagnostique chez Fatoumata Diallo un 
                <strong className="text-slate-900"> paludisme simple foudroyant</strong>. Il utilise l'éditeur médical de premier plan 
                pour prescrire instantanément des analyses sanguines confirmatives.
              </div>

              {/* Consultation UI frame */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2.5">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <span className="font-mono text-[9px] text-teal-400 uppercase tracking-wider">👩‍⚕️ CONSULTATION ACTIVE – Fatoumata Diallo</span>
                  <span className="text-[9px] text-gray-400">Dossier : P2026-0123</span>
                </div>
                
                <div className="space-y-1.5 text-[11px]">
                  <p><span className="text-gray-400 font-normal">Diagnostic de présomption :</span> <strong className="text-yellow-400">Paludisme simple / Suspicion accès palustre</strong></p>
                  <p><span className="text-gray-400 font-normal">Observations cliniques :</span> <em>Fièvre aiguë de 39°C, frissons violents et céphalées depuis 48 heures. Patient hypotendu.</em></p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-50 space-y-3.5">
                <h4 className="text-xs font-black text-slate-800 font-mono uppercase tracking-wide">📦 ÉDITEUR INTELLIGENT DE PRESCRIPTION D'EXAMENS</h4>
                <p className="text-[10px] text-slate-500 font-normal leading-tight">
                  Taper les codes d'autocomplétion ou sélectionner directement les examens de routine ci-dessous :
                </p>

                {/* Auto complete tags simulator */}
                <div className="flex gap-2 pb-1.5 border-b border-dashed border-slate-200">
                  <button 
                    onClick={() => {
                      setSelectedExams({ ...selectedExams, nfs: true });
                      showToast("NFS (Numération Formule Sanguine) ajoutée via [@nfs]", "success");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${selectedExams.nfs ? 'bg-teal-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border'}`}
                  >
                    [@nfs] NFS
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedExams({ ...selectedExams, tdr: true });
                      showToast("TDR Paludisme ajouté via [@tdr]", "success");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${selectedExams.tdr ? 'bg-teal-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border'}`}
                  >
                    [@tdr] TDR Paludisme
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedExams({ ...selectedExams, glycemie: !selectedExams.glycemie });
                      showToast(`Glycémie ${!selectedExams.glycemie ? 'ajoutée' : 'retirée'} via [@glycemie]`, "info");
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${selectedExams.glycemie ? 'bg-teal-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border'}`}
                  >
                    [@glycemie] Glycémie
                  </button>
                </div>

                {/* Exam select checkboxes list */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl hover:border-teal-500 transition-all">
                    <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-800">
                      <input 
                        type="checkbox" 
                        checked={selectedExams.nfs} 
                        onChange={() => setSelectedExams({ ...selectedExams, nfs: !selectedExams.nfs })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>NFS (Numération Formule Sanguine)</span>
                    </label>
                    <span className="font-mono text-xs font-black text-slate-500">3 000 FCFA</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl hover:border-teal-500 transition-all">
                    <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-800">
                      <input 
                        type="checkbox" 
                        checked={selectedExams.tdr} 
                        onChange={() => setSelectedExams({ ...selectedExams, tdr: !selectedExams.tdr })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>TDR Paludisme (Diagnostic Rapide)</span>
                    </label>
                    <span className="font-mono text-xs font-black text-slate-500">2 000 FCFA</span>
                  </div>

                  <div className="flex justify-between items-center p-2.5 bg-white border border-gray-150 rounded-xl hover:border-teal-500 transition-all">
                    <label className="flex items-center gap-2 cursor-pointer font-bold select-none text-slate-800">
                      <input 
                        type="checkbox" 
                        checked={selectedExams.glycemie} 
                        onChange={() => setSelectedExams({ ...selectedExams, glycemie: !selectedExams.glycemie })}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>Glycémie à jeun de contrôle</span>
                    </label>
                    <span className="font-mono text-xs font-black text-slate-500">2 000 FCFA</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="text-slate-500 font-normal">
                  Statut de la demande créée : <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-mono font-bold">PENDING_PAYMENT</span>
                </div>
                <button
                  onClick={() => {
                    if (!selectedExams.nfs && !selectedExams.tdr && !selectedExams.glycemie) {
                      showToast("⚠️ Veuillez sélectionner au moins un examen d'analyse !", "error");
                      return;
                    }
                    playChime();
                    showToast("Consultation validée ! Facture générée automatiquement et envoyée en Caisse.", "success");
                    setStep(2);
                  }}
                  className="bg-teal-800 hover:bg-teal-900 text-white font-mono uppercase text-[10px] font-black px-6 py-3 rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  💾 Valider Prescription et envoyer facture <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LE PATIENT VA À LA CAISSE */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono">Étape 2 sur 6 – Module d'Encaissement</span>
                  <h3 className="text-base font-black text-slate-900">💰 CAISSE – FACTRES EN ATTENTE DE RÈGLEMENT</h3>
                </div>
                <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">Caisse Centrale</span>
              </div>

              <div className="bg-amber-50/40 p-3.5 rounded-xl border border-dashed border-amber-200 text-[11px] text-amber-950 font-semibold leading-normal">
                🚨 <strong className="font-black">Verrouillage de sécurité active :</strong> L'agent de caisse visualise les lignes tarifaires 
                et encaisse le montant exigibles; mais le système lui masque totalement l'anamnèse clinique, le motif précis de l'analyse, ainsi 
                que tout futur résultat d'analyse.
              </div>

              {/* Cash register invoice layout */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-xs">
                <div className="flex justify-between items-start text-[11px] border-b pb-3">
                  <div>
                    <span className="text-gray-400 font-normal font-mono block">PATIENT DE RÉFÉRENCE</span>
                    <strong className="text-slate-900 text-sm">Fatoumata DIALLO</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 font-normal font-mono block">MÉDECIN PRESCRIPTEUR</span>
                    <strong className="text-slate-800">Dr. Ibrahim Touré (Cabinet DMG)</strong>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[8px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono uppercase font-black">Prestations facturées</span>
                  
                  <div className="space-y-1.5 text-xs font-semibold">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-700">
                      <span>Consultation médicale (Généraliste)</span>
                      <strong className="font-mono text-slate-800">5 000 FCFA</strong>
                    </div>

                    {selectedExams.nfs && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-700">
                        <span>NFS (Numération Formule Sanguine - Analyse)</span>
                        <strong className="font-mono text-slate-800">3 000 FCFA</strong>
                      </div>
                    )}

                    {selectedExams.tdr && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-700">
                        <span>TDR Paludisme (Examen biologique rapide)</span>
                        <strong className="font-mono text-slate-800">2 000 FCFA</strong>
                      </div>
                    )}

                    {selectedExams.glycemie && (
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100 text-slate-700">
                        <span>Glycémie de contrôle (Examen biologique rapide)</span>
                        <strong className="font-mono text-slate-800">2 000 FCFA</strong>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 bg-slate-50 px-3 rounded-xl mt-2 border border-slate-150">
                      <span className="text-slate-900 font-extrabold uppercase font-sans">TOTAL À PAYER</span>
                      <strong className="font-mono text-sm font-black text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                        {calculateTotal().toLocaleString("fr-FR")} FCFA
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Secure warning badge */}
                <div className="p-3 bg-slate-50 border rounded-xl flex items-center gap-2">
                  <Lock className="h-4 w-4 text-rose-600 shrink-0" />
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">
                    La caisse utilise un canevas financier scellé. Les dossiers cliniques ne sont pas stockés dans ce module.
                  </span>
                </div>

                {/* Modes de paiement */}
                <div className="space-y-1.5">
                  <label className="text-[9px] text-slate-500 font-mono block uppercase">Mode de règlement choisi :</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {["Espèces", "Orange Money", "Moov Money", "Wave", "CANAM (Prise en charge 8%)", "INPS"].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          paymentMode === mode 
                            ? "bg-teal-50 border-teal-505 text-teal-900 ring-1 ring-teal-500/20 font-black" 
                            : "bg-white hover:bg-slate-50 text-slate-700 text-xs"
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl"
                >
                  ⬅ Retour
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => showToast(`Facture imprimée : ${calculateTotal().toLocaleString("fr-FR")} FCFA en mode ${paymentMode}`)}
                    className="px-4 py-2.5 bg-white border border-gray-300 text-slate-750 hover:bg-slate-50 rounded-xl flex items-center gap-1.5 font-bold"
                  >
                    🖨 Imprimer Facture
                  </button>

                  <button
                    onClick={() => {
                      setPaymentValidated(true);
                      showToast(`Paiement reçu (${paymentMode})! Statut: PAID. Accréditation Labo validée d'office.`, "success");
                      setStep(3);
                    }}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl uppercase font-mono tracking-wider font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    💸 Valider Paiement et Transmettre au Labo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LABORANTIN SAISIT LES RÉSULTATS */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono">Étape 3 sur 6 – Saisie des Résultats Laboratoires</span>
                  <h3 className="text-base font-black text-slate-900">🔬 LABORATOIRE – DEMANDES D'ANALYSES À TRAITER</h3>
                </div>
                <span className="bg-teal-50 text-teal-800 border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">Mariam Koné</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1 text-slate-700 leading-tight">
                  <p>Patient : <strong className="text-slate-950 font-black">Fatoumata Diallo</strong> (ID: P2026-0123)</p>
                  <p className="text-[10px] text-gray-400">Prescripteur : Dr. Ibrahim Touré | Reçu le 13/06/2026 à 09:32</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  <span className="bg-emerald-100 text-emerald-850 border border-emerald-250 font-mono text-[9px] px-2 py-0.5 rounded font-black uppercase">
                    ✅ PAYÉ (Montant acquitté)
                  </span>
                </div>
              </div>

              {activeLabAction === "pending" ? (
                <div className="border-2 border-dashed border-sky-200 rounded-3xl p-6 text-center space-y-4 bg-sky-50/10">
                  <Activity className="h-10 w-10 text-teal-600 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">🧬 Nouvelle demande de prélèvement disponible</h4>
                    <p className="text-slate-550 text-[11px] font-normal max-w-md mx-auto">
                      Les droits du Laborantin l'autorisent à prendre en charge, réaliser l'analyse et saisir les examens payés NFS, TDR.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveLabAction("running");
                      showToast("Prélèvement accepté ! Saisie des valeurs réelles activée d'office.");
                    }}
                    className="bg-teal-700 hover:bg-teal-850 text-white font-mono uppercase text-[10px] font-black px-5 py-2.5 rounded-xl cursor-pointer shadow"
                  >
                    🔬 PRENDRE EN CHARGE LES ANALYSES
                  </button>
                </div>
              ) : (
                <div className="space-y-4 font-semibold text-slate-800 bg-white border rounded-2xl p-4.5 shadow-xs">
                  <h4 className="text-xs font-black font-mono text-slate-800 uppercase tracking-wider">Formulaire Technique d'Analyses Biologiques</h4>
                  
                  <div className="space-y-4 divide-y divide-gray-100">
                    {/* NFS Inputs */}
                    {selectedExams.nfs && (
                      <div className="space-y-3 pt-2">
                        <span className="text-[9px] bg-sky-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider block w-max">
                          EXAMEN : NFS (Numération Formule Sanguine)
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9.5px] text-gray-500 font-sans block mb-1">Hémoglobine (g/dL) [Norm : 12-16]</label>
                            <input 
                              type="text" 
                              value={results.nfsHb} 
                              onChange={(e) => setResults({ ...results, nfsHb: e.target.value })}
                              className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] text-gray-500 font-sans block mb-1">Globules blancs (/mm³) [Norm : 4k-10k]</label>
                            <input 
                              type="text" 
                              value={results.nfsGb} 
                              onChange={(e) => setResults({ ...results, nfsGb: e.target.value })}
                              className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none focus:ring-1 focus:ring-teal-700"
                            />
                          </div>

                          <div>
                            <label className="text-[9.5px] text-gray-500 font-sans block mb-1">Plaquettes (/mm³) [Norm : 150k-450k]</label>
                            <input 
                              type="text" 
                              value={results.nfsPlat} 
                              onChange={(e) => setResults({ ...results, nfsPlat: e.target.value })}
                              className="p-2 w-full bg-slate-50 border rounded-xl font-mono text-center font-extrabold focus:outline-none focus:ring-1"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TDR input */}
                    {selectedExams.tdr && (
                      <div className="space-y-2 pt-4">
                        <span className="text-[9px] bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider block w-max">
                          EXAMEN : TDR PALUDISME
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                          <div>
                            <label className="text-[9.5px] text-gray-500 block mb-1">Résultat TDR rapide</label>
                            <select 
                              value={results.tdrResult} 
                              onChange={(e) => setResults({ ...results, tdrResult: e.target.value })}
                              className="w-full p-2 bg-slate-50 border rounded-xl text-xs font-black focus:outline-none"
                            >
                              <option value="POSITIF">POSITIF (Plasmodium falciparum détecté)</option>
                              <option value="NÉGATIF">NÉGATIF (Plasmodium falciparum non identifié)</option>
                            </select>
                          </div>
                          
                          <div className="p-2.5 bg-rose-50 text-rose-950 rounded-xl text-[10.5px] font-medium leading-relaxed">
                            ⚠️ Le TDR positif est un signal prioritaire nécessitant d'immédiates prescriptions d'ACT par le médecin référent.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Glycémie input */}
                    {selectedExams.glycemie && (
                      <div className="space-y-2 pt-4">
                        <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-md font-bold uppercase block w-max">
                          EXAMEN : GLYCÉMIE
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[9.5px] text-gray-500 block mb-1">Concentration de Glycémie (g/L)</label>
                            <input 
                              type="text" 
                              value={results.glycemieVal} 
                              onChange={(e) => setResults({ ...results, glycemieVal: e.target.value })}
                              className="p-2 bg-slate-50 border rounded-xl font-mono text-center font-bold font-mono focus:outline-none"
                            />
                          </div>
                          <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-slate-500 flex items-center justify-center">
                            Normale glycémie à jeun de contrôle : 0,70 g/L à 1,10 g/L.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* General observations */}
                    <div className="space-y-1.5 pt-4">
                      <label className="text-[9.5px] text-gray-500 block font-sans">Observations complémentaires du Laborantin</label>
                      <input 
                        type="text" 
                        value={results.observations}
                        onChange={(e) => setResults({ ...results, observations: e.target.value })}
                        placeholder="Rédiger une remarque clinique..."
                        className="p-2.5 text-xs w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  {activeLabAction === "signed" ? (
                    <div className="mt-4 p-4.5 bg-emerald-50 border border-emerald-250 text-emerald-850 rounded-2xl space-y-2">
                      <p className="font-extrabold text-xs flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        CERTIFIDÉ – RÉSULTAT SIGNÉ ÉLECTRONIQUEMENT
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Signé par <strong className="text-emerald-950">{results.laborantinSign}</strong> sous l'identitée cryptée unique : 
                        <span className="font-mono bg-white px-2 py-0.5 rounded border ml-1 font-bold">{results.signatureHash}</span>.
                      </p>
                      <p className="text-[10px] text-gray-500 font-normal">Validé et horodaté le 13/06/2026 à 09:45. Transit exclusif vers le DME initié.</p>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end pt-4 border-t border-dashed mt-4 font-mono">
                      <button
                        onClick={() => {
                          setActiveLabAction("signed");
                          playChime();
                          showToast("Signature électronique scellée avec succès !", "success");
                        }}
                        className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 border border-teal-500/50 text-white rounded-xl text-[10px] uppercase font-black cursor-pointer shadow-md"
                      >
                        ✍️ apposer signature électronique &amp; enregistrer
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t mt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                >
                  ⬅ Retour
                </button>
                <button
                  onClick={() => {
                    if (activeLabAction !== "signed") {
                      showToast("⚠️ Les résultats doivent impérativement être validés et signés avant émission !", "error");
                      return;
                    }
                    showToast("Envoi sécurisé exclusif initié.", "info");
                    setStep(4);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-850 text-white font-mono uppercase text-[10px] font-black px-6 py-3 rounded-xl cursor-pointer shadow-md"
                >
                  Continuer vers routage résultats ➡️
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ENVOI AUTOMATIQUE DES RESULTATS */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono font-bold">Étape 4 sur 6 – Traitement d'Architecture Réseau</span>
                  <h3 className="text-base font-black text-slate-900">🧬 ROUTAGE SÉCURISÉ &amp; ENCREMENT AUTOMATIQUE DU SYSTÈME</h3>
                </div>
                <span className="bg-teal-50 text-teal-800 border-teal-200 px-2 py-0.5 rounded text-[10px] font-bold">MédiSahel HIS</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border italic leading-relaxed text-[11px] text-slate-600 font-semibold">
                La signature du laborantin a instantanément déclenché un hachage asynchrone sécurisé du dossier. 
                Le système filtre et applique le secret de l'instruction biologique :
              </div>

              {/* Graphical distribution visualizers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 text-center space-y-2">
                  <span className="bg-emerald-250 text-emerald-950 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    Sceau principal
                  </span>
                  <Stethoscope className="h-8 w-8 text-emerald-850 mx-auto" />
                  <p className="font-extrabold text-xs text-slate-900">Dr. Ibrahim Touré</p>
                  <p className="text-[9.5px] text-emerald-900 font-medium leading-none">Transmission Exclusive</p>
                  <div className="bg-white px-2 py-1 rounded text-[9px] text-emerald-700 border font-bold">✅ REÇU &amp; DISPONIBLE</div>
                </div>

                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4.5 text-center space-y-2">
                  <span className="bg-sky-200 text-sky-950 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    Archivage permanent
                  </span>
                  <FileText className="h-8 w-8 text-sky-700 mx-auto" />
                  <p className="font-extrabold text-xs text-slate-900">DME Fatoumata Diallo</p>
                  <p className="text-[9.5px] text-indigo-900 font-medium leading-none">Dossier Centralisé HIS</p>
                  <div className="bg-white px-2 py-1 rounded text-[9px] text-indigo-600 border font-bold">✅ HISTORISÉ &amp; SCELLÉ</div>
                </div>

                <div className="bg-rose-50 border border-red-200 rounded-2xl p-4.5 text-center space-y-2">
                  <span className="bg-red-200 text-red-950 font-mono text-[8px] font-black uppercase px-2 py-0.5 rounded-full">
                    Accès Interdit
                  </span>
                  <Lock className="h-8 w-8 text-rose-700 mx-auto" />
                  <p className="font-extrabold text-xs text-slate-900">Guichet Caissier</p>
                  <p className="text-[9.5px] text-red-955 font-medium leading-none">Cryptage Actif</p>
                  <div className="bg-red-600 text-white px-2 py-1 rounded text-[9px] border border-red-400 font-bold">🔒 ACCÈS COMPLÈTEMENT REFUSÉ</div>
                </div>
              </div>

              {/* System trace info */}
              <div className="bg-slate-900 text-slate-205 p-4.5 rounded-2xl border font-mono space-y-2 text-[11px] leading-relaxed">
                <p className="text-yellow-400 font-extrabold flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  TRACE DE DISSEMINATION SÉCURISÉE DES DONNÉES :
                </p>
                <div className="space-y-1 text-[10px] text-gray-400">
                  <p>● HASHING SHA-256 : <span className="text-cyan-400 font-bold">3a8f1bc2d4e5f6e7a2b3c4...</span></p>
                  <p>● DESTINATION PRINCIPALE : <span className="text-white font-bold">DME_PATIENT_P2026-0123 / MEDECIN_REF_IT</span></p>
                  <p>● FILTRAGE CAISSIER : <span className="text-rose-400 font-bold">ACTIF_LOCK_RULE_DEREF_LAB_RESULTS</span></p>
                  <p>● CERTIFICATION COMMUNE : <span className="text-emerald-400 font-bold">HIS-MALI-MEDIS-V2-OK</span></p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                >
                  ⬅ Retour
                </button>
                <button
                  onClick={() => {
                    playChime();
                    showToast("Notification de résultats disponible émise sur la console clinique !", "success");
                    setStep(5);
                  }}
                  className="bg-teal-800 hover:bg-teal-900 text-white font-mono uppercase text-[10px] font-black px-6 py-3 rounded-xl cursor-pointer shadow-md"
                >
                  📢 Déclencher Alerte Médecin ➡️
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: LE MÉDECIN RECOIT LE RÉSULTAT */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono">Étape 5 sur 6 – Visibilité Praticien</span>
                  <h3 className="text-base font-black text-slate-900">👨‍⚕️ CONSOLE CLINIQUE – RÉREPTIONS D'ALERTE BIOLOGIQUE</h3>
                </div>
                <span className="bg-sky-100 text-indigo-805 border border-indigo-200 px-2 py-0.5 rounded text-[10px] font-bold">Consultation</span>
              </div>

              {/* Real time floating alerts mock */}
              <div className="border-4 border-amber-500 rounded-3xl overflow-hidden shadow-xl bg-orange-50/10">
                <div className="bg-amber-500 text-slate-950 p-3 flex justify-between items-center text-xs font-black font-mono">
                  <span className="flex items-center gap-1.5 uppercase tracking-wide">
                    <BellRing className="h-4 w-4 animate-bounce text-slate-950" /> 🔔 ALERTE – RÉSULTATS D'ANALYSES DISPONIBLES
                  </span>
                  <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[8px]">DME Mis à jour</span>
                </div>
                
                <div className="p-4 space-y-2.5 text-xs text-slate-800 bg-white">
                  <div className="space-y-1 pb-2 border-b">
                    <p>Patient : <strong className="text-slate-950 uppercase font-bold">Fatoumata DIALLO (32 ans)</strong> | Consultée à 09:32</p>
                    <p>Examens exécutés : <span className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-bold font-mono">NFS + TDR Paludisme</span></p>
                    <p>Analysé par : <strong>Mariam Koné (Laborantin principale)</strong></p>
                    <p className="font-extrabold text-red-650 flex items-center gap-1.5 pt-0.5 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce text-red-600" />
                      ALERTE BIOLOGIQUE : TDR POSITIF (Plasmodium falciparum) !
                    </p>
                  </div>
                </div>
              </div>

              {/* Comprehensive EHR/DME Biological record viewer as specified in mockup */}
              <div className="border border-slate-205 rounded-3xl p-5 bg-white space-y-4 shadow-sm">
                <h4 className="font-black text-xs text-slate-800 font-mono uppercase tracking-wider border-b pb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4.5 w-4.5 text-indigo-700" />
                  📁 DME – FATOUMATA DIALLO – RÉSULTATS BIOLOGIQUES SCELLÉS
                </h4>

                {/* NFS Grid detail */}
                {selectedExams.nfs && (
                  <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-gray-150">
                    <span className="text-[9px] bg-sky-50 text-indigo-700 px-2 py-0.5 rounded font-extrabold font-mono uppercase tracking-wide">
                      🔬 NFS (Numération Formule Sanguine)
                    </span>
                    
                    <div className="border rounded-xl bg-white overflow-hidden">
                      <table className="w-full text-left text-[11px] leading-tight font-semibold">
                        <thead className="bg-slate-50 border-b text-slate-500 font-mono">
                          <tr>
                            <th className="p-2.5 font-bold">Paramètre biologique</th>
                            <th className="p-2.5 font-bold text-center">Valeur</th>
                            <th className="p-2.5 font-bold text-center">Norme attendue</th>
                            <th className="p-2.5 font-bold text-right">Interprétation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-900 font-bold">Hémoglobine</td>
                            <td className="p-2.5 text-center font-mono text-slate-850 font-extrabold">{results.nfsHb} g/dL</td>
                            <td className="p-2.5 text-center text-slate-550 font-normal">12,0 - 16,0 g/dL</td>
                            <td className="p-2.5 text-right"><span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9.5px]">✅ Normal</span></td>
                          </tr>
                          <tr className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-900 font-bold">Globules blancs (Leucocytes)</td>
                            <td className="p-2.5 text-center font-mono text-slate-850 font-extrabold">{Number(results.nfsGb).toLocaleString("fr-FR")} /mm³</td>
                            <td className="p-2.5 text-center text-slate-550 font-normal">4 000 - 10 000 /mm³</td>
                            <td className="p-2.5 text-right"><span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9.5px]">✅ Normal</span></td>
                          </tr>
                          <tr className="border-b last:border-0 hover:bg-slate-50/50">
                            <td className="p-2.5 text-slate-900 font-bold">Plaquettes sanguines</td>
                            <td className="p-2.5 text-center font-mono text-slate-850 font-extrabold">{Number(results.nfsPlat).toLocaleString("fr-FR")} /mm³</td>
                            <td className="p-2.5 text-center text-slate-550 font-normal">150 000 - 450 000 /mm³</td>
                            <td className="p-2.5 text-right"><span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9.5px]">✅ Normal</span></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TDR Paludisme Detail */}
                {selectedExams.tdr && (
                  <div className="space-y-2 bg-red-50/40 p-3.5 rounded-2xl border border-red-200">
                    <span className="text-[9px] bg-red-50 text-red-700 px-2 py-0.5 rounded font-extrabold font-mono uppercase tracking-wide">
                      🦟 TDR PALUDISME (Diagnostic rapide)
                    </span>
                    
                    <div className="bg-white border text-[11.5px] rounded-xl p-3 flex justify-between items-center font-semibold">
                      <div className="space-y-1">
                        <p className="text-slate-500 font-normal">Résultat d'analyse :</p>
                        <strong className="text-red-700 text-sm font-black tracking-wide uppercase flex items-center gap-1">
                          🔥 {results.tdrResult}
                        </strong>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-slate-550 font-normal">Identifié et qualifié :</p>
                        <strong className="text-rose-900 font-extrabold">Plasmodium falciparum</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Glycémie Detail */}
                {selectedExams.glycemie && (
                  <div className="space-y-2 bg-purple-50/40 p-3.5 rounded-2xl border border-purple-200">
                    <span className="text-[9px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-extrabold font-mono uppercase">
                      🍇 GLYCÉMIE À JEUN (Analyse ponctuelle)
                    </span>
                    
                    <div className="bg-white border rounded-xl p-3 flex justify-between items-center text-[11px] font-semibold">
                      <div className="space-y-0.5">
                        <p className="text-slate-500 font-normal">Concentration sanguine :</p>
                        <span className="font-mono text-slate-900 font-black">{results.glycemieVal} g/L</span>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 border px-2 py-0.5 rounded">
                        Normal (0,70 - 1,10 g/L)
                      </span>
                    </div>
                  </div>
                )}

                {/* Lab certification text */}
                <div className="border-t border-dashed border-slate-200 pt-3 text-[10px] text-slate-500 flex justify-between items-center font-mono">
                  <span>Signataire technique : <strong>Mariam Koné - Laborantin Certifié</strong></span>
                  <span>Hachage d'identification de l'acte : <strong className="text-indigo-805 ml-1">{results.signatureHash}</strong></span>
                </div>
              </div>

              {/* Physician action rows on results receipt */}
              <div className="flex flex-wrap gap-2 justify-end font-mono">
                <button 
                  onClick={() => showToast("📄 Rapport de laboratoire complet imprimé avec en-tête d'Urgence.")}
                  className="px-4 py-2 bg-white border border-gray-300 text-slate-800 font-extrabold text-[10px] uppercase rounded-xl hover:bg-slate-50"
                >
                  🖨 Imprimer le dossier
                </button>
                
                <button 
                  onClick={() => showToast("Treatment plan adjusted successfully: Artemether-Lumefantrine therapy started d'office.")}
                  className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-[10px] uppercase font-bold cursor-pointer"
                >
                  💊 Intégrer à l'ordonnance &amp; lancer traitement d'ACT
                </button>
              </div>

              <div className="flex justify-between items-center pt-2 border-t mt-4">
                <button
                  onClick={() => setStep(4)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-805 rounded-xl"
                >
                  ⬅ Retour
                </button>
                <button
                  onClick={() => {
                    playChime();
                    showToast("Simulateur basculé en vue de démonstration Caissier (Accès Bloqué).", "info");
                    setStep(6);
                  }}
                  className="bg-indigo-800 hover:bg-indigo-900 text-white font-mono uppercase text-[10px] font-black px-6 py-3 rounded-xl cursor-pointer shadow-md"
                >
                  🔐 Vérifier la restriction Caissier ➡️
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: VEROUILLEMENT CAISSIER */}
          {step === 6 && (
            <div className="space-y-5 animate-fade-in flex-grow">
              <div className="border-b pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase text-teal-600 font-mono">Étape 6 sur 6 – Audit de Confidentialité de Sécurité</span>
                  <h3 className="text-base font-black text-rose-700 flex items-center gap-1.5">
                    <Lock className="h-5 w-5 text-red-650" /> 
                    CONSOLE CAISSIER – RESTRACTIONS D'ACCÈS DU SECRET MÉDICAL
                  </h3>
                </div>
                <span className="bg-rose-50 text-red-700 border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">Sécurité 100% Sceau</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border italic leading-relaxed text-[11px] text-slate-650 leading-relaxed font-semibold">
                Simulons maintenant ce que visualise l'agent comptable de la caisse centrale (Aliou Diallo) s'il recherche le dossier patient de
                <strong className="text-slate-900 ml-1">Fatoumata Diallo</strong> pour éditer un reçu fiscaux historique de sa facture :
              </div>

              {/* Restricted layout simulated precisely from prompt */}
              <div className="border-2 border-red-200 rounded-3xl p-6.5 bg-white space-y-4 shadow-sm relative">
                
                {/* Red warning header */}
                <div className="p-3 bg-red-50 border border-red-200 text-rose-950 font-bold rounded-2xl flex items-start gap-2.5 text-[10.5px] leading-relaxed">
                  <ShieldAlert className="h-5 w-5 text-red-605 shrink-0" />
                  <div>
                    <strong>🔒 CONFIDENTIALITÉ DES DONNÉES CLINIQUES APPLIQUÉE :</strong>
                    <p className="font-medium mt-0.5 text-rose-900 leading-snug">
                      Ce poste de travail financier est exclus d'accréditation clinique. Les données biologiques, diagnostics, résultats NFS et TDR 
                      ont été chiffrés asynchronement au niveau HIS central.
                    </p>
                  </div>
                </div>

                {/* Safe layout */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold leading-tight text-slate-700 border-b pb-3 pt-2">
                  <div>Facture N° : <span className="font-mono text-teal-700 font-extrabold text-indigo-700">FAC-2026-0158</span></div>
                  <div className="text-right">Date de règlement : <span className="font-mono">13/06/2026 – 09:35</span></div>
                  <div>Montant perçu : <strong className="font-mono text-teal-800">{calculateTotal().toLocaleString("fr-FR")} FCFA</strong></div>
                  <div className="text-right">Statut de la transaction : <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border font-mono">✅ PAYÉ</span></div>
                </div>

                <div className="space-y-2">
                  <span className="text-[8.5px] text-gray-400 font-mono block uppercase">Prestations payées acquittées :</span>
                  <div className="space-y-1.5 text-xs text-slate-650 font-semibold font-sans">
                    <p>✔ Consultation médicale (Visite en Clinique)</p>
                    {selectedExams.nfs && <p>✔ NFS - Numération Formule Sanguine (Demande d'analyse)</p>}
                    {selectedExams.tdr && <p>✔ TDR Paludisme (Demande d'analyse rapide)</p>}
                    {selectedExams.glycemie && <p>✔ Glycémie de routine (Demande d'analyse rapide)</p>}
                  </div>
                </div>

                {/* Mock access denied button */}
                <div className="pt-4 border-t border-dashed">
                  <button
                    onClick={() => {
                      playChime();
                      showToast("❌ ACCÈS REFUSÉ : Le caissier n'est pas habilité à visualiser les résultats d'analyses biologiques !", "error");
                    }}
                    className="w-full py-3 border-2 border-dashed border-red-300 hover:bg-rose-50 text-red-700 rounded-2xl flex items-center justify-center gap-2 font-mono uppercase text-[10px] font-black cursor-pointer transition-all"
                  >
                    <Lock className="h-4 w-4 text-red-600 animate-pulse animate-duration-1000" />
                    🔓 TENTER DE CHARGER LES RÉSULTATS D'ANALYSES (AUDIT DE DROIT)
                  </button>
                </div>

                {/* Locked info box */}
                <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between font-mono text-[9px] text-slate-400">
                  <span>Accréditation Caisse : <strong>Niveau 1 (Finances seulement)</strong></span>
                  <span>IP Logged: <strong className="text-gray-600">192.168.1.120</strong></span>
                </div>
              </div>

              {/* Recapitulative matrix of rights table as requested by the user */}
              <div className="bg-white border rounded-2xl p-4.5 space-y-3">
                <h4 className="font-black text-xs text-slate-800 font-mono uppercase tracking-wider">🎯 RÉCAPITULATIF DES DROITS D'ACCÈS DANS MÉDISAHEL V2</h4>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-semibold border-collapse">
                    <thead className="bg-slate-50 border-b text-slate-550 font-mono">
                      <tr>
                        <th className="p-2 border-r font-bold">Information / Objet</th>
                        <th className="p-2 border-r font-bold text-center text-indigo-700">Médecin</th>
                        <th className="p-2 border-r font-bold text-center text-teal-800">Laborantin</th>
                        <th className="p-2 font-bold text-center text-rose-700">Caissier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      <tr>
                        <td className="p-2 border-r font-bold text-slate-900">Demande d'analyse</td>
                        <td className="p-2 border-r text-center text-emerald-800 font-serif">✅ Crée</td>
                        <td className="p-2 border-r text-center text-emerald-800">✅ Reçoit &amp; Saisit</td>
                        <td className="p-2 text-center text-rose-650 font-normal">❌ Interdit</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r font-bold text-slate-900">Facture / Paiement</td>
                        <td className="p-2 border-r text-center text-rose-650 font-normal">❌ Lecture seule</td>
                        <td className="p-2 border-r text-center text-rose-650 font-normal">❌ Lecture seule</td>
                        <td className="p-2 text-center text-emerald-800">✅ Édite &amp; Encaisse d'office</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r font-bold text-slate-900">Résultats biologiques</td>
                        <td className="p-2 border-r text-center text-emerald-800 font-serif">✅ Reçoit &amp; Archives</td>
                        <td className="p-2 border-r text-center text-emerald-800">✅ Saisit &amp; Signe</td>
                        <td className="p-2 text-center text-rose-750 font-extrabold bg-rose-50/50">🔒 INTERDIT DE DROIT SECRETS</td>
                      </tr>
                      <tr>
                        <td className="p-2 border-r font-bold text-slate-900">DME Complet du patient</td>
                        <td className="p-2 border-r text-center text-emerald-800 font-serif">✅ Consultation totale</td>
                        <td className="p-2 border-r text-center text-rose-650 font-normal">❌ Sauf analyses</td>
                        <td className="p-2 text-center text-rose-650 font-normal">❌ Masqué</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* End of scenario actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setStep(5)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
                >
                  ⬅ Retour
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStep(1);
                      setSelectedExams({ nfs: true, tdr: true, glycemie: false });
                      setPaymentValidated(false);
                      setActiveLabAction("pending");
                      showToast("🧬 Scénario d'analyses réinitialisé pour une nouvelle démo du circuit !", "info");
                    }}
                    className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white rounded-xl uppercase font-mono tracking-wider font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    🔄 Recommencer le Scénario d'Analyses
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Telemetry and logs (1/3 col) */}
        <div className="space-y-5 lg:col-span-1 leading-relaxed text-slate-800">
          
          {/* visual workflow summary of routing */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-3.5 shadow-xs">
            <h4 className="font-black text-xs text-slate-800 border-b pb-2 tracking-wide uppercase font-mono">Processus de Flux Labo d'office</h4>
            
            <div className="bg-slate-900 text-teal-400 font-mono text-[10px] p-4 rounded-xl space-y-3.5 leading-tight">
              <div>
                <p className="text-yellow-400 font-black">1. Médecin (Ibrahim Touré)</p>
                <p className="text-[9px] text-gray-400 font-sans">Prescrit @nfs et @tdr. Crée demande d'analyse (Statut : PENDING_PAYMENT).</p>
                <p className="pl-4">▼</p>
              </div>

              <div>
                <p className="text-yellow-400 font-black">2. Caissier (Aliou Diallo)</p>
                <p className="text-[9px] text-gray-400 font-sans">Encaisse les frais (Orange Money). Débloque les analyses au labo. Accès résultats bloqué d'office.</p>
                <p className="pl-4">▼</p>
              </div>

              <div>
                <p className="text-yellow-400 font-black">3. Laborantin (Mariam Koné)</p>
                <p className="text-[9px] text-gray-400 font-sans">Réalise, saisit et signe électroniquement les résultats (MK-13062025-0945).</p>
                <p className="pl-4">▼</p>
              </div>

              <div>
                <p className="text-yellow-400 font-black">4. Système MédiSahel</p>
                <p className="text-[9px] text-gray-400 font-sans">Transmet exclusivement au Médecin, archives dans le DME et maintient verrou caissier.</p>
                <p className="pl-4">▼</p>
              </div>

              <div>
                <p className="text-teal-300 font-black">5. Médecin (Alerte &amp; Consultation)</p>
                <p className="text-[9px] text-gray-400 font-sans">Reçoit le TDR Positif en exclusivité et consulte le rapport biologique dans le DME.</p>
              </div>
            </div>
          </div>

          {/* Guidelines info */}
          <div className="bg-white p-5 rounded-2xl border border-gray-150 space-y-3 shadow-xs">
            <h4 className="font-extrabold text-slate-800 text-xs border-b pb-2 tracking-wider uppercase font-mono">RGPD &amp; Confidentialité Clinique</h4>
            <div className="space-y-3 text-[11px] font-semibold text-slate-705">
              <div className="flex gap-2.5 items-start">
                <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg font-bold">✓</div>
                <div>
                  <strong className="text-slate-900 block font-black">Secret professionnel médical</strong>
                  Le caissier n'est habilité que pour les libellés administratifs comptables requis pour son audit de caisse.
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="bg-emerald-50 text-emerald-800 p-1.5 rounded-lg font-bold">✓</div>
                <div>
                  <strong className="text-slate-905 block font-black">Signature cryptée infalsifiable</strong>
                  La signature électronique garantit l'origine et l'intégrité biologique de la NFS et du TDR. Parfaitement conforme en cas d'audit.
                </div>
              </div>
            </div>
          </div>

          {/* Simulated system audit trail */}
          <div className="bg-slate-900 text-slate-205 p-4.5 rounded-2xl border space-y-3">
            <h4 className="font-black text-[10px] text-amber-500 uppercase font-mono tracking-wider">📜 LOGS DE TRANSACTIONS SYSTÈME HIST</h4>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 text-[9.5px] font-mono text-gray-400">
              <p className="text-cyan-400">▶ [AUDIT_ENG] Starting Lab interop simulation</p>
              {selectedExams.nfs && <p className="text-slate-400">▶ [SYS] Registered pending NFS prescription for P2026-0123</p>}
              {selectedExams.tdr && <p className="text-slate-400">▶ [SYS] Registered pending TDR prescription for P2026-0123</p>}
              {step >= 2 && <p className="text-amber-400">▶ [BILL] Invoice FAC-2026-0158 routed with status PENDING_PAYMENT</p>}
              {step >= 3 && <p className="text-emerald-400">▶ [BILL] Payment received: status modified to PAID. Laboratory unlocked.</p>}
              {activeLabAction === "signed" && <p className="text-teal-400">▶ [LAB] Electronic visa MK-13062025-0945 applied on NFS &amp; TDR.</p>}
              {step >= 4 && <p className="text-indigo-400">▶ [ROUTING] Access rights filtered. Result strictly encrypted for Cashier credentials.</p>}
              {step >= 5 && <p className="text-emerald-500 font-bold">▶ [EHR] DME of Fatoumata Diallo dynamically appended with biologic values.</p>}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
