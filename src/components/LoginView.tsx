import { useState, FormEvent } from "react";
import { Lock, User, Eye, EyeOff, Shield, Stethoscope, AlertCircle } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (token: string, user: any) => void;
  clinicName: string;
  slogan: string;
  primaryColor: string;
}

export default function LoginView({ onLoginSuccess, clinicName, slogan, primaryColor }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Identifiants invalides");
      }

      // Success! Pass token and user details to root state
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Impossible de se connecter au serveur d'authentification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 selection:bg-sky-500 selection:text-white" id="medishahel-security-gateway">
      {/* Background ambient light effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative" id="login-container-card">
        {/* Top visual brand banner */}
        <div className="p-8 text-center border-b border-slate-100 bg-slate-50 relative">
          <div className="mx-auto h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg mb-4" style={{ backgroundColor: primaryColor }}>
            <Stethoscope className="h-6 w-6" id="login-stethoscope-brand-icon" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{clinicName}</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Portail d'Accès Sécurisé V-2</p>
          <p className="text-[10px] text-slate-400 mt-1.5 italic max-w-xs mx-auto text-center">{slogan}</p>
          
          <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 uppercase">
            <Shield className="h-3 w-3" />
            <span>Zero-Trust Activé</span>
          </div>
        </div>

        {/* Input/form area */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4 font-sans text-xs">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl flex items-start gap-2.5 font-semibold text-xs leading-relaxed transition-all">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-slate-600 font-bold pl-0.5 uppercase tracking-wide text-[10px]">Identifiant Unique Utilisateur</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                required
                disabled={isLoading}
                placeholder="Ex: admin, dr_sangare, caiss_maiga"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-sky-500 focus:bg-white text-slate-800 font-semibold transition-all"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-0.5">
              <label className="block text-slate-600 font-bold uppercase tracking-wide text-[10px]">Mot de Passe Chiffré</label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                placeholder="Introduisez votre mot de passe d'accès"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 outline-none focus:border-sky-500 focus:bg-white text-slate-800 font-semibold transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full text-white py-3 rounded-xl font-bold uppercase tracking-wider shadow-md hover:opacity-95 cursor-pointer disabled:bg-slate-350 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-2 text-xs"
            style={{ backgroundColor: primaryColor }}
          >
            {isLoading ? (
              <>
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Validation d'autorisation en cours...</span>
              </>
            ) : (
              <span>S'authentifier sur MédiSahel 2</span>
            )}
          </button>
        </form>

        {/* Informational warning complying with Local Enterprise Security Guidelines */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[9px] text-slate-400 leading-normal font-sans tracking-wide">
          <p className="font-bold text-slate-500">CONFORMITÉ DU SYSTÈME D'INFORMATION MÉDICAL LOCAL (MALI)</p>
          <p className="mt-0.5">Données chiffrées en transit et au repos. Sessions limitées avec audit obligatoire.</p>
        </div>
      </div>

      {/* À propos de la solution */}
      <div className="mt-6 text-center text-[10.5px] text-slate-400 space-y-1 bg-slate-800/80 p-5 rounded-2xl border border-slate-700/60 max-w-md w-full font-sans shadow-xl">
        <p className="font-extrabold text-slate-200 tracking-wider text-[11px] uppercase">À propos de la solution</p>
        <p className="font-semibold text-slate-300 mt-1">Adama SANGARÉ</p>
        <p className="text-slate-300 font-medium">Consultant en Solutions Numériques et Formateur Support IT</p>
        <p className="font-bold text-sky-400 uppercase tracking-wide text-[9.5px]">MIT – Micro Informatique & Télécom</p>
        <p className="text-slate-300 text-[11px] mt-1.5 font-medium">
          Téléphone / WhatsApp : <span className="font-bold text-emerald-400">+223 73 65 14 67</span>
        </p>
        <p className="text-[9.5px] text-slate-400 pt-2 border-t border-slate-700/50 font-semibold">MédiSahel Clinique V2 – Système d’Information Sanitaire.</p>
      </div>
    </div>
  );
}
