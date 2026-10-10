-- V2__seed_initial_plans.sql
-- Seed standard subscription plans

INSERT INTO subscription_plans (id, code, name, price_inr, billing_interval, max_conversations_monthly, max_agents, ai_features_enabled, is_active, features_json)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'FREE', 'Free Tier', 0.00, 'MONTHLY', 50, 1, true, true, 
     '{"description": "Ideal for testing & micro businesses", "features": ["1 Business Profile", "50 Conversations/mo", "Basic FAQ Assistant", "Community Support"]}'),
    ('00000000-0000-0000-0000-000000000002', 'STARTER', 'Starter Plan', 499.00, 'MONTHLY', 500, 1, true, true, 
     '{"description": "For clinics, salons and retail shops starting out", "features": ["1 Business Profile", "500 Conversations/mo", "FAQ Automation", "WhatsApp Integration", "Basic Reports", "Email Support"]}'),
    ('00000000-0000-0000-0000-000000000003', 'GROWTH', 'Growth Plan', 999.00, 'MONTHLY', 2000, 3, true, true, 
     '{"description": "For growing businesses needing team collaboration", "features": ["Up to 3 Team Agents", "2,000 Conversations/mo", "AI Reply Suggestions", "Automation Rules", "Advanced Reports", "Priority Support"]}'),
    ('00000000-0000-0000-0000-000000000004', 'PRO', 'Pro Business', 1999.00, 'MONTHLY', 10000, 10, true, true, 
     '{"description": "Complete power suite for established enterprises", "features": ["Up to 10 Agents", "10,000 Conversations/mo", "Advanced AI Tuning", "Custom Automation Hooks", "Dedicated SLA", "WhatsApp Official Green Tick Assistance"]}')
ON CONFLICT (code) DO NOTHING;
