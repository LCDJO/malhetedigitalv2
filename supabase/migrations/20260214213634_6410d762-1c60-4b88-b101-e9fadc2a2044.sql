
-- Add new status to advertiser_status enum
ALTER TYPE public.advertiser_status ADD VALUE IF NOT EXISTS 'aguardando_exclusao';

-- Add scheduled deletion date column
ALTER TABLE public.advertisers ADD COLUMN IF NOT EXISTS scheduled_deletion_at timestamp with time zone DEFAULT NULL;
