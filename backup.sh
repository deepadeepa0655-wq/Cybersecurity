#!/bin/bash
# =============================================================================
# Cyber Shield Platform - Database Backup Script
# Run via cron for automated backups
# =============================================================================

set -euo pipefail

# Configuration
BACKUP_DIR="/app/backups"
MONGODB_URI="${MONGODB_URI}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="cybershield_backup_${TIMESTAMP}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log_info "Starting backup: ${BACKUP_NAME}"

# Perform mongodump
if mongodump --uri="${MONGODB_URI}" --out="${BACKUP_DIR}/${BACKUP_NAME}" --gzip; then
    log_info "Backup completed successfully"

    # Create compressed archive
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
    rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"

    log_info "Backup archived: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

    # Clean old backups
    find "${BACKUP_DIR}" -name "cybershield_backup_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    log_info "Old backups cleaned (retention: ${RETENTION_DAYS} days)"

    # List current backups
    ls -lh "${BACKUP_DIR}"/cybershield_backup_*.tar.gz 2>/dev/null || log_warn "No backup files found"
else
    log_error "Backup failed!"
    exit 1
fi