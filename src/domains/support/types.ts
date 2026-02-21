/**
 * Support Domain — Type Definitions
 * Adapted from Gestão RH pattern.
 */

export type TicketStatus = 'open' | 'awaiting_agent' | 'awaiting_customer' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'billing' | 'technical' | 'feature_request' | 'bug_report' | 'account' | 'general';
export type SenderType = 'tenant_user' | 'platform_agent' | 'system';

export interface SupportTicket {
  id: string;
  tenant_id: string;
  created_by: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  assigned_to: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: SenderType;
  content: string;
  attachments: unknown[];
  is_internal: boolean;
  created_at: string;
}

export interface SupportEvaluation {
  id: string;
  ticket_id: string;
  tenant_id: string;
  agent_id: string | null;
  agent_score: number | null;
  system_score: number | null;
  comment: string | null;
  created_at: string;
}

export interface CreateTicketDTO {
  tenant_id: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
  category?: TicketCategory;
}

export interface CreateMessageDTO {
  ticket_id: string;
  content: string;
  sender_type: SenderType;
  is_internal?: boolean;
}
