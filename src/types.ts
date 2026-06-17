export type Role = "ADMIN" | "DOCTOR" | "NURSE" | "CASHIER" | "PHARMACIST" | "LAB_TECH" | "HR" | "MEDECIN_GENERAL_CHIEF" | "STAGIAIRE" | "AIDE_SOIGNANT" | "CAISSIER_PHARMACIEN" | "GESTIONNAIRE_STOCK" | "PROMOTEUR" | "DG";

export type HospitalizationStatus = "ADMITTED" | "DISCHARGED";

export type TransactionStatus = "PAID" | "UNPAID" | "PARTIAL";

export type TransactionType = "INVOICE" | "PAYMENT";

export type LabStatus = "PENDING" | "COMPLETED";

export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";

export type PayrollStatus = "PAID" | "PENDING";

export type AppointmentStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Clinic {
  id: string;
  name: string;
  logoUrl?: string | null;
  address?: string | null;
  currency: string;
  themeColor: string;
  slogan?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  licenseNumber?: string | null;
  rccm?: string | null;
  ifuNif?: string | null;
  digitalStamp?: string | null;
  instSignature?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  clinicId: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  firstName?: string;
  lastName?: string;
  login?: string;
  profession?: string;
  contractType?: string;
  phone?: string;
  department?: string;
  suspendedUntil?: string;
  lastLoginAt?: string;
  allowedModules?: string[];
  permissions?: string[];
  matricule?: string;
  gender?: string;
  nina?: string;
  hireDate?: string;
  dob?: string;
  address?: string;
  supervisorId?: string;
  signaturePad?: string;
  sealText?: string;
  ordNum?: string;
  roleHistory?: Array<{
    changedBy: string;
    changedByName: string;
    action: string;
    oldVal: string;
    newVal: string;
    timestamp: string;
  }>;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  phone?: string | null;
  email?: string | null;
  bloodType?: string | null;
  allergies?: string | null;
  address?: string | null;
  ethnie: string;
  nationalite: string;
  maritalStatus?: string | null;
  profession?: string | null;
  language?: string | null;
  commune?: string | null;
  quartier?: string | null;
  emergencyContact?: string | null;
  nina?: string | null;
  amo?: string | null;
  inps?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  symptoms: string;
  diagnosis: string;
  prescription: string;
  notes?: string | null;
  date: string;
  createdAt?: string;
}

export interface Hospitalization {
  id: string;
  patientId: string;
  bedNumber: string;
  roomNumber: string;
  admissionDate: string;
  dischargeDate?: string | null;
  reason: string;
  status: HospitalizationStatus;
  notes?: string | null;
  roomId?: string;
  bedId?: string;
  roomType?: string;
  bedType?: string;
  roomPrice?: number;
  bedPrice?: number;
  transfers?: any[];
}

export interface Transaction {
  id: string;
  patientId: string;
  type: TransactionType;
  description: string;
  amount: number;
  status: TransactionStatus;
  cashierId: string;
  cashierName: string;
  date: string;
  paymentMethod: string;
  category?: string;
  items?: Array<{ name: string; quantity: number; price: number; }>;
  receiptNumber?: string;
  createdAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  threshold: number;
  price: number;
  expiryDate?: string | null;
  status: string;
  supplier?: string | null;
  location?: string | null;
  updatedAt?: string;
}

export interface LabTest {
  id: string;
  patientId: string;
  testName: string;
  category: string;
  status: LabStatus;
  results?: string | null;
  requestedBy: string;
  performedBy?: string | null;
  date: string;
}

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  status: AttendanceStatus;
  reason?: string | null;
}

export interface Payroll {
  id: string;
  userId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: PayrollStatus;
  payDate?: string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  ribIban?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  notes?: string | null;
}

export interface Document {
  id: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  fileType: string;
  category: string;
  ownerId: string;
  ownerName: string;
  size: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: string;
  action: string;
  details: string;
  timestamp: string;
}
