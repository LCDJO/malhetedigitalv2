import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { ChartTooltip } from "./ChartTooltip";
import { receitaMensal, composicaoReceita, fluxoCaixa, formatCurrency } from "./DashboardData";
import { SectionHeader } from "./SectionHeader";

const axisProps = {
  tick: { fontSize: 11, fill: "hsl(220, 10%, 48%)" },
  axisLine: false,
  tickLine: false,
};

export function DashboardCharts() {
  return (
    <section className="space-y-4">
      <SectionHeader title="Evolução Financeira" subtitle="Últimos 6 meses de movimentação" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Evolução da Receita */}
        <Card className="lg:col-span-2 animate-fade-in [animation-delay:350ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Receita Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={receitaMensal} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220, 55%, 22%)" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="hsl(220, 55%, 22%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                  <XAxis dataKey="mes" {...axisProps} />
                  <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="valor" name="Receita" stroke="hsl(220, 55%, 22%)" strokeWidth={2} fill="url(#receitaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Composição */}
        <Card className="animate-fade-in [animation-delay:400ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-sans font-semibold">Composição da Receita</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={composicaoReceita} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {composicaoReceita.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              {composicaoReceita.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fluxo de Caixa */}
      <Card className="animate-fade-in [animation-delay:450ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-sans font-semibold">Fluxo de Caixa — Entradas vs Saídas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fluxoCaixa} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 88%)" vertical={false} />
                <XAxis dataKey="mes" {...axisProps} />
                <YAxis {...axisProps} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="entrada" name="Entradas" fill="hsl(220, 55%, 22%)" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar dataKey="saida" name="Saídas" fill="hsl(220, 14%, 78%)" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-5 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-sm bg-primary" />Entradas
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/40" />Saídas
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
