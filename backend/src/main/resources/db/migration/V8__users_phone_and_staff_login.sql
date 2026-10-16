-- V8__users_phone_and_staff_login.sql
-- Add phone number to users table to support Mobile Number login and staff contact mapping

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Backfill user phone from staff table where matching
UPDATE users u
SET phone = s.phone
FROM staff s
WHERE s.user_id = u.id AND (u.phone IS NULL OR u.phone = '') AND s.phone IS NOT NULL AND s.phone <> '';
