CREATE TABLE public.comunicado_leituras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  comunicado_id uuid NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  lido_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comunicado_id, member_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comunicado_leituras TO authenticated;
GRANT ALL ON public.comunicado_leituras TO service_role;

ALTER TABLE public.comunicado_leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member manages own leituras"
  ON public.comunicado_leituras FOR ALL
  TO authenticated
  USING (
    is_tenant_member(auth.uid(), tenant_id)
    AND member_id IN (
      SELECT id FROM public.members
      WHERE email = get_auth_email() AND tenant_id = comunicado_leituras.tenant_id
    )
  )
  WITH CHECK (
    is_tenant_member(auth.uid(), tenant_id)
    AND member_id IN (
      SELECT id FROM public.members
      WHERE email = get_auth_email() AND tenant_id = comunicado_leituras.tenant_id
    )
  );

CREATE POLICY "Tenant admins read leituras"
  ON public.comunicado_leituras FOR SELECT
  TO authenticated
  USING (is_tenant_admin(auth.uid(), tenant_id) OR is_superadmin(auth.uid()));

CREATE INDEX idx_comunicado_leituras_member ON public.comunicado_leituras(member_id, comunicado_id);