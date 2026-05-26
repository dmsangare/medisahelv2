import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database for Simulation and Sync
let clinicBranding = {
  name: "MédiSahel Clinique",
  slogan: "L'excellence des soins au cœur du Sahel",
  primaryColor: "#0284c7", // sky-600
  secondaryColor: "#0f766e", // teal-700
  logoUrl: "",
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

let auditLogs: Array<{
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details: string;
  ip: string;
}> = [
  {
    id: "log_1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    user: "Dr. Sangaré",
    role: "Médecin",
    action: "Consultation créée",
    details: "Dossier patient #MS-2026-0045, Dr. Sangaré",
    ip: "192.168.1.15"
  },
  {
    id: "log_2",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: "Cms. Maïga",
    role: "Caissier",
    action: "Encaissement Facture",
    details: "Facture #FAC-2026-0912 d'un montant de 25,000 FCFA (Orange Money)",
    ip: "192.168.1.22"
  },
  {
    id: "log_3",
    timestamp: new Date().toISOString(),
    user: "Admin Système",
    role: "Administrateur Système",
    action: "Paramètres modifiés",
    details: "Mise à jour du slogan de l'établissement",
    ip: "127.0.0.1"
  }
];

// Seed Data
let patientsList = [
  { id: "MS-2026-0045", nom: "Diarra", prenom: "Amadou", sexe: "M", dateNaissance: "1988-04-12", telephone: "+223 76 54 32 10", adresse: "Badalabougou, Bamako", profession: "Enseignant", groupeSanguin: "O+", allergies: "Pénicilline", assurance: "INPS (80%)" },
  { id: "MS-2026-0046", nom: "Traoré", prenom: "Fatoumata", sexe: "F", dateNaissance: "1994-09-25", telephone: "+223 66 78 90 12", adresse: "Kalaban Coura, Bamako", profession: "Commerçante", groupeSanguin: "A+", allergies: "Aucune", assurance: "Aucune" },
  { id: "MS-2026-0047", nom: "Coulibaly", prenom: "Ousmane", sexe: "M", dateNaissance: "2015-02-03", telephone: "+223 75 43 21 09", adresse: "Sogoniko, Bamako", profession: "Élève", groupeSanguin: "B-", allergies: "Poussière", assurance: "CANAM (70%)" },
  { id: "MS-2026-0048", nom: "Keïta", prenom: "Mariam", sexe: "F", dateNaissance: "1972-11-30", telephone: "+223 69 11 22 33", adresse: "Hamdallaye ACI 2000, Bamako", profession: "Directrice de société", groupeSanguin: "AB+", allergies: "Aspirine", assurance: "MFA" }
];

let rdvList = [
  { id: "rdv_1", patientId: "MS-2026-0045", patientNom: "Diarra Amadou", medecin: "Dr. Sangaré (Généraliste)", date: "2026-05-26", heure: "09:00", salle: "Cabinet 1", statut: "Confirmé" },
  { id: "rdv_2", patientId: "MS-2026-0046", patientNom: "Traoré Fatoumata", medecin: "Dr. Diallo (Pédiatre)", date: "2026-05-26", heure: "10:30", salle: "Cabinet 2", statut: "En attente" },
  { id: "rdv_3", patientId: "MS-2026-0047", patientNom: "Coulibaly Ousmane", medecin: "Dr. Koné (Sage-femme / Obstétricienne)", date: "2026-05-27", heure: "14:00", salle: "Salle de Consultation", statut: "Confirmé" }
];

let triageList = [
  { id: "tr_1", patientId: "MS-2026-0047", patientNom: "Coulibaly Ousmane", plainte: "Fièvre élevée et convulsions", couleur: "Rouge", heureArrivee: "08:15", statut: "En cours de soins" },
  { id: "tr_2", patientId: "MS-2026-0048", patientNom: "Keïta Mariam", plainte: "Suspicion de fracture du poignet", couleur: "Jaune", heureArrivee: "08:35", statut: "Attente médecin" }
];

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Gemini Client: ", err);
  }
} else {
  console.log("No GEMINI_API_KEY env variable found. Using simulated intelligent diagnostics.");
}

// REST API Endpoints

// 1. Diagnostics Assistés par IA (CIM-10 Classification & Triage recommendation)
app.post("/api/ai/diagnose", async (req, res) => {
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
  "conseilsMedicationAvertissement": "Instructions de biosécurité ou de vigilance locale"
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

      const text = response.text || "{}";
      const data = JSON.parse(text);
      return res.json(data);
    } catch (error: any) {
      console.error("Error calling Gemini API for diagnosis:", error);
      return res.status(500).json({
        error: "Erreur lors de la génération par l'IA",
        details: error.message,
        simulated: true,
        ...getSimulatedDiagnosis(symptoms)
      });
    }
  } else {
    // Return custom mock simulated response based on keywords to keep the tool beautiful
    return res.json(getSimulatedDiagnosis(symptoms));
  }
});

