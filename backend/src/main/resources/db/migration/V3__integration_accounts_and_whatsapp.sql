-- V3: Extend integration_accounts with app_secret & config_json, and add indexes

ALTER TABLE integration_accounts ADD COLUMN IF NOT EXISTS app_secret VARCHAR(255);
ALTER TABLE integration_accounts ADD COLUMN IF NOT EXISTS config_json TEXT;

CREATE INDEX IF NOT EXISTS idx_integration_phone_number_id ON integration_accounts(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_integration_webhook_verify_token ON integration_accounts(webhook_verify_token);
