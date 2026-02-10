
-- Create lodge configuration table (single row, system-wide)
CREATE TABLE public.lodge_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lodge_name text NOT NULL,
  lodge_number text NOT NULL,
  orient text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lodge_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view lodge config"
  ON public.lodge_config FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Only admins can update
CREATE POLICY "Admins can update lodge config"
  ON public.lodge_config FOR UPDATE
  USING (public.is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_lodge_config_updated_at
  BEFORE UPDATE ON public.lodge_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
