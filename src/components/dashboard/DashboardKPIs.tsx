import { StatCard } from "@/components/StatCard";
import { TrendingUp, AlertCircle, PercentCircle, CalendarClock } from "lucide-react";
import { formatCurrency, inadimplentes, TOTAL_IRMAOS, receitaMensal } from "./DashboardData";

export function DashboardKPIs() {
  const totalArrecadado = 12580;
  const arrecadadoAnterior = 11230;
  const variacaoArrecadacao = ((totalArrecadado - arrecadadoAnterior) / arrecadadoAnterior * 100).toFixed(1);

  const totalEmAberto = inadimplentes.reduce((s, i) => s + i.valor, 0);
  const abertoAnterior = 1960; // mock Jan
  const variacaoAberto = ((totalEmAberto - abertoAnterior) / abertoAnterior * 100).toFixed(1);

  const percInadimplencia = (inadimplentes.length / TOTAL_IRMAOS * 100).toFixed(1);
  const percInadimplenciaAnterior = 8.5; // mock Jan
  const variacaoInadimplencia = (parseFloat(percInadimplencia) - percInadimplenciaAnterior).toFixed(1);

  const receitaPrevista = TOTAL_IRMAOS * 280; // mensalidade padrão × total de irmãos
  const receitaPrevistaAnterior = TOTAL_IRMAOS * 280;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Arrecadado"
        value={formatCurrency(totalArrecadado)}
        description="Período atual — Fev/2026"
        icon={TrendingUp}
        trend={{ value: `${variacaoArrecadacao}% vs Jan`, positive: parseFloat(variacaoArrecadacao) >= 0 }}
        className="[animation-delay:0ms]"
      />
      <StatCard
        title="Total em Aberto"
        value={formatCurrency(totalEmAberto)}
        description={`${inadimplentes.length} irmãos em atraso`}
        icon={AlertCircle}
        trend={{ value: `${parseFloat(variacaoAberto) > 0 ? "+" : ""}${variacaoAberto}% vs Jan`, positive: parseFloat(variacaoAberto) <= 0 }}
        className="[animation-delay:80ms]"
      />
      <StatCard
        title="% Inadimplência"
        value={`${percInadimplencia}%`}
        description={`${inadimplentes.length} de ${TOTAL_IRMAOS} irmãos`}
        icon={PercentCircle}
        trend={{ value: `${parseFloat(variacaoInadimplencia) > 0 ? "+" : ""}${variacaoInadimplencia}pp vs Jan`, positive: parseFloat(variacaoInadimplencia) <= 0 }}
        className="[animation-delay:160ms]"
      />
      <StatCard
        title="Receita Prevista"
        value={formatCurrency(receitaPrevista)}
        description={`${TOTAL_IRMAOS} mensalidades de R$ 280`}
        icon={CalendarClock}
        trend={{ value: "Estável vs Jan", positive: true }}
        className="[animation-delay:240ms]"
      />
    </div>
  );
}
