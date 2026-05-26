import { 
  Patient, 
  Appointment, 
  MedicalRecord, 
  BedAllocation, 
  LabTest, 
  MedicalImage, 
  StockItem, 
  Invoice, 
  StaffPresence, 
  MailRecord, 
  TriageRecord,
  UserAccount
} from "./types";

// Static Seed Data
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "MS-2026-0045",
    nom: "Diarra",
    prenom: "Amadou",
    sexe: "M",
    dateNaissance: "1988-04-12",
    telephone: "+223 76 54 32 10",
    adresse: "Badalabougou, Bamako",
    profession: "Enseignant",
    groupeSanguin: "O+",
    allergies: "Pénicilline",
    assurance: "INPS (80%)",
    createdAt: "2026-04-10T11:00:00Z"
  },
  {
    id: "MS-2026-0046",
    nom: "Traoré",
    prenom: "Fatoumata",
    sexe: "F",
    dateNaissance: "1994-09-25",
    telephone: "+223 66 78 90 12",
    adresse: "Kalaban Coura, Bamako",
    profession: "Commerçante",
    groupeSanguin: "A+",
    allergies: "Aucune",
    assurance: "Aucune",
    createdAt: "2026-04-15T09:30:00Z"
  },
  {
    id: "MS-2026-0047",
    nom: "Coulibaly",
    prenom: "Ousmane",
    sexe: "M",
    dateNaissance: "2015-02-03",
    telephone: "+223 75 43 21 09",
    adresse: "Sogoniko, Bamako",
    profession: "Élève",
    groupeSanguin: "B-",
    allergies: "Poussière",
    assurance: "CANAM (70%)",
    createdAt: "2026-05-01T14:45:00Z"
  },
  {
    id: "MS-2026-0048",
    nom: "Keïta",
    prenom: "Mariam",
    sexe: "F",
    dateNaissance: "1972-11-30",
    telephone: "+223 69 11 22 33",
    adresse: "Hamdallaye ACI 2000, Bamako",
    profession: "Directrice de société",
    groupeSanguin: "AB+",
    allergies: "Aspirine",
    assurance: "MFA (50%)",
    createdAt: "2026-05-10T16:20:00Z"
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "rdv-201",
    patientId: "MS-2026-0045",
    patientNom: "Amadou Diarra",
    medecin: "Dr. Sangaré (Généraliste)",
    date: "2026-05-26",
    heure: "09:00",
    salle: "Bureau de Consultation A",
    statut: "Confirmé",
    notes: "Suivi de traitement hypertension artérielle",
    createdAt: "2026-05-24T10:00:00Z"
  },
  {
    id: "rdv-202",
    patientId: "MS-2026-0046",
    patientNom: "Fatoumata Traoré",
    medecin: "Dr. Diallo (Pédiatre / Gynécologue)",
    date: "2026-05-26",
    heure: "10:30",
    salle: "Bureau Gynécologique",
    statut: "En attente",
    notes: "Visite prénatale 3ème trimestre",
    createdAt: "2026-05-25T11:20:00Z"
  },
  {
    id: "rdv-203",
    patientId: "MS-2026-0047",
    patientNom: "Ousmane Coulibaly",
    medecin: "Dr. Keïta (Généraliste)",
    date: "2026-05-27",
    heure: "14:00",
    salle: "Bureau de Consultation B",
    statut: "Confirmé",
    notes: "Contrôle post-fébrile",
    createdAt: "2026-05-25T08:00:00Z"
  }
];

