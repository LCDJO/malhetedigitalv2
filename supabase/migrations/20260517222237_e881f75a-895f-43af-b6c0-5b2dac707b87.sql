
-- ============ PROFILES: remove blanket public SELECT ============
DROP POLICY IF EXISTS "Profiles are viewable by everyone via slug" ON public.profiles;

-- Public view with safe columns only
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT id, full_name, avatar_url, slug, bio, profile_type, tenant_id,
       rito_id, potencia_id, masonic_status, is_active, show_suggestions,
       loja_id, created_at
FROM public.profiles;

-- Allow public read on the view (RLS on underlying table still applies via security_invoker)
-- Add permissive policy on profiles for safe-column reads via the view path
CREATE POLICY "Public can view profiles via safe view"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

-- Wait — we want to restrict raw table reads. Drop the policy we just added and instead
-- make the view SECURITY DEFINER style by switching to security_invoker = false.
DROP POLICY IF EXISTS "Public can view profiles via safe view" ON public.profiles;

ALTER VIEW public.public_profiles SET (security_invoker = false);
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- ============ USER_ROLES: restrict SELECT ============
DROP POLICY IF EXISTS "Authenticated can view roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ============ POST_IMAGES: enforce privacy ============
DROP POLICY IF EXISTS "Images are viewable if the post is viewable" ON public.post_images;

CREATE POLICY "Images visible only if post is visible"
ON public.post_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_images.post_id
      AND (
        p.privacy_level = 'public'
        OR p.user_id = auth.uid()
      )
  )
);

-- ============ STORAGE: ad-creatives owner-only modify ============
DROP POLICY IF EXISTS "Advertisers can update own creatives" ON storage.objects;
DROP POLICY IF EXISTS "Advertisers can delete own creatives" ON storage.objects;
DROP POLICY IF EXISTS "Advertisers can upload creatives" ON storage.objects;

CREATE POLICY "Advertisers can upload own creatives"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ad-creatives'
  AND (storage.foldername(name))[1] = public.get_advertiser_id(auth.uid())::text
);

CREATE POLICY "Advertisers can update own creatives"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ad-creatives'
  AND (storage.foldername(name))[1] = public.get_advertiser_id(auth.uid())::text
);

CREATE POLICY "Advertisers can delete own creatives"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'ad-creatives'
  AND (storage.foldername(name))[1] = public.get_advertiser_id(auth.uid())::text
);

-- Superadmins manage all creatives
CREATE POLICY "Superadmins manage ad-creatives"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'ad-creatives' AND public.is_superadmin(auth.uid()))
WITH CHECK (bucket_id = 'ad-creatives' AND public.is_superadmin(auth.uid()));

-- ============ STORAGE: login-banners admin-only modify ============
DROP POLICY IF EXISTS "Authenticated users can upload login banner files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update login banner files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete login banner files" ON storage.objects;

CREATE POLICY "Admins can upload login banner files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'login-banners'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update login banner files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'login-banners'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete login banner files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'login-banners'
  AND public.is_admin(auth.uid())
);

-- ============ REALTIME: restrict messages access ============
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Authenticated can send realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated can send realtime messages"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (true);
