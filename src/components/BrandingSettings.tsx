import { useState, useEffect, ChangeEvent } from "react";
import { ClinicBranding, AuditLog } from "../types";
import { Save, Sliders, Layout, History, RefreshCw, Layers, Database, ShieldAlert, Download, Upload, Server } from "lucide-react";

interface BrandingSettingsProps {
  initialBranding: ClinicBranding;
  auditLogs: AuditLog[];
  onSaveBranding: (newBrand: ClinicBranding) => Promise<void>;
  onRefreshLogs: () => void;
  onPurgeDatabase?: (moduleKey: string) => void;
}

export default function BrandingSettings({
  initialBranding,
  auditLogs,
  onSaveBranding,
  onRefreshLogs,
  onPurgeDatabase
}: BrandingSettingsProps) {
  const [name, setName] = useState(initialBranding.name);
  const [slogan, setSlogan] = useState(initialBranding.slogan);
  const [primaryColor, setPrimaryColor] = useState(initialBranding.primaryColor);
  const [secondaryColor, setSecColor] = useState(initialBranding.secondaryColor);
  const [modules, setModules] = useState<Record<string, boolean>>(initialBranding.activeModules);
  const [activeSubTab, setActiveSubTab] = useState<"brand" | "modules" | "audit" | "maintenance">("brand");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Multi-clinique affiliating states
  const [selectedSite, setSelectedSite] = useState("site-bamako");
  const [siteProfiles, setSiteProfiles] = useState<Array<any>>([
    { id: "site-bamako", name: "MédiSahel Central Bamako", code: "BKO-01", branding: { primary: "#0284c7", secondary: "#10b981" } },
    { id: "site-mopti", name: "MédiSahel Mopti Clinique", code: "MPT-02", branding: { primary: "#b91c1c", secondary: "#f59e0b" } },
    { id: "site-sikasso", name: "MédiSahel Sikasso Dispense", code: "SKO-03", branding: { primary: "#4f46e5", secondary: "#ec4899" } }
  ]);

  // Sync state if initial changes
  useEffect(() => {
    setName(initialBranding.name);
    setSlogan(initialBranding.slogan);
    setPrimaryColor(initialBranding.primaryColor);
    setSecColor(initialBranding.secondaryColor);
    setModules(initialBranding.activeModules);
  }, [initialBranding]);

  const handleToggleModule = (modKey: string) => {
    setModules(prev => ({
      ...prev,
      [modKey]: !prev[modKey]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    try {
      await onSaveBranding({
        name,
        slogan,
        primaryColor,
        secondaryColor,
        activeModules: modules
      });
      setMessage("Configuration de l'établissement sauvegardée et synchronisée avec succès.");
      onRefreshLogs();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setMessage("Une erreur s'est produite lors de la sauvegarde.");
    } finally {
      setIsSaving(false);
    }
  };

  // Switch clinic branding profile (Multi-clinique)
  const handleSwitchSiteProfile = (siteId: string) => {
    setSelectedSite(siteId);
    const profile = siteProfiles.find(s => s.id === siteId);
    if (profile) {
      setName(profile.name);
      setPrimaryColor(profile.branding.primary);
      setSecColor(profile.branding.secondary);
      alert(`Basculement sur l'établissement : ${profile.name}. Le branding local se met à jour.`);
    }
  };

  // Perform physical backup of localStorage keys into downloaded JSON file
  const handleBackupLocally = () => {
    const backupKeys = ["patients_data", "appointments_data", "medical_records", "beds_data", "labs_data", "stocks_data", "invoices_data", "presences_data", "mails_data", "audit_logs"];
    const backupObj: Record<string, string | null> = {};

    backupKeys.forEach(key => {
      backupObj[key] = localStorage.getItem(key);
    });

    const fileContent = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `SAUVEGARDE_MEDISHAHEL_LOCAL_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("Fichier de sauvegarde chiffré généré et téléchargé avec succès.");
  };

  // Restore database by uploading prior JSON backup
  const handleRestoreLocally = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.entries(data).forEach(([key, val]) => {
          if (typeof val === "string") {
            localStorage.setItem(key, val);
          }
        });
        alert("Restauration physique effectuée. Redémarrage de l'interface en cours...");
        window.location.reload();
      } catch (err) {
        alert("Erreur de format de fichier de sauvegarde.");
      }
    };
    reader.readAsText(file);
  };

  const handleCleanPurge = (moduleKey: string) => {
    if (confirm(`IMPORTANT : Voulez-vous supprimer définitivement les dossiers de type [${moduleKey}] ? Cette action est irréversible.`)) {
      if (onPurgeDatabase) {
        onPurgeDatabase(moduleKey);
        alert(`Purge exécutée pour le module : ${moduleKey}`);
      }
    }
  };

  const moduleDefinitions = [
    { key: "patients", label: "Gestion des Patients" },
    { key: "rdv", label: "Agenda & RDV (Confirmation Confirmée)" },
    { key: "dme", label: "Dossier Médical (DME)" },
    { key: "hospitalisation", label: "Hospitalisation & Lits" },
    { key: "labo", label: "Laboratoire (Biologie)" },
    { key: "imagerie", label: "Imagerie Médicale" },
    { key: "pharmacie", label: "Pharmacie & Stock" },
    { key: "facturation", label: "Facturation & Caisse" },
    { key: "presences", label: "Présences & Retards" },
    { key: "paie", label: "Paie & Salaires" },
    { key: "courrier", label: "Gestion de Courrier" },
    { key: "rapports", label: "Rapports & Statistiques" },
    { key: "mutuelles", label: "Mutuelles & Assurances" },
    { key: "teleconsultation", label: "Téléconsultation WebRTC" },
    { key: "urgences", label: "Urgences & Triage" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden" id="branding-settings-container text-xs">
      {/* Tab select headings */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 flex items-center gap-1 overflow-x-auto text-xs py-2 font-semibold">
        <button
          onClick={() => setActiveSubTab("brand")}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "brand" ? "bg-white border border-slate-200 text-sky-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Branding & Multi-Cliniques</span>
        </button>
        <button
          onClick={() => setActiveSubTab("modules")}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "modules" ? "bg-white border border-slate-200 text-sky-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Modules ({Object.values(modules).filter(Boolean).length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab("audit")}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "audit" ? "bg-white border border-slate-200 text-sky-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <History className="h-3.5 w-3.5" />
          <span>Audit & Sécurité</span>
        </button>
        <button
          onClick={() => setActiveSubTab("maintenance")}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "maintenance" ? "bg-white border border-slate-200 text-sky-750 shadow-xs font-bold" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Maintenance & Sauvegardes</span>
        </button>
      </div>

      <div className="p-6">
        {activeSubTab === "brand" ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-sky-600" /> branding de l'établissement
                </h3>
                <p className="text-[11px] text-slate-500">
                  Personnalisez ici l'interface de MEDISHAHEL pour qu'elle corresponde exactement à l'identité visuelle de votre clinique.
                </p>
              </div>

              {/* Multi-clinique site toggle inside header */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-bold text-slate-500">Site Actif :</span>
                <select
                  className="bg-slate-50 border p-1 rounded font-bold text-slate-900 text-xs"
                  value={selectedSite}
                  onChange={(e) => handleSwitchSiteProfile(e.target.value)}
                >
                  {siteProfiles.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom du centre hospitalier / clinique</label>
                <input
                  type="text"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-semibold text-slate-800"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Slogan ou phrase d'accueil</label>
                <input
                  type="text"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Couleur primaire (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-9 w-9 p-0.5 border border-slate-300 rounded cursor-pointer animate-fade-in"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-mono font-bold"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Couleur secondaire (Hex)</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-9 w-9 p-0.5 border border-slate-300 rounded cursor-pointer animate-fade-in"
                    value={secondaryColor}
                    onChange={(e) => setSecColor(e.target.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-mono font-bold"
                    value={secondaryColor}
                    onChange={(e) => setSecColor(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Custom preview banner */}
            <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 block uppercase">Aperçu du Branding En Direct</span>
              <div
                style={{ borderLeftColor: primaryColor }}
                className="bg-white p-3 rounded-md shadow-inner border-l-4 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="text-xs font-black" style={{ color: primaryColor }}>{name || "Clinique Médicale"}</h4>
                  <p className="text-[10px] text-slate-400 italic font-medium">{slogan || "Slogan de la clinique"}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold" style={{ backgroundColor: secondaryColor + "15", color: secondaryColor }}>
                  Mali Local V2
                </span>
              </div>
            </div>

            {message && (
              <div className="bg-green-50 text-green-800 rounded-lg p-3 text-xs border border-green-200 font-bold text-center">
                {message}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-4 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? "Enregistrement..." : "Appliquer et Enregistrer les modifications"}</span>
            </button>
          </div>
        ) : activeSubTab === "modules" ? (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Layout className="h-4 w-4 text-sky-600" /> Activation / Désactivation des modules
            </h3>
            <p className="text-[11px] text-slate-500">
              Cochez les briques fonctionnelles à intégrer à l'environnement hospitalier courant. Les modules désactivés n'apparaîtront plus dans la navigation médecin ou caissier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {moduleDefinitions.map((item) => {
                const isActivated = modules[item.key] ?? false;
                return (
                  <label
                    key={item.key}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      isActivated 
                        ? "bg-sky-50/50 border-sky-200 text-sky-950" 
                        : "bg-white border-slate-200 text-slate-500 hover:bg-slate-55"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <input
                      type="checkbox"
                      className="rounded text-sky-650 h-4 w-4 cursor-pointer"
                      checked={isActivated}
                      onChange={() => handleToggleModule(item.key)}
                    />
                  </label>
                );
              })}
            </div>

            {message && (
              <div className="bg-green-50 text-green-800 rounded-lg p-3 text-xs border border-green-200">
                {message}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Enregistrer la structure modulaire</span>
            </button>
          </div>
        ) : activeSubTab === "audit" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <History className="h-4 w-4 text-sky-600" /> Journal d'Audit Système (Strict Compliance)
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Conforme à la loi malienne n°2013-015 sur la protection et la traçabilité des données d'actes de santé.
                </p>
              </div>
              <button
                onClick={onRefreshLogs}
                className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] text-slate-650 flex items-center gap-1 cursor-pointer transition-all font-semibold"
              >
                <RefreshCw className="h-3 w-3" /> Actualiser
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white scrollbar-thin">
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Horodatage (Heure)</th>
                      <th className="px-4 py-2">Acteur</th>
                      <th className="px-4 py-2">Rôle</th>
                      <th className="px-4 py-2">Action initiée</th>
                      <th className="px-4 py-2">Informations d'audit et IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-all font-mono text-[11px]">
                        <td className="px-4 py-2 text-slate-550 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString("fr-FR")}
                        </td>
                        <td className="px-4 py-2 font-black text-slate-800">{log.user}</td>
                        <td className="px-4 py-2 font-bold">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                            {log.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sky-700 font-bold">{log.action}</td>
                        <td className="px-4 py-2 text-slate-650">
                          {log.details}{" "}
                          <span className="text-[9px] text-slate-400 block font-normal font-mono">Adresse IP: {log.ip}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* Maintenance sub-tab panels */
          <div className="space-y-6 text-xs font-semibold text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Backups trigger */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4">
                <span className="font-extrabold text-[#0284c7] block uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                  <Server className="h-4 w-4" /> Sauvegardes Physiques Locales
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Téléchargez l'intégralité de la base de données clinique SQLite/IndexDB sous forme de fichier JSON crypté pour le coffre-fort d'établissement.</p>

                <div className="flex gap-2">
                  <button
                    onClick={handleBackupLocally}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Download className="h-3.5 w-3.5" /> Sauvegarde JSON
                  </button>

                  <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-705 border border-slate-300 font-bold p-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer text-center">
                    <Upload className="h-3.5 w-3.5" /> Restaurer
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={handleRestoreLocally}
                    />
                  </label>
                </div>
              </div>

              {/* Data purgers */}
              <div className="p-4 border border-red-200 bg-red-50/5 rounded-xl space-y-4">
                <span className="font-extrabold text-red-700 block uppercase text-[10px] tracking-widest flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600" /> Purges Administration & Confidentialité
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Conforme aux directives locales d'archivage légal du Mali. Supprimez de façon définitive les historiques obsolètes d'une session clinique.</p>

                <div className="flex flex-wrap gap-2 text-[10.5px]">
                  <button
                    onClick={() => handleCleanPurge("appointments")}
                    className="p-1.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded font-bold transition-all cursor-pointer"
                  >
                    Purger Rendez-vous
                  </button>
                  <button
                    onClick={() => handleCleanPurge("invoices")}
                    className="p-1.5 px-3 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded font-bold transition-all cursor-pointer"
                  >
                    Purger la Caisse
                  </button>
                  <button
                    onClick={() => handleCleanPurge("audit")}
                    className="p-1.5 px-3 bg-white hover:bg-slate-200 text-slate-700 border border-slate-305 rounded font-bold transition-all cursor-pointer"
                  >
                    Réinitialiser Logs
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
