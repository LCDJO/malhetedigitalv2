
-- Fix: Restrict ad_clicks INSERT to authenticated users only (prevent click fraud)
DROP POLICY IF EXISTS "Anyone can insert ad clicks" ON public.ad_clicks;
CREATE POLICY "Authenticated can insert ad clicks"
ON public.ad_clicks
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix: Restrict ad_impressions INSERT to authenticated users only (prevent impression fraud)
DROP POLICY IF EXISTS "Anyone can insert ad impressions" ON public.ad_impressions;
CREATE POLICY "Authenticated can insert ad impressions"
ON public.ad_impressions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix: Restrict banner_impressions INSERT to authenticated users only (prevent data poisoning)
DROP POLICY IF EXISTS "Anyone can insert impressions" ON public.banner_impressions;
CREATE POLICY "Authenticated can insert impressions"
ON public.banner_impressions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Fix: Restrict login_attempts INSERT to authenticated users (edge functions use service role)
DROP POLICY IF EXISTS "Allow insert login attempts" ON public.login_attempts;
CREATE POLICY "Service role insert login attempts"
ON public.login_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);
