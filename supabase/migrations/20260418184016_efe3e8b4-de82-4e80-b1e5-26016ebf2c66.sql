
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON public.profiles(profile_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_lodge_tenant ON public.profiles(tenant_id) WHERE profile_type = 'lodge';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.enforce_user_profile_auth()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.profile_type = 'user' THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = NEW.id) THEN
      RAISE EXCEPTION 'User profile id must match an existing auth user';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_user_profile_auth ON public.profiles;
CREATE TRIGGER trg_enforce_user_profile_auth
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.enforce_user_profile_auth();

CREATE OR REPLACE FUNCTION public.generate_unique_lodge_slug(_name text, _number text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _base text; _slug text; _counter int := 1;
BEGIN
  _base := lower(coalesce(_name, 'loja'));
  _base := translate(_base, 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn');
  _base := regexp_replace(_base, '[^a-z0-9]+', '-', 'g');
  _base := regexp_replace(_base, '(^-+|-+$)', '', 'g');
  IF _number IS NOT NULL AND _number <> '' THEN
    _base := _base || '-' || regexp_replace(lower(_number), '[^a-z0-9]+', '', 'g');
  END IF;
  IF _base = '' THEN _base := 'loja'; END IF;
  _slug := _base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE slug = _slug) LOOP
    _counter := _counter + 1;
    _slug := _base || '-' || _counter;
  END LOOP;
  RETURN _slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_lodge_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _slug text; _bio text; _rito_id uuid; _potencia_id uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE tenant_id = NEW.id AND profile_type = 'lodge') THEN
    RETURN NEW;
  END IF;
  _slug := public.generate_unique_lodge_slug(NEW.name, NEW.lodge_number);
  SELECT id INTO _rito_id FROM public.ritos WHERE lower(nome) = lower(coalesce(NEW.rito, '')) LIMIT 1;
  SELECT id INTO _potencia_id FROM public.potencias
    WHERE lower(nome) = lower(coalesce(NEW.potencia, '')) OR lower(sigla) = lower(coalesce(NEW.potencia, ''))
    LIMIT 1;
  _bio := 'Loja ' || NEW.name;
  IF NEW.lodge_number IS NOT NULL AND NEW.lodge_number <> '' THEN _bio := _bio || ' nº ' || NEW.lodge_number; END IF;
  IF NEW.rito IS NOT NULL AND NEW.rito <> '' THEN _bio := _bio || ' • Rito ' || NEW.rito; END IF;
  IF NEW.potencia IS NOT NULL AND NEW.potencia <> '' THEN _bio := _bio || ' • ' || NEW.potencia; END IF;
  IF NEW.orient IS NOT NULL AND NEW.orient <> '' THEN _bio := _bio || ' • Or∴ ' || NEW.orient; END IF;
  INSERT INTO public.profiles (id, full_name, slug, bio, profile_type, tenant_id, rito_id, potencia_id, loja_id, masonic_status, is_active, show_suggestions)
  VALUES (gen_random_uuid(), NEW.name, _slug, _bio, 'lodge', NEW.id, _rito_id, _potencia_id, NEW.id, 'lodge', true, true);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_lodge_profile ON public.tenants;
CREATE TRIGGER trg_create_lodge_profile
AFTER INSERT ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.create_lodge_profile();
