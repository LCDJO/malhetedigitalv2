
-- Garantir colunas de mandato em membro_cargos (idempotente)
ALTER TABLE public.membro_cargos
  ADD COLUMN IF NOT EXISTS mandato_inicio DATE,
  ADD COLUMN IF NOT EXISTS mandato_fim DATE,
  ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT true;

-- Enums
DO $$ BEGIN
  CREATE TYPE public.grau_macom AS ENUM ('aprendiz','companheiro','mestre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.aumento_estado AS ENUM ('proposto','instruido','escrutinio','aprovado','rejeitado','realizado','arquivado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Aumentos de salário
CREATE TABLE public.aumentos_salario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  grau_origem public.grau_macom NOT NULL,
  grau_destino public.grau_macom NOT NULL,
  estado public.aumento_estado NOT NULL DEFAULT 'proposto',
  data_prevista DATE,
  data_realizado DATE,
  escrutinio_id UUID REFERENCES public.escrutinios(id) ON DELETE SET NULL,
  justificativa TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (grau_origem <> grau_destino)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aumentos_salario TO authenticated;
GRANT ALL ON public.aumentos_salario TO service_role;
ALTER TABLE public.aumentos_salario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant admins read aumentos"
  ON public.aumentos_salario FOR SELECT TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE POLICY "tenant admins manage aumentos"
  ON public.aumentos_salario FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_aumentos_updated BEFORE UPDATE ON public.aumentos_salario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Quando aumento é 'realizado', propaga grau no membro (campo grau livre em members)
CREATE OR REPLACE FUNCTION public.apply_aumento_realizado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.estado = 'realizado' AND (OLD.estado IS DISTINCT FROM 'realizado') THEN
    UPDATE public.members SET grau = NEW.grau_destino::text WHERE id = NEW.member_id;
    IF NEW.data_realizado IS NULL THEN
      NEW.data_realizado := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_aumentos_apply
  BEFORE UPDATE ON public.aumentos_salario
  FOR EACH ROW EXECUTE FUNCTION public.apply_aumento_realizado();
