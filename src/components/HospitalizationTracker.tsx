import React, { useState, useEffect } from "react";
import { 
  Bed, 
  CircleDot, 
  UserCheck, 
  ShieldAlert, 
  Check, 
  Calendar, 
  Plus, 
  Info, 
  CheckCircle2, 
  ArrowLeftRight, 
  Settings, 
  Trash2, 
  Edit, 
  RefreshCw, 
  Home, 
  Users, 
  DollarSign, 
  Activity, 
  Percent, 
  Clock, 
  History,
  AlertTriangle, 
  Filter,
  HeartPulse,
  Stethoscope,
  Pill,
  FlaskConical,
  ClipboardList,
  TrendingUp
} from "lucide-react";
import { Hospitalization, Patient, User } from "../types.ts";

interface HospitalizationTrackerProps {
  token: string | null;
  patients: Patient[];
  userRole: string;
  currentUser?: User;
}

export const HospitalizationTracker: React.FC<HospitalizationTrackerProps> = ({ token, patients, userRole, currentUser }) => {
  const isHospUser = currentUser?.allowedModules?.includes("hospitalization") || false;
  
  const canReadHosp = userRole === "ADMIN" || 
    userRole === "DOCTOR" || 
    userRole === "NURSE" || 
    userRole === "MEDECIN_GENERAL_CHIEF" || 
    userRole === "AIDE_SOIGNANT" || 
    isHospUser;
  
  const canWriteHosp = userRole === "ADMIN" || 
    userRole === "DOCTOR" || 
    userRole === "NURSE" || 
    userRole === "MEDECIN_GENERAL_CHIEF" || 
    isHospUser;
  
  const isAdminHosp = userRole === "ADMIN" || isHospUser;

  const [activeTab, setActiveTab] = useState<"dashboard" | "admissions" | "rooms" | "beds" | "rates" | "transfers" | "reservations" | "stats" | "dg_dashboard">("dashboard");
  
  // Data States
  const [hospitalizations, setHospitalizations] = useState<Hospitalization[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [rates, setRates] = useState<any>({
    roomRates: { Classique: 0, Climatisée: 15000, VIP: 35000 },
    bedRates: { Classique: 0, Handicapé: 5000, VIP: 10000 }
  });
  const [transfers, setTransfers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);

  // Interactive clicks state for Schema 5 (TOUT EST CLIQUABLE - Hospitalisation)
  const [medisahelClickModal, setMedisahelClickModal] = useState<any | null>(null);

  const handleHospCellClick = (type: string, item: Hospitalization) => {
    const patient = patients.find(p => p.id === item.patientId);
    const patientName = patient ? `${patient.lastName.toUpperCase()} ${patient.firstName}` : "Patient Hospitalisé";
    const est = getEstimatedBill(item);

    if (type === "patient") {
      setMedisahelClickModal({
        isOpen: true,
        title: "Dossier Patient DME Unifié - Hospitalisation active",
        subtitle: `Dossier clinique de ${patientName}`,
        badge: "DME SÉCURISÉ",
        sections: [
          {
            title: "Informations Administratives & Identité",
            items: [
              { label: "Nom & Prénom", value: patientName },
              { label: "N° Identité National (NID)", value: patient?.nationalId || "P-9921-SEG" },
              { label: "Date de naissance / Genre", value: `${patient?.dateOfBirth || "N/A"} (${patient?.gender || "N/A"})` },
              { label: "Téléphone", value: patient?.phone || "+223 76 54 32 10" },
              { label: "Adresse physique", value: patient?.address || "Bamako, Mali" }
            ]
          },
          {
            title: "Antécédents du Séjour actif",
            items: [
              { label: "Groupe Sanguin", value: patient?.bloodType || "O+" },
              { label: "Allergies signalées", value: patient?.allergies || "Aucune" }
            ]
          }
        ],
        actions: [
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "room") {
      setMedisahelClickModal({
        isOpen: true,
        title: "AFFECTATION DU LIT & CONFORMITÉ SALLE",
        subtitle: `Localisation : Chambre ${item.roomNumber} | Lit ${item.bedNumber}`,
        badge: "CONFORME HYGIÈNE",
        sections: [
          {
            title: "Attribution Logistique",
            items: [
              { label: "Chambre", value: `Chambre ${item.roomNumber}` },
              { label: "N° Lit assigné", value: `Lit ${item.bedNumber}` },
              { label: "Catégorie de la Chambre", value: item.roomType || "Classique" },
              { label: "Spécificité du lit", value: item.bedType || "Standard" }
            ]
          },
          {
            title: "Maintenance & Équipe d'étage",
            items: [
              { label: "État de propreté certifié", value: "Validé conforme (Draps jetables neufs, ventilation active)." },
              { label: "Infirmière d'étage", value: "Aïssata DIALLO (Superviseuse)" }
            ]
          }
        ],
        actions: [
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "cost") {
      const roomCost = item.roomType ? ((rates.roomRates as Record<string, number>)[item.roomType] || 0) : 0;
      const bedCost = item.bedType ? ((rates.bedRates as Record<string, number>)[item.bedType] || 0) : 0;
      setMedisahelClickModal({
        isOpen: true,
        title: "DÉCOMPTE FINANCIER DÉTAILLÉ DU SÉJOUR",
        subtitle: `Suivi facturation en cours - ID ${item.id}`,
        badge: "COÛTS SIMULÉS",
        sections: [
          {
            title: "Indexation journalière des coûts (FCFA)",
            items: [
              { label: "Tarif unitaire Chambre", value: `${roomCost.toLocaleString()} FCFA / jour` },
              { label: "Surcoût spécification de Lit", value: `${bedCost.toLocaleString()} FCFA / jour` },
              { label: "Nombre de jours calculés", value: `${est.totalStayDays} jour(s)` },
              { label: "Total brut généré", value: `${est.totalPrice.toLocaleString()} FCFA` }
            ]
          },
          {
            title: "Régulation Remboursement Assurance",
            items: [
              { label: "Organisme payeur tiers", value: "CANAM Active (70%)" },
              { label: "Prise en charge Couverture", value: `${Math.round(est.totalPrice * 0.70).toLocaleString()} FCFA` },
              { label: "Ticket modérateur net Patient", value: `${Math.round(est.totalPrice * 0.30).toLocaleString()} FCFA` }
            ]
          }
        ],
        actions: [
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "dates") {
      setMedisahelClickModal({
        isOpen: true,
        title: "PLANNING D'ADMISSION & CYCLE DE SÉJOUR",
        subtitle: `Patient : ${patientName}`,
        badge: "VALIDE STAMPS",
        sections: [
          {
            title: "Traçabilité Calendaire",
            items: [
              { label: "Date d'admission officielle", value: new Date(item.admissionDate).toLocaleString() },
              { label: "Durée actuelle constatée", value: `${est.totalStayDays} jours` },
              { label: "Date de sortie estimée", value: item.dischargeDate ? new Date(item.dischargeDate).toLocaleDateString() : "Non programmée (selon avis médical quotidien)" }
            ]
          },
          {
            title: "Validation d'autorisation de sortie",
            items: [
              { label: "Pris requis cliniques", value: "Constantes stables, apyrexie avérée depuis 24h, bilan de sortie rédigé." },
              { label: "Signature Médecin Représentant", value: "Attente de validation en fin de protocole." }
            ]
          }
        ],
        actions: [
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    } else if (type === "reason") {
      setMedisahelClickModal({
        isOpen: true,
        title: "FICHE CLINIQUE DE PRE-ADMISSION (SOURCE)",
        subtitle: `Motif d'hospitalisation de : ${patientName}`,
        badge: "SOURCE CLINIQUE",
        sections: [
          {
            title: "Rapport de Décision Médicale",
            items: [
              { label: "Motif ou diagnostic initial", value: item.reason },
              { label: "Observation clinique d'entrée", value: item.notes || "Aucune observation libre complémentaire." },
              { label: "Médecin ordonnateur", value: "Dr. Ibrahim Touré (Urgences médicales)" }
            ]
          },
          {
            title: "Constantes d'arrivée (SAS)",
            items: [
              { label: "Température à l'entrée", value: "39.1 °C" },
              { label: "Tension Artérielle d'arrivée", value: "110/60 mmHg" },
              { label: "Degré d'urgence", value: "Urgence relative (Priorité Standard)" }
            ]
          }
        ],
        actions: [
          { label: "Fermer", onClick: () => setMedisahelClickModal(null) }
        ]
      });
    }
  };

  // Clinical Workspace Unified Espace States
  const [selectedClinicalHosp, setSelectedClinicalHosp] = useState<Hospitalization | null>(null);
  const [clinicalTab, setClinicalTab] = useState<"dme" | "surveillance" | "medications" | "labs">("dme");
  
  // DME Note States (Journal Clinique Quotidien)
  const [dmeSymptoms, setDmeSymptoms] = useState("");
  const [dmeDiagnosis, setDmeDiagnosis] = useState("");
  const [dmePrescription, setDmePrescription] = useState("");
  const [dmeNotes, setDmeNotes] = useState("");
  const [patientDmeRecords, setPatientDmeRecords] = useState<any[]>([]);
  
  // Surveillance Tab State
  const [constantTemp, setConstantTemp] = useState("37");
  const [constantBP, setConstantBP] = useState("120/80");
  const [constantPulse, setConstantPulse] = useState("75");
  const [constantSat, setConstantSat] = useState("98");
  const [constantWeight, setConstantWeight] = useState("70");
  const [constantGlucose, setConstantGlucose] = useState("1.0");
  const [constantNotes, setConstantNotes] = useState("");
  
  // Medications Tab State
  const [pharmacyItems, setPharmacyItems] = useState<any[]>([]);
  const [selectedMedId, setSelectedMedId] = useState("");
  const [medQty, setMedQty] = useState("1");
  const [medNotes, setMedNotes] = useState("");
  
  // Lab Tab State
  const [labTestName, setLabTestName] = useState("");
  const [labCategory, setLabCategory] = useState("BLOOD");
  const [labCost, setLabCost] = useState("15000");

  // Enriched Discharge Form States
  const [dischargeDiagnosis, setDischargeDiagnosis] = useState("");
  const [dischargeRecommendations, setDischargeRecommendations] = useState("");
  const [dischargeExtraActsPrice, setDischargeExtraActsPrice] = useState("0");
  const [dischargeIsDeceased, setDischargeIsDeceased] = useState(false);

  // Reservation Form State
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [reservationFormData, setReservationFormData] = useState({
    bedId: "",
    patientName: "",
    reservedAt: new Date().toISOString().substring(0, 16), // datetime-local
    autoReleaseHours: 24
  });

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter States for visualizer
  const [filterRoomType, setFilterRoomType] = useState("TOUS");
  const [filterBedType, setFilterBedType] = useState("TOUS");
  const [filterBedStatus, setFilterBedStatus] = useState("TOUS");
  const [filterService, setFilterService] = useState("TOUS");

  // Modals / Action states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    roomId: "",
    bedId: "",
    reason: "",
    notes: ""
  });

  // Transfer Action State
  const [selectedHospToTransfer, setSelectedHospToTransfer] = useState<Hospitalization | null>(null);
  const [transferData, setTransferData] = useState({
    toRoomId: "",
    toBedId: "",
    reason: ""
  });

  // Discharge Detail State
  const [selectedHospToDischarge, setSelectedHospToDischarge] = useState<Hospitalization | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState("");

  // CRUD Forms
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    number: "",
    type: "Classique",
    service: "Médecine Générale",
    floor: "Rez-de-chaussée",
    allowedGender: "Mixte",
    status: "Disponible",
    capacity: 2
  });

  const [showBedForm, setShowBedForm] = useState(false);
  const [editingBed, setEditingBed] = useState<any | null>(null);
  const [bedFormData, setBedFormData] = useState({
    number: "",
    type: "Classique",
    roomId: "",
    status: "Disponible",
    maintenanceReason: ""
  });

  const [isSyncingRates, setIsSyncingRates] = useState(false);
  const [tempRates, setTempRates] = useState({
    roomRates_Classique: 0,
    roomRates_Climatisée: 15000,
    roomRates_VIP: 35000,
    bedRates_Classique: 0,
    bedRates_Handicapé: 5000,
    bedRates_VIP: 10000
  });

  const [selectedBedForHistory, setSelectedBedForHistory] = useState<any | null>(null);
  const [bedHistoryList, setBedHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleViewBedHistory = async (bed: any) => {
    setSelectedBedForHistory(bed);
    setLoadingHistory(true);
    try {
      const authHeader = { Authorization: `Bearer ${token}` };
      const response = await fetch(`/api/hospitalization/beds/${bed.id}/history`, { headers: authHeader });
      if (response.ok) {
        const data = await response.json();
        setBedHistoryList(data);
      } else {
        setBedHistoryList([]);
      }
    } catch (err) {
      console.error("Error fetching bed history:", err);
      setBedHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch all collections in parallel
  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const authHeader = { Authorization: `Bearer ${token}` };
      const [respHosp, respRooms, respBeds, respRates, respTransfers, respRes] = await Promise.all([
        fetch("/api/hospitalizations", { headers: authHeader }),
        fetch("/api/hospitalization/rooms", { headers: authHeader }),
        fetch("/api/hospitalization/beds", { headers: authHeader }),
        fetch("/api/hospitalization/rates", { headers: authHeader }),
        fetch("/api/hospitalization/transfers", { headers: authHeader }),
        fetch("/api/hospitalization/reservations", { headers: authHeader })
      ]);

      if (!respHosp.ok || !respRooms.ok || !respBeds.ok || !respRates.ok || !respTransfers.ok) {
        throw new Error("Erreur lors de la synchronisation des données hospitalières.");
      }

      const hData = await respHosp.json();
      const rData = await respRooms.json();
      const bData = await respBeds.json();
      const priceData = await respRates.json();
      const tData = await respTransfers.json();
      const resData = respRes.ok ? await respRes.json() : [];

      setHospitalizations(hData);
      setRooms(rData);
      setBeds(bData);
      setRates(priceData);
      setTransfers(tData);
      setReservations(resData);

      // Pre-fill temp rates for prices tab
      setTempRates({
        roomRates_Classique: priceData.roomRates?.Classique || 0,
        roomRates_Climatisée: priceData.roomRates?.Climatisée || 15000,
        roomRates_VIP: priceData.roomRates?.VIP || 35000,
        bedRates_Classique: priceData.bedRates?.Classique || 0,
        bedRates_Handicapé: priceData.bedRates?.Handicapé || 5000,
        bedRates_VIP: priceData.bedRates?.VIP || 10000
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData();
    }
  }, [token]);

  // Admission Submit handler
  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.patientId || !formData.roomId || !formData.bedId || !formData.reason) {
      setError("Les champs Patient, Chambre, Lit et Motif d'admission sont requis.");
      return;
    }

    try {
      const response = await fetch("/api/hospitalizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec de l'admission");

      setSuccess("Admission du patient enregistrée avec succès.");
      setFormData({ patientId: "", roomId: "", bedId: "", reason: "", notes: "" });
      setShowAddForm(false);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Load unified Espace Clinique for active patient
  const loadClinicalWorkspace = async (hosp: Hospitalization) => {
    setSelectedClinicalHosp(hosp);
    setClinicalTab("dme");
    setError("");
    setSuccess("");
    
    // Reset forms
    setDmeSymptoms("");
    setDmeDiagnosis("");
    setDmePrescription("");
    setDmeNotes("");
    setConstantTemp("37");
    setConstantBP("120/80");
    setConstantPulse("75");
    setConstantSat("98");
    setConstantWeight("70");
    setConstantGlucose("1.0");
    setConstantNotes("");
    setSelectedMedId("");
    setMedQty("1");
    setMedNotes("");
    setLabTestName("");
    setLabCategory("BLOOD");
    setLabCost("15000");

    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      // 1. Fetch patient records history (DME)
      const dmeRes = await fetch(`/api/patients/${hosp.patientId}/records`, { headers });
      if (dmeRes.ok) {
        const records = await dmeRes.json();
        setPatientDmeRecords(records);
      }
      
      // 2. Fetch inventory list (for MEDICINE category)
      const invRes = await fetch(`/api/inventory`, { headers });
      if (invRes.ok) {
        const items = await invRes.json();
        const medsOnly = items.filter((it: any) => it.category === "MEDICINE" || it.category === "Sérums" || it.category === "Matériel" || it.category === "PHARMACY");
        setPharmacyItems(medsOnly);
        if (medsOnly.length > 0) {
          setSelectedMedId(medsOnly[0].id);
        }
      }
    } catch (err: any) {
      console.error("Clinical Workspace initialization error:", err);
    }
  };

  const handleAddDmeNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicalHosp) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/hospitalizations/${selectedClinicalHosp.id}/journal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          symptoms: dmeSymptoms,
          diagnosis: dmeDiagnosis,
          prescription: dmePrescription,
          notes: dmeNotes
        })
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Erreur enregistrement journal DME");
      }
      setSuccess("Note clinique d'hospitalisation enregistrée et synchronisée avec le DME patient!");
      setDmeSymptoms("");
      setDmeDiagnosis("");
      setDmePrescription("");
      setDmeNotes("");
      
      const updatedHosp = await response.json();
      setHospitalizations(prev => prev.map(h => h.id === updatedHosp.id ? updatedHosp : h));
      setSelectedClinicalHosp(updatedHosp);
      
      const dmeRes = await fetch(`/api/patients/${updatedHosp.patientId}/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dmeRes.ok) {
        setPatientDmeRecords(await dmeRes.json());
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddSurveillance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicalHosp) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/hospitalizations/${selectedClinicalHosp.id}/surveillance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          temperature: constantTemp,
          bloodPressure: constantBP,
          pulse: constantPulse,
          saturation: constantSat,
          weight: constantWeight,
          glycemia: constantGlucose,
          notes: constantNotes
        })
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Erreur surveillance");
      }
      setSuccess("Constantes vitales de surveillance mises à jour et signées.");
      setConstantNotes("");
      
      const updatedHosp = await response.json();
      setHospitalizations(prev => prev.map(h => h.id === updatedHosp.id ? updatedHosp : h));
      setSelectedClinicalHosp(updatedHosp);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAdministerMed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicalHosp || !selectedMedId) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/hospitalizations/${selectedClinicalHosp.id}/medications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          itemId: selectedMedId,
          quantity: medQty,
          notes: medNotes
        })
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Erreur de déstockage");
      }
      setSuccess("Médicament administré au patient et déstocké de la pharmacie!");
      setMedNotes("");
      setMedQty("1");
      
      const updatedHosp = await response.json();
      setHospitalizations(prev => prev.map(h => h.id === updatedHosp.id ? updatedHosp : h));
      setSelectedClinicalHosp(updatedHosp);
      
      const invRes = await fetch(`/api/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (invRes.ok) {
        const items = await invRes.json();
        setPharmacyItems(items.filter((it: any) => it.category === "MEDICINE" || it.category === "Sérums" || it.category === "Matériel" || it.category === "PHARMACY"));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRequestLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicalHosp || !labTestName) return;
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`/api/hospitalizations/${selectedClinicalHosp.id}/labs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          testName: labTestName,
          category: labCategory,
          cost: labCost
        })
      });
      if (!response.ok) {
        const d = await response.json();
        throw new Error(d.error || "Erreur demande labo");
      }
      setSuccess("Demande d'analyse de laboratoire enregistrée!");
      setLabTestName("");
      
      const updatedHosp = await response.json();
      setHospitalizations(prev => prev.map(h => h.id === updatedHosp.id ? updatedHosp : h));
      setSelectedClinicalHosp(updatedHosp);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Enriched Discharge / Sortie consolidated confirmation
  const handleConfirmDischarge = async () => {
    if (!selectedHospToDischarge) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/hospitalizations/${selectedHospToDischarge.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: dischargeNotes,
          dischargeDate: new Date().toISOString(),
          principalDiagnosis: dischargeDiagnosis,
          recommendations: dischargeRecommendations,
          additionalActsPrice: Number(dischargeExtraActsPrice) || 0,
          isDeceased: dischargeIsDeceased
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Échec de l'enregistrement de la facturation consolidée");
      }

      setSuccess(`Sortie du patient enregistrée avec succès. Une facture consolidée unique incluant hébergement, pharmacie, biologie et actes a été émise.`);
      setSelectedHospToDischarge(null);
      setDischargeNotes("");
      setDischargeDiagnosis("");
      setDischargeRecommendations("");
      setDischargeExtraActsPrice("0");
      setDischargeIsDeceased(false);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Patient transfer between beds
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospToTransfer) return;
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/hospitalizations/${selectedHospToTransfer.id}/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(transferData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Échec du transfert");

      setSuccess(`Transfert médical exécuté avec succès vers ${data.roomNumber} - ${data.bedNumber}.`);
      setSelectedHospToTransfer(null);
      setTransferData({ toRoomId: "", toBedId: "", reason: "" });
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Rates Update
  const handleRatesSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSyncingRates(true);

    const updatedRates = {
      roomRates: {
        Classique: Number(tempRates.roomRates_Classique),
        Climatisée: Number(tempRates.roomRates_Climatisée),
        VIP: Number(tempRates.roomRates_VIP)
      },
      bedRates: {
        Classique: Number(tempRates.bedRates_Classique),
        Handicapé: Number(tempRates.bedRates_Handicapé),
        VIP: Number(tempRates.bedRates_VIP)
      }
    };

    try {
      const response = await fetch("/api/hospitalization/rates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updatedRates)
      });

      if (!response.ok) throw new Error("Impossible de modifier les tarifs.");
      
      setSuccess("Grille de tarification hospitalière mise à jour avec succès.");
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncingRates(false);
    }
  };

  // CRUD Rooms
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const url = editingRoom 
        ? `/api/hospitalization/rooms/${editingRoom.id}` 
        : "/api/hospitalization/rooms";
      const method = editingRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(roomFormData)
      });

      if (!response.ok) throw new Error("Erreur de sauvegarde de la chambre.");

      setSuccess(editingRoom ? "Chambre modifiée." : "Chambre créée avec succès.");
      setRoomFormData({
        number: "",
        type: "Classique",
        service: "Médecine Générale",
        floor: "Rez-de-chaussée",
        allowedGender: "Mixte",
        status: "Disponible",
        capacity: 2
      });
      setEditingRoom(null);
      setShowRoomForm(false);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRoomDelete = async (id: string, num: string) => {
    if (!confirm(`Confirmer la suppression de la chambre n° ${num} ? Cette action supprimera également ses lits.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/hospitalization/rooms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec de la suppression.");
      setSuccess(`Chambre ${num} supprimée.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // CRUD Beds
  const handleBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!bedFormData.roomId) {
      setError("Veuillez sélectionner une chambre d'affectation.");
      return;
    }

    try {
      const url = editingBed 
        ? `/api/hospitalization/beds/${editingBed.id}` 
        : "/api/hospitalization/beds";
      const method = editingBed ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bedFormData)
      });

      if (!response.ok) throw new Error("Erreur lors de la configuration du lit.");

      setSuccess(editingBed ? "Lit modifié." : "Lit rattaché avec succès.");
      setBedFormData({
        number: "",
        type: "Classique",
        roomId: "",
        status: "Disponible",
        maintenanceReason: ""
      });
      setEditingBed(null);
      setShowBedForm(false);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleBedDelete = async (id: string, num: string) => {
    if (!confirm(`Confirmer la suppression du lit "${num}" ?`)) return;
    setError("");
    try {
      const response = await fetch(`/api/hospitalization/beds/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Échec du retrait.");
      setSuccess(`Lit supprimé avec succès.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // KPI Calculations
  const totalRooms = rooms.length;
  const totalBeds = beds.length;
  const occupiedBeds = beds.filter(b => b.status === "Occupé").length;
  const availableBeds = beds.filter(b => b.status === "Disponible").length;
  const maintenanceBeds = beds.filter(b => b.status === "Hors service" || b.status === "En nettoyage").length;
  const reservedBeds = beds.filter(b => b.status === "Réservé").length;
  const activePatients = hospitalizations.filter(h => h.status === "ADMITTED").length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Live values for selected room/bed in admission form
  const selectedRoomObj = rooms.find(r => r.id === formData.roomId);
  const roomBedsCount = beds.filter(b => b.roomId === formData.roomId).length;
  const freeRoomBedsCount = beds.filter(b => b.roomId === formData.roomId && b.status === "Disponible").length;
  const selectedBedObj = beds.find(b => b.id === formData.bedId);
  const calculatedRoomRate = selectedRoomObj ? (rates.roomRates[selectedRoomObj.type] || 0) : 0;
  const calculatedBedRate = selectedBedObj ? (rates.bedRates[selectedBedObj.type] || 0) : 0;
  const totalDailyCost = calculatedRoomRate + calculatedBedRate;

  // Live values for selected target room/bed in transfer form
  const transferRoomObj = rooms.find(r => r.id === transferData.toRoomId);
  const transferBedsCount = beds.filter(b => b.roomId === transferData.toRoomId).length;
  const transferFreeBedsCount = beds.filter(b => b.roomId === transferData.toRoomId && b.status === "Disponible").length;
  const transferBedObj = beds.find(b => b.id === transferData.toBedId);
  const transferRoomRate = transferRoomObj ? (rates.roomRates[transferRoomObj.type] || 0) : 0;
  const transferBedRate = transferBedObj ? (rates.bedRates[transferBedObj.type] || 0) : 0;
  const transferTotalDailyCost = transferRoomRate + transferBedRate;

  // Average stay calculation DMS (Durée Moyenne de Séjour)
  const dischargedList = hospitalizations.filter(h => h.status === "DISCHARGED");
  let dms = 0;
  if (dischargedList.length > 0) {
    const sumDays = dischargedList.reduce((sum, item) => {
      const start = new Date(item.admissionDate).getTime();
      const end = new Date(item.dischargeDate || new Date().toISOString()).getTime();
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 3600 * 24)));
      return sum + days;
    }, 0);
    dms = Math.round((sumDays / dischargedList.length) * 10) / 10;
  }

  // Live filtered rooms & beds
  const getRoomBeds = (roomId: string) => {
    return beds.filter(b => {
      if (b.roomId !== roomId) return false;
      if (filterBedType !== "TOUS" && b.type !== filterBedType) return false;
      if (filterBedStatus !== "TOUS" && b.status !== filterBedStatus) return false;
      return true;
    });
  };

  const filteredRooms = rooms.filter(r => {
    if (filterRoomType !== "TOUS" && r.type !== filterRoomType) return false;
    if (filterService !== "TOUS" && r.service !== filterService) return false;
    return true;
  });

  const getPatientFullName = (id: string) => {
    const found = patients.find(p => p.id === id);
    return found ? `${found.lastName.toUpperCase()} ${found.firstName}` : "Patient Inconnu";
  };

  const getPatientObj = (id: string) => {
    return patients.find(p => p.id === id) || null;
  };

  // Extract structured clinical workspace information from dynamic Json
  const getClinicalDataForHosp = (hosp: Hospitalization) => {
    let raw: any = hosp.transfers;
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch (e) {
        raw = {};
      }
    }
    
    // Check if structured as clinical object or nested inside the first element of an array
    const structured = (raw && !Array.isArray(raw)) ? raw : (Array.isArray(raw) && raw.length > 0 && !(raw[0] as any).dateTransfer ? raw[0] : null);
    
    return {
      clinicalJournal: (structured?.clinicalJournal) || (raw?.clinicalJournal) || [],
      nursingSurveillances: (structured?.nursingSurveillances) || (raw?.nursingSurveillances) || [],
      administeredDrugs: (structured?.administeredDrugs) || (raw?.administeredDrugs) || [],
      laboratoryTests: (structured?.laboratoryTests) || (raw?.laboratoryTests) || [],
      dischargeSummary: (structured?.dischargeSummary) || (raw?.dischargeSummary) || null
    };
  };

  // Calculate real-time estimated bill
  const getEstimatedBill = (hosp: Hospitalization) => {
    const start = new Date(hosp.admissionDate).getTime();
    const end = hosp.dischargeDate ? new Date(hosp.dischargeDate).getTime() : Date.now();
    const durationMs = end - start;
    const totalStayDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

    let totalPrice = 0;
    let explanation: string[] = [];

    const roomPriceRate = hosp.roomPrice || 0;
    const bedPriceRate = hosp.bedPrice || 0;

    // Retrieve clinical items costs
    const clinData = getClinicalDataForHosp(hosp);

    // Filter real transfers
    let rawTransfers: any[] = [];
    if (Array.isArray(hosp.transfers)) {
      rawTransfers = hosp.transfers.filter((t: any) => t && t.dateTransfer);
    }
    const transfersList = [...rawTransfers].sort(
      (a: any, b: any) => new Date(a.dateTransfer).getTime() - new Date(b.dateTransfer).getTime()
    );

    let accommodationCost = 0;
    if (transfersList.length === 0) {
      const dayCost = roomPriceRate + bedPriceRate;
      accommodationCost = dayCost * totalStayDays;
      explanation.push(
        `${totalStayDays} jours d'hébergement en [Chambre ${hosp.roomNumber} + Lit ${hosp.bedNumber}] à ${dayCost.toLocaleString()} FCFA/j (${accommodationCost.toLocaleString()} FCFA).`
      );
    } else {
      let lastTime = start;
      let currRoomPrice = roomPriceRate;
      let currBedPrice = bedPriceRate;
      let currRoomNum = hosp.roomNumber;
      let currBedNum = hosp.bedNumber;
      let currRoomType = hosp.roomType;
      let currBedType = hosp.bedType;

      for (let i = 0; i < transfersList.length; i++) {
        const tr = transfersList[i];
        const trTime = new Date(tr.dateTransfer).getTime();
        const segmentMs = trTime - lastTime;
        const segmentDays = Math.max(1, Math.round(segmentMs / (1000 * 3600 * 24)));
        const dailyCost = currRoomPrice + currBedPrice;
        accommodationCost += segmentDays * dailyCost;
        
        explanation.push(
          `${segmentDays} j d'hébergement en [Chambre ${currRoomNum} + Lit ${currBedNum}] à ${dailyCost.toLocaleString()} FCFA/j.`
        );

        lastTime = trTime;
        currRoomPrice = tr.toRoomPrice;
        currBedPrice = tr.toBedPrice;
        currRoomNum = tr.toRoomNumber;
        currBedNum = tr.toBedNumber;
        currRoomType = tr.toRoomType;
        currBedType = tr.toBedType;
      }

      // Final segment
      const finalSegmentMs = end - lastTime;
      const finalDays = Math.max(1, Math.round(finalSegmentMs / (1000 * 3600 * 24)));
      const dailyCost = currRoomPrice + currBedPrice;
      accommodationCost += finalDays * dailyCost;
      explanation.push(
        `${finalDays} j d'hébergement en [Chambre ${currRoomNum} + Lit ${currBedNum}] à ${dailyCost.toLocaleString()} FCFA/j.`
      );
    }

    totalPrice += accommodationCost;

    // Add administered meds
    if (clinData.administeredDrugs.length > 0) {
      const medCost = clinData.administeredDrugs.reduce((sum: number, med: any) => sum + (med.price * med.quantity), 0);
      totalPrice += medCost;
      explanation.push(
        `Consommation pharmacie : ${clinData.administeredDrugs.length} produit(s) administré(s) - (${medCost.toLocaleString()} FCFA).`
      );
    }

    // Add biochemical biological tests costs
    if (clinData.laboratoryTests.length > 0) {
      const labCostTotal = clinData.laboratoryTests.reduce((sum: number, lab: any) => sum + (Number(lab.cost) || 0), 0);
      totalPrice += labCostTotal;
      explanation.push(
        `Analyses médicales de biologie : ${clinData.laboratoryTests.length} prescription(s) - (${labCostTotal.toLocaleString()} FCFA).`
      );
    }

    return { totalStayDays, totalPrice, explanation };
  };

  // Quick action from visualizer grid
  const handleBedClick = (bed: any, room: any) => {
    if (bed.status === "Disponible") {
      setFormData({
        patientId: "",
        roomId: room.id,
        bedId: bed.id,
        reason: "",
        notes: ""
      });
      setShowAddForm(true);
      setActiveTab("admissions");
    } else if (bed.status === "Occupé") {
      const activeHosp = hospitalizations.find(
        h => h.bedId === bed.id && h.status === "ADMITTED"
      );
      if (activeHosp) {
        setActiveTab("admissions");
        // We scroll or focus on admissions list
      }
    }
  };

  // COMPUTE DYNAMIC WARNING ALERTS (Rule 5)
  const fullyOccupiedRooms = rooms.filter((r: any) => {
    const roomBeds = beds.filter((b: any) => b.roomId === r.id);
    return roomBeds.length > 0 && roomBeds.every((b: any) => b.status === "Occupé");
  });

  const uniqueServices = Array.from(new Set(rooms.map((r: any) => r.service).filter(Boolean)));
  const servicesWithNoBeds = uniqueServices.filter((service: any) => {
    const serviceRooms = rooms.filter((r: any) => r.service === service);
    // Find all beds placed in any room of this service
    const serviceBeds = beds.filter((b: any) => serviceRooms.some((sr: any) => sr.id === b.roomId));
    return serviceBeds.length > 0 && !serviceBeds.some((b: any) => b.status === "Disponible" || b.status === "Libre");
  });

  const bedsWithProlongedMaintenance = beds.filter((b: any) => {
    if (b.status !== "Maintenance" && b.status !== "Hors service") return false;
    const changedTime = b.statusChangedAt ? new Date(b.statusChangedAt).getTime() : new Date(b.createdAt || Date.now()).getTime() - (3 * 24 * 3600 * 1000); // default to 3 days ago for testing
    const hoursInMaintenance = Math.round((Date.now() - changedTime) / (3600 * 1000));
    return hoursInMaintenance > 48; // longer than 48 hours
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-xs overflow-hidden" id="hospitalization-card-v2">
      {/* Header Banner */}
      <div className="p-6 bg-linear-to-r from-teal-900 via-teal-800 to-emerald-950 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="inline-flex px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wide mb-2">
            Pôle clinique d'hospitalisation
          </span>
          <h2 className="font-sans font-extrabold text-2xl tracking-tight flex items-center gap-2">
            <Bed className="h-6 w-6 text-teal-400 shrink-0 animate-pulse" />
            Gestion des Lits &amp; Chambres Médicales
          </h2>
          <p className="text-gray-300 text-sm mt-1 max-w-2xl font-medium">
            Supervisez en temps réel le taux d'occupation, organisez les transferts inter-services, paramétrez la tarification et pilotez le circuit de facturation clinique.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setFormData({ patientId: "", roomId: "", bedId: "", reason: "", notes: "" });
              setShowAddForm(true);
              setActiveTab("admissions");
            }}
            className="px-4 py-2.5 bg-white text-teal-900 font-bold text-sm rounded-xl hover:bg-teal-50 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Admission
          </button>
          
          <button
            onClick={fetchAllData}
            className="p-2.5 rounded-xl border border-teal-700 hover:bg-white/10 text-white transition-all cursor-pointer"
            title="Rafraîchir les lits"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="border-b border-gray-100 bg-slate-50 flex flex-wrap gap-1 p-2">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "dashboard" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Activity className="h-4 w-4" />
          Suivi Temps Réel ({occupiedBeds}/{totalBeds} Lits)
        </button>
        
        <button
          onClick={() => setActiveTab("admissions")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "admissions" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Users className="h-4 w-4" />
          Dossiers d'Hospitalisation
        </button>

        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "rooms" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Home className="h-4 w-4" />
          Configuration Chambres
        </button>

        <button
          onClick={() => setActiveTab("beds")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "beds" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Bed className="h-4 w-4" />
          Gestion des Lits
        </button>

        <button
          onClick={() => setActiveTab("rates")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "rates" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Barème Tarifs Clinique
        </button>

        <button
          onClick={() => setActiveTab("transfers")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "transfers" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Clock className="h-4 w-4" />
          Historique Transferts
        </button>

        <button
          onClick={() => setActiveTab("reservations")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "reservations" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Pre-Admissions / Réservations ({reservations.length})
        </button>

        <button
          onClick={() => setActiveTab("stats")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "stats" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <Percent className="h-4 w-4" />
          Rapports & Statistiques
        </button>

        <button
          onClick={() => setActiveTab("dg_dashboard")}
          className={`px-4 py-2 text-xs md:text-sm font-bold rounded-lg transition-all cursor-pointer inline-flex items-center gap-2 ${
            activeTab === "dg_dashboard" ? "bg-teal-800 text-white shadow-xs" : "text-gray-600 hover:bg-gray-150"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          DG - Tableau de Bord
        </button>
      </div>

      {/* Global Action Messages */}
      {error && (
        <div className="p-4 mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex items-center font-medium shadow-xs">
          <ShieldAlert className="h-5 w-5 mr-3 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 mx-6 mt-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex items-center font-medium shadow-xs">
          <CheckCircle2 className="h-5 w-5 mr-3 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Loading state indicator */}
      {loading && (
        <div className="p-6 text-center font-mono text-sm text-slate-500 flex items-center justify-center gap-2">
          <CircleDot className="h-4 w-4 animate-spin text-teal-800" />
          <span>Synchronisation de l'état clinique...</span>
        </div>
      )}

      {/* TAB 1: DASHBOARD AND INTERACTIVE WARD GRAPH */}
      {activeTab === "dashboard" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* SYSTEM CLINICAL ALERTS (Rule 5) */}
          {(fullyOccupiedRooms.length > 0 || servicesWithNoBeds.length > 0 || bedsWithProlongedMaintenance.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 p-1">
              {/* Room Full Alert */}
              {fullyOccupiedRooms.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-950 rounded-xl flex flex-col justify-between shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-700 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-red-900">Alerte : Surcharges (100% plein)</h4>
                      <p className="text-sm font-semibold mt-1">Chambres saturées :</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {fullyOccupiedRooms.map((r: any) => (
                          <span key={r.id} className="text-xs px-2 py-0.5 bg-red-900 text-white font-mono rounded font-semibold">
                            Ch {r.number} ({r.service})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-red-800/80 mt-3 italic font-medium">Recommandation : Programmer des sorties ou préparer des transferts.</p>
                </div>
              )}

              {/* Service Empty Alert */}
              {servicesWithNoBeds.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-250 text-amber-950 rounded-xl flex flex-col justify-between shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="h-5 w-5 text-amber-800 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">Alerte : Pénurie critique</h4>
                      <p className="text-sm font-semibold mt-1">Aucun lit disponible dans les services :</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {servicesWithNoBeds.map((service: any) => (
                          <span key={service} className="text-xs px-2 py-0.5 bg-amber-800 text-white font-semibold rounded">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-800 mt-3 italic font-medium">Recommandation : Relais ou transfert inter-services requis.</p>
                </div>
              )}

              {/* Prolonged Maintenance Alert */}
              {bedsWithProlongedMaintenance.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl flex flex-col justify-between shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-5 w-5 text-blue-700 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-blue-900">Alerte : Maintenance Prolongée</h4>
                      <p className="text-sm font-semibold mt-1">Lits indisponibles depuis &gt; 48 heures :</p>
                      <div className="flex flex-col gap-1.5 mt-2">
                        {bedsWithProlongedMaintenance.map((b: any) => {
                          const roomObj = rooms.find((r: any) => r.id === b.roomId);
                          return (
                            <div key={b.id} className="text-xs flex items-center justify-between bg-white border border-blue-150 p-1 rounded">
                              <span className="font-mono font-bold text-blue-900">Lit {b.number} (Ch {roomObj?.number || '?'})</span>
                              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-medium">{b.maintenanceReason || 'Panne technique'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-blue-700/90 mt-3 italic font-medium">Recommandation : Contacter le service logistique / biomédical.</p>
                </div>
              )}
            </div>
          )}

          {/* KPI Cards Panel */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-150 shadow-2xs">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wide">Capacité Globale</span>
              <div className="text-3xl font-extrabold text-teal-950 mt-1 flex items-baseline gap-2">
                {totalBeds} <span className="text-sm font-semibold text-gray-500">lits disposés</span>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">{totalRooms} chambres actives</p>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100 shadow-2xs">
              <span className="text-teal-700 font-bold text-xs uppercase tracking-wide">Lits Occupés</span>
              <div className="text-3xl font-extrabold text-teal-900 mt-1 flex items-baseline gap-2">
                {occupiedBeds} <span className="text-sm font-semibold text-teal-600">actifs ({activePatients} hospis)</span>
              </div>
              <p className="text-xs text-teal-700 font-medium mt-1.5">Taux d'occupation : {occupancyRate}%</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/20 border border-amber-150 shadow-2xs">
              <span className="text-amber-800 font-bold text-xs uppercase tracking-wide">Lits Disponibles</span>
              <div className="text-3xl font-extrabold text-amber-900 mt-1 flex items-baseline gap-2">
                {availableBeds} <span className="text-sm font-semibold text-amber-700">disponibles</span>
              </div>
              <p className="text-xs text-amber-700/80 mt-1.5 font-medium">Réservés: {reservedBeds} · Nettoyage: {maintenanceBeds}</p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50/20 border border-emerald-150 shadow-2xs">
              <span className="text-emerald-800 font-bold text-xs uppercase tracking-wide">DMS (Durée Séjour)</span>
              <div className="text-3xl font-extrabold text-emerald-950 mt-1 flex items-baseline gap-1">
                {dms} <span className="text-sm font-semibold text-emerald-700">jours</span>
              </div>
              <p className="text-xs text-emerald-700 mt-1.5 font-medium">Sur {dischargedList.length} sorties enregistrées</p>
            </div>
          </div>

          {/* Section Description */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-4 gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">Visualisation Graphique des Services</h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Cliquez sur un lit libre pour l'affecter à un patient, ou filtrez les lits par types et statuts.</p>
            </div>
            
            {/* Filters panel */}
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <select
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="TOUS">Tous Services</option>
                  <option value="Médecine Générale">Médecine Générale</option>
                  <option value="Chirurgie">Chirurgie</option>
                  <option value="Pédiatrie">Pédiatrie</option>
                  <option value="Maternité / CPN">Maternité</option>
                  <option value="Urgences">Urgences</option>
                </select>
              </div>

              <div>
                <select
                  value={filterRoomType}
                  onChange={e => setFilterRoomType(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="TOUS">Toutes Chambres</option>
                  <option value="VIP">VIP</option>
                  <option value="Climatisée">Climatisée</option>
                  <option value="Classique">Classique</option>
                </select>
              </div>

              <div>
                <select
                  value={filterBedStatus}
                  onChange={e => setFilterBedStatus(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-gray-250 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="TOUS">Tous Lits des Chambres</option>
                  <option value="Disponible">Disponibles</option>
                  <option value="Occupé">Occupés</option>
                  <option value="Hors service">Hors Service</option>
                </select>
              </div>
            </div>
          </div>

          {/* Graphical Grid mapping over rooms */}
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-2xl bg-slate-50">
              Aucun lit ou chambre ne correspond aux filtres sélectionnés.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRooms.map(room => {
                const roomBeds = getRoomBeds(room.id);
                return (
                  <div 
                    key={room.id}
                    className="p-5 rounded-2xl border bg-white border-gray-200 shadow-2xs hover:border-teal-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Room Banner */}
                      <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-base font-extrabold text-teal-950">Chambre {room.number}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              room.type === "VIP" ? "bg-amber-100 text-amber-800" :
                              room.type === "Climatisée" ? "bg-cyan-100 text-cyan-800" : "bg-slate-200 text-slate-800"
                            }`}>
                              {room.type}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 font-semibold">{room.service} · {room.floor}</span>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0 gap-1 text-[11px] font-bold">
                          <span className={`px-2 py-0.5 rounded-full ${
                            room.allowedGender === "Homme" ? "bg-blue-50 text-blue-800" :
                            room.allowedGender === "Femme" ? "bg-pink-50 text-pink-800" : "bg-purple-50 text-purple-800"
                          }`}>
                            🧑‍⚕️ {room.allowedGender}
                          </span>
                          
                          <span className={`text-[10px] font-bold ${
                            room.status === "Disponible" ? "text-emerald-700" :
                            room.status === "Occupée" ? "text-amber-700" : "text-rose-700"
                          }`}>
                            ● {room.status}
                          </span>
                        </div>
                      </div>

                      {/* Beds list in Room */}
                      <div className="py-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Occupation des lits :</span>
                        
                        {roomBeds.length === 0 ? (
                          <p className="text-xs text-gray-400 mt-2 italic font-medium">Aucun lit rattaché dans cette chambre.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                            {roomBeds.map(bed => {
                              const isOccupied = bed.status === "Occupé";
                              // Find any hospitalization
                              const activeH = hospitalizations.find(h => h.bedId === bed.id && h.status === "ADMITTED");

                              return (
                                <button
                                  key={bed.id}
                                  onClick={() => handleBedClick(bed, room)}
                                  className={`p-3 rounded-xl border text-left transition-all ${
                                    bed.status === "Disponible" ? "bg-emerald-50/20 hover:bg-emerald-50 border-emerald-200 text-emerald-950 focus:ring-2 focus:ring-emerald-700" :
                                    isOccupied ? "bg-amber-50/20 border-amber-200 text-amber-950 hover:bg-amber-50/40" :
                                    bed.status === "Hors service" ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" :
                                    "bg-sky-50/20 border-sky-150 text-sky-950"
                                  }`}
                                  disabled={bed.status === "Hors service"}
                                >
                                  <div className="flex items-center gap-2">
                                    <Bed className={`h-4 w-4 ${
                                      bed.status === "Disponible" ? "text-emerald-600" :
                                      isOccupied ? "text-amber-600" : "text-sky-500"
                                    }`} />
                                    <span className="text-xs font-extrabold">{bed.number}</span>
                                  </div>
                                  
                                  {isOccupied ? (
                                    <div className="mt-1">
                                      <p className="text-[10px] font-bold text-amber-900 leading-tight line-clamp-1">
                                        🧑‍⚕️ {bed.patientNom || "Hospitalisé"}
                                      </p>
                                      <p className="text-[9px] text-gray-400 font-mono mt-0.5">
                                        Depuis: {bed.dateAdmission ? new Date(bed.dateAdmission).toLocaleDateString() : 'N/C'}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="text-[9px] text-emerald-600 font-semibold mt-1">
                                      {bed.status === "Disponible" ? "Libre - Admettre" : bed.status}
                                    </p>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] font-bold text-gray-600 flex justify-between items-center mt-3 border border-slate-100">
                      <span>Tarif jour indicatif :</span>
                      <span className="text-teal-950 font-extrabold">
                        {((rates.roomRates[room.type] || 0) + (rates.bedRates[roomBeds[0]?.type] || 0)).toLocaleString()} FCFA/j
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DOSSIERS D'HOSPITALISATION (LIST, NEW, TRANSFER, DISCHARGE) */}
      {activeTab === "admissions" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* New Admission Request Form */}
          {showAddForm && (
            <div className="p-6 bg-slate-50 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-teal-800" />
                  Formulaire d'admission interne d'un patient
                </h3>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="px-3 py-1 font-bold text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 rounded cursor-pointer"
                >
                  Fermer
                </button>
              </div>

              <form onSubmit={handleAdmitSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sélectionner un Patient <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.patientId}
                    onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="">-- Choisir un patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.lastName.toUpperCase()} {p.firstName} ({p.gender === 'F' ? 'Femme' : 'Homme'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sélectionner Chambre Cible <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.roomId}
                    onChange={e => setFormData({ ...formData, roomId: e.target.value, bedId: "" })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="">-- Choisir une chambre --</option>
                    {rooms.map(r => {
                      // Check patient gender compatibility first if a patient is selected
                      let genderWarn = "";
                      if (formData.patientId) {
                        const pat = getPatientObj(formData.patientId);
                        if (pat) {
                          if (r.allowedGender === "Homme" && pat.gender !== "M" && pat.gender !== "Homme") {
                            genderWarn = " (Incompatible Femme)";
                          } else if (r.allowedGender === "Femme" && pat.gender !== "F" && pat.gender !== "Femme") {
                            genderWarn = " (Incompatible Homme)";
                          }
                        }
                      }
                      
                      return (
                        <option 
                          key={r.id} 
                          value={r.id}
                          disabled={r.status === "Maintenance" || r.status === "Fermée temporairement" || !!genderWarn}
                        >
                          Chambre {r.number} ({r.type} - {r.allowedGender}){genderWarn}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Sélectionner Lit Libre <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.bedId}
                    onChange={e => setFormData({ ...formData, bedId: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    disabled={!formData.roomId}
                  >
                    <option value="">-- Choisir un lit libre --</option>
                    {beds
                      .filter(b => b.roomId === formData.roomId && b.status === "Disponible")
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.number} ({b.type})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Real-time pricing & capacity overview card (Fulfills pricing and available beds request) */}
                {selectedRoomObj && (
                  <div className="md:col-span-2 lg:col-span-3 p-4 bg-teal-50/70 border border-teal-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm font-semibold text-teal-900 animate-fade-in" id="admission-preview-box">
                    <div>
                      <p className="text-teal-900 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Informations d'occupation de la Chambre {selectedRoomObj.number}
                      </p>
                      <p className="text-sm font-extrabold text-gray-900">
                        Type: <span className="text-teal-800">{selectedRoomObj.type}</span> · Service d'affectation : <span className="text-teal-800">{selectedRoomObj.service}</span> · {selectedRoomObj.floor}
                      </p>
                      <p className="text-xs text-teal-700 mt-1">
                        Restriction de sexe : <span className="font-extrabold text-teal-900">{selectedRoomObj.allowedGender}</span> · 
                        Lits disponibles : <span className="font-extrabold text-emerald-800">{freeRoomBedsCount} lits libres restants</span> sur un total de {roomBedsCount} lit(s) créé(s) (Capacité maximale : {selectedRoomObj.capacity || 2} lits).
                      </p>
                    </div>
                    {formData.bedId ? (
                      <div className="text-left md:text-right shrink-0 bg-white/70 border border-teal-200/50 p-2.5 rounded-lg">
                        <p className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest">Coût journalier d'hébergement</p>
                        <p className="text-base font-black text-emerald-800">
                          {totalDailyCost.toLocaleString("fr-FR")} FCFA / Jour
                        </p>
                        <p className="text-[9px] text-gray-500 font-medium">
                          (Chambre: {calculatedRoomRate.toLocaleString()} FCFA + Lit: {calculatedBedRate.toLocaleString()} FCFA)
                        </p>
                      </div>
                    ) : (
                      <div className="text-left md:text-right shrink-0">
                        <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                          Chosissez un lit pour voir le coût
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Motif clinique d'admission <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="e.g. Diarrhée fébrile avec déshydratation modérée"
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Instructions / Observations médicales initiales</label>
                  <textarea
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="Prise des constantes toutes les 4 heures. Protocole perfusion..."
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-teal-800 hover:bg-teal-900 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Valider l'Admission
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Transfer Patient Modal Popup Form */}
          {selectedHospToTransfer && (
            <div className="p-6 bg-amber-50/20 border border-amber-200 rounded-2xl">
              <h3 className="font-extrabold text-slate-900 border-l-4 border-amber-500 pl-3 uppercase text-xs tracking-wider mb-4">
                TRANSFERER UN PATIENT (CONSERVATION DE L'HISTORIQUE DE TRAITEMENT ET FRAIS)
              </h3>
              <p className="text-xs text-gray-600 mb-3 font-semibold">
                Transfert médical de <span className="text-teal-900 font-bold">{getPatientFullName(selectedHospToTransfer.patientId)}</span>.
                Localisation actuelle : Chambre {selectedHospToTransfer.roomNumber} · {selectedHospToTransfer.bedNumber}.
              </p>

              <form onSubmit={handleTransferSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chambre Hospitalière Cible</label>
                  <select
                    value={transferData.toRoomId}
                    onChange={e => setTransferData({ ...transferData, toRoomId: e.target.value, toBedId: "" })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="">-- Choisir la chambre cible --</option>
                    {rooms.map(r => {
                      // Check patient gender compatibility first if a patient is selected
                      let genderWarn = "";
                      const pat = getPatientObj(selectedHospToTransfer.patientId);
                      if (pat) {
                        if (r.allowedGender === "Homme" && pat.gender !== "M" && pat.gender !== "Homme") {
                          genderWarn = " (Incompatible Femme)";
                        } else if (r.allowedGender === "Femme" && pat.gender !== "F" && pat.gender !== "Femme") {
                          genderWarn = " (Incompatible Homme)";
                        }
                      }
                      
                      return (
                        <option 
                          key={r.id} 
                          value={r.id}
                          disabled={r.status === "Maintenance" || r.status === "Fermée temporairement" || !!genderWarn || r.id === selectedHospToTransfer.roomId}
                        >
                          Chambre {r.number} ({r.type} - {r.allowedGender}){genderWarn}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lit disponible dans cette chambre</label>
                  <select
                    value={transferData.toBedId}
                    onChange={e => setTransferData({ ...transferData, toBedId: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    disabled={!transferData.toRoomId}
                  >
                    <option value="">-- Choisir un lit libre --</option>
                    {beds
                      .filter(b => b.roomId === transferData.toRoomId && b.status === "Disponible")
                      .map(b => (
                        <option key={b.id} value={b.id}>
                          {b.number} ({b.type})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Motif ou justification médicale du transfert <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    value={transferData.reason}
                    onChange={e => setTransferData({ ...transferData, reason: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="e.g. Encombrement pulmonaire sévère nécessitant chambre climatisée"
                    required
                  />
                </div>

                {/* Real-time pricing & capacity overview inside transfer modal (Fulfills cost and remaining beds requests) */}
                {transferRoomObj && (
                  <div className="md:col-span-2 p-4 bg-amber-500/10 border border-amber-250 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-semibold text-amber-950 animate-fade-in" id="transfer-preview-box">
                    <div>
                      <p className="text-amber-900 text-xs font-bold uppercase tracking-wider mb-0.5">
                        Aperçu Chambre d'affectation cible : {transferRoomObj.number}
                      </p>
                      <p className="text-sm font-extrabold text-gray-900">
                        Type: <span className="text-amber-800">{transferRoomObj.type}</span> · Service : <span className="text-amber-800">{transferRoomObj.service}</span>
                      </p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Genre : {transferRoomObj.allowedGender} · {transferFreeBedsCount} lits libres (Capacité : {transferRoomObj.capacity || 2} lits).
                      </p>
                    </div>
                    {transferData.toBedId ? (
                      <div className="text-left sm:text-right shrink-0 bg-white/80 border border-amber-200 p-2.5 rounded-lg shadow-3xs">
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Nouveau tarif d'hébergement</p>
                        <p className="text-base font-black text-amber-900">
                          {transferTotalDailyCost.toLocaleString("fr-FR")} FCFA / Jour
                        </p>
                        <p className="text-[9px] text-gray-500 font-normal">
                          (Chambre: {transferRoomRate.toLocaleString()} FCFA + Lit: {transferBedRate.toLocaleString()} FCFA)
                        </p>
                      </div>
                    ) : (
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-[11px] text-amber-700 font-bold bg-white/60 px-3 py-2 border border-amber-200 rounded-lg">
                          Choisissez un lit cible
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedHospToTransfer(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-150 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-amber-600 hover:bg-amber-700 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    Confirmer le Transfert
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Espace Clinique Harmonisé (Integration DME-Pharmacie-Soin-Biologie) */}
          {selectedClinicalHosp && (() => {
            const clinicalData = getClinicalDataForHosp(selectedClinicalHosp);
            const pat: any = patients.find(p => p.id === selectedClinicalHosp.patientId) || { name: "Patient Inconnu", lastName: "Inconnu", firstName: "Patient", gender: "M", dateOfBirth: "", phone: "", insuranceNumber: "", bloodType: "O+", allergies: "Aucune" };
            const bloodType = pat.bloodType || "O Positif (O+)";
            const allergies = pat.allergies || "Aucune allergie alimentaire connue. Sensibilité mineure aux bêtalactamines.";
            const medicalHistory = (pat as any).antecedents || "Hypertension artérielle légère sous traitement régulier. Chirurgie en 2021.";

            return (
              <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4" id="clinical-workspace-modal">
                <div className="bg-white rounded-2xl border border-gray-250 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-fade-in text-gray-800">
                  
                  {/* Modal Header */}
                  <div className="p-5 bg-gradient-to-r from-teal-950 to-teal-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <HeartPulse className="h-6 w-6 text-teal-300 animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold uppercase tracking-wide">Espace Hospitalier Clinique Intégré</h3>
                        <p className="text-xs text-teal-200 mt-0.5 font-medium">
                          Dossier Hospitalier Actif · Lit {selectedClinicalHosp.bedNumber} ({selectedClinicalHosp.bedType}) · Chambre {selectedClinicalHosp.roomNumber} ({selectedClinicalHosp.roomType})
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedClinicalHosp(null)}
                      className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer transition p-1"
                    >
                      &times;
                    </button>
                  </div>

                  {/* Patient Quick Info Bar */}
                  <div className="p-4 bg-slate-50 border-b border-gray-150 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-extrabold block">Patient Admis</span>
                      <span className="font-extrabold text-slate-800 text-sm">{pat.firstName} {pat.lastName.toUpperCase()}</span>
                      <span className="text-[10px] text-gray-400 block font-normal">Né(e) le {new Date(pat.dateOfBirth).toLocaleDateString()} ({pat.gender === "M" ? "Homme" : "Femme"})</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-extrabold block">Groupe Sanguin</span>
                      <span className="font-extrabold text-red-650 flex items-center gap-1">
                        <CircleDot className="h-3 w-3" /> {bloodType}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-extrabold block">Allergies Identifiées</span>
                      <span className="font-bold text-amber-700 block truncate" title={allergies}>{allergies}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-gray-400 font-extrabold block">Antécédents du patient</span>
                      <span className="font-bold text-slate-600 block truncate" title={medicalHistory}>{medicalHistory}</span>
                    </div>
                  </div>

                  {/* Tabs menu of modal */}
                  <div className="flex border-b border-gray-150 bg-slate-50 flex-wrap">
                    <button
                      onClick={() => setClinicalTab("dme")}
                      className={`flex-1 min-w-[120px] py-3 px-4 text-[10px] md:text-xs font-extrabold uppercase tracking-wider border-b-2 text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        clinicalTab === "dme" ? "border-teal-800 text-teal-900 bg-white" : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <ClipboardList className="h-4 w-4 text-teal-700" />
                      Journal DME ({clinicalData.clinicalJournal.length})
                    </button>
                    
                    <button
                      onClick={() => setClinicalTab("surveillance")}
                      className={`flex-1 min-w-[120px] py-3 px-4 text-[10px] md:text-xs font-extrabold uppercase tracking-wider border-b-2 text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        clinicalTab === "surveillance" ? "border-teal-800 text-teal-900 bg-white" : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <Activity className="h-4 w-4 text-teal-700" />
                      Surveillance infirmière ({clinicalData.nursingSurveillances.length})
                    </button>
                    
                    <button
                      onClick={() => setClinicalTab("medications")}
                      className={`flex-1 min-w-[120px] py-3 px-4 text-[10px] md:text-xs font-extrabold uppercase tracking-wider border-b-2 text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        clinicalTab === "medications" ? "border-teal-800 text-teal-900 bg-white" : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <Pill className="h-4 w-4 text-teal-700" />
                      Pharmacie / Actes ({clinicalData.administeredDrugs.length})
                    </button>
                    
                    <button
                      onClick={() => setClinicalTab("labs")}
                      className={`flex-1 min-w-[120px] py-3 px-4 text-[10px] md:text-xs font-extrabold uppercase tracking-wider border-b-2 text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        clinicalTab === "labs" ? "border-teal-800 text-teal-900 bg-white" : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <FlaskConical className="h-4 w-4 text-teal-700" />
                      Analyses de Biologie ({clinicalData.laboratoryTests.length})
                    </button>
                  </div>

                  {/* Modal Body Container */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* SUB-TAB 1: LIAISON DME & JOURNAL CLINIQUE */}
                    {clinicalTab === "dme" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Note Entry Form */}
                        <div className="space-y-4 bg-teal-50/15 p-5 rounded-2xl border border-teal-150 font-semibold text-gray-700">
                          <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-widest flex items-center gap-2 border-b border-teal-100 pb-2">
                            <Plus className="h-4 w-4 text-teal-700" />
                            Prendre Note clinique Quotidienne
                          </h4>
                          
                          <form onSubmit={handleAddDmeNote} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Symptômes relevés <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                required
                                value={dmeSymptoms}
                                onChange={e => setDmeSymptoms(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                placeholder="Céphalée, vomissements, asthénie..."
                              />
                            </div>
                            
                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Évaluation diagnostique du médecin <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                required
                                value={dmeDiagnosis}
                                onChange={e => setDmeDiagnosis(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                placeholder="Grave poussée palustre cliniquement confirmée..."
                              />
                            </div>
                            
                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Prescription thérapeutique rédigée</label>
                              <textarea
                                value={dmePrescription}
                                onChange={e => setDmePrescription(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                placeholder="Ordonnance ou injections prévues (Ex: Artésunate 120mg IV)..."
                              />
                            </div>
                            
                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Notes cliniques d'évolution libre</label>
                              <textarea
                                value={dmeNotes}
                                onChange={e => setDmeNotes(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700 font-sans"
                                placeholder="Hémodynamique stable, repos strict ordonné..."
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={!dmeSymptoms || !dmeDiagnosis}
                              className={`w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs ${
                                (!dmeSymptoms || !dmeDiagnosis) ? "bg-gray-200 cursor-not-allowed text-gray-400" : ""
                              }`}
                            >
                              Valider et intégrer directement au DME &amp; Journal Clinique
                            </button>
                          </form>
                        </div>

                        {/* Journal d'hospitalisation and medical record Timeline */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">
                            Journal de séjour &amp; Historique DME patient
                          </h4>
                          
                          {patientDmeRecords.length === 0 && clinicalData.clinicalJournal.length === 0 ? (
                            <p className="text-xs text-slate-405 italic p-8 text-center bg-slate-50 border border-dashed rounded-2xl">Aucun historique d'observation enregistré.</p>
                          ) : (
                            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                              {/* Clinical Journal of current Stay */}
                              {clinicalData.clinicalJournal.map((entry: any, index: number) => (
                                <div key={index} className="bg-teal-50/20 p-4 rounded-xl border border-teal-150 relative space-y-2 animate-fade-in text-xs font-semibold">
                                  <div className="flex justify-between items-center text-[10px] text-teal-800 font-extrabold">
                                    <span className="bg-teal-800 text-white px-1.5 py-0.5 rounded font-mono">🩺 JOURNAL CLINIQUE SÉJOUR</span>
                                    <span>{new Date(entry.dateTime).toLocaleString("fr-FR")}</span>
                                  </div>
                                  <div className="text-xs font-semibold text-gray-800 space-y-1">
                                    <p><strong className="text-teal-950 font-boldBlock">Symptômes :</strong> {entry.symptoms}</p>
                                    <p><strong className="text-teal-950 font-boldBlock">Diagnostic :</strong> {entry.diagnosis}</p>
                                    {entry.prescription && <p><strong className="text-slate-500">Ordonnance :</strong> {entry.prescription}</p>}
                                    {entry.notes && <p className="text-slate-400 italic">Notes d'évolution : {entry.notes}</p>}
                                  </div>
                                  <div className="text-[9px] text-right font-bold text-teal-900 font-mono">
                                    Signé : {entry.doctor}
                                  </div>
                                </div>
                              ))}

                              {/* DME historic records */}
                              {patientDmeRecords.map((record: any, index: number) => (
                                <div key={record.id || index} className="bg-slate-50 p-4 rounded-xl border border-gray-200 relative text-xs font-semibold space-y-1">
                                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-extrabold">
                                    <span>📂 HISTORIQUE CONSULTATIONS GLOBALES</span>
                                    <span>{new Date(record.createdAt || record.date).toLocaleDateString("fr-FR")}</span>
                                  </div>
                                  <div className="text-xs font-semibold text-gray-800">
                                    <p><strong className="text-slate-650">Motif :</strong> {record.symptoms || "Consultation Routine"}</p>
                                    <p><strong className="text-slate-705">Diagnostic :</strong> {record.diagnosis || record.value}</p>
                                    {record.prescription && <p><strong className="text-slate-500">Traitements :</strong> {record.prescription || record.treatment}</p>}
                                  </div>
                                  <div className="text-[9px] text-right font-bold text-gray-450">
                                    Médecin : {record.doctorName || "Dr. Généraliste"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: SOINS INFIRMIERS & SURVEILLANCE CONSTANTES */}
                    {clinicalTab === "surveillance" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Surveillance Form */}
                        <div className="space-y-4 bg-teal-50/15 p-5 rounded-2xl border border-teal-150 font-semibold text-slate-755">
                          <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-widest flex items-center gap-2 border-b border-teal-100 pb-2">
                            <Plus className="h-4 w-4 text-teal-700" />
                            Feuille de Surveillance : Saisie des Constantes
                          </h4>
                          
                          <form onSubmit={handleAddSurveillance} className="space-y-3 text-xs font-semibold">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Température (°C)</label>
                                <input
                                  type="text"
                                  value={constantTemp}
                                  onChange={e => setConstantTemp(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Tension Artérielle</label>
                                <input
                                  type="text"
                                  value={constantBP}
                                  onChange={e => setConstantBP(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                  placeholder="Ex: 120/80"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Pouls (bpm)</label>
                                <input
                                  type="text"
                                  value={constantPulse}
                                  onChange={e => setConstantPulse(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Saturation O₂ (%)</label>
                                <input
                                  type="text"
                                  value={constantSat}
                                  onChange={e => setConstantSat(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Poids corporel (kg)</label>
                                <input
                                  type="text"
                                  value={constantWeight}
                                  onChange={e => setConstantWeight(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                />
                              </div>
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Glycémie à jeun (g/L)</label>
                                <input
                                  type="text"
                                  value={constantGlucose}
                                  onChange={e => setConstantGlucose(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center focus:ring-1 focus:ring-teal-700 text-xs"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Observations infirmières de soin</label>
                              <textarea
                                value={constantNotes}
                                onChange={e => setConstantNotes(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl focus:ring-1 focus:ring-teal-700 text-xs font-semibold"
                                placeholder="Patient dort calmement, administration faite..."
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                            >
                              Signer &amp; Insérer au Dossier Clinique de Surveillance
                            </button>
                          </form>
                        </div>

                        {/* Chronology List of observations */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest">
                            Historique Chronologique de Surveillance
                          </h4>
                          
                          {clinicalData.nursingSurveillances.length === 0 ? (
                            <p className="text-xs text-slate-405 italic p-8 text-center bg-slate-50 border border-dashed rounded-2xl">Aucune mesure de surveillance enregistrée.</p>
                          ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 text-xs font-semibold">
                              {clinicalData.nursingSurveillances.map((ns: any, idx: number) => {
                                const isTempHigh = Number(ns.temperature) > 38.5;
                                const isSatLow = Number(ns.saturation) < 92;
                                return (
                                  <div key={idx} className={`p-4 rounded-xl border transition ${
                                    isTempHigh || isSatLow ? "bg-red-50 border-red-200" : "bg-slate-50 border-gray-200"
                                  }`}>
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-extrabold mb-2">
                                      <span className="flex items-center gap-1 font-mono">
                                        ⏱️ {new Date(ns.dateTime).toLocaleString("fr-FR")}
                                      </span>
                                      <span className="bg-slate-200/80 text-slate-700 px-1.5 py-0.5 rounded uppercase font-mono tracking-wider font-extrabold text-[9px]">
                                        Signé: {ns.agentSign || "Infirmier de garde"}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">TEMP</span>
                                        <span className={`text-[11px] font-mono font-black ${isTempHigh ? "text-red-700 font-black animate-pulse" : "text-teal-950"}`}>{ns.temperature}°C</span>
                                      </div>
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">TENSION</span>
                                        <span className="text-[11px] font-mono font-black text-slate-800">{ns.bloodPressure}</span>
                                      </div>
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">SPO₂</span>
                                        <span className={`text-[11px] font-mono font-black ${isSatLow ? "text-red-700 font-black" : "text-slate-800"}`}>{ns.saturation}%</span>
                                      </div>
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">GLYCÉMIE</span>
                                        <span className="text-[11px] font-mono font-black text-slate-800">{ns.glycemia} g/L</span>
                                      </div>
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">POULS</span>
                                        <span className="text-[11px] font-mono font-black text-slate-800">{ns.pulse} bpm</span>
                                      </div>
                                      <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                                        <span className="text-[9px] font-bold text-gray-400 block">POIDS</span>
                                        <span className="text-[11px] font-mono font-black text-slate-800">{ns.weight} kg</span>
                                      </div>
                                    </div>
                                    {ns.notes && (
                                      <p className="text-xs text-gray-600 mt-2 italic bg-white/50 p-2 rounded border border-dotted border-gray-200">
                                        Observations : {ns.notes}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 3: CONSOMMATION PHARMACIE */}
                    {clinicalTab === "medications" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold">
                        
                        {/* Administer form */}
                        <div className="space-y-4 bg-teal-50/15 p-5 rounded-2xl border border-teal-150">
                          <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-widest flex items-center gap-2 border-b border-teal-100 pb-2">
                            <Plus className="h-4 w-4 text-teal-700" />
                            Prendre &amp; Administrer Produits / Médicaments
                          </h4>
                          
                          {pharmacyItems.length === 0 ? (
                            <p className="text-xs text-slate-500 bg-slate-100 italic p-6 text-center border rounded-2xl">Aucun médicament ou consommable disponible en stock pharmacie.</p>
                          ) : (
                            <form onSubmit={handleAdministerMed} className="space-y-3 text-xs font-semibold">
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Choisir le produit de pharmacie actif</label>
                                <select
                                  value={selectedMedId}
                                  onChange={e => setSelectedMedId(e.target.value)}
                                  className="w-full h-10 px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-bold font-sans"
                                >
                                  {pharmacyItems.map(it => (
                                    <option key={it.id} value={it.id}>
                                      {it.name} - Stock: {it.quantity} {it.unit || "u"} · {it.price.toLocaleString()} FCFA
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Quantité prescrite / administrée</label>
                                <input
                                  type="number"
                                  min={1}
                                  required
                                  value={medQty}
                                  onChange={e => setMedQty(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center text-xs h-10"
                                />
                              </div>

                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Observations d'administration (Posologie, Voie)</label>
                                <textarea
                                  value={medNotes}
                                  onChange={e => setMedNotes(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none"
                                  placeholder="Ex: Administration orale, 2 comprimés par jour..."
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                              >
                                Déstocker de la Pharmacie &amp; Valider l'impôt de consommation
                              </button>
                            </form>
                          )}
                        </div>

                        {/* Inventory Administered List of Patient */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex justify-between items-center bg-slate-50 p-2 rounded-xl border">
                            <span>MÉDICAMENTS REÇUS</span>
                            <span className="text-[11px] bg-teal-800 text-white border border-teal-900 rounded font-mono px-2 py-0.5 font-extrabold normal-case leading-none">
                              Sous-total : {(() => {
                                const totalCost = clinicalData.administeredDrugs.reduce((sum: number, med: any) => sum + (med.price * med.quantity), 0);
                                return totalCost.toLocaleString();
                              })()} FCFA
                            </span>
                          </h4>
                          
                          {clinicalData.administeredDrugs.length === 0 ? (
                            <p className="text-xs text-slate-405 italic p-8 text-center bg-slate-50 border border-dashed rounded-2xl">Aucun médicament administré au cours du séjour.</p>
                          ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 text-xs font-semibold">
                              {clinicalData.administeredDrugs.map((med: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-gray-150 animate-fade-in text-gray-700">
                                  <div className="flex justify-between items-start font-bold">
                                    <span className="text-slate-900 text-xs font-extrabold">{med.productName}</span>
                                    <span className="text-teal-950 font-mono font-black">{(med.price * med.quantity).toLocaleString()} FCFA</span>
                                  </div>
                                  <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-semibold leading-none">
                                    <span>Quantité : {med.quantity} · (Unité: {med.price} FCFA)</span>
                                    <span>⏱️ {new Date(med.dateTime).toLocaleString("fr-FR")}</span>
                                  </div>
                                  {med.notes && (
                                    <p className="text-[11px] italic text-slate-500 mt-1 pl-2 border-l border-teal-800">
                                      Notes d'administration : {med.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 4: DEMANDES BIOLOGIQUES ET LABO */}
                    {clinicalTab === "labs" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-semibold">
                        
                        {/* Demande de labo form */}
                        <div className="space-y-4 bg-teal-50/15 p-5 rounded-2xl border border-teal-150 font-semibold text-slate-800">
                          <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-widest flex items-center gap-2 border-b border-teal-100 pb-2">
                            <Plus className="h-4 w-4 text-teal-700" />
                            Prescrire analyse au Laboratoire
                          </h4>
                          
                          <form onSubmit={handleRequestLab} className="space-y-3 text-xs font-semibold">
                            <div>
                              <label className="block font-bold text-gray-750 mb-1">Nom de l'analyse (Examen) <span className="text-red-500">*</span></label>
                              <input
                                type="text"
                                required
                                value={labTestName}
                                onChange={e => setLabTestName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold h-10"
                                placeholder="Numération Formule Sanguine (NFS), Goutte Épaisse (GE)..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Spécification clinique</label>
                                <select
                                  value={labCategory}
                                  onChange={e => setLabCategory(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-bold font-sans h-10"
                                >
                                  <option value="BLOOD">Hématologie (SANG)</option>
                                  <option value="URINE">Biologie Urinaire (URINE)</option>
                                  <option value="IMAGERIE">Radiographie / Scanner</option>
                                  <option value="BIOCHIMIE">Chimie Clinique</option>
                                  <option value="AUTRE">Immunologie / Autre</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-gray-750 mb-1">Coût de l'analyse (FCFA)</label>
                                <input
                                  type="number"
                                  value={labCost}
                                  onChange={e => setLabCost(e.target.value)}
                                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl font-bold font-mono text-center text-xs h-10"
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={!labTestName}
                              className={`w-full py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs ${
                                !labTestName ? "bg-gray-200 cursor-not-allowed text-gray-400" : ""
                              }`}
                            >
                              Transmettre la demande d'examen biologique rattaché
                            </button>
                          </form>
                        </div>

                        {/* List of Laboratory Tests */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex justify-between items-center bg-slate-50 p-2 rounded-xl border">
                            <span>ANALYSES DE LABORATOIRE</span>
                            <span className="text-[11px] bg-teal-850 text-white border border-teal-900 rounded font-mono px-2 py-0.5 font-extrabold normal-case leading-none">
                              Biologie : {(() => {
                                const totalCost = clinicalData.laboratoryTests.reduce((sum: number, lab: any) => sum + (Number(lab.cost) || 0), 0);
                                return totalCost.toLocaleString();
                              })()} FCFA
                            </span>
                          </h4>
                          
                          {clinicalData.laboratoryTests.length === 0 ? (
                            <p className="text-xs text-slate-405 italic p-8 text-center bg-slate-50 border border-dashed rounded-2xl">Aucun examen biologique demandé au cours du séjour.</p>
                          ) : (
                            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2 text-xs font-semibold">
                              {clinicalData.laboratoryTests.map((lab: any, idx: number) => {
                                const isReady = lab.status === "COMPLETED";
                                const statusColors = isReady 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                  : "bg-amber-50 text-amber-800 border-amber-200 animate-pulse";
                                  
                                return (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-gray-150 text-gray-700 animate-fade-in text-xs">
                                    <div className="flex justify-between items-start font-bold">
                                      <span className="text-slate-900 text-xs font-extrabold flex items-center gap-1.5">
                                        <FlaskConical className="h-4 w-4 text-pink-700 animate-pulse" />
                                        {lab.testName}
                                      </span>
                                      <span className={`text-[9px] border px-2 py-0.5 rounded font-mono font-black ${statusColors}`}>
                                        {isReady ? "Validé" : "En cours d'analyse"}
                                      </span>
                                    </div>
                                    
                                    <div className="flex justify-between text-[11px] text-gray-400 mt-1 font-semibold leading-none">
                                      <span>Catégorie : {lab.category} · Coût : {lab.cost.toLocaleString()} FCFA</span>
                                      <span>Prescrit : {new Date(lab.dateTime).toLocaleDateString("fr-FR")}</span>
                                    </div>
                                    
                                    {isReady && (
                                      <div className="mt-2 text-xs font-semibold bg-emerald-500/5 text-emerald-900 border border-emerald-250 p-2 rounded">
                                        <strong className="text-emerald-800 font-bold block mb-0.5">Aperçu Résultat :</strong>
                                        {lab.results || "Négatif, valeurs biologiques conformes."}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-gray-150 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-semibold italic">Les actions d'administration et de déstockage agissent en temps réel sur la comptabilité et les stocks de la clinique.</span>
                    <button
                      onClick={() => setSelectedClinicalHosp(null)}
                      className="px-5 py-2 bg-slate-250 hover:bg-slate-300 text-slate-800 text-xs font-extrabold rounded-xl transition cursor-pointer"
                    >
                      Quitter la Station Clinique Active
                    </button>
                  </div>
                  
                </div>
              </div>
            );
          })()}

          {/* Discharge detailed invoice preview and validation */}
          {selectedHospToDischarge && (
            <div className="p-6 bg-emerald-50/20 border border-emerald-200 rounded-2xl space-y-4 animate-fade-in">
              <h3 className="font-extrabold text-emerald-950 uppercase text-sm tracking-wider flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-700" />
                Rapport de sortie clinique &amp; Validation de la facture consolidée unique
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-gray-250 shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400 block">Détails d'hospitalisation :</span>
                  <p className="text-sm font-bold text-gray-900 mt-1">{getPatientFullName(selectedHospToDischarge.patientId)}</p>
                  <p className="text-xs text-gray-500 mt-1 font-semibold">Chambre d'origine: n°{selectedHospToDischarge.roomNumber} · Lit {selectedHospToDischarge.bedNumber}</p>
                  
                  <div className="text-xs font-mono text-gray-650 space-y-1 mt-4">
                    <p>📅 Admission : {new Date(selectedHospToDischarge.admissionDate).toLocaleString("fr-FR")}</p>
                    <p className="text-emerald-800 font-bold">📅 Date Sortie : {new Date().toLocaleString("fr-FR")} (Maintenant)</p>
                  </div>

                  {/* Clinical outcomes selection */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 block">Issue de l'hospitalisation :</span>
                    <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dischargeIsDeceased}
                        onChange={e => setDischargeIsDeceased(e.target.checked)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                      />
                      ⚠️ Déclarer le décès du patient
                    </label>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-gray-400 block">Estimation de la facture finale consolidée :</span>
                  
                  {(() => {
                    const bill = getEstimatedBill(selectedHospToDischarge);
                    const subtotal = bill.totalPrice;
                    const extra = Number(dischargeExtraActsPrice) || 0;
                    const finalTotal = subtotal + extra;
                    return (
                      <div className="mt-2 space-y-3">
                        <div className="text-2xl font-extrabold text-teal-950">
                          {finalTotal.toLocaleString()} <span className="text-xs text-slate-500 font-bold">FCFA Total à facturer</span>
                        </div>
                        <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-40 overflow-y-auto">
                          {bill.explanation.map((exp, idx) => (
                            <p key={idx} className="text-[11px] font-medium text-gray-600 leading-normal border-l-2 border-teal-500 pl-2">
                              {exp}
                            </p>
                          ))}
                          {extra > 0 && (
                            <p className="text-[11px] font-bold text-emerald-800 leading-normal border-l-2 border-emerald-600 pl-2">
                              Soins &amp; actes additionnels : +{extra.toLocaleString()} FCFA
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold italic">Remarque: Le paiement global libère automatiquement le lit d'hospitalisation.</p>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Patient Outcomes Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Diagnostic principal de sortie <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={dischargeDiagnosis}
                    onChange={e => setDischargeDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                    placeholder="Ex: Paludisme grave avec complications neurologiques..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Coût des actes &amp; soins infirmiers additionnels (FCFA)</label>
                  <input
                    type="number"
                    value={dischargeExtraActsPrice}
                    onChange={e => setDischargeExtraActsPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-teal-700"
                    placeholder="Ex: 5000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Recommandations et prescriptions de sortie</label>
                <textarea
                  value={dischargeRecommendations}
                  onChange={e => setDischargeRecommendations(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                  placeholder="Ex: Ordonnance de relais oral Arthemether. Repos médical de 7 jours. Contrôle dans une semaine..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Résumé clinique et observations générales de séjour <span className="text-red-500">*</span></label>
                <textarea
                  value={dischargeNotes}
                  onChange={e => setDischargeNotes(e.target.value)}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-teal-700"
                  placeholder="Saisir l'évolution clinique globale pendant le séjour hospitalier..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedHospToDischarge(null)}
                  className="px-4 py-2 border border-slate-205 text-slate-750 text-xs font-bold rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmDischarge}
                  disabled={!dischargeDiagnosis || !dischargeNotes}
                  className={`px-5 py-2 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm ${
                    (!dischargeDiagnosis || !dischargeNotes) ? "bg-gray-300 cursor-not-allowed" : "bg-emerald-700 hover:bg-emerald-800"
                  }`}
                >
                  Valider la sortie, émettre la facture unique &amp; archiver le dossier
                </button>
              </div>
            </div>
          )}

          {/* Table list of all active hospitalizations & histories */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Suivi des patients hospitalisés</span>
            </div>

            {hospitalizations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Aucune hospitalisation enregistrée.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-extrabold tracking-wider">
                      <th className="p-4">Patient</th>
                      <th className="p-4">Chambre &amp; Lit</th>
                      <th className="p-4">Coûts de séjour</th>
                      <th className="p-4">Durée de l'hospitalisation</th>
                      <th className="p-4">Motif clinique</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold text-gray-700 divide-y divide-gray-100">
                    {hospitalizations.map(item => {
                      const est = getEstimatedBill(item);
                      return (
                        <tr key={item.id} className={item.status === "ADMITTED" ? "bg-amber-50/10 hover:bg-slate-50/80 transition" : "bg-white opacity-70 hover:bg-slate-50/80 transition"}>
                          <td 
                            onClick={() => handleHospCellClick("patient", item)}
                            className="p-4 cursor-pointer hover:underline hover:text-indigo-700 transition"
                            title="Consulter le dossier d'identification DME Unifié de ce patient"
                          >
                            <span className="font-extrabold text-gray-900 block">{getPatientFullName(item.patientId)}</span>
                            <span className="text-[10px] text-gray-400 tracking-wide font-mono mt-0.5 block">{item.id}</span>
                          </td>
                          <td 
                            onClick={() => handleHospCellClick("room", item)}
                            className="p-4 cursor-pointer hover:underline hover:text-indigo-700 transition"
                            title="Consulter l'affectation de lit et propreté de la chambre d'étage"
                          >
                            <span className="font-extrabold text-slate-800">Chambre {item.roomNumber}</span>
                            <span className="text-xs text-slate-500 block">Lit : {item.bedNumber} ({item.bedType})</span>
                          </td>
                          <td 
                            onClick={() => handleHospCellClick("cost", item)}
                            className="p-4 cursor-pointer hover:underline hover:text-indigo-700 transition"
                            title="Consulter le décompte financier détaillé et couverture CANAM"
                          >
                            <span className="font-extrabold text-teal-950 block">{est.totalPrice.toLocaleString()} FCFA</span>
                            <span className="text-[10px] text-slate-400 font-medium block">Room: {item.roomType}</span>
                          </td>
                          <td 
                            onClick={() => handleHospCellClick("dates", item)}
                            className="p-4 cursor-pointer hover:underline hover:text-indigo-700 transition"
                            title="Consulter le planning d'admission officielle et date de sortie de séjour estimée"
                          >
                            <div className="text-xs space-y-0.5">
                              <p className="text-gray-550 font-serif">📅 Entrée : {new Date(item.admissionDate).toLocaleDateString()}</p>
                              {item.dischargeDate ? (
                                <p className="text-emerald-700 font-serif">📅 Sortie : {new Date(item.dischargeDate).toLocaleDateString()}</p>
                              ) : (
                                <p className="text-amber-700 font-bold uppercase text-[9px] tracking-wider">En cours ({est.totalStayDays} j)</p>
                              )}
                            </div>
                          </td>
                          <td 
                            onClick={() => handleHospCellClick("reason", item)}
                            className="p-4 max-w-xs truncate cursor-pointer hover:underline hover:text-indigo-700 transition" 
                            title="Consulter le rapport médical d'admission, constantes SOS et avis initial"
                          >
                            <span className="text-xs font-semibold text-gray-600 block line-clamp-1">{item.reason}</span>
                            {item.notes && <span className="text-[11px] text-slate-400 italic font-medium">Obs : {item.notes}</span>}
                          </td>
                          <td className="p-4 text-right">
                            {item.status === "ADMITTED" && canWriteHosp ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => loadClinicalWorkspace(item)}
                                  className="p-1 px-2.5 border border-violet-200 text-violet-700 bg-violet-50/50 rounded-lg text-xs hover:bg-violet-100 flex items-center gap-1 cursor-pointer font-bold"
                                  title="Ouvrir le suivi clinique (DME, Surveillance, Constantes, Pharmacie, Biologie)"
                                >
                                  <Stethoscope className="h-3 w-3" />
                                  Suivi Clinique
                                </button>

                                <button
                                  onClick={() => {
                                    setSelectedHospToTransfer(item);
                                    setTransferData({ toRoomId: "", toBedId: "", reason: "Changement de protocole thérapeutique (chambre ou lit)" });
                                  }}
                                  className="p-1 px-2 border border-slate-300 text-slate-700 rounded-lg text-xs hover:bg-slate-100 flex items-center gap-1 cursor-pointer font-bold"
                                  title="Transférer le patient de lit"
                                >
                                  <ArrowLeftRight className="h-3 w-3" />
                                  Muté
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedHospToDischarge(item);
                                    setDischargeNotes(item.notes || "");
                                    setDischargeDiagnosis("");
                                    setDischargeRecommendations("");
                                    setDischargeExtraActsPrice("0");
                                    setDischargeIsDeceased(false);
                                  }}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs flex items-center gap-1 cursor-pointer font-bold shrink-0 shadow-3xs"
                                  title="Terminer l'hospitalisation"
                                >
                                  Sortie
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-400 px-2.5 py-0.5 rounded-full font-bold">
                                Archivé
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CHAMBRES SETTINGS */}
      {activeTab === "rooms" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* Create room form panel toggle button */}
          {canWriteHosp && (
            <div className="flex md:justify-end">
              <button
                onClick={() => {
                  setEditingRoom(null);
                  setRoomFormData({
                    number: "",
                    type: "Classique",
                    service: "Médecine Générale",
                    floor: "Rez-de-chaussée",
                    allowedGender: "Mixte",
                    status: "Disponible",
                    capacity: 2
                  });
                  setShowRoomForm(!showRoomForm);
                }}
                className="px-4 py-2 bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showRoomForm ? "Cacher le formulaire" : "Ajouter une Chambre"}
              </button>
            </div>
          )}

          {/* Form Create/Edit Room */}
          {showRoomForm && (
            <div className="p-6 bg-slate-50 border border-gray-250 rounded-2xl">
              <h3 className="text-sm font-extrabold uppercase text-gray-700 mb-4">{editingRoom ? "Modifier la chambre" : "Enregistrer une nouvelle chambre clinique"}</h3>
              <form onSubmit={handleRoomSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Numéro de Chambre <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={roomFormData.number}
                    onChange={e => setRoomFormData({ ...roomFormData, number: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="e.g. 104"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type de Chambre <span className="text-rose-500">*</span></label>
                  <select
                    value={roomFormData.type}
                    onChange={e => setRoomFormData({ ...roomFormData, type: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="VIP">Chambre VIP</option>
                    <option value="Climatisée">Chambre Climatisée</option>
                    <option value="Classique">Chambre Classique (Standard)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Service d'affectation <span className="text-rose-500">*</span></label>
                  <select
                    value={roomFormData.service}
                    onChange={e => setRoomFormData({ ...roomFormData, service: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Médecine Générale">Médecine Générale</option>
                    <option value="Chirurgie">Chirurgie</option>
                    <option value="Pédiatrie">Pédiatrie</option>
                    <option value="Maternité / CPN">Maternité</option>
                    <option value="Urgences">Urgences</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Étage <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={roomFormData.floor}
                    onChange={e => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="e.g. 1er étage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Restriction de Sexe <span className="text-rose-500">*</span></label>
                  <select
                    value={roomFormData.allowedGender}
                    onChange={e => setRoomFormData({ ...roomFormData, allowedGender: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Mixte">Chambre Mixte</option>
                    <option value="Homme">Chambre Homme</option>
                    <option value="Femme">Chambre Femme</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Statut Initial <span className="text-rose-500">*</span></label>
                  <select
                    value={roomFormData.status}
                    onChange={e => setRoomFormData({ ...roomFormData, status: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Fermée temporairement">Fermée Temporairement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Capacité maximale de lits <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={roomFormData.capacity}
                    onChange={e => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoom(null);
                      setShowRoomForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-150 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-teal-800 hover:bg-teal-900 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    {editingRoom ? "Mettre à jour" : "Créer la chambre"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rooms Table List */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-extrabold tracking-wider">
                    <th className="p-4">Chambre</th>
                    <th className="p-4">Étage</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Service</th>
                    <th className="p-4">Genre autorisé</th>
                    <th className="p-4">Capacité Lits</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-gray-750 divide-y divide-gray-100/80">
                  {rooms.map(r => {
                    const associatedBedsCount = beds.filter(b => b.roomId === r.id).length;
                    return (
                      <tr key={r.id}>
                        <td className="p-4">
                          <span className="font-extrabold text-gray-900">n° {r.number}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{r.id}</span>
                        </td>
                        <td className="p-4">{r.floor}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            r.type === 'VIP' ? 'bg-amber-100 text-amber-800' :
                            r.type === 'Climatisée' ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-150 text-slate-700'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600">{r.service}</td>
                        <td className="p-4 font-bold text-xs">
                          {r.allowedGender === "Homme" ? "🧑 Hommes uniquement" :
                           r.allowedGender === "Femme" ? "👩 Femmes uniquement" : "🚻 Mixte"}
                        </td>
                        <td className="p-4 font-bold text-xs">
                          <span className="text-teal-900 font-extrabold">{associatedBedsCount}</span> lit(s) installé(s)<br/>
                          <span className="text-[10px] text-gray-500 font-normal">(Capacité: {r.capacity || 2} max)</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            r.status === 'Disponible' ? 'bg-emerald-50 text-emerald-800' :
                            r.status === 'Occupée' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {canWriteHosp && (
                            <div className="flex justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingRoom(r);
                                  setRoomFormData({
                                    number: r.number,
                                    type: r.type,
                                    service: r.service,
                                    floor: r.floor,
                                    allowedGender: r.allowedGender || "Mixte",
                                    status: r.status,
                                    capacity: r.capacity || 2
                                  });
                                  setShowRoomForm(true);
                                }}
                                className="p-1 px-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold cursor-pointer"
                                title="Modifier la chambre"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                              
                              <button
                                onClick={() => handleRoomDelete(r.id, r.number)}
                                className="p-1 px-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
                                title="Retirer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
      )}

      {/* TAB 4: LITS MANAGEMENT */}
      {activeTab === "beds" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          {/* Create bed trigger */}
          {canWriteHosp && (
            <div className="flex md:justify-end">
              <button
                onClick={() => {
                  setEditingBed(null);
                  setBedFormData({
                    number: "",
                    type: "Classique",
                    roomId: "",
                    status: "Disponible",
                    maintenanceReason: ""
                  });
                  setShowBedForm(!showBedForm);
                }}
                className="px-4 py-2 bg-teal-800 text-white hover:bg-teal-900 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                {showBedForm ? "Cacher le formulaire" : "Ajouter un Lit"}
              </button>
            </div>
          )}

          {/* Form Bed */}
          {showBedForm && (
            <div className="p-6 bg-slate-50 border border-gray-250 rounded-2xl">
              <h3 className="text-sm font-extrabold uppercase text-gray-700 mb-4">{editingBed ? "Modifier le lit" : "Rattacher un lit à une chambre"}</h3>
              <form onSubmit={handleBedSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Chambre d'affectation <span className="text-rose-500">*</span></label>
                  <select
                    value={bedFormData.roomId}
                    onChange={e => setBedFormData({ ...bedFormData, roomId: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    required
                  >
                    <option value="">-- Choisir la chambre --</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        Chambre {r.number} ({r.service})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 font-sans">Code Unique du Lit <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={bedFormData.number}
                    onChange={e => setBedFormData({ ...bedFormData, number: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                    placeholder="e.g. Lit A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Type de lit <span className="text-rose-500">*</span></label>
                  <select
                    value={bedFormData.type}
                    onChange={e => setBedFormData({ ...bedFormData, type: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Classique">Lit Classique</option>
                    <option value="VIP">Lit VIP (Électrique)</option>
                    <option value="Handicapé">Accessible PMR / Médicalisé</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Statut Initial <span className="text-rose-500">*</span></label>
                  <select
                    value={bedFormData.status}
                    onChange={e => setBedFormData({ ...bedFormData, status: e.target.value })}
                    className="w-full h-11 px-3 py-2 bg-white border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Réservé">Réservé</option>
                    <option value="En nettoyage">En nettoyage</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Hors service">Hors Service</option>
                  </select>
                </div>

                {(bedFormData.status === "Maintenance" || bedFormData.status === "Hors service") && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 mb-1 text-red-700 font-bold">Motif de mise hors-service/maintenance (Obligatoire) <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      value={bedFormData.maintenanceReason}
                      onChange={e => setBedFormData({ ...bedFormData, maintenanceReason: e.target.value })}
                      className="w-full h-11 px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-sm font-semibold focus:outline-none"
                      placeholder="Indiquez le motif exact de l'arrêt technique..."
                      required
                    />
                  </div>
                )}

                <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBed(null);
                      setShowBedForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-150 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-white bg-teal-800 hover:bg-teal-900 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                  >
                    {editingBed ? "Mettre à jour" : "Rattacher le lit"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Beds Tracker Table Grid */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-extrabold tracking-wider">
                    <th className="p-4">Lit unique</th>
                    <th className="p-4">Type de lit</th>
                    <th className="p-4">Chambre affectée</th>
                    <th className="p-4">Patient actif</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-semibold text-gray-75 * divide-y divide-gray-100/80">
                  {beds.map(b => {
                    const parentRoom = rooms.find(r => r.id === b.roomId);
                    return (
                      <tr key={b.id}>
                        <td className="p-4">
                          <span className="font-extrabold text-teal-900 block">{b.number}</span>
                          <span className="text-[9px] text-gray-400 font-mono mt-0.5">ID: {b.id}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            b.type === 'VIP' ? 'bg-amber-100 text-amber-800' :
                            b.type === 'Handicapé' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {b.type}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-xs">
                          {parentRoom ? `Chambre ${parentRoom.number} (${parentRoom.service})` : "Aucune affectation !"}
                        </td>
                        <td className="p-4 text-xs font-bold">
                          {b.patientNom ? (
                            <div className="text-teal-950 font-extrabold">
                              🧑‍⚕️ {b.patientNom}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-medium">Aucun</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            b.status === 'Disponible' ? 'bg-emerald-50 text-emerald-800' :
                            b.status === 'Occupé' ? 'bg-amber-150 text-amber-800' :
                            b.status === 'En nettoyage' ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleViewBedHistory(b)}
                              className="p-1 px-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1"
                              title="Historique d'occupation du lit"
                            >
                              <History className="h-3 w-3 text-slate-500" />
                              <span className="sr-only sm:not-sr-only text-[10px]">Historique</span>
                            </button>

                            {canWriteHosp && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingBed(b);
                                    setBedFormData({
                                      number: b.number,
                                      type: b.type,
                                      roomId: b.roomId,
                                      status: b.status,
                                      maintenanceReason: b.maintenanceReason || ""
                                    });
                                    setShowBedForm(true);
                                  }}
                                  className="p-1 px-2 border border-gray-300 text-gray-705 hover:bg-gray-100 rounded-lg text-xs font-bold cursor-pointer"
                                  title="Modifier"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => handleBedDelete(b.id, b.number)}
                                  className="p-1 px-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold cursor-pointer"
                                  title="Retirer le lit"
                                  disabled={b.status === "Occupé"}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bed Occupancy History Modal (Fulfills complete bed occupation history log view) */}
          {selectedBedForHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in" id="bed-history-modal-overlay" onClick={() => setSelectedBedForHistory(null)}>
              <div 
                className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-150 overflow-hidden flex flex-col max-h-[85vh]"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-5 bg-slate-50 border-b border-gray-150 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <History className="h-4 w-4 text-teal-800 animate-pulse" />
                      Historique d'occupation du Lit
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      Lit unique <span className="font-extrabold text-teal-900">n° {selectedBedForHistory.number}</span> ({selectedBedForHistory.type}) · Chambre {rooms.find(r => r.id === selectedBedForHistory.roomId)?.number || ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedBedForHistory(null)}
                    className="p-1 px-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-bold cursor-pointer font-sans"
                  >
                    Fermer (✕)
                  </button>
                </div>

                {/* Content body */}
                <div className="p-6 overflow-y-auto space-y-4">
                  {loadingHistory ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2">
                      <RefreshCw className="h-6 w-4 text-teal-800 animate-spin" />
                      <span className="text-xs font-bold text-gray-500">Chargement de l'historique...</span>
                    </div>
                  ) : bedHistoryList.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl">
                      <Clock className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-sm font-extrabold text-slate-600">Aucun historique d'occupations trouvé</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Ce lit n'a pas encore fait l'objet d'admissions ou de transferts persistés.</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-5">
                      {bedHistoryList.map((hist, index) => {
                        const isCurrent = !hist.endDate;
                        return (
                          <div key={hist.id || index} className="relative">
                            {/* Dot indicator */}
                            <span className={`absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border-2 bg-white ${
                              isCurrent ? "border-emerald-500 bg-emerald-100 ring-4 ring-emerald-50" : "border-slate-300 bg-white"
                            }`}></span>
                            
                            <div className="p-4 bg-slate-50 border border-gray-150 rounded-2xl">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                <span className="font-extrabold text-gray-900 text-xs sm:text-sm">
                                  Patient : {hist.patientName || `ID ${hist.patientId?.substring(0, 8)}`}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                    hist.action === "ADMISSION" || hist.action === "ADMITTED" ? "bg-emerald-100 text-emerald-800" :
                                    hist.action === "MUTATION" || hist.action === "TRANSFER" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                                  }`}>
                                    {hist.action}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 bg-teal-800 text-white rounded text-[9px] font-black uppercase tracking-wider animate-pulse">
                                      Actif
                                    </span>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 font-medium">
                                Du {new Date(hist.startDate).toLocaleString("fr-FR")} au {hist.endDate ? new Date(hist.endDate).toLocaleString("fr-FR") : <span className="text-teal-800 font-extrabold italic">Présent</span>}
                              </p>
                              {hist.notes && (
                                <p className="text-xs text-gray-650 bg-white border border-gray-150 p-2 rounded-xl mt-2 italic">
                                  <span className="font-bold not-italic text-gray-500 font-sans block text-[10px] uppercase mb-0.5">Observations / Notes</span>
                                  {hist.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-gray-150 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  <span>Tracé Audité clinique</span>
                  <span>{bedHistoryList.length} Entrées historiques</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: BARÈME TARIFS (ADMIN PANEL RATES) */}
      {activeTab === "rates" && !loading && (
        <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
          <div className="p-5 bg-teal-50/20 border border-teal-100 rounded-2xl">
            <h3 className="font-extrabold text-sm text-center uppercase tracking-wider text-teal-900 mb-2">Gestion des tarifs journaliers d'hébèrgement</h3>
            <p className="text-xs text-center text-gray-500 font-semibold mb-4 leading-relaxed">
              Consignez ici la tarification par jour relative aux types de lits et types de chambres. Les chambres et lits de type <strong>Classique/Standard</strong> sont configurés obligatoirement à 0 FCFA pour la gratuité légale.
            </p>

            <form onSubmit={handleRatesSave} className="space-y-6">
              {/* Rooms Rates */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-3xs space-y-4">
                <h4 className="font-extrabold text-xs text-teal-950 uppercase tracking-widest border-b border-gray-100 pb-2">Tarification Hébergement Chambre (/jour)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Chambre VIP</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.roomRates_VIP}
                        onChange={e => setTempRates({ ...tempRates, roomRates_VIP: Number(e.target.value) })}
                        className="w-full h-11 px-3 py-2 border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        required
                        disabled={!isAdminHosp}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400">FCFA</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Chambre Climatisée</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.roomRates_Climatisée}
                        onChange={e => setTempRates({ ...tempRates, roomRates_Climatisée: Number(e.target.value) })}
                        className="w-full h-11 px-3 py-2 border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        required
                        disabled={!isAdminHosp}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400">FCFA</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Chambre standard (Gratuit)</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.roomRates_Classique}
                        className="w-full h-11 px-3 py-2 bg-slate-100 border border-gray-200 text-slate-400 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        disabled
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-slate-400">FCFA</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beds Rates */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-3xs space-y-4">
                <h4 className="font-extrabold text-xs text-teal-950 uppercase tracking-widest border-b border-gray-100 pb-2 font-mono">Tarification Lits (/jour)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Lit VIP (Frais sup)</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.bedRates_VIP}
                        onChange={e => setTempRates({ ...tempRates, bedRates_VIP: Number(e.target.value) })}
                        className="w-full h-11 px-3 py-2 border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        required
                        disabled={!isAdminHosp}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400">FCFA</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Lit pmr / Handicapé (sup)</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.bedRates_Handicapé}
                        onChange={e => setTempRates({ ...tempRates, bedRates_Handicapé: Number(e.target.value) })}
                        className="w-full h-11 px-3 py-2 border border-gray-250 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        required
                        disabled={!isAdminHosp}
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-gray-400">FCFA</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase">Lit Classique (Gratuit)</label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={tempRates.bedRates_Classique}
                        className="w-full h-11 px-3 py-2 bg-slate-100 border border-gray-200 text-slate-400 rounded-xl text-sm font-semibold focus:outline-none pr-12"
                        disabled
                      />
                      <span className="absolute right-3 top-3 text-[10px] font-extrabold text-slate-400">FCFA</span>
                    </div>
                  </div>
                </div>
              </div>

              {isAdminHosp ? (
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSyncingRates}
                    className="px-6 py-3 bg-teal-900 border border-teal-900 text-white hover:bg-teal-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSyncingRates ? (
                      <>
                        <CircleDot className="h-4 w-4 animate-spin text-white" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Enregistrer la Grille des Tarifs
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-bold rounded-lg flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-550 shrink-0" />
                  <span>Seul le personnel Administrateur (ADMIN) est habilité à modifier la tarification générale. Prédicats en lecture seule activés.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: TRACK TRANSFERS LOGS */}
      {activeTab === "transfers" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Registre d'historique de mutation de lits</h3>
            <p className="text-xs text-gray-500 mt-0.5">Suivi continu des mouvements de lits, changements de services et transferts du pôle d'hospitalisation.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
            {transfers.length === 0 ? (
              <div className="p-8 text-center text-gray-400 font-medium text-sm">
                Aucun transfert inter-chambres n'a été exécuté à ce jour.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-extrabold tracking-wider">
                      <th className="p-4">Dossier de mutation ID</th>
                      <th className="p-4">Patient concerné</th>
                      <th className="p-4">Filiation de départ</th>
                      <th className="p-4">Filiation cible d'arrivée</th>
                      <th className="p-4">Date &amp; heure du transfert</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold text-gray-700 divide-y divide-gray-100">
                    {transfers.map(t => (
                      <tr key={t.id}>
                        <td className="p-4">
                          <span className="font-extrabold text-gray-900 block font-mono">{t.id}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">Hosp : {t.hospitalizationId}</span>
                        </td>
                        <td className="p-4 block">
                          <span className="font-extrabold text-teal-950 mt-1 block">{t.patientNom}</span>
                          <span className="text-[9px] text-gray-400 block font-mono">Patient: {t.patientId}</span>
                        </td>
                        <td className="p-4 text-xs font-bold text-slate-600">
                          Chambre {t.fromRoomNumber} · {t.fromBedNumber}
                        </td>
                        <td className="p-4 text-xs font-bold text-teal-800">
                          Chambre {t.toRoomNumber} · {t.toBedNumber}
                        </td>
                        <td className="p-4 text-xs font-medium text-slate-500">
                          {new Date(t.date || t.timestamp).toLocaleDateString("fr-FR")} {new Date(t.date || t.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: PRE-ADMISSION RESERVATIONS (Rule 3) */}
      {activeTab === "reservations" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 flex-wrap gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Pre-admissions &amp; Réservations de lits</h3>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">Réservez un lit pour des patients programmés avec délais de libération automatique en cas de non-présentation.</p>
            </div>
            <button
              onClick={() => setShowReservationForm(!showReservationForm)}
              className="px-4 py-2 bg-teal-850 text-white text-xs font-bold rounded-xl hover:bg-teal-900 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showReservationForm ? "Masquer le formulaire" : "Créer une Réservation"}
            </button>
          </div>

          {showReservationForm && (
            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-150 shadow-2xs space-y-4">
              <h4 className="text-sm font-extrabold text-slate-800">Formulaire d'enregistrement d'une réservation pré-admission</h4>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setSuccess("");
                const { bedId, patientName, reservedAt, autoReleaseHours } = reservationFormData;
                if (!bedId || !patientName) {
                  setError("Le lit d'affectation et le nom du patient attendu sont obligatoires.");
                  return;
                }
                try {
                  const resp = await fetch("/api/hospitalization/reservations", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(reservationFormData)
                  });
                  const dat = await resp.json();
                  if (!resp.ok) throw new Error(dat.error || "Échec de l'enregistrement de la réservation");
                  
                  setSuccess(`Réservation enregistrée avec succès pour ${patientName}.`);
                  setReservationFormData({
                    bedId: "",
                    patientName: "",
                    reservedAt: new Date().toISOString().substring(0, 16),
                    autoReleaseHours: 24
                  });
                  setShowReservationForm(false);
                  fetchAllData();
                } catch (err: any) {
                  setError(err.message);
                }
              }} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Patient Attendu</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Jean DUPONT"
                    className="p-2 border border-gray-250 rounded-lg text-sm bg-white w-full uppercase"
                    value={reservationFormData.patientName}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, patientName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Sélectionner un Lit Disponible</label>
                  <select
                    required
                    className="p-2 border border-gray-250 rounded-lg text-sm bg-white w-full"
                    value={reservationFormData.bedId}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, bedId: e.target.value })}
                  >
                    <option value="">-- Choisir un lit --</option>
                    {beds.filter(b => b.status === "Disponible").map(b => {
                      const room = rooms.find(r => r.id === b.roomId);
                      return (
                        <option key={b.id} value={b.id}>
                          Lit {b.number} - Ch {room?.number || '?'} ({room?.service || '?'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Date/Heure d'arrivée prévue</label>
                  <input
                    type="datetime-local"
                    required
                    className="p-2 border border-gray-250 rounded-lg text-sm bg-white w-full"
                    value={reservationFormData.reservedAt}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, reservedAt: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Délai de libération automatique (heures)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    required
                    className="p-2 border border-gray-250 rounded-lg text-sm bg-white w-full"
                    value={reservationFormData.autoReleaseHours}
                    onChange={(e) => setReservationFormData({ ...reservationFormData, autoReleaseHours: Number(e.target.value) })}
                  />
                </div>

                <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setShowReservationForm(false)}
                    className="px-4 py-2 border border-teal-200 text-teal-800 text-xs font-bold rounded-lg cursor-pointer hover:bg-teal-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-800"
                  >
                    Confirmer la Réservation
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* RESERVATIONS TABLE LISTING */}
          <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
            {reservations.length === 0 ? (
              <div className="p-10 text-center text-gray-400 font-medium text-sm">
                Aucune réservation active pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-100 text-xs text-gray-500 uppercase font-extrabold tracking-wider">
                      <th className="p-4">Patient Attendu</th>
                      <th className="p-4">Lit réservé</th>
                      <th className="p-4">Service d'accueil</th>
                      <th className="p-4">Date/Heure Programmée</th>
                      <th className="p-4">Délai configuré</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold text-gray-700 divide-y divide-gray-100">
                    {reservations.map(res => {
                      const bed = beds.find(b => b.id === res.bedId);
                      const room = bed ? rooms.find(r => r.id === bed.roomId) : null;
                      return (
                        <tr key={res.id}>
                          <td className="p-4">
                            <span className="font-extrabold text-teal-950 uppercase">{res.patientName}</span>
                          </td>
                          <td className="p-4 font-mono text-xs">
                            {bed ? `Lit ${bed.number} (${bed.type})` : `ID ${res.bedId}`} 
                            {room && <span className="block text-[10px] text-gray-400">Chambre {room.number} - {room.type}</span>}
                          </td>
                          <td className="p-4 text-xs">
                            {room ? room.service : "Inconnu"}
                          </td>
                          <td className="p-4 text-xs font-medium">
                            {new Date(res.reservedAt).toLocaleDateString("fr-FR")} {new Date(res.reservedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-4 text-xs">
                            <span className="px-2 py-1 bg-amber-50 text-amber-800 rounded font-bold font-mono text-[10px]">
                              {res.autoReleaseHours}h d'attente max
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={async () => {
                                if (!confirm(`Annuler définitivement la réservation de lit pour ${res.patientName} ?`)) return;
                                try {
                                  const resp = await fetch(`/api/hospitalization/reservations/${res.id}`, {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (resp.ok) {
                                    setSuccess("Réservation libérée.");
                                    fetchAllData();
                                  } else {
                                    const dat = await resp.json();
                                    throw new Error(dat.error || "Échec");
                                  }
                                } catch (err: any) {
                                  setError(err.message);
                                }
                              }}
                              className="p-1 px-2.5 bg-red-50 text-red-705 hover:bg-red-100 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Annuler"
                            >
                              <Trash2 className="h-3 w-3" />
                              Annuler
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: STATS & INDICATORS REPORT (Rule 7) */}
      {activeTab === "stats" && !loading && (
        <div className="p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Rapports de Gestion &amp; Indicateurs d'Hospitalisation</h3>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Suivi en temps réel des performances cliniques, taux de rotation, transferts et volumes d'activité financiers.</p>
          </div>

          {/* General KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* VIP Revenue */}
            <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-100 shadow-2xs">
              <span className="text-teal-800 font-bold text-xs uppercase tracking-wider block font-sans">Revenue VIP</span>
              <span className="text-xl font-extrabold text-teal-950 mt-1 block font-mono">
                {(hospitalizations.reduce((acc, h) => {
                  const r = rooms.find(room => room.id === h.roomId || room.number === h.roomNumber);
                  const rt = h.roomType || r?.type || "Classique";
                  if (rt !== "VIP") return acc;
                  const bill = getEstimatedBill(h);
                  return acc + bill.totalPrice;
                }, 0)).toLocaleString("fr-FR")} FCFA
              </span>
              <p className="text-[10px] text-teal-700/80 font-medium mt-1">Chambres VIP</p>
            </div>

            {/* Clim Revenue */}
            <div className="p-5 rounded-2xl bg-teal-50/40 border border-teal-100 shadow-2xs">
              <span className="text-teal-800 font-bold text-xs uppercase tracking-wider block font-sans">Revenue Climatisée</span>
              <span className="text-xl font-extrabold text-teal-950 mt-1 block font-mono">
                {(hospitalizations.reduce((acc, h) => {
                  const r = rooms.find(room => room.id === h.roomId || room.number === h.roomNumber);
                  const rt = h.roomType || r?.type || "Classique";
                  if (rt !== "Climatisée") return acc;
                  const bill = getEstimatedBill(h);
                  return acc + bill.totalPrice;
                }, 0)).toLocaleString("fr-FR")} FCFA
              </span>
              <p className="text-[10px] text-teal-700/80 font-medium mt-1">Chambres Climatisées</p>
            </div>

            {/* Classique Revenue */}
            <div className="p-5 rounded-2xl bg-emerald-50/30 border border-emerald-100 shadow-2xs">
              <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider block font-sans">Sector Classique</span>
              <span className="text-xl font-extrabold text-emerald-950 mt-1 block font-mono">
                {(hospitalizations.reduce((acc, h) => {
                  const r = rooms.find(room => room.id === h.roomId || room.number === h.roomNumber);
                  const rt = h.roomType || r?.type || "Classique";
                  if (rt === "VIP" || rt === "Climatisée") return acc;
                  const bill = getEstimatedBill(h);
                  return acc + bill.totalPrice;
                }, 0)).toLocaleString("fr-FR")} FCFA
              </span>
              <p className="text-[10px] text-emerald-700/80 font-medium mt-1">Secteur classique</p>
            </div>

            {/* Total Room Transfers Count */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-gray-150 shadow-2xs">
              <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block font-sans">Mutations de lits</span>
              <span className="text-xl font-extrabold text-slate-800 mt-1 block font-mono">
                {transfers.length} <span className="text-xs font-semibold text-gray-500">transferts</span>
              </span>
              <p className="text-[10px] text-gray-400 font-medium mt-1">Changements de lits cliniques</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy and Monthly counts */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Percent className="h-4 w-4 text-teal-700" />
                Détail d'activité : Hospitalisations par mois
              </h4>
              
              {hospitalizations.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center font-medium">Aucune hospitalisation mensuelle comptabilisée.</p>
              ) : (
                <div className="space-y-4">
                  {Object.keys(
                    hospitalizations.reduce((acc: any, h: any) => {
                      if (!h.admissionDate) return acc;
                      const mLabel = new Date(h.admissionDate).toLocaleString("fr-FR", { month: "long", year: "numeric" });
                      acc[mLabel] = (acc[mLabel] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(monthLabel => {
                    const monthAdmissions = hospitalizations.filter((h: any) => {
                      if (!h.admissionDate) return false;
                      const mLabel = new Date(h.admissionDate).toLocaleString("fr-FR", { month: "long", year: "numeric" });
                      return mLabel === monthLabel;
                    });
                    const count = monthAdmissions.length;
                    return (
                      <div key={monthLabel} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-700">
                          <span className="capitalize">{monthLabel}</span>
                          <span className="font-mono text-teal-700">{count} admission(s)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-teal-800 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (count / 10) * 100)}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Monthly Occupancy Rate */}
              <div className="bg-slate-50 rounded-xl p-4 border border-gray-100">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Taux d'occupation clinique réel</h5>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-extrabold text-teal-800 font-mono">
                    {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] text-slate-500 font-medium">Calculé en dynamique sur la totalité des lits opérationnels de la clinique.</p>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-linear-to-r from-teal-700 to-teal-800 rounded-full transition-all"
                        style={{ width: `${totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stay per service analysis */}
            <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-700" />
                DMS (Durée Moyenne de Séjour) par Service
              </h4>

              {hospitalizations.length === 0 ? (
                <p className="text-xs text-gray-400 p-4 text-center font-medium">Aucune donnée disponible actuellement.</p>
              ) : (
                <div className="overflow-hidden border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-widest font-extrabold">
                        <th className="p-3">Département d'accueil</th>
                        <th className="p-3 text-center">Effectif Admis</th>
                        <th className="p-3 text-right">DMS Actuelle</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700 divide-y divide-gray-100">
                      {["Médecine", "Chirurgie", "Pédiatrie", "Maternité"].map(srvName => {
                        const srvHosp = hospitalizations.filter(h => {
                          const r = rooms.find(room => room.id === h.roomId || room.number === h.roomNumber);
                          return r?.service === srvName || (!r && srvName === "Médecine");
                        });
                        const count = srvHosp.length;
                        const totalDays = srvHosp.reduce((sum, h) => {
                          const bill = getEstimatedBill(h);
                          return sum + bill.totalStayDays;
                        }, 0);
                        const avg = count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0;
                        return (
                          <tr key={srvName} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-900 font-bold">{srvName}</td>
                            <td className="p-3 text-center font-mono text-gray-500">{count}</td>
                            <td className="p-3 text-right text-teal-800 font-extrabold font-mono text-sm leading-none">
                              {avg} <span className="text-[10px] font-medium text-gray-400 font-sans">jours</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: TABLEAU DE BORD EXÉCUTIF DU DG (activeTab === "dg_dashboard") */}
      {activeTab === "dg_dashboard" && !loading && (() => {
        // Compute high-level metrics for director general
        const activeCount = hospitalizations.filter(h => h.status === "ADMITTED").length;
        const dischargedCount = hospitalizations.filter(h => h.status === "DISCHARGED").length;
        
        let totalRevenue = 0;
        let accommodationRevenue = 0;
        let pharmacyRevenue = 0;
        let laboratoryRevenue = 0;
        
        hospitalizations.forEach(h => {
          const bill = getEstimatedBill(h);
          totalRevenue += bill.totalPrice;
          
          // Separate categories
          const clinData = getClinicalDataForHosp(h);
          const medCost = clinData.administeredDrugs.reduce((sum: number, med: any) => sum + (med.price * med.quantity), 0);
          const labCost = clinData.laboratoryTests.reduce((sum: number, lab: any) => sum + (Number(lab.cost) || 0), 0);
          
          pharmacyRevenue += medCost;
          laboratoryRevenue += labCost;
          accommodationRevenue += (bill.totalPrice - medCost - labCost);
        });

        // 1. Alertes cliniques (temperature > 38.5 ou saturation < 92)
        const criticalAlerts: any[] = [];
        hospitalizations.forEach(h => {
          if (h.status === "ADMITTED") {
            const clinData = getClinicalDataForHosp(h);
            const patName = getPatientFullName(h.patientId);
            clinData.nursingSurveillances.forEach((ns: any) => {
              if (Number(ns.temperature) > 38.5) {
                criticalAlerts.push({
                  patient: patName,
                  type: "Fièvre Élevée",
                  value: `${ns.temperature}°C`,
                  room: h.roomNumber,
                  bed: h.bedNumber,
                  detail: `Mesure le {new Date(ns.dateTime).toLocaleDateString()} par ${ns.agentSign || "l'infirmier"}`
                });
              }
              if (Number(ns.saturation) < 92) {
                criticalAlerts.push({
                  patient: patName,
                  type: "Désaturation O2",
                  value: `${ns.saturation}%`,
                  room: h.roomNumber,
                  bed: h.bedNumber,
                  detail: `Mesure le {new Date(ns.dateTime).toLocaleDateString()} par ${ns.agentSign || "l'infirmier"}`
                });
              }
            });
          }
        });

        // 2. High staying duration (stay > 7 days)
        const longStayPatients = hospitalizations.filter(h => {
          if (h.status !== "ADMITTED") return false;
          const start = new Date(h.admissionDate).getTime();
          const days = Math.ceil((Date.now() - start) / (1000 * 3600 * 24));
          return days >= 7;
        });

        // 3. Maintenance beds list (from Bed status)
        const maintenanceBeds = beds.filter(b => b.status === "Maintenance" || b.status === "Hors service");

        return (
          <div className="p-6 space-y-6 animate-fade-in text-slate-800" id="dg-executive-dashboard">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-teal-950 to-teal-900 rounded-3xl p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-lg border border-teal-900">
              <div>
                <span className="text-[10px] uppercase font-black text-teal-300 tracking-widest bg-teal-900/40 px-3 py-1 rounded-full border border-teal-700/50">Direction Générale</span>
                <h3 className="text-xl font-extrabold tracking-tight mt-2">Tableau de Bord Stratégique Hospitalier</h3>
                <p className="text-xs text-teal-150 mt-1 font-medium">Vue consolidée d'aide à la décision administrative, statut de maintenance opérationnelle et de performance financière.</p>
              </div>
              
              <div className="text-left md:text-right font-mono bg-white/5 p-4 rounded-2xl border border-white/10 shrink-0">
                <span className="text-[10px] uppercase font-bold text-teal-300 block">Total Chiffre d'Affaires</span>
                <span className="text-2xl font-black text-white">{totalRevenue.toLocaleString("fr-FR")} FCFA</span>
                <p className="text-[9px] text-teal-200 mt-1">Hébergement, Pharmacie et Laboratoire inclus</p>
              </div>
            </div>

            {/* Strategic KPI cards row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 bg-white rounded-2xl border border-gray-150 shadow-xs">
                <span className="text-gray-400 font-bold text-[10px] uppercase block tracking-wider font-sans">Patients Admis Actifs</span>
                <span className="text-2xl font-black text-teal-950 mt-1 block font-mono">{activeCount}</span>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-teal-800" style={{ width: `${Math.min(100, (activeCount/30)*100)}%` }} />
                </div>
                <p className="text-[10px] text-gray-550 mt-1.5 font-semibold">Occupation : {totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0}%</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-150 shadow-xs">
                <span className="text-gray-400 font-bold text-[10px] uppercase block tracking-wider font-sans">Sorties / Archivées</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{dischargedCount}</span>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-slate-600" style={{ width: `${Math.min(100, (dischargedCount/30)*100)}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Sorties de séjour validées</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-150 shadow-xs">
                <span className="text-gray-400 font-bold text-[10px] uppercase block tracking-wider font-sans">Répartition Pharmacie</span>
                <span className="text-2xl font-black text-violet-955 mt-1 block font-mono">{pharmacyRevenue.toLocaleString()} FCFA</span>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-violet-850" style={{ width: `${totalRevenue > 0 ? (pharmacyRevenue / totalRevenue) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-violet-700 mt-1.5 font-semibold">Prescriptions d'hospitalisation</p>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-150 shadow-xs">
                <span className="text-gray-400 font-bold text-[10px] uppercase block tracking-wider font-sans">Répartition Laboratoire</span>
                <span className="text-2xl font-black text-rose-955 mt-1 block font-mono">{laboratoryRevenue.toLocaleString()} FCFA</span>
                <div className="h-1 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-rose-650" style={{ width: `${totalRevenue > 0 ? (laboratoryRevenue / totalRevenue) * 100 : 0}%` }} />
                </div>
                <p className="text-[10px] text-rose-750 mt-1.5 font-semibold">Examens biologiques facturés</p>
              </div>
            </div>

            {/* Main analytics grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Financial source breakdown & strategic occupation */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-805" />
                  Structure des Recettes Consolidées d'Hospitalisation
                </h4>
                
                <div className="space-y-4 font-semibold text-xs text-slate-705">
                  <div className="p-4 bg-teal-50/20 border border-teal-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Hébergement (Forfait Lits &amp; Chambres)</span>
                      <strong className="font-mono text-teal-900">{accommodationRevenue.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-800" style={{ width: `${totalRevenue > 0 ? (accommodationRevenue / totalRevenue) * 100 : 100}%` }} />
                    </div>
                  </div>

                  <div className="p-4 bg-violet-50/15 border border-violet-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Médicaments &amp; Pharmacie de séjour</span>
                      <strong className="font-mono text-violet-900">{pharmacyRevenue.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-violet-800" style={{ width: `${totalRevenue > 0 ? (pharmacyRevenue / totalRevenue) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50/15 border border-rose-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span>Examens Biologiques (Laboratoire)</span>
                      <strong className="font-mono text-rose-900">{laboratoryRevenue.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-700" style={{ width: `${totalRevenue > 0 ? (laboratoryRevenue / totalRevenue) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border rounded-xl text-xs font-semibold">
                  <span className="text-[10px] uppercase text-gray-400 block tracking-widest font-extrabold mb-1">MÉDECIN-RÉFÉRENT PRINCIPAL</span>
                  <p className="text-slate-800 font-extrabold flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-teal-800" />
                    Dr. Kouamé (Maternité / Chirurgie) · DMS Optimisée : 3.2 jours
                  </p>
                </div>
              </div>

              {/* Maintenance monitoring block (Requirement 2) */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Settings className="h-4 w-4 text-orange-600 animate-spin-slow" />
                  Statut de Maintenance des Lits Cliniques ou Hors services ({maintenanceBeds.length})
                </h4>

                {maintenanceBeds.length === 0 ? (
                  <p className="text-xs text-slate-400 p-8 text-center italic bg-slate-50 border border-dashed rounded-xl">Tous les lits de l'établissement sont actuellement opérationnels.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {maintenanceBeds.map(b => (
                      <div key={b.id} className="p-3.5 bg-orange-50/50 rounded-xl border border-orange-200/80 text-xs font-semibold flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <p className="text-orange-950 font-bold block">Lit {b.number} ({b.type})</p>
                          <p className="text-gray-450 text-[10px] font-medium">Chambre : {b.roomNumber} · Service : {b.service || "Médecine"}</p>
                          <p className="text-orange-900 mt-1 font-semibold italic bg-white/60 p-1.5 rounded border border-dotted border-orange-300">
                            Motif requis : {b.maintenanceReason || "Panne mécanique barrière latérale - Réparation."}
                          </p>
                        </div>
                        <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-mono font-black shrink-0 self-start">
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="p-3.5 bg-slate-50 rounded-xl border text-[11px] font-semibold text-gray-450 leading-relaxed">
                  L'équipe technique de la clinique a l'obligation légale de documenter le motif de mise hors service ou maintenance pour chaque lit de l'organisation.
                </div>
              </div>

            </div>

            {/* Bottom Alert System & Long Stay Patients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Clinical warning & Alerts (Temperature / SpO2) */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center justify-between text-rose-950">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-650 animate-bounce" />
                    <span>Alertes cliniques prioritaires ({criticalAlerts.length})</span>
                  </div>
                  {criticalAlerts.length > 0 && <span className="bg-rose-100 text-rose-850 text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wider blink">Critique</span>}
                </h4>

                {criticalAlerts.length === 0 ? (
                  <p className="text-xs text-slate-400 p-8 text-center italic bg-slate-50 border border-dashed rounded-xl">Aucun patient n'affiche actuellement de constantes cliniques alarmantes.</p>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 text-xs font-semibold">
                    {criticalAlerts.map((alt, i) => (
                      <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 relative animate-fade-in text-gray-700">
                        <div className="flex justify-between items-center text-[10px] text-rose-800 font-extrabold uppercase bg-white/40 p-1 rounded">
                          <span>⚠️ Alerte : {alt.type}</span>
                          <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded font-mono font-black">{alt.value}</span>
                        </div>
                        <p className="text-slate-900 font-extrabold text-xs">Patient : <span className="text-rose-900">{alt.patient}</span></p>
                        <p className="text-gray-450 text-[10px] font-medium">Chambre : {alt.room} · Lit : {alt.bed}</p>
                        <p className="text-[10px] text-rose-700 italic mt-1 font-medium bg-white/55 p-1 rounded">{alt.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Long stay patient alert (> 7 days stays) */}
              <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-700" />
                  Séjours Hospitaliers Prolongés (&gt; 7 jours) ({longStayPatients.length})
                </h4>

                {longStayPatients.length === 0 ? (
                  <p className="text-xs text-slate-400 p-8 text-center italic bg-slate-50 border border-dashed rounded-xl">Aucun patient n'excède 7 jours d'hospitalisation continue à ce jour.</p>
                ) : (
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 text-xs font-semibold">
                    {longStayPatients.map(h => {
                      const daysCount = Math.ceil((Date.now() - new Date(h.admissionDate).getTime()) / (1000 * 3600 * 24));
                      const patName = getPatientFullName(h.patientId);
                      return (
                        <div key={h.id} className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-xl relative flex justify-between items-center">
                          <div>
                            <p className="text-slate-900 font-extrabold text-xs">{patName}</p>
                            <p className="text-gray-400 text-[10px] font-medium font-sans">Chambre : {h.roomNumber} · Lit : {h.bedNumber} · Réf : {h.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-indigo-700 font-medium mt-1">Admis le : {new Date(h.admissionDate).toLocaleDateString()}</p>
                          </div>
                          <span className="bg-indigo-700 text-white font-mono px-2 py-1 rounded font-black text-xs shrink-0 text-center">
                            {daysCount} jours
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        );
      })()}
      {/* Dynamic Modal for Everything is Clickable (TOUT EST CLIQUABLE) rule - Hospitalisation */}
      {medisahelClickModal && medisahelClickModal.isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in" id="medisahel-clickable-modal">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scale-in col-span-full">
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[9px] bg-indigo-100 text-indigo-800 border border-indigo-200 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                  {medisahelClickModal.badge || "MÉD_SAHEL SECURE"}
                </span>
                <h3 className="text-sm font-bold font-display text-slate-800 mt-1">{medisahelClickModal.title}</h3>
                {medisahelClickModal.subtitle && (
                  <p className="text-[11px] text-slate-500 font-medium font-sans mt-0.5">{medisahelClickModal.subtitle}</p>
                )}
              </div>
              <button 
                onClick={() => setMedisahelClickModal(null)}
                className="p-1 px-2 border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto w-full">
              {medisahelClickModal.sections.map((sect: any, sIdx: number) => (
                <div key={sIdx} className="space-y-2 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                    {sect.title} :
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2.5">
                    {sect.items.map((item: any, iIdx: number) => (
                      <div key={iIdx} className="flex justify-between items-start gap-4 text-xs font-sans">
                        <span className="text-slate-400 font-medium">{item.label}</span>
                        <span className={`text-right text-slate-800 font-semibold ${item.mono ? "font-mono text-[10px]" : ""}`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-wrap justify-end gap-2.5">
              {medisahelClickModal.actions?.map((act: any, aIdx: number) => (
                <button
                  key={aIdx}
                  onClick={act.onClick}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    act.primary 
                      ? "bg-slate-800 hover:bg-slate-900 text-white shadow-md"
                      : "bg-white hover:bg-slate-100 text-slate-705 border border-slate-200"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
