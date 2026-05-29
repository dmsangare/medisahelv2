import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

const clinicBranding = {
  name: "MédiSahel Clinique",
  appName: "MEDISHAHEL",
  slogan: "L'excellence des soins au cœur du Sahel",
  primaryColor: "#0284c7",
  secondaryColor: "#0f766e",
};

const rawSeeds = [
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

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

async function main() {
  console.log("🌱 Début du seeding de la base de données MédiSahel...");

  // 1. Seed System Settings
  const settingsCount = await prisma.systemSettings.count();
  if (settingsCount === 0) {
    console.log("Configuration des paramètres système...");
    await prisma.systemSettings.create({
      data: {
        name: "Medishahel Settings",
        valueJson: JSON.stringify(clinicBranding),
      },
    });
  }

  // 2. Seed Users
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log("Seeding des utilisateurs par défaut...");
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
          allowedHoursStart: raw.allowedHoursStart || null,
          allowedHoursEnd: raw.allowedHoursEnd || null,
          allowedModules: ["patients", "rdv", "dme", "hospitalisation", "labo", "pharmacie", "facturation", "courrier", "rapports"],
        },
      });
    }
  }

  console.log("🏁 Seeding complété avec succès !");
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding de la base de données :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
