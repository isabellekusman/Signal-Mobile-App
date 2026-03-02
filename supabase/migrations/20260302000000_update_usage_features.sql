-- Update ai_usage feature check constraint to include log_synthesis
ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_feature_check;
ALTER TABLE ai_usage ADD CONSTRAINT ai_usage_feature_check 
    CHECK (feature IN ('clarity', 'decoder', 'stars', 'dynamic', 'daily_advice', 'objective', 'log_synthesis'));

-- Ensure subscription_tier check is correct (it already is, but just in case)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('free', 'seeker', 'signal'));
