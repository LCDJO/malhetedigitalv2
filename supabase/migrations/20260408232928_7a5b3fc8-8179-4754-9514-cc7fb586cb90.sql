
CREATE TABLE public.regras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'VALIDACAO',
  entidade VARCHAR(100) NOT NULL DEFAULT 'LOJA',
  regra_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  potencia_id UUID REFERENCES public.potencias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.regras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active regras"
  ON public.regras FOR SELECT
  USING (ativo = true);

CREATE POLICY "Superadmins can manage all regras"
  ON public.regras FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE INDEX idx_regras_potencia ON public.regras (potencia_id);
CREATE INDEX idx_regras_entidade_tipo ON public.regras (entidade, tipo);
