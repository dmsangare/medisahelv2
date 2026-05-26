import { useState, FormEvent } from "react";
import { MailRecord } from "../types";
import { Mail, Search, PlusCircle, CheckCircle, FileText, ArrowRight, CornerDownRight, ShieldAlert, FileMinus } from "lucide-react";

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

  // Form states
  const [type, setType] = useState<MailRecord["type"]>("Entrant");
  const [expediteurDestinataire, setExpediteurDestinataire] = useState("");
  const [objet, setObjet] = useState("");
  const [dateReceptionEnvoi, setDateReceptionEnvoi] = useState(new Date().toISOString().split("T")[0]);
  const [serviceAffecte, setServiceAffecte] = useState("Direction administrative");

  // Models composer state
  const [selectedLetterTemplate, setSelectedLetterTemplate] = useState("attestation");
  const [composerOutput, setComposerOutput] = useState("");

  const letterTemplates = {
    attestation: "Je soussigné, Dr. Sangaré, certifie par la présente attestation clinique que l'état de santé du patient cité exige un repos strict d'épreuve...",
    conge: "Demande d'autorisation spéciale d'absence pour convenance personnelle. Sollicite l'attribution d'un congé de garde clinique...",
    recrutement: "Contrat de stage d'épreuves d'auxiliaire de soins infirmiers pour la clinique centrale locale MédiSahel..."
  };

  const handleApplyTemplate = (key: keyof typeof letterTemplates) => {
    setSelectedLetterTemplate(key);
    setComposerOutput(letterTemplates[key]);
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
      statutTraitement: "En attente"
    });

    setExpediteurDestinataire("");
    setObjet("");
    setShowForm(false);
    alert("Courrier enregistré et horodaté.");
  };

  const filteredMails = mails.filter(m => {
    const sMatch = searchQuery === "" || 
      m.numeroCourrier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.expediteurDestinataire.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.objet.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tMatch = activeSubTab === "Tous" || m.type === activeSubTab;
    return sMatch && tMatch;
  });

  return (
    <div className="space-y-6" id="courrier-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5" style={{ color: accentColor }} />
            <span>Gestion des Courriers, Documents & Archives</span>
          </h2>
          <p className="text-xs text-slate-500">Traçabilité légale, numérotation séquentielle et ventilation interne des documents entrants et sortants.</p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer self-start"
          style={{ backgroundColor: accentColor }}
        >
          <PlusCircle className="h-4 w-4" />
          <span>Enregistrer un Courrier</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registry core */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Show creation tool Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-sm text-xs font-semibold animate-fade-in">
              <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-widest border-b border-slate-100 pb-2">Enregistrer un Courrier Officiel</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Type de Flux</label>
                  <select
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    value={type}
                    onChange={(e) => setType(e.target.value as MailRecord["type"])}
                  >
                    <option value="Entrant">Entrant (Courriers Reçus)</option>
                    <option value="Sortant">Sortant (Courriers Expédiés)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Service Émetteur / Destinataire</label>
                  <select
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    value={serviceAffecte}
                    onChange={(e) => setServiceAffecte(e.target.value)}
                  >
                    <option value="Direction administrative">Direction administrative</option>
                    <option value="Comptabilité & Caisse">Comptabilité & Caisse</option>
                    <option value="Laboratoire & Techniques">Laboratoire & Techniques</option>
                    <option value="Maternité & CPN">Maternité & CPN</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Désignation Correspondant (Nom Direction ou Patient)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Direction Nationale de la Santé des Cliniques du Mali"
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    value={expediteurDestinataire}
                    onChange={(e) => setExpediteurDestinataire(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Objet / Nature du document</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Transmission de rapports statistiques trimestriels"
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                    value={objet}
                    onChange={(e) => setObjet(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg cursor-pointer font-bold"
                  style={{ backgroundColor: accentColor }}
                >
                  Valider l'Enregistrement
                </button>
              </div>
            </form>
          )}

          {/* Quick search and stats */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter tags header */}
            <div className="bg-slate-100 p-1 rounded-lg border text-xs font-semibold flex items-center gap-1 self-start">
              <button
                onClick={() => setActiveSubTab("Tous")}
                className={`px-3 py-1 rounded transition-all ${
                  activeSubTab === "Tous" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setActiveSubTab("Entrant")}
                className={`px-3 py-1 rounded transition-all ${
                  activeSubTab === "Entrant" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
                }`}
              >
                Entrants
              </button>
              <button
                onClick={() => setActiveSubTab("Sortant")}
                className={`px-3 py-1 rounded transition-all ${
                  activeSubTab === "Sortant" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-550 hover:text-slate-800"
                }`}
              >
                Sortants
              </button>
            </div>

            {/* Core Search bar input */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg text-xs w-full md:max-w-xs font-semibold">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtre par expéditeur, réf, objet..."
                className="bg-transparent outline-none w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

          </div>

          {/* Core courriers results */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 font-semibold text-xs text-slate-800">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Journaux et Chronologies ({filteredMails.length} enregistrements)</h3>

            {filteredMails.length === 0 ? (
              <p className="text-center py-10 text-slate-400 font-sans italic">Aucun document ne répond à vos filtres.</p>
            ) : (
              <div className="space-y-3">
                {filteredMails.map((m) => {
                  const isEntrant = m.type === "Entrant";
                  return (
                    <div key={m.id} className="p-4 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            isEntrant ? "bg-emerald-50 text-emerald-800 border-emerald-150" : "bg-sky-50 text-sky-800 border-sky-150"
                          } border`}>
                            {m.numeroCourrier}
                          </span>
                          <span className="text-slate-900 font-black text-xs">{m.expediteurDestinataire}</span>
                        </div>
                        <p className="text-slate-600 font-medium italic pl-1 flex items-center gap-1">
                          <CornerDownRight className="h-3.5 w-3.5 text-slate-400" /> {m.objet}
                        </p>
                        <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                          <span>Affectation : <strong className="font-sans text-slate-605">{m.serviceAffecte}</strong></span>
                          <span>Statut : <strong className="text-sky-700">{m.statutTraitement}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-[10px] text-slate-400 font-mono font-bold whitespace-nowrap">Le {m.dateReceptionEnvoi}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Templates and tools sidebar */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
          <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <FileText className="h-4 w-4 text-sky-600" /> Éditeur de Modèles de Courriers
          </h3>

          <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed">Composez rapidement des documents certifiés pour les administrations maliennes en sélectionnant une structure de référence locale.</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleApplyTemplate("attestation")}
              className={`p-1.5 border rounded text-center transition-all cursor-pointer ${
                selectedLetterTemplate === "attestation" ? "bg-slate-50 border-slate-650" : "bg-white border-slate-205"
              }`}
            >
              Attestation Repos
            </button>
            <button
              onClick={() => handleApplyTemplate("conge")}
              className={`p-1.5 border rounded text-center transition-all cursor-pointer ${
                selectedLetterTemplate === "conge" ? "bg-slate-50 border-slate-650" : "bg-white border-slate-205"
              }`}
            >
              Demande d'absence
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-extrabold text-slate-400">Éditeur :</label>
            <textarea
              className="w-full min-h-[140px] text-[11.5px] p-2.5 rounded bg-slate-50 border border-slate-350 font-medium font-mono leading-relaxed resize-none h-fit"
              value={composerOutput || letterTemplates.attestation}
              onChange={(e) => setComposerOutput(e.target.value)}
            />
          </div>

          <button
            onClick={() => {
              alert("Document exporté d'épreuve et archivé localement au format PDF.");
            }}
            className="w-full text-white font-bold p-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 text-xs"
            style={{ backgroundColor: accentColor }}
          >
            <CheckCircle className="h-4 w-4" /> Archivage & Impression
          </button>
        </div>
      </div>
    </div>
  );
}
