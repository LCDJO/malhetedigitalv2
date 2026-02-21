
-- =============================================
-- Support Tickets Module
-- =============================================

-- Ticket status enum
CREATE TYPE public.ticket_status AS ENUM (
  'open', 'awaiting_agent', 'awaiting_customer', 'in_progress', 'resolved', 'closed', 'cancelled'
);

-- Ticket priority enum
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Ticket category enum
CREATE TYPE public.ticket_category AS ENUM (
  'billing', 'technical', 'feature_request', 'bug_report', 'account', 'general'
);

-- Sender type enum
CREATE TYPE public.ticket_sender_type AS ENUM ('tenant_user', 'platform_agent', 'system');

-- ── Support Tickets ──
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_by UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  category public.ticket_category NOT NULL DEFAULT 'general',
  assigned_to UUID,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Tenant users can view their own tenant's tickets
CREATE POLICY "Tenant members can view own tickets"
ON public.support_tickets FOR SELECT
USING (is_tenant_member(auth.uid(), tenant_id));

-- Tenant users can create tickets in their tenant
CREATE POLICY "Tenant members can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (is_tenant_member(auth.uid(), tenant_id) AND auth.uid() = created_by);

-- Tenant admins can update tickets in their tenant
CREATE POLICY "Tenant admins can update tickets"
ON public.support_tickets FOR UPDATE
USING (is_tenant_admin(auth.uid(), tenant_id));

-- Superadmins can do everything
CREATE POLICY "Superadmins full access tickets"
ON public.support_tickets FOR ALL
USING (is_superadmin(auth.uid()));

-- ── Support Ticket Messages ──
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type public.ticket_sender_type NOT NULL DEFAULT 'tenant_user',
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]',
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Tenant members can view non-internal messages of their tickets
CREATE POLICY "Tenant members can view ticket messages"
ON public.support_ticket_messages FOR SELECT
USING (
  NOT is_internal
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND is_tenant_member(auth.uid(), t.tenant_id)
  )
);

-- Tenant members can send messages to their tickets
CREATE POLICY "Tenant members can send messages"
ON public.support_ticket_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND is_tenant_member(auth.uid(), t.tenant_id)
  )
);

-- Superadmins full access (can see internal notes too)
CREATE POLICY "Superadmins full access messages"
ON public.support_ticket_messages FOR ALL
USING (is_superadmin(auth.uid()));

-- ── Support Evaluations ──
CREATE TABLE public.support_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  agent_id UUID,
  agent_score INTEGER CHECK (agent_score IS NULL OR (agent_score >= 1 AND agent_score <= 5)),
  system_score INTEGER CHECK (system_score IS NULL OR (system_score >= 1 AND system_score <= 5)),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticket_id)
);

ALTER TABLE public.support_evaluations ENABLE ROW LEVEL SECURITY;

-- Tenant members can create evaluations for their tickets
CREATE POLICY "Tenant members can create evaluations"
ON public.support_evaluations FOR INSERT
WITH CHECK (
  is_tenant_member(auth.uid(), tenant_id)
  AND EXISTS (
    SELECT 1 FROM public.support_tickets t
    WHERE t.id = ticket_id AND t.tenant_id = support_evaluations.tenant_id
  )
);

-- Tenant members can view own evaluations
CREATE POLICY "Tenant members can view evaluations"
ON public.support_evaluations FOR SELECT
USING (is_tenant_member(auth.uid(), tenant_id));

-- Superadmins full access
CREATE POLICY "Superadmins full access evaluations"
ON public.support_evaluations FOR ALL
USING (is_superadmin(auth.uid()));

-- ── Triggers ──
CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
