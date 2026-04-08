
CREATE TABLE public.potencia_ritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  potencia_id UUID NOT NULL REFERENCES public.potencias(id) ON DELETE CASCADE,
  rito_id UUID NOT NULL REFERENCES public.ritos(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (potencia_id, rito_id)
);

ALTER TABLE public.potencia_ritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active potencia_ritos"
  ON public.potencia_ritos FOR SELECT
  USING (ativo = true);

CREATE POLICY "Superadmins can manage all potencia_ritos"
  ON public.potencia_ritos FOR ALL
  USING (is_superadmin(auth.uid()));
