
ALTER TABLE public.lodge_config
  ADD COLUMN IF NOT EXISTS quorum_minimo_aprendiz integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS quorum_minimo_companheiro integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS quorum_minimo_mestre integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS escrutinio_secreto_obrigatorio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exigir_assinatura_vm boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exigir_assinatura_orador boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS exigir_assinatura_secretario boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dias_prazo_retificacao integer NOT NULL DEFAULT 90;
