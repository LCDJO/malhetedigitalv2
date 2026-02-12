
-- Table to track failed login attempts for portal
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- email or CPF used
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from authenticated and anon (login happens before auth)
CREATE POLICY "Allow insert login attempts"
  ON public.login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read login attempts
CREATE POLICY "Admins can read login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Index for fast lookup
CREATE INDEX idx_login_attempts_identifier_created ON public.login_attempts (identifier, created_at DESC);

-- RPC: Lookup email by CPF (security definer to avoid exposing members table)
CREATE OR REPLACE FUNCTION public.lookup_email_by_cpf(_cpf TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email
  FROM public.members
  WHERE cpf = _cpf AND status = 'ativo'
  LIMIT 1;
$$;

-- RPC: Check if a member is active by email
CREATE OR REPLACE FUNCTION public.is_active_member(_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.members
    WHERE email = _email AND status = 'ativo'
  );
$$;

-- RPC: Count recent failed attempts (last 30 minutes)
CREATE OR REPLACE FUNCTION public.count_failed_attempts(_identifier TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.login_attempts
  WHERE identifier = _identifier
    AND success = false
    AND created_at > now() - interval '30 minutes';
$$;
