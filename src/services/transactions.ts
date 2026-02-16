import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-transactions`;

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

export interface TransactionPayload {
  member_id: string;
  tipo: string;
  descricao?: string;
  valor: number;
  data: string;
  status: string;
  created_by?: string;
  conta_plano_id?: string;
  forma_pagamento?: string | null;
  referencia_mes?: string;
  categoria?: string;
  data_vencimento?: string;
}

/** Create a single transaction */
export async function createTransaction(payload: TransactionPayload): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

/** Create batch transactions */
export async function batchCreateTransactions(rows: TransactionPayload[], auditDetails?: Record<string, unknown>): Promise<{ count: number }> {
  const headers = await getHeaders();
  return request<{ count: number }>(`${API_BASE}?action=batch_create`, {
    method: "POST", headers, body: JSON.stringify({ rows, audit_details: auditDetails }),
  });
}

/** List transactions with filters */
export async function listTransactions(filters?: {
  member_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}): Promise<any[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams({ action: "list" });
  if (filters?.member_id) params.set("member_id", filters.member_id);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);
  if (filters?.limit) params.set("limit", String(filters.limit));
  return request<any[]>(`${API_BASE}?${params}`, { method: "GET", headers });
}

/** List recent transactions */
export async function listRecentTransactions(limit = 20): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=recent&limit=${limit}`, { method: "GET", headers });
}

/** List active members for comboboxes */
export async function listActiveMembers(fields = "id, full_name, cim"): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=active_members&fields=${encodeURIComponent(fields)}`, { method: "GET", headers });
}

/** List plano de contas */
export async function listPlanoContas(tipo?: string): Promise<any[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams({ action: "plano_contas" });
  if (tipo) params.set("tipo", tipo);
  return request<any[]>(`${API_BASE}?${params}`, { method: "GET", headers });
}

/** Update a transaction */
export async function updateTransaction(id: string, payload: Partial<TransactionPayload>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

/** Batch update status */
export async function batchUpdateStatus(ids: string[], status: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=batch_update_status`, {
    method: "PUT", headers, body: JSON.stringify({ ids, status }),
  });
}

/** Cancel a transaction (creates reverse + marks original) */
export async function cancelTransaction(transactionId: string, motivo: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=cancel`, {
    method: "POST", headers, body: JSON.stringify({ transaction_id: transactionId, motivo }),
  });
}
