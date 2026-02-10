// ── Mock Data & Helpers ──

import type { DashboardFilters } from "./DashboardFilterTypes";

export interface Lancamento {
  id: number;
  descricao: string;
  irmao: string;
  tipo: "entrada" | "saida";
  categoria: "mensalidade" | "taxa" | "avulso" | "despesa";
  situacao: "pago" | "em_aberto";
  valor: number;
  data: string; // dd/MM/yyyy
}

export type TipoIsencao = "temporaria" | "permanente";

export interface Isencao {
  id: number;
  irmaoId: number;
  irmaoNome: string;
  tipo: TipoIsencao;
  motivo: string;
  dataInicio: string; // dd/MM/yyyy
  dataFim?: string;   // dd/MM/yyyy — only for temporaria
  ativa: boolean;
}

export const isencoesMock: Isencao[] = [];

export function getIsencaoAtiva(irmaoId: number, isencoes: Isencao[]): Isencao | undefined {
  return isencoes.find((i) => i.irmaoId === irmaoId && i.ativa);
}

export function isIrmaoIsento(irmaoId: number, isencoes: Isencao[]): boolean {
  return !!getIsencaoAtiva(irmaoId, isencoes);
}

// ── Taxas Maçônicas ──

export type GrauMaconico = "aprendiz" | "companheiro" | "mestre" | "todos";

export interface TaxaMaconica {
  id: number;
  nome: string;
  descricao: string;
  valorPadrao: number;
  grauAplicavel: GrauMaconico;
  categoriaFinanceira: "taxa";
  ativa: boolean;
}

export const grauLabels: Record<GrauMaconico, string> = {
  aprendiz: "Aprendiz (1°)",
  companheiro: "Companheiro (2°)",
  mestre: "Mestre (3°)",
  todos: "Todos os Graus",
};

export const taxasMaconicasMock: TaxaMaconica[] = [];

// ── Irmãos com grau (for suggestions) ──

export interface IrmaoComGrau {
  id: number;
  nome: string;
  cim: string;
  grau: GrauMaconico;
  eventosPendentes: string[]; // e.g. ["elevacao", "regularizacao"]
}

export const irmaosComGrau: IrmaoComGrau[] = [];

export function getSugestoesTaxas(irmao: IrmaoComGrau, taxas: TaxaMaconica[]): TaxaMaconica[] {
  return taxas.filter((t) => {
    if (!t.ativa) return false;
    // Match by pending events
    const eventoMap: Record<string, string> = {
      elevacao: "Taxa de Elevação",
      exaltacao: "Taxa de Exaltação",
      regularizacao: "Taxa de Regularização",
      iniciacao: "Taxa de Iniciação",
      filiacao: "Taxa de Filiação",
    };
    return irmao.eventosPendentes.some((ev) => eventoMap[ev] === t.nome);
  });
}

export const receitaMensal: { mes: string; valor: number }[] = [];

export const composicaoReceita: { name: string; value: number; color: string }[] = [];

export const inadimplentes: { nome: string; meses: number; valor: number; categoria: "mensalidade" | "taxa" | "avulso"; lancamentosAtraso: number }[] = [];

export const fluxoCaixa: { mes: string; entrada: number; saida: number }[] = [];

export const pagosVsAberto: { mes: string; pago: number; em_aberto: number }[] = [];

export const ultimosLancamentos: Lancamento[] = [];

export const categoriasDespesa: { nome: string; valor: number; percentual: number }[] = [];

export const receitaPorCategoria: { categoria: string; arrecadado: number; emAberto: number; color: string }[] = [];

export function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const TOTAL_IRMAOS = 0;

// ── Filter helpers ──

export function filterLancamentos(data: Lancamento[], filters: DashboardFilters): Lancamento[] {
  return data.filter((l) => {
    // Tipo
    if (filters.tipoLancamento !== "todos") {
      if (l.categoria !== filters.tipoLancamento) return false;
    }
    // Situação
    if (filters.situacao !== "todos") {
      if (l.situacao !== filters.situacao) return false;
    }
    // Período (simplified mock — real app would parse dates)
    if (filters.periodo === "mes_atual") {
      if (!l.data.includes("/02/2026")) return false;
    }
    // ultimo_trimestre: includes Dec, Jan, Feb
    if (filters.periodo === "ultimo_trimestre") {
      const match = l.data.includes("/12/") || l.data.includes("/01/") || l.data.includes("/02/");
      if (!match) return false;
    }
    return true;
  });
}

export function filterInadimplentes(filters: DashboardFilters) {
  return inadimplentes.filter((i) => {
    if (filters.tipoLancamento !== "todos" && i.categoria !== filters.tipoLancamento) return false;
    return true;
  });
}

export function getFilteredTotals(filters: DashboardFilters) {
  const lancs = filterLancamentos(ultimosLancamentos, filters);
  const entradas = lancs.filter((l) => l.tipo === "entrada");
  const totalArrecadado = entradas.filter((l) => l.situacao === "pago").reduce((s, l) => s + l.valor, 0);
  const totalEmAberto = entradas.filter((l) => l.situacao === "em_aberto").reduce((s, l) => s + l.valor, 0);
  const inadFiltrados = filterInadimplentes(filters);

  return { totalArrecadado, totalEmAberto, inadFiltrados, lancsFiltrados: lancs };
}
