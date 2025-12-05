#!/bin/bash

# Database Backup Script for Absensi WFH Dexa
# Creates a timestamped backup of the PostgreSQL database

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-absensi_postgres}"
DB_NAME="${DB_NAME:-absensi_wfh_dexa}"
DB_USER="${DB_USER:-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/absensi_backup_$TIMESTAMP.sql"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "========================================="
echo "Database Backup Script"
echo "========================================="
echo "Backup started at: $(date)"
echo "Container: $CONTAINER_NAME"
echo "Database: $DB_NAME"
echo "Backup file: $COMPRESSED_FILE"
echo ""

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container '$CONTAINER_NAME' is not running!"
    exit 1
fi

# Create backup
echo "Creating backup..."
docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Backup created successfully"
else
    echo "✗ Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    echo "✓ Backup compressed successfully"
    echo "  Size: $BACKUP_SIZE"
else
    echo "✗ Compression failed!"
    exit 1
fi

# Delete old backups (older than RETENTION_DAYS)
echo ""
echo "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "absensi_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "absensi_backup_*.sql.gz" | wc -l)
echo "✓ Cleanup complete"
echo "  Remaining backups: $REMAINING_BACKUPS"

echo ""
echo "========================================="
echo "Backup completed successfully!"
echo "Backup file: $COMPRESSED_FILE"
echo "Completed at: $(date)"
echo "========================================="
