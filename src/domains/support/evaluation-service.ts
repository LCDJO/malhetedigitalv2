/**
 * Support Domain — Evaluation Service
 * Adapted from Gestão RH pattern.
 */

import { supabase } from '@/integrations/supabase/client';
import type { SupportEvaluation } from './types';

export const EvaluationService = {
  async getByTicket(ticketId: string): Promise<SupportEvaluation | null> {
    const { data, error } = await supabase
      .from('support_evaluations')
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as SupportEvaluation | null;
  },

  async createTicketEvaluation(dto: {
    ticket_id: string;
    tenant_id: string;
    agent_id: string | null;
    agent_score: number | null;
    system_score: number | null;
    comment?: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('support_evaluations')
      .insert({
        ticket_id: dto.ticket_id,
        tenant_id: dto.tenant_id,
        agent_id: dto.agent_id,
        agent_score: dto.agent_score,
        system_score: dto.system_score,
        comment: dto.comment ?? null,
      });
    if (error) throw error;
  },

  async listAll(): Promise<SupportEvaluation[]> {
    const { data, error } = await supabase
      .from('support_evaluations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as SupportEvaluation[];
  },
};
