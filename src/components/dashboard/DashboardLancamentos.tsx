import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatCurrency, filterLancamentos, ultimosLancamentos } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardLancamentos({ filters }: Props) {
  const lancsFiltrados = filterLancamentos(ultimosLancamentos, filters);

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Últimos Lançamentos"
        subtitle={`${lancsFiltrados.length} movimentação(ões) encontrada(s)`}
      />

      <Card className="animate-fade-in [animation-delay:650ms]">
        <CardContent className="p-0">
          {lancsFiltrados.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">Nenhum lançamento para os filtros selecionados.</p>
          ) : (
            <div className="divide-y">
              {lancsFiltrados.map((lanc) => (
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
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                      lanc.situacao === "pago" ? "bg-success/10 text-success border-success/20" : "bg-accent/10 text-accent-foreground border-accent/20"
                    }`}>
                      {lanc.situacao === "pago" ? "Pago" : "Em aberto"}
                    </Badge>
                    <span className={`text-sm font-semibold ${
                      lanc.tipo === "entrada" ? "text-success" : "text-destructive"
                    }`}>
                      {lanc.tipo === "entrada" ? "+" : "−"}{formatCurrency(lanc.valor)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
