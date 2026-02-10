
-- Add masonic rules and financial categories columns
ALTER TABLE public.lodge_config
  ADD COLUMN IF NOT EXISTS tempo_minimo_aprendiz integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS tempo_minimo_companheiro integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS exigir_quitacao_para_avanco boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS categorias_financeiras jsonb NOT NULL DEFAULT '[]'::jsonb;
