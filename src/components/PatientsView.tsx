import { useState, FormEvent, useEffect } from "react";
import QRCode from "qrcode";
import { Patient, UserRole } from "../types";
import { PlusCircle, Search, User, Clipboard, Phone, Shield, ArrowRight, CheckCircle2, Camera, QrCode, Printer, Archive, RotateCcw, Heart } from "lucide-react";

const ETHNIES = [
  "Bambara", "Peulh", "Soninké", "Malinké", "Sonrhaï", "Dogon", "Minianka", "Sénoufo", "Bozo", "Touareg", "Bobo (Bwa)", "Kassonké", "Maure", "Arabe", "Somono", "Jakhanké", "Samogho"
];

interface PatientsViewProps {
  patients: Patient[];
  onAddPatient: (newPatient: Omit<Patient, "id" | "createdAt">) => void;
  accentColor: string;
  activeRole?: UserRole;
  selectedPatientId?: string;
}

export default function PatientsView({ patients, onAddPatient, accentColor, activeRole, selectedPatientId }: PatientsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedPatientId) {
      setSearchTerm(selectedPatientId);
      const found = patients.find(p => p.id === selectedPatientId);
      if (found) {
        setActivePreviewPatient(found);
        // generate qr
        QRCode.toDataURL(`ID:${found.id}|NOM:${found.nom.toUpperCase()}|TEL:${found.telephone}`)
          .then(url => setPreviewQrUrl(url))
          .catch(err => console.error("Error generating QR:", err));
      }
    }
  }, [selectedPatientId, patients]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"actifs" | "archives">("actifs");
  const [activePreviewPatient, setActivePreviewPatient] = useState<Patient | null>(null);
  const [previewQrUrl, setPreviewQrUrl] = useState<string>("");

  // Form states
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [sexe, setSexe] = useState<"M" | "F">("M");
  const [dateNaissance, setDateNaissance] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");
  const [profession, setProfession] = useState("");
  const [groupeSanguin, setGroupeSanguin] = useState<Patient["groupeSanguin"]>("O+");
  const [allergies, setAllergies] = useState("");
  const [assurance, setAssurance] = useState("Aucune");

  // New specifications Module 1
  const [nationalite, setNationalite] = useState("Malienne");
  const [lieuNaissance, setLieuNaissance] = useState("");
  const [ethnie, setEthnie] = useState("Bambara");
  const [antecedents, setAntecedents] = useState("");

  // Emergency contact & Webcam Simulation additions
  const [contactUrgenceNom, setContactUrgenceNom] = useState("");
  const [contactUrgenceTel, setContactUrgenceTel] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [isCapturing, setIsCapturing] = useState(false);

  // Badge Print Card Modal state
  const [activeBadgePatient, setActiveBadgePatient] = useState<Patient | null>(null);

  const [message, setMessage] = useState<string | null>(null);

  // Archive and unarchive arrays simulated locally
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

  const handleTriggerWebcam = () => {
    setIsCapturing(true);
    setTimeout(() => {
      // Set simulated portrait photo
      setPhotoUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60");
      setIsCapturing(false);
    }, 1200);
  };

  const handleToggleArchive = (pId: string) => {
    if (archivedIds.includes(pId)) {
      setArchivedIds(prev => prev.filter(id => id !== pId));
      alert("Dossier patient désarchivé.");
    } else {
      setArchivedIds(prev => [...prev, pId]);
      alert("Dossier patient archivé pour conformité RGPD locale.");
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!nom || !prenom || !dateNaissance) {
      alert("Le Nom, Prénom, et la Date de naissance sont requis.");
      return;
    }

    onAddPatient({
      nom,
      prenom,
      sexe,
      dateNaissance,
      telephone,
      adresse,
      profession,
      groupeSanguin,
      allergies,
      assurance,
      contactUrgenceNom,
      contactUrgenceTel,
      photoUrl,
      nationalite,
      lieuNaissance,
      ethnie,
      antecedents
    });

    // Reset Form
    setNom("");
    setPrenom("");
    setSexe("M");
    setDateNaissance("");
    setTelephone("");
    setAdresse("");
    setProfession("");
    setGroupeSanguin("O+");
    setAllergies("");
    setAssurance("Aucune");
    setContactUrgenceNom("");
    setContactUrgenceTel("");
    setPhotoUrl(undefined);
    setNationalite("Malienne");
    setLieuNaissance("");
    setEthnie("Bambara");
    setAntecedents("");

    setMessage("Dossier patient initialisé et enregistré avec succès.");
    setTimeout(() => {
      setMessage(null);
      setShowAddForm(false);
    }, 2000);
  };

  const currentList = patients.filter(p => {
    const isArch = archivedIds.includes(p.id);
    if (activeTab === "actifs" && isArch) return false;
    if (activeTab === "archives" && !isArch) return false;
    return true;
  });

  const filteredPatients = currentList.filter(
    p =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.telephone.includes(searchTerm)
  );

  const handlePrintCard = async (patient: Patient) => {
    try {
      const qrText = `MEDISHAHEL-ID:${patient.id}\nNOM:${patient.nom.toUpperCase()}\nPRENOM:${patient.prenom}\nSANG:${patient.groupeSanguin}\nURG:${patient.contactUrgenceTel || "N/A"}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 100 });

      const cardWindow = window.open("", "_blank");
      if (!cardWindow) {
        alert("Action impossible : Les fenêtres contextuelles (popups) sont bloquées par votre navigateur. Veuillez autoriser les popups ou utiliser l'Aperçu Direct.");
        return;
      }

      const html = `
        <html>
          <head>
            <title>Carte Patient Unique- ${patient.nom}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; font-family: sans-serif; background: #ffffff; }
              .badge-box { width: 350px; height: 220px; background: white; border-radius: 12px; border: 1.5px solid #cbd5e1; padding: 15px; position: relative; box-sizing: border-box; }
              .header { border-bottom: 2px solid ${accentColor}; padding-bottom: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
              .header h3 { margin: 0; font-size: 13px; color: ${accentColor}; font-weight: 800; }
              .header span { font-size: 9px; color: #64748b; font-family: monospace; }
              .details { display: flex; gap: 10px; }
              .avatar { width: 62px; height: 62px; border-radius: 8px; border: 1px solid #cbd5e1; background: #f1f5f9; display: flex; justify-content: center; align-items: center; font-size: 20px; color: #475569; font-weight: bold; overflow: hidden; }
              .avatar img { width: 100%; height: 100%; object-fit: cover; }
              .fields { flex: 1; font-size: 10px; line-height: 1.4; color: #334155; }
              .bold { font-weight: 700; color: #0f172a; }
              .qr-placeholder { position: absolute; bottom: 12px; right: 12px; width: 65px; height: 65px; border: 1px solid #cbd5e1; display: flex; justify-content: center; align-items: center; background: white; }
              .qr-placeholder img { width: 100%; height: 100%; }
              .emergency { font-size: 8.5px; color: red; margin-top: 4px; font-weight: bold; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            <div class="badge-box">
              <div class="header">
                <h3>MÉDISHAHEL CLINIQUE - MALI</h3>
                <span>N° Dossier: ${patient.id}</span>
              </div>
              <div class="details">
                <div class="avatar">
                  ${patient.photoUrl ? `<img src="${patient.photoUrl}" />` : patient.nom.charAt(0) + patient.prenom.charAt(0)}
                </div>
                <div class="fields">
                  <span class="bold">Nom:</span> ${patient.nom.toUpperCase()} ${patient.prenom}<br/>
                  <span class="bold">Né(e) le:</span> ${patient.dateNaissance} (${patient.sexe}) à ${patient.lieuNaissance || "S/D"}<br/>
                  <span class="bold">Nationalité:</span> ${patient.nationalite || "Malienne"} • <span class="bold">Ethnie:</span> ${patient.ethnie || "Bambara"}<br/>
                  <span class="bold">Groupe Sanguin:</span> <span style="color:red; font-weight:bold;">${patient.groupeSanguin}</span><br/>
                  <span class="bold">Allergies:</span> <span style="font-weight:bold;">${patient.allergies || "Aucune"}</span><br/>
                  <div class="emergency">
                    URGENCE: ${patient.contactUrgenceNom || "Non défini"} (${patient.contactUrgenceTel || "-"})
                  </div>
                </div>
              </div>
              <div class="qr-placeholder">
                <img src="${qrDataUrl}" alt="QR" />
              </div>
            </div>
          </body>
        </html>
      `;
      cardWindow.document.write(html);
      cardWindow.document.close();
    } catch (err) {
      console.error("Error during card printing: ", err);
    }
  };

  const handleShowCardPreview = async (patient: Patient) => {
    try {
      const qrText = `MEDISHAHEL-ID:${patient.id}\nNOM:${patient.nom.toUpperCase()}\nPRENOM:${patient.prenom}\nSANG:${patient.groupeSanguin}\nURG:${patient.contactUrgenceTel || "N/A"}`;
      const qrDataUrl = await QRCode.toDataURL(qrText, { margin: 1, width: 120 });
      setPreviewQrUrl(qrDataUrl);
      setActivePreviewPatient(patient);
    } catch (err) {
      console.error("Error during barcode generation: ", err);
    }
  };

  return (
    <div className="space-y-6" id="patients-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            <Clipboard className="h-5 w-5 text-sky-650" /> Registre Unique des Patientèles
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">Admission, gestion administrative, contacts de sécurité et archivage légal.</p>
        </div>
        
        {activeRole !== "Aide-soignant" && (
          <div className="flex gap-2 self-start sm:self-center">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all hover:opacity-95"
              style={{ backgroundColor: accentColor }}
            >
              <PlusCircle className="h-4 w-4" />
              <span>{showAddForm ? "Retour au registre" : "Nouveau Dossier Patient"}</span>
            </button>
          </div>
        )}
      </div>

      {!showAddForm && (
        <div className="flex bg-slate-100 p-1.5 rounded-lg text-xs font-semibold w-fit">
          <button
            onClick={() => setActiveTab("actifs")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "actifs" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Dossiers Actifs ({patients.filter(p => !archivedIds.includes(p.id)).length})
          </button>
          <button
            onClick={() => setActiveTab("archives")}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
              activeTab === "archives" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500"
            }`}
          >
            Archives / Purges ({patients.filter(p => archivedIds.includes(p.id)).length})
          </button>
        </div>
      )}

      {showAddForm ? (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Création du Dossier Patientèle</h3>
              <p className="text-[10px] text-slate-400">Renseignez scrupuleusement l'identité légale et médicale pour le triage et l'hospitalisation</p>
            </div>

            {/* Simulated Live Webcam Capture block (for photography) */}
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-16 bg-slate-50 border border-slate-250 rounded-lg overflow-hidden flex items-center justify-center relative shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Camera className="h-6 w-6 text-slate-400" />
                )}
                {isCapturing && <span className="absolute inset-0 bg-black/40 text-white font-mono text-[8px] flex items-center justify-center">Capture...</span>}
              </div>
              <button
                type="button"
                onClick={handleTriggerWebcam}
                className="text-[9.5px] text-[#0284c7] hover:underline font-bold"
              >
                Activer Webcam
              </button>
            </div>
          </div>

          {message && (
            <div className="bg-green-50 text-green-800 text-xs p-3 rounded-lg border border-green-250 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom du patient <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Prénom(s) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Sexe administratif</label>
              <select
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none text-slate-800 font-semibold"
                value={sexe}
                onChange={(e) => setSexe(e.target.value as "M" | "F")}
              >
                <option value="M">Masculin (M)</option>
                <option value="F">Féminin (F)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Date de naissance <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-bold text-slate-800"
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Numéro Téléphone</label>
              <input
                type="text"
                placeholder="ex: +223 76 54 32 10"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Profession</label>
              <input
                type="text"
                placeholder="ex: Enseignant, Agriculteur"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
              />
            </div>

            {/* Emergency Contacts fields */}
            <div>
              <label className="block text-[11px] font-bold text-red-600 mb-1">Contact d'Urgence (Nom)</label>
              <input
                type="text"
                placeholder="ex: Traoré Amadou (Frère)"
                className="w-full text-xs rounded-lg border border-red-200 px-3 py-2 outline-none"
                value={contactUrgenceNom}
                onChange={(e) => setContactUrgenceNom(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-red-600 mb-1">Contact de Sécurité (Tél)</label>
              <input
                type="text"
                placeholder="ex: +223 66 12 34 56"
                className="w-full text-xs rounded-lg border border-red-200 px-3 py-2 outline-none"
                value={contactUrgenceTel}
                onChange={(e) => setContactUrgenceTel(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Groupe Sanguin</label>
              <select
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none font-semibold text-slate-800"
                value={groupeSanguin}
                onChange={(e) => setGroupeSanguin(e.target.value as Patient["groupeSanguin"])}
              >
                <option value="O+">O_Positive (O+)</option>
                <option value="O-">O_Negative (O-)</option>
                <option value="A+">A_Positive (A+)</option>
                <option value="A-">A_Negative (A-)</option>
                <option value="B+">B_Positive (B+)</option>
                <option value="B-">B_Negative (B-)</option>
                <option value="AB+">AB_Positive (AB+)</option>
                <option value="AB-">AB_Negative (AB-)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Allergies médicamenteuses majeures</label>
              <input
                type="text"
                placeholder="ex: Néomycine, Pénicilline, Aspirine (Laissez vide si aucune)"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Couverture d'Assurance / Mutuelle</label>
              <select
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-semibold"
                value={assurance}
                onChange={(e) => setAssurance(e.target.value)}
              >
                <option value="Aucune">Aucune (100% à charge patient)</option>
                <option value="CANAM (70%)">AMO / CANAM (70%)</option>
                <option value="INPS (80%)">INPS (80%)</option>
                <option value="MFA (50%)">Mutuelle MFA (50%)</option>
                <option value="Sogavie (90%)">Sogavie Compagnie (90%)</option>
              </select>
            </div>

            {/* Advanced Specification fields under Module 1 */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nationalité</label>
              <input
                type="text"
                placeholder="Ex: Malienne"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                value={nationalite}
                onChange={(e) => setNationalite(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Lieu de Naissance</label>
              <input
                type="text"
                placeholder="Ex: Bamako, Kayes"
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
                value={lieuNaissance}
                onChange={(e) => setLieuNaissance(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Origine Ethnie</label>
              <select
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-semibold text-slate-800 bg-white"
                value={ethnie}
                onChange={(e) => setEthnie(e.target.value)}
              >
                {ETHNIES.map((eth) => (
                  <option key={eth} value={eth}>
                    {eth}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Antécédents médicaux majeurs (Pathologies, Chirurgies, Traitements permanents)</label>
              <textarea
                placeholder="Saisissez ici l'historique de santé du patient, ses antécédents familiaux ou cliniques notables..."
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none h-16 resize-none focus:border-sky-500"
                value={antecedents}
                onChange={(e) => setAntecedents(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-semibold rounded-lg cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-semibold rounded-lg cursor-pointer hover:opacity-90"
              style={{ backgroundColor: accentColor }}
            >
              Créer le dossier clinique
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Lookup search bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par numéro patient unique (MS-2026-X), nom, prénom ou téléphone..."
              className="flex-1 text-xs outline-none bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2">
                Effacer
              </button>
            )}
          </div>

          {/* List display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((p) => {
              const hasArc = archivedIds.includes(p.id);

              return (
                <div 
                  key={p.id} 
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-sky-300 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Top patient identification card */}
                    <div className="flex items-start justify-between border-b border-dashed border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        {p.photoUrl ? (
                          <img src={p.photoUrl} className="h-10 w-10 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 font-extrabold flex items-center justify-center border border-slate-200 uppercase text-sm">
                            {p.nom.charAt(0)}{p.prenom.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{p.nom.toUpperCase()} {p.prenom}</h4>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{p.id}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-extrabold ${p.sexe === "F" ? "bg-rose-50 text-rose-750" : "bg-sky-50 text-sky-750"}`}>
                          Sexe: {p.sexe}
                        </span>
                        <span className="text-[8px] text-slate-400 mt-1">Agréé {activeRole === "Réceptionniste" ? "🔒 [Masqué]" : p.groupeSanguin}</span>
                      </div>
                    </div>

                    {/* Body indicators */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-605 font-medium leading-relaxed">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{p.telephone || "Pas de numéro"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{p.profession || "Non renseignée"}</span>
                      </div>

                      {/* New specification fields Module 1 */}
                      <div className="col-span-2 text-[10.5px] bg-slate-50/70 p-1.5 px-2 rounded-lg border border-slate-100 space-y-1">
                        <div>
                          <span className="text-slate-400">Origine:</span> <span className="font-bold text-slate-700">{p.nationalite || "Malienne"}</span>
                          {p.lieuNaissance && <> • <span className="text-slate-400">Né(e) à:</span> <span className="font-bold text-slate-700">{p.lieuNaissance}</span></>}
                        </div>
                        <div>
                          <span className="text-slate-400">Ethnie:</span> <span className="font-extrabold text-[#0284c7] bg-sky-50 px-1.5 py-0.5 border border-sky-100 rounded text-[10px]">{p.ethnie || "Bambara"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 col-span-2">
                        <Clipboard className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{p.adresse || "Bamako"}</span>
                      </div>

                      {/* Display Emergency contacts list */}
                      {(p.contactUrgenceNom || p.contactUrgenceTel) && (
                        <div className="text-[9.5px] text-red-700 bg-red-50/20 p-1 px-2 border border-red-150/20 rounded col-span-2">
                          Urgence: <strong>{p.contactUrgenceNom || "Parent"}</strong> - {p.contactUrgenceTel}
                        </div>
                      )}
                    </div>

                    {/* Antecedents displaying if present */}
                    {p.antecedents && (
                      <div className="bg-amber-50/40 text-amber-900 p-2 rounded text-[10px] font-medium border border-amber-200/50 flex gap-1.5 leading-normal">
                        <Heart className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <strong className="block text-[10px] text-amber-800 font-extrabold">Antécédents médicaux :</strong>
                          <span className="text-slate-600 font-semibold">{activeRole === "Réceptionniste" ? "🔒 [Donnée médicale confidentielle masquée]" : p.antecedents}</span>
                        </div>
                      </div>
                    )}

                    {/* Red alert allergen warning warnings if applicable */}
                    {activeRole === "Réceptionniste" ? (
                      <div className="bg-amber-50 text-amber-900 p-2 rounded text-[10px] font-medium flex items-center gap-1.5 border border-amber-100">
                        <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="truncate font-bold">🔒 Données sensibilités médicales confidentielles masquées</span>
                      </div>
                    ) : p.allergies ? (
                      <div className="bg-red-50 text-red-800 p-2 rounded text-[10px] font-medium flex items-center gap-1.5 border border-red-100">
                        <Shield className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="truncate font-bold">Allergies: {p.allergies}</span>
                      </div>
                    ) : (
                      <div className="bg-green-50/50 text-green-700 p-2 rounded text-[10px] font-medium flex items-center gap-1.5 border border-green-150/30">
                        <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                        <span>Aucune allergie répertoriée</span>
                      </div>
                    )}
                  </div>

                  {/* Actions patient card generation and archiving */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                    <button
                      onClick={() => handleShowCardPreview(p)}
                      className="text-[#0284c7] hover:underline flex items-center gap-1 cursor-pointer"
                      style={{ color: accentColor }}
                    >
                      <QrCode className="h-4 w-4 text-sky-600" style={{ color: accentColor }} /> Carte Patient Badges
                    </button>

                    <button
                      onClick={() => handleToggleArchive(p.id)}
                      className="text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {hasArc ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                      <span>{hasArc ? "Désarchiver" : "Archiver"}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredPatients.length === 0 && (
              <div className="col-span-2 py-10 bg-white border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                Aucun patient trouvé correspondant à votre recherche.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Unique ID Card & QR Code Preview Modal */}
      {activePreviewPatient && (
        <div className="fixed inset-0 bg-slate-905/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in font-sans">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 relative space-y-4">
            <div className="flex items-center justify-between border-b pb-2.5">
              <h3 className="font-bold text-xs text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                <QrCode className="h-4 w-4 text-sky-600 animate-pulse" style={{ color: accentColor }} /> Carte d'Identification & QR Code
              </h3>
              <button
                onClick={() => setActivePreviewPatient(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 hover:bg-slate-200 p-1 px-2 rounded-lg transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Standard compliant physical card box mockup */}
            <div className="mx-auto border border-slate-300 bg-white rounded-xl p-3.5 shadow-sm relative select-none w-[320px] h-[195px] overflow-hidden">
              <div className="border-b-2 pb-1.5 mb-2 flex items-center justify-between" style={{ borderColor: accentColor }}>
                <h4 className="font-black text-[10px] uppercase tracking-wider" style={{ color: accentColor }}>MÉDISHAHEL CLINIQUE - MALI</h4>
                <span className="text-[8px] font-bold text-slate-400 font-mono">Dossier: {activePreviewPatient.id}</span>
              </div>

              <div className="flex gap-2">
                <div className="h-14 w-14 bg-slate-10 border border-slate-200 rounded-md flex items-center justify-center font-black text-slate-400 text-base overflow-hidden shrink-0">
                  {activePreviewPatient.photoUrl ? (
                    <img src={activePreviewPatient.photoUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    activePreviewPatient.nom.charAt(0) + activePreviewPatient.prenom.charAt(0)
                  )}
                </div>

                <div className="text-[9px] leading-tight text-slate-700 flex-1 space-y-0.5">
                  <div><span className="font-bold text-slate-900 font-mono">NOM:</span> {activePreviewPatient.nom.toUpperCase()} {activePreviewPatient.prenom}</div>
                  <div><span className="font-bold text-slate-900 font-mono">NÉ(E):</span> {activePreviewPatient.dateNaissance} ({activePreviewPatient.sexe})</div>
                  <div><span className="font-bold text-slate-905">NAT:</span> {activePreviewPatient.nationalite || "Malienne"} • {activePreviewPatient.ethnie || "Bambara"}</div>
                  <div><span className="font-bold text-slate-900 font-mono">SANG:</span> <span className="text-red-600 font-bold">{activePreviewPatient.groupeSanguin}</span></div>
                  <div><span className="font-bold text-slate-900 font-mono">ALLERGIES:</span> <span className="font-semibold text-rose-700">{activePreviewPatient.allergies || "Aucune"}</span></div>
                  {activePreviewPatient.contactUrgenceTel && (
                    <div className="text-[7.5px] text-red-650 font-bold bg-rose-50 p-0.5 px-1 rounded inline-block mt-0.5 leading-none">
                      SOS: {activePreviewPatient.contactUrgenceNom || "Parent"} • {activePreviewPatient.contactUrgenceTel}
                    </div>
                  )}
                </div>
              </div>

              {/* Encoded Offline QR Code placement */}
              <div className="absolute bottom-2.5 right-2.5 h-[58px] w-[58px] border border-slate-200 rounded bg-white p-0.5 flex items-center justify-center">
                {previewQrUrl ? (
                  <img src={previewQrUrl} alt="QR Code" className="h-full w-full select-none" />
                ) : (
                  <span className="text-[6px] text-slate-400 font-mono scale-90">Génération...</span>
                )}
              </div>
            </div>

            <p className="text-[9.5px] text-slate-400 text-center leading-relaxed">
              La puce QR Code chiffrée stocke les données d'identité clinique de secours pour une synchronisation simplifiée en cas de coupure réseau (Offline 48H).
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handlePrintCard(activePreviewPatient)}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                style={{ backgroundColor: accentColor }}
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Lancer l'impression</span>
              </button>
              <button
                onClick={() => setActivePreviewPatient(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold text-xs py-2 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
