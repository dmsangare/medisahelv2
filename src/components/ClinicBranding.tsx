import React, { useState } from "react";
import { Settings, ShieldAlert, Check, Palette, Landmark, ShieldCheck } from "lucide-react";
import { Clinic } from "../types.ts";

interface ClinicBrandingProps {
  token: string | null;
  clinic: Clinic;
  onUpdateClinic: (updated: Clinic) => void;
  userRole: string;
}

export const ClinicBranding: React.FC<ClinicBrandingProps> = ({ token, clinic, onUpdateClinic, userRole }) => {
  const [name, setName] = useState(clinic.name);
  const [address, setAddress] = useState(clinic.address || "");
  const [logoUrl, setLogoUrl] = useState(clinic.logoUrl || ""); // Used as Default Signature designation!
  const [currency, setCurrency] = useState(clinic.currency);
  const [themeColor, setThemeColor] = useState(clinic.themeColor);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
        body: JSON.stringify({ name, address, logoUrl, currency, themeColor })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de sauvegarder la configuration");

      setSuccess("Configuration multi-clinique et signature systémique enregistrées !");
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Signature du Médecin / Directeur par défaut <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={logoUrl}
              onChange={e => setLogoUrl(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm font-semibold text-teal-950"
              placeholder="e.g. Dr. Adama Sangaré"
            />
            <p className="text-[10px] text-gray-400 mt-1">Remplacera tout élément de signature codé en dur au nom d'un médecin spécifique.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Adresse Géographique</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Devise monétaire d'affichage</label>
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
        </div>

        {/* Color Palette customization */}
        <div className="space-y-2">
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
