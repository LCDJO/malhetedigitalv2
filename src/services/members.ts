import { supabase } from "@/integrations/supabase/client";

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-members`;

async function getAuthHeaders(): Promise<Record<string, string>> {
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
  if (!resp.ok) {
    throw new Error(data.error || `Erro ${resp.status}`);
  }
  return data as T;
}

export interface MemberPayload {
  full_name: string;
  cpf?: string | null;
  cim?: string | null;
  email?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  address?: string | null;
  degree?: string;
  master_installed?: boolean;
  status?: string;
  initiation_date?: string | null;
  elevation_date?: string | null;
  exaltation_date?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
}

export interface Member {
  id: string;
  full_name: string;
  cpf: string;
  cim: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address: string | null;
  degree: string;
  master_installed: boolean;
  initiation_date: string | null;
  elevation_date: string | null;
  exaltation_date: string | null;
  status: string;
  avatar_url: string | null;
  notes: string | null;
  created_at: string;
}

/** List all members (ordered by name) */
export async function listMembers(): Promise<Member[]> {
  const headers = await getAuthHeaders();
  return request<Member[]>(`${API_BASE}?action=list`, {
    method: "GET",
    headers,
  });
}

/** Get a single member by ID */
export async function getMember(id: string): Promise<Member> {
  const headers = await getAuthHeaders();
  return request<Member>(`${API_BASE}?action=get&id=${id}`, {
    method: "GET",
    headers,
  });
}

/** Create a new member */
export async function createMember(payload: MemberPayload): Promise<{ id: string }> {
  const headers = await getAuthHeaders();
  return request<{ id: string }>(`${API_BASE}?action=create`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}

/** Bulk create members (CSV import) */
export async function bulkCreateMembers(members: MemberPayload[]): Promise<{ imported: number; ids: string[] }> {
  const headers = await getAuthHeaders();
  return request<{ imported: number; ids: string[] }>(`${API_BASE}?action=bulk_create`, {
    method: "POST",
    headers,
    body: JSON.stringify({ members }),
  });
}

/** Update an existing member */
export async function updateMember(id: string, payload: MemberPayload): Promise<void> {
  const headers = await getAuthHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=update`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ id, ...payload }),
  });
}

/** Delete a member */
export async function deleteMember(id: string): Promise<void> {
  const headers = await getAuthHeaders();
  await request<{ success: boolean }>(`${API_BASE}?action=delete&id=${id}`, {
    method: "DELETE",
    headers,
  });
}
