
-- Add 'banido' status to advertiser_status enum
ALTER TYPE public.advertiser_status ADD VALUE IF NOT EXISTS 'banido';
