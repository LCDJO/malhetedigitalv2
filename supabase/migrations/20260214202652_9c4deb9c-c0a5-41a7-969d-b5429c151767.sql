
-- =============================================
-- PORTAL DO ANUNCIANTE — Schema
-- =============================================

-- Enum for advertiser status
CREATE TYPE public.advertiser_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'suspenso');

-- Enum for campaign status
CREATE TYPE public.campaign_status AS ENUM ('rascunho', 'ativa', 'pausada', 'encerrada');

-- =============================================
-- 1. Advertisers (empresa anunciante)
-- =============================================
CREATE TABLE public.advertisers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  trading_name text,
  document_type text NOT NULL DEFAULT 'cnpj' CHECK (document_type IN ('cpf', 'cnpj')),
  document_number text NOT NULL,
  email text NOT NULL,
  phone text,
  website text,
  address text,
  logo_url text,
  status public.advertiser_status NOT NULL DEFAULT 'pendente',
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_number),
  UNIQUE(user_id)
);

ALTER TABLE public.advertisers ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_advertisers_updated_at
  BEFORE UPDATE ON public.advertisers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 2. Ad Campaigns
-- =============================================
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status public.campaign_status NOT NULL DEFAULT 'rascunho',
  target_pages text[] NOT NULL DEFAULT '{}',
  target_slots text[] DEFAULT '{}',
  start_date timestamptz,
  end_date timestamptz,
  daily_budget numeric DEFAULT 0,
  total_budget numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ad_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 3. Ad Creatives (banners/mídias)
-- =============================================
CREATE TABLE public.ad_creatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  title text NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  destination_url text,
  grupo text NOT NULL DEFAULT 'banner_principal',
  is_active boolean NOT NULL DEFAULT true,
  impressions_count bigint NOT NULL DEFAULT 0,
  clicks_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_creatives ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_ad_creatives_updated_at
  BEFORE UPDATE ON public.ad_creatives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- 4. Ad Impressions (registro de impressões)
-- =============================================
CREATE TABLE public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  page text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. Ad Clicks (registro de cliques)
-- =============================================
CREATE TABLE public.ad_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id uuid NOT NULL REFERENCES public.ad_creatives(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  advertiser_id uuid NOT NULL REFERENCES public.advertisers(id) ON DELETE CASCADE,
  page text NOT NULL DEFAULT 'unknown',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_clicks ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Ad Slots (espaços dedicados)
-- =============================================
CREATE TABLE public.ad_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  page text NOT NULL,
  dimensions text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper function: is_advertiser
-- =============================================
CREATE OR REPLACE FUNCTION public.is_advertiser(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.advertisers
    WHERE user_id = _user_id AND status = 'aprovado'
  );
$$;

-- Helper: get advertiser id
CREATE OR REPLACE FUNCTION public.get_advertiser_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.advertisers
  WHERE user_id = _user_id
  LIMIT 1;
$$;

-- =============================================
-- RLS Policies
-- =============================================

-- Advertisers
CREATE POLICY "Users can view own advertiser" ON public.advertisers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own advertiser" ON public.advertisers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own advertiser" ON public.advertisers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Superadmins can manage all advertisers" ON public.advertisers
  FOR ALL USING (is_superadmin(auth.uid()));

-- Ad Campaigns
CREATE POLICY "Advertisers can manage own campaigns" ON public.ad_campaigns
  FOR ALL USING (advertiser_id = get_advertiser_id(auth.uid()));

CREATE POLICY "Superadmins can manage all campaigns" ON public.ad_campaigns
  FOR ALL USING (is_superadmin(auth.uid()));

-- Ad Creatives
CREATE POLICY "Advertisers can manage own creatives" ON public.ad_creatives
  FOR ALL USING (advertiser_id = get_advertiser_id(auth.uid()));

CREATE POLICY "Superadmins can manage all creatives" ON public.ad_creatives
  FOR ALL USING (is_superadmin(auth.uid()));

CREATE POLICY "Active creatives are publicly readable" ON public.ad_creatives
  FOR SELECT USING (is_active = true);

-- Ad Impressions
CREATE POLICY "Anyone can insert ad impressions" ON public.ad_impressions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Advertisers can view own impressions" ON public.ad_impressions
  FOR SELECT USING (advertiser_id = get_advertiser_id(auth.uid()));

CREATE POLICY "Superadmins can view all impressions" ON public.ad_impressions
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Ad Clicks
CREATE POLICY "Anyone can insert ad clicks" ON public.ad_clicks
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Advertisers can view own clicks" ON public.ad_clicks
  FOR SELECT USING (advertiser_id = get_advertiser_id(auth.uid()));

CREATE POLICY "Superadmins can view all clicks" ON public.ad_clicks
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Ad Slots
CREATE POLICY "Anyone can view active slots" ON public.ad_slots
  FOR SELECT USING (is_active = true);

CREATE POLICY "Superadmins can manage slots" ON public.ad_slots
  FOR ALL USING (is_superadmin(auth.uid()));

-- Storage bucket for ad creatives
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-creatives', 'ad-creatives', true);

CREATE POLICY "Advertisers can upload creatives" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ad-creatives' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view ad creatives" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-creatives');

CREATE POLICY "Advertisers can update own creatives" ON storage.objects
  FOR UPDATE USING (bucket_id = 'ad-creatives' AND auth.uid() IS NOT NULL);

CREATE POLICY "Advertisers can delete own creatives" ON storage.objects
  FOR DELETE USING (bucket_id = 'ad-creatives' AND auth.uid() IS NOT NULL);
