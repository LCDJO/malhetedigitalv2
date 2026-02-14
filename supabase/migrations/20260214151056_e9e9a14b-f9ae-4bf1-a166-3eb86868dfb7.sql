
-- Drop functions that reference member_transactions
DROP FUNCTION IF EXISTS public.financial_kpis(_from date, _to date);
DROP FUNCTION IF EXISTS public.member_financial_summary(_member_id uuid);

-- Drop member_transactions table (includes RLS policies, constraints, etc.)
DROP TABLE IF EXISTS public.member_transactions CASCADE;

-- Drop plano_contas table
DROP TABLE IF EXISTS public.plano_contas CASCADE;
