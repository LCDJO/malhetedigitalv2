import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatCurrency, filterLancamentos, ultimosLancamentos } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

const tipoLabels: Record<string, string> = {
  mensalidade: "Mensalidade",
  taxa: "Taxa",
  avulso: "Avulso",
  despesa: "Despesa",
};

export function DashboardLancamentos({ filters }: Props) {
  const [expanded, setExpanded] = useState(false);
  const lancsFiltrados = filterLancamentos(ultimosLancamentos, filters);
  const PAGE_SIZE = 10;
  const visible = expanded ? lancsFiltrados : lancsFiltrados.slice(0, PAGE_SIZE);
  const hasMore = lancsFiltrados.length > PAGE_SIZE;

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Últimos Lançamentos"
        subtitle={`${lancsFiltrados.length} movimentação(ões) encontrada(s)`}
      />

      <Card className="animate-fade-in [animation-delay:650ms]">
        <CardContent className="p-0">
          {lancsFiltrados.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">
              Nenhum lançamento para os filtros selecionados.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wide font-semibold w-[100px]">Data</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide font-semibold">Irmão</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide font-semibold w-[110px]">Tipo</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-right w-[120px]">Valor</TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wide font-semibold text-center w-[100px]">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((lanc) => (
                    <TableRow key={lanc.id} className="group">
                      <TableCell className="text-xs text-muted-foreground py-3">{lanc.data}</TableCell>
                      <TableCell className="py-3">
                        <div>
                          <p className="text-xs font-medium">{lanc.irmao}</p>
                          <p className="text-[10px] text-muted-foreground">{lanc.descricao}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0">
                          {tipoLabels[lanc.categoria] ?? lanc.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <span className={`text-sm font-semibold ${
                          lanc.tipo === "entrada" ? "text-success" : "text-destructive"
                        }`}>
                          {lanc.tipo === "entrada" ? "+" : "−"}{formatCurrency(lanc.valor)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${
                          lanc.situacao === "pago"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}>
                          {lanc.situacao === "pago" ? "Pago" : "Em aberto"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {hasMore && (
                <div className="flex justify-center py-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => setExpanded(!expanded)}
                  >
                    {expanded ? (
                      <>
                        <ChevronUp className="h-3.5 w-3.5" />
                        Mostrar menos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3.5 w-3.5" />
                        Ver mais ({lancsFiltrados.length - PAGE_SIZE} restantes)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