// Helper for simulated medical analysis when API Key is missing
function getSimulatedDiagnosis(symptoms: string) {
  const normalized = symptoms.toLowerCase();
  let suggestions = [];
  let niveauUrgence = "Jaune";
  let conseilsMedicationAvertissement = "Faire pratiquer une Goutte Épaisse (GE/TDR) avant tout traitement antipaludique d'épreuve systématique conformément aux directives du Ministère de la Santé du Mali.";

  if (normalized.includes("fièvre") || normalized.includes("fievre") || normalized.includes("chaud") || normalized.includes("palu")) {
    suggestions.push({
      maladie: "Paludisme Simple ou Grave",
      codeCIM10: "B54 / B50.9",
      probabilite: "Élevée",
      explication: "Symptomatologie très compatible avec un accès palustre, endémique au Mali. À confirmer par TDR ou Goutte Épaisse.",
      actionsRecommandees: ["Réaliser une Goutte Épaisse immédiate", "Administrer un CTA (Artesunate-Amodiaquine ou Artémether-Luméfantrine) si positif", "Surveiller les signes de gravité (convulsion, anémie, urines foncées)"]
    });
    suggestions.push({
      maladie: "Fièvre Typhoïde ou Paratyphoïde",
      codeCIM10: "A01.0",
      probabilite: "Moyenne",
      explication: "Fièvre prolongée avec troubles digestifs possibles, contamination hydrique courante.",
      actionsRecommandees: ["Faire un Hémogramme et Hémoculture ou test Widal", "Recommander de l'eau bouillie ou minérale"]
    });
    niveauUrgence = "Orange";
  } else if (normalized.includes("toux") || normalized.includes("poitrine") || normalized.includes("respirer")) {
    suggestions.push({
      maladie: "Infection Respiratoire Aiguë / Bronchite",
      codeCIM10: "J20.9",
      probabilite: "Élevée",
      explication: "Signes broncho-respiratoires typiques favorisés par l'harmattan ou les poussières urbaines.",
      actionsRecommandees: ["Auscultation pulmonaire", "Prescription de bronchodilatateurs et hydratation", "Exclure pneumopathie bactérienne sévère"]
    });
    niveauUrgence = "Jaune";
  } else if (normalized.includes("ventre") || normalized.includes("diarrhée") || normalized.includes("vomir")) {
    suggestions.push({
      maladie: "Gastro-entérite Infectieuse",
      codeCIM10: "A09.9",
      probabilite: "Élevée",
      explication: "Infection digestive à transmission fécale-orale courante en saison des pluies ou zone de précarité sanitaire.",
      actionsRecommandees: ["Réhydratation orale (SRO) immédiate", "Coproculture si persistance", "Alimentation fractionnée"]
    });
    niveauUrgence = "Jaune";
  } else {
    // Default tropical medical suggestion
    suggestions.push({
      maladie: "Syndrome fébrile à élucider",
      codeCIM10: "R50.9",
      probabilite: "Moyenne",
      explication: "Plainte non spécifique nécessitant une constellation d'examens paracliniques standard (NFS, CRP, GE/TDR).",
      actionsRecommandees: ["Prise des constantes de base (T°, TA, Pouls, SpO2)", "Consultation clinique approfondie"]
    });
    niveauUrgence = "Vert";
  }

  return { suggestions, niveauUrgence, conseilsMedicationAvertissement };
}

// 2. Branding structure endpoints (Branding custom)
app.get("/api/clinics/brand", (req, res) => {
  res.json(clinicBranding);
});

app.post("/api/clinics/brand", (req, res) => {
  clinicBranding = { ...clinicBranding, ...req.body };
  // Log configuration change
  auditLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "Super Admin",
    role: "Administrateur Système",
    action: "Branding clinique mis à jour",
    details: `Paramètres de l'établissement modifiés (Nom: ${clinicBranding.name})`,
    ip: req.ip || "127.0.0.1"
  });
  res.json({ message: "Branding mis à jour avec succès", data: clinicBranding });
});

// 3. Audit Logs View
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

app.post("/api/audit-logs", (req, res) => {
  const { user, role, action, details } = req.body;
  const newLog = {
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    user: user || "Anonyme",
    role: role || 'Visiteur',
    action: action || 'Action',
    details: details || '',
    ip: req.ip || "127.0.0.1"
  };
  auditLogs.unshift(newLog);
  if (auditLogs.length > 200) auditLogs.pop(); // Keep size check
  res.status(201).json(newLog);
});

// 4. Offline Synchronisation Endpoint
app.post("/api/sync", (req, res) => {
  const { patients, rdvs, triages, logs, operator } = req.body;

  let addedCount = { patients: 0, rdvs: 0, triages: 0 };

  if (patients && Array.isArray(patients)) {
    patients.forEach((p: any) => {
      if (!patientsList.some(item => item.id === p.id)) {
        patientsList.push(p);
        addedCount.patients++;
      }
    });
  }

  if (rdvs && Array.isArray(rdvs)) {
    rdvs.forEach((r: any) => {
      if (!rdvList.some(item => item.id === r.id)) {
        rdvList.push(r);
        addedCount.rdvs++;
      }
    });
  }

  if (triages && Array.isArray(triages)) {
    triages.forEach((t: any) => {
      if (!triageList.some(item => item.id === t.id)) {
        triageList.push(t);
        addedCount.triages++;
      }
    });
  }

  const logMsg = `Synchronisation réussie effectuée par l'opérateur: ${operator || "Inconnu"}. Éléments importés: ${addedCount.patients} patients, ${addedCount.rdvs} RDVs, ${addedCount.triages} urgences triage.`;
  
  auditLogs.unshift({
    id: "log_" + Date.now(),
    timestamp: new Date().toISOString(),
    user: operator || "Utilisateur Local",
    role: "Médecin / Caissier",
    action: "Synchronisation Locale-Serveur",
    details: logMsg,
    ip: req.ip || "127.0.0.1"
  });

  res.json({
    status: "success",
    message: "Synchronisation complétée avec succès.",
    imported: addedCount,
    serverCounts: {
      patients: patientsList.length,
      rdvs: rdvList.length,
      triages: triageList.length
    }
  });
});

// Initializing Vite middleware for dev or Static asset routing for production
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
