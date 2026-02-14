
-- Allow platform-level plans (SuperAdmin managed) without a tenant
ALTER TABLE public.plans ALTER COLUMN tenant_id DROP NOT NULL;

-- Add modules column to control which modules are available per plan
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS modules jsonb NOT NULL DEFAULT '["dashboard","secretaria","tesouraria","chancelaria","configuracoes"]'::jsonb;

-- Add max_members limit per plan (0 = unlimited)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS max_members integer NOT NULL DEFAULT 0;

-- Add stripe_price_id for future Stripe integration
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- RLS: superadmins can manage platform plans (tenant_id IS NULL)
CREATE POLICY "Superadmins can manage platform plans"
  ON public.plans FOR ALL
  USING (
    public.is_superadmin(auth.uid())
  );

-- Everyone can read active plans
CREATE POLICY "Anyone can read active plans"
  ON public.plans FOR SELECT
  USING (is_active = true);
