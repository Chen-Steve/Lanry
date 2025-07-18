-- Extend existing coin_transactions table for Wise payments
-- This is a safe, non-breaking change

-- Add new columns with safe defaults
ALTER TABLE coin_transactions 
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'PAYPAL' CHECK (payment_method IN ('PAYPAL', 'WISE')),
ADD COLUMN IF NOT EXISTS reference TEXT,
ADD COLUMN IF NOT EXISTS wise_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'SUBMITTED', 'COMPLETED', 'REJECTED')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_coin_transactions_payment_method ON coin_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_reference ON coin_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_status ON coin_transactions(status);

-- Update existing records to have proper values
UPDATE coin_transactions 
SET 
  status = 'COMPLETED',
  completed_at = created_at,
  payment_method = 'PAYPAL'
WHERE payment_method IS NULL OR payment_method = 'PAYPAL';

-- Add helpful comments
COMMENT ON COLUMN coin_transactions.payment_method IS 'Payment method: PAYPAL or WISE';
COMMENT ON COLUMN coin_transactions.reference IS 'Unique reference for Wise payments';
COMMENT ON COLUMN coin_transactions.wise_transaction_id IS 'Wise transaction ID provided by user';
COMMENT ON COLUMN coin_transactions.status IS 'Transaction status: PENDING, SUBMITTED, COMPLETED, REJECTED'; 