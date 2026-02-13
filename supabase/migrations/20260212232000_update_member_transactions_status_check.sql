ALTER TABLE public.member_transactions DROP CONSTRAINT member_transactions_status_check;
ALTER TABLE public.member_transactions ADD CONSTRAINT member_transactions_status_check CHECK (status = ANY (ARRAY['pago'::text, 'em aberto'::text, 'cancelado'::text]));
