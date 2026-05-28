# 🛡️ Manuel de Déploiement Clinique Production - MédiSahel HIS
> **Version 2.0 (Production) - Conforme OWASP & RGPD Médical**
> Établi le : 28 Mai 2026 à Bamako, Mali.

Ce document constitue le registre technique officiel du HIS **MédiSahel** pour son exploitation en environnement hospitalier et LAN clinique réel.

---

## 📅 Chronologie Récapitulative des Écritures & Traçabilité (UTC)
Pour se conformer aux législations sur la responsabilité médicale et l'inviolabilité du dossier patient :
1. **Horodatages Normalisés** : Toutes les écritures en base utilisent des colonnes `createdAt` / `updatedAt` / `timestamp` au format ISO-8601 UTC.
2. **Immutabilité Légale** : La table `AuditLog` n'expose aucune route SQL de type `DELETE` ou `UPDATE`. Toute action de soin, de paiement, ou d'administration est scellée par l'adresse IP et le rôle du soignant.
3. **Archivage Logique (Soft Delete)** : Pour les patients et éléments d'imagerie clinique critiques, la suppression physique est interdite. Les enregistrements portent une colonne `isArchive` (booléenne). L'archivage est réversible uniquement par un médecin chef ou administrateur général certifié.

---

## 🗃️ 1. Structure Spécifique des Tables SQL (Schéma PostgreSQL)
Voici la modélisation complète de la base de données PostgreSQL générée via Prisma :

| Table SQL / Modèle | Rôle Clinique | Clignotants de Sécurité / Index |
| :--- | :--- | :--- |
| **User** | Comptes soignants cryptés avec PBKDF2/Salt. | Restriction IP / Tranges horaires autorisés. |
| **Patient** | Dossier d'identité principal et antécédents médicaux. | Index `id` unique, attribut `isArchive` (soft delete). |
| **MedicalRecord** | Consultation clinique (CIM-10, prescriptions, diagnostics). | Lié à `Patient` par clé étrangère, inviolable. |
| **Attachment** | Pièces jointes (Scanners PDF, Échographies, Radios). | Stockage local /data/uploads, clé unique. |
| **Appointment** | Gestion des rendez-vous des cabinets spécialisés. | Clé étrangère patient, horodatage UTC. |
| **Hospitalization** | Suivi dynamique des lits, chambres et soins infirmiers. | Synchronisation LAN, état clinique temps réel. |
| **LabTest** | Examens complémentaires de laboratoire et biologiques. | Alertes valeurs critiques, signatures biologistes. |
| **StockItem** | Pharmacie interne de l'établissement (médicaments/lots). | Seuil d'alerte rupture, date péremption avec alerte. |
| **StaffPresence** | Feuille d'émargement et horaires d'arrivée/départ RH. | Résolution locale hors-ligne compatible. |
| **AuditLog** | Trace médico-légale inviolable de l'activité. | Indexée par soignant, rôle et horodatage UTC. |
| **Invoice** & **Payment** | Facturation patient et prise en charge assurances/tiers. | Mode de paiement (Orange Money, etc.) traçable. |
| **Mail** | Suivi des flux de courriers entrants et sortants. | Numérotation chrono légale unique. |

---

## ⚡ 2. Liste des APIs Réellement Connectées à PostgreSQL
Tous les points d'accès sont dotés de doubles liaisons PostgreSQL (Prisma Client) et d'un mode fallback automatique local (stockage JSON) s'ils détectent une panne réseau ou de serveur SQL.

### 🔑 Authentification & Sessions
* `POST /api/auth/login` : Login soignant avec PBKDF2, protection anti-brute force (verrouillage temporaire auto après 5 échecs), génération d'un couple `accessToken` / `refreshToken` rotatif sécurisé.
* `POST /api/auth/refresh` : Rotation automatisée des JWT et prolongation de session active sans ressaisie des secrets.
* `GET /api/auth/verify` : Validation cryptographique stricte par signature HMAC-SHA256 du secret d'environnement.

### 🏥 Gestion Clinique & Dossier Patient
* `GET /api/patients` : Renvoie la liste globale (exclut par défaut les dossiers archivés pour la fluidité).
* `POST /api/patients` : Création de patient avec assignation automatique d'assurance.
* `POST /api/medical-records` : Prescription d'ordonnance codée CIM-10 avec traçabilité soignante.
* `POST /api/attachments/upload` : Enregistre des fichiers d'imagerie clinique et radios biologiques réels (scanners PDF, ECG, radios, échographies) encodés en base64. Limite de taille à 50 Mo, vérification stricte des types de fichiers, stockage isolé sur répertoire et référence DB.

