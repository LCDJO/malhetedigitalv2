import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-config`;

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

/** Get lodge configuration */
export async function getLodgeConfig(): Promise<any> {
  const headers = await getHeaders();
  return request<any>(`${API_BASE}?action=get`, { method: "GET", headers });
}

/** Update lodge configuration */
export async function updateLodgeConfig(config: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update`, {
    method: "PUT", headers, body: JSON.stringify(config),
  });
}

/** List plano de contas */
export async function listPlanoContas(): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=plano_contas`, { method: "GET", headers });
}

/** Create plano conta */
export async function createPlanoConta(payload: { codigo: string; nome: string; tipo: string; conta_pai_id?: string; ativo?: boolean }): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_conta`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

/** Update plano conta */
export async function updatePlanoConta(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_conta`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

/** Delete plano conta */
export async function deletePlanoConta(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_conta&id=${id}`, {
    method: "DELETE", headers,
  });
}
