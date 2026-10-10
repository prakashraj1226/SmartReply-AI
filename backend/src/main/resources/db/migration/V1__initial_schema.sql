-- V1__initial_schema.sql
-- SmartReply AI Core Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- SUPER_ADMIN, BUSINESS_OWNER, BUSINESS_AGENT
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. BUSINESSES
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
    operating_hours_json TEXT,
    preferred_language VARCHAR(50) NOT NULL DEFAULT 'en',
    description TEXT,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. BUSINESS MEMBERS
CREATE TABLE business_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- OWNER, AGENT, ADMIN
    permissions_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_business_user UNIQUE (business_id, user_id)
);

-- 4. INTEGRATION ACCOUNTS (WhatsApp Cloud API / Sandbox)
CREATE TABLE integration_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
    phone_number_id VARCHAR(100),
    waba_id VARCHAR(100),
    phone_number VARCHAR(50),
    display_name VARCHAR(100),
    encrypted_access_token TEXT,
    webhook_verify_token VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, ERROR, SANDBOX
    mode VARCHAR(50) NOT NULL DEFAULT 'SANDBOX', -- SANDBOX, PRODUCTION
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_business_provider UNIQUE (business_id, provider)
);

-- 5. AI CONFIGURATIONS
CREATE TABLE ai_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    assistant_name VARCHAR(100) NOT NULL DEFAULT 'SmartReply Assistant',
    tone VARCHAR(50) NOT NULL DEFAULT 'PROFESSIONAL', -- PROFESSIONAL, FRIENDLY, EMPATHETIC, CONCISE
    greeting_message TEXT DEFAULT 'Hello! How can I help you today?',
    fallback_message TEXT DEFAULT 'I am sorry, I do not have this information right now. Let me connect you with our human team member.',
    confidence_threshold NUMERIC(4,2) NOT NULL DEFAULT 0.70,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    max_response_tokens INT NOT NULL DEFAULT 250,
    escalation_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. KNOWLEDGE CATEGORIES
CREATE TABLE knowledge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. KNOWLEDGE ARTICLES (FAQs)
CREATE TABLE knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES knowledge_categories(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. CUSTOMERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    opt_in_status VARCHAR(50) NOT NULL DEFAULT 'OPTED_IN', -- OPTED_IN, OPTED_OUT
    tags_json TEXT, -- JSON array of string tags
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_business_customer_phone UNIQUE (business_id, phone_number)
);

-- 9. CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL DEFAULT 'WHATSAPP',
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED, PENDING, SNOOZED
    unread_count INT NOT NULL DEFAULT 0,
    assigned_agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ai_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_message_snippet TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL, -- CUSTOMER, AGENT, AI, SYSTEM
    text_content TEXT NOT NULL,
    external_message_id VARCHAR(255),
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- SENT, DELIVERED, READ, FAILED
    raw_payload_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. APPOINTMENTS
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    staff_name VARCHAR(255),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED', -- PENDING, CONFIRMED, CANCELLED, COMPLETED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUTOMATION RULES
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    trigger_event VARCHAR(100) NOT NULL, -- FIRST_MESSAGE_RECEIVED, APPOINTMENT_CONFIRMED, AI_FALLBACK_TRIGGERED, CONVERSATION_UNANSWERED
    conditions_json TEXT,
    actions_json TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. AUTOMATION EXECUTIONS
CREATE TABLE automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    rule_id UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
    trigger_event VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- SUCCESS, FAILED
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. SUBSCRIPTION PLANS
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    price_inr NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    billing_interval VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    max_conversations_monthly INT NOT NULL DEFAULT 100,
    max_agents INT NOT NULL DEFAULT 1,
    ai_features_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    features_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELLED, TRIALING
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO', -- INFO, WARNING, SUCCESS, ERROR
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. WEBHOOK EVENTS (For Idempotency)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    payload_hash VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSED',
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. AUDIT LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details_json TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PERFORMANCE & ISOLATION INDEXES
CREATE INDEX idx_business_members_user ON business_members(user_id);
CREATE INDEX idx_conversations_business_status ON conversations(business_id, status);
CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX idx_messages_business ON messages(business_id);
CREATE INDEX idx_knowledge_articles_business ON knowledge_articles(business_id);
CREATE INDEX idx_appointments_business_dates ON appointments(business_id, start_time, end_time);
CREATE INDEX idx_notifications_business_user ON notifications(business_id, user_id, is_read);
