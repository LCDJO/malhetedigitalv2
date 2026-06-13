import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const GRAU_LABEL: Record<number, string> = {
  1: "Aprendiz Maçom",
  2: "Companheiro Maçom",
  3: "Mestre Maçom",
};

interface MesaItem {
  cargo: string;
  ordem: number;
  nome: string | null;
}

export interface AberturaContext {
  tenantId: string;
  sessaoId: string;
  ataNumero?: string | null;
  lodgeName: string;
  lodgeNumber: string;
  orient: string;
  potencia: string;
}

export interface AberturaResult {
  cabecalho: string;
  abertura: string;
  stats: { presentes: number; ausentes: number; justificadas: number; visitantes: number };
}

export async function gerarBlocosAbertura(ctx: AberturaContext): Promise<AberturaResult> {
  // Sessão
  const { data: sessao } = await supabase
    .from("sessoes")
    .select("numero, data, hora_inicio, tipo, grau, local")
    .eq("id", ctx.sessaoId)
    .maybeSingle();

  // Mesa: cargos ativos com membro associado
  const { data: cargos } = await supabase
    .from("cargos_oficina")
    .select("id, nome, ordem")
    .eq("tenant_id", ctx.tenantId)
    .eq("ativo", true)
    .order("ordem");

  const { data: ocupacoes } = await supabase
    .from("membro_cargos")
    .select("cargo_id, member_id, ativo, members(full_name)")
    .eq("tenant_id", ctx.tenantId)
    .eq("ativo", true);

  const mesa: MesaItem[] = (cargos ?? []).map((c: any) => {
    const oc = (ocupacoes ?? []).find((o: any) => o.cargo_id === c.id);
    return {
      cargo: c.nome,
      ordem: c.ordem ?? 0,
      nome: oc?.members?.full_name ?? null,
    };
  });

  // Presenças
  const { data: pres } = await supabase
    .from("presencas")
    .select("presente, justificada")
    .eq("sessao_id", ctx.sessaoId);

  const presentes = (pres ?? []).filter((p: any) => p.presente).length;
  const justificadas = (pres ?? []).filter((p: any) => !p.presente && p.justificada).length;
  const ausentes = (pres ?? []).filter((p: any) => !p.presente && !p.justificada).length;

  // Visitantes
  const { count: visitantesCount } = await supabase
    .from("visitantes")
    .select("id", { count: "exact", head: true })
    .eq("sessao_id", ctx.sessaoId);
  const visitantes = visitantesCount ?? 0;

  // Cabeçalho
  const dataStr = sessao?.data
    ? format(new Date(sessao.data + "T12:00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "—";
  const grauStr = GRAU_LABEL[sessao?.grau ?? 1] ?? `Grau ${sessao?.grau ?? "—"}`;
  const horaStr = sessao?.hora_inicio ? sessao.hora_inicio.slice(0, 5) : "—";

  const cabecalho =
`${ctx.lodgeName} nº ${ctx.lodgeNumber}
Or∴ de ${ctx.orient} — ${ctx.potencia}

Ata${ctx.ataNumero ? ` nº ${ctx.ataNumero}` : ""} da Sessão ${sessao?.tipo ?? "Ordinária"} no Grau de ${grauStr}
realizada em ${dataStr}, às ${horaStr}${sessao?.local ? `, no ${sessao.local}` : ""}.`;

  // Abertura
  const mesaTxt = mesa.length
    ? mesa.map(m => `  • ${m.cargo}: ${m.nome ?? "— (vago)"}`).join("\n")
    : "  (Nenhum cargo cadastrado em Oficina)";

  const abertura =
`Aos ${dataStr}, no Or∴ de ${ctx.orient}, reuniu-se a ${ctx.lodgeName} nº ${ctx.lodgeNumber}, em Sessão ${sessao?.tipo ?? "Ordinária"} no Grau de ${grauStr}.

Composição da Mesa:
${mesaTxt}

Verificação de presença:
  • Irmãos presentes: ${presentes}
  • Ausências justificadas: ${justificadas}
  • Ausências não justificadas: ${ausentes}
  • Visitantes: ${visitantes}

Constatado o número regulamentar, o Venerável Mestre declarou abertos os trabalhos.`;

  return {
    cabecalho,
    abertura,
    stats: { presentes, ausentes, justificadas, visitantes },
  };
}
