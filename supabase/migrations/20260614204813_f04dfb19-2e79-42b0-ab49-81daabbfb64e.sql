
-- =========================================================
-- ENUMS
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.documento_categoria AS ENUM (
    'estatuto','regulamento','ata_publicada','circular','oficio',
    'balanco','relatorio','convocacao','outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.biblioteca_categoria AS ENUM (
    'prancha','livro','ritualistica','historia','simbolismo','filosofia','outros'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.prancha_estado AS ENUM (
    'rascunho','em_analise','aprovada','rejeitada','publicada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.leitura_acao AS ENUM ('visualizou','baixou');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- HELPER: grau numérico do membro autenticado no tenant
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_member_grau(_user_id uuid, _tenant_id uuid)
RETURNS int LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(m.grau_numerico, 1)
  FROM public.members m
  WHERE m.tenant_id = _tenant_id
    AND m.email = (SELECT email FROM auth.users WHERE id = _user_id)
    AND m.status = 'ativo'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.member_has_cargo(_user_id uuid, _tenant_id uuid, _cargo_ids uuid[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.membro_cargos mc
    JOIN public.members m ON m.id = mc.member_id
    WHERE mc.tenant_id = _tenant_id
      AND mc.ativo = true
      AND mc.cargo_id = ANY(_cargo_ids)
      AND m.email = (SELECT email FROM auth.users WHERE id = _user_id)
  );
$$;

-- =========================================================
-- DOCUMENTOS (Secretaria)
-- =========================================================
CREATE TABLE public.documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  categoria public.documento_categoria NOT NULL DEFAULT 'outros',
  grau_minimo int NOT NULL DEFAULT 1 CHECK (grau_minimo BETWEEN 1 AND 3),
  cargos_visiveis uuid[] NOT NULL DEFAULT '{}',
  reservado boolean NOT NULL DEFAULT false,
  tags text[] NOT NULL DEFAULT '{}',
  storage_path text,
  mime_type text,
  tamanho_bytes bigint,
  ano_referencia int,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_documentos_tenant ON public.documentos(tenant_id);
CREATE INDEX idx_documentos_categoria ON public.documentos(tenant_id, categoria);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos TO authenticated;
GRANT ALL ON public.documentos TO service_role;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documentos_select_visivel" ON public.documentos FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
  OR (
    is_tenant_member(auth.uid(), tenant_id)
    AND grau_minimo <= public.get_member_grau(auth.uid(), tenant_id)
    AND (
      cardinality(cargos_visiveis) = 0
      OR public.member_has_cargo(auth.uid(), tenant_id, cargos_visiveis)
    )
  )
);
CREATE POLICY "documentos_admin_write" ON public.documentos FOR ALL TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_documentos_updated_at BEFORE UPDATE ON public.documentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================================================
-- BIBLIOTECA
-- =========================================================
CREATE TABLE public.biblioteca_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  autor text,
  categoria public.biblioteca_categoria NOT NULL DEFAULT 'outros',
  grau_minimo int NOT NULL DEFAULT 1 CHECK (grau_minimo BETWEEN 1 AND 3),
  cargos_visiveis uuid[] NOT NULL DEFAULT '{}',
  descricao text,
  conteudo text,
  storage_path text,
  mime_type text,
  tamanho_bytes bigint,
  tags text[] NOT NULL DEFAULT '{}',
  publicado boolean NOT NULL DEFAULT true,
  publicado_de_prancha_id uuid,
  uploaded_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_biblioteca_tenant ON public.biblioteca_itens(tenant_id);
CREATE INDEX idx_biblioteca_categoria ON public.biblioteca_itens(tenant_id, categoria);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.biblioteca_itens TO authenticated;
GRANT ALL ON public.biblioteca_itens TO service_role;
ALTER TABLE public.biblioteca_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "biblioteca_select_visivel" ON public.biblioteca_itens FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
  OR (
    is_tenant_member(auth.uid(), tenant_id)
    AND publicado = true
    AND grau_minimo <= public.get_member_grau(auth.uid(), tenant_id)
    AND (
      cardinality(cargos_visiveis) = 0
      OR public.member_has_cargo(auth.uid(), tenant_id, cargos_visiveis)
    )
  )
);
CREATE POLICY "biblioteca_admin_write" ON public.biblioteca_itens FOR ALL TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()))
WITH CHECK (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_biblioteca_updated_at BEFORE UPDATE ON public.biblioteca_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================================================
-- PRANCHAS / SUBMISSÕES
-- =========================================================
CREATE TABLE public.pranchas_submissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  resumo text,
  conteudo text,
  storage_path text,
  mime_type text,
  grau int NOT NULL DEFAULT 1 CHECK (grau BETWEEN 1 AND 3),
  categoria public.biblioteca_categoria NOT NULL DEFAULT 'prancha',
  tags text[] NOT NULL DEFAULT '{}',
  estado public.prancha_estado NOT NULL DEFAULT 'rascunho',
  parecer text,
  parecer_por uuid REFERENCES auth.users(id),
  parecer_em timestamptz,
  publicado_item_id uuid REFERENCES public.biblioteca_itens(id) ON DELETE SET NULL,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pranchas_tenant ON public.pranchas_submissoes(tenant_id);
CREATE INDEX idx_pranchas_estado ON public.pranchas_submissoes(tenant_id, estado);
CREATE INDEX idx_pranchas_member ON public.pranchas_submissoes(member_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pranchas_submissoes TO authenticated;
GRANT ALL ON public.pranchas_submissoes TO service_role;
ALTER TABLE public.pranchas_submissoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pranchas_select" ON public.pranchas_submissoes FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
  OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = pranchas_submissoes.member_id
      AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
CREATE POLICY "pranchas_insert_autor" ON public.pranchas_submissoes FOR INSERT TO authenticated
WITH CHECK (
  is_tenant_member(auth.uid(), tenant_id)
  AND EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = member_id
      AND m.tenant_id = pranchas_submissoes.tenant_id
      AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
CREATE POLICY "pranchas_update_autor_ou_admin" ON public.pranchas_submissoes FOR UPDATE TO authenticated
USING (
  is_tenant_admin(auth.uid(), tenant_id)
  OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = pranchas_submissoes.member_id
      AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  is_tenant_admin(auth.uid(), tenant_id)
  OR EXISTS (
    SELECT 1 FROM public.members m
    WHERE m.id = pranchas_submissoes.member_id
      AND m.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);
CREATE POLICY "pranchas_delete_admin" ON public.pranchas_submissoes FOR DELETE TO authenticated
USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE TRIGGER trg_pranchas_updated_at BEFORE UPDATE ON public.pranchas_submissoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =========================================================
-- LEITURAS / ESTATÍSTICAS
-- =========================================================
CREATE TABLE public.leituras_registro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  documento_id uuid REFERENCES public.documentos(id) ON DELETE CASCADE,
  biblioteca_item_id uuid REFERENCES public.biblioteca_itens(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  acao public.leitura_acao NOT NULL DEFAULT 'visualizou',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leituras_target_chk CHECK (
    (documento_id IS NOT NULL)::int + (biblioteca_item_id IS NOT NULL)::int = 1
  )
);
CREATE INDEX idx_leituras_doc ON public.leituras_registro(documento_id);
CREATE INDEX idx_leituras_bib ON public.leituras_registro(biblioteca_item_id);
CREATE INDEX idx_leituras_tenant ON public.leituras_registro(tenant_id, created_at DESC);

GRANT SELECT, INSERT ON public.leituras_registro TO authenticated;
GRANT ALL ON public.leituras_registro TO service_role;
ALTER TABLE public.leituras_registro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leituras_insert_self" ON public.leituras_registro FOR INSERT TO authenticated
WITH CHECK (
  is_tenant_member(auth.uid(), tenant_id)
  AND (user_id IS NULL OR user_id = auth.uid())
);
CREATE POLICY "leituras_select_admin_or_self" ON public.leituras_registro FOR SELECT TO authenticated
USING (
  is_superadmin(auth.uid())
  OR is_tenant_admin(auth.uid(), tenant_id)
  OR user_id = auth.uid()
);
