-- Add slug column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Create an index for faster lookup by slug
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles (slug);

-- Update RLS policies to allow anyone to read profiles by slug
-- (Assuming profiles were already viewable by everyone or we need a new policy)
-- First check existing policies
-- Let's add a policy specifically for public viewing via slug
CREATE POLICY "Profiles are viewable by everyone via slug" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Ensure that users can update their own slug
-- This is usually covered by a "Users can update their own profile" policy
-- but I'll make sure it's clear.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can update their own slug'
    ) THEN
        CREATE POLICY "Users can update their own slug" 
        ON public.profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END $$;
