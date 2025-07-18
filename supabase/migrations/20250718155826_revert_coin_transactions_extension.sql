-- Revert changes from 20250718151728_extend_coin_transactions.sql
-- This removes all the Wise payment extensions

-- Drop indexes first
DROP INDEX IF EXISTS idx_coin_transactions_status;
DROP INDEX IF EXISTS idx_coin_transactions_reference;
DROP INDEX IF EXISTS idx_coin_transactions_payment_method;

-- Drop the new columns
ALTER TABLE coin_transactions 
DROP COLUMN IF EXISTS completed_at,
DROP COLUMN IF EXISTS submitted_at,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS wise_transaction_id,
DROP COLUMN IF EXISTS reference,
DROP COLUMN IF EXISTS payment_method;
