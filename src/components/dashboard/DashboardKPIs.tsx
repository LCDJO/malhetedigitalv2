import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { TrendingUp, AlertCircle, PercentCircle, CalendarClock } from "lucide-react";
import { formatCurrency } from "./DashboardData";
import { useLodgeConfig } from "@/hooks/useLodgeConfig";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardKPIs({ filters }: Props) {
  const { config } = useLodgeConfig();
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPago, setTotalPago] = useState(0);
  const [totalEmAberto, setTotalEmAberto] = useState(0);
  const [countInad, setCountInad] = useState(0);

  useEffect(() => {
    // Fetch real member count
    (async () => {
      const { count } = await supabase
        .from("members")
        .select("id", { count: "exact", head: true })
        .eq("status", "ativo");
      setTotalMembers(count ?? 0);
    })();

    // Fetch aggregate transaction data
    (async () => {
      const { data: txs } = await supabase
        .from("member_transactions")
        .select("valor, status");
      if (txs) {
        const pago = txs.filter((t) => t.status === "pago").reduce((s, t) => s + Number(t.valor), 0);
        const aberto = txs.filter((t) => t.status === "em_aberto").reduce((s, t) => s + Number(t.valor), 0);
        setTotalPago(pago);
        setTotalEmAberto(aberto);
      }
    })();

    // Count distinct inadimplent members (those with em_aberto transactions)
    (async () => {
      const { data: txs } = await supabase
        .from("member_transactions")
        .select("member_id")
        .eq("status", "em_aberto");
      if (txs) {
        const unique = new Set(txs.map((t) => t.member_id));
        setCountInad(unique.size);
      }
    })();
  }, []);

  const percInadimplencia = totalMembers > 0 ? (countInad / totalMembers * 100).toFixed(1) : "0.0";

  // Receita prevista uses lodge config mensalidade_padrao × active members
  const receitaPrevista = totalMembers * config.mensalidade_padrao;
  const mensalidadeLabel = config.mensalidade_padrao > 0
    ? `${totalMembers} × ${formatCurrency(config.mensalidade_padrao)}`
    : `${totalMembers} irmãos ativos`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Arrecadado"
        value={formatCurrency(totalPago)}
        description="Todos os lançamentos pagos"
        icon={TrendingUp}
        trend={{ value: `${totalMembers} irmãos ativos`, positive: true }}
        className="[animation-delay:0ms]"
      />
      <StatCard
        title="Total em Aberto"
        value={formatCurrency(totalEmAberto)}
        description={`${countInad} irmão(s) com pendência`}
        icon={AlertCircle}
        trend={{ value: `${countInad} pendência(s)`, positive: countInad === 0 }}
        className="[animation-delay:80ms]"
      />
      <StatCard
        title="% Inadimplência"
        value={`${percInadimplencia}%`}
        description={`${countInad} de ${totalMembers} irmãos`}
        icon={PercentCircle}
        trend={{ value: `Tolerância: ${config.meses_tolerancia_inadimplencia} meses`, positive: countInad === 0 }}
        className="[animation-delay:160ms]"
      />
      <StatCard
        title="Receita Prevista"
        value={formatCurrency(receitaPrevista)}
        description={mensalidadeLabel}
        icon={CalendarClock}
        trend={{ value: `Vencimento dia ${config.dia_vencimento}`, positive: true }}
        className="[animation-delay:240ms]"
      />
    </div>
  );
}
