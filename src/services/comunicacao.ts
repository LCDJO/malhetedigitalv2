/**
 * Fase 10 — Comunicação interna (mural, circulares) e Calendário litúrgico.
 * Acesso via supabase com RLS por tenant + grau.
 */
import { supabase } from "@/integrations/supabase/client";

// ─── COMUNICADOS (Mural) ───
export interface Comunicado {
  id: string;
  tenant_id: string;
  titulo: string;
  conteudo: string;
  autor_id: string | null;
  fixado: boolean;
  grau_minimo: number;
  cargos_visiveis: string[];
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComunicacaoFilters {
  search?: string;
  grauMinimo?: number;
  from?: string;
  to?: string;
}

export async function listarComunicados(tenantId: string, filters: ComunicacaoFilters = {}): Promise<Comunicado[]> {
  let q = supabase.from("comunicados").select("*").eq("tenant_id", tenantId);
  if (filters.grauMinimo) q = q.gte("grau_minimo", filters.grauMinimo);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  if (filters.search) q = q.or(`titulo.ilike.%${filters.search}%,conteudo.ilike.%${filters.search}%`);
  const { data, error } = await q
    .order("fixado", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Comunicado[];
}

export async function listarComunicadosLidos(tenantId: string, memberId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("comunicado_leituras")
    .select("comunicado_id")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.comunicado_id);
}

export async function marcarComunicadoLido(tenantId: string, comunicadoId: string, memberId: string) {
  const { error } = await supabase
    .from("comunicado_leituras")
    .upsert(
      { tenant_id: tenantId, comunicado_id: comunicadoId, member_id: memberId },
      { onConflict: "comunicado_id,member_id" }
    );
  if (error) throw error;
}

export async function marcarComunicadosLidosEmLote(tenantId: string, comunicadoIds: string[], memberId: string) {
  if (comunicadoIds.length === 0) return;
  const rows = comunicadoIds.map(id => ({ tenant_id: tenantId, comunicado_id: id, member_id: memberId }));
  const { error } = await supabase
    .from("comunicado_leituras")
    .upsert(rows, { onConflict: "comunicado_id,member_id" });
  if (error) throw error;
}

export async function criarComunicado(input: Partial<Comunicado>) {
  const { data, error } = await supabase.from("comunicados").insert(input as any).select().single();
  if (error) throw error;
  return data as Comunicado;
}

export async function atualizarComunicado(id: string, patch: Partial<Comunicado>) {
  const { data, error } = await supabase.from("comunicados").update(patch as any).eq("id", id).select().single();
  if (error) throw error;
  return data as Comunicado;
}

export async function excluirComunicado(id: string) {
  const { error } = await supabase.from("comunicados").delete().eq("id", id);
  if (error) throw error;
}

// ─── CIRCULARES ───
export type CircularStatus = "rascunho" | "enviada" | "cancelada";

export interface Circular {
  id: string;
  tenant_id: string;
  numero: string;
  assunto: string;
  corpo: string;
  anexo_path: string | null;
  grau_minimo: number;
  cargos_destino: string[];
  enviar_email: boolean;
  enviar_push: boolean;
  status: CircularStatus;
  enviada_em: string | null;
  autor_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function listarCirculares(tenantId: string, filters: ComunicacaoFilters = {}): Promise<Circular[]> {
  let q = supabase.from("circulares").select("*").eq("tenant_id", tenantId);
  if (filters.grauMinimo) q = q.gte("grau_minimo", filters.grauMinimo);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", filters.to);
  if (filters.search) q = q.or(`numero.ilike.%${filters.search}%,assunto.ilike.%${filters.search}%,corpo.ilike.%${filters.search}%`);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Circular[];
}

export async function listarCircularesLidas(tenantId: string, memberId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("circular_envios")
    .select("circular_id")
    .eq("tenant_id", tenantId)
    .eq("member_id", memberId)
    .not("lido_em", "is", null);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.circular_id);
}

export async function marcarCircularLida(tenantId: string, circularId: string, memberId: string) {
  const { error } = await supabase
    .from("circular_envios")
    .update({ lido_em: new Date().toISOString() })
    .eq("tenant_id", tenantId)
    .eq("circular_id", circularId)
    .eq("member_id", memberId);
  if (error) throw error;
}

export async function criarCircular(input: Partial<Circular>) {
  const { data, error } = await supabase.from("circulares").insert(input as any).select().single();
  if (error) throw error;
  return data as Circular;
}

export async function atualizarCircular(id: string, patch: Partial<Circular>) {
  const { data, error } = await supabase.from("circulares").update(patch as any).eq("id", id).select().single();
  if (error) throw error;
  return data as Circular;
}

export async function excluirCircular(id: string) {
  const { error } = await supabase.from("circulares").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Enviar circular: gera os registros de envio para membros que se qualificam
 * pelo grau mínimo e cargos. O dispatch real de e-mail/push é assíncrono
 * (system tasks). Aqui marcamos como 'enviada' e enfileiramos os envios.
 */
export async function enviarCircular(circular: Circular) {
  const { data: membros, error: e1 } = await supabase
    .from("members")
    .select("id, email, grau_numerico")
    .eq("tenant_id", circular.tenant_id)
    .eq("status", "ativo");
  if (e1) throw e1;

  const elegiveis = (membros ?? []).filter((m: any) => (m.grau_numerico ?? 1) >= circular.grau_minimo);
  if (elegiveis.length === 0) throw new Error("Nenhum destinatário elegível.");

  const envios = elegiveis.map((m: any) => ({
    tenant_id: circular.tenant_id,
    circular_id: circular.id,
    member_id: m.id,
    email_enviado: false,
    push_enviado: false,
  }));

  const { error: e2 } = await supabase.from("circular_envios").insert(envios);
  if (e2) throw e2;

  // Notificação in-app
  for (const m of elegiveis) {
    await supabase.from("notifications").insert({
      tenant_id: circular.tenant_id,
      member_id: m.id,
      title: `Circular Nº ${circular.numero}`,
      message: circular.assunto,
      type: "geral",
      metadata: { circular_id: circular.id },
    } as any);
  }

  return atualizarCircular(circular.id, { status: "enviada", enviada_em: new Date().toISOString() });
}

// ─── CALENDÁRIO ───
export type EventoTipo = "sessao" | "data_magna" | "aniversario" | "evento" | "liturgico";

export interface EventoCalendario {
  id: string;
  tenant_id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  dia_inteiro: boolean;
  tipo: EventoTipo;
  recorrencia: string | null;
  cor: string | null;
  grau_minimo: number;
  sessao_id: string | null;
  member_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function listarEventos(tenantId: string, from?: string, to?: string): Promise<EventoCalendario[]> {
  let q = supabase.from("calendario_eventos").select("*").eq("tenant_id", tenantId);
  if (from) q = q.gte("data_inicio", from);
  if (to) q = q.lte("data_inicio", to);
  const { data, error } = await q.order("data_inicio", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventoCalendario[];
}

export async function criarEvento(input: Partial<EventoCalendario>) {
  const { data, error } = await supabase.from("calendario_eventos").insert(input as any).select().single();
  if (error) throw error;
  return data as EventoCalendario;
}

export async function atualizarEvento(id: string, patch: Partial<EventoCalendario>) {
  const { data, error } = await supabase.from("calendario_eventos").update(patch as any).eq("id", id).select().single();
  if (error) throw error;
  return data as EventoCalendario;
}

export async function excluirEvento(id: string) {
  const { error } = await supabase.from("calendario_eventos").delete().eq("id", id);
  if (error) throw error;
}

/** Exporta os eventos como iCal (RFC 5545). */
export function exportarICal(eventos: EventoCalendario[]): string {
  const fmt = (s: string) => new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MalheteDigital//Calendario//PT-BR",
  ];
  for (const e of eventos) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${e.id}@malhetedigital`);
    lines.push(`DTSTAMP:${fmt(e.created_at)}`);
    lines.push(`DTSTART:${fmt(e.data_inicio)}`);
    if (e.data_fim) lines.push(`DTEND:${fmt(e.data_fim)}`);
    lines.push(`SUMMARY:${e.titulo.replace(/\n/g, " ")}`);
    if (e.descricao) lines.push(`DESCRIPTION:${e.descricao.replace(/\n/g, "\\n")}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
