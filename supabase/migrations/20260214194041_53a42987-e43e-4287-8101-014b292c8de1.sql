-- Add grupo column to login_banners to categorize banner placement
ALTER TABLE public.login_banners
ADD COLUMN grupo text NOT NULL DEFAULT 'login';

-- Add a comment for documentation
COMMENT ON COLUMN public.login_banners.grupo IS 'Grupo de posicionamento do banner: login (telas de login 1920x1080 16:9), portal_dashboard (dashboard do portal 1200x300 4:1)';