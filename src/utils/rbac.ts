import { Role, User } from "../types";

export type GranularPermission =
  | "VIEW"
  | "CREATE"
  | "EDIT"
  | "DELETE"
  | "VALIDATE"
  | "APPROVE"
  | "EXPORT"
  | "PRINT"
  | "ASSIGN"
  | "CLOSE"
  | "ARCHIVE"
  | "ADMIN";

// Define standard modules
export const ALL_MODULES = [
  { id: "patients", label: "Gestion des Patients" },
  { id: "dme", label: "Dossier Médical (DME)" },
  { id: "hospitalization", label: "Hospitalisation" },
  { id: "dmg", label: "Médecine Générale (DMG)" },
  { id: "billing", label: "Facturation & Caisse" },
  { id: "pharmacy", label: "Pharmacie & Stock" },
  { id: "lab", label: "Laboratoire" },
  { id: "presences", label: "Gestion des Présences" },
  { id: "payroll", label: "Gestion de la Paie" },
  { id: "appointments", label: "Agenda & Rendez-vous" },
  { id: "documents", label: "Courriers & Archives (GECD)" },
  { id: "users", label: "Utilisateurs & Habilitations" },
  { id: "branding", label: "Paramètres Système" },
  { id: "audit", label: "Rapports & Statistiques (Audit)" }
];

export const ALL_PERMISSIONS: GranularPermission[] = [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "VALIDATE",
  "APPROVE",
  "EXPORT",
  "PRINT",
  "ASSIGN",
  "CLOSE",
  "ARCHIVE",
  "ADMIN"
];

// Default maps from roles to permissions arrays
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  ADMIN: ALL_MODULES.flatMap(m => ALL_PERMISSIONS.map(p => `${m.id}:${p}`)),
  
  DOCTOR: [
    "patients:VIEW", "patients:CREATE", "patients:EDIT", "patients:PRINT", "patients:EXPORT",
    "dme:VIEW", "dme:CREATE", "dme:EDIT", "dme:PRINT", "dme:VALIDATE",
    "dmg:VIEW", "dmg:CREATE", "dmg:EDIT", "dmg:VALIDATE",
    "appointments:VIEW", "appointments:CREATE", "appointments:EDIT", "appointments:CLOSE",
    "documents:VIEW", "documents:CREATE", "documents:EDIT", "documents:PRINT",
    "hospitalization:VIEW", "hospitalization:EDIT", "hospitalization:PRINT",
    "lab:VIEW", "lab:CREATE", "lab:PRINT",
    "presences:VIEW"
  ],

  MEDECIN_GENERAL_CHIEF: [
    "patients:VIEW", "patients:CREATE", "patients:EDIT", "patients:DELETE", "patients:PRINT", "patients:EXPORT", "patients:ARCHIVE",
    "dme:VIEW", "dme:CREATE", "dme:EDIT", "dme:VALIDATE", "dme:APPROVE", "dme:PRINT", "dme:EXPORT", "dme:ADMIN",
    "dmg:VIEW", "dmg:CREATE", "dmg:EDIT", "dmg:VALIDATE", "dmg:APPROVE", "dmg:PRINT",
    "appointments:VIEW", "appointments:CREATE", "appointments:EDIT", "appointments:CLOSE", "appointments:ASSIGN",
    "documents:VIEW", "documents:CREATE", "documents:EDIT", "documents:PRINT", "documents:EXPORT", "documents:ARCHIVE",
    "hospitalization:VIEW", "hospitalization:CREATE", "hospitalization:EDIT", "hospitalization:VALIDATE", "hospitalization:APPROVE", "hospitalization:ASSIGN", "hospitalization:PRINT",
    "lab:VIEW", "lab:CREATE", "lab:EDIT", "lab:VALIDATE", "lab:APPROVE", "lab:PRINT",
    "presences:VIEW",
    "audit:VIEW"
  ],

  NURSE: [
    "patients:VIEW", "patients:CREATE", "patients:EDIT",
    "dme:VIEW", "dme:PRINT",
    "hospitalization:VIEW", "hospitalization:CREATE", "hospitalization:EDIT", "hospitalization:ASSIGN", "hospitalization:PRINT",
    "lab:VIEW",
    "appointments:VIEW", "appointments:CREATE",
    "documents:VIEW", "documents:CREATE",
    "presences:VIEW"
  ],

  CASHIER: [
    "patients:VIEW",
    "billing:VIEW", "billing:CREATE", "billing:EDIT", "billing:PRINT", "billing:VALIDATE", "billing:CLOSE", "billing:EXPORT",
    "appointments:VIEW",
    "presences:VIEW"
  ],

  PHARMACIST: [
    "patients:VIEW",
    "pharmacy:VIEW", "pharmacy:CREATE", "pharmacy:EDIT", "pharmacy:VALIDATE", "pharmacy:PRINT", "pharmacy:CLOSE", "pharmacy:EXPORT", "pharmacy:ARCHIVE",
    "presences:VIEW"
  ],

  LAB_TECH: [
    "patients:VIEW",
    "lab:VIEW", "lab:CREATE", "lab:EDIT", "lab:VALIDATE", "lab:PRINT", "lab:EXPORT",
    "presences:VIEW"
  ],

  HR: [
    "presences:VIEW", "presences:CREATE", "presences:EDIT", "presences:VALIDATE", "presences:APPROVE", "presences:EXPORT",
    "payroll:VIEW", "payroll:CREATE", "payroll:EDIT", "payroll:VALIDATE", "payroll:APPROVE", "payroll:PRINT", "payroll:EXPORT",
    "documents:VIEW"
  ],

  STAGIAIRE: [
    "patients:VIEW",
    "dme:VIEW",
    "appointments:VIEW"
  ],

  AIDE_SOIGNANT: [
    "patients:VIEW",
    "dme:VIEW",
    "hospitalization:VIEW"
  ],

  CAISSIER_PHARMACIEN: [
    "patients:VIEW",
    "pharmacy:VIEW", "pharmacy:CREATE", "pharmacy:PRINT"
  ],

  GESTIONNAIRE_STOCK: [
    "patients:VIEW",
    "pharmacy:VIEW", "pharmacy:CREATE", "pharmacy:EDIT", "pharmacy:VALIDATE", "pharmacy:PRINT"
  ]
};

