-- 1. Fix broadcast_notification: add admin authorization check
CREATE OR REPLACE FUNCTION public.broadcast_notification(
  _tenant_id uuid,
  _title text,
  _message text,
  _type text DEFAULT 'geral'::text,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorization: only tenant admins or superadmins
  IF NOT (is_tenant_admin(auth.uid(), _tenant_id) OR is_superadmin(auth.uid())) THEN
    RAISE EXCEPTION 'Access denied: must be admin of target tenant';
  END IF;

  -- Validate parameters
  IF _title IS NULL OR _title = '' OR LENGTH(_title) > 200 THEN
    RAISE EXCEPTION 'Invalid title: must be 1-200 characters';
  END IF;

  IF _message IS NULL OR _message = '' OR LENGTH(_message) > 2000 THEN
    RAISE EXCEPTION 'Invalid message: must be 1-2000 characters';
  END IF;

  INSERT INTO public.notifications (tenant_id, member_id, title, message, type, metadata)
  SELECT _tenant_id, m.id, _title, _message, _type, _metadata
  FROM public.members m
  WHERE m.tenant_id = _tenant_id AND m.status = 'ativo';
END;
$$;

-- 2. Revoke direct public RPC access as additional safety
REVOKE EXECUTE ON FUNCTION public.broadcast_notification(uuid, text, text, text, jsonb) FROM anon;
