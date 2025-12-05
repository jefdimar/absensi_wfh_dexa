# Database Backup & Restore Scripts

This directory contains scripts for backing up and restoring the Absensi WFH Dexa PostgreSQL database.

## Quick Start

### Manual Backup

```bash
# Make script executable (first time only)
chmod +x scripts/backup-database.sh

# Run backup
./scripts/backup-database.sh
```

Backups are saved to `./backups/` directory with timestamp: `absensi_backup_YYYYMMDD_HHMMSS.sql.gz`

### Restore from Backup

```bash
# Make script executable (first time only)
chmod +x scripts/restore-database.sh

# Restore from a backup file
./scripts/restore-database.sh backups/absensi_backup_20251205_120000.sql.gz
```

**WARNING:** Restore will replace the current database. You will be prompted to confirm.

### Setup Automated Backups

```bash
# Make script executable (first time only)
chmod +x scripts/setup-automated-backups.sh

# Run setup wizard
./scripts/setup-automated-backups.sh
```

The wizard will guide you through setting up a cron job for automated backups.

## Scripts

### `backup-database.sh`

Creates a compressed backup of the PostgreSQL database.

**Features:**
- Timestamped backup files
- Automatic compression (gzip)
- Automatic cleanup of old backups (30 days retention by default)
- Error handling and validation

**Environment Variables:**
```bash
BACKUP_DIR=./backups          # Backup directory
CONTAINER_NAME=absensi_postgres  # Docker container name
DB_NAME=absensi_wfh_dexa      # Database name
DB_USER=postgres               # Database user
RETENTION_DAYS=30              # Days to keep old backups
```

**Example Usage:**
```bash
# Default backup
./scripts/backup-database.sh

# Custom backup location
BACKUP_DIR=/mnt/backups ./scripts/backup-database.sh

# Keep backups for 90 days
RETENTION_DAYS=90 ./scripts/backup-database.sh
```

### `restore-database.sh`

Restores the database from a backup file.

**Features:**
- Handles compressed (.gz) and uncompressed (.sql) files
- Confirmation prompt before restore
- Lists available backups if no file specified
- Automatic decompression

**Usage:**
```bash
# Restore from specific backup
./scripts/restore-database.sh backups/absensi_backup_20251205_120000.sql.gz

# List available backups
./scripts/restore-database.sh
```

### `setup-automated-backups.sh`

Sets up a cron job for automated database backups.

**Features:**
- Interactive setup wizard
- Multiple schedule options (daily, 6h, 12h, custom)
- Automatic logging
- Duplicate prevention

**Schedule Options:**
1. Daily at 2:00 AM (recommended for production)
2. Daily at midnight
3. Every 6 hours
4. Every 12 hours
5. Custom cron expression
6. Manual only (no cron)

## Backup Strategy

### Recommended Approach

**Development:**
- Manual backups before major changes
- Weekly automated backups (optional)

**Production:**
- Daily automated backups at 2:00 AM
- 30-day retention period
- Off-site backup storage (copy to S3, Google Drive, etc.)
- Test restore procedure monthly

### Backup Frequency Guidelines

| Data Criticality | Backup Frequency | Retention |
|-----------------|------------------|-----------|
| Low | Weekly | 14 days |
| Medium | Daily | 30 days |
| High | Every 6-12 hours | 60-90 days |
| Critical | Every 1-6 hours | 180 days + archival |

## Storage Recommendations

### Local Storage

Backups are stored in `./backups/` by default. For production:

```bash
# Create dedicated backup directory
mkdir -p /var/backups/absensi

# Use it for backups
BACKUP_DIR=/var/backups/absensi ./scripts/backup-database.sh
```

### Remote Storage

For production systems, copy backups to remote storage:

**AWS S3:**
```bash
aws s3 cp ./backups/absensi_backup_*.sql.gz s3://my-bucket/database-backups/
```

