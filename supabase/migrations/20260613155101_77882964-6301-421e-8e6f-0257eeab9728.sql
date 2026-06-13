
-- ─── Enums ───
DO $$ BEGIN
  CREATE TYPE public.ata_estado AS ENUM (
    'rascunho','revisao','leitura','aprovada','travada','publicada','retificada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bloco_tipo AS ENUM (
    'cabecalho','abertura','expediente','saco_propostas','ordem_dia',
    'tempo_estudos','tronco','palavra_bem','encerramento','outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 1. atas ───
CREATE TABLE IF NOT EXISTS public.atas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sessao_id UUID NOT NULL REFERENCES public.sessoes(id) ON DELETE RESTRICT,
  numero TEXT,
  titulo TEXT,
  estado public.ata_estado NOT NULL DEFAULT 'rascunho',
  hash_integridade TEXT,
  versao_atual INTEGER NOT NULL DEFAULT 1,
  publicada_em TIMESTAMPTZ,
  travada_em TIMESTAMPTZ,
  retificacao_de UUID REFERENCES public.atas(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, numero)
);
CREATE INDEX IF NOT EXISTS idx_atas_tenant ON public.atas(tenant_id, estado);
CREATE INDEX IF NOT EXISTS idx_atas_sessao ON public.atas(sessao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.atas TO authenticated;
GRANT ALL ON public.atas TO service_role;
ALTER TABLE public.atas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "atas_select" ON public.atas
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "atas_admin" ON public.atas
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_atas_updated
  BEFORE UPDATE ON public.atas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 2. blocos_ata ───
CREATE TABLE IF NOT EXISTS public.blocos_ata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ata_id UUID NOT NULL REFERENCES public.atas(id) ON DELETE CASCADE,
  tipo public.bloco_tipo NOT NULL,
  ordem SMALLINT NOT NULL DEFAULT 0,
  titulo TEXT,
  conteudo TEXT,
  conteudo_json JSONB,
  autor_id UUID REFERENCES public.members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blocos_ata ON public.blocos_ata(ata_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocos_ata TO authenticated;
GRANT ALL ON public.blocos_ata TO service_role;
ALTER TABLE public.blocos_ata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocos_ata_select" ON public.blocos_ata
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "blocos_ata_admin" ON public.blocos_ata
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_blocos_ata_updated
  BEFORE UPDATE ON public.blocos_ata
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 3. versoes_ata (imutável) ───
CREATE TABLE IF NOT EXISTS public.versoes_ata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ata_id UUID NOT NULL REFERENCES public.atas(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  hash TEXT NOT NULL,
  motivo TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ata_id, versao)
);
CREATE INDEX IF NOT EXISTS idx_versoes_ata ON public.versoes_ata(ata_id, versao DESC);
GRANT SELECT, INSERT ON public.versoes_ata TO authenticated;
GRANT ALL ON public.versoes_ata TO service_role;
ALTER TABLE public.versoes_ata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "versoes_ata_select" ON public.versoes_ata
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "versoes_ata_insert" ON public.versoes_ata
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
-- Sem UPDATE/DELETE policies → imutável

-- ─── 4. assinaturas_ata ───
CREATE TABLE IF NOT EXISTS public.assinaturas_ata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ata_id UUID NOT NULL REFERENCES public.atas(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  papel TEXT NOT NULL,
  assinado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip TEXT,
  user_agent TEXT,
  UNIQUE (ata_id, versao, user_id, papel)
);
CREATE INDEX IF NOT EXISTS idx_assinaturas_ata ON public.assinaturas_ata(ata_id);
GRANT SELECT, INSERT ON public.assinaturas_ata TO authenticated;
GRANT ALL ON public.assinaturas_ata TO service_role;
ALTER TABLE public.assinaturas_ata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assinaturas_ata_select" ON public.assinaturas_ata
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "assinaturas_ata_insert_self" ON public.assinaturas_ata
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_tenant_member(auth.uid(), tenant_id)
  );

-- ─── 5. Bloqueio de update após travamento ───
CREATE OR REPLACE FUNCTION public.prevent_ata_edit_when_locked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _estado public.ata_estado;
BEGIN
  SELECT estado INTO _estado FROM public.atas WHERE id = COALESCE(NEW.ata_id, OLD.ata_id);
  IF _estado IN ('travada','publicada') THEN
    RAISE EXCEPTION 'Ata travada/publicada não pode ser modificada. Use retificação.';
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

CREATE TRIGGER trg_blocos_ata_lock
  BEFORE UPDATE OR DELETE ON public.blocos_ata
  FOR EACH ROW EXECUTE FUNCTION public.prevent_ata_edit_when_locked();
