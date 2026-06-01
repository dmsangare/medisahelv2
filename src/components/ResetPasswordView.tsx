import { useState, FormEvent } from "react";
import { Lock, Check, X, ShieldAlert, KeyRound, Loader2, ArrowRight } from "lucide-react";

interface ResetPasswordViewProps {
  username: string;
  onPasswordChanged: (newPassword: string) => void;
  onLogout: () => void;
  accentColor: string;
}

export default function ResetPasswordView({
  username,
  onPasswordChanged,
  onLogout,
  accentColor
}: ResetPasswordViewProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Criteria validation
  const minLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^a-zA-Z0-9]/.test(newPassword);
  const matches = newPassword === confirmPassword && confirmPassword !== "";

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial && matches;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username,
          oldPassword,
          newPassword
        })
      });

      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Une erreur s'est produite lors de la modification du mot de passe.");
      }

      setSuccess(true);
      setTimeout(() => {
        onPasswordChanged(newPassword);
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans" id="password-reset-gate">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all duration-300">
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header Banner */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 rounded-xl bg-amber-50 text-amber-600 items-center justify-center border border-amber-200">
              <ShieldAlert className="h-6 w-6 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Changement obligatoire du mot de passe</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Pour des raisons de conformité et de sécurité clinique, vous devez réinitialiser votre mot de passe provisoire avant d'accéder au dossier MédiSahel.
            </p>
          </div>

          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-xl text-center space-y-2 animate-fade-in">
              <Check className="h-8 w-8 text-emerald-500 mx-auto bg-emerald-100 p-1 rounded-full border border-emerald-200" />
              <h3 className="font-bold text-sm">Modification enregistrée !</h3>
              <p className="text-[11px] leading-relaxed text-emerald-700">
                Votre nouveau mot de passe a été scellé. Synchronisation et redirection vers le tableau de bord MédiSahel...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Display Errors if any */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-start gap-2 animate-shake">
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Old Password */}
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400">Mot de passe actuel (Provisoire)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Saisir votre mot de passe d'origine"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400">Nouveau mot de passe</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Choisir un mot de passe robuste"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[10.5px] uppercase tracking-wider font-extrabold text-slate-400 font-sans">Confirmation du mot de passe</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Saisir à nouveau le mot de passe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
                         {/* Security requirements list */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-slate-600">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Critères de sécurité requis :</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] font-medium">
                  {/* Length */}
                  <div className="flex items-center gap-1.5">
                    {minLength ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className={minLength ? "text-emerald-800 font-semibold" : ""}>Min. 8 caractères</span>
                  </div>

                  {/* Uppercase */}
                  <div className="flex items-center gap-1.5">
                    {hasUpper ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className={hasUpper ? "text-emerald-800 font-semibold" : ""}>Au moins 1 majuscule</span>
                  </div>

                  {/* Lowercase */}
                  <div className="flex items-center gap-1.5">
                    {hasLower ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className={hasLower ? "text-emerald-800 font-semibold" : ""}>Au moins 1 minuscule</span>
                  </div>

                  {/* Number */}
                  <div className="flex items-center gap-1.5">
                    {hasNumber ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className={hasNumber ? "text-emerald-800 font-semibold" : ""}>Au moins 1 chiffre</span>
                  </div>

                  {/* Special character */}
                  <div className="flex items-center gap-1.5">
                    {hasSpecial ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500 stroke-[3]" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-slate-300" />
                    )}
                    <span className={hasSpecial ? "text-emerald-800 font-semibold" : ""}>1 car. spécial (@#$...)</span>
                  </div>
                </div>           </div>

                <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Correspondance :</span>
                  <span className={`text-[10.5px] font-extrabold ${matches ? "text-emerald-700" : "text-rose-600"}`}>
                    {matches ? "✅ Conforme" : "❌ Non identique"}
                  </span>
                </div>
              </div>

              {/* Action row with security details */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-750 font-bold rounded-xl text-xs uppercase cursor-pointer transition-all border border-slate-200"
                >
                  Annuler & Quitter
                </button>
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="flex-primary flex-[2] py-2.5 px-4 font-bold text-white rounded-xl text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg text-center"
                  style={{ backgroundColor: isValid ? accentColor : "#cbd5e1" }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement...
                    </>
                  ) : (
                    <>
                      Validation <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
