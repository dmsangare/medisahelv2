import { useState, FormEvent } from "react";
import { MailRecord, Patient } from "../types";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";
import { 
  FolderOpen, 
  Search, 
  PlusCircle, 
  CheckCircle, 
  FileText, 
  CornerDownRight, 
  Printer, 
  Layers, 
  Filter, 
  RefreshCw,
  Clock,
  Briefcase,
  User,
  Tags,
  FileCheck,
  Shield,
  Download
} from "lucide-react";

interface GecdViewProps {
  mails: MailRecord[];
  patients?: Patient[];
  onAddMail: (data: Omit<MailRecord, "id" | "numeroCourrier"> & { patientId?: string; isConfidentiel?: boolean }) => void;
  accentColor: string;
  signatoryGecd?: string;
}

export default function GecdView({
  mails,
  patients = [],
  onAddMail,
  accentColor,
  signatoryGecd = "Dr. Adama Sangaré"
}: GecdViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"Tous" | "Entrant" | "Sortant" | "Médical" | "Administratif">("Tous");
  const [filterService, setFilterService] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterDate, setFilterDate] = useState("");

  // Form states
  const [type, setType] = useState<"Entrant" | "Sortant" | "Médical" | "Administratif">("Entrant");
  const [expediteurDestinataire, setExpediteurDestinataire] = useState("");
  const [objet, setObjet] = useState("");
  const [dateReceptionEnvoi, setDateReceptionEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [serviceAffecte, setServiceAffecte] = useState("Direction administrative");
  const [statutTraitement, setStatutTraitement] = useState<string>("En attente");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isConfidentiel, setIsConfidentiel] = useState(false);

  // Document Templates Composer States
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState("attestation");
  const [recipientName, setRecipientName] = useState("Moussa Traoré");
  const [customDetails, setCustomDetails] = useState("repos de 10 jours pour convalescence post-paludisme grave");
  const [composerOutput, setComposerOutput] = useState("");

  const letterTemplates = {
    attestation: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nSERVICES DES URGENCES & CLINIQUE GÉNÉRALE\n\nATTESTATION MÉDICALE DE REPOS CLINIQUE\nN° Ref: GECD-2026-ATT-09\n\nJe soussigné, ${signatoryGecd}, certifie après examen clinique approfondi de ce jour que l'état de santé de M./Mme ${name} nécessite impérativement un ${details}.\n\nEn foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\n${signatoryGecd}, Clinique Centrale`,
    conge: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nDIRECTION ADMINISTRATIVE ET DES RESSOURCES HUMAINES\n\nDEMANDE D'AUTORISATION SPÉCIALE D'ABSENCE\n\nJe sollicite par la présente, l'attribution d'un congé exceptionnel d'absence de garde pour M./Mme ${name}, agissant en qualité d'agent de santé, motivé par : ${details}.\n\nCette absence débutera le lendemain de la signature du présent acte pour une période convenue d'accord administratif.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\nLe Directeur Général MédiSahel`,
    aptitude: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nMEDECINE DU TRAVAIL ET DU SPORT\n\nCERTIFICAT MÉDICAL D'APTITUDE PHYSIQUE\n\nJe certifie avoir examiné ce jour M./Mme ${name}.\nL'examen somatique général ainsi que les constantes physiologiques révèlent une parfaite aptitude physique aux exigences professionnelles suivantes : ${details}.\n\nAucune contre-indication aux efforts physiques modérés n'a été décelée.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\n${signatoryGecd}`,
    bordereau: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nSECRETARIAT GENERAL & ARCHIVES\n\nBORDEREAU DE TRANSMISSION DE DOCUMENTS OFFICIELS\n\nÀ l'attention de: ${name}\nObjet: transmission de pièces administratives de santé\n\nPar le présent bordereau, nous vous transmettons pour attribution les pièces désignées ci-dessous:\n- ${details}\n\nAccusé de réception requis sous pli confidentiel officiel.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\nSecrétaire Général Administratif`
  };

  const getActiveText = () => {
    if (composerOutput) return composerOutput;
    const templateFn = letterTemplates[selectedLetterTemplate as keyof typeof letterTemplates];
    if (templateFn) {
      return templateFn(recipientName, customDetails);
    }
    return "";
  };

  const handleApplyTemplate = (key: string) => {
    setSelectedLetterTemplate(key);
    setComposerOutput(""); 
  };

  // Local state for updating status
  const [localMails, setLocalMails] = useState<Record<string, string>>({});

  const handleUpdateStatus = (mailId: string, newStat: string) => {
    setLocalMails(prev => ({
      ...prev,
      [mailId]: newStat
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!expediteurDestinataire || !objet) {
      alert("Tous les champs obligatoires doivent être renseignés.");
      return;
    }

    onAddMail({
      type,
      expediteurDestinataire,
      objet,
      dateReceptionEnvoi,
      serviceAffecte,
      statutTraitement: statutTraitement,
      patientId: selectedPatientId || undefined,
      isConfidentiel
    });

    setExpediteurDestinataire("");
    setObjet("");
    setSelectedPatientId("");
    setIsConfidentiel(false);
    setShowForm(false);
  };

  const filteredMails = mails.map(m => {
    const statusOverridden = localMails[m.id] || m.statutTraitement;
    return { ...m, statutTraitement: statusOverridden };
  }).filter(m => {
    // Text query
    const sMatch = searchQuery === "" || 
      m.numeroCourrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expediteurDestinataire.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.objet.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type/Category Tab
    const tMatch = activeSubTab === "Tous" || m.type === activeSubTab;

    // Service match
    const servMatch = filterService === "Tous" || m.serviceAffecte === filterService;

    // Status match
    const statMatch = filterStatus === "Tous" || m.statutTraitement === filterStatus;

    // Date match
    const dMatch = filterDate === "" || m.dateReceptionEnvoi.split("T")[0] === filterDate;

    return sMatch && tMatch && servMatch && statMatch && dMatch;
  });

  const handlePrintDocument = () => {
    const textToPrint = getActiveText();
    const pWind = window.open("", "_blank");
    if (!pWind) return;

    pWind.document.write(`
      <html>
        <head>
          <title>REGISTRE GECD - CERTIFICATION CLINIQUE MÉDISAHEL</title>
          <style>
            body { 
              font-family: 'Times New Roman', Times, serif; 
              padding: 50px; 
              color: #000; 
              max-width: 800px; 
              margin: auto; 
              line-height: 1.6;
            }
            .header-mali {
              text-align: center;
              font-weight: bold;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 25px;
            }
            .subtitle-mali {
              font-size: 11px;
              font-style: italic;
              text-transform: none;
              font-weight: normal;
            }
            .letterhead {
              display: flex;
              justify-content: space-between;
              border-bottom: 3px double #000;
              padding-bottom: 15px;
              margin-bottom: 30px;
            }
            .letterhead-left {
              font-weight: bold;
              font-size: 15px;
            }
            .letterhead-right {
              text-align: right;
              font-size: 12px;
            }
            .content-body {
              white-space: pre-wrap;
              font-size: 14.5px;
              text-align: justify;
              margin-bottom: 50px;
              min-height: 250px;
            }
            .signature-block {
              display: flex;
              justify-content: space-between;
              margin-top: 50px;
            }
            .seal-watermark {
              border: 1px solid #000;
              padding: 5px 12px;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              opacity: 0.85;
              display: inline-block;
            }
            .footer-notes {
              margin-top: 80px;
              text-align: center;
              font-size: 10px;
              color: #555;
              border-top: 1px dashed #bbb;
              padding-top: 10px;
            }
            @media print {
              body { padding: 30px; }
            }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header-mali">
            RÉPUBLIQUE DU MALI<br/>
            <span class="subtitle-mali">Un Peuple - Un But - Une Foi</span>
          </div>

          <div class="letterhead">
            <div class="letterhead-left">
              CLINIQUE MÉDISAHEL BAMAKO<br/>
              <span style="font-size: 11px; font-weight: normal; font-style: italic;">
                Quartier du Fleuve, Bamako - Mali<br/>
                Agrément Ministériel Officiel N°2026/GECD-MS
              </span>
            </div>
            <div class="letterhead-right font-mono">
              <strong>REGISTRE GECD OFFICIEL</strong><br/>
              Intégrité: Document Vérifié<br/>
              Date de certification: ${new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>

          <div class="content-body">${textToPrint}</div>

          <div class="signature-block">
            <div>
              <div class="seal-watermark">ARCHIVAGE NUMÉRIQUE SCELLÉ GECD</div>
            </div>
            <div style="text-align: center;">
              <strong>Le Praticien Inspecteur</strong><br/>
              <span style="font-size:11px; font-style:italic; color:#444;">Approuvé par Directeur Médical</span><br/><br/>
              <div style="font-weight: bold; margin-top: 15px; text-decoration: underline;">${signatoryGecd}</div>
            </div>
          </div>

          <div class="footer-notes">
            MédiSahel GECD platform - Document d'archive de santé certifié immuable, chiffré et conforme aux directives de la DNS (Mali).
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
  };

  return (
    <div className="space-y-6" id="gecd-view-wrapper">
      {/* Upper header block styled professionally */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="h-5 w-5" style={{ color: accentColor }} />
            <span>Gestion Électronique des Courriers & Documents (GECD)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Archivage unifié des documents médicaux, administratifs et de correspondances réglementaires. Classement sécurisé et certification de pièces.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer self-start transition-all hover:opacity-90 shadow-xs"
          style={{ backgroundColor: accentColor }}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Intégrer une pièce / Courrier</span>
        </button>
      </div>

      {/* Creation form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-sm text-xs font-semibold animate-fade-in">
          <div className="border-b pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <FileCheck className="h-4 w-4" style={{ color: accentColor }} />
              Dépôt et indexation d'une nouvelle pièce GECD
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Saisissez les méta-données d'archivage réglementaires. La référence séquentielle de dossier (ex: GECD-25-0104) sera scellée à jamais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Type de Document / Classement</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
              >
                <option value="Entrant">Courrier Entrant (Réception)</option>
                <option value="Sortant">Courrier Sortant (Expédition)</option>
                <option value="Médical">Document Clinique / Médical</option>
                <option value="Administratif">Certificat Administratif</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Routage de Service</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={serviceAffecte}
                onChange={(e) => setServiceAffecte(e.target.value)}
              >
                <option value="Direction administrative">Direction administrative</option>
                <option value="Comptabilité & Caisse">Comptabilité & Caisse</option>
                <option value="Laboratoire & Techniques">Laboratoire & Techniques</option>
                <option value="Maternité & CPN">Maternité & CPN</option>
                <option value="Garde Médicale">Garde Médicale</option>
                <option value="Ressources Humaines">Ressources Humaines</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Statut du dossier</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={statutTraitement}
                onChange={(e) => setStatutTraitement(e.target.value)}
              >
                <option value="En attente">En attente de pièces annexes</option>
                <option value="En cours">En cours de traitement</option>
                <option value="Traité">Traité et Classé</option>
                <option value="Archivé">Verrouillé aux archives</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Date légale</label>
              <input
                type="date"
                required
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none font-mono"
                value={dateReceptionEnvoi}
                onChange={(e) => setDateReceptionEnvoi(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">Émetteur / Destinateur (Correspondant GECD)</label>
              <input
                type="text"
                required
                placeholder="Ex: PPM, Ministère de la Santé Public, Secrétariat du Médecin Conseil"
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={expediteurDestinataire}
                onChange={(e) => setExpediteurDestinataire(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">Objet / Titre de la pièce</label>
              <input
                type="text"
                required
                placeholder="Ex: Rapport d'inspection sanitaire, Agrément clinique révisé"
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
              />
            </div>

            {/* Optional association to patient */}
            <div className="md:col-span-2 font-sans text-xs">
              <label className="block text-[11px] text-slate-500 mb-1">Patient Associé (Optionnel pour liaisons cliniques)</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-slate-50 focus:bg-white focus:border-sky-500 outline-none"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">Aucun patient (Document Institutionnel / Administratif)</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.nom} {p.prenom} ({p.id})</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center h-full pt-5 px-1 gap-2">
              <input
                type="checkbox"
                id="isConf"
                className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                checked={isConfidentiel}
                onChange={(e) => setIsConfidentiel(e.target.checked)}
              />
              <label htmlFor="isConf" className="text-[11px] text-slate-650 font-bold select-none cursor-pointer flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                Dossier hautement confidentiel (Restriction d'accès par rôle)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-bold rounded-xl cursor-pointer shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              Indexer avec Référence Scellée
            </button>
          </div>
        </form>
      )}

      {/* Advanced filters */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-slate-400" /> RECHERCHE AVANCÉE ET INDEX GECD
        </span>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Filtre textuel unifié</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-semibold">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Réf document, émetteur, mots de l'objet..."
                className="bg-transparent outline-none w-full text-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Routage cible</label>
            <select
              className="w-full text-xs p-2 border border-slate-300 bg-white font-bold rounded-xl"
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              <option value="Tous">Toutes les affectations</option>
              <option value="Direction administrative">Direction administrative</option>
              <option value="Comptabilité & Caisse">Comptabilité & Caisse</option>
              <option value="Laboratoire & Techniques font-sans">Laboratoire & Techniques</option>
              <option value="Maternité & CPN">Maternité & CPN</option>
              <option value="Garde Médicale">Garde Médicale</option>
              <option value="Ressources Humaines">Ressources Humaines</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">État d'instruction</label>
            <select
              className="w-full text-xs p-2 border border-slate-300 bg-white font-bold rounded-xl"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="En attente">En attente des pièces</option>
              <option value="En cours">En cours de traitement</option>
              <option value="Traité">Validé et Traité</option>
              <option value="Archivé">Verrouillé aux archives</option>
            </select>
          </div>

          <div>
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Date de dépôt</label>
            <input
              type="date"
              className="w-full text-xs p-2 border border-slate-300 bg-white font-mono font-bold rounded-xl"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
          <div className="flex gap-2 font-medium">
            {(["Tous", "Entrant", "Sortant", "Médical", "Administratif"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                  activeSubTab === tab ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-205"
                }`}
              >
                {tab === "Tous" && "Toutes les pièces"}
                {tab === "Entrant" && "📥 Courriers Entrants"}
                {tab === "Sortant" && "📤 Courriers Sortants"}
                {tab === "Médical" && "🩺 Dossiers & Certificats Médicaux"}
                {tab === "Administratif" && "📄 Actes Administratifs"}
              </button>
            ))}
          </div>

          {(searchQuery || filterService !== "Tous" || filterStatus !== "Tous" || filterDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterService("Tous");
                setFilterStatus("Tous");
                setFilterDate("");
              }}
              className="text-red-700 hover:underline flex items-center gap-1 font-black cursor-pointer text-[11px]"
            >
              <RefreshCw className="h-3.3 w-3.3 animate-spin" /> Réinstaller les index
            </button>
          )}
        </div>
      </div>

      {/* Main GECD panels grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registry panel (2/3 size) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 font-semibold text-xs text-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-2.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 flex-wrap">
                <Layers className="h-4 w-4 text-sky-650" />
                Registre d'Archivage Scellé ({filteredMails.length} documents répertoriés)
              </h3>
              <div className="flex gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const dataToExport = filteredMails.map(m => ({
                      num: m.numeroCourrier,
                      type: m.type,
                      expDest: m.expediteurDestinataire,
                      obj: m.objet,
                      service: m.serviceAffecte,
                      statut: m.statutTraitement,
                      date: m.dateReceptionEnvoi ? m.dateReceptionEnvoi.split("T")[0] : "",
                      conf: m.isConfidentiel ? "Oui" : "Non"
                    }));
                    exportToExcel(dataToExport, "ARCHIVES_GECD_COURRIERS", {
                      num: "Numéro de Courrier",
                      type: "Type d'Acte",
                      expDest: "Expéditeur / Destinataire",
                      obj: "Objet",
                      service: "Service Affecté",
                      statut: "Statut de Traitement",
                      date: "Date Général",
                      conf: "Confidentiel"
                    });
                  }}
                  className="inline-flex items-center px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                  title="Exporter l'index complet GECD en Excel"
                >
                  <Download className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                  Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportToPDF("gecd-scelled-registry-table", "Registre des Courriers & GECD Clinique")}
                  className="inline-flex items-center px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer"
                  title="Imprimer le registre"
                >
                  <Printer className="h-3.5 w-3.5 mr-1 text-indigo-650" />
                  Imprimer
                </button>
              </div>
            </div>

            {filteredMails.length === 0 ? (
              <div className="text-center py-14 space-y-2">
                <FolderOpen className="h-8 w-8 text-slate-350 mx-auto" />
                <p className="text-slate-400 font-sans italic mt-1.5">Aucune pièce ne correspond aux index d'archivage.</p>
                <p className="text-[10px] text-slate-400">Modifier les filtres supérieurs de correspondances.</p>
              </div>
            ) : (
              <div className="space-y-3" id="gecd-scelled-registry-table">
                {filteredMails.map((m) => {
                  const isEntrant = m.type === "Entrant";
                  const isMedical = m.type === "Médical";
                  const isSortant = m.type === "Sortant";
                  return (
                    <div 
                      key={m.id} 
                      className="p-4 bg-slate-50 hover:bg-slate-50/80 border border-slate-200 rounded-2xl relative transition-all"
                    >
                      <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono font-bold">
                          {m.dateReceptionEnvoi ? m.dateReceptionEnvoi.split("T")[0] : ""}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-bold ${
                            isEntrant ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                            isSortant ? "bg-sky-50 text-sky-800 border-sky-200" :
                            isMedical ? "bg-indigo-50 text-indigo-800 border-indigo-200" :
                            "bg-amber-50 text-amber-800 border-amber-200"
                          } border`}>
                            {m.numeroCourrier}
                          </span>
                          <span className="text-slate-900 font-black text-xs pr-10">{m.expediteurDestinataire}</span>
                        </div>

                        <p className="text-slate-650 font-semibold italic pl-1 flex items-start gap-1">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" /> 
                          <span>{m.objet}</span>
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 mt-2 border-t border-dashed border-slate-200 text-[10px]">
                          <div className="flex gap-3 text-slate-450 font-mono">
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-slate-450" /> Routage: <strong className="font-sans text-slate-800 font-bold">{m.serviceAffecte}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 text-slate-450" /> Dossier: <strong className={`font-semibold ${
                                m.statutTraitement === "Traité" || m.statutTraitement === "Archivé"
                                  ? "text-emerald-700" 
                                  : m.statutTraitement === "En cours" 
                                  ? "text-amber-700" 
                                  : "text-rose-600"
                              }`}>{m.statutTraitement}</strong>
                            </span>
                          </div>

                          {/* Quick workflow advancement */}
                          <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 font-sans">
                            <span className="text-[9px] text-slate-400 px-1">Piloter:</span>
                            <button
                              onClick={() => handleUpdateStatus(m.id, "En cours")}
                              className={`px-1.5 py-0.5 rounded text-[8.5px] cursor-pointer font-bold ${
                                m.statutTraitement === "En cours" ? "bg-amber-600 text-white" : "text-amber-700 hover:bg-amber-50"
                              }`}
                            >
                              En cours
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(m.id, "Traité")}
                              className={`px-1.5 py-0.5 rounded text-[8.5px] cursor-pointer font-bold ${
                                m.statutTraitement === "Traité" ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              Traité
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Certificate Composition (1/3 size) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-semibold shadow-xs">
          <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="h-4 w-4 text-sky-700" /> Rédaction de Certificats GECD
          </h3>

          <p className="text-[10px] text-slate-400 font-medium leading-normal font-sans">
            Compostez instantanément des certificats et attestations validées par signature numérique scellée sur le registre GECD.
          </p>

          <div className="space-y-4 pt-1">
            {/* Template Grid */}
            <div>
              <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Canevas certifiés</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("attestation")}
                  className={`p-1.5 border rounded-lg text-left transition-all text-[10px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "attestation" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  📄 Repos Clinique
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("aptitude")}
                  className={`p-1.5 border rounded-lg text-left transition-all text-[10px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "aptitude" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  📄 Aptitude Physique
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("conge")}
                  className={`p-1.5 border rounded-lg text-left transition-all text-[10px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "conge" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  📄 Autorisation Absence
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("bordereau")}
                  className={`p-1.5 border rounded-lg text-left transition-all text-[10px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "bordereau" ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  📄 Transmission GECD
                </button>
              </div>
            </div>

            {/* publipostage parameters */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2.5 border border-slate-200 font-sans">
              <span className="text-[9.5px] text-slate-400 uppercase font-black tracking-wider block">Insérer les paramètres cibles :</span>
              
              <div>
                <label className="block text-[9.5px] text-slate-500 mb-0.5">Visé / Dignitaire de l'acte</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    setComposerOutput(""); 
                  }}
                />
              </div>

              <div>
                <label className="block text-[9.5px] text-slate-500 mb-0.5 font-sans">Motifs cliniques obligatoires</label>
                <textarea
                  className="w-full text-[11px] p-2 rounded-lg border border-slate-300 bg-white leading-tight font-medium"
                  rows={2}
                  value={customDetails}
                  onChange={(e) => {
                    setCustomDetails(e.target.value);
                    setComposerOutput(""); 
                  }}
                />
              </div>
            </div>

            {/* Sandbox final text */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-extrabold text-slate-400">Éditeur scellé (Modification libre)</label>
              <textarea
                className="w-full min-h-[160px] text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-300 font-mono font-medium leading-relaxed resize-none h-fit"
                value={getActiveText()}
                onChange={(e) => setComposerOutput(e.target.value)}
              />
            </div>

            {/* Real printable container for this specific letter, hidden from standard view */}
            <div className="hidden">
              <div id="gecd-letter-printable-card" className="p-12 font-sans bg-white text-slate-950 uppercase" style={{ fontFamily: "serif", lineHeight: "1.6" }}>
                <div className="text-center font-bold uppercase tracking-wider mb-8 border-b pb-4">
                  <h2 className="text-lg text-slate-950">REPUBLIQUE DU MALI</h2>
                  <p className="text-xs">Un Peuple - Un But - Une Foi</p>
                  <p className="text-xs text-sky-700 mt-1 uppercase">MINISTÈRE DE LA SANTÉ ET DU DÉVELOPPEMENT SOCIAL</p>
                </div>
                <div style={{ whiteSpace: "pre-wrap", minHeight: "350px", textTransform: "none" }} className="text-sm">
                  {getActiveText()}
                </div>
                <div className="mt-12 pt-6 border-t border-dashed flex justify-between text-xs font-mono text-slate-400 capitalize">
                  <span>Médisahel Clinique de Bamako</span>
                  <span>Sceau GECD de Transmission</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportToPDF("gecd-letter-printable-card", "Acte_Officiel_GECD_" + recipientName.split(" ").join("_"))}
                className="flex-1 text-white font-bold p-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs transition-colors hover:bg-opacity-95 shadow-xs whitespace-nowrap"
                style={{ backgroundColor: accentColor }}
              >
                <Printer className="h-4 w-4" /> Télécharger / PDF
              </button>
              <button
                type="button"
                onClick={handlePrintDocument}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-350 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                title="Imprimer par ouverture externe (nouvel onglet)"
              >
                Externe ↗
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
