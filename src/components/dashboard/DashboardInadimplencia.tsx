import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Users, Banknote } from "lucide-react";
import { formatCurrency, filterInadimplentes, TOTAL_IRMAOS } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import { EmptyState } from "./EmptyState";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardInadimplencia({ filters }: Props) {
  const inadFiltrados = filterInadimplentes(filters);
  const totalInadimplente = inadFiltrados.reduce((s, i) => s + i.valor, 0);
  const taxaAdimplencia = (TOTAL_IRMAOS - inadFiltrados.length) / TOTAL_IRMAOS * 100;
  const top5 = [...inadFiltrados].sort((a, b) => b.valor - a.valor).slice(0, 5);

  return (
    <section className="space-y-4">
      <SectionHeader title="Indicadores de Inadimplência" subtitle="Detalhamento dos irmãos em atraso" />

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-destructive/15 bg-destructive/[0.03]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Users className="h-5 w-5 text-destructive" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Irmãos Inadimplentes</p>
              <p className="text-xl font-serif font-bold text-destructive">{inadFiltrados.length}</p>
              <p className="text-[10px] text-muted-foreground">de {TOTAL_IRMAOS} membros ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/15 bg-destructive/[0.03]">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Banknote className="h-5 w-5 text-destructive" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Valor Total em Atraso</p>
              <p className="text-xl font-serif font-bold text-destructive">{formatCurrency(totalInadimplente)}</p>
              <p className="text-[10px] text-muted-foreground">{inadFiltrados.reduce((s, i) => s + i.lancamentosAtraso, 0)} lançamentos pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col justify-center gap-3 p-4 h-full">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Taxa de Adimplência</p>
              <span className="text-lg font-serif font-bold text-foreground">{taxaAdimplencia.toFixed(1)}%</span>
            </div>
            <Progress value={taxaAdimplencia} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0%</span>
              <span>Meta: 95%</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 inadimplentes */}
      <Card className="border-destructive/15">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" strokeWidth={1.8} />
            <CardTitle className="text-sm font-sans font-semibold">Top 5 — Maiores Inadimplentes</CardTitle>
          </div>
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
            {inadFiltrados.length} total
          </Badge>
        </CardHeader>
        <CardContent>
          {top5.length === 0 ? (
            <EmptyState message="Nenhum inadimplente encontrado" submessage="Ajuste os filtros ou verifique o período selecionado." />
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 px-1 pb-2 border-b text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span className="w-7">#</span>
                <span>Nome</span>
                <span className="text-center w-20">Lançamentos</span>
                <span className="text-right w-24">Valor</span>
              </div>

              {top5.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-1 py-3 border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    idx === 0 ? "bg-destructive/15 text-destructive" :
                    idx < 3 ? "bg-destructive/8 text-destructive/80" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {idx + 1}º
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{item.nome}</p>
                    <p className="text-[10px] text-muted-foreground">{item.meses} mês(es) em atraso · {item.categoria}</p>
                  </div>
                  <div className="w-20 text-center">
                    <Badge variant="outline" className="text-[10px] px-2 py-0 bg-destructive/5 text-destructive border-destructive/15">
                      {item.lancamentosAtraso} lanç.
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-destructive w-24 text-right">{formatCurrency(item.valor)}</span>
                </div>
              ))}

              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-1 pt-3 border-t mt-1">
                <span className="w-7" />
                <span className="text-xs font-medium text-muted-foreground">Total dos 5 maiores</span>
                <span className="w-20 text-center text-[10px] text-muted-foreground font-medium">
                  {top5.reduce((s, i) => s + i.lancamentosAtraso, 0)} lanç.
                </span>
                <span className="text-sm font-bold text-destructive w-24 text-right">
                  {formatCurrency(top5.reduce((s, i) => s + i.valor, 0))}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
