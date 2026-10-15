ALTER TABLE payment_transactions
    ADD COLUMN reference_code VARCHAR(20),
    ADD COLUMN utr VARCHAR(64),
    ADD COLUMN upi_id VARCHAR(120);

CREATE UNIQUE INDEX idx_payments_reference ON payment_transactions (reference_code)
    WHERE reference_code IS NOT NULL;

CREATE INDEX idx_payments_status ON payment_transactions (status);
