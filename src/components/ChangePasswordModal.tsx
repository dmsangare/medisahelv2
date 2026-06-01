import React, { useState } from "react";
import { KeyRound, ShieldAlert, Check } from "lucide-react";

interface ChangePasswordModalProps {
  token: string | null;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ token, onSuccess }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Veuillez renseigner tous les champs de sécurité.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le nouveau mot de passe doit comporter au moins 6 caractères pour des raisons de sécurité clinique.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors du changement de mot de passe.");
      }

      setSuccess("Mot de passe mis à jour avec archivage immédiat de la traçabilité. Redirection...");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto" id="change-password-overlay">
      <div className="bg-white max-w-md w-full rounded-2xl border border-gray-150 shadow-2xl p-8 space-y-6 animate-fade-in my-8" id="change-password-card">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="font-sans font-black text-xl text-slate-900 tracking-tight">Régénération Obrigatoire du Mot de passe</h2>
          <p className="text-xs text-gray-500 leading-relaxed font-sans font-medium px-4">
            Pour des raisons de conformité réglementaire de l'établissement, vous devez modifier votre mot de passe provisoire avant d'accéder aux dossiers cliniques.
          </p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start leading-snug">
            <ShieldAlert className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start leading-snug">
            <Check className="h-4 w-4 mr-2 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans font-medium">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Mot de passe provisoire actuel</label>
            <input
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-rose-500 text-sm focus:outline-none"
              placeholder="Saisir votre mot de passe provisoire"
            />
          </div>

          <div className="h-px bg-gray-100" />

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5">Nouveau mot de passe de sécurité</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-rose-500 text-sm focus:outline-none"
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:ring-1 focus:ring-rose-500 text-sm focus:outline-none"
              placeholder="Ressaisir à l'identique"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold font-mono tracking-wider shadow-md uppercase transition-all duration-150 cursor-pointer"
          >
            {loading ? "Chiffrement en cours..." : "Confirmer le Nouveau Mot de Passe"}
          </button>
        </form>
      </div>
    </div>
  );
};
