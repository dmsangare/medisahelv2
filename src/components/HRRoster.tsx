import React, { useState, useEffect } from "react";
import { Users, FileText, Calendar, Check, ShieldAlert, Award, AlertCircle, Clock, Banknote, Landmark, CheckCircle, ChevronDownSquare } from "lucide-react";
import { User, Attendance, Payroll } from "../types.ts";

interface HRRosterProps {
  token: string | null;
  currentUser: User;
  clinicThemeColor: string;
}

export const HRRoster: React.FC<HRRosterProps> = ({ token, currentUser, clinicThemeColor }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pointage state
  const [pointageStatus, setPointageStatus] = useState<"PRESENT" | "LATE" | "ABSENT">("PRESENT");
  const [pointageReason, setPointageReason] = useState("");
  const [pointageUser, setPointageUser] = useState("");

  // Payroll form state
  const [payrollUser, setPayrollUser] = useState("");
  const [payrollBase, setPayrollBase] = useState(350000);
  const [payrollBonus, setPayrollBonus] = useState(0);
  const [payrollDeduction, setPayrollDeduction] = useState(0);
  const [payrollMonth, setPayrollMonth] = useState(6);
  const [payrollYear, setPayrollYear] = useState(2026);

  // Selected Pay Slip for simulated Modal
  const [activeSlip, setActiveSlip] = useState<Payroll | null>(null);

  const fetchHRData = async () => {
    setLoading(true);
    try {
      // Users Roster
      const rUsers = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      const dUsers = await rUsers.json();
      setUsers(dUsers);

      // Attendances
      const rAtt = await fetch("/api/attendances", { headers: { Authorization: `Bearer ${token}` } });
      const dAtt = await rAtt.json();
      setAttendances(dAtt);

      // Payrolls
      const rPay = await fetch("/api/payrolls", { headers: { Authorization: `Bearer ${token}` } });
      const dPay = await rPay.json();
      setPayrolls(dPay);
    } catch (err: any) {
      setError("Échec lors du chargement des modules RH.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [token]);

  const handlePointage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const targetUser = pointageUser || currentUser.id;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    try {
      const response = await fetch("/api/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: targetUser,
          date: now.toISOString().split("T")[0],
          checkIn: timeStr,
          status: pointageStatus,
          reason: pointageReason
        })
      });
      if (!response.ok) throw new Error("Impossible d'enregistrer le pointage.");
      setSuccess("Pointage de présence enregistré avec succès.");
      setPointageReason("");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!payrollUser) {
      setError("Veuillez sélectionner un employé.");
      return;
    }

    const net = payrollBase + payrollBonus - payrollDeduction;

    try {
      const response = await fetch("/api/payrolls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: payrollUser,
          month: payrollMonth,
          year: payrollYear,
          baseSalary: payrollBase,
          bonuses: payrollBonus,
          deductions: payrollDeduction,
          netSalary: net,
          status: "PENDING"
        })
      });
      if (!response.ok) throw new Error("Méthode de calcul échouée.");
      setSuccess("Fiche de salaire générée avec succès !");
      setPayrollUser("");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePayPayroll = async (id: string) => {
    try {
      const response = await fetch(`/api/payrolls/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "PAID",
          payDate: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error("Mode de paiement indisponible.");
      setSuccess("Ordre de virement bancaire émis. Etat: Payé.");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.name : "Administrateur";
  };

  const getUserDetails = (id: string) => {
    return users.find(u => u.id === id);
  };

  return (
    <div className="space-y-6" id="hr-management-dashboard">
      {/* Visual Header */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex items-start space-x-4 shadow-sm">
        <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none">Ressources Humaines & Roster Clinique</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pointages de présence quotidiens, retards à justifier, gestion de la paie et éditions des bulletins de salaire du personnel hospitalier.
          </p>
        </div>
      </div>

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

      {/* Grid 2 Columns: Attendances & Payroll */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATTENDANCE WORKFLOW CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center border-b pb-2">
            <Clock className="h-5 w-5 text-teal-600 mr-2" />
            Enregistrement & Contrôle des Présences (Pointage)
          </h3>

          <form onSubmit={handlePointage} className="space-y-4 bg-slate-50 p-4 rounded-xl border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enregistrer pour :</label>
                <select
                  value={pointageUser}
                  onChange={e => setPayrollUser(e.target.value)} // target pointing
                  defaultValue={currentUser.id}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-lg text-xs"
                >
                  <option value={currentUser.id}>Moi-même ({currentUser.name})</option>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Statut Présence :</label>
                <select
                  value={pointageStatus}
                  onChange={e => setPointageStatus(e.target.value as any)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-lg text-xs"
                >
                  <option value="PRESENT">Heure ponctuelle (Présent)</option>
                  <option value="LATE">Retard (Arrivée décalée)</option>
                  <option value="ABSENT">Absence signalée</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Justification si Retard / Motif :</label>
              <input
                type="text"
                value={pointageReason}
                onChange={e => setPointageReason(e.target.value)}
                placeholder="Indiquez la raison clinique ou de transport..."
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-lg text-xs focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-center bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold leading-none cursor-pointer"
            >
              Soumettre le Pointage
            </button>
          </form>

          {/* ATTENDANCE ROSTER BOARD */}
          <div className="space-y-2 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Journal des Pointages du Jour</h4>
            <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
              {attendances.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Pas de pointage pour aujourd'hui.</div>
              ) : (
                attendances.map(att => (
                  <div key={att.id} className="p-3 bg-white hover:bg-slate-50 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-900">{getUserName(att.userId)}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">Date: {att.date} à {att.checkIn || "--:--"}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {att.status === "PRESENT" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-100 text-emerald-800">Présent</span>
                      ) : att.status === "LATE" ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-800" title={att.reason || ""}>Retard</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-rose-800">Absent</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* PAYROLL CARD */}
        <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center border-b pb-2">
            <Banknote className="h-5 w-5 text-teal-600 mr-2" />
            Salaires, Primes & Bulletins de Paie
          </h3>

          {(currentUser.role === "HR" || currentUser.role === "ADMIN") && (
            <form onSubmit={handleCreatePayroll} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-gray-100 text-xs">
              <h4 className="font-bold text-[10px] text-gray-500 uppercase tracking-widest">Calculateur de Bulletin Mensuel</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Employé bénéficiaire :</label>
                  <select
                    value={payrollUser}
                    onChange={e => setPayrollUser(e.target.value)}
                    className="w-full h-9 px-2.5 py-1 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value="">-- Choisir un agent --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Salaire contractuel de base (FCFA) :</label>
                  <input
                    type="number"
                    value={payrollBase}
                    onChange={e => setPayrollBase(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 py-1 bg-white border border-gray-250 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Primes / Heures extras (FCFA) :</label>
                  <input
                    type="number"
                    value={payrollBonus}
                    onChange={e => setPayrollBonus(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 py-1 bg-white border border-gray-250 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Retenues absences (FCFA) :</label>
                  <input
                    type="number"
                    value={payrollDeduction}
                    onChange={e => setPayrollDeduction(parseInt(e.target.value) || 0)}
                    className="w-full h-9 px-2.5 py-1 bg-white border border-gray-250 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold leading-none cursor-pointer"
                >
                  Générer le Bulletin de Paie
                </button>
              </div>
            </form>
          )}

          {/* ROSTER SLIPS */}
          <div className="space-y-2 mt-4 text-xs">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fiches de Paie Émises</h4>
            <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {payrolls.length === 0 ? (
                <div className="p-4 text-center text-gray-400">Aucune fiche de paie rattachée à cet exercice.</div>
              ) : (
                payrolls.map(pay => (
                  <div key={pay.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-gray-900">{getUserName(pay.userId)}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">Calculé pour : Mois {pay.month}/{pay.year} - Net: <strong className="text-teal-700">{pay.netSalary.toLocaleString()} FCFA</strong></div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setActiveSlip(pay)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 border border-gray-200 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Afficher Bulletin (Simulation)
                      </button>
                      {pay.status === "PENDING" && (currentUser.role === "HR" || currentUser.role === "ADMIN") ? (
                        <button
                          onClick={() => handlePayPayroll(pay.id)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Régler
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase">Régler</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PAY SLIP SIMULATION MODAL */}
      {activeSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="payslip-modal">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-6 animate-fade-in my-8">
            {/* Header branding simulation */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <span className="inline-flex px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] uppercase font-bold tracking-widest rounded">Simulation Officielle</span>
                <h3 className="font-sans font-black text-slate-900 text-base uppercase">BULLETIN DE PAIE DU PERSONNEL</h3>
                <p className="text-[11px] text-gray-400">MédiSahel Clinique de Santé Privé - Mali</p>
              </div>
              <div className="font-sans font-bold text-lg text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                {activeSlip.netSalary.toLocaleString()} FCFA
              </div>
            </div>

            {/* Recipient Roster */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-gray-700 border-b pb-4">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">COLLABORATEUR</span>
                <p className="font-bold text-slate-950 mt-1 uppercase">{getUserName(activeSlip.userId)}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{getUserDetails(activeSlip.userId)?.email}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">EXERCICE DE BASE</span>
                <p className="font-bold text-slate-900 mt-1">Mois de {activeSlip.month} / {activeSlip.year}</p>
                <p className="text-emerald-700 font-bold text-[10px] mt-0.5 uppercase">BANQUE: VIREMENT BCEAO</p>
              </div>
            </div>

            {/* Wage Formulas lists */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Salaire contractuel de base</span>
                <span className="font-mono text-slate-800 font-semibold">{activeSlip.baseSalary.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Primes de garde, heures supplémentaires, indemnités</span>
                <span className="font-mono text-emerald-600 font-semibold">+{activeSlip.bonuses.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b pb-2">
                <span className="text-gray-500 font-medium">Retenues sur salaires, jours d'absences injustifiées</span>
                <span className="font-mono text-rose-600 font-semibold">-{activeSlip.deductions.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-bold border-b border-double border-gray-300">
                <span className="text-slate-900 uppercase">Salaire Net À Verser</span>
                <span className="font-mono text-teal-800 text-base">{activeSlip.netSalary.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2">
              <p>ID Slip: {activeSlip.id}</p>
              <button
                onClick={() => {
                  alert("Simulation d'impression PDF déclenchée ! Document d'homologation sociale validé.");
                }}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
              >
                Imprimer Bulletin simulation
              </button>
            </div>

            <button
              onClick={() => setActiveSlip(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold leading-none cursor-pointer"
            >
              Fermer l'aperçu du bulletin
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
