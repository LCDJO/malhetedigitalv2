import { StatCard } from "@/components/StatCard";
import { TrendingUp, AlertCircle, PercentCircle, CalendarClock } from "lucide-react";
import { formatCurrency, TOTAL_IRMAOS, getFilteredTotals } from "./DashboardData";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardKPIs({ filters }: Props) {
  const { totalArrecadado, totalEmAberto, inadFiltrados } = getFilteredTotals(filters);

  const arrecadadoAnterior = 11230;
  const variacaoArrecadacao = arrecadadoAnterior > 0
    ? ((totalArrecadado - arrecadadoAnterior) / arrecadadoAnterior * 100).toFixed(1)
    : "0.0";

  const percInadimplencia = (inadFiltrados.length / TOTAL_IRMAOS * 100).toFixed(1);
  const percAnterior = 8.5;
  const variacaoInad = (parseFloat(percInadimplencia) - percAnterior).toFixed(1);

  const receitaPrevista = TOTAL_IRMAOS * 280;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Arrecadado"
        value={formatCurrency(totalArrecadado)}
        description="Período filtrado"
        icon={TrendingUp}
        trend={{ value: `${variacaoArrecadacao}% vs anterior`, positive: parseFloat(variacaoArrecadacao) >= 0 }}
        className="[animation-delay:0ms]"
      />
      <StatCard
        title="Total em Aberto"
        value={formatCurrency(totalEmAberto)}
        description={`${inadFiltrados.length} irmãos em atraso`}
        icon={AlertCircle}
        trend={{ value: `${inadFiltrados.length} pendência(s)`, positive: inadFiltrados.length === 0 }}
        className="[animation-delay:80ms]"
      />
      <StatCard
        title="% Inadimplência"
        value={`${percInadimplencia}%`}
        description={`${inadFiltrados.length} de ${TOTAL_IRMAOS} irmãos`}
        icon={PercentCircle}
        trend={{ value: `${parseFloat(variacaoInad) > 0 ? "+" : ""}${variacaoInad}pp vs anterior`, positive: parseFloat(variacaoInad) <= 0 }}
        className="[animation-delay:160ms]"
      />
      <StatCard
        title="Receita Prevista"
        value={formatCurrency(receitaPrevista)}
        description={`${TOTAL_IRMAOS} mensalidades de R$ 280`}
        icon={CalendarClock}
        trend={{ value: "Estável", positive: true }}
        className="[animation-delay:240ms]"
      />
    </div>
  );
}
