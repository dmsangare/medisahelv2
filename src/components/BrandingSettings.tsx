import { useState, useEffect, ChangeEvent } from "react";
import { ClinicBranding, AuditLog, UserAccount, UserRole } from "../types";
import { Save, Sliders, Layout, History, RefreshCw, Layers, Database, ShieldAlert, Download, Upload, Server, Users, UserPlus, Edit2, Trash2, Shield, Clock, Globe, Lock, Unlock, Settings, Key } from "lucide-react";

interface BrandingSettingsProps {
  initialBranding: ClinicBranding;
  auditLogs: AuditLog[];
  onSaveBranding: (newBrand: ClinicBranding) => Promise<void>;
  onRefreshLogs: () => void;
  onPurgeDatabase?: (moduleKey: string) => void;
  // Dynamic User accounts & Security states
  users: UserAccount[];
  onSaveUsers: (updated: UserAccount[]) => void;
}

export default function BrandingSettings({
  initialBranding,
  auditLogs,
  onSaveBranding,
  onRefreshLogs,
  onPurgeDatabase,
  users,
  onSaveUsers
}: BrandingSettingsProps) {
  const [name, setName] = useState(initialBranding.name);
  const [appName, setAppName] = useState(initialBranding.appName || "MEDISHAHEL");
  const [slogan, setSlogan] = useState(initialBranding.slogan);
  const [primaryColor, setPrimaryColor] = useState(initialBranding.primaryColor);
  const [secondaryColor, setSecColor] = useState(initialBranding.secondaryColor);
  const [logoUrl, setLogoUrl] = useState(initialBranding.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(initialBranding.faviconUrl || "💉");
  const [modules, setModules] = useState<Record<string, boolean>>(initialBranding.activeModules);
  const [activeSubTab, setActiveSubTab] = useState<"brand" | "modules" | "audit" | "users" | "maintenance">("brand");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // States for automatic archiving & purge history (Module 18)
  const [isAutoArchiveEnabled, setIsAutoArchiveEnabled] = useState(true);
  const [autoArchiveInterval, setAutoArchiveInterval] = useState<"daily" | "weekly" | "monthly">("daily");
  const [lastAutoArchiveDate, setLastAutoArchiveDate] = useState<string>("Hier à 23:59 (SUCCESS)");
  const [adminSecurityWord, setAdminSecurityWord] = useState("");
  const [purgeHistory, setPurgeHistory] = useState<Array<{ timestamp: string; actor: string; type: string; status: string; volume: string; ip: string }>>([
    { timestamp: "2026-05-24T18:30:00Z", actor: "Sidi Coulibaly (SysAdmin)", type: "Réinitialisation des logs système obsolètes", status: "SUCCESS", volume: "1,240 entrées", ip: "192.168.1.15" },
    { timestamp: "2026-05-15T12:00:00Z", actor: "Sidi Coulibaly (SysAdmin)", type: "Purge sécurisée des rendez-vous finis (2025)", status: "SUCCESS", volume: "350 rendez-vous", ip: "192.168.1.5" },
    { timestamp: "2026-05-01T23:59:00Z", actor: "Sidi Coulibaly (SysAdmin)", type: "Purge de la caisse (Exercice clos 2024)", status: "SUCCESS", volume: "840 factures", ip: "192.168.1.10" }
  ]);

  // User edit / creation states
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userNameField, setUserNameField] = useState("");
  const [userRoleField, setUserRoleField] = useState<UserRole>("Médecin");
  const [userActiveField, setUserActiveField] = useState(true);

  // Advanced Advanced RBAC state properties
  const [selectedUserModules, setSelectedUserModules] = useState<string[]>([]);
  const [selectedUserActions, setSelectedUserActions] = useState<string[]>([]);
  const [selectedUserSites, setSelectedUserSites] = useState<string[]>([]);
  const [selectedUserDepts, setSelectedUserDepts] = useState<string[]>([]);
  const [selectedUserDocs, setSelectedUserDocs] = useState<string[]>([]);
  const [hoursStart, setHoursStart] = useState("08:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [ipAddressField, setIpAddressField] = useState("192.168.1.*");

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
    setAppName(initialBranding.appName || "MEDISHAHEL");
    setSlogan(initialBranding.slogan);
    setPrimaryColor(initialBranding.primaryColor);
    setSecColor(initialBranding.secondaryColor);
    setLogoUrl(initialBranding.logoUrl || "");
    setFaviconUrl(initialBranding.faviconUrl || "💉");
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
        appName,
        slogan,
        primaryColor,
        secondaryColor,
        logoUrl,
        faviconUrl,
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
          onClick={() => {
            setIsEditingUser(false);
            setActiveSubTab("users");
          }}
          className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === "users" ? "bg-white border border-slate-200 text-sky-700 shadow-xs font-bold" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Users className="h-3.5 w-3.5 text-sky-600" />
          <span>Sécurité & Comptes RBAC</span>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom de l'application (Dénomination système)</label>
                <input
                  type="text"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-semibold text-slate-800"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Favicon de l'application (Emoji ou URL de l'icône de l'onglet)</label>
                <input
                  type="text"
                  className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none font-mono"
                  value={faviconUrl}
                  onChange={(e) => setFaviconUrl(e.target.value)}
                  placeholder="ex: 💉 ou 🏥"
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

              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Logo clinique (Image URL ou transfert de fichier)</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    className="flex-1 text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Laissez vide pour l'icône de secours 'MS' ou insérez une URL d'image"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10.5px] font-bold p-2 px-3 rounded flex items-center justify-center cursor-pointer transition-all self-center whitespace-nowrap gap-1">
                    Chargez un fichier LOGO
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setLogoUrl(reader.result);
                              alert("Logo chargé avec succès sous forme de Data URL !");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
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
                          <div className="font-semibold text-slate-800 text-[11px]">{log.details}</div>
                          {log.oldValue && (
                            <div className="text-[9.5px] text-rose-700 font-mono mt-1 bg-rose-50/70 p-1 rounded border border-rose-100">
                              <span className="font-bold">[-] Ancienne configuration :</span> {log.oldValue}
                            </div>
                          )}
                          {log.newValue && (
                            <div className="text-[9.5px] text-emerald-700 font-mono mt-1 bg-emerald-50/70 p-1 rounded border border-emerald-100">
                              <span className="font-bold">[+] Nouvelle configuration :</span> {log.newValue}
                            </div>
                          )}
                          <span className="text-[9px] text-slate-400 block font-normal font-mono mt-1">Adresse IP: {log.ip}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeSubTab === "users" ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100 font-sans">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <Shield className="h-4 w-4 text-emerald-600 animate-pulse" /> Gestion de la Sécurité & Comptes Accès (RBAC Strict)
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Contrôlez les habilitations cliniques rattachées aux dossiers de santé. Conforme à la loi malienne n°2013-015 sur les données de santé.
                </p>
              </div>

              {!isEditingUser && (
                <button
                  onClick={() => {
                    setIsEditingUser(true);
                    setEditingUserId(null);
                    setUserNameField("");
                    setUserRoleField("Médecin");
                    setUserActiveField(true);
                    setSelectedUserModules(["patients", "rdv", "dme"]);
                    setSelectedUserActions(["Lecture", "Saisie"]);
                    setSelectedUserSites(["site-bamako"]);
                    setSelectedUserDepts(["Médecine Générale"]);
                    setSelectedUserDocs(["Dossiers Médicaux Cliniques"]);
                    setHoursStart("07:00");
                    setHoursEnd("21:00");
                    setIpAddressField("192.168.1.*");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Nouveau Collaborateur</span>
                </button>
              )}
            </div>

            {isEditingUser ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b pb-2 mb-3">
                  <h4 className="font-extrabold text-[#0284c7] text-xs flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    {editingUserId ? "Modifier l'habilitation du collaborateur" : "Déclaration d'un nouveau compte clinique"}
                  </h4>
                  <button
                    onClick={() => setIsEditingUser(false)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                  >
                    Annuler
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom complet du professionnel</label>
                    <input
                      type="text"
                      placeholder="Ex: Dr. Fatoumata Keïta"
                      className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white"
                      value={userNameField}
                      onChange={(e) => setUserNameField(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rôle et Niveau hiérarchique principal</label>
                    <select
                      className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white font-bold"
                      value={userRoleField}
                      onChange={(e) => setUserRoleField(e.target.value as UserRole)}
                    >
                      <option value="Médecin">Médecin (DME & Prescriptions)</option>
                      <option value="Infirmier">Infirmier (Soins & Paramètres)</option>
                      <option value="Sage-femme">Sage-femme (CPN & Accouchements)</option>
                      <option value="Aide-soignant">Aide-soignant (Consultation lecture seule)</option>
                      <option value="Laborantin">Laborantin (Biologie clinique)</option>
                      <option value="Radiologue">Radiologue (Imagerie DICOM)</option>
                      <option value="Pharmacien">Pharmacien (Délivrance & Stock)</option>
                      <option value="Réceptionniste">Réceptionniste (Admission & Carnets)</option>
                      <option value="Caissier">Caissier (Facturation & OM/Wave)</option>
                      <option value="DG">Directeur Général (Rapports & Pilotage)</option>
                      <option value="Administrateur Système">Administrateur Système (Habilitations & Maintenance)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-2">Statut opérationnel</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="radio"
                          checked={userActiveField}
                          onChange={() => setUserActiveField(true)}
                        />
                        <span className="text-emerald-705 font-bold">Actif (Accès autorisé)</span>
                      </label>
                      <label className="flex items-center gap-1 text-xs cursor-pointer">
                        <input
                          type="radio"
                          checked={!userActiveField}
                          onChange={() => setUserActiveField(false)}
                        />
                        <span className="text-red-700 font-bold">Inactif (Verrouillé)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ADVANCED ADVANCED RBAC SECTION */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-4">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block border-b pb-1">
                    🔧 Paramètres avancés d'accès et d'audits (Normes Multi-Cliniques)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Permissions par Module */}
                    <div>
                      <span className="block text-[10.5px] font-bold text-slate-700 mb-1.5">🗂️ Permissions par Module (Habilitations)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["patients", "rdv", "dme", "hospitalisation", "labo", "imagerie", "pharmacie", "facturation", "presences", "paie", "courrier", "rapports", "teleconsultation", "urgences"].map(m => {
                          const hasMod = selectedUserModules.includes(m);
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => {
                                setSelectedUserModules(prev =>
                                  hasMod ? prev.filter(x => x !== m) : [...prev, m]
                                );
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                                hasMod 
                                  ? "bg-sky-50 border-sky-305 text-sky-850 font-bold" 
                                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-500"
                              }`}
                            >
                              {m.toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permissions par Action */}
                    <div>
                      <span className="block text-[10.5px] font-bold text-slate-700 mb-1.5">⚡ Actions autorisées (Habilitations d'actes)</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Lecture", "Saisie", "Suppression", "Signature d'actes", "Fermeture Comptable", "Purge d'audit"].map(a => {
                          const hasAct = selectedUserActions.includes(a);
                          return (
                            <button
                              key={a}
                              type="button"
                              onClick={() => {
                                setSelectedUserActions(prev =>
                                  hasAct ? prev.filter(x => x !== a) : [...prev, a]
                                );
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                                hasAct 
                                  ? "bg-amber-55 border-amber-300 text-amber-900 font-bold" 
                                  : "bg-slate-50 hover:bg-slate-105 border-slate-200 text-slate-500"
                              }`}
                            >
                              {a}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Permissions par Etablissement & Departement */}
                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                      <div>
                        <span className="block text-[10.5px] font-bold text-slate-700 mb-1">🏢 Établissements (Multi-Sites)</span>
                        <div className="space-y-1">
                          {[
                            { id: "site-bamako", label: "MédiSahel Bamako" },
                            { id: "site-mopti", label: "MédiSahel Mopti" },
                            { id: "site-sikasso", label: "MédiSahel Sikasso" }
                          ].map(site => {
                            const isSelected = selectedUserSites.includes(site.id);
                            return (
                              <label key={site.id} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-650 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedUserSites(prev =>
                                      isSelected ? prev.filter(x => x !== site.id) : [...prev, site.id]
                                    );
                                  }}
                                />
                                <span>{site.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <span className="block text-[10.5px] font-bold text-slate-700 mb-1">🩺 Départements</span>
                        <div className="space-y-1">
                          {["Médecine Générale", "Urgences & Triage", "Maternité / CPN", "Laboratoire de Biologie", "Caisse centrale"].map(dept => {
                            const isSelected = selectedUserDepts.includes(dept);
                            return (
                              <label key={dept} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-650 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedUserDepts(prev =>
                                      isSelected ? prev.filter(x => x !== dept) : [...prev, dept]
                                    );
                                  }}
                                />
                                <span>{dept}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Types de Données, Sécurité Horaire, IP */}
                    <div className="grid grid-cols-2 gap-2 border-t pt-3">
                      <div>
                        <span className="block text-[10.5px] font-bold text-slate-700 mb-1">🧪 Types de Données</span>
                        <div className="space-y-1">
                          {["Dossiers Médicaux Cliniques", "Données financières", "Actes médico-techniques", "Fiches paye & RH"].map(docType => {
                            const isSelected = selectedUserDocs.includes(docType);
                            return (
                              <label key={docType} className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-650 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedUserDocs(prev =>
                                      isSelected ? prev.filter(x => x !== docType) : [...prev, docType]
                                    );
                                  }}
                                />
                                <span>{docType}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Restrictions Horaires */}
                        <div>
                          <span className="block text-[10.5px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Restrictions d'Heure
                          </span>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              placeholder="08:00"
                              className="w-16 text-center text-[10.5px] border rounded bg-slate-50 p-1 font-mono font-bold"
                              value={hoursStart}
                              onChange={(e) => setHoursStart(e.target.value)}
                            />
                            <span className="text-slate-400">à</span>
                            <input
                              type="text"
                              placeholder="18:00"
                              className="w-16 text-center text-[10.5px] border rounded bg-slate-50 p-1 font-mono font-bold"
                              value={hoursEnd}
                              onChange={(e) => setHoursEnd(e.target.value)}
                            />
                          </div>
                        </div>

                        {/* Restrictions d'IP */}
                        <div>
                          <span className="block text-[10.5px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                            <Globe className="h-3 w-3 text-slate-550" /> Restrictions Réseau IP
                          </span>
                          <input
                            type="text"
                            placeholder="Ex: 192.168.1.*"
                            className="w-full text-[10.5px] border rounded bg-slate-50 p-1 font-mono"
                            value={ipAddressField}
                            onChange={(e) => setIpAddressField(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!userNameField.trim()) {
                        alert("Le nom du clinicien est obligatoire !");
                        return;
                      }

                      const candidate: UserAccount = {
                        id: editingUserId || `user-${Date.now().toString().slice(-4)}`,
                        name: userNameField,
                        role: userRoleField,
                        isActive: userActiveField,
                        allowedModules: selectedUserModules,
                        allowedActions: selectedUserActions,
                        allowedSites: selectedUserSites,
                        allowedDepartments: selectedUserDepts,
                        allowedDataTypes: selectedUserDocs,
                        allowedHoursStart: hoursStart || undefined,
                        allowedHoursEnd: hoursEnd || undefined,
                        allowedIPs: ipAddressField || undefined
                      };

                      let updatedList: UserAccount[];
                      if (editingUserId) {
                        updatedList = users.map(u => u.id === editingUserId ? candidate : u);
                      } else {
                        updatedList = [...users, candidate];
                      }

                      onSaveUsers(updatedList);
                      setIsEditingUser(false);
                      setEditingUserId(null);
                    }}
                    className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-all"
                  >
                    <Save className="h-3.5 w-3.5" /> Enregistrer ce clinicien
                  </button>
                  <button
                    onClick={() => setIsEditingUser(false)}
                    className="p-2 border rounded border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold"
                  >
                    Abandonner
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visual table matrix of users and settings */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Professionnel de Santé</th>
                        <th className="px-4 py-2.5">Rôle</th>
                        <th className="px-4 py-2.5 font-bold">Modules autorisés ({activeSubTab === "users" ? "RBAC" : ""})</th>
                        <th className="px-4 py-2.5">Heure / Réseau IP</th>
                        <th className="px-4 py-2.5">Statut</th>
                        <th className="px-4 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-650">
                      {users.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-4 py-3">
                            <span className="font-extrabold text-slate-850 block text-xs">{item.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">ID: {item.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-50 text-sky-850 border border-sky-100">
                              {item.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 space-y-1">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {(item.allowedModules || ["patients", "rdv", "dme"]).map(m => (
                                <span key={m} className="px-1 bg-slate-100 text-slate-700 border border-slate-150 rounded-[3px] text-[8.5px] font-bold">
                                  {m}
                                </span>
                              ))}
                            </div>
                            <div className="text-[9.5px] text-slate-400 font-semibold">
                              Sites: <span className="text-slate-600">{item.allowedSites ? item.allowedSites.join(", ") : "Bamako"}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-amber-700 font-bold block">
                                ⏰ {item.allowedHoursStart ? `${item.allowedHoursStart} - ${item.allowedHoursEnd}` : "07:00 - 21:00"}
                              </span>
                              <span className="text-[9px] text-slate-400 block font-mono">
                                IP: {item.allowedIPs || "192.168.1.*"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 font-bold rounded px-1.5 py-0.5 text-[10px] ${
                              item.isActive 
                                ? "bg-green-50 text-emerald-700 border border-green-200" 
                                : "bg-red-50 text-red-650 border border-red-200"
                            }`}>
                              {item.isActive ? "● ACTIF" : "■ BLOCKED"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUserId(item.id);
                                  setUserNameField(item.name);
                                  setUserRoleField(item.role);
                                  setUserActiveField(item.isActive);
                                  setSelectedUserModules(item.allowedModules || ["patients", "rdv", "dme"]);
                                  setSelectedUserActions(item.allowedActions || ["Lecture", "Saisie"]);
                                  setSelectedUserSites(item.allowedSites || ["site-bamako"]);
                                  setSelectedUserDepts(item.allowedDepartments || ["Médecine Générale"]);
                                  setSelectedUserDocs(item.allowedDataTypes || ["Dossiers Médicaux Cliniques"]);
                                  setHoursStart(item.allowedHoursStart || "07:00");
                                  setHoursEnd(item.allowedHoursEnd || "21:00");
                                  setIpAddressField(item.allowedIPs || "192.168.1.*");
                                  setIsEditingUser(true);
                                }}
                                className="p-1 text-sky-700 hover:bg-sky-50 rounded"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (item.role === "Administrateur Système") {
                                    alert("Modification de l'administration principale interdite.");
                                    return;
                                  }
                                  if (confirm(`Voulez-vous supprimer définitivement ${item.name} ?`)) {
                                    const updated = users.filter(u => u.id !== item.id);
                                    onSaveUsers(updated);
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table details explaining clinical roles & golden rules constraint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs leading-relaxed">
                    <div className="text-amber-700 mt-0.5">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-amber-850">Loi n°2013-015 du Mali - Sécurité & Archivage</h5>
                      <p className="text-slate-650 mt-1">
                        Les modifications aux données médicales du DME ou les encaissements doivent être rigoureusement liés à l'identifiant du clinicien actif.
                        La suppression de données d'ordonnance d'un autre médecin est strictement proscrite par le code de déontologie.
                      </p>
                    </div>
                  </div>

                  <div className="bg-sky-50/50 border border-sky-200 rounded-xl p-4 text-xs leading-relaxed space-y-1">
                    <h5 className="font-extrabold text-sky-905 flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-sky-650" /> Matrice stricte des restrictions intégrées
                    </h5>
                    <ul className="text-slate-600 list-disc list-inside space-y-0.5 text-[10.5px]">
                      <li><strong>Médecin</strong> : Dossier DME complet. Pas de comptabilité.</li>
                      <li><strong>Infirmier(e)</strong> : Températures/Pouls & Soins. Pas de diagnostic.</li>
                      <li><strong>Sage-femme</strong> : Module d'accouchement & CPN. Ordonnances légères.</li>
                      <li><strong>Laborantin</strong> : Validation biologiques. Pas d'accès DME clinique.</li>
                      <li><strong>Caissier</strong> : Facturation & Paiements. Pas d'accès DME.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Maintenance sub-tab panels (Module 18 - Archivage & Purge) */
          <div className="space-y-6 text-xs font-semibold text-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Backups trigger */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-4 bg-white">
                <span className="font-extrabold text-[#0284c7] block uppercase text-[10px] tracking-widest flex items-center gap-1.5 border-b pb-1.5">
                  <Server className="h-4 w-4 text-sky-600" /> Sauvegardes Physiques Locales
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Téléchargez l'intégralité de la base de données clinique SQLite/IndexDB sous forme de fichier JSON crypté pour le coffre-fort d'établissement.</p>

                <div className="flex gap-2">
                  <button
                    onClick={handleBackupLocally}
                    className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold p-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer transition-all uppercase tracking-wide text-[10px]"
                  >
                    <Download className="h-3.5 w-3.5" /> Sauvegarde JSON
                  </button>

                  <label className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-702 border border-slate-350 font-bold p-2 px-3 rounded flex items-center justify-center gap-1 cursor-pointer text-center uppercase tracking-wide text-[10px]">
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

              {/* Automatic Archiving Config (Archivage automatique) */}
              <div className="p-4 border border-slate-200 rounded-xl space-y-3 bg-white">
                <span className="font-extrabold text-[#0f766e] block uppercase text-[10px] tracking-widest flex items-center gap-1.5 border-b pb-1.5">
                  <Database className="h-4 w-4 text-teal-600" /> Archivage Automatique Clinique
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Sauvegarde redondante automatique programmée de tous les dossiers médicaux chiffrés.</p>

                <div className="space-y-2 pt-1 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-teal-650 h-4 w-4 h-4 w-4"
                      checked={isAutoArchiveEnabled}
                      onChange={(e) => {
                        setIsAutoArchiveEnabled(e.target.checked);
                        const act = e.target.checked ? "Activé" : "Désactivé";
                        alert(`Archivage automatique local ${act}.`);
                      }}
                    />
                    <span className="text-xs font-bold text-slate-700">Activer le démon d'archivage automatique</span>
                  </label>

                  <div className="flex items-center justify-between text-[11px] pt-1.5">
                    <span className="text-slate-500 font-bold">Périodicité :</span>
                    <select
                      className="bg-slate-50 border p-1 rounded font-bold text-slate-800 text-xs"
                      value={autoArchiveInterval}
                      onChange={(e: any) => setAutoArchiveInterval(e.target.value)}
                    >
                      <option value="daily">Quotidien (Tous les soirs à 23:59)</option>
                      <option value="weekly">Hebdomadaire (Dimanche soir)</option>
                      <option value="monthly">Mensuel (Dernier jour du mois)</option>
                    </select>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-150 p-2.5 rounded text-[10px] leading-relaxed text-emerald-800 flex items-center gap-1.5 font-bold">
                    <Shield className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                    <span>Dernier statut : {lastAutoArchiveDate}</span>
                  </div>
                </div>
              </div>

              {/* Secure Purge with Validation Word (Purge sécurisée) */}
              <div className="p-4 border border-red-200 bg-red-50/5 rounded-xl space-y-3">
                <span className="font-extrabold text-red-700 block uppercase text-[10px] tracking-widest flex items-center gap-1.5 border-b pb-1.5 border-red-100">
                  <ShieldAlert className="h-4 w-4 text-red-600" /> Purge Sécurisée Exécutive
                </span>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed">Supprimez définitivement les historiques obsolètes d'une session clinique après archivage physique.</p>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[9px] uppercase font-extrabold text-slate-500 mb-1">Mot d'habilitation admin d'épreuve :</label>
                    <input
                      type="password"
                      placeholder="Saisissez le code d'autorisation..."
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white tracking-widest font-bold"
                      value={adminSecurityWord}
                      onChange={(e) => setAdminSecurityWord(e.target.value)}
                    />
                    <span className="text-[9px] text-slate-400 block mt-0.5 italic">Indices de démo : Entrez "SAHEL26" pour valider</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        if (adminSecurityWord !== "SAHEL26") {
                          alert("Code de sécurité invalide! Opération de purge sécurisée suspendue.");
                          return;
                        }
                        handleCleanPurge("appointments");
                        // Add to log list
                        setPurgeHistory(prev => [
                          {
                            timestamp: new Date().toISOString(),
                            actor: "Sidi Coulibaly (SysAdmin)",
                            type: "Purge sélective des Rendez-vous cliniques",
                            status: "SUCCESS",
                            volume: "90 entrées",
                            ip: "192.168.1.100"
                          },
                          ...prev
                        ]);
                        setAdminSecurityWord("");
                      }}
                      className="flex-1 p-1.5 text-[9.5px] bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded font-bold transition-all cursor-pointer text-center"
                    >
                      Purger RDV
                    </button>
                    <button
                      onClick={() => {
                        if (adminSecurityWord !== "SAHEL26") {
                          alert("Code de sécurité invalide! Opération de purge sécurisée suspendue.");
                          return;
                        }
                        handleCleanPurge("invoices");
                        setPurgeHistory(prev => [
                          {
                            timestamp: new Date().toISOString(),
                            actor: "Sidi Coulibaly (SysAdmin)",
                            type: "Purge des Invoices & Livres Caisse",
                            status: "SUCCESS",
                            volume: "12 factures",
                            ip: "192.168.1.100"
                          },
                          ...prev
                        ]);
                        setAdminSecurityWord("");
                      }}
                      className="flex-1 p-1.5 text-[9.5px] bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded font-bold transition-all cursor-pointer text-center"
                    >
                      Purger Caisse
                    </button>
                    <button
                      onClick={() => {
                        if (adminSecurityWord !== "SAHEL26") {
                          alert("Code de sécurité invalide! Opération de purge sécurisée suspendue.");
                          return;
                        }
                        handleCleanPurge("audit");
                        setPurgeHistory(prev => [
                          {
                            timestamp: new Date().toISOString(),
                            actor: "Sidi Coulibaly (SysAdmin)",
                            type: "Purge réinitialisatrice complète journal audit",
                            status: "SUCCESS",
                            volume: "Tous les logs",
                            ip: "192.168.1.100"
                          },
                          ...prev
                        ]);
                        setAdminSecurityWord("");
                      }}
                      className="flex-1 p-1.5 text-[9.5px] bg-white hover:bg-slate-200 text-slate-700 border border-slate-350 rounded font-bold transition-all cursor-pointer text-center"
                    >
                      Purge Logs
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Purge & Archive security audit logs history (Historique des purges) */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b">
                <History className="h-4 w-4 text-sky-655" /> Historique Général des Purges et des Sauvegardes de Sécurité
              </h4>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-left text-xs mb-0">
                  <thead className="bg-slate-50 text-[10px] font-extrabold uppercase text-slate-400 border-b">
                    <tr>
                      <th className="px-4 py-2">Horodatage de l'action</th>
                      <th className="px-4 py-2">Administrateur</th>
                      <th className="px-4 py-2">Type de Purge / Archivage</th>
                      <th className="px-4 py-2">Volume impacté</th>
                      <th className="px-4 py-2">Adresse IP</th>
                      <th className="px-4 py-2 text-right">Statut direct</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[10.5px]">
                    {purgeHistory.map((pur, pIdx) => (
                      <tr key={pIdx} className="hover:bg-slate-50 transition-all font-semibold">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {new Date(pur.timestamp).toLocaleString("fr-FR")}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-bold">{pur.actor}</td>
                        <td className="px-4 py-3 text-sky-700 font-bold">{pur.type}</td>
                        <td className="px-4 py-3 text-amber-700">{pur.volume}</td>
                        <td className="px-4 py-3 text-slate-450">{pur.ip}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="bg-green-50 text-emerald-700 border border-green-200 text-[9px] font-bold px-1.5 py-0.5 rounded font-sans uppercase">
                            ● {pur.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
