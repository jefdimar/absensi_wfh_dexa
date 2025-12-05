#!/bin/bash

# Setup Automated Database Backups
# This script sets up a cron job to automatically backup the database

set -e

# Get the absolute path of the backup script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================="
echo "Automated Backup Setup"
echo "========================================="
echo "Project root: $PROJECT_ROOT"
echo "Backup script: $BACKUP_SCRIPT"
echo ""

# Check if backup script exists
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "ERROR: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# Make backup script executable
chmod +x "$BACKUP_SCRIPT"
echo "✓ Backup script is executable"

# Ask user for backup schedule
echo ""
echo "Select backup schedule:"
echo "1) Daily at 2:00 AM"
echo "2) Daily at midnight (00:00)"
echo "3) Every 6 hours"
echo "4) Every 12 hours"
echo "5) Custom cron expression"
echo "6) Skip cron setup (manual backups only)"
echo ""
read -p "Enter choice [1-6]: " CHOICE

case $CHOICE in
    1)
        CRON_SCHEDULE="0 2 * * *"
        DESCRIPTION="Daily at 2:00 AM"
        ;;
    2)
        CRON_SCHEDULE="0 0 * * *"
        DESCRIPTION="Daily at midnight"
        ;;
    3)
        CRON_SCHEDULE="0 */6 * * *"
        DESCRIPTION="Every 6 hours"
        ;;
    4)
        CRON_SCHEDULE="0 */12 * * *"
        DESCRIPTION="Every 12 hours"
        ;;
    5)
        read -p "Enter cron expression (e.g., '0 3 * * *'): " CRON_SCHEDULE
        DESCRIPTION="Custom: $CRON_SCHEDULE"
        ;;
    6)
        echo ""
        echo "Skipping cron setup."
        echo "You can manually run backups with: $BACKUP_SCRIPT"
        exit 0
        ;;
    *)
        echo "Invalid choice!"
        exit 1
        ;;
esac

# Create cron job entry
CRON_JOB="$CRON_SCHEDULE cd $PROJECT_ROOT && $BACKUP_SCRIPT >> $PROJECT_ROOT/logs/backup.log 2>&1"

echo ""
echo "Cron job to be added:"
echo "  Schedule: $DESCRIPTION"
echo "  Command: $CRON_JOB"
echo ""
read -p "Add this cron job? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Create logs directory
mkdir -p "$PROJECT_ROOT/logs"

# Add cron job (avoiding duplicates)
(crontab -l 2>/dev/null | grep -v "$BACKUP_SCRIPT"; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✓ Cron job added successfully"
    echo ""
    echo "Current crontab:"
    crontab -l | grep "$BACKUP_SCRIPT"
else
    echo "✗ Failed to add cron job"
    exit 1
fi

echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
echo "Automated backups are now configured."
echo "Logs will be written to: $PROJECT_ROOT/logs/backup.log"
echo ""
echo "Useful commands:"
echo "  View crontab:     crontab -l"
echo "  Remove cron job:  crontab -e"
echo "  View backup logs: tail -f $PROJECT_ROOT/logs/backup.log"
echo "  Manual backup:    $BACKUP_SCRIPT"
echo ""
