-- Add conta_plano_id and forma_pagamento to member_transactions
ALTER TABLE public.member_transactions
  ADD COLUMN conta_plano_id UUID REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  ADD COLUMN forma_pagamento TEXT;
