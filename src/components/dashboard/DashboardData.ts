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

export const isencoesMock: Isencao[] = [
  { id: 1, irmaoId: 3, irmaoNome: "Pedro Alves", tipo: "temporaria", motivo: "Licença médica — cirurgia programada", dataInicio: "01/01/2026", dataFim: "30/06/2026", ativa: true },
  { id: 2, irmaoId: 5, irmaoNome: "Antônio Souza", tipo: "permanente", motivo: "Membro benemérito — mais de 30 anos de contribuição", dataInicio: "01/03/2025", ativa: true },
  { id: 3, irmaoId: 4, irmaoNome: "Marcos Oliveira", tipo: "temporaria", motivo: "Dificuldade financeira temporária", dataInicio: "01/11/2025", dataFim: "28/02/2026", ativa: false },
];

export function getIsencaoAtiva(irmaoId: number, isencoes: Isencao[]): Isencao | undefined {
  return isencoes.find((i) => i.irmaoId === irmaoId && i.ativa);
}

export function isIrmaoIsento(irmaoId: number, isencoes: Isencao[]): boolean {
  return !!getIsencaoAtiva(irmaoId, isencoes);
}

export const receitaMensal = [
  { mes: "Set", valor: 10200 },
  { mes: "Out", valor: 11400 },
  { mes: "Nov", valor: 10800 },
  { mes: "Dez", valor: 13200 },
  { mes: "Jan", valor: 11230 },
  { mes: "Fev", valor: 12580 },
];

export const composicaoReceita = [
  { name: "Mensalidades", value: 9800, color: "hsl(var(--primary))" },
  { name: "Taxas", value: 1680, color: "hsl(var(--accent))" },
  { name: "Valores Avulsos", value: 1100, color: "hsl(var(--muted-foreground) / 0.4)" },
];

export const inadimplentes = [
  { nome: "Ir∴ Pedro Alves", meses: 3, valor: 840, categoria: "mensalidade" as const, lancamentosAtraso: 3 },
  { nome: "Ir∴ Ricardo Lima", meses: 2, valor: 560, categoria: "mensalidade" as const, lancamentosAtraso: 2 },
  { nome: "Ir∴ Fernando Costa", meses: 2, valor: 560, categoria: "taxa" as const, lancamentosAtraso: 4 },
  { nome: "Ir∴ Marcos Oliveira", meses: 1, valor: 280, categoria: "mensalidade" as const, lancamentosAtraso: 1 },
  { nome: "Ir∴ Gustavo Reis", meses: 1, valor: 280, categoria: "avulso" as const, lancamentosAtraso: 1 },
  { nome: "Ir∴ Antônio Barros", meses: 2, valor: 520, categoria: "mensalidade" as const, lancamentosAtraso: 2 },
  { nome: "Ir∴ Sérgio Duarte", meses: 1, valor: 280, categoria: "mensalidade" as const, lancamentosAtraso: 1 },
];

export const fluxoCaixa = [
  { mes: "Set", entrada: 10200, saida: 7800 },
  { mes: "Out", entrada: 11400, saida: 8200 },
  { mes: "Nov", entrada: 10800, saida: 9100 },
  { mes: "Dez", entrada: 13200, saida: 10500 },
  { mes: "Jan", entrada: 11230, saida: 8900 },
  { mes: "Fev", entrada: 12580, saida: 9200 },
];

export const pagosVsAberto = [
  { mes: "Set", pago: 9600, em_aberto: 600 },
  { mes: "Out", pago: 10700, em_aberto: 700 },
  { mes: "Nov", pago: 9900, em_aberto: 900 },
  { mes: "Dez", pago: 12100, em_aberto: 1100 },
  { mes: "Jan", pago: 10130, em_aberto: 1100 },
  { mes: "Fev", pago: 10060, em_aberto: 2520 },
];

