
-- ============================================================
-- 1. tenant_email_integrations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_email_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'titan',
  domain text NOT NULL DEFAULT '',
  api_token text NOT NULL DEFAULT '',
  smtp_host text NOT NULL DEFAULT 'smtp.titan.email',
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_user text NOT NULL DEFAULT '',
  smtp_password text NOT NULL DEFAULT '',
  from_name text NOT NULL DEFAULT '',
  from_email text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

ALTER TABLE public.tenant_email_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage all email integrations"
  ON public.tenant_email_integrations FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins manage own email integrations"
  ON public.tenant_email_integrations FOR ALL
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_email_integrations_updated
BEFORE UPDATE ON public.tenant_email_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 2. tenant_module_overrides
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_module_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  module_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, module_key)
);

ALTER TABLE public.tenant_module_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage module overrides"
  ON public.tenant_module_overrides FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant members read own module overrides"
  ON public.tenant_module_overrides FOR SELECT
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE TRIGGER trg_module_overrides_updated
BEFORE UPDATE ON public.tenant_module_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 3. has_module_enabled helper
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_module_enabled(_tenant_id uuid, _module text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH override AS (
    SELECT enabled FROM public.tenant_module_overrides
    WHERE tenant_id = _tenant_id AND module_key = _module
    LIMIT 1
  ),
  plan_mod AS (
    SELECT EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.tenant_id = _tenant_id
        AND p.is_active = true
        AND p.modules ? _module
    ) AS allowed
  )
  SELECT COALESCE(
    (SELECT enabled FROM override),
    (SELECT allowed FROM plan_mod),
    false
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_module_enabled(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_module_enabled(uuid, text) TO authenticated;
