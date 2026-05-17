
-- Revoke EXECUTE on internal SECURITY DEFINER helper functions from public roles.
-- These functions are used by triggers or RLS policies (called internally by Postgres),
-- not via the PostgREST RPC API by clients. Removing EXECUTE from anon/authenticated
-- prevents potential abuse without affecting their internal use.

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.get_user_tenant_ids(uuid)',
    'public.count_failed_attempts(text)',
    'public.deactivate_previous_policies()',
    'public.deactivate_previous_terms()',
    'public.generate_ticket_protocol()',
    'public.is_superadmin(uuid)',
    'public.lookup_email_by_cpf(text)',
    'public.notify_member_transaction()',
    'public.notify_overdue_transaction()',
    'public.notify_lgpd_incident()',
    'public.enforce_user_profile_auth()',
    'public.generate_unique_lodge_slug(text, text)',
    'public.create_lodge_profile()',
    'public.prevent_superadmin_tenant_link()',
    'public.has_tenant_role(uuid, uuid, tenant_role)',
    'public.has_role(uuid, app_role)',
    'public.is_active_member(text)',
    'public.is_advertiser(uuid)',
    'public.get_advertiser_id(uuid)',
    'public.is_tenant_admin(uuid, uuid)',
    'public.is_tenant_member(uuid, uuid)',
    'public.broadcast_notification(uuid, text, text, text, jsonb)',
    'public.has_module_access(uuid, text)',
    'public.log_audit()',
    'public.handle_new_user()',
    'public.is_admin(uuid)',
    'public.get_auth_email()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skip %: %', fn, SQLERRM;
    END;
  END LOOP;
END $$;

-- Keep get_user_role callable by authenticated users (used by AuthContext via supabase.rpc).
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
