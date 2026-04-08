
-- Table: potencias (global, managed by SuperAdmin)
CREATE TABLE public.potencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT NOT NULL DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.potencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active potencias"
  ON public.potencias FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Superadmins can manage all potencias"
  ON public.potencias FOR ALL
  USING (is_superadmin(auth.uid()));

-- Table: ritos (global, managed by SuperAdmin)
CREATE TABLE public.ritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT DEFAULT '',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ritos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active ritos"
  ON public.ritos FOR SELECT
  USING (auth.uid() IS NOT NULL AND ativo = true);

CREATE POLICY "Superadmins can manage all ritos"
  ON public.ritos FOR ALL
  USING (is_superadmin(auth.uid()));
