
ALTER TABLE public.member_transactions
ADD COLUMN status text NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'em_aberto'));
