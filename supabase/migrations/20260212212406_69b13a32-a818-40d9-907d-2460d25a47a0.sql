
-- Create plano_contas table
CREATE TABLE public.plano_contas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  conta_pai_id UUID REFERENCES public.plano_contas(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.plano_contas ENABLE ROW LEVEL SECURITY;

-- Only admins can manage
CREATE POLICY "Admins can manage plano_contas"
  ON public.plano_contas FOR ALL
  USING (is_admin(auth.uid()));

-- Authenticated users can view
CREATE POLICY "Authenticated users can view plano_contas"
  ON public.plano_contas FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_plano_contas_updated_at
  BEFORE UPDATE ON public.plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Audit trigger
CREATE TRIGGER audit_plano_contas
  AFTER INSERT OR UPDATE OR DELETE ON public.plano_contas
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();
