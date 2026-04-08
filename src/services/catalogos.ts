import { supabase } from "@/integrations/supabase/client";

export interface PotenciaOption {
  id: string;
  nome: string;
  sigla: string;
}

export interface RitoOption {
  id: string;
  nome: string;
  descricao: string;
}

/** Fetch active potencias for selection (authenticated users) */
export async function fetchPotencias(): Promise<PotenciaOption[]> {
  const { data, error } = await supabase
    .from("potencias")
    .select("id, nome, sigla")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []) as PotenciaOption[];
}

/** Fetch active ritos for selection (authenticated users) */
export async function fetchRitos(): Promise<RitoOption[]> {
  const { data, error } = await supabase
    .from("ritos")
    .select("id, nome, descricao")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []) as RitoOption[];
}
