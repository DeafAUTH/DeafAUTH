-- DeafAuth Schema Setup
-- Adds DeafAuth-specific tables, indexes, views and RLS policies for authentication flow

-- 1) Ensure pgcrypto / extensions exist for hashing (should already be present)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

-- 2) Create deafauth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS deafauth;

-- 3) Create deafauth.users table if not exists
CREATE TABLE IF NOT EXISTS deafauth.users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sign_language_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4) Create deafauth.user_profiles table if not exists
CREATE TABLE IF NOT EXISTS deafauth.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES deafauth.users(id) ON DELETE CASCADE,
  username text,
  email text,
  communication_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5) Create deafauth.user_verification table if not exists
CREATE TABLE IF NOT EXISTS deafauth.user_verification (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES deafauth.users(id) ON DELETE CASCADE,
  verification_level text NOT NULL DEFAULT 'unverified',
  verified_at timestamptz,
  verification_method text,
  fibonrose_verification_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6) Create deafauth.portable_identity_tokens table for one-time tokens
CREATE TABLE IF NOT EXISTS deafauth.portable_identity_tokens (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES deafauth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 7) Add index on portable_identity_tokens.token_hash for quick lookup
CREATE INDEX IF NOT EXISTS idx_deafauth_portable_token_hash 
  ON deafauth.portable_identity_tokens (token_hash);

-- 8) Add index on user_verification.user_id if not present
CREATE INDEX IF NOT EXISTS idx_deafauth_user_verification_user_id 
  ON deafauth.user_verification (user_id);

-- 9) Lightweight verification audit table
CREATE TABLE IF NOT EXISTS deafauth.token_verification_audit (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  token_id bigint, -- nullable if JWT path used
  method text NOT NULL, -- 'portable_token' | 'jwt'
  ip inet NULL,
  user_agent text NULL,
  success boolean NOT NULL DEFAULT false,
  reason text NULL,
  created_at timestamptz DEFAULT now()
);

-- 10) Grant insert on audit to authenticated
GRANT INSERT ON deafauth.token_verification_audit TO authenticated;
-- Note: in production, Edge Functions should use service role / service key

-- 11) Helpful view to expose public profile info for responses (non-sensitive)
CREATE OR REPLACE VIEW deafauth.public_profile AS
SELECT
  u.id as deafauth_user_id,
  u.auth_user_id as auth_user_id,
  up.username,
  up.email,
  COALESCE(up.communication_preferences, jsonb_build_object()) AS communication_preferences,
  u.sign_language_preferences,
  COALESCE(v.verification_level::text, 'unverified') as verification_level
FROM deafauth.users u
LEFT JOIN deafauth.user_profiles up ON up.user_id = u.id
LEFT JOIN deafauth.user_verification v ON v.user_id = u.id;

-- 12) Enable RLS on deafauth tables
ALTER TABLE deafauth.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE deafauth.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE deafauth.user_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE deafauth.portable_identity_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE deafauth.token_verification_audit ENABLE ROW LEVEL SECURITY;

-- 13) RLS Policies for deafauth.users
CREATE POLICY "Users can view their own deafauth user record" 
  ON deafauth.users FOR SELECT 
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own deafauth user record" 
  ON deafauth.users FOR UPDATE 
  USING (auth.uid() = auth_user_id);

-- 14) RLS Policies for deafauth.user_profiles
CREATE POLICY "Users can view their own profile" 
  ON deafauth.user_profiles FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM deafauth.users 
      WHERE users.id = user_profiles.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" 
  ON deafauth.user_profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM deafauth.users 
      WHERE users.id = user_profiles.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- 15) RLS Policies for deafauth.user_verification (read-only for users)
CREATE POLICY "Users can view their own verification status" 
  ON deafauth.user_verification FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM deafauth.users 
      WHERE users.id = user_verification.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- 16) RLS Policies for portable_identity_tokens (service role only)
-- Users should not directly access tokens; only Edge Functions with service role
CREATE POLICY "Service role can manage portable tokens" 
  ON deafauth.portable_identity_tokens FOR ALL 
  USING (auth.role() = 'service_role');

-- 17) RLS Policies for token_verification_audit (service role only)
CREATE POLICY "Service role can insert audit records" 
  ON deafauth.token_verification_audit FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can view audit records" 
  ON deafauth.token_verification_audit FOR SELECT 
  USING (auth.role() = 'service_role');
