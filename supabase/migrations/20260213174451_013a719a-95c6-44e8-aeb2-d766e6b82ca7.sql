-- Add force_password_change flag to members table
ALTER TABLE public.members ADD COLUMN force_password_change boolean NOT NULL DEFAULT false;