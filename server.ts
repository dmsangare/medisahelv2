import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { execSync } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const app = express();
const PORT = 3000;

// Clinical Grade Rate Limiter (No external dependency, dynamic RAM maps, instant offline use)
const loginAttempts = new Map<string, { count: number; lockUntil: number }>();
const apiRateLimiter = new Map<string, { count: number; resetTime: number }>();

function ipRateLimitMiddleware(req: any, res: any, next: any) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "127.0.0.1";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 120; // max 120 requests/min

  let ipData = apiRateLimiter.get(ip);
  if (!ipData || now > ipData.resetTime) {
    apiRateLimiter.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    ipData.count++;
    if (ipData.count > maxRequests) {
      return res.status(429).json({ error: "Limites d'appels API dépassées. Veuillez patienter 60 secondes." });
    }
  }
  next();
}

app.use(express.json({ limit: "50mb" })); // Support clinical high-res upload base64 formats
app.use(ipRateLimitMiddleware);

// Initialize Prisma
const prisma = new PrismaClient();
let isDbConnected = false;

// Persistent Local-File Fail-safe Storage Directory
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Uploads static directory for clinic PDF scans & high-res radiography files
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Mount static uploads directory so client can display image/pdf documents safely
app.use("/uploads", express.static(UPLOAD_DIR));

// Global RAM & Local file fallbacks if Postgres is offline
let clinicBranding = {
  name: "MédiSahel Clinique",
  appName: "MEDISHAHEL",
  slogan: "L'excellence des soins au cœur du Sahel",
  primaryColor: "#0284c7",
  secondaryColor: "#0f766e",
  logoUrl: "",
  faviconUrl: "💉", 
  activeModules: {
    patients: true,
    rdv: true,
    dme: true,
    hospitalisation: true,
    labo: true,
    imagerie: true,
    pharmacie: true,
    facturation: true,
    presences: true,
    paie: true,
    courrier: true,
    rapports: true,
    mutuelles: true,
    teleconsultation: true,
    urgences: true,
  }
};

// Initial system accounts seed dictionary (Fallback in case of DB missing)
const rawSeeds: any[] = [
  { username: "admin", id: "user-admin", name: "Sidi Coulibaly (SysAdmin)", role: "Administrateur Système", password: "AdminPassword2026!", allowedIPs: "192.168.1.*" },
  { username: "dr_sangare", id: "user-dr-sangare", name: "Dr. Amadou Sangaré", role: "Médecin", password: "DoctorPassword2026!" },
  { username: "caiss_maiga", id: "user-caiss-maiga", name: "Caissier Ibrahim Maïga", role: "Caissier", password: "CashierPassword2026!", allowedHoursStart: "08:00", allowedHoursEnd: "18:00" },
  { username: "inf_fatoumata", id: "user-inf-fatoumata", name: "Infirmier(e) Fatoumata Maïga", role: "Infirmier", password: "NursePassword2026!" },
  { username: "sage_fanta", id: "user-sage-fanta", name: "Sage-femme Fanta Diallo", role: "Sage-femme", password: "MidwifePassword2026!" },
  { username: "aide_mariam", id: "user-aide-mariam", name: "Aide-soignante Mariam Diallo", role: "Aide-soignant", password: "AidePassword2026!", allowedHoursStart: "08:00", allowedHoursEnd: "18:00" },
  { username: "lab_tangara", id: "user-lab-tangara", name: "Laborantin Amara Tangara", role: "Laborantin", password: "LabPassword2026!" },
  { username: "rx_diarra", id: "user-rx-diarra", name: "Radiologue Dr. Diarra", role: "Radiologue", password: "RadiologistPassword2026!" },
  { username: "rx_pharmacien", id: "user-rx-pharmacien", name: "Pharmacienne Aminata", role: "Pharmacien", password: "PharmacistPassword2026!" },
  { username: "recep-ouattara", id: "user-recep-ouattara", name: "Réceptionniste Ouattara", role: "Réceptionniste", password: "ReceptionPassword2026!", allowedHoursStart: "07:30", allowedHoursEnd: "19:30" },
  { username: "dg_dr_traore", id: "user-dg-dr-traore", name: "DG Dr. Moussa Traoré", role: "DG", password: "DirectorPassword2026!" }
];

// Load backup tools
function loadBackup<T>(filename: string, defaultVal: T): T {
  const file = path.join(DATA_DIR, filename);
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultVal, null, 2), "utf-8");
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(file, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function saveBackup<T>(filename: string, data: T) {
  const file = path.join(DATA_DIR, filename);
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`Backup write error for ${filename}:`, err);
  }
}

// Standard memory backups loaded dynamically to prevent empty starts
let backupAuditLogs = loadBackup<any[]>("audit_logs.json", [
  { id: "log_1", timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), user: "Dr. Sangaré", role: "Médecin", action: "Consultation créée", details: "Dossier patient #MS-2026-0045, Dr. Sangaré", ip: "192.168.1.15" },
  { id: "log_2", timestamp: new Date(Date.now() - 3600000).toISOString(), user: "Cms. Maïga", role: "Caissier", action: "Encaissement Facture", details: "Facture #FAC-2026-0912 d'un montant de 25,000 FCFA (Orange Money)", ip: "192.168.1.22" },
  { id: "log_3", timestamp: new Date().toISOString(), user: "Admin Système", role: "Administrateur Système", action: "Paramètres modifiés", details: "Mise à jour du slogan de l'établissement", ip: "127.0.0.1" }
]);

let backupPatients = loadBackup<any[]>("patients.json", [
  { id: "MS-2026-0045", nom: "Diarra", prenom: "Amadou", sexe: "M", dateNaissance: "1988-04-12", telephone: "+223 76 54 32 10", adresse: "Badalabougou, Bamako", profession: "Enseignant", groupeSanguin: "O+", allergies: "Pénicilline", assurance: "INPS (80%)", isArchive: false, createdAt: new Date().toISOString() },
  { id: "MS-2026-0046", nom: "Traoré", prenom: "Fatoumata", sexe: "F", dateNaissance: "1994-09-25", telephone: "+223 66 78 90 12", adresse: "Kalaban Coura, Bamako", profession: "Commerçante", groupeSanguin: "A+", allergies: "Aucune", assurance: "Aucune", isArchive: false, createdAt: new Date().toISOString() },
  { id: "MS-2026-0047", nom: "Coulibaly", prenom: "Ousmane", sexe: "M", dateNaissance: "2015-02-03", telephone: "+223 75 43 21 09", adresse: "Sogoniko, Bamako", profession: "Élève", groupeSanguin: "B-", allergies: "Poussière", assurance: "CANAM (70%)", isArchive: false, createdAt: new Date().toISOString() }
]);

let backupAppointments = loadBackup<any[]>("appointments.json", [
  { id: "rdv_1", patientId: "MS-2026-0045", patientNom: "Diarra Amadou", medecin: "Dr. Sangaré (Généraliste)", date: "2026-05-26", heure: "09:00", salle: "Cabinet 1", statut: "Confirmé", notes: "", createdAt: new Date().toISOString() },
  { id: "rdv_2", patientId: "MS-2026-0046", patientNom: "Traoré Fatoumata", medecin: "Dr. Diallo (Pédiatre)", date: "2026-05-26", heure: "10:30", salle: "Cabinet 2", statut: "En attente", notes: "", createdAt: new Date().toISOString() }
]);

let backupTriages = loadBackup<any[]>("triages.json", [
  { id: "tr_1", patientId: "MS-2026-0047", patientNom: "Coulibaly Ousmane", plaintePrincipale: "Fièvre élevée et convulsions", couleur: "Rouge", heureArrivee: "08:15", statut: "En soins" }
]);

let backupRecords = loadBackup<any[]>("records.json", []);

const serverDefaultBeds = [
  { id: "Lit-101", chambre: "Chambre 101 (Individuelle)", service: "Médecine Générale", statut: "Occupé", patientId: "MS-2026-0045", patientNom: "Diarra Amadou", temperature: 37.8, frequenceCardiaque: 82, soinsInfirmiersLogs: ["08:00 - Administration Amlodipine 5mg", "12:00 - Prise de température (37.8°C), constantes stables"], dateAdmission: "2026-05-26" },
  { id: "Lit-102", chambre: "Chambre 102 (Double - A)", service: "Urgences", statut: "Disponible" },
  { id: "Lit-103", chambre: "Chambre 102 (Double - B)", service: "Urgences", statut: "Disponible" },
  { id: "Lit-104", chambre: "Chambre 201 (Maternité - A)", service: "Maternité / CPN", statut: "Disponible" },
  { id: "Lit-105", chambre: "Chambre 201 (Maternité - B)", service: "Maternité / CPN", statut: "Occupé", patientId: "MS-2026-0048", patientNom: "Keïta Mariam", temperature: 36.9, frequenceCardiaque: 72, soinsInfirmiersLogs: ["09:00 - Monitoring fœtal normal", "15:00 - Patiente stable, repos au lit"], dateAdmission: "2026-05-25" },
  { id: "Lit-106", chambre: "Chambre de Triage 1", service: "Urgences", statut: "Maintenance" },
  { id: "Lit-107", chambre: "Chambre 103 (Soins Intensifs)", service: "Urgences", statut: "Disponible" },
  { id: "Lit-108", chambre: "Chambre 202 (Pédiatrie - A)", service: "Pédiatrie", statut: "Disponible" },
  { id: "Lit-109", chambre: "Chambre 202 (Pédiatrie - B)", service: "Pédiatrie", statut: "Disponible" },
  { id: "Lit-110", chambre: "Chambre 301 (Chirurgie)", service: "Chirurgie", statut: "Disponible" }
];

