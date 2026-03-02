-- Add cached_advice to connections table
ALTER TABLE connections ADD COLUMN IF NOT EXISTS cached_advice JSONB DEFAULT NULL;
