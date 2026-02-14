
-- Add representative fields to advertisers
ALTER TABLE public.advertisers
  ADD COLUMN IF NOT EXISTS representative_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS representative_phone text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS representative_email text DEFAULT NULL;
