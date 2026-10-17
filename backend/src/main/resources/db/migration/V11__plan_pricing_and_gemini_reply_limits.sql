-- V11__plan_pricing_and_gemini_reply_limits.sql
-- Raise paid plan prices and track Gemini customer-reply usage.

-- 1. Paid plan prices + conversation/staff limits
UPDATE subscription_plans
SET price_inr = 999.00,
    max_conversations_monthly = 500,
    max_agents = 1,
    ai_features_enabled = TRUE,
    features_json = '{"description":"For clinics and salons starting out","features":["500 Conversations / mo","1 Staff seat","WhatsApp & Telegram auto-reply","1,000 Gemini replies / mo","AI Assistant not included"]}'
WHERE code = 'STARTER';

UPDATE subscription_plans
SET price_inr = 1999.00,
    max_conversations_monthly = 2000,
    max_agents = 3,
    ai_features_enabled = TRUE,
    features_json = '{"description":"For growing clinics with higher enquiry volume","features":["2,000 Conversations / mo","3 Staff seats","WhatsApp & Telegram auto-reply","5,000 Gemini replies / mo","AI Assistant included"]}'
WHERE code = 'GROWTH';

UPDATE subscription_plans
SET price_inr = 3999.00,
    max_conversations_monthly = 10000,
    max_agents = 10,
    ai_features_enabled = TRUE,
    features_json = '{"description":"For established multi-staff businesses","features":["10,000 Conversations / mo","10 Staff seats","WhatsApp & Telegram auto-reply","20,000 Gemini replies / mo","AI Assistant included"]}'
WHERE code = 'PRO';

UPDATE subscription_plans
SET features_json = '{"description":"14-day Free Trial","features":["14-day Free Trial","2 Staff","5 Customers","2 Knowledge","2 FAQ","10 AI Assistant chats / day","50 Gemini replies / day","2 Appointments / day (15 total)"]}'
WHERE code = 'TRIAL';

-- 2. Daily Gemini customer-reply usage (Asia/Kolkata day). Monthly caps sum these rows.
CREATE TABLE IF NOT EXISTS gemini_reply_daily_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL,
    reply_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_gemini_reply_daily_usage UNIQUE (business_id, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_gemini_reply_daily_usage_lookup
    ON gemini_reply_daily_usage (business_id, usage_date);
