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

/** Admin dashboard stats */
export async function getAdminStats(): Promise<{
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalMembers: number;
}> {
  const headers = await getHeaders();
  return request(`${API_BASE}?action=stats`, { method: "GET", headers });
}

/** List all tenants with related data */
export async function listTenantsWithData(): Promise<{
  tenants: any[];
  configs: any[];
  plans: any[];
  subscriptions: any[];
  members: any[];
}> {
  const headers = await getHeaders();
  return request(`${API_BASE}?action=list_tenants`, { method: "GET", headers });
}

/** Create tenant */
export async function createTenant(payload: Record<string, unknown>): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_tenant`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

/** Update tenant */
export async function updateTenant(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_tenant`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

/** Soft delete tenant */
export async function deleteTenant(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_tenant&id=${id}`, {
    method: "DELETE", headers,
  });
}

/** Restore tenant */
export async function restoreTenant(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=restore_tenant`, {
    method: "PUT", headers, body: JSON.stringify({ id }),
  });
}

/** Manage subscription */
export async function manageSubscription(payload: {
  tenant_id?: string;
  plan_id?: string;
  subscription_id?: string;
  operation: "create" | "update" | "cancel";
}): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=manage_subscription`, {
    method: "PUT", headers, body: JSON.stringify(payload),
  });
}

/** List plans */
export async function listPlans(): Promise<any[]> {
  const headers = await getHeaders();
  return request<any[]>(`${API_BASE}?action=list_plans`, { method: "GET", headers });
}

/** Create plan */
export async function createPlan(payload: Record<string, unknown>): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_plan`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

/** Update plan */
export async function updatePlan(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_plan`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

/** Delete plan */
export async function deletePlan(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_plan&id=${id}`, {
    method: "DELETE", headers,
  });
}

// ═══════════════════════════════════
// POTÊNCIAS
// ═══════════════════════════════════

export interface Potencia {
  id: string;
  nome: string;
  sigla: string;
  ativo: boolean;
  created_at: string;
}

export async function listPotencias(): Promise<Potencia[]> {
  const headers = await getHeaders();
  return request<Potencia[]>(`${API_BASE}?action=list_potencias`, { method: "GET", headers });
}

export async function createPotencia(payload: { nome: string; sigla?: string }): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_potencia`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

export async function updatePotencia(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_potencia`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

export async function deletePotencia(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_potencia&id=${id}`, {
    method: "DELETE", headers,
  });
}

// ═══════════════════════════════════
// RITOS
// ═══════════════════════════════════

export interface Rito {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

export async function listRitos(): Promise<Rito[]> {
  const headers = await getHeaders();
  return request<Rito[]>(`${API_BASE}?action=list_ritos`, { method: "GET", headers });
}

export async function createRito(payload: { nome: string; descricao?: string }): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_rito`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

export async function updateRito(id: string, payload: Record<string, unknown>): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update_rito`, {
    method: "PUT", headers, body: JSON.stringify({ id, ...payload }),
  });
}

export async function deleteRito(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_rito&id=${id}`, {
    method: "DELETE", headers,
  });
}

// ═══════════════════════════════════
// POTÊNCIA ↔ RITO (Combinações)
// ═══════════════════════════════════

export interface PotenciaRito {
  id: string;
  potencia_id: string;
  rito_id: string;
  ativo: boolean;
  created_at: string;
  potencias?: { id: string; nome: string; sigla: string };
  ritos?: { id: string; nome: string };
}

export async function listPotenciaRitos(): Promise<PotenciaRito[]> {
  const headers = await getHeaders();
  return request<PotenciaRito[]>(`${API_BASE}?action=list_potencia_ritos`, { method: "GET", headers });
}

export async function createPotenciaRito(payload: { potencia_id: string; rito_id: string }): Promise<{ id: string }> {
  const headers = await getHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create_potencia_rito`, {
    method: "POST", headers, body: JSON.stringify(payload),
  });
}

export async function deletePotenciaRito(id: string): Promise<void> {
  const headers = await getHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete_potencia_rito&id=${id}`, {
    method: "DELETE", headers,
  });
}