export const INITIAL_RECORDS: MedicalRecord[] = [
  {
    id: "consult-301",
    patientId: "MS-2026-0045",
    date: "2026-05-12",
    motif: "Céphalées intenses et bourdonnements d'oreilles",
    diagnostic: "Hypertension Artérielle Stade II non contrôlée",
    codeCIM10: "I10 - Hypertension essentielle (primaire)",
    prescription: "Amlodipine 5mg: 1 comprimé par jour le matin pendant 30 jours\nParacétamol 1g: si douleur max 3x/jour",
    examensDemandes: ["Créatininémie", "Ionogramme sanguin"],
    certificatDuree: 3,
    notesCliniques: "TA constatée à 160/95 mmHg à deux reprises. Repos médical conseillé de 3 jours. Conseils diététiques prodigués (réduction du sel, marche).",
    medecinSignature: "Dr. Sangaré",
    createdAt: "2026-05-12T10:30:00Z"
  },
  {
    id: "consult-302",
    patientId: "MS-2026-0047",
    date: "2026-05-15",
    motif: "Fièvre à 39.5°C et arthralgies",
    diagnostic: "Paludisme Simple à Plasmodium Falciparum",
    codeCIM10: "B50 - Paludisme à Plasmodium falciparum",
    prescription: "Arthemeter-Lumefantrine (Coartem) form pédiatrique: 1 tab matin et soir pendant 3 jours\nParacétamol sirop: 1 dose poids toutes le 6h pour la fièvre",
    examensDemandes: ["Goutte Épaisse (GE)", "TDR Paludisme"],
    notesCliniques: "TDR positif pour P. Falciparum. Pas de signes de gravité (pas d'anémie clinique sévère, enfant conscient et s'alimentant).",
    medecinSignature: "Dr. Sangaré",
    createdAt: "2026-05-15T15:00:00Z"
  }
];

export const INITIAL_BEDS: BedAllocation[] = [
  { id: "Lit-101", chambre: "Chambre 101 (Individuelle)", service: "Médecine Générale", statut: "Occupé", patientId: "MS-2026-0045", patientNom: "Amadou Diarra", temperature: 37.8, frequenceCardiaque: 82, soinsInfirmiersLogs: ["08:00 - Administration Amlodipine 5mg", "12:00 - Prise de température (37.8°C), constantes stables"] },
  { id: "Lit-102", chambre: "Chambre 102 (Double - A)", service: "Urgences", statut: "Disponible" },
  { id: "Lit-103", chambre: "Chambre 102 (Double - B)", service: "Urgences", statut: "Disponible" },
  { id: "Lit-104", chambre: "Chambre 201 (Maternité - A)", service: "Maternité / CPN", statut: "Disponible" },
  { id: "Lit-105", chambre: "Chambre 201 (Maternité - B)", service: "Maternité / CPN", statut: "Occupé", patientId: "MS-2026-0048", patientNom: "Mariam Keïta", temperature: 36.9, frequenceCardiaque: 72, soinsInfirmiersLogs: ["09:00 - Monitoring fœtal normal", "15:00 - Patiente stable, repos au lit"] },
  { id: "Lit-106", chambre: "Chambre de Triage 1", service: "Urgences", statut: "Maintenance" }
];

export const INITIAL_LAB_TESTS: LabTest[] = [
  { id: "lab-401", patientId: "MS-2026-0045", patientNom: "Amadou Diarra", typeExamen: "Biochimie", nomAnalyse: "Créatininémie", valeurReference: "60 - 110 µmol/L", resultatObtenu: "98 µmol/L", dateDemande: "2026-05-26", statut: "Validé", dateValidation: "2026-05-26", biologisteValidateur: "Biologiste Diallo" },
  { id: "lab-402", patientId: "MS-2026-0046", patientNom: "Fatoumata Traoré", typeExamen: "Hématologie", nomAnalyse: "NFS / Hémogramme", valeurReference: "Hémoglobine: 12.0 - 16.0 g/dL", resultatObtenu: "11.2 g/dL (Anémie légère)", dateDemande: "2026-05-26", statut: "Validé", dateValidation: "2026-05-26", biologisteValidateur: "Biologiste Diallo" },
  { id: "lab-403", patientId: "MS-2026-0047", patientNom: "Ousmane Coulibaly", typeExamen: "Parasitologie", nomAnalyse: "Goutte Épaisse (GE) & TDR", valeurReference: "Négatif", resultatObtenu: "TDR Positif (P. falciparum)", dateDemande: "2026-05-26", statut: "Urgent", alertCritique: true }
];

