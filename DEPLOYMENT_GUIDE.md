# MÉDISAHEL V2 – CLINIQUE CENTRAL – GUIDE OFFICIEL DE DÉPLOIEMENT & DE MAINTENANCE
**Auteur :** Lead Architect MédiSahel  
**Date de révision :** Juin 2026  
**Cible :** Ubuntu Server 22.04 / 24.04 LTS (x64)  
**Version :** v2.0.0-PROD  

---

## Sommaire
1. [Guide d'Installation Pas à Pas](#1-guide-dinstallation-pas-à-pas)
2. [Procédure de Sauvegarde & Restauration](#2-procédure-de-sauvegarde--restauration)
3. [Procédure de Maintenance Industrielle](#3-procédure-de-maintenance-industrielle)
4. [Procédures de Sécurité Applicative et Système](#4-procédures-de-sécurité-applicative-et-système)
5. [Architecture Globale de Référence](#5-architecture-globale-de-référence)
6. [Dépannage, Erreurs Courantes & Cas Particuliers](#6-dépannage-erreurs-courantes--cas-particuliers)
7. [Contacts, Support Technique & Procédures d'Escalade](#7-contacts-support-technique--procédures-descalade)

---

## 1. Guide d'Installation Pas à Pas

### 1.1 Prérequis Système Minimaux et Recommandés
Avant de commencer, validez que l'instance de calcul Ubuntu respecte ces spécifications :

| Élément | Minimum Recommandé (Tests / Démo) | Recommandé en Production Clinique |
| :--- | :--- | :--- |
| **RAM** | 4 Go | 8 Go à 16 Go |
| **CPU** | 2 vCPUs | 4 vCPUs ou plus |
| **Disque** | 40 Go SSD (SATA) | 100 Go+ SSD SAS / NVMe (configuré en RAID 1 ou 5) |
| **Bande Passante**| 10 Mbps duplex (Mali / Sotelma / Orange) | 50 Mbps duplex minimum |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS (x86_64) |
| **Pare-feu** | UFW actif (Ports 22, 80, 443 ouverts) | UFW actif + Cloud Security Group en amont |

---

### 1.2 Installation de PostgreSQL
MédiSahel V2 stocke ses dossiers patients, factures et journaux d'audit sur PostgreSQL. Suivez ces étapes pour installer et sécuriser la base.

```bash
# 1. Mise à jour des paquets et ajout du dépôt PostgreSQL officiel
sudo apt update && sudo apt upgrade -y
sudo apt install -y postgresql postgresql-contrib

# 2. Vérification que PostgreSQL tourne correctement
sudo systemctl status postgresql

# 3. Connexion à la console d'administration PostgreSQL d'origine
sudo -i -u postgres psql
```

Une fois dans la console `psql`, exécutez ces instructions SQL :

```sql
-- Création de la base de données clinique de production
CREATE DATABASE medisahel_prod;

-- Création de l'utilisateur dédié non-privilégié d'exploitation applicative
CREATE USER medisahel_user WITH ENCRYPTED PASSWORD 'SahelSecureDb2026!Clinique';

-- Attribution de l'intégralité des privilèges de la DB à cet utilisateur
GRANT ALL PRIVILEGES ON DATABASE medisahel_prod TO medisahel_user;
ALTER DATABASE medisahel_prod OWNER TO medisahel_user;

-- Sortir de la console psql
\q
```

Afin de forcer PostgreSQL à rejeter les connexions réseau externes non cryptées SSL, modifiez le fichier `/etc/postgresql/14/main/pg_hba.conf` pour s'assurer que l'authentification locale requiert de forts jetons md5/scram-sha-256 :

```bash
# Ouvrir le fichier de configuration pg_hba.conf (adapter la version '14' ou '16' selon l'installation)
sudo nano /etc/postgresql/*/main/pg_hba.conf
```
Ajoutez ou modifiez les lignes suivantes à la fin du fichier :
```text
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     peer
host    all             medisahel_user  127.0.0.1/32            scram-sha-256
host    all             medisahel_user  ::1/128                 scram-sha-256
```
Redémarrez le serveur PostgreSQL pour appliquer ces règles :
```bash
sudo systemctl restart postgresql
```

---

### 1.3 Installation de Node.js
L'application MédiSahel est basée sur le runtime Node.js v20+. Utilisez NodeSource pour installer une version LTS stable :

```bash
# 1. Ajout du dépôt NodeSource LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 2. Installation de Node.js et des dépendances d'outils de compilation
sudo apt install -y nodejs build-essential

# 3. Validation de l'installation officielle
node -v  # Doit renvoyer v20.x.x
npm -v   # Doit renvoyer v10.x.x
```

---

### 1.4 Installation et configuration de Nginx (SSL Let's Encrypt)
Nginx fait office de reverse proxy pour rediriger le trafic Web HTTPS (port 443) de manière interne vers l'instance Node.js écoutant sur le port `3000`.

```bash
# 1. Installation de Nginx et Certbot pour Let's Encrypt
sudo apt install -y nginx certbot python3-certbot-nginx

# 2. Vérification que Nginx tourne en tâche de fond
sudo systemctl start nginx
sudo systemctl enable nginx
```

Créez un fichier de configuration de bloc virtuel pour MédiSahel :
```bash
sudo nano /etc/nginx/sites-available/medisahel
```

Collez la configuration standard optimisée pour la redirection d'applet suivante :
```nginx
server {
    listen 80;
    server_name clinique.medisahel.ml; # Remplacez par le nom de domaine de votre clinique

    # Redirection automatique HTTP vers HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name clinique.medisahel.ml;

    # En-têtes de sécurité recommandés en milieu hospitalier
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    location / {
        proxy_pass http://127.0.0.1:3000; # Redirection vers le serveur d'application Node/Express
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout étendu pour les rapports médicaux volumineux
        proxy_read_timeout 150s;
        proxy_connect_timeout 150s;
    }

    # Logs de requêtes Nginx
    access_log /var/log/nginx/medisahel_access.log;
    error_log /var/log/nginx/medisahel_error.log;
}
```

Activez le site et désactivez la page par défaut de Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/medisahel /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testez la syntaxe de configuration de Nginx
sudo nginx -t

# Redémarrez Nginx pour enregistrer le bloc virtuel
sudo systemctl restart nginx
```

Générez le certificat SSL gratuit de confiance Let's Encrypt :
```bash
sudo certbot --nginx -d clinique.medisahel.ml --non-interactive --agree-tos --email contact@medisahel.ml
```

---

### 1.5 Installation et configuration de PM2
PM2 gère l'exécution du processus d'arrière-plan de l'application et assure un redémarrage instantané en cas de crash ou d'arrêt matériel inopiné.

```bash
# 1. Installation globale de PM2
sudo npm install -y pm2 -g

# 2. Configurer PM2 pour démarrer automatiquement lors du boot du système
pm2 startup ubuntu
```
PM2 générera une commande à copier-coller dans votre terminal. Exemple :
`sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u youruser --hp /home/youruser`

Copiez-collez l'instruction générée pour activer le service système au démarrage de la machine.

---

### 1.6 Déploiement physique du Code Source
Clonez ou transférez l'application sur le serveur de destination (généralement dans `/var/www/medisahel`) :

```bash
# 1. Création du répertoire de destination et assignation des privilèges d'écriture
sudo mkdir -p /var/www/medisahel
sudo chown -R $USER:$USER /var/www/medisahel

# 2. Déplacement dans le répertoire et installation des paquets npm dépendances
cd /var/www/medisahel
npm install --production=false # Obligatoire de charger les devDependencies pour exécuter le build TypeScript
```

---

### 1.7 Migrations de Base de Données Prisma
Le schéma de la base de données est structuré par Prisma ORM. Configurez les accès initiaux et appliquez les migrations :

```bash
# 1. Application des migrations physiques SQL sur PostgreSQL
npx prisma migrate deploy

# 2. Génération de l'API cliente Prisma
npx prisma generate

# 3. Injection des données cliniques de démo / initiatisation (Comptes de test cliniciens, nomenclature des actes, tarifs)
npm run db:seed
```

---

### 1.8 Configuration Finale des Variables d'Environnement (.env complet)
Créez un fichier `.env` au niveau du répertoire racine de l'application clincienne `/var/www/medisahel/.env` :

```env
# ==============================================================================
# CONFIGURATION SERVEUR GÉNÉRALE
# ==============================================================================
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
APP_URL=https://clinique.medisahel.ml

# ==============================================================================
# CONNEXION POSTGRESQL DURABLE ET SÉCURISÉE (PRISMA SCHEMA)
# ==============================================================================
# Format standard de connexion PostgreSQL
DATABASE_URL="postgresql://medisahel_user:SahelSecureDb2026!Clinique@127.0.0.1:5432/medisahel_prod?schema=public"

# ==============================================================================
# CLÉS SECRÈTES D'AUTHENTIFICATION ET SESSIONS SÉCURISÉES
# ==============================================================================
# Générer un hash fort de 64 caractères minimum
JWT_SECRET="f6c8dca4aef8cb4a8f906f02fc809d472a11b22ccc8718902eeade06f9dcd8e1"
SESSION_SECRET="e9a22d4f58bc449dbb0cf6112ed97aa89922cda966f91"

# ==============================================================================
# CLÉ D'ACTIVATION DU MOTEUR D'ASSISTANCE INTELLIGENTE CLINIQUE (GEMINI API)
# ==============================================================================
GEMINI_API_KEY="AIzaSyYourSecretGeminiApiKeyHere"

# ==============================================================================
# SECRETS DE PAIEMENT MOBILE MONEY (ORANGE MONEY, WAVE, MALIPAY)
# ==============================================================================
# API Orange Money Web Payment (OMCP) Mali
ORANGE_MONEY_MERCHANT_KEY="OM_MALI_63524df72"
ORANGE_MONEY_AUTH_HEADER="Basic dXNlcl9vbV9hcGk6cGFzc3dvcmRfb21fYWRhbWE="

# API Wave Business Mali (Paiement En Caisses par QR Code)
WAVE_MALI_API_KEY="wave_mali_prod_902931aef71cd93e9a"
WAVE_BUSINESS_ID="BIZ_M_6749"
```

---

### 1.9 Configuration du Firewall Local (UFW)
Le pare-feu système intégré d'Ubuntu doit être paramétré pour restreindre tout accès extérieur direct à PostgreSQL ou de développement applicatif, en n'exposant que Nginx (HTTP/HTTPS) et SSH pour la maintenance distante :

```bash
# 1. Autoriser explicitement SSH pour éviter toute déconnexion accidentelle
sudo ufw allow ssh

# 2. Autoriser HTTP (Port 80) et HTTPS (Port 443) pour Nginx
sudo ufw allow 'Nginx Full'

# 3. Refuser explicitement toute connexion externe sur le port brut local Node (3000) et PostgreSQL (5432)
sudo ufw deny 3000
sudo ufw deny 5432

# 4. Activer le pare-feu
sudo ufw enable

# 5. Consulter le statut des ports ouverts
sudo ufw status verbose
```

---

### 1.10 Compilation et Démarrage sous PM2
Compilez les assets web React statiques (Vite builder) et démarrez l'application web via PM2 :

```bash
# 1. Compilation de la SPA et du backend Express TS
npm run build

# 2. Lancement du processus applicatif via PM2
pm2 start dist/server.cjs --name "medisahel-clinique" --env production

# 3. Enregistrer l'état démarré pour survivre aux reboots
pm2 save
```

---

## 2. Procédure de Sauvegarde & Restauration

Dans le milieu de la santé, la perte de données médicales ou cliniques n'est pas tolérée. Nous configurerons un coffre-fort de dumps réguliers.

### 2.1 Emplacement et Rétention des Backups
- **Emplacement Local provisoire :** `/var/backups/medisahel` (Un répertoire local à sécuriser régulièrement).
- **Emplacement Cloud / Serveur distant recommandé :** Transfert automatisé SFTP/S3 vers un serveur NAS distants de la clinique.
- **Rétention minimale :** 
  - **Sauvegardes quotidiennes :** Conservation durant 30 jours calendaires.
  - **Sauvegardes hebdomadaires :** Conservation durant 12 semaines.
  - **Sauvegardes mensuelles :** Conservation durant 12 mois.

---

### 2.2 Script de Sauvegarde Automatique (`medisahel_backup.sh`)
Créez un script automatisé d'extraction SQL de base de données :

```bash
sudo mkdir -p /var/backups/medisahel
sudo chmod 700 /var/backups/medisahel
sudo nano /usr/local/bin/medisahel_backup.sh
```

Collez le script de sauvegarde de production optimisé suivant :
```bash
#!/bin/bash
# ==============================================================================
# SCRIPT DE SAUVEGARDE INFORMATIQUE MÉDISAHEL V2 - EN BANQUE POSTGRESQL
# ==============================================================================

# Variables de configuration
DB_NAME="medisahel_prod"
DB_USER="medisahel_user"
BACKUP_DIR="/var/backups/medisahel"
DATE_SUFFIX=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/medisahel_$DATE_SUFFIX.sql"
ZIP_FILE="$BACKUP_FILE.tar.gz"

echo "[$(date)] - Démarrage de la sauvegarde de la clinique MédiSahel..."

# Exécution du dump (extraction SQL structurée)
# Utiliser pg_dump sans prompt de mot de passe grâce au passe local pgpass ou environnement temporaire
PGPASSWORD='SahelSecureDb2026!Clinique' pg_dump -h 127.0.0.1 -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

# Compression du dump généré
tar -czf $ZIP_FILE -C $BACKUP_DIR "medisahel_$DATE_SUFFIX.sql"
rm $BACKUP_FILE # Nettoyage du fichier SQL brut non compressé

echo "[$(date)] - Sauvegarde compressée créée : $ZIP_FILE"

# Processus d'auto-suppression des dumps de plus de 30 jours (politique de rétention locale)
find $BACKUP_DIR -name "medisahel_*.tar.gz" -mtime +30 -exec rm {} \;

echo "[$(date)] - Épuration des anciennes sauvegardes (+30 jours) effectuée."
```

Rendez le script hautement sécurisé et exécutable uniquement par l'intermédiaire de l'administrateur système ou du gestionnaire de sauvegarde :
```bash
sudo chmod 700 /usr/local/bin/medisahel_backup.sh
```

Ajoutez une règle planifiée dans le planificateur d'Ubuntu (Cron) pour s'exécuter automatiquement à **01:00 du matin, chaque jour** :
```bash
sudo crontab -e
```
Collez cette ligne à la fin de votre fichier d'ordonnancement cron :
```text
0 1 * * * /usr/local/bin/medisahel_backup.sh >> /var/log/medisahel_backup.log 2>&1
```

---

### 2.3 Procédure de Restauration de Production Pas à Pas
En cas de sinistre physique majeur ou de corruption de données, suivez impérativement cette procédure de redressement :

```bash
# 1. Couper temporairement le trafic applicatif web pour geler le serveur
pm2 stop medisahel-clinique
sudo systemctl stop nginx

# 2. Localiser le fichier d'archive compressé de sauvegarde le plus récent
ls -lh /var/backups/medisahel/

# 3. Décompresser l'archive zip sélectionnée pour restauration (ex : dump du 14 Juin 2026)
tar -xzf /var/backups/medisahel/medisahel_20260614_010000.sql.tar.gz -C /var/backups/medisahel/

# 4. Supprimer et réinitialiser proprement la DB postgresql
sudo -i -u postgres psql -c "DROP DATABASE medisahel_prod;"
sudo -i -u postgres psql -c "CREATE DATABASE medisahel_prod;"
sudo -i -u postgres psql -c "ALTER DATABASE medisahel_prod OWNER TO medisahel_user;"

# 5. Restaurer le schéma complet et les tuples à l'aide de l'utilitaire pg_restore
PGPASSWORD='SahelSecureDb2026!Clinique' pg_restore -h 127.0.0.1 -U medisahel_user -d medisahel_prod /var/backups/medisahel/medisahel_20260614_010000.sql

# 6. Relancer les applicatifs web après l'injection
pm2 start medisahel-clinique
sudo systemctl start nginx
```

---

### 2.4 Test Périodique de Restauration (Audité)
L'administrateur système ou le RSSI doit obligatoirement tester la restauration tous les trimestres sur une machine isolée de préproduction :
* Installez PostgreSQL sur un serveur de stage.
* Chargez le dump le plus récent de la base clinique.
* Exécutez une vérification sur les tables cruciales (compte de lignes, listes d'admissions) :
  `SELECT count(*) FROM "Patient";` -> Doit correspondre à la taille d'exploitation clinique.

---

## 3. Procédure de Maintenance Industrielle

### 3.1 Mise à jour de l'Application (Déploiement Continu)
Lors du déploiement d'une nouvelle mise à jour corrective (Hotfix) de l'application :

```bash
# 1. Navigation dans le dossier de déploiement
cd /var/www/medisahel

# 2. Récupérer les modifications depuis la branche master ou release validée
git pull origin production

# 3. Installer les nouvelles dependances (si modifiées dans package.json)
npm install

# 4. Appliquer les nouvelles migrations SQL Prisma
npx prisma migrate deploy

# 5. Compiler à nouveau la partie Front-End React Vite
npm run build

# 6. Recharger l'instance PM2 en douce (Zero-Downtime Reload)
pm2 reload medisahel-clinique
```

---

### 3.2 Surveillance & Monitoring Applicatif
Suivez de près l'exécution, la consommation de mémoire (RAM), le CPU de la clinique et les logs de PostgreSQL :

```bash
# Surveiller en temps réel l'utilisation RAM/CPU des services node.js sous PM2
pm2 monit

# Consulter les logs d'output de l'application en temps réel
pm2 logs medisahel-clinique --lines 100

# Inspecter les logs système de Nginx pour déceler des requêtes anormales (Erreur de Gateway, etc.)
sudo tail -f /var/log/nginx/medisahel_error.log

# Consulter l'espace disque disque global pour éviter tout gel système par écriture saturée
df -h
```

---

### 3.3 Gestion et Renouvellement des Certificats SSL
Le protocole Let's Encrypt est protégé par un système de renouvellement automatique installé par défaut sur Ubuntu lors de l'ajout du certbot. Pour exécuter un test :

```bash
# Lancement de la procédure de test de renouvellement (Simulé)
sudo certbot renew --dry-run
```
En cas de renouvellement inopiné ou de blocage, forcez le renouvellement immédiat :
```bash
sudo certbot renew --force-renewal
```

---

### 3.4 Commandes d'Administration Globale des Services Cliniques
Raccourcis administratifs requis pour la relance manuelle rapide des ressources d'exploitation d'Ubuntu :

```bash
# Relancer le moteur de base de données PostgreSQL
sudo systemctl restart postgresql

# Relancer le proxy applicatif Nginx
sudo systemctl restart nginx

# Consulter l'état des services de base en arrière plan
sudo systemctl status postgresql nginx
```

---

## 4. Procédures de Sécurité Applicative et Système

### 4.1 Sécurisation Drastique de l'Infrastructure Réseau et du Système OS
- **Interdiction d'authentification SSH Root par mot de passe brut :** Modifiez `/etc/ssh/sshd_config` :
  ```text
  PermitRootLogin prohibit-password
  PasswordAuthentication no
  ```
- **Fermeture de l'intégralité du réseau :** Le port `5432` PostgreSQL doit écouter uniquement en boucle locale (`127.0.0.1`). Ne modifiez jamais les options standard de PostgreSQL `listen_addresses` vers autre chose que `localhost` sans canal VPN sécurisé SSH.

---

### 4.2 Protection des Variables d'Environnement de Production Clinique
Conservez des droits stricts d'ouverture en lecture sur le fichier de secrets `.env` :
```bash
# Bloquer la lecture et l'écriture de ce fichier aux autres utilisateurs non-root du système
chmod 600 /var/www/medisahel/.env
```

---

### 4.3 Sauvegarde et Exploitation des Clés de Paiement API Électroniques
- Les identifiants et clés de validation Orange Money, Wave ou Malipay ne doivent JAMAIS être exposés ou insérés dans des scripts git. Sauf demande de l'équipe de développement clinique, aucun export ne doit inclure le fichier `.env` ou ses valeurs d'index.
- Conservez une copie numérique chiffrée hors ligne (par exemple sur clé USB ou coffre de clés fort crypté type KeePass) des identifiants des banques mobiles.

---

## 5. Architecture de Référence

### 5.1 Schéma Réseau et Flux Applicatif Standard
```text
           [ Trafic HTTPS Externe (Port 443) ]
                           │
                           ▼
                 [ Serveur Nginx Reverse ]  <─── Authentification Certificats SSL Let's Encrypt
                           │
             (Trafic HTTP Local Interne Port 3000)
                           │
                           ▼
                  [ Serveur Node.js ] ─── Moteur AI Assisté ───► [ Google Gemini API ]
                           │
       (Requêtes SQL Interne Sécurisées Port 5432)
                           │
                           ▼
                  [ PostgreSQL DB ]  <─── Restreint à localhost uniquement (127.0.0.1)
```

---

### 5.2 Structure des Répertoires Déployée sur Ubuntu
Voici l'arborescence complète résultante attendue de l'application MédiSahel :

```text
/var/www/medisahel/
├── .env                  # Secrets de production (Strictement 600, masqué de git)
├── package.json          # Définition des modules et scripts d'exécutions npm
├── tsconfig.json         # Paramètres de compilation TypeScript
├── vite.config.ts        # Configuration du framework de bundling Vite
├── server.ts             # Point d'entrée de production Backend Express
├── src/                  # Code source applicatif
│   ├── main.tsx          # Fichier d'entrée de l'application cliente React
│   ├── App.tsx           # Composant central de routage et de coordination d'onglets
│   ├── types.ts          # Définitions de types, interfaces et enums
│   ├── mockData.ts       # Données initiales et profils cliniciens par défaut
│   └── components/       # Modules intégrés "Tout est Cliquable", Éditeurs, etc.
│       ├── BillingsAndCashier.tsx  # Caisse, Facturation & Impression
│       ├── StructuredPrescriptionEditor.tsx # Éditeur intelligent de prescriptions (@)
│       ├── IntelligentLabEditor.tsx        # Saisie de paillasse Laboratoire (@)
│       ├── HospitalizationTracker.tsx       # Suivi de lits d'étage cliquables
│       ├── DashboardView.tsx               # Tableau de Bord Clinique interactif
│       └── SearchCommandPalette.tsx         # Barre de recherche globale (CMD/CTRL + K)
├── prisma/               # Fichiers Prisma ORM
│   ├── schema.prisma     # Schéma relationnel PostgreSQL SQL
│   └── migrations/       # Migrations SQL de synchronisation
└── dist/                 # Fichiers compilés de production générés par Vite
    ├── index.html        # Fichier d'entrée SPA servi
    ├── server.cjs        # Backend Express compilé et paquet unique esbuild
    └── assets/           # Bundles Javascript & CSS Tailwind compilés et optimisés
```

---

## 6. Dépannage, Erreurs Courantes & Cas Particuliers

### 6.1 Erreur `Database connection timeout` ou `Can't reach database`
* **Cause :** PostgreSQL est à l'arrêt ou le port/adresse de connexion dans le `.env` de votre configuration est erroné.
* **Correction :** 
  - Lancez la commande suivante pour relancer la source PostgreSQL : `sudo systemctl restart postgresql`.
  - Validez l'exactitude de la ligne `DATABASE_URL` présente dans `/var/www/medisahel/.env`.

---

### 6.2 Redondance des serveurs (`Gateway 502 Bad Gateway`) sous Nginx
* **Cause :** L'application web en tâche de fond Express s'est coupée ou s'est écroulée, laissant le reverse proxy Nginx sans point d'écoute.
* **Correction :** 
  - Inspectez le gestionnaire PM2 : `pm2 status`. 
  - En cas d'anomalie ("errored"), relancez explicitement : `pm2 restart medisahel-clinique`. 
  - Consultez et lisez les logs détaillés de plantage : `pm2 logs medisahel-clinique --err`.

---

### 6.3 Erreurs de renouvellement Let's Encrypt (Certificates SSL issue)
* **Cause :** Le pare-feu système (UFW) bloque le port HTTPS / HTTP ou le serveur Nginx n'autorise pas la lecture temporaire des fichiers de challenge.
* **Correction :** Vérifiez l'adéquation de la configuration nginx, testez et assurez-vous de l'accès extérieur au port standard de certification.

---

## 7. Contacts, Support Technique & Procédures d'Escalade

### 7.1 Support Technique Interne Clinique
- **Responsable Réseau :** Ingénieur Informaticien Médical (Responsable du parc informatique de la clinique)  
  - **Email :** support.it@medisahel.ml  
  - **Téléphone / Télécopie :** +223 76 00 11 22

---

### 7.2 Niveaux de Sévérité et Procédures de Redressement rapide

| Niveau de Sévérité | Impact Opérationnel de la clinique | Temps de Résolution Maximum Garanti (GTR) | Procédure d'Escalade Recommandée |
| :--- | :--- | :--- | :--- |
| **Sévérité 1 (CRITIQUE)** | Blocage complet (Ex : Base corrompue, caisses ou dossier DME inaccessibles) | **2 Heures** | Signalement immédiat au DG Dr. Traoré. Restauration de base à l'aide de l'outil `medisahel_backup.sh` et rappel à chaud des techniciens système d'astreinte. |
| **Sévérité 2 (MAJEUR)** | Dysfonctionnement partiel (Ex : Connexion automate de laboratoire lente, prescription @ inaccessible) | **8 Heures** | Signalement par ticket au support. Correctif déployé lors de la maintenance planifiée de nuit. |
| **Sévérité 3 (MINEUR)** | Anomalie esthétique, ajustement de tarif mutuelle ou libellé d'impression | **3 Jours** | Traité et intégré lors des livraisons hebdomadaires de routine de l'application. |
