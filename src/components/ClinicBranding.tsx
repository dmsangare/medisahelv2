import React, { useState } from "react";
import { Settings, ShieldAlert, Check, Palette, ShieldCheck, ListTodo, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Clinic } from "../types.ts";

interface ClinicBrandingProps {
  token: string | null;
  clinic: Clinic;
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
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address || "");
  const [logoUrl, setLogoUrl] = useState(clinic.logoUrl || ""); // Used as Default Logo / logoUrl!
  const [currency, setCurrency] = useState(clinic.currency);
  const [themeColor, setThemeColor] = useState(clinic.themeColor);

  // Expanded Institutional Branding fields
  const [slogan, setSlogan] = useState(clinic.slogan || "");
  const [city, setCity] = useState(clinic.city || "");
  const [country, setCountry] = useState(clinic.country || "");
  const [phone, setPhone] = useState(clinic.phone || "");
  const [whatsapp, setWhatsapp] = useState(clinic.whatsapp || "");
  const [email, setEmail] = useState(clinic.email || "");
  const [website, setWebsite] = useState(clinic.website || "");
  const [licenseNumber, setLicenseNumber] = useState(clinic.licenseNumber || "");
  const [rccm, setRccm] = useState(clinic.rccm || "");
  const [ifuNif, setIfuNif] = useState(clinic.ifuNif || "");
  const [digitalStamp, setDigitalStamp] = useState(clinic.digitalStamp || "");
  const [instSignature, setInstSignature] = useState(clinic.instSignature || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  React.useEffect(() => {
    if (clinic) {
      setName(clinic.name);
      setAddress(clinic.address || "");
      setLogoUrl(clinic.logoUrl || "");
      setCurrency(clinic.currency);
      setThemeColor(clinic.themeColor);
      setSlogan(clinic.slogan || "");
      setCity(clinic.city || "");
      setCountry(clinic.country || "");
      setPhone(clinic.phone || "");
      setWhatsapp(clinic.whatsapp || "");
      setEmail(clinic.email || "");
      setWebsite(clinic.website || "");
      setLicenseNumber(clinic.licenseNumber || "");
      setRccm(clinic.rccm || "");
      setIfuNif(clinic.ifuNif || "");
      setDigitalStamp(clinic.digitalStamp || "");
      setInstSignature(clinic.instSignature || "");
    }
  }, [clinic]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          instSignature
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de sauvegarder la configuration");

      setSuccess("Configuration multi-clinique et signature systémique enregistrées avec succès !");
      onUpdateClinic(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const presetColors = [
    { name: "Saphir Clinique", hex: "#1e3b8a", bg: "bg-blue-900" }, // blue-900
    { name: "MédiSahel Ségou", hex: "#0f766e", bg: "bg-teal-700" }, // teal-700
    { name: "Polyclinique Mopti", hex: "#e11d48", bg: "bg-rose-600" }, // rose-600
    { name: "Urgences Sahel", hex: "#15803d", bg: "bg-green-700" }, // green-700
    { name: "Cosmic Charcoal", hex: "#334155", bg: "bg-slate-700" } // slate-700
  ];

  const availableModules = [
    { key: "patients", label: "Gestion des Patients" },
    { key: "dme", label: "Dossier Médical (DME)" },
    { key: "hospitalization", label: "Hospitalisation" },
    { key: "dmg", label: "Médecine Générale (DMG)" },
    { key: "billing", label: "Facturation & Caisse" },
    { key: "pharmacy", label: "Pharmacie & Stock" },
    { key: "lab", label: "Laboratoire" },
    { key: "presences", label: "Gestion des Présences" },
    { key: "payroll", label: "Gestion de la Paie" },
    { key: "appointments", label: "Agenda" },
    { key: "documents", label: "GECD Archive" },
    { key: "emailing", label: "Communication & Emailing" }
  ];

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

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="clinic-settings-card">
      <div className="p-6 border-b border-gray-100 flex items-start space-x-3">
        <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none">
            Paramètres Système & Signature Configurable
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Modifiez le branding global de l'établissement, la devise locale, la palette graphique active et configurez la signature par défaut.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-w-2xl" id="clinic-branding-form">
        {/* Alerts */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
            <ShieldAlert className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
            <Check className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dénomination Sociale de l'Établissement <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-medium"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Slogan ou Phrase d'Accueil Institutionnelle</label>
            <input
              type="text"
              value={slogan}
              onChange={e => setSlogan(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-medium"
              placeholder="e.g. Votre santé, notre engagement au quotidien"
            />
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Logo Officiel de la Clinique <span className="text-rose-500">*</span>
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              {/* Logo Preview Panel */}
              <div className="w-28 h-28 bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner relative">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo Clinique"
                    className="max-w-full max-h-full object-contain p-2"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-3 flex flex-col items-center text-slate-400">
                    <ImageIcon className="h-8 w-8 mb-1 text-slate-300" />
                    <span className="text-[9px] font-mono font-bold leading-tight">AUCUN LOGO</span>
                  </div>
                )}
              </div>

              {/* Upload controls */}
              <div className="flex-1 space-y-2 text-xs">
                <span className="font-semibold text-slate-700 block">Télécharger ou remplacer le logo</span>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Formats acceptés : PNG, JPG, JPEG, WEBP. Taille conseillée : carrée ou paysage compact (Max 2 Mo). Ce logo s'intégrera automatiquement dans les entêtes DME, examens de laboratoires, ordonnances, factures et hospitalisations.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <label className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] rounded-lg shadow-sm cursor-pointer border border-transparent select-none transition-colors">
                    <Upload className="h-3.5 w-3.5 mr-1 pb-0.5" />
                    Téléverser un logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            setError("L'image du logo ne doit pas dépasser 2 Mo.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setLogoUrl(event.target.result as string);
                              setSuccess("Nouveau logo sélectionné. Cliquez sur 'Enregistrer' en bas pour valider définitivement.");
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoUrl("");
                        setError("");
                        setSuccess("Logo supprimé de la configuration visuelle de l'établissement.");
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] rounded-lg cursor-pointer select-none transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Supprimer le logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">Ou spécifier une URL directe de logo :</span>
              <input
                type="text"
                value={logoUrl}
                onChange={e => setLogoUrl(e.target.value)}
                className="w-full h-9 px-3 py-1.5 bg-white border border-gray-250 rounded-lg focus:ring-1 focus:ring-teal-700 focus:outline-none text-[11px] font-mono text-slate-650"
                placeholder="https://ex.com/logo.png ou data:image/png;base64,..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse Géographique (Rue/Quartier)</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
              placeholder="e.g. Hamdallaye ACI 2000"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
              placeholder="e.g. Bamako"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Pays</label>
            <input
              type="text"
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
              placeholder="e.g. Mali"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Devise Monétaire Actuelle</label>
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
            >
              <option value="FCFA">Franc CFA (FCFA)</option>
              <option value="EUR">Euro (€)</option>
              <option value="USD">Dollar ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Téléphone Principal</label>
            <input
              type="text"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-medium"
              placeholder="e.g. +223 20 22 14 67"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp de l'Établissement</label>
            <input
              type="text"
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-medium"
              placeholder="e.g. +223 73 65 14 67"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail Officiel</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
              placeholder="e.g. contact@medisahel.ml"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Site Internet</label>
            <input
              type="text"
              value={website}
              onChange={e => setWebsite(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-mono"
              placeholder="e.g. www.medisahel.ml"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro d’Agrément de la Clinique</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={e => setLicenseNumber(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-mono"
              placeholder="e.g. AGR-2024-MS08-BKO"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">RCCM</label>
            <input
              type="text"
              value={rccm}
              onChange={e => setRccm(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-mono"
              placeholder="e.g. MA-BKO-2024-B-1240"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Identifiant Fiscal IFU / NIF</label>
            <input
              type="text"
              value={ifuNif}
              onChange={e => setIfuNif(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-mono"
              placeholder="e.g. NIF-084210457-H"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Signature Institutionnelle (Titulaire ou Titre par défaut)</label>
            <input
              type="text"
              value={instSignature}
              onChange={e => setInstSignature(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-medium text-teal-900"
              placeholder="e.g. Pour la Direction Médicale, le Médecin Chef"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cachet Numérique de l'Établissement (Mentions ou Représentation)</label>
            <textarea
              value={digitalStamp}
              onChange={e => setDigitalStamp(e.target.value)}
              rows={2}
              className="w-full p-3 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-xs font-mono"
              placeholder="e.g. [CACHET NUMÉRIQUE MÉDISAHEL CLINIQUE]"
            />
          </div>
        </div>

        {/* Color Palette customization */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700 flex items-center mb-1">
            <Palette className="h-4 w-4 mr-1 text-teal-600" />
            Thème Visuel Actif de la Clinique
          </label>
          <div className="flex flex-wrap gap-3">
            {presetColors.map(color => (
              <button
                key={color.hex}
                type="button"
                onClick={() => setThemeColor(color.hex)}
                className={`p-3.5 rounded-2xl flex items-center space-x-2 border transition-all pointer-events-auto cursor-pointer ${
                  themeColor === color.hex ? "border-slate-900 bg-slate-50" : "border-gray-200 hover:bg-slate-50"
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${color.bg}`} />
                <span className="text-xs font-medium text-gray-750">{color.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module Activation / Désactivation panel (Point 11 - persisté et géré) */}
        {userRole === "ADMIN" && onUpdateModuleStates && (
          <div className="pt-4 border-t border-gray-150 space-y-3" id="module-toggles-section">
            <label className="block text-xs font-semibold text-gray-750 flex items-center gap-2">
              <ListTodo className="h-4.5 w-4.5 text-teal-600 animate-pulse" />
              Console d'activation des Modules Fonctionnels par l'Administrateur
            </label>
            <p className="text-[11px] text-gray-500 font-sans leading-relaxed">
              Cochez les modules pour les rendre fonctionnels sur le réseau. Les modules décochés seront immédiatement masqués du panneau d'accès général pour l'ensemble des agents clinicien.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 border border-gray-200 rounded-2xl">
              {availableModules.map(m => {
                const isActive = moduleStates[m.key] !== false; // default true
                return (
                  <label key={m.key} className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-gray-150 hover:bg-slate-50 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={isActive}
                      onChange={() => toggleModule(m.key)}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-350 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-700">{m.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-semibold shadow-sm focus:outline-none transition-colors duration-150 cursor-pointer"
          >
            {loading ? "Mise à jour..." : "Enregistrer la Signature & le Branding"}
          </button>
        </div>
      </form>
    </div>
  );
};
