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
  onAddLabTest: (newTest: any) => void;
  onAddMedicalImage: (newImage: any) => void;
  onProcessMedicalImage: (imageId: string, compteRendu: string) => void;
  onDispenseMed: (medId: string, qty: number) => void;
  onRegisterStockItem?: (item: StockItem) => void;
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
  onAddLabTest,
  onAddMedicalImage,
  onProcessMedicalImage,
  onDispenseMed,
  onRegisterStockItem,
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
  const [selectedPatientNom, setSelectedPatientNom] = useState("Amadou Diarra");

  // Local stock sorties history tracking
  const [sorties, setSorties] = useState<Array<{
    id: string;
    designation: string;
    lot: string;
    quantite: number;
    destinataire: string;
    date: string;
    statut: string;
  }>>(() => {
    const saved = localStorage.getItem("pharmacy_sorties");
    return saved ? JSON.parse(saved) : [
      { id: "S-101", designation: "Artemether-Lumefantrine 80/480mg (Coartem)", lot: "AL202601", quantite: 10, destinataire: "Patient Amadou Diarra (Ordonnance)", date: "2026-05-26 14:10", statut: "Délivré" },
      { id: "S-102", designation: "Gants Nitrile Non Stériles (Boîte de 100)", lot: "G202509", quantite: 1, destinataire: "Lab. Tangara (Usage Clinique)", date: "2026-05-26 11:32", statut: "Mis à disposition" }
    ];
  });

  // Local additions for newly inputted lots/stock items (pharmacy list expansion)
  const [customStocks, setCustomStocks] = useState<StockItem[]>(() => {
    const saved = localStorage.getItem("pharmacy_custom_stocks");
    return saved ? JSON.parse(saved) : [];
  });

  // Combined stock list
  const allStocks = [...stocks, ...customStocks];

  // Forms to append brand-new lot
  const [showAddLotForm, setShowAddLotForm] = useState(false);
  const [newLotDesignation, setNewLotDesignation] = useState("");
  const [newLotCategory, setNewLotCategory] = useState("Médicament");
  const [newLotQty, setNewLotQty] = useState(100);
  const [newLotSeuil, setNewLotSeuil] = useState(15);
  const [newLotCode, setNewLotCode] = useState("");
  const [newLotPeremption, setNewLotPeremption] = useState("2026-07-31");
  const [newLotSupplier, setNewLotSupplier] = useState("Pharmacie Populaire du Mali (PPM)");

  // Inventory audit controller and mismatch records
  const [showInventoryAudit, setShowInventoryAudit] = useState(false);
  const [auditPhysicalAmounts, setAuditPhysicalAmounts] = useState<Record<string, number>>({});
  const [auditLogBook, setAuditLogBook] = useState<Array<any>>(() => {
    const saved = localStorage.getItem("pharmacy_audit_logs");
    return saved ? JSON.parse(saved) : [];
  });

  // Lab results text
  const [labResults, setLabResults] = useState<Record<string, string>>({});

  // New States for Lab Test Requests
  const [showAddLabForm, setShowAddLabForm] = useState(false);
  const [labPatientId, setLabPatientId] = useState("");
  const [labTypeExamen, setLabTypeExamen] = useState<"Hématologie" | "Biochimie" | "Sérologie" | "Bactériologie" | "Parasitologie">("Biochimie");
  const [labNomAnalyse, setLabNomAnalyse] = useState("");
  const [labValeurReference, setLabValeurReference] = useState("");
  const [labAlertCritique, setLabAlertCritique] = useState(false);

  // New States for Imaging Requests
  const [showAddImageForm, setShowAddImageForm] = useState(false);
  const [imagePatientId, setImagePatientId] = useState("");
  const [imageType, setImageType] = useState<"Radiologie" | "Scanner" | "IRM" | "Échographie">("Radiologie");
  const [imagePrescripteur, setImagePrescripteur] = useState("");
  
  // Managing Radio reports/compte-rendu
  const [activeImageId, setActiveImageId] = useState("");
  const [compteRenduText, setCompteRenduText] = useState("");

  const handleLabRequestSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!labPatientId || !labNomAnalyse) {
      alert("Veuillez sélectionner un patient et saisir le nom de l'analyse.");
      return;
    }

    const pat = patients.find(p => p.id === labPatientId);
    if (!pat) return;

    onAddLabTest({
      patientId: labPatientId,
      patientNom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      typeExamen: labTypeExamen,
      nomAnalyse: labNomAnalyse,
      valeurReference: labValeurReference || "Norme standard clinique",
      alertCritique: labAlertCritique
    });

    // Reset Form
    setLabPatientId("");
    setLabNomAnalyse("");
    setLabValeurReference("");
    setLabAlertCritique(false);
    setShowAddLabForm(false);
    alert("La demande d'analyse de biologie a été enregistrée avec succès.");
  };

  const handleImageRequestSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!imagePatientId || !imagePrescripteur) {
      alert("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    const pat = patients.find(p => p.id === imagePatientId);
    if (!pat) return;

    onAddMedicalImage({
      patientId: imagePatientId,
      patientNom: `${pat.nom.toUpperCase()} ${pat.prenom}`,
      typeImagerie: imageType,
      medecinPrescripteur: imagePrescripteur
    });

    // Reset Form
    setImagePatientId("");
    setImagePrescripteur("");
    setShowAddImageForm(false);
    alert("La prescription d'imagerie clinique a été enregistrée avec succès.");
  };

  const handleReportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeImageId || !compteRenduText) return;

    onProcessMedicalImage(activeImageId, compteRenduText);
    setActiveImageId("");
    setCompteRenduText("");
    alert("Le compte-rendu radiologique a été signé et rattaché au dossier d'imagerie.");
  };

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

    const matchedItem = allStocks.find(st => st.id === selectedMedId);
    if (!matchedItem) return;

    if (matchedItem.quantite < dispenseQty) {
      alert(`Impossible d'enregistrer la délivrance de ce lot : quantité restante en stock insuffisante (${matchedItem.quantite} un. dispo).`);
      return;
    }

    // Deduct quantity
    const isCustom = customStocks.some(st => st.id === selectedMedId);
    if (isCustom) {
      const updated = customStocks.map(st => {
        if (st.id === selectedMedId) {
          return { ...st, quantite: Math.max(0, st.quantite - dispenseQty) };
        }
        return st;
      });
      setCustomStocks(updated);
      localStorage.setItem("pharmacy_custom_stocks", JSON.stringify(updated));
    } else {
      onDispenseMed(selectedMedId, dispenseQty);
    }

    // Log the salida/sortie
    const newSortie = {
      id: `S-${Date.now().toString().slice(-4)}`,
      designation: matchedItem.designation,
      lot: matchedItem.numeroLot,
      quantite: dispenseQty,
      destinataire: selectedPatientNom.startsWith("Patient") ? selectedPatientNom : `Patient(e) ${selectedPatientNom} (Ordonnance)`,
      date: new Date().toISOString().replace("T", " ").slice(0, 16),
      statut: "Délivré"
    };

    const updatedSorties = [newSortie, ...sorties];
    setSorties(updatedSorties);
    localStorage.setItem("pharmacy_sorties", JSON.stringify(updatedSorties));

    setSelectedMedId("");
    setDispenseQty(1);
    alert(`Délivrance de ${dispenseQty} un. de ${matchedItem.designation} enregistrée avec succès.`);
  };

  const handleAddNewLot = (e: FormEvent) => {
    e.preventDefault();
    if (!newLotDesignation || !newLotCode || newLotQty < 0) {
      alert("Tous les champs sont requis pour initialiser un lot.");
      return;
    }

    const newItem: StockItem = {
      id: `ST-CUST-${Date.now().toString().slice(-4)}`,
      designation: newLotDesignation,
      categorie: newLotCategory,
      quantite: newLotQty,
      seuilAlerte: newLotSeuil,
      numeroLot: newLotCode,
      datePeremption: newLotPeremption,
      fournisseur: newLotSupplier
    };

    const updated = [newItem, ...customStocks];
    setCustomStocks(updated);
    localStorage.setItem("pharmacy_custom_stocks", JSON.stringify(updated));

    if (onRegisterStockItem) {
      onRegisterStockItem(newItem);
    }

    // Reset Form
    setNewLotDesignation("");
    setNewLotQty(100);
    setNewLotSeuil(15);
    setNewLotCode("");
    setShowAddLotForm(false);
    alert("Nouveau lot médical enregistré et ajouté au stock d'inventaire hospitalier.");
  };

  const handlePostAuditReport = () => {
    // Audit differences log calculation
    const reportRows = allStocks.map(st => {
      const phys = auditPhysicalAmounts[st.id] !== undefined ? auditPhysicalAmounts[st.id] : st.quantite;
      const difference = phys - st.quantite;
      return {
        id: st.id,
        designation: st.designation,
        lot: st.numeroLot,
        physique: phys,
        theorique: st.quantite,
        difference
      };
    });

    const hasMismatches = reportRows.some(r => r.difference !== 0);

    const newAuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR"),
      totalItems: allStocks.length,
      statut: hasMismatches ? "Incohérence Détectée" : "Inventaire Conforme",
      rows: reportRows
    };

    const updatedLogs = [newAuditLog, ...auditLogBook];
    setAuditLogBook(updatedLogs);
    localStorage.setItem("pharmacy_audit_logs", JSON.stringify(updatedLogs));

    alert(hasMismatches 
      ? "L'audit d'inventaire s'est terminé avec des écarts physiques. Les détails ont été enregistrés dans le grand livre de pharmacovigilance."
      : "Inventaire 100% conforme ! Tout le stock physique correspond exactement au registre informatisé clinique."
    );
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
          <span>Biologie (Laboratoire)</span>
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
          {/* Lab test validations & Creation */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FlaskConical className="h-4 w-4 text-sky-600" /> Validation Biologie Médicale (Laboratoire)
              </h3>
              <button
                type="button"
                onClick={() => setShowAddLabForm(!showAddLabForm)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10.5px] font-bold p-1 px-2 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <PlusCircle className="h-3.5 w-3.5 text-sky-655" />
                <span>{showAddLabForm ? "Fermer" : "Prescrire Analyse"}</span>
              </button>
            </div>

            {showAddLabForm && (
              <form onSubmit={handleLabRequestSubmit} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Nouvelle Demande d'Analyse (Biologique)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Patient</label>
                    <select
                      required
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-medium"
                      value={labPatientId}
                      onChange={(e) => setLabPatientId(e.target.value)}
                    >
                      <option value="">-- Choisissez le patient --</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.nom.toUpperCase()} {p.prenom} ({p.id})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Catégorie d'Examen</label>
                    <select
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-medium"
                      value={labTypeExamen}
                      onChange={(e) => setLabTypeExamen(e.target.value as any)}
                    >
                      <option value="Hématologie">Hématologie (NFS, etc.)</option>
                      <option value="Biochimie">Biochimie (Glycémie, Créat, etc.)</option>
                      <option value="Sérologie">Sérologie (VIH, Widal, etc.)</option>
                      <option value="Bactériologie">Bactériologie (ECBU, etc.)</option>
                      <option value="Parasitologie">Parasitologie (GE, etc.)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Nom Précis de l'Analyse</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Glycémie à jeun, Cholestérol total"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-semibold"
                      value={labNomAnalyse}
                      onChange={(e) => setLabNomAnalyse(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Valeur de Référence Attendue</label>
                    <input
                      type="text"
                      placeholder="ex: 0.70 - 1.10 g/L"
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      value={labValeurReference}
                      onChange={(e) => setLabValeurReference(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lab-urgent"
                    className="rounded text-sky-650 h-4 w-4 cursor-pointer"
                    checked={labAlertCritique}
                    onChange={(e) => setLabAlertCritique(e.target.checked)}
                  />
                  <label htmlFor="lab-urgent" className="text-[10px] font-bold text-rose-700 cursor-pointer">
                    ⚠️ Marquer cette analyse comme URGENTE (Prioritaire)
                  </label>
                </div>

                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3.5 rounded transition-all cursor-pointer shadow-xs"
                >
                  Envoyer au Laborantin
                </button>
              </form>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {labTests.map(lt => {
                const isVal = lt.statut === "Validé";
                return (
                  <div key={lt.id} className="p-3.5 bg-slate-50 border border-slate-205 rounded-lg text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] border-b border-slate-200/50 pb-1 text-slate-400 font-mono">
                      <span>Réf: #{lt.id} ({lt.typeExamen})</span>
                      <span className={isVal ? "text-emerald-600 font-bold" : lt.statut === "Urgent" || lt.alertCritique ? "text-rose-600 font-extrabold animate-pulse font-sans flex items-center gap-1 bg-rose-50 px-1.5 py-0.2 rounded" : "text-amber-600 font-bold animate-pulse"}>
                        {lt.statut} {lt.alertCritique && "(URGENT)"}
                      </span>
                    </div>

                    <div className="flex justify-between transition-all">
                      <div>
                        <h4 className="font-bold text-slate-950 text-xs">{lt.patientNom}</h4>
                        <p className="text-[11px] text-slate-755 font-semibold">Examen requis : <strong className="text-sky-700 font-extrabold">{lt.nomAnalyse}</strong></p>
                        <span className="text-[10px] text-slate-450 font-medium font-mono">Norme: {lt.valeurReference || "Standard"}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">Prescrit: {lt.dateDemande}</span>
                    </div>

                    <div className="pt-2">
                      {isVal ? (
                        <div className="p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-150 font-mono text-[11px] flex items-center justify-between font-bold">
                          <span>Résultat: {lt.resultatObtenu}</span>
                          <span className="text-[9px] text-slate-400 font-normal">Saisi: {lt.biologisteValidateur}</span>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="ex: TDR Positif (GE 440/µl)"
                            id={`lab-res-${lt.id}`}
                            className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-300 rounded outline-none font-bold"
                            value={labResults[lt.id] || ""}
                            onChange={(e) => setLabResults(p => ({ ...p, [lt.id]: e.target.value }))}
                          />
                          <button
                            onClick={() => {
                              onValidateLab(lt.id, labResults[lt.id] || "Négatif (normal)");
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] px-3 py-1.5 rounded cursor-pointer transition-all"
                          >
                            Valider Résultat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Panel de référence biologique et d'alertes critiques */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Normes & Registres de Référence Biologique (Mali)</h4>
              <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono leading-tight">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="font-bold text-slate-700 block">🔬 NFS / Hémoglobine</span>
                  <p className="text-slate-500">H : 13.0 - 17.0 g/dL</p>
                  <p className="text-slate-500">F : 12.0 - 16.0 g/dL</p>
                  <span className="text-[9px] text-red-650 font-bold block">Critique : &lt; 7.0 (Anémie)</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="font-bold text-slate-700 block">🧪 Glycémie à jeun</span>
                  <p className="text-slate-500">Norme : 0.70 - 1.10 g/L</p>
                  <span className="text-[10px] text-amber-600 font-bold block">Hyper : &gt; 1.26 g/L</span>
                  <span className="text-[10px] text-red-600 font-bold block">Hypo : &lt; 0.60 g/L</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="font-bold text-slate-700 block">🦟 TDR / Goutte Épaisse</span>
                  <p className="text-slate-600 font-sans">Paludisme : <strong className="text-emerald-700">Négatif</strong></p>
                  <span className="text-[10px] text-red-650 font-bold block">Alerte : Positif (CTA requis)</span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <span className="font-bold text-slate-700 block">💧 Créatininémie</span>
                  <p className="text-slate-500">H : 7 - 13 mg/L</p>
                  <p className="text-slate-500">F : 5 - 11 mg/L</p>
                  <span className="text-[10px] text-red-700 font-bold block">Alerte : &gt; 15 mg/L (Insuff.)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Panel for Lab */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-3">Statistiques de Charge du Laboratoire</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase">Analyses en suspens</span>
                  <div className="text-2xl font-black text-indigo-900 mt-1">
                    {labTests.filter(lt => lt.statut !== "Validé").length}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-500 uppercase">Analyses signées</span>
                  <div className="text-2xl font-black text-emerald-900 mt-1">
                    {labTests.filter(lt => lt.statut === "Validé").length}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-250 text-slate-800 text-xs">
              <span className="font-bold block text-yellow-800 uppercase text-[10.5px] mb-1">📢 Vigilance Épidémiologique SNIS Mali</span>
              <p className="text-slate-600 font-medium">Tout résultat biologique positif pour le Paludisme, Choléra, Rougeole ou Fièvre Typhoïde fait obligatoirement l'objet d'un rapport automatique transmis à la direction régionale de la santé de Bamako.</p>
            </div>
          </div>
        </div>
      ) : activeTab === "pharmacy" ? (
        <div className="space-y-6">
          {/* Section Critical Alarm Center for PharmacoVigilance and Ruptures */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alarm 1: Expiration 30 days warning */}
            {allStocks.some(st => {
              const diff = new Date(st.datePeremption).getTime() - Date.now();
              return Math.ceil(diff / (1000 * 3600 * 24)) <= 45;
            }) ? (
              <div className="p-3 bg-red-50 border-l-4 border-l-red-650 rounded-r-xl text-red-950 text-xs">
                <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-red-800 mb-1">
                  ⚠️ ALERTE PÉREMPTION PROCHE (&lt;45j)
                </span>
                <p className="font-semibold text-[10.5px]">Des lots pour : <strong className="font-black text-red-900">{
                  allStocks.filter(st => {
                    const diff = new Date(st.datePeremption).getTime() - Date.now();
                    return Math.ceil(diff / (1000 * 3600 * 24)) <= 45;
                  }).map(st => st.designation.split("(")[0]).join(", ")
                }</strong> nécessitent une rotation urgente.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border-l-4 border-l-emerald-600 rounded-r-xl text-slate-700 text-xs">
                <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-emerald-800 mb-0.5">
                  ✅ STABILITÉ PÉREMPTION OK
                </span>
                <p className="text-[10px]">Aucun lot médical n'arrive à expiration d'ici les 45 prochains jours.</p>
              </div>
            )}

            {/* Alarm 2: Out of Stock Warnings */}
            {allStocks.some(st => st.quantite <= st.seuilAlerte) ? (
              <div className="p-3 bg-amber-50 border-l-4 border-l-amber-600 rounded-r-xl text-amber-950 text-xs">
                <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-amber-800 mb-1">
                  🚨 COFFRE-FORT EN ALERTE SEUIL
                </span>
                <p className="font-semibold text-[10.5px]">Seuils critiques atteints pour : <strong className="font-black text-amber-900">{
                  allStocks.filter(st => st.quantite <= st.seuilAlerte).map(st => st.designation.split("(")[0]).join(", ")
                }</strong>. Réapprovisionnement de guichet requis.</p>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border-l-4 border-l-emerald-650 rounded-r-xl text-slate-700 text-xs">
                <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-emerald-800 mb-0.5">
                  ✅ VOLUMÉTRIE DES SEUILS OK
                </span>
                <p className="text-[10px]">Toutes les références physiques dépassent largement le seuil de basculement.</p>
              </div>
            )}

            {/* Alarm 3: Critical medicines monitor */}
            <div className="p-3 bg-pink-50 border-l-4 border-l-pink-600 rounded-r-xl text-pink-950 text-xs">
              <span className="font-extrabold uppercase tracking-wide flex items-center gap-1.5 text-pink-800 mb-1">
                🏥 VIGILANCE PRODUITS CRITIQUES
              </span>
              <p className="text-[10.5px] font-semibold leading-relaxed">
                Adrénaline, Coartem (CTA), Gants, TDR Malaria. Statut :{" "}
                {allStocks.some(st => (st.designation.includes("Coartem") || st.designation.includes("TDR") || st.designation.includes("Paracétamol Injectable")) && st.quantite < 25) ? (
                  <strong className="text-red-700 font-extrabold">Flux d'urgence tendu (Contrôler PPM)</strong>
                ) : (
                  <strong className="text-emerald-700 font-extrabold">Niveaux de sécurité de garde sains</strong>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500">
              Pilotez la chaîne d'approvisionnement des officines hospitalières cliniques.
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowInventoryAudit(!showInventoryAudit);
                  // Seeds current quantities as physical defaults
                  const curr: Record<string, number> = {};
                  allStocks.forEach(st => {
                    curr[st.id] = st.quantite;
                  });
                  setAuditPhysicalAmounts(curr);
                }}
                className={`text-xs py-1.5 px-3 rounded font-bold transition-all cursor-pointer border ${
                  showInventoryAudit 
                    ? "bg-amber-600 text-white border-amber-700 hover:bg-amber-700" 
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                📊 {showInventoryAudit ? "Fermer l'audit d'inventaire" : "Lancer l'inventaire de contrôle"}
              </button>
              <button
                onClick={() => setShowAddLotForm(!showAddLotForm)}
                className="text-xs py-1.5 px-3.5 rounded text-white font-bold cursor-pointer transition-all bg-slate-800 hover:bg-slate-900"
              >
                📥 Enregistrer Nouveau Lot
              </button>
            </div>
          </div>

          {/* New Lot registration Form block */}
          {showAddLotForm && (
            <form onSubmit={handleAddNewLot} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs font-semibold">
              <div className="border-b pb-2">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-widest">Réception de Lots Commerciaux / Fournisseurs</h4>
                <p className="text-[10px] text-slate-400 font-medium">Saisissez les informations de traçabilité légale du bordereau avant l'intégration du lot.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Désignation du produit médical</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amoxicilline 500mg Gélule"
                    className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
                    value={newLotDesignation}
                    onChange={(e) => setNewLotDesignation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Catégorie</label>
                  <select
                    className="w-full text-xs p-2 rounded border border-slate-350 bg-white font-bold"
                    value={newLotCategory}
                    onChange={(e) => setNewLotCategory(e.target.value)}
                  >
                    <option value="Médicament">Médicament</option>
                    <option value="Consommable">Consommable</option>
                    <option value="Réactif">Réactif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Numéro de Lot PPM / Sanofi</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AMX2605"
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono font-bold"
                    value={newLotCode}
                    onChange={(e) => setNewLotCode(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Quantité Initiale Reçue</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono font-bold"
                    value={newLotQty}
                    onChange={(e) => setNewLotQty(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Seuil minimal d'alerte</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono"
                    value={newLotSeuil}
                    onChange={(e) => setNewLotSeuil(parseInt(e.target.value) || 15)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Date péremption légale</label>
                  <input
                    type="date"
                    className="w-full text-xs p-2 rounded border border-slate-300 font-mono font-bold"
                    value={newLotPeremption}
                    onChange={(e) => setNewLotPeremption(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Fournisseur / Distributeur agréé</label>
                  <input
                    type="text"
                    placeholder="Ex: France-Mali Pharma, PPM"
                    className="w-full text-xs p-2 rounded border border-slate-300"
                    value={newLotSupplier}
                    onChange={(e) => setNewLotSupplier(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLotForm(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white font-bold rounded cursor-pointer bg-emerald-600 hover:bg-emerald-700"
                >
                  Valider l'intégration du lot
                </button>
              </div>
            </form>
          )}

          {/* Interactive Inventory Audit mode */}
          {showInventoryAudit && (
            <div className="bg-slate-800 text-white p-5 rounded-xl border border-slate-700 space-y-4 text-xs">
              <div className="border-b border-slate-700 pb-2.5 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-xs uppercase text-amber-400 tracking-wider">Feuille de Contrôle d'Inventaire en Partie Double</h4>
                  <p className="text-[10px] text-slate-450 mt-0.5">Saisissez les quantités physiquement comptées dans les tiroirs. Le système générera le rapport d'écarts.</p>
                </div>
                <button
                  onClick={() => {
                    const printWind = window.open("", "_blank");
                    if (!printWind) return;
                    printWind.document.write(`
                      <html>
                        <head>
                          <title>Fiche d'Inventaire Physique de Pharmacie : ${new Date().toLocaleDateString("fr-FR")}</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
                            th { background: #f1f5f9; }
                          </style>
                        </head>
                        <body onload="window.print()">
                          <h2>CLINIQUE MÉDISAHEL BAMAKO - OFFICIINE CENTRAL</h2>
                          <h3>FICHE DE RECOMPTAGE PHYSIQUE - INVENTAIRE JOURNALIER</h3>
                          <p>Généré le: <strong>${new Date().toLocaleDateString("fr-FR")}</strong> par l'équipe de garde</p>
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Désignation & Lot</th>
                                <th>Fournisseur</th>
                                <th>Théorique système</th>
                                <th>Physique compté (Case à remplir)</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${allStocks.map(st => `
                                <tr>
                                  <td>${st.id}</td>
                                  <td><strong>${st.designation}</strong><br/>Lot: ${st.numeroLot}</td>
                                  <td>${st.fournisseur}</td>
                                  <td>${st.quantite} un.</td>
                                  <td>[             ] un.</td>
                                </tr>
                              `).join("")}
                            </tbody>
                          </table>
                          <div style="margin-top: 50px;">Signature Pharmacien Responsable: ____________________</div>
                        </body>
                      </html>
                    `);
                    printWind.document.close();
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-100 font-extrabold text-[10.5px] px-2.5 py-1.5 rounded"
                >
                  🖨️ Fiche Imprimable Vierge
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {allStocks.map(st => {
                  const theory = st.quantite;
                  const physicalValue = auditPhysicalAmounts[st.id] !== undefined ? auditPhysicalAmounts[st.id] : theory;
                  const difference = physicalValue - theory;

                  return (
                    <div key={st.id} className="p-3 bg-slate-900 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-750 font-mono text-[11px]">
                      <div>
                        <strong className="text-white text-[12px] font-sans font-extrabold">{st.designation}</strong>
                        <span className="text-[10px] text-slate-400 block">ID: {st.id} | Lot: {st.numeroLot} | PPM</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-slate-450 block text-[9px]/tight text-right uppercase">Théorique</span>
                          <strong className="text-sky-305 text-[12px]">{theory} un.</strong>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[9.5px]/tight uppercase">Physique récolté</span>
                          <input
                            type="number"
                            className="bg-slate-805 text-white w-20 p-1 text-xs border border-slate-700 rounded font-bold text-center pl-2 font-mono"
                            value={physicalValue}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setAuditPhysicalAmounts(prev => ({ ...prev, [st.id]: val }));
                            }}
                          />
                        </div>

                        <div className="text-right w-24">
                          <span className="text-slate-450 block text-[9px]/tight text-right uppercase">Variation</span>
                          {difference === 0 ? (
                            <span className="text-emerald-500 font-bold font-sans">0 Écart</span>
                          ) : difference > 0 ? (
                            <span className="text-cyan-405 font-bold">+{difference} Excès</span>
                          ) : (
                            <span className="text-red-405 font-bold">{difference} Déficit</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={handlePostAuditReport}
                  className="bg-amber-500 hover:bg-amber-600 font-extrabold py-2 px-4 rounded text-slate-950 font-sans"
                >
                  💾 Signer et Soumettre le Rapport d'Inventaire
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Core stocks table */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Clipboard className="h-4 w-4 text-indigo-650" /> Réseau logistique des produits
              </h3>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] tracking-wider uppercase font-extrabold text-slate-400 border-b border-slate-150">
                    <tr>
                      <th className="px-4 py-2.5">Produit & Fournisseur</th>
                      <th className="px-4 py-2.5">Numéro Lot & Péremption</th>
                      <th className="px-4 py-2.5 text-center">Stock Actuel</th>
                      <th className="px-4 py-2.5 text-center">Grand livre</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allStocks.map(st => {
                      const isLow = st.quantite <= st.seuilAlerte;
                      const diffTime = new Date(st.datePeremption).getTime() - Date.now();
                      const daysLeft = Math.ceil(diffTime / (1000 * 3600 * 24));
                      const closeExpiry = daysLeft <= 45;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50 font-medium">
                          <td className="px-4 py-3 font-bold text-slate-900">
                            {st.designation}
                            <span className="text-[9.5px] text-slate-400 block font-normal font-mono">
                              Fournisseur: {st.fournisseur || "N/D"} • Catégorie: {st.categorie}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap">
                            Lot: <strong className="text-slate-700 font-bold text-xs">{st.numeroLot}</strong>
                            <span className={`block text-[9.5px]/tight font-bold ${closeExpiry ? "text-red-650 font-extrabold underline decoration-wavy" : "text-slate-400"}`}>
                              Exp: {st.datePeremption} ({daysLeft} j. restants)
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${isLow ? "bg-red-50 text-red-700 border border-red-200" : "bg-slate-50 text-slate-900"}`}>
                              {st.quantite} un.
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isLow ? (
                              <span className="text-[10px] font-bold text-red-600 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded">Rupture</span>
                            ) : closeExpiry ? (
                              <span className="text-[10px] text-amber-600 px-1.5 py-0.5 bg-amber-50 border border-amber-205 rounded font-bold uppercase">Bientôt Périmé</span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600">Conforme</span>
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
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Clipboard className="h-4 w-4 text-sky-650" /> Sortir Ordonnance Médicale
                </h3>

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-semibold">
                  Toute sortie décrémente directement le lot concerné et documente la pharmacovigilance clinique du patient de référence.
                </p>

                <form onSubmit={handleDispense} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-500 mb-1">Cible Patient / Ordonnance</label>
                    <input
                      type="text"
                      required
                      placeholder="Nom complet du patient ou Réf"
                      className="w-full text-xs p-2.5 rounded border border-slate-300 font-bold bg-white outline-none"
                      value={selectedPatientNom}
                      onChange={(e) => setSelectedPatientNom(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-505 mb-1">Médicament à déduire</label>
                    <select
                      required
                      className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white font-semibold outline-none"
                      value={selectedMedId}
                      onChange={(e) => setSelectedMedId(e.target.value)}
                    >
                      <option value="">-- Sélectionnez le lot --</option>
                      {allStocks.map(st => (
                        <option key={st.id} value={st.id}>{st.designation} (Lot: {st.numeroLot} || Dispo: {st.quantite})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-505 mb-1">Quantité dispensée</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full text-xs p-2 rounded border border-slate-305 outline-none font-bold"
                      value={dispenseQty}
                      onChange={(e) => setDispenseQty(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-all hover:bg-opacity-95 shadow-sm"
                    style={{ backgroundColor: accentColor }}
                  >
                    Valider la Sortie de Stock
                  </button>
                </form>
              </div>

              {/* Inventories historic files logbook list */}
              {auditLogBook.length > 0 && (
                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 space-y-2.5 text-[10.5px] font-mono leading-relaxed">
                  <span className="font-bold text-slate-400 text-[9.5px] block uppercase">Inventaires de Contrôle validés:</span>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {auditLogBook.map((lg: any) => (
                      <div key={lg.id} className="p-2 bg-slate-800 border border-slate-700 rounded space-y-1">
                        <div className="flex justify-between font-bold text-amber-400 text-[10px]">
                          <span>{lg.id} ({lg.statut})</span>
                          <span>{lg.date.split(" ")[0]}</span>
                        </div>
                        <p className="text-slate-400">Total items scannés: {lg.totalItems}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sub-block Historique Sorties */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b pb-2">
              Historique des Sorties de Stock de Pharmacie & Officines
            </h4>
            <div className="overflow-x-auto text-[11px] font-medium text-slate-700">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] tracking-wider uppercase font-bold text-slate-400 border-b">
                  <tr>
                    <th className="px-4 py-2">ID Sortie</th>
                    <th className="px-4 py-2">Désignation</th>
                    <th className="px-4 py-2 font-mono">N° de Lot</th>
                    <th className="px-4 py-2 text-center">Quantité</th>
                    <th className="px-4 py-2">Patient / Affectation</th>
                    <th className="px-4 py-2">Horodatage de sortie</th>
                    <th className="px-4 py-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorties.map(srt => (
                    <tr key={srt.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">{srt.id}</td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{srt.designation}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{srt.lot}</td>
                      <td className="px-4 py-3 text-center text-slate-900 font-bold">{srt.quantite} un.</td>
                      <td className="px-4 py-3 font-sans italic">{srt.destinataire}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{srt.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-[9px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-105">
                          {srt.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
