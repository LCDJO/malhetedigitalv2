
ALTER TABLE public.lodge_config
  ADD COLUMN IF NOT EXISTS potencia text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS endereco text DEFAULT '',
  ADD COLUMN IF NOT EXISTS email_institucional text DEFAULT '',
  ADD COLUMN IF NOT EXISTS telefone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS logotipo_url text DEFAULT '';