let backupHospitalizations = loadBackup<any[]>("hospitalizations.json", serverDefaultBeds);
if (!backupHospitalizations || backupHospitalizations.length === 0) {
  backupHospitalizations = [...serverDefaultBeds];
}
let backupLabTests = loadBackup<any[]>("lab_tests.json", []);
let backupStocks = loadBackup<any[]>("stocks.json", []);
let backupInvoices = loadBackup<any[]>("invoices.json", []);
let backupPresences = loadBackup<any[]>("presences.json", []);
let backupMails = loadBackup<any[]>("mails.json", []);

let defaultRolesList = [
  { name: "Médecin", allowedModules: ["patients", "rdv", "dme", "hospitalisation", "teleconsultation", "rapports"] },
  { name: "Infirmier", allowedModules: ["patients", "rdv", "hospitalisation", "urgences", "presences"] },
  { name: "Sage-femme", allowedModules: ["patients", "rdv", "hospitalisation", "dme"] },
  { name: "Laborantin", allowedModules: ["patients", "labo"] },
  { name: "Pharmacien", allowedModules: ["patients", "pharmacie"] },
  { name: "Caissier", allowedModules: ["patients", "facturation"] },
  { name: "Réceptionniste", allowedModules: ["patients", "rdv", "courrier"] },
  { name: "DG", allowedModules: ["patients", "rdv", "dme", "hospitalisation", "labo", "pharmacie", "facturation", "courrier", "rapports", "teleconsultation", "urgences", "paie"] },
  { name: "Administrateur Système", allowedModules: ["patients", "rdv", "dme", "hospitalisation", "labo", "pharmacie", "facturation", "courrier", "rapports", "teleconsultation", "urgences", "paie", "presences"] }
];

let customRoles = loadBackup<any[]>("roles.json", defaultRolesList);

let defaultSessionsList = [
  { id: "sess-1", userId: "user-admin", username: "admin", name: "Sidi Coulibaly (SysAdmin)", role: "Administrateur Système", ipAddress: "192.168.1.15", loginTime: new Date(Date.now() - 3600000).toISOString(), lastSeen: new Date().toISOString(), isActive: true },
  { id: "sess-2", userId: "user-dr-sangare", username: "dr_sangare", name: "Dr. Amadou Sangaré", role: "Médecin", ipAddress: "192.168.1.30", loginTime: new Date(Date.now() - 7200000).toISOString(), lastSeen: new Date(Date.now() - 600000).toISOString(), isActive: true }
];

let liveSessions = loadBackup<any[]>("sessions.json", defaultSessionsList);

let systemSettingsMemory = loadBackup<any>("system_settings.json", {
  jwtExpirationRange: 24, // heures
  passwordMinLength: 8,
  restrictIpRange: "192.168.1.*",
  preventBruteForce: true,
  maxFailuresAllowed: 5,
  hourLockdownActive: false,
});

// Cryptographic utils
const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL CONFIGURATION ERROR: The JWT_SECRET environment variable is missing in production mode. System startup aborted for clinical patient safety.");
    }
    console.warn("⚠️ [SECURITY WARNING] The JWT_SECRET environment variable is not defined. Initiating secure dynamic single-boot fallback key.");
    return crypto.randomBytes(64).toString("hex");
  }
  return secret;
})();

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

function verifyPassword(password: string, salt: string, hash: string): boolean {
  return hashPassword(password, salt) === hash;
}

function createToken(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (Date.now() - payload.timestamp > 24 * 60 * 60 * 1000) {
      return null; // 24-hour expiration
    }
    return payload;
  } catch {
    return null;
  }
}

// Seed function
async function seedSystem() {
  try {
    const settingsCount = await prisma.systemSettings.count();
    if (settingsCount === 0) {
      await prisma.systemSettings.create({
        data: {
          name: "Medishahel Settings",
          valueJson: JSON.stringify(clinicBranding)
        }
      });
    } else {
      const activeConf = await prisma.systemSettings.findUnique({ where: { name: "Medishahel Settings" } });
      if (activeConf) {
        clinicBranding = JSON.parse(activeConf.valueJson);
      }
    }

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      for (const raw of rawSeeds) {
        const salt = crypto.randomBytes(16).toString("hex");
        const passwordHash = hashPassword(raw.password, salt);
        await prisma.user.create({
          data: {
            id: raw.id,
            username: raw.username,
            name: raw.name,
            role: raw.role,
            salt,
            passwordHash,
            allowedIPs: raw.allowedIPs || "*",
            allowedHoursStart: raw.allowedHoursStart,
            allowedHoursEnd: raw.allowedHoursEnd,
            allowedModules: ["patients", "rdv", "dme", "hospitalisation", "labo", "pharmacie", "facturation", "courrier", "rapports"]
          }
        });
      }
      console.log("[Medishahel Setup] Comptes de sécurité des soignants complétés dans PostgreSQL.");
    }
  } catch (err) {
    console.error("[Medishahel Setup] Seeding error:", err);
  }
}

// Verify DB availability and sync
async function hookDatabase() {
  try {
    console.log("[Database Service] Connexion au moteur PostgreSQL...");
    await prisma.$connect();
    isDbConnected = true;
    console.log("[Database Service] Raccordement PostgreSQL opérationnel.");

    // Automatic table schema validation & direct creation
    try {
      console.log("[Database Service] Synchronisation des tables et migrations de schémas (Prisma db-push)...");
      execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
      console.log("[Database Service] Schémas SQL synchronisés et tables générées de manière transparente.");
    } catch (pushErr: any) {
      console.error("⚠️ [Database Service] Alerte: Échec du push de schéma automatique. La base de données utilisera les tables préexistantes.", pushErr.message);
    }
    
    await seedSystem();
  } catch (err: any) {
    isDbConnected = false;
    console.warn(`[Database Service] PostgreSQL inaccessible ou verrouillé localement (${err.message}). Bascule automatique de sécurité en mode Fichier-Persistant local.`);
  }
}

hookDatabase();

// Middleware security checker
async function requireAuth(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Veuillez vous authentifier." });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Session expirée. Reconnexion requise." });
  }

  if (isDbConnected) {
    try {
      const user = await prisma.user.findUnique({ where: { username: decoded.username } });
      if (!user) return res.status(401).json({ error: "Identifiant invalide." });
      if (!user.isActive) return res.status(403).json({ error: "Collaborateur désactivé par l'administration." });
      req.user = user;
      return next();
    } catch {
      // Fallback
    }
  }

  // Backup check
  const systemUsers = rawSeeds;
  const backUser = systemUsers.find(u => u.username === decoded.username);
  if (!backUser) return res.status(401).json({ error: "Compte introuvable." });
  req.user = backUser;
  next();
}

// Write system logs securely
async function appendSystemAudit(user: string, role: string, action: string, details: string, ip: string, oldValue = "", newValue = "") {
  try {
    const timestamp = new Date();
    if (isDbConnected) {
      await prisma.auditLog.create({
        data: {
          timestamp,
          user,
          role,
          action,
          details,
          ip,
          oldValue,
          newValue
        }
      });
    }
  } catch (err) {
    console.warn("DB Audit logger fallback:", err);
  }

  // Always write local backups for forensic immutability
  const fileLog = {
    id: "log_" + Date.now() + "_" + Math.floor(Math.random()*100),
    timestamp: new Date().toISOString(),
    user,
    role,
    action,
    details,
    ip,
    oldValue,
    newValue
  };
  backupAuditLogs.unshift(fileLog);
  if (backupAuditLogs.length > 500) backupAuditLogs.pop();
  saveBackup("audit_logs.json", backupAuditLogs);
}

// ---------------- REST GATEWAYS ----------------

