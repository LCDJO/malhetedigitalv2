-- Restrict access to private columns on profiles (CPF, phone, address, birth_date)
REVOKE SELECT (cpf, phone, address, birth_date) ON public.profiles FROM anon, authenticated;

-- Tighten comments visibility to match parent post privacy
DROP POLICY IF EXISTS "Comments are viewable if the post is viewable" ON public.post_comments;

CREATE POLICY "Comments are viewable if the post is viewable"
ON public.post_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_comments.post_id
      AND (
        p.privacy_level = 'public'
        OR p.user_id = auth.uid()
      )
  )
);