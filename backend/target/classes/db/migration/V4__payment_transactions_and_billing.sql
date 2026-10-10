-- V4: Payment Transactions for Razorpay & Subscription Billing

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    gateway VARCHAR(50) NOT NULL DEFAULT 'SIMULATED', -- RAZORPAY, SIMULATED
    order_id VARCHAR(255),
    payment_id VARCHAR(255),
    signature VARCHAR(255),
    amount_inr NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED, REFUNDED
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_business ON payment_transactions(business_id);