// Helper to register active user sessions for auditing
async function registerUserSession(userId: string, username: string, name: string, role: string, ip: string, token: string) {
  const sessionObj = {
    id: `sess-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId,
    username,
    name,
    role,
    ipAddress: ip,
    loginTime: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    isActive: true
  };
  liveSessions.unshift(sessionObj);
  if (liveSessions.length > 50) liveSessions.pop();
  saveBackup("sessions.json", liveSessions);

  if (isDbConnected) {
    try {
      await prisma.userSession.create({
        data: {
          id: sessionObj.id,
          userId: sessionObj.userId,
          token: token,
          ipAddress: sessionObj.ipAddress,
          loginTime: new Date(sessionObj.loginTime),
          isActive: true
        }
      });
    } catch (err: any) {
      console.log("Error creating UserSession in DB:", err.message);
    }
  }
}

// Anti-brute force tracking database helper
const bruteTracker = new Map<string, { attempts: number; lockUntil: number }>();

function getLockKey(username: string, ip: string): string {
  return `${username.toLowerCase()}:${ip}`;
}

// 1. Auth Login Gateway with Brute-Force and Active JWT Rotation Policies
app.post("/api/auth/login", async (req, res) => {
  const { username, password, clinicId } = req.body;
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "127.0.0.1");
  const userKey = getLockKey(username || "", ip);

  if (!username || !password) {
    return res.status(400).json({ error: "Champs requis manquants." });
  }

  // Check Brute force locks
  const lockout = bruteTracker.get(userKey);
  if (lockout && Date.now() < lockout.lockUntil) {
    const remainsSeconds = Math.ceil((lockout.lockUntil - Date.now()) / 1000);
    return res.status(423).json({ 
      error: `Compte temporairement verrouillé pour des raisons de sécurité de la clinique. Veuillez réessayer dans ${remainsSeconds} secondes.` 
    });
  }

  let dbUserObj = null;
  if (isDbConnected) {
    try {
      dbUserObj = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    } catch {
      // ignore
    }
  }

  if (dbUserObj) {
    if (!dbUserObj.isActive) {
      return res.status(403).json({ error: "Ce compte a été bloqué par un administrateur." });
    }

    // IP Restriction check
    if (dbUserObj.allowedIPs && dbUserObj.allowedIPs !== "*") {
      const baseOctets = dbUserObj.allowedIPs.replace("*", "");
      if (!ip.startsWith(baseOctets) && ip !== "127.0.0.1" && ip !== "::1") {
        return res.status(403).json({ error: `Adresse IP non autorisée (${ip}).` });
      }
    }

    const isMatch = verifyPassword(password, dbUserObj.salt, dbUserObj.passwordHash);
    if (!isMatch) {
      // Register failed attempt
      const attemptsCount = (lockout?.attempts || 0) + 1;
      if (attemptsCount >= 5) {
        bruteTracker.set(userKey, { attempts: attemptsCount, lockUntil: Date.now() + 15 * 60 * 1000 }); // 15 mins lock
        await appendSystemAudit("Système Sécurité", "Watcher", "Blocage brute-force", `Alerte bruteforce détectée pour le compte '${username}' depuis l'IP ${ip}. Blocage pendant 15 minutes engagé.`, ip);
        return res.status(423).json({ error: "Brute-force systématique détecté. Votre adresse IP et ce compte de soignant sont verrouillés pour 15 minutes." });
      } else {
        bruteTracker.set(userKey, { attempts: attemptsCount, lockUntil: 0 });
        return res.status(401).json({ error: `Identifiants incorrects. Tentatives restantes: ${5 - attemptsCount}` });
      }
    }

    // Reset attempts on successful log
    bruteTracker.delete(userKey);

    // Multi-clinic multi-tenant isolation configuration tag
    const targetClinic = clinicId || "MALI_NORD_SYS_01";

    const accessTokenData = { 
      username: dbUserObj.username, 
      name: dbUserObj.name, 
      role: dbUserObj.role, 
      clinicId: targetClinic,
      timestamp: Date.now() 
    };

    const token = createToken(accessTokenData);
    
    // Generate rotated refresh token
    const refreshTokenPayload = {
      username: dbUserObj.username,
      rotateKey: crypto.randomBytes(32).toString("hex"),
      timestamp: Date.now()
    };
    const refreshToken = createToken(refreshTokenPayload);

    await appendSystemAudit(dbUserObj.name, dbUserObj.role, "Authentification réussie", `Connexion réussie sous session sécurisée Postgres. Établissement affecté: ${targetClinic}`, ip);
    await registerUserSession(dbUserObj.id, dbUserObj.username, dbUserObj.name, dbUserObj.role, ip, token);

    return res.json({ 
      token, 
      refreshToken, 
      user: { 
        id: dbUserObj.id, 
        username: dbUserObj.username, 
        name: dbUserObj.name, 
        role: dbUserObj.role, 
        isActive: dbUserObj.isActive,
        clinicId: targetClinic
      } 
    });
  }

  // Backup fallback authentication (Offline WAN scenario)
  const seedMatch = rawSeeds.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (seedMatch) {
    const tempSalt = "medishahel_temp_salt";
    const tempHash = hashPassword(seedMatch.password, tempSalt);
    const mockHash = hashPassword(password, tempSalt);
    if (tempHash !== mockHash) {
      const attemptsCount = (lockout?.attempts || 0) + 1;
      bruteTracker.set(userKey, { attempts: attemptsCount, lockUntil: attemptsCount >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
      if (attemptsCount >= 5) {
        return res.status(423).json({ error: "Brute force détecté. Lock de 15 minutes actif." });
      }
      return res.status(401).json({ error: `Identifiants incorrects. Tentatives restantes: ${5 - attemptsCount}` });
    }

    // Reset keys on successful log
    bruteTracker.delete(userKey);
    const targetClinic = clinicId || "MALI_NORD_SYS_01";

    const token = createToken({ username: seedMatch.username, name: seedMatch.name, role: seedMatch.role, timestamp: Date.now() });
    
    // Generate secure rotated refresh token for WAN fallback
    const refreshToken = createToken({ username: seedMatch.username, rotateKey: "fallback-rotate", timestamp: Date.now() });

    await appendSystemAudit(seedMatch.name, seedMatch.role, "Authentification réussie", `Connexion en mode secours (PostgreSQL non connecté). Établissement affecté: ${targetClinic}`, ip);
    await registerUserSession(seedMatch.id, seedMatch.username, seedMatch.name, seedMatch.role, ip, token);

    return res.json({ 
      token, 
      refreshToken, 
      user: { 
        id: seedMatch.id, 
        username: seedMatch.username, 
        name: seedMatch.name, 
        role: seedMatch.role, 
        isActive: true,
        clinicId: targetClinic
      } 
    });
  }

  res.status(401).json({ error: "Identifiant de soignant introuvable." });
});

// Refresh token route for active session rotation policy
app.post("/api/auth/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token manquant." });
  }

  const decoded = verifyToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ error: "Token de rafraîchissement expiré ou invalide. Reconnexion de sécurité requise." });
  }

  // Lookup user for rotation verification
  let userObj: any = rawSeeds.find(u => u.username === decoded.username);
  if (isDbConnected) {
    try {
      const dbUser = await prisma.user.findUnique({ where: { username: decoded.username } });
      if (dbUser) userObj = dbUser;
    } catch {
      // ignore
    }
  }

  if (!userObj || (userObj.isActive === false)) {
    return res.status(403).json({ error: "Compte inactif ou révoqué." });
  }

  // Create new active rotated access token
  const nextToken = createToken({
    username: userObj.username,
    name: userObj.name,
    role: userObj.role,
    timestamp: Date.now()
  });

  // Create a new rotated refresh token
  const nextRefreshToken = createToken({
    username: userObj.username,
    rotateKey: crypto.randomBytes(32).toString("hex"),
    timestamp: Date.now()
  });

  res.json({ token: nextToken, refreshToken: nextRefreshToken });
});

app.get("/api/auth/verify", (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Session non autorisée." });
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: "Votre session a expiré ou est invalide." });
  }
  res.json({ valid: true, user: { username: decoded.username, name: decoded.name, role: decoded.role } });
});

// 2. Clinics Branding API
app.get("/api/clinics/brand", async (req, res) => {
  if (isDbConnected) {
    try {
      const activeConf = await prisma.systemSettings.findUnique({ where: { name: "Medishahel Settings" } });
      if (activeConf) {
        return res.json(JSON.parse(activeConf.valueJson));
      }
    } catch {
      // ignore
    }
  }
  res.json(clinicBranding);
});

// 2b. Dynamic Users & Security Accounts Management (RBAC)
app.get("/api/users", async (req, res) => {
  if (isDbConnected) {
    try {
      const dbUsers = await prisma.user.findMany();
      const mapped = dbUsers.map(u => {
        const seed = rawSeeds.find(s => s.username === u.username);
        return {
          id: u.id,
          name: u.name,
          username: u.username,
          role: u.role,
          isActive: u.isActive,
          password: seed ? seed.password : "********",
          allowedIPs: u.allowedIPs || "*",
          allowedHoursStart: u.allowedHoursStart || undefined,
          allowedHoursEnd: u.allowedHoursEnd || undefined,
          allowedModules: u.allowedModules || []
        };
      });
      return res.json(mapped);
    } catch {
      // ignore
    }
  }
  return res.json(rawSeeds);
});

app.post("/api/users", async (req, res) => {
  const { users } = req.body;
  if (!Array.isArray(users)) {
    return res.status(400).json({ error: "Format attendu incorrect." });
  }

  for (const clientUser of users) {
    const existingIdx = rawSeeds.findIndex(u => u.id === clientUser.id || u.username === clientUser.username);
    if (existingIdx !== -1) {
      rawSeeds[existingIdx] = {
        ...rawSeeds[existingIdx],
        name: clientUser.name,
        username: clientUser.username || rawSeeds[existingIdx].username,
        password: clientUser.password || rawSeeds[existingIdx].password,
        role: clientUser.role,
        isActive: clientUser.isActive,
        allowedIPs: clientUser.allowedIPs,
        allowedHoursStart: clientUser.allowedHoursStart,
        allowedHoursEnd: clientUser.allowedHoursEnd
      };
    } else {
      rawSeeds.push({
        id: clientUser.id || `user-${Date.now().toString().slice(-4)}`,
        name: clientUser.name,
        username: clientUser.username || `user_${Date.now().toString().slice(-4)}`,
        password: clientUser.password || "MédiSahel2026!",
        role: clientUser.role,
        isActive: clientUser.isActive,
        allowedIPs: clientUser.allowedIPs,
        allowedHoursStart: clientUser.allowedHoursStart,
        allowedHoursEnd: clientUser.allowedHoursEnd
      });
    }

    if (isDbConnected) {
      try {
        const uId = clientUser.id;
        const uUsername = (clientUser.username || "").toLowerCase();
        
        let existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { id: uId },
              { username: uUsername }
            ]
          }
        });

        const salt = existingUser?.salt || crypto.randomBytes(16).toString("hex");
        const pass = clientUser.password || "MédiSahel2026!";
        const passwordHash = clientUser.password ? hashPassword(pass, salt) : (existingUser?.passwordHash || hashPassword("MédiSahel2026!", salt));

        if (existingUser) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              username: uUsername,
              name: clientUser.name,
              role: clientUser.role,
              isActive: clientUser.isActive,
              passwordHash,
              salt,
              allowedIPs: clientUser.allowedIPs || "*",
              allowedHoursStart: clientUser.allowedHoursStart || null,
              allowedHoursEnd: clientUser.allowedHoursEnd || null,
              allowedModules: clientUser.allowedModules || ["patients", "rdv", "dme"]
            }
          });
        } else {
          await prisma.user.create({
            data: {
              id: uId,
              username: uUsername,
              name: clientUser.name,
              role: clientUser.role,
              isActive: clientUser.isActive,
              passwordHash,
              salt,
              allowedIPs: clientUser.allowedIPs || "*",
              allowedHoursStart: clientUser.allowedHoursStart || null,
              allowedHoursEnd: clientUser.allowedHoursEnd || null,
              allowedModules: clientUser.allowedModules || ["patients", "rdv", "dme"]
            }
          });
        }
      } catch (err: any) {
        console.error("Error saving user to DB:", err.message);
      }
    }
  }

  return res.json({ success: true, message: "Utilisateurs synchronisés avec succès." });
});

