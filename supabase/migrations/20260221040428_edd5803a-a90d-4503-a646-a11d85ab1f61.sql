-- Add protocol column to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN protocol text UNIQUE;

-- Create sequence for protocol numbers
CREATE SEQUENCE IF NOT EXISTS support_ticket_protocol_seq START 1;

-- Function to generate protocol number (YYYY-NNNN format)
CREATE OR REPLACE FUNCTION public.generate_ticket_protocol()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _year text;
  _seq int;
BEGIN
  _year := to_char(now(), 'YYYY');
  _seq := nextval('support_ticket_protocol_seq');
  NEW.protocol := _year || '-' || lpad(_seq::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate protocol on insert
CREATE TRIGGER trg_generate_ticket_protocol
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
WHEN (NEW.protocol IS NULL)
EXECUTE FUNCTION public.generate_ticket_protocol();

-- Backfill existing tickets with protocol numbers
UPDATE public.support_tickets
SET protocol = to_char(created_at, 'YYYY') || '-' || lpad(row_number::text, 4, '0')
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
  FROM public.support_tickets
  WHERE protocol IS NULL
) sub
WHERE support_tickets.id = sub.id;