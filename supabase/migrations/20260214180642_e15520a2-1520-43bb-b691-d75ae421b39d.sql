
-- Add soft delete column to tenants
ALTER TABLE public.tenants
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add scheduled purge date column
ALTER TABLE public.tenants
ADD COLUMN purge_at TIMESTAMPTZ DEFAULT NULL;