export const INITIAL_IMAGING: MedicalImage[] = [
  { id: "img-501", patientId: "MS-2026-0048", patientNom: "Mariam Keïta", typeImagerie: "Échographie", medecinPrescripteur: "Dr. Diallo", status: "Traité", compteRendu: "Échographie obstétricale : fœtus unique en présentation céphalique active. Score biophysique 8/8. Liquide amniotique normal. Terme estimé à 35 semaines de gestation.", dateDemande: "2026-05-25" },
  { id: "img-502", patientId: "MS-2026-0045", patientNom: "Amadou Diarra", typeImagerie: "Radiologie", medecinPrescripteur: "Dr. Sangaré", status: "En attente", dateDemande: "2026-05-26" }
];

export const INITIAL_STOCK: StockItem[] = [
  { id: "ST-001", designation: "Artemether-Lumefantrine 80/480mg (Coartem)", categorie: "Médicament", quantite: 150, seuilAlerte: 20, numeroLot: "AL202601", datePeremption: "2027-11-20", fournisseur: "Pharmacie Populaire du Mali (PPM)" },
  { id: "ST-002", designation: "Paracétamol Injectable 1g / 100ml", categorie: "Médicament", quantite: 85, seuilAlerte: 15, numeroLot: "PC202511", datePeremption: "2026-06-30", fournisseur: "Labo Sanofi Mali" }, // Proche péremption!
  { id: "ST-003", designation: "Amlodipine 5mg Comprimé", categorie: "Médicament", quantite: 12, seuilAlerte: 30, numeroLot: "AM202604", datePeremption: "2028-04-12", fournisseur: "PharmaClic Mali" }, // Rupture imminente!
  { id: "ST-004", designation: "Gants Nitrile Non Stériles (Boîte de 100)", categorie: "Consommable", quantite: 400, seuilAlerte: 50, numeroLot: "G202509", datePeremption: "2029-09-01", fournisseur: "PPM" },
  { id: "ST-005", designation: "TDR Paludisme Falciparum (Pack de 25)", categorie: "Réactif", quantite: 8, seuilAlerte: 10, numeroLot: "TDR912", datePeremption: "2026-12-15", fournisseur: "PPM" }
];

export const INITIAL_INVOICES: Invoice[] = [
  { id: "FAC-912", patientId: "MS-2026-0045", patientNom: "Amadou Diarra", designation: "Consultation Généraliste + ECG", montantTotal: 15000, montantAssurance: 12000, montantPatiente: 3000, statut: "Payé", modePaiement: "Orange Money", dateEmission: "2026-05-26", datePaiement: "2026-05-26", caissier: "Cms. Maïga" },
  { id: "FAC-913", patientId: "MS-2026-0047", patientNom: "Ousmane Coulibaly", designation: "Urgence Triage + Traitement CTA", montantTotal: 25000, montantAssurance: 17500, montantPatiente: 7500, statut: "Payé", modePaiement: "Wave", dateEmission: "2026-05-26", datePaiement: "2026-05-26", caissier: "Cms. Maïga" },
  { id: "FAC-914", patientId: "MS-2026-0048", patientNom: "Mariam Keïta", designation: "Échographie Obstétricale + Hospitalisation 1 Nuit", montantTotal: 65000, montantAssurance: 32500, montantPatiente: 32500, statut: "Impayé", dateEmission: "2026-05-25" }
];

export const INITIAL_PRESENCE: StaffPresence[] = [
  { id: "p-01", staffId: "doc-1", nomPrenom: "Dr. Sangaré", role: "Médecin", date: "2026-05-26", heureArrivee: "07:45", statut: "Présent" },
  { id: "p-02", staffId: "caissier-1", nomPrenom: "Cms. Maïga", role: "Caissier", date: "2026-05-26", heureArrivee: "07:55", statut: "Présent" },
  { id: "p-03", staffId: "nurse-1", nomPrenom: "Inf. Coulibaly", role: "Infirmier", date: "2026-05-26", heureArrivee: "08:15", statut: "Retard" },
  { id: "p-04", staffId: "lab-1", nomPrenom: "Lab. Tangara", role: "Laborantin", date: "2026-05-26", heureArrivee: "07:50", statut: "Présent" }
];

