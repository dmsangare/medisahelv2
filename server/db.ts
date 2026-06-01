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
      themeColor: "#0f766e" // teal-700
    },
    {
      id: "clinic-2",
      name: "MédiSahel Centre Médical Ségou",
      logoUrl: "Ségou Fleuve",
      address: "Quartier Administratif, Ségou, Mali",
      currency: "FCFA",
      themeColor: "#1e3a8a" // blue-900
    },
    {
      id: "clinic-3",
      name: "MédiSahel Polyclinique Mopti",
      logoUrl: "Mopti Falaise",
      address: "Rond-point de l'Indépendance, Mopti, Mali",
      currency: "FCFA",
      themeColor: "#e11d48" // rose-600
    }
  ] as any[],

  users: [
    {
      id: "user-admin",
      email: "admin@medisahel.ml",
      passwordHash: bcrypt.hashSync("admin123", 10),
      name: "Adama SANGARÉ",
      role: "ADMIN",
      mustChangePassword: true, // MUST change password on first login!
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-doctor",
      email: "doctor@medisahel.ml",
      passwordHash: bcrypt.hashSync("doctor123", 10),
      name: "Dr. Ibrahim TOURÉ",
      role: "DOCTOR",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-nurse",
      email: "nurse@medisahel.ml",
      passwordHash: bcrypt.hashSync("nurse123", 10),
      name: "Fatoumata DIARRA",
      role: "NURSE",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-cashier",
      email: "cashier@medisahel.ml",
      passwordHash: bcrypt.hashSync("cashier123", 10),
      name: "Ousmane KEITA",
      role: "CASHIER",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-pharmacist",
      email: "pharmacist@medisahel.ml",
      passwordHash: bcrypt.hashSync("pharmacist123", 10),
      name: "Aminata DEMBÉLÉ",
      role: "PHARMACIST",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-lab",
      email: "labtech@medisahel.ml",
      passwordHash: bcrypt.hashSync("labtech123", 10),
      name: "Dr. Moussa COULIBALY",
      role: "LAB_TECH",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
    },
    {
      id: "user-hr",
      email: "hr@medisahel.ml",
      passwordHash: bcrypt.hashSync("hr123", 10),
      name: "Awa DIALLO",
      role: "HR",
      mustChangePassword: false,
      clinicId: "clinic-1",
      status: "ACTIVE"
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
      bedNumber: "Lit A-12",
      roomNumber: "Chambre 320",
      admissionDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      dischargeDate: null,
      reason: "Crise de paludisme sévère avec déshydratation",
      status: "ADMITTED",
      notes: "Mise sous perfusion saline. Température à surveiller toutes les 2 heures."
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
      if (useBackupMemory) return memoryDb.users.map(({ passwordHash, ...u }) => u);
      return getPrisma().user.findMany({ select: { id: true, email: true, name: true, role: true, mustChangePassword: true, clinicId: true, status: true, createdAt: true } });
    },
    async findUnique(id: string) {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.users.find(u => u.id === id) || null;
      return getPrisma().user.findUnique({ where: { id } });
    },
    async findByEmail(email: string) {
      await db.testConnection();
      if (useBackupMemory) return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      return getPrisma().user.findFirst({ where: { email } });
    },
    async create(data: any) {
      await db.testConnection();
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(data.password || "welcome123", salt);
      
      const newUser = {
        id: "user-" + Math.random().toString(36).substr(2, 9),
        email: data.email,
        passwordHash: hash,
        name: data.name,
        role: data.role || "DOCTOR",
        mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
        clinicId: data.clinicId || "clinic-1",
        status: "ACTIVE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (useBackupMemory) {
        memoryDb.users.push(newUser);
        const { passwordHash, ...u } = newUser;
        return u;
      }

      return getPrisma().user.create({
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
          return u;
        }
        return null;
      }

      return getPrisma().user.update({
        where: { id },
        data: updatePayload
      });
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
      const newItem = {
        id: "patient-" + Math.random().toString(36).substr(2, 9),
        ...data,
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
      const newItem = {
        id: "hosp-" + Math.random().toString(36).substr(2, 9),
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
      if (useBackupMemory) return memoryDb.documents;
      return getPrisma().document.findMany({ orderBy: { createdAt: "desc" } });
    },
    async create(data: any) {
      await db.testConnection();
      const newItem = {
        id: "doc-" + Math.random().toString(36).substr(2, 9),
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (useBackupMemory) {
        memoryDb.documents.push(newItem);
        return newItem;
      }
      return getPrisma().document.create({ data: newItem });
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
  }
};
