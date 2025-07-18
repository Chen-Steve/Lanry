-- Add Wise tag to profiles table for payment matching
-- This enables matching Wise payments to user accounts via their Wise tag

-- Add wise_tag column to profiles table
ALTER TABLE profiles 
ADD COLUMN wise_tag VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN profiles.wise_tag IS 'User''s Wise tag for payment identification and matching';

-- Create index for faster lookups when processing Wise payments
CREATE INDEX idx_profiles_wise_tag ON profiles(wise_tag) WHERE wise_tag IS NOT NULL;

-- Add unique constraint to prevent duplicate wise tags
ALTER TABLE profiles ADD CONSTRAINT unique_wise_tag UNIQUE (wise_tag);