export const ultimosLancamentos: Lancamento[] = [
  { id: 1, descricao: "Mensalidade Fev/2026", irmao: "Ir∴ Carlos Mendes", tipo: "entrada", categoria: "mensalidade", situacao: "pago", valor: 280, data: "03/02/2026" },
  { id: 2, descricao: "Taxa de Iniciação", irmao: "Ir∴ André Souza", tipo: "entrada", categoria: "taxa", situacao: "pago", valor: 350, data: "02/02/2026" },
  { id: 3, descricao: "Conta de Energia", irmao: "—", tipo: "saida", categoria: "despesa", situacao: "pago", valor: 890, data: "01/02/2026" },
  { id: 4, descricao: "Mensalidade Fev/2026", irmao: "Ir∴ João Silva", tipo: "entrada", categoria: "mensalidade", situacao: "em_aberto", valor: 280, data: "01/02/2026" },
  { id: 5, descricao: "Material de Limpeza", irmao: "—", tipo: "saida", categoria: "despesa", situacao: "pago", valor: 145, data: "30/01/2026" },
  { id: 6, descricao: "Mensalidade Jan/2026", irmao: "Ir∴ Paulo Freitas", tipo: "entrada", categoria: "mensalidade", situacao: "pago", valor: 280, data: "28/01/2026" },
  { id: 7, descricao: "Valor Avulso — Doação", irmao: "Ir∴ Marcos Oliveira", tipo: "entrada", categoria: "avulso", situacao: "pago", valor: 500, data: "25/01/2026" },
  { id: 8, descricao: "Taxa Administrativa", irmao: "Ir∴ Fernando Costa", tipo: "entrada", categoria: "taxa", situacao: "em_aberto", valor: 120, data: "20/01/2026" },
  { id: 9, descricao: "Mensalidade Jan/2026", irmao: "Ir∴ Antônio Barros", tipo: "entrada", categoria: "mensalidade", situacao: "pago", valor: 280, data: "18/01/2026" },
  { id: 10, descricao: "Mensalidade Jan/2026", irmao: "Ir∴ Sérgio Duarte", tipo: "entrada", categoria: "mensalidade", situacao: "em_aberto", valor: 280, data: "15/01/2026" },
  { id: 11, descricao: "Conta de Água", irmao: "—", tipo: "saida", categoria: "despesa", situacao: "pago", valor: 320, data: "12/01/2026" },
  { id: 12, descricao: "Mensalidade Jan/2026", irmao: "Ir∴ Ricardo Lima", tipo: "entrada", categoria: "mensalidade", situacao: "pago", valor: 280, data: "10/01/2026" },
  { id: 13, descricao: "Taxa Semestral", irmao: "Ir∴ Pedro Alves", tipo: "entrada", categoria: "taxa", situacao: "em_aberto", valor: 180, data: "08/01/2026" },
  { id: 14, descricao: "Mensalidade Dez/2025", irmao: "Ir∴ Gustavo Reis", tipo: "entrada", categoria: "mensalidade", situacao: "pago", valor: 280, data: "05/01/2026" },
];

export const categoriasDespesa = [
  { nome: "Manutenção do Templo", valor: 3200, percentual: 34.8 },
  { nome: "Utilidades (Luz/Água)", valor: 2100, percentual: 22.8 },
  { nome: "Material de Expediente", valor: 1450, percentual: 15.8 },
  { nome: "Eventos e Sessões", valor: 1350, percentual: 14.7 },
  { nome: "Outros", valor: 1100, percentual: 11.9 },
];

export const receitaPorCategoria = [
  { categoria: "Mensalidades", arrecadado: 9800, emAberto: 1680, color: "hsl(var(--primary))" },
  { categoria: "Taxas", arrecadado: 1680, emAberto: 560, color: "hsl(var(--accent))" },
  { categoria: "Valores Avulsos", arrecadado: 1100, emAberto: 280, color: "hsl(152, 55%, 38%)" },
];

export function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const TOTAL_IRMAOS = 47;

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
