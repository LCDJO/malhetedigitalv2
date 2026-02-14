
-- Tabela para armazenar códigos de verificação de email
CREATE TABLE public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca rápida
CREATE INDEX idx_verification_codes_email_code ON public.email_verification_codes (email, code);
CREATE INDEX idx_verification_codes_expires ON public.email_verification_codes (expires_at);

-- RLS
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Ninguém acessa diretamente — só via edge functions com service role
CREATE POLICY "No direct access" ON public.email_verification_codes FOR ALL USING (false);
