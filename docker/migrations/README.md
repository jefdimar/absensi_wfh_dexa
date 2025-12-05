# Database Migrations

This directory contains database migration scripts for the Absensi WFH Dexa application.

## Running Migrations

### For Existing Databases

If you have an existing database that was created before the foreign key constraints were added, run the migration script:

```bash
# Using Docker
docker-compose exec postgres psql -U postgres -d absensi_wfh_dexa -f /docker-entrypoint-initdb.d/migrations/001_add_foreign_keys_and_constraints.sql

# Or copy the file and run it
docker cp docker/migrations/001_add_foreign_keys_and_constraints.sql absensi_postgres:/tmp/
docker-compose exec postgres psql -U postgres -d absensi_wfh_dexa -f /tmp/001_add_foreign_keys_and_constraints.sql
```

### For Fresh Installations

New installations will automatically have all constraints and indexes applied via the `docker/init.sql` script. No migration needed.

## Migration Scripts

| Script | Date | Description |
|--------|------|-------------|
| `001_add_foreign_keys_and_constraints.sql` | 2025-12-05 | Adds foreign key constraints, unique constraints for daily attendance, and composite indexes |

## Verifying Migrations

After running a migration, verify that constraints were added:

```sql
-- Check foreign key constraints
SELECT conname, conrelid::regclass AS table_name
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace;

-- Check unique constraints and indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Creating New Migrations

When creating new migrations:

1. Use sequential numbering: `002_description.sql`, `003_description.sql`, etc.
2. Include comments explaining what the migration does
3. Make migrations idempotent (use `IF NOT EXISTS` where possible)
4. Test migrations on a copy of production data first
5. Document the migration in this README

## Rollback

To rollback a migration, manually reverse the changes:

```sql
-- Example: Remove foreign keys
ALTER TABLE profile_change_logs DROP CONSTRAINT IF EXISTS fk_profile_change_logs_employee;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS fk_attendance_records_employee;
ALTER TABLE admin_notifications DROP CONSTRAINT IF EXISTS fk_admin_notifications_employee;
```

**Note:** Rollbacks should be tested in development before running in production.
