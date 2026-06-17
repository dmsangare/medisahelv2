# 🏥 MédiSahel Clinique ERP – Suite Médicale v2.0.0-PROD

> **L'Excellence Médicale au cœur de l'Afrique de l'Ouest.**  
> Une solution full-stack de pointe pour la gestion clinique, le Dossier Médical Électronique (DME), la Caisse/Facturation, le Laboratoire (Biochimie), la Pharmacie (Habilitations FEFO) et la gestion administrative des Ressources Humaines.

---

## 🚀 Vue d'ensemble du Projet

MédiSahel v2.0.0 est conçu pour répondre aux normes cliniques et réglementaires les plus strictes en Afrique de l'Ouest sub-saharienne. Il s'agit d'une architecture full-stack robuste intégrant :
- **Front-end :** React 18, Vite, Tailwind CSS, Lucide Icons, Recharts, Motion.
- **Back-end :** Express.js avec support complet des transactions, système de permissions de niveau 3 (RBAC), et logs d'audit.
- **Persistance :** PostgreSQL relationnel de niveau production géré via Prisma.
- **Moteur d'IA Clinique :** Intégration sécurisée server-side du SDK Google Gemini AI pour l'aide au diagnostic différentiel et au dosage pharmacologique.

---

## ⚙️ Checklist d'Administration & Déploiement

Toutes les demandes de finalisation de **Dr. Adama SANGARÉ** ont été intégrées sans exception :

1. **Zéro Erreurs API & Branding :** 
   - Correction définitive de l'erreur `Unexpected token '<'` : Un intercepteur d'API global (`app.all("/api/*", ...)`) a été intégré dans `/server.ts` pour empêcher tout fallback HTML en cas de requête non-existante or malformée. Les requêtes erronées renvoient désormais des réponses JSON propres en statut `404`.
   - Tous les boutons "Enregistrer" de l'interface d'administration ont été vérifiés.
2. **Scripts SQL d'Initialisation et de Test fournis :**
   - **`scripts/init.sql`** : Génération complète de toutes les tables, index de performance, types ENUM, et clés étrangères reproduisant fidèlement le schéma de production relationnel.
   - **`scripts/seed.sql`** : Script d'injection SQL complet comprenant des données pré-configurées (Clinique centrale, tarifs d'admissions, analyses médicales types, lots de pharmacie avec dates de péremption, et patients tests).
3. **Configurations d'Environnement Multi-Milieux :**
   - Fourniture d'un fichier **`.env.prodution`** pré-configuré complet contenant les variables requises (Ports, DATABASE_URL, secrets JWT, clés d'API, etc.).
4. **PM2 & Orchestration de Processus Industrielle :**
   - Création de **`ecosystem.config.js`** pré-paramétré pour orchestrer et surveiller l'application clinique sous Ubuntu de manière clusterisée (Zéro Downtime Reload, auto-restructuration mémoire de 1G max, configurations d'environnement production chargées directement).
5. **Nginx & Reverse Proxy Sécurisé :**
   - Configuration réseau complète sous `/nginx.conf` intégrant :
     - Redirections forcées HTTP -> HTTPS.
     - En-têtes de sécurité OWASP (X-Frame-Options, X-Content-Type-Options, etc.).
     - Protection intégrée contre les attaques par force brute (directives `limit_req` sur la route `/api/auth/login`).
     - Configuration du reverse proxy pour le port interne `3000`.

---

## 🔑 Identifiants Cliniciens de Test (Disponibles à la Connexion)

Pour faciliter la validation des 10 différents rôles d'utilisateurs requis par la direction générale, des boutons à clic rapide ont été rajoutés sur l'écran d'accueil pour s'authentifier instantanément avec les profils suivants :

| Rôle Clinique | Identifiant à la Connexion | Mot de passe de Test | Département Associé |
| :--- | :--- | :--- | :--- |
| **Promoteur / DG** | `promoteur_dg` | `DGPassword2026!` | Direction Générale |
| **Administrateur IT** | `admin` | `AdminPassword2026!` | Direction Générale |
| **Médecin Référent** | `dr_sangare` | `DoctorPassword2026!` | Médecine Générale |
| **Infirmier Major** | `infirmier_test` | `InfirmierPassword2026!` | Médecine Générale |
| **Aide-Soignant** | `aide_soignant_test` | `AideSoignantPassword2026!` | Médecine Générale |
| **Stagiaire Médical** | `stagiaire_test` | `StagiairePassword2026!` | Médecine Générale |
| **Laborantin Biologiste** | `laborantin_test` | `LaborantinPassword2026!` | Laboratoire |
| **Pharmacienne Chef** | `pharmacien_test` | `PharmacienPassword2026!` | Pharmacie |
| **Caissier Principal** | `caissier_test` | `CaissierPassword2026!` | Facturation & Caisse |
| **Responsable RH** | `rh_test` | `RHPassword2026!` | Direction Générale |

---

## 🛠️ Commandes pour Démarrer en Développement

```bash
# 1. Installer les dépendances du projet
npm install

# 2. Lancer l'application en mode développement (Recharge automatique de l'API / Assets)
npm run dev
```

---

## 📦 Guide de Déploiement Clinique Rapide (Ubuntu GTS Server)

Pour un déploiement complet et détaillé étape par étape incluant la restauration de sauvegarde, la sécurisation réseau du Pare-feu (UFW), Cron et PM2, référez-vous au guide de référence :
👉 **[Accéder au guide complet dans DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

### Étape Rapide :
```bash
# 1. Cloner et configurer l'arborescence
cd /var/www/medisahel
npm install

# 2. Exécuter les migrations de base de données relationnelle
npx prisma generate
npx prisma migrate deploy

# 3. Compiler la production (Single CJS bundle standard)
npm run build

# 4. Lancer l'orchestration PM2
pm2 start ecosystem.config.js
pm2 save
```

---

## 📞 Support & Contacts de Secours
Pour tout dysfonctionnement, support, ou accompagnement en direct le jour de la mise en production :
- **Email Support :** `support.it@medisahel.ml`
- **Assistance Informatique Clinique :** Réseau de communication sécurisé d'Astreinte (MédiSahel).
- **Gravités de sévérité de niveau 1** : Garantie de Temps de Rétablissement (GTR) de **2 heures**.
