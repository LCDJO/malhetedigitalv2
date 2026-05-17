
-- Comunicações: Email Templates and Dispatch Tasks
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  body_text text,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key)
);

CREATE TABLE IF NOT EXISTS public.email_dispatch_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  audience text NOT NULL DEFAULT 'all_members' CHECK (audience IN ('all_members','active_members','custom_emails','admins')),
  custom_emails text[],
  scheduled_at timestamptz,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho','agendado','enviando','concluido','cancelado','erro')),
  total_recipients integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  error_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_templates_tenant ON public.email_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_email_dispatch_tenant_status ON public.email_dispatch_tasks(tenant_id, status);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_dispatch_tasks ENABLE ROW LEVEL SECURITY;

-- RLS: only tenant admins + superadmins
CREATE POLICY "tenant_admin_select_templates" ON public.email_templates
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "tenant_admin_write_templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "tenant_admin_select_tasks" ON public.email_dispatch_tasks
  FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "tenant_admin_write_tasks" ON public.email_dispatch_tasks
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_superadmin(auth.uid()) OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_email_dispatch_updated BEFORE UPDATE ON public.email_dispatch_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