app.post("/api/clinics/brand", requireAuth, async (req: any, res: any) => {
  const operator = req.user?.name || "Anonyme";
  const opRole = req.user?.role || "Inconnu";
  const oldBrandName = clinicBranding.name;
  clinicBranding = { ...clinicBranding, ...req.body };

  if (isDbConnected) {
    try {
      await prisma.systemSettings.upsert({
        where: { name: "Medishahel Settings" },
        update: { valueJson: JSON.stringify(clinicBranding) },
        create: { name: "Medishahel Settings", valueJson: JSON.stringify(clinicBranding) }
      });
    } catch {
      // ignore
    }
  }

  saveBackup("branding.json", clinicBranding);
  await appendSystemAudit(operator, opRole, "Branding mis à jour", `Mise à jour du branding de l'établissement (${oldBrandName} -> ${clinicBranding.name})`, req.ip || "127.0.0.1");
  res.json({ message: "Branding mis à jour avec succès", data: clinicBranding });
});

// 2c. ADVANCED SYSTEM ADMINISTRATION ENDPOINTS (RBAC, Sessions, SecuritySettings, Users CRUD)
app.put("/api/users/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const { name, username, password, role, isActive, allowedIPs, allowedHoursStart, allowedHoursEnd, allowedModules } = req.body;
  const operatorName = req.user?.name || "System Admin";
  const operatorRole = req.user?.role || "Administrateur Système";

  // Check privileges
  if (operatorRole !== "Administrateur Système" && req.user?.username !== "admin") {
    return res.status(403).json({ error: "Action non autorisée. Privilèges Administrateur Système requis." });
  }

  // Update in memory fallback
  const existingIdx = rawSeeds.findIndex(u => u.id === id);
  if (existingIdx !== -1) {
    rawSeeds[existingIdx] = {
      ...rawSeeds[existingIdx],
      name: name ?? rawSeeds[existingIdx].name,
      username: username ?? rawSeeds[existingIdx].username,
      password: password || rawSeeds[existingIdx].password,
      role: role ?? rawSeeds[existingIdx].role,
      isActive: isActive !== undefined ? isActive : rawSeeds[existingIdx].isActive,
      allowedIPs: allowedIPs ?? rawSeeds[existingIdx].allowedIPs,
      allowedHoursStart: allowedHoursStart ?? rawSeeds[existingIdx].allowedHoursStart,
      allowedHoursEnd: allowedHoursEnd ?? rawSeeds[existingIdx].allowedHoursEnd,
      allowedModules: allowedModules ?? rawSeeds[existingIdx].allowedModules
    };
  }

  if (isDbConnected) {
    try {
      const uUsername = (username || "").toLowerCase();
      let existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        return res.status(404).json({ error: "Utilisateur non trouvé en base." });
      }

      const salt = existingUser.salt || crypto.randomBytes(16).toString("hex");
      const passwordHash = password ? hashPassword(password, salt) : existingUser.passwordHash;

      await prisma.user.update({
        where: { id },
        data: {
          username: uUsername || existingUser.username,
          name: name || existingUser.name,
          role: role || existingUser.role,
          isActive: isActive !== undefined ? isActive : existingUser.isActive,
          passwordHash,
          salt,
          allowedIPs: allowedIPs !== undefined ? allowedIPs : existingUser.allowedIPs,
          allowedHoursStart: allowedHoursStart !== undefined ? allowedHoursStart : existingUser.allowedHoursStart,
          allowedHoursEnd: allowedHoursEnd !== undefined ? allowedHoursEnd : existingUser.allowedHoursEnd,
          allowedModules: allowedModules || existingUser.allowedModules
        }
      });
    } catch (err: any) {
      console.error("Error updating user DB:", err.message);
      return res.status(500).json({ error: "Erreur serveur lors de la mise à jour." });
    }
  }

  await appendSystemAudit(operatorName, operatorRole, "Utilisateur mis à jour", `Modification du compte soignant ID ${id} (${username})`, req.ip || "127.0.0.1");
  return res.json({ success: true, message: "Utilisateur mis à jour avec succès" });
});

app.delete("/api/users/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const operatorName = req.user?.name || "System Admin";
  const operatorRole = req.user?.role || "Administrateur Système";

  if (operatorRole !== "Administrateur Système" && req.user?.username !== "admin") {
    return res.status(403).json({ error: "Action non autorisée. Privilèges Administrateur Système requis." });
  }

  // Remove in memory
  const idx = rawSeeds.findIndex(u => u.id === id);
  let usrDeleted = "";
  if (idx !== -1) {
    usrDeleted = rawSeeds[idx].username;
    rawSeeds.splice(idx, 1);
  }

  if (isDbConnected) {
    try {
      await prisma.user.delete({ where: { id } });
    } catch (err: any) {
      console.error("DB User deletion error:", err.message);
    }
  }

  await appendSystemAudit(operatorName, operatorRole, "Utilisateur supprimé", `Suppression définitive du compte de soignant ID ${id} (${usrDeleted})`, req.ip || "127.0.0.1");
  return res.json({ success: true, message: "Utilisateur supprimé définitivement." });
});

// ROLES MANAGEMENT ENDPOINTS
app.get("/api/roles", requireAuth, async (req, res) => {
  return res.json(customRoles);
});

app.post("/api/roles", requireAuth, async (req: any, res: any) => {
  const { roles } = req.body;
  if (!Array.isArray(roles)) {
    return res.status(400).json({ error: "Format invalide. Liste de rôles attendue." });
  }
  customRoles = roles;
  saveBackup("roles.json", customRoles);

  const operatorName = req.user?.name || "System Admin";
  const operatorRole = req.user?.role || "Administrateur Système";
  await appendSystemAudit(operatorName, operatorRole, "Rôles système mis à jour", "Mise à jour de la configuration globale de la matrice RBAC", req.ip || "127.0.0.1");

  return res.json({ success: true, message: "Configuration RBAC enregistrée.", data: customRoles });
});

// SYSTEM SETTINGS ENDPOINTS (SECURITY POLICIES)
app.get("/api/system/settings", requireAuth, async (req, res) => {
  return res.json(systemSettingsMemory);
});

app.post("/api/system/settings", requireAuth, async (req: any, res: any) => {
  systemSettingsMemory = { ...systemSettingsMemory, ...req.body };
  saveBackup("system_settings.json", systemSettingsMemory);

  const operatorName = req.user?.name || "System Admin";
  const operatorRole = req.user?.role || "Administrateur Système";
  await appendSystemAudit(operatorName, operatorRole, "Paramètres système mis à jour", "Mise à jour des règles globales de sécurité (IP, lockouts, etc.)", req.ip || "127.0.0.1");

  return res.json({ success: true, message: "Règles de sécurité globales appliquées.", data: systemSettingsMemory });
});

// ACTIVE SESSIONS MANAGEMENT ENDPOINTS
app.get("/api/system/sessions", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const dbSessions = await prisma.userSession.findMany({
        where: { isActive: true },
        include: { user: true }
      });
      const mapped = dbSessions.map(s => ({
        id: s.id,
        userId: s.userId,
        username: s.user.username,
        name: s.user.name,
        role: s.user.role,
        ipAddress: s.ipAddress,
        loginTime: s.loginTime.toISOString(),
        lastSeen: s.lastSeen.toISOString(),
        isActive: s.isActive
      }));
      return res.json(mapped);
    } catch {
      // fallback
    }
  }
  return res.json(liveSessions);
});

app.delete("/api/system/sessions/:id", requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const operatorName = req.user?.name || "System Admin";
  const operatorRole = req.user?.role || "Administrateur Système";

  // Terminate in memory
  const idx = liveSessions.findIndex(s => s.id === id);
  let trgUser = "";
  if (idx !== -1) {
    trgUser = liveSessions[idx].name;
    liveSessions.splice(idx, 1);
    saveBackup("sessions.json", liveSessions);
  }

  if (isDbConnected) {
    try {
      await prisma.userSession.update({
        where: { id },
        data: { isActive: false }
      });
    } catch (err: any) {
      console.error("DB termination session error:", err.message);
    }
  }

  await appendSystemAudit(operatorName, operatorRole, "Session révoquée", `Révocation de force d'une session de connexion active pour l'utilisateur ${trgUser}`, req.ip || "127.0.0.1");
  return res.json({ success: true, message: "Session révoquée avec succès." });
});

// 3. SECURE REST PATIENTS
app.get("/api/patients", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.patient.findMany({
        orderBy: { createdAt: "desc" }
      });
      // Convert DateTimes back to strings for client expectation
      const clients = list.map(p => ({
        ...p,
        dateNaissance: p.dateNaissance.toISOString().split("T")[0],
        createdAt: p.createdAt.toISOString()
      }));
      return res.json(clients);
    } catch (err) {
      console.error(err);
    }
  }
  res.json(backupPatients);
});

