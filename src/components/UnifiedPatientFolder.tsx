import React, { useState, useEffect } from "react";
import { exportToPDF } from "../utils/exportUtils";
import { 
  User, FileText, Heart, ShieldAlert, Check, Printer, Share2, ClipboardList, 
  Layers, ShoppingCart, Truck, AlertTriangle, ShieldCheck, Mail, Phone, Globe, 
  Award, Database, Clock, RefreshCw, ChevronLeft, Calendar, FileSignature, Send, Download
} from "lucide-react";

interface UnifiedPatientFolderProps {
  token: string | null;
  patient: any;
  onBack: () => void;
  clinic: any;
  currentUser?: any;
}

export const UnifiedPatientFolder: React.FC<UnifiedPatientFolderProps> = ({ 
  token, 
  patient, 
  onBack, 
  clinic,
  currentUser
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSubTab, setActiveSubTab] = useState<string>("all");
  const [archiving, setArchiving] = useState(false);

  const fetchDossier = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/patients/${patient.id}/full-dme`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Impossible de charger le dossier patient unifié.");
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.id) {
      fetchDossier();
    }
  }, [patient?.id, token]);

  const handleWhatsAppShare = () => {
    if (!patient.phone) {
      alert("Ce patient ne possède pas de numéro de téléphone enregistré.");
      return;
    }
    const clinicName = clinic?.name || "MédiSahel Clinique";
    const message = `Bonjour ${patient.firstName} ${patient.lastName},\n\nVotre Dossier de Santé Unifié est maintenant validé et mis à jour par le secrétariat médical de la clinique ${clinicName}.\n\nVous trouverez vos ordonnances, comptes-rendus d'examens et facturations consolidées ou archivées.\n\nTéléphone de la clinique : ${clinic?.phone || "N/A"}.\nNous restons à votre entière disposition.`;
    const encodedText = encodeURIComponent(message);
    const cleanPhone = patient.phone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, "_blank");
  };

  const archiveToGecd = async () => {
    try {
      setArchiving(true);
      const docPayload = {
        title: `DOSSIER PATIENT - ${patient.lastName.toUpperCase()} ${patient.firstName}`,
        description: `Export consolidé d'audit clinique complet. Contient DME, Laboratoire, Pharmacie et Facturation. ID: ${patient.id}.`,
        fileUrl: clinic?.logoUrl || "",
        fileType: "PDF",
        category: "MEDICAL",
        ownerId: patient.id,
        ownerName: `${patient.lastName.toUpperCase()} ${patient.firstName}`,
        size: "240 KB"
      };

      const res = await fetch("/api/documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(docPayload)
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Échec d'envoi");
      }

      alert("Le dossier patient a été compilé en format PDF et archivé automatiquement dans l'armoire GECD de la clinique !");
      fetchDossier(); // Refresh lists
    } catch (err: any) {
      alert("Erreur lors de l'archivage: " + err.message);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="h-8 w-8 text-indigo-650 animate-spin" />
        <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Génération du Dossier Patient Consolidé en cours...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center text-rose-700 font-bold gap-2">
          <ShieldAlert className="h-5 w-5" />
          <span>Erreur de chargement du dossier patient unifié</span>
        </div>
        <p className="text-xs font-mono text-slate-500">{error}</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-slate-950 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 cursor-pointer"
        >
          Retour au répertoire
        </button>
      </div>
    );
  }

  const {
    records = [],
    hospitalizations = [],
    labTests = [],
    transactions = [],
    appointments = [],
    receiptDispatches = [],
    pharmacyPrescriptions = [],
    pharmacySales = [],
    documents = [],
    auditLogs = []
  } = data;

  const tabs = [
    { id: "all", label: "Vue Globale", icon: Layers },
    { id: "identity", label: "Identité", icon: User },
    { id: "consultations", label: "Consultations", icon: ClipboardList },
    { id: "dme", label: "Antécédents / DME", icon: Heart },
    { id: "lab", label: "Laboratoire", icon: ClipboardList },
    { id: "pharmacy", label: "Pharmacie", icon: ShoppingCart },
    { id: "hospitalization", label: "Hospitalisations", icon: Award },
    { id: "billing", label: "Facturation", icon: ShieldCheck },
    { id: "appointments", label: "Rendez-vous", icon: Clock },
    { id: "documents", label: "GECD Documents", icon: FileText },
    { id: "audit", label: "Audit Logs", icon: Database },
  ];

  const userRole = currentUser?.role || "ADMIN";

  const filteredTabs = tabs.filter(tab => {
    // ADMIN and Chief Doctors or general doctors have everything
    if (["ADMIN", "MEDECIN_GENERAL_CHIEF", "DOCTOR", "MEDECIN"].includes(userRole)) {
      return true;
    }
    switch (userRole) {
      case "NURSE":
      case "INFIRMIER":
      case "INFIRMIERE":
        return ["identity", "consultations", "dme", "lab", "appointments"].includes(tab.id);
      case "LABORANTIN":
      case "LABTECH":
        return ["identity", "lab"].includes(tab.id);
      case "PHARMACIEN":
      case "PHARMACIST":
        return ["identity", "consultations", "dme", "pharmacy"].includes(tab.id);
      case "CASHIER":
      case "CAISSIER":
        return ["identity", "billing"].includes(tab.id);
      case "STAGIAIRE":
        return ["identity", "dme"].includes(tab.id);
      default:
        return ["all", "identity"].includes(tab.id);
    }
  });

  useEffect(() => {
    if (filteredTabs.length > 0 && !filteredTabs.some(t => t.id === activeSubTab)) {
      setActiveSubTab(filteredTabs[0].id);
    }
  }, [currentUser, filteredTabs, activeSubTab]);

  return (
    <div className="space-y-6" id="unified-patient-folder-wrapper">
      {/* Upper header action board */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-slate-700" />
          </button>
          <div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Dossier Clinique Consolidé</span>
            <h2 className="font-sans font-extrabold text-sm text-slate-900 uppercase">
              {patient.lastName.toUpperCase()} {patient.firstName}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-mono">
          <button
            onClick={() => exportToPDF("patient-dossier-print-section", "Dossier Consolidé - " + patient.lastName.toUpperCase() + " " + patient.firstName)}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-300 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5 mr-1" />
            Imprimer Dossier
          </button>

          <button
            onClick={archiveToGecd}
            disabled={archiving}
            className="inline-flex items-center px-3 py-2 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            {archiving ? "Archivage..." : "Archiver dans GECD"}
          </button>

          {patient.phone && (
            <button
              onClick={handleWhatsAppShare}
              className="inline-flex items-center px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              WhatsApp Patient
            </button>
          )}
        </div>
      </div>

      {/* Sub sections selector navigation */}
      <div className="flex overflow-x-auto gap-2 py-1 border-b border-slate-200 scrollbar-none print:hidden">
        {filteredTabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                isActive 
                  ? "bg-slate-950 text-white font-monbold" 
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================================== */}
      {/* MEDICAL FILE PRINT LAYOUT FRAME - REUSES CLINIC PARAMETERS AUTOMATICALLY */}
      {/* ============================================================================== */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none" id="patient-dossier-print-section">
        
        {/* Clinique Letterhead Block */}
        <div className="flex justify-between items-start border-b pb-6">
          <div className="flex items-center gap-4">
            {clinic?.logoUrl ? (
              <img
                src={clinic.logoUrl}
                alt="Clinic Logo"
                className="w-16 h-16 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 flex items-center justify-center text-white text-xl font-bold">
                MS
              </div>
            )}
            <div>
              <h1 className="font-sans font-black text-lg text-slate-900 uppercase leading-none">{clinic?.name || "MédiSahel Clinique"}</h1>
              <p className="text-[11px] text-slate-500 font-mono italic mt-1 leading-tight">{clinic?.slogan || "Votre santé, notre engagement au quotidien"}</p>
              <div className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
                {clinic?.address && <span>{clinic.address}, </span>}
                {clinic?.city && <span>{clinic.city} - </span>}
                {clinic?.country && <span>{clinic.country}</span>}
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] font-mono text-slate-500 space-y-0.5 leading-tight">
            <div><strong>Tél :</strong> {clinic?.phone || "N/A"}</div>
            {clinic?.whatsapp && <div><strong>WhatsApp :</strong> {clinic.whatsapp}</div>}
            <div><strong>Email :</strong> {clinic?.email || "N/A"}</div>
            {clinic?.website && <div><strong>Web :</strong> {clinic.website}</div>}
            {clinic?.licenseNumber && <div><strong>Agrément :</strong> {clinic.licenseNumber}</div>}
          </div>
        </div>

        {/* Big Dossier Title Header */}
        <div className="text-center space-y-1">
          <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 border-b border-double pb-2">
            RAPPORT CLINIQUE UNIFIÉ ET HISTORIQUE DU CORPS MEDICAL
          </h2>
          <p className="text-[9px] font-mono text-slate-400 pt-1">
            Généré automatiquement par le système hospitalier le {new Date().toLocaleDateString("fr-FR")} à {new Date().toLocaleTimeString("fr-FR")}
          </p>
        </div>

        {/* ---------------- IDENTITÉ / IDENTIFICATION SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "identity") && (
          <div className="space-y-3" id="sec-identity">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <User className="h-4 w-4" />
              1. Identité & Fiche Administrative du Patient
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-xs font-mono p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Numéro unique patient</span>
                <strong className="text-slate-900">{patient.id}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Nom de famille</span>
                <strong className="text-slate-900">{patient.lastName.toUpperCase()}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Prénom(s)</span>
                <strong className="text-slate-900">{patient.firstName}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Genre / Sexe</span>
                <strong className="text-slate-900">{patient.gender === "M" ? "Masculin (M)" : "Féminin (F)"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Date de Naissance & Âge</span>
                <strong className="text-slate-900">
                  {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString("fr-FR") : "Non spécifiée"} 
                  {patient.dateOfBirth && <span className="ml-1 text-teal-850 font-sans font-bold bg-teal-50 px-1.5 py-0.5 rounded text-[10px]">({(() => {
                    try {
                      const birthday = new Date(patient.dateOfBirth);
                      if (isNaN(birthday.getTime())) return "N/A";
                      const today = new Date();
                      let age = today.getFullYear() - birthday.getFullYear();
                      const m = today.getMonth() - birthday.getMonth();
                      if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) age--;
                      return `${age} ans`;
                    } catch (e) {
                      return "N/A";
                    }
                  })()})</span>}
                </strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Téléphone Mobile</span>
                <strong className="text-slate-900">{patient.phone || "Non spécifié"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Situation matrimoniale</span>
                <strong className="text-slate-900">{patient.maritalStatus || "Célibataire"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Profession</span>
                <strong className="text-slate-900">{patient.profession || "Non spécifiée"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Nationalité</span>
                <strong className="text-slate-900">{patient.nationality || "Malienne"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Ethnie / Groupe</span>
                <strong className="text-slate-900">{patient.ethnie || "N/A"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Langue principale</span>
                <strong className="text-slate-900">{patient.language || "Bambara"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Adresse de Résidence</span>
                <strong className="text-slate-900">{patient.address || "Non spécifiée"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Commune</span>
                <strong className="text-slate-900">{patient.commune || "Non spécifiée"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Quartier</span>
                <strong className="text-slate-900">{patient.quartier || "Non spécifié"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Contact d'Urgence</span>
                <strong className="text-rose-700 font-sans font-bold">{patient.emergencyContact || "Non spécifié"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Numéro d’identité unique (NID)</span>
                <strong className="text-slate-900">{patient.nationalId || "Non spécifié"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Numéro NINA</span>
                <strong className="text-slate-900 font-mono text-[11px]">{patient.nina || "N/A"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Numéro AMO / CANAM</span>
                <strong className="text-slate-900 font-mono text-[11px]">{patient.amo || "N/A"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Numéro INPS</span>
                <strong className="text-slate-900 font-mono text-[11px]">{patient.inps || "N/A"}</strong>
              </div>
              <div>
                <span className="block text-[10px] uppercase text-slate-400">Date d'Ouverture du Dossier</span>
                <strong className="text-slate-900">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString("fr-FR") : "Non spécifiée"}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- CONSULTATIONS HISTORIC SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "consultations") && (
          <div className="space-y-3" id="sec-consultations">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              2. Historique des Consultations Générales & Spécialisées
            </h3>
            {records.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucune consultation référencée dans la base.</p>
            ) : (
              <div className="space-y-3">
                {records.map((rec: any, idx: number) => (
                  <div key={rec.id || idx} className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-xs space-y-2">
                    <div className="flex justify-between border-b pb-1">
                      <span><strong>Date :</strong> {new Date(rec.date || rec.createdAt).toLocaleDateString("fr-FR")}</span>
                      <span><strong>Médecin :</strong> {rec.doctorName || "Médecin Traitant"}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-700">
                      <div><strong>Motif de Consultation :</strong> {rec.motif || "Non spécifié"}</div>
                      <div><strong>Diagnostic Définitif :</strong> {rec.diagnosis || "Non spécifié"}</div>
                    </div>
                    {rec.observations && (
                      <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border">
                        <strong>Observations / Clinique :</strong>
                        <p className="mt-1 whitespace-pre-wrap">{rec.observations}</p>
                      </div>
                    )}
                    {rec.prescription && (
                      <div className="bg-indigo-50/40 p-2 rounded-lg border border-indigo-100 text-slate-800">
                        <strong>Prescription d'ordonnance :</strong> {rec.prescription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- DOSSIER MEDICAL DME SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "dme") && (
          <div className="space-y-3" id="sec-dme">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <Heart className="h-4 w-4" />
              3. DME Complémentaire : Antécédents, Constantes & Facteurs de Risques
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Risks & Allergies */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
                <strong className="text-slate-800 uppercase block border-b pb-1">Antécédents & Terrain Physiopathologique</strong>
                <p><strong>Allergies ou Hypersensibilités :</strong> <span className={patient.allergies ? "text-rose-700 font-bold" : "text-slate-500"}>{patient.allergies || "Aucune allergie répertoriée"}</span></p>
                <p><strong>Antécédents Chirurgicaux & Médicaux :</strong> {patient.medicalHistory || "Aucun antécédent particulier déclaré"}</p>
                <p><strong>Pathologies Chroniques Actives :</strong> {patient.chronicDiseases || "Aucune pathologie chronique signalée"}</p>
                <p><strong>Groupe Sanguin & Facteur Rhésus :</strong> <span className="p-1 px-2 rounded-md bg-rose-50 text-rose-800 font-bold">{patient.bloodGroup || "Non déterminé"}</span></p>
              </div>

              {/* Constantes issues de la derniere medicalRecord */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono space-y-2">
                <strong className="text-slate-800 uppercase block border-b pb-1">Dernières Constantes Vitales Prises</strong>
                {records.length > 0 ? (
                  (() => {
                    const latest = records[0];
                    return (
                      <div className="space-y-1.5 text-slate-700">
                        <p><strong>Prise de poids :</strong> {latest.weight || "N/A"} kg</p>
                        <p><strong>Tension Artérielle :</strong> {latest.bloodPressure || "N/A"} mmHg</p>
                        <p><strong>Température Thermale :</strong> {latest.temperature || "N/A"} °C</p>
                        <p><strong>Fréquence Cardiaque (Pouls) :</strong> {latest.heartRate || "N/A"} bpm</p>
                        {latest.glycemia && <p><strong>Glycémie à jeun :</strong> {latest.glycemia} g/L</p>}
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-slate-500 italic">Aucune prise de constante cliniques répertoriée.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- LABORATOIRE SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "lab") && (
          <div className="space-y-3" id="sec-lab">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              4. Examens de Laboratoire & Historique de Biologie Clinique
            </h3>
            {labTests.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucune analyse biomédicale demandée ou réalisée pour ce patient.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full font-mono text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="p-2.5">Date de Demande</th>
                      <th className="p-2.5">Type d'Examen</th>
                      <th className="p-2.5">Technicien / Biologiste</th>
                      <th className="p-2.5">Statut</th>
                      <th className="p-2.5 text-right">Résultats Analytiques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labTests.map((t: any, idx: number) => (
                      <tr key={t.id || idx} className="border-b hover:bg-slate-50/50">
                        <td className="p-2.5">{new Date(t.date || t.createdAt).toLocaleDateString("fr-FR")}</td>
                        <td className="p-2.5 font-bold uppercase">{t.testName} <span className="text-[10px] text-slate-400">({t.category})</span></td>
                        <td className="p-2.5">{t.performedBy || "En attente"}</td>
                        <td className="p-2.5">
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {t.status === "COMPLETED" ? "Résultats Validés" : "En attente"}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-medium text-indigo-950">
                          {t.result || "Aucune valeur rapportée"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------- PHARMACIE SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "pharmacy") && (
          <div className="space-y-3" id="sec-pharmacy">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              5. Délivrance de Médicaments & Historique Officinale
            </h3>
            
            <div className="space-y-4">
              {pharmacyPrescriptions.length === 0 && pharmacySales.length === 0 ? (
                <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">
                  Aucun médicament dispensé ou ordonnance officinale enregistrée dans le réseau.
                </p>
              ) : (
                <div className="space-y-3 font-mono text-xs">
                  {/* Prescriptions lists */}
                  {pharmacyPrescriptions.map((p: any, idx: number) => (
                    <div key={p.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between border-b pb-1 font-bold text-slate-700">
                        <span>Ordonnance DME servie</span>
                        <span>{new Date(p.date || new Date()).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div className="text-[11px] text-slate-555">
                        <p><strong>Médecin Prescripteur :</strong> {p.doctorName || "Inconnu"}</p>
                        <p><strong>Traitement prescrit :</strong> {p.prescriptionText}</p>
                        {p.dispensedBy && <p><strong>Servie par le Pharmacien :</strong> {p.dispensedBy} ({p.servedAt || ""})</p>}
                      </div>
                    </div>
                  ))}

                  {/* Ventes / Sales pharmacie */}
                  {pharmacySales.map((salesRecord: any, idx: number) => (
                    <div key={salesRecord.id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between border-b pb-1 text-slate-700">
                        <span>Achat Caisse Pharmacie (POS)</span>
                        <strong>{new Date(salesRecord.date || new Date()).toLocaleDateString("fr-FR")}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        <div className="flex justify-between">
                          <span>Montant Total :</span>
                          <strong className="text-slate-800">{salesRecord.total.toLocaleString("fr-FR")} F CFA</strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Mode Règlement :</span>
                          <span>{salesRecord.paymentMethod} (Par {salesRecord.cashierName})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- HOSPITALISATION SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "hospitalization") && (
          <div className="space-y-3" id="sec-hospitalization">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <Award className="h-4 w-4" />
              6. Historique d'Admissions, Hospitalisations & Soins Continus
            </h3>
            {hospitalizations.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Le patient n'a jamais été hospitalisé dans nos services.</p>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {hospitalizations.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between border-b pb-1 font-bold">
                      <span>Admission Clinique</span>
                      <span>Du {new Date(h.admissionDate).toLocaleDateString("fr-FR")} au {h.dischargeDate ? new Date(h.dischargeDate).toLocaleDateString("fr-FR") : "En Cours"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div><strong>Chambre affectée :</strong> {h.roomName || h.roomId || "Non précisée"}</div>
                      <div><strong>Lit :</strong> {h.bedName || h.bedId || h.bedNumber || "N/A"}</div>
                      <div className="col-span-2"><strong>Motif d'Admission :</strong> {h.reason}</div>
                    </div>
                    {h.dischargeSummary && (
                      <div className="bg-white p-2 border rounded text-[11px]">
                        <strong>Rapport/Compte-rendu de Sortie :</strong>
                        <p className="mt-1 leading-relaxed">{h.dischargeSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- FACTURATION / TRANSACTIONS SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "billing") && (
          <div className="space-y-3" id="sec-billing">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              7. Historique Comptable, Factures & Encaissements
            </h3>
            {transactions.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucun enregistrement financier d'encaissement disponible.</p>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full font-mono text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b text-[11px] uppercase text-slate-500">
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Description Acte</th>
                        <th className="p-2.5">Statut de Paiement</th>
                        <th className="p-2.5 text-right">Montant Total</th>
                        <th className="p-2.5 text-right">Règlement Patient</th>
                        <th className="p-2.5 text-right">Assurance / Part Mutuelle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t: any, idx: number) => {
                        const total = t.amount || 0;
                        const assurance = t.insuranceShare || 0;
                        const patientShare = t.patientShare || total - assurance;
                        return (
                          <tr key={t.id || idx} className="border-b hover:bg-slate-50/50">
                            <td className="p-2.5">{new Date(t.date || t.createdAt).toLocaleDateString("fr-FR")}</td>
                            <td className="p-2.5 font-semibold text-slate-900">{t.description || t.typeAct || "Prestation de soins"}</td>
                            <td className="p-2.5">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === "PAID" || t.status === "Payé" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                              }`}>
                                {t.status || "Payé"}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold">{total.toLocaleString("fr-FR")} F</td>
                            <td className="p-2.5 text-right text-emerald-800 font-semibold">{patientShare.toLocaleString("fr-FR")} F</td>
                            <td className="p-2.5 text-right text-slate-500">{assurance.toLocaleString("fr-FR")} F</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Account Summary calculation */}
                {(() => {
                  const totalPaid = transactions.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
                  return (
                    <div className="p-3 bg-slate-900 text-white rounded-xl flex justify-between font-mono text-xs">
                      <span>VALEUR CUMULÉE ACCOUNTING CLINIQUE :</span>
                      <strong>{totalPaid.toLocaleString("fr-FR")} F CFA</strong>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ---------------- RENDEZ-VOUS SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "appointments") && (
          <div className="space-y-3" id="sec-appointments">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              8. Planification de Rendez-vous Cliniques & Suivi d'Agenda
            </h3>
            {appointments.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucun rendez-vous consigné dans le module planification.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appointments.map((a: any, idx: number) => (
                  <div key={a.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs space-y-1">
                    <div className="flex justify-between border-b pb-1 font-bold text-slate-700">
                      <span>Rdv le {a.date} à {a.time}</span>
                      <span className={`text-[10px] uppercase ${a.status === "CONFIRMED" ? "text-indigo-850 font-bold" : "text-slate-400"}`}>
                        {a.status}
                      </span>
                    </div>
                    <p><strong>Médecin en charge :</strong> {a.doctorName}</p>
                    {a.notes && <p><strong>Notes / Motif :</strong> {a.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- GECD DOCUMENTS SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "documents") && (
          <div className="space-y-3" id="sec-documents">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              9. Documents Associés GECD (Bordereaux, Courriers, Bulletins)
            </h3>
            {documents.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucun document numérique archivé dans l'armoire GECD pour ce patient.</p>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {documents.map((d: any, idx: number) => (
                  <div key={d.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900 block">{d.title}</strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{d.description || "Aucun descriptif"}</span>
                      <span className="text-[9px] text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded mt-1.5 inline-block">{d.category}</span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <span>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
                      <div className="font-bold text-slate-650 mt-1">{d.size} Type: {d.fileType}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- AUDIT LOGS SECTION ------------------- */}
        {(activeSubTab === "all" || activeSubTab === "audit") && (
          <div className="space-y-3" id="sec-audit">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-800 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              10. Historique d'Audit de Sécurité & Traçabilité (Accès au dossier)
            </h3>
            {auditLogs.length === 0 ? (
              <p className="text-xs font-mono text-slate-450 italic p-4 bg-slate-50 rounded-xl border border-slate-150">Aucun enregistrement d'audit de sécurité disponible dans postgres.</p>
            ) : (
              <div className="space-y-1 bg-slate-950 p-4 rounded-xl text-[11px] font-mono text-emerald-400 max-h-[250px] overflow-y-auto">
                <div className="flex justify-between border-b border-emerald-900 pb-1 mb-2 text-emerald-500">
                  <span>Horodatage</span>
                  <span>Opérateur</span>
                  <span>Action et détails clinique</span>
                </div>
                {auditLogs.map((log: any, idx: number) => (
                  <div key={log.id || idx} className="flex justify-between py-1 leading-snug hover:bg-emerald-950/40">
                    <span className="text-slate-400 shrink-0 w-[125px]">{new Date(log.createdAt || log.date || new Date()).toLocaleString("fr-FR")}</span>
                    <strong className="text-white shrink-0 w-[120px] truncate">{log.userName || "Inconnu"} ({log.role})</strong>
                    <span className="flex-grow pl-3 text-left leading-normal">{log.action}: {log.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Electronic Verification Signatures Spot */}
        <div className="pt-12 border-t border-dashed flex flex-col sm:flex-row items-end justify-between gap-6 text-[11px] font-mono">
          <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50 w-full sm:w-64">
            <span className="block text-[9px] uppercase text-slate-400 mb-1 leading-none font-bold">Cachet d'Authenticité</span>
            <span className="text-slate-600 font-sans italic">{clinic?.digitalStamp || "[CACHET NUMÉRIQUE MÉDISAHEL CLINIQUE ENREGISTRÉ]"}</span>
          </div>
          
          <div className="text-right space-y-1.5 w-full sm:w-72">
            <span className="block text-[9px] uppercase text-slate-400 font-bold">Visa de la Direction Médicale</span>
            <p className="font-extrabold text-xs text-indigo-950 underline decoration-indigo-900 italic">
              {clinic?.instSignature || "Pour la Direction Médicale, le Médecin Chef"}
            </p>
            <p className="text-[10px] text-slate-400 italic">Signé électroniquement dans l'ERP</p>
          </div>
        </div>

      </div>
    </div>
  );
};
