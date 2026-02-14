
-- Add missing columns to member_transactions
ALTER TABLE public.member_transactions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.member_transactions ADD COLUMN IF NOT EXISTS conta_plano_id uuid REFERENCES public.plano_contas(id);

-- plano_contas: add status alias column (components expect 'status' but table has 'ativo')
-- We'll keep ativo and add a generated column isn't ideal, let's just rename
-- Actually, the code expects 'status', let's check what TabPlanoContas expects
