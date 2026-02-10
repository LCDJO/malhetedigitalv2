import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { formatCurrency, inadimplentes } from "./DashboardData";

export function DashboardAlerts() {
  const criticos = inadimplentes.filter((i) => i.meses >= 3);
  if (criticos.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5 animate-fade-in [animation-delay:300ms]">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" strokeWidth={1.8} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-destructive">Atenção: Inadimplência Crítica</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {criticos.length} irmão(s) com 3+ meses em atraso, totalizando{" "}
            <strong>{formatCurrency(criticos.reduce((s, i) => s + i.valor, 0))}</strong>.
            Considere notificação formal conforme regimento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