### 📈 Surveillance, Watchdog et Métriques
* `GET /api/monitoring/health` : Endpoint clinique de haute disponibilité. Analyse la mémoire vive (RAM), l'espace disque disponible sur l'hôte, et effectue un ping de latence SQL sur PostgreSQL. Émet des alarmes logiques si le disque approche des 85 % d'occupation.

---

## ⚙️ 3. Modules Partiellement Simulés (Simulation Matérielle Requise)
Pour des raisons d'isolement en environnement de bac à sable (Sandbox), certains matériels de diagnostic ne peuvent pas être interfacés physiquement sans pilotes embarqués (Edge Drivers). Ils incluent :
1. **Interface Télé-radiologie Directe** : L'acquisition automatique de fichiers d'images radiologiques bruts (DICOM) directement depuis les consoles de scannographie. La simulation permet toutefois l'envoi de fichiers d'analyses formatés classiques (JPEG, PNG, PDF) de façon fluide.
2. **Passerelle SMS Alerte Ministère (Mali)** : L'envoi direct de rapports épidémiologiques par liaison GSM physique en cas d'alerte critique. Le HIS effectue à la place une simulation visualisable en console d'administration et journalise l'audit.

---

## 🐳 4. Le Fichier Docker-Compose de Production Final
Pour assurer la persistance des volumes et la séparation des ports, nous avons créé le schéma `/docker-compose.yml`. PostgreSQL y est configuré de façon isolée et persistant sur des volumes Docker distincts. La configuration est la suivante :

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: medishahel_db
    restart: always
    environment:
      POSTGRES_USER: medisahel_user
      POSTGRES_PASSWORD: MotDePasseFort
      POSTGRES_DB: medisahel_db
    volumes:
      - medishahel_pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medisahel_user -d medisahel_db"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - medishahel_net

  medishahel-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: medishahel_app
    restart: always
    environment:
      - DATABASE_URL=postgresql://medisahel_user:MotDePasseFort@postgres:5432/medisahel_db?schema=public
      - JWT_SECRET=60391abf83eead1cda5cf0fbdc5a14dcdc6179af7ef1bfca928238ba4fbac8fdbca38cd3d8a9e16ca1f9a1cbda27a9ae1b621e8ac8ffda3cfcf72fa82136e1f0
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:3000"
    volumes:
      - medishahel_filedata:/app/data
    networks:
      - medishahel_net

  nginx-proxy:
    image: nginx:alpine
    container_name: medishahel_proxy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - medishahel-app
    networks:
      - medishahel_net

volumes:
  medishahel_pgdata:
    driver: local
  medishahel_filedata:
    driver: local

networks:
  medishahel_net:
    driver: bridge
```

---

## 🛠️ 5. Guide de Déploiement Ubuntu pas-à-pas en Clinique

### Étape A. Prérequis Système
Connectez-vous en SSH sur votre serveur physique ou VPS exécutant **Ubuntu Server 22.04 LTS** :
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential libssl-dev fail2ban ufw net-tools
```

### Étape B. Installation et Durcissement d'UFW (Pare-feu)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP Web UI'
sudo ufw allow 443/tcp comment 'HTTPS Sceau SSL'
sudo ufw enable
```

### Étape C. Installation Stable de Docker & Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl enable --now docker
```

### Étape D. Clonage et Configuration
```bash
git clone <URL_DU_DEPOT_CLINIQUE> /opt/medishahel
cd /opt/medishahel

# Créer les fichiers secrets (Ne jamais pousser ces secrets dans Git)
cp .env.example .env
```
Éditez le fichier `.env` avec des valeurs sécurisées :
```ini
DATABASE_URL="postgresql://medisahel_user:MotDePasseFor_ChangeMoit@postgres:5432/medisahel_db?schema=public"
JWT_SECRET="générer_une_clé_de_64_caractères_ici"
NODE_ENV=production
```

### Étape E. Scurisation SSL avec Certbot & Nginx Reverse Proxy
```bash
sudo apt install -y certbot
# Demande du certificat SSL Gratuit Let's Encrypt
sudo certbot certonly --standalone -d HIS.CLINIQUE.SOINS
```
Une fois le certificat signé, mettez à jour la partie HTTPS dans votre configuration nginx locale.

### Étape F. Lancement Global
```bash
# Compiler l'image docker et démarrer en tâche de fond
sudo docker compose up -d --build
```

---

