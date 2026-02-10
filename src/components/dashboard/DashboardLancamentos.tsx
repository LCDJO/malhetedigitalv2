import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, ultimosLancamentos } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";

export function DashboardLancamentos() {
  return (
    <section className="space-y-4">
      <SectionHeader title="Últimos Lançamentos" subtitle="Movimentações financeiras recentes" />

      <Card className="animate-fade-in [animation-delay:650ms]">
        <CardContent className="p-0">
          <div className="divide-y">
            {ultimosLancamentos.map((lanc) => (
              <div key={lanc.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  lanc.tipo === "entrada"
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}>
                  {lanc.tipo === "entrada"
                    ? <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />
                    : <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{lanc.descricao}</p>
                  <p className="text-[10px] text-muted-foreground">{lanc.irmao} · {lanc.data}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-sm font-semibold ${
                    lanc.tipo === "entrada" ? "text-success" : "text-destructive"
                  }`}>
                    {lanc.tipo === "entrada" ? "+" : "−"}{formatCurrency(lanc.valor)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
