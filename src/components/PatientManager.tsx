import React, { useState, useEffect } from "react";
import { Search, UserPlus, FileText, Heart, ShieldAlert, Check, ChevronRight, FileSpreadsheet, Printer, Eye, Edit, ExternalLink, History, X } from "lucide-react";
import { Patient } from "../types.ts";
import { UnifiedPatientFolder } from "./UnifiedPatientFolder.tsx";

interface PatientManagerProps {
  token: string | null;
  onSelectPatient?: (patient: Patient) => void;
  clinic?: any;
  currentUser?: any;
}

export const PatientManager: React.FC<PatientManagerProps> = ({ token, onSelectPatient, clinic, currentUser }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientForDossier, setSelectedPatientForDossier] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingHistoryPatient, setViewingHistoryPatient] = useState<Patient | null>(null);
  const [patientHistoryList, setPatientHistoryList] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "M",
    phone: "",
    email: "",
    bloodType: "A+",
    allergies: "",
    address: "",
    ethnie: "Bambara",
    nationalite: "Malienne",
    maritalStatus: "Célibataire",
    profession: "",
    language: "Bambara",
    commune: "",
    quartier: "",
    emergencyContact: "",
    nina: "",
    amo: "",
    inps: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const defaultEthniesList = [
    { id: "1", name: "Bambara", active: true },
    { id: "2", name: "Peulh", active: true },
    { id: "3", name: "Soninké", active: true },
    { id: "4", name: "Malinké", active: true },
    { id: "5", name: "Sénoufo", active: true },
    { id: "6", name: "Dogon", active: true },
    { id: "7", name: "Songhaï", active: true },
    { id: "8", name: "Bobo", active: true },
    { id: "9", name: "Bozo", active: true },
    { id: "11", name: "Minianka", active: true },
    { id: "12", name: "Tamasheq", active: true },
    { id: "13", name: "Arabe", active: true }
  ];

  const [activeEthnies, setActiveEthnies] = useState<string[]>([]);
  const [useCustomEthnie, setUseCustomEthnie] = useState(false);
  const [customEthnieValue, setCustomEthnieValue] = useState("");

  const loadEthnies = () => {
    if (clinic?.ethniesList) {
      try {
        const parsed = JSON.parse(clinic.ethniesList);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setActiveEthnies(parsed);
          // Set defaultValue if active
          if (parsed.length > 0 && !formData.ethnie) {
            setFormData(prev => ({ ...prev, ethnie: parsed[0] }));
          }
          return;
        }
      } catch (e) {
        console.error("Error parsing clinic ethnies list", e);
      }
    }
    const raw = localStorage.getItem("medisahel_ethnies");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setActiveEthnies(parsed.filter((e: any) => e.active).map((e: any) => e.name));
      } catch (e) {
        setActiveEthnies(defaultEthniesList.map(e => e.name));
      }
    } else {
      setActiveEthnies(defaultEthniesList.map(e => e.name));
    }
  };

  useEffect(() => {
    loadEthnies();
    const handleStorageChange = () => {
      loadEthnies();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [clinic]);

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return "";
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} ans` : "";
  };

  const [duplicateResult, setDuplicateResult] = useState<Patient | null>(null);
  const [showMergePanel, setShowMergePanel] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

  const handleMergeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!mergeSourceId || !mergeTargetId) {
      setError("Les dossiers source (doublon) et cible sont requis pour exécuter la fusion.");
      return;
    }
    if (mergeSourceId === mergeTargetId) {
      setError("Le dossier source (doublon) et le dossier cible principal doivent être différents.");
      return;
    }

    const sourcePatientObj = patients.find(p => p.id === mergeSourceId);
    const targetPatientObj = patients.find(p => p.id === mergeTargetId);
    const sourceName = sourcePatientObj ? `${sourcePatientObj.lastName.toUpperCase()} ${sourcePatientObj.firstName}` : mergeSourceId;
    const targetName = targetPatientObj ? `${targetPatientObj.lastName.toUpperCase()} ${targetPatientObj.firstName}` : mergeTargetId;

    if (!window.confirm(`ATTENTION SÉCURITÉ : Vous allez fusionner définitivement le dossier "${sourceName}" vers "${targetName}".\nTous les actes, hospitalisations, transactions et prescriptions reliés au dossier doublon seront rattachés au profil cible.\n\nLe dossier "${sourceName}" sera supprimé.\n\nCette opération est définitive. Continuer ?`)) {
      return;
    }

    setMergeLoading(true);
    try {
      const response = await fetch("/api/patients/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          sourcePatientId: mergeSourceId,
          targetPatientId: mergeTargetId
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");

      setSuccess(data.message || "La fusion clinique consolidée a été complétée.");
      setMergeSourceId("");
      setMergeTargetId("");
      setShowMergePanel(false);
      fetchPatients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setMergeLoading(false);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to load patients");
      setPatients(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  const [editFormData, setEditFormData] = useState<any>(null);

  const startEditing = (p: Patient) => {
    setEditingPatient(p);
    setEditFormData({
      firstName: p.firstName,
      lastName: p.lastName,
      nationalId: p.nationalId || "",
      dateOfBirth: p.dateOfBirth || "",
      gender: p.gender || "M",
      phone: p.phone || "",
      email: p.email || "",
      bloodType: p.bloodType || "A+",
      allergies: p.allergies || "",
      address: p.address || "",
      ethnie: p.ethnie || "Bambara",
      nationalite: p.nationalite || "Malienne",
      maritalStatus: p.maritalStatus || "Célibataire",
      profession: p.profession || "",
      language: p.language || "Bambara",
      commune: p.commune || "",
      quartier: p.quartier || "",
      emergencyContact: p.emergencyContact || "",
      nina: p.nina || "",
      amo: p.amo || "",
      inps: p.inps || ""
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPatient) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/patients/${editingPatient.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFormData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Impossible d'enregistrer les modifications");
      setSuccess(`Fiche patient de ${editFormData.lastName.toUpperCase()} mise à jour avec succès.`);
      setEditingPatient(null);
      fetchPatients();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err: any) {
      setError(err.message || "Échec de la modification.");
    }
  };

  const handleFetchHistory = async (patientObj: Patient) => {
    setViewingHistoryPatient(patientObj);
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/auditlogs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const logs = await res.json();
        // Filter by logs that contain the patient ID or name
        const filtered = logs.filter((log: any) => 
          log.details && (
            log.details.includes(patientObj.id) || 
            log.details.toLowerCase().includes(patientObj.lastName.toLowerCase()) ||
            log.details.toLowerCase().includes(patientObj.firstName.toLowerCase())
          )
        );
        setPatientHistoryList(filtered);
      }
    } catch (err) {
      console.warn("Failed to load audit trace", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePrintPatientCard = (p: Patient) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>SIGNALÉTIQUE PATIENT - ${p.lastName.toUpperCase()} ${p.firstName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background-color: #ffffff; }
            .card { border: 2px solid #0f766e; border-radius: 18px; padding: 30px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .title { color: #0f766e; font-size: 24px; font-weight: bold; margin: 0; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-top: 20px; }
            .item { font-size: 14px; margin-bottom: 8px; }
            .label { font-weight: bold; color: #475569; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <h1 class="title">FICHE SIGNALÉTIQUE MULTI-AFFILIATION</h1>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 12px;">MédiSahel - Centre Hospitalier de Gestion Électronique</p>
              </div>
              <div style="font-weight: bold; font-size: 16px; color: #015f56;">N° DOSSIER: ${p.id.slice(0, 12)}</div>
            </div>
            
            <div class="grid">
              <div class="item"><span class="label">Nom complet:</span> ${p.lastName.toUpperCase()} ${p.firstName}</div>
              <div class="item"><span class="label">Date de naissance:</span> ${p.dateOfBirth}</div>
              <div class="item"><span class="label">Genre:</span> ${p.gender === "M" ? "Masculin (H)" : "Féminin (F)"}</div>
              <div class="item"><span class="label">Identité Nationale (NID/NINA):</span> ${p.nationalId || "Non renseigné"}</div>
              <div class="item"><span class="label">Téléphone:</span> ${p.phone || "Inconnu"}</div>
              <div class="item"><span class="label">Email:</span> ${p.email || "Non spécifié"}</div>
              <div class="item"><span class="label">Groupe sanguin:</span> ${p.bloodType || "Non déterminé"}</div>
              <div class="item"><span class="label">Ethnie:</span> ${p.ethnie || "Bambara"}</div>
              <div class="item"><span class="label">Nationalité:</span> ${p.nationalite || "Malienne"}</div>
              <div class="item"><span class="label">Statut matrimonial:</span> ${p.maritalStatus || "Célibataire"}</div>
              <div class="item"><span class="label">Adresse:</span> ${p.address || "Bamako, Mali"}</div>
              <div class="item"><span class="label">Allergies connues:</span> ${p.allergies || "Aucune allergie signalée"}</div>
            </div>

            <div class="footer">
              Imprimé le ${new Date().toLocaleString("fr-FR")} par MédiSahel GECD. Document médical confidentiel et protégé.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSubmit = async (e: React.FormEvent, forceCreate = false) => {
    if (e) e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
      setError("Les champs Nom, Prénom et Date de Naissance sont requis.");
      return;
    }

    if (!formData.nationalite || formData.nationalite.trim() === "") {
      setError("Le champ Nationalité est obligatoire.");
      return;
    }

    // Advanced duplicates check
    if (!forceCreate) {
      try {
        const dupRes = await fetch("/api/patients/check-duplicate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone
          })
        });
        const dupData = await dupRes.json();
        if (dupRes.ok && dupData.duplicate) {
          setDuplicateResult(dupData.patient);
          return; // Pause creation and prompt user
        }
      } catch (err) {
        console.warn("Server duplicate checks skipped:", err);
      }
    }

    try {
      const submissionData = {
        ...formData,
        ethnie: useCustomEthnie ? (customEthnieValue.trim() || "Non renseignée") : formData.ethnie
      };

      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible d'enregistrer le patient");

      setSuccess("Patient enregistré avec succès ! ID Permanent: " + data.id);
      setFormData({
        firstName: "",
        lastName: "",
        nationalId: "",
        dateOfBirth: "",
        gender: "M",
        phone: "",
        email: "",
        bloodType: "A+",
        allergies: "",
        address: "",
        ethnie: "Bambara",
        nationalite: "Malienne",
        maritalStatus: "Célibataire",
        profession: "",
        language: "Bambara",
        commune: "",
        quartier: "",
        emergencyContact: "",
        nina: "",
        amo: "",
        inps: ""
      });
      setUseCustomEthnie(false);
      setCustomEthnieValue("");
      setShowAddForm(false);
      setDuplicateResult(null);
      fetchPatients();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    const idMatch = p.id && p.id.toLowerCase().includes(query);
    const dobMatch = p.dateOfBirth && p.dateOfBirth.includes(query);
    const phoneMatch = p.phone && p.phone.includes(query);
    const nationalIdMatch = p.nationalId && p.nationalId.toLowerCase().includes(query);
    const ethnieMatch = p.ethnie && p.ethnie.toLowerCase().includes(query);
    const nationaliteMatch = p.nationalite && p.nationalite.toLowerCase().includes(query);
    return fullName.includes(query) || idMatch || dobMatch || phoneMatch || nationalIdMatch || ethnieMatch || nationaliteMatch;
  });

  const handleExportCSV = () => {
    const headers = [
      "Identifiant Permanent",
      "Nom",
      "Prenom",
      "Sexe",
      "Date de Naissance",
      "Nationalite",
      "Ethnie",
      "NID",
      "Groupe Sanguin",
      "Allergies",
      "Telephone",
      "Email",
      "Adresse"
    ];
    
    const rows = filteredPatients.map(p => [
      p.id,
      p.lastName.toUpperCase(),
      p.firstName,
      p.gender === "M" ? "Masculin (M)" : "Feminin (F)",
      p.dateOfBirth,
      p.nationalite || "Non renseignee",
      p.ethnie || "Non renseignee",
      p.nationalId || "Non specifie",
      p.bloodType || "Non specifie",
      p.allergies || "Aucune",
      p.phone || "Non specifie",
      p.email || "Non specifie",
      p.address || "Non specifie"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `REGISTRE_PATIENTS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintRegistry = () => {
    const printWindow = window.open("", "", "width=1000,height=800");
    if (!printWindow) return;

    const rowsHtml = filteredPatients.map(p => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-size: 11px; font-weight: bold; color: #0f766e;">${p.id}</td>
        <td style="padding: 10px; font-weight: bold; color: #0f172a;">${p.lastName.toUpperCase()} ${p.firstName}</td>
        <td style="padding: 10px;">${p.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</td>
        <td style="padding: 10px;">${p.dateOfBirth}</td>
        <td style="padding: 10px; font-weight: bold;">${p.nationalite || "Non renseignée"}</td>
        <td style="padding: 10px;">${p.ethnie || "Non renseignée"}</td>
        <td style="padding: 10px; font-family: monospace;">${p.nationalId}</td>
        <td style="padding: 10px; font-weight: bold; color: #b91c1c;">${p.bloodType || "N/A"}</td>
        <td style="padding: 10px; color: #475569;">${p.phone || "Non spécifié"}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>MédiSahel - Registre des Patients</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 30px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px double #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
            .logo { font-size: 20px; font-weight: 800; color: #0f766e; word-spacing: 2px; }
            .meta { font-size: 11px; color: #64748b; font-family: monospace; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; margin-top: 15px; }
            th { background: #f8fafc; padding: 12px 10px; font-weight: 800; border-bottom: 2px solid #cbd5e1; text-transform: uppercase; font-size: 10px; color: #475569; }
            td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">MÉDISAHEL CLINIQUE V2</div>
              <div style="font-size: 11px; color: #475569; margin-top: 4px;">Registre Administratif Consolidé des Patients</div>
            </div>
            <div style="text-align: right;">
              <div class="meta">Exporté le : ${new Date().toLocaleDateString("fr-FR")}</div>
              <div class="meta">Nombre de Fiches : ${filteredPatients.length}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>N° Permanent</th>
                <th>Patient</th>
                <th>Sexe</th>
                <th>Date Naissance</th>
                <th>Nationalité</th>
                <th>Ethnie</th>
                <th>ID National (NID)</th>
                <th>Gr. Sanguin</th>
                <th>Téléphone</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (selectedPatientForDossier) {
    return (
      <UnifiedPatientFolder
        token={token}
        patient={selectedPatientForDossier}
        onBack={() => setSelectedPatientForDossier(null)}
        clinic={clinic}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden" id="patient-manager-card">
      {/* Module Title Section */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-xl text-gray-900 flex items-center">
            <Heart className="h-5 w-5 text-teal-600 mr-2" />
            Gestion des Patients
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Enregistrement des fiches civiles, signalétique vitale et dossier signalétique d'affiliation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setShowMergePanel(!showMergePanel);
              setShowAddForm(false);
            }}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer select-none ${showMergePanel ? "bg-amber-100 text-amber-955 border border-amber-300" : "bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100"}`}
            id="merge-patients-btn"
          >
            <ShieldAlert className="h-4 w-4 mr-2" />
            {showMergePanel ? "Fermer la Fusion" : "Fusionner des Dossiers"}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowMergePanel(false);
            }}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 transition-colors shadow-sm duration-150 cursor-pointer"
            id="add-patient-btn"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {showAddForm ? "Fermer le formulaire" : "Enregistrer un Patient"}
          </button>
        </div>
      </div>

      {showMergePanel && (
        <form onSubmit={handleMergeSubmit} className="p-6 bg-slate-50 border-b border-gray-100 space-y-4" id="patient-merge-form">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Fusion Clinique Sécurisée des Doublons</h3>
            <p className="text-xs text-gray-500 mt-1">Conformément à la règle <strong>UN PATIENT = UN DOSSIER UNIQUE À VIE</strong>, cet outil permet de fusionner deux dossiers créés accidentellement. Tout l'historique médical et financier sera consolidé.</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start text-xs text-amber-850 gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-amber-900 font-bold mb-1">Avertissement de Sécurité Majeur :</strong>
              Cette action est STRICTEMENT IRRÉVERSIBLE. Le dossier <strong>source</strong> sera définitivement supprimé de la base de données. Tous ses enregistrements (fiches de consultations, dossiers d'hospitalisation, transactions en caisse et résultats de laboratoire) seront rattachés automatiquement au dossier <strong>cible</strong> conservé.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">DOSSIER SOURCE (Le doublon à SUPPRIMER) <span className="text-red-500">*</span></label>
              <select
                value={mergeSourceId}
                onChange={e => setMergeSourceId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                required
              >
                <option value="">-- Sélectionnez le dossier doublon --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName} - Né(e) le {p.dateOfBirth} [NID: {p.nationalId || "N/A"}] (N° {p.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 block mt-1">Les dossiers de consultations et de paiements de ce patient seront déplacés.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">DOSSIER CIBLE (Le dossier principal à CONSERVER) <span className="text-red-500">*</span></label>
              <select
                value={mergeTargetId}
                onChange={e => setMergeTargetId(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-gray-250 rounded-xl text-xs focus:ring-1 focus:ring-teal-700 focus:outline-none"
                required
              >
                <option value="">-- Sélectionnez le dossier principal --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.lastName.toUpperCase()} {p.firstName} - Né(e) le {p.dateOfBirth} [NID: {p.nationalId || "N/A"}] (N° {p.id.slice(0, 8)}...)
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-400 block mt-1">Ce dossier sera l'unique réceptacle préservé à vie pour ce patient.</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-150">
            <button
              type="button"
              onClick={() => {
                setShowMergePanel(false);
                setMergeSourceId("");
                setMergeTargetId("");
              }}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={mergeLoading || !mergeSourceId || !mergeTargetId}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold transition disabled:opacity-50 select-none cursor-pointer"
            >
              {mergeLoading ? "Fusion en cours..." : "Exécuter la Fusion Définitive"}
            </button>
          </div>
        </form>
      )}

      {showAddForm && (
        <form onSubmit={e => handleSubmit(e)} className="p-6 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-5" id="patient-add-form">
          <div className="md:col-span-3">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider mb-1">Nouvelle Fiche d'Admission Patient</h3>
          </div>

          {duplicateResult && (
            <div className="md:col-span-3 p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3" id="patient-duplicate-warning">
              <div className="flex items-start">
                <ShieldAlert className="h-5 w-5 text-amber-600 mr-2.5 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Alerte de doublon détectée</h4>
                  <p className="text-xs text-amber-705 mt-1">
                    Un patient nommé <strong>{duplicateResult.lastName.toUpperCase()} {duplicateResult.firstName}</strong> possédant les mêmes coordonnées (ou téléphone semblable) existe déjà sous le matricule permanent <strong>{duplicateResult.id}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {onSelectPatient && (
                  <button
                    type="button"
                    onClick={() => onSelectPatient(duplicateResult)}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition cursor-pointer select-none"
                  >
                    Ouvrir le dossier existant
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMergeSourceId("");
                    setMergeTargetId(duplicateResult.id);
                    setShowMergePanel(true);
                    setShowAddForm(false);
                    setDuplicateResult(null);
                  }}
                  className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-lg text-xs font-bold transition cursor-pointer select-none"
                >
                  Fusionner avec ce dossier existant
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateResult(null)}
                  className="px-3.5 py-1.5 border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold transition hover:bg-amber-100 cursor-pointer select-none"
                >
                  Annuler & Corriger
                </button>
              </div>
            </div>
          )}
          
          {/* Section 1 : État Civil & Démographie */}
          <div className="md:col-span-3 border-b pb-2 mt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-850">1. État Civil & Démographie</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prénom(s) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Moussa"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nom de famille <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.lastName}
              onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. DIARRA"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sexe biologique <span className="text-rose-500">*</span></label>
            <select
              value={formData.gender}
              onChange={e => setFormData({ ...formData, gender: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de Naissance <span className="text-rose-500">*</span></label>
            <div className="relative">
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
                required
              />
              {formData.dateOfBirth && (
                <span className="absolute right-3 top-2.5 bg-teal-50 text-teal-800 text-[10px] font-bold px-2 py-1 rounded-md">
                  {calculateAge(formData.dateOfBirth)}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Situation matrimoniale</label>
            <select
              value={formData.maritalStatus}
              onChange={e => setFormData({ ...formData, maritalStatus: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="Célibataire">Célibataire</option>
              <option value="Marié(e)">Marié(e)</option>
              <option value="Divorcé(e)">Divorcé(e)</option>
              <option value="Veuf/Veuve">Veuf/Veuve</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Profession</label>
            <input
              type="text"
              value={formData.profession}
              onChange={e => setFormData({ ...formData, profession: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Enseignant, Commerçant"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Langue principale</label>
            <input
              type="text"
              value={formData.language}
              onChange={e => setFormData({ ...formData, language: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Bambara, Peulh, Français"
            />
          </div>

          {/* Section 2 : Identifiants Administratifs & Sécurité Sociale */}
          <div className="md:col-span-3 border-b pb-2 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-850">2. Identifiants de Sécurité Sociale & Administratifs</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro NINA</label>
            <input
              type="text"
              value={formData.nina}
              onChange={e => setFormData({ ...formData, nina: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono text-xs"
              placeholder="e.g. 1 90 011 501 B"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro AMO / CANAM</label>
            <input
              type="text"
              value={formData.amo}
              onChange={e => setFormData({ ...formData, amo: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono text-xs"
              placeholder="e.g. 4 12 45 789 A"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro INPS</label>
            <input
              type="text"
              value={formData.inps}
              onChange={e => setFormData({ ...formData, inps: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono text-xs"
              placeholder="e.g. INP-2026-6721"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nationalité <span className="text-teal-700">*</span></label>
            <input
              type="text"
              value={formData.nationalite}
              onChange={e => setFormData({ ...formData, nationalite: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-semibold text-slate-800"
              placeholder="e.g. Malienne, Ivoirienne"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ethnie / Groupe</label>
            {!useCustomEthnie ? (
              <select
                value={formData.ethnie}
                onChange={e => {
                  if (e.target.value === "AUTRE") {
                    setUseCustomEthnie(true);
                  } else {
                    setFormData({ ...formData, ethnie: e.target.value });
                  }
                }}
                className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-semibold text-slate-800"
              >
                {activeEthnies.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
                <option value="AUTRE">Autre / Saisie libre...</option>
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customEthnieValue}
                  onChange={e => setCustomEthnieValue(e.target.value)}
                  className="flex-1 h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-bold"
                  placeholder="Saisissez l'ethnie"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setUseCustomEthnie(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-[10px] font-bold border rounded-lg px-2 text-slate-700 cursor-pointer"
                  title="Revenir à la liste ordonnée"
                >
                  Liste
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro d’identité unique (NID / CEDEAO)</label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-mono text-xs"
              placeholder="ID National (généré automatiquement sinon)"
            />
          </div>

          {/* Section 3 : Coordonnées de Contact & Urgence */}
          <div className="md:col-span-3 border-b pb-2 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-850">3. Coordonnées de Contact & Urgences</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone de contact</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-semibold text-slate-800"
              placeholder="+223 76 54 32 10"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse E-mail</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="patient@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse Domiciliaire Résidentielle</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="Quartier résidentiel, Ville, Pays"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commune</label>
            <input
              type="text"
              value={formData.commune}
              onChange={e => setFormData({ ...formData, commune: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Commune IV"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quartier</label>
            <input
              type="text"
              value={formData.quartier}
              onChange={e => setFormData({ ...formData, quartier: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Hamdallaye ACI"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Personne à contacter en cas d'urgence (Nom, Tél)</label>
            <input
              type="text"
              value={formData.emergencyContact}
              onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-semibold text-rose-750"
              placeholder="e.g. Ousmane Diarra, +223 66 12 34 56"
            />
          </div>

          {/* Section 4 : Données Médicales de Base */}
          <div className="md:col-span-3 border-b pb-2 mt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-850">4. Constantes Vitales & Données Cliniques Initiales</h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Groupe Sanguin</label>
            <select
              value={formData.bloodType}
              onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-bold text-red-650"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Allergies médicamenteuses ou alimentaires majeures</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none font-medium text-rose-800"
              placeholder="e.g. Pénicilline, Sulfamides"
            />
          </div>

          <div className="md:col-span-3 flex justify-end space-x-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-750 text-sm font-semibold rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-extrabold rounded-xl shadow-lg hover:shadow-teal-100 transition-all cursor-pointer"
            >
              Confirmer l'Enregistrement de l'admission
            </button>
          </div>
        </form>
      )}

      {/* Alerts */}
      {error && (
        <div className="p-4 mx-6 mt-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center">
          <ShieldAlert className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 mx-6 mt-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center">
          <Check className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Filter and Table List */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex bg-slate-100 items-center px-3.5 py-2.5 rounded-xl border border-gray-200 w-full max-w-md">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom ou NID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer font-sans"
              title="Exporter sous format Excel (CSV)"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              Exporter Excel (CSV)
            </button>
            <button
              type="button"
              onClick={handlePrintRegistry}
              className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer font-sans"
              title="Imprimer le registre des patients"
            >
              <Printer className="h-4 w-4 mr-2 text-indigo-600" />
              Imprimer Registre
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Chargement de l'annuaire...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-[18px]">
            Aucun enregistrement ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map(patient => (
              <div 
                key={patient.id} 
                onClick={() => {
                  if (onSelectPatient) {
                    onSelectPatient(patient);
                  } else {
                    setSelectedPatientForDossier(patient);
                  }
                }}
                className="bg-white rounded-[20px] p-5 border border-slate-200 hover:border-teal-600 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group shadow-xs hover:-translate-y-0.5"
                id={`patient-card-${patient.id}`}
              >
                {/* Visual identity strip */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${patient.gender === "M" ? "bg-teal-600" : "bg-rose-400"}`} />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2 pt-1">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold font-sans ${patient.gender === "M" ? "bg-teal-50 text-teal-800" : "bg-rose-50 text-rose-800 animate-pulse"}`}>
                        {patient.lastName.slice(0,1).toUpperCase()}{patient.firstName.slice(0,1).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-gray-900 group-hover:text-teal-700 transition-colors text-base">
                          {patient.lastName.toUpperCase()} {patient.firstName}
                        </h3>
                        <p className="font-mono text-[10px] text-gray-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5">
                          ID: {patient.id.slice(0, 12).toUpperCase()}
                        </p>
                      </div>
                    </div>
                    {patient.bloodType && (
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {patient.bloodType}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-gray-100 py-3 font-sans">
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Nationalité</span>
                      <span className="text-gray-700 font-medium">{patient.nationalite || "Malienne"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Ethnie</span>
                      <span className="text-gray-700 font-medium">{patient.ethnie || "Bambara"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Date de naissance</span>
                      <span className="text-slate-800 font-medium">{patient.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px] uppercase font-mono tracking-wider">Genre</span>
                      <span className="text-slate-800 font-medium">{patient.gender === "M" ? "Masculin (H)" : "Féminin (F)"}</span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 pt-1">
                    <div className="flex items-center text-gray-700">
                      <span className="text-[10px] uppercase font-mono text-gray-400 w-20 shrink-0">Téléphone:</span> 
                      <span className="font-semibold text-slate-800 font-mono text-[11px]">{patient.phone || "Non spécifié"}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <span className="text-[10px] uppercase font-mono text-gray-400 w-20 shrink-0">Email:</span>
                      <span className="text-gray-600 truncate font-mono text-[11px]">{patient.email || "Non spécifié"}</span>
                    </div>
                    {patient.nationalId && (
                      <div className="flex items-center text-gray-700">
                        <span className="text-[10px] uppercase font-mono text-gray-400 w-20 shrink-0">National ID:</span>
                        <span className="text-gray-600 truncate font-mono text-[11px]">{patient.nationalId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Micro-actions appearing instantly upon Hover with gorgeous styling on the card border */}
                <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-xs flex flex-col justify-center gap-2 p-5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 text-white z-10" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs font-bold text-teal-400 font-sans tracking-wide mb-1 uppercase text-center border-b border-white/10 pb-1.5">
                    🗃️ DOSSIER MÉDICAL CLIQUEZ
                  </p>
                  
                  <button
                    onClick={() => {
                      if (onSelectPatient) {
                        onSelectPatient(patient);
                      } else {
                        setSelectedPatientForDossier(patient);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Consulter le dossier DME
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => startEditing(patient)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs transition-colors"
                    >
                      <Edit className="h-3 w-3" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handlePrintPatientCard(patient)}
                      className="flex items-center justify-center gap-1.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs transition-colors"
                    >
                      <Printer className="h-3 w-3" />
                      Imprimer
                    </button>
                  </div>

                  <button
                    onClick={() => handleFetchHistory(patient)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium text-xs transition-colors mt-0.5"
                  >
                    <History className="h-3.5 w-3.5 text-blue-400" />
                    Historique complet (Logs)
                  </button>

                  <button
                    onClick={() => {
                      window.open(window.location.origin + "?patientId=" + patient.id + "&token=" + token, "_blank");
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all mt-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ouvrir dans un nouvel onglet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT PATIENT FORM (Modifier) */}
      {editingPatient && editFormData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in shadow-xl">
          <div className="bg-white rounded-[24px] max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-teal-800 text-white rounded-t-[24px]">
              <div>
                <h3 className="font-sans font-bold text-lg">✏️ Modification d'Affiliation Patient</h3>
                <p className="text-xs text-teal-100 mt-1">Dossier N° {editingPatient.id}</p>
              </div>
              <button 
                onClick={() => setEditingPatient(null)}
                className="p-1.5 hover:bg-teal-700 bg-teal-900 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-left font-sans text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Nom de famille</label>
                  <input
                    type="text"
                    value={editFormData.lastName}
                    onChange={e => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Prénom</label>
                  <input
                    type="text"
                    value={editFormData.firstName}
                    onChange={e => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Date de naissance</label>
                  <input
                    type="date"
                    value={editFormData.dateOfBirth}
                    onChange={e => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Genre</label>
                  <select
                    value={editFormData.gender}
                    onChange={e => setEditFormData({ ...editFormData, gender: e.target.value })}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl"
                  >
                    <option value="M">Masculin (H)</option>
                    <option value="F">Féminin (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Téléphone</label>
                  <input
                    type="text"
                    value={editFormData.phone}
                    onChange={e => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl font-mono text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Adresse E-mail</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={e => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Nationalité</label>
                  <input
                    type="text"
                    value={editFormData.nationalite}
                    onChange={e => setEditFormData({ ...editFormData, nationalite: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Ethnie</label>
                  <input
                    type="text"
                    value={editFormData.ethnie}
                    onChange={e => setEditFormData({ ...editFormData, ethnie: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Groupe Sanguin</label>
                  <select
                    value={editFormData.bloodType}
                    onChange={e => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                    className="w-full h-10 px-3 py-2 bg-white border border-gray-300 rounded-xl font-bold"
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase">Allergies</label>
                  <input
                    type="text"
                    value={editFormData.allergies}
                    onChange={e => setEditFormData({ ...editFormData, allergies: e.target.value })}
                    className="w-full h-10 px-3 py-2 border border-gray-300 rounded-xl text-rose-700 font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 border border-slate-350 bg-slate-50 text-slate-700 font-bold rounded-xl hover:bg-slate-100 cursor-pointer text-xs"
                >
                  Annuler & Fermer
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PATIENT HISTORY (Logs / Traces d'Audit) */}
      {viewingHistoryPatient && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 transition-all animate-fade-in shadow-xl">
          <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-800 text-white rounded-t-[24px]">
              <div>
                <h3 className="font-sans font-bold text-lg flex items-center gap-2">
                  <History className="h-5 w-5 text-teal-400" />
                  Traces d'Audit & Historique de Modifications
                </h3>
                <p className="text-xs text-slate-200 mt-1">Dossier Clinique Unique de : <strong>{viewingHistoryPatient.lastName.toUpperCase()} {viewingHistoryPatient.firstName}</strong></p>
              </div>
              <button 
                onClick={() => setViewingHistoryPatient(null)}
                className="p-1.5 hover:bg-slate-700 bg-slate-900 text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-left">
              {historyLoading ? (
                <div className="text-center py-10 font-mono text-sm text-gray-400">Interrogation du registre d'audit en cours...</div>
              ) : patientHistoryList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm border border-dashed rounded-xl">
                  Aucun log de modification directe enregistré pour ce dossier patient (Fiche d'Origine Intacte).
                </div>
              ) : (
                <div className="space-y-3 font-sans">
                  {patientHistoryList.map((log: any) => (
                    <div key={log.id} className="p-4 bg-slate-50 border border-slate-250 rounded-[18px] text-xs space-y-2 text-left">
                      <div className="flex justify-between items-center text-gray-500 font-mono">
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg">ID: #{log.id}</span>
                        <span>{new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                      </div>
                      <p className="text-slate-800 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100 text-[12.5px]">
                        {log.details}
                      </p>
                      {log.userId && (
                        <div className="text-right text-[10.5px] text-slate-500 font-bold">
                          Auteur Identifié: Dr. / Agent ID: {log.userId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-slate-50 rounded-b-[24px] flex justify-end">
              <button
                type="button"
                onClick={() => setViewingHistoryPatient(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl cursor-pointer text-xs"
              >
                Fermer le Registre d'Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
