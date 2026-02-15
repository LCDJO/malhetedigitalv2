-- Add totem ad slot
INSERT INTO public.ad_slots (slug, name, page, description, dimensions, is_active)
VALUES ('totem_bottom', 'Totem — Rodapé', 'totem', 'Banner discreto no rodapé do totem', '1920x200', true)
ON CONFLICT (slug) DO NOTHING;