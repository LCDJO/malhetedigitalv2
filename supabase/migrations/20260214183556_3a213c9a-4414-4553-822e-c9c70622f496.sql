
-- 1. Fix trigger to be tenant-aware (deactivate only within same tenant scope)
CREATE OR REPLACE FUNCTION public.deactivate_previous_terms()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.ativo = true THEN
    IF NEW.tenant_id IS NULL THEN
      -- Platform-level: deactivate other platform-level terms
      UPDATE public.termos_uso
      SET ativo = false
      WHERE id <> NEW.id AND ativo = true AND tenant_id IS NULL;
    ELSE
      -- Tenant-level: deactivate only within same tenant
      UPDATE public.termos_uso
      SET ativo = false
      WHERE id <> NEW.id AND ativo = true AND tenant_id = NEW.tenant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Create similar trigger for politicas_privacidade
CREATE OR REPLACE FUNCTION public.deactivate_previous_policies()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.ativo = true THEN
    IF NEW.tenant_id IS NULL THEN
      UPDATE public.politicas_privacidade
      SET ativo = false
      WHERE id <> NEW.id AND ativo = true AND tenant_id IS NULL;
    ELSE
      UPDATE public.politicas_privacidade
      SET ativo = false
      WHERE id <> NEW.id AND ativo = true AND tenant_id = NEW.tenant_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER deactivate_previous_policies
  BEFORE UPDATE ON public.politicas_privacidade
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_previous_policies();

-- 3. Update RLS on termos_uso: allow tenant admins to manage their own
DROP POLICY IF EXISTS "Admins can manage terms" ON public.termos_uso;

CREATE POLICY "Superadmins can manage all terms"
  ON public.termos_uso FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage their terms"
  ON public.termos_uso FOR ALL
  USING (tenant_id IS NOT NULL AND is_tenant_admin(auth.uid(), tenant_id));

-- 4. Update RLS on politicas_privacidade: allow tenant admins
DROP POLICY IF EXISTS "Admins can manage policies" ON public.politicas_privacidade;

CREATE POLICY "Superadmins can manage all policies"
  ON public.politicas_privacidade FOR ALL
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can manage their policies"
  ON public.politicas_privacidade FOR ALL
  USING (tenant_id IS NOT NULL AND is_tenant_admin(auth.uid(), tenant_id));

-- 5. Update RLS on aceites_termos: allow tenant admins to view their tenant's acceptances
DROP POLICY IF EXISTS "Admins can view all acceptances" ON public.aceites_termos;

CREATE POLICY "Superadmins can view all acceptances"
  ON public.aceites_termos FOR SELECT
  USING (is_superadmin(auth.uid()));

CREATE POLICY "Tenant admins can view tenant acceptances"
  ON public.aceites_termos FOR SELECT
  USING (tenant_id IS NOT NULL AND is_tenant_admin(auth.uid(), tenant_id));
