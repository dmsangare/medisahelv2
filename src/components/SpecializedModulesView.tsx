import { useState, FormEvent } from "react";
import { 
  LabTest, 
  MedicalImage, 
  StockItem, 
  StaffPresence, 
  MailRecord, 
  TriageRecord,
  Patient
} from "../types";
import { 
  FlaskConical, 
  FileImage, 
  Archive, 
  Users, 
  Clipboard, 
  PlusCircle, 
  Calendar, 
  AlertTriangle, 
  Check, 
  Clock 
} from "lucide-react";

interface SpecializedModulesViewProps {
  labTests: LabTest[];
  images: MedicalImage[];
  stocks: StockItem[];
  presences: StaffPresence[];
  mails: MailRecord[];
  triages: TriageRecord[];
  patients: Patient[];
  onValidateLab: (labId: string, result: string) => void;
  onDispenseMed: (medId: string, qty: number) => void;
  onAddTriage: (newTriage: Omit<TriageRecord, "id" | "statut" | "heureArrivee">) => void;
  onClockIn: (staffName: string, role: string) => void;
  accentColor: string;
}

export default function SpecializedModulesView({
  labTests,
  images,
  stocks,
  presences,
  mails,
  triages,
  patients,
  onValidateLab,
  onDispenseMed,
  onAddTriage,
  onClockIn,
  accentColor
}: SpecializedModulesViewProps) {
  const [activeTab, setActiveTab] = useState<"lab" | "pharmacy" | "hr" | "triage">("triage");

  // Local form states for triage admission
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [couleur, setCouleur] = useState<TriageRecord["couleur"]>("Jaune");
  const [plaintePrincipale, setPlaintePrincipale] = useState("");
  const [temp, setTemp] = useState(37.5);
  const [frequence, setFrequence] = useState(80);
  const [ta, setTa] = useState("120/80");
  const [showTriageForm, setShowTriageForm] = useState(false);

  // Local stock dispenser selection
  const [selectedMedId, setSelectedMedId] = useState("");
  const [dispenseQty, setDispenseQty] = useState(1);

  // Lab results text
  const [labResults, setLabResults] = useState<Record<string, string>>({});

  const handleTriageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !plaintePrincipale) {
      alert("Patient et Plainte sont requis.");
      return;
    }

    const pat = patients.find(p => p.id === selectedPatientId);
    if (!pat) return;

    onAddTriage({
      patientId: selectedPatientId,
      patientNom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      couleur,
      plaintePrincipale,
      temperature: temp,
      frequenceCardiaque: frequence,
      tensionArterielle: ta
    });

    // Reset Form
    setSelectedPatientId("");
    setPlaintePrincipale("");
    setTemp(37.5);
    setFrequence(80);
    setTa("120/80");
    setShowTriageForm(false);
  };

  const handleDispense = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedMedId || dispenseQty <= 0) return;
    onDispenseMed(selectedMedId, dispenseQty);
    setSelectedMedId("");
    setDispenseQty(1);
    alert("Délivrance de médicament effectuée avec succès.");
  };

  return (
    <div className="space-y-6" id="specialized-modules-wrapper">
      {/* Category Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-205 flex items-center gap-1 overflow-x-auto text-xs font-semibold shadow-xs">
        <button
          onClick={() => setActiveTab("triage")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "triage" ? "text-white shadow-xs" : "text-slate-600 hover:text-slate-850"
          }`}
          style={activeTab === "triage" ? { backgroundColor: accentColor } : {}}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Urgences, Triage & Courriers (P3)</span>
        </button>

        <button
          onClick={() => setActiveTab("lab")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "lab" ? "text-white shadow-xs" : "text-slate-600 hover:text-slate-850"
          }`}
          style={activeTab === "lab" ? { backgroundColor: accentColor } : {}}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Biologie & Imagerie Radiologique (P1)</span>
        </button>

        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "pharmacy" ? "text-white shadow-xs" : "text-slate-600 hover:text-slate-855"
          }`}
          style={activeTab === "pharmacy" ? { backgroundColor: accentColor } : {}}
        >
          <Clipboard className="h-4 w-4" />
          <span>Pharmacie hospitalière & Stocks (P1)</span>
        </button>

        <button
          onClick={() => setActiveTab("hr")}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "hr" ? "text-white shadow-xs" : "text-slate-600 hover:text-slate-855"
          }`}
          style={activeTab === "hr" ? { backgroundColor: accentColor } : {}}
        >
          <Users className="h-4 w-4" />
          <span>Présences & Retards RH (P1)</span>
        </button>
      </div>

      {/* Main views */}
      {activeTab === "triage" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">File Attente Urgences & Triage</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Classification de triage obligatoire selon les couleurs : Rouge (Immédiat), Orange, Jaune, Vert</p>
                </div>
                <button
                  onClick={() => setShowTriageForm(!showTriageForm)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold p-1 px-3.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                >
                  <PlusCircle className="h-4 w-4 text-sky-600" />
                  <span>{showTriageForm ? "Fermer" : "Admettre"}</span>
                </button>
              </div>

              {showTriageForm && (
                <form onSubmit={handleTriageSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Sélectionner Patient Urgence</label>
                      <select
                        required
                        className="w-full text-xs rounded border border-slate-350 p-1.5 bg-white font-medium"
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                      >
                        <option value="">-- Choisissez le dossier --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} ({p.id})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Couleur d'Urgence</label>
                      <select
                        className="w-full text-xs rounded border border-slate-350 p-1.5 bg-white font-bold"
                        value={couleur}
                        onChange={(e) => setCouleur(e.target.value as TriageRecord["couleur"])}
                      >
                        <option value="Rouge" className="bg-red-100 text-red-800 font-bold">Rouge - Immédiat (Gravité extrême)</option>
                        <option value="Orange" className="bg-orange-100 text-orange-850 font-bold">Orange - Très urgent (Symptômes graves)</option>
                        <option value="Jaune" className="bg-yellow-150 text-yellow-900 font-bold">Jaune - Urgent (Stable mais souffrant)</option>
                        <option value="Vert" className="bg-green-100 text-green-800 font-bold">Vert - Non urgent (Consultation d'épreuve)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">Plainte principale constatée</label>
                      <input
                        type="text"
                        placeholder="ex: Convulsions répétées, détresse respiratoire aiguë"
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        value={plaintePrincipale}
                        onChange={(e) => setPlaintePrincipale(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">T° Constatée (°C)</label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-full text-xs rounded border border-slate-300 p-1"
                          value={temp}
                          onChange={(e) => setTemp(parseFloat(e.target.value) || 37.5)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Pouls (bpm)</label>
                        <input
                          type="number"
                          className="w-full text-xs rounded border border-slate-300 p-1"
                          value={frequence}
                          onChange={(e) => setFrequence(parseInt(e.target.value) || 80)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Tension (TA)</label>
                        <input
                          type="text"
                          className="w-full text-xs rounded border border-slate-300 p-1"
                          value={ta}
                          onChange={(e) => setTa(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded font-semibold cursor-pointer"
                    >
                      Enregistrer dans la file
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {triages.map(trg => {
                  const badgeStyle = 
                    trg.couleur === "Rouge" 
                      ? "bg-red-50 text-red-700 border-red-200" 
                      : trg.couleur === "Orange"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : trg.couleur === "Jaune"
                      ? "bg-yellow-50 text-yellow-800 border-yellow-250"
                      : "bg-green-50 text-green-700 border-green-200";

                  return (
                    <div key={tg_id(trg.id)} className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-xs transition-all">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badgeStyle}`}>
                            Urg: {trg.couleur}
                          </span>
                          <span className="text-slate-800 font-bold">{tg_opt(trg.patientNom)}</span>
                          <span className="text-[10px] font-mono text-slate-400">{trg.patientId}</span>
                        </div>
                        <p className="text-slate-600 font-medium font-mono">Plainte: <span className="font-sans text-slate-900 font-bold">{trg.plaintePrincipale}</span></p>
                        <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                          <span>Temp: <strong className="text-slate-700">{trg.temperature || 37.5}°C</strong></span>
                          <span>Pouls: <strong className="text-slate-700">{trg.frequenceCardiaque || 80} bpm</strong></span>
                          <span>TA: <strong className="text-slate-700">{trg.tensionArterielle || "120/80"}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {trg.heureArrivee}</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold text-[10px]">{trg.statut}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Courriers registry */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Archive className="h-4 w-4 text-sky-600" /> Gestion de Courriers & Documents
            </h3>

            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {mails.map(m => (
                <div key={m.id} className="p-3 bg-slate-50 border border-slate-205 rounded-lg text-xs space-y-1 tooltip-cursor">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                    <span>{m.numeroCourrier}</span>
                    <span className={m.type === "Entrant" ? "text-emerald-600" : "text-sky-600"}>{m.type}</span>
                  </div>
                  <h4 className="font-bold text-slate-800">{m.expediteurDestinataire}</h4>
                  <p className="text-[11px] text-slate-600 italic font-mono">{m.objet}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold pt-1">
                    <span>Affecté: {m.serviceAffecte}</span>
                    <span>{m.statutTraitement}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === "lab" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lab test validations */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FlaskConical className="h-4 w-4 text-sky-600" /> Validation Biologie Médicale (Laboratoire)
            </h3>

            <div className="space-y-3">
              {labTests.map(lt => {
                const isVal = lt.statut === "Validé";
                return (
                  <div key={lt.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-200/50 pb-1 text-slate-400 font-mono">
                      <span>Réf: #{lt.id} ({lt.typeExamen})</span>
                      <span className={isVal ? "text-emerald-600 font-bold" : "text-orange-600 font-bold animate-pulse"}>
                        {lt.statut}
                      </span>
                    </div>

                    <div className="flex justify-between transition-all">
                      <div>
                        <h4 className="font-bold text-slate-950 text-xs">{lt.patientNom}</h4>
                        <p className="text-[11px] text-slate-700 font-semibold">Examen: <strong className="text-sky-700 font-bold">{lt.nomAnalyse}</strong></p>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Demande: {lt.dateDemande}</span>
                    </div>

                    <div className="pt-2">
                      {isVal ? (
                        <div className="p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-150 font-mono text-[11px] flex items-center justify-between font-bold">
                          <span>Résultat: {lt.resultatObtenu}</span>
                          <span className="text-[9px] text-slate-400 font-normal">Validé: {lt.biologisteValidateur}</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ex: TDR Positif (GE 440/µl)"
                            id={`lab-res-${lt.id}`}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded outline-none"
                            value={labResults[lt.id] || ""}
                            onChange={(e) => setLabResults(p => ({ ...p, [lt.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => {
                              onValidateLab(lt.id, labResults[lt.id] || "Négatif (normal)");
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] px-3 py-1.5 rounded cursor-pointer transition-all"
                          >
                            Valider
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Imaging logs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileImage className="h-4 w-4 text-sky-600" /> Imagerie Médicale (DICOM & Radiologie)
            </h3>

            <div className="space-y-3">
              {images.map(img => (
                <div key={img.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>{img.typeImagerie} | Réf: {img.id}</span>
                    <span className={img.status === "Traité" ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                      {img.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900">{img.patientNom}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Prescrit par: {img.medecinPrescripteur}</span>
                  </div>

                  {img.compteRendu ? (
                    <p className="p-2 bg-white rounded border border-slate-200 text-[10px] italic text-slate-600 leading-relaxed font-semibold">
                      Compte rendu : {img.compteRendu}
                    </p>
                  ) : (
                    <div className="p-3.5 bg-slate-200/50 rounded text-center text-slate-400 font-semibold italic text-[11px] select-none border border-slate-250">
                      Radiologue requis (Cliché en attente de numérisation...)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === "pharmacy" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stocks display */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clipboard className="h-4 w-4 text-sky-600" /> Stock de Médicaments & Vigilance Pérémie
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] tracking-wider uppercase font-extrabold text-slate-400 border-b border-slate-150">
                  <tr>
                    <th className="px-4 py-2.5">Désignation</th>
                    <th className="px-4 py-2.5">Lot / Expiration</th>
                    <th className="px-4 py-2.5 text-center">Quantité Restante</th>
                    <th className="px-4 py-2.5 text-center">Statut Alerte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stocks.map(st => {
                    const isLow = st.quantite <= st.seuilAlerte;
                    const diffTime = new Date(st.datePeremption).getTime() - Date.now();
                    const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
                    const closeExpiry = daysLeft <= 45;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50 font-medium">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {st.designation}
                          <span className="text-[9px] text-slate-400 block font-normal font-mono">Fournisseur: {st.fournisseur}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          Lot: {st.numeroLot}
                          <span className={`block text-[9px] font-bold ${closeExpiry ? "text-red-650" : "text-slate-400"}`}>
                            Exp: {st.datePeremption} ({daysLeft} j. restants)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${isLow ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-900"}`}>
                            {st.quantite} un.
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isLow ? (
                            <span className="text-[10px] font-bold text-red-600 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded">Rupture</span>
                          ) : closeExpiry ? (
                            <span className="text-[10px] font-bold text-amber-600 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded uppercase">Périmé bientôt</span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-600">Sain</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Dispenser formulation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Clipboard className="h-4 w-4 text-sky-600" /> Délivrance rapide d'ordonnance
            </h3>

            <form onSubmit={handleDispense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1">Médicament à délivrer</label>
                <select
                  required
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-semibold"
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                >
                  <option value="">-- Choisissez le lot --</option>
                  {stocks.map(st => (
                    <option key={st.id} value={st.id}>{st.designation} (dispo: {st.quantite})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 mb-1">Quantité prescrite</label>
                <input
                  type="number"
                  min="1"
                  className="w-full text-xs p-2 rounded border border-slate-300 outline-none font-bold"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                />
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all hover:opacity-95 shadow-sm"
                style={{ backgroundColor: accentColor }}
              >
                Sortir & Enregistrer la sortie ordonnance
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-xl border border-slate-205 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Pointage des présences journalières</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Détection automatique des retards conformément à l'ouverture de service à 08h00</p>
            </div>
            {/* Quick point on the fly */}
            <button
              onClick={() => {
                onClockIn("Dr. Sangaré", "Médecin");
                alert("Médecin pointé @ " + new Date().toLocaleTimeString("fr-FR"));
              }}
              className="bg-slate-100 hover:bg-slate-200 text-[10px] font-extrabold text-slate-700 py-1 px-3 rounded uppercase transition-all cursor-pointer"
            >
              Signer Arrivée
            </button>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] tracking-wider uppercase font-extrabold text-slate-400 border-b border-slate-150">
                <tr>
                  <th className="px-5 py-2.5">Collaborateur</th>
                  <th className="px-5 py-2.5">Rôle</th>
                  <th className="px-5 py-2.5">Date Pointage</th>
                  <th className="px-5 py-2.5">Heure d'arrivée</th>
                  <th className="px-5 py-2.5 text-center font-bold">Statut Présence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {presences.map(p => {
                  const isRetard = p.statut === "Retard";
                  const isAbs = p.statut === "Absent";
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{p.nomPrenom}</td>
                      <td className="px-5 py-3 text-slate-500">{p.role}</td>
                      <td className="px-5 py-3 text-slate-400">{p.date}</td>
                      <td className="px-5 py-3 font-mono">{p.heureArrivee}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold ${
                          isAbs 
                            ? "bg-red-50 text-red-700 border-red-200" 
                            : isRetard 
                            ? "bg-amber-50 text-amber-700 border-amber-250" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          {p.statut}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function tg_id(idString: string): string {
  return idString;
}

function tg_opt(val: string | undefined): string {
  return val || "Patient inconnu";
}
