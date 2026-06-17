import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

let prisma: PrismaClient | null = null;
let useBackupMemory = false;

// Safe lazy initialization of Prisma
function getPrisma(): PrismaClient {
  if (prisma) return prisma;
  
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("postgres:5432")) {
    console.warn("No active custom PostgreSQL URL configured, or hostname 'postgres' represents dev environment default. Preparing live fallback mode.");
    useBackupMemory = true;
    prisma = new PrismaClient(); // instantiate anyway for types, code will bypass calls
    return prisma;
  }

  try {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
    return prisma;
  } catch (err) {
    console.error("Prisma loading failed, enabling in-memory data layer.", err);
    useBackupMemory = true;
    prisma = new PrismaClient();
    return prisma;
  }
}

// Memory database mock stores pre-populated with beautiful clinic data
export const memoryDb = {
  clinics: [
    {
      id: "clinic-1",
      name: "MédiSahel Clinique Bamako V2",
      logoUrl: "Bamako Central",
      address: "Hamdallaye ACI 2000, Bamako, Mali",
      currency: "FCFA",
      themeColor: "#1e3a5f", // #1E3A5F
      slogan: "Votre santé, notre engagement au quotidien",
      city: "Bamako",
      country: "Mali",
      phone: "+223 20 22 14 67",
      whatsapp: "+223 73 65 14 67",
      email: "contact@medisahel.ml",
      website: "www.medisahel.ml",
      licenseNumber: "AGR-2024-MS08-BKO",
      rccm: "MA-BKO-2024-B-1240",
      ifuNif: "NIF-084210457-H",
      digitalStamp: "[CACHET NUMÉRIQUE MÉDISAHEL CLINIQUE]",
      instSignature: "Pour la Direction Médicale, le Médecin Chef",
      faviconUrl: "💉",
      secondaryColor: "#2E8B57",
      accentColor: "#E67E22",
      bgColor: "#F5F5F5",
      textColor: "#333333",
      clinicalStamp: "",
      pdfHeader: "MÉDISAHEL CLINIQUE BAMAKO V2\nUrologie - Chirurgie - Consultations d'Urgence",
      pdfFooter: "Hamdallaye ACI 2000, Bamako – Tél : +223 73 65 14 67 – Slogan: Votre santé, notre engagement",
      timezone: "Afrique/Bamako",
      dateFormat: "DD/MM/YYYY",
      timeFormat: "HH:MM",
      mainLanguage: "Français",
      secondLanguage: "Bambara",
      departmentsList: JSON.stringify(["Médecine Générale", "Chirurgie", "Pédiatrie", "Maternité / CPN", "Urgences"]),
      servicesList: JSON.stringify(["Médecine Interne", "Urgences & Triage", "Gynécologie", "Pédiatrie", "Chirurgie Générale"]),
      ethniesList: JSON.stringify(["Bambara", "Peulh", "Soninké", "Malinké", "Sénoufo", "Dogon", "Songhaï", "Bobo", "Bozo", "Minianka", "Tamasheq", "Arabe", "Kassonké", "Touareg", "Maure", "Somono", "Jakhanké", "Samogho", "Sorko"]),
      nationalitiesList: JSON.stringify(["Malienne", "Sénégalaise", "Ivoirienne", "Burkinabé", "Guinéenne", "Mauritanienne", "Algérienne", "Française"]),
      analysisTypesList: JSON.stringify(["NFS (Numération Formule Sanguine)", "Goutte Épaisse & TDR", "Glycémie à jeun", "ECBU (Urine)", "Bilan rénal (Urée/Créatinine)", "Widal et Félix", "Uricémie", "Cholestérol total"]),
      medicamentsList: JSON.stringify(["Coartem 20/120mg", "Amoxicilline 1g Sandoz", "Paracétamol 1g Biogaran", "Spasfon 80mg Lyoc", "Insuline Lantus Solostar", "Ibuprofène 400mg", "Ciprofloxacine 500mg"]),
      suppliersList: JSON.stringify(["Laborex Mali", "Mali Pharma SA", "Ubipharm Mali", "Pharmacie Impériale Bamako"]),
      delayReasonsList: JSON.stringify(["Embouteillages pont de Bamako", "Panne de véhicule / Moto", "Problème familial d'urgence", "Consultation de nuit imprévue", "Pluie diluvienne"])
    },
    {
      id: "clinic-2",
      name: "MédiSahel Centre Médical Ségou",
      logoUrl: "Ségou Fleuve",
      address: "Quartier Administratif, Ségou, Mali",
      currency: "FCFA",
      themeColor: "#1e3a8a", // blue-900
      slogan: "Proximité, Rigueur et Excellence Clinique",
      city: "Ségou",
      country: "Mali",
      phone: "+223 21 32 14 68",
      whatsapp: "+223 73 65 14 67",
      email: "segou@medisahel.ml",
      website: "www.medisahel.ml/segou",
      licenseNumber: "AGR-2024-MS09-SEG",
      rccm: "MA-SEG-2024-B-1241",
      ifuNif: "NIF-084210458-I",
      digitalStamp: "[CACHET NUMÉRIQUE MÉDISAHEL SÉGOU]",
      instSignature: "Pour l'Administration, le Médecin Responsable"
    },
    {
      id: "clinic-3",
      name: "MédiSahel Polyclinique Mopti",
      logoUrl: "Mopti Falaise",
      address: "Rond-point de l'Indépendance, Mopti, Mali",
      currency: "FCFA",
      themeColor: "#e11d48", // rose-600
      slogan: "Urgence 24h/24 & Soins Spécifiques Référencés",
      city: "Mopti",
      country: "Mali",
      phone: "+223 21 42 14 69",
      whatsapp: "+223 73 65 14 67",
      email: "mopti@medisahel.ml",
      website: "www.medisahel.ml/mopti",
      licenseNumber: "AGR-2024-MS10-MOP",
      rccm: "MA-MOP-2024-B-1242",
      ifuNif: "NIF-084210459-J",
      digitalStamp: "[CACHET NUMÉRIQUE POLYCLINIQUE MOPTI]",
      instSignature: "Le Promoteur Clinique & Directeur des Urgences"
    }
  ] as any[],

  roles: [
    { id: "ADMIN", label: "Administrateur Système IT", code: "ADMIN", order: 1 },
    { id: "MEDECIN_GENERAL_CHIEF", label: "Médecin Chef Département", code: "MEDECIN_GENERAL_CHIEF", order: 2 },
    { id: "DOCTOR", label: "Médecin de Spécialité / Référent", code: "DOCTOR", order: 3 },
    { id: "NURSE", label: "Personnel Infirmier", code: "NURSE", order: 4 },
    { id: "PHARMACIST", label: "Pharmacien Hospitalier", code: "PHARMACIST", order: 5 },
    { id: "LAB_TECH", label: "Technicien Supérieur Biologie", code: "LAB_TECH", order: 6 },
    { id: "CASHIER", label: "Caissier Principal", code: "CASHIER", order: 7 },
    { id: "HR", label: "Responsable RH", code: "HR", order: 8 },
    { id: "STAGIAIRE", label: "Stagiaire Médical", code: "STAGIAIRE", order: 9 },
    { id: "AIDE_SOIGNANT", label: "Aide-Soignant d'Urgence", code: "AIDE_SOIGNANT", order: 10 },
    { id: "CAISSIER_PHARMACIEN", label: "Caissier-Pharmacien d'Officine", code: "CAISSIER_PHARMACIEN", order: 11 },
    { id: "GESTIONNAIRE_STOCK", label: "Gestionnaire de Stockage", code: "GESTIONNAIRE_STOCK", order: 12 }
  ] as any[],

  users: [
    {
      id: "user-admin",
      email: "admin@medisahel.ml",
      passwordHash: bcrypt.hashSync("admin123", 10),
      name: "Adama SANGARÉ",
      firstName: "Adama",
      lastName: "SANGARÉ",
      login: "admin",
      role: "ADMIN",
      profession: "Directrice d'Établissement",
      contractType: "CDI",
      department: "Direction Générale",
      phone: "+223 73 65 14 67",
      mustChangePassword: false, // ADMIN never needs to change password
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["dashboard", "patients", "dme", "hospitalization", "dmg", "billing", "pharmacy_sales", "pharmacy_stock", "lab", "presences", "payroll", "appointments", "documents", "clinical-admin", "users", "branding", "audit", "emailing"],
      permissions: ["*:ADMIN"],
      roleHistory: []
    },
    {
      id: "user-doctor",
      email: "doctor@medisahel.ml",
      passwordHash: bcrypt.hashSync("doctor123", 10),
      name: "Dr. Ibrahim TOURÉ",
      firstName: "Ibrahim",
      lastName: "TOURÉ",
      login: "doctor",
      role: "DOCTOR",
      profession: "Médecin Généraliste",
      contractType: "CDI",
      department: "Médecine Générale",
      phone: "+223 76 54 32 10",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "dme", "hospitalization", "lab", "dmg", "appointments"],
      roleHistory: []
    },
    {
      id: "user-chief",
      email: "chief@medisahel.ml",
      passwordHash: bcrypt.hashSync("chief123", 10),
      name: "Dr. Alou DIALLO",
      firstName: "Alou",
      lastName: "DIALLO",
      login: "chief",
      role: "MEDECIN_GENERAL_CHIEF",
      profession: "Médecin Chef",
      contractType: "CDI",
      department: "Direction Générale",
      phone: "+223 75 12 34 56",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "dme", "hospitalization", "lab", "dmg", "appointments"],
      roleHistory: []
    },
    {
      id: "user-nurse",
      email: "nurse@medisahel.ml",
      passwordHash: bcrypt.hashSync("nurse123", 10),
      name: "Fatoumata DIARRA",
      firstName: "Fatoumata",
      lastName: "DIARRA",
      login: "nurse",
      role: "NURSE",
      profession: "Infirmière Superviseuse",
      contractType: "CDI",
      department: "Hospitalisation",
      phone: "+223 66 77 88 99",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "hospitalization", "dmg", "appointments"],
      roleHistory: []
    },
    {
      id: "user-cashier",
      email: "cashier@medisahel.ml",
      passwordHash: bcrypt.hashSync("cashier123", 10),
      name: "Ousmane KEITA",
      firstName: "Ousmane",
      lastName: "KEITA",
      login: "cashier",
      role: "CASHIER",
      profession: "Guichetier Cassa de Paiement",
      contractType: "CDD",
      department: "Facturation & Caisse",
      phone: "+223 71 22 33 44",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["dashboard", "patients", "billing", "pharmacy_sales"],
      roleHistory: []
    },
    {
      id: "user-pharmacist",
      email: "pharmacist@medisahel.ml",
      passwordHash: bcrypt.hashSync("pharmacist123", 10),
      name: "Aminata DEMBÉLÉ",
      firstName: "Aminata",
      lastName: "DEMBÉLÉ",
      login: "pharmacist",
      role: "PHARMACIST",
      profession: "Pharmacienne Hospitalière",
      contractType: "CDI",
      department: "Pharmacie",
      phone: "+223 65 44 33 22",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["dashboard", "pharmacy_stock"],
      roleHistory: []
    },
    {
      id: "user-lab",
      email: "labtech@medisahel.ml",
      passwordHash: bcrypt.hashSync("labtech123", 10),
      name: "Dr. Moussa COULIBALY",
      firstName: "Moussa",
      lastName: "COULIBALY",
      login: "labtech",
      role: "LAB_TECH",
      profession: "Technicien d'Analyses Biologiques",
      contractType: "CDI",
      department: "Laboratoire",
      phone: "+223 74 11 22 33",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["lab"],
      roleHistory: []
    },
    {
      id: "user-hr",
      email: "hr@medisahel.ml",
      passwordHash: bcrypt.hashSync("hr123", 10),
      name: "Awa DIALLO",
      firstName: "Awa",
      lastName: "DIALLO",
      login: "hr",
      role: "HR",
      profession: "Gestionnaire Ressources Humaines",
      contractType: "CDI",
      department: "Ressources Humaines",
      phone: "+223 77 11 99 22",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["presences", "payroll"],
      roleHistory: []
    },
    {
      id: "user-dr-sangare",
      email: "dr_sangare@medisahel.ml",
      passwordHash: bcrypt.hashSync("DoctorPassword2026!", 10),
      name: "Dr. Amadou SANGARÉ",
      firstName: "Amadou",
      lastName: "SANGARÉ",
      login: "dr_sangare",
      role: "DOCTOR",
      profession: "Médecin Généraliste",
      contractType: "CDI",
      department: "Médecine Générale",
      phone: "+223 76 54 32 10",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "dme", "hospitalization", "lab", "dmg", "appointments"],
      roleHistory: []
    },
    {
      id: "user-infirmier-test",
      email: "infirmier_test@medisahel.ml",
      passwordHash: bcrypt.hashSync("InfirmierPassword2026!", 10),
      name: "Infirmier de Garde Test",
      firstName: "Infirmier",
      lastName: "TEST",
      login: "infirmier_test",
      role: "NURSE",
      profession: "Infirmier Qualifié",
      contractType: "CDD",
      department: "Hospitalisation",
      phone: "+223 66 77 88 02",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "hospitalization", "dmg", "appointments"],
      roleHistory: []
    },
    {
      id: "user-stagiaire-test",
      email: "stagiaire_test@medisahel.ml",
      passwordHash: bcrypt.hashSync("StagiairePassword2026!", 10),
      name: "Stagiaire Académique Test",
      firstName: "Stagiaire",
      lastName: "TEST",
      login: "stagiaire_test",
      role: "DOCTOR",
      profession: "Médecin Stagiaire",
      contractType: "Stage",
      department: "Médecine Générale",
      phone: "+223 65 44 33 03",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["patients", "dme", "dmg"],
      roleHistory: []
    },
    {
      id: "user-caissier-test",
      email: "caissier_test@medisahel.ml",
      passwordHash: bcrypt.hashSync("CaissierPassword2026!", 10),
      name: "Caissier Principal Test",
      firstName: "Caissier",
      lastName: "TEST",
      login: "caissier_test",
      role: "CASHIER",
      profession: "Agent de Caisse",
      contractType: "CDD",
      department: "Facturation & Caisse",
      phone: "+223 71 22 33 04",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE",
      allowedModules: ["dashboard", "patients", "billing", "pharmacy_sales"],
      roleHistory: []
    }
  ] as any[],

  patients: [
    {
      id: "patient-1",
      firstName: "Moussa",
      lastName: "DIARA",
      nationalId: "N-19900812-BKO",
      dateOfBirth: "1990-08-12",
      gender: "M",
      phone: "+223 76 54 32 10",
      email: "m.diarra@gmail.com",
      bloodType: "O+",
      allergies: "Pénicilline",
      address: "Niaréla, Bamako",
      ethnie: "Bambara",
      nationalite: "Malienne",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    },
    {
      id: "patient-2",
      firstName: "Mariam",
      lastName: "KONE",
      nationalId: "N-19950422-SEG",
      dateOfBirth: "1995-04-22",
      gender: "F",
      phone: "+223 66 77 88 99",
      email: "mariam.kone@live.fr",
      bloodType: "A-",
      allergies: "Aucune",
      address: "Ségou Coura, Ségou",
      ethnie: "Peul",
      nationalite: "Malienne",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    },
    {
      id: "patient-3",
      firstName: "Salif",
      lastName: "COULIBALY",
      nationalId: "N-19821130-MOP",
      dateOfBirth: "1982-11-30",
      gender: "M",
      phone: "+223 71 22 33 44",
      email: "salif.coul@yahoo.fr",
      bloodType: "B+",
      allergies: "Pollen, Sulfamides",
      address: "Medina Coura, Mopti",
      ethnie: "Dogon",
      nationalite: "Malienne",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    }
  ] as any[],

  medicalRecords: [
    {
      id: "record-1",
      patientId: "patient-1",
      doctorId: "user-doctor",
      doctorName: "Dr. Ibrahim TOURÉ",
      symptoms: "Fièvre persistante, maux de tête intenses, frissons",
      diagnosis: "Paludisme simple à Plasmodium falciparum",
      prescription: "Coartem (Artéméther/Luméfantrine) 20/120mg : 1 cp matin et soir pendant 3 jours. Paracétamol 1g : 1 cp toutes les 8h si fièvre.",
      notes: "Patient à revoir dans 48h si la fièvre ne tombe pas.",
      date: new Date().toISOString()
    },
    {
      id: "record-2",
      patientId: "patient-2",
      doctorId: "user-doctor",
      doctorName: "Dr. Ibrahim TOURÉ",
      symptoms: "Toux grasse, respiration sifflante, fièvre légère",
      diagnosis: "Bronchite aiguë",
      prescription: "Amoxicilline 1g : 1 cp toutes les 8h pendant 7 jours. Ambroxol sirop : 1 cuillère à soupe 3 fois par jour.",
      notes: "Bien hydrater et se reposer au chaud.",
      date: new Date().toISOString()
    }
  ] as any[],

  hospitalizations: [
    {
      id: "hosp-1",
      patientId: "patient-1",
      bedNumber: "Lit-101 (A)",
      roomNumber: "101",
      roomId: "room-101",
      bedId: "bed-101-A",
      roomType: "VIP",
      bedType: "VIP",
      roomPrice: 35000,
      bedPrice: 10000,
      admissionDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      dischargeDate: null,
      reason: "Crise de paludisme sévère avec déshydratation",
      status: "ADMITTED",
      notes: "Mise sous perfusion saline. Température à surveiller toutes les 2 heures."
    }
  ] as any[],

  rooms: [
    { id: "room-101", number: "101", type: "VIP", service: "Médecine Générale", floor: "1er étage", totalBeds: 1, status: "Occupée", allowedGender: "Mixte" },
    { id: "room-102", number: "102", type: "Climatisée", service: "Urgences", floor: "Rez-de-chaussée", totalBeds: 2, status: "Disponible", allowedGender: "Homme" },
    { id: "room-103", number: "103", type: "Classique", service: "Médecine Générale", floor: "1er étage", totalBeds: 2, status: "Disponible", allowedGender: "Mixte" },
    { id: "room-105", number: "105", type: "Classique", service: "Maternité / CPN", floor: "2ème étage", totalBeds: 2, status: "Disponible", allowedGender: "Femme" },
    { id: "room-106", number: "106", type: "Classique", service: "Urgences", floor: "Rez-de-chaussée", totalBeds: 1, status: "Maintenance", allowedGender: "Mixte" },
    { id: "room-108", number: "108", type: "Classique", service: "Pédiatrie", floor: "2ème étage", totalBeds: 2, status: "Disponible", allowedGender: "Mixte" },
    { id: "room-110", number: "110", type: "Climatisée", service: "Chirurgie", floor: "3ème étage", totalBeds: 1, status: "Disponible", allowedGender: "Mixte" }
  ] as any[],

  beds: [
    { id: "bed-101-A", number: "Lit-101 (A)", type: "VIP", roomId: "room-101", status: "Occupé", patientId: "patient-1", patientNom: "Moussa DIARA", dateAdmission: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    { id: "bed-102-A", number: "Lit-102 (A)", type: "Classique", roomId: "room-102", status: "Disponible" },
    { id: "bed-102-B", number: "Lit-102 (B)", type: "Handicapé", roomId: "room-102", status: "Disponible" },
    { id: "bed-103-A", number: "Lit-103 (A)", type: "Classique", roomId: "room-103", status: "Disponible" },
    { id: "bed-103-B", number: "Lit-103 (B)", type: "Classique", roomId: "room-103", status: "Disponible" },
    { id: "bed-105-A", number: "Lit-105 (A)", type: "Classique", roomId: "room-105", status: "Disponible" },
    { id: "bed-105-B", number: "Lit-105 (B)", type: "Classique", roomId: "room-105", status: "Disponible" },
    { id: "bed-106-A", number: "Lit-106 (A)", type: "Classique", roomId: "room-106", status: "Hors service" },
    { id: "bed-108-A", number: "Lit-108 (A)", type: "Classique", roomId: "room-108", status: "Disponible" },
    { id: "bed-108-B", number: "Lit-108 (B)", type: "Classique", roomId: "room-108", status: "Disponible" },
    { id: "bed-110-A", number: "Lit-110 (A)", type: "Classique", roomId: "room-110", status: "Disponible" }
  ] as any[],

  rates: {
    roomRates: {
      Classique: 0,
      Climatisée: 15000,
      VIP: 35000
    },
    bedRates: {
      Classique: 0,
      Handicapé: 5000,
      VIP: 10000
    }
  } as any,

  transferLogs: [] as any[],
  reservations: [] as any[],

  bedHistories: [
    {
      id: "bedhist-1",
      bedId: "bed-101-A",
      patientId: "patient-1",
      patientName: "Moussa DIARA",
      startDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      endDate: null,
      action: "ADMISSION",
      notes: "Admission initiale en chambre VIP"
    }
  ] as any[],

  transactions: [
    {
      id: "tx-1",
      patientId: "patient-1",
      type: "INVOICE",
      description: "Consultation Médecine Générale + Test TDR Paludisme",
      amount: 15000,
      status: "PAID",
      cashierId: "user-cashier",
      cashierName: "Ousmane KEITA",
      date: new Date(Date.now() - 3600 * 1000).toISOString(),
      paymentMethod: "CASH"
    },
    {
      id: "tx-2",
      patientId: "patient-2",
      type: "INVOICE",
      description: "Radiographie pulmonaire + Examen biologique NFS",
      amount: 25000,
      status: "UNPAID",
      cashierId: "user-cashier",
      cashierName: "Ousmane KEITA",
      date: new Date().toISOString(),
      paymentMethod: "INSURANCE"
    }
  ] as any[],

  inventoryItems: [
    {
      id: "inv-1",
      name: "Coartem 20/120mg (Artéméther/Luméfantrine)",
      sku: "SKU-COARTEM-1",
      category: "MEDICINE",
      quantity: 154,
      threshold: 30,
      price: 3500,
      expiryDate: "2027-12-31",
      status: "IN_STOCK",
      supplier: "Pharmacie Impériale Bamako",
      location: "Étagère A-3, Tiroir B"
    },
    {
      id: "inv-2",
      name: "Amoxicilline 1g Comprimés (Sandoz)",
      sku: "SKU-AMOX-1G",
      category: "MEDICINE",
      quantity: 21,
      threshold: 50,
      price: 2500,
      expiryDate: "2026-09-30",
      status: "IN_STOCK", // low stock soon!
      supplier: "Mali Pharma SA",
      location: "Étagère A-1, Tiroir A"
    },
    {
      id: "inv-3",
      name: "Gants de chirurgie Stériles (Boîte de 50)",
      sku: "SKU-SURG-GLV",
      category: "CONSUMABLE",
      quantity: 5,
      threshold: 10,
      price: 8500,
      expiryDate: "2029-01-01",
      status: "IN_STOCK",
      supplier: "Socomed Mali",
      location: "Étagère C-1"
    }
  ] as any[],

  labTests: [
    {
      id: "lab-1",
      patientId: "patient-1",
      testName: "Goutte Épaisse & Test de Diagnostic Rapide (TDR) Paludisme",
      category: "BLOOD",
      status: "COMPLETED",
      results: "POSITIF à Plasmodium falciparum. Densité parasitaire: 1250 / μL.",
      requestedBy: "Dr. Ibrahim TOURÉ",
      performedBy: "Dr. Moussa COULIBALY",
      date: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "lab-2",
      patientId: "patient-2",
      testName: "Examen Cytobactériologique des Urines (ECBU)",
      category: "URINE",
      status: "PENDING",
      results: null,
      requestedBy: "Dr. Ibrahim TOURÉ",
      performedBy: null,
      date: new Date().toISOString()
    }
  ] as any[],

  attendances: [
    {
      id: "att-1",
      userId: "user-doctor",
      date: new Date().toISOString().split("T")[0],
      checkIn: "07:52",
      checkOut: null,
      status: "PRESENT",
      reason: "Arrivée ponctuelle"
    },
    {
      id: "att-2",
      userId: "user-nurse",
      date: new Date().toISOString().split("T")[0],
      checkIn: "08:15", // Late (starts at 08:00)
      checkOut: null,
      status: "LATE",
      reason: "Embouteillages pont de Bamako"
    }
  ] as any[],

  payrolls: [
    {
      id: "pay-1",
      userId: "user-doctor",
      month: 5,
      year: 2026,
      baseSalary: 750000,
      bonuses: 50000,
      deductions: 20000,
      netSalary: 780000,
      status: "PAID",
      payDate: new Date(2026, 4, 30).toISOString()
    },
    {
      id: "pay-2",
      userId: "user-nurse",
      month: 5,
      year: 2026,
      baseSalary: 350000,
      bonuses: 15000,
      deductions: 10000,
      netSalary: 355000,
      status: "PENDING",
      payDate: null
    }
  ] as any[],

  appointments: [
    {
      id: "app-1",
      patientId: "patient-1",
      doctorId: "user-doctor",
      doctorName: "Dr. Ibrahim TOURÉ",
      date: new Date().toISOString().split("T")[0],
      time: "10:30",
      status: "CONFIRMED",
      notes: "Contrôle post-traitement paludisme prescrit hier."
    },
    {
      id: "app-2",
      patientId: "patient-3",
      doctorId: "user-doctor",
      doctorName: "Dr. Ibrahim TOURÉ",
      date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split("T")[0],
      time: "14:15",
      status: "CONFIRMED",
      notes: "Examen de routine cardiologie."
    }
  ] as any[],

  documents: [
    {
      id: "doc-1",
      title: "Rapport d'Activité Mensuel - Mai 2026",
      description: "Statistiques d'hospitalisation et d'approvisionnement en médicaments de la clinique.",
      fileUrl: "rapport_activite_mai_2026.pdf",
      fileType: "PDF",
      category: "ADMINISTRATIVE",
      ownerId: "user-admin",
      ownerName: "Adama SANGARÉ",
      size: "1.2 MB",
      createdAt: new Date().toISOString()
    },
    {
      id: "doc-2",
      title: "Fiche d'Admission Clinique - Moussa DIARRA",
      description: "Fiche d'enregistrement numérisée lors de l'admission en hospitalisation.",
      fileUrl: "fiche_admission_diarra.pdf",
      fileType: "PDF",
      category: "MEDICAL",
      ownerId: "user-nurse",
      ownerName: "Fatoumata DIARRA",
      size: "620 KB",
      createdAt: new Date().toISOString()
    }
  ] as any[],

  auditLogs: [
    {
      id: "audit-1",
      userId: "user-admin",
      userName: "Adama SANGARÉ",
      role: "ADMIN",
      action: "LOGIN",
      details: "Connexion réussie sur l'ERP MédiSahel Clinique Bamako V2.",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString()
    }
  ] as any[],

  receiptDispatches: [] as any[],

  dmeArchives: [
    {
      id: "arch-init-4",
      patientId: "patient-1",
      actionType: "constante",
      entityType: "constante",
      entityId: "c-101",
      content: "{\"values\":\"TA: 120/80, Pouls: 75, Temp: 38.9°C\",\"details\":\"Paramètres de constantes cliniques pris par le personnel soignant\"}",
      performedBy: "Infirmière Fatoumata D.",
      performedAt: "2026-06-16T09:38:00.000Z",
      ipAddress: "192.168.1.42",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/125.0.0.0"
    },
    {
      id: "arch-init-3",
      patientId: "patient-1",
      actionType: "examen",
      entityType: "analyse",
      entityId: "l-101",
      content: "{\"results\":\"NFS + Goutte épaisse\",\"emergency\":true,\"category\":\"BLOOD\"}",
      performedBy: "Dr Sangaré",
      performedAt: "2026-06-16T09:36:00.000Z",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/15.6.1"
    },
    {
      id: "arch-init-2",
      patientId: "patient-1",
      actionType: "prescription",
      entityType: "ordonnance",
      entityId: "o-101",
      content: "{\"itemString\":\"Artéméther/Luméfantrine - 3 comprimés/jour - 3j\\nParacétamol 500 mg - 3x/j - 5j\",\"medications\":[\"Artéméther/Luméfantrine - 3 comprimés/jour - 3j\",\"Paracétamol 500 mg - 3x/j - 5j\"]}",
      performedBy: "Dr Sangaré",
      performedAt: "2026-06-16T09:35:00.000Z",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/15.6.1"
    },
    {
      id: "arch-init-1",
      patientId: "patient-1",
      actionType: "validation",
      entityType: "validation",
      entityId: "v-101",
      content: "{\"notes\":\"Consultation - Diagnostic : Paludisme simple (1F40)\",\"signature\":\"✅ Signé électroniquement\"}",
      performedBy: "Dr Sangaré",
      performedAt: "2026-06-16T09:32:00.000Z",
      ipAddress: "192.168.1.10",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/15.6.1"
    }
  ] as any[],

  pharmacyProducts: [
    {
      id: "ph-prod-1",
      codeInterne: "P001",
      codeBarre: "6181101820491",
      dci: "Artéméther / Luméfantrine",
      nomCommercial: "Coartem 20/120mg",
      forme: "Comprimé pelliculé",
      dosage: "20mg/120mg",
      category: "Anti-paludique",
      supplier: "Pharmacie Impériale Bamako",
      priceAchat: 1200,
      priceVente: 3500,
      stockMin: 30,
      stockMax: 500,
      imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80&auto=format&fit=crop&q=60"
    },
    {
      id: "ph-prod-2",
      codeInterne: "P002",
      codeBarre: "4011210080122",
      dci: "Amoxicilline",
      nomCommercial: "Amoxicilline 1g Sandoz",
      forme: "Comprimé dispersible",
      dosage: "1g",
      category: "Antibiotique",
      supplier: "Mali Pharma SA",
      priceAchat: 900,
      priceVente: 2500,
      stockMin: 50,
      stockMax: 1000,
      imageUrl: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=80&auto=format&fit=crop&q=60"
    },
    {
      id: "ph-prod-3",
      codeInterne: "P003",
      codeBarre: "3400938385226",
      dci: "Paracétamol",
      nomCommercial: "Paracétamol 1g Biogaran",
      forme: "Comprimé effervescent",
      dosage: "1g",
      category: "Analgésique / Antipyrétique",
      supplier: "Mali Pharma SA",
      priceAchat: 400,
      priceVente: 1000,
      stockMin: 100,
      stockMax: 2000,
      imageUrl: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=80&auto=format&fit=crop&q=60"
    },
    {
      id: "ph-prod-4",
      codeInterne: "P004",
      codeBarre: "3400930012480",
      dci: "Phloroglucinol",
      nomCommercial: "Spasfon 80mg Lyoc",
      forme: "Lyophilisat oral",
      dosage: "80mg",
      category: "Antispasmodique",
      supplier: "Laborex Mali",
      priceAchat: 1100,
      priceVente: 2800,
      stockMin: 20,
      stockMax: 400,
      imageUrl: ""
    },
    {
      id: "ph-prod-5",
      codeInterne: "P005",
      codeBarre: "3400935914610",
      dci: "Insuline Glargine",
      nomCommercial: "Insuline Lantus Solostar",
      forme: "Stylo pré-rempli injecteur (3ml)",
      dosage: "100 U/ml",
      category: "Antidiabétique",
      supplier: "Laborex Mali",
      priceAchat: 11000,
      priceVente: 22000,
      stockMin: 15,
      stockMax: 200,
      imageUrl: ""
    }
  ] as any[],

  pharmacyLots: [
    {
      id: "lot-1",
      productId: "ph-prod-1",
      lotNumber: "LOT26-COA01",
      dateFabrication: "2025-01-10",
      datePeremption: "2027-12-31",
      qtyRecue: 300,
      qtyRemainingDepot: 120,
      qtyRemainingOfficine: 54,
      supplier: "Pharmacie Impériale Bamako",
      priceAchat: 1200
    },
    {
      id: "lot-2",
      productId: "ph-prod-1",
      lotNumber: "LOT25-COA-SHORT",
      dateFabrication: "2024-05-15",
      datePeremption: "2026-08-15",
      qtyRecue: 100,
      qtyRemainingDepot: 20,
      qtyRemainingOfficine: 12,
      supplier: "Pharmacie Impériale Bamako",
      priceAchat: 1150
    },
    {
      id: "lot-3",
      productId: "ph-prod-2",
      lotNumber: "LOT25-AMX09",
      dateFabrication: "2024-10-01",
      datePeremption: "2026-09-30",
      qtyRecue: 200,
      qtyRemainingDepot: 70,
      qtyRemainingOfficine: 21,
      supplier: "Mali Pharma SA",
      priceAchat: 900
    },
    {
      id: "lot-4",
      productId: "ph-prod-3",
      lotNumber: "LOT25-PAR99",
      dateFabrication: "2024-11-20",
      datePeremption: "2028-11-30",
      qtyRecue: 1000,
      qtyRemainingDepot: 600,
      qtyRemainingOfficine: 140,
      supplier: "Mali Pharma SA",
      priceAchat: 400
    },
    {
      id: "lot-5",
      productId: "ph-prod-5",
      lotNumber: "LOT26-LAN02",
      dateFabrication: "2025-02-01",
      datePeremption: "2026-07-20",
      qtyRecue: 50,
      qtyRemainingDepot: 15,
      qtyRemainingOfficine: 3,
      supplier: "Laborex Mali",
      priceAchat: 11000
    },
    {
      id: "lot-6",
      productId: "ph-prod-5",
      lotNumber: "LOT26-LAN-EXPIRED",
      dateFabrication: "2024-01-01",
      datePeremption: "2026-04-30",
      qtyRecue: 40,
      qtyRemainingDepot: 8,
      qtyRemainingOfficine: 0,
      supplier: "Laborex Mali",
      priceAchat: 11000
    }
  ] as any[],

  pharmacyTransfers: [
    {
      id: "ph-trf-1",
      productId: "ph-prod-1",
      lotId: "lot-1",
      quantity: 50,
      date: "2026-05-12T14:30:22Z",
      userId: "user-admin",
      userName: "Adama SANGARÉ",
      status: "APPROVED",
      slipUrl: "bordereau_transfert_trf-1.pdf"
    },
    {
      id: "ph-trf-2",
      productId: "ph-prod-2",
      lotId: "lot-3",
      quantity: 30,
      date: "2026-05-18T10:15:00Z",
      userId: "user-admin",
      userName: "Adama SANGARÉ",
      status: "APPROVED",
      slipUrl: "bordereau_transfert_trf-2.pdf"
    }
  ] as any[],

  pharmacySales: [
    {
      id: "ph-sale-1",
      patientId: "patient-1",
      patientName: "Moussa DIARRA",
      cashierId: "user-cashier",
      cashierName: "Ousmane KEITA",
      date: "2026-06-02T11:04:00Z",
      total: 10500,
      discount: 500,
      insuranceContribution: 7000,
      amountPaid: 3000,
      paymentMethod: "CASH",
      items: [
        {
          productId: "ph-prod-1",
          lotId: "lot-1",
          productName: "Coartem 20/120mg",
          quantity: 3,
          price: 3500
        }
      ],
      auditToken: "SSL-ENC-b84fb7"
    },
    {
      id: "ph-sale-2",
      patientId: "",
      patientName: "Client Anonyme / Comptoir",
      cashierId: "user-cashier",
      cashierName: "Ousmane KEITA",
      date: "2026-06-04T16:45:00Z",
      total: 7500,
      discount: 0,
      insuranceContribution: 0,
      amountPaid: 7500,
      paymentMethod: "ORANGE_MONEY",
      items: [
        {
          productId: "ph-prod-2",
          lotId: "lot-3",
          productName: "Amoxicilline 1g Sandoz",
          quantity: 3,
          price: 2500
        }
      ],
      auditToken: "SSL-ENC-cf4120"
    }
  ] as any[],

  pharmacySuppliers: [
    { id: "ph-sup-1", name: "Laborex Mali", contact: "+223 20 22 41 54 | contact@laborex-mali.ml" },
    { id: "ph-sup-2", name: "Mali Pharma SA", contact: "+223 20 28 92 10 | sales@malipharma.com" },
    { id: "ph-sup-3", name: "Ubipharm Mali", contact: "+223 20 21 04 02 | ubipharm@ubi.ml" },
    { id: "ph-sup-4", name: "Pharmacie Impériale Bamako", contact: "+223 20 22 14 00 | imperiale@afribone.net.ml" }
  ] as any[],

  pharmacyAdjustments: [
    {
      id: "ph-adj-1",
      productId: "ph-prod-2",
      lotId: "lot-3",
      type: "CASSE",
      qtyBefore: 23,
      qtyAfter: 21,
      difference: -2,
      reason: "Deux flacons d'Amoxicilline tombés de l'étagère de l'officine.",
      date: "2026-05-25T09:12:00Z",
      userId: "user-admin",
      userName: "Adama SANGARÉ"
    }
  ] as any[],

  pharmacyDocuments: [
    {
      id: "ph-doc-1",
      productId: "ph-prod-1",
      title: "Facture d'achat Laborex #FAC-4422-B",
      fileType: "PDF",
      fileUrl: "facture_laborex_4422_b.pdf",
      fileSize: "320 KB",
      date: "2026-05-10T12:00:00Z"
    }
  ] as any[],

  pharmacyAlerts: [
    {
      id: "ph-al-1",
      productId: "ph-prod-5",
      productName: "Insuline Lantus Solostar",
      type: "EXPIRING_1M",
      details: "Le lot LOT26-LAN02 (Insuline) arrive à expiration le 2026-07-20 (< 2 mois). Risque élevé de perte.",
      status: "ACTIVE",
      date: "2026-06-01T08:00:00Z"
    },
    {
      id: "ph-al-2",
      productId: "ph-prod-5",
      productName: "Insuline Lantus Solostar",
      type: "EXPIRED",
      details: "Le lot LOT26-LAN-EXPIRED (Insuline) a expiré le 2026-04-30. À retirer immédiatement du stock actif.",
      status: "ACTIVE",
      date: "2026-05-01T08:00:00Z"
    }
  ] as any[],

  pharmacyPrescriptions: [
    {
      id: "ph-presc-1",
      patientId: "patient-1",
      patientName: "Moussa DIARRA",
      doctorName: "Dr. Ibrahim TOURÉ",
      prescriptionText: "Coartem 20/120mg : 1 cp matin et soir pendant 3 jours. Paracétamol 1g : 1 cp toutes les 8h si fièvre.",
      status: "PENDING",
      date: "2026-06-05T12:00:00Z",
      medications: [
        { name: "Coartem 20/120mg", dosage: "1 cp matin/soir", duration: "3 jours", qtyRequired: 6 },
        { name: "Paracétamol 1g", dosage: "1 cp toutes les 8h si fièvre", duration: "3 jours", qtyRequired: 9 }
      ]
    },
    {
      id: "ph-presc-2",
      patientId: "patient-3",
      patientName: "Aminata DIALLO",
      doctorName: "Dr. Ibrahim TOURÉ",
      prescriptionText: "Amoxicilline 1g : 1 cp toutes les 8h pendant 7 jours.",
      status: "PENDING",
      date: "2026-06-05T15:30:00Z",
      medications: [
        { name: "Amoxicilline 1g Sandoz", dosage: "1 cp toutes les 8h", duration: "7 jours", qtyRequired: 21 }
      ]
    }
  ] as any[],

  medicalLibrary: [
    { id: "lib-1", trigger: "@para", label: "💊 Paracétamol 500mg", text: "Paracétamol 500mg : 1 cp toutes les 6h en cas de fievre ou douleurs (Max 4 cp/jour).", category: "MEDICAMENT" },
    { id: "lib-2", trigger: "@amox", label: "💊 Amoxicilline 1g", text: "Amoxicilline 1g : 1 cp matin, midi et soir pendant 6 jours au milieu des repas.", category: "MEDICAMENT" },
    { id: "lib-3", trigger: "@artem", label: "💊 Arteméther Coartem", text: "Artéméther/Luméfantrine (Coartem) : 1 cp à H0, H8, puis 1 cp matin et soir pendant 3 jours.", category: "MEDICAMENT" },
    { id: "lib-4", trigger: "@spas", label: "💊 Spasfon 80mg", text: "Spasfon (Phloroglucinol) : 1 cp à renouveler en cas de contractures douloureuses.", category: "MEDICAMENT" },
    { id: "lib-5", trigger: "@dolo", label: "💊 Dolusrène Inj IM", text: "Dolusrène : 1 ampoule injectable IM si douleur rebelle.", category: "MEDICAMENT" },
    { id: "lib-6", trigger: "@nfs", label: "🧪 NFS / Hémogramme", text: "Numération Formule Sanguine (NFS / Hémogramme)", category: "BIOLOGIE" },
    { id: "lib-7", trigger: "@gly", label: "🧪 Glycémie à jeun", text: "Glycémie à jeun", category: "BIOLOGIE" },
    { id: "lib-8", trigger: "@ecbu", label: "🧪 ECBU (Urine)", text: "Examen Cytobactériologique des Urines (ECBU)", category: "BIOLOGIE" },
    { id: "lib-9", trigger: "@ge", label: "🧪 Goutte Épaisse (GE)", text: "Goutte Épaisse (GE) & TDR Paludisme", category: "BIOLOGIE" },
    { id: "lib-10", trigger: "@perf", label: "🩹 Perfusion G5%", text: "Perfusion intraveineuse lente de sérum glucosé 5% avec ampoules d'électrolytes.", category: "SOIN" },
    { id: "lib-11", trigger: "@pans", label: "🩹 Pansement stérile", text: "Refaire pansement chirurgical stérile, nettoyage bétadine et surveillance locale.", category: "SOIN" },
    { id: "lib-12", trigger: "@inj", label: "🩹 Injection SC Lovenox", text: "Injection sous-cutanée de Lovenox 0.4ml, surveillance locale.", category: "SOIN" }
  ] as any[],

  emailTemplates: [
    {
      id: "tpl-1",
      name: "Rappel de Rendez-vous",
      subject: "Rappel de votre rendez-vous chez {{clinic_name}}",
      body: "Cher(e) {{patient_name}},\n\nNous vous rappelons que votre rendez-vous médical est planifié pour le {{date_rdv}} au sein de notre clinique {{clinic_name}}.\n\nEn cas de besoin ou d'empêchement, vous pouvez contacter notre accueil par téléphone au {{telephone_clinique}} ou par email à {{email_clinique}}.\n\nPrenez soin de vous.\n\nCordialement,\nLa Direction Médicale - {{clinic_name}}"
    },
    {
      id: "tpl-2",
      name: "Résultats d'Analyses Disponibles",
      subject: "Résultats disponibles - Laboratoire d'analyes - {{clinic_name}}",
      body: "Cher(e) {{patient_name}},\n\nNous vous informons que les résultats de vos examens de laboratoire (Dossier N° {{numero_dossier}}) sont prêts et ont été validés par l'équipe biologique de {{clinic_name}}.\n\nVous êtes invité(e) à vous rapprocher du laboratoire pour leur retrait physique ou à consulter votre médecin traitant.\n\nAllergies connues notées au dossier : {{patient_allergies}}\n\nCordialement,\nLe Service de Biologie Clinique"
    },
    {
      id: "tpl-3",
      name: "Facture Disponible",
      subject: "Facture Hospitalière Disponible – Référence : {{numero_dossier}}",
      body: "Cher(e) {{patient_name}},\n\nVotre facture d'hospitalisation ou de consultation médicale pour un montant total exigible de {{montant_facture}} FCFA a été générée avec succès.\n\nLe paiement peut être effectué en caisse principale par Espèces, Chèque certifié ou Mobile Money.\n\nNous vous remercions de votre confiance.\n\nService de Facturation – {{clinic_name}}"
    },
    {
      id: "tpl-4",
      name: "Relance de Paiement",
      subject: "Relance de Paiement – Facture Impayée – {{clinic_name}}",
      body: "Cher(e) {{patient_name}},\n\nSauf erreur de notre part, nous n'avons pas reçu le paiement complet de votre facture d'un montant de {{montant_facture}} FCFA émise le {{date_rdv}}.\n\nNous vous prions de régulariser cette situation auprès du guichet de caisse de la clinique dans les meilleurs délais.\n\nPour toute réclamation, veuillez contacter : {{email_clinique}}.\n\nCordialement,\nService Financier – {{clinic_name}}"
    },
    {
      id: "tpl-5",
      name: "Sensibilisation Paludisme",
      subject: "Campagne Santé Réseau MédiSahel : Prévention du Paludisme en Saison des Pluies",
      body: "Chers Patients de {{clinic_name}},\n\nMédiSahel s'engage à vos côtés. En cette période propice à la prolifération des moustiques, nous vous délivrons ces recommandations essentielles :\n1. Dormez impérativement sous une moustiquaire imprégnée d'insecticide.\n2. Éliminez tout point d'eau stagnante près de votre maison.\n3. En cas de fièvre ou frissons chez l'adulte ou l'enfant, consultez d'urgence à la clinique.\n\nVotre santé est notre absolue priorité.\n\nDr. Alou DIALLO, Médecin Chef\nTéléphone d'Urgences : {{telephone_clinique}}"
    },
    {
      id: "tpl-6",
      name: "Convocation du Personnel GECD",
      subject: "Convocation Hospitalière Officielle – Réunion de Coordination Médico-Soignante",
      body: "Chers Collaborateurs,\n\nVous êtes convoqués à la réunion plénière de coordination qui se tiendra ce vendredi au Bureau Directorial de {{clinic_name}}.\n\nOrdre du jour :\n- Évaluation et suivi de l'audit de sécurité des DME.\n- Répartition des astreintes de nuit et plannings hospitaliers.\n- Intégration du logo centralisé de la clinique sur tous nos formulaires de sortie.\n\nVotre présence est strictement requise et mentionnée sur le registre des présences.\n\nAdama SANGARÉ, Promoteur"
    }
  ] as any[],

  emailCampaigns: [
    {
      id: "cmp-1",
      name: "Campagne de Vaccination 2026",
      subject: "MédiSahel - Ouverture des inscriptions vaccination grippe & virus",
      body: "Chers Patients, la clinique commence officiellement sa campagne nationale.",
      targetGroup: "Patients",
      sentCount: 150,
      openCount: 112,
      failCount: 2,
      status: "SENT",
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    }
  ] as any[],

  emailLogs: [
    {
      id: "log-mail-1",
      recipientName: "Moussa DIARA",
      recipientEmail: "m.diarra@gmail.com",
      category: "PATIENTS",
      subject: "Rappel de votre rendez-vous chez MédiSahel",
      body: "Cher Moussa, nous vous rappelons votre rendez-vous le 2026-06-15.",
      status: "OUVERT",
      senderName: "Dr. Ibrahim TOURÉ",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString()
    },
    {
      id: "log-mail-2",
      recipientName: "Awa DIALLO",
      recipientEmail: "hr@medisahel.ml",
      category: "PERSONNEL",
      subject: "Convocation Hospitalière Officielle",
      body: "Chers Collaborateurs, vous êtes convoqués...",
      status: "REÇU",
      senderName: "Adama SANGARÉ",
      timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: "log-mail-3",
      recipientName: "Laborex Mali",
      recipientEmail: "contact@laborex-mali.ml",
      category: "FOURNISSEURS",
      subject: "Demande de cotation - Consommables de Laboratoire",
      body: "Bonjour, veuillez nous adresser vos meilleurs tarifs...",
      status: "ENVOYÉ",
      senderName: "Ousmane KEITA",
      timestamp: new Date(Date.now() - 8 * 3600 * 1000).toISOString()
    },
    {
      id: "log-mail-4",
      recipientName: "Fatoumata DIARRA",
      recipientEmail: "nurse@medisahel.ml",
      category: "PERSONNEL",
      subject: "Félicitations pour votre engagement (Astreinte)",
      body: "Merci pour votre travail dévoué d'hier soir lors de l'admission d'urgence.",
      status: "ÉCHEC",
      senderName: "Dr. Alou DIALLO",
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ] as any[],

  contacts: [
    {
      id: "contact-1",
      lastName: "MALI PHARMA",
      firstName: "Distributeur",
      phone: "+223 20 28 92 10",
      email: "sales@malipharma.com",
      category: "FOURNISSEURS",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    },
    {
      id: "contact-2",
      lastName: "INAS Mali",
      firstName: "Service Tiers payant",
      phone: "+223 20 22 41 00",
      email: "tierspayant@inas.ml",
      category: "ASSURANCES",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    },
    {
      id: "contact-3",
      lastName: "Direction Santé Bamako",
      firstName: "Secrétariat Technique",
      phone: "+223 76 12 34 89",
      email: "bamako.sante@sante.gov.ml",
      category: "PARTENAIRES",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    },
    {
      id: "contact-4",
      lastName: "CNAM Mali",
      firstName: "Validation Enr",
      phone: "+223 20 23 44 11",
      email: "notifications@cnam.ml",
      category: "ASSURANCES",
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    }
  ] as any[],

  contactGroups: [
    { id: "grp-1", name: "Conseil Scientifique Mali", details: "Membres externes et consultants cliniques réguliers" },
    { id: "grp-2", name: "Rép. Laboratoires Certifiés", details: "Partenaires de secours pour analyses spécialisées" }
  ] as any[]
};

// Database operation interface that abstracts real vs memory fallback
export const db = {
  // TEST CONNECTION
  async testConnection(): Promise<boolean> {
    const p = getPrisma();
    if (useBackupMemory) return false;
    try {
      // Small select
      await p.$queryRaw`SELECT 1`;
      return true;
    } catch (err) {
      console.warn("Database server is unreachable. Operating with full stateful backup engine.");
      useBackupMemory = true;
      return false;
    }
  },

  // CLINICS
  clinics: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.clinics;
      return getPrisma().clinic.findMany();
    },
    async findUnique(id: string) {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.clinics.find(c => c.id === id) || null;
      return getPrisma().clinic.findUnique({ where: { id } });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const index = memoryDb.clinics.findIndex(c => c.id === id);
        if (index > -1) {
          memoryDb.clinics[index] = { ...memoryDb.clinics[index], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.clinics[index];
        }
        return null;
      }
      return getPrisma().clinic.update({ where: { id }, data });
    }
  },

  // USERS
  users: {
    async findMany() {
      await db.testConnection();
      let rawList: any[] = [];
      if (useBackupMemory) {
        rawList = memoryDb.users;
      } else {
        rawList = await getPrisma().user.findMany();
      }
      
      return rawList.map(item => {
        const { passwordHash, ...u } = item;
        let parsed = {};
        if (u.name && u.name.startsWith("{")) {
          try {
            parsed = JSON.parse(u.name);
          } catch {}
        }
        return {
          ...u,
          ...parsed,
          name: (parsed as any).lastName ? `${(parsed as any).firstName} ${(parsed as any).lastName}` : (parsed as any).name || u.name
        };
      });
    },
    async findUnique(id: string) {
      await db.testConnection();
      let user: any = null;
      if (useBackupMemory) {
        user = memoryDb.users.find(u => u.id === id) || null;
      } else {
        user = await getPrisma().user.findUnique({ where: { id } });
      }
      
      if (!user) return null;
      let parsed = {};
      if (user.name && user.name.startsWith("{")) {
        try {
          parsed = JSON.parse(user.name);
        } catch {}
      }
      return {
        ...user,
        ...parsed,
        name: (parsed as any).lastName ? `${(parsed as any).firstName} ${(parsed as any).lastName}` : (parsed as any).name || user.name
      };
    },
    async findByEmail(email: string) {
      await db.testConnection();
      let user: any = null;
      if (useBackupMemory) {
        user = memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      } else {
        user = await getPrisma().user.findFirst({ where: { email } });
      }

      if (!user) return null;
      let parsed = {};
      if (user.name && user.name.startsWith("{")) {
        try {
          parsed = JSON.parse(user.name);
        } catch {}
      }
      return {
        ...user,
        ...parsed,
        name: (parsed as any).lastName ? `${(parsed as any).firstName} ${(parsed as any).lastName}` : (parsed as any).name || user.name
      };
    },
    async findByEmailOrLogin(identifier: string) {
      await db.testConnection();
      let rawList: any[] = [];
      if (useBackupMemory) {
        rawList = memoryDb.users;
      } else {
        rawList = await getPrisma().user.findMany();
      }
      const rawUser = rawList.find((u: any) => 
        u.email.toLowerCase() === identifier.toLowerCase() || 
        (u.login && u.login.toLowerCase() === identifier.toLowerCase())
      );
      if (!rawUser) return null;
      let parsed = {};
      if (rawUser.name && rawUser.name.startsWith("{")) {
        try {
          parsed = JSON.parse(rawUser.name);
        } catch {}
      }
      return {
        ...rawUser,
        ...parsed,
        name: (parsed as any).lastName ? `${(parsed as any).firstName} ${(parsed as any).lastName}` : (parsed as any).name || rawUser.name
      };
    },
    async create(data: any) {
      await db.testConnection();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data.password || "welcome123", salt);
      
      const combinedName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.name;
      const metadata = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        login: data.login || data.email,
        profession: data.profession || "",
        contractType: data.contractType || "CDI",
        phone: data.phone || "",
        department: data.department || "Médecine Générale",
        suspendedUntil: data.suspendedUntil || null,
        lastLoginAt: data.lastLoginAt || null,
        allowedModules: data.allowedModules || [],
        permissions: data.permissions || [],
        roleHistory: data.roleHistory || []
      };

      const newUser: any = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        email: data.email,
        passwordHash: hash,
        name: JSON.stringify({ name: combinedName, ...metadata }),
        role: data.role || "DOCTOR",
        mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
        clinicId: data.clinicId || "clinic-1",
        status: data.status || "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (useBackupMemory) {
        memoryDb.users.push(newUser);
        const { passwordHash, ...u } = newUser;
        return {
          ...u,
          ...metadata,
          name: combinedName
        };
      }

      const created = await getPrisma().user.create({
        data: {
          email: newUser.email,
          passwordHash: newUser.passwordHash,
          name: newUser.name,
          role: newUser.role,
          mustChangePassword: newUser.mustChangePassword,
          clinicId: newUser.clinicId,
          status: newUser.status
        }
      });

      return {
        ...created,
        ...metadata,
        name: combinedName
      };
    },
    async update(id: string, data: any) {
      await db.testConnection();
      let updatePayload = { ...data };
      if (data.password) {
        updatePayload.passwordHash = bcrypt.hashSync(data.password, 10);
        delete updatePayload.password;
      }

      if (useBackupMemory) {
        const idx = memoryDb.users.findIndex(u => u.id === id);
        if (idx > -1) {
          memoryDb.users[idx] = { ...memoryDb.users[idx], ...updatePayload, updatedAt: new Date().toISOString() };
          const { passwordHash, ...u } = memoryDb.users[idx];
          let parsed = {};
          if (u.name && u.name.startsWith("{")) {
            try {
              parsed = JSON.parse(u.name);
            } catch {}
          }
          return {
            ...u,
            ...parsed,
            name: (parsed as any).lastName ? `${(parsed as any).firstName} ${(parsed as any).lastName}` : (parsed as any).name || u.name
          };
        }
        return null;
      }

      const currentUser = await getPrisma().user.findUnique({ where: { id } });
      if (!currentUser) return null;
      
      let existingFields = {};
      if (currentUser.name && currentUser.name.startsWith("{")) {
        try {
          existingFields = JSON.parse(currentUser.name);
        } catch {}
      } else {
        existingFields = { name: currentUser.name };
      }

      const combined = { ...existingFields, ...updatePayload };
      const prismaPayload: any = {
        updatedAt: new Date()
      };
      if (data.email) prismaPayload.email = data.email;
      if (data.role) prismaPayload.role = data.role;
      if (data.mustChangePassword !== undefined) prismaPayload.mustChangePassword = data.mustChangePassword;
      if (data.status) prismaPayload.status = data.status;
      if (updatePayload.passwordHash) prismaPayload.passwordHash = updatePayload.passwordHash;

      prismaPayload.name = JSON.stringify(combined);

      const updated = await getPrisma().user.update({
        where: { id },
        data: prismaPayload
      });

      return {
        ...updated,
        ...combined,
        name: combined.lastName ? `${combined.firstName} ${combined.lastName}` : combined.name || updated.name
      };
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.users.findIndex(u => u.id === id);
        if (idx > -1) {
          const deleted = memoryDb.users[idx];
          memoryDb.users.splice(idx, 1);
          return deleted;
        }
        return null;
      }
      return getPrisma().user.delete({ where: { id } });
    }
  },

  // PATIENTS
  patients: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.patients;
      return getPrisma().patient.findMany({ orderBy: { lastName: "asc" } });
    },
    async findUnique(id: string) {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.patients.find(p => p.id === id) || null;
      return getPrisma().patient.findUnique({ where: { id } });
    },
    async create(data: any) {
      await db.testConnection();

      // Implement Rule 5: Permanent unique identifier format e.g. MS-2026-000001
      let count = 1;
      if (useBackupMemory) {
        count = memoryDb.patients.length + 1;
      } else {
        count = (await getPrisma().patient.count()) + 1;
      }

      const year = new Date().getFullYear();
      const formattedSeq = String(count).padStart(6, "0");
      const clientUniqueId = `MS-${year}-${formattedSeq}`;

      // Implement Rule 7: NID non-obligatoire (auto-generation fallback if empty)
      let finalNid = data.nationalId;
      if (!finalNid || finalNid.trim() === "") {
        finalNid = `MS-NID-${clientUniqueId}`;
      }

      const newItem = {
        id: clientUniqueId,
        ...data,
        nationalId: finalNid,
        ethnie: data.ethnie && data.ethnie.trim() !== "" ? data.ethnie : "Non renseignée",
        nationalite: data.nationalite && data.nationalite.trim() !== "" ? data.nationalite : "Non renseignée",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.patients.push(newItem);
        return newItem;
      }
      return getPrisma().patient.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.patients.findIndex(p => p.id === id);
        if (idx > -1) {
          memoryDb.patients[idx] = { ...memoryDb.patients[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.patients[idx];
        }
        return null;
      }
      return getPrisma().patient.update({ where: { id }, data });
    }
  },

  // MEDICAL RECORDS (DME)
  medicalRecords: {
    async findMany(patientId?: string) {
      await db.testConnection();
      if (useBackupMemory) {
        if (patientId) return memoryDb.medicalRecords.filter(r => r.patientId === patientId);
        return memoryDb.medicalRecords;
      }
      return getPrisma().medicalRecord.findMany({
        where: patientId ? { patientId } : undefined,
        orderBy: { date: "desc" }
      });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "record-" + Math.random().toString(36).substr(2, 9),
        ...data,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.medicalRecords.push(newItem);
        return newItem;
      }
      return getPrisma().medicalRecord.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.medicalRecords.findIndex(r => r.id === id);
        if (idx > -1) {
          memoryDb.medicalRecords[idx] = { ...memoryDb.medicalRecords[idx], ...data };
          return memoryDb.medicalRecords[idx];
        }
        return null;
      }
      return getPrisma().medicalRecord.update({ where: { id }, data });
    }
  },

  // HOSPITALIZATIONS
  hospitalizations: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.hospitalizations;
      return getPrisma().hospitalization.findMany({ orderBy: { admissionDate: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();

      // Implement Rule 10: Numérotation N°00001-06-2026 (Numéro d'ordre – Mois – Année)
      let count = 1;
      if (useBackupMemory) {
        count = memoryDb.hospitalizations.length + 1;
      } else {
        count = (await getPrisma().hospitalization.count()) + 1;
      }

      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const orderNumber = String(count).padStart(5, "0");
      const formattedSeqId = `N°${orderNumber}-${month}-${year}`;

      const newItem = {
        id: formattedSeqId,
        ...data,
        admissionDate: new Date().toISOString(),
        status: "ADMITTED"
      };
      if (useBackupMemory) {
        memoryDb.hospitalizations.push(newItem);
        return newItem;
      }
      return getPrisma().hospitalization.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.hospitalizations.findIndex(h => h.id === id);
        if (idx > -1) {
          memoryDb.hospitalizations[idx] = { ...memoryDb.hospitalizations[idx], ...data };
          return memoryDb.hospitalizations[idx];
        }
        return null;
      }
      return getPrisma().hospitalization.update({ where: { id }, data });
    }
  },

  // TRANSACTIONS (Facturation & Caisse)
  transactions: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.transactions;
      return getPrisma().transaction.findMany({ orderBy: { date: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "tx-" + Math.random().toString(36).substr(2, 9),
        ...data,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.transactions.push(newItem);
        return newItem;
      }
      return getPrisma().transaction.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.transactions.findIndex(t => t.id === id);
        if (idx > -1) {
          memoryDb.transactions[idx] = { ...memoryDb.transactions[idx], ...data };
          return memoryDb.transactions[idx];
        }
        return null;
      }
      return getPrisma().transaction.update({ where: { id }, data });
    }
  },

  // INVENTORY (Pharmacie & Stock)
  inventory: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.inventoryItems;
      return getPrisma().inventoryItem.findMany({ orderBy: { name: "asc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "inv-" + Math.random().toString(36).substr(2, 9),
        ...data,
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.inventoryItems.push(newItem);
        return newItem;
      }
      return getPrisma().inventoryItem.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.inventoryItems.findIndex(i => i.id === id);
        if (idx > -1) {
          memoryDb.inventoryItems[idx] = { ...memoryDb.inventoryItems[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.inventoryItems[idx];
        }
        return null;
      }
      return getPrisma().inventoryItem.update({ where: { id }, data });
    }
  },

  // LAB TESTS
  labTests: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.labTests;
      return getPrisma().labTest.findMany({ orderBy: { date: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "lab-" + Math.random().toString(36).substr(2, 9),
        ...data,
        date: new Date().toISOString(),
        status: "PENDING"
      };
      if (useBackupMemory) {
        memoryDb.labTests.push(newItem);
        return newItem;
      }
      return getPrisma().labTest.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.labTests.findIndex(l => l.id === id);
        if (idx > -1) {
          memoryDb.labTests[idx] = { ...memoryDb.labTests[idx], ...data };
          return memoryDb.labTests[idx];
        }
        return null;
      }
      return getPrisma().labTest.update({ where: { id }, data });
    }
  },

  // ATTENDANCES (Présences & Retards)
  attendances: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.attendances;
      return getPrisma().attendance.findMany({ orderBy: { date: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "att-" + Math.random().toString(36).substr(2, 9),
        ...data
      };
      if (useBackupMemory) {
        memoryDb.attendances.push(newItem);
        return newItem;
      }
      return getPrisma().attendance.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.attendances.findIndex(a => a.id === id);
        if (idx !== -1) {
          memoryDb.attendances[idx] = { ...memoryDb.attendances[idx], ...data };
          return memoryDb.attendances[idx];
        }
        return null;
      }
      return getPrisma().attendance.update({ where: { id }, data });
    }
  },

  // PAYROLL (Paie & Salaires)
  payrolls: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.payrolls;
      return getPrisma().payroll.findMany({ orderBy: { year: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "pay-" + Math.random().toString(36).substr(2, 9),
        ...data
      };
      if (useBackupMemory) {
        memoryDb.payrolls.push(newItem);
        return newItem;
      }
      return getPrisma().payroll.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.payrolls.findIndex(p => p.id === id);
        if (idx > -1) {
          memoryDb.payrolls[idx] = { ...memoryDb.payrolls[idx], ...data };
          return memoryDb.payrolls[idx];
        }
        return null;
      }
      return getPrisma().payroll.update({ where: { id }, data });
    }
  },

  // APPOINTMENTS (Agenda & Rendez-vous)
  appointments: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.appointments;
      return getPrisma().appointment.findMany({ orderBy: { date: "asc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "app-" + Math.random().toString(36).substr(2, 9),
        ...data,
        status: "CONFIRMED"
      };
      if (useBackupMemory) {
        memoryDb.appointments.push(newItem);
        return newItem;
      }
      return getPrisma().appointment.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.appointments.findIndex(ap => ap.id === id);
        if (idx > -1) {
          memoryDb.appointments[idx] = { ...memoryDb.appointments[idx], ...data };
          return memoryDb.appointments[idx];
        }
        return null;
      }
      return getPrisma().appointment.update({ where: { id }, data });
    }
  },

  // DOCUMENTS (GECD)
  documents: {
    async findMany() {
      await db.testConnection();
      let list = [];
      if (useBackupMemory) {
        list = memoryDb.documents;
      } else {
        list = await getPrisma().document.findMany({ orderBy: { createdAt: "desc" } });
      }
      return list.map((item: any) => {
        if (item.description && item.description.startsWith('{"_extra":')) {
          try {
            const parsed = JSON.parse(item.description);
            return {
              ...item,
              ...parsed._extra,
              description: parsed.text || ""
            };
          } catch {}
        }
        return item;
      });
    },
    async create(data: any) {
      await db.testConnection();
      const standardKeys = ["id", "title", "description", "fileUrl", "fileType", "category", "ownerId", "ownerName", "size", "createdAt", "updatedAt"];
      
      const newItemId = data.id || "doc-" + Math.random().toString(36).substr(2, 9);
      const incomingFields = { ...data, id: newItemId };
      const extra: Record<string, any> = {};
      
      // Separate standard vs extra fields
      for (const k of Object.keys(incomingFields)) {
        if (!standardKeys.includes(k) && k !== "description") {
          extra[k] = incomingFields[k];
        }
      }
      
      let finalDescription = incomingFields.description || "";
      if (Object.keys(extra).length > 0) {
        finalDescription = JSON.stringify({ _extra: extra, text: finalDescription });
      }
      
      const newItem = {
        id: newItemId,
        title: incomingFields.title || "Document sans titre",
        description: finalDescription,
        fileUrl: incomingFields.fileUrl || null,
        fileType: incomingFields.fileType || "PDF",
        category: incomingFields.category || "INCOMING",
        ownerId: incomingFields.ownerId || "system",
        ownerName: incomingFields.ownerName || "Système",
        size: incomingFields.size || "0 KB",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      if (useBackupMemory) {
        // Flatten for in-memory DB
        const memoryEntry = { ...newItem, ...extra, description: incomingFields.description || "" };
        memoryDb.documents.push(memoryEntry);
        return memoryEntry;
      }
      
      const created = await getPrisma().document.create({ data: newItem });
      return {
        ...created,
        ...extra,
        description: incomingFields.description || ""
      };
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.documents.findIndex(d => d.id === id);
        if (idx > -1) {
          memoryDb.documents[idx] = { 
            ...memoryDb.documents[idx], 
            ...data, 
            updatedAt: new Date().toISOString() 
          };
          return memoryDb.documents[idx];
        }
        return null;
      }
      
      const existing = await getPrisma().document.findUnique({ where: { id } });
      if (!existing) return null;
      
      // Extract existing extra fields if description is JSON
      let existingExtra: Record<string, any> = {};
      let existingText = existing.description || "";
      if (existing.description && existing.description.startsWith('{"_extra":')) {
        try {
          const parsed = JSON.parse(existing.description);
          existingExtra = parsed._extra || {};
          existingText = parsed.text || "";
        } catch {}
      }
      
      // Combine with new fields
      const combinedFields = { ...existingExtra, ...data };
      const standardKeys = ["id", "title", "description", "fileUrl", "fileType", "category", "ownerId", "ownerName", "size", "createdAt", "updatedAt"];
      
      const newExtra: Record<string, any> = {};
      for (const k of Object.keys(combinedFields)) {
        if (!standardKeys.includes(k) && k !== "description") {
          newExtra[k] = combinedFields[k];
        }
      }
      
      let finalDescription = data.description !== undefined ? data.description : existingText;
      if (Object.keys(newExtra).length > 0) {
        finalDescription = JSON.stringify({ _extra: newExtra, text: finalDescription });
      }
      
      const updated = await getPrisma().document.update({
        where: { id },
        data: {
          title: data.title !== undefined ? data.title : existing.title,
          description: finalDescription,
          fileUrl: data.fileUrl !== undefined ? data.fileUrl : existing.fileUrl,
          fileType: data.fileType !== undefined ? data.fileType : existing.fileType,
          category: data.category !== undefined ? data.category : existing.category,
          ownerId: data.ownerId !== undefined ? data.ownerId : existing.ownerId,
          ownerName: data.ownerName !== undefined ? data.ownerName : existing.ownerName,
          size: data.size !== undefined ? data.size : existing.size,
          updatedAt: new Date()
        }
      });
      
      return {
        ...updated,
        ...newExtra,
        description: data.description !== undefined ? data.description : existingText
      };
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.documents.findIndex(d => d.id === id);
        if (idx > -1) {
          const removed = memoryDb.documents[idx];
          memoryDb.documents.splice(idx, 1);
          return removed;
        }
        return null;
      }
      return getPrisma().document.delete({ where: { id } });
    }
  },

  // ROOMS
  rooms: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.rooms;
      return getPrisma().room.findMany({ orderBy: { number: "asc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const capacityVal = data.capacity !== undefined ? Number(data.capacity) : 2;
      const newItem = {
        id: data.id || "room-" + Math.random().toString(36).substr(2, 9),
        number: data.number,
        type: data.type,
        service: data.service,
        floor: data.floor,
        capacity: capacityVal,
        status: data.status || "Disponible",
        allowedGender: data.allowedGender || "Mixte"
      };
      if (useBackupMemory) {
        memoryDb.rooms.push(newItem);
        return newItem;
      }
      return getPrisma().room.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      const updateData: any = {};
      if (data.number !== undefined) updateData.number = data.number;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.service !== undefined) updateData.service = data.service;
      if (data.floor !== undefined) updateData.floor = data.floor;
      if (data.capacity !== undefined) updateData.capacity = Number(data.capacity);
      if (data.status !== undefined) updateData.status = data.status;
      if (data.allowedGender !== undefined) updateData.allowedGender = data.allowedGender;
      
      if (useBackupMemory) {
        const idx = memoryDb.rooms.findIndex(r => r.id === id);
        if (idx > -1) {
          memoryDb.rooms[idx] = { ...memoryDb.rooms[idx], ...updateData };
          return memoryDb.rooms[idx];
        }
        return null;
      }
      return getPrisma().room.update({ where: { id }, data: updateData });
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.rooms.findIndex(r => r.id === id);
        if (idx > -1) {
          const removed = memoryDb.rooms[idx];
          memoryDb.rooms.splice(idx, 1);
          memoryDb.beds = memoryDb.beds.filter(b => b.roomId !== id);
          return removed;
        }
        return null;
      }
      await getPrisma().bed.deleteMany({ where: { roomId: id } });
      return getPrisma().room.delete({ where: { id } });
    }
  },

  // BEDS
  beds: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.beds;
      return getPrisma().bed.findMany({ orderBy: { number: "asc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: data.id || "bed-" + Math.random().toString(36).substr(2, 9),
        number: data.number,
        type: data.type,
        roomId: data.roomId,
        status: data.status || "Disponible",
        patientId: data.patientId || null,
        patientNom: data.patientNom || null,
        dateAdmission: data.dateAdmission || null
      };
      if (useBackupMemory) {
        memoryDb.beds.push(newItem);
        return newItem;
      }
      return getPrisma().bed.create({ data: newItem });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      const updateData: any = {};
      if (data.number !== undefined) updateData.number = data.number;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.roomId !== undefined) updateData.roomId = data.roomId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.patientId !== undefined) updateData.patientId = data.patientId;
      if (data.patientNom !== undefined) updateData.patientNom = data.patientNom;
      if (data.dateAdmission !== undefined) updateData.dateAdmission = data.dateAdmission;
      
      if (useBackupMemory) {
        const idx = memoryDb.beds.findIndex(b => b.id === id);
        if (idx > -1) {
          memoryDb.beds[idx] = { ...memoryDb.beds[idx], ...updateData };
          return memoryDb.beds[idx];
        }
        return null;
      }
      return getPrisma().bed.update({ where: { id }, data: updateData });
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.beds.findIndex(b => b.id === id);
        if (idx > -1) {
          const removed = memoryDb.beds[idx];
          memoryDb.beds.splice(idx, 1);
          return removed;
        }
        return null;
      }
      return getPrisma().bed.delete({ where: { id } });
    }
  },

  // RATES
  rates: {
    async get() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.rates;

      try {
        const roomRatesDb = await getPrisma().hospitalizationRate.findMany();
        const bedRatesDb = await getPrisma().bedRate.findMany();

        return {
          roomRates: {
            Classique: roomRatesDb.find(r => r.roomType === "Classique")?.price ?? 0,
            Climatisée: roomRatesDb.find(r => r.roomType === "Climatisée")?.price ?? 15000,
            VIP: roomRatesDb.find(r => r.roomType === "VIP")?.price ?? 35000,
          },
          bedRates: {
            Classique: bedRatesDb.find(b => b.bedType === "Classique")?.price ?? 0,
            Handicapé: bedRatesDb.find(b => b.bedType === "Handicapé")?.price ?? 5000,
            VIP: bedRatesDb.find(b => b.bedType === "VIP")?.price ?? 10000,
          }
        };
      } catch (e) {
        console.error("Error reading db rates, using defaults", e);
        return memoryDb.rates;
      }
    },
    async update(data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        memoryDb.rates = { ...memoryDb.rates, ...data };
        return memoryDb.rates;
      }

      const { roomRates, bedRates } = data;
      if (roomRates) {
        for (const [type, price] of Object.entries(roomRates)) {
          await getPrisma().hospitalizationRate.upsert({
            where: { roomType: type },
            update: { price: Number(price) },
            create: { roomType: type, price: Number(price) },
          });
        }
      }
      if (bedRates) {
        for (const [type, price] of Object.entries(bedRates)) {
          await getPrisma().bedRate.upsert({
            where: { bedType: type },
            update: { price: Number(price) },
            create: { bedType: type, price: Number(price) },
          });
        }
      }

      return this.get();
    }
  },

  // TRANSFER LOGS
  transferLogs: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.transferLogs;
      
      const logs = await getPrisma().transferLog.findMany({ orderBy: { date: "desc" } });
      return logs.map(l => ({
        ...l,
        timestamp: l.date.toISOString() // map date to timestamp for UI consistency
      }));
    },
    async create(data: any) {
      await db.testConnection();
      const memoryItem = {
        id: "transf-" + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date().toISOString()
      };

      if (useBackupMemory) {
        memoryDb.transferLogs.unshift(memoryItem);
        return memoryItem;
      }

      const created = await getPrisma().transferLog.create({
        data: {
          patientId: data.patientId,
          patientNom: data.patientNom || "Patient",
          hospitalizationId: data.hospitalizationId,
          fromRoomNumber: data.fromRoomNumber,
          fromBedNumber: data.fromBedNumber,
          toRoomNumber: data.toRoomNumber,
          toBedNumber: data.toBedNumber,
          reason: data.reason || "Mutation standard",
          userId: data.userId || null,
          userName: data.userName || null,
          userRole: data.userRole || null,
          date: new Date()
        }
      });

      return {
        ...created,
        timestamp: created.date.toISOString()
      };
    }
  },

  // BED HISTORY LOGS
  bedHistories: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.bedHistories || [];
      return getPrisma().bedHistory.findMany({ orderBy: { startDate: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "bedhist-" + Math.random().toString(36).substr(2, 9),
        ...data,
        startDate: data.startDate || new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!memoryDb.bedHistories) memoryDb.bedHistories = [];
        memoryDb.bedHistories.unshift(newItem);
        return newItem;
      }
      return getPrisma().bedHistory.create({
        data: {
          bedId: data.bedId,
          patientId: data.patientId,
          patientName: data.patientName,
          startDate: data.startDate ? new Date(data.startDate) : new Date(),
          endDate: data.endDate ? new Date(data.endDate) : null,
          action: data.action,
          notes: data.notes || null
        }
      });
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!memoryDb.bedHistories) memoryDb.bedHistories = [];
        const idx = memoryDb.bedHistories.findIndex(bh => bh.id === id);
        if (idx > -1) {
          memoryDb.bedHistories[idx] = { ...memoryDb.bedHistories[idx], ...data };
          return memoryDb.bedHistories[idx];
        }
        return null;
      }
      const updateData: any = {};
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.action !== undefined) updateData.action = data.action;

      return getPrisma().bedHistory.update({
        where: { id },
        data: updateData
      });
    }
  },

  // AUDIT LOGS
  dmeArchives: {
    async findMany(patientId?: string) {
      await db.testConnection();
      if (useBackupMemory) {
        if (patientId) {
          return (memoryDb.dmeArchives || []).filter((a: any) => a.patientId === patientId);
        }
        return memoryDb.dmeArchives || [];
      }
      try {
        if (patientId) {
          return await getPrisma().dmeArchive.findMany({
            where: { patientId },
            orderBy: { performedAt: "desc" }
          });
        }
        return await getPrisma().dmeArchive.findMany({
          orderBy: { performedAt: "desc" }
        });
      } catch (err) {
        if (patientId) {
          return (memoryDb.dmeArchives || []).filter((a: any) => a.patientId === patientId);
        }
        return memoryDb.dmeArchives || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: data.id || "arch-" + Math.random().toString(36).substr(2, 9),
        patientId: data.patientId || "",
        actionType: data.actionType || "",
        entityType: data.entityType || "",
        entityId: data.entityId || "",
        content: typeof data.content === "string" ? data.content : JSON.stringify(data.content),
        performedBy: data.performedBy || "",
        performedAt: data.performedAt ? new Date(data.performedAt).toISOString() : new Date().toISOString(),
        ipAddress: data.ipAddress || "127.0.0.1",
        userAgent: data.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      };

      if (useBackupMemory) {
        if (!memoryDb.dmeArchives) memoryDb.dmeArchives = [];
        memoryDb.dmeArchives.unshift(newItem);
        return newItem;
      }
      try {
        return await getPrisma().dmeArchive.create({ data: newItem });
      } catch (err) {
        if (!memoryDb.dmeArchives) memoryDb.dmeArchives = [];
        memoryDb.dmeArchives.unshift(newItem);
        return newItem;
      }
    }
  },

  // AUDIT LOGS
  auditLogs: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.auditLogs;
      return getPrisma().auditLog.findMany({ orderBy: { timestamp: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "audit-" + Math.random().toString(36).substr(2, 9),
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        action: data.action,
        details: data.details,
        timestamp: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.auditLogs.unshift(newItem); // keep newest at top
        return newItem;
      }
      return getPrisma().auditLog.create({ data: newItem });
    }
  },

  receiptDispatches: {
    async findMany() {
      if (!memoryDb.receiptDispatches) memoryDb.receiptDispatches = [];
      return memoryDb.receiptDispatches;
    },
    async create(data: any) {
      if (!memoryDb.receiptDispatches) memoryDb.receiptDispatches = [];
      const newItem = {
        id: "dispatch-" + Math.random().toString(36).substr(2, 9),
        patientId: data.patientId,
        transactionId: data.transactionId,
        date: new Date().toISOString(),
        channel: data.channel, // IMPRESSION, SMS, WHATSAPP
        username: data.username,
        userRole: data.userRole,
        message: data.message || "",
        status: data.status || "Transmis"
      };
      memoryDb.receiptDispatches.unshift(newItem);
      return newItem;
    }
  },

  // PRE-ADMISSION BED RESERVATIONS
  reservations: {
    async findMany() {
      if (!memoryDb.reservations) memoryDb.reservations = [];
      const now = Date.now();
      const validRes: any[] = [];
      const expiredRes: any[] = [];
      
      for (const res of memoryDb.reservations) {
        const reservedAtTime = new Date(res.reservedAt).getTime();
        const expirationTime = reservedAtTime + (res.autoReleaseHours || 24) * 60 * 60 * 1000;
        if (now > expirationTime) {
          expiredRes.push(res);
        } else {
          validRes.push(res);
        }
      }

      // Automatically release expired beds
      if (expiredRes.length > 0) {
        for (const er of expiredRes) {
          const bed = memoryDb.beds.find((b: any) => b.id === er.bedId);
          if (bed && bed.status === "Réservé") {
            bed.status = "Disponible";
            memoryDb.bedHistories.push({
              id: "bedhist-" + Math.random().toString(36).substr(2, 9),
              bedId: bed.id,
              patientId: "RESERVATION_EXPIRED",
              patientName: er.patientName,
              startDate: er.reservedAt,
              endDate: new Date().toISOString(),
              action: "AUTO_RELEASE",
              notes: `Libération automatique. Délai dépassé (${er.autoReleaseHours || 24}h)`
            });

            memoryDb.auditLogs.unshift({
              id: "log-" + Math.random().toString(36).substr(2, 9),
              userId: "SYSTEM",
              userName: "Système Automatique",
              role: "SYSTEM",
              action: "RESERVATION_LIBERATION_AUTO",
              details: `Libération automatique du lit ${bed.number} réservé pour ${er.patientName} après le délai paramétré de ${er.autoReleaseHours || 24} heures.`,
              timestamp: new Date().toISOString()
            });
          }
        }
        memoryDb.reservations = validRes;
      }

      return memoryDb.reservations;
    },
    async create(data: any) {
      if (!memoryDb.reservations) memoryDb.reservations = [];
      const newItem = {
        id: "res-" + Math.random().toString(36).substr(2, 9),
        bedId: data.bedId,
        patientName: data.patientName,
        reservedAt: data.reservedAt || new Date().toISOString(),
        autoReleaseHours: Number(data.autoReleaseHours) || 24,
        createdAt: new Date().toISOString()
      };
      
      memoryDb.reservations.push(newItem);

      // Set bed status to reserved
      const bed = memoryDb.beds.find((b: any) => b.id === data.bedId);
      if (bed) {
        bed.status = "Réservé";
        
        // Log in bed history
        memoryDb.bedHistories.push({
          id: "bedhist-" + Math.random().toString(36).substr(2, 9),
          bedId: bed.id,
          patientId: "RESERVED",
          patientName: data.patientName,
          startDate: newItem.reservedAt,
          endDate: null,
          action: "RESERVATION",
          notes: `Lit réservé pour ${data.patientName}. Délai d'expiration automatique : ${newItem.autoReleaseHours}h.`
        });
      }

      return newItem;
    },
    async delete(id: string) {
      if (!memoryDb.reservations) memoryDb.reservations = [];
      const idx = memoryDb.reservations.findIndex((r: any) => r.id === id);
      if (idx > -1) {
        const removed = memoryDb.reservations[idx];
        memoryDb.reservations.splice(idx, 1);
        
        // Set bed status to Disponible (if was Reserved)
        const bed = memoryDb.beds.find((b: any) => b.id === removed.bedId);
        if (bed && bed.status === "Réservé") {
          bed.status = "Disponible";
          
          // Close BedHistory
          const activeHist = memoryDb.bedHistories.find((h: any) => h.bedId === bed.id && h.patientName === removed.patientName && !h.endDate);
          if (activeHist) {
            activeHist.endDate = new Date().toISOString();
            activeHist.notes = "Réservation clôturée (lit libéré ou admis).";
          }
        }
        return removed;
      }
      return null;
    }
  },
  
  // PHARMACY CLINICAL MODULE
  pharmacy: {
    // Local backup helpers for when postgresql is down
    async _ensureBackupLocal() {
      try {
        const fs = await import("fs");
        const path = await import("path");
        const storePath = path.join(process.cwd(), "pharmacy_store.json");
        return { fs, storePath };
      } catch (e) {
        return null;
      }
    },
    async saveLocalBackup() {
      try {
        const io = await this._ensureBackupLocal();
        if (!io) return;
        const backupData = {
          pharmacyProducts: memoryDb.pharmacyProducts || [],
          pharmacyLots: memoryDb.pharmacyLots || [],
          pharmacyTransfers: memoryDb.pharmacyTransfers || [],
          pharmacySales: memoryDb.pharmacySales || [],
          pharmacySuppliers: memoryDb.pharmacySuppliers || [],
          pharmacyAdjustments: memoryDb.pharmacyAdjustments || [],
          pharmacyDocuments: memoryDb.pharmacyDocuments || [],
          pharmacyAlerts: memoryDb.pharmacyAlerts || [],
          pharmacyPrescriptions: memoryDb.pharmacyPrescriptions || [],
          pharmacyInventories: (memoryDb as any).pharmacyInventories || []
        };
        io.fs.writeFileSync(io.storePath, JSON.stringify(backupData, null, 2), "utf-8");
      } catch (err) {
        console.warn("Fichier de sauvegarde locale non mis à jour:", err);
      }
    },
    async loadLocalBackup() {
      try {
        const io = await this._ensureBackupLocal();
        if (!io || !io.fs.existsSync(io.storePath)) return;
        const txt = io.fs.readFileSync(io.storePath, "utf-8");
        const data = JSON.parse(txt);
        if (data.pharmacyProducts) memoryDb.pharmacyProducts = data.pharmacyProducts;
        if (data.pharmacyLots) memoryDb.pharmacyLots = data.pharmacyLots;
        if (data.pharmacyTransfers) memoryDb.pharmacyTransfers = data.pharmacyTransfers;
        if (data.pharmacySales) memoryDb.pharmacySales = data.pharmacySales;
        if (data.pharmacySuppliers) memoryDb.pharmacySuppliers = data.pharmacySuppliers;
        if (data.pharmacyAdjustments) memoryDb.pharmacyAdjustments = data.pharmacyAdjustments;
        if (data.pharmacyDocuments) memoryDb.pharmacyDocuments = data.pharmacyDocuments;
        if (data.pharmacyAlerts) memoryDb.pharmacyAlerts = data.pharmacyAlerts;
        if (data.pharmacyPrescriptions) memoryDb.pharmacyPrescriptions = data.pharmacyPrescriptions;
        if (data.pharmacyInventories) (memoryDb as any).pharmacyInventories = data.pharmacyInventories;
      } catch (err) {
        console.warn("Échec du chargement du fichier de sauvegarde locale:", err);
      }
    },

    async getProducts() {
      await this.loadLocalBackup();
      await db.testConnection();
      let dbProducts: any[] = [];
      let dbLots: any[] = [];

      if (!useBackupMemory) {
        try {
          dbProducts = await getPrisma().pharmacyProduct.findMany();
          dbLots = await getPrisma().pharmacyLot.findMany();
        } catch (e) {
          console.warn("Get products PostgreSQL failed, falling back to local files:", e);
          dbProducts = memoryDb.pharmacyProducts || [];
          dbLots = memoryDb.pharmacyLots || [];
        }
      } else {
        dbProducts = memoryDb.pharmacyProducts || [];
        dbLots = memoryDb.pharmacyLots || [];
      }

      return dbProducts.map((p: any) => {
        const prodLots = dbLots.filter((l: any) => l.productId === p.id);
        const qtyDepot = prodLots.reduce((sum: number, l: any) => sum + (Number(l.qtyRemainingDepot) || 0), 0);
        const qtyOfficine = prodLots.reduce((sum: number, l: any) => sum + (Number(l.qtyRemainingOfficine) || 0), 0);
        return {
          ...p,
          quantityDepot: qtyDepot,
          quantityOfficine: qtyOfficine,
          quantity: qtyDepot + qtyOfficine
        };
      });
    },
    async addProduct(product: any) {
      await db.testConnection();
      const newId = product.id || "ph-prod-" + Math.random().toString(36).substr(2, 9);
      const productData = {
        id: newId,
        codeInterne: product.codeInterne || ("PH-INT-" + Math.floor(1000 + Math.random() * 9000)),
        codeBarre: product.codeBarre || "N/A",
        dci: product.dci || "",
        nomCommercial: product.nomCommercial || "",
        forme: product.forme || "",
        dosage: product.dosage || "",
        category: product.category || "MEDICINE",
        supplier: product.supplier || "Non spécifié",
        priceAchat: parseFloat(product.priceAchat || 0),
        priceVente: parseFloat(product.priceVente || 0),
        stockMin: parseInt(product.stockMin || 10),
        stockMax: parseInt(product.stockMax || 500),
        imageUrl: product.imageUrl || ""
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyProduct.create({ data: productData });
          // double-write to memory for sync
          memoryDb.pharmacyProducts = memoryDb.pharmacyProducts || [];
          memoryDb.pharmacyProducts.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addProduct failed, saving to local JSON:", e);
        }
      }

      if (!memoryDb.pharmacyProducts) memoryDb.pharmacyProducts = [];
      const backupObj = { ...productData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      memoryDb.pharmacyProducts.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async updateProduct(id: string, data: any) {
      await db.testConnection();
      const cleanData: any = {};
      if (data.nomCommercial !== undefined) cleanData.nomCommercial = data.nomCommercial;
      if (data.dci !== undefined) cleanData.dci = data.dci;
      if (data.priceAchat !== undefined) cleanData.priceAchat = parseFloat(data.priceAchat || 0);
      if (data.priceVente !== undefined) cleanData.priceVente = parseFloat(data.priceVente || 0);
      if (data.stockMin !== undefined) cleanData.stockMin = parseInt(data.stockMin || 0);
      if (data.stockMax !== undefined) cleanData.stockMax = parseInt(data.stockMax || 0);
      if (data.forme !== undefined) cleanData.forme = data.forme;
      if (data.dosage !== undefined) cleanData.dosage = data.dosage;
      if (data.category !== undefined) cleanData.category = data.category;
      if (data.supplier !== undefined) cleanData.supplier = data.supplier;

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyProduct.update({ where: { id }, data: cleanData });
          const idx = memoryDb.pharmacyProducts.findIndex((e: any) => e.id === id);
          if (idx > -1) {
            memoryDb.pharmacyProducts[idx] = { ...memoryDb.pharmacyProducts[idx], ...cleanData };
          }
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma updateProduct failed:", e);
        }
      }

      const idx = memoryDb.pharmacyProducts.findIndex((e: any) => e.id === id);
      if (idx > -1) {
        memoryDb.pharmacyProducts[idx] = { ...memoryDb.pharmacyProducts[idx], ...cleanData };
        await this.saveLocalBackup();
        return memoryDb.pharmacyProducts[idx];
      }
      return null;
    },
    async getLots() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacyLot.findMany();
        } catch (e) {
          console.error("Prisma getLots failed:", e);
        }
      }
      return memoryDb.pharmacyLots || [];
    },
    async addLot(lot: any) {
      await db.testConnection();
      const newId = lot.id || "lot-" + Math.random().toString(36).substr(2, 9);
      const lotData = {
        id: newId,
        productId: lot.productId || "",
        lotNumber: lot.lotNumber || "",
        dateFabrication: lot.dateFabrication || "",
        datePeremption: lot.datePeremption || "",
        qtyRecue: parseInt(lot.qtyRecue || 0),
        qtyRemainingDepot: parseInt(lot.qtyRemainingDepot || lot.qtyRecue || 0),
        qtyRemainingOfficine: parseInt(lot.qtyRemainingOfficine || 0),
        supplier: lot.supplier || "",
        priceAchat: parseFloat(lot.priceAchat || 0),
        attachmentName: lot.attachmentName || ""
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyLot.create({ data: lotData });
          memoryDb.pharmacyLots = memoryDb.pharmacyLots || [];
          memoryDb.pharmacyLots.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addLot failed:", e);
        }
      }

      if (!memoryDb.pharmacyLots) memoryDb.pharmacyLots = [];
      const backupObj = { ...lotData, createdAt: new Date().toISOString() };
      memoryDb.pharmacyLots.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async updateLot(id: string, data: any) {
      await db.testConnection();
      const cleanData: any = {};
      if (data.qtyRemainingDepot !== undefined) cleanData.qtyRemainingDepot = parseInt(data.qtyRemainingDepot);
      if (data.qtyRemainingOfficine !== undefined) cleanData.qtyRemainingOfficine = parseInt(data.qtyRemainingOfficine);
      if (data.datePeremption !== undefined) cleanData.datePeremption = data.datePeremption;

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyLot.update({ where: { id }, data: cleanData });
          const idx = memoryDb.pharmacyLots.findIndex((e: any) => e.id === id);
          if (idx > -1) {
            memoryDb.pharmacyLots[idx] = { ...memoryDb.pharmacyLots[idx], ...cleanData };
          }
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma updateLot failed:", e);
        }
      }

      const idx = memoryDb.pharmacyLots.findIndex((e: any) => e.id === id);
      if (idx > -1) {
        memoryDb.pharmacyLots[idx] = { ...memoryDb.pharmacyLots[idx], ...cleanData };
        await this.saveLocalBackup();
        return memoryDb.pharmacyLots[idx];
      }
      return null;
    },
    async getTransfers() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacyTransfer.findMany();
        } catch (e) {
          console.error("Prisma getTransfers failed:", e);
        }
      }
      return memoryDb.pharmacyTransfers || [];
    },
    async addTransfer(transfer: any) {
      await db.testConnection();
      const newId = transfer.id || "ph-trf-" + Math.random().toString(36).substr(2, 9);
      const trfData = {
        id: newId,
        productId: transfer.productId || "",
        lotId: transfer.lotId || "",
        quantity: parseInt(transfer.quantity || 0),
        userId: transfer.userId || "",
        userName: transfer.userName || "",
        status: transfer.status || "APPROVED",
        slipUrl: transfer.slipUrl || ""
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyTransfer.create({ data: trfData });
          memoryDb.pharmacyTransfers = memoryDb.pharmacyTransfers || [];
          memoryDb.pharmacyTransfers.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addTransfer failed:", e);
        }
      }

      if (!memoryDb.pharmacyTransfers) memoryDb.pharmacyTransfers = [];
      const backupObj = { ...trfData, date: new Date().toISOString() };
      memoryDb.pharmacyTransfers.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async getSales() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacySale.findMany({ orderBy: { date: "desc" } });
        } catch (e) {
          console.error("Prisma getSales failed:", e);
        }
      }
      return memoryDb.pharmacySales || [];
    },
    async addSale(sale: any) {
      await db.testConnection();
      const newId = sale.id || "ph-sale-" + Math.random().toString(36).substr(2, 9);
      const saleData = {
        id: newId,
        patientId: sale.patientId || "",
        patientName: sale.patientName || "Client Anonyme",
        cashierId: sale.cashierId || "",
        cashierName: sale.cashierName || "",
        total: parseFloat(sale.total || 0),
        discount: parseFloat(sale.discount || 0),
        insuranceContribution: parseFloat(sale.insuranceContribution || 0),
        amountPaid: parseFloat(sale.amountPaid || 0),
        paymentMethod: sale.paymentMethod || "CASH",
        items: sale.items || [],
        auditToken: sale.auditToken || ""
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacySale.create({ data: saleData });
          memoryDb.pharmacySales = memoryDb.pharmacySales || [];
          memoryDb.pharmacySales.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addSale failed:", e);
        }
      }

      if (!memoryDb.pharmacySales) memoryDb.pharmacySales = [];
      const backupObj = { ...saleData, date: new Date().toISOString() };
      memoryDb.pharmacySales.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async getSuppliers() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacySupplier.findMany();
        } catch (e) {
          console.error("Prisma getSuppliers failed:", e);
        }
      }
      return memoryDb.pharmacySuppliers || [];
    },
    async addSupplier(sup: any) {
      await db.testConnection();
      const newId = sup.id || "ph-sup-" + Math.random().toString(36).substr(2, 9);
      const supData = {
        id: newId,
        name: sup.name,
        contactName: sup.contactName || "",
        phone: sup.phone || "",
        email: sup.email || "",
        address: sup.address || ""
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacySupplier.create({ data: supData });
          memoryDb.pharmacySuppliers = memoryDb.pharmacySuppliers || [];
          memoryDb.pharmacySuppliers.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addSupplier failed:", e);
        }
      }

      if (!memoryDb.pharmacySuppliers) memoryDb.pharmacySuppliers = [];
      const backupObj = { ...supData, createdAt: new Date().toISOString() };
      memoryDb.pharmacySuppliers.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async updateSupplier(id: string, data: any) {
      await db.testConnection();
      const cleanData: any = {};
      if (data.name !== undefined) cleanData.name = data.name;
      if (data.contactName !== undefined) cleanData.contactName = data.contactName;
      if (data.phone !== undefined) cleanData.phone = data.phone;
      if (data.email !== undefined) cleanData.email = data.email;
      if (data.address !== undefined) cleanData.address = data.address;

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacySupplier.update({ where: { id }, data: cleanData });
          const idx = memoryDb.pharmacySuppliers.findIndex((e: any) => e.id === id);
          if (idx > -1) {
            memoryDb.pharmacySuppliers[idx] = { ...memoryDb.pharmacySuppliers[idx], ...cleanData };
          }
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma updateSupplier failed:", e);
        }
      }

      const idx = memoryDb.pharmacySuppliers.findIndex((e: any) => e.id === id);
      if (idx > -1) {
        memoryDb.pharmacySuppliers[idx] = { ...memoryDb.pharmacySuppliers[idx], ...cleanData };
        await this.saveLocalBackup();
        return memoryDb.pharmacySuppliers[idx];
      }
      return null;
    },
    async getAdjustments() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacyAdjustment.findMany({ orderBy: { date: "desc" } });
        } catch (e) {
          console.error("Prisma getAdjustments failed:", e);
        }
      }
      return memoryDb.pharmacyAdjustments || [];
    },
    async addAdjustment(adj: any) {
      await db.testConnection();
      const newId = adj.id || "ph-adj-" + Math.random().toString(36).substr(2, 9);
      const adjData = {
        id: newId,
        productId: adj.productId || "",
        lotId: adj.lotId || "",
        type: adj.type || "",
        qtyBefore: parseInt(adj.qtyBefore || 0),
        qtyAfter: parseInt(adj.qtyAfter || 0),
        difference: parseInt(adj.difference || 0),
        reason: adj.reason || "",
        userId: adj.userId || "",
        userName: adj.userName || "",
        targetStore: adj.targetStore || "OFFICINE"
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyAdjustment.create({ data: adjData });
          memoryDb.pharmacyAdjustments = memoryDb.pharmacyAdjustments || [];
          memoryDb.pharmacyAdjustments.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addAdjustment failed:", e);
        }
      }

      if (!memoryDb.pharmacyAdjustments) memoryDb.pharmacyAdjustments = [];
      const backupObj = { ...adjData, date: new Date().toISOString() };
      memoryDb.pharmacyAdjustments.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    async getDocuments() {
      await this.loadLocalBackup();
      return memoryDb.pharmacyDocuments || [];
    },
    async addDocument(doc: any) {
      if (!memoryDb.pharmacyDocuments) memoryDb.pharmacyDocuments = [];
      const newDoc = {
        id: doc.id || "ph-doc-" + Math.random().toString(36).substr(2, 9),
        ...doc,
        date: new Date().toISOString()
      };
      memoryDb.pharmacyDocuments.push(newDoc);
      await this.saveLocalBackup();
      return newDoc;
    },
    async getAlerts() {
      await this.loadLocalBackup();
      const products = await this.getProducts();
      const lots = await this.getLots();
      
      const alerts = [...(memoryDb.pharmacyAlerts || [])];
      const now = new Date();
      
      products.forEach((p: any) => {
        const totalQty = p.quantityOfficine + p.quantityDepot;
        if (totalQty === 0) {
          const alarmExists = alerts.find((al: any) => al.productId === p.id && al.type === "RUPTURE");
          if (!alarmExists) {
            alerts.push({
              id: "auto-al-rupt-" + p.id,
              productId: p.id,
              productName: p.nomCommercial,
              type: "RUPTURE",
              details: `Rupture totale de stock constatée pour ${p.nomCommercial}.`,
              status: "ACTIVE",
              date: new Date().toISOString()
            });
          }
        } else if (totalQty <= p.stockMin) {
          const alarmExists = alerts.find((al: any) => al.productId === p.id && al.type === "CRITICAL_STOCK");
          if (!alarmExists) {
            alerts.push({
              id: "auto-al-crit-" + p.id,
              productId: p.id,
              productName: p.nomCommercial,
              type: "CRITICAL_STOCK",
              details: `Seuil critique atteint pour ${p.nomCommercial} — Stock restant : ${totalQty} unités (Seuil: ${p.stockMin}).`,
              status: "ACTIVE",
              date: new Date().toISOString()
            });
          }
        }
      });

      lots.forEach((l: any) => {
        const pObj = products.find((pr: any) => pr.id === l.productId);
        if (!pObj) return;
        
        try {
          const expiryDate = new Date(l.datePeremption);
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const diffMonths = diffDays / 30.4;
          
          if (l.qtyRemainingDepot + l.qtyRemainingOfficine > 0) {
            if (diffDays <= 0) {
              const exists = alerts.find((al: any) => al.productId === l.productId && al.type === "EXPIRED" && al.details.includes(l.lotNumber));
              if (!exists) {
                alerts.push({
                  id: "auto-al-exp-" + l.id,
                  productId: l.productId,
                  productName: pObj.nomCommercial,
                  type: "EXPIRED",
                  details: `Le médicament ${pObj.nomCommercial} (Lot: ${l.lotNumber}) a expiré le ${l.datePeremption}.`,
                  status: "ACTIVE",
                  date: new Date().toISOString()
                });
              }
            } else if (diffMonths <= 1) {
              const exists = alerts.find((al: any) => al.productId === l.productId && al.type === "EXPIRING_1M" && al.details.includes(l.lotNumber));
              if (!exists) {
                alerts.push({
                  id: "auto-al-exp1-" + l.id,
                  productId: l.productId,
                  productName: pObj.nomCommercial,
                  type: "EXPIRING_1M",
                  details: `Le lot ${l.lotNumber} pour ${pObj.nomCommercial} expire dans moins de 1 mois (${l.datePeremption}).`,
                  status: "ACTIVE",
                  date: new Date().toISOString()
                });
              }
            } else if (diffMonths <= 3) {
              const exists = alerts.find((al: any) => al.productId === l.productId && al.type === "EXPIRING_3M" && al.details.includes(l.lotNumber));
              if (!exists) {
                alerts.push({
                  id: "auto-al-exp3-" + l.id,
                  productId: l.productId,
                  productName: pObj.nomCommercial,
                  type: "EXPIRING_3M",
                  details: `Le lot ${l.lotNumber} pour ${pObj.nomCommercial} expire dans moins de 3 mois (${l.datePeremption}).`,
                  status: "ACTIVE",
                  date: new Date().toISOString()
                });
              }
            }
          }
        } catch (e) {}
      });

      return alerts;
    },
    async addAlert(alert: any) {
      if (!memoryDb.pharmacyAlerts) memoryDb.pharmacyAlerts = [];
      const newAlert = {
        id: alert.id || "ph-al-" + Math.random().toString(36).substr(2, 9),
        ...alert,
        date: new Date().toISOString(),
        status: "ACTIVE"
      };
      memoryDb.pharmacyAlerts.push(newAlert);
      await this.saveLocalBackup();
      return newAlert;
    },
    async getPrescriptions() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacyPrescription.findMany({ orderBy: { date: "desc" } });
        } catch (e) {
          console.error("Prisma getPrescriptions failed:", e);
        }
      }
      return memoryDb.pharmacyPrescriptions || [];
    },
    async updatePrescriptionStatus(id: string, status: string, dispensedBy?: string, dispensedMedications?: any) {
      await db.testConnection();
      const updateData: any = { status };
      if (dispensedBy) updateData.dispensedBy = dispensedBy;
      if (dispensedMedications) {
        updateData.dispensedMedications = dispensedMedications;
        updateData.servedAt = new Date().toISOString();
      }

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyPrescription.update({ where: { id }, data: updateData });
          const idx = memoryDb.pharmacyPrescriptions.findIndex((e: any) => e.id === id);
          if (idx > -1) {
            memoryDb.pharmacyPrescriptions[idx] = { ...memoryDb.pharmacyPrescriptions[idx], ...updateData };
          }
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma updatePrescriptionStatus failed:", e);
        }
      }

      const idx = memoryDb.pharmacyPrescriptions.findIndex((e: any) => e.id === id);
      if (idx > -1) {
        memoryDb.pharmacyPrescriptions[idx] = { ...memoryDb.pharmacyPrescriptions[idx], ...updateData };
        await this.saveLocalBackup();
        return memoryDb.pharmacyPrescriptions[idx];
      }
      return null;
    },
    async addPrescription(p: any) {
      await db.testConnection();
      const newId = p.id || "ph-presc-" + Math.random().toString(36).substr(2, 9);
      const prescData = {
        id: newId,
        patientId: p.patientId || "",
        patientName: p.patientName || "",
        doctorName: p.doctorName || "",
        prescriptionText: p.prescriptionText || "",
        status: p.status || "PENDING",
        medications: p.medications || [],
        dispensedMedications: p.dispensedMedications || []
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyPrescription.create({ data: prescData });
          memoryDb.pharmacyPrescriptions = memoryDb.pharmacyPrescriptions || [];
          memoryDb.pharmacyPrescriptions.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addPrescription failed:", e);
        }
      }

      if (!memoryDb.pharmacyPrescriptions) memoryDb.pharmacyPrescriptions = [];
      const backupObj = { ...prescData, date: new Date().toISOString() };
      memoryDb.pharmacyPrescriptions.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    },
    // New Inventory models
    async getInventories() {
      await this.loadLocalBackup();
      await db.testConnection();
      if (!useBackupMemory) {
        try {
          return await getPrisma().pharmacyInventory.findMany({ orderBy: { date: "desc" } });
        } catch (e) {
          console.error("Prisma getInventories failed:", e);
        }
      }
      return (memoryDb as any).pharmacyInventories || [];
    },
    async addInventory(inv: any) {
      await db.testConnection();
      const newId = inv.id || "ph-inv-" + Math.random().toString(36).substr(2, 9);
      const invData = {
        id: newId,
        type: inv.type || "ANNUEL",
        responsibleSignature: inv.responsibleSignature || "",
        userName: inv.userName || "",
        discrepancyReport: inv.discrepancyReport || [],
        status: inv.status || "COMPLETED"
      };

      if (!useBackupMemory) {
        try {
          const res = await getPrisma().pharmacyInventory.create({ data: invData });
          if (!(memoryDb as any).pharmacyInventories) (memoryDb as any).pharmacyInventories = [];
          (memoryDb as any).pharmacyInventories.push(res);
          await this.saveLocalBackup();
          return res;
        } catch (e) {
          console.error("Prisma addInventory failed:", e);
        }
      }

      if (!(memoryDb as any).pharmacyInventories) (memoryDb as any).pharmacyInventories = [];
      const backupObj = { ...invData, date: new Date().toISOString() };
      (memoryDb as any).pharmacyInventories.push(backupObj);
      await this.saveLocalBackup();
      return backupObj;
    }
  },

  // DMG STAFF MODEL ACTIONS
  dmgStaff: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgStaff) (memoryDb as any).dmgStaff = [];
        return (memoryDb as any).dmgStaff;
      }
      try {
        return await getPrisma().dmgStaff.findMany();
      } catch (err) {
        console.error("Prisma dmgStaff findMany failed, falling back", err);
        return (memoryDb as any).dmgStaff || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: data.id || "staff-" + Math.random().toString(36).substr(2, 9),
        userId: data.userId,
        teamName: data.teamName || "Non assigne",
        status: data.status || "ACTIVE",
        availability: data.availability || "AVAILABLE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgStaff) (memoryDb as any).dmgStaff = [];
        const idxCheck = (memoryDb as any).dmgStaff.findIndex((s: any) => s.userId === data.userId);
        if (idxCheck > -1) {
          (memoryDb as any).dmgStaff[idxCheck] = { ...(memoryDb as any).dmgStaff[idxCheck], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgStaff[idxCheck];
        }
        (memoryDb as any).dmgStaff.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().dmgStaff.upsert({
          where: { userId: data.userId },
          update: {
            teamName: data.teamName,
            status: data.status,
            availability: data.availability,
            updatedAt: new Date()
          },
          create: {
            userId: data.userId,
            teamName: data.teamName || "Non assigne",
            status: data.status || "ACTIVE",
            availability: data.availability || "AVAILABLE"
          }
        });
      } catch (err) {
        console.error("Prisma dmgStaff upsert failed, using memory", err);
        if (!(memoryDb as any).dmgStaff) (memoryDb as any).dmgStaff = [];
        const idxCheck = (memoryDb as any).dmgStaff.findIndex((s: any) => s.userId === data.userId);
        if (idxCheck > -1) {
          (memoryDb as any).dmgStaff[idxCheck] = { ...(memoryDb as any).dmgStaff[idxCheck], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgStaff[idxCheck];
        }
        (memoryDb as any).dmgStaff.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    },
    async update(userId: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgStaff) (memoryDb as any).dmgStaff = [];
        const idx = (memoryDb as any).dmgStaff.findIndex((s: any) => s.userId === userId);
        if (idx > -1) {
          (memoryDb as any).dmgStaff[idx] = { ...(memoryDb as any).dmgStaff[idx], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgStaff[idx];
        }
        return null;
      }
      try {
        return await getPrisma().dmgStaff.update({
          where: { userId },
          data: {
            ...data,
            updatedAt: new Date()
          }
        });
      } catch (err) {
        console.error("Prisma dmgStaff update failed, using memory", err);
        if (!(memoryDb as any).dmgStaff) (memoryDb as any).dmgStaff = [];
        const idx = (memoryDb as any).dmgStaff.findIndex((s: any) => s.userId === userId);
        if (idx > -1) {
          (memoryDb as any).dmgStaff[idx] = { ...(memoryDb as any).dmgStaff[idx], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgStaff[idx];
        }
        return null;
      }
    }
  },

  // DMG GUARD PLANNING ACTIONS
  dmgGuardPlanning: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgGuardPlanning) (memoryDb as any).dmgGuardPlanning = [];
        return (memoryDb as any).dmgGuardPlanning;
      }
      try {
        return await getPrisma().dmgGuardPlanning.findMany({ orderBy: { createdAt: "desc" } });
      } catch (err) {
        console.error("Prisma dmgGuardPlanning findMany failed", err);
        return (memoryDb as any).dmgGuardPlanning || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "guard-" + Math.random().toString(36).substr(2, 9),
        shiftType: data.shiftType,
        date: data.date,
        responsibleId: data.responsibleId,
        responsibleName: data.responsibleName,
        referentDocId: data.referentDocId,
        referentDocName: data.referentDocName,
        staffIdsAndNames: typeof data.staffIdsAndNames === "string" ? data.staffIdsAndNames : JSON.stringify(data.staffIdsAndNames),
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgGuardPlanning) (memoryDb as any).dmgGuardPlanning = [];
        (memoryDb as any).dmgGuardPlanning.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().dmgGuardPlanning.create({ data: newItem });
      } catch (err) {
        console.error("Prisma dmgGuardPlanning create failed", err);
        if (!(memoryDb as any).dmgGuardPlanning) (memoryDb as any).dmgGuardPlanning = [];
        (memoryDb as any).dmgGuardPlanning.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    }
  },

  // DMG DELEGATED CARE ACTIONS
  dmgDelegatedCare: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgDelegatedCare) (memoryDb as any).dmgDelegatedCare = [];
        return (memoryDb as any).dmgDelegatedCare;
      }
      try {
        return await getPrisma().dmgDelegatedCare.findMany({ orderBy: { createdAt: "desc" } });
      } catch (err) {
        console.error("Prisma dmgDelegatedCare findMany failed", err);
        return (memoryDb as any).dmgDelegatedCare || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "care-" + Math.random().toString(36).substr(2, 9),
        patientId: data.patientId,
        patientName: data.patientName,
        roomNumber: data.roomNumber || "N/A",
        bedNumber: data.bedNumber || "N/A",
        careType: data.careType,
        description: data.description,
        priority: data.priority || "MEDIUM",
        prescriberId: data.prescriberId,
        prescriberName: data.prescriberName,
        agentId: data.agentId || null,
        agentName: data.agentName || null,
        scheduledTime: data.scheduledTime,
        executedTime: data.executedTime || null,
        date: data.date,
        status: data.status || "PENDING",
        observations: data.observations || null,
        logs: data.logs || "Soin prescrit et enregistre dans le workflow.",
        difficultyAlert: data.difficultyAlert || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgDelegatedCare) (memoryDb as any).dmgDelegatedCare = [];
        (memoryDb as any).dmgDelegatedCare.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().dmgDelegatedCare.create({ data: newItem });
      } catch (err) {
        console.error("Prisma dmgDelegatedCare create failed", err);
        if (!(memoryDb as any).dmgDelegatedCare) (memoryDb as any).dmgDelegatedCare = [];
        (memoryDb as any).dmgDelegatedCare.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgDelegatedCare) (memoryDb as any).dmgDelegatedCare = [];
        const idx = (memoryDb as any).dmgDelegatedCare.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          (memoryDb as any).dmgDelegatedCare[idx] = { ...(memoryDb as any).dmgDelegatedCare[idx], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgDelegatedCare[idx];
        }
        return null;
      }
      try {
        return await getPrisma().dmgDelegatedCare.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date()
          }
        });
      } catch (err) {
        console.error("Prisma dmgDelegatedCare update failed", err);
        if (!(memoryDb as any).dmgDelegatedCare) (memoryDb as any).dmgDelegatedCare = [];
        const idx = (memoryDb as any).dmgDelegatedCare.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          (memoryDb as any).dmgDelegatedCare[idx] = { ...(memoryDb as any).dmgDelegatedCare[idx], ...data, updatedAt: new Date().toISOString() };
          return (memoryDb as any).dmgDelegatedCare[idx];
        }
        return null;
      }
    }
  },

  // DMG SHIFT HANDOVER ACTIONS
  dmgShiftHandover: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgShiftHandover) (memoryDb as any).dmgShiftHandover = [];
        return (memoryDb as any).dmgShiftHandover;
      }
      try {
        return await getPrisma().dmgShiftHandover.findMany({ orderBy: { createdAt: "desc" } });
      } catch (err) {
        console.error("Prisma dmgShiftHandover findMany failed", err);
        return (memoryDb as any).dmgShiftHandover || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "handover-" + Math.random().toString(36).substr(2, 9),
        fromShift: data.fromShift,
        toShift: data.toShift,
        date: data.date,
        senderName: data.senderName,
        criticalCases: data.criticalCases,
        pendingCares: data.pendingCares,
        pendingLabs: data.pendingLabs,
        incidents: data.incidents,
        status: data.status || "TRANSMITTED",
        validatedBy: data.validatedBy || null,
        validatedAt: data.validatedAt || null,
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgShiftHandover) (memoryDb as any).dmgShiftHandover = [];
        (memoryDb as any).dmgShiftHandover.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().dmgShiftHandover.create({ data: newItem });
      } catch (err) {
        console.error("Prisma dmgShiftHandover create failed", err);
        if (!(memoryDb as any).dmgShiftHandover) (memoryDb as any).dmgShiftHandover = [];
        (memoryDb as any).dmgShiftHandover.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgShiftHandover) (memoryDb as any).dmgShiftHandover = [];
        const idx = (memoryDb as any).dmgShiftHandover.findIndex((h: any) => h.id === id);
        if (idx > -1) {
          (memoryDb as any).dmgShiftHandover[idx] = { ...(memoryDb as any).dmgShiftHandover[idx], ...data };
          return (memoryDb as any).dmgShiftHandover[idx];
        }
        return null;
      }
      try {
        return await getPrisma().dmgShiftHandover.update({
          where: { id },
          data
        });
      } catch (err) {
        console.error("Prisma dmgShiftHandover update failed", err);
        if (!(memoryDb as any).dmgShiftHandover) (memoryDb as any).dmgShiftHandover = [];
        const idx = (memoryDb as any).dmgShiftHandover.findIndex((h: any) => h.id === id);
        if (idx > -1) {
          (memoryDb as any).dmgShiftHandover[idx] = { ...(memoryDb as any).dmgShiftHandover[idx], ...data };
          return (memoryDb as any).dmgShiftHandover[idx];
        }
        return null;
      }
    }
  },

  // DMG MAIN COURANTE ACTIONS
  dmgMainCouranteEntry: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgMainCouranteEntry) (memoryDb as any).dmgMainCouranteEntry = [];
        return (memoryDb as any).dmgMainCouranteEntry;
      }
      try {
        return await getPrisma().dmgMainCouranteEntry.findMany({ orderBy: { createdAt: "desc" } });
      } catch (err) {
        console.error("Prisma dmgMainCouranteEntry findMany failed", err);
        return (memoryDb as any).dmgMainCouranteEntry || [];
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "entry-" + Math.random().toString(36).substr(2, 9),
        category: data.category,
        author: data.author,
        details: data.details,
        date: data.date,
        time: data.time,
        service: data.service || "DMG",
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).dmgMainCouranteEntry) (memoryDb as any).dmgMainCouranteEntry = [];
        (memoryDb as any).dmgMainCouranteEntry.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().dmgMainCouranteEntry.create({ data: newItem });
      } catch (err) {
        console.error("Prisma dmgMainCouranteEntry create failed", err);
        if (!(memoryDb as any).dmgMainCouranteEntry) (memoryDb as any).dmgMainCouranteEntry = [];
        (memoryDb as any).dmgMainCouranteEntry.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    }
  },

  clinicalVersions: {
    async findMany(entityId?: string) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).clinicalVersions) (memoryDb as any).clinicalVersions = [];
        const list = (memoryDb as any).clinicalVersions;
        if (entityId) return list.filter((v: any) => v.entityId === entityId);
        return list;
      }
      try {
        return await getPrisma().clinicalVersion.findMany({
          where: entityId ? { entityId } : undefined,
          orderBy: { timestamp: "desc" }
        });
      } catch (err) {
        if (!(memoryDb as any).clinicalVersions) (memoryDb as any).clinicalVersions = [];
        const list = (memoryDb as any).clinicalVersions;
        if (entityId) return list.filter((v: any) => v.entityId === entityId);
        return list;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "version-" + Math.random().toString(36).substr(2, 9),
        ...data,
        timestamp: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).clinicalVersions) (memoryDb as any).clinicalVersions = [];
        (memoryDb as any).clinicalVersions.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().clinicalVersion.create({ data: {
          id: newItem.id,
          entityType: newItem.entityType,
          entityId: newItem.entityId,
          previousContent: newItem.previousContent,
          newContent: newItem.newContent,
          authorId: newItem.authorId,
          authorName: newItem.authorName,
          authorRole: newItem.authorRole,
          reason: newItem.reason,
          timestamp: new Date()
        } });
      } catch (err) {
        console.error("Prisma clinicalVersion create failed", err);
        if (!(memoryDb as any).clinicalVersions) (memoryDb as any).clinicalVersions = [];
        (memoryDb as any).clinicalVersions.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    }
  },

  medicalLibrary: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        return (memoryDb as any).medicalLibrary;
      }
      try {
        const list = await getPrisma().medicalLibraryItem.findMany();
        if (list.length === 0) {
          const seeds = [
            { trigger: "@para", label: "💊 Paracétamol 500mg", text: "Paracétamol 500mg : 1 cp toutes les 6h en cas de fievre ou douleurs (Max 4 cp/jour).", category: "MEDICAMENT" },
            { trigger: "@amox", label: "💊 Amoxicilline 1g", text: "Amoxicilline 1g : 1 cp matin, midi et soir pendant 6 jours au milieu des repas.", category: "MEDICAMENT" },
            { trigger: "@artem", label: "💊 Arteméther Coartem", text: "Artéméther/Luméfantrine (Coartem) : 1 cp à H0, H8, puis 1 cp matin et soir pendant 3 jours.", category: "MEDICAMENT" },
            { trigger: "@spas", label: "💊 Spasfon 80mg", text: "Spasfon (Phloroglucinol) : 1 cp à renouveler en cas de contractures douloureuses.", category: "MEDICAMENT" },
            { trigger: "@dolo", label: "💊 Dolusrène Inj IM", text: "Dolusrène : 1 ampoule injectable IM si douleur rebelle.", category: "MEDICAMENT" },
            { trigger: "@nfs", label: "🧪 NFS / Hémogramme", text: "Numération Formule Sanguine (NFS / Hémogramme)", category: "BIOLOGIE" },
            { trigger: "@gly", label: "🧪 Glycémie à jeun", text: "Glycémie à jeun", category: "BIOLOGIE" },
            { trigger: "@ecbu", label: "🧪 ECBU (Urine)", text: "Examen Cytobactériologique des Urines (ECBU)", category: "BIOLOGIE" },
            { trigger: "@ge", label: "🧪 Goutte Épaisse (GE)", text: "Goutte Épaisse (GE) & TDR Paludisme", category: "BIOLOGIE" },
            { trigger: "@perf", label: "🩹 Perfusion G5%", text: "Perfusion intraveineuse lente de sérum glucosé 5% avec ampoules d'électrolytes.", category: "SOIN" },
            { trigger: "@pans", label: "🩹 Pansement stérile", text: "Refaire pansement chirurgical stérile, nettoyage bétadine et surveillance locale.", category: "SOIN" },
            { trigger: "@inj", label: "🩹 Injection SC Lovenox", text: "Injection sous-cutanée de Lovenox 0.4ml, surveillance locale.", category: "SOIN" }
          ];
          for (const s of seeds) {
            await getPrisma().medicalLibraryItem.create({ data: s });
          }
          return getPrisma().medicalLibraryItem.findMany();
        }
        return list;
      } catch (err) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        return (memoryDb as any).medicalLibrary;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "lib-" + Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        (memoryDb as any).medicalLibrary.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
      try {
        return await getPrisma().medicalLibraryItem.create({ data: {
          id: newItem.id,
          trigger: newItem.trigger,
          label: newItem.label,
          text: newItem.text,
          category: newItem.category
        } });
      } catch (err) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        (memoryDb as any).medicalLibrary.push(newItem);
        await db.pharmacy.saveLocalBackup();
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        const idx = (memoryDb as any).medicalLibrary.findIndex((x: any) => x.id === id);
        if (idx > -1) {
          (memoryDb as any).medicalLibrary[idx] = { ...(memoryDb as any).medicalLibrary[idx], ...data };
          await db.pharmacy.saveLocalBackup();
          return (memoryDb as any).medicalLibrary[idx];
        }
        return null;
      }
      try {
        return await getPrisma().medicalLibraryItem.update({ where: { id }, data });
      } catch (err) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        const idx = (memoryDb as any).medicalLibrary.findIndex((x: any) => x.id === id);
        if (idx > -1) {
          (memoryDb as any).medicalLibrary[idx] = { ...(memoryDb as any).medicalLibrary[idx], ...data };
          await db.pharmacy.saveLocalBackup();
          return (memoryDb as any).medicalLibrary[idx];
        }
        return null;
      }
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        const idx = (memoryDb as any).medicalLibrary.findIndex((x: any) => x.id === id);
        if (idx > -1) {
          const item = (memoryDb as any).medicalLibrary[idx];
          (memoryDb as any).medicalLibrary.splice(idx, 1);
          await db.pharmacy.saveLocalBackup();
          return item;
        }
        return null;
      }
      try {
        return await getPrisma().medicalLibraryItem.delete({ where: { id } });
      } catch (err) {
        if (!(memoryDb as any).medicalLibrary) (memoryDb as any).medicalLibrary = [];
        const idx = (memoryDb as any).medicalLibrary.findIndex((x: any) => x.id === id);
        if (idx > -1) {
          const item = (memoryDb as any).medicalLibrary[idx];
          (memoryDb as any).medicalLibrary.splice(idx, 1);
          await db.pharmacy.saveLocalBackup();
          return item;
        }
        return null;
      }
    }
  },

  contacts: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.contacts;
      try {
        return await getPrisma().contact.findMany({ orderBy: { lastName: "asc" } });
      } catch (err) {
        return memoryDb.contacts;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "con-" + Math.random().toString(36).substr(2, 9),
        lastName: data.lastName,
        firstName: data.firstName,
        phone: data.phone || "",
        email: data.email,
        category: data.category,
        status: data.status || "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.contacts.push(newItem);
        return newItem;
      }
      try {
        return await getPrisma().contact.create({ data: newItem });
      } catch (err) {
        memoryDb.contacts.push(newItem);
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.contacts.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          memoryDb.contacts[idx] = { ...memoryDb.contacts[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.contacts[idx];
        }
        return null;
      }
      try {
        return await getPrisma().contact.update({ where: { id }, data });
      } catch (err) {
        const idx = memoryDb.contacts.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          memoryDb.contacts[idx] = { ...memoryDb.contacts[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.contacts[idx];
        }
        return null;
      }
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.contacts.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          const removed = memoryDb.contacts[idx];
          memoryDb.contacts.splice(idx, 1);
          return removed;
        }
        return null;
      }
      try {
        return await getPrisma().contact.delete({ where: { id } });
      } catch (err) {
        const idx = memoryDb.contacts.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          const removed = memoryDb.contacts[idx];
          memoryDb.contacts.splice(idx, 1);
          return removed;
        }
        return null;
      }
    }
  },

  contactGroups: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.contactGroups;
      try {
        return await getPrisma().contactGroup.findMany({ orderBy: { name: "asc" } });
      } catch (err) {
        return memoryDb.contactGroups;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "grp-" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        details: data.details || "",
        createdAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.contactGroups.push(newItem);
        return newItem;
      }
      try {
        return await getPrisma().contactGroup.create({ data: newItem });
      } catch (err) {
        memoryDb.contactGroups.push(newItem);
        return newItem;
      }
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.contactGroups.findIndex((g: any) => g.id === id);
        if (idx > -1) {
          const removed = memoryDb.contactGroups[idx];
          memoryDb.contactGroups.splice(idx, 1);
          return removed;
        }
        return null;
      }
      try {
        return await getPrisma().contactGroup.delete({ where: { id } });
      } catch (err) {
        const idx = memoryDb.contactGroups.findIndex((g: any) => g.id === id);
        if (idx > -1) {
          const removed = memoryDb.contactGroups[idx];
          memoryDb.contactGroups.splice(idx, 1);
          return removed;
        }
        return null;
      }
    }
  },

  emailTemplates: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.emailTemplates;
      try {
        return await getPrisma().emailTemplate.findMany({ orderBy: { name: "asc" } });
      } catch (err) {
        return memoryDb.emailTemplates;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "tpl-" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        subject: data.subject,
        body: data.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.emailTemplates.push(newItem);
        return newItem;
      }
      try {
        return await getPrisma().emailTemplate.create({ data: newItem });
      } catch (err) {
        memoryDb.emailTemplates.push(newItem);
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.emailTemplates.findIndex((t: any) => t.id === id);
        if (idx > -1) {
          memoryDb.emailTemplates[idx] = { ...memoryDb.emailTemplates[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.emailTemplates[idx];
        }
        return null;
      }
      try {
        return await getPrisma().emailTemplate.update({ where: { id }, data });
      } catch (err) {
        const idx = memoryDb.emailTemplates.findIndex((t: any) => t.id === id);
        if (idx > -1) {
          memoryDb.emailTemplates[idx] = { ...memoryDb.emailTemplates[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.emailTemplates[idx];
        }
        return null;
      }
    },
    async delete(id: string) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.emailTemplates.findIndex((t: any) => t.id === id);
        if (idx > -1) {
          const removed = memoryDb.emailTemplates[idx];
          memoryDb.emailTemplates.splice(idx, 1);
          return removed;
        }
        return null;
      }
      try {
        return await getPrisma().emailTemplate.delete({ where: { id } });
      } catch (err) {
        const idx = memoryDb.emailTemplates.findIndex((t: any) => t.id === id);
        if (idx > -1) {
          const removed = memoryDb.emailTemplates[idx];
          memoryDb.emailTemplates.splice(idx, 1);
          return removed;
        }
        return null;
      }
    }
  },

  emailCampaigns: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.emailCampaigns;
      try {
        return await getPrisma().emailCampaign.findMany({ orderBy: { createdAt: "desc" } });
      } catch (err) {
        return memoryDb.emailCampaigns;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "cmp-" + Math.random().toString(36).substr(2, 9),
        name: data.name,
        subject: data.subject,
        body: data.body,
        targetGroup: data.targetGroup,
        sentCount: data.sentCount || 0,
        openCount: data.openCount || 0,
        failCount: data.failCount || 0,
        status: data.status || "DRAFT",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.emailCampaigns.unshift(newItem);
        return newItem;
      }
      try {
        return await getPrisma().emailCampaign.create({ data: newItem });
      } catch (err) {
        memoryDb.emailCampaigns.unshift(newItem);
        return newItem;
      }
    },
    async update(id: string, data: any) {
      await db.testConnection();
      if (useBackupMemory) {
        const idx = memoryDb.emailCampaigns.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          memoryDb.emailCampaigns[idx] = { ...memoryDb.emailCampaigns[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.emailCampaigns[idx];
        }
        return null;
      }
      try {
        return await getPrisma().emailCampaign.update({ where: { id }, data });
      } catch (err) {
        const idx = memoryDb.emailCampaigns.findIndex((c: any) => c.id === id);
        if (idx > -1) {
          memoryDb.emailCampaigns[idx] = { ...memoryDb.emailCampaigns[idx], ...data, updatedAt: new Date().toISOString() };
          return memoryDb.emailCampaigns[idx];
        }
        return null;
      }
    }
  },

  emailLogs: {
    async findMany() {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.emailLogs;
      try {
        return await getPrisma().emailLog.findMany({ orderBy: { timestamp: "desc" } });
      } catch (err) {
        return memoryDb.emailLogs;
      }
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "log-mail-" + Math.random().toString(36).substr(2, 9),
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        category: data.category,
        subject: data.subject,
        body: data.body,
        status: data.status || "SENT",
        senderName: data.senderName,
        timestamp: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.emailLogs.unshift(newItem);
        return newItem;
      }
      try {
        return await getPrisma().emailLog.create({ data: newItem });
      } catch (err) {
        memoryDb.emailLogs.unshift(newItem);
        return newItem;
      }
    }
  },

  roles: {
    async findMany() {
      await db.testConnection();
      return memoryDb.roles;
    },
    async create(data: any) {
      await db.testConnection();
      const code = data.code || data.label.toUpperCase().replace(/[^A-Z0-9_]+/g, "_");
      const newItem = {
        id: "role-" + Math.random().toString(36).substr(2, 9),
        label: data.label,
        code: code,
        order: data.order || (memoryDb.roles.length + 1)
      };
      memoryDb.roles.push(newItem);
      return newItem;
    },
    async update(id: string, data: any) {
      await db.testConnection();
      const idx = memoryDb.roles.findIndex(r => r.id === id || r.code === id);
      if (idx > -1) {
        memoryDb.roles[idx] = { ...memoryDb.roles[idx], ...data };
        return memoryDb.roles[idx];
      }
      return null;
    },
    async delete(id: string) {
      await db.testConnection();
      const idx = memoryDb.roles.findIndex(r => r.id === id || r.code === id);
      if (idx > -1) {
        const deleted = memoryDb.roles.splice(idx, 1)[0];
        return deleted;
      }
      return null;
    }
  },

  get useBackupMemory() {
    return useBackupMemory;
  },
  getPrisma() {
    return getPrisma();
  }
};
