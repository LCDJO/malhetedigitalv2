import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-portal`;

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

/** Portal dashboard stats */
export async function getPortalStats(): Promise<{
  active_count: number;
  pending_count: number;
  member_id: string;
}> {
  const headers = await getHeaders();
  return request(`${API_BASE}?action=stats`, { method: "GET", headers });
}

/** Get member's transactions */
export async function getMyTransactions(memberId: string, limit = 200): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=my_transactions&member_id=${memberId}&limit=${limit}`, { method: "GET", headers });
}

/** Get lodge info for portal */
export async function getLodgeInfo(): Promise<{ lodge: any; active_count: number }> {
  const headers = await getHeaders();
  return request(`${API_BASE}?action=lodge_info`, { method: "GET", headers });
}

/** Get annual summary for prestação de contas */
export async function getAnnualSummary(year: number): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=annual_summary&year=${year}`, { method: "GET", headers });
}

/** Get notifications */
export async function getNotifications(memberId: string): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=notifications&member_id=${memberId}`, { method: "GET", headers });
}

/** Mark notifications as read */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=mark_read`, {
    method: "PUT", headers, body: JSON.stringify({ ids }),
  });
}
