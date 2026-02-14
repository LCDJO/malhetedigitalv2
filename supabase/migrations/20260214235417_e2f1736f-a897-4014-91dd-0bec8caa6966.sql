
-- 1. Delete any user_roles with roles being removed (safety)
DELETE FROM public.user_roles WHERE role IN ('veneravel', 'secretario', 'tesoureiro', 'orador', 'chanceler', 'consulta');

-- 2. Drop dependent functions first
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);
DROP FUNCTION IF EXISTS public.get_user_role(uuid);

-- 3. Recreate app_role enum
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'administrador');

-- 4. Migrate user_roles column
ALTER TABLE public.user_roles 
  ALTER COLUMN role TYPE public.app_role 
  USING role::text::public.app_role;

-- 5. Drop old enum
DROP TYPE public.app_role_old;

-- 6. Recreate has_role with new enum
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- 7. Recreate get_user_role with new enum
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
      WHEN 'superadmin' THEN 0
      WHEN 'administrador' THEN 1
    END
  LIMIT 1;
$$;

-- 8. Update is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('administrador', 'superadmin')
  );
$$;

-- 9. Update has_module_access - admins and superadmins have full access
CREATE OR REPLACE FUNCTION public.has_module_access(_user_id uuid, _module text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role IN ('administrador', 'superadmin')
  );
$$;
