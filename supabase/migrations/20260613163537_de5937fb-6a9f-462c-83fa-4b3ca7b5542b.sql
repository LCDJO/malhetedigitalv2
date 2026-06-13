
CREATE OR REPLACE FUNCTION public.apply_aumento_realizado()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _num INT;
BEGIN
  IF NEW.estado = 'realizado' AND (OLD.estado IS DISTINCT FROM 'realizado') THEN
    _num := CASE NEW.grau_destino
      WHEN 'aprendiz' THEN 1
      WHEN 'companheiro' THEN 2
      WHEN 'mestre' THEN 3
    END;
    UPDATE public.members
       SET degree = NEW.grau_destino::text,
           grau_numerico = _num
     WHERE id = NEW.member_id;
    IF NEW.data_realizado IS NULL THEN
      NEW.data_realizado := CURRENT_DATE;
    END IF;
  END IF;
  RETURN NEW;
END $$;
