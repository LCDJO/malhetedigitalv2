
-- ============= BENEFICÊNCIA SEGREGADA =============
CREATE TYPE public.beneficencia_tipo AS ENUM ('entrada','saida','estorno');
CREATE TYPE public.beneficencia_origem AS ENUM ('tronco_sessao','doacao','transferencia','assistencia','outro');

CREATE TABLE public.beneficencia_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo public.beneficencia_tipo NOT NULL,
  origem public.beneficencia_origem NOT NULL DEFAULT 'outro',
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  descricao TEXT,
  sessao_id UUID REFERENCES public.sessoes(id) ON DELETE SET NULL,
  ata_id UUID REFERENCES public.atas(id) ON DELETE SET NULL,
  beneficiario_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  estorno_de UUID REFERENCES public.beneficencia_lancamentos(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_beneficencia_tenant_data ON public.beneficencia_lancamentos(tenant_id, data DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beneficencia_lancamentos TO authenticated;
GRANT ALL ON public.beneficencia_lancamentos TO service_role;
ALTER TABLE public.beneficencia_lancamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "beneficencia_select" ON public.beneficencia_lancamentos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "beneficencia_write_admin" ON public.beneficencia_lancamentos
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_beneficencia_updated BEFORE UPDATE ON public.beneficencia_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============= HOSPITALARIA =============
CREATE TYPE public.hospitalaria_tipo AS ENUM ('visita','auxilio_financeiro','oracao','cesta_basica','acompanhamento_familia','outro');
CREATE TYPE public.hospitalaria_status AS ENUM ('aberto','em_acompanhamento','concluido','cancelado');

CREATE TABLE public.hospitalaria_assistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  tipo public.hospitalaria_tipo NOT NULL,
  status public.hospitalaria_status NOT NULL DEFAULT 'aberto',
  data_abertura DATE NOT NULL DEFAULT CURRENT_DATE,
  data_encerramento DATE,
  motivo TEXT NOT NULL,
  observacoes TEXT,
  valor NUMERIC(12,2),
  beneficencia_lancamento_id UUID REFERENCES public.beneficencia_lancamentos(id) ON DELETE SET NULL,
  responsavel_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hosp_tenant_status ON public.hospitalaria_assistencias(tenant_id, status, data_abertura DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hospitalaria_assistencias TO authenticated;
GRANT ALL ON public.hospitalaria_assistencias TO service_role;
ALTER TABLE public.hospitalaria_assistencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hosp_select" ON public.hospitalaria_assistencias
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "hosp_write_admin" ON public.hospitalaria_assistencias
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_hosp_updated BEFORE UPDATE ON public.hospitalaria_assistencias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Impede DELETE de lançamento de beneficência vinculado a assistência
CREATE OR REPLACE FUNCTION public.prevent_beneficencia_delete_when_linked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.hospitalaria_assistencias WHERE beneficencia_lancamento_id = OLD.id) THEN
    RAISE EXCEPTION 'Lançamento vinculado a assistência. Use estorno em vez de excluir.';
  END IF;
  RETURN OLD;
END $$;

CREATE TRIGGER trg_beneficencia_no_delete BEFORE DELETE ON public.beneficencia_lancamentos
  FOR EACH ROW EXECUTE FUNCTION public.prevent_beneficencia_delete_when_linked();
