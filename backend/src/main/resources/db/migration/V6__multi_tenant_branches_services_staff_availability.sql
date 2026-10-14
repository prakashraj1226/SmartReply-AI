-- V6__multi_tenant_branches_services_staff_availability.sql
-- Production-Ready Multi-Tenant Entities for Salons, Dental Clinics, Healthcare Clinics, and Appointment-Based Businesses

-- 1. Extend businesses with industry_type and account_status
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry_type VARCHAR(50) DEFAULT 'GENERAL';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) DEFAULT 'ACTIVE';

-- Backfill industry_type based on existing category where applicable
UPDATE businesses
SET industry_type = CASE
    WHEN category ILIKE '%dental%' THEN 'DENTAL_CLINIC'
    WHEN category ILIKE '%salon%' OR category ILIKE '%spa%' OR category ILIKE '%hair%' THEN 'SALON'
    WHEN category ILIKE '%hospital%' OR category ILIKE '%health%' OR category ILIKE '%clinic%' THEN 'HOSPITAL'
    ELSE 'GENERAL'
END
WHERE industry_type IS NULL OR industry_type = 'GENERAL';

-- 2. Extend business_members with membership_status and joined_at
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS membership_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE business_members ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 3. BRANCHES (Multi-branch / Multi-location support)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branches_business ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_branches_business_active ON branches(business_id, is_active);

-- Seed default "Main Branch" for any existing business that does not have branches yet
INSERT INTO branches (business_id, name, address, phone, timezone)
SELECT b.id, b.name || ' (Main Branch)', b.address, b.phone, b.timezone
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM branches br WHERE br.business_id = b.id);

-- 4. SERVICES (Structured service catalog with pricing, duration & buffers)
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    buffer_before_minutes INT NOT NULL DEFAULT 0,
    buffer_after_minutes INT NOT NULL DEFAULT 0,
    price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_business ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_active ON services(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_services_branch ON services(branch_id);

-- 5. STAFF (Dentists, Doctors, Stylists, Beauticians, Receptionists)
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    staff_type VARCHAR(50) NOT NULL DEFAULT 'STAFF', -- DOCTOR, DENTIST, STYLIST, BEAUTICIAN, RECEPTIONIST, NURSE, THERAPIST, STAFF
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_business ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_active ON staff(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id);

-- 6. STAFF_SERVICES (Tenant-aware mapping of which staff members perform which services)
CREATE TABLE IF NOT EXISTS staff_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_staff_service UNIQUE (business_id, staff_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_services_staff ON staff_services(business_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_services_service ON staff_services(business_id, service_id);

-- 7. STAFF_AVAILABILITY (Weekly shifts, operating hours & breaks per staff member)
CREATE TABLE IF NOT EXISTS staff_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1 = Monday, 7 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_staff_day UNIQUE (business_id, staff_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_staff_avail_staff ON staff_availability(business_id, staff_id);

-- 8. STAFF_LEAVES (Holidays, leaves & unavailability exceptions)
CREATE TABLE IF NOT EXISTS staff_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'APPROVED', -- APPROVED, PENDING, CANCELLED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_leaves_date ON staff_leaves(business_id, staff_id, leave_date);

-- 9. EXTEND APPOINTMENTS (Preserve existing free-text fields and link structured entities)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_source VARCHAR(50) NOT NULL DEFAULT 'STAFF_MANUAL';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_business_staff ON appointments(business_id, staff_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_business_service ON appointments(business_id, service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_branch ON appointments(business_id, branch_id);
