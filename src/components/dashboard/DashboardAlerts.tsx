import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { formatCurrency, filterInadimplentes, filterLancamentos, ultimosLancamentos, receitaMensal, TOTAL_IRMAOS } from "./DashboardData";
import type { DashboardFilters } from "./DashboardFilterTypes";
import { SectionHeader } from "./SectionHeader";

interface Props {
  filters: DashboardFilters;
}

interface Alert {
  icon: React.ReactNode;
  title: string;
  message: string;
  level: "destructive" | "warning" | "info";
}

const levelStyles = {
  destructive: {
    card: "border-destructive/30 bg-destructive/5",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    title: "text-destructive",
  },
  warning: {
    card: "border-accent/30 bg-accent/5",
    iconBg: "bg-accent/10",
    iconColor: "text-accent-foreground",
    title: "text-accent-foreground",
  },
  info: {
    card: "border-primary/20 bg-primary/5",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    title: "text-primary",
  },
};

export function DashboardAlerts({ filters }: Props) {
  const alerts: Alert[] = [];

  // 1. Inadimplência crítica (3+ meses)
  const inadFiltrados = filterInadimplentes(filters);
  const criticos = inadFiltrados.filter((i) => i.meses >= 3);
  if (criticos.length > 0) {
    alerts.push({
      icon: <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />,
      title: "Inadimplência Crítica",
      message: `${criticos.length} irmão(s) com 3+ meses em atraso, totalizando ${formatCurrency(criticos.reduce((s, i) => s + i.valor, 0))}. Considere notificação formal conforme regimento.`,
      level: "destructive",
    });
  }

  // 2. Taxa de inadimplência acima de 10%
  const taxaInad = (inadFiltrados.length / TOTAL_IRMAOS) * 100;
  const LIMITE_INADIMPLENCIA = 10;
  if (taxaInad > LIMITE_INADIMPLENCIA) {
    alerts.push({
      icon: <AlertTriangle className="h-5 w-5" strokeWidth={1.8} />,
      title: `Inadimplência acima de ${LIMITE_INADIMPLENCIA}%`,
      message: `A taxa atual é de ${taxaInad.toFixed(1)}% (${inadFiltrados.length} de ${TOTAL_IRMAOS} irmãos). Ação preventiva recomendada para evitar crescimento.`,
      level: "warning",
    });
  }

  // 3. Queda de arrecadação vs período anterior
  if (receitaMensal.length >= 2) {
    const atual = receitaMensal[receitaMensal.length - 1].valor;
    const anterior = receitaMensal[receitaMensal.length - 2].valor;
    if (atual < anterior) {
      const queda = ((anterior - atual) / anterior * 100).toFixed(1);
      alerts.push({
        icon: <TrendingDown className="h-5 w-5" strokeWidth={1.8} />,
        title: "Queda na Arrecadação",
        message: `A arrecadação de ${receitaMensal[receitaMensal.length - 1].mes} (${formatCurrency(atual)}) caiu ${queda}% em relação a ${receitaMensal[receitaMensal.length - 2].mes} (${formatCurrency(anterior)}). Verifique possíveis causas.`,
        level: "warning",
      });
    }
  }

  // 4. Muitos lançamentos em atraso
  const lancs = filterLancamentos(ultimosLancamentos, filters);
  const emAtraso = lancs.filter((l) => l.situacao === "em_aberto" && l.tipo === "entrada");
  const LIMITE_ATRASO = 3;
  if (emAtraso.length >= LIMITE_ATRASO) {
    alerts.push({
      icon: <Clock className="h-5 w-5" strokeWidth={1.8} />,
      title: "Volume Alto de Lançamentos em Aberto",
      message: `${emAtraso.length} lançamentos de entrada estão pendentes, totalizando ${formatCurrency(emAtraso.reduce((s, l) => s + l.valor, 0))}. Priorize a cobrança para manter o fluxo de caixa saudável.`,
      level: "info",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader title="Alertas Estratégicos" subtitle={`${alerts.length} ponto(s) de atenção identificado(s)`} />

      <div className="grid grid-cols-1 gap-3">
        {alerts.map((alert, idx) => {
          const styles = levelStyles[alert.level];
          return (
            <Card key={idx} className={`${styles.card} animate-fade-in`} style={{ animationDelay: `${300 + idx * 60}ms` }}>
              <CardContent className="flex items-start gap-3 p-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconColor}`}>
                  {alert.icon}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${styles.title}`}>{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
