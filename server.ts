import express from "express";
import cors from "cors";
import path from "path";
import bcrypt from "bcryptjs";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.ts";
import { generateToken, verifyToken } from "./server/auth.ts";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper middleware to verify token and inject user context
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = payload;
  next();
};

// ================= AUTHENTICATION ENDPOINTS =================

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await db.users.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      clinicId: user.clinicId,
    });

    // Write login audit log
    await db.auditLogs.create({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: "CONNEXION",
      details: "Connexion réussie sur la plateforme."
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        mustChangePassword: user.mustChangePassword,
        clinicId: user.clinicId,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/auth/change-password", authenticate, async (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Anciens et nouveaux mots de passe requis" });
  }

  try {
    // We must find the user directly to verify their password hash
    const user = await db.users.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    const isMatch = bcrypt.compareSync(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Ancien mot de passe incorrect" });
    }

    // Hash same way as db creator
    await db.users.update(user.id, {
      password: newPassword,
      mustChangePassword: false
    });

    await db.auditLogs.create({
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: "REINITIALISATION_MOT_DE_PASSE",
      details: "Mise à jour obligatoire du mot de passe à la première connexion effectuée."
    });

    res.json({ success: true, message: "Mot de passe mis à jour avec succès" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/auth/me", authenticate, async (req: any, res) => {
  res.json({ user: req.user });
});

// ================= CLINICS BRANDING ENDPOINTS =================

app.get("/api/clinics", async (req, res) => {
  const list = await db.clinics.findMany();
  res.json(list);
});

app.get("/api/clinics/:id", async (req, res) => {
  const item = await db.clinics.findUnique(req.params.id);
  if (!item) return res.status(404).json({ error: "Clinique non trouvée" });
  res.json(item);
});

app.put("/api/clinics/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Droits d'administrateur nécessaires." });
  }
  const updated = await db.clinics.update(req.params.id, req.body);
  
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "CONFIGURATION_CLINIQUE",
    details: `Mise à jour du branding de la clinique: ${req.body.name || ""}`
  });

  res.json(updated);
});

// ================= GESTION DES PATIENTS ENDPOINTS =================

app.get("/api/patients", authenticate, async (req, res) => {
  const patients = await db.patients.findMany();
  res.json(patients);
});

app.post("/api/patients", authenticate, async (req: any, res) => {
  try {
    const created = await db.patients.create(req.body);
    await db.auditLogs.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: "CREATION_PATIENT",
      details: `Enregistrement du patient: ${created.firstName} ${created.lastName} (NID: ${created.nationalId})`
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/patients/:id", authenticate, async (req: any, res) => {
  const updated = await db.patients.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "MODIFICATION_PATIENT",
    details: `Mise à jour des coordonnées du patient ID: ${req.params.id}`
  });
  res.json(updated);
});

// ================= GESTION DOSSIER MEDICAL ELECTRONIQUE DME =================

app.get("/api/patients/:id/records", authenticate, async (req, res) => {
  const records = await db.medicalRecords.findMany(req.params.id);
  res.json(records);
});

app.post("/api/patients/:id/records", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    patientId: req.params.id,
    doctorId: req.user.id,
    doctorName: req.user.name
  };
  const created = await db.medicalRecords.create(payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "AJOUT_DOSSIER_MED",
    details: `Ajout d'une fiche médicale de diagnostic: ${payload.diagnosis}`
  });
  res.json(created);
});

// ================= HOSPITALISATION ENDPOINTS =================

app.get("/api/hospitalizations", authenticate, async (req, res) => {
  const hospitalizations = await db.hospitalizations.findMany();
  res.json(hospitalizations);
});

app.post("/api/hospitalizations", authenticate, async (req: any, res) => {
  const created = await db.hospitalizations.create(req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "HOSPITALISATION_ENTREE",
    details: `Admission du patient ID: ${req.body.patientId} en Chambre: ${req.body.roomNumber}, Lit: ${req.body.bedNumber}`
  });
  res.json(created);
});

app.put("/api/hospitalizations/:id", authenticate, async (req: any, res) => {
  const updated = await db.hospitalizations.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "HOSPITALISATION_MAJ",
    details: `Mise à jour hospitalisation ID: ${req.params.id} (Discharge/Notes)`
  });
  res.json(updated);
});

// ================= FACTURATION & CAISSE ENDPOINTS =================

app.get("/api/transactions", authenticate, async (req, res) => {
  const list = await db.transactions.findMany();
  res.json(list);
});

app.post("/api/transactions", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    cashierId: req.user.id,
    cashierName: req.user.name
  };
  const created = await db.transactions.create(payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "FACTURE_AJOUT",
    details: `Génération d'une transaction (${payload.type}) de ${payload.amount} FCFA pour ${payload.description}`
  });
  res.json(created);
});

app.put("/api/transactions/:id", authenticate, async (req: any, res) => {
  const updated = await db.transactions.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "FACTURE_PAIEMENT",
    details: `Encaissement/modification de facture ID: ${req.params.id} - Statut: ${req.body.status}`
  });
  res.json(updated);
});

// ================= PHARMACIE & STOCK ENDPOINTS =================

app.get("/api/inventory", authenticate, async (req, res) => {
  const list = await db.inventory.findMany();
  res.json(list);
});

app.post("/api/inventory", authenticate, async (req: any, res) => {
  const created = await db.inventory.create(req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "MEDICAMENT_AJOUT",
    details: `Nouveau produit en stock: ${created.name} (SKU: ${created.sku}, Quantité: ${created.quantity})`
  });
  res.json(created);
});

