import { StatCard } from "@/components/StatCard";
import { TrendingUp, AlertCircle, DollarSign, Users } from "lucide-react";
import { formatCurrency, inadimplentes, TOTAL_IRMAOS } from "./DashboardData";

export function DashboardKPIs() {
  const totalInadimplente = inadimplentes.reduce((s, i) => s + i.valor, 0);
  const saldoAtual = 12580 - 9200;
  const taxaAdimplencia = ((TOTAL_IRMAOS - inadimplentes.length) / TOTAL_IRMAOS * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Arrecadação Mensal"
        value="R$ 12.580"
        description="Fev/2026"
        icon={TrendingUp}
        trend={{ value: "12% vs Jan", positive: true }}
        className="[animation-delay:0ms]"
      />
      <StatCard
        title="Inadimplência"
        value={formatCurrency(totalInadimplente)}
        description={`${inadimplentes.length} irmãos em atraso`}
        icon={AlertCircle}
        trend={{ value: `${(100 - parseFloat(taxaAdimplencia)).toFixed(1)}% do quadro`, positive: false }}
        className="[animation-delay:80ms]"
      />
      <StatCard
        title="Saldo do Mês"
        value={formatCurrency(saldoAtual)}
        description="Receitas − Despesas"
        icon={DollarSign}
        trend={{ value: "Positivo", positive: true }}
        className="[animation-delay:160ms]"
      />
      <StatCard
        title="Adimplência"
        value={`${taxaAdimplencia}%`}
        description={`${TOTAL_IRMAOS - inadimplentes.length} de ${TOTAL_IRMAOS} em dia`}
        icon={Users}
        className="[animation-delay:240ms]"
      />
    </div>
  );
}
