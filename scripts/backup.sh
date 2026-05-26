#!/bin/bash

# ==============================================================================
# MEDISHAHEL ENTERPRISE LOCAL EDITION - V2
# CRON AUTOBACKUP SCRIPT FOR OFFLINE POSTGRESQL DEPLOYMENTS ON UBUNTU LOCAL SERVER
# ==============================================================================

# Variables Configuration
BACKUP_DIR="/var/medishahel/backups"
DB_CONTAINER_NAME="medishahel_db"
DB_USER="medishahel_admin"
DB_NAME="medishahel_prod"
RETENTION_DAYS=20  # Keep backups for 20 days as required of local policies
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_medishahel_${TIMESTAMP}.sql.gz"

# Create directories if missing
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting Daily Database Archiving..."

# Run pg_dump within the live PostgreSQL container
docker exec ${DB_CONTAINER_NAME} pg_dump -U ${DB_USER} ${DB_NAME} | gzip > "${BACKUP_FILE}"

# Check success status
if [ $? -eq 0 ]; then
    echo "[$(date)] SUCCESS: Backup created at ${BACKUP_FILE}"
    
    # Prune backups older than 20 days to free disk space
    find "${BACKUP_DIR}" -type f -name "backup_medishahel_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    echo "[$(date)] Cleaned old archives exceeding ${RETENTION_DAYS} retention threshold."
else
    echo "[$(date)] ERROR: Backup failed to complete." >&2
    exit 1
fi
