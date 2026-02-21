/**
 * Support Domain — Ticket Service
 * Adapted from Gestão RH pattern.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupportTicket, TicketMessage, CreateTicketDTO, CreateMessageDTO, TicketStatus } from './types';

export const TicketService = {
  async listByTenant(tenantId: string): Promise<SupportTicket[]> {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SupportTicket[];
  },

  async listAll(filters?: { status?: TicketStatus; assigned_to?: string }): Promise<SupportTicket[]> {
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as unknown as SupportTicket[];
  },

  async create(dto: CreateTicketDTO, userId: string): Promise<SupportTicket> {
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        tenant_id: dto.tenant_id,
        created_by: userId,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority ?? 'medium',
        category: dto.category ?? 'general',
        tags: [],
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as SupportTicket;
  },

  async updateStatus(id: string, status: TicketStatus): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();
    if (status === 'closed') updates.closed_at = new Date().toISOString();
    const { error } = await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async assign(ticketId: string, agentId: string): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ assigned_to: agentId, status: 'in_progress' as TicketStatus })
      .eq('id', ticketId);
    if (error) throw error;
  },

  async getMessages(ticketId: string): Promise<TicketMessage[]> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as TicketMessage[];
  },

  async sendMessage(dto: CreateMessageDTO, userId: string): Promise<TicketMessage> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: dto.ticket_id,
        sender_id: userId,
        sender_type: dto.sender_type,
        content: dto.content,
        is_internal: dto.is_internal ?? false,
        attachments: [],
      })
      .select()
      .single();
    if (error) throw error;

    // Update ticket status based on sender
    const newStatus: TicketStatus = dto.sender_type === 'tenant_user' ? 'awaiting_agent' : 'awaiting_customer';
    const { error: statusError } = await supabase
      .from('support_tickets')
      .update({ status: newStatus })
      .eq('id', dto.ticket_id);
    if (statusError) console.warn('Failed to update ticket status:', statusError.message);

    return data as unknown as TicketMessage;
  },
};
