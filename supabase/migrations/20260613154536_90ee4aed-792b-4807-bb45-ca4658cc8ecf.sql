
-- ─── 1. Adicionar grau numérico em members ───
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS grau_numerico SMALLINT CHECK (grau_numerico BETWEEN 1 AND 33);

-- ─── 2. Cargos de Oficina ───
CREATE TABLE IF NOT EXISTS public.cargos_oficina (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ordem SMALLINT NOT NULL DEFAULT 0,
  grau_minimo SMALLINT DEFAULT 1 CHECK (grau_minimo BETWEEN 1 AND 33),
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, nome)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cargos_oficina TO authenticated;
GRANT ALL ON public.cargos_oficina TO service_role;
ALTER TABLE public.cargos_oficina ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cargos_oficina_select" ON public.cargos_oficina
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "cargos_oficina_admin" ON public.cargos_oficina
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_cargos_oficina_updated
  BEFORE UPDATE ON public.cargos_oficina
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 3. Sessões ───
CREATE TABLE IF NOT EXISTS public.sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero TEXT,
  data DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  tipo TEXT NOT NULL DEFAULT 'ordinaria',
  grau SMALLINT NOT NULL DEFAULT 1 CHECK (grau BETWEEN 1 AND 33),
  local TEXT,
  status TEXT NOT NULL DEFAULT 'agendada',
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessoes_tenant_data ON public.sessoes(tenant_id, data DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessoes TO authenticated;
GRANT ALL ON public.sessoes TO service_role;
ALTER TABLE public.sessoes ENABLE ROW LEVEL SECURITY;

-- SELECT: membro do tenant E (grau do membro >= grau da sessão OU admin)
CREATE POLICY "sessoes_select_by_grau" ON public.sessoes
  FOR SELECT TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR public.is_tenant_admin(auth.uid(), tenant_id)
    OR (
      public.is_tenant_member(auth.uid(), tenant_id)
      AND EXISTS (
        SELECT 1 FROM public.members m
        JOIN auth.users u ON u.email = m.email
        WHERE u.id = auth.uid()
          AND m.tenant_id = sessoes.tenant_id
          AND m.status = 'ativo'
          AND COALESCE(m.grau_numerico, 1) >= sessoes.grau
      )
    )
  );
CREATE POLICY "sessoes_admin" ON public.sessoes
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_sessoes_updated
  BEFORE UPDATE ON public.sessoes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 4. Presenças ───
CREATE TABLE IF NOT EXISTS public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sessao_id UUID NOT NULL REFERENCES public.sessoes(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  presente BOOLEAN NOT NULL DEFAULT true,
  justificada BOOLEAN NOT NULL DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sessao_id, member_id)
);
CREATE INDEX IF NOT EXISTS idx_presencas_sessao ON public.presencas(sessao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.presencas TO authenticated;
GRANT ALL ON public.presencas TO service_role;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "presencas_select" ON public.presencas
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "presencas_admin" ON public.presencas
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_presencas_updated
  BEFORE UPDATE ON public.presencas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 5. Visitantes ───
CREATE TABLE IF NOT EXISTS public.visitantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  sessao_id UUID NOT NULL REFERENCES public.sessoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  loja_origem TEXT,
  oriente TEXT,
  potencia TEXT,
  rito TEXT,
  grau SMALLINT CHECK (grau BETWEEN 1 AND 33),
  cim TEXT,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visitantes_sessao ON public.visitantes(sessao_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitantes TO authenticated;
GRANT ALL ON public.visitantes TO service_role;
ALTER TABLE public.visitantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visitantes_select" ON public.visitantes
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "visitantes_admin" ON public.visitantes
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_visitantes_updated
  BEFORE UPDATE ON public.visitantes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 6. Membro × Cargo ───
CREATE TABLE IF NOT EXISTS public.membro_cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  cargo_id UUID NOT NULL REFERENCES public.cargos_oficina(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_fim DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_membro_cargos_tenant ON public.membro_cargos(tenant_id, ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.membro_cargos TO authenticated;
GRANT ALL ON public.membro_cargos TO service_role;
ALTER TABLE public.membro_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membro_cargos_select" ON public.membro_cargos
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));
CREATE POLICY "membro_cargos_admin" ON public.membro_cargos
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_membro_cargos_updated
  BEFORE UPDATE ON public.membro_cargos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── 7. Backfill grau_numerico a partir de degree existente ───
UPDATE public.members SET grau_numerico = 
  CASE LOWER(degree)
    WHEN 'aprendiz' THEN 1
    WHEN 'companheiro' THEN 2
    WHEN 'mestre' THEN 3
    ELSE 1
  END
WHERE grau_numerico IS NULL;
