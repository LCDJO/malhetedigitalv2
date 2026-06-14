/**
 * Repositório de Documentos / Biblioteca / Pranchas — Fase 9.
 * Faz CRUD direto via supabase (RLS garante isolamento por tenant + grau/cargo).
 */
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "repositorio-documentos";

// ─────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────
export type DocumentoCategoria =
  | "estatuto" | "regulamento" | "ata_publicada" | "circular"
  | "oficio" | "balanco" | "relatorio" | "convocacao" | "outros";

export type BibliotecaCategoria =
  | "prancha" | "livro" | "ritualistica" | "historia"
  | "simbolismo" | "filosofia" | "outros";

export type PranchaEstado = "rascunho" | "em_analise" | "aprovada" | "rejeitada" | "publicada";

export interface Documento {
  id: string;
  tenant_id: string;
  titulo: string;
  descricao: string | null;
  categoria: DocumentoCategoria;
  grau_minimo: number;
  cargos_visiveis: string[];
  reservado: boolean;
  tags: string[];
  storage_path: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  ano_referencia: number | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BibliotecaItem {
  id: string;
  tenant_id: string;
  titulo: string;
  autor: string | null;
  categoria: BibliotecaCategoria;
  grau_minimo: number;
  cargos_visiveis: string[];
  descricao: string | null;
  conteudo: string | null;
  storage_path: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  tags: string[];
  publicado: boolean;
  publicado_de_prancha_id: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PranchaSubmissao {
  id: string;
  tenant_id: string;
  member_id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  storage_path: string | null;
  mime_type: string | null;
  grau: number;
  categoria: BibliotecaCategoria;
  tags: string[];
  estado: PranchaEstado;
  parecer: string | null;
  parecer_por: string | null;
  parecer_em: string | null;
  publicado_item_id: string | null;
  enviado_em: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────────────────
export async function uploadArquivo(
  tenantId: string,
  subdir: "documentos" | "biblioteca" | "pranchas",
  file: File,
): Promise<{ path: string; size: number; mime: string }> {
  const ext = file.name.split(".").pop() || "bin";
  const key = `${tenantId}/${subdir}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(key, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;
  return { path: key, size: file.size, mime: file.type || "application/octet-stream" };
}

export async function getSignedUrl(path: string, expiresIn = 600): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export async function removerArquivo(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────
// DOCUMENTOS
// ─────────────────────────────────────────────────────────
export async function listarDocumentos(tenantId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from("documentos")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Documento[];
}

export async function criarDocumento(payload: Partial<Documento> & { tenant_id: string; titulo: string }) {
  const { data, error } = await supabase.from("documentos").insert(payload).select().single();
  if (error) throw error;
  return data as Documento;
}

export async function atualizarDocumento(id: string, patch: Partial<Documento>) {
  const { error } = await supabase.from("documentos").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirDocumento(id: string) {
  const doc = await supabase.from("documentos").select("storage_path").eq("id", id).maybeSingle();
  if (doc.data?.storage_path) await removerArquivo(doc.data.storage_path);
  const { error } = await supabase.from("documentos").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────
// BIBLIOTECA
// ─────────────────────────────────────────────────────────
export async function listarBiblioteca(tenantId: string): Promise<BibliotecaItem[]> {
  const { data, error } = await supabase
    .from("biblioteca_itens")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BibliotecaItem[];
}

export async function criarBibliotecaItem(payload: Partial<BibliotecaItem> & { tenant_id: string; titulo: string }) {
  const { data, error } = await supabase.from("biblioteca_itens").insert(payload).select().single();
  if (error) throw error;
  return data as BibliotecaItem;
}

export async function atualizarBibliotecaItem(id: string, patch: Partial<BibliotecaItem>) {
  const { error } = await supabase.from("biblioteca_itens").update(patch).eq("id", id);
  if (error) throw error;
}

export async function excluirBibliotecaItem(id: string) {
  const item = await supabase.from("biblioteca_itens").select("storage_path").eq("id", id).maybeSingle();
  if (item.data?.storage_path) await removerArquivo(item.data.storage_path);
  const { error } = await supabase.from("biblioteca_itens").delete().eq("id", id);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────
// PRANCHAS
// ─────────────────────────────────────────────────────────
export async function listarPranchas(tenantId: string, opts?: { memberId?: string; estado?: PranchaEstado }): Promise<PranchaSubmissao[]> {
  let q = supabase.from("pranchas_submissoes").select("*").eq("tenant_id", tenantId);
  if (opts?.memberId) q = q.eq("member_id", opts.memberId);
  if (opts?.estado) q = q.eq("estado", opts.estado);
  const { data, error } = await q.order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PranchaSubmissao[];
}

export async function criarPrancha(payload: Partial<PranchaSubmissao> & { tenant_id: string; member_id: string; titulo: string }) {
  const { data, error } = await supabase.from("pranchas_submissoes").insert(payload).select().single();
  if (error) throw error;
  return data as PranchaSubmissao;
}

export async function atualizarPrancha(id: string, patch: Partial<PranchaSubmissao>) {
  const { error } = await supabase.from("pranchas_submissoes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function enviarParaAnalise(id: string) {
  return atualizarPrancha(id, { estado: "em_analise", enviado_em: new Date().toISOString() });
}

export async function darParecer(
  id: string,
  estado: "aprovada" | "rejeitada",
  parecer: string,
  parecerPor: string,
) {
  return atualizarPrancha(id, {
    estado,
    parecer,
    parecer_por: parecerPor,
    parecer_em: new Date().toISOString(),
  });
}

/** Publica uma prancha aprovada na biblioteca. */
export async function publicarPrancha(prancha: PranchaSubmissao): Promise<BibliotecaItem> {
  if (prancha.estado !== "aprovada") {
    throw new Error("Apenas pranchas aprovadas podem ser publicadas.");
  }
  const item = await criarBibliotecaItem({
    tenant_id: prancha.tenant_id,
    titulo: prancha.titulo,
    autor: null,
    categoria: prancha.categoria,
    grau_minimo: prancha.grau,
    descricao: prancha.resumo,
    conteudo: prancha.conteudo,
    storage_path: prancha.storage_path,
    mime_type: prancha.mime_type,
    tags: prancha.tags,
    publicado: true,
    publicado_de_prancha_id: prancha.id,
  });
  await atualizarPrancha(prancha.id, { estado: "publicada", publicado_item_id: item.id });
  return item;
}

// ─────────────────────────────────────────────────────────
// LEITURAS / ESTATÍSTICAS
// ─────────────────────────────────────────────────────────
export async function registrarLeitura(input: {
  tenantId: string;
  documentoId?: string;
  bibliotecaItemId?: string;
  memberId?: string | null;
  acao?: "visualizou" | "baixou";
}) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("leituras_registro").insert({
    tenant_id: input.tenantId,
    documento_id: input.documentoId ?? null,
    biblioteca_item_id: input.bibliotecaItemId ?? null,
    member_id: input.memberId ?? null,
    user_id: user?.id ?? null,
    acao: input.acao ?? "visualizou",
  });
}

export async function contarLeituras(tenantId: string): Promise<{
  porDocumento: Record<string, number>;
  porBiblioteca: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from("leituras_registro")
    .select("documento_id, biblioteca_item_id")
    .eq("tenant_id", tenantId);
  if (error) throw error;
  const porDocumento: Record<string, number> = {};
  const porBiblioteca: Record<string, number> = {};
  for (const r of data ?? []) {
    if (r.documento_id) porDocumento[r.documento_id] = (porDocumento[r.documento_id] ?? 0) + 1;
    if (r.biblioteca_item_id) porBiblioteca[r.biblioteca_item_id] = (porBiblioteca[r.biblioteca_item_id] ?? 0) + 1;
  }
  return { porDocumento, porBiblioteca };
}
