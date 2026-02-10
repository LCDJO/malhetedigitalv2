// ── Mock Data & Helpers ──

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
  { nome: "Ir∴ Pedro Alves", meses: 3, valor: 840 },
  { nome: "Ir∴ Ricardo Lima", meses: 2, valor: 560 },
  { nome: "Ir∴ Fernando Costa", meses: 2, valor: 560 },
  { nome: "Ir∴ Marcos Oliveira", meses: 1, valor: 280 },
  { nome: "Ir∴ Gustavo Reis", meses: 1, valor: 280 },
];

export const fluxoCaixa = [
  { mes: "Set", entrada: 10200, saida: 7800 },
  { mes: "Out", entrada: 11400, saida: 8200 },
  { mes: "Nov", entrada: 10800, saida: 9100 },
  { mes: "Dez", entrada: 13200, saida: 10500 },
  { mes: "Jan", entrada: 11230, saida: 8900 },
  { mes: "Fev", entrada: 12580, saida: 9200 },
];

export const ultimosLancamentos = [
  { id: 1, descricao: "Mensalidade Fev/2026", irmao: "Ir∴ Carlos Mendes", tipo: "entrada" as const, valor: 280, data: "03/02/2026" },
  { id: 2, descricao: "Taxa de Iniciação", irmao: "Ir∴ André Souza", tipo: "entrada" as const, valor: 350, data: "02/02/2026" },
  { id: 3, descricao: "Conta de Energia", irmao: "—", tipo: "saida" as const, valor: 890, data: "01/02/2026" },
  { id: 4, descricao: "Mensalidade Fev/2026", irmao: "Ir∴ João Silva", tipo: "entrada" as const, valor: 280, data: "01/02/2026" },
  { id: 5, descricao: "Material de Limpeza", irmao: "—", tipo: "saida" as const, valor: 145, data: "30/01/2026" },
  { id: 6, descricao: "Mensalidade Jan/2026", irmao: "Ir∴ Paulo Freitas", tipo: "entrada" as const, valor: 280, data: "28/01/2026" },
];

export const categoriasDespesa = [
  { nome: "Manutenção do Templo", valor: 3200, percentual: 34.8 },
  { nome: "Utilidades (Luz/Água)", valor: 2100, percentual: 22.8 },
  { nome: "Material de Expediente", valor: 1450, percentual: 15.8 },
  { nome: "Eventos e Sessões", valor: 1350, percentual: 14.7 },
  { nome: "Outros", valor: 1100, percentual: 11.9 },
];

export function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const TOTAL_IRMAOS = 47;