**Google Cloud Storage:**
```bash
gsutil cp ./backups/absensi_backup_*.sql.gz gs://my-bucket/database-backups/
```

**SCP to Remote Server:**
```bash
scp ./backups/absensi_backup_*.sql.gz user@backup-server:/backups/
```

## Monitoring Backups

### Check Backup Logs

```bash
# View recent backup logs
tail -f logs/backup.log

# Check if backups are running
ls -lh backups/

# Verify cron job is active
crontab -l | grep backup-database
```

### Verify Backup Integrity

```bash
# Test that backup file is valid
gunzip -t backups/absensi_backup_20251205_120000.sql.gz

# Test restore on development database
CONTAINER_NAME=dev_postgres ./scripts/restore-database.sh backups/absensi_backup_20251205_120000.sql.gz
```

## Troubleshooting

### Backup Script Fails

**Error: Container not running**
```bash
# Check if Docker container is running
docker ps | grep absensi_postgres

# Start the container
docker-compose up -d postgres
```

**Error: Permission denied**
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Ensure backup directory is writable
chmod 755 backups/
```

**Error: Disk full**
```bash
# Check disk space
df -h

# Clean up old backups manually
find backups/ -name "*.sql.gz" -mtime +30 -delete
```

### Restore Script Fails

**Error: Database connection failed**
- Ensure PostgreSQL container is running
- Check database credentials in docker-compose.yml

**Error: Restore corrupted database**
- Verify backup file integrity: `gunzip -t backup_file.sql.gz`
- Try restoring from an older backup

### Cron Job Not Running

**Check cron service:**
```bash
# Linux
sudo service cron status

# macOS
sudo launchctl list | grep cron
```

**View cron logs:**
```bash
# Linux
grep CRON /var/log/syslog

# Check custom backup logs
tail -f logs/backup.log
```

**Test cron job manually:**
```bash
# Run the exact cron command
cd /path/to/project && ./scripts/backup-database.sh >> logs/backup.log 2>&1
```

## Best Practices

1. **Test Restores Regularly**
   - Restore to a development database monthly
   - Verify data integrity after restore

2. **Monitor Backup Size**
   - Track backup file sizes over time
   - Alert if size increases dramatically (data anomaly)

3. **Secure Backups**
   - Encrypt backups containing sensitive data
   - Restrict backup file permissions: `chmod 600 backups/*.sql.gz`
   - Store backups in a different location than production database

4. **Document Restore Procedures**
   - Keep restore documentation up to date
   - Train team members on restore process

5. **Automate Backup Verification**
   - Create a script that tests backup restoration
   - Run verification weekly

## Example: Complete Backup Strategy

```bash
# 1. Setup automated daily backups
./scripts/setup-automated-backups.sh
# Select option 1: Daily at 2:00 AM

# 2. Create a script to copy backups to S3
cat > scripts/backup-to-s3.sh << 'EOF'
#!/bin/bash
LATEST_BACKUP=$(ls -t backups/absensi_backup_*.sql.gz | head -1)
aws s3 cp "$LATEST_BACKUP" s3://my-backup-bucket/absensi/
EOF

chmod +x scripts/backup-to-s3.sh

# 3. Add S3 upload to cron (runs after backup)
echo "30 2 * * * cd $(pwd) && ./scripts/backup-to-s3.sh >> logs/s3-upload.log 2>&1" | crontab -

# 4. Test the backup immediately
./scripts/backup-database.sh

# 5. Verify backup was created
ls -lh backups/
```

## Security Considerations

- **Never commit backup files to Git** (already in `.gitignore`)
- Encrypt backups if they contain sensitive data
- Use secure transfer methods for remote backups
- Implement access controls on backup storage
- Rotate database passwords after restoring to a new environment

## Support

For issues or questions about backups:
1. Check this README
2. Review backup logs: `logs/backup.log`
3. Consult main project README
4. Check database documentation in `docker/migrations/README.md`