export const INITIAL_MAILS: MailRecord[] = [
  { id: "mail-01", type: "Entrant", numeroCourrier: "COU-2026-0012", expediteurDestinataire: "Direction Nationale de la Santé des Cliniques du Mali", objet: "Directives de lutte contre le paludisme à transmission saisonnière", dateReceptionEnvoi: "2026-05-22", serviceAffecte: "Direction administrative", statutTraitement: "Traité" },
  { id: "mail-02", type: "Sortant", numeroCourrier: "COU-2026-0013", expediteurDestinataire: "INPS Bamako", objet: "Bilan trimestriel des prises en charge d'assurance", dateReceptionEnvoi: "2026-05-25", serviceAffecte: "Comptabilité", statutTraitement: "En attente" }
];

export const INITIAL_TRIAGE: TriageRecord[] = [
  { id: "trg-01", patientId: "MS-2026-0047", patientNom: "Ousmane Coulibaly", couleur: "Orange", plaintePrincipale: "Fièvre 39.8, vomissements, léthargie", tensionArterielle: "100/60", temperature: 39.8, heureArrivee: "08:05", statut: "En soins" },
  { id: "trg-02", patientId: "MS-2026-0046", patientNom: "Fatoumata Traoré", couleur: "Vert", plaintePrincipale: "Prurit cutané et rash léger", tensionArterielle: "115/75", temperature: 37.1, heureArrivee: "08:30", statut: "En attente" }
];

export const HOSPITAL_STAFF_ACCOUNTS: UserAccount[] = [
  { id: "user-admin", name: "Sidi Coulibaly (SysAdmin)", role: "Administrateur Système", isActive: true },
  { id: "user-dr-sangare", name: "Dr. Amadou Sangaré", role: "Médecin", isActive: true },
  { id: "user-inf-fatoumata", name: "Infirmier(e) Fatoumata Maïga", role: "Infirmier", isActive: true },
  { id: "user-sage-fanta", name: "Sage-femme Fanta Diallo", role: "Sage-femme", isActive: true },
  { id: "user-lab-tangara", name: "Laborantin Amara Tangara", role: "Laborantin", isActive: true },
  { id: "user-rx-diarra", name: "Radiologue Dr. Diarra", role: "Radiologue", isActive: true },
  { id: "user-rx-pharmacien", name: "Pharmacienne Aminata", role: "Pharmacien", isActive: true },
  { id: "user-recep-ouattara", name: "Réceptionniste Ouattara", role: "Réceptionniste", isActive: true },
  { id: "user-caiss-maiga", name: "Caissier Ibrahim Maïga", role: "Caissier", isActive: true },
  { id: "user-dg-dr-traore", name: "DG Dr. Moussa Traoré", role: "DG", isActive: true }
];

// Offline Queue manager helper using LocalStorage to emulate IndexedDB/Workbox
export function loadFromLocal<T>(key: string, backup: T[]): T[] {
  const data = localStorage.getItem(`medishahel_v2_${key}`);
  if (!data) {
    localStorage.setItem(`medishahel_v2_${key}`, JSON.stringify(backup));
    return backup;
  }
  return JSON.parse(data);
}

export function saveToLocal<T>(key: string, data: T[]): void {
  localStorage.setItem(`medishahel_v2_${key}`, JSON.stringify(data));
}

export interface OfflineQueueItem {
  type: "PATIENT" | "RDV" | "REC" | "TRIAGE" | "INVOICE";
  action: "CREATE" | "UPDATE";
  payload: any;
  timestamp: string;
}

export function getOfflineQueue(): OfflineQueueItem[] {
  const data = localStorage.getItem("medishahel_v2_offline_queue");
  return data ? JSON.parse(data) : [];
}

export function addToOfflineQueue(item: OfflineQueueItem): void {
  const current = getOfflineQueue();
  current.push(item);
  localStorage.setItem("medishahel_v2_offline_queue", JSON.stringify(current));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem("medishahel_v2_offline_queue");
}