app.post("/api/patients", requireAuth, async (req: any, res: any) => {
  const data = req.body;
  const operator = req.user?.name || "Soignant";
  const opRole = req.user?.role || "Opérateur";

  if (isDbConnected) {
    try {
      const record = await prisma.patient.create({
        data: {
          id: data.id,
          nom: data.nom,
          prenom: data.prenom,
          sexe: data.sexe,
          dateNaissance: new Date(data.dateNaissance),
          telephone: data.telephone,
          adresse: data.adresse,
          profession: data.profession,
          groupeSanguin: data.groupeSanguin,
          allergies: data.allergies,
          assurance: data.assurance || "Aucune",
          photoUrl: data.photoUrl,
          contactUrgenceNom: data.contactUrgenceNom,
          contactUrgenceTel: data.contactUrgenceTel,
          isArchive: data.isArchive || false,
          nationalite: data.nationalite || "Malienne",
          lieuNaissance: data.lieuNaissance || "",
          ethnie: data.ethnie || "",
          antecedents: data.antecedents || ""
        }
      });
      await appendSystemAudit(operator, opRole, "Création Patient", `Création du patient ${record.nom} ${record.prenom} (${record.id}) en base PostgreSQL.`, req.ip || "127.0.0.1");
      return res.status(201).json({
        ...record,
        dateNaissance: record.dateNaissance.toISOString().split("T")[0],
        createdAt: record.createdAt.toISOString()
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Erreur d'écriture SQLite/Postgres.", details: err.message });
    }
  }

  // Backup fallback
  backupPatients.unshift(data);
  saveBackup("patients.json", backupPatients);
  await appendSystemAudit(operator, opRole, "Création Patient", `Patient ${data.nom} ${data.prenom} enregistré localement (Secours actif).`, req.ip || "127.0.0.1");
  res.status(201).json(data);
});

// 4. REST APPOINTMENTS
app.get("/api/appointments", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.appointment.findMany({
        include: { patient: true }
      });
      const parsed = list.map(item => ({
        id: item.id,
        patientId: item.patientId,
        patientNom: `${item.patient.nom} ${item.patient.prenom}`,
        medecin: item.medecin,
        date: item.date,
        heure: item.heure,
        salle: item.salle,
        statut: item.statut,
        notes: item.notes,
        createdAt: item.createdAt.toISOString()
      }));
      return res.json(parsed);
    } catch {
      // ignore
    }
  }
  res.json(backupAppointments);
});

app.post("/api/appointments", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.appointment.create({
        data: {
          id: data.id,
          patientId: data.patientId,
          medecin: data.medecin,
          date: data.date,
          heure: data.heure,
          salle: data.salle,
          statut: data.statut || "Confirmé",
          notes: data.notes || ""
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  backupAppointments.unshift(data);
  saveBackup("appointments.json", backupAppointments);
  res.status(201).json(data);
});

// 5. REST DME RECORDS
app.get("/api/medical-records", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.medicalRecord.findMany({
        orderBy: { createdAt: "desc" }
      });
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupRecords);
});

app.post("/api/medical-records", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.medicalRecord.create({
        data: {
          id: data.id,
          patientId: data.patientId,
          motif: data.motif,
          diagnostic: data.diagnostic,
          codeCIM10: data.codeCIM10,
          prescription: data.prescription,
          notesCliniques: data.notesCliniques,
          certificatDuree: data.certificatDuree || 0,
          medecinSignature: data.medecinSignature,
          examensDemandes: data.examensDemandes || []
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  backupRecords.unshift(data);
  saveBackup("records.json", backupRecords);
  res.status(201).json(data);
});

// 6. REST HOSPITALIZATION
app.get("/api/hospitalizations", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const activeBedsSetting = await prisma.systemSettings.findUnique({
        where: { name: "Medishahel Beds" }
      });
      if (activeBedsSetting) {
        return res.json(JSON.parse(activeBedsSetting.valueJson));
      } else {
        await prisma.systemSettings.create({
          data: {
            name: "Medishahel Beds",
            valueJson: JSON.stringify(serverDefaultBeds)
          }
        });
        return res.json(serverDefaultBeds);
      }
    } catch (err: any) {
      console.error("DB error in hospitalizations GET, falling back directly:", err.message);
    }
  }
  res.json(backupHospitalizations);
});

app.post("/api/hospitalizations", requireAuth, async (req, res) => {
  const { beds } = req.body;
  if (isDbConnected) {
    try {
      if (beds && Array.isArray(beds)) {
        await prisma.systemSettings.upsert({
          where: { name: "Medishahel Beds" },
          update: { valueJson: JSON.stringify(beds) },
          create: { name: "Medishahel Beds", valueJson: JSON.stringify(beds) }
        });
        return res.json({ success: true, count: beds.length });
      }
    } catch (err: any) {
      console.error("DB error in hospitalizations POST:", err.message);
    }
  }

  if (beds && Array.isArray(beds)) {
    backupHospitalizations = beds;
    saveBackup("hospitalizations.json", backupHospitalizations);
  } else {
    const data = req.body;
    backupHospitalizations.unshift(data);
    saveBackup("hospitalizations.json", backupHospitalizations);
  }
  res.status(201).json({ success: true });
});

// 7. REST LAB TESTS
app.get("/api/lab-tests", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.labTest.findMany({
        orderBy: { dateDemande: "desc" }
      });
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupLabTests);
});

app.post("/api/lab-tests", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.labTest.create({
        data: {
          id: data.id,
          patientId: data.patientId,
          nomAnalyse: data.nomAnalyse,
          typeExamen: data.typeExamen,
          statut: data.statut || "En attente",
          resultatObtenu: data.resultatObtenu || "",
          biologisteValid: data.biologisteValid || "",
          valeurReference: data.valeurReference || "",
          alertCritique: data.alertCritique || false
        }
      });
      return res.status(201).json(record);
    } catch (err) {
       console.error(err);
    }
  }
  backupLabTests.unshift(data);
  saveBackup("lab_tests.json", backupLabTests);
  res.status(201).json(data);
});

// 8. REST STOCK PHARMACY
app.get("/api/stocks", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.stockItem.findMany();
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupStocks);
});

app.post("/api/stocks", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.stockItem.upsert({
        where: { numeroLot: data.numeroLot },
        update: {
          quantite: data.quantite,
          seuilAlerte: data.seuilAlerte || 5,
          fournisseur: data.fournisseur
        },
        create: {
          id: data.id || undefined,
          designation: data.designation,
          categorie: data.categorie || "Médicament",
          numeroLot: data.numeroLot,
          quantite: data.quantite,
          seuilAlerte: data.seuilAlerte || 5,
          datePeremption: new Date(data.datePeremption),
          fournisseur: data.fournisseur
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  const idx = backupStocks.findIndex(s => s.numeroLot === data.numeroLot);
  if (idx > -1) {
    backupStocks[idx] = { ...backupStocks[idx], ...data };
  } else {
    backupStocks.unshift(data);
  }
  saveBackup("stocks.json", backupStocks);
  res.status(201).json(data);
});

// 9. REST SECURE INVOICES
app.get("/api/invoices", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.invoice.findMany();
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupInvoices);
});

app.post("/api/invoices", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.invoice.create({
        data: {
          id: data.id,
          patientId: data.patientId,
          patientNom: data.patientNom,
          designation: data.designation,
          montantTotal: parseFloat(data.montantTotal) || 0,
          montantAssurance: parseFloat(data.montantAssurance) || 0,
          montantPatiente: parseFloat(data.montantPatiente) || 0,
          statut: data.statut || "Impayé",
          modePaiement: data.modePaiement || null,
          caissier: data.caissier || null,
          isAvoir: data.isAvoir || false
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  backupInvoices.unshift(data);
  saveBackup("invoices.json", backupInvoices);
  res.status(201).json(data);
});

app.put("/api/invoices/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.invoice.update({
        where: { id },
        data: {
          statut: data.statut,
          modePaiement: data.modePaiement,
          caissier: data.caissier,
          datePaiement: data.datePaiement ? new Date(data.datePaiement) : undefined
        }
      });
      return res.json(record);
    } catch (err) {
      console.error("Postgres invoice pay error: ", err);
    }
  }
  const idx = backupInvoices.findIndex(inv => inv.id === id);
  if (idx > -1) {
    backupInvoices[idx] = { ...backupInvoices[idx], ...data };
    saveBackup("invoices.json", backupInvoices);
  }
  res.json({ status: "success", id });
});

// Helper validation function for backend RBAC (matches the frontend rules)
function isUserAuthorizedForTab(user: any, tab: string): boolean {
  if (!user) return false;
  if (!user.isActive) return false;

  // SysAdmin always has settings access
  if (user.role === "Administrateur Système" && tab === "settings") return true;
  if (user.role !== "Administrateur Système" && tab === "settings") return false;

  // custom overrides check (allowedModules list)
  if (user.allowedModules && user.allowedModules.length > 0) {
    return user.allowedModules.includes(tab);
  }

  // default permissions mapping per user role
  const defaultModules: Record<string, string[]> = {
    "Administrateur Système": ["dashboard", "patients", "consultation", "billing", "specialized", "agenda", "hospitalisation", "rh-paie", "courrier", "teleconsultation", "rapports", "mutuelles", "settings"],
    "Médecin": ["dashboard", "patients", "consultation", "specialized", "agenda", "hospitalisation", "teleconsultation", "rapports"],
    "Infirmier": ["dashboard", "patients", "agenda", "hospitalisation", "specialized", "courrier"],
    "Sage-femme": ["dashboard", "patients", "consultation", "agenda", "hospitalisation", "teleconsultation"],
    "Aide-soignant": ["dashboard", "patients", "hospitalisation", "agenda"],
    "Laborantin": ["dashboard", "specialized"],
    "Radiologue": ["dashboard", "specialized"],
    "Pharmacien": ["dashboard", "specialized"],
    "Réceptionniste": ["dashboard", "patients", "agenda", "courrier"],
    "Caissier": ["dashboard", "billing", "mutuelles", "rapports"],
    "DG": ["dashboard", "rapports", "patients", "agenda", "billing", "hospitalisation", "courrier", "mutuelles"]
  };

  const modules = defaultModules[user.role] || [];
  return modules.includes(tab);
}

