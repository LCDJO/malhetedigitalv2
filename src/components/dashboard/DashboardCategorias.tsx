import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { formatCurrency, receitaPorCategoria, categoriasDespesa } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

export function DashboardCategorias({ filters }: Props) {
  // Filter receita categories by tipoLancamento
  const categoriasReceita = filters.tipoLancamento === "todos"
    ? receitaPorCategoria
    : receitaPorCategoria.filter((c) => {
        const map: Record<string, string> = { mensalidade: "Mensalidades", taxa: "Taxas", avulso: "Valores Avulsos" };
        return c.categoria === map[filters.tipoLancamento];
      });

  const totalArrecadado = categoriasReceita.reduce((s, c) => s + c.arrecadado, 0);
  const totalAberto = categoriasReceita.reduce((s, c) => s + c.emAberto, 0);

  // Data for donut
  const donutData = categoriasReceita.map((c) => ({
    name: c.categoria,
    value: c.arrecadado + c.emAberto,
    color: c.color,
  }));

  // Data for horizontal bars
  const barData = categoriasReceita.map((c) => ({
    categoria: c.categoria,
    Arrecadado: c.arrecadado,
    "Em Aberto": c.emAberto,
  }));

  const totalDespesas = categoriasDespesa.reduce((s, c) => s + c.valor, 0);

  return (
    <section className="space-y-4">
      <SectionHeader title="Resumo por Categorias" subtitle="Receitas por tipo de lançamento e despesas do período" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut — Composição total */}
        <Card className="animate-fade-in [animation-delay:600ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Composição por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                      {donutData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {categoriasReceita.map((cat) => {
                  const total = cat.arrecadado + cat.emAberto;
                  const pctArrecadado = total > 0 ? (cat.arrecadado / total * 100) : 0;
                  return (
                    <div key={cat.categoria} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.categoria}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-5">
                        <span>Arrecadado: <strong className="text-foreground">{formatCurrency(cat.arrecadado)}</strong></span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pl-5">
                        <span>Em aberto: <strong className="text-destructive">{formatCurrency(cat.emAberto)}</strong></span>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t pt-2 mt-1 space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total arrecadado</span>
                    <span className="font-bold">{formatCurrency(totalArrecadado)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total em aberto</span>
                    <span className="font-bold text-destructive">{formatCurrency(totalAberto)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barras horizontais — Arrecadado vs Em Aberto */}
        <Card className="animate-fade-in [animation-delay:650ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Arrecadado vs Em Aberto por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(220, 10%, 48%)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    type="category"
                    dataKey="categoria"
                    tick={{ fontSize: 11, fill: "hsl(220, 10%, 48%)" }}
                    axisLine={false}
                    tickLine={false}
                    width={100}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Arrecadado" name="Arrecadado" fill="hsl(152, 55%, 38%)" radius={[0, 3, 3, 0]} barSize={16} />
                  <Bar dataKey="Em Aberto" name="Em Aberto" fill="hsl(0, 65%, 48%)" radius={[0, 3, 3, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-5 mt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(152, 55%, 38%)" }} />
                Arrecadado
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: "hsl(0, 65%, 48%)" }} />
                Em Aberto
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Despesas */}
      <Card className="animate-fade-in [animation-delay:700ms]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-sans font-semibold">
            Despesas por Categoria — Total: {formatCurrency(totalDespesas)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoriasDespesa.map((cat) => (
              <div key={cat.nome} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{cat.nome}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{cat.percentual}%</span>
                    <span className="font-semibold w-20 text-right">{formatCurrency(cat.valor)}</span>
                  </div>
                </div>
                <Progress value={cat.percentual} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
