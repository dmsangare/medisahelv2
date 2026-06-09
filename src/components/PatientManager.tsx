import React, { useState, useEffect } from "react";
import { Search, UserPlus, FileText, Heart, ShieldAlert, Check, ChevronRight, FileSpreadsheet, Printer } from "lucide-react";
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
    ethnie: "Non renseignée",
    nationalite: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
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
        ethnie: "Non renseignée",
        nationalite: ""
      });
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
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prénom(s) <span className="text-rose-500">*</span></label>
            <input
              type="text"
              value={formData.firstName}
              onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Moussa"
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
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Numéro d'Identité National (NID) - <span className="text-gray-400 font-normal">Optionnel</span></label>
            <input
              type="text"
              value={formData.nationalId}
              onChange={e => setFormData({ ...formData, nationalId: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. N-19900812-BKO (généré sinon)"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de Naissance <span className="text-rose-500">*</span></label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sexe biologique</label>
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone de contact</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Groupe Sanguin</label>
            <select
              value={formData.bloodType}
              onChange={e => setFormData({ ...formData, bloodType: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
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
            <label className="block text-xs font-medium text-gray-600 mb-1">Allergies médicamenteuses connues</label>
            <input
              type="text"
              value={formData.allergies}
              onChange={e => setFormData({ ...formData, allergies: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Pénicilline, Aspirine"
            />
          </div>

           <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ethnie</label>
            <select
              value={formData.ethnie}
              onChange={e => setFormData({ ...formData, ethnie: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
            >
              <option value="Non renseignée">Non renseignée</option>
              <option value="Bambara">Bambara</option>
              <option value="Peul">Peul</option>
              <option value="Dogon">Dogon</option>
              <option value="Malinké">Malinké</option>
              <option value="Soninké">Soninké</option>
              <option value="Songhaï">Songhaï</option>
              <option value="Touareg">Touareg</option>
              <option value="Bozo">Bozo</option>
              <option value="Sénoufo">Sénoufo</option>
              <option value="Minianka">Minianka</option>
              <option value="Bobo">Bobo</option>
              <option value="Bwa">Bwa</option>
              <option value="Khassonké">Khassonké</option>
              <option value="Maure">Maure</option>
              <option value="Arabe">Arabe</option>
              <option value="Samogo">Samogo</option>
              <option value="Dafing">Dafing</option>
              <option value="Bella">Bella</option>
              <option value="Haoussa">Haoussa</option>
              <option value="Kagoro">Kagoro</option>
              <option value="Mossi">Mossi</option>
              <option value="Dioula">Dioula</option>
              <option value="Wassoulou">Wassoulou</option>
              <option value="AUTRES">AUTRES</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nationalité <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.nationalite}
              onChange={e => setFormData({ ...formData, nationalite: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="e.g. Malienne, Ivoirienne"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Adresse Domiciliaire Résidentielle</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm focus:ring-1 focus:ring-teal-700 focus:outline-none"
              placeholder="Quartier résidentiel, Ville, Mali"
            />
          </div>

          <div className="md:col-span-3 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-750 text-sm font-medium rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-white bg-teal-700 hover:bg-teal-800 text-sm font-medium rounded-xl shadow-sm cursor-pointer"
            >
              Confirmer l'Enregistrement
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
              className="inline-flex items-center px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer"
              title="Exporter sous format Excel (CSV)"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              Exporter Excel (CSV)
            </button>
            <button
              type="button"
              onClick={handlePrintRegistry}
              className="inline-flex items-center px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition duration-150 cursor-pointer"
              title="Imprimer le registre des patients"
            >
              <Printer className="h-4 w-4 mr-2 text-indigo-600" />
              Imprimer Registre
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 font-mono text-sm text-gray-400">Loading registry information...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-2xl">
            Aucun enregistrement ne correspond à vos critères de recherche.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="patients-table">
              <thead>
                <tr className="border-b border-gray-150 text-gray-400 text-xs font-mono uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal">Identité & Sexe</th>
                  <th className="py-3 px-4 font-normal">ID National (NID)</th>
                  <th className="py-3 px-4 font-normal">Date de Naissance</th>
                  <th className="py-3 px-4 font-normal">Groupe Sanguin</th>
                  <th className="py-3 px-4 font-normal">Téléphone & Email</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredPatients.map(patient => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors duration-100 group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${patient.gender === "M" ? "bg-teal-500" : "bg-rose-400"}`} />
                        <span className="font-sans font-medium text-gray-900">
                          {patient.lastName.toUpperCase()} {patient.firstName}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 pl-4.5 mt-0.5">
                        {patient.nationalite || "Malienne"} • {patient.ethnie || "Bambara"}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600">{patient.nationalId}</td>
                    <td className="py-3 px-4 text-gray-600">{patient.dateOfBirth}</td>
                    <td className="py-3 px-4">
                      {patient.bloodType ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {patient.bloodType}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-gray-950 font-sans">{patient.phone || "Non spécifié"}</div>
                      <div className="text-xs text-gray-400 font-sans">{patient.email || ""}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPatientForDossier(patient)}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
                          id={`dossier-btn-${patient.id}`}
                        >
                          <FileText className="h-3.5 w-3.5 mr-1 text-slate-500" />
                          Dossier Complet
                        </button>
                        {onSelectPatient && (
                          <button
                            onClick={() => onSelectPatient(patient)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-teal-200 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors duration-150 cursor-pointer"
                            id={`dme-btn-${patient.id}`}
                          >
                            <Heart className="h-3.5 w-3.5 mr-1 text-teal-400" />
                            Accéder au DME
                            <ChevronRight className="h-3.5 w-3.5 ml-1 opacity-60" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
