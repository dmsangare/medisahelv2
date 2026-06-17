import React, { useState, useEffect } from "react";
import { 
  Banknote, FileText, Check, ShieldAlert, Users, Award, 
  AlertCircle, Landmark, ShieldCheck, Download, Plus, Trash2, 
  UserCheck, ClipboardList, PenTool, Printer
} from "lucide-react";
import { User, Payroll, Attendance } from "../types.ts";
import { exportToExcel, exportToPDF } from "../utils/exportUtils";

interface PayrollsManagerProps {
  token: string | null;
  currentUser: User;
  clinicThemeColor: string;
}

interface Stagiaire {
  id: string;
  name: string;
  department: string;
  service: string;
  startDate: string;
  endDate: string;
  school: string;
  tutor: string;
  justificationType: string; // Convention de stage, Certificat de stage, Attestation de présence
  documentName: string;
  isCertified: boolean;
  indemnity: number;
}

interface CoordonneesBancaires {
  userId: string;
  bankName: string;
  guichetCode: string;
  accountNumber: string;
  ribKey: string;
  iban: string;
}

export const PayrollsManager: React.FC<PayrollsManagerProps> = ({ token, currentUser, clinicThemeColor }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Sub-tabs: "paie" (Salaires standard) | "stagiaires" (Stagiaires & attestations)
  const [payrollSubTab, setPayrollSubTab] = useState<"paie" | "stagiaires">("paie");

  // Payroll form states
  const [payrollUser, setPayrollUser] = useState("");
  const [payrollBase, setPayrollBase] = useState(350000);
  const [payrollBonus, setPayrollBonus] = useState(0);
  const [payrollDeduction, setPayrollDeduction] = useState(0);
  const [payrollMonth, setPayrollMonth] = useState(6);
  const [payrollYear, setPayrollYear] = useState(2026);
  
  // New payment details states
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "VIREMENT" | "CHEQUE">("VIREMENT");
  const [bankDetails, setBankDetails] = useState({
    bankName: "BDM-SA (Banque de Développement du Mali)",
    guichetCode: "00115",
    accountNumber: "00012345678",
    ribKey: "88"
  });

  // Selected Pay Slip for simulated Modal
  const [activeSlip, setActiveSlip] = useState<any | null>(null);

  // -------------------------------------------------------------
  // PART A : STAGIAIRES MODULE STATE & CONFIGURATION
  // -------------------------------------------------------------
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>(() => {
    try {
      const saved = localStorage.getItem("medisahel_stagiaires");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "stg-1",
        name: "Awa Touré",
        department: "Laboratoire",
        service: "Hématologie",
        startDate: "2026-03-01",
        endDate: "2026-08-31",
        school: "INFS (Institut National de Formation en Sciences de la Santé de Bamako)",
        tutor: "Dr. Fatoumata Maïga",
        justificationType: "Convention de stage",
        documentName: "convention_signee_infs_2026.pdf",
        isCertified: true,
        indemnity: 30000
      },
      {
        id: "stg-2",
        name: "Moussa Keïta",
        department: "Pharmacie",
        service: "Distribution de stock",
        startDate: "2026-04-15",
        endDate: "2026-07-15",
        school: "FMPH (Faculté de Médecine et de Pharmacie de Bamako)",
        tutor: "Ibrahim Maïga",
        justificationType: "Attestation de présence",
        documentName: "",
        isCertified: false,
        indemnity: 0
      }
    ];
  });

  const [selectedStagiaireId, setSelectedStagiaireId] = useState<string>("stg-1");
  const activeStagiaire = stagiaires.find(s => s.id === selectedStagiaireId) || stagiaires[0];

  // Forms for adding/saving stagiaires
  const [stagiaireForm, setStagiaireForm] = useState<Partial<Stagiaire>>({
    name: "",
    department: "Laboratoire",
    service: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    school: "",
    tutor: "",
    justificationType: "Convention de stage",
    documentName: "",
    isCertified: false,
    indemnity: 30000
  });

  // Load backend rosters
  const fetchHRData = async () => {
    setLoading(true);
    try {
      // 1. Users Roster
      const rUsers = await fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } });
      if (rUsers.ok) {
        const dUsers = await rUsers.json();
        setUsers(dUsers);
      }

      // 2. Attendances
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

  // IBAN Auto-Calculation Helper
  const calculateIban = (bank: string, guichet: string, account: string, rib: string) => {
    // Standard format for Mali bank details (ML15 + short code combination)
    const shortBankCode = bank.split(" ")[0].replace(/[^A-Z0-9]/g, "").slice(0, 5);
    return `ML15 ${shortBankCode} ${guichet || "00000"} ${account || "00000000000"} ${rib || "00"}`;
  };

  const calculatedIbanVal = calculateIban(
    bankDetails.bankName,
    bankDetails.guichetCode,
    bankDetails.accountNumber,
    bankDetails.ribKey
  );

  // Read guard shifts to sum bonuses automatically (Point 2 - automatisé)
  const loadGuardShiftBonusesForUser = (userId: string) => {
    try {
      const userObj = users.find(u => u.id === userId);
      if (!userObj) return 0;

      const cachedVisits = localStorage.getItem("dmg_work_shifts");
      if (cachedVisits) {
        const shifts = JSON.parse(cachedVisits);
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

    // Calculate dynamic base salary suggest based on role
    const selectedUser = users.find(u => u.id === userId);
    let baseSug = 350000;
    if (selectedUser?.role === "DOCTOR") baseSug = 550000;
    else if (selectedUser?.role === "MEDECIN_GENERAL_CHIEF") baseSug = 700000;
    else if (selectedUser?.role === "NURSE") baseSug = 300000;
    else if (selectedUser?.role === "PHARMACIST") baseSug = 400000;
    else if (selectedUser?.role === "LAB_TECH") baseSug = 350000;
    else if (selectedUser?.role === "STAGIAIRE") baseSug = 50000;
    else if (selectedUser?.role === "AIDE_SOIGNANT") baseSug = 180000;
    else if (selectedUser?.role === "ADMIN") baseSug = 600000;

    setPayrollBase(baseSug);

    // Dynamic absences deductions calculation (15,000 FCFA per absence, 5,000 per late)
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
      setError("Veuillez sélectionner un collaborateur.");
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
          status: "PENDING",
          // Extra billing fields
          paymentMethod,
          bankName: paymentMethod === "VIREMENT" ? bankDetails.bankName : null,
          guichetCode: paymentMethod === "VIREMENT" ? bankDetails.guichetCode : null,
          accountNumber: paymentMethod === "VIREMENT" ? bankDetails.accountNumber : null,
          ribKey: paymentMethod === "VIREMENT" ? bankDetails.ribKey : null,
          iban: paymentMethod === "VIREMENT" ? calculatedIbanVal : null
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
          action: "PAIE_BULLETIN_VIREMENT",
          details: `Génération d'un bulletin (${paymentMethod}) pour ${selectedUserObj?.name}. Net: ${net.toLocaleString()} FCFA.`
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

      if (!response.ok) throw new Error("Mode de paiement temporairement hors service.");

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
          details: `Déchargement financier effectif pour ${payRecipient} (${activePay?.month}/${activePay?.year})`
        })
      });

      setSuccess("Ordre financier réglé de classe 1 émis avec succès !");
      fetchHRData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getUserName = (id: string) => {
    const found = users.find(u => u.id === id);
    return found ? found.name : "Agent Hospitalier";
  };

  const getUserDetails = (id: string) => {
    return users.find(u => u.id === id);
  };

  const getDepartmentForUser = (userId: string) => {
    const userObj = users.find(u => u.id === userId);
    if (!userObj) return "Médecine Générale";
    if (userObj.department) return userObj.department;
    const r = userObj.role;
    if (r === "DOCTOR" || r === "MEDECIN_GENERAL_CHIEF") return "Médecine Générale";
    if (r === "NURSE" || r === "AIDE_SOIGNANT") return "Urgences";
    if (r === "LAB_TECH") return "Laboratoire";
    if (r === "PHARMACIST") return "Pharmacie";
    if (r === "CASHIER") return "Caisse";
    return "Administration";
  };

  // -------------------------------------------------------------
  // PART B : STAGIAIRES FUNCTIONS & ATTESTATION GENERATION
  // -------------------------------------------------------------
  const handleSaveStagiaire = () => {
    setError("");
    setSuccess("");

    if (!activeStagiaire) return;

    // Persist active modifications
    const updated = stagiaires.map(s => {
      if (s.id === selectedStagiaireId) {
        return {
          ...s,
          ...activeStagiaire
        };
      }
      return s;
    });

    setStagiaires(updated);
    localStorage.setItem("medisahel_stagiaires", JSON.stringify(updated));
    setSuccess(`Fiche Stagiaire pour ${activeStagiaire.name} enregistrée avec succès.`);
    setTimeout(() => setSuccess(""), 4500);
  };

  const handleCreateNewStagiaire = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!stagiaireForm.name) {
      setError("Le nom de famille complet est obligatoire.");
      return;
    }

    const newId = "stg-" + Math.random().toString(36).substr(2, 9);
    const item: Stagiaire = {
      id: newId,
      name: stagiaireForm.name,
      department: stagiaireForm.department || "Laboratoire",
      service: stagiaireForm.service || "Hématologie",
      startDate: stagiaireForm.startDate || new Date().toISOString().split("T")[0],
      endDate: stagiaireForm.endDate || "",
      school: stagiaireForm.school || "",
      tutor: stagiaireForm.tutor || "",
      justificationType: stagiaireForm.justificationType || "Convention de stage",
      documentName: stagiaireForm.documentName || "",
      isCertified: false,
      indemnity: Number(stagiaireForm.indemnity) || 0
    };

    const list = [...stagiaires, item];
    setStagiaires(list);
    localStorage.setItem("medisahel_stagiaires", JSON.stringify(list));

    setSuccess(`Fiche Stagiaire créée pour ${item.name}!`);
    setSelectedStagiaireId(newId);
    setStagiaireForm({
      name: "",
      department: "Laboratoire",
      service: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      school: "",
      tutor: "",
      justificationType: "Convention de stage",
      documentName: "",
      isCertified: false,
      indemnity: 30000
    });
    setTimeout(() => setSuccess(""), 4500);
  };

  const handleGenerateInternAttestation = (st: Stagiaire) => {
    setError("");
    if (!st.isCertified || !st.documentName) {
      setError("⚠️ L'attestation de stage ne peut pas être générée car la pièce justificative n'est pas certifiée par le Directeur.");
      return;
    }

    const docWindow = window.open("", "_blank");
    if (!docWindow) {
      alert("Popup bloqué. Veuillez accepter les popups.");
      return;
    }

    const startFr = new Date(st.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const endFr = st.endDate ? new Date(st.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "en cours";

    const html = `
      <html>
        <head>
          <title>Attestation de Fin de Stage - MédiSahel</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,800;1,400&family=Montserrat:wght@400;500;600;700&display=swap');
            body { 
              font-family: "Montserrat", sans-serif; 
              padding: 50px; 
              margin: 0; 
              background: #fff; 
              color: #1a202c; 
              border: 15px double #0f766e;
              min-height: calc(100vh - 130px);
            }
            .header-info { text-align: center; margin-bottom: 50px; display: flex; flex-direction: column; align-items: center; }
            .clinic-name { font-size: 26px; font-weight: 800; color: #0f766e; text-transform: uppercase; letter-spacing: 1px; }
            .clinic-contacts { font-size: 11px; color: #718096; margin-top: 5px; line-height: 1.4; }
            .attestation-title { 
              font-family: "Playfair Display", serif; 
              font-size: 32px; 
              font-weight: 800; 
              color: #1a202c; 
              text-align: center; 
              text-transform: uppercase; 
              margin: 40px 0; 
              letter-spacing: 1.5px;
              border-bottom: 2px solid #0f766e;
              display: inline-block;
              padding-bottom: 15px;
            }
            .attestation-body { 
              font-size: 15px; 
              line-height: 2.1; 
              text-align: justify; 
              margin: 45px 30px; 
              color: #2d3748;
              font-weight: 500;
            }
            .highlight { font-weight: bold; color: #1a202c; text-decoration: underline; }
            .sign-section { 
              margin-top: 80px; 
              display: flex; 
              justify-content: space-between; 
              padding: 0 40px; 
              font-size: 13.5px;
            }
            .signature-card { text-align: center; width: 250px; }
            .sig-title { font-weight: 700; color: #718096; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
            .sig-name { font-family: "Playfair Display", serif; font-size: 18px; font-weight: 700; color: #0f766e; margin-top: 50px; font-style: italic; }
            .sig-seal { font-size: 10px; color: #a0aec0; margin-top: 5px; font-style: italic; }
            .footer-notes { text-align: center; font-size: 10px; color: #cbd5e0; margin-top: 60px; text-transform: uppercase; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header-info">
            <span class="clinic-name">🏥 RÉPUBLIQUE DU MALI - CLINIQUE MÉDISAHEL V2</span>
            <span class="clinic-contacts">
              SOTUBA ACI, BAMAKO - TEL : +223 20 22 45 88<br/>
              AGRÉMENT GOUVERNEMENTAL DES SERVICES DE SANTÉ N°845/MS-ML
            </span>
          </div>

          <div style="text-align: center;">
            <h1 class="attestation-title">ATTESTATION DE FIN DE STAGE</h1>
          </div>

          <div class="attestation-body">
            Je soussigné, <span class="highlight">Dr. Adama SANGARÉ</span>, Directeur Général de la Clinique MédiSahel de Bamako, certifie par la présente que Mademoiselle/Monsieur <span class="highlight" style="font-size:16px;">${st.name}</span>, inscrit(e) au sein de l'établissement d'enseignement supérieur <span class="highlight">${st.school || "INFS"}</span>, a effectué avec succès un stage d'apprentissage clinique au sein de notre établissement hospitalier.<br/><br/>
            Le stage s'est déroulé du <span class="highlight">${startFr}</span> au <span class="highlight">${endFr}</span> au sein du département <strong>${st.department}</strong> (Service de <strong>${st.service}</strong>), sous la supervision dévouée de son tuteur professionnel hospitalier, <span class="highlight">${st.tutor || "Dr. Fatoumata Maïga"}</span>.<br/><br/>
            Durant cette période d'affectation réglementaire, le stagiaire a fait preuve d'une assiduité rigoureuse, d'une ponctualité conforme à nos statuts d'horaires et d'un professionnalisme clinique éminent dans la réalisation des actes qui lui ont été délégués.<br/><br/>
            En foi de quoi, la présente attestation lui est délivrée pour servir et faire valoir ce que de droit.
          </div>

          <div class="sign-section">
            <div class="signature-card" style="text-align: left;">
              <span class="sig-title">Visa du Tuteur Clinical</span>
              <div class="sig-name" style="margin-top: 40px; color: #4a5568;">${st.tutor || "Fatoumata Maïga"}</div>
              <span class="sig-seal">Sceau d'encadrement, Sotuba</span>
            </div>
            <div class="signature-card" style="text-align: right;">
              <span class="sig-title">Le Directeur Général de Clinique</span>
              <div class="sig-name" style="margin-top: 40px;">Dr. Adama SANGARÉ</div>
              <span class="sig-seal">Approbation par signature de sécurité</span>
            </div>
          </div>

          <p class="footer-notes">MédiSahel Clinique Bamako - Mali - Registre d'admission N°${st.id.toUpperCase()}</p>
        </body>
      </html>
    `;
    docWindow.document.write(html);
    docWindow.document.close();
    setSuccess("Attestation de stage générée pour " + st.name);
  };

  return (
    <div className="space-y-6" id="payroll-composite-container">
      {/* Banner design */}
      <div className="bg-white rounded-2xl border border-gray-150 p-6 flex flex-col md:flex-row md:items-center md:justify-between shadow-sm gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-xl bg-teal-50 text-teal-700 shrink-0">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-sans font-extrabold text-xl text-slate-900 leading-none">Gestion de la Paie & Stagiaires</h2>
            <p className="text-xs text-gray-500 mt-1 max-w-xl">
              Calcul des salaires, suivi des virements bancaires automatiques IBAN d'une part, et gestion rigoureuse des pièces justificatives et attestations certifiées de stage d'autre part.
            </p>
          </div>
        </div>

        {/* Local routing selective buttons */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center text-xs font-bold gap-1 self-start md:self-center">
          <button
            onClick={() => setPayrollSubTab("paie")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              payrollSubTab === "paie" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            💰 Comptabilité Salaires
          </button>
          <button
            onClick={() => setPayrollSubTab("stagiaires")}
            className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
              payrollSubTab === "stagiaires" ? "bg-white text-slate-950 shadow-xs ring-1 ring-black/5 font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🎓 Dossiers Stagiaires
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-250 text-rose-800 text-xs rounded-xl flex items-center animate-fade-in" id="payroll-err">
          <ShieldAlert className="h-5 w-5 mr-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center animate-fade-in" id="payroll-ok">
          <Check className="h-5 w-5 mr-3 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* RENDER TAB 1 : COMPTABILITÉ DES SALAIRES STANDARD */}
      {payrollSubTab === "paie" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="standard-payroll-grid">
          {/* New payroll generator form column */}
          {(currentUser.role === "ADMIN" || currentUser.role === "HR") && (
            <div className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 lg:col-span-1">
              <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider border-b pb-2 flex items-center">
                <Landmark className="h-4.5 w-4.5 text-teal-600 mr-2" />
                Générer un Bulletin
              </h3>

              <form onSubmit={handleCreatePayroll} className="space-y-3.5 text-xs font-semibold">
                <div>
                  <label className="block text-gray-500 mb-1">Collaborateur bénéficiaire :</label>
                  <select
                    required
                    value={payrollUser}
                    onChange={e => handleUserChange(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs"
                  >
                    <option value="">-- Sélectionnez l'employé --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 mb-1">Mois :</label>
                    <select
                      value={payrollMonth}
                      onChange={e => setPayrollMonth(parseInt(e.target.value))}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                    >
                      <option value={5}>Mai</option>
                      <option value={6}>Juin</option>
                      <option value={7}>Juillet</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1">Année :</label>
                    <select
                      value={payrollYear}
                      onChange={e => setPayrollYear(parseInt(e.target.value))}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                    >
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-gray-500 mb-1">Salaire contractuel de base (FCFA) :</label>
                    <input
                      type="number"
                      value={payrollBase}
                      onChange={e => setPayrollBase(parseInt(e.target.value) || 0)}
                      className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs font-semibold font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Bonuses (+) (FCFA) :</label>
                      <input
                        type="number"
                        value={payrollBonus}
                        onChange={e => setPayrollBonus(parseInt(e.target.value) || 0)}
                        className="w-full h-9 px-3 bg-slate-50 border border-teal-200 text-teal-700 font-bold rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-[10px] mb-1">Retenues (-) (FCFA) :</label>
                      <input
                        type="number"
                        value={payrollDeduction}
                        onChange={e => setPayrollDeduction(parseInt(e.target.value) || 0)}
                        className="w-full h-9 px-3 bg-slate-50 border border-rose-200 text-rose-700 font-bold rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* PAIMENT METHOD WORKFLOW */}
                <div className="pt-3 border-t border-gray-150 space-y-3">
                  <div>
                    <label className="block text-gray-600 font-bold mb-1">Mode de Règlement :</label>
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      {(["VIREMENT", "CASH", "CHEQUE"] as const).map(m => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-1.5 text-center text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                            paymentMethod === m ? "bg-white text-slate-950 shadow-xs" : "text-gray-500"
                          }`}
                        >
                          {m === "VIREMENT" ? "Virement" : m === "CASH" ? "Espèces" : "Chèque"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {paymentMethod === "VIREMENT" && (
                    <div className="p-3.5 bg-slate-50 border border-slate-205 rounded-2xl space-y-2 text-[11px] font-semibold">
                      <span className="text-[10px] font-mono uppercase tracking-wide text-teal-700 block">Détails bancaires du virement</span>
                      
                      <div className="space-y-1.5">
                        <div>
                          <label className="text-[9.5px] text-gray-400 block uppercase">Intitulé Banque :</label>
                          <input
                            type="text"
                            value={bankDetails.bankName}
                            onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                            className="w-full h-8 px-2 bg-white border border-gray-205 rounded font-semibold text-xs"
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="text-[9.5px] text-gray-400 block uppercase">Code guichet :</label>
                            <input
                              type="text"
                              value={bankDetails.guichetCode}
                              onChange={e => setBankDetails({ ...bankDetails, guichetCode: e.target.value })}
                              className="w-full h-8 px-1 text-center bg-white border border-gray-205 rounded font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[9.5px] text-gray-400 block uppercase">N° Compte :</label>
                            <input
                              type="text"
                              value={bankDetails.accountNumber}
                              onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                              className="w-full h-8 px-1 text-center bg-white border border-gray-255 rounded font-mono text-xs"
                            />
                          </div>
                          <div className="col-span-1">
                            <label className="text-[9.5px] text-gray-400 block uppercase">Clé RIB :</label>
                            <input
                              type="text"
                              value={bankDetails.ribKey}
                              onChange={e => setBankDetails({ ...bankDetails, ribKey: e.target.value })}
                              className="w-full h-8 px-1 text-center bg-white border border-gray-255 rounded font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Generated IBAN banner preview */}
                      <div className="p-2 bg-teal-50/50 border border-teal-100 rounded-lg font-mono text-[9px] text-teal-800 tracking-wide mt-1">
                        <span className="font-sans font-bold block uppercase text-teal-850">IBAN AUTOMATIQUE CALCULE :</span>
                        <span>{calculatedIbanVal}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex justify-between font-bold text-gray-900 border-t items-center pr-2">
                  <span>NET ESTIMÉ À PAYER :</span>
                  <span className="text-teal-750 font-mono text-xs">
                    {(payrollBase + payrollBonus - payrollDeduction).toLocaleString()} FCFA
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 mt-1 bg-teal-700 hover:bg-teal-850 text-white font-bold rounded-xl text-xs uppercase cursor-pointer transition-all shadow-xs"
                >
                  Calculer & Enregistrer Bulletin
                </button>
              </form>
            </div>
          )}

          {/* Payroll records list column */}
          <div className={`bg-white rounded-2xl border border-gray-150 p-6 shadow-sm space-y-4 ${ (currentUser.role === "ADMIN" || currentUser.role === "HR") ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-2">
              <h3 className="font-bold text-gray-950 text-xs uppercase tracking-wider flex items-center">
                <FileText className="h-4.5 w-4.5 text-teal-600 mr-2" />
                Bulletins de Salaire Enregistrés
              </h3>
              <button
                type="button"
                onClick={() => {
                  const dataToExport = payrolls.map(pay => ({
                    ref: pay.id,
                    collab: getUserName(pay.userId),
                    month: pay.month,
                    year: pay.year,
                    base: pay.baseSalary,
                    bonus: pay.bonuses,
                    deduction: pay.deductions,
                    net: pay.netSalary,
                    status: pay.status === "PAID" ? "Régler" : "Brouillon / En attente"
                  }));
                  exportToExcel(dataToExport, "LIVRE_DE_PAIE_CONSOLIDER_MEDISAHEL", {
                    ref: "Référence Paie",
                    collab: "Collaborateur",
                    month: "Mois d'Exercice",
                    year: "Année d'Exercice",
                    base: "Salaire de Base (FCFA)",
                    bonus: "Primes & Indemnités",
                    deduction: "Retenues (INPS/CANAM/Taxes)",
                    net: "Salaire Net Payé",
                    status: "État du Règlement"
                  });
                }}
                className="inline-flex items-center px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-805 border border-emerald-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                title="Exporter le livre de paie complet en Excel"
              >
                <Download className="h-3.5 w-3.5 mr-1" /> Exporter Livre de Paie
              </button>
            </div>

            <div className="divide-y divide-gray-100 border border-gray-150 rounded-xl overflow-hidden text-xs bg-white">
              {payrolls.length === 0 ? (
                <div className="p-10 text-center text-gray-400">Aucune fiche de paie rattachée à cet exercice. Enregistrez un nouveau bulletin à gauche.</div>
              ) : (
                payrolls.map(pay => (
                  <div key={pay.id} className="p-3.5 bg-white hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold text-gray-700 leading-none">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-bold uppercase">{(pay as any).paymentMethod || "VIREMENT"}</span>
                        <h4 className="font-bold text-gray-950 text-xs leading-none">{getUserName(pay.userId)}</h4>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        Exercice : Juin {pay.month}/{pay.year} - Net paye : <span className="text-teal-750 font-bold">{pay.netSalary.toLocaleString()} FCFA</span>
                      </div>
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
                          className="px-2.5 py-1.5 bg-teal-700 hover:bg-teal-850 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          Régler Salaire
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[10px] uppercase border border-emerald-150">RÉGLÉ</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* RENDER TAB 2 : DOSSIERS STAGIAIRES & ATTESTATIONS */}
      {payrollSubTab === "stagiaires" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="internship-grid-workflow">
          {/* Fiche Stagiaire detail list panel */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-4">
            
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-950 text-xs uppercase tracking-wider flex items-center">
                <Users className="h-4.5 w-4.5 text-teal-600 mr-2" />
                Liste des Stagiaires
              </h3>
            </div>

            {/* List selector */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {stagiaires.length === 0 ? (
                <p className="text-gray-400 text-center italic text-xs py-6">Aucun stagiaire enregistré.</p>
              ) : (
                stagiaires.map(st => (
                  <button
                    key={st.id}
                    onClick={() => {
                      setSelectedStagiaireId(st.id);
                      setError("");
                    }}
                    className={`w-full p-3 text-left rounded-xl border font-bold text-xs flex justify-between items-center transition-all cursor-pointer ${
                      selectedStagiaireId === st.id
                        ? "bg-teal-50/50 border-teal-300 text-teal-800 shadow-xs"
                        : "bg-slate-50/60 border-gray-150 hover:bg-slate-50 hover:border-gray-300 text-slate-805"
                    }`}
                  >
                    <div>
                      <div>{st.name}</div>
                      <div className="text-[10px] text-gray-400 font-normal font-mono uppercase mt-0.5">{st.department} ({st.service})</div>
                    </div>
                    {st.isCertified ? (
                      <span className="px-2 py-0.5 bg-emerald-100 border border-emerald-250 text-emerald-800 font-black text-[8.5px] rounded-full">CERTIFIÉ</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-orange-100 border border-orange-250 text-orange-800 font-black text-[8.5px] rounded-full">EN ATTENTE</span>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Form for new stagiaire */}
            <div className="pt-4 border-t border-gray-150 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-450 block font-semibold">🎓 Créer une Fiche Stagiaire :</span>
              
              <form onSubmit={handleCreateNewStagiaire} className="space-y-3 text-xs font-semibold">
                <div>
                  <label className="text-gray-500 block mb-1">Nom complet du stagiaire :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Awa Touré"
                    value={stagiaireForm.name}
                    onChange={e => setStagiaireForm({ ...stagiaireForm, name: e.target.value })}
                    className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 block mb-1">Département :</label>
                    <select
                      value={stagiaireForm.department}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, department: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                    >
                      <option value="Laboratoire">Laboratoire</option>
                      <option value="Pharmacie">Pharmacie</option>
                      <option value="Médecine Générale">Médecine Générale</option>
                      <option value="Caisse">Caisse</option>
                      <option value="Urgences">Urgences</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Service clinique :</label>
                    <input
                      type="text"
                      placeholder="e.g. Hématologie"
                      value={stagiaireForm.service}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, service: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 block mb-1">École d'origine :</label>
                    <input
                      type="text"
                      placeholder="e.g. INFS Bamako"
                      value={stagiaireForm.school}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, school: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Tuteur référent :</label>
                    <input
                      type="text"
                      placeholder="e.g. Dr. Fatoumata"
                      value={stagiaireForm.tutor}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, tutor: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 block mb-1">Début stage :</label>
                    <input
                      type="date"
                      value={stagiaireForm.startDate}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, startDate: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 block mb-1">Fin stage (Est.) :</label>
                    <input
                      type="date"
                      value={stagiaireForm.endDate}
                      onChange={e => setStagiaireForm({ ...stagiaireForm, endDate: e.target.value })}
                      className="w-full h-10 px-2 bg-white border border-gray-250 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold rounded-xl text-[11px] uppercase cursor-pointer"
                >
                  Ajouter à la liste
                </button>
              </form>
            </div>
          </div>

          {/* Fiche Stagiaire detail display block */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm space-y-5">
            {activeStagiaire ? (
              <div className="space-y-6" id="fiche-stagiaire-panel">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <span className="inline-flex px-2 py-0.5 rounded bg-teal-50 text-teal-800 text-[10px] font-bold tracking-wider mb-1.5">FICHE TECHNIQUE DU STAGIAIRE</span>
                    <h3 className="font-sans font-black text-slate-900 text-lg">{activeStagiaire.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 uppercase tracking-wider font-mono">ID Dossier clinique : {activeStagiaire.id.toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 font-mono block">Indemnité mensuelle de stage</span>
                    <span className="font-mono font-black text-slate-900 text-base">{(activeStagiaire.indemnity || 0).toLocaleString()} FCFA</span>
                  </div>
                </div>

                {/* Grid details details */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs font-semibold text-gray-700">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">DÉPARTEMENT CLINIQUE</span>
                    <p className="font-bold text-slate-900 mt-1">{activeStagiaire.department}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">SERVICE HOSPITALIER</span>
                    <p className="font-bold text-slate-900 mt-1">{activeStagiaire.service}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">ÉTABLISSEMENT / ECOLE D'ENSEIGNEMENT</span>
                    <p className="font-bold text-slate-900 mt-1 text-teal-800">{activeStagiaire.school || "INFS Bamako"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">TUTEUR DE STAGE HOSPITALIER</span>
                    <p className="font-bold text-slate-900 mt-1">{activeStagiaire.tutor || "Dr. Fatoumata Maïga"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">PÉRIODE DE CONVENTION</span>
                    <p className="font-bold text-slate-800 mt-1 font-mono">Du {activeStagiaire.startDate} au {activeStagiaire.endDate || "en cours"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">CONSEILLER DE SÉCURITÉ</span>
                    <p className="font-bold text-slate-950 mt-1 uppercase">DR. CLAUDE MOREIRA</p>
                  </div>
                </div>

                {/* PIECE JUSTIFICATIVE OBLIGATOIRE FLOW */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-gray-150 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-mono text-[10.5px] uppercase text-slate-450 tracking-wider flex items-center font-bold">
                      <Award className="h-4.5 w-4.5 text-teal-600 mr-1.5 shrink-0" />
                      Pièce justificative obligatoire
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase font-mono font-medium">Contrôle DG</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <label className="block text-gray-500 mb-1">Type de Document Obligatoire :</label>
                      <select
                        value={activeStagiaire.justificationType}
                        onChange={e => {
                          const list = stagiaires.map(st => st.id === activeStagiaire.id ? { ...st, justificationType: e.target.value } : st);
                          setStagiaires(list);
                          localStorage.setItem("medisahel_stagiaires", JSON.stringify(list));
                        }}
                        className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl"
                      >
                        <option value="Convention de stage">Convention de stage</option>
                        <option value="Certificat de stage">Certificat de stage</option>
                        <option value="Attestation de présence">Attestation de présence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-500 mb-1">Fichier Scanné Rattaché :</label>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="stagiaire-doc-upload"
                          className="hidden"
                          onChange={e => {
                            const files = e.target.files;
                            if (files && files.length > 0) {
                              const fName = files[0].name;
                              const list = stagiaires.map(st => st.id === activeStagiaire.id ? { ...st, documentName: fName } : st);
                              setStagiaires(list);
                              localStorage.setItem("medisahel_stagiaires", JSON.stringify(list));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById("stagiaire-doc-upload")?.click()}
                          className="flex-1 h-10 bg-white border border-gray-205 hover:border-gray-205 text-[11px] font-bold text-gray-700 hover:bg-slate-50 cursor-pointer rounded-xl flex items-center justify-center p-2 truncate"
                        >
                          {activeStagiaire.documentName ? `📁 ${activeStagiaire.documentName}` : "➕ INSÉRER JUSTIFICATIF"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Warning if document absent */}
                  {!activeStagiaire.documentName && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 text-[11px] rounded-xl flex items-center leading-relaxed">
                      <AlertCircle className="h-4.5 w-4.5 mr-2 shrink-0 text-rose-700" />
                      <span>⚠️ Le stagiaire ne peut pas être validé sans pièce justificative d'un scan de convention.</span>
                    </div>
                  )}

                  {/* Certified control toggle button */}
                  <div className="pt-2 border-t border-gray-150/50 flex flex-col md:flex-row justify-between items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-medium leading-tight">
                      Certification requise de la pièce : cochez ci-contre pour certifier le document avec signature du DG.
                    </span>

                    <button
                      type="button"
                      disabled={!activeStagiaire.documentName}
                      onClick={() => {
                        const nextVal = !activeStagiaire.isCertified;
                        const list = stagiaires.map(st => st.id === activeStagiaire.id ? { ...st, isCertified: nextVal } : st);
                        setStagiaires(list);
                        localStorage.setItem("medisahel_stagiaires", JSON.stringify(list));
                        setSuccess(nextVal ? "Pièce certifiée par le Directeur !" : "Certification annulée.");
                        setTimeout(() => setSuccess(""), 4000);
                      }}
                      className={`h-10 px-4 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 leading-none uppercase ${
                        !activeStagiaire.documentName
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed border"
                          : activeStagiaire.isCertified
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-250 font-black shadow-xs"
                          : "bg-slate-900 hover:bg-slate-950 text-white font-bold"
                      }`}
                    >
                      <PenTool className="h-4 w-4" />
                      <span>{activeStagiaire.isCertified ? "✓ CONVENTION CERTIFIÉE DG" : "🖋️ CERTIFIER LA PIÈCE"}</span>
                    </button>
                  </div>
                </div>

                {/* Save and generate buttons */}
                <div className="flex gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={handleSaveStagiaire}
                    className="flex-1 py-3 text-center bg-slate-900 hover:bg-slate-950 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    💾 Enregistrer Modifications
                  </button>

                  <button
                    type="button"
                    disabled={!activeStagiaire.isCertified || !activeStagiaire.documentName}
                    onClick={() => handleGenerateInternAttestation(activeStagiaire)}
                    className={`flex-1 py-3 text-center rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all whitespace-nowrap flex items-center justify-center gap-1 leading-none ${
                      !activeStagiaire.isCertified || !activeStagiaire.documentName
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-250"
                        : "bg-teal-700 hover:bg-teal-850 text-white cursor-pointer shadow-xs"
                    }`}
                    id="generate-attestation-btn"
                  >
                    <FileText className="h-4 w-4" />
                    <span>📄 GÉNÉRER ATTESTATION DE STAGE</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic text-center py-20 flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-gray-300" />
                <span>Sélectionnez un stagiaire dans la liste pour consulter sa fiche détaillée.</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Pay Slip Simulative Modal popup */}
      {activeSlip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto" id="payslip-modal">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl p-6 border border-gray-150 space-y-6 animate-fade-in my-8 font-sans" id="payslip-inner-printable-sheet">
            <div className="flex justify-between items-start border-b border-gray-200 pb-4">
              <div className="space-y-1">
                <span className="inline-flex px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] uppercase font-bold tracking-widest rounded-full border border-teal-150">Bulletin de Paie Officiel</span>
                <h3 className="font-sans font-black text-slate-950 text-sm uppercase">MÉDISAHEL CLINIQUE CENTRAL V2</h3>
                <p className="text-[11px] text-gray-400">Sotuba, Commune I, District de Bamako, Mali</p>
              </div>
              <div className="font-sans font-bold text-base text-teal-800 bg-teal-50 px-3.5 py-1.5 rounded-xl border border-teal-150">
                {activeSlip.netSalary.toLocaleString()} FCFA
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-sans text-gray-700 border-b pb-4">
              <div>
                <span className="text-[9px] font-mono text-gray-450 uppercase tracking-widest font-black">COLLABORATEUR</span>
                <p className="font-extrabold text-slate-900 mt-1 uppercase">{getUserName(activeSlip.userId)}</p>
                <p className="text-gray-400 text-[10.5px] mt-0.5 font-mono">{getUserDetails(activeSlip.userId)?.email || "sotuba@medisahel.ml"}</p>
                <p className="text-gray-500 text-[10.5px] font-medium leading-relaxed truncate">{getDepartmentForUser(activeSlip.userId)}</p>
              </div>
              <div>
                <span className="text-[9px] font-mono text-gray-450 uppercase tracking-widest font-black">PERIODE & MODE</span>
                <p className="font-extrabold text-slate-900 mt-1">Mois {activeSlip.month} / {activeSlip.year}</p>
                <p className="text-teal-700 font-extrabold text-[10px] mt-0.5 uppercase tracking-wide">
                  Reglement : {activeSlip.paymentMethod || "VIREMENT"}
                </p>
              </div>
            </div>

            {/* Wage Formulas lists */}
            <div className="space-y-2 text-xs font-semibold text-gray-750">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Salaire contractuel brut de base</span>
                <span className="font-mono text-slate-950 font-bold">{activeSlip.baseSalary.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500 font-medium">Primes de garde (Shift Bonus direct)</span>
                <span className="font-mono text-emerald-700 font-bold">+{activeSlip.bonuses.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b pb-2">
                <span className="text-gray-400 font-medium">Déductions d'absences / Pénalités cumulées</span>
                <span className="font-mono text-rose-700 font-bold">-{activeSlip.deductions.toLocaleString()} FCFA</span>
              </div>
              
              {/* Optional bank wire block */}
              {activeSlip.paymentMethod === "VIREMENT" && activeSlip.bankName && (
                <div className="p-3 bg-slate-50 border border-gray-150 rounded-2xl text-[10.5px] space-y-1.5 font-mono">
                  <span className="font-sans font-black text-gray-400 text-[9px] uppercase tracking-wide block">Coordonnées Bancaires de déchargement</span>
                  <div className="flex justify-between truncate">
                    <span className="text-gray-500">Banque de décollement:</span>
                    <strong className="text-slate-800">{activeSlip.bankName}</strong>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-500">IBAN client émetteur:</span>
                    <strong className="text-teal-700">{activeSlip.iban || calculateIban(activeSlip.bankName, activeSlip.guichetCode, activeSlip.accountNumber, activeSlip.ribKey)}</strong>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center py-2 text-sm font-bold border-b border-double border-gray-300">
                <span className="text-slate-950 uppercase font-black text-xs leading-none">Net Mensuel Effectivement Versé</span>
                <span className="font-mono text-teal-800 text-base">{activeSlip.netSalary.toLocaleString()} FCFA</span>
              </div>
            </div>

            {/* Certifying Signature sealing */}
            <div className="flex justify-between items-center text-[10.5px] p-3 border border-dashed rounded-xl bg-slate-50/50">
              <span className="font-bold text-gray-400">SIGNATURE DIRECTEUR GÉNÉRAL</span>
              <div className="text-right">
                <span className="font-black italic text-[#0f766e] block tracking-wide text-xs">Dr. Adama SANGARÉ</span>
                <span className="text-[8px] font-mono text-gray-400 block tracking-widest uppercase">Certificat Électronique de Paie</span>
              </div>
            </div>

            <div className="flex gap-2 print:hidden">
              <button
                type="button"
                onClick={() => exportToPDF("payslip-inner-printable-sheet", `Bulletin_Paie_${getUserName(activeSlip.userId).replace(/\s+/g, "_")}_Mois_${activeSlip.month}`)}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold leading-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="h-4 w-4" /> Imprimer / PDF
              </button>
              <button
                onClick={() => setActiveSlip(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-850 border border-slate-250 rounded-xl text-xs font-bold leading-none cursor-pointer transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