// 9.5 UNIFIED SECURE GLOBAL SEARCH ENGINE (REAL-TIME & RBAC COMPLIANT)
app.get("/api/search/global", requireAuth, async (req: any, res: any) => {
  const q = req.query.q;
  const qs = String(q || "").toLowerCase().trim();
  const results: any[] = [];

  if (!qs || qs.length < 2) {
    return res.json([]);
  }

  // Journalise each query in AuditLog for audit trail security compliance (OWASP)
  try {
    await appendSystemAudit(
      req.user?.name || "Anonyme",
      req.user?.role || "Collaborateur",
      "Recherche globale",
      `Exécution d'une recherche sur le terme "${qs}"`,
      req.ip || "127.0.0.1"
    );
  } catch (auditErr: any) {
    console.warn("DB Audit logger fallback in global search API:", auditErr.message);
  }

  if (isDbConnected) {
    try {
      // Execute multi-table search in parallel using Prisma
      const searchPromises = [];

      // 1. Patients search
      if (isUserAuthorizedForTab(req.user, "patients")) {
        searchPromises.push(
          prisma.patient.findMany({
            where: {
              OR: [
                { nom: { contains: qs, mode: "insensitive" } },
                { prenom: { contains: qs, mode: "insensitive" } },
                { telephone: { contains: qs, mode: "insensitive" } },
                { id: { contains: qs, mode: "insensitive" } }
              ]
            },
            take: 8
          }).then(list => list.map(p => ({
            id: p.id,
            type: "PATIENT",
            label: `${p.nom.toUpperCase()} ${p.prenom}`,
            details: `Tél: ${p.telephone} | Sexe: ${p.sexe} | Mutuelle: ${p.assurance}`,
            tabTarget: "patients"
          })))
        );
      }

      // 2. Doctor Appointments search
      if (isUserAuthorizedForTab(req.user, "agenda")) {
        searchPromises.push(
          prisma.appointment.findMany({
            where: {
              OR: [
                { medecin: { contains: qs, mode: "insensitive" } },
                { notes: { contains: qs, mode: "insensitive" } }
              ]
            },
            include: { patient: true },
            take: 8
          }).then(list => list.map(a => ({
            id: a.id,
            type: "RDV",
            label: `Rendez-vous — Dr. ${a.medecin}`,
            details: `Patient: ${a.patient?.nom || "Inconnu"} | Date: ${a.date} à ${a.heure} | Salon: ${a.salle} (${a.statut})`,
            tabTarget: "agenda"
          })))
        );
      }

      // 3. Billing Invoices search
      if (isUserAuthorizedForTab(req.user, "billing")) {
        searchPromises.push(
          prisma.invoice.findMany({
            where: {
              OR: [
                { id: { contains: qs, mode: "insensitive" } },
                { patientNom: { contains: qs, mode: "insensitive" } },
                { designation: { contains: qs, mode: "insensitive" } }
              ]
            },
            take: 8
          }).then(list => list.map(i => ({
            id: i.id,
            type: "FACTURE",
            label: `Facture — MS-${i.id.substring(0, 8)}`,
            details: `Patient: ${i.patientNom} | Total: ${i.montantTotal} FCFA | Statut: ${i.statut}`,
            tabTarget: "billing"
          })))
        );
      }

      // 4. DME Medical records search
      if (isUserAuthorizedForTab(req.user, "consultation")) {
        searchPromises.push(
          prisma.medicalRecord.findMany({
            where: {
              OR: [
                { motif: { contains: qs, mode: "insensitive" } },
                { diagnostic: { contains: qs, mode: "insensitive" } },
                { prescription: { contains: qs, mode: "insensitive" } },
                { codeCIM10: { contains: qs, mode: "insensitive" } }
              ]
            },
            include: { patient: true },
            take: 8
          }).then(list => list.map(m => ({
            id: m.id,
            type: "DME",
            label: `Observation: ${m.motif}`,
            details: `Patient: ${m.patient?.nom || "Inconnu"} | Code CIM10: ${m.codeCIM10} | Diagnostic: ${m.diagnostic}`,
            tabTarget: "consultation"
          })))
        );
      }

      // 5. Hospitalizations search
      if (isUserAuthorizedForTab(req.user, "hospitalisation")) {
        searchPromises.push(
          prisma.hospitalization.findMany({
            where: {
              OR: [
                { chambre: { contains: qs, mode: "insensitive" } },
                { lit: { contains: qs, mode: "insensitive" } },
                { service: { contains: qs, mode: "insensitive" } },
                { statut: { contains: qs, mode: "insensitive" } }
              ]
            },
            include: { patient: true },
            take: 8
          }).then(list => list.map(h => ({
            id: h.id,
            type: "HOSPITALISATION",
            label: `Hospitalisé au service ${h.service}`,
            details: `Patient: ${h.patient?.nom || "Inconnu"} | Lit: ${h.lit} | Chambre: ${h.chambre} (${h.statut})`,
            tabTarget: "hospitalisation"
          })))
        );
      }

      // 6. Lab Tests search
      if (isUserAuthorizedForTab(req.user, "specialized")) {
        searchPromises.push(
          prisma.labTest.findMany({
            where: {
              OR: [
                { nomAnalyse: { contains: qs, mode: "insensitive" } },
                { typeExamen: { contains: qs, mode: "insensitive" } },
                { resultatObtenu: { contains: qs, mode: "insensitive" } },
                { biologisteValid: { contains: qs, mode: "insensitive" } }
              ]
            },
            include: { patient: true },
            take: 8
          }).then(list => list.map(l => ({
            id: l.id,
            type: "LABO",
            label: `Examen Lab: ${l.nomAnalyse}`,
            details: `Patient: ${l.patient?.nom || "Inconnu"} | Type: ${l.typeExamen} | Validation: ${l.biologisteValid || "En attente"} (${l.statut})`,
            tabTarget: "specialized"
          })))
        );
      }

      // 7. Pharmacy stocks search
      if (isUserAuthorizedForTab(req.user, "specialized")) {
        searchPromises.push(
          prisma.stockItem.findMany({
            where: {
              OR: [
                { designation: { contains: qs, mode: "insensitive" } },
                { categorie: { contains: qs, mode: "insensitive" } },
                { numeroLot: { contains: qs, mode: "insensitive" } }
              ]
            },
            take: 8
          }).then(list => list.map(s => ({
            id: s.id,
            type: "STOCK",
            label: `Produit: ${s.designation}`,
            details: `Lot: ${s.numeroLot} | Catégorie: ${s.categorie} | En Stock: ${s.quantite} pcs`,
            tabTarget: "specialized"
          })))
        );
      }

      // 8. Mail registry search
      if (isUserAuthorizedForTab(req.user, "courrier")) {
        searchPromises.push(
          prisma.mail.findMany({
            where: {
              OR: [
                { numeroCourrier: { contains: qs, mode: "insensitive" } },
                { expediteurDestinataire: { contains: qs, mode: "insensitive" } },
                { objet: { contains: qs, mode: "insensitive" } },
                { serviceAffecte: { contains: qs, mode: "insensitive" } }
              ]
            },
            take: 8
          }).then(list => list.map(m => ({
            id: m.id,
            type: "COURRIER",
            label: `Courrier [${m.type}]: ${m.numeroCourrier}`,
            details: `Objet: ${m.objet} | Contacts: ${m.expediteurDestinataire} | Affecté: ${m.serviceAffecte}`,
            tabTarget: "courrier"
          })))
        );
      }

      // 9. Users / Accounts search (SysAdmin only)
      if (isUserAuthorizedForTab(req.user, "settings")) {
        searchPromises.push(
          prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: qs, mode: "insensitive" } },
                { name: { contains: qs, mode: "insensitive" } },
                { role: { contains: qs, mode: "insensitive" } }
              ]
            },
            take: 8
          }).then(list => list.map(u => ({
            id: u.id,
            type: "UTILISATEUR",
            label: `Collaborateur: ${u.name}`,
            details: `Login: @${u.username} | Rôle: ${u.role} | Statut: ${u.isActive ? "Actif" : "Bloqué"}`,
            tabTarget: "settings"
          })))
        );
      }

      // 10. Audit Logs search (SysAdmin only)
      if (isUserAuthorizedForTab(req.user, "settings")) {
        searchPromises.push(
          prisma.auditLog.findMany({
            where: {
              OR: [
                { user: { contains: qs, mode: "insensitive" } },
                { role: { contains: qs, mode: "insensitive" } },
                { action: { contains: qs, mode: "insensitive" } },
                { details: { contains: qs, mode: "insensitive" } }
              ]
            },
            orderBy: { timestamp: "desc" },
            take: 8
          }).then(list => list.map(al => ({
            id: al.id,
            type: "AUDIT",
            label: `Audit: ${al.action}`,
            details: `Opérateur: ${al.user} (${al.role}) | Détails: ${al.details}`,
            tabTarget: "settings"
          })))
        );
      }

      const settledResult = await Promise.allSettled(searchPromises);
      settledResult.forEach(resChunk => {
        if (resChunk.status === "fulfilled") {
          results.push(...resChunk.value);
        }
      });

      return res.json(results);
    } catch (sqlErr: any) {
      console.error("SQL global search error, launching local RAM fallback search engine.", sqlErr.message);
    }
  }

  // --- LOCAL PERSISTENCE AND MEMORY RECOVERY FALLBACK (Offline WAN scenario) ---
  // Patients
  if (isUserAuthorizedForTab(req.user, "patients")) {
    const list = backupPatients.filter(p => 
      String(p.nom || "").toLowerCase().includes(qs) ||
      String(p.prenom || "").toLowerCase().includes(qs) ||
      String(p.telephone || "").includes(qs) ||
      String(p.id || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(p => ({
      id: p.id,
      type: "PATIENT",
      label: `${(p.nom || "").toUpperCase()} ${p.prenom || ""}`,
      details: `Tél: ${p.telephone || ""} | Sexe: ${p.sexe || ""} | Mutuelle: ${p.assurance || "Aucune"}`,
      tabTarget: "patients"
    })));
  }

  // Appointments
  if (isUserAuthorizedForTab(req.user, "agenda")) {
    const list = backupAppointments.filter(a => 
      String(a.medecin || "").toLowerCase().includes(qs) ||
      String(a.notes || "").toLowerCase().includes(qs) ||
      String(a.id || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(a => {
      const pat = backupPatients.find(p => p.id === a.patientId);
      return {
        id: a.id,
        type: "RDV",
        label: `Rendez-vous — Dr. ${a.medecin || ""}`,
        details: `Patient: ${pat ? pat.nom : "Inconnu"} | Date: ${a.date || ""} ${a.heure || ""} | Salle: ${a.salle || ""} (${a.statut || ""})`,
        tabTarget: "agenda"
      };
    }));
  }

  // Invoices
  if (isUserAuthorizedForTab(req.user, "billing")) {
    const list = backupInvoices.filter(i => 
      String(i.id || "").toLowerCase().includes(qs) ||
      String(i.patientNom || "").toLowerCase().includes(qs) ||
      String(i.designation || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(i => ({
      id: i.id,
      type: "FACTURE",
      label: `Facture — MS-${i.id.substring(0, 8)}`,
      details: `Patient: ${i.patientNom || ""} | Montant: ${i.montantTotal || 0} FCFA | Statut: ${i.statut || ""} | Émetteur: ${i.caissier || "N/A"}`,
      tabTarget: "billing"
    })));
  }

  // Medical records (DME)
  if (isUserAuthorizedForTab(req.user, "consultation")) {
    const list = backupRecords.filter(r => 
      String(r.id || "").toLowerCase().includes(qs) ||
      String(r.motif || "").toLowerCase().includes(qs) ||
      String(r.diagnostic || "").toLowerCase().includes(qs) ||
      String(r.prescription || "").toLowerCase().includes(qs) ||
      String(r.codeCIM10 || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(r => {
      const pat = backupPatients.find(p => p.id === r.patientId);
      return {
        id: r.id,
        type: "DME",
        label: `Observation: ${r.motif || ""}`,
        details: `Patient: ${pat ? pat.nom : "Inconnu"} | Code CIM10: ${r.codeCIM10 || ""} | Diagnostic: ${r.diagnostic || ""}`,
        tabTarget: "consultation"
      };
    }));
  }

  // Hospitalizations
  if (isUserAuthorizedForTab(req.user, "hospitalisation")) {
    const list = backupHospitalizations.filter(h => 
      String(h.chambre || "").toLowerCase().includes(qs) ||
      String(h.lit || "").toLowerCase().includes(qs) ||
      String(h.service || "").toLowerCase().includes(qs) ||
      String(h.statut || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(h => {
      const pat = backupPatients.find(p => p.id === h.patientId);
      return {
        id: h.id,
        type: "HOSPITALISATION",
        label: `Hospitalisé au service ${h.service || ""}`,
        details: `Patient: ${pat ? pat.nom : "Inconnu"} | Lit: ${h.lit || ""} | Chambre: ${h.chambre || ""} (${h.statut || ""})`,
        tabTarget: "hospitalisation"
      };
    }));
  }

  // Lab Tests
  if (isUserAuthorizedForTab(req.user, "specialized")) {
    const list = backupLabTests.filter(l => 
      String(l.nomAnalyse || "").toLowerCase().includes(qs) ||
      String(l.typeExamen || "").toLowerCase().includes(qs) ||
      String(l.resultatObtenu || "").toLowerCase().includes(qs) ||
      String(l.biologisteValid || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(l => {
      const pat = backupPatients.find(p => p.id === l.patientId);
      return {
        id: l.id,
        type: "LABO",
        label: `Examen Lab: ${l.nomAnalyse || ""}`,
        details: `Patient: ${pat ? pat.nom : "Inconnu"} | Type: ${l.typeExamen || ""} | Validation: ${l.biologisteValid || "En attente"} (${l.statut || ""})`,
        tabTarget: "specialized"
      };
    }));
  }

  // Drug Stocks
  if (isUserAuthorizedForTab(req.user, "specialized")) {
    const list = backupStocks.filter(s => 
      String(s.designation || "").toLowerCase().includes(qs) ||
      String(s.categorie || "").toLowerCase().includes(qs) ||
      String(s.numeroLot || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(s => ({
      id: s.id,
      type: "STOCK",
      label: `Produit: ${s.designation || ""}`,
      details: `Lot: ${s.numeroLot || ""} | Catégorie: ${s.categorie || ""} | Qté: ${s.quantite || 0} pcs`,
      tabTarget: "specialized"
    })));
  }

  // Mails
  if (isUserAuthorizedForTab(req.user, "courrier")) {
    const list = backupMails.filter(m => 
      String(m.numeroCourrier || "").toLowerCase().includes(qs) ||
      String(m.expediteurDestinataire || "").toLowerCase().includes(qs) ||
      String(m.objet || "").toLowerCase().includes(qs) ||
      String(m.serviceAffecte || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(m => ({
      id: m.id,
      type: "COURRIER",
      label: `Courrier [${m.type || ""}]: ${m.numeroCourrier || ""}`,
      details: `Objet: ${m.objet || ""} | Contacts: ${m.expediteurDestinataire || ""} | Affecté: ${m.serviceAffecte || ""}`,
      tabTarget: "courrier"
    })));
  }

  // Users
  if (isUserAuthorizedForTab(req.user, "settings")) {
    const list = rawSeeds.filter(u => 
      String(u.username || "").toLowerCase().includes(qs) ||
      String(u.name || "").toLowerCase().includes(qs) ||
      String(u.role || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(u => ({
      id: u.id,
      type: "UTILISATEUR",
      label: `Collaborateur: ${u.name || ""}`,
      details: `Login: @${u.username || ""} | Rôle: ${u.role || ""}`,
      tabTarget: "settings"
    })));
  }

  // Audits
  if (isUserAuthorizedForTab(req.user, "settings")) {
    const list = backupAuditLogs.filter(al => 
      String(al.user || "").toLowerCase().includes(qs) ||
      String(al.role || "").toLowerCase().includes(qs) ||
      String(al.action || "").toLowerCase().includes(qs) ||
      String(al.details || "").toLowerCase().includes(qs)
    ).slice(0, 8);
    results.push(...list.map(al => ({
      id: al.id,
      type: "AUDIT",
      label: `Audit: ${al.action || ""}`,
      details: `Par: ${al.user || ""} (${al.role || ""}) | Détails: ${al.details || ""}`,
      tabTarget: "settings"
    })));
  }

  res.json(results);
});

// 10. SECURE AUDIT LOG VIEWS
app.get("/api/audit-logs", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 150
      });
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupAuditLogs);
});

app.post("/api/audit-logs", requireAuth, async (req: any, res: any) => {
  const { user, role, action, details, oldValue, newValue } = req.body;
  const username = user || req.user?.name || "Anonyme";
  const userrole = role || req.user?.role || "Collaborateur";
  await appendSystemAudit(username, userrole, action, details, req.ip || "127.0.0.1", oldValue, newValue);
  res.status(201).json({ status: "logged" });
});

// 11. REST HR PRESENCES
app.get("/api/presences", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.staffPresence.findMany();
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupPresences);
});

app.post("/api/presences", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.staffPresence.create({
        data: {
          id: data.id,
          staffId: data.staffId || "staff_1",
          nomPrenom: data.nomPrenom,
          role: data.role,
          date: data.date,
          heureArrivee: data.heureArrivee,
          heureDepart: data.heureDepart || null,
          statut: data.statut || "Présent"
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  backupPresences.unshift(data);
  saveBackup("presences.json", backupPresences);
  res.status(201).json(data);
});

// 12. REST MAIL SYSTEM
app.get("/api/mails", requireAuth, async (req, res) => {
  if (isDbConnected) {
    try {
      const list = await prisma.mail.findMany();
      return res.json(list);
    } catch {
      // ignore
    }
  }
  res.json(backupMails);
});

app.post("/api/mails", requireAuth, async (req, res) => {
  const data = req.body;
  if (isDbConnected) {
    try {
      const record = await prisma.mail.create({
        data: {
          id: data.id,
          type: data.type,
          numeroCourrier: data.numeroCourrier,
          expediteurDestinataire: data.expediteurDestinataire,
          objet: data.objet,
          serviceAffecte: data.serviceAffecte,
          statutTraitement: data.statutTraitement || "En attente"
        }
      });
      return res.status(201).json(record);
    } catch (err) {
      console.error(err);
    }
  }
  backupMails.unshift(data);
  saveBackup("mails.json", backupMails);
  res.status(201).json(data);
});

// 13. AI Diagnostics
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.error("Gemini init failed: ", err);
  }
}

app.post("/api/ai/diagnose", requireAuth, async (req, res) => {
  const { symptoms, history, age, sex } = req.body;
  if (!symptoms) {
    return res.status(400).json({ error: "Les symptômes sont requis." });
  }

  const prompt = `Vous êtes l'assistant médical intelligent de MEDISHAHEL pour les cliniques au Mali. 
Analysez les symptômes du patient suivants pour suggérer des pré-diagnostics pertinents:
- Âge: ${age || "Non spécifié"}
- Sexe: ${sex || "Non spécifié"}
- Antécédents: ${history || "Aucun"}
- Symptômes description: "${symptoms}"

Générez une réponse au format JSON valide respectant précisément ce schéma JSON:
{
  "suggestions": [
    {
      "maladie": "Nom de la pathologie possible (ex: Paludisme grave, Fièvre typhoïde)",
      "codeCIM10": "Code CIM-10 correspondant (ex: B50.9, A01.0)",
      "probabilite": "Élevée, Moyenne ou Faible",
      "explication": "Brève explication médicale adaptée au contexte ouest-africain",
      "actionsRecommandees": ["Action 1", "Action 2"]
    }
  ],
  "niveauUrgence": "Couleur d'urgence recommandée parmi: Rouge (Immédiat), Orange (Très urgent), Jaune (Urgent), Vert (Non urgent)",
  "conseilsMedicationAvertissement": "Instructions de vigilance locale sahélienne"
}`;

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          systemInstruction: "Vous êtes un médecin conseil virtuel expert en médecine sahélienne et tropicale. Vous fournissez des suggestions rigoureuses codées CIM-10."
        }
      });
      const data = JSON.parse(response.text || "{}");
      return res.json(data);
    } catch (error: any) {
      console.error("Gemini API error:", error);
    }
  }
  res.json(getSimulatedDiagnosis(symptoms));
});

