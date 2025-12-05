-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    photo_url TEXT,
    position VARCHAR(100),
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'employee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create profile_change_logs table
CREATE TABLE IF NOT EXISTS profile_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    changed_field VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    status VARCHAR(10) CHECK (status IN ('check-in', 'check-out'))
);

-- Notification service tables
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints for data integrity
ALTER TABLE profile_change_logs
    ADD CONSTRAINT fk_profile_change_logs_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE;

ALTER TABLE attendance_records
    ADD CONSTRAINT fk_attendance_records_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE;

ALTER TABLE admin_notifications
    ADD CONSTRAINT fk_admin_notifications_employee
    FOREIGN KEY (employee_id)
    REFERENCES employees(id)
    ON DELETE CASCADE;

-- Add unique constraint to prevent duplicate daily check-ins (race condition protection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_checkin
    ON attendance_records(employee_id, DATE(timestamp), status);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_profile_change_logs_employee_id ON profile_change_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_profile_change_logs_changed_at ON profile_change_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON admin_notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON admin_notifications(read);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date_status
    ON attendance_records(employee_id, DATE(timestamp), status);

CREATE INDEX IF NOT EXISTS idx_profile_logs_employee_date
    ON profile_change_logs(employee_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_employee_read
    ON admin_notifications(employee_id, read, created_at DESC);