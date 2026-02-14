
-- Table for login banners
CREATE TABLE public.login_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('imagem', 'video')),
  media_url TEXT NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_fim TIMESTAMP WITH TIME ZONE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners (they show on public login page)
CREATE POLICY "Active banners are publicly readable"
  ON public.login_banners
  FOR SELECT
  USING (true);

-- Admins of the tenant can manage banners
CREATE POLICY "Admins can insert banners"
  ON public.login_banners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_superadmin(auth.uid())
    OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id))
  );

CREATE POLICY "Admins can update banners"
  ON public.login_banners
  FOR UPDATE
  TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id))
  );

CREATE POLICY "Admins can delete banners"
  ON public.login_banners
  FOR DELETE
  TO authenticated
  USING (
    public.is_superadmin(auth.uid())
    OR (tenant_id IS NOT NULL AND public.is_tenant_admin(auth.uid(), tenant_id))
  );

-- Trigger for updated_at
CREATE TRIGGER update_login_banners_updated_at
  BEFORE UPDATE ON public.login_banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Storage bucket for banner media
INSERT INTO storage.buckets (id, name, public) VALUES ('login-banners', 'login-banners', true);

-- Storage policies
CREATE POLICY "Anyone can view login banner files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'login-banners');

CREATE POLICY "Authenticated users can upload login banner files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'login-banners');

CREATE POLICY "Authenticated users can update login banner files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'login-banners');

CREATE POLICY "Authenticated users can delete login banner files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'login-banners');
