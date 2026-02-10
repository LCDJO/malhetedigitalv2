
-- Fix the permissive INSERT policy on profiles
-- Only the trigger (SECURITY DEFINER) should create profiles
DROP POLICY "System creates profiles" ON public.profiles;

-- Allow insert only if the user is creating their own profile
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
