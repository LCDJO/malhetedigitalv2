export type PeriodoFilter = "mes_atual" | "ultimo_trimestre" | "personalizado";
export type TipoLancamento = "mensalidade" | "taxa" | "avulso" | "todos";
export type SituacaoFilter = "pago" | "em_aberto" | "todos";

export interface DashboardFilters {
  periodo: PeriodoFilter;
  tipoLancamento: TipoLancamento;
  situacao: SituacaoFilter;
  dataInicio?: Date;
  dataFim?: Date;
}

export const defaultFilters: DashboardFilters = {
  periodo: "mes_atual",
  tipoLancamento: "todos",
  situacao: "todos",
};
