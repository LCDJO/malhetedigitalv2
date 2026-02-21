
-- =============================================
-- FIX 1: profiles - Restrict admin SELECT to tenant-scoped
-- Drop overly broad admin policy and replace with tenant-scoped
-- =============================================
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Admins can only view profiles of users in their tenant
CREATE POLICY "Admins can view tenant profiles"
ON public.profiles FOR SELECT
USING (
  is_superadmin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid()
      AND tu2.user_id = profiles.id
      AND tu1.is_active = true
      AND tu2.is_active = true
      AND is_tenant_admin(auth.uid(), tu1.tenant_id)
  )
);

-- Admins can only update profiles of users in their tenant
CREATE POLICY "Admins can update tenant profiles"
ON public.profiles FOR UPDATE
USING (
  is_superadmin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid()
      AND tu2.user_id = profiles.id
      AND tu1.is_active = true
      AND tu2.is_active = true
      AND is_tenant_admin(auth.uid(), tu1.tenant_id)
  )
)
WITH CHECK (
  is_superadmin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.tenant_users tu1
    JOIN public.tenant_users tu2 ON tu1.tenant_id = tu2.tenant_id
    WHERE tu1.user_id = auth.uid()
      AND tu2.user_id = profiles.id
      AND tu1.is_active = true
      AND tu2.is_active = true
      AND is_tenant_admin(auth.uid(), tu1.tenant_id)
  )
);

-- =============================================
-- FIX 2: audit_log - Scope admin SELECT to tenant
-- =============================================
DROP POLICY IF EXISTS "Admins can view audit log" ON public.audit_log;

CREATE POLICY "Superadmins can view all audit logs"
ON public.audit_log FOR SELECT
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can view own tenant audit logs"
ON public.audit_log FOR SELECT
USING (
  tenant_id IS NOT NULL
  AND is_tenant_admin(auth.uid(), tenant_id)
);

-- =============================================
-- FIX 3: incidentes - Scope admin access to tenant
-- =============================================
DROP POLICY IF EXISTS "Admins can manage incidents" ON public.incidentes;

CREATE POLICY "Superadmins can manage all incidents"
ON public.incidentes FOR ALL
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage own tenant incidents"
ON public.incidentes FOR ALL
USING (
  tenant_id IS NOT NULL
  AND is_tenant_admin(auth.uid(), tenant_id)
);

-- =============================================
-- FIX 4: login_attempts - Scope admin SELECT to tenant
-- =============================================
DROP POLICY IF EXISTS "Admins can read login attempts" ON public.login_attempts;

CREATE POLICY "Superadmins can view all login attempts"
ON public.login_attempts FOR SELECT
USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can view own tenant login attempts"
ON public.login_attempts FOR SELECT
USING (
  tenant_id IS NOT NULL
  AND is_tenant_admin(auth.uid(), tenant_id)
);

-- =============================================
-- FIX 5: member_transactions - Restrict member SELECT to own transactions
-- =============================================
DROP POLICY IF EXISTS "Tenant members can view transactions" ON public.member_transactions;

CREATE POLICY "Members can view own transactions"
ON public.member_transactions FOR SELECT
USING (
  is_tenant_member(auth.uid(), tenant_id)
  AND (
    is_admin(auth.uid())
    OR member_id IN (
      SELECT m.id FROM public.members m
      WHERE m.email = (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
        AND m.tenant_id = member_transactions.tenant_id
    )
  )
);

-- =============================================
-- FIX 6: active_sessions - Allow DELETE of own sessions
-- =============================================
CREATE POLICY "Users can delete own session"
ON public.active_sessions FOR DELETE
USING (auth.uid() = user_id);
