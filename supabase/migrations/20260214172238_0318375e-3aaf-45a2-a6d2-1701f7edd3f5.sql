
-- Table to store TOTP 2FA secrets for superadmin users
CREATE TABLE public.user_2fa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_secret TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Only the user themselves can read their 2FA config
CREATE POLICY "Users can view own 2fa" ON public.user_2fa
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Only superadmins can insert/update their own 2FA
CREATE POLICY "Users can manage own 2fa" ON public.user_2fa
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_2fa_updated_at
  BEFORE UPDATE ON public.user_2fa
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
