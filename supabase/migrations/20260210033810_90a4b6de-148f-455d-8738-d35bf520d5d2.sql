-- Add is_active status to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Create edge function helper: admin can create users via service role
-- We need an edge function for creating users since signUp from client creates self-registrations

-- Allow admins to update any profile (for activating/deactivating)
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));