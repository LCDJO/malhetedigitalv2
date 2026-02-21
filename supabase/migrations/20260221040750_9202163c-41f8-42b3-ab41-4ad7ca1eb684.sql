-- Allow ticket creators to update their own tickets (needed for status change on message send)
CREATE POLICY "Ticket creators can update own tickets"
ON public.support_tickets
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);