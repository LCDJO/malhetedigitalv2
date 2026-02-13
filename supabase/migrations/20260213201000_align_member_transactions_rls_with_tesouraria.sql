-- Align member_transactions write policy with app permissions for tesouraria
-- UI grants write actions to role 'tesoureiro', but previous RLS only allowed is_admin().

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.member_transactions;

CREATE POLICY "Tesouraria can manage transactions"
  ON public.member_transactions FOR ALL
  TO authenticated
  USING (public.has_module_access(auth.uid(), 'tesouraria'))
  WITH CHECK (public.has_module_access(auth.uid(), 'tesouraria'));
