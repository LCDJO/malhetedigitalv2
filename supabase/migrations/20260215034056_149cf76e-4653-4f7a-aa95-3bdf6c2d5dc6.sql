-- Add max_totems column to plans table
ALTER TABLE public.plans ADD COLUMN max_totems integer NOT NULL DEFAULT 0;
COMMENT ON COLUMN public.plans.max_totems IS '0 = nenhum totem permitido, número define o limite por tenant';

-- Add device_id to totem_codes for individual totem traceability
ALTER TABLE public.totem_codes ADD COLUMN device_id text UNIQUE DEFAULT NULL;
COMMENT ON COLUMN public.totem_codes.device_id IS 'Identificador único do dispositivo totem para rastreabilidade';

-- Add last_seen_at for totem heartbeat tracking
ALTER TABLE public.totem_codes ADD COLUMN last_seen_at timestamp with time zone DEFAULT NULL;
COMMENT ON COLUMN public.totem_codes.last_seen_at IS 'Última vez que o totem se comunicou com o servidor';