// Check if a user has a specific granular permission for a module
export function userHasPermission(
  user: (User & { permissions?: string[] }) | null,
  moduleId: string,
  permission: GranularPermission
): boolean {
  if (!user) return false;

  // Level 1: Check if module is allowed globally (except for ADMIN)
  if (user.role !== "ADMIN") {
    const allowed = user.allowedModules || [];
    if (!allowed.includes(moduleId)) {
      return false;
    }
  } else {
    // ADMIN has absolute power
    return true;
  }

  // Find permissions array on user object
  const userPerms = user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role] || [];

  // Check if they have the direct matching permission, or 'ADMIN' permission inside the module, or global '*'
  return (
    userPerms.includes(`${moduleId}:${permission}`) ||
    userPerms.includes(`${moduleId}:ADMIN`) ||
    userPerms.includes(`*:ADMIN`)
  );
}

// Level 3: Department Data-Level Restrictions
// Checks if the user is authorized to view or access data belonging to a certain department.
// If user.department matches, it's allowed.
// Also, some users have global views (e.g. Direction department, ADMIN role, or explicit dérogation in custom permissions).
export function userHasDepartmentAccess(
  user: User | null,
  itemDepartment?: string
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;

  // Users from Direction or Diagnostic/Global roles have broad visibility
  if (user.department === "Direction") return true;
  if (user.role === "MEDECIN_GENERAL_CHIEF") return true;

  if (!itemDepartment) return true; // generic/unclassified data is visible

  // Normal rule: Match exact department
  return user.department === itemDepartment;
}

// Helper to translate department system codes to nice labels
export const DEPARTMENT_LABELS: Record<string, string> = {
  "Médecine Générale": "Médecine Générale",
  "Laboratoire": "Laboratoire",
  "Pharmacie": "Pharmacie",
  "Radiologie": "Radiologie",
  "Hospitalisation": "Hospitalisation",
  "Urgences": "Urgences",
  "RH": "RH",
  "Comptabilité": "Comptabilité",
  "Caisse": "Caisse",
  "Direction": "Direction"
};
