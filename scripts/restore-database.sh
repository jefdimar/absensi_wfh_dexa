#!/bin/bash

# Database Restore Script for Absensi WFH Dexa
# Restores a PostgreSQL database from a backup file

set -e  # Exit on error

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-absensi_postgres}"
DB_NAME="${DB_NAME:-absensi_wfh_dexa}"
DB_USER="${DB_USER:-postgres}"

# Check if backup file argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Example:"
    echo "  $0 backups/absensi_backup_20251205_120000.sql.gz"
    echo ""
    echo "Available backups:"
    find backups -name "absensi_backup_*.sql.gz" 2>/dev/null | sort -r | head -5 || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

echo "========================================="
echo "Database Restore Script"
echo "========================================="
echo "WARNING: This will REPLACE the current database!"
echo ""
echo "Container: $CONTAINER_NAME"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Check if Docker container is running
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "ERROR: Container '$CONTAINER_NAME' is not running!"
    exit 1
fi

echo ""
echo "Restore started at: $(date)"
echo ""

# Decompress if needed
TEMP_FILE=""
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Restore database
echo "Restoring database..."
docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "✓ Database restored successfully"
else
    echo "✗ Restore failed!"
    [ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"
    exit 1
fi

# Cleanup temporary file
[ -n "$TEMP_FILE" ] && rm -f "$TEMP_FILE"

echo ""
echo "========================================="
echo "Restore completed successfully!"
echo "Completed at: $(date)"
echo "========================================="
echo ""
echo "NOTE: You may need to restart services:"
echo "  docker-compose restart auth-service"
echo "  docker-compose restart attendance-service"
echo "  docker-compose restart profile-change-log-service"
echo "  docker-compose restart notification-service"
