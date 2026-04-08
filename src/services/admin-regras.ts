import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-admin`;

async function getHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Não autenticado");
  return {
    Authorization: `Bearer ${session.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    "Content-Type": "application/json",
  };
}

async function request<T>(url: string, options: RequestInit): Promise<T> {
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);
  return data as T;
}

export interface Regra {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: string;
  entidade: string;
  regra_json: Record<string, unknown>;
  potencia_id: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  potencias?: { id: string; nome: string; sigla: string } | null;
}

export async function listRegras(): Promise<Regra[]> {
  const headers = await getHeaders();
  return request<Regra[]>(`${API_BASE}?action=list_regras`, { method: "GET", headers });
}

export async function createRegra(payload: {
  nome: string;
  descricao?: string;
  tipo: string;
  entidade: string;
  regra_json?: Record<string, unknown>;
  potencia_id?: string | null;
}): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_regra`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

export async function updateRegra(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_regra`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

export async function deleteRegra(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_regra&id=${id}`, {
    method: "DELETE", headers,
  });
}
