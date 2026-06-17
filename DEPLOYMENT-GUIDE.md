# Guide de Déploiement de MédiSahel Clinique V2 sur Ubuntu 26.04 LTS

Ce document fournit les instructions pas-à-pas pour déployer l'application **MédiSahel Clinique V2** (Fullscale Express + Vite + PostgreSQL + Prisma) en environnement de production sur un serveur **Ubuntu 26.04 LTS (Nobile Numbat)** en toute sécurité.

---

## 1. Prérequis Système

Connectez-vous à votre machine virtuelle Ubuntu 26.04 LTS par SSH :
```bash
ssh user@your_server_ip
```

Mettez à jour le gestionnaire de paquets de base :
```bash
sudo apt update && sudo apt upgrade -y
```

Installez les outils de compilation essentiels :
```bash
sudo apt install -y build-essential curl git software-properties-common
```

---

## 2. Installation de l'infrastructure de Runtime

### A. Installation de Node.js v22 LTS (Moteur de Runtime JavaScript)
Configurez le dépôt officiel NodeSource et installez Node.js :
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```
Vérifiez l'installation :
```bash
node -v   # Devrait retourner v22.x.x
npm -v    # Devrait retourner v10.x.x
```

### B. Installation et configuration de PostgreSQL Server
Installez le package PostgreSQL :
```bash
sudo apt install -y postgresql postgresql-contrib
```

Démarrez et activez l'exécution automatique de PostgreSQL :
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Connectez-vous au compte d'administration PostgreSQL pour créer l'utilisateur et la base de données :
```bash
sudo -i -u postgres psql
```

Exécutez les requêtes SQL suivantes (remplacez `VotreMotDePasseFort` par un secret robuste) :
```sql
CREATE DATABASE medisahel_db;
CREATE USER medisahel_user WITH PASSWORD 'VotreMotDePasseFort';
GRANT ALL PRIVILEGES ON DATABASE medisahel_db TO medisahel_user;
-- Sur PostgreSQL 15+, attribuez également les droits sur le schéma public :
\c medisahel_db
GRANT ALL ON SCHEMA public TO medisahel_user;
\q
```

---

## 3. Clônage et Configuration du Projet

Déplacez-vous dans le répertoire des applications serveurs :
```bash
cd /var/www
# Clônez le dépôt de code de votre clinique :
sudo git clone https://github.com/votre-depot/medisahel-clinique-v2.git
sudo chown -R $USER:$USER /var/www/medisahel-clinique-v2
cd /var/www/medisahel-clinique-v2
```

Installez l'ensemble des modules node de l'application :
```bash
npm install
```

### Configuration des variables d'environnement (`.env`)
Créez le fichier de configuration de production `.env` :
```bash
nano .env
```

Ajoutez la configuration de production suivante :
```env
# URL de connexion PostgreSQL sécurisée
DATABASE_URL="postgresql://medisahel_user:VotreMotDePasseFort@localhost:5432/medisahel_db?schema=public"

# Signature de clés de jetons d'authentification
JWT_SECRET="générer_une_longue_cle_securisee_ici"

# Port applicatif interne
PORT=3000
NODE_ENV=production
```

---

## 4. Initialisation de la Base de Données (Migrations Prisma)

Générez le client Prisma et exécutez la migration pour construire la structure de la base de données PostgreSQL de la clinique :
```bash
npx prisma generate
npx prisma migrate deploy
```

*(Optionnel) Si vous souhaitez pré-remplir l'application avec des données initiales professionnelles ou des administrateurs par défaut, exécutez les scripts de seeding s'ils sont configurés.*

---

## 5. Construction du Bundle de Production (Building)

Générez les fichiers HTML/css statiques de l'application cliente et compilez le serveur d'ingestion Express :
```bash
npm run build
```
Cette commande produira :
- Les fichiers statiques compressés dans `/dist`
- Le serveur d'API compilé dans `/dist/server.cjs`

---

## 6. Processus de Gestion Active (PM2 Runtime Manager)

Installez PM2 de manière globale pour surveiller et redémarrer l'application MédiSahel en arrière-plan en cas de panne logicielle ou matérielle :
```bash
sudo npm install -y -g pm2
```

Démarrez le serveur MédiSahel avec PM2 :
```bash
pm2 start dist/server.cjs --name "medisahel-app"
```

Configurez PM2 pour qu'il redémarre automatiquement avec le serveur physique :
```bash
pm2 startup systemd
```
*(Exécutez la commande d'environnement générée par la commande précédente afin d'enregistrer le service systemd).*

Sauvegardez l'état actuel de PM2 :
```bash
pm2 save
```

---

## 7. Sécurisation Inverse NGINX & SSL (HTTPS Let's Encrypt)

### A. Installation de Nginx
```bash
sudo apt install -y nginx
```

### B. Configuration du Reverse Proxy
Créez un hôte virtuel Nginx pour MédiSahel :
```bash
sudo nano /etc/nginx/sites-available/medisahel
```

Collez la configuration suivante (remplacez `clinique.medisahel.org` par votre nom de domaine enregistré) :
```nginx
server {
    listen 80;
    server_name clinique.medisahel.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Optimisation de la taille d'envoi pour rapports PDF & fichiers GED
    client_max_body_size 50M;
}
```

Activez la configuration et testez Nginx :
```bash
sudo ln -s /etc/nginx/sites-available/medisahel /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### C. Certificat SSL HTTPS Gratuit avec Let's Encrypt Certbot
Installez Certbot pour Nginx :
```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtenez et installez automatiquement le certificat SSL :
```bash
sudo certbot --nginx -d clinique.medisahel.org
```
Suivez les invites interactives. Certbot configurera automatiquement la redirection HTTPS et le renouvellement automatique gratuit (valable 90 jours).

---

## 8. Commandes Utiles au Quotidien

- **Consulter les journaux d'accès en temps réel :** `pm2 logs medisahel-app`
- **Redémarrer le serveur applicatif :** `pm2 restart medisahel-app`
- **Consulter l'utilisation CPU & Mémoire :** `pm2 monit`
- **Recharger Nginx après modification :** `sudo systemctl reload nginx`
