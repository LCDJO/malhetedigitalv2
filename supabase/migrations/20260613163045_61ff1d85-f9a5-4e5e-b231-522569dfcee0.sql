
-- ENUMS
CREATE TYPE public.proposta_estado AS ENUM (
  'rascunho','sindicancia','parecer','escrutinio','aprovada','rejeitada','arquivada'
);
CREATE TYPE public.sindicancia_voto AS ENUM ('favoravel','contrario','abstencao');
CREATE TYPE public.escrutinio_estado AS ENUM ('aberto','encerrado','anulado');
CREATE TYPE public.voto_cor AS ENUM ('branca','preta');

-- PROPOSTAS DE INICIAÇÃO
CREATE TABLE public.propostas_iniciacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  candidato_nome TEXT NOT NULL,
  candidato_cpf TEXT,
  candidato_email TEXT,
  candidato_telefone TEXT,
  candidato_nascimento DATE,
  candidato_profissao TEXT,
  candidato_endereco TEXT,
  padrinho_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  apresentacao TEXT,
  estado public.proposta_estado NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.propostas_iniciacao TO authenticated;
GRANT ALL ON public.propostas_iniciacao TO service_role;
ALTER TABLE public.propostas_iniciacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant admins read propostas"
  ON public.propostas_iniciacao FOR SELECT TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "tenant admins manage propostas"
  ON public.propostas_iniciacao FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_propostas_updated BEFORE UPDATE ON public.propostas_iniciacao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- SINDICÂNCIAS
CREATE TABLE public.sindicancias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposta_id UUID NOT NULL REFERENCES public.propostas_iniciacao(id) ON DELETE CASCADE,
  sindicante_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE RESTRICT,
  relatorio TEXT,
  voto public.sindicancia_voto,
  entregue_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sindicancias TO authenticated;
GRANT ALL ON public.sindicancias TO service_role;
ALTER TABLE public.sindicancias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant admins read sindicancias"
  ON public.sindicancias FOR SELECT TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "tenant admins manage sindicancias"
  ON public.sindicancias FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_sindicancias_updated BEFORE UPDATE ON public.sindicancias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ESCRUTÍNIOS
CREATE TABLE public.escrutinios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  proposta_id UUID NOT NULL REFERENCES public.propostas_iniciacao(id) ON DELETE CASCADE,
  sessao_id UUID REFERENCES public.sessoes(id) ON DELETE SET NULL,
  estado public.escrutinio_estado NOT NULL DEFAULT 'aberto',
  aberto_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  encerrado_em TIMESTAMPTZ,
  total_brancas INT NOT NULL DEFAULT 0,
  total_pretas INT NOT NULL DEFAULT 0,
  resultado TEXT,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.escrutinios TO authenticated;
GRANT ALL ON public.escrutinios TO service_role;
ALTER TABLE public.escrutinios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant admins read escrutinios"
  ON public.escrutinios FOR SELECT TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "tenant admins manage escrutinios"
  ON public.escrutinios FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_escrutinios_updated BEFORE UPDATE ON public.escrutinios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- VOTOS ANÔNIMOS
-- voter_hash garante "1 voto por eleitor por escrutínio" sem expor identidade.
CREATE TABLE public.escrutinio_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  escrutinio_id UUID NOT NULL REFERENCES public.escrutinios(id) ON DELETE CASCADE,
  voter_hash TEXT NOT NULL,
  cor public.voto_cor NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (escrutinio_id, voter_hash)
);

GRANT SELECT, INSERT ON public.escrutinio_votos TO authenticated;
GRANT ALL ON public.escrutinio_votos TO service_role;
ALTER TABLE public.escrutinio_votos ENABLE ROW LEVEL SECURITY;

-- Admins do tenant podem ver agregados (cor + escrutinio) mas voter_hash não revela identidade.
CREATE POLICY "tenant admins read votos agregados"
  ON public.escrutinio_votos FOR SELECT TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

-- Inserção: qualquer membro autenticado do tenant pode votar enquanto escrutínio estiver aberto.
CREATE POLICY "tenant members vote"
  ON public.escrutinio_votos FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(auth.uid(), tenant_id)
    AND EXISTS (
      SELECT 1 FROM public.escrutinios e
      WHERE e.id = escrutinio_id AND e.estado = 'aberto' AND e.tenant_id = tenant_id
    )
  );

-- Bloqueia edição/exclusão de proposta após escrutínio aprovado/rejeitado
CREATE OR REPLACE FUNCTION public.prevent_proposta_edit_when_decided()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _estado public.proposta_estado;
BEGIN
  SELECT estado INTO _estado FROM public.propostas_iniciacao
   WHERE id = COALESCE(NEW.id, OLD.id);
  IF _estado IN ('aprovada','rejeitada','arquivada') AND TG_OP <> 'INSERT' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Proposta já decidida não pode ser excluída.';
    END IF;
    IF NEW.estado <> _estado AND NEW.estado NOT IN ('arquivada') THEN
      RAISE EXCEPTION 'Proposta já decidida só pode ser arquivada.';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_propostas_lock
  BEFORE UPDATE OR DELETE ON public.propostas_iniciacao
  FOR EACH ROW EXECUTE FUNCTION public.prevent_proposta_edit_when_decided();
