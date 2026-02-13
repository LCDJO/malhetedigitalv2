-- Fix status constraint: add 'cancelado' for future use
ALTER TABLE public.member_transactions DROP CONSTRAINT member_transactions_status_check;
ALTER TABLE public.member_transactions ADD CONSTRAINT member_transactions_status_check 
CHECK (status = ANY (ARRAY['pago'::text, 'em_aberto'::text, 'cancelado'::text]));

-- Fix tipo constraint: add 'receita' and 'despesa' for lodge transactions
ALTER TABLE public.member_transactions DROP CONSTRAINT member_transactions_tipo_check;
ALTER TABLE public.member_transactions ADD CONSTRAINT member_transactions_tipo_check 
CHECK (tipo = ANY (ARRAY['mensalidade'::text, 'avulso'::text, 'taxa'::text, 'receita'::text, 'despesa'::text]));

-- Fix member_financial_summary: was using 'em aberto' (space) but data uses 'em_aberto' (underscore)
CREATE OR REPLACE FUNCTION public.member_financial_summary(_member_id uuid)
 RETURNS TABLE(total_debitos numeric, total_creditos numeric, meses_atraso bigint, total_transacoes bigint)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN status = 'em_aberto' THEN valor ELSE 0 END), 0) AS total_debitos,
    COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) AS total_creditos,
    (SELECT COUNT(DISTINCT DATE_TRUNC('month', data))
     FROM member_transactions
     WHERE member_id = _member_id AND status = 'em_aberto' AND data <= CURRENT_DATE
    ) AS meses_atraso,
    COUNT(*) AS total_transacoes
  FROM member_transactions
  WHERE member_id = _member_id;
$$;