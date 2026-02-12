
CREATE TABLE public.incidentes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data_incidente timestamp with time zone NOT NULL DEFAULT now(),
  descricao text NOT NULL,
  dados_afetados text,
  acoes_tomadas text,
  registrado_por uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.incidentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incidents"
ON public.incidentes
FOR ALL
USING (is_admin(auth.uid()));

CREATE TRIGGER update_incidentes_updated_at
BEFORE UPDATE ON public.incidentes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
