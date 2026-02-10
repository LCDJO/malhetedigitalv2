
-- Create member_transactions table for financial records
CREATE TABLE public.member_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('mensalidade', 'avulso', 'taxa')),
  valor numeric(12,2) NOT NULL CHECK (valor > 0),
  descricao text NOT NULL DEFAULT '',
  data date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_transactions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view transactions
CREATE POLICY "Authenticated users can view transactions"
  ON public.member_transactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage transactions
CREATE POLICY "Admins can manage transactions"
  ON public.member_transactions FOR ALL
  USING (public.is_admin(auth.uid()));

-- Index for fast member lookups
CREATE INDEX idx_member_transactions_member_id ON public.member_transactions(member_id);
CREATE INDEX idx_member_transactions_data ON public.member_transactions(data DESC);

-- Audit trigger
CREATE TRIGGER audit_member_transactions
  AFTER INSERT OR UPDATE OR DELETE ON public.member_transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_audit();
