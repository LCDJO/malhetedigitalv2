
-- Trigger: ao inserir/atualizar um termo como ativo, desativa todos os outros
CREATE OR REPLACE FUNCTION public.deactivate_previous_terms()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.ativo = true THEN
    UPDATE public.termos_uso
    SET ativo = false
    WHERE id <> NEW.id AND ativo = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deactivate_previous_terms
BEFORE INSERT OR UPDATE ON public.termos_uso
FOR EACH ROW
WHEN (NEW.ativo = true)
EXECUTE FUNCTION public.deactivate_previous_terms();
