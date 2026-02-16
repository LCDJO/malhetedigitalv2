import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-dashboard`;

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

/** Dashboard stats (members, overdue, etc.) */
export async function getDashboardStats(): Promise<{
  active_count: number;
  inactive_count: number;
  members: any[];
  overdue_member_ids: string[];
}> {
  const headers = await getHeaders();
  return request(`${API_BASE}?action=stats`, { method: "GET", headers });
}

/** Transactions for reports */
export async function getReportTransactions(filters?: {
  start_date?: string;
  end_date?: string;
  statuses?: string[];
}): Promise<any[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams({ action: "transactions" });
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);
  if (filters?.statuses) params.set("statuses", filters.statuses.join(","));
  return request<any[]>(`${API_BASE}?${params}`, { method: "GET", headers });
}

/** Members list for reports */
export async function getReportMembers(fields?: string, status?: string): Promise<any[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams({ action: "members" });
  if (fields) params.set("fields", fields);
  if (status) params.set("status", status);
  return request<any[]>(`${API_BASE}?${params}`, { method: "GET", headers });
}

/** Financial summary for FinanceiroGeral */
export async function getFinancialSummary(filters?: {
  start_date?: string;
  end_date?: string;
}): Promise<any[]> {
  const headers = await getHeaders();
  const params = new URLSearchParams({ action: "financial_summary" });
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);
  return request<any[]>(`${API_BASE}?${params}`, { method: "GET", headers });
}
