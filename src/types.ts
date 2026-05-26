export type UserRole =
  | "Médecin"
  | "Infirmier"
  | "Sage-femme"
  | "Aide-soignant"
  | "Laborantin"
  | "Radiologue"
  | "Pharmacien"
  | "Réceptionniste"
  | "Caissier"
  | "DG"
  | "Administrateur Système";

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  avatarUrl?: string;
}

export interface ClinicBranding {
  name: string;
  slogan: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  activeModules: Record<string, boolean>;
}

export interface Patient {
  id: string; // unique (e.g., MS-2026-0045)
  nom: string;
  prenom: string;
  sexe: "M" | "F";
  dateNaissance: string;
  telephone: string;
  adresse: string;
  profession: string;
  groupeSanguin: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  allergies: string;
  assurance: string; // ex: CANAM (70%), INPS, Aucun
  photoPlaceholderCode?: string; // short prefix fallback
  createdAt: string;
  photoUrl?: string;
  contactUrgenceNom?: string;
  contactUrgenceTel?: string;
  isArchive?: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientNom: string;
  medecin: string; // target professional
  date: string;
  heure: string;
  salle: string;
  statut: "Confirmé" | "En attente" | "Reporté" | "Terminé";
  notes?: string;
  createdAt: string;
}

export interface MedicalRecord {
  id: string; // e.g., consult_1
  patientId: string;
  date: string;
  motif: string;
  diagnostic: string; // summary text
  codeCIM10: string; // CIM-10 classification code
  prescription: string; // raw medication lines
  examensDemandes: string[]; // references
  certificatDuree?: number; // Repos médical en jours
  notesCliniques: string;
  medecinSignature: string;
  piecesJointes?: string[];
  createdAt: string;
}

export interface BedAllocation {
  id: string; // e.g., Lit-101
  chambre: string; // e.g., Chambre A
  service: string; // Maternité, Urgences, Médecine Générale
  patientId?: string;
  patientNom?: string;
  statut: "Disponible" | "Occupé" | "Maintenance";
  temperature?: number;
  frequenceCardiaque?: number;
  soinsInfirmiersLogs?: string[];
}

export interface LabTest {
  id: string;
  patientId: string;
  patientNom: string;
  typeExamen: "Hématologie" | "Biochimie" | "Sérologie" | "Bactériologie" | "Parasitologie";
  nomAnalyse: string; // e.g. "Goutte Épaisse (GE)", "NFS", "Glycémie"
  valeurReference: string;
  resultatObtenu?: string;
  dateDemande: string;
  dateValidation?: string;
  biologisteValidateur?: string;
  statut: "Demandé" | "Validé" | "Urgent";
  alertCritique?: boolean;
}

export interface MedicalImage {
  id: string;
  patientId: string;
  patientNom: string;
  typeImagerie: "Radiologie" | "Scanner" | "IRM" | "Échographie";
  medecinPrescripteur: string;
  status: "En attente" | "Traité";
  imageSimulatedUrl?: string;
  compteRendu?: string;
  dateDemande: string;
}

export interface StockItem {
  id: string;
  designation: string;
  categorie: string; // "Médicament", "Consommable", "Réactif"
  quantite: number;
  seuilAlerte: number;
  numeroLot: string;
  datePeremption: string;
  fournisseur: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientNom: string;
  designation: string;
  montantTotal: number;
  montantAssurance: number; // calculated according to CANAM, etc.
  montantPatiente: number; // remaining to pay
  statut: "Payé" | "Impayé" | "Avoir";
  modePaiement?: "Espèces" | "Orange Money" | "Wave" | "Moov Money" | "Carte bancaire";
  dateEmission: string;
  datePaiement?: string;
  caissier?: string;
  isAvoir?: boolean;
}

export interface StaffPresence {
  id: string;
  staffId: string;
  nomPrenom: string;
  role: string;
  date: string;
  heureArrivee: string;
  heureDepart?: string;
  statut: "Présent" | "Retard" | "Absent" | "Justifié";
  justification?: string;
}

export interface MailRecord {
  id: string;
  type: "Entrant" | "Sortant";
  numeroCourrier: string; // Auto format: COU-2026-xxxx
  expediteurDestinataire: string;
  objet: string;
  dateReceptionEnvoi: string;
  serviceAffecte: string;
  statutTraitement: "En attente" | "Traité" | "Archivé";
}

export interface TriageRecord {
  id: string;
  patientId: string;
  patientNom: string;
  couleur: "Rouge" | "Orange" | "Jaune" | "Vert"; // Rouge -> immédiat, Orange -> très urgent, Jaune -> urgent, Vert -> non urgent
  plaintePrincipale: string;
  tensionArterielle?: string;
  frequenceCardiaque?: number;
  temperature?: number;
  heureArrivee: string;
  statut: "En attente" | "En soins" | "Libéré";
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ip: string;
}
