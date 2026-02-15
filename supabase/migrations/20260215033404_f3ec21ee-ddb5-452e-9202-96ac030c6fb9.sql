
-- Tabela de códigos de ativação de totem
CREATE TABLE public.totem_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  label TEXT, -- nome/identificação do totem
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ -- null = nunca expira
);

-- Index para busca rápida por código
CREATE INDEX idx_totem_codes_code ON public.totem_codes(code);
CREATE INDEX idx_totem_codes_tenant ON public.totem_codes(tenant_id);

-- RLS
ALTER TABLE public.totem_codes ENABLE ROW LEVEL SECURITY;

-- Superadmins podem tudo
CREATE POLICY "Superadmins full access totem_codes"
  ON public.totem_codes
  FOR ALL
  USING (public.is_superadmin(auth.uid()));

-- Admins do tenant podem gerenciar seus códigos
CREATE POLICY "Tenant admins manage their totem codes"
  ON public.totem_codes
  FOR ALL
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
