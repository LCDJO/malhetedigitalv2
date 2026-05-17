
-- Drop previous attempt
DROP VIEW IF EXISTS public.public_profiles;

-- Revoke sensitive columns from public roles
REVOKE SELECT (cpf, phone, address, birth_date) ON public.profiles FROM anon, authenticated;

-- Re-add broad SELECT (column privileges enforce field-level restriction)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- RPC for owner to read own sensitive fields
CREATE OR REPLACE FUNCTION public.get_my_profile_private()
RETURNS TABLE (cpf text, phone text, address text, birth_date date)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT cpf, phone, address, birth_date
  FROM public.profiles
  WHERE id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_profile_private() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile_private() TO authenticated;
