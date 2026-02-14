
-- Make tenant_id nullable on member_transactions for backward compatibility
ALTER TABLE public.member_transactions ALTER COLUMN tenant_id DROP NOT NULL;

-- Add forma_pagamento column used by existing code
ALTER TABLE public.member_transactions ADD COLUMN IF NOT EXISTS forma_pagamento text;
