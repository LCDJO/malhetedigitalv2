-- ============ COMUNICADOS (Mural) ============
CREATE TABLE public.comunicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  autor_id uuid REFERENCES public.members(id),
  fixado boolean NOT NULL DEFAULT false,
  grau_minimo int NOT NULL DEFAULT 1,
  cargos_visiveis uuid[] NOT NULL DEFAULT '{}',
  publicado boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comunicados TO authenticated;
GRANT ALL ON public.comunicados TO service_role;
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read comunicados by grau"
  ON public.comunicados FOR SELECT TO authenticated
  USING (
    is_tenant_member(auth.uid(), tenant_id)
    AND publicado = true
    AND get_member_grau(auth.uid(), tenant_id) >= grau_minimo
    AND (cargos_visiveis = '{}' OR member_has_cargo(auth.uid(), tenant_id, cargos_visiveis))
  );

CREATE POLICY "Tenant admins manage comunicados"
  ON public.comunicados FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_comunicados_updated_at
  BEFORE UPDATE ON public.comunicados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ CIRCULARES ============
CREATE TABLE public.circulares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero text NOT NULL,
  assunto text NOT NULL,
  corpo text NOT NULL,
  anexo_path text,
  grau_minimo int NOT NULL DEFAULT 1,
  cargos_destino uuid[] NOT NULL DEFAULT '{}',
  enviar_email boolean NOT NULL DEFAULT true,
  enviar_push boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'rascunho', -- rascunho | enviada | cancelada
  enviada_em timestamptz,
  autor_id uuid REFERENCES public.members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, numero)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circulares TO authenticated;
GRANT ALL ON public.circulares TO service_role;
ALTER TABLE public.circulares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read circulares enviadas"
  ON public.circulares FOR SELECT TO authenticated
  USING (
    is_tenant_member(auth.uid(), tenant_id)
    AND status = 'enviada'
    AND get_member_grau(auth.uid(), tenant_id) >= grau_minimo
    AND (cargos_destino = '{}' OR member_has_cargo(auth.uid(), tenant_id, cargos_destino))
  );

CREATE POLICY "Tenant admins manage circulares"
  ON public.circulares FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_circulares_updated_at
  BEFORE UPDATE ON public.circulares
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============ CIRCULAR_ENVIOS ============
CREATE TABLE public.circular_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  circular_id uuid NOT NULL REFERENCES public.circulares(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  email_enviado boolean NOT NULL DEFAULT false,
  push_enviado boolean NOT NULL DEFAULT false,
  lido_em timestamptz,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(circular_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.circular_envios TO authenticated;
GRANT ALL ON public.circular_envios TO service_role;
ALTER TABLE public.circular_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member sees own envios"
  ON public.circular_envios FOR SELECT TO authenticated
  USING (
    is_tenant_member(auth.uid(), tenant_id)
    AND member_id IN (SELECT id FROM public.members WHERE email = get_auth_email() AND tenant_id = circular_envios.tenant_id)
  );

CREATE POLICY "Admins manage envios"
  ON public.circular_envios FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

-- ============ CALENDARIO_EVENTOS ============
CREATE TABLE public.calendario_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz,
  dia_inteiro boolean NOT NULL DEFAULT false,
  tipo text NOT NULL DEFAULT 'evento', -- sessao | data_magna | aniversario | evento | liturgico
  recorrencia text, -- null | anual | mensal | semanal
  cor text,
  grau_minimo int NOT NULL DEFAULT 1,
  sessao_id uuid REFERENCES public.sessoes(id) ON DELETE SET NULL,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendario_eventos TO authenticated;
GRANT ALL ON public.calendario_eventos TO service_role;
ALTER TABLE public.calendario_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members read eventos by grau"
  ON public.calendario_eventos FOR SELECT TO authenticated
  USING (
    is_tenant_member(auth.uid(), tenant_id)
    AND get_member_grau(auth.uid(), tenant_id) >= grau_minimo
  );

CREATE POLICY "Tenant admins manage eventos"
  ON public.calendario_eventos FOR ALL TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
  WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_calendario_updated_at
  BEFORE UPDATE ON public.calendario_eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_calendario_tenant_data ON public.calendario_eventos(tenant_id, data_inicio);
CREATE INDEX idx_comunicados_tenant_created ON public.comunicados(tenant_id, created_at DESC);
CREATE INDEX idx_circulares_tenant_status ON public.circulares(tenant_id, status, enviada_em DESC);
