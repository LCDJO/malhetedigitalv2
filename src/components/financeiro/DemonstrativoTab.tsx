import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  CalendarIcon,
  TableIcon,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface ConsolidadoNode {
  id: string;
  codigo: string;
  nome: string;
  tipo: string;
  total: number;
  children: ConsolidadoNode[];
  depth: number;
}

interface DemonstrativoTabProps {
  periodLabel: string;
  kpis: { receitas: number; despesas: number; resultado: number };
  flatConsolidado: ConsolidadoNode[];
}

type ViewMode = "tabela" | "barras" | "pizza";

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const COLORS_RECEITA = [
  "hsl(142, 71%, 45%)",
  "hsl(142, 60%, 55%)",
  "hsl(142, 50%, 65%)",
  "hsl(160, 60%, 45%)",
  "hsl(160, 50%, 55%)",
  "hsl(120, 40%, 50%)",
];

const COLORS_DESPESA = [
  "hsl(0, 84%, 60%)",
  "hsl(0, 70%, 68%)",
  "hsl(15, 75%, 55%)",
  "hsl(25, 70%, 55%)",
  "hsl(350, 65%, 55%)",
  "hsl(0, 50%, 50%)",
];

export function DemonstrativoTab({ periodLabel, kpis, flatConsolidado }: DemonstrativoTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("tabela");

  // Leaf-level accounts with values, grouped by tipo
  const receitasPorConta = useMemo(() => {
    return flatConsolidado
      .filter((n) => n.tipo === "receita" && n.children.length === 0 && n.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [flatConsolidado]);

  const despesasPorConta = useMemo(() => {
    return flatConsolidado
      .filter((n) => n.tipo === "despesa" && n.children.length === 0 && n.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [flatConsolidado]);

  // Chart data
  const barData = useMemo(() => {
    const items = [...receitasPorConta.map((n) => ({ nome: n.nome, valor: n.total, tipo: "Receita" })),
      ...despesasPorConta.map((n) => ({ nome: n.nome, valor: n.total, tipo: "Despesa" }))];
    return items;
  }, [receitasPorConta, despesasPorConta]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-md border bg-popover p-2 shadow-md text-xs">
        <p className="font-semibold">{d.nome}</p>
        <p className={d.tipo === "Receita" ? "text-success" : "text-destructive"}>{fmt(d.valor)}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold">Resumo Executivo — {periodLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-semibold">{periodLabel}</p>
                <p className="text-xs text-muted-foreground">Período</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-success/5">
              <TrendingUp className="h-5 w-5 text-success shrink-0" />
              <div>
                <p className="text-lg font-bold text-success">{fmt(kpis.receitas)}</p>
                <p className="text-xs text-muted-foreground">Total Receitas</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5">
              <TrendingDown className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="text-lg font-bold text-destructive">{fmt(kpis.despesas)}</p>
                <p className="text-xs text-muted-foreground">Total Despesas</p>
              </div>
            </div>
            <div className={cn("flex items-center gap-3 p-3 rounded-lg", kpis.resultado >= 0 ? "bg-success/5" : "bg-destructive/5")}>
              <Scale className={cn("h-5 w-5 shrink-0", kpis.resultado >= 0 ? "text-success" : "text-destructive")} />
              <div>
                <p className={cn("text-lg font-bold", kpis.resultado >= 0 ? "text-success" : "text-destructive")}>{fmt(kpis.resultado)}</p>
                <p className="text-xs text-muted-foreground">{kpis.resultado >= 0 ? "Superávit" : "Déficit"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View mode toggle */}
      <div className="flex items-center gap-1">
        <Button
          variant={viewMode === "tabela" ? "default" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setViewMode("tabela")}
        >
          <TableIcon className="h-3.5 w-3.5" /> Tabela
        </Button>
        <Button
          variant={viewMode === "barras" ? "default" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setViewMode("barras")}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Barras
        </Button>
        <Button
          variant={viewMode === "pizza" ? "default" : "ghost"}
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => setViewMode("pizza")}
        >
          <PieChartIcon className="h-3.5 w-3.5" /> Pizza
        </Button>
      </div>

      {/* Receitas por Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Receitas por Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {receitasPorConta.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma receita no período.</p>
          ) : viewMode === "tabela" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receitasPorConta.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{n.codigo}</TableCell>
                      <TableCell className="text-sm font-medium">{n.nome}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-success">{fmt(n.total)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {kpis.receitas > 0 ? `${((n.total / kpis.receitas) * 100).toFixed(1)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40">
                    <TableCell />
                    <TableCell className="text-sm font-bold">Total</TableCell>
                    <TableCell className="text-right text-sm font-bold text-success">{fmt(kpis.receitas)}</TableCell>
                    <TableCell className="text-right text-xs font-bold">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : viewMode === "barras" ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receitasPorConta.map((n) => ({ nome: n.nome, valor: n.total, tipo: "Receita" }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {receitasPorConta.map((_, i) => (
                      <Cell key={i} fill={COLORS_RECEITA[i % COLORS_RECEITA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={receitasPorConta.map((n) => ({ name: n.nome, value: n.total }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {receitasPorConta.map((_, i) => (
                      <Cell key={i} fill={COLORS_RECEITA[i % COLORS_RECEITA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Despesas por Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-sans font-semibold flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Despesas por Conta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {despesasPorConta.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma despesa no período.</p>
          ) : viewMode === "tabela" ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {despesasPorConta.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">{n.codigo}</TableCell>
                      <TableCell className="text-sm font-medium">{n.nome}</TableCell>
                      <TableCell className="text-right text-sm font-semibold text-destructive">{fmt(n.total)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {kpis.despesas > 0 ? `${((n.total / kpis.despesas) * 100).toFixed(1)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40">
                    <TableCell />
                    <TableCell className="text-sm font-bold">Total</TableCell>
                    <TableCell className="text-right text-sm font-bold text-destructive">{fmt(kpis.despesas)}</TableCell>
                    <TableCell className="text-right text-xs font-bold">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : viewMode === "barras" ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={despesasPorConta.map((n) => ({ nome: n.nome, valor: n.total, tipo: "Despesa" }))} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis type="number" tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                    {despesasPorConta.map((_, i) => (
                      <Cell key={i} fill={COLORS_DESPESA[i % COLORS_DESPESA.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={despesasPorConta.map((n) => ({ name: n.nome, value: n.total }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {despesasPorConta.map((_, i) => (
                      <Cell key={i} fill={COLORS_DESPESA[i % COLORS_DESPESA.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
