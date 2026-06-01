# Analyse d'Évolution Fonctionnelle & Technique : GECD
## MédiSahel Clinique V2 — Système d'Information Sanitaire

### 1. Analyse Fonctionnelle
Le module existant **Gestion de Courrier** est obsolète et fait l'objet d'une refonte complète et exclusive vers le nouveau module intitulé **GECD** (Gestion Électronique des Courriers et Documents) ou « Courriers & Documents » afin de prendre en charge à la fois les flux de correspondance officiels (entrants/sortants) et les archives de documents cliniques et administratifs.

#### Éléments Supprimés :
- Menu de navigation et libellé « Gestion de Courrier ».
- Vue rudimentaire sans classification documentaire.
- Compositeur de templates limité uniquement à Dr. Sangaré sans traçabilité des pièces justificatives.

#### Éléments Remplacés :
- L’ensemble de l'interface `CourrierView.tsx` est redéveloppée pour devenir `GecdView.tsx`.
- Introduction de catégories de documents réels : `Courrier Entrant`, `Courrier Sortant`, `Document Médical` (compte-rendus, certificats d'aptitude, arrêts de travail), `Document Administratif` (contrats, agréments, fiches RH).
- Pipeline complet d'affectation des documents aux dossiers des patients, services cibles ou ressources humaines.
- Moteur d'archivage numérique certifié avec génération automatique de numéros de référence uniques (GECD-2026-XXXX).

#### Éléments Conservés :
- L'intégrité de la table `Mail` de la base de données PostgreSQL (Prisma) sous-jacente pour assurer la compatibilité ascendante sans casse.
- L'API REST d'enregistrement et d'audit, harmonisée avec la nouvelle nomenclature.
- Le système de routage de rôle sécurisé par JWT et de persistance hors ligne locale (JSON / LocalStorage).

---

### 2. Analyse Technique

#### Données existantes & Compatibilité Prisma :
La table `Mail` de Prisma est réutilisée pour stocker les courriers GECD de manière unifiée :
```prisma
model Mail {
  id                 String   @id @default(uuid())
  type               String   // "Entrant", "Sortant", "Interne_Medical", "Interne_Admin"
  numeroCourrier     String   @unique // Auto format dynamique
  expediteurDestinataire String
  objet              String
  dateReceptionEnvoi DateTime @default(now())
  serviceAffecte     String
  statutTraitement   String   @default("En attente") // "En attente", "En cours", "Traité", "Archivé"
}
```

Pour les documents associés à un patient spécifique (Documents Médicaux, Certificats), le système s'articule également avec le modèle `Attachment` de Prisma :
```prisma
model Attachment {
  id                 String   @id @default(uuid())
  label              String
  url                String
  patientId          String?
  patient            Patient? @relation(fields: [patientId], references: [id])
  recordId           String?
  record             MedicalRecord? @relation(fields: [recordId], references: [id])
  createdAt          DateTime @default(now())
}
```

#### Routes API (Express) :
- `GET /api/mails` : Récupère la totalité des documents enregistrés au registre GECD.
- `POST /api/mails` : Crypte, horofate et insère un courrier ou un document scellé.
- `PUT /api/mails/:id` : Change le statut de traitement ou l'affectation de service.

#### Interfaces & Workflows de sécurité :
- Un badge de signature électronique obligatoire est inséré dans les exports imprimables.
- Validation automatique des habilitations RBAC (ex: les documents médicaux requièrent un rôle praticien/sage-femme/admin tandis que les documents de paie et facturations requièrent un rôle caissier/comptable/admin).

---

### 3. Plan de Migration & Risques

#### Compatibilité des données :
Les notices et courriers existants dans `mails.json` ou la base de données PostgreSQL voient leur type par défaut converti d'office en `Entrant` ou `Sortant`. Aucune donnée existante n'est supprimée ou invalidée lors de la mise en service.

#### Plan de déploiement :
1. Déploiement du composant `GecdView.tsx` pour remplacer intégralement `CourrierView.tsx`.
2. Liaison et mise à jour de la table de routage administrative dans `src/App.tsx` et `server.ts`.
3. Validation via compilation et l'outil de conformité de plateforme.

#### Risques identifiés & Contremesures :
- **Perte de synchronisation hors ligne** : Tous les documents rédigés ou certifiés en déplacement ou lors d'une déconnexion clinique sont empilés dans la file locale unifiée (`offlineQueue`) gérée par le Service Worker et flushés automatiquement dès la reconnexion.
