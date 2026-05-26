import { useState, FormEvent } from "react";
import { MailRecord } from "../types";
import { 
  Mail, 
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
  Briefcase
} from "lucide-react";

interface CourrierViewProps {
  mails: MailRecord[];
  onAddMail: (data: Omit<MailRecord, "id" | "numeroCourrier">) => void;
  accentColor: string;
}

export default function CourrierView({
  mails,
  onAddMail,
  accentColor
}: CourrierViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<"Tous" | "Entrant" | "Sortant">("Tous");
  const [filterService, setFilterService] = useState("Tous");
  const [filterStatus, setFilterStatus] = useState("Tous");
  const [filterDate, setFilterDate] = useState("");

  // Form states for new courier
  const [type, setType] = useState<MailRecord["type"]>("Entrant");
  const [expediteurDestinataire, setExpediteurDestinataire] = useState("");
  const [objet, setObjet] = useState("");
  const [dateReceptionEnvoi, setDateReceptionEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [serviceAffecte, setServiceAffecte] = useState("Direction administrative");
  const [statutTraitement, setStatutTraitement] = useState<"En attente" | "En cours" | "Traité">("En attente");

  // Template Composer States
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState("attestation");
  const [recipientName, setRecipientName] = useState("Moussa Traoré");
  const [customDetails, setCustomDetails] = useState("repos de 10 jours pour convalescence post-paludisme grave");
  const [composerOutput, setComposerOutput] = useState("");

  const letterTemplates = {
    attestation: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nSERVICES DES URGENCES & CONSULTATIONS\n\nATTESTATION MÉDICALE DE REPOS CLINIQUE\nN° Ref: CR-2026-ATT-09\n\nJe soussigné, Dr. Sangaré, Médecin Chef de la Clinique MédiSahel Bamako, certifie après examen clinique approfondi de ce jour que l'état de santé de M./Mme ${name} nécessite impérativement un ${details}.\n\nEn foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\nDr. Sangaré, Clinique Centrale`,
    conge: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nDIRECTION ADMINISTRATIVE ET DES RESSOURCES HUMAINES\n\nDEMANDE D'AUTORISATION SPÉCIALE D'ABSENCE\n\nJe sollicite par la présente, l'attribution d'un congé exceptionnel d'absence de garde pour M./Mme ${name}, agissant en qualité d'agent de santé, motivé par : ${details}.\n\nCette absence débutera le lendemain de la signature du présent acte pour une période convenue d'accord administratif.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\nLe Directeur Général MédiSahel`,
    aptitude: (name: string, details: string) => 
      `CLINIQUE MÉDISAHEL BAMAKO\nMEDECINE DU TRAVAIL ET DU SPORT\n\nCERTIFICAT MÉDICAL D'APTITUDE PHYSIQUE\n\nJe certifie avoir examiné ce jour M./Mme ${name}.\nL'examen somatique général ainsi que les constantes physiologiques révèlent une parfaite aptitude physique aux exigences professionnelles suivantes : ${details}.\n\nAucune contre-indication aux efforts physiques modérés n'a été décelée.\n\nFait à Bamako, le ${new Date().toLocaleDateString("fr-FR")}\nDr. Sangaré, Médecin Chef`,
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
    setComposerOutput(""); // resets custom edits to pull from template functions dynamically
  };

  // Local state for updating a mail's status dynamically
  const [localMails, setLocalMails] = useState<Record<string, "En attente" | "En cours" | "Traité">>({});

  const handleUpdateStatus = (mailId: string, newStat: "En attente" | "En cours" | "Traité") => {
    setLocalMails(prev => ({
      ...prev,
      [mailId]: newStat
    }));
    alert(`Le statut du courrier #${mailId} a été mis à jour : ${newStat}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!expediteurDestinataire || !objet) {
      alert("Tous les champs sont obligatoires.");
      return;
    }

    onAddMail({
      type,
      expediteurDestinataire,
      objet,
      dateReceptionEnvoi,
      serviceAffecte,
      statutTraitement: statutTraitement
    });

    setExpediteurDestinataire("");
    setObjet("");
    setShowForm(false);
    alert(`Courrier officiellement enregistré. Numérotation automatique en partie double générée.`);
  };

  const filteredMails = mails.map(m => {
    // Merge local state overrides for treatment status
    const statusOverridden = localMails[m.id] || m.statutTraitement;
    return { ...m, statutTraitement: statusOverridden };
  }).filter(m => {
    // Text query match
    const sMatch = searchQuery === "" || 
      m.numeroCourrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expediteurDestinataire.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.objet.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Type match
    const tMatch = activeSubTab === "Tous" || m.type === activeSubTab;

    // Service match
    const servMatch = filterService === "Tous" || m.serviceAffecte === filterService;

    // Status match
    const statMatch = filterStatus === "Tous" || m.statutTraitement === filterStatus;

    // Date match
    const dMatch = filterDate === "" || m.dateReceptionEnvoi === filterDate;

    return sMatch && tMatch && servMatch && statMatch && dMatch;
  });

  const handlePrintDocument = () => {
    const textToPrint = getActiveText();
    const pWind = window.open("", "_blank");
    if (!pWind) return;

    pWind.document.write(`
      <html>
        <head>
          <title>ARCHIVE ADMINISTRATIVE ET MÉDICALE - CLINIQUE MÉDISAHEL</title>
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
                Quartier de Fleuve, Tél: +223 20 22 45 45<br/>
                Agrément Ministériel N°2026/MS-HP
              </span>
            </div>
            <div class="letterhead-right font-mono">
              <strong>JOURNAL INTERNE CLINIQUE</strong><br/>
              Classification: Document Certifié<br/>
              Date archivage: ${new Date().toLocaleDateString("fr-FR")}
            </div>
          </div>

          <div class="content-body">${textToPrint}</div>

          <div class="signature-block">
            <div>
              <div class="seal-watermark">ARCHIVAGE SÉCURISÉ NUMÉRIQUE</div>
            </div>
            <div style="text-align: center;">
              <strong>Le Praticien Chef Responsable</strong><br/>
              <span style="font-size:11px; font-style:italic; color:#444;">Signé sous approbation consulaire</span><br/><br/>
              <div style="font-weight: bold; margin-top: 15px; text-decoration: underline;">Dr. S. Sangaré</div>
            </div>
          </div>

          <div class="footer-notes">
            Clinique MédiSahel - Gestionnaire de dossier de santé informatisé crypté conforme aux normes de la Direction Nationale de la Santé du Mali.
          </div>
        </body>
      </html>
    `);
    pWind.document.close();
  };

  return (
    <div className="space-y-6" id="courrier-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: accentColor }} />
            <span>Module 11 – Gestion de Courrier, Archives & Légalités</span>
          </h2>
          <p className="text-xs text-slate-500">Traçabilité ministérielle, numérotation automatique, routage de services et bibliothèque d'imprimables officiels.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer self-start transition-all hover:bg-opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Enregistrer un Courrier</span>
        </button>
      </div>

      {/* Creation form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-xs text-xs font-semibold animate-fade-in">
          <div className="border-b pb-1.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Réceptionner ou émettre un Courrier Officiel</h3>
            <p className="text-[10px] text-slate-400 font-medium">Les courriers se voient affecter une référence séquentielle légale unique (ex: CR-2026-0105).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Type de Flux</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
                value={type}
                onChange={(e) => setType(e.target.value as MailRecord["type"])}
              >
                <option value="Entrant">Entrant (Courriers Reçus)</option>
                <option value="Sortant">Sortant (Courriers Expédiés)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-505 mb-1">Routage / Service Affecté</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
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
              <label className="block text-[11px] text-slate-505 mb-1">Statut Initial</label>
              <select
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
                value={statutTraitement}
                onChange={(e) => setStatutTraitement(e.target.value as any)}
              >
                <option value="En attente">En attente des pièces</option>
                <option value="En cours">En cours d'instruction</option>
                <option value="Traité">Validé & Traité</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Date d'enregistrement</label>
              <input
                type="date"
                required
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white font-mono"
                value={dateReceptionEnvoi}
                onChange={(e) => setDateReceptionEnvoi(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-500 mb-1">Émetteur / Destinataire (Correspondant légal)</label>
              <input
                type="text"
                required
                placeholder="Ex: Secrétariat Général du Ministère de la Santé, PPM"
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
                value={expediteurDestinataire}
                onChange={(e) => setExpediteurDestinataire(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] text-slate-505 mb-1">Objet officiel du courrier</label>
              <input
                type="text"
                required
                placeholder="Ex: Demande d'approbation d'urgence de lot vaccinal pédiatrique"
                className="w-full text-xs p-2 rounded border border-slate-350 bg-white"
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white font-bold rounded cursor-pointer"
              style={{ backgroundColor: accentColor }}
            >
              Créer avec Numérotation Auto
            </button>
          </div>
        </form>
      )}

      {/* Advanced search, query and service filter matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
          <Filter className="h-3.5 w-3.5" /> RECHERCHE AVANCÉE & CRITÈRES COMPOSÉS
        </span>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Query */}
          <div className="md:col-span-2">
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Recherche par mots-clés</label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-2 rounded-lg text-xs font-semibold">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ID, correspondants, objet..."
                className="bg-transparent outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Service affected */}
          <div>
            <label className="block text-[10.5px] text-slate-500 mb-1 font-bold font-sans">Direction / Service</label>
            <select
              className="w-full text-xs p-2 border border-slate-300 bg-white font-bold rounded-lg"
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
            >
              <option value="Tous">Toutes les affectations</option>
              <option value="Direction administrative">Direction administrative</option>
              <option value="Comptabilité & Caisse">Comptabilité & Caisse</option>
              <option value="Laboratoire & Techniques">Laboratoire & Techniques</option>
              <option value="Maternité & CPN">Maternité & CPN</option>
              <option value="Garde Médicale">Garde Médicale</option>
              <option value="Ressources Humaines">Ressources Humaines</option>
            </select>
          </div>

          {/* Statut filter */}
          <div>
            <label className="block text-[10.5px] text-slate-505 mb-1 font-bold">État de Traitement</label>
            <select
              className="w-full text-xs p-2 border border-slate-300 bg-white font-bold rounded-lg"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tous">Tous les statuts</option>
              <option value="En attente">En attente</option>
              <option value="En cours">En cours</option>
              <option value="Traité">Traité</option>
            </select>
          </div>

          {/* Date range selection */}
          <div>
            <label className="block text-[10.5px] text-slate-505 mb-1 font-bold">Date de Dépôt</label>
            <input
              type="date"
              className="w-full text-xs p-2 border border-slate-300 bg-white font-mono font-bold rounded-lg"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs font-semibold">
          <div className="flex gap-2.5">
            <button
              onClick={() => setActiveSubTab("Tous")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeSubTab === "Tous" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setActiveSubTab("Entrant")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeSubTab === "Entrant" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Entrants (Direction interne)
            </button>
            <button
              onClick={() => setActiveSubTab("Sortant")}
              className={`px-3 py-1 rounded transition-all cursor-pointer ${
                activeSubTab === "Sortant" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Sortants (Expéditions ministérielles)
            </button>
          </div>

          {(searchQuery || filterService !== "Tous" || filterStatus !== "Tous" || filterDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterService("Tous");
                setFilterStatus("Tous");
                setFilterDate("");
              }}
              className="text-red-650 hover:underline flex items-center gap-1 font-black cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Journals table column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 font-semibold text-xs text-slate-850">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">Chronologie Légale ({filteredMails.length} documents filtrés)</h3>
              <span className="text-[10px] text-slate-400">Archivage immuable</span>
            </div>

            {filteredMails.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-slate-400 font-sans italic">Aucun document ne répond à vos critères complexes.</p>
                <p className="text-[10px] text-slate-400">Essayez de desserrer les filtres de services ou de dates.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMails.map((m) => {
                  const isEntrant = m.type === "Entrant";
                  return (
                    <div 
                      key={m.id} 
                      className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl relative transition-all"
                    >
                      <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono italic">{m.dateReceptionEnvoi}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isEntrant ? "bg-emerald-50 text-emerald-800 border-emerald-150" : "bg-sky-50 text-sky-800 border-sky-150"
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
                              <Briefcase className="h-3 w-3" /> Dept: <strong className="font-sans text-slate-600">{m.serviceAffecte}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Statut: <strong className={`${
                                m.statutTraitement === "Traité" 
                                  ? "text-emerald-700" 
                                  : m.statutTraitement === "En cours" 
                                  ? "text-amber-700" 
                                  : "text-red-650"
                              }`}>{m.statutTraitement}</strong>
                            </span>
                          </div>

                          {/* Quick Actions to drive courrier treatment pipeline */}
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

        {/* Certified Letters Custom Composition */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold shadow-xs">
          <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="h-4 w-4 text-indigo-650" /> Rédaction de Documents Certifiés
          </h3>

          <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed font-sans">
            Générez de façon automatique des certificats, attestations et bordereaux de transmission administrative clinique.
          </p>

          <div className="space-y-4 pt-1">
            {/* Template Selector Grid */}
            <div>
              <label className="block text-[10.5px] text-slate-500 mb-1 font-bold">Sélectionner un Modèle</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("attestation")}
                  className={`p-1.5 border rounded text-left transition-all text-[10.5px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "attestation" ? "bg-slate-905 border-slate-900 bg-slate-50 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  📄 Attestation Clinique
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("aptitude")}
                  className={`p-1.5 border rounded text-left transition-all text-[10.5px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "aptitude" ? "bg-slate-905 border-slate-900 bg-slate-50 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  📄 Certif' Aptitude
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("conge")}
                  className={`p-1.5 border rounded text-left transition-all text-[10.5px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "conge" ? "bg-slate-905 border-slate-900 bg-slate-50 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  📄 Autorisation Congé
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("bordereau")}
                  className={`p-1.5 border rounded text-left transition-all text-[10.5px] cursor-pointer font-bold ${
                    selectedLetterTemplate === "bordereau" ? "bg-slate-905 border-slate-900 bg-slate-50 text-slate-900" : "bg-white border-slate-205 text-slate-600"
                  }`}
                >
                  📄 Bordereau Transm.
                </button>
              </div>
            </div>

            {/* Smart variables filler */}
            <div className="p-3 bg-slate-50 rounded-lg space-y-2 border border-slate-150">
              <span className="text-[10px] text-slate-450 uppercase font-black">Variables de publipostage :</span>
              
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Destinataire / Praticien cible</label>
                <input
                  type="text"
                  className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    setComposerOutput(""); // trigger dynamic template refresh
                  }}
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Motifs / Détails de l'acte</label>
                <textarea
                  className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white leading-tight"
                  rows={2}
                  value={customDetails}
                  onChange={(e) => {
                    setCustomDetails(e.target.value);
                    setComposerOutput(""); // trigger dynamic template refresh
                  }}
                />
              </div>
            </div>

            {/* Final Letters Sandbox Editor */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-extrabold text-slate-400">Corps final éditable :</label>
              <textarea
                className="w-full min-h-[160px] text-[11px] p-2.5 rounded bg-slate-50 border border-slate-350 font-medium font-mono leading-relaxed resize-none h-fit"
                value={getActiveText()}
                onChange={(e) => setComposerOutput(e.target.value)}
              />
            </div>

            {/* Print and simulated Download action */}
            <button
              onClick={handlePrintDocument}
              className="w-full text-white font-bold p-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1 text-xs transition-colors hover:bg-opacity-95 shadow-sm"
              style={{ backgroundColor: accentColor }}
            >
              <Printer className="h-4 w-4" /> Archivage & Impression Officielle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
