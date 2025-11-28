-- Create accessibility_profiles table
CREATE TABLE public.accessibility_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dark_mode boolean NOT NULL DEFAULT false,
  motion_safe boolean NOT NULL DEFAULT false,
  font_size integer NOT NULL DEFAULT 16,
  high_contrast boolean NOT NULL DEFAULT false,
  last_used timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT accessibility_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT accessibility_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.accessibility_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own accessibility profile." ON public.accessibility_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own accessibility profile." ON public.accessibility_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accessibility profile." ON public.accessibility_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create auth_sessions table
CREATE TABLE public.auth_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  current_state text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  metadata jsonb,
  client_info jsonb,
  CONSTRAINT auth_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT auth_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own auth sessions." ON public.auth_sessions FOR ALL USING (auth.uid() = user_id);

-- Create auth_events table
CREATE TABLE public.auth_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  event_type text NOT NULL,
  state_from text,
  state_to text NOT NULL,
  event_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT auth_events_pkey PRIMARY KEY (id),
  CONSTRAINT auth_events_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.auth_sessions(id) ON DELETE CASCADE
);
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
-- Users can manage events related to their own sessions. This requires a join.
CREATE POLICY "Users can manage their own auth events." ON public.auth_events FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.auth_sessions
    WHERE auth_sessions.id = auth_events.session_id AND auth_sessions.user_id = auth.uid()
  )
);


-- Create asl_verification_attempts table
CREATE TABLE public.asl_verification_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  success boolean NOT NULL,
  confidence_score real,
  attempt_number integer NOT NULL,
  verification_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT asl_verification_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT asl_verification_attempts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.auth_sessions(id) ON DELETE CASCADE
);
ALTER TABLE public.asl_verification_attempts ENABLE ROW LEVEL SECURITY;
-- Users can manage attempts related to their own sessions. This requires a join.
CREATE POLICY "Users can manage their own ASL verification attempts." ON public.asl_verification_attempts FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.auth_sessions
    WHERE auth_sessions.id = asl_verification_attempts.session_id AND auth_sessions.user_id = auth.uid()
  )
);

-- ============================================================================
-- SECURITY NOTE (Archive Migration)
-- ============================================================================
-- NOTE: Granting INSERT to 'authenticated' may allow clients to insert audit rows;
-- prefer service-role only. This line is commented out for safety in repository archive.
--
-- If adding a token_verification_audit or similar audit table in the future:
-- DO NOT use: GRANT INSERT ON deafauth.token_verification_audit TO authenticated;
-- INSTEAD use service-role inserts from server-side code only.
--
-- See docs/SECURITY.md for more information.
-- ============================================================================