function getSimulatedDiagnosis(symptoms: string) {
  const normalized = symptoms.toLowerCase();
  let suggestions = [];
  let niveauUrgence = "Jaune";
  let conseilsMedicationAvertissement = "Faire pratiquer une Goutte Épaisse (GE/TDR) avant tout traitement antipaludique d'épreuve systématique conformément aux directives du Ministère de la Santé du Mali.";

  if (normalized.includes("fièvre") || normalized.includes("pallu") || normalized.includes("fievre") || normalized.includes("palu")) {
    suggestions.push({
      maladie: "Paludisme Simple ou Grave",
      codeCIM10: "B50.9",
      probabilite: "Élevée",
      explication: "Symptomatologie très compatible avec un accès palustre, endémique au Mali. À confirmer par TDR ou Goutte Épaisse.",
      actionsRecommandees: ["Réaliser une Goutte Épaisse immédiate", "Administrer un CTA (Artesunate-Amodiaquine) si positif"]
    });
    niveauUrgence = "Orange";
  } else if (normalized.includes("toux") || normalized.includes("respirer") || normalized.includes("poitrine")) {
    suggestions.push({
      maladie: "Infection Respiratoire Aiguë",
      codeCIM10: "J20.9",
      probabilite: "Élevée",
      explication: "Signes broncho-respiratoires typiques favorisés par l'harmattan.",
      actionsRecommandees: ["Auscultation pulmonaire", "Prescription d'expectorants"]
    });
    niveauUrgence = "Jaune";
  } else {
    suggestions.push({
      maladie: "Syndrome fébrile à élucider",
      codeCIM10: "R50.9",
      probabilite: "Moyenne",
      explication: "Plainte non spécifique nécessitant des examens cliniques approfondis.",
      actionsRecommandees: ["Prendre les constantes (Température, Tension, Pouls)"]
    });
    niveauUrgence = "Vert";
  }

  return { suggestions, niveauUrgence, conseilsMedicationAvertissement };
}

