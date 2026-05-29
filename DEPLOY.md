# Guide de Déploiement Production — MédiSahel v2

Ce guide décrit la procédure pas à pas pour déployer l'application **MédiSahel v2** de manière stable, sécurisée et "production-ready" sur vos serveurs de production (Ubuntu/Debian) avec Docker et Docker Compose.

---

## 1. Prérequis Système

- **Système d'exploitation** : Ubuntu Server (20.04 ou supérieur recommandé) ou Debian.
- **Docker Engine** : v24.0.0 ou supérieur.
- **Docker Compose** : v2.20.0 ou supérieur.
- **Accès internet** (uniquement pour le premier build, afin de télécharger les paquets depuis le registry npm et l'image Debian Slim de base).

---

## 2. Configuration des Variables d'Environnement (`.env`)

Avant de lancer le build Docker, vous devez configurer les variables d'environnement. Un fichier exemple `.env.example` est fourni à la racine.

1. Dupliquez le fichier d'exemple :
   ```bash
   cp .env.example .env
   ```

2. Éditez le fichier `.env` avec vos configurations réelles :
   ```bash
   nano .env
   ```

### Variables obligatoires à configurer :

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `DATABASE_URL` | Chaîne de connexion PostgreSQL sécurisée pour Prisma. | `postgresql://medisahel_user:SECRET_PASS@postgres:5432/medisahel_db?schema=public` |
| `JWT_SECRET` | Clé secrète cryptographique forte (minimum 64 caractères) pour sécuriser l'authentification des soignants. | `4a8f9b2d8...[64+ caractères]` |
| `GEMINI_API_KEY` | Clé d'API Google Gemini pour les fonctionnalités de résumé automatique d'analyses (optionnel). | `AIzaSyD...` |
| `APP_URL` | URL publique ou IP locale d'accès à l'application. | `https://medisahel.mon-hopital.org` |

---

## 3. Lancer le déploiement avec Docker Compose

L'architecture s'appuie sur une compilation multi-stage extrêmement rapide et sécurisée. Une image Debian standard (`node:20-bookworm-slim`) est utilisée pour assurer la présence native d'**OpenSSL** et de la **glibc** sans risquer d'erreurs de compatibilité de binaire avec Prisma.

### Commandes de déploiement :

1. Reconstruire les images Docker à partir de zéro, en contournant le cache pour garantir de nouvelles dépendances propres :
   ```bash
   sudo docker compose build --no-cache
   ```

2. Démarrer les services en arrière-plan (mode détaché) :
   ```bash
   sudo docker compose up -d
   ```

3. Vérifier le bon démarrage des conteneurs :
   ```bash
   sudo docker compose ps
   ```

---

## 4. Initialisation de la Base de Données (Migration & Seed)

Une fois les conteneurs démarrés, vous devez initialiser le schéma de la base de données PostgreSQL et y insérer les comptes de soignants par défaut.

### Étape A : Appliquer le schéma relationnel de production
Exécutez la commande suivante pour déployer les tables à partir de la migration initiale standard contenue dans `/prisma/migrations` :
```bash
sudo docker compose exec medishahel-app npx prisma migrate deploy
```

### Étape B : Insérer les configurations et utilisateurs par défaut (Seeding)
Le script de seed utilise une méthode cryptographique robuste (PBKDF2 avec sel unique par utilisateur) et est configuré dans le `package.json`. Lancez l'outil :
```bash
sudo docker compose exec medishahel-app npx prisma db seed
```

---

## 5. Comptes de Soignants créés par Défaut

Le tableau suivant liste les identifiants d'accès initiaux générés par le script de seeding. **Il est impératif de modifier ces mots de passe pour des raisons évidentes de secret médical clinique.**

| Rôle | Nom | Identifiant | Mot de passe initial |
| :--- | :--- | :--- | :--- |
| **Administrateur** | Sidi Coulibaly | `admin` | `AdminPassword2026!` |
| **Médecin** | Dr. Amadou Sangaré | `dr_sangare` | `DoctorPassword2026!` |
| **Infirmier** | Fatoumata Maïga | `inf_fatoumata` | `NursePassword2026!` |
| **Caissier** | Ibrahim Maïga | `caiss_maiga` | `CashierPassword2026!` |
| **Sage-femme** | Fanta Diallo | `sage_fanta` | `MidwifePassword2026!` |
| **Pharmacienne** | Aminata | `rx_pharmacien` | `PharmacistPassword2026!` |

---

## 6. Sécurité en Production & Modification des Mots de Passe

### Changer le mot de passe Administrateur
Dès la première connexion :
1. Connectez-vous sur l'interface d'administration clinique via le compte `admin`.
2. Dirigez-vous vers le module **Paramètres Système** ou **Gestion du Personnel** (RH).
3. Éditez votre fiche utilisateur pour définir un mot de passe robuste conforme à vos règles de sécurité interne (minimum 8 caractères, caractères spéciaux, majuscules).
4. Optionnellement, restreignez les heures d'accès et les adresses IP autorisées pour chaque soignant depuis le tableau de bord RH.

### Précautions d'Infrastructure Non-Root
L'application de production s'exécute sous l'utilisateur anonyme standard **`node`** (uid: 1000) et non en tant que `root`. Toutes les permissions de fichiers dans `node_modules` et `prisma` sont restaurées en mode lecture/écriture sécurisé au cours de l'étape de compilation pour préserver l'intégrité de l'environnement hôte.
