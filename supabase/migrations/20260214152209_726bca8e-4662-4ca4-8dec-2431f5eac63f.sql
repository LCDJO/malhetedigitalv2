
-- Fix overly permissive INSERT policies

-- TENANTS: require authenticated user
DROP POLICY "Anyone can create tenant" ON public.tenants;
CREATE POLICY "Authenticated can create tenant" ON public.tenants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- TENANT_USERS self-insert: already scoped to auth.uid() = user_id, that's fine.
-- The duplicate INSERT policy for admins conflicts. Fix: drop admin insert, keep self-insert + admin insert scoped.
DROP POLICY "Admins can manage tenant users" ON public.tenant_users;
CREATE POLICY "Admins can insert tenant users" ON public.tenant_users
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR auth.uid() = user_id);

DROP POLICY "User can add self to tenant" ON public.tenant_users;
