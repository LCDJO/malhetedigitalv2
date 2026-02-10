
ALTER TABLE public.lodge_config
  ADD COLUMN IF NOT EXISTS permitir_juros boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS percentual_multa numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS percentual_juros numeric NOT NULL DEFAULT 1;
