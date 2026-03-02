-- Add policy to allow users to reset (delete) their own AI usage records
-- This is necessary for the developer reset tool to work without service-role intervention
CREATE POLICY "Users can reset own usage"
    ON ai_usage FOR DELETE
    USING (auth.uid() = user_id);
