-- V10: Support Telegram Bot as a free testing & demo messaging channel

-- 1. Extend integration_accounts with bot_username for Telegram
ALTER TABLE integration_accounts ADD COLUMN IF NOT EXISTS bot_username VARCHAR(100);

-- 2. Add index on provider for rapid lookup of TELEGRAM_BOT / WHATSAPP_CLOUD
CREATE INDEX IF NOT EXISTS idx_integration_provider ON integration_accounts(provider);

-- 3. Make customers phone_number nullable to support Telegram customers cleanly
ALTER TABLE customers ALTER COLUMN phone_number DROP NOT NULL;
