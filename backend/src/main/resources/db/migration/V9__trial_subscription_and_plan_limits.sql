-- V9__trial_subscription_and_plan_limits.sql
-- Implement 14-day Free Trial and enforce plan limits

-- 1. Deactivate permanent FREE plan so it is no longer offered
UPDATE subscription_plans
SET is_active = FALSE
WHERE code = 'FREE';

-- 2. Starter Plan has AI Assistant disabled
UPDATE subscription_plans
SET ai_features_enabled = FALSE
WHERE code = 'STARTER';

-- 3. Add TRIAL plan: price ₹0, 14 days, max 2 agents, AI enabled, not purchasable as a catalog plan
INSERT INTO subscription_plans (
    id, code, name, price_inr, billing_interval,
    max_conversations_monthly, max_agents, ai_features_enabled, is_active, features_json
)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    'TRIAL',
    'Free Trial',
    0.00,
    'MONTHLY',
    0,
    2,
    TRUE,
    FALSE,
    '{"description": "14-day Free Trial with full features", "features": ["14-day Free Trial", "2 Staff Agent seats", "5 Customers", "2 Knowledge Base entries", "2 FAQ entries", "10 Daily AI Assistant chats", "2 Daily Appointments (15 total)"]}'
)
ON CONFLICT (code) DO UPDATE
SET max_agents = 2,
    ai_features_enabled = TRUE,
    is_active = FALSE;

-- 4. Add trial tracking columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_status VARCHAR(50);

-- 5. Existing FREE subscriptions become TRIAL with a fresh 14 days from migration time
UPDATE subscriptions
SET plan_id = (SELECT id FROM subscription_plans WHERE code = 'TRIAL'),
    trial_started_at = CURRENT_TIMESTAMP,
    trial_ends_at = CURRENT_TIMESTAMP + INTERVAL '14 days',
    status = 'TRIALING',
    trial_status = 'ACTIVE'
WHERE plan_id = (SELECT id FROM subscription_plans WHERE code = 'FREE');

-- 6. Add type column to knowledge_articles (separate 'FAQ' vs 'KNOWLEDGE')
ALTER TABLE knowledge_articles ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'FAQ';
CREATE INDEX IF NOT EXISTS idx_knowledge_articles_business_type ON knowledge_articles(business_id, type);

-- 7. Create AI Assistant daily usage tracking table (resets at midnight Asia/Kolkata)
CREATE TABLE IF NOT EXISTS ai_assistant_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    chat_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_ai_assistant_daily_usage UNIQUE (business_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_daily_usage_lookup ON ai_assistant_daily_usage(business_id, usage_date);
