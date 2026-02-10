-- Update has_module_access to include new roles
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
      AND (
        ur.role IN ('administrador', 'veneravel')
        OR (_module = 'secretaria' AND ur.role = 'secretario')
        OR (_module = 'tesouraria' AND ur.role = 'tesoureiro')
        OR (_module = 'chancelaria' AND ur.role = 'chanceler')
        OR (_module = 'dashboard')
        OR (_module = 'configuracoes' AND ur.role = 'administrador')
      )
  )
$$;

-- Update is_admin to include administrador
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
      AND role IN ('administrador', 'veneravel', 'secretario')
  )
$$;

-- Update get_user_role priority
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
    END
  LIMIT 1
$$;