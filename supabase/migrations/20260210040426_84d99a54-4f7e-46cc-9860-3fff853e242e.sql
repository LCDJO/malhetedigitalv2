
-- Create members (irmãos) table
CREATE TABLE public.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  cpf text NOT NULL UNIQUE,
  cim text NOT NULL UNIQUE,
  email text,
  phone text,
  birth_date date,
  address text,
  degree text NOT NULL DEFAULT 'aprendiz' CHECK (degree IN ('aprendiz', 'companheiro', 'mestre')),
  initiation_date date,
  elevation_date date,
  exaltation_date date,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'licenciado', 'suspenso', 'falecido')),
  avatar_url text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Admins (admin, veneravel, secretario) can do everything
CREATE POLICY "Admins can manage members"
  ON public.members FOR ALL
  USING (public.is_admin(auth.uid()));

-- Authenticated users with dashboard access can view
CREATE POLICY "Authenticated users can view members"
  ON public.members FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Updated_at trigger
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Audit trigger
CREATE TRIGGER audit_members
  AFTER INSERT OR UPDATE OR DELETE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.log_audit();

-- Storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true);

CREATE POLICY "Anyone can view member photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'member-photos');

CREATE POLICY "Admins can upload member photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'member-photos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update member photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'member-photos' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete member photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'member-photos' AND public.is_admin(auth.uid()));
