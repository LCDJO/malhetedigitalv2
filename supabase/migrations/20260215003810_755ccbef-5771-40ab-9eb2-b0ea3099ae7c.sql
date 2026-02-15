
-- Trigger to prevent superadmin users from being linked to tenants
CREATE OR REPLACE FUNCTION public.prevent_superadmin_tenant_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Superadmins cannot be linked to tenants';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_superadmin_tenant_link
BEFORE INSERT OR UPDATE ON public.tenant_users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_superadmin_tenant_link();
