
-- 1. Add tenant_id to existing tables
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.lodge_config ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.incidentes ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.termos_uso ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.aceites_termos ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.solicitacoes_titular ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
ALTER TABLE public.politicas_privacidade ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);

-- 2. Add SaaS fields to tenants
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS plan_features jsonb NOT NULL DEFAULT '{"modules": ["secretaria", "tesouraria", "dashboard"], "max_members": 50}'::jsonb;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- 3. Unique constraint for lodge_config per tenant
ALTER TABLE public.lodge_config DROP CONSTRAINT IF EXISTS lodge_config_tenant_id_key;
ALTER TABLE public.lodge_config ADD CONSTRAINT lodge_config_tenant_id_key UNIQUE (tenant_id);

-- 4. Create superadmin check function
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  );
$$;

-- 5. Update is_admin to include superadmin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrador', 'veneravel', 'secretario', 'superadmin')
  );
$$;

-- 6. Update get_user_role to include superadmin
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'superadmin' THEN -1
      WHEN 'administrador' THEN 0
      WHEN 'veneravel' THEN 1
      WHEN 'secretario' THEN 2
      WHEN 'tesoureiro' THEN 3
      WHEN 'orador' THEN 4
      WHEN 'chanceler' THEN 5
      WHEN 'consulta' THEN 6
    END
  LIMIT 1;
$$;

-- 7. Update RLS for members (tenant-aware)
DROP POLICY IF EXISTS "Admins can manage members" ON public.members;
DROP POLICY IF EXISTS "Authenticated users can view members" ON public.members;

CREATE POLICY "Superadmins can manage all members"
ON public.members FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage their members"
ON public.members FOR ALL
USING (
  tenant_id IS NOT NULL 
  AND is_tenant_member(auth.uid(), tenant_id)
  AND is_admin(auth.uid())
);

CREATE POLICY "Tenant members can view their members"
ON public.members FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND is_tenant_member(auth.uid(), tenant_id)
);

-- 8. Update RLS for lodge_config (tenant-aware)
DROP POLICY IF EXISTS "Admins can update lodge config" ON public.lodge_config;
DROP POLICY IF EXISTS "Admins can view lodge config" ON public.lodge_config;

CREATE POLICY "Superadmins can manage all lodge configs"
ON public.lodge_config FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage their lodge config"
ON public.lodge_config FOR ALL
USING (
  tenant_id IS NOT NULL 
  AND is_tenant_admin(auth.uid(), tenant_id)
);

CREATE POLICY "Tenant members can view their lodge config"
ON public.lodge_config FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND is_tenant_member(auth.uid(), tenant_id)
);

-- 9. Allow superadmins to manage tenants
DROP POLICY IF EXISTS "Owners can update tenant" ON public.tenants;

CREATE POLICY "Superadmins can manage all tenants"
ON public.tenants FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Owners can update their tenant"
ON public.tenants FOR UPDATE
USING (has_tenant_role(auth.uid(), id, 'owner'::tenant_role));

-- 10. Create member_transactions table (needed by existing components)
CREATE TABLE IF NOT EXISTS public.member_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
  member_id uuid REFERENCES public.members(id) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('mensalidade', 'taxa', 'joia', 'doacao', 'multa', 'juros', 'outro', 'credito')),
  valor numeric NOT NULL DEFAULT 0,
  data date NOT NULL DEFAULT CURRENT_DATE,
  data_vencimento date,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'atrasado')),
  descricao text,
  categoria text,
  referencia_mes text,
  aprovado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.member_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage all transactions"
ON public.member_transactions FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage transactions"
ON public.member_transactions FOR ALL
USING (is_tenant_member(auth.uid(), tenant_id) AND is_admin(auth.uid()));

CREATE POLICY "Tenant members can view transactions"
ON public.member_transactions FOR SELECT
USING (is_tenant_member(auth.uid(), tenant_id));

-- 11. Create plano_contas table (needed by existing components)
CREATE TABLE IF NOT EXISTS public.plano_contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  codigo text NOT NULL,
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  conta_pai_id uuid REFERENCES public.plano_contas(id),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage plano_contas"
ON public.plano_contas FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage their plano_contas"
ON public.plano_contas FOR ALL
USING (tenant_id IS NOT NULL AND is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Tenant members can view plano_contas"
ON public.plano_contas FOR SELECT
USING (tenant_id IS NOT NULL AND is_tenant_member(auth.uid(), tenant_id));
