CREATE TABLE IF NOT EXISTS public.tenant_push_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'onesignal',
  onesignal_app_id text NOT NULL DEFAULT '',
  onesignal_api_key text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, provider)
);

ALTER TABLE public.tenant_push_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage all push integrations"
  ON public.tenant_push_integrations FOR ALL
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins manage own push integrations"
  ON public.tenant_push_integrations FOR ALL
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_push_integrations_updated
BEFORE UPDATE ON public.tenant_push_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();