
CREATE TABLE public.banner_impressions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  banner_id uuid NOT NULL REFERENCES public.login_banners(id) ON DELETE CASCADE,
  pagina text NOT NULL DEFAULT 'loja',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_banner_impressions_banner_id ON public.banner_impressions(banner_id);
CREATE INDEX idx_banner_impressions_created_at ON public.banner_impressions(created_at);

ALTER TABLE public.banner_impressions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert impressions (anonymous tracking)
CREATE POLICY "Anyone can insert impressions"
ON public.banner_impressions FOR INSERT
WITH CHECK (true);

-- Only admins can read impressions
CREATE POLICY "Admins can read impressions"
ON public.banner_impressions FOR SELECT
USING (is_superadmin(auth.uid()));
