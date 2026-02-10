import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, filterInadimplentes, TOTAL_IRMAOS } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardInadimplencia({ filters }: Props) {
  const inadFiltrados = filterInadimplentes(filters);
  const totalInadimplente = inadFiltrados.reduce((s, i) => s + i.valor, 0);
  const taxaAdimplencia = (TOTAL_IRMAOS - inadFiltrados.length) / TOTAL_IRMAOS * 100;

  return (
    <section className="space-y-4">
      <SectionHeader title="Indicadores de Inadimplência" subtitle="Detalhamento dos irmãos em atraso" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="animate-fade-in [animation-delay:500ms]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-sans font-semibold">Taxa de Adimplência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <span className="text-3xl font-serif font-bold text-foreground">{taxaAdimplencia.toFixed(1)}%</span>
              <p className="text-xs text-muted-foreground mt-1">{TOTAL_IRMAOS - inadFiltrados.length} de {TOTAL_IRMAOS} em dia</p>
            </div>
            <Progress value={taxaAdimplencia} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>Meta: 95%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 animate-fade-in [animation-delay:550ms]">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-sans font-semibold">Irmãos Inadimplentes</CardTitle>
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
              {inadFiltrados.length} pendentes
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1">
            {inadFiltrados.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum inadimplente para os filtros selecionados.</p>
            ) : (
              <>
                {inadFiltrados.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2.5 border-b last:border-0">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${item.meses >= 3 ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent-foreground"}`}>
                      {item.meses}m
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{item.meses} mês(es) · {item.categoria}</p>
                    </div>
                    <span className="text-xs font-semibold text-foreground">{formatCurrency(item.valor)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Total em aberto</span>
                    <span className="font-bold text-destructive">{formatCurrency(totalInadimplente)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
