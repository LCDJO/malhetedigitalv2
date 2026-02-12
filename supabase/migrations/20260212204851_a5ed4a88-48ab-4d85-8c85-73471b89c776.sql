
-- Allow authenticated users to insert their own audit log entries (for aceite tracking)
CREATE POLICY "Authenticated users can insert audit log"
ON public.audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);