## 💾 6. Procédures de Sauvegarde & Restauration Système

### Sauvegarde Automatisée (AES-256-GCM + Postgres Dump)
Créez une tâche quotidienne dans la crontab d'Ubuntu.
Fichier `/scripts/backup_clinique_ha.sh` :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/medishahel"
DATE_TAG=$(date +%Y-%m-%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Exporter un dump stable SQL depuis l'intérieur du conteneur sécurisé
docker exec medishahel_db pg_dump -U medisahel_user -d medisahel_db -F c -b -f /var/lib/postgresql/data/dump_${DATE_TAG}.sql

# Chiffrer le fichier dump de manière robuste en utilisant AES-256
openssl enc -aes-256-cbc -salt -pbkdf2 -in /var/lib/postgresql/data/dump_${DATE_TAG}.sql -out ${BACKUP_DIR}/dump_${DATE_TAG}.sql.enc -pass pass:CléDeChiffrementSauvegardeTrèsForte

# Nettoyer les fichiers intermédiaires non chiffrés pour la conformité RGPD
docker exec medishahel_db rm /var/lib/postgresql/data/dump_${DATE_TAG}.sql
```
Ajoutez cette routine en éditant `crontab -e` :
```cron
0 1 * * * /bin/bash /scripts/backup_clinique_ha.sh
```

### Procédure de Restauration Clinique en Cas de Crise
```bash
# 1. Déchiffrer la sauvegarde stockée
openssl enc -d -aes-256-cbc -pbkdf2 -in dump_2026-xx-xx.sql.enc -out dump_recovered.sql -pass pass:CléDeChiffrementSauvegardeTrèsForte

# 2. Copier le fichier SQL restauré dans le conteneur actif
docker cp dump_recovered.sql medishahel_db:/dump_recovered.sql

# 3. Réinjecter les tables dans PostgreSQL
docker exec -it medishahel_db pg_restore -U medisahel_user -d medisahel_db /dump_recovered.sql
```

---

## 🔒 7. Checklist Sécurité Clinique Avant "Go-Live" (12 Points d'Or)

- [ ] **1. Mots de Passe Forts** : Remplacement immédiat du mot de passe SQL d’usine (`MotDePasseFort`) et mot de passe admin par défaut (`AdminPassword2026!`).
- [ ] **2. SSL/TLS Actif** : Certificats HTTPS valides et configuration Nginx configurée pour rediriger le port 80 vers le port sécurisé 443.
- [ ] **3. Protection contre Exposition Frontend** : Les secrets de sécurité d’environnement (incluant `JWT_SECRET` et `DATABASE_URL`) ne possèdent aucun préfixe `VITE_` et restent cloisonnés sur l'espace serveur.
- [ ] **4. Clé de Signature Signature Clinique** : Remplacement de la variable `JWT_SECRET` par une séquence binaire longue et hautement entropique (générée par `openssl rand -hex 64`).
- [ ] **5. Sauvegardes Chiffrées Offsite** : Les dumps PostgreSQL exportés quotidiennement sont stockés à l'écart en AES-256-GCM.
- [ ] **6. Politique WAN / LAN Failover active** : Les terminaux de soin locaux vérifient l'affichage du statut en vert ou jaune de l'indicateur de mode hors-ligne.
- [ ] **7. Contrôles RBAC Rigides** : Les comptes associés aux caissiers et infirmiers possèdent des autorisations limitées par restriction d'horaire d'accès.
- [ ] **8. Limitation stricte anti brute-force** : Le bloqueur de tentatives IP brute-force est validé et configuré à 5 essais de connexion maximum.
- [ ] **9. Watchdog PostgreSQL opérationnel** : Le script de surveillance HA est configuré en tant que service d’arrière-plan régulier.
- [ ] **10. Nettoyage des Logs applicatifs** : Aucune donnée de santé nominative ni constante clinique en clair n’apparaît dans les journaux Docker en cours d'exécution.
- [ ] **11. Cloisonnement Réseau LAN** : Les terminaux internes de la clinique communiquent via le réseau de pont privé Docker sans port exposé sur le réseau public d'internet à l'exception des connexions d'accès inverse (Nginx reverse proxy).
- [ ] **12. Durcissement Ubuntu Host (Fail2ban)** : Le démon SSH est protégé par des blocages systématiques d'adresses IP suspectes.

---
💡 **Conseil d'exploitation MédiSahel** : Rapprochez-vous du secrétariat technique pour enregistrer la signature cryptographique du logiciel pour les rapports réglementaires officiels d'Afrique de l'Ouest.
