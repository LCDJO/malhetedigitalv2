
DROP POLICY "Anyone authenticated can view active potencias" ON public.potencias;
CREATE POLICY "Anyone can view active potencias"
  ON public.potencias FOR SELECT
  USING (ativo = true);

DROP POLICY "Anyone authenticated can view active ritos" ON public.ritos;
CREATE POLICY "Anyone can view active ritos"
  ON public.ritos FOR SELECT
  USING (ativo = true);
