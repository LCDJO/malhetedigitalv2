
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.is_superadmin(uuid)',
    'public.is_admin(uuid)',
    'public.is_tenant_admin(uuid, uuid)',
    'public.is_tenant_member(uuid, uuid)',
    'public.has_role(uuid, app_role)',
    'public.has_tenant_role(uuid, uuid, tenant_role)',
    'public.get_user_tenant_ids(uuid)',
    'public.has_module_access(uuid, text)',
    'public.has_module_enabled(uuid, text)',
    'public.get_advertiser_id(uuid)',
    'public.is_advertiser(uuid)',
    'public.get_auth_email()',
    'public.is_active_member(text)'
  ])
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', fn);
  END LOOP;
END $$;
