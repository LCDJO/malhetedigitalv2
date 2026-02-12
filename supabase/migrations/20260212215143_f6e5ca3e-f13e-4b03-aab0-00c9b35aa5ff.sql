-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_member_transactions_member_data 
  ON public.member_transactions (member_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_member_transactions_data_status 
  ON public.member_transactions (data, status);

CREATE INDEX IF NOT EXISTS idx_member_transactions_member_status 
  ON public.member_transactions (member_id, status);

CREATE INDEX IF NOT EXISTS idx_member_transactions_conta_plano 
  ON public.member_transactions (conta_plano_id) WHERE conta_plano_id IS NOT NULL;

-- Server-side aggregate function for member financial summary
CREATE OR REPLACE FUNCTION public.member_financial_summary(_member_id uuid)
RETURNS TABLE(
  total_debitos numeric,
  total_creditos numeric,
  meses_atraso bigint,
  total_transacoes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN status = 'em aberto' THEN valor ELSE 0 END), 0) AS total_debitos,
    COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) AS total_creditos,
    (SELECT COUNT(DISTINCT DATE_TRUNC('month', data))
     FROM member_transactions
     WHERE member_id = _member_id AND status = 'em aberto' AND data <= CURRENT_DATE
    ) AS meses_atraso,
    COUNT(*) AS total_transacoes
  FROM member_transactions
  WHERE member_id = _member_id;
$$;

-- Server-side aggregate for general financial KPIs by date range
CREATE OR REPLACE FUNCTION public.financial_kpis(_from date, _to date)
RETURNS TABLE(
  total_receitas numeric,
  total_despesas numeric,
  total_transacoes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) AS total_receitas,
    COALESCE(SUM(CASE WHEN status != 'pago' THEN valor ELSE 0 END), 0) AS total_despesas,
    COUNT(*) AS total_transacoes
  FROM member_transactions
  WHERE data >= _from AND data <= _to;
$$;