
-- Make cpf and cim columns nullable
ALTER TABLE public.members ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.members ALTER COLUMN cpf SET DEFAULT '';
ALTER TABLE public.members ALTER COLUMN cim DROP NOT NULL;
ALTER TABLE public.members ALTER COLUMN cim SET DEFAULT '';
