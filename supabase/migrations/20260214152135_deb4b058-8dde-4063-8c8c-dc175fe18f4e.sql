
-- ============================================================
-- GAMIFY RECORRÊNCIA — Multi-tenant SaaS Schema
-- ============================================================

-- 1. ENUM TYPES
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'canceled', 'expired');
CREATE TYPE public.transaction_type AS ENUM ('credit', 'debit');
CREATE TYPE public.tenant_role AS ENUM ('owner', 'admin', 'member');

-- 2. TENANTS
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- 3. TENANT_USERS (link auth.users to tenants with roles)
CREATE TABLE public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role tenant_role NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

-- 4. PLANS
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- 5. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 6. WALLETS
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  xp_total INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- 7. WALLET_TRANSACTIONS
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 8. AFFILIATE_RELATIONSHIPS
CREATE TABLE public.affiliate_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  referrer_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, referred_id)
);
ALTER TABLE public.affiliate_relationships ENABLE ROW LEVEL SECURITY;

-- 9. XP_LOGS
CREATE TABLE public.xp_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;

-- 10. RANKING_SNAPSHOTS
CREATE TABLE public.ranking_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  period TEXT NOT NULL, -- e.g. '2026-02', '2026-W07'
  xp_total INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id, period)
);
ALTER TABLE public.ranking_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS (security definer to avoid RLS recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.tenant_users
  WHERE user_id = _user_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role tenant_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role IN ('owner', 'admin') AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND is_active = true
  );
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- TENANTS: members can see their tenants, owners/admins can manage
CREATE POLICY "Members can view own tenants" ON public.tenants
  FOR SELECT USING (id IN (SELECT public.get_user_tenant_ids(auth.uid())));

CREATE POLICY "Owners can update tenant" ON public.tenants
  FOR UPDATE USING (public.has_tenant_role(auth.uid(), id, 'owner'));

CREATE POLICY "Anyone can create tenant" ON public.tenants
  FOR INSERT WITH CHECK (true);

-- TENANT_USERS
CREATE POLICY "Members can view tenant users" ON public.tenant_users
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage tenant users" ON public.tenant_users
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Admins can update tenant users" ON public.tenant_users
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Admins can delete tenant users" ON public.tenant_users
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- Self-insert for tenant creator
CREATE POLICY "User can add self to tenant" ON public.tenant_users
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- PLANS
CREATE POLICY "Members can view plans" ON public.plans
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- SUBSCRIPTIONS
CREATE POLICY "Members can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id AND public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- WALLETS
CREATE POLICY "Users can view own wallet" ON public.wallets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage wallets" ON public.wallets
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- WALLET_TRANSACTIONS
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions
  FOR SELECT USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- AFFILIATE_RELATIONSHIPS
CREATE POLICY "Users can view own affiliate" ON public.affiliate_relationships
  FOR SELECT USING (auth.uid() IN (referrer_id, referred_id));

CREATE POLICY "Admins can manage affiliates" ON public.affiliate_relationships
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- XP_LOGS
CREATE POLICY "Users can view own xp" ON public.xp_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage xp" ON public.xp_logs
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- RANKING_SNAPSHOTS
CREATE POLICY "Members can view rankings" ON public.ranking_snapshots
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins can manage rankings" ON public.ranking_snapshots
  FOR ALL USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX idx_plans_tenant ON public.plans(tenant_id);
CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_wallets_tenant ON public.wallets(tenant_id);
CREATE INDEX idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_xp_logs_tenant_user ON public.xp_logs(tenant_id, user_id);
CREATE INDEX idx_ranking_snapshots_tenant_period ON public.ranking_snapshots(tenant_id, period);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
