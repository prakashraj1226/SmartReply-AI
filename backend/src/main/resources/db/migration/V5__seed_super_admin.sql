-- V5__seed_super_admin.sql
-- Seed default Platform Super Admin

INSERT INTO users (id, email, password_hash, full_name, role, email_verified, is_active, created_at, updated_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@smartreply.ai',
    '$2b$12$CyQfutcBi8rvxzCP3my01OiZT79BPwGR3zakxklhNJlYJHaj8QSZ2',
    'Platform Administrator',
    'SUPER_ADMIN',
    true,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;
