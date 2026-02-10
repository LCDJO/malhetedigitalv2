import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { receitaMensal, pagosVsAberto, composicaoReceita, formatCurrency } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";
import type { DashboardFilters } from "./DashboardFilterTypes";

interface Props {
  filters: DashboardFilters;
}

const axisProps = {
  tick: { fontSize: 11, fill: "hsl(220, 10%, 48%)" },
  axisLine: false,
  tickLine: false,
};

function sliceByPeriod<T>(data: T[], periodo: string): T[] {
  if (periodo === "mes_atual") return data.slice(-1);
  if (periodo === "ultimo_trimestre") return data.slice(-3);
  return data;
}

const renderLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex items-center justify-center gap-5 mt-3">
      {payload?.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DashboardCharts({ filters }: Props) {
  const lineData = sliceByPeriod(receitaMensal, filters.periodo);
  const barData = sliceByPeriod(pagosVsAberto, filters.periodo);

  const subtitleMap: Record<string, string> = {
    mes_atual: "Mês atual",
    ultimo_trimestre: "Último trimestre",
    personalizado: "Período personalizado",
  };

  return (
    <section className="space-y-5">
      <SectionHeader title="Evolução Financeira" subtitle={subtitleMap[filters.periodo] ?? "Todos os períodos"} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gráfico de Linha — Evolução da Arrecadação */}
        <Card className="animate-fade-in [animation-delay:350ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Evolução da Arrecadação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                  <XAxis dataKey="mes" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={renderLegend} />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    name="Arrecadação"
                    stroke="hsl(220, 55%, 22%)"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "hsl(220, 55%, 22%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }}
                    activeDot={{ r: 6, fill: "hsl(220, 55%, 22%)", strokeWidth: 2, stroke: "hsl(0, 0%, 100%)" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras — Pagos vs Em Aberto */}
        <Card className="animate-fade-in [animation-delay:400ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Valores Pagos vs Em Aberto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                  <XAxis dataKey="mes" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={renderLegend} />
                  <Bar dataKey="pago" name="Pagos" fill="hsl(152, 55%, 38%)" radius={[3, 3, 0, 0]} barSize={22} />
                  <Bar dataKey="em_aberto" name="Em Aberto" fill="hsl(0, 65%, 48%)" radius={[3, 3, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Composição da Receita */}
      <Card className="animate-fade-in [animation-delay:450ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans font-semibold">Composição da Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composicaoReceita} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {composicaoReceita.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3">
              {composicaoReceita.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-1 flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(composicaoReceita.reduce((s, i) => s + i.value, 0))}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