app.put("/api/inventory/:id", authenticate, async (req: any, res) => {
  const updated = await db.inventory.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "MEDICAMENT_AJOUT",
    details: `Ajustement de stock/prix ID: ${req.params.id}`
  });
  res.json(updated);
});

// ================= LABORATOIRE ENDPOINTS =================

app.get("/api/labtests", authenticate, async (req, res) => {
  const list = await db.labTests.findMany();
  res.json(list);
});

app.post("/api/labtests", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    requestedBy: req.user.name
  };
  const created = await db.labTests.create(payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "EXAMEN_LAB_REQUIS",
    details: `Demande d'examen de laboratoire: ${req.body.testName}`
  });
  res.json(created);
});

app.put("/api/labtests/:id", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    performedBy: req.user.name
  };
  const updated = await db.labTests.update(req.params.id, payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "EXAMEN_LAB_VALIDATION",
    details: `Saisie de résultats labo ID: ${req.params.id} par ${req.user.name}`
  });
  res.json(updated);
});

// ================= PRESENCES & RETARDS ENDPOINTS =================

app.get("/api/attendances", authenticate, async (req, res) => {
  const list = await db.attendances.findMany();
  res.json(list);
});

app.post("/api/attendances", authenticate, async (req: any, res) => {
  const created = await db.attendances.create(req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "HR_PRESENCE_CLOCK",
    details: `Pointage de présence enregistré: Collaborateur ID ${req.body.userId} - Statut: ${req.body.status}`
  });
  res.json(created);
});

// ================= PAIE & SALAIRES ENDPOINTS =================

app.get("/api/payrolls", authenticate, async (req, res) => {
  const list = await db.payrolls.findMany();
  res.json(list);
});

app.post("/api/payrolls", authenticate, async (req: any, res) => {
  if (req.user.role !== "HR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Privilèges RH administratifs requis." });
  }
  const created = await db.payrolls.create(req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "RH_PAIE_CREATION",
    details: `Génération fiche de salaire pour ID ${req.body.userId} (${req.body.month}/${req.body.year})`
  });
  res.json(created);
});

app.put("/api/payrolls/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "HR" && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Privilèges RH administratifs requis." });
  }
  const updated = await db.payrolls.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "RH_PAIE_MAJ",
    details: `Mise à jour fiche de salaire ID ${req.params.id} à l'état ${req.body.status}`
  });
  res.json(updated);
});

// ================= AGENDA & RENDEZ-VOUS ENDPOINTS =================

app.get("/api/appointments", authenticate, async (req, res) => {
  const list = await db.appointments.findMany();
  res.json(list);
});

app.post("/api/appointments", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    doctorName: req.body.doctorName || req.user.name
  };
  const created = await db.appointments.create(payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "AGENDA_RDV_AJOUT",
    details: `Rendez-vous fixé le ${payload.date} à ${payload.time} pour clinic ID: ${payload.patientId}`
  });
  res.json(created);
});

app.put("/api/appointments/:id", authenticate, async (req: any, res) => {
  const updated = await db.appointments.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "AGENDA_RDV_MAJ",
    details: `Mise à jour du rdv médical ID: ${req.params.id}`
  });
  res.json(updated);
});

// ================= ARCHIVE NUMERIQUE (GECD) ENDPOINTS =================

app.get("/api/documents", authenticate, async (req, res) => {
  const list = await db.documents.findMany();
  res.json(list);
});

app.post("/api/documents", authenticate, async (req: any, res) => {
  const payload = {
    ...req.body,
    ownerId: req.user.id,
    ownerName: req.user.name
  };
  const created = await db.documents.create(payload);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "GECD_DOC_VERSEMENT",
    details: `Versement de document numérique: ${payload.title} (${payload.fileType})`
  });
  res.json(created);
});

app.delete("/api/documents/:id", authenticate, async (req: any, res) => {
  const deleted = await db.documents.delete(req.params.id);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "GECD_DOC_SUPPRESSION",
    details: `Suppression de document ID ${req.params.id}`
  });
  res.json(deleted);
});

// ================= USERS & ROLE MANAGEMENT ENDPOINTS =================

app.get("/api/users", authenticate, async (req, res) => {
  const list = await db.users.findMany();
  res.json(list);
});

app.post("/api/users", authenticate, async (req: any, res) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Droits d'administrateur requis." });
  }

  try {
    const created = await db.users.create(req.body);
    await db.auditLogs.create({
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: "ERP_UTILISATEUR_CREATION",
      details: `Création du compte utilisateur: ${created.name} (${created.email}) avec le rôle ${created.role}`
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/users/:id", authenticate, async (req: any, res) => {
  if (req.user.role !== "ADMIN" && req.user.id !== req.params.id) {
    return res.status(403).json({ error: "Non autorisé" });
  }
  const updated = await db.users.update(req.params.id, req.body);
  await db.auditLogs.create({
    userId: req.user.id,
    userName: req.user.name,
    role: req.user.role,
    action: "ERP_UTILISATEUR_MAJ",
    details: `Modification de l'utilisateur ID: ${req.params.id}`
  });
  res.json(updated);
});

// ================= AUDIT LOGS ENDPOINTS =================

app.get("/api/auditlogs", authenticate, async (req: any, res) => {
  const logs = await db.auditLogs.findMany();
  res.json(logs);
});

// ================= VITE DEV SERVER AND STATIC ASSETS HANDLING =================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite developmental asset compiler mounted inside Express.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve index.html as a fallback for the SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production compiles inside 'dist'.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MédiSahel Clinique ERP started successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