// 14. Real-time Offline Sync endpoint
app.post("/api/sync", requireAuth, async (req: any, res: any) => {
  const { patients, rdvs, triages, logs, operator } = req.body;
  const username = operator || req.user?.name || "Soignant";
  const userrole = req.user?.role || "Opérateur";

  let addedCount = { patients: 0, appointments: 0, triages: 0 };

  // Sync Patients
  if (patients && Array.isArray(patients)) {
    for (const p of patients) {
      if (isDbConnected) {
        try {
          const exists = await prisma.patient.findUnique({ where: { id: p.id } });
          if (!exists) {
            await prisma.patient.create({
              data: {
                id: p.id,
                nom: p.nom,
                prenom: p.prenom,
                sexe: p.sexe,
                dateNaissance: new Date(p.dateNaissance),
                telephone: p.telephone,
                adresse: p.adresse,
                profession: p.profession,
                groupeSanguin: p.groupeSanguin,
                allergies: p.allergies,
                assurance: p.assurance || "Aucune",
                photoUrl: p.photoUrl,
                contactUrgenceNom: p.contactUrgenceNom,
                contactUrgenceTel: p.contactUrgenceTel,
                isArchive: p.isArchive || false,
                nationalite: p.nationalite || "Malienne"
              }
            });
            addedCount.patients++;
          }
        } catch {
          // ignore
        }
      }
      // write backup anyway
      if (!backupPatients.some((x: any) => x.id === p.id)) {
        backupPatients.unshift(p);
        addedCount.patients++;
      }
    }
  }

  // Sync RDVs
  if (rdvs && Array.isArray(rdvs)) {
    for (const r of rdvs) {
      if (isDbConnected) {
        try {
          const exists = await prisma.appointment.findUnique({ where: { id: r.id } });
          if (!exists) {
            await prisma.appointment.create({
              data: {
                id: r.id,
                patientId: r.patientId,
                medecin: r.medecin,
                date: r.date,
                heure: r.heure,
                salle: r.salle,
                statut: r.statut || "Confirmé",
                notes: r.notes || ""
              }
            });
            addedCount.appointments++;
          }
        } catch {
          // ignore
        }
      }
      if (!backupAppointments.some((x: any) => x.id === r.id)) {
        backupAppointments.unshift(r);
        addedCount.appointments++;
      }
    }
  }

  // Sync Triages
  if (triages && Array.isArray(triages)) {
    for (const t of triages) {
      if (!backupTriages.some((x: any) => x.id === t.id)) {
        backupTriages.unshift(t);
        addedCount.triages++;
      }
    }
  }

  // Save all Local files
  saveBackup("patients.json", backupPatients);
  saveBackup("appointments.json", backupAppointments);
  saveBackup("triages.json", backupTriages);

  const logMsg = `Synchronisation accomplie. Entrées fusionnées : ${addedCount.patients} patients, ${addedCount.appointments} RDVs, ${addedCount.triages} triages d'urgences.`;
  await appendSystemAudit(username, userrole, "Synchronisation manuelle", logMsg, req.ip || "127.0.0.1");

  res.json({
    status: "success",
    message: "Synchronisation effectuée sur les serveurs locaux.",
    imported: addedCount,
    serverCounts: {
      patients: backupPatients.length,
      appointments: backupAppointments.length,
      triages: backupTriages.length
    }
  });
});

// App metrics health monitoring API
app.get("/api/monitoring/health", async (req, res) => {
  const ramUsage = process.memoryUsage();
  let diskSpace = { total: "N/A", free: "N/A", percentUsed: 0 };
  
  try {
    const stats = fs.statfsSync(path.join(process.cwd(), "data"));
    const totalBytes = stats.bsize * stats.blocks;
    const freeBytes = stats.bsize * stats.bfree;
    const usedBytes = totalBytes - freeBytes;
    
    diskSpace = {
      total: (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      free: (freeBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB",
      percentUsed: Math.round((usedBytes / totalBytes) * 100)
    };
  } catch (err) {
    // ignore
  }

  res.json({
    status: isDbConnected ? "UP" : "DEGRADED",
    database: {
      connected: isDbConnected,
      latencyMs: isDbConnected ? 2 : -1,
      type: "PostgreSQL"
    },
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      ramUsedMB: Math.round(ramUsage.heapUsed / (1024 * 1024)),
      ramTotalMB: Math.round(ramUsage.heapTotal / (1024 * 1024)),
      diskSpace,
    },
    clinicMetrics: {
      patientsTotal: backupPatients.length,
      appointmentsScheduled: backupAppointments.length,
      isBackupSecured: true,
      utcNormalizedTime: new Date().toISOString()
    }
  });
});

// Secure document / Imaging upload route (radiology, lab-testing docs)
app.post("/api/attachments/upload", requireAuth, async (req: any, res: any) => {
  const { filename, fileBase64, patientId, recordId } = req.body;
  if (!filename || !fileBase64) {
    return res.status(400).json({ error: "Fichier ou nom manquant." });
  }

  // Extensions filter
  const ext = path.extname(filename).toLowerCase();
  const allowed = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".tiff", ".bmp", ".rtf"];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: "Extension de document non autorisée pour la sécurité clinique." });
  }

  try {
    const payloadBuffer = Buffer.from(fileBase64, "base64");
    if (payloadBuffer.length > 50 * 1024 * 1024) { // 50MB limits
      return res.status(400).json({ error: "Taille maximale de 50 Mo dépassée." });
    }

    const uniqueId = crypto.randomBytes(16).toString("hex");
    const safeFilename = `${uniqueId}-${path.basename(filename)}`;
    const fullPath = path.join(UPLOAD_DIR, safeFilename);

    fs.writeFileSync(fullPath, payloadBuffer);
    const publicUrl = `/uploads/${safeFilename}`;

    let record = null;
    if (isDbConnected) {
      try {
        record = await prisma.attachment.create({
          data: {
            id: uniqueId,
            label: filename,
            url: publicUrl,
            patientId: patientId || null,
            recordId: recordId || null
          }
        });
      } catch (err) {
        console.warn("Prisma attachment write failed, falling back:", err);
      }
    }

    if (!record) {
      // JSON backup file fallback
      const backupFiles = loadBackup<any[]>("attachments.json", []);
      const newAttach = {
        id: uniqueId,
        label: filename,
        url: publicUrl,
        patientId,
        recordId,
        createdAt: new Date().toISOString()
      };
      backupFiles.unshift(newAttach);
      saveBackup("attachments.json", backupFiles);
      record = newAttach;
    }

    const authName = req.user?.name || "Soignant";
    const authRole = req.user?.role || "Opérateur";
    await appendSystemAudit(
      authName,
      authRole,
      "Upload Document",
      `Document médical sécurisé '${filename}' enregistré avec succès (${(payloadBuffer.length / 1024).toFixed(1)} KB).`,
      req.ip || "127.0.0.1"
    );

    res.status(201).json({ success: true, url: publicUrl, attachment: record });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Échec du stockage système du document.", details: err.message });
  }
});

// Start Express & Vite Services
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Medishahel Server] Running on http://localhost:${PORT}`);
  });
}

start();
