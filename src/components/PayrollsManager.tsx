import React, { useState, useEffect } from "react";
import { Banknote, FileText, Check, ShieldAlert, Users, Award, AlertCircle, Landmark } from "lucide-react";
import { User, Payroll, Attendance } from "../types.ts";

interface PayrollsManagerProps {
  token: string | null;
  currentUser: User;
  clinicThemeColor: string;
}

export const PayrollsManager: React.FC<PayrollsManagerProps> = ({ token, currentUser, clinicThemeColor }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Payroll form states
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
      // 1. Users Roster
      const rUsers = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (rUsers.ok) {
        const dUsers = await rUsers.json();
        setUsers(dUsers);
      }

      // 2. Attendances to feed paycheck deductions automatically!
      const rAtt = await fetch("/api/attendances", { headers: { Authorization: `Bearer ${token}` } });
      if (rAtt.ok) {
        const dAtt = await rAtt.json();
        setAttendances(dAtt);
      }

      // 3. Payrolls History
      const rPay = await fetch("/api/payrolls", { headers: { Authorization: `Bearer ${token}` } });
      if (rPay.ok) {
        const dPay = await rPay.json();
        setPayrolls(dPay);
      }
    } catch (err: any) {
      setError("Échec lors du chargement des modules de paie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRData();
  }, [token]);

  // Read guard shifts to sum bonuses automatically (Point 2 - automatisé)
  const loadGuardShiftBonusesForUser = (userId: string) => {
    try {
      const userObj = users.find(u => u.id === userId);
      if (!userObj) return 0;

      const cachedVisits = localStorage.getItem("dmg_work_shifts");
      if (cachedVisits) {
        const shifts = JSON.parse(cachedVisits);
        // Find isPaid = false or matching current users guard bonuses
        const userShifts = shifts.filter((s: any) => s.agentName === userObj.name && !s.bonusPaid);
        return userShifts.reduce((acc: number, cur: any) => acc + (cur.bonusCalculated || 0), 0);
      }
    } catch (err) {
      console.error(err);
    }
    return 0;
  };

  // Auto-fill form values dynamically based on employee selections to feed presence data to payroll real-time! (Rule 10)
  const handleUserChange = (userId: string) => {
    setPayrollUser(userId);
    if (!userId) return;

    // Calculate dynamic base salary suggestion based on role
    const selectedUser = users.find(u => u.id === userId);
    let baseSug = 350000;
    if (selectedUser?.role === "DOCTOR") baseSug = 550000;
    else if (selectedUser?.role === "MEDECIN_GENERAL_CHIEF") baseSug = 700000;
    else if (selectedUser?.role === "NURSE") baseSug = 300000;
    else if (selectedUser?.role === "PHARMACIST") baseSug = 400000;
    else if (selectedUser?.role === "LAB_TECH") baseSug = 350000;
    else if (selectedUser?.role === "STAGIAIRE") baseSug = 120000;
    else if (selectedUser?.role === "AIDE_SOIGNANT") baseSug = 180000;
    else if (selectedUser?.role === "ADMIN") baseSug = 600000;

    setPayrollBase(baseSug);

    // Dynamic absences deductions calculation (10,000 FCFA per absence recorded in attendances)
    const userAbsences = attendances.filter(att => att.userId === userId && att.status === "ABSENT").length;
    const userRetards = attendances.filter(att => att.userId === userId && att.status === "LATE").length;
    const presenceDeductions = (userAbsences * 15000) + (userRetards * 5000);
    setPayrollDeduction(presenceDeductions);

    // Dynamic guard shift bonus calculation feeding
    const activeGuardBonuses = loadGuardShiftBonusesForUser(userId);
    setPayrollBonus(activeGuardBonuses);
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

      if (!response.ok) throw new Error("Impossible de comptabiliser le bulletin.");

      // Set bonuses as integrated inside local storage to prevent redundancy
      const selectedUser = users.find(u => u.id === payrollUser);
      if (selectedUser) {
        const cachedVisits = localStorage.getItem("dmg_work_shifts");
        if (cachedVisits) {
          const shifts = JSON.parse(cachedVisits);
          const updatedShifts = shifts.map((s: any) => 
            s.agentName === selectedUser.name ? { ...s, bonusPaid: true } : s
          );
          localStorage.setItem("dmg_work_shifts", JSON.stringify(updatedShifts));
        }
      }

      // Write to AuditLog
      const selectedUserObj = users.find(u => u.id === payrollUser);
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "PAIE_BULLETIN",
          details: `Génération du bulletin de salaire pour ${selectedUserObj?.name} (Mois ${payrollMonth}/${payrollYear}) - Net: ${net.toLocaleString()} FCFA.`
        })
      });

      setSuccess("Le bulletin de salaire a été calculé et enregistré !");
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

      if (!response.ok) throw new Error("Mode de virement bancaire temporairement hors service.");

      // Write AuditLog
      const activePay = payrolls.find(p => p.id === id);
      const payRecipient = users.find(u => u.id === activePay?.userId)?.name || "Agent Hospitalier";
      await fetch("/api/auditlogs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "PAIE_RÈGLEMENT",
          details: `Règlement effectif du salaire de ${payRecipient} pour le mois ${activePay?.month}/${activePay?.year}`
        })
      });

      setSuccess("Ordre de virement émis avec succès. Statut : PAYÉ.");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.name : "Administrateur / Agent";
  };

  const getUserDetails = (id: string) => {
    return users.find(u => u.id === id);
  };

  return (
    <div className="space-y-6" id="payroll-module-view">
      {/* Visual Header */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex items-start space-x-4 shadow-sm">
        <div className="p-3 rounded-xl bg-teal-50 text-teal-700">
          <Banknote className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 leading-none">Gestion Financière de la Paie</h2>
          <p className="text-sm text-gray-500 mt-1">
            Calcul des salaires, primes d'indemnités, déduction d'absences automatiques issues du pointage et émission des bulletins certifiés de la clinique.
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        { (currentUser.role === "ADMIN" || currentUser.role === "HR") && (
          <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-1">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 flex items-center">
              <Landmark className="h-4.5 w-4.5 text-teal-600 mr-2" />
              Générer une Fiche de Paie
            </h3>

            <form onSubmit={handleCreatePayroll} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-gray-600 mb-1">Collaborateur bénéficiaire :</label>
                <select
                  value={payrollUser}
                  onChange={e => handleUserChange(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                >
                  <option value="">-- Sélectionner un collaborateur --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Salaire contractuel de base (FCFA) :</label>
                <input
                  type="number"
                  value={payrollBase}
                  onChange={e => setPayrollBase(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Primes de Garde / Heures Extras (FCFA) <span className="text-teal-600 italic font-medium">(Auto-alimenté)</span> :</label>
                <input
                  type="number"
                  value={payrollBonus}
                  onChange={e => setPayrollBonus(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 border border-teal-250 text-teal-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Retenues sur Absences et Retards (FCFA) <span className="text-red-600 italic font-medium">(Auto-déduit)</span> :</label>
                <input
                  type="number"
                  value={payrollDeduction}
                  onChange={e => setPayrollDeduction(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 py-2 bg-slate-50 border border-rose-250 text-rose-700 rounded-xl font-bold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-gray-500 text-[10px]">Mois d'Exercice</label>
                  <select
                    value={payrollMonth}
                    onChange={e => setPayrollMonth(parseInt(e.target.value))}
                    className="w-full h-9 px-2 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value={5}>Mai</option>
                    <option value={6}>Juin</option>
                    <option value={7}>Juillet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 text-[10px]">Année d'Exercice</label>
                  <select
                    value={payrollYear}
                    onChange={e => setPayrollYear(parseInt(e.target.value))}
                    className="w-full h-9 px-2 bg-white border border-gray-250 rounded-lg text-xs"
                  >
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 bg-teal-750 hover:bg-teal-850 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition-all shadow-sm"
              >
                Calculer & Enregistrer Bulletin
              </button>
            </form>
          </div>
        )}

        {/* List Column */}
        <div className={`bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 ${ (currentUser.role === "ADMIN" || currentUser.role === "HR") ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b pb-2 flex items-center">
            <FileText className="h-4.5 w-4.5 text-teal-600 mr-2" />
            Bulletins de Salaire Émis
          </h3>

          <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl overflow-hidden text-xs max-h-[400px] overflow-y-auto bg-white">
            {payrolls.length === 0 ? (
              <div className="p-6 text-center text-gray-400">Aucune fiche de paie rattachée à cet exercice.</div>
            ) : (
              payrolls.map(pay => (
                <div key={pay.id} className="p-3 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-gray-950 text-sm">{getUserName(pay.userId)}</div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">Calculé pour : Juin {pay.month}/{pay.year} - Net: <strong className="text-teal-700">{pay.netSalary.toLocaleString()} FCFA</strong></div>
                  </div>
                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      onClick={() => setActiveSlip(pay)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-gray-700 border border-gray-200 rounded-lg text-[10px] font-bold cursor-pointer"
                    >
                      Simulation Bulletin
                    </button>
                    {pay.status === "PENDING" && (currentUser.role === "HR" || currentUser.role === "ADMIN") ? (
                      <button
                        onClick={() => handlePayPayroll(pay.id)}
                        className="px-2.5 py-1.5 bg-teal-750 hover:bg-teal-850 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        Payer Salaire
                      </button>
                    ) : (
                      <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[10px] uppercase border border-emerald-150">RÉGLÉ</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pay Slip Modal */}
      {activeSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="payslip-modal">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-6 animate-fade-in my-8">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <span className="inline-flex px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] uppercase font-bold tracking-widest rounded">Simulation Officielle</span>
                <h3 className="font-sans font-black text-slate-900 text-sm uppercase">BULLETIN DE PAIE DE LA CLINIQUE</h3>
                <p className="text-[11px] text-gray-400">MédiSahel Clinique de Santé Privé - Mali</p>
              </div>
              <div className="font-sans font-bold text-lg text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                {activeSlip.netSalary.toLocaleString()} FCFA
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-gray-700 border-b pb-4">
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">COLLABORATEUR</span>
                <p className="font-bold text-slate-950 mt-1 uppercase">{getUserName(activeSlip.userId)}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{getUserDetails(activeSlip.userId)?.email}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">PERIODE DE PAIE</span>
                <p className="font-bold text-slate-900 mt-1">Mois {activeSlip.month} / {activeSlip.year}</p>
                <p className="text-emerald-700 font-bold text-[10px] mt-0.5 uppercase">TYPE: VIREMENT SYDONIA</p>
              </div>
            </div>

            {/* Wage Formulas lists */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Salaire contractuel de base</span>
                <span className="font-mono text-slate-800 font-semibold">{activeSlip.baseSalary.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Primes de garde clinical (auto-alimenté)</span>
                <span className="font-mono text-emerald-600 font-semibold">+{activeSlip.bonuses.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b pb-2">
                <span className="text-gray-500 font-medium">Deductions pour absences au pointage (auto-déduit)</span>
                <span className="font-mono text-rose-600 font-semibold">-{activeSlip.deductions.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm font-bold border-b border-double border-gray-300">
                <span className="text-slate-900 uppercase font-bold text-xs">Salaire Net Mensuel À Verser</span>
                <span className="font-mono text-teal-800 text-base">{activeSlip.netSalary.toLocaleString()} FCFA</span>
              </div>
            </div>

            <button
              onClick={() => setActiveSlip(null)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold leading-none cursor-pointer"
            >
              Fermer la Fiche
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
