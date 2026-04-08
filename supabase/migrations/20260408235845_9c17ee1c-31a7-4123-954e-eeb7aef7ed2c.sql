
-- 1. Create a SECURITY DEFINER function to safely fetch the authenticated user's email
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- 2. Fix member_transactions policy
DROP POLICY IF EXISTS "Members can view own transactions" ON public.member_transactions;

CREATE POLICY "Members can view own transactions"
ON public.member_transactions
FOR SELECT
USING (
  is_tenant_member(auth.uid(), tenant_id)
  AND (
    is_admin(auth.uid())
    OR member_id IN (
      SELECT m.id FROM public.members m
      WHERE m.email = get_auth_email()
        AND m.tenant_id = member_transactions.tenant_id
    )
  )
);

-- 3. Fix notifications SELECT policy
DROP POLICY IF EXISTS "Members can view own notifications" ON public.notifications;

CREATE POLICY "Members can view own notifications"
ON public.notifications
FOR SELECT
USING (
  member_id IN (
    SELECT m.id FROM public.members m
    WHERE m.email = get_auth_email()
      AND m.tenant_id = notifications.tenant_id
  )
);

-- 4. Fix notifications UPDATE policy
DROP POLICY IF EXISTS "Members can update own notifications" ON public.notifications;

CREATE POLICY "Members can update own notifications"
ON public.notifications
FOR UPDATE
USING (
  member_id IN (
    SELECT m.id FROM public.members m
    WHERE m.email = get_auth_email()
      AND m.tenant_id = notifications.tenant_id
  )
);
