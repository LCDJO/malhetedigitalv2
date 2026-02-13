-- Add specific role for Portal do Irmão and allow safe self-service profile updates

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'portal_irmao';

-- Keep role resolution deterministic when a user has multiple roles
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'administrador' THEN 0
      WHEN 'veneravel' THEN 1
      WHEN 'secretario' THEN 2
      WHEN 'tesoureiro' THEN 3
      WHEN 'orador' THEN 4
      WHEN 'chanceler' THEN 5
      WHEN 'consulta' THEN 6
      WHEN 'portal_irmao' THEN 7
    END
  LIMIT 1
$$;

-- Portal users can update only their own active member record (row scope)
CREATE POLICY "Portal users can update own member profile"
  ON public.members FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'portal_irmao')
    AND lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND status = 'ativo'
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'portal_irmao')
    AND status = 'ativo'
  );

-- Column-level guard for portal users: only phone, avatar_url, address and email
CREATE OR REPLACE FUNCTION public.restrict_portal_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'portal_irmao') AND NOT public.is_admin(auth.uid()) THEN
    IF NEW.id IS DISTINCT FROM OLD.id
      OR NEW.full_name IS DISTINCT FROM OLD.full_name
      OR NEW.cpf IS DISTINCT FROM OLD.cpf
      OR NEW.cim IS DISTINCT FROM OLD.cim
      OR NEW.birth_date IS DISTINCT FROM OLD.birth_date
      OR NEW.degree IS DISTINCT FROM OLD.degree
      OR NEW.initiation_date IS DISTINCT FROM OLD.initiation_date
      OR NEW.elevation_date IS DISTINCT FROM OLD.elevation_date
      OR NEW.exaltation_date IS DISTINCT FROM OLD.exaltation_date
      OR NEW.master_installed IS DISTINCT FROM OLD.master_installed
      OR NEW.status IS DISTINCT FROM OLD.status
      OR NEW.notes IS DISTINCT FROM OLD.notes
      OR NEW.created_by IS DISTINCT FROM OLD.created_by
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
      OR NEW.force_password_change IS DISTINCT FROM OLD.force_password_change
    THEN
      RAISE EXCEPTION 'Portal do Irmão pode atualizar apenas telefone, foto do perfil, endereço e email.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_portal_member_update ON public.members;

CREATE TRIGGER trg_restrict_portal_member_update
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_portal_member_update();

-- Portal users can upload/update/delete only their own photo path: {auth.uid()}/...
CREATE POLICY "Portal users can upload own photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'member-photos'
    AND public.has_role(auth.uid(), 'portal_irmao')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Portal users can update own photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'member-photos'
    AND public.has_role(auth.uid(), 'portal_irmao')
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'member-photos'
    AND public.has_role(auth.uid(), 'portal_irmao')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Portal users can delete own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'member-photos'
    AND public.has_role(auth.uid(), 'portal_irmao')
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Backfill: assign portal_irmao role to existing auth users linked to active members by e-mail
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'portal_irmao'::public.app_role
FROM auth.users au
JOIN public.members m ON lower(m.email) = lower(au.email)
WHERE m.status = 'ativo'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = au.id
      AND ur.role = 'portal_irmao'::public.app_role
  );
