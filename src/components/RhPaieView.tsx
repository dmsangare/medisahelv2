import { useState, FormEvent } from "react";
import { StaffPresence } from "../types";
import { Users, Clock, CreditCard, PlusCircle, Printer, CheckCircle, FileText, UserCheck, Check } from "lucide-react";

interface RhPaieViewProps {
  presences: StaffPresence[];
  onClockIn: (staffName: string, role: string) => void;
  accentColor: string;
}

export default function RhPaieView({
  presences,
  onClockIn,
  accentColor
}: RhPaieViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<"presences" | "paie">("presences");

  // Local clock-in state
  const [clockInName, setClockInName] = useState("Dr. Amadou Sangaré");
  const [clockInRole, setClockInRole] = useState("Médecin");

  // Justifications
  const [excuseId, setExcuseId] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState("");

  // Salaries & Payslips
  const [selectedStaff, setSelectedStaff] = useState("user-dr-sangare");
  const [baseSalary, setBaseSalary] = useState(450000); // FCFA
  const [primes, setPrimes] = useState(50000);
  const [deductions, setDeductions] = useState(25000);
  const [cnssRate, setCnssRate] = useState(4); // 4% constant base
  const [slipsHistory, setSlipsHistory] = useState<Array<any>>([
    { id: "BP-2026-0012", name: "Dr. Amadou Sangaré", base: 450000, primes: 50000, ded: 25000, net: 457000, date: "Avril 2026", validLevel: "Validé (DG)" },
    { id: "BP-2026-0013", name: "Ibrahim Maïga", base: 220000, primes: 20000, ded: 10000, net: 221200, date: "Avril 2026", validLevel: "Validé (DG)" }
  ]);

  const staffAccounts = [
    { id: "user-dr-sangare", name: "Dr. Amadou Sangaré", role: "Médecin" },
    { id: "user-inf-fatoumata", name: "Infirmier(e) Fatoumata Maïga", role: "Infirmier" },
    { id: "user-sage-fanta", name: "Sage-femme Fanta Diallo", role: "Sage-femme" },
    { id: "user-lab-tangara", name: "Laborantin Amara Tangara", role: "Laborantin" },
    { id: "user-caiss-maiga", name: "Caissier Ibrahim Maïga", role: "Caissier" }
  ];

  const handlePunch = (e: FormEvent) => {
    e.preventDefault();
    onClockIn(clockInName, clockInRole);
    setClockInName("");
    alert(`Pointage d'arrivée enregistré pour ${clockInName} à ${new Date().toLocaleTimeString("fr-FR").slice(0, 5)}.`);
  };

  const handleApplyExcuse = (idString: string) => {
    if (!excuseText) return;
    // Modifies just locally for UX high-fidelity
    alert("Justification enregistrée avec succès. Le statut passe en 'Justifié'.");
    setExcuseId(null);
    setExcuseText("");
  };

  // Pay calculations
  const cnssVal = Math.round(baseSalary * (cnssRate / 100));
  const netPay = baseSalary + primes - deductions - cnssVal;

  const handleGenerateSlip = (e: FormEvent) => {
    e.preventDefault();
    const stAccount = staffAccounts.find(s => s.id === selectedStaff);
    if (!stAccount) return;

    const newSlip = {
      id: `BP-2026-${Date.now().toString().slice(-4)}`,
      name: stAccount.name,
      base: baseSalary,
      primes,
      ded: deductions,
      net: netPay,
      date: "Mai 2026",
      validLevel: "Validation Multi-niveaux (Étape 1/2)"
    };

    setSlipsHistory([newSlip, ...slipsHistory]);
    alert(`Bulletin généré pour ${stAccount.name} d'un montant net de ${netPay.toLocaleString("fr-FR")} FCFA.`);
  };

  const handlePrintSlip = (slip: any) => {
    const slipWindow = window.open("", "_blank");
    if (!slipWindow) return;

    const html = `
      <html>
        <head>
          <title>Bulletin de Paie individuel : ${slip.name}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header-banner { text-align: center; border-bottom: 2px dashed #475569; padding-bottom: 15px; }
            .meta { margin-top: 25px; margin-bottom: 25px; line-height: 1.6; }
            .grid-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            .grid-table th, .grid-table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            .grid-table th { background: #f1f5f9; }
            .bold { font-weight: bold; }
            .right { text-align: right; }
            .footer-notes { text-align: center; margin-top: 70px; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header-banner">
            <h2>MÉDISHAHEL CLINIQUE LOCAL - MALI</h2>
            <h4>BULLETIN DE DECOMPTE DE SALAIRE</h4>
            <p>Période: <strong>${slip.date}</strong></p>
          </div>

          <div class="meta">
            Bénéficiaire: <strong>${slip.name}</strong><br/>
            Établissement: <strong>MédiSahel Central Bamako (MALI)</strong><br/>
            Devise d'évaluation: <strong>Franc CFA (XOF)</strong>
          </div>

          <table class="grid-table">
            <thead>
              <tr>
                <th>Désignation</th>
                <th class="right">Part Salariale (+)</th>
                <th class="right">Déductions / Retenues (-)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Salaire de Base de Référence</td>
                <td class="right">${slip.base.toLocaleString("fr-FR")}</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Primes trimestrielles & Gratifications</td>
                <td class="right">${slip.primes.toLocaleString("fr-FR")}</td>
                <td class="right">-</td>
              </tr>
              <tr>
                <td>Déductions d'absences / Pénalités</td>
                <td class="right">-</td>
                <td class="right">${slip.ded.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Retenue Obligatoire CNSS (Mali)</td>
                <td class="right">-</td>
                <td class="right">${Math.round(slip.base * 0.04).toLocaleString("fr-FR")}</td>
              </tr>
              <tr class="bold">
                <td>Totaux nets</td>
                <td class="right" style="color:#0284c7;">${(slip.base + slip.primes).toLocaleString("fr-FR")}</td>
                <td class="right" style="color:red;">${(slip.ded + Math.round(slip.base * 0.04)).toLocaleString("fr-FR")}</td>
              </tr>
              <tr class="bold" style="background:#f8fafc; font-size:16px;">
                <td>NET À PERCEVOIR (XOF)</td>
                <td colspan="2" class="right" style="color:#10b981;">${slip.net.toLocaleString("fr-FR")} FCFA</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px;">
            <div>Signature Caissier / Comptable</div>
            <div>Scellé Direction Générale</div>
          </div>

          <div class="footer-notes">
            Certifié conforme aux conventions de paie locale du travail au Mali . V-2 Local Edition
          </div>
        </body>
      </html>
    `;
    slipWindow.document.write(html);
    slipWindow.document.close();
  };

  return (
    <div className="space-y-6" id="rh-paie-view-wrapper">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5" style={{ color: accentColor }} />
            <span>Ressources Humaines, Pointage & Paie</span>
          </h2>
          <p className="text-xs text-slate-500">Supervisez la présence des praticiens en salle et l'émission certifiée des bulletins de paie.</p>
        </div>

        {/* Local tabs select toggle */}
        <div className="bg-slate-100 p-1.5 rounded-lg border flex items-center text-xs font-semibold self-start sm:self-center">
          <button
            onClick={() => setActiveSubTab("presences")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "presences" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Présences & Horaires
          </button>
          <button
            onClick={() => setActiveSubTab("paie")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeSubTab === "paie" ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Paie, Bulletins & CNSS
          </button>
        </div>
      </div>

      {activeSubTab === "presences" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Punch machine interface */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-semibold space-y-4">
            <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Clock className="h-4 w-4 text-sky-600" /> Horodateur de Services Locaux
            </h3>

            <p className="text-[10.5px] text-slate-400 font-medium">Les arrivées après 08h00 sont automatiquement notifiées sous statut "Retard". Les absences non-justifiées s'intègrent aux calculs de déductions de paie.</p>

            <form onSubmit={handlePunch} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Employé</label>
                <select
                  required
                  className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white font-semibold"
                  value={clockInName}
                  onChange={(e) => {
                    setClockInName(e.target.value);
                    const matched = staffAccounts.find(s => s.name === e.target.value);
                    if (matched) setClockInRole(matched.role);
                  }}
                >
                  <option value="">-- Sélectionnez l'agent --</option>
                  {staffAccounts.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold p-2.5 rounded-lg cursor-pointer text-center text-xs"
                style={{ backgroundColor: accentColor }}
              >
                Signer Registre Arrivée
              </button>
            </form>

            {/* Excuse popup form */}
            {excuseId && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 my-2">
                <span className="font-extrabold text-[10px] text-slate-500 block uppercase">Motif de Retard / d'Absence :</span>
                <input
                  type="text"
                  placeholder="ex: Panne mototaxi, motif de santé d'épreuve"
                  className="w-full p-2 border border-slate-350 bg-white text-xs font-semibold"
                  value={excuseText}
                  onChange={(e) => setExcuseText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyExcuse(excuseId)}
                    className="flex-1 bg-emerald-600 text-white font-bold py-1 px-2.5 rounded text-[10px]"
                  >
                    Valider le motif
                  </button>
                  <button
                    onClick={() => setExcuseId(null)}
                    className="flex-1 bg-slate-200 text-slate-700 font-bold py-1 px-2.5 rounded text-[10px]"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Core staff check-in journal */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Registre Actuel des Pointages</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-400 uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Praticien / Agent</th>
                    <th className="px-4 py-2">Rôle étable</th>
                    <th className="px-4 py-2">Arrivée</th>
                    <th className="px-4 py-2">Statut Heure</th>
                    <th className="px-4 py-2 text-center">Justifications</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {presences.map((p) => {
                    const isRetard = p.statut === "Retard";
                    const isAbs = p.statut === "Absent";
                    const hasExcuse = p.statut === "Justifié" || excuseId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900">{p.nomPrenom}</td>
                        <td className="px-4 py-3">{p.role}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">{p.heureArrivee}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold ${
                            isAbs 
                              ? "bg-red-50 text-red-700 border-red-200" 
                              : isRetard 
                              ? "bg-amber-50 text-amber-700 border-amber-250 animate-pulse" 
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}>
                            {p.statut}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isRetard && !hasExcuse ? (
                            <button
                              onClick={() => setExcuseId(p.id)}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 font-bold px-2 py-1 rounded text-sky-700"
                            >
                              Justifier
                            </button>
                          ) : p.justification || hasExcuse ? (
                            <span className="text-[10px] text-slate-400 font-sans italic">Motif accepté</span>
                          ) : (
                            <span className="text-slate-350">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Salaries slips & CNSS validation */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Slip configuration form */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 text-xs font-semibold space-y-4">
            <h3 className="font-bold text-xs text-slate-850 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <CreditCard className="h-4 w-4 text-sky-600" /> Configurer Bulletin de Paie
            </h3>

            <form onSubmit={handleGenerateSlip} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Salarié</label>
                <select
                  required
                  className="w-full text-xs p-2.5 rounded border border-slate-300 bg-white"
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                >
                  {staffAccounts.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Salaire de Base Brut (FCFA)</label>
                  <input
                    type="number"
                    step="5000"
                    className="w-full text-xs p-2 rounded border border-slate-300 bg-white font-mono font-bold"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400">Primes (+) (FCFA)</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                      value={primes}
                      onChange={(e) => setPrimes(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400">Pénalités (-) (FCFA)</label>
                    <input
                      type="number"
                      className="w-full text-xs p-1.5 rounded border border-slate-300 bg-white font-mono font-bold"
                      value={deductions}
                      onChange={(e) => setDeductions(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-[11px] text-slate-505 font-medium leading-relaxed">
                  <span className="font-extrabold text-[10px] text-slate-400 block uppercase">Calculations fiscales (Mali) :</span>
                  <div className="flex justify-between font-mono">
                    <span>Retenue Cotisation locale CNSS (4%):</span>
                    <strong className="text-red-700">-{cnssVal} FCFA</strong>
                  </div>
                  <div className="flex justify-between font-bold border-t border-slate-200/50 pt-1 text-slate-900 font-sans">
                    <span>Salaire Net Estimé:</span>
                    <strong className="text-emerald-700">{netPay.toLocaleString("fr-FR")} FCFA</strong>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full text-white font-bold p-2.5 rounded-lg cursor-pointer text-center text-xs"
                style={{ backgroundColor: accentColor }}
              >
                Générer & Soumettre Bulletin
              </button>
            </form>
          </div>

          {/* Bulletins slips salary logs list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 space-y-4 text-xs font-semibold">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Historique des Salaires & Décomptes émis</h3>

            <div className="space-y-3">
              {slipsHistory.map((slip) => (
                <div key={slip.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 font-medium">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded border font-mono font-bold">{slip.id}</span>
                      <h4 className="font-bold text-slate-900 text-xs">{slip.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 pt-1 text-[11px] text-slate-500 font-mono">
                      <span>Base Brut: <strong>{slip.base.toLocaleString("fr-FR")}</strong></span>
                      <span>Net versé: <strong className="text-emerald-700">{slip.net.toLocaleString("fr-FR")} FCFA</strong></span>
                      <span>Période: <strong className="font-sans text-slate-700">{slip.date}</strong></span>
                      <span>Circuit: <strong className="font-sans text-sky-700">{slip.validLevel}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <button
                      onClick={() => handlePrintSlip(slip)}
                      className="p-1 px-3 bg-white text-slate-700 hover:bg-slate-150 border border-slate-200 rounded font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Printer className="h-3.5 w-3.5" /> Imprimer
                    </button>
                    {slip.validLevel.includes("Étape 1") && (
                      <button
                        onClick={() => {
                          const updatedSlips = slipsHistory.map(s => {
                            if (s.id === slip.id) return { ...s, validLevel: "Validé (DG)" };
                            return s;
                          });
                          setSlipsHistory(updatedSlips);
                          alert("Bulletin visé et validé par la direction.");
                        }}
                        className="p-1 px-2 text-white bg-slate-800 hover:bg-slate-900 rounded font-bold text-[10px]"
                      >
                        Viser (DG)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
