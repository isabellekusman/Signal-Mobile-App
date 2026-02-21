-- ============================================================
-- Signal Mobile — Supabase Database Schema + RLS Policies
-- Run this in Supabase SQL Editor (Dashboard → SQL → New Query)
-- ============================================================

-- ─── PROFILES TABLE ──────────────────────────────────────────
-- Stores user profile data from onboarding

CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT DEFAULT '',
    zodiac TEXT DEFAULT '',
    about TEXT DEFAULT '',
    standards TEXT[] DEFAULT '{}',
    boundaries TEXT[] DEFAULT '{}',
    attachment_style TEXT[] DEFAULT '{}',
    dealbreakers TEXT[] DEFAULT '{}',
    love_language TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
    ON profiles FOR DELETE
    USING (auth.uid() = id);


-- ─── CONNECTIONS TABLE ───────────────────────────────────────
-- Stores relationship connections per user

CREATE TABLE IF NOT EXISTS connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    tag TEXT DEFAULT 'SITUATIONSHIP',
    zodiac TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    signals JSONB DEFAULT '[]'::JSONB,
    daily_logs JSONB DEFAULT '[]'::JSONB,
    saved_logs JSONB DEFAULT '[]'::JSONB,
    onboarding_context JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
    ON connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
    ON connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
    ON connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
    ON connections FOR DELETE
    USING (auth.uid() = user_id);


-- ─── AI USAGE TRACKING TABLE ────────────────────────────────
-- Tracks AI API usage per user for rate limiting & billing

CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    feature TEXT NOT NULL CHECK (feature IN ('clarity', 'decoder', 'stars', 'dynamic', 'daily_advice', 'objective')),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage (for displaying limits in UI)
CREATE POLICY "Users can view own usage"
    ON ai_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Only server (service role) can insert usage records
-- No INSERT policy for users — Edge Functions use service role key
-- This prevents users from spoofing their usage count


-- ─── DEVICE TOKENS TABLE (Push Notifications) ───────────────
-- Stores push notification tokens per user per device

CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    token TEXT NOT NULL,
    platform TEXT DEFAULT 'ios' CHECK (platform IN ('ios', 'android')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device tokens"
    ON device_tokens FOR ALL
    USING (auth.uid() = user_id);


-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_connections_user_id ON connections(user_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);


-- ─── AUTO-CREATE PROFILE ON SIGNUP ──────────────────────────
-- Trigger that auto-creates a profile row when a user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─── UPDATE TIMESTAMP TRIGGER ───────────────────────────────
-- Auto-updates `updated_at` on row modification

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_connections_timestamp
    BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
