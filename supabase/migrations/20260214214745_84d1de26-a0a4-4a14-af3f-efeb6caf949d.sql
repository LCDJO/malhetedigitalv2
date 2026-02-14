ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS representative_cpf text,
  ADD COLUMN IF NOT EXISTS representative_address text;