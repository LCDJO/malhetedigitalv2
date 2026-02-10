
-- Add financial and system config columns to lodge_config
ALTER TABLE public.lodge_config
  ADD COLUMN IF NOT EXISTS mensalidade_padrao numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dia_vencimento integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS meses_tolerancia_inadimplencia integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS permitir_lancamento_retroativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exigir_aprovacao_tesouraria boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notificar_inadimplencia boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS observacoes text DEFAULT '';
