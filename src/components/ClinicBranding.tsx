import React, { useState, useEffect } from "react";
import { 
  Settings, 
  ShieldAlert, 
  Check, 
  Palette, 
  Upload, 
  Image as ImageIcon, 
  Trash2, 
  Plus, 
  Edit2, 
  ChevronUp, 
  ChevronDown, 
  Award, 
  Building2, 
  FileText, 
  ListTodo, 
  Globe, 
  Save, 
  Undo2 
} from "lucide-react";
import { Clinic } from "../types.ts";

interface ClinicBrandingProps {
  token: string | null;
  clinic: Clinic | any;
  onUpdateClinic: (updated: Clinic) => void;
  userRole: string;
  moduleStates?: Record<string, boolean>;
  onUpdateModuleStates?: (updated: Record<string, boolean>) => void;
}

export const ClinicBranding: React.FC<ClinicBrandingProps> = ({ 
  token, 
  clinic, 
  onUpdateClinic, 
  userRole,
  moduleStates = {},
  onUpdateModuleStates
}) => {
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<"infos" | "apparence" | "documents" | "listes" | "systeme" | "roles">("infos");

  // Tab 1: Infos
  const [name, setName] = useState(clinic?.name || "");
  const [slogan, setSlogan] = useState(clinic?.slogan || "");
  const [address, setAddress] = useState(clinic?.address || "");
  const [city, setCity] = useState(clinic?.city || "");
  const [country, setCountry] = useState(clinic?.country || "");
  const [phone, setPhone] = useState(clinic?.phone || "");
  const [whatsapp, setWhatsapp] = useState(clinic?.whatsapp || "");
  const [email, setEmail] = useState(clinic?.email || "");
  const [website, setWebsite] = useState(clinic?.website || "");
  const [licenseNumber, setLicenseNumber] = useState(clinic?.licenseNumber || "");
  const [rccm, setRccm] = useState(clinic?.rccm || "");
  const [ifuNif, setIfuNif] = useState(clinic?.ifuNif || "");

  // Tab 2: Apparence
  const [logoUrl, setLogoUrl] = useState(clinic?.logoUrl || "");
  const [faviconUrl, setFaviconUrl] = useState(clinic?.faviconUrl || "💉");
  const [themeColor, setThemeColor] = useState(clinic?.themeColor || "#1E3A5F");
  const [secondaryColor, setSecondaryColor] = useState(clinic?.secondaryColor || "#2E8B57");
  const [accentColor, setAccentColor] = useState(clinic?.accentColor || "#E67E22");
  const [bgColor, setBgColor] = useState(clinic?.bgColor || "#F5F5F5");
  const [textColor, setTextColor] = useState(clinic?.textColor || "#333333");

  // Tab 3: Documents
  const [digitalStamp, setDigitalStamp] = useState(clinic?.digitalStamp || "");
  const [instSignature, setInstSignature] = useState(clinic?.instSignature || "");
  const [clinicalStamp, setClinicalStamp] = useState(clinic?.clinicalStamp || "");
  const [pdfHeader, setPdfHeader] = useState(clinic?.pdfHeader || "MÉDISAHEL CLINIQUE BAMAKO V2\nHamdallaye ACI 2000, Bamako");
  const [pdfFooter, setPdfFooter] = useState(clinic?.pdfFooter || "MédiSahel - Hamdallaye ACI 2000, Bamako – Tél : +223 73 65 14 67");

  // Tab 5: Système
  const [currency, setCurrency] = useState(clinic?.currency || "FCFA");
  const [timezone, setTimezone] = useState(clinic?.timezone || "Afrique/Bamako");
  const [dateFormat, setDateFormat] = useState(clinic?.dateFormat || "DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState(clinic?.timeFormat || "HH:MM");
  const [mainLanguage, setMainLanguage] = useState(clinic?.mainLanguage || "Français");
  const [secondLanguage, setSecondLanguage] = useState(clinic?.secondLanguage || "Bambara");

  // Tab 4: Listes Métiers
  const [departments, setDepartments] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [ethnies, setEthnies] = useState<string[]>([]);
  const [nationalities, setNationalities] = useState<string[]>([]);
  const [analysisTypes, setAnalysisTypes] = useState<string[]>([]);
  const [medicaments, setMedicaments] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [delayReasons, setDelayReasons] = useState<string[]>([]);

  // List CRUD helper states
  const [selectedListCat, setSelectedListCat] = useState<
    "departments" | "services" | "ethnies" | "nationalities" | "analysisTypes" | "medicaments" | "suppliers" | "delayReasons"
  >("departments");
  const [newItemText, setNewItemText] = useState("");
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tab 6: Pre-existing Roles & Functions
  const [roles, setRoles] = useState<any[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleLabel, setRoleLabel] = useState("");
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleLabel, setEditingRoleLabel] = useState("");
  const [roleError, setRoleError] = useState("");
  const [roleSuccess, setRoleSuccess] = useState("");

  // Sync state if initial changes
  useEffect(() => {
    if (clinic) {
      setName(clinic.name || "");
      setSlogan(clinic.slogan || "");
      setAddress(clinic.address || "");
      setCity(clinic.city || "");
      setCountry(clinic.country || "");
      setPhone(clinic.phone || "");
      setWhatsapp(clinic.whatsapp || "");
      setEmail(clinic.email || "");
      setWebsite(clinic.website || "");
      setLicenseNumber(clinic.licenseNumber || "");
      setRccm(clinic.rccm || "");
      setIfuNif(clinic.ifuNif || "");

      setLogoUrl(clinic.logoUrl || "");
      setFaviconUrl(clinic.faviconUrl || "💉");
      setThemeColor(clinic.themeColor || "#1E3A5F");
      setSecondaryColor(clinic.secondaryColor || "#2E8B57");
      setAccentColor(clinic.accentColor || "#E67E22");
      setBgColor(clinic.bgColor || "#F5F5F5");
      setTextColor(clinic.textColor || "#333333");

      setDigitalStamp(clinic.digitalStamp || "");
      setInstSignature(clinic.instSignature || "");
      setClinicalStamp(clinic.clinicalStamp || "");
      setPdfHeader(clinic.pdfHeader || `MÉDISAHEL CLINIQUE BAMAKO V2\nHamdallaye ACI 2000, Bamako`);
      setPdfFooter(clinic.pdfFooter || `MédiSahel - Hamdallaye ACI 2000, Bamako – Tél : +223 73 65 14 67`);

      setCurrency(clinic.currency || "FCFA");
      setTimezone(clinic.timezone || "Afrique/Bamako");
      setDateFormat(clinic.dateFormat || "DD/MM/YYYY");
      setTimeFormat(clinic.timeFormat || "HH:MM");
      setMainLanguage(clinic.mainLanguage || "Français");
      setSecondLanguage(clinic.secondLanguage || "Bambara");

      try {
        setDepartments(clinic.departmentsList ? JSON.parse(clinic.departmentsList) : ["Médecine Générale", "Chirurgie", "Pédiatrie", "Maternité / CPN", "Urgences"]);
      } catch (err) {
        setDepartments(["Médecine Générale", "Chirurgie", "Pédiatrie", "Maternité / CPN", "Urgences"]);
      }
      try {
        setServices(clinic.servicesList ? JSON.parse(clinic.servicesList) : ["Médecine Interne", "Urgences & Triage", "Gynécologie", "Pédiatrie", "Chirurgie Générale"]);
      } catch (err) {
        setServices(["Médecine Interne", "Urgences & Triage", "Gynécologie", "Pédiatrie", "Chirurgie Générale"]);
      }
      try {
        setEthnies(clinic.ethniesList ? JSON.parse(clinic.ethniesList) : ["Bambara", "Peulh", "Soninké", "Malinké", "Sénoufo", "Dogon", "Songhaï", "Bobo", "Bozo", "Minianka", "Tamasheq", "Arabe", "Kassonké", "Touareg", "Maure", "Somono", "Jakhanké", "Samogho", "Sorko"]);
      } catch (err) {
        setEthnies(["Bambara", "Peulh", "Soninké", "Malinké", "Sénoufo", "Dogon", "Songhaï", "Bobo", "Bozo", "Minianka", "Tamasheq", "Arabe", "Kassonké", "Touareg", "Maure", "Somono", "Jakhanké", "Samogho", "Sorko"]);
      }
      try {
        setNationalities(clinic.nationalitiesList ? JSON.parse(clinic.nationalitiesList) : ["Malienne", "Sénégalaise", "Ivoirienne", "Burkinabé", "Guinéenne", "Mauritanienne", "Algérienne", "Française"]);
      } catch (err) {
        setNationalities(["Malienne", "Sénégalaise", "Ivoirienne", "Burkinabé", "Guinéenne", "Mauritanienne", "Algérienne", "Française"]);
      }
      try {
        setAnalysisTypes(clinic.analysisTypesList ? JSON.parse(clinic.analysisTypesList) : ["NFS (Numération Formule Sanguine)", "Goutte Épaisse & TDR", "Glycémie à jeun", "ECBU (Urine)", "Bilan rénal (Urée/Créatinine)", "Widal et Félix", "Uricémie", "Cholestérol total"]);
      } catch (err) {
        setAnalysisTypes(["NFS (Numération Formule Sanguine)", "Goutte Épaisse & TDR", "Glycémie à jeun", "ECBU (Urine)", "Bilan rénal (Urée/Créatinine)", "Widal et Félix", "Uricémie", "Cholestérol total"]);
      }
      try {
        setMedicaments(clinic.medicamentsList ? JSON.parse(clinic.medicamentsList) : ["Coartem 20/120mg", "Amoxicilline 1g Sandoz", "Paracétamol 1g Biogaran", "Spasfon 80mg Lyoc", "Insuline Lantus Solostar", "Ibuprofène 400mg", "Ciprofloxacine 500mg"]);
      } catch (err) {
        setMedicaments(["Coartem 20/120mg", "Amoxicilline 1g Sandoz", "Paracétamol 1g Biogaran", "Spasfon 80mg Lyoc", "Insuline Lantus Solostar", "Ibuprofène 400mg", "Ciprofloxacine 500mg"]);
      }
      try {
        setSuppliers(clinic.suppliersList ? JSON.parse(clinic.suppliersList) : ["Laborex Mali", "Mali Pharma SA", "Ubipharm Mali", "Pharmacie Impériale Bamako"]);
      } catch (err) {
        setSuppliers(["Laborex Mali", "Mali Pharma SA", "Ubipharm Mali", "Pharmacie Impériale Bamako"]);
      }
      try {
        setDelayReasons(clinic.delayReasonsList ? JSON.parse(clinic.delayReasonsList) : ["Embouteillages pont de Bamako", "Panne de véhicule / Moto", "Problème familial d'urgence", "Consultation de nuit imprévue", "Pluie diluvienne"]);
      } catch (err) {
        setDelayReasons(["Embouteillages pont de Bamako", "Panne de véhicule / Moto", "Problème familial d'urgence", "Consultation de nuit imprévue", "Pluie diluvienne"]);
      }
    }
  }, [clinic]);

  // Apply real-time browser changes for favicon and root css variables
  useEffect(() => {
    if (faviconUrl) {
      const link: any = document.querySelector("link[rel~='icon']") || document.createElement("link");
      link.type = "image/x-icon";
      link.rel = "shortcut icon";
      link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${faviconUrl}</text></svg>`;
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    
    // Inject custom colors into root document to apply without reboot
    const root = document.documentElement;
    root.style.setProperty("--primary-color", themeColor);
    root.style.setProperty("--secondary-color", secondaryColor);
    root.style.setProperty("--accent-color", accentColor);
    root.style.setProperty("--bg-color", bgColor);
    root.style.setProperty("--text-color", textColor);
  }, [themeColor, secondaryColor, accentColor, bgColor, textColor, faviconUrl]);

  // Roles CRUD API
  const fetchRoles = async () => {
    if (!token) return;
    try {
      setRolesLoading(true);
      const res = await fetch("/api/roles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setRoles(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "roles") {
      fetchRoles();
    }
  }, [activeSubTab, token]);

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleLabel.trim()) return;
    setRoleError("");
    setRoleSuccess("");
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label: roleLabel.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la création");
      setRoleLabel("");
      setRoleSuccess("Nouveau rôle créé avec succès !");
      fetchRoles();
    } catch (err: any) {
      setRoleError(err.message);
    }
  };

  const handleUpdateRole = async (roleId: string) => {
    if (!editingRoleLabel.trim()) return;
    setRoleError("");
    setRoleSuccess("");
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ label: editingRoleLabel.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");
      setEditingRoleId(null);
      setEditingRoleLabel("");
      setRoleSuccess("Dénomination du rôle mise à jour.");
      fetchRoles();
    } catch (err: any) {
      setRoleError(err.message);
    }
  };

  const handleDeleteRole = async (roleId: string, label: string) => {
    if (!window.confirm(`Supprimer définitivement la fonction "${label}" ?`)) return;
    setRoleError("");
    setRoleSuccess("");
    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression");
      setRoleSuccess("Fonction supprimée avec succès.");
      fetchRoles();
    } catch (err: any) {
      setRoleError(err.message);
    }
  };

  const handleReorderRole = async (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= roles.length) return;
    
    const updatedRoles = [...roles];
    const temp = updatedRoles[idx];
    updatedRoles[idx] = updatedRoles[targetIdx];
    updatedRoles[targetIdx] = temp;

    updatedRoles.forEach((r, i) => {
      r.order = i + 1;
    });

    setRoles(updatedRoles);

    try {
      await Promise.all([
        fetch(`/api/roles/${updatedRoles[idx].id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ order: updatedRoles[idx].order })
        }),
        fetch(`/api/roles/${updatedRoles[targetIdx].id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ order: updatedRoles[targetIdx].order })
        })
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleModule = (moduleKey: string) => {
    if (!onUpdateModuleStates) return;
    const currentStatus = moduleStates[moduleKey] !== false; // defaults to true
    const updated = {
      ...moduleStates,
      [moduleKey]: !currentStatus
    };
    onUpdateModuleStates(updated);
    localStorage.setItem("medisahel_module_states", JSON.stringify(updated));
  };

  // Lists CRUD handlers
  const getActiveList = (): string[] => {
    switch (selectedListCat) {
      case "departments": return departments;
      case "services": return services;
      case "ethnies": return ethnies;
      case "nationalities": return nationalities;
      case "analysisTypes": return analysisTypes;
      case "medicaments": return medicaments;
      case "suppliers": return suppliers;
      case "delayReasons": return delayReasons;
      default: return [];
    }
  };

  const setActiveListValues = (updated: string[]) => {
    switch (selectedListCat) {
      case "departments": setDepartments(updated); break;
      case "services": setServices(updated); break;
      case "ethnies": setEthnies(updated); break;
      case "nationalities": setNationalities(updated); break;
      case "analysisTypes": setAnalysisTypes(updated); break;
      case "medicaments": setMedicaments(updated); break;
      case "suppliers": setSuppliers(updated); break;
      case "delayReasons": setDelayReasons(updated); break;
    }
  };

  const handleAddListItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const current = getActiveList();
    if (current.includes(newItemText.trim())) {
      alert("Cet élément figure déjà dans la liste.");
      return;
    }
    setActiveListValues([...current, newItemText.trim()]);
    setNewItemText("");
  };

  const handleDeleteListItem = (idx: number) => {
    const current = getActiveList();
    const updated = current.filter((_, i) => i !== idx);
    setActiveListValues(updated);
  };

  const handleStartEditListItem = (idx: number, val: string) => {
    setEditingItemIdx(idx);
    setEditingItemText(val);
  };

  const handleSaveEditListItem = () => {
    if (!editingItemText.trim()) return;
    const current = getActiveList();
    const updated = current.map((item, i) => i === editingItemIdx ? editingItemText.trim() : item);
    setActiveListValues(updated);
    setEditingItemIdx(null);
    setEditingItemText("");
  };

  const handleReorderListItem = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const current = getActiveList();
    if (targetIdx < 0 || targetIdx >= current.length) return;
    const updated = [...current];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setActiveListValues(updated);
  };

  // Master Save Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (userRole !== "ADMIN") {
      setError("Les permissions d'administration de l'établissement sont obligatoires.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/clinics/${clinic.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name, 
          address, 
          logoUrl, 
          currency, 
          themeColor,
          slogan,
          city,
          country,
          phone,
          whatsapp,
          email,
          website,
          licenseNumber,
          rccm,
          ifuNif,
          digitalStamp,
          instSignature,
          faviconUrl,
          secondaryColor,
          accentColor,
          bgColor,
          textColor,
          clinicalStamp,
          pdfHeader,
          pdfFooter,
          timezone,
          dateFormat,
          timeFormat,
          mainLanguage,
          secondLanguage,
          departmentsList: JSON.stringify(departments),
          servicesList: JSON.stringify(services),
          ethniesList: JSON.stringify(ethnies),
          nationalitiesList: JSON.stringify(nationalities),
          analysisTypesList: JSON.stringify(analysisTypes),
          medicamentsList: JSON.stringify(medicaments),
          suppliersList: JSON.stringify(suppliers),
          delayReasonsList: JSON.stringify(delayReasons)
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de sauvegarder la configuration");

      setSuccess("Toutes les améliorations visuelles, listes métiers, et configurations systèmes ont été enregistrées avec succès en base de données !");
      onUpdateClinic(data);
      setTimeout(() => setSuccess(""), 6000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const presetColors = [
    { name: "Saphir Clinique", hex: "#1e3a5f" },
    { name: "MédiSahel Ségou", hex: "#0f766e" },
    { name: "Polyclinique Mopti", hex: "#e11d48" },
    { name: "Urgences Sahel", hex: "#15803d" },
    { name: "Cosmic Slate", hex: "#334155" }
  ];

  const presetSecondaryColors = [
    { name: "Vert Émeraude", hex: "#2e8b57" },
    { name: "Teal Lumineux", hex: "#0d9488" },
    { name: "Rose Magenta", hex: "#db2777" },
    { name: "Turquoise Clinique", hex: "#06b6d4" },
    { name: "Gris Soft", hex: "#64748b" }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-150 shadow-sm overflow-hidden" id="clinic-settings-card">
      {/* Module Title */}
      <div className="p-6 border-b border-slate-100 flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-sans font-black text-xl text-slate-900 leading-none tracking-tight">
              ⚙️ PARAMÈTRES & BRANDING – MÉDISAHEL ENTERPRISE V3
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Gérez de manière centralisée et sans redémarrage l'identité visuelle de votre établissement hospitalier, signatures juridiques, métatables CRUD et configurations de localisation.
            </p>
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleSave}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap gap-1.5"
        >
          <Save className="h-4 w-4" />
          <span>{loading ? "Sauvegarde..." : "Enregistrer Tout"}</span>
        </button>
      </div>

      {/* Primary 5 Tabs Ribbon Bar */}
      <div className="bg-slate-50 border-b border-slate-150 px-6 py-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSubTab("infos")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === "infos"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <span>🏥 INFOS CLINIQUE</span>
        </button>
        
        <button
          type="button"
          onClick={() => setActiveSubTab("apparence")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === "apparence"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <span>🎨 APPARENCE</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("documents")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === "documents"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <span>📄 DOCUMENTS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("listes")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === "listes"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <span>⚙ LISTES MÉTIERS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("systeme")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSubTab === "systeme"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
          }`}
        >
          <span>🌍 SYSTEME & REGLES</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("roles")}
          className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer border border-dashed border-slate-350 ${
            activeSubTab === "roles"
              ? "bg-slate-800 text-white shadow-xs font-black"
              : "text-slate-505 hover:bg-slate-250 hover:text-slate-900"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>🏆 RÔLES (GOUVERNANCE)</span>
        </button>
      </div>

      {/* Global notifications */}
      <div className="px-6 pt-4">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center shadow-xs font-bold">
            <ShieldAlert className="h-5 w-5 mr-2 text-rose-650" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center shadow-xs font-bold">
            <Check className="h-5 w-5 mr-2 text-emerald-650 animate-bounce" />
            {success}
          </div>
        )}
      </div>

      {/* Render tab panel bodies */}
      <div className="p-6">
        {activeSubTab === "infos" ? (
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl" id="tab-infos-cl">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Building2 className="h-4.5 w-4.5 text-slate-800" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">🏥 FICHE INSTITUTIONNELLE DE LA CLINIQUE</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1.5">Nom de l'établissement hospitalier <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: MédiSahel Clinique Bamako V2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold mb-1.5">Slogan de la clinique </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={e => setSlogan(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-sm"
                  placeholder="Ex: Votre santé, notre engagement au quotidien"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Numéro fiscal / Agrément d'ouverture</label>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={e => setLicenseNumber(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-mono font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: AGR-2024-MS08-BKO"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">RCCM (Registre du Commerce et du Crédit Mobilier)</label>
                <input
                  type="text"
                  value={rccm}
                  onChange={e => setRccm(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-mono font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: MA-BKO-2024-B-1240"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Numéro IFU / NIF (Numéro d'Identification Fiscale)</label>
                <input
                  type="text"
                  value={ifuNif}
                  onChange={e => setIfuNif(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-mono font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: NIF-084210457-H"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">E-mail de contact officiel</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs text-slate-900 shadow-sm font-semibold"
                  placeholder="Ex: contact@medisahel.ml"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Téléphone d'accueil principal</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: +223 20 22 14 67"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Numéro WhatsApp d'assistance</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={e => setWhatsapp(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  placeholder="Ex: +223 73 65 14 67"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Adresse Géographique (Quartier/Rue/Porte)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs text-slate-900 shadow-sm"
                  placeholder="Ex: Hamdallaye ACI 2000"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Ville d'implantation</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs text-slate-900 shadow-sm"
                  placeholder="Ex: Bamako"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Pays</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs text-slate-900 shadow-sm font-semibold"
                  placeholder="Ex: Mali"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Site internet officiel</label>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-mono font-semibold text-slate-850 shadow-sm"
                  placeholder="Ex: www.medisahel.ml"
                />
              </div>
            </div>

            <div className="pt-4 flex border-t justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Sauvegarder les informations de contact
              </button>
            </div>
          </form>
        ) : activeSubTab === "apparence" ? (
          <div className="space-y-6 max-w-4xl" id="tab-apparence-cl">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Palette className="h-4.5 w-4.5 text-slate-800" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">🎨 IDENTITÉ GRAPHIQUE & PALETTE DE COULEURS</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column: Color picker configurations */}
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 border border-slate-205 rounded-xl space-y-3">
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-550 uppercase font-mono block">SÉLECTION DE LA PALETTE (5 COULEURS)</span>
                  
                  {/* Primaire */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Couleur Primaire (Hex, e.g., En-têtes, thèmes)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 outline-none font-mono font-bold uppercase text-slate-900"
                        value={themeColor}
                        onChange={(e) => setThemeColor(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Secondaire */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Couleur Secondaire (Hex, e.g., Actions primaires, boutons)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 outline-none font-mono font-bold uppercase text-slate-900"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Accent */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Couleur d'Accent (Hex, e.g., Alertes, badges requis)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 outline-none font-mono font-bold uppercase text-slate-900"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Fond */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Couleur de Fond (Hex, e.g., Cadres de travail)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 outline-none font-mono font-bold uppercase text-slate-900"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Texte */}
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Couleur des Textes (Hex)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        className="h-9 w-12 p-0.5 border border-slate-300 rounded-lg cursor-pointer"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                      />
                      <input
                        type="text"
                        className="flex-1 text-xs rounded-lg border border-slate-300 px-3 outline-none font-mono font-bold uppercase text-slate-900"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Preset pallets select helpers */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border p-3.5 rounded-lg space-y-1.5 text-xs">
                    <span className="font-extrabold text-slate-800">Thèmes Prédéfinis (Primaire)</span>
                    <div className="flex flex-col gap-1.5">
                      {presetColors.map(p => (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => setThemeColor(p.hex)}
                          className="flex items-center text-[11px] gap-1.5 font-bold p-1 hover:bg-slate-200/50 rounded text-slate-700 cursor-pointer"
                        >
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.hex }}></span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-50 border p-3.5 rounded-lg space-y-1.5 text-xs">
                    <span className="font-extrabold text-slate-800">Boutons / Actions (Secondaire)</span>
                    <div className="flex flex-col gap-1.5">
                      {presetSecondaryColors.map(p => (
                        <button
                          key={p.hex}
                          type="button"
                          onClick={() => setSecondaryColor(p.hex)}
                          className="flex items-center text-[11px] gap-1.5 font-bold p-1 hover:bg-slate-200/50 rounded text-slate-700 cursor-pointer"
                        >
                          <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: p.hex }}></span>
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Logo and Favicon + REAL-TIME EMBEDDED PREVIEW BANNER */}
              <div className="space-y-4">
                {/* Logo principal */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Logo principal de la clinique</span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner p-1 relative">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer border border-transparent select-none transition-colors">
                        <Upload className="h-3 w-3 mr-1" />
                        Choisir un fichier logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setLogoUrl(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="block text-[10px] font-bold text-rose-600 hover:underline hover:text-rose-700 text-left"
                      >
                        Retirer le logo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Ou URL d'image alternative :</label>
                    <input
                      type="text"
                      className="w-full text-[10.5px] font-mono border p-1 px-2 rounded bg-white text-slate-705 outline-none"
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="e.g. https://domain.ml/images/logo.png"
                    />
                  </div>
                </div>

                {/* Favicon de l'onget */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Favicon (Icône de l'onglet du navigateur)</span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Insérez un Emoji ou l'URL complète d'une icone (.ico/.png). L'icone du navigateur s'adaptera sans redémarrer le serveur.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-16 h-9 text-center text-lg border rounded-lg bg-white outline-none"
                      value={faviconUrl}
                      onChange={e => setFaviconUrl(e.target.value)}
                      placeholder="💉"
                    />
                    <input
                      type="text"
                      className="flex-1 text-xs font-mono border rounded-lg bg-white px-2.5 outline-none text-slate-700"
                      value={faviconUrl}
                      onChange={e => setFaviconUrl(e.target.value)}
                      placeholder="Saisissez un emoji (e.g. 🏥, 💉, 🩺)"
                    />
                  </div>
                </div>

                {/* REAL-TIME PREVIEW CONTAINER */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3 text-xs">
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase font-mono block">PREVIEW EN TEMPS RÉEL (CSS DYNAMIQUE)</span>
                  
                  {/* Real-time color boxes */}
                  <div className="bg-white p-2.5 rounded-lg border flex flex-wrap justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: themeColor }}></span> Primaire</span>
                    <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: secondaryColor }}></span> Secondaire</span>
                    <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: accentColor }}></span> Accent</span>
                    <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: bgColor }}></span> Fond</span>
                    <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: textColor }}></span> Texte</span>
                  </div>

                  {/* Complete Mini Interactive App Iframe Mockup card */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs transition-all" style={{ backgroundColor: bgColor }}>
                    <div className="p-2 flex items-center justify-between text-white" style={{ backgroundColor: themeColor }}>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{faviconUrl || "💉"}</span>
                        <span className="text-[10.5px] font-black uppercase text-white tracking-wider">{name || "MEDISHAHEL CENTRAL"}</span>
                      </div>
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: accentColor }}>BKO-01</span>
                    </div>

                    <div className="p-3.5" style={{ color: textColor }}>
                      <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70 mb-0.5">Slogan ou accroche</span>
                      <p className="text-[11px] italic font-medium leading-normal mb-3">"{slogan || "Votre santé, notre priorité"}"</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-white/80 p-2 border rounded-lg text-center flex flex-col justify-between">
                          <span className="text-[8px] text-slate-400 font-bold uppercase">Prestation Clinique</span>
                          <button type="button" className="mt-1 w-full text-[9px] font-extrabold text-white py-1 px-2 rounded-md shadow-xs cursor-pointer select-none transition-transform active:scale-95" style={{ backgroundColor: secondaryColor }}>
                            Enregistrer Admission
                          </button>
                        </div>
                        <div className="bg-white/80 p-2 border rounded-lg text-left flex flex-col justify-between gap-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase">Aiguillage d'urgence</span>
                          <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: accentColor }}></div>
                          <div className="h-1 w-1/2 bg-slate-200 rounded self-start"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex border-t justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Appliquer et sauvegarder la palette de couleurs
              </button>
            </div>
          </div>
        ) : activeSubTab === "documents" ? (
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl" id="tab-documents-cl">
            <div className="flex items-center space-x-2 border-b pb-2">
              <FileText className="h-4.5 w-4.5 text-slate-800" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">📄 IMPRESSIONS ET SIGNATURES MULTI-CLINIQUES</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-750 font-extrabold text-xs mb-1.5">Signataire par défaut du Registre GECD</label>
                  <input
                    type="text"
                    className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                    value={instSignature}
                    onChange={(e) => setInstSignature(e.target.value)}
                    placeholder="ex: Dr. Adama Sangaré, Promoteur Directeur Chef"
                  />
                </div>

                <div>
                  <label className="block text-slate-755 font-extrabold text-xs mb-1.5">Cachet papier ou mentions légales d’usage</label>
                  <textarea
                    rows={2}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-mono font-medium text-slate-900 shadow-sm"
                    value={digitalStamp}
                    onChange={(e) => setDigitalStamp(e.target.value)}
                    placeholder="ex: [CACHET OFFICIEL MÉDISAHEL CLINIQUE SAHEL BAMAKO]"
                  />
                </div>

                {/* Upload Cachet Clinique en image */}
                <div className="border border-slate-205 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">Cachet de la clinique (Image pour ordonnances / PDF)</span>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner p-1 relative">
                      {clinicalStamp ? (
                        <img src={clinicalStamp} alt="Cachet" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-[9px] font-bold text-slate-350 text-center uppercase tracking-tighter">Pas d'image</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] rounded-lg shadow-sm cursor-pointer border border-transparent select-none transition-colors">
                        <Upload className="h-3 w-3 mr-1" />
                        Choisir une image de cachet
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setClinicalStamp(r.result as string);
                              r.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setClinicalStamp("")}
                        className="block text-[10px] font-bold text-rose-600 hover:underline hover:text-rose-700 text-left"
                      >
                        Retirer l'image du cachet
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">URL d'image directe de signature cachet :</label>
                    <input
                      type="text"
                      className="w-full text-[10.5px] font-mono border p-1 px-2 rounded bg-white text-slate-705 outline-none"
                      value={clinicalStamp}
                      onChange={e => setClinicalStamp(e.target.value)}
                      placeholder="e.g. data:image/png;base64,..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-755 font-extrabold text-xs mb-1.5">En-tête PDF personnalisable (Texte libre / Libre-champs)</label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-semibold text-slate-800 shadow-sm leading-relaxed"
                    value={pdfHeader}
                    onChange={(e) => setPdfHeader(e.target.value)}
                    placeholder="MÉDISAHEL CLINIQUE BAMAKO V2&#10;Hamdallaye ACI 2000, Bamako – Tél : +223 73 65 14 67&#15;&#10;Agrément Ministère de la Santé N° 2024-MS-08"
                  />
                </div>

                <div>
                  <label className="block text-slate-755 font-extrabold text-xs mb-1.5">Pied de page PDF personnalisable (Texte libre)</label>
                  <textarea
                    rows={3}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-semibold text-slate-800 shadow-sm leading-relaxed"
                    value={pdfFooter}
                    onChange={(e) => setPdfFooter(e.target.value)}
                    placeholder="MédiSahel S.A. au capital de 10.000.000 FCFA – RC : MA-BKO-2024-B-1240 – NIF : 084210457-H"
                  />
                </div>
              </div>

              {/* Right Column: PDF Print Preview Box */}
              <div className="bg-slate-100 p-4 border border-slate-200 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-extrabold tracking-widest text-slate-600 uppercase font-mono block mb-2">APERÇU DE LA MISE EN PAGE PDF DES DOSSIERS DME</span>
                  
                  {/* Styled A4 sheet simulation */}
                  <div className="bg-white border text-black font-sans shadow-md p-6 workspace-pdf min-h-[420px] relative text-[11px] leading-relaxed select-text">
                    {/* Header border */}
                    <div className="flex justify-between items-start pb-3 border-b-2 border-slate-900">
                      <div className="flex items-center gap-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo preview" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 border flex items-center justify-center font-black text-[12px] text-slate-700">MS</div>
                        )}
                        <div className="text-[10px] font-bold whitespace-pre-line text-slate-900 leading-tight">
                          {pdfHeader || "MÉDISAHEL CLINIQUE BAMAKO V2"}
                        </div>
                      </div>
                      <div className="text-right text-[8.5px] text-slate-450 font-mono">
                        Date: {new Date().toLocaleDateString()}<br/>
                        Référence: ME-0482B
                      </div>
                    </div>

                    {/* Fake content container */}
                    <div className="my-6 space-y-4">
                      <div className="text-center font-bold text-xs uppercase tracking-wide underline text-slate-900 my-4">
                        BULLETIN D'EXAMEN DE LABORATOIRE
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[9.5px] p-2 bg-slate-50 border border-slate-150 rounded">
                        <div><strong>Patient:</strong> Diallo Oumar (Agréé)</div>
                        <div><strong>Médecin:</strong> Dr. Ibrahim TOURÉ</div>
                        <div><strong>N° Dossier:</strong> #BKO-8420-2</div>
                        <div><strong>Service:</strong> Urgences Médicales</div>
                      </div>

                      <div className="border border-slate-200 rounded overflow-hidden mt-3">
                        <table className="w-full text-left text-[9px]">
                          <thead className="bg-slate-150 border-b">
                            <tr>
                              <th className="p-1.5 font-bold">Prestation Demandée</th>
                              <th className="p-1.5 font-bold">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="p-1.5">Goutte Épaisse (GE) & TDR Paludisme</td>
                              <td className="p-1.5 text-emerald-700 font-bold">COMPLÉTÉ</td>
                            </tr>
                            <tr>
                              <td className="p-1.5">Numération Formule Sanguine (NFS)</td>
                              <td className="p-1.5 text-amber-700 font-bold">EN ATTENTE</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Stamp and signature segment */}
                    <div className="mt-8 flex justify-between items-center text-[10px] border-t pt-4">
                      <div className="text-left font-semibold text-slate-700">
                        {instSignature || "Le signataire habilité"}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-mono font-bold text-slate-400 block mb-1">Cachet de sortie :</span>
                        {clinicalStamp ? (
                          <img src={clinicalStamp} alt="Stamp" className="w-16 h-16 object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="p-1.5 border border-dashed text-[8px] font-mono text-slate-400 font-black">
                            {digitalStamp || "[CACHET SCIENTIFIQUE SAHEL]"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* PDF Footer border */}
                    <div className="absolute bottom-3 left-6 right-6 text-center border-t border-slate-200 pt-1.5 text-[8.5px] text-slate-400 font-medium">
                      {pdfFooter || "MédiSahel Clinique d'Entreprise, Bamako, Mali"}
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <span className="text-[10px] text-slate-400 font-bold italic block">Ce gabarit sert pour l'ensemble des exports PDF du DME.</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex border-t justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Appliquer et valider la signature & styles PDF
              </button>
            </div>
          </form>
        ) : activeSubTab === "listes" ? (
          <div className="space-y-6" id="tab-listes-cl">
            <div className="flex items-center space-x-2 border-b pb-2">
              <ListTodo className="h-4.5 w-4.5 text-slate-800" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">⚙ PARAMÉTRAGE DES LISTES ET MÉTIERS CLINIQUES</h3>
            </div>

            <p className="text-xs text-slate-550 leading-relaxed font-semibold">
              Permettez aux médecins, administrateurs et pharmaciens d'utiliser de manière fluide des champs pré-configurés pour la saisie de fiches d'admission, DME, laboratoires et stocks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Selector menu */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold tracking-wider text-slate-400 block uppercase">Listes Disponibles</span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden divide-y text-xs shadow-inner">
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("departments"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "departments" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>🏢 Départements</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "departments" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{departments.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("services"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "services" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>🩺 Services</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "services" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{services.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("ethnies"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "ethnies" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>🌍 Ethnies du Mali</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "ethnies" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{ethnies.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("nationalities"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "nationalities" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>🇲🇱 Nationalités</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "nationalities" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{nationalities.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("analysisTypes"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "analysisTypes" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>🧪 Types d'analyses</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "analysisTypes" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{analysisTypes.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("medicaments"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "medicaments" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>💊 Médicaments d'Officine</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "medicaments" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{medicaments.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("suppliers"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "suppliers" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>💊 Fournisseurs</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "suppliers" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{suppliers.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelectedListCat("delayReasons"); setEditingItemIdx(null); }}
                    className={`w-full text-left p-3 flex justify-between items-center font-bold cursor-pointer transition-all ${
                      selectedListCat === "delayReasons" ? "bg-slate-800 text-white" : "hover:bg-slate-200/50 text-slate-705 bg-white"
                    }`}
                  >
                    <span>⏱ Motifs de retard</span>
                    <span className="text-[10px] font-mono py-0.5 px-2 rounded bg-slate-100 text-slate-650" style={selectedListCat === "delayReasons" ? {color: "#94a3b8", backgroundColor: "#1e293b"} : {}}>{delayReasons.length}</span>
                  </button>
                </div>
              </div>

              {/* List Work area containing List editor and Add item interface */}
              <div className="md:col-span-2 space-y-4">
                <div className="border border-slate-201 rounded-xl p-4 bg-white shadow-soft text-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-widest block font-sans">
                      Contenu de la Liste → {selectedListCat === "departments" ? "🏢 Départements de l'établissement" : 
                                            selectedListCat === "services" ? "🩺 Services clinicien et hospitalier" : 
                                            selectedListCat === "ethnies" ? "🌍 Ethnies du Mali (19 ethnies)" : 
                                            selectedListCat === "nationalities" ? "🇲🇱 Nationalités" : 
                                            selectedListCat === "analysisTypes" ? "🧪 Types d'analyses de laboratoire" : 
                                            selectedListCat === "medicaments" ? "💊 Médicaments & Produits" : 
                                            selectedListCat === "suppliers" ? "💊 Partenaires & Fournisseurs" : "⏱ Motifs de Retard de Service"}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 p-0.5 px-2.5 rounded-lg">{getActiveList().length} éléments</span>
                  </div>

                  {/* Add form */}
                  <form onSubmit={handleAddListItem} className="flex gap-2 bg-slate-50 border p-3 rounded-xl">
                    <input
                      type="text"
                      className="flex-1 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-250 focus:outline-none focus:ring-1 focus:ring-slate-750 text-slate-800 rounded-lg placeholder-slate-400"
                      value={newItemText}
                      onChange={e => setNewItemText(e.target.value)}
                      placeholder="Saisir un nouvel élément à ajouter à la liste..."
                    />
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 border text-white font-bold text-xs rounded-lg select-none whitespace-nowrap cursor-pointer"
                    >
                      Ajouter
                    </button>
                  </form>

                  {/* Scrollable grid listing all contents */}
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 max-h-[380px] overflow-y-auto bg-white shadow-inner">
                    {getActiveList().map((item, idx) => {
                      const isEditing = editingItemIdx === idx;
                      return (
                        <div key={idx} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center space-x-2.5 flex-1 pr-4 min-w-0">
                            <span className="w-5 font-mono text-[10px] text-slate-350 font-black">#{idx + 1}</span>
                            {isEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  className="flex-1 text-xs p-1 px-2.5 bg-white border border-slate-300 rounded font-semibold text-slate-800"
                                  value={editingItemText}
                                  onChange={e => setEditingItemText(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEditListItem(); }}
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditListItem}
                                  className="text-[10px] font-bold text-emerald-650 hover:underline cursor-pointer"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingItemIdx(null)}
                                  className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-755 truncate">{item}</span>
                            )}
                          </div>

                          {/* Reordering and Actions button group */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Up & Down reordering buttons */}
                            <div className="flex border rounded-lg bg-slate-50 overflow-hidden text-slate-450 items-center">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleReorderListItem(idx, "up")}
                                className="p-1 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-30 cursor-pointer"
                                title="Monter de 1"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <span className="w-[1px] h-3 bg-slate-200"></span>
                              <button
                                type="button"
                                disabled={idx === getActiveList().length - 1}
                                onClick={() => handleReorderListItem(idx, "down")}
                                className="p-1 hover:text-slate-900 hover:bg-slate-200/50 disabled:opacity-30 cursor-pointer"
                                title="Descendre de 1"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>

                            {!isEditing && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditListItem(idx, item)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteListItem(idx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {getActiveList().length === 0 && (
                      <div className="p-8 text-center text-slate-400 font-bold">Cette liste ne dispose d'aucun élément actif actuellement.</div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100 flex items-center space-x-3 text-xs text-sky-900 font-semibold shadow-inner leading-relaxed">
                  <Undo2 className="h-5 w-5 flex-shrink-0 text-sky-700" />
                  <p>
                    <strong>IMPORTANT:</strong> Les modifications apportées ci-dessus ne sont appliquées au serveur ERP qu'après compression finale. Cliquez sur <strong>S'Enregistrer</strong> ou le bouton d'action vert ci-dessus pour confirmer.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex border-t justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Appliquer et sauvegarder l'ensemble des listes
              </button>
            </div>
          </div>
        ) : activeSubTab === "systeme" ? (
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl" id="tab-systeme-cl">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Globe className="h-4.5 w-4.5 text-slate-800" />
              <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">🌍 LOCALISATION SYSTÈME, FORMATS ET TRADUCTION</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Devise financière usuelle</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                >
                  <option value="FCFA">FCFA / Franc CFA de l'Afrique de l'Ouest (FCFA)</option>
                  <option value="EUR">Euro – Union Européenne (€)</option>
                  <option value="USD">Dollar Américain – USD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Fuseau horaire géolocalisé</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                >
                  <option value="Afrique/Bamako">Afrique/Bamako (UTC+00:00 - Par défaut Mali)</option>
                  <option value="Afrique/Abidjan">Afrique/Abidjan (UTC+00:00)</option>
                  <option value="Afrique/Dakar">Afrique/Dakar (UTC+00:00)</option>
                  <option value="Europe/Paris">Europe/Paris (UTC+01:00 / UTC+02:00 CET)</option>
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Format d'affichage des dates</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={dateFormat}
                  onChange={e => setDateFormat(e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (ex: 24/05/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (ex: 05/24/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD / Format standard ISO (ex: 2026-05-24)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Format d'affichage des heures</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={timeFormat}
                  onChange={e => setTimeFormat(e.target.value)}
                >
                  <option value="HH:MM">HH:MM (Format compact, ex: 14:30)</option>
                  <option value="HH:MM:SS">HH:MM:SS (Précision totale, ex: 14:30:15)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Langue administrative principale</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={mainLanguage}
                  onChange={e => setMainLanguage(e.target.value)}
                >
                  <option value="Français">Français (Saisie & Affichage national des DME)</option>
                  <option value="Anglais">English / Anglais (International standard)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Langue vernaculaire secondaire d'assistance</label>
                <select
                  className="w-full h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-bold text-slate-900 shadow-sm"
                  value={secondLanguage}
                  onChange={e => setSecondLanguage(e.target.value)}
                >
                  <option value="Bambara">Bambara (Mali Vernaculaire - Optionnel)</option>
                  <option value="Aucune">Aucune langue secondaire configurée</option>
                </select>
              </div>
            </div>

            {/* Active Modules Toggle inside V3 parameters */}
            {userRole === "ADMIN" && onUpdateModuleStates && (
              <div className="pt-6 border-t border-slate-150 space-y-4">
                <div className="flex items-center space-x-2">
                  <ListTodo className="h-4.5 w-4.5 text-slate-800 animate-pulse" />
                  <label className="text-xs font-extrabold text-slate-800 uppercase tracking-widest block">CONSOLE DE SÉCURITÉ : MODULES SANS REDÉMARRAGE</label>
                </div>
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                  Activez ou masquez instantanément les modules cliniques d'un simple clic pour l’ensemble des terminaux du réseau hospitalier sans interrompre les consultations en cours.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 border rounded-xl">
                  {[
                    { key: "patients", label: "Patients & Fiches Directes" },
                    { key: "dme", label: "Dossier Médical Électronique (DME)" },
                    { key: "hospitalization", label: "Hospitalisation & Perfs" },
                    { key: "dmg", label: "Médecine Générale (DMG)" },
                    { key: "billing", label: "Facturation & Wave/Orange Money" },
                    { key: "pharmacy", label: "Délivrance de Pharmacie" },
                    { key: "lab", label: "Biologie & Automates Lab" },
                    { key: "presences", label: "Registre & Retards RH" },
                    { key: "payroll", label: "Paie & Bulletins de salaires" },
                    { key: "appointments", label: "Calendrier Agenda d'actes" },
                    { key: "documents", label: "GECD Téléchargement docs" },
                    { key: "emailing", label: "Communication Emailer" }
                  ].map(m => {
                    const isActive = moduleStates[m.key] !== false;
                    return (
                      <label key={m.key} className="flex items-center space-x-2.5 bg-white p-2 text-[11px] font-bold rounded-lg border border-slate-150 hover:bg-slate-50 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isActive}
                          onChange={() => toggleModule(m.key)}
                          className="h-4.5 w-4.5 rounded text-slate-800 focus:ring-slate-500 border-slate-300 cursor-pointer"
                        />
                        <span className="text-slate-700">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-4 flex border-t justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Appliquer et sauvegarder la configuration système locale
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6" id="tab-roles-cl">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center space-x-2">
                <Award className="h-4.5 w-4.5 text-slate-800" />
                <h3 className="text-sm font-extrabold uppercase text-slate-800 tracking-wider">👮 GESTION SÉCURISÉE DES RÔLES ET STRUCTURE INSTITUTIONNELLE</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-extrabold">{roles.length} habilitations répertoriées</span>
            </div>

            {roleError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center shadow-xs font-bold">
                <ShieldAlert className="h-5 w-5 mr-2 text-rose-650" />
                {roleError}
              </div>
            )}
            {roleSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center shadow-xs font-bold">
                <Check className="h-5 w-5 mr-2 text-emerald-650" />
                {roleSuccess}
              </div>
            )}

            {/* Form to add role */}
            {userRole === "ADMIN" && (
              <form onSubmit={handleAddRole} className="bg-slate-50 p-4 border border-slate-205 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-4.5 w-4.5 text-slate-800" />
                  Créer un nouveau rôle d'accès
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Ex: Coordonnateur Médical, Surveillant de Maternité, Stagiaire..."
                    value={roleLabel}
                    onChange={e => setRoleLabel(e.target.value)}
                    className="flex-1 h-10 px-3 bg-white border border-slate-300 rounded-xl focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="h-10 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center whitespace-nowrap"
                  >
                    Ajouter le rôle
                  </button>
                </div>
              </form>
            )}

            {/* Roles checklist scroll box */}
            {rolesLoading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-bold">Chargement des registres d'habilitation...</div>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-150 overflow-hidden shadow-soft">
                {roles.map((r, idx) => {
                  const isEditing = editingRoleId === r.id;
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/50 transition-colors text-xs">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-slate-400 w-6">#{idx + 1}</span>
                        {isEditing ? (
                          <div className="flex items-center space-x-2 flex-1 max-w-md">
                            <input
                              type="text"
                              value={editingRoleLabel}
                              onChange={e => setEditingRoleLabel(e.target.value)}
                              className="h-8 px-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-800 focus:outline-none text-xs font-semibold flex-1"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateRole(r.id)}
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingRoleId(null)}
                              className="h-8 px-3 bg-slate-150 hover:bg-slate-250 text-slate-600 text-[11px] font-bold rounded-lg cursor-pointer"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <div className="truncate">
                            <div className="text-xs font-extrabold text-slate-805 truncate">{r.label}</div>
                            <div className="text-[9.5px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Code technique : {r.code}</div>
                          </div>
                        )}
                      </div>

                      {userRole === "ADMIN" && (
                        <div className="flex items-center space-x-2.5 flex-shrink-0">
                          {/* Order arrow keys */}
                          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 text-slate-450">
                            <button
                              type="button"
                              onClick={() => handleReorderRole(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 hover:text-slate-900 hover:bg-slate-150 disabled:opacity-30 disabled:pointer-events-none"
                              title="Monter d'un rang"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-[1px] h-3.5 bg-slate-250"></span>
                            <button
                              type="button"
                              onClick={() => handleReorderRole(idx, "down")}
                              disabled={idx === roles.length - 1}
                              className="p-1 hover:text-slate-900 hover:bg-slate-150 disabled:opacity-30 disabled:pointer-events-none"
                              title="Descendre d'un rang"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {!isEditing && (
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRoleId(r.id);
                                  setEditingRoleLabel(r.label);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                                title="Renommer la fonction"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {r.code !== "ADMIN" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRole(r.id, r.label)}
                                  className="p-1.5 text-slate-400 hover:text-rose-650 hover:bg-rose-50 rounded-lg cursor-pointer"
                                  title="Supprimer la fonction"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